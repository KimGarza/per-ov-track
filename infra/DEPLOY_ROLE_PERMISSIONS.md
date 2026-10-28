# Crimson Rhythm deployment-role permission review

Target IAM role: `github-crimson-rhythm-deploy-role` in AWS account `731584304996`, region `us-east-1`.

**This file is a review checklist, not an IAM policy attachment.** The current IAM role's attached and inline policies are not stored in this repository, so existing grants cannot be safely compared or preserved from GitHub alone. Do not replace an existing policy with this document.

## Proven missing grant

- `ses:CreateConfigurationSet` for SES configuration set `crimrhyth-dev-email`. CloudFormation reported this exact AccessDenied error.

## Additional grants to compare against the existing role (only add if missing)

- SES: `ses:CreateEmailIdentity`, `ses:GetEmailIdentity`, `ses:DeleteEmailIdentity`; `ses:CreateConfigurationSet`, `ses:DescribeConfigurationSet`, `ses:DeleteConfigurationSet`. Scope to the Crimson Rhythm SES identity/configuration set in us-east-1. CloudFormation may require tag/list operations when creating or updating.
- S3 artifact bucket: `s3:CreateBucket`, `s3:GetBucketLocation`, `s3:PutBucketPublicAccessBlock`, `s3:PutEncryptionConfiguration`, `s3:PutBucketVersioning`, `s3:ListBucket` on `crimrhyth-dev-731584304996-artifacts`; `s3:PutObject` and `s3:GetObject` on its `lambda/*` objects. Review CloudFormation update/delete permissions as needed.
- EC2 Secrets Manager VPC endpoint: `ec2:CreateVpcEndpoint`, `ec2:DescribeVpcEndpoints`, `ec2:ModifyVpcEndpoint`, `ec2:DeleteVpcEndpoints`; security-group create/describe/ingress/egress/delete actions for endpoint SG. Restrict to the expected VPC and region where supported by AWS condition keys.
- Lambda stack: `lambda:CreateFunction`, `lambda:GetFunction`, `lambda:UpdateFunctionCode`, `lambda:UpdateFunctionConfiguration`, `lambda:DeleteFunction`, `lambda:AddPermission`, `lambda:RemovePermission` on `crimrhyth-dev-api-handler`.
- Lambda execution role: `iam:CreateRole`, `iam:GetRole`, `iam:AttachRolePolicy`, `iam:PutRolePolicy`, `iam:DeleteRolePolicy`, `iam:DetachRolePolicy`, `iam:DeleteRole` on `crimrhyth-dev-lambda-role`, plus `iam:PassRole` constrained to `lambda.amazonaws.com`. CloudFormation can require tag operations for managed IAM resources.
- API Gateway HTTP API: `apigateway:POST`, `apigateway:GET`, `apigateway:PATCH`, `apigateway:DELETE` scoped to the Crimson Rhythm API Gateway v2 resources and associated routes, stages, integrations, and authorizer.
- CloudFormation: existing deployment role already deploys other stacks; check existing stack create/update/describe/change-set permissions cover the new `crimrhyth-dev-artifacts`, `crimrhyth-dev-secrets-endpoint`, `crimrhyth-dev-lambda`, `crimrhyth-dev-routing`, and `crimrhyth-dev-ses` stacks.

## Before changing AWS IAM

1. Inspect the role's existing attached/inline policies. Add only the missing actions; do not replace existing grants.
2. Where resource-level constraints are unsupported by an AWS action, use the narrowest supported conditions (region, VPC, tags, role names) rather than assuming an ARN restriction works.
3. Keep AWS OIDC trust relationship unchanged.
4. The SES stack failed and may be in `ROLLBACK_COMPLETE`. Remove only that failed stack after confirming its resources, then retry.
5. This PR does **not** change AWS IAM. Applying grants requires an authorized AWS IAM administrator or a separately authorized deployment mechanism.
