#!/usr/bin/env node
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { execSync } from 'node:child_process'

const ROOT_DIR = process.cwd()
const PACKAGES_DIR = join(ROOT_DIR, 'packages')
const INTERNAL_SCOPE = '@tachui/'
const SECTIONS = ['dependencies', 'optionalDependencies', 'peerDependencies']
const EXACT_VERSION_RE = /^\d+\.\d+\.\d+(?:[-+].+)?$/

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
      const manifest = JSON.parse(readFileSync(packageJsonPath, 'utf8'))
      if (manifest.private) continue
      packages.push({
        dir: packageDir,
        name: manifest.name,
        version: manifest.version,
      })
    } catch {
      // Ignore non-package directories.
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
  return filename
}

function readManifestFromPackedTarball(tarballPath) {
  const manifestJson = run(`tar -xOf "${tarballPath}" package/package.json`)
  return JSON.parse(manifestJson)
}

function ensurePublished(packageName, version, cache) {
  const key = `${packageName}@${version}`
  if (cache.has(key)) return
  run(`npm view ${key} version --json`)
  cache.add(key)
}

function main() {
  const packages = getPublishablePackages()
  const expectedVersionByName = new Map(
    packages.map((pkg) => [pkg.name, pkg.version])
  )
  const packDestination = mkdtempSync(join(tmpdir(), 'tachui-published-deps-'))
  const violations = []
  const publishedCheckCache = new Set()

  try {
    for (const pkg of packages) {
      const tarballPath = packPackage(pkg.name, join(PACKAGES_DIR, pkg.dir), packDestination)
      const manifest = readManifestFromPackedTarball(tarballPath)

      for (const section of SECTIONS) {
        const deps = manifest[section]
        if (!deps || typeof deps !== 'object') continue

        for (const [depName, depVersionRaw] of Object.entries(deps)) {
          if (!depName.startsWith(INTERNAL_SCOPE)) continue

          const depVersion = String(depVersionRaw)
          const isExactVersion = EXACT_VERSION_RE.test(depVersion)

          if (!isExactVersion && section !== 'peerDependencies') {
            violations.push(
              `${manifest.name}@${manifest.version} ${section}.${depName}=${depVersion} must resolve to an exact internal version`
            )
            continue
          }

          if (!isExactVersion) {
            // Peer dependency ranges are allowed; exact versions are checked below.
            continue
          }

          const expectedVersion = expectedVersionByName.get(depName)
          if (expectedVersion && depVersion === expectedVersion) {
            // Same-version internal references are allowed even when this is the
            // first release of that version (co-published in one release run).
            continue
          }

          try {
            ensurePublished(depName, depVersion, publishedCheckCache)
          } catch {
            violations.push(
              `${manifest.name}@${manifest.version} ${section}.${depName}=${depVersion} is not published on npm`
            )
          }
        }
      }
    }
  } finally {
    rmSync(packDestination, { recursive: true, force: true })
  }

  if (violations.length > 0) {
    console.error('Published internal dependency validation failed:')
    for (const violation of violations) {
      console.error(`- ${violation}`)
    }
    process.exit(1)
  }

  console.log(
    `Published internal dependency validation passed for ${packages.length} packages.`
  )
}

main()
