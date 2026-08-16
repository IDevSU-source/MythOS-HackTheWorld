# MythOS: Hack the World — Google Play Release Checklist

## Release identity

The first release candidate is configured as **MythOS: Hack the World** version **1.0.1** with Android package identifier `com.idevsu.mythos`. The production profile generates an Android App Bundle (`.aab`) for Google Play, while the preview profile generates an installable APK for direct testing.

## Build the Android App Bundle

Install Node.js 20+ and pnpm, clone the repository, then run the following commands from the project directory.

```bash
pnpm install
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android --profile production
```

When prompted by EAS, allow it to create and securely retain a new Android keystore. **Download and back up the generated keystore information**. The same signing key must be used for every future Google Play update under `com.idevsu.mythos`.

For a direct phone test before Play submission, use:

```bash
eas build --platform android --profile preview
```

## Play Console preparation

Create the app in Google Play Console using the exact application name and package identifier above. Upload the `.aab` to an **Internal testing** track first. Complete content rating, target audience, app access, and store-listing forms before creating a production release.

> The client implementation stores reading progress locally and does not require an account. Reconfirm the final built binary’s permissions and data behavior in Play Console before completing the Data safety declaration, particularly if any future service integrations are added.

## Suggested store materials

Use the bundled MythOS icon as the app icon. Capture at least five phone screenshots: the Root Access–locked onboarding screen, source roadmap, a complete chapter with infographic, visual archive, and Root Access gate in the profile. The listing should clearly identify MythOS as an educational reader and avoid presenting spiritual or wellness content as medical treatment.

## Source attribution

The app bundles material from `c4chaos-io/trillions-per-second`. Retain source-path attribution in the reader and confirm the upstream license and attribution terms before public distribution.
