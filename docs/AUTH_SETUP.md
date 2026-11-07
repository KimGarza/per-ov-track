# Crimson Rhythm Expo authentication setup (dev)

The Expo auth UI uses Cognito's OAuth authorization-code + PKCE flow. The client ID and domain are public; Google/Apple client secrets stay in AWS Secrets Manager. The user pool and OAuth client must already exist. The app uses the existing native scheme `crimsonrhythm://auth/callback`.

## Required Expo Development environment variables

- `EXPO_PUBLIC_API_URL`: existing dev API Gateway URL
- `EXPO_PUBLIC_COGNITO_DOMAIN`: `crimrhyth-dev-731584304996-login.auth.us-east-1.amazoncognito.com` (verify CloudFormation export)
- `EXPO_PUBLIC_COGNITO_CLIENT_ID`: `crimrhyth-dev-UserPoolClientId` CloudFormation export

Add these in Expo > Environment variables > Development, and in your local ignored `.env.local` for local testing. These are not secrets.

## Google

Google Web OAuth client must authorize Cognito's `https://<cognito-domain>/oauth2/idpresponse`. Ensure Google is enabled in the Cognito app client. OAuth consent screen test users may need access.

## Apple

**Not yet configured in current Cognito CloudFormation.** The Apple sign-in implementation is prepared but its button is hidden; Apple federation must be added to Cognito and the mobile client's supported providers before it can succeed. Apple Services ID and key remain in AWS Secrets Manager; configure the same Cognito HTTPS callback in Apple Developer.

## Email/password

Cognito's managed login handles signup, verification codes, password reset, and email/password entry. Confirm SES verification and Cognito sender settings before testing branded confirmation emails.

## Database

`POST /users/me/sync` uses API Gateway JWT authorizer and the validated Cognito `sub` to upsert the `users` row. This initial dev implementation creates the users table if missing; migrate to versioned SQL migrations before production. Local cycle/journal data is not migrated or deleted.

## Important build checks

The current dev branch already has Expo SDK 57-compatible `expo-auth-session` and `expo-secure-store` in package.json and its lockfile, following the user's local install. This PR does not change dependencies. Verify `npm ci`, `npm run lint`, `npx tsc --noEmit`, and `npm test` before merging. A new EAS build is needed to test native authentication. The Apple sign-in button is intentionally hidden until Cognito Apple federation is deployed and `EXPO_PUBLIC_APPLE_LOGIN_ENABLED=true` is configured.
