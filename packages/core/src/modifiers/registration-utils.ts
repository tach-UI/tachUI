import { globalModifierRegistry } from '@tachui/registry'
import type {
  ModifierFactory,
  ModifierMetadata,
  ModifierRegistry,
  PluginInfo,
} from '@tachui/registry'
import type { Modifier } from './types'
import { TACHUI_PACKAGE_VERSION } from '../version'

const metadataEnabledRegistries = new WeakSet<ModifierRegistry>()
const registeredPlugins = new WeakMap<ModifierRegistry, Set<string>>()

export const CORE_PLUGIN_INFO: PluginInfo = {
  name: '@tachui/core',
  version: TACHUI_PACKAGE_VERSION,
  author: 'TachUI Team',
  verified: true,
}

function ensureMetadataRegistration(registry: ModifierRegistry) {
  if (metadataEnabledRegistries.has(registry)) {
    return
  }
  registry.setFeatureFlags({
    metadataRegistration: true,
  })
  metadataEnabledRegistries.add(registry)
}

function ensurePluginRegistered(
  registry: ModifierRegistry,
  plugin: PluginInfo,
) {
  let plugins = registeredPlugins.get(registry)
  if (!plugins) {
    plugins = new Set<string>()
    registeredPlugins.set(registry, plugins)
  }

  if (plugins.has(plugin.name)) {
    return
  }

  registry.registerPlugin(plugin)
  plugins.add(plugin.name)
}

type AnyModifierFactory<T = any> =
  | ModifierFactory<T>
  | ((...args: any[]) => Modifier)

export function registerModifierWithMetadata<T>(
  name: string,
  factory: AnyModifierFactory<T>,
  metadata: Omit<ModifierMetadata, 'name' | 'plugin'>,
  registry: ModifierRegistry = globalModifierRegistry,
  plugin: PluginInfo = CORE_PLUGIN_INFO,
) {
  ensureMetadataRegistration(registry)
  ensurePluginRegistered(registry, plugin)

  if (!registry.has(name)) {
    registry.register(name, factory as ModifierFactory<T>)
  }

  if (!registry.getMetadata(name)) {
    registry.registerMetadata({
      ...metadata,
      name,
      plugin: plugin.name,
    })
  }
}
