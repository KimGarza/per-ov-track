# Infrastructure preparation — not deployed

Reference: WhoAmI `autoJobPostMVP` uses shared `infra/templates/*.yml`,
`infra/overrides/<environment>/_global.json`, component override files,
and GitHub OIDC with an environment-scoped `AWS_ROLE_ARN`.
This project keeps that folder convention with dev, stage, and prod.

## Pipelines

- `.github/workflows/tests.yml`: installs dependencies, lints, typechecks, and
  runs existing tests on PRs and pushes to dev/stage/prod; also supports manual runs.
- `.github/workflows/deploy-infra.yml`: manual-only placeholder; job is explicitly
  disabled. No AWS authentication or deployment commands exist yet.
- `.github/workflows/build-mobile.yml`: manual-only placeholder; job is explicitly
  disabled. No EAS builds, store uploads, or releases exist yet.

The deployment files are scaffolds, not functional deployment pipelines.
Before enabling them we still need AWS account/role and environment decisions,
completed templates/overrides, Expo project ID, mobile identifiers, signing,
EAS build profiles, store records, and CI credential bootstrapping.
Store distribution tracks and backend environments are separate choices.

## Secrets template

`infra/templates/secrets.yml` declares four retained secrets per environment:

| Path | Intended keys / owner |
| --- | --- |
| `<environment>/per-ov-track/google` | `client_id`, `client_secret`; manual provider credentials |
| `<environment>/per-ov-track/apple` | `client_id`, `team_id`, `key_id`, `private_key`; manual provider credentials |
| `<environment>/per-ov-track/database` | Connection settings and credentials; schema pending RDS decisions |
| `<environment>/per-ov-track/cognito` | Generated `region`, `user_pool_id`, `client_id` |

Google, Apple and database secrets omit SecretString and GenerateSecretString:
these are empty shells with no readable secret version until values are added.
No real credentials or dummy passwords are committed. Retain policies preserve
secrets on stack deletion/replacement; retained secrets may continue to incur costs.
One secret groups related keys; we are not creating one secret per variable.

The Cognito shell is also empty by default. The Cognito template remains an empty
placeholder, so automatic population is PREPARED, not complete. Its future outputs
must export `<prefix>-UserPoolId` and `<prefix>-UserPoolClientId` in the same AWS
account and region. After those exports exist, a future secrets-stack update with
`CognitoExportPrefix=<prefix>` will copy those generated values into the secret.
An intended prefix is `<environment>-per-ov-track-cognito`; no IDs are fabricated.

This two-phase arrangement avoids a circular dependency: Cognito may need Google
and Apple secret references while its generated configuration needs Cognito outputs.
Future deployment order: empty secret shells, provider credential entry, Cognito,
then update secrets with CognitoExportPrefix. The pipeline does not implement this yet.
CloudFormation import dependencies also restrict replacement/deletion of exports.
The Cognito JSON is template-owned; do not manually append configuration to it.

Cognito mobile app clients must not require a client secret. Pool/client IDs are
public configuration, even when centrally stored in Secrets Manager. Future trusted
build tooling can read and embed those public IDs; never grant phones blanket
Secrets Manager access or embed provider private keys/database credentials.
Other nonsecret configuration can be grouped into a configuration secret later,
following the requested central-storage approach; no runtime variables are invented yet.
GitHub-to-AWS OIDC and mobile build credential bootstrapping still need configuration.

## Scope and validation

No AWS resources, accounts, credentials, app store configuration, deployments,
builds or uploads were created. Other infrastructure templates and override JSON
files remain empty until architecture decisions are made. Do not run deployment
against those placeholders. Local validation must skip the intentionally empty files.
