import boto3
import os
from botocore.exceptions import NoCredentialsError

S3_BUCKET = os.getenv("S3_BUCKET")
S3_REGION = os.getenv("S3_REGION", "us-east-1")

s3_client = boto3.client('s3', region_name=S3_REGION)

def list_s3_files(bucket):
    try:
        response = s3_client.list_objects_v2(Bucket=bucket)
        return [obj['Key'] for obj in response.get('Contents', [])]
    except Exception as e:
        print(f"Error: {e}")
        return []
