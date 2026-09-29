/**
 * Shared utilities for modifier type generation tooling.
 * These helpers are reused by the CLI script and the Vite plugin.
 *
 * Note: This file is an internal source helper and is not currently the
 * backing implementation for the `@tachui/core/build-tools` package export.
 * That export aliases `src/build-plugins/index.ts` for compatibility.
 */

import { promises as fs } from 'node:fs'
import { dirname, relative, resolve, sep } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import process from 'node:process'

import type { GeneratedModifierArtifacts } from '../modifiers/type-generator'

export interface HydratorCandidate {
  name: string
  /**
   * Package specifier to try first. Set for anything shipped: installed from
   * npm there is no source tree beside us, only the dependency graph.
   */
  specifier?: string
  /** Fallback for running inside this repository, where `src/` does exist. */
  relativePath: string
  hooks?: string[]
  optional?: boolean
}

export interface HydrationOptions {
  debug?: boolean
  extraModules?: string[]
}

const MODULE_DIR = dirname(fileURLToPath(import.meta.url))

/**
 * Sources the generator hydrates from, package specifier first: every
 * first-party module that registers modifiers, each of which registers them
 * with metadata whose signatures are derived from its factories.
 *
 * The relative paths reach `packages/<name>/src` from `src/build-tools` inside
 * the repository. Installed, the same relative walk lands on
 * `node_modules/@tachui/<name>/src`, which published packages do not contain,
 * so there the specifier is what works; the relative path is what works here.
 *
 * `@tachui/modifiers` comes first. The other packages import it, and whichever
 * copy registers a name first is the one the registry keeps, so the source
 * copy has to get there before any other package brings in the built one.
 *
 * The devtools parameter registry is not a hydrator: its hand-written
 * parameter lists would override the derived metadata with a higher priority.
 */
export const DEFAULT_HYDRATORS: HydratorCandidate[] = [
  {
    name: '@tachui/modifiers',
    specifier: '@tachui/modifiers',
    relativePath: '../../../modifiers/src/index.ts',
    hooks: ['registerModifiers'],
  },
  {
    name: '@tachui/modifiers/preload/effects',
    specifier: '@tachui/modifiers/preload/effects',
    relativePath: '../../../modifiers/src/effects/index.ts',
    hooks: ['registerEffectModifiers'],
    optional: true,
  },
  {
    // Built output rather than source: the package is not `"type": "module"`,
    // so its source loads as CommonJS, and core's subpath exports only answer
    // `import`. Run `bun run build` before generating.
    name: '@tachui/responsive',
    specifier: '@tachui/responsive',
    relativePath: '../../../responsive/dist/modifiers/index.mjs',
    hooks: ['registerResponsiveModifiers'],
    optional: true,
  },
  {
    name: '@tachui/grid',
    specifier: '@tachui/grid',
    relativePath: '../../../grid/src/modifiers/grid.ts',
    hooks: ['registerGridModifiers'],
    optional: true,
  },
  {
    name: '@tachui/viewport',
    specifier: '@tachui/viewport',
    relativePath: '../../../viewport/src/modifiers/index.ts',
    optional: true,
  },
  {
    name: '@tachui/mobile',
    specifier: '@tachui/mobile',
    relativePath: '../../../mobile/src/modifiers/index.ts',
    optional: true,
  },
  {
    name: '@tachui/forms',
    specifier: '@tachui/forms',
    relativePath: '../../../forms/src/modifiers/index.ts',
    optional: true,
  },
  {
    name: '@tachui/fragments',
    specifier: '@tachui/fragments',
    relativePath: '../../../fragments/src/modifiers.ts',
    hooks: ['registerFragmentModifiers'],
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
    // Installed, this is the only branch that can succeed.
    if (candidate.specifier) {
      try {
        const module = await import(candidate.specifier)
        await invokeHooks(module, candidate.hooks)
        results.push({ name: candidate.name, status: 'loaded' })
        continue
      } catch {
        // Fall through to the in-repository source path.
      }
    }

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
  // Inside this repository the defaults belong beside the source they describe.
  // Installed, the same walk lands in `node_modules/@tachui/core/src`, where
  // writing generated types helps nobody and is erased by the next install — so
  // a consumer gets them in their own project instead.
  const installed = MODULE_DIR.includes(`${sep}node_modules${sep}`)
  const projectRoot = installed ? process.cwd() : resolve(MODULE_DIR, '..', '..')

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
  if (
    existingDeclaration === null ||
    comparableDeclaration(existingDeclaration) !==
      comparableDeclaration(artifacts.declaration)
  ) {
    console.error(
      `❌ ${relativePath(declarationFile)} is stale. Re-run generate-modifier-types.`,
    )
    failures++
  }

  const expectedSnapshot = JSON.stringify(
    comparableSnapshot(artifacts.snapshot),
  )
  let actualSnapshot: string | null = null
  try {
    actualSnapshot =
      existingSnapshot === null
        ? null
        : JSON.stringify(comparableSnapshot(JSON.parse(existingSnapshot)))
  } catch {
    actualSnapshot = null
  }
  if (actualSnapshot !== expectedSnapshot) {
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

/**
 * The declaration without what changes on every run or every release: the
 * generation time and the plugin versions in its header.
 */
export function comparableDeclaration(declaration: string): string {
  return declaration
    .replace(/^\/\/ Generated at: .*$/m, '')
    .replace(/^\/\/ Plugins: .*$/m, '')
    .trim()
}

/**
 * The snapshot without what changes on every run or every release: the
 * generation time, the registry instance's identity and creation time, and
 * the plugin versions.
 */
export function comparableSnapshot(
  snapshot: GeneratedModifierArtifacts['snapshot'],
): unknown {
  const { generatedAt: _generatedAt, registryHealth, plugins, ...rest } =
    snapshot
  const {
    instanceId: _instanceId,
    createdAt: _createdAt,
    instanceCount: _instanceCount,
    ...health
  } = registryHealth
  return {
    ...rest,
    plugins: plugins.map(({ version: _version, ...plugin }) => plugin),
    registryHealth: health,
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
