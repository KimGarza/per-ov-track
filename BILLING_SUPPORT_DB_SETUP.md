# Subscription, support, and private database setup

## Implemented

- `react-native-purchases` installed with the committed npm lockfile.
- Subscription / Billing loads the current RevenueCat offering and localized store prices; supports purchase, restore, manage, and refresh. Purchase cancellation does not show an error.
- Cognito `sub` is the RevenueCat App User ID. The SDK configures once, switches identities for another account, and logs out at app sign-out. Billing operations are serialized.
- Web, Expo Go, and builds without public SDK keys show an unavailable message without initializing native billing.
- Authenticated `GET /billing/status` derives the account from the verified Cognito claim and fetches current entitlement information directly from RevenueCat. Provider failures return 503. The client cannot submit an entitlement or another user's ID. Purchasing stays disabled until backend verification is available.
- Production rejects sandbox subscriptions. Status accounts for expiry, grace periods, cancellation with paid time remaining, and refunds. No webhook or stored entitlement projection is needed for this live-read implementation. Future protected backend features must perform their own server check; this change does not put existing cycle/journal features behind a paywall.
- Expo config plugin sets Android MainActivity `launchMode=singleTop` so a bank verification app can return to a purchase. No generated native directories are committed.

## Kim's setup (Android first)

1. **Google Play Console → Crimson Rhythm (`app.crimsonrhythm`) → Monetize → Products → Subscriptions.** Create `crimson_monthly` with a monthly auto-renewing base plan at $3, and `crimson_annual` with an annual auto-renewing base plan at $25. Activate the base plans and finish Play's required merchant/account setup. RevenueCat must match the exact product and base-plan IDs you use.
2. **RevenueCat → Create project → Apps & providers → Google Play.** Add package `app.crimsonrhythm`. Connect your Google Play service-account credentials following RevenueCat's dashboard guide and verify the connection.
3. **RevenueCat → Product catalog.** Import the two Play subscriptions, create entitlement **`premium`**, and attach both products. Create a current/default offering with a **Monthly** package and an **Annual** package. Ensure the offering is marked current. Configure restore/transfer behavior deliberately: keep purchases with the original App User ID if you do not want restoring on a different Crimson Rhythm account to transfer access.
4. **RevenueCat → Project settings → API keys → App specific keys.** Copy the public Google SDK key. **Expo dashboard → project → Environment variables**: add `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` in the environment used by the build (`development` for the current internal-testing profile). For iOS, later connect App Store Connect, create matching subscriptions, and set `EXPO_PUBLIC_REVENUECAT_IOS_KEY` to the separate Apple public key. Never put a secret key in an `EXPO_PUBLIC_*` variable.
5. **RevenueCat → API keys → secret API key supporting v1 subscriber reads.** Store it in **AWS Secrets Manager (us-east-1)** as JSON `{"apiKey":"YOUR_REVENUECAT_SECRET_KEY"}`. In the target environment's `infra/overrides/<env>/lambda.json`, add `RevenueCatSecretArn` under `Parameters` with the ARN of that secret. Existing files may be empty: use `{"Parameters":{"RevenueCatSecretArn":"YOUR_SECRET_ARN"}}`. The CloudFormation update grants Lambda read access to only that secret and sets `REVENUECAT_SECRET_ARN`. Deploy the infrastructure/API changes. The private Lambda needs HTTPS egress to `api.revenuecat.com` as well as Secrets Manager access. With a customer-managed KMS key, grant the Lambda role decrypt permission separately.
6. **Build and install a new native app.** This cannot be delivered by an OTA update alone. For a Play internal test: `npm run build:beta`, then `npm run submit:android:beta`. These scripts build/submit both platforms or Android as named; to build Android only use `npx eas-cli@latest build --platform android --profile store-development`. Add yourself to Play's internal testers and license testers, then install from the Play testing link with the tester's Google account. Builds/submissions are not automatically started by this PR.
7. **Test before production.** Sign into Crimson Rhythm, open Subscription / Billing, confirm both localized prices, buy each plan with Play test payment methods, cancel a purchase, restore on the same account, switch app accounts, cancel renewal, test grace/expiry and refund/revocation, and return from store management. Test in dev first; production correctly refuses sandbox access. Check that `GET /billing/status` agrees with RevenueCat for the signed-in Cognito ID. Repeat sandbox testing in TestFlight before iOS launch.

The native SDK and mock-tested purchase flows are implemented, but no live store transaction, store credential setup, AWS secret configuration, or cloud deployment has been performed here. RevenueCat dashboard settings and a new native build are still required. SDK status is a store display; backend verification is authoritative for backend access. Deleting the app/account does not cancel the store subscription.

Official references:
- https://www.revenuecat.com/docs/getting-started/installation/expo
- https://www.revenuecat.com/docs/getting-started/configuring-sdk
- https://www.revenuecat.com/docs/customers/identifying-customers
- https://www.revenuecat.com/docs/api-v1/customers

## Menu behavior

All menu items use the same split layout. Wide screens retain the full menu; phones retain a compact labeled rail beside the selected content. Selecting another item switches content immediately. Selecting the same root item again closes its content. Content X returns to the open menu. Back moves up through nested account pages, then closes content, then closes the menu. The menu X or outside backdrop closes everything. Android's hardware Back uses the same page history. Content scrolls independently, including while the keyboard is shown.

My Account contains separate Privacy & Data and Account options links. Account options contains Change password and Delete account. `/account` redirects into this same menu rather than opening a separate full-screen account experience. Help & Support uses one collapsed topic dropdown with Feedback, Technical issue, Account issue, Billing, and Other. The thank-you state appears after the backend accepts delivery.

## Support delivery

The support form posts to Cognito-protected `POST /support/messages`. The backend saves the request in `support_messages` before calling SES. A success screen is shown only after SES accepts the email.

Before live testing, verify `crimsonrhythm.app` as an SES sending identity in the deployed region and ensure `support@crimsonrhythm.app` is a real receiving inbox/alias. SES sandbox accounts can send only to verified recipients. The private Lambda needs compatible outbound connectivity to SES. A failed send is stored as pending; automatic retry processing is not implemented.

## DBeaver tunnel

The optional CloudFormation template provisions a private EC2 host with no inbound SSH and a database-only security-group rule. It is not automatically deployed. Ensure the private subnet can reach SSM and SSMMessages endpoints (and EC2Messages where applicable), or has suitable outbound connectivity. Configure the Session Manager Plugin and AWS IAM access. After deployment:

```bash
aws ssm start-session --target INSTANCE_ID --document-name AWS-StartPortForwardingSessionToRemoteHost --parameters '{"host":["PRIVATE_RDS_HOST"],"portNumber":["5432"],"localPortNumber":["15432"]}'
```

DBeaver: host `127.0.0.1`, port `15432`, database `crimrhyth_dev`, credentials from AWS Secrets Manager. Configure TLS with the RDS CA and hostname verification appropriate for a tunnel. Terminate the temporary instance/stack when no longer needed.
