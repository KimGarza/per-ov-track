# crimrhyth infrastructure

Shared CloudFormation templates use the `env` parameter (dev, stage, prod) and hardcoded `crimrhyth` prefix. Environment overrides live in `infra/overrides/<env>/global.json`, with optional resource-specific JSON. No deployment workflows or AWS changes are included.

Planned order: network, security, secrets, RDS, Cognito base, SES, Lambda, API routing, Cognito finalize, storage, monitoring. Prisma migrations remain a separate workflow.

These templates are scaffolding and require validation and application-specific wiring before deployment.
