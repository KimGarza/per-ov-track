# Cycle tracking feature: implementation status

- Adds a one-time optional onboarding modal after authenticated launch; records last period start, last ovulation and pregnancy intentions. 'I'm not sure' skips dates.
- Removes sample menstrual/ovulation markers and sample phases. Real historical user-entered days remain full-color. Future predictions are faded and calculated with a 28-day default and five-day period length. They are not proof of ovulation, fertility, or pregnancy.
- Adds SQL migration `server/api/migrations/001_cycle_tracking.sql` and authenticated `/cycle/profile` and `/cycle/days` endpoints, using Cognito identity for RDS user scoping.
- Local data is saved before attempted cloud upload. This initial integration does NOT yet hydrate data from RDS on a second device, reconcile offline edits, or partition legacy local AsyncStorage by signed-in account. Do not ship to real users until those privacy and sync gaps are resolved.
- The SQL migration is not automatically applied by CloudFormation; it must be deployed by a versioned migration runner after `users` exists. API endpoints will return 503 until schema exists.
- Because this PR changes `src`, `components`, and `server/api`, merging into dev would trigger EAS builds and backend deployment. Do not merge until lint, TypeScript, tests, schema deployment, auth, and privacy/sync checks pass.
