import type { Plugin } from 'vite'

type LoggerLike = {
  info?(msg: string): void
  warn?(msg: string): void
  error?(msg: string): void
}

import { generateModifierArtifacts } from '../modifiers/type-generator'
import {
  hydrateRegistry,
  resolveOutputPaths,
  writeArtifacts,
  relativePath,
} from '../build-tools/typegen-runner'

export interface ModifierTypesPluginOptions {
  declaration?: string
  snapshot?: string
  failOnConflict?: boolean
  watch?: boolean
  watchPatterns?: string[]
  extraHydrators?: string[]
  debug?: boolean
}

export function modifierTypesPlugin(
  options: ModifierTypesPluginOptions = {},
): Plugin {
  const paths = resolveOutputPaths({
    declaration: options.declaration,
    snapshot: options.snapshot,
  })
  const extraHydrators = options.extraHydrators ?? []
  const failOnConflict = options.failOnConflict ?? false
  const debug = options.debug ?? false

  async function runGeneration(
    logger: LoggerLike,
    reason: string,
  ) {
    await hydrateRegistry({ debug, extraModules: extraHydrators })

    const artifacts = generateModifierArtifacts()
    await writeArtifacts(artifacts, paths.declarationFile, paths.snapshotFile)

    if (artifacts.snapshot.conflicts.length > 0) {
      const conflictMessage = `Modifier conflicts detected (${artifacts.snapshot.conflicts.length}).`
      logger.warn?.(conflictMessage)
      artifacts.snapshot.conflicts.forEach((conflict) => {
        const plugins = conflict.entries.map((entry) => entry.plugin).join(', ')
        logger.warn?.(` • ${conflict.name}: ${plugins}`)
      })
      if (failOnConflict && 'error' in logger && typeof logger.error === 'function') {
        logger.error(`Failing due to modifier conflicts (trigger: ${reason}).`)
        throw new Error(conflictMessage)
      }
    }

    logger.info?.(
      `Generated modifier declarations → ${relativePath(paths.declarationFile)} (${reason})`,
    )
  }

  return {
    name: 'tachui-modifier-types',

    async buildStart() {
      await runGeneration(this, 'build')
    },

    configureServer(server) {
      if (options.watch === false) {
        return
      }

      const patterns = options.watchPatterns ?? ['packages/**/src/**/*.{ts,tsx}']
      const schedule = debounce(
        () => runGeneration(server.config.logger, 'watch'),
        250,
      )

      patterns.forEach((pattern) => server.watcher.add(pattern))

      const handleChange = () => schedule()
      const handleAdd = () => schedule()
      const handleUnlink = () => schedule()

      server.watcher.on('change', handleChange)
      server.watcher.on('add', handleAdd)
      server.watcher.on('unlink', handleUnlink)

      const cleanup = () => {
        server.watcher.off('change', handleChange)
        server.watcher.off('add', handleAdd)
        server.watcher.off('unlink', handleUnlink)
        server.watcher.unwatch(patterns)
      }

      server.httpServer?.once('close', cleanup)
    },
  }
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
