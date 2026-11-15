# Local development authentication

Create `.env.local` in the project root:

```dotenv
EXPO_PUBLIC_API_URL=https://YOUR-DEV-API.execute-api.us-east-1.amazonaws.com/dev
EXPO_PUBLIC_COGNITO_DOMAIN=YOUR-DEV-COGNITO-DOMAIN.auth.us-east-1.amazoncognito.com
EXPO_PUBLIC_COGNITO_CLIENT_ID=YOUR-DEV-PUBLIC-APP-CLIENT-ID
```

Do not put database credentials or OAuth client secrets in Expo environment variables. The local app uses API Gateway; Lambda connects privately to RDS.

## Local web (supported)

Run `npx expo start --web --clear --port 8081` and open `http://localhost:8081`.
The development Cognito app client must have `http://localhost:8081/auth/callback` in its **allowed callback URLs**. The infrastructure override in this PR adds that URL on the next dev Cognito deployment. If you use another port, update Cognito to the exact origin and callback path.

## Installed development client (supported)

Run `npx expo start --dev-client --clear`. Its registered Cognito callback is `crimsonrhythm://auth/callback`. It can load fresh Metro JavaScript without another EAS build as long as native dependencies have not changed.

## Expo Go (conditional; not guaranteed)

Run `npx expo start --go --clear`. Expo Go does **not** own the `crimsonrhythm://` custom scheme. The app now computes the current Expo Go callback with `expo-linking` and logs it to Metro as `Cognito OAuth callback URL` when sign-in starts. Cognito must explicitly allow that **exact** `exp://...` callback URL; it can vary with your local IP, port, or tunnel. Some Cognito/OAuth configurations reject Expo Go callback schemes, and Expo Go is not a reliable production OAuth test environment. If Cognito refuses that callback, use the installed development client or local web; adding a local environment variable alone cannot override Cognito's redirect allowlist.

The Cognito client must allow **both** native and web callback URLs, and the token exchange must use the same callback URL as the authorization request. Do not add a client secret to the mobile app.
