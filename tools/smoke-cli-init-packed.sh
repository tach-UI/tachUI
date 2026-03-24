#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
TMP_DIR="$(mktemp -d)"
PACK_DIR="$TMP_DIR/packs"
PROJECT_DIR="$TMP_DIR/tachui-packed-smoke-app"

cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

mkdir -p "$PACK_DIR"

echo "[smoke-cli-init-packed] building required packages"
pnpm --dir "$ROOT_DIR" --filter @tachui/types build
pnpm --dir "$ROOT_DIR" --filter @tachui/registry build
pnpm --dir "$ROOT_DIR" --filter @tachui/core build
pnpm --dir "$ROOT_DIR" --filter @tachui/modifiers build
pnpm --dir "$ROOT_DIR" --filter @tachui/primitives build
pnpm --dir "$ROOT_DIR" --filter @tachui/devtools build
pnpm --dir "$ROOT_DIR" --filter @tachui/cli build

echo "[smoke-cli-init-packed] packing required packages"
pnpm --dir "$ROOT_DIR" --filter @tachui/types pack --pack-destination "$PACK_DIR" >/dev/null
pnpm --dir "$ROOT_DIR" --filter @tachui/registry pack --pack-destination "$PACK_DIR" >/dev/null
pnpm --dir "$ROOT_DIR" --filter @tachui/core pack --pack-destination "$PACK_DIR" >/dev/null
pnpm --dir "$ROOT_DIR" --filter @tachui/modifiers pack --pack-destination "$PACK_DIR" >/dev/null
pnpm --dir "$ROOT_DIR" --filter @tachui/primitives pack --pack-destination "$PACK_DIR" >/dev/null
pnpm --dir "$ROOT_DIR" --filter @tachui/devtools pack --pack-destination "$PACK_DIR" >/dev/null
pnpm --dir "$ROOT_DIR" --filter @tachui/cli pack --pack-destination "$PACK_DIR" >/dev/null

TYPES_TGZ="$(ls "$PACK_DIR"/tachui-types-*.tgz | head -n 1)"
REGISTRY_TGZ="$(ls "$PACK_DIR"/tachui-registry-*.tgz | head -n 1)"
CORE_TGZ="$(ls "$PACK_DIR"/tachui-core-*.tgz | head -n 1)"
MODIFIERS_TGZ="$(ls "$PACK_DIR"/tachui-modifiers-*.tgz | head -n 1)"
PRIMITIVES_TGZ="$(ls "$PACK_DIR"/tachui-primitives-*.tgz | head -n 1)"
DEVTOOLS_TGZ="$(ls "$PACK_DIR"/tachui-devtools-*.tgz | head -n 1)"
CLI_TGZ="$(ls "$PACK_DIR"/tachui-cli-*.tgz | head -n 1)"

if [[ -z "${CORE_TGZ:-}" || -z "${MODIFIERS_TGZ:-}" || -z "${PRIMITIVES_TGZ:-}" || -z "${CLI_TGZ:-}" || -z "${DEVTOOLS_TGZ:-}" || -z "${REGISTRY_TGZ:-}" || -z "${TYPES_TGZ:-}" ]]; then
  echo "[smoke-cli-init-packed] failed to locate packed tarballs"
  exit 1
fi

CORE_VERSION="$(node -p "require('$ROOT_DIR/packages/core/package.json').version")"

echo "[smoke-cli-init-packed] scaffolding via packed @tachui/cli tarball"
npm exec --yes \
  --package="$TYPES_TGZ" \
  --package="$REGISTRY_TGZ" \
  --package="$CORE_TGZ" \
  --package="$MODIFIERS_TGZ" \
  --package="$PRIMITIVES_TGZ" \
  --package="$DEVTOOLS_TGZ" \
  --package="$CLI_TGZ" \
  -- tacho init "$PROJECT_DIR" --template basic --yes --tachui-version "$CORE_VERSION"

cd "$PROJECT_DIR"

echo "[smoke-cli-init-packed] forcing generated app to use packed @tachui/core"
npm pkg set dependencies.@tachui/core="file:$CORE_TGZ" >/dev/null
npm pkg set dependencies.@tachui/registry="file:$REGISTRY_TGZ" >/dev/null
npm pkg set dependencies.@tachui/types="file:$TYPES_TGZ" >/dev/null

echo "[smoke-cli-init-packed] installing generated project dependencies"
npm install

echo "[smoke-cli-init-packed] building generated project"
npm run build

echo "[smoke-cli-init-packed] success"
