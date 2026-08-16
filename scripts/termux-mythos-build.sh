#!/data/data/com.termux/files/usr/bin/bash
# MythOS Android build bootstrap for Termux + proot-distro.
# Default: cloud-built, locally signed APK. Set MYTHOS_PROFILE=production for a Play AAB.
set -Eeuo pipefail

REPOSITORY="https://github.com/IDevSU-source/MythOS-HackTheWorld.git"
DISTRO="ubuntu"
PROFILE="${MYTHOS_PROFILE:-preview}"
TERMUX_HOME="${HOME}"
PAYLOAD="${TERMUX_HOME}/.mythos-proot-build.sh"

if [ "${PREFIX:-}" = "" ] || [ ! -x "${PREFIX}/bin/pkg" ]; then
  echo "ERROR: Run this from the official Termux app, not from a regular Android shell."
  exit 1
fi

case "${PROFILE}" in
  preview|production) ;;
  *) echo "ERROR: MYTHOS_PROFILE must be preview (APK) or production (AAB)."; exit 1 ;;
esac

echo "==> Installing the Termux bootstrap dependencies..."
pkg update -y
pkg install -y proot-distro curl git openssl

if [ ! -d "${PREFIX}/var/lib/proot-distro/installed-rootfs/${DISTRO}" ]; then
  echo "==> Installing the Ubuntu proot image (first run only)..."
  proot-distro install "${DISTRO}"
fi

cat > "${PAYLOAD}" <<'PROOT_PAYLOAD'
#!/usr/bin/env bash
set -Eeuo pipefail

REPOSITORY="https://github.com/IDevSU-source/MythOS-HackTheWorld.git"
PROFILE="${1:-preview}"
WORKSPACE="${HOME}/mythos-build"
APP_DIR="${WORKSPACE}/MythOS-HackTheWorld"
SECRETS_DIR="${WORKSPACE}/signing"
KEYSTORE="${SECRETS_DIR}/mythos-upload.jks"
PASSWORD_FILE="${SECRETS_DIR}/keystore-password.txt"
TERMUX_BACKUP_DIR="/termux-home/MythOS-signing-backup"
ALIAS="mythos_upload"

export DEBIAN_FRONTEND=noninteractive
echo "==> Updating the proot build environment..."
apt-get update
apt-get install -y ca-certificates curl git openjdk-17-jdk openssl python3 unzip

if ! command -v node >/dev/null 2>&1 || [ "$(node -p 'process.versions.node.split(".")[0]')" -lt 20 ]; then
  echo "==> Installing Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

corepack enable
corepack prepare pnpm@9.12.0 --activate

mkdir -p "${WORKSPACE}"
if [ -d "${APP_DIR}/.git" ]; then
  echo "==> Refreshing the MythOS source..."
  git -C "${APP_DIR}" fetch origin main
  git -C "${APP_DIR}" checkout main
  git -C "${APP_DIR}" reset --hard origin/main
else
  echo "==> Cloning the MythOS source..."
  git clone "${REPOSITORY}" "${APP_DIR}"
fi

cd "${APP_DIR}"
echo "==> Installing JavaScript dependencies..."
pnpm install --no-frozen-lockfile

mkdir -p "${SECRETS_DIR}"
chmod 700 "${SECRETS_DIR}"
if [ ! -f "${KEYSTORE}" ]; then
  echo "==> Creating a new local Android upload key..."
  PASSWORD="$(openssl rand -hex 32)"
  printf '%s' "${PASSWORD}" > "${PASSWORD_FILE}"
  chmod 600 "${PASSWORD_FILE}"
  keytool -genkeypair -v \
    -keystore "${KEYSTORE}" \
    -storepass "${PASSWORD}" \
    -keypass "${PASSWORD}" \
    -alias "${ALIAS}" \
    -keyalg RSA -keysize 4096 -validity 10000 \
    -dname "CN=MythOS Upload, OU=Independent, O=MythOS, L=Local, ST=Local, C=US"
  chmod 600 "${KEYSTORE}"
  mkdir -p "${TERMUX_BACKUP_DIR}"
  cp "${KEYSTORE}" "${PASSWORD_FILE}" "${TERMUX_BACKUP_DIR}/"
  chmod 700 "${TERMUX_BACKUP_DIR}"
  chmod 600 "${TERMUX_BACKUP_DIR}"/*
  echo "IMPORTANT: A backup of your signing files was created at ${TERMUX_BACKUP_DIR}."
  echo "Copy that folder to secure storage before publishing. Never commit it to GitHub."
else
  PASSWORD="$(cat "${PASSWORD_FILE}")"
fi

umask 077
cat > credentials.json <<EOF
{
  "android": {
    "keystore": {
      "keystorePath": "${KEYSTORE}",
      "keystorePassword": "${PASSWORD}",
      "keyAlias": "${ALIAS}",
      "keyPassword": "${PASSWORD}"
    }
  }
}
EOF

echo "==> Checking Expo authentication..."
if ! npx --yes eas-cli@latest whoami >/dev/null 2>&1; then
  echo "==> Expo login is required once in this proot environment. Complete the browser/device login prompt."
  npx --yes eas-cli@latest login
fi

if ! grep -q "projectId" app.config.ts; then
  echo "==> Creating or linking this source checkout to your Expo project..."
  if ! npx --yes eas-cli@latest init --non-interactive; then
    echo "==> EAS needs one interactive project-selection step. Follow its prompt, then rerun this same script."
    npx --yes eas-cli@latest init
  fi
fi

echo "==> Starting ${PROFILE} build with the local MythOS signing key..."
if [ "${PROFILE}" = "preview" ]; then
  echo "==> Output: installable APK for phone testing."
else
  echo "==> Output: Android App Bundle (AAB) for Google Play."
fi
npx --yes eas-cli@latest build --platform android --profile "${PROFILE}"

echo "==> Build request submitted. Open the URL printed above to download the artifact when it finishes."
echo "==> Keep ${TERMUX_BACKUP_DIR} backed up; it is required for every future update."
PROOT_PAYLOAD

chmod 700 "${PAYLOAD}"
echo "==> Starting ${PROFILE} workflow inside Ubuntu proot..."
proot-distro login --shared-tmp --bind "${TERMUX_HOME}:/termux-home" "${DISTRO}" -- bash "/termux-home/.mythos-proot-build.sh" "${PROFILE}"
