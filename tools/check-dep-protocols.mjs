#!/usr/bin/env node
/**
 * Guard: reject non-publishable dependency protocols in package manifests.
 *
 * `changeset publish` ships the workspace manifests to npm as-is (the installed
 * @changesets/cli performs no workspace-protocol rewriting), so any
 * `workspace:` / `portal:` / `link:` range in a published manifest leaks
 * straight to the registry and makes the package uninstallable outside the
 * monorepo — e.g. @tachui/core@0.8.27 and @tachui/primitives@0.8.28 (#235).
 *
 * This check intentionally reads the repo manifests rather than packed
 * tarballs: `bun pm pack` rewrites `workspace:` ranges to concrete versions,
 * so packed manifests mask exactly the leak this guard exists to catch.
 *
 * Workspace ranges are rewritten to concrete versions at release time by
 * tools/rewrite-workspace-deps.mjs, which runs as part of the version command.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT_DIR = process.cwd()
const PACKAGES_DIR = join(ROOT_DIR, 'packages')
const DEP_SECTIONS = ['dependencies', 'optionalDependencies', 'peerDependencies']
const FORBIDDEN_PROTOCOLS = ['workspace:', 'portal:', 'link:', 'catalog:']

function getPublishablePackages() {
  const entries = readdirSync(PACKAGES_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)

  const packages = []
  for (const entry of entries) {
    const packageJsonPath = join(PACKAGES_DIR, entry, 'package.json')
    try {
      const manifest = JSON.parse(readFileSync(packageJsonPath, 'utf8'))
      if (manifest.private) continue
      packages.push({
        name: manifest.name,
        version: manifest.version,
        path: packageJsonPath,
      })
    } catch {
      // Skip directories that are not publishable packages.
    }
  }

  return packages.sort((a, b) => a.name.localeCompare(b.name))
}

function findProtocolViolations(manifest) {
  const violations = []

  for (const section of DEP_SECTIONS) {
    const deps = manifest[section]
    if (!deps || typeof deps !== 'object') continue

    for (const [depName, depVersion] of Object.entries(deps)) {
      if (typeof depVersion !== 'string') continue
      const protocol = FORBIDDEN_PROTOCOLS.find((p) => depVersion.startsWith(p))
      if (protocol) {
        violations.push(
          `${section}.${depName}=${depVersion} uses the "${protocol}" protocol, which is not resolvable outside this workspace and must not be published`
        )
      }
    }
  }

  return violations
}

function main() {
  const packages = getPublishablePackages()
  const violations = []

  for (const pkg of packages) {
    let manifest
    try {
      manifest = JSON.parse(readFileSync(pkg.path, 'utf8'))
    } catch (error) {
      violations.push(`${pkg.name}: failed to read manifest (${error.message})`)
      continue
    }

    for (const violation of findProtocolViolations(manifest)) {
      violations.push(`${pkg.name}@${pkg.version} ${violation}`)
    }
  }

  if (violations.length > 0) {
    console.error(
      [
        '✗ Publish manifest protocol check failed.',
        '',
        'The following manifests contain protocols that cannot be resolved from',
        'the npm registry. Run the version command (which rewrites workspace:',
        'ranges to concrete versions) or fix the manifests before publishing:',
        '',
        ...violations.map((v) => `  - ${v}`),
      ].join('\n')
    )
    process.exit(1)
  }

  console.log(
    `✓ Publish manifest protocol check passed (${packages.length} publishable packages, no workspace:/portal:/link:/catalog: ranges)`
  )
}

main()
