# Android development + iOS TestFlight

`eas.json` now contains `development-all` (also aliased as `development`).

| Platform | Build | Install / run |
| --- | --- | --- |
| Android | Internal development APK with expo-dev-client | Install APK; connect to Metro |
| iOS | Store-signed standalone app, no development client | Submit to TestFlight; bundled JS, no Metro |

Both use EAS environment `development`. This selects build-time configuration;
it does not provision AWS or connect the current local-only tracker to a backend.
No OTA channel is configured because expo-updates is not installed/configured.
`production` is separate and uses EAS environment `production` and store builds.
Neither profile builds or submits automatically on a GitHub push.

## Before retrying

1. Pull this branch/merge, preserving your local `app.json` values if EAS already
   wrote `owner`, `extra.eas.projectId`, `ios.bundleIdentifier`, or `android.package`.
   These account-specific values are NOT in the current GitHub source. Do not
   replace existing app identifiers or create a second Expo project accidentally.
2. Use Node 22.13+ (the EAS profiles pin Node 22.23.3) and run `npm ci --include=dev`.
   Commit package.json and package-lock.json together after future installs.
   Do not bypass frozen installs with legacy-peer-deps or disable EAS lock checks.
3. Run `npx eas-cli@latest login` and `npx eas-cli@latest project:info`.
   If unlinked, run `npx eas-cli@latest init` and select your EXISTING Expo project.
   Commit the real project linkage it writes to app.json.
4. Check app.json has your actual iOS bundleIdentifier and Android package.
   Reuse values already registered with Apple/Google. If not created yet, choose
   your permanent unique IDs and register them; no IDs are invented by this PR.
5. Confirm your paid Apple Developer membership, App Store Connect app record,
   bundle ID, Apple team access, and agreements. TestFlight needs store signing,
   NOT ad hoc signing or device UDID registration. EAS can manage signing keys.

## Validate, build, submit

```sh
npx eas-cli@latest config --platform android --profile development-all
npx eas-cli@latest config --platform ios --profile development-all
npm run build:dev
```

The build command requests both platforms. Actual execution can queue according
to your EAS plan/concurrency; it does not guarantee both start at the same moment.
Allow EAS to configure Android signing and Apple's App Store distribution signing.
If asked to register an iPhone, stop and verify development-all is the selected
profile and iOS distribution resolves to store (not internal).

After the builds finish:

- Android: download/install the APK from EAS, then `npm run start:dev-client`.
- iOS: `npm run submit:ios:beta`, selecting the successful iOS development-all build.
  Alternatively use an explicit build ID with `--id <IOS_BUILD_ID>`.
  Set up App Store Connect credentials when prompted; no fabricated ascAppId is
  committed. Complete TestFlight processing/compliance and invite testers there.

Submitting the binary to App Store Connect does not publicly release the app.
You do not need to own an iPhone to build/upload, but someone with a compatible
Apple device must test the installed iOS build; a successful build is not iOS QA.
No paid builds, signing operations, submissions or public releases were run here.

## Reported install failure

Both provided screenshots show npm ci rejecting the lockfile with
`Missing: typescript@5.9.3 from lock file`. This was reproduced from the merged
dev tree using Node 22.23.3 and npm 10.9.9, matching the EAS profile's Node line.
The locally installed eas-cli pulled in @expo/require-utils 55.x, whose TypeScript
peer supports only v5, alongside the app's TypeScript 6. npm 10 rejected the
missing nested v5 peer; an install under the other local runtime had passed.

Remove eas-cli from app devDependencies and regenerate the lockfile. The existing
build/submit scripts already use `npx eas-cli@latest`, so the CLI does not need to
be installed in the app's dependency tree. Keep the app's TypeScript and SDK
versions. CI now pins the same Node version as EAS and reports Node/npm versions.
No legacy-peer-deps, forced audit fixes, or disabled frozen-lockfile checks are used.

After merging and pulling, run `npm ci`, then `npm run build:dev`. The cloud
build still needs to run successfully; local installation is not a native build.
