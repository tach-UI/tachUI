/**
 * Legacy Plugin Adapter - Phase 1 Implementation
 * 
 * Provides backward compatibility with existing plugin APIs during migration.
 * Adapts old plugin interfaces to work with the simplified system.
 */

import type { TachUIPlugin, TachUIInstance } from './simplified-types'
import { PluginError } from './simplified-types'

/**
 * Legacy plugin interface (old format)
 */
interface LegacyPlugin {
  metadata: {
    name: string
    version: string
    description?: string
    author?: string
  }
  initialize(instance: any, options?: any): void | Promise<void>
  cleanup?(): void | Promise<void>
  dependencies?: string[]
}

/**
 * Legacy plugin adapter
 */
export function createLegacyPluginAdapter(legacyPlugin: LegacyPlugin): TachUIPlugin {
  if (!legacyPlugin.metadata) {
    throw new PluginError('Legacy plugin must have metadata property')
  }

  if (!legacyPlugin.metadata.name || !legacyPlugin.metadata.version) {
    throw new PluginError('Legacy plugin metadata must include name and version')
  }

  return {
    name: legacyPlugin.metadata.name,
    version: legacyPlugin.metadata.version,
    description: legacyPlugin.metadata.description,
    
    async install(instance: TachUIInstance): Promise<void> {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`⚠️  Using legacy adapter for plugin "${legacyPlugin.metadata.name}". Consider updating to simplified API.`)
      }
      
      // Adapt old plugin API to new simplified API
      await legacyPlugin.initialize(instance)
    },
    
    async uninstall(): Promise<void> {
      if (legacyPlugin.cleanup) {
        await legacyPlugin.cleanup()
      }
    }
  }
}

/**
 * Check if a plugin uses the legacy format
 */
export function isLegacyPlugin(plugin: any): plugin is LegacyPlugin {
  return (
    plugin && 
    typeof plugin === 'object' &&
    plugin.metadata &&
    typeof plugin.metadata.name === 'string' &&
    typeof plugin.metadata.version === 'string' &&
    typeof plugin.initialize === 'function'
  )
}

/**
 * Auto-adapt legacy plugins
 */
export function adaptPlugin(plugin: any): TachUIPlugin {
  if (isLegacyPlugin(plugin)) {
    return createLegacyPluginAdapter(plugin)
  }
  
  // Assume it's already using the new simplified format
  return plugin as TachUIPlugin
}