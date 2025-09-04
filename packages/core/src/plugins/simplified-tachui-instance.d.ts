/**
 * Simplified TachUI Instance - Phase 1 Implementation
 *
 * Streamlined framework instance with essential plugin functionality only.
 * Integrates simplified plugin manager and component registry.
 */
import { SimplifiedPluginManager } from './simplified-plugin-manager'
import { SimplifiedComponentRegistry } from './simplified-component-registry'
import type {
  TachUIInstance,
  TachUIPlugin,
  ComponentRegistrationOptions,
} from './simplified-types'
import type { Component } from '../runtime/types'
export declare class SimplifiedTachUIInstance implements TachUIInstance {
  readonly plugins: SimplifiedPluginManager
  readonly components: SimplifiedComponentRegistry
  readonly services: Map<string, any>
  private currentInstallingPlugin
  constructor()
  registerComponent(
    name: string,
    component: Component,
    options?: ComponentRegistrationOptions
  ): void
  registerService(name: string, service: any): void
  getService<T = any>(name: string): T | undefined
  hasService(name: string): boolean
  unregisterService(name: string): boolean
  installPlugin(plugin: TachUIPlugin): Promise<void>
  uninstallPlugin(pluginName: string): Promise<void>
  isPluginInstalled(pluginName: string): boolean
  getInstalledPlugins(): string[]
  getStats(): {
    plugins: {
      installed: number
      list: string[]
    }
    components: {
      totalComponents: number
      categories: {
        [k: string]: number
      }
      plugins: {
        [k: string]: number
      }
      tags: {
        [k: string]: number
      }
    }
    services: {
      registered: number
      list: string[]
    }
  }
  reset(): Promise<void>
}
export declare const globalTachUIInstance: SimplifiedTachUIInstance
export declare function installPlugin(plugin: TachUIPlugin): Promise<void>
export declare function registerComponent(
  name: string,
  component: Component,
  options?: ComponentRegistrationOptions
): void
export declare function registerService(name: string, service: any): void
//# sourceMappingURL=simplified-tachui-instance.d.ts.map
