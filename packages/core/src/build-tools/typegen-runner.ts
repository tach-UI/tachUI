/**
 * Shared utilities for modifier type generation tooling.
 * These helpers are reused by the CLI script and the Vite plugin.
 */

import { promises as fs } from 'node:fs'
import { dirname, relative, resolve, sep } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import process from 'node:process'

import type { GeneratedModifierArtifacts } from '../modifiers/type-generator'

export interface HydratorCandidate {
  name: string
  relativePath: string
  hooks?: string[]
  optional?: boolean
}

export interface HydrationOptions {
  debug?: boolean
  extraModules?: string[]
}

const MODULE_DIR = dirname(fileURLToPath(import.meta.url))

export const DEFAULT_HYDRATORS: HydratorCandidate[] = [
  {
    name: '@tachui/modifiers',
    relativePath: '../../modifiers/src/index.ts',
    hooks: ['registerModifiers', 'registerModifierMetadata'],
  },
  {
    name: '@tachui/devtools/modifier-metadata',
    relativePath: '../../devtools/src/modifier-metadata.ts',
    hooks: ['registerModifierMetadata'],
    optional: true,
  },
]

export async function hydrateRegistry(
  options: HydrationOptions = {},
): Promise<void> {
  const { debug = false, extraModules = [] } = options

  const candidates: HydratorCandidate[] = [
    ...DEFAULT_HYDRATORS,
    ...extraModules.map<HydratorCandidate>((modulePath) => ({
      name: modulePath,
      relativePath: modulePath,
      hooks: ['registerModifiers', 'registerModifierMetadata'],
      optional: true,
    })),
  ]

  const results: Array<{
    name: string
    status: 'loaded' | 'missing' | 'failed'
    error?: unknown
  }> = []

  for (const candidate of candidates) {
    const isRelative =
      candidate.relativePath.startsWith('.') ||
      candidate.relativePath.startsWith('/')

    const resolvedPath = isRelative
      ? resolve(MODULE_DIR, candidate.relativePath)
      : resolve(process.cwd(), candidate.relativePath)

    // Attempt bare-specifier import first if not a relative path
    if (!isRelative) {
      try {
        const module = await import(candidate.relativePath)
        await invokeHooks(module, candidate.hooks)
        results.push({ name: candidate.name, status: 'loaded' })
        continue
      } catch (error) {
        if (!candidate.optional) {
          results.push({ name: candidate.name, status: 'failed', error })
        }
        continue
      }
    }

    try {
      await fs.access(resolvedPath)
    } catch (accessError) {
      if (!candidate.optional) {
        results.push({ name: candidate.name, status: 'missing', error: accessError })
      }
      continue
    }

    try {
      const moduleUrl = pathToFileURL(resolvedPath).href
      const module = await import(moduleUrl)
      await invokeHooks(module, candidate.hooks)
      results.push({ name: candidate.name, status: 'loaded' })
    } catch (error) {
      results.push({ name: candidate.name, status: 'failed', error })
    }
  }

  if (debug) {
    for (const result of results) {
      if (result.status === 'loaded') {
        console.log(`ℹ️  Hydrated metadata via ${result.name}`)
      } else if (result.status === 'missing' && result.error) {
        console.warn(`⚠️  Unable to locate hydrator ${result.name}:`, result.error)
      } else if (result.status === 'failed' && result.error) {
        console.warn(`⚠️  Hydrator ${result.name} failed:`, result.error)
      }
    }
  }
}

export interface ResolvePathsOptions {
  declaration?: string
  snapshot?: string
}

export function resolveOutputPaths(
  options: ResolvePathsOptions = {},
): { declarationFile: string; snapshotFile: string } {
  const projectRoot = resolve(MODULE_DIR, '..', '..')

  const defaultDeclaration = resolve(
    projectRoot,
    'src/types/generated-modifiers.d.ts',
  )
  const defaultSnapshot = resolve(
    projectRoot,
    'src/types/modifier-metadata.snapshot.json',
  )

  return {
    declarationFile: options.declaration
      ? resolve(options.declaration)
      : defaultDeclaration,
    snapshotFile: options.snapshot
      ? resolve(options.snapshot)
      : defaultSnapshot,
  }
}

export async function verifyOutputs(
  artifacts: GeneratedModifierArtifacts,
  declarationFile: string,
  snapshotFile: string,
): Promise<void> {
  const [existingDeclaration, existingSnapshot] = await Promise.all([
    readIfExists(declarationFile),
    readIfExists(snapshotFile),
  ])

  let failures = 0
  if (existingDeclaration?.trim() !== artifacts.declaration.trim()) {
    console.error(
      `❌ ${relativePath(declarationFile)} is stale. Re-run generate-modifier-types.`,
    )
    failures++
  }

  const expectedSnapshot = JSON.stringify(artifacts.snapshot, null, 2)
  if (existingSnapshot?.trim() !== expectedSnapshot.trim()) {
    console.error(
      `❌ ${relativePath(snapshotFile)} is stale. Re-run generate-modifier-types.`,
    )
    failures++
  }

  if (failures === 0) {
    console.log('✅ Modifier type declarations are up to date.')
  } else {
    process.exitCode = 1
  }
}

export async function writeArtifacts(
  artifacts: GeneratedModifierArtifacts,
  declarationFile: string,
  snapshotFile: string,
): Promise<void> {
  await ensureDirectory(dirname(declarationFile))
  await ensureDirectory(dirname(snapshotFile))

  await fs.writeFile(declarationFile, artifacts.declaration, 'utf8')
  await fs.writeFile(
    snapshotFile,
    JSON.stringify(artifacts.snapshot, null, 2),
    'utf8',
  )

  const distDeclaration = mapSrcToDist(declarationFile)
  const distSnapshot = mapSrcToDist(snapshotFile)

  if (distDeclaration) {
    await ensureDirectory(dirname(distDeclaration))
    await fs.writeFile(distDeclaration, artifacts.declaration, 'utf8')
  }

  if (distSnapshot) {
    await ensureDirectory(dirname(distSnapshot))
    await fs.writeFile(
      distSnapshot,
      JSON.stringify(artifacts.snapshot, null, 2),
      'utf8',
    )
  }
}

export function relativePath(path: string): string {
  return relative(process.cwd(), resolve(path)) || resolve(path)
}

async function ensureDirectory(path: string): Promise<void> {
  await fs.mkdir(path, { recursive: true })
}

async function readIfExists(path: string): Promise<string | null> {
  try {
    return await fs.readFile(path, 'utf8')
  } catch (error: any) {
    if (error && error.code === 'ENOENT') {
      return null
    }
    throw error
  }
}

function mapSrcToDist(path: string): string | null {
  const normalized = resolve(path)
  const marker = `${sep}src${sep}`
  const index = normalized.lastIndexOf(marker)
  if (index === -1) {
    return null
  }
  return `${normalized.slice(0, index)}${sep}dist${sep}${normalized.slice(
    index + marker.length,
  )}`
}

async function invokeHooks(
  module: Record<string, unknown>,
  hooks?: string[],
): Promise<void> {
  if (!hooks || hooks.length === 0) return
  for (const hook of hooks) {
    const fn = module?.[hook]
    if (typeof fn === 'function') {
      await Promise.resolve((fn as () => unknown)())
    }
  }
}
