/**
 * Legacy Plugin Adapter - Phase 1 Implementation
 *
 * Provides backward compatibility with existing plugin APIs during migration.
 * Adapts old plugin interfaces to work with the simplified system.
 */
import type { TachUIPlugin } from './simplified-types'
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
export declare function createLegacyPluginAdapter(
  legacyPlugin: LegacyPlugin
): TachUIPlugin
/**
 * Check if a plugin uses the legacy format
 */
export declare function isLegacyPlugin(plugin: any): plugin is LegacyPlugin
/**
 * Auto-adapt legacy plugins
 */
export declare function adaptPlugin(plugin: any): TachUIPlugin

//# sourceMappingURL=legacy-adapter.d.ts.map
