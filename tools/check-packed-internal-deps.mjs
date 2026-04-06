#!/usr/bin/env node
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { execSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'
import { satisfies, validRange } from 'semver'

const ROOT_DIR = process.cwd()
const PACKAGES_DIR = join(ROOT_DIR, 'packages')
const INTERNAL_SCOPE = '@tachui/'
const DEP_SECTIONS_TO_CHECK = ['dependencies', 'optionalDependencies', 'peerDependencies']

function run(command) {
  try {
    return execSync(command, {
      cwd: ROOT_DIR,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim()
  } catch (error) {
    const stderr =
      typeof error === 'object' &&
      error !== null &&
      'stderr' in error &&
      typeof error.stderr === 'string'
        ? error.stderr.trim()
        : ''

    if (stderr) {
      console.error(stderr)
    }
    throw error
  }
}

function getPublishablePackages() {
  const packageDirs = readdirSync(PACKAGES_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)

  const packages = []
  for (const packageDir of packageDirs) {
    const packageJsonPath = join(PACKAGES_DIR, packageDir, 'package.json')
    try {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'))
      if (packageJson.private) continue
      packages.push({
        dir: packageDir,
        name: packageJson.name,
        version: packageJson.version,
      })
    } catch {
      // Skip directories that are not publishable packages.
    }
  }

  return packages.sort((a, b) => a.name.localeCompare(b.name))
}

function packPackage(packageName, packageDir, packDestination) {
  const output = execSync(
    `npm pack --json --pack-destination "${packDestination}"`,
    { cwd: packageDir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }
  ).trim()
  const parsed = JSON.parse(output)
  const packResult = Array.isArray(parsed) ? parsed[0] : parsed
  const filename = packResult?.filename
  if (typeof filename !== 'string' || filename.length === 0) {
    throw new Error(`Failed to resolve packed tarball filename for ${packageName}`)
  }
  return join(packDestination, filename)
}

function readManifestFromPackedTarball(tarballPath) {
  const manifestJson = run(`tar -xOf "${tarballPath}" package/package.json`)
  return JSON.parse(manifestJson)
}

/**
 * Peer dependency policy for internal packages:
 * - Exact pins are valid.
 * - Semver ranges are valid only if they include the current expected release version.
 * - Wildcards/latest are accepted as explicit opt-ins.
 *
 * @returns {{ valid: true } | { valid: false, reason: string }}
 * When invalid, `reason` is included verbatim in violation diagnostics emitted by `main()`.
 */
export function isPeerDependencyVersionCompatible(depVersion, expectedVersion) {
  if (depVersion === expectedVersion) {
    return { valid: true }
  }

  if (depVersion === '*' || depVersion === 'latest') {
    return { valid: true }
  }

  if (!validRange(depVersion)) {
    return {
      valid: false,
      reason: `invalid peer semver range "${depVersion}"`,
    }
  }

  if (!satisfies(expectedVersion, depVersion, { includePrerelease: true })) {
    return {
      valid: false,
      reason: `peer range "${depVersion}" does not include expected version "${expectedVersion}"`,
    }
  }

  return { valid: true }
}

export function isStrictInternalDependencyVersionMatch(
  depVersion,
  expectedVersion
) {
  return depVersion === expectedVersion
}

function main() {
  const packages = getPublishablePackages()
  const expectedVersionByName = new Map(packages.map((pkg) => [pkg.name, pkg.version]))
  const packDestination = mkdtempSync(join(tmpdir(), 'tachui-pack-check-'))
  const violations = []

  try {
    for (const pkg of packages) {
      const tarballPath = packPackage(pkg.name, join(PACKAGES_DIR, pkg.dir), packDestination)
      const manifest = readManifestFromPackedTarball(tarballPath)

      for (const section of DEP_SECTIONS_TO_CHECK) {
        const deps = manifest[section]
        if (!deps || typeof deps !== 'object') continue

        for (const [depName, depVersion] of Object.entries(deps)) {
          if (!depName.startsWith(INTERNAL_SCOPE)) continue

          const expectedVersion = expectedVersionByName.get(depName)
          if (!expectedVersion) {
            violations.push(
              `${pkg.name}@${pkg.version} ${section}.${depName}=${String(depVersion)} references an unknown internal package`
            )
            continue
          }

          const isPeerDependency = section === 'peerDependencies'
          const peerValidation = isPeerDependency
            ? isPeerDependencyVersionCompatible(String(depVersion), expectedVersion)
            : null
          const isValid = isPeerDependency
            ? peerValidation.valid
            : isStrictInternalDependencyVersionMatch(
                String(depVersion),
                expectedVersion
              )

          if (!isValid) {
            const reason = peerValidation?.reason
            violations.push(
              `${pkg.name}@${pkg.version} ${section}.${depName}=${String(depVersion)} (expected ${expectedVersion})${
                reason ? ` - ${reason}` : ''
              }`
            )
          }
        }
      }
    }
  } finally {
    rmSync(packDestination, { recursive: true, force: true })
  }

  if (violations.length > 0) {
    console.error('Packed internal dependency validation failed:')
    for (const violation of violations) {
      console.error(`- ${violation}`)
    }
    process.exit(1)
  }

  console.log(`Packed internal dependency validation passed for ${packages.length} packages.`)
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main()
}
