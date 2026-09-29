#!/usr/bin/env node

/**
 * Generate modifier type declarations and metadata snapshot.
 *
 * Usage:
 *   pnpm --filter @tachui/core generate-modifier-types
 *   pnpm --filter @tachui/core generate-modifier-types -- --check
 */

import { watch } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'
import { pathToFileURL } from 'node:url'

import {
  generateModifierArtifacts,
  type GeneratedModifierArtifacts,
} from '../src/modifiers/type-generator'
import {
  hydrateRegistry,
  resolveOutputPaths,
  writeArtifacts,
  verifyOutputs,
  relativePath,
} from '../src/build-tools/typegen-runner'
import { writeSignatureTables } from './derive-modifier-signatures'

interface CliOptions {
  check?: boolean
  snapshot?: string
  declaration?: string
  failOnConflict?: boolean
  watch?: boolean
  watchPatterns?: string[]
}

export async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2))

  const extraModules = (process.env.TACHUI_TYPEGEN_HYDRATORS ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)

  // The registrations read their signatures from the derived tables, so the
  // tables come first: the registry hydrated below is built from them.
  const staleTables = await writeSignatureTables({ check: options.check })
  if (staleTables > 0) {
    process.exitCode = 1
  }

  await hydrateRegistry({
    debug: process.env.TACHUI_DEBUG_TYPES === 'true',
    extraModules,
  })

  const artifacts = generateModifierArtifacts()
  const { declarationFile, snapshotFile } = resolveOutputPaths({
    declaration: options.declaration,
    snapshot: options.snapshot,
  })
  const failOnConflict = options.failOnConflict ?? options.check ?? false

  if (options.watch) {
    await runOnce({
      declarationFile,
      snapshotFile,
      failOnConflict,
      reason: 'initial',
      extraModules,
    })

    const patterns = options.watchPatterns ?? DEFAULT_WATCH_PATHS
    const schedule = debounce(async () => {
      try {
        await runOnce({
          declarationFile,
          snapshotFile,
          failOnConflict,
          reason: 'watch',
          extraModules,
        })
      } catch (error) {
        console.error('❌ Modifier type generation failed during watch update.')
        console.error(error)
      }
    }, 250)

    const watchers = patterns.map((pattern) =>
      watch(pattern, { recursive: true }, () => schedule()),
    )

    const shutdown = () => {
      watchers.forEach((w) => w.close())
      process.exit(0)
    }

    process.on('SIGINT', shutdown)
    process.on('SIGTERM', shutdown)

    console.log('👀 Watching for modifier metadata changes...')
    return
  }

  if (options.check) {
    await verifyOutputs(artifacts, declarationFile, snapshotFile)
    if (failOnConflict && artifacts.snapshot.conflicts.length > 0) {
      console.error(
        `❌ Modifier conflicts detected (${artifacts.snapshot.conflicts.length}).`,
      )
      process.exitCode = 1
    }
    return
  }

  await writeArtifacts(artifacts, declarationFile, snapshotFile)
  reportSummary(artifacts, declarationFile, snapshotFile, failOnConflict)
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {}

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    switch (arg) {
      case '--check':
        options.check = true
        break
      case '--snapshot':
        options.snapshot = argv[i + 1]
        i++
        break
      case '--out':
      case '--declaration':
        options.declaration = argv[i + 1]
        i++
        break
      case '--fail-on-conflict':
        options.failOnConflict = true
        break
      case '--watch':
        options.watch = true
        break
      case '--watch-pattern':
      case '--watch-patterns':
        options.watchPatterns = options.watchPatterns ?? []
        options.watchPatterns.push(argv[i + 1])
        i++
        break
      default:
        break
    }
  }

  return options
}

const DEFAULT_WATCH_PATHS = [
  resolve(process.cwd(), 'src'),
  resolve(process.cwd(), '../modifiers/src'),
  resolve(process.cwd(), '../devtools/src'),
  resolve(process.cwd(), '../registry/src'),
]

interface RunOnceOptions {
  declarationFile: string
  snapshotFile: string
  failOnConflict: boolean
  reason: string
  extraModules: string[]
}

async function runOnce(options: RunOnceOptions) {
  const { declarationFile, snapshotFile, failOnConflict, reason, extraModules } = options

  try {
    await writeSignatureTables()
    await hydrateRegistry({
      debug: process.env.TACHUI_DEBUG_TYPES === 'true',
      extraModules,
    })

    const artifacts = generateModifierArtifacts()
    await writeArtifacts(artifacts, declarationFile, snapshotFile)
    reportSummary(artifacts, declarationFile, snapshotFile, failOnConflict, reason)
  } catch (error) {
    console.error(`❌ Failed to generate modifier types during ${reason}.`)
    console.error(error)
    process.exitCode = 1
    throw error
  }
}

function reportSummary(
  artifacts: GeneratedModifierArtifacts,
  declarationFile: string,
  snapshotFile: string,
  failOnConflict: boolean,
  reason = 'manual',
): void {
  console.log(
    `✅ Wrote modifier declarations to ${relativePath(declarationFile)} (${reason})`,
  )
  console.log(`📦 Total modifiers: ${artifacts.snapshot.totalModifiers}`)

  if (artifacts.snapshot.conflicts.length > 0) {
    console.warn('⚠️  Modifier conflicts detected:')
    for (const conflict of artifacts.snapshot.conflicts) {
      const plugins = conflict.entries.map((entry) => entry.plugin).join(', ')
      console.warn(`   • ${conflict.name}: ${plugins}`)
    }
    if (failOnConflict) {
      console.error(
        `❌ Failing due to ${artifacts.snapshot.conflicts.length} modifier conflict(s).`,
      )
      process.exitCode = 1
    }
  }

  console.log(`📝 Metadata snapshot saved to ${relativePath(snapshotFile)}`)
}

export {
  hydrateRegistry,
  resolveOutputPaths,
  verifyOutputs,
  writeArtifacts,
  generateModifierArtifacts,
}

function debounce<T extends (...args: any[]) => void>(fn: T, wait: number): T {
  let timeout: NodeJS.Timeout | null = null
  const debounced = ((...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => {
      timeout = null
      fn(...args)
    }, wait)
  }) as T
  return debounced
}

const executedAsScript =
  typeof process.argv[1] === 'string' &&
  pathToFileURL(process.argv[1]).href === import.meta.url

if (executedAsScript) {
  main().catch((error) => {
    console.error('❌ Failed to generate modifier types.')
    console.error(error)
    process.exitCode = 1
  })
}
