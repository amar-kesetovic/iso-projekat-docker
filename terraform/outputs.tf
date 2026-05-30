output "alb_dns_name" {
  description = "The DNS name of the load balancer"
  value       = aws_lb.main.dns_name
}

output "s3_bucket_name" {
  description = "The name of the S3 bucket"
  value       = aws_s3_bucket.assets.id
}

output "rds_endpoint" {
  description = "The connection endpoint for RDS"
  value       = aws_db_instance.postgres.endpoint
}
