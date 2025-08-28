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
  ComponentRegistrationOptions
} from './simplified-types'
import type { Component } from '../runtime/types'

export class SimplifiedTachUIInstance implements TachUIInstance {
  public readonly plugins: SimplifiedPluginManager
  public readonly components: SimplifiedComponentRegistry
  public readonly services: Map<string, any>
  private currentInstallingPlugin: string | null = null

  constructor() {
    this.components = new SimplifiedComponentRegistry()
    this.services = new Map<string, any>()
    this.plugins = new SimplifiedPluginManager(this)
  }

  registerComponent(name: string, component: Component, options?: ComponentRegistrationOptions): void {
    this.components.register({
      name,
      component,
      category: options?.category,
      tags: options?.tags,
      plugin: this.currentInstallingPlugin || undefined
    })
  }

  registerService(name: string, service: any): void {
    if (this.services.has(name) && !this.services.get(name)) {
      console.warn(`Service "${name}" already registered, overwriting`)
    }
    
    this.services.set(name, service)
    console.log(`⚙️ Service "${name}" registered`)
  }

  getService<T = any>(name: string): T | undefined {
    return this.services.get(name)
  }

  hasService(name: string): boolean {
    return this.services.has(name)
  }

  unregisterService(name: string): boolean {
    const existed = this.services.has(name)
    this.services.delete(name)
    
    if (existed) {
      console.log(`🗑️ Service "${name}" unregistered`)
    }
    
    return existed
  }

  async installPlugin(plugin: TachUIPlugin): Promise<void> {
    this.currentInstallingPlugin = plugin.name
    try {
      await this.plugins.install(plugin)
    } finally {
      this.currentInstallingPlugin = null
    }
  }

  async uninstallPlugin(pluginName: string): Promise<void> {
    // Unregister components belonging to this plugin
    this.components.unregisterByPlugin(pluginName)
    
    // Unregister services belonging to this plugin (simple cleanup)
    // Note: We don't track service ownership in the simplified version,
    // so we rely on the plugin's uninstall method to clean up its services
    
    await this.plugins.uninstall(pluginName)
  }

  isPluginInstalled(pluginName: string): boolean {
    return this.plugins.isInstalled(pluginName)
  }

  getInstalledPlugins(): string[] {
    return this.plugins.getInstalledPlugins()
  }

  getStats() {
    return {
      plugins: {
        installed: this.plugins.getInstalledPlugins().length,
        list: this.plugins.getInstalledPlugins()
      },
      components: this.components.getStats(),
      services: {
        registered: this.services.size,
        list: Array.from(this.services.keys())
      }
    }
  }

  async reset(): Promise<void> {
    // Uninstall all plugins
    const pluginNames = this.getInstalledPlugins()
    for (const pluginName of pluginNames) {
      try {
        await this.uninstallPlugin(pluginName)
      } catch (error) {
        console.error(`Failed to uninstall plugin "${pluginName}":`, error)
      }
    }
    
    // Clear remaining components and services
    this.components.clear()
    this.services.clear()
    
    console.log('🔄 TachUI instance reset completed')
  }
}

// Create and export a global instance
export const globalTachUIInstance = new SimplifiedTachUIInstance()

// Convenience functions for global instance
export function installPlugin(plugin: TachUIPlugin): Promise<void> {
  return globalTachUIInstance.installPlugin(plugin)
}

export function registerComponent(name: string, component: Component, options?: ComponentRegistrationOptions): void {
  return globalTachUIInstance.registerComponent(name, component, options)
}

export function registerService(name: string, service: any): void {
  return globalTachUIInstance.registerService(name, service)
}