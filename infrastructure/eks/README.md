# EKS Terraform Infrastructure

## First time setup

Create the remote backend resources first:

```bash
cd infrastructure/eks/backend
terraform init
terraform apply
```

Then create the EKS infrastructure:

```bash
cd ..
terraform init
terraform plan
terraform apply
```

## Notes

- Region is currently set to `us-east-2`.
- Backend bucket is configured in `main.tf`.
- Terraform state files are not included in this repo.
