import { globalModifierRegistry } from '@tachui/registry'
import type { ModifierRegistry } from '@tachui/registry'
import { ModifierParameterRegistry } from './modifier-parameter-system'

const CATEGORY_MAP: Record<string, 'layout' | 'appearance' | 'interaction' | 'animation' | 'accessibility' | 'custom'> =
  {
    layout: 'layout',
    appearance: 'appearance',
    interaction: 'interaction',
    animation: 'animation',
    responsive: 'custom',
  }

const PRIORITY_MAP: Record<string, number> = {
  '@tachui/core': 140,
  '@tachui/modifiers': 120,
  '@tachui/primitives': 110,
  '@tachui/forms': 100,
  '@tachui/navigation': 100,
  '@tachui/effects': 90,
  '@tachui/responsive': 90,
  '@tachui/data': 80,
  '@tachui/grid': 80,
}

const pluginRegistryCache = new WeakMap<ModifierRegistry, Set<string>>()

function ensurePluginRegistered(registry: ModifierRegistry, plugin: string) {
  let cache = pluginRegistryCache.get(registry)
  if (!cache) {
    cache = new Set<string>()
    pluginRegistryCache.set(registry, cache)
  }

  if (cache.has(plugin)) return

  const info = registry.getPluginInfo?.(plugin)
  if (!info) {
    registry.registerPlugin({
      name: plugin,
      version: '0.0.0',
      author: plugin.startsWith('@tachui/') ? 'tachUI Team' : 'external',
      verified: plugin.startsWith('@tachui/'),
    })
  }
  cache.add(plugin)
}

type ModifierSignature = ReturnType<ModifierParameterRegistry['getAllModifiers']>[number]
type ModifierParameter = ModifierSignature['parameters'][number]

function buildSignature(parameters: ModifierParameter[] | undefined): string {
  if (!parameters || parameters.length === 0) {
    return '(): this'
  }

  const parts = parameters.map((param) => {
    const name = param.name || 'arg'
    const optional = param.required === false ? '?' : ''
    const type = param.type || 'any'
    return `${name}${optional}: ${type}`
  })

  return `(${parts.join(', ')}): this`
}

export function registerModifierMetadata(
  registry: ModifierRegistry = globalModifierRegistry,
): void {
  const parameterRegistry = new ModifierParameterRegistry()
  const signatures = parameterRegistry.getAllModifiers()

  signatures.forEach((signature) => {
    const plugin = signature.plugin || '@tachui/core'
    const priority = PRIORITY_MAP[plugin] ?? 60
    const category =
      CATEGORY_MAP[signature.category] ?? ('custom' as const)

    ensurePluginRegistered(registry, plugin)

    try {
      registry.registerMetadata({
        name: signature.name,
        plugin,
        priority,
        signature: buildSignature(signature.parameters),
        category,
        description: signature.description,
      })
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          `⚠️ Failed to register metadata for modifier '${signature.name}' (${plugin}):`,
          error,
        )
      }
    }
  })
}

export default registerModifierMetadata
