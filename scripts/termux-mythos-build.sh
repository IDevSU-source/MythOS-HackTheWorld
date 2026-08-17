#!/data/data/com.termux/files/usr/bin/bash
# MythOS Android build bootstrap for Termux + proot-distro.
# Default: cloud-built, locally signed APK. Set MYTHOS_PROFILE=production for a Play AAB.
set -Eeuo pipefail

REPOSITORY="https://github.com/IDevSU-source/MythOS-HackTheWorld.git"
DISTRO="ubuntu"
PROFILE="${MYTHOS_PROFILE:-preview}"
EXPO_ACCOUNT="${MYTHOS_EXPO_ACCOUNT:-idevsu}"
TERMUX_HOME="${HOME}"
PAYLOAD="${TERMUX_HOME}/.mythos-proot-build.sh"

if [ -z "${PREFIX:-}" ] || [ ! -x "${PREFIX}/bin/pkg" ]; then
  echo "ERROR: Run this from the official Termux app, not from a regular Android shell."
  exit 1
fi

case "${PROFILE}" in
  preview|production) ;;
  *) echo "ERROR: MYTHOS_PROFILE must be preview (APK) or production (AAB)."; exit 1 ;;
esac

echo "==> Checking Termux prerequisites..."
pkg update -y
pkg install -y proot-distro curl git openssl

# Attempting the install is the only reliable cross-version check. A container
# that already exists returns a known nonfatal result; all other failures stop.
echo "==> Ensuring the Ubuntu proot image is available..."
if INSTALL_OUTPUT="$(proot-distro install "${DISTRO}" 2>&1)"; then
  echo "==> Ubuntu proot image installed."
elif printf '%s' "${INSTALL_OUTPUT}" | grep -qiE "container .* already exists|already installed"; then
  echo "==> Reusing the existing Ubuntu proot container."
else
  printf '%s\n' "${INSTALL_OUTPUT}" >&2
  echo "ERROR: Ubuntu proot could not be installed or reused. Check network/storage, then rerun the same command." >&2
  exit 1
fi

cat > "${PAYLOAD}" <<'PROOT_PAYLOAD'
#!/usr/bin/env bash
set -Eeuo pipefail

REPOSITORY="https://github.com/IDevSU-source/MythOS-HackTheWorld.git"
PROFILE="${1:-preview}"
EXPO_ACCOUNT="${2:-idevsu}"
WORKSPACE="${HOME}/mythos-build"
APP_DIR="${WORKSPACE}/MythOS-HackTheWorld"
STATE_DIR="${WORKSPACE}/state"
SECRETS_DIR="${WORKSPACE}/signing"
KEYSTORE="${SECRETS_DIR}/mythos-upload.jks"
PASSWORD_FILE="${SECRETS_DIR}/keystore-password.txt"
PROJECT_ID_FILE="${STATE_DIR}/eas-project-id.txt"
EAS_INIT_LOG="${STATE_DIR}/eas-init.log"
TERMUX_BACKUP_DIR="/termux-home/MythOS-signing-backup"
BACKUP_KEYSTORE="${TERMUX_BACKUP_DIR}/mythos-upload.jks"
BACKUP_PASSWORD_FILE="${TERMUX_BACKUP_DIR}/keystore-password.txt"
ALIAS="mythos_upload"

fatal() {
  echo "ERROR: $*" >&2
  exit 1
}

has_pair() {
  [ -f "$1" ] && [ -f "$2" ]
}

export DEBIAN_FRONTEND=noninteractive
echo "==> Repairing any interrupted package setup..."
dpkg --configure -a || true
apt-get update
apt-get install -y ca-certificates curl git openjdk-17-jdk openssl python3 unzip

if ! command -v node >/dev/null 2>&1 || [ "$(node -p 'process.versions.node.split(".")[0]')" -lt 20 ]; then
  echo "==> Installing Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

if command -v corepack >/dev/null 2>&1; then
  corepack enable
  corepack prepare pnpm@9.12.0 --activate
else
  npm install -g pnpm@9.12.0
fi

mkdir -p "${WORKSPACE}" "${STATE_DIR}" "${SECRETS_DIR}" "${TERMUX_BACKUP_DIR}"
chmod 700 "${SECRETS_DIR}" "${TERMUX_BACKUP_DIR}"

if [ -d "${APP_DIR}/.git" ]; then
  echo "==> Refreshing the MythOS source without touching signing state..."
  git -C "${APP_DIR}" fetch origin main
  git -C "${APP_DIR}" checkout main
  git -C "${APP_DIR}" reset --hard origin/main
else
  echo "==> Cloning the MythOS source..."
  git clone "${REPOSITORY}" "${APP_DIR}"
fi

