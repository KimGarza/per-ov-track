# Crimson Rhythm infrastructure

CloudFormation templates use `.yml` only, shared `env` parameters (dev/stage/prod), and the `crimrhyth` prefix. Per-environment overrides live under `infra/overrides/<env>/global.json` and resource-specific JSON files, with parameters nested under `Parameters`.

The GitHub Actions infrastructure workflow currently deploys the network stack only. Other templates are not automatically deployed. Validate resources, parameter overrides and cross-stack dependencies before enabling other stacks.

The secrets template combines generated database credentials with retained Google, Apple, and Cognito configuration secret shells. Do not commit real secrets.

**Existing stack caution:** the newer network template uses different CloudFormation logical IDs, parameter names and export names than the previous network template. Applying it to an existing stack may replace resources or fail if exports are consumed.
