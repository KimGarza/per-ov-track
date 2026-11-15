# RevenueCat launch checklist (Android first)

Current status: **not accepting payments**. Do not show a working purchase button until the native SDK, store products, and entitlement verification have been tested.

1. Create RevenueCat project and Android app with package ID `app.crimsonrhythm`.
2. Connect Google Play service account to RevenueCat and verify Google Play Billing access.
3. In Play Console create subscription products for monthly ($3) and annual ($25) with appropriate base plans; publish to an internal testing track.
4. In RevenueCat configure `premium` entitlement, offerings and matching Google Play subscription product/base-plan IDs.
5. Set `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` to the **public Android SDK key** (never a secret key).
6. Install the native SDK using `npx expo install react-native-purchases` on a machine with npm access, commit both `package.json` and `package-lock.json`, and create a new development build after EAS quota renews. Expo Go cannot exercise real RevenueCat purchases.
7. Log in to RevenueCat with Cognito `sub` after authentication, log out on account sign-out; restore purchases and show subscription status in Billing.
8. Configure a server-side RevenueCat webhook endpoint with authentication and event idempotency, then verify entitlements server-side before unlocking premium features. Never put RevenueCat secret API keys in the app.
9. Test purchase, renewal, cancellation, grace period, refund/revocation, restore, and account switching using Google Play test accounts.
10. Configure App Store Connect separately before iOS launch.

Refunds are handled through the purchasing store; entitlement revocations must be processed from verified RevenueCat events. Google Play and Apple control eligible introductory/promotional offers. Complimentary access can be granted via RevenueCat's secure server-side promotional entitlement APIs, with an audit trail and expiration date. Never create an in-app administrative override callable from a normal user account.

## Support delivery

The support form posts to the Cognito-protected `POST /support/messages` API. The backend saves the request in `support_messages` before calling SES. A success screen is shown only after SES accepts the email.

**Before testing:** Verify `crimsonrhythm.app` as an SES sending identity in the deployed AWS region; ensure `support@crimsonrhythm.app` is a real receiving inbox or forwarding alias. SES sandbox accounts can only send to verified recipients. The private Lambda also needs network access to SES (NAT or an SES-compatible VPC endpoint). A failed send is stored as `pending` but automatic retry processing is not yet configured.

## DBeaver tunnel

The optional CloudFormation template provisions a private EC2 host with no inbound SSH and a database-only security-group rule. It is **not automatically deployed**. To use Session Manager, ensure the private subnet can reach SSM, SSMMessages, and EC2Messages endpoints, or has suitable outbound connectivity; configure Session Manager Plugin and AWS IAM access. After deploying the template, start a port-forwarding session to the RDS hostname:

```bash
aws ssm start-session --target INSTANCE_ID --document-name AWS-StartPortForwardingSessionToRemoteHost --parameters '{"host":["PRIVATE_RDS_HOST"],"portNumber":["5432"],"localPortNumber":["15432"]}'
```

DBeaver: host `127.0.0.1`, port `15432`, database `crimrhyth_dev`, credentials from AWS Secrets Manager. Configure TLS and verify the RDS CA; avoid disabling certificate verification. Terminate the temporary instance/stack when not needed to avoid ongoing cost.
