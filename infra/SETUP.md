# Infrastructure setup

All templates are under `infra/templates/*.yml`. The dev workflow uses GitHub OIDC and the `AWS_ROLE_ARN` environment variable, then merges `infra/overrides/dev/global.json` and `network.json` with jq for the `crimrhyth-dev-network` stack.

The GitHub OIDC subject includes numeric repository and owner identifiers. AWS IAM role trust must match the subject actually issued by GitHub. Temporary diagnostic logging has been removed.

The network template exports `crimrhyth-<env>-VpcId`, `SubnetAId`, and `SubnetBId` for downstream security/RDS/Lambda stacks. Only the network stack is currently targeted by CI.

Do not assume renaming a CloudFormation template or changing logical IDs is an in-place resource migration. Review existing stacks and dependencies before deploying changed infrastructure.
