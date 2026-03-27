#!/usr/bin/env node
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { execSync } from 'node:child_process'

const ROOT_DIR = process.cwd()
const PACKAGES_DIR = join(ROOT_DIR, 'packages')
const INTERNAL_SCOPE = '@tachui/'
const DEP_SECTIONS_TO_CHECK = ['dependencies', 'optionalDependencies']

function run(command) {
  return execSync(command, {
    cwd: ROOT_DIR,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim()
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

function packPackage(packageName, packDestination) {
  const output = run(`pnpm --filter ${packageName} pack --pack-destination "${packDestination}" --json`)
  const parsed = JSON.parse(output)
  return parsed.filename
}

function readManifestFromPackedTarball(tarballPath) {
  const manifestJson = run(`tar -xOf "${tarballPath}" package/package.json`)
  return JSON.parse(manifestJson)
}

function main() {
  const packages = getPublishablePackages()
  const expectedVersionByName = new Map(packages.map((pkg) => [pkg.name, pkg.version]))
  const packDestination = mkdtempSync(join(tmpdir(), 'tachui-pack-check-'))
  const violations = []

  try {
    for (const pkg of packages) {
      const tarballPath = packPackage(pkg.name, packDestination)
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

          if (depVersion !== expectedVersion) {
            violations.push(
              `${pkg.name}@${pkg.version} ${section}.${depName}=${String(depVersion)} (expected ${expectedVersion})`
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

main()
