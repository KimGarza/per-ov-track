# Cycle data, synchronization and migrations

## Identity and privacy
- Cognito JWT `sub` is the account identity. The API resolves it to `users.id`; clients never submit another user's ID.
- Local cycle and onboarding storage keys include the account's Cognito `sub`. Do not import legacy shared keys automatically.
- A username is optional and not used to authorize or locate cycle records.
- The account can work with locally cached data after a successful sign-in, but this is **not yet a complete offline-first sync implementation**.

## Current limitations — release blockers
- `CycleDataProvider` persists locally, then attempts to PUT all known days to the API; failed uploads are not durably queued.
- Cloud GET for cycle days and profile exists, but the provider does not hydrate from it.
- The server currently has no per-entry revision, tombstone or reset generation. An offline device can restore deleted records.
- Do not represent this as reliable multi-device recovery or safe offline deletion until implemented.
- The existing reset endpoint deletes remotely first. If another device holds stale entries, a later upload may recreate them.
- Production needs a revisioned synchronization protocol: client-generated mutation IDs, server revisions, per-account change cursor, per-day tombstones, a reset generation, a persistent dirty queue, idempotent writes, and conflict handling.
- An account reset should increment the server generation and invalidate old-device pending writes; date-scoped deletion should emit tombstones.
- Account switch must await/stop previous account's sync, clear in-memory data and reload only that account's cache.

## Predictions
- `utils/cycleInsights.ts` is the single statistics engine for rolling median, trend, period duration and uncertainty.
- `utils/onboarding.ts` consumes its results to predict future dates. Recorded historical days are never rewritten by predictions.
- Estimated ovulation is not confirmed ovulation. Do not treat these estimates as contraception guidance.
- Pregnancy intent `pregnant` pauses predictions; fuller tracking state transitions still need wiring.

## Automatic SQL migrations
- `.github/workflows/deploy-infra.yml` already maps push branches to an environment matrix: dev→dev, stage→stage, prod→prod.
- This branch packages `server/api/migrations/*.sql` and `migrate.mjs` in the private Lambda artifact.
- After deploying the environment's Lambda and before API routing, the workflow IAM-invokes that Lambda to run migrations against its private RDS.
- The runner uses a PostgreSQL advisory lock, a `schema_migrations` ledger, SHA-256 checksums, and a transaction per file.
- Migration order: `000_users`, `001_cycle_tracking`, `002_cycle_learning`, `003_user_identity`.
- Applied migrations must never be edited. Add a new numbered migration instead.
- Unlike WhoAmI's Prisma/ECS one-off migration task, Crimson Rhythm uses SQL and a VPC-attached Lambda because this project has no ECS app container.
- Migration failure stops deployment before routing. **The Lambda code itself is updated before migrations**; avoid introducing startup code that assumes a new column until migration succeeds.
- This has not been validated against a deployed database. Check existing schema compatibility before merging.

## Verification before merging
- Run ESLint, TypeScript and unit tests.
- Validate migrations on a disposable dev database, including repeat-run and checksum mismatch behavior.
- Test sign-in with two accounts on the same device.
- Test saving offline, reconnecting, deleting on another device, and full/date-scoped resets after the revisioned sync protocol is built.
- Test prediction recomputation after confirmed history changes; ensure older observations remain intact.

## Offline-first sync implementation (PR #59)
- Account-scoped AsyncStorage holds cycle history, a durable pending mutation queue, server revision and reset generation.
- Local edits are saved immediately; a short debounce, foreground interval and app-resume trigger cloud reconciliation.
- `GET /cycle/sync` downloads changes after the stored cursor. `POST /cycle/sync` uses idempotent mutation IDs and optimistic revisions.
- Server tombstones retain deletion metadata but erase sensitive entry contents. Full/partial resets increment generation, invalidating old offline writes.
- An older app's legacy PUT endpoint is rejected after a reset to avoid restoring deleted records.
- The current conflict policy **rejects simultaneous edits to the same day** and preserves the pending local mutation; no automatic field-level merge or conflict-review UI is implemented.
- Account preferences: theme is cached per Cognito subject and synchronized with `/users/me/preferences`. Username is server validated; avatar is stored with the account.
- The optional six-digit app PIN uses native SecureStore and gates the UI on launch/background. **It does not encrypt cycle data in AsyncStorage.** Strong at-rest encryption and secure recovery are future security requirements.
- App PIN is optional and does not replace Cognito authentication.
- Apple sign-in uses a recognizable brand logo image; image retrieval requires connectivity, which sign-in already requires.
- Calendar swiping uses native gesture handling rather than parent touch start/end heuristics.

## Validation required before merge
- GitHub Actions lint, TypeScript, unit tests.
- Test new-account sync, older-account migration, airplane-mode edits, multiple devices, account switching, conflict rejection, and resets on dev RDS.
- Verify migration 004 and 005 against a disposable database. Do not merge if schema migration fails.
- Verify Android/iOS gestures, PIN behavior, and icon loading.
- Server sync pagination currently uses a revision cursor; bulk resets that stamp many rows with one revision need composite pagination before production-scale rollout.
