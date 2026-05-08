# Infrastructure

This folder contains Terraform infrastructure code for the project.

## Structure

- `eks/` - Terraform code for AWS VPC and EKS cluster
- `eks/backend/` - Terraform code to create the S3 bucket and DynamoDB table used for remote state locking

## Important

Terraform generated files are intentionally not included:

- `.terraform/`
- `terraform.tfstate`
- `terraform.tfstate.backup`
- `*.tfvars`

These files are local/account-specific and should not be committed to GitHub.
