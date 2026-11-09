# Personalized cycle learning — implementation boundary

This PR adds a pure, deterministic `utils/cycleInsights.ts` engine, connects its learned median/period duration to future calendar predictions, scopes local data by Cognito `sub`, and defines migration 002 for tracking states and immutable prediction snapshots.

## Algorithm
- Confirmed, contiguous menstrual days determine period starts.
- Intervals are measured in elapsed days across months/years.
- The latest six plausible 21–45-day intervals form the rolling baseline.
- A median resists outliers; three recent cycles vs three older cycles gives a capped, cautious trend adjustment.
- Period duration uses the median of confirmed contiguous bleeding days.
- Confidence labels and uncertainty windows are informational, **not clinical accuracy claims**.
- No menstrual predictions during pregnancy; estimates never become observations.

## Data protection and release blockers
- Old unscoped AsyncStorage keys are intentionally **not imported** into any signed-in account, preventing another person's local records from being silently assigned to the wrong account. A consent-based legacy migration is needed for existing users.
- This PR does not yet implement cloud hydration, offline reconciliation, deletion propagation, complete symptom insights, pregnancy UI, or the SQL migration runner. Do **not** deploy to real users until those are implemented and tested.
- The backend's existing day sync uploads all known days on every save and does not yet sync deletions; that must be replaced with a per-account dirty queue and reconciliation before shipping.
- Migration 002 is schema only; no new API writes are enabled for prediction snapshots or tracking states until migrations are deployed.
- No AI training and no cross-user data aggregation.
- CI lint, TypeScript, and tests plus device account-switching tests are mandatory before merge. Do not trigger EAS builds from this draft PR.
