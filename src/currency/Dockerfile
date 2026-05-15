# Copyright The OpenTelemetry Authors
# SPDX-License-Identifier: Apache-2.0
# Copyright 2023 The OpenTelemetry Authors
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

FROM alpine:3.21 AS builder

ARG OPENTELEMETRY_CPP_VERSION

RUN apk update && apk upgrade --no-cache && apk add --no-cache \
    git \
    cmake \
    make \
    g++ \
    gcc \
    libc-dev \
    linux-headers \
    grpc-dev \
    protobuf-dev \
    abseil-cpp-dev \
    pkgconf \
    curl \
    bash \
    coreutils

RUN git clone --depth 1 --branch v${OPENTELEMETRY_CPP_VERSION} https://github.com/open-telemetry/opentelemetry-cpp \
    && cd opentelemetry-cpp/ \
    && mkdir build \
    && cd build \
    && cmake .. -DCMAKE_CXX_STANDARD=17 -DCMAKE_POSITION_INDEPENDENT_CODE=ON \
          -DCMAKE_BUILD_TYPE=Release -DBUILD_TESTING=OFF \
          -DWITH_EXAMPLES=OFF -DWITH_OTLP_GRPC=ON -DWITH_ABSEIL=ON \
    && make -j$(nproc || echo 1) install \
    && cd ../..

COPY ./src/currency /currency
COPY ./pb/demo.proto /currency/proto/demo.proto

RUN cd /currency \
    && mkdir -p build \
    && cd build \
    && cmake .. \
    && make -j$(nproc || echo 1) install


FROM alpine:3.21 AS release

RUN apk update && apk upgrade --no-cache && apk add --no-cache \
    grpc-dev \
    protobuf-dev

COPY --from=builder /usr/local /usr/local

EXPOSE ${CURRENCY_PORT}
ENTRYPOINT ["sh", "-c", "./usr/local/bin/currency ${CURRENCY_PORT}"]