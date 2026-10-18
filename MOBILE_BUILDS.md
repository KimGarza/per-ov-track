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
   The committed project is now linked to Expo, and both native identifiers are
   app.crimsonrhythm. Preserve those values; do not create a second project.
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


## Store-based development testing (Google Play + TestFlight)

Use `store-development` to distribute a standalone app to invited testers on
BOTH platforms. It uses EAS environment `development`, builds an Android AAB
and iOS store-signed binary, excludes the development client, and increments
both platform build numbers remotely. Both install and run without Metro.
It reuses app.crimsonrhythm and the existing EAS project; this is a test track
of the same app, not a separate .dev application/store listing. A store track
and a backend environment are different concepts. The tracker still uses local
storage; selecting this profile does not implement cloud sync or deploy AWS.

Commands (after merging/pulling and npm ci):

```sh
npm run build:beta
npm run submit:beta
```

In submission prompts select the matching `store-development` build for each
platform, not the older Android development APK. To submit a specific build:
`npm run submit:android:beta -- --id <ANDROID_BUILD_ID>` or
`npx eas-cli@latest submit --platform ios --profile store-development --id <IOS_BUILD_ID>`.
The existing `submit:ios:beta` still accepts the earlier successful standalone
iOS build; no need to re-upload the same build if it is already in TestFlight.
After first-time setup works, `npm run deploy:beta` builds both and auto-submits
using the matching store-development submission profile. This is an explicit
local command, not an automatic GitHub push trigger.

Android submissions target ONLY `internal` and stay `draft`. They are not
installable from Play until you manually finish/release that internal-test draft
and add testers. TestFlight upload also requires processing and tester assignment.
Nothing here submits a public production release or changes production profiles.

### Google Play setup

1. Sign into https://play.google.com/console and create the Crimson Rhythm app.
   Use the existing package app.crimsonrhythm. Complete developer account checks
   and whatever setup tasks Play Console requires for your internal test.
2. Build the Android AAB with the command above. The previous dev APK cannot be
   uploaded to Play. Keep using the existing EAS Android keystore; do not replace
   it casually. Enroll in Play App Signing when prompted during the first upload.
3. For the simplest first upload, download the AAB from EAS, then go to
   Test and release > Testing > Internal testing > Create new release and upload
   it manually. Save the draft. This manual route does not require a service key.
4. To allow EAS to upload subsequent builds, create a Google Cloud service account
   (for example crimson-rhythm-play-submit) and enable Google Play Android
   Developer API in that Cloud project. Create/download a JSON key outside git.
   This is separate from your Google-login OAuth credentials.
5. In Play Console > Users and permissions, invite the SERVICE ACCOUNT EMAIL,
   grant access to this app and the permissions for viewing app information,
   releasing to testing tracks and managing testing tracks/tester lists. Follow
   Expo's service-account guide if Google changes those permission labels.
6. In https://expo.dev > your project > Credentials > Android > app.crimsonrhythm,
   add the JSON key under Google service account key for EAS Submit. Alternative:
   `npx eas-cli@latest credentials --platform android`, choose store-development,
   and configure Google Service Account > Play Store Submissions.
   No key path, key contents or invented service-account ID is committed.
7. Run `npm run submit:android:beta` for a NEW AAB/versionCode after the manual
   first upload (do not upload the exact same version code twice). EAS can also
   handle the first upload when the service key/app setup is ready; manual upload
   is an alternative, not a universal API requirement.
8. In Internal testing, complete the draft release and start the INTERNAL rollout,
   not a production rollout. On Testers, add your Google account/testers, save,
   and share the opt-in link. Testers open it signed into an allowed account,
   opt in and install through Play. New test apps are not found by public search.

### Apple TestFlight setup

1. At https://appstoreconnect.apple.com, create/open the app record using the
   registered bundle ID app.crimsonrhythm and the existing Apple team. Accept
   required agreements. Do not create a different bundle ID for this profile.
2. For interactive upload, run the iOS submission command and let EAS prompt for
   the correct app and submission authentication. For reusable API credentials:
   `npx eas-cli@latest credentials --platform ios`, select store-development,
   then App Store Connect > Manage your API Key > Set up your project to use an
   API Key for EAS Submit. Use a user/team authorized for this app. Keep .p8 keys
   out of git; EAS can store submission credentials.
3. After upload, wait for Apple processing, open the app's TestFlight tab and
   finish compliance/test information if requested. Internal tester groups are
   for App Store Connect team users with app access. Add the processed build to
   a group and invite them. Testers install Apple's TestFlight app and accept.
4. For testers outside your App Store Connect team, use an external tester group,
   supply beta review details and submit to TestFlight Beta App Review if required.
   Do not grant friends admin access just to bypass external tester review.
   This is beta review, not public App Store publication.
5. No registered iPhone or Mac is needed to build/upload through EAS. Testing the
   installed iOS app still requires someone with a compatible Apple device.

Do not select public production rollout/App Store release while setting up tests.
No upload, credential creation, paid build or store rollout was run by this change.

References:
- https://docs.expo.dev/submit/android/
- https://expo.fyi/creating-google-service-account
- https://docs.expo.dev/submit/ios/
- https://support.google.com/googleplay/android-developer/answer/9845334
- https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview/
