#!/usr/bin/env node

/**
 * Setup Type Check Configuration
 *
 * This script sets up proper TypeScript type checking for packages in the monorepo.
 * It creates a separate tsconfig file for type checking that doesn't use project references
 * to avoid the TS6310 error when using --noEmit flag.
 */

import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const TEMPLATE_PATH = join(__dirname, 'tsconfig-type-check-template.json')

function setupTypeCheck(packagePath) {
  const template = JSON.parse(readFileSync(TEMPLATE_PATH, 'utf8'))

  // Create the type-check specific tsconfig
  const typeCheckPath = join(packagePath, 'tsconfig.type-check.json')

  writeFileSync(typeCheckPath, JSON.stringify(template, null, 2))

  // Update package.json type-check script
  const packageJsonPath = join(packagePath, 'package.json')
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'))

  if (packageJson.scripts && packageJson.scripts['type-check']) {
    packageJson.scripts['type-check'] = 'tsc --project tsconfig.type-check.json'

    // Also fix 'valid' script if it contains 'tsc --noEmit'
    if (
      packageJson.scripts['valid'] &&
      packageJson.scripts['valid'].includes('tsc --noEmit')
    ) {
      packageJson.scripts['valid'] = packageJson.scripts['valid'].replace(
        'tsc --noEmit',
        'tsc --project tsconfig.type-check.json'
      )
      console.log(`✅ Updated 'valid' script to use tsconfig.type-check.json`)
    }

    writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n')

    console.log(`✅ Updated type-check configuration for ${packageJson.name}`)
  }
}

// If run directly, setup for current directory
if (import.meta.url === `file://${process.argv[1]}`) {
  const targetPath = process.argv[2] || process.cwd()
  setupTypeCheck(targetPath)
}

export { setupTypeCheck }
