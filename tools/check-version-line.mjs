#!/usr/bin/env node
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT_DIR = process.cwd()
const PACKAGES_DIR = join(ROOT_DIR, 'packages')

function parseMajorMinor(version) {
  const match = /^(\d+)\.(\d+)\.\d+(?:[-+].+)?$/.exec(version)
  if (!match) return null
  return `${match[1]}.${match[2]}`
}

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
      })
    } catch {
      // Ignore non-package directories.
    }
  }

  return packages.sort((a, b) => a.name.localeCompare(b.name))
}

function main() {
  const publishable = getPublishablePackages()
  const byLine = new Map()
  const invalidVersions = []

  for (const pkg of publishable) {
    const line = parseMajorMinor(pkg.version)
    if (!line) {
      invalidVersions.push(`${pkg.name}@${pkg.version}`)
      continue
    }
    const set = byLine.get(line) ?? new Set()
    set.add(`${pkg.name}@${pkg.version}`)
    byLine.set(line, set)
  }

  if (invalidVersions.length > 0) {
    console.error('Invalid semver versions detected:')
    for (const item of invalidVersions) {
      console.error(`- ${item}`)
    }
    process.exit(1)
  }

  if (byLine.size > 1) {
    console.error('Release line divergence detected across publishable packages.')
    for (const [line, members] of byLine) {
      console.error(`- ${line}.x`)
      for (const member of members) {
        console.error(`  - ${member}`)
      }
    }
    process.exit(1)
  }

  const [[line]] = [...byLine]
  console.log(
    `Version-line check passed for ${publishable.length} publishable packages on ${line}.x.`
  )
}

main()
