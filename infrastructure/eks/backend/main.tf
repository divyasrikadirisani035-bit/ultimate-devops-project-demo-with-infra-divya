provider "aws" {
    region = "us-east-2"
  }

  resource "aws_s3_bucket" "example" {
    bucket = "devops-terraform-eks-state-bucket-divya"
    
    lifecycle {
      prevent_destroy = false
    }
  }

  resource "aws_dynamodb_table" "basic-dynamodb-table" {
  name         = "terraform-eks-state-locks"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  

  attribute {
    name = "LockID"
    type = "S"
  }
}
