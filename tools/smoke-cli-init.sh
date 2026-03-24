#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
CLI_DIR="$ROOT_DIR/packages/cli"
TMP_DIR="$(mktemp -d)"
PROJECT_DIR="$TMP_DIR/tachui-smoke-app"

cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

echo "[smoke-cli-init] building @tachui/cli"
pnpm --dir "$ROOT_DIR" --filter @tachui/cli build

if [[ -n "${TACHUI_VERSION:-}" ]]; then
  VERSION="$TACHUI_VERSION"
else
  VERSION="$(npm view @tachui/core version --fetch-timeout=5000)"
fi

if [[ -z "${VERSION}" ]]; then
  echo "[smoke-cli-init] failed to resolve @tachui/core version"
  exit 1
fi

echo "[smoke-cli-init] using @tachui/core version: $VERSION"

node "$CLI_DIR/bin/tacho.js" init "$PROJECT_DIR" \
  --template basic \
  --tachui-version "$VERSION" \
  --yes

cd "$PROJECT_DIR"

echo "[smoke-cli-init] installing generated project dependencies"
npm install

echo "[smoke-cli-init] building generated project"
npm run build

echo "[smoke-cli-init] success"
