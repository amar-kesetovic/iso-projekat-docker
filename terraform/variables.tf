variable "aws_access_key" {
  description = "AWS Access Key from Sandbox"
  type        = string
  sensitive   = true
}

variable "aws_secret_key" {
  description = "AWS Secret Key from Sandbox"
  type        = string
  sensitive   = true
}

variable "aws_session_token" {
  description = "AWS Session Token from Sandbox"
  type        = string
  sensitive   = true
}

variable "ami_id" {
  description = "Ubuntu 24.04 AMI ID"
  default     = "ami-05cf1e9f73fbad2e2"
}

variable "aws_region" {
  description = "AWS region"
  default     = "us-east-1"
}

variable "project_name" {
  description = "Name of the project"
  default     = "iso-projekat"
}

variable "db_password" {
  description = "RDS root password"
  type        = string
  default     = "adminpassword123"
}

variable "instance_type" {
  description = "EC2 instance type"
  default     = "t2.micro"
}

variable "repo_url" {
  description = "GitHub repository URL"
  default     = "https://github.com/amar-kesetovic/iso-projekat-docker.git"
}

variable "use_existing_lab_role" {
  description = "Whether to use existing LabRole (for AWS Academy)"
  default     = true
}
