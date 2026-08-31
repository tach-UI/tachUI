#!/usr/bin/env node
/**
 * Rewrite workspace dependency protocols to concrete versions.
 *
 * Runs as part of the release version command (after `changeset version`),
 * so manifests published by `changeset publish` (which does no protocol
 * rewriting — see tools/check-dep-protocols.mjs) contain resolvable
 * version ranges instead of `workspace:` protocols (#235).
 *
 * Policy (matching the packed-deps guard):
 * - dependencies / optionalDependencies: exact current workspace version
 * - peerDependencies: ^current (peers must track a compatible range, so
 *   every workspace range — including `workspace:*`, `workspace:^1.2.0`,
 *   `workspace:~1.2.0` — becomes `^<current>`; pinning a peer to an exact
 *   version would reject consumers on later compatible versions)
 *
 * Idempotent: already-rewritten ranges are left untouched, so the steady
 * state after the first run is a no-op (changesets maintains the concrete
 * ranges on subsequent version bumps).
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT_DIR = process.cwd()
const PACKAGES_DIR = join(ROOT_DIR, 'packages')
const INTERNAL_SCOPE = '@tachui/'
const REWRITE_SECTIONS = ['dependencies', 'optionalDependencies', 'peerDependencies']
const WORKSPACE_PROTOCOL_RE = /^workspace:/

function getWorkspacePackages() {
  const entries = readdirSync(PACKAGES_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)

  const packages = []
  for (const entry of entries) {
    const packageJsonPath = join(PACKAGES_DIR, entry, 'package.json')
    try {
      const manifest = JSON.parse(readFileSync(packageJsonPath, 'utf8'))
      if (!manifest.name) continue
      packages.push({
        name: manifest.name,
        version: manifest.version,
        path: packageJsonPath,
      })
    } catch {
      // Skip directories that are not packages.
    }
  }

  return packages
}

/**
 * Rewrite all internal workspace dependency ranges in a manifest.
 * Mutates `manifest` in place, appends errors to `errors`, and returns the
 * list of human-readable change descriptions (empty when nothing to do).
 */
export function rewriteManifest(manifest, versionByName, errors) {
  const changes = []

  for (const section of REWRITE_SECTIONS) {
    const deps = manifest[section]
    if (!deps || typeof deps !== 'object') continue

    for (const [depName, depVersion] of Object.entries(deps)) {
      if (typeof depVersion !== 'string' || !depName.startsWith(INTERNAL_SCOPE)) {
        continue
      }

      if (!WORKSPACE_PROTOCOL_RE.test(depVersion)) continue

      const targetVersion = versionByName.get(depName)
      if (!targetVersion) {
        errors.push(
          `${manifest.name} ${section}.${depName}="${depVersion}" references an unknown workspace package`
        )
        continue
      }

      const isPeer = section === 'peerDependencies'
      // Peers always track a compatible range (^current) regardless of the
      // requested workspace suffix; runtime deps pin the exact version.
      const nextVersion = isPeer ? `^${targetVersion}` : targetVersion

      deps[depName] = nextVersion
      changes.push(`${section}.${depName}: ${depVersion} -> ${nextVersion}`)
    }
  }

  return changes
}

function main() {
  const packages = getWorkspacePackages()
  const versionByName = new Map(packages.map((pkg) => [pkg.name, pkg.version]))
  const errors = []
  let rewrittenManifests = 0
  let totalChanges = 0

  for (const pkg of packages) {
    if (pkg.path === undefined) continue

    let manifest
    try {
      manifest = JSON.parse(readFileSync(pkg.path, 'utf8'))
    } catch (error) {
      errors.push(`${pkg.name}: failed to read manifest (${error.message})`)
      continue
    }

    const changes = rewriteManifest(manifest, versionByName, errors)
    if (changes.length === 0) continue

    writeFileSync(pkg.path, JSON.stringify(manifest, null, 2) + '\n')
    rewrittenManifests += 1
    totalChanges += changes.length
    console.log(`${pkg.name}:`)
    for (const change of changes) {
      console.log(`  ${change}`)
    }
  }

  if (errors.length > 0) {
    console.error(
      ['✗ Workspace dependency rewrite failed:', ...errors.map((e) => `  - ${e}`)].join('\n')
    )
    process.exit(1)
  }

  if (totalChanges === 0) {
    console.log('✓ No workspace dependency protocols to rewrite')
    return
  }

  console.log(
    `✓ Rewrote ${totalChanges} workspace dependency range(s) across ${rewrittenManifests} manifest(s)`
  )
}

main()
