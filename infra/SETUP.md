# Infrastructure preparation — not deployed

Reference: WhoAmI `autoJobPostMVP` uses shared `infra/templates/*.yml`,
`infra/overrides/<environment>/_global.json`, component override files,
and GitHub OIDC with an environment-scoped `AWS_ROLE_ARN`.
This project keeps that folder convention with dev, stage, and prod.

## Pipelines

- `.github/workflows/tests.yml`: installs dependencies, lints, typechecks, and
  runs existing tests on PRs and pushes to dev/stage/prod; also supports manual runs.
- `.github/workflows/deploy-infra.yml`: dev pushes touching network inputs or the
  workflow deploy ONLY `infra/templates/network.yml` through the GitHub `dev`
  environment using OIDC. No other stack is targeted.
- `.github/workflows/build-mobile.yml`: manual-only placeholder; job is explicitly
  disabled. No EAS builds, store uploads, or releases exist yet.

The networking workflow is enabled for future matching pushes to dev; no workflow
was run during implementation. Mobile deployment remains a disabled scaffold.
AWS OIDC/account setup is still required. Mobile builds still need an Expo project
ID, mobile identifiers, signing, EAS profiles, store records, and CI credentials.
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
builds or uploads were created. The secrets template is prepared separately but is not targeted by the workflow.
Other service templates remain empty. Override JSON files remain empty except
dev/_global.json and dev/network.json. The workflow
never attempts to deploy empty templates or read stage/prod placeholders.
Local validation must skip the intentionally empty files.


## Dev foundational network

Push mapping: `dev` branch -> GitHub environment `dev` ->
`infra/overrides/dev/_global.json` + `network.json` ->
`infra/templates/network.yml` -> `dev-per-ov-track-network`.
Only networking paths trigger infrastructure deployment. Other service changes,
other branches and PRs do not deploy infrastructure. Merging this PR into dev WILL
trigger the network workflow if AWS access is configured; implementation itself
has not run it. Unmerged PR #19/#20 scaffolding is included in this branch.

Global parameters are Environment and AppName. Network overrides contain only
VpcCidr and two subnet CIDRs. Naming uses `<environment>-<app>-<resource>` so
WhoAmI and per-ov-track can coexist in the same account/region. No EnvUrl is needed
for the VPC. No repeated environment names are added to every override file.
Region is the GitHub dev variable AWS_REGION (default us-east-1).
The 10.20.0.0/16 CIDR is an initial proposal, not an inventory of existing AWS
networks; confirm it does not overlap any network you later want to connect.

The template has exactly a VPC and two private subnets in two account-available
AZs. DNS support/hostnames are enabled and auto public IPv4 assignment is off.
AWS creates its default route table, NACL and default security group as part of
creating a VPC; this template does not create custom routing or security groups.
Until explicit route associations are added later, subnets use the default main
route table and have local VPC routing only. There is no public internet route,
IGW, NAT, public subnet, endpoint, ALB, ECR, ECS, IAM role or Lambda custom resource.
API Gateway does not need a public subnet in this VPC.

Future stacks can import these outputs (prefix is dev-per-ov-track):
`-vpc-id`, `-vpc-cidr`, `-private-a-id`, `-private-b-id`.
Next dependency is typically security groups importing the VPC; groups can exist
before Lambda/RDS because their definitions reference the VPC and other groups,
not a running app. The future RDS subnet group can use the two subnet IDs.
No security, routing, database, auth, secret or compute stack is deployed now.
Before VPC-attached Lambda needs Secrets Manager or external APIs, we still must
choose outbound connectivity / VPC endpoints. This isolated base is not a complete
working backend and intentionally does not incur NAT/interface-endpoint provisioning.

### GitHub / AWS setup you provide

1. Create GitHub environment `dev` and restrict its deployment branches to `dev`.
2. Set environment variable AWS_ROLE_ARN to a deployment role in the intended
   AWS account. Optionally set AWS_REGION; default is us-east-1.
3. Configure the AWS GitHub OIDC identity provider and role trust with audience
   `sts.amazonaws.com` and subject
   `repo:KimGarza/per-ov-track:environment:dev`. Do not reuse WhoAmI's trust unchanged.
4. Grant that role CloudFormation stack management and the EC2 VPC/subnet,
   DNS-attribute, describe and tag permissions required by this template.
   No IAM creation capability is requested by this network workflow.

These GitHub bootstrap variables are available before AWS login and cannot depend
on reading AWS Secrets Manager first. Application configuration/secrets can still
use the requested Secrets Manager convention. No long-lived AWS keys are stored.

The workflow validates inputs before assuming the role, validates the template,
then deploys the one named stack. It serializes network runs, reports outputs and
prints stack events on failure. It never automatically deletes a failed stack.
