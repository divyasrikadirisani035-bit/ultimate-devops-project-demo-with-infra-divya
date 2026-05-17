const mockSpan = {
  setAttributes: jest.fn(),
  setAttribute: jest.fn(),
  end: jest.fn(),
};

const mockCounter = {
  add: jest.fn(),
};

const mockGetNumberValue = jest.fn();

jest.mock('@opentelemetry/api', () => ({
  trace: {
    getTracer: jest.fn(() => ({
      startSpan: jest.fn(() => mockSpan),
    })),
  },
  metrics: {
    getMeter: jest.fn(() => ({
      createCounter: jest.fn(() => mockCounter),
    })),
  },
  context: {
    active: jest.fn(() => ({})),
  },
  propagation: {
    getBaggage: jest.fn(() => null),
  },
}));

jest.mock('@openfeature/server-sdk', () => ({
  OpenFeature: {
    setProviderAndWait: jest.fn(() => Promise.resolve()),
    getClient: jest.fn(() => ({
      getNumberValue: mockGetNumberValue,
    })),
  },
}));

jest.mock('@openfeature/flagd-provider', () => ({
  FlagdProvider: jest.fn(),
}));

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-transaction-id'),
}));

jest.mock('simple-card-validator', () =>
  jest.fn((number) => ({
    getCardDetails: () => {
      if (number === '4111111111111111') {
        return { card_type: 'visa', valid: true };
      }

      if (number === '5555555555554444') {
        return { card_type: 'mastercard', valid: true };
      }

      if (number === '378282246310005') {
        return { card_type: 'american-express', valid: true };
      }

      return { card_type: 'unknown', valid: false };
    },
  }))
);

jest.mock('../logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

const { charge } = require('../charge');

function validPaymentRequest(overrides = {}) {
  return {
    creditCard: {
      creditCardNumber: '4111111111111111',
      creditCardExpirationYear: new Date().getFullYear() + 1,
      creditCardExpirationMonth: 12,
      ...overrides.creditCard,
    },
    amount: {
      units: 100,
      nanos: 0,
      currencyCode: 'USD',
      ...overrides.amount,
    },
  };
}

describe('payment charge service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetNumberValue.mockResolvedValue(0);
  });

  test('returns transaction id for valid Visa payment', async () => {
    const result = await charge(validPaymentRequest());

    expect(result).toEqual({
      transactionId: 'test-transaction-id',
    });

    expect(mockCounter.add).toHaveBeenCalledWith(1, {
      'app.payment.currency': 'USD',
    });

    expect(mockSpan.setAttribute).toHaveBeenCalledWith(
      'app.payment.charged',
      true
    );
  });

  test('returns transaction id for valid MasterCard payment', async () => {
    const result = await charge(
      validPaymentRequest({
        creditCard: {
          creditCardNumber: '5555555555554444',
        },
      })
    );

    expect(result.transactionId).toBe('test-transaction-id');
  });

  test('rejects invalid credit card number', async () => {
    await expect(
      charge(
        validPaymentRequest({
          creditCard: {
            creditCardNumber: '123456789',
          },
        })
      )
    ).rejects.toThrow('Credit card info is invalid.');
  });

  test('rejects unsupported card type', async () => {
    await expect(
      charge(
        validPaymentRequest({
          creditCard: {
            creditCardNumber: '378282246310005',
          },
        })
      )
    ).rejects.toThrow('Only VISA or MasterCard is accepted');
  });

  test('rejects expired card', async () => {
    await expect(
      charge(
        validPaymentRequest({
          creditCard: {
            creditCardExpirationYear: 2020,
            creditCardExpirationMonth: 1,
          },
        })
      )
    ).rejects.toThrow('expired');
  });

  test('fails payment when paymentFailure feature flag is enabled', async () => {
    mockGetNumberValue.mockResolvedValue(1);

    const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.5);

    await expect(charge(validPaymentRequest())).rejects.toThrow(
      'Payment request failed'
    );

    randomSpy.mockRestore();
  });
});