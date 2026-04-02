#!/usr/bin/env node
import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'

const REPO_ROOT = path.resolve(import.meta.dirname, '..')
const PACKAGES_DIR = path.join(REPO_ROOT, 'packages')

function getPublishablePackages() {
  const packageDirs = readdirSync(PACKAGES_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)

  const publishable = []

  for (const packageDir of packageDirs) {
    const packageJsonPath = path.join(PACKAGES_DIR, packageDir, 'package.json')

    try {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'))
      if (packageJson.private === true) continue
      if (typeof packageJson.name !== 'string') continue
      if (!packageJson.name.startsWith('@tachui/')) continue

      publishable.push({
        directory: packageDir,
        name: packageJson.name,
        sideEffects: packageJson.sideEffects,
      })
    } catch {
      continue
    }
  }

  return publishable
}

function isValidSideEffectsValue(sideEffects) {
  if (typeof sideEffects === 'boolean') return true
  if (!Array.isArray(sideEffects)) return false
  return sideEffects.every((value) => typeof value === 'string')
}

const errors = []

for (const pkg of getPublishablePackages()) {
  if (pkg.sideEffects === undefined) {
    errors.push(
      `${pkg.name} (${pkg.directory}) is missing "sideEffects". Set "sideEffects": false or an explicit array of side-effectful files.`
    )
    continue
  }

  if (!isValidSideEffectsValue(pkg.sideEffects)) {
    errors.push(
      `${pkg.name} (${pkg.directory}) has invalid "sideEffects" value. Expected boolean or string[].`
    )
  }
}

if (errors.length > 0) {
  console.error('Explicit sideEffects policy check failed:')
  for (const error of errors) {
    console.error(`- ${error}`)
  }
  process.exit(1)
}

console.log('Explicit sideEffects policy check passed.')