cd "${APP_DIR}"
echo "==> Installing JavaScript dependencies (safe to rerun)..."
pnpm install --no-frozen-lockfile

# Restore a prior signing key before generating anything new. A partial key state
# is treated as an error so a released app is never accidentally signed with a new key.
if ! has_pair "${KEYSTORE}" "${PASSWORD_FILE}" && has_pair "${BACKUP_KEYSTORE}" "${BACKUP_PASSWORD_FILE}"; then
  echo "==> Restoring the existing signing key from the Termux backup..."
  cp "${BACKUP_KEYSTORE}" "${KEYSTORE}"
  cp "${BACKUP_PASSWORD_FILE}" "${PASSWORD_FILE}"
fi

if [ -f "${KEYSTORE}" ] || [ -f "${PASSWORD_FILE}" ]; then
  has_pair "${KEYSTORE}" "${PASSWORD_FILE}" || fatal "Incomplete signing state. Restore both files in ${TERMUX_BACKUP_DIR}; do not generate a replacement key."
  if has_pair "${BACKUP_KEYSTORE}" "${BACKUP_PASSWORD_FILE}"; then
    cmp -s "${KEYSTORE}" "${BACKUP_KEYSTORE}" || fatal "Workspace and Termux signing keys differ. Keep the existing Play upload key and resolve the mismatch before building."
  else
    echo "==> Creating the missing Termux signing backup..."
    cp "${KEYSTORE}" "${BACKUP_KEYSTORE}"
    cp "${PASSWORD_FILE}" "${BACKUP_PASSWORD_FILE}"
  fi
else
  echo "==> Creating a new local Android upload key..."
  PASSWORD="$(openssl rand -hex 32)"
  printf '%s' "${PASSWORD}" > "${PASSWORD_FILE}"
  keytool -genkeypair -v \
    -keystore "${KEYSTORE}" \
    -storepass "${PASSWORD}" \
    -keypass "${PASSWORD}" \
    -alias "${ALIAS}" \
    -keyalg RSA -keysize 4096 -validity 10000 \
    -dname "CN=MythOS Upload, OU=Independent, O=MythOS, L=Local, ST=Local, C=US"
  cp "${KEYSTORE}" "${BACKUP_KEYSTORE}"
  cp "${PASSWORD_FILE}" "${BACKUP_PASSWORD_FILE}"
  echo "IMPORTANT: Back up ${TERMUX_BACKUP_DIR} to secure storage before publishing. Never commit it to GitHub."
fi
chmod 600 "${KEYSTORE}" "${PASSWORD_FILE}" "${BACKUP_KEYSTORE}" "${BACKUP_PASSWORD_FILE}"
PASSWORD="$(cat "${PASSWORD_FILE}")"

# Keep temporary plaintext EAS credentials only for this build request.
umask 077
trap 'rm -f credentials.json' EXIT
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

# Initialize from the actual MythOS directory so EAS recognizes the Expo project.
# The project ID is captured outside source control and injected into the dynamic
# app config through MYTHOS_EAS_PROJECT_ID for this and all future builds.
if [ -s "${PROJECT_ID_FILE}" ]; then
  export MYTHOS_EAS_PROJECT_ID="$(cat "${PROJECT_ID_FILE}")"
  echo "==> Reusing the saved EAS project link for @${EXPO_ACCOUNT}."
else
  echo "==> Creating or linking the EAS project under @${EXPO_ACCOUNT}..."
  set +e
  npx --yes eas-cli@latest init --account "${EXPO_ACCOUNT}" --force --json --non-interactive 2>&1 | tee "${EAS_INIT_LOG}"
  EAS_INIT_STATUS="${PIPESTATUS[0]}"
  set -e
  PROJECT_ID="$(grep -Eo '[0-9a-fA-F]{8}-[0-9a-fA-F-]{27,}' "${EAS_INIT_LOG}" | tail -n 1 || true)"
  if [ -z "${PROJECT_ID}" ]; then
    git checkout -- app.config.ts 2>/dev/null || true
    fatal "EAS did not return a project ID. The log is saved at ${EAS_INIT_LOG}; rerun the same script without creating a new signing key."
  fi
  printf '%s' "${PROJECT_ID}" > "${PROJECT_ID_FILE}"
  export MYTHOS_EAS_PROJECT_ID="${PROJECT_ID}"
  git checkout -- app.config.ts 2>/dev/null || true
  [ "${EAS_INIT_STATUS}" -eq 0 ] || echo "==> EAS project ID recovered despite its dynamic-config write warning. Continuing safely."
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
proot-distro login --shared-tmp --bind "${TERMUX_HOME}:/termux-home" "${DISTRO}" -- bash "/termux-home/.mythos-proot-build.sh" "${PROFILE}" "${EXPO_ACCOUNT}"
