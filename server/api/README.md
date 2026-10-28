# Crimson Rhythm development API

Runs as AWS Lambda behind an API Gateway JWT authorizer backed by the Cognito user pool/client. All routes require a valid Cognito JWT except GET /health (the gateway authorizer also protects /health).

POST /db-test inserts a random UUID tied to the authenticated Cognito subject. GET /db-test returns the latest ten UUIDs for that same subject. No cycle data is written. This is a development smoke test, not a production API. The Lambda creates its small test table on demand; replace with a migration before production.

The infrastructure workflow packages this folder with its own npm dependencies, downloads the AWS RDS CA bundle, uploads a versioned ZIP to the private S3 artifact bucket, and deploys Lambda. Lambda connects to Secrets Manager through a paid VPC interface endpoint.

After merge, AWS IAM permissions for the GitHub deployment role must include CloudFormation/EC2 endpoint operations, S3 bucket operations, s3:PutObject, and Lambda/IAM stack operations. SES email/domain verification and SES sandbox restrictions are separate. Review AWS costs (RDS, interface endpoints, Lambda, API Gateway) before enabling.
