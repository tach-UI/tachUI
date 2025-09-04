#!/usr/bin/env node

/**
 * Fix Type Check Configurations for All Packages
 *
 * This script applies the type-check fix to all packages in the monorepo
 * that have type-check scripts and TypeScript project references.
 */

import { readFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'
import { setupTypeCheck } from './setup-type-check.js'

const PACKAGES_DIR = join(process.cwd(), 'packages')

function hasTypeCheckScript(packagePath) {
  try {
    const packageJson = JSON.parse(
      readFileSync(join(packagePath, 'package.json'), 'utf8')
    )
    return packageJson.scripts && packageJson.scripts['type-check']
  } catch (error) {
    return false
  }
}

function hasProjectReferences(packagePath) {
  try {
    const tsconfig = JSON.parse(
      readFileSync(join(packagePath, 'tsconfig.json'), 'utf8')
    )
    return tsconfig.references && tsconfig.references.length > 0
  } catch (error) {
    return false
  }
}

function main() {
  const packages = readdirSync(PACKAGES_DIR)
    .map(name => join(PACKAGES_DIR, name))
    .filter(path => {
      try {
        return (
          statSync(path).isDirectory() &&
          hasTypeCheckScript(path) &&
          hasProjectReferences(path)
        )
      } catch (error) {
        return false
      }
    })

  if (packages.length === 0) {
    console.log('No packages found that need type-check configuration fixes.')
    return
  }

  console.log(
    `Found ${packages.length} packages that need type-check configuration fixes:`
  )
  packages.forEach(pkg => {
    const packageJson = JSON.parse(
      readFileSync(join(pkg, 'package.json'), 'utf8')
    )
    console.log(`  - ${packageJson.name}`)
  })

  console.log('\\nApplying fixes...')

  packages.forEach(packagePath => {
    try {
      setupTypeCheck(packagePath)
    } catch (error) {
      const packageJson = JSON.parse(
        readFileSync(join(packagePath, 'package.json'), 'utf8')
      )
      console.error(`❌ Failed to setup ${packageJson.name}: ${error.message}`)
    }
  })

  console.log(
    `\\n🎉 Type-check configuration fixes applied to ${packages.length} packages.`
  )
  console.log('\\nTest the fixes by running:')
  console.log('  pnpm -r type-check')
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}
