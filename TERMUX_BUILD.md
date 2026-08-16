# Build MythOS from Termux

This workflow runs from **Termux** and uses an Ubuntu proot only for the Linux/Node/Java environment. The Android artifact itself is built by EAS Build, which is much more reliable on an ARM Android phone than attempting a native Gradle build with the Android SDK binaries.

The script creates an Android upload keystore that belongs to you, writes temporary local EAS credentials, and requests an EAS build using that key. It does **not** use Manus publishing credentials.

## First build: installable APK

Paste this into the official Termux app:

```bash
pkg update -y && pkg install -y curl && curl -fsSL https://raw.githubusercontent.com/IDevSU-source/MythOS-HackTheWorld/main/scripts/termux-mythos-build.sh | bash
```

The first run installs Ubuntu proot, Node, Java, and project dependencies. It will ask you to authenticate to Expo once in that proot environment. The script explicitly creates or links the build under the **idevsu** Expo account; set `MYTHOS_EXPO_ACCOUNT=another-account-name` before the command only if you deliberately want a different owner. The default **preview** profile produces an installable APK.

## Google Play build: AAB

After successfully testing the APK, paste this command instead:

```bash
MYTHOS_PROFILE=production bash <(curl -fsSL https://raw.githubusercontent.com/IDevSU-source/MythOS-HackTheWorld/main/scripts/termux-mythos-build.sh)
```

The production profile produces an Android App Bundle (`.aab`) for the Google Play Console.

## Signing-key backup

After the first run, the script creates `~/MythOS-signing-backup` in Termux and copies the upload keystore plus its password file there. Back up that entire folder to secure storage before uploading anything to Play. Every later update for the same Android package must use the same upload key.

> Do not commit `credentials.json`, the keystore, or the signing folder to GitHub. The repository ignores those files by default.
