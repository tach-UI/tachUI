#!/usr/bin/env node

/**
 * Generate modifier declaration files for multiple TachUI packages at once.
 */

import process from 'node:process'
import { resolve } from 'node:path'

import {
  generateModifierArtifacts,
  type GeneratedModifierArtifacts,
} from '../src/modifiers/type-generator'
import {
  hydrateRegistry,
  writeArtifacts,
  relativePath,
} from '../src/build-tools/typegen-runner'

interface CliOptions {
  packages: string[]
  failOnConflict?: boolean
  extraHydrators?: string[]
}

const DEFAULT_PACKAGES = ['core', 'forms', 'navigation', 'grid', 'data']

export async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2))
  await hydrateRegistry({
    debug: process.env.TACHUI_DEBUG_TYPES === 'true',
    extraModules: options.extraHydrators ?? [],
  })

  const artifacts = generateModifierArtifacts()
  const outputs = await emitForPackages(artifacts, options.packages)

  console.log(`✅ Generated modifier declarations for ${outputs.length} packages.`)
  outputs.forEach((output) => {
    console.log(` • ${relativePath(output)}`)
  })

  if (options.failOnConflict && artifacts.snapshot.conflicts.length > 0) {
    console.error(
      `❌ Modifier conflicts detected (${artifacts.snapshot.conflicts.length}).`,
    )
    process.exitCode = 1
  }
}

function parseArgs(argv: string[]): CliOptions {
  const packages = [...DEFAULT_PACKAGES]
  const extras: string[] = []
  let failOnConflict = false

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    switch (arg) {
      case '--packages':
        packages.length = 0
        const list = argv[i + 1]?.split(',') ?? []
        list.forEach((pkg) => {
          const trimmed = pkg.trim()
          if (trimmed) packages.push(trimmed)
        })
        i++
        break
      case '--package':
        packages.length = 0
        packages.push(argv[i + 1])
        i++
        break
      case '--include':
        extras.push(argv[i + 1])
        i++
        break
      case '--fail-on-conflict':
        failOnConflict = true
        break
      default:
        break
    }
  }

  return {
    packages: packages.filter(Boolean),
    failOnConflict,
    extraHydrators: extras,
  }
}

async function emitForPackages(
  artifacts: GeneratedModifierArtifacts,
  packages: string[],
): string[] {
  const outputs: string[] = []

  for (const pkg of packages) {
    const declarationFile = resolve(
      process.cwd(),
      `packages/${pkg}/src/types/generated-modifiers.d.ts`,
    )
    const snapshotFile = resolve(
      process.cwd(),
      `packages/${pkg}/src/types/modifier-metadata.snapshot.json`,
    )

    await writeArtifacts(artifacts, declarationFile, snapshotFile)
    outputs.push(declarationFile)
  }

  return outputs
}

const executedAsScript =
  typeof process.argv[1] === 'string' &&
  process.argv[1].endsWith('generate-types-monorepo.ts')

if (executedAsScript) {
  main().catch((error) => {
    console.error('❌ Failed to generate modifier types for monorepo packages.')
    console.error(error)
    process.exitCode = 1
  })
}
