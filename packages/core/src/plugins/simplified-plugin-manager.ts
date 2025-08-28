/**
 * Simplified Plugin Manager - Phase 1 Implementation
 * 
 * Streamlined plugin management with essential functionality only.
 * Removes over-engineered security, performance monitoring, and complex preloading.
 */

import type { TachUIInstance, TachUIPlugin } from './simplified-types'

export class PluginError extends Error {
  constructor(message: string, public code?: string) {
    super(message)
    this.name = 'PluginError'
  }
}

export class SimplifiedPluginManager {
  private plugins = new Map<string, TachUIPlugin>()
  private instance: TachUIInstance

  constructor(instance: TachUIInstance) {
    this.instance = instance
  }

  async install(plugin: TachUIPlugin): Promise<void> {
    // Basic validation only
    this.validatePluginBasics(plugin)
    
    // Install plugin
    await plugin.install(this.instance)
    
    // Register in map
    this.plugins.set(plugin.name, plugin)
    
    console.log(`✅ Plugin "${plugin.name}" v${plugin.version} installed successfully`)
  }

  async uninstall(pluginName: string): Promise<void> {
    const plugin = this.plugins.get(pluginName)
    if (!plugin) {
      throw new PluginError(`Plugin "${pluginName}" is not installed`)
    }

    // Always remove the plugin from our registry first
    this.plugins.delete(pluginName)
    
    try {
      if (plugin.uninstall) {
        await plugin.uninstall()
      }
      console.log(`🗑️ Plugin "${pluginName}" uninstalled successfully`)
    } catch (error) {
      console.log(`🗑️ Plugin "${pluginName}" uninstalled successfully (cleanup failed)`)
      // Re-throw the error so the calling code can handle it
      throw error
    }
  }

  isInstalled(pluginName: string): boolean {
    return this.plugins.has(pluginName)
  }

  getInstalledPlugins(): string[] {
    return Array.from(this.plugins.keys())
  }

  getPlugin(pluginName: string): TachUIPlugin | undefined {
    return this.plugins.get(pluginName)
  }

  getAllPlugins(): TachUIPlugin[] {
    return Array.from(this.plugins.values())
  }

  private validatePluginBasics(plugin: TachUIPlugin): void {
    if (!plugin.name || typeof plugin.name !== 'string') {
      throw new PluginError('Plugin must have a valid name string', 'INVALID_NAME')
    }
    
    if (!plugin.version || typeof plugin.version !== 'string') {
      throw new PluginError('Plugin must have a valid version string', 'INVALID_VERSION')
    }
    
    if (!plugin.install || typeof plugin.install !== 'function') {
      throw new PluginError('Plugin must have an install function', 'INVALID_INSTALL')
    }
    
    // Check for duplicate installation
    if (this.plugins.has(plugin.name)) {
      console.warn(`Plugin "${plugin.name}" is already installed, overwriting`)
    }
  }
}