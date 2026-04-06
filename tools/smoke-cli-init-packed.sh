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
cd "$ROOT_DIR"
bun run --filter @tachui/types build
bun run --filter @tachui/registry build
bun run --filter @tachui/core build
bun run --filter @tachui/modifiers build
bun run --filter @tachui/primitives build
bun run --filter @tachui/devtools build
bun run --filter @tachui/cli build

echo "[smoke-cli-init-packed] packing required packages"
cd "$ROOT_DIR/packages/types" && bun pm pack --destination "$PACK_DIR" --quiet >/dev/null
cd "$ROOT_DIR/packages/registry" && bun pm pack --destination "$PACK_DIR" --quiet >/dev/null
cd "$ROOT_DIR/packages/core" && bun pm pack --destination "$PACK_DIR" --quiet >/dev/null
cd "$ROOT_DIR/packages/modifiers" && bun pm pack --destination "$PACK_DIR" --quiet >/dev/null
cd "$ROOT_DIR/packages/primitives" && bun pm pack --destination "$PACK_DIR" --quiet >/dev/null
cd "$ROOT_DIR/packages/devtools" && bun pm pack --destination "$PACK_DIR" --quiet >/dev/null
cd "$ROOT_DIR/packages/cli" && bun pm pack --destination "$PACK_DIR" --quiet >/dev/null

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

echo "[smoke-cli-init-packed] forcing generated app to use local packed @tachui/* tarballs when present"
CORE_TGZ="$CORE_TGZ" \
REGISTRY_TGZ="$REGISTRY_TGZ" \
TYPES_TGZ="$TYPES_TGZ" \
MODIFIERS_TGZ="$MODIFIERS_TGZ" \
PRIMITIVES_TGZ="$PRIMITIVES_TGZ" \
DEVTOOLS_TGZ="$DEVTOOLS_TGZ" \
node <<'NODE'
const fs = require('node:fs')

const packageJsonPath = 'package.json'
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))

const replacements = {
  '@tachui/core': process.env.CORE_TGZ,
  '@tachui/registry': process.env.REGISTRY_TGZ,
  '@tachui/types': process.env.TYPES_TGZ,
  '@tachui/modifiers': process.env.MODIFIERS_TGZ,
  '@tachui/primitives': process.env.PRIMITIVES_TGZ,
  '@tachui/devtools': process.env.DEVTOOLS_TGZ,
}

if (!packageJson.dependencies || typeof packageJson.dependencies !== 'object') {
  packageJson.dependencies = {}
}

// Ensure core transitive runtime deps resolve from local tarballs in isolated CI/network environments.
for (const forcedDependency of ['@tachui/core', '@tachui/registry', '@tachui/types']) {
  const tgzPath = replacements[forcedDependency]
  if (tgzPath) {
    packageJson.dependencies[forcedDependency] = `file:${tgzPath}`
  }
}

for (const section of ['dependencies', 'devDependencies']) {
  const deps = packageJson[section]
  if (!deps || typeof deps !== 'object') continue

  for (const [name, tgzPath] of Object.entries(replacements)) {
    if (deps[name] && tgzPath) {
      deps[name] = `file:${tgzPath}`
    }
  }
}

fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`)
NODE

echo "[smoke-cli-init-packed] installing generated project dependencies"
npm install

if [[ -z "${CORE_VERSION:-}" ]]; then
  echo "[smoke-cli-init-packed] CORE_VERSION is not set"
  exit 1
fi

echo "[smoke-cli-init-packed] verifying a single @tachui/core runtime version is installed"
EXPECTED_CORE_VERSION="$CORE_VERSION" node <<'NODE'
const { execSync } = require('node:child_process')

function collectCoreVersions(tree, versions) {
  if (!tree || typeof tree !== 'object') return
  const deps = tree.dependencies
  if (!deps || typeof deps !== 'object') return

  for (const [name, dep] of Object.entries(deps)) {
    if (name === '@tachui/core' && dep && typeof dep === 'object' && typeof dep.version === 'string') {
      versions.add(dep.version)
    }
    collectCoreVersions(dep, versions)
  }
}

const expectedVersion = process.env.EXPECTED_CORE_VERSION
const lsOutput = execSync('npm ls @tachui/core --all --json', { encoding: 'utf8' })
const tree = JSON.parse(lsOutput)
const versions = new Set()
collectCoreVersions(tree, versions)

if (versions.size !== 1 || !versions.has(expectedVersion)) {
  console.error(
    `[smoke-cli-init-packed] expected exactly one @tachui/core version (${expectedVersion}), found: ${Array.from(versions).join(', ')}`
  )
  process.exit(1)
}
NODE

echo "[smoke-cli-init-packed] verifying built-in frame modifier registration"
node --input-type=module <<'NODE'
import '@tachui/modifiers'
import { hasModifier } from '@tachui/registry'

if (!hasModifier('frame')) {
  console.error("[smoke-cli-init-packed] expected 'frame' to be registered in the global modifier registry")
  process.exit(1)
}
NODE

echo "[smoke-cli-init-packed] building generated project"
npm run build

echo "[smoke-cli-init-packed] success"
