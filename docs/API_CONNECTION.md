# Crimson Rhythm API connection

The public base URL is the CloudFormation export `crimrhyth-<environment>-ApiUrl` in AWS account 731584304996, region us-east-1. For example, an API Gateway URL looks like `https://<api-id>.execute-api.us-east-1.amazonaws.com/dev`. The URL is public configuration, **not** a secret. One base URL supports many routes, e.g. `/health`, `/db-test`.

## Verify the deployed backend first

In AWS Console > CloudFormation > Exports (N. Virginia), find `crimrhyth-dev-ApiUrl`. Open `<export-value>/health` in a browser. Expected response: `{"status":"ok"}` (HTTP 200). This checks API Gateway and Lambda, not the database.

The GET /health route is intentionally unauthenticated and returns no private data. Other routes remain protected by Cognito JWT.

## Test from Expo

For local Expo development, put `EXPO_PUBLIC_API_URL=<dev export value>` in a local `.env.local` (do not commit it), restart Expo, then open the Expo Router route `/cloud-check`. Tap **Check API connection**.

For EAS remote builds, configure `EXPO_PUBLIC_API_URL` in the matching Expo EAS environment (development / preview / production) using that environment's API Gateway export. Expo inlines this value into the mobile bundle at build time. Setting it only on a GitHub runner is insufficient for a remote EAS build.

The existing EAS workflow still triggers **only on stage and prod pushes**, not dev. No EAS workflow, build, or submission was changed here. Test your API before spending additional build credits.

## Branch mapping

The infrastructure workflow maps dev -> GitHub dev environment, stage -> stage, prod -> prod. AWS_ROLE_ARN must exist in each GitHub environment, and the environment-specific CloudFormation parameter overrides must be prepared before deployment. GitHub Actions jobs do not host the API; CloudFormation creates Lambda and API Gateway. The Lambda artifact packaging/upload happens in the existing infrastructure workflow.

The API client in `src/services/api.ts` uses one base URL and appends paths. This change does not implement Cognito sign-in, store user data in the cloud, or expose database writes publicly.
