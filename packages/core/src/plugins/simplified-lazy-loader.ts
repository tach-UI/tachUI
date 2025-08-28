/**
 * Optimized Lazy Plugin Loader - Week 3 Performance Enhancement
 * 
 * Enhanced dynamic plugin loading with performance optimizations:
 * - Load caching and deduplication
 * - Performance metrics tracking
 * - Retry logic with exponential backoff
 * - Memory-efficient loading
 */

import type { TachUIPlugin } from './simplified-types'
import { PluginError } from './simplified-types'

interface LoadMetrics {
  startTime: number
  endTime?: number
  duration?: number
  attempts: number
  success: boolean
  cacheHit: boolean
}

/**
 * Performance-optimized lazy plugin loader
 */
export class OptimizedLazyPluginLoader {
  private loadPromises = new Map<string, Promise<TachUIPlugin>>()
  private loadedPlugins = new Map<string, TachUIPlugin>()
  private loadMetrics = new Map<string, LoadMetrics>()
  private maxRetries = 3
  private baseRetryDelay = 100 // ms

  async loadPlugin(pluginName: string): Promise<TachUIPlugin> {
    // Check cache first for already loaded plugins
    if (this.loadedPlugins.has(pluginName)) {
      this.recordCacheHit(pluginName)
      return this.loadedPlugins.get(pluginName)!
    }

    // Check if loading is in progress
    if (this.loadPromises.has(pluginName)) {
      return this.loadPromises.get(pluginName)!
    }

    // Start new load with metrics tracking
    const loadPromise = this.doLoadPluginWithRetry(pluginName)
    this.loadPromises.set(pluginName, loadPromise)

    try {
      const plugin = await loadPromise
      // Cache the loaded plugin for future requests
      this.loadedPlugins.set(pluginName, plugin)
      return plugin
    } catch (error) {
      // Remove failed promise from cache
      this.loadPromises.delete(pluginName)
      throw error
    }
  }

  private async doLoadPluginWithRetry(pluginName: string, attempt: number = 1): Promise<TachUIPlugin> {
    const metrics: LoadMetrics = {
      startTime: performance.now(),
      attempts: attempt,
      success: false,
      cacheHit: false
    }
    this.loadMetrics.set(pluginName, metrics)

    try {
      const plugin = await this.doLoadPlugin(pluginName)
      
      // Record successful load metrics
      metrics.endTime = performance.now()
      metrics.duration = metrics.endTime - metrics.startTime
      metrics.success = true
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`🚀 Plugin "${pluginName}" loaded in ${metrics.duration.toFixed(2)}ms (attempt ${attempt})`)
      }

      return plugin
    } catch (error) {
      // Record failed attempt
      metrics.endTime = performance.now()
      metrics.duration = metrics.endTime - metrics.startTime

      if (attempt < this.maxRetries) {
        // Exponential backoff retry
        const delay = this.baseRetryDelay * Math.pow(2, attempt - 1)
        
        if (process.env.NODE_ENV === 'development') {
          console.warn(`⚠️ Plugin "${pluginName}" load failed (attempt ${attempt}), retrying in ${delay}ms...`)
        }
        
        await this.delay(delay)
        return this.doLoadPluginWithRetry(pluginName, attempt + 1)
      }

      // All retries exhausted
      if (process.env.NODE_ENV === 'development') {
        console.error(`❌ Plugin "${pluginName}" failed to load after ${attempt} attempts`)
      }
      
      throw new PluginError(`Failed to load plugin "${pluginName}" after ${attempt} attempts: ${error}`)
    }
  }

  private async doLoadPlugin(pluginName: string): Promise<TachUIPlugin> {
    try {
      // Optimized dynamic import - let bundler handle code splitting
      const module = await import(/* webpackChunkName: "plugin-[request]" */ pluginName)
      const plugin = module.default || module
      
      if (!plugin || typeof plugin !== 'object') {
        throw new PluginError(`Plugin "${pluginName}" must export a plugin object`)
      }
      
      if (!plugin.name || !plugin.version || typeof plugin.install !== 'function') {
        throw new PluginError(`Plugin "${pluginName}" must have name, version, and install method`)
      }
      
      return plugin as TachUIPlugin
    } catch (error) {
      throw new PluginError(`Dynamic import failed for "${pluginName}": ${error}`)
    }
  }

  private recordCacheHit(pluginName: string): void {
    if (this.loadMetrics.has(pluginName)) {
      const metrics = this.loadMetrics.get(pluginName)!
      metrics.cacheHit = true
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`💾 Plugin "${pluginName}" served from cache`)
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Performance monitoring methods
  
  isLoading(pluginName: string): boolean {
    return this.loadPromises.has(pluginName) && !this.loadedPlugins.has(pluginName)
  }

  isLoaded(pluginName: string): boolean {
    return this.loadedPlugins.has(pluginName)
  }

  getLoadMetrics(pluginName: string): LoadMetrics | undefined {
    return this.loadMetrics.get(pluginName)
  }

  getAllMetrics(): Array<{ plugin: string; metrics: LoadMetrics }> {
    return Array.from(this.loadMetrics.entries()).map(([plugin, metrics]) => ({
      plugin,
      metrics
    }))
  }

  getPerformanceStats() {
    const allMetrics = this.getAllMetrics()
    const successful = allMetrics.filter(m => m.metrics.success)
    const failed = allMetrics.filter(m => !m.metrics.success)
    
    const totalLoadTime = successful.reduce((sum, m) => sum + (m.metrics.duration || 0), 0)
    const avgLoadTime = successful.length > 0 ? totalLoadTime / successful.length : 0
    
    return {
      totalPlugins: allMetrics.length,
      successful: successful.length,
      failed: failed.length,
      cached: this.loadedPlugins.size,
      averageLoadTime: avgLoadTime,
      totalLoadTime,
      cacheHitRate: successful.length > 0 ? 
        successful.filter(m => m.metrics.cacheHit).length / successful.length : 0
    }
  }

  clearCache(pluginName?: string): void {
    if (pluginName) {
      this.loadPromises.delete(pluginName)
      this.loadedPlugins.delete(pluginName)
      this.loadMetrics.delete(pluginName)
    } else {
      this.loadPromises.clear()
      this.loadedPlugins.clear()
      this.loadMetrics.clear()
    }
  }

  // Memory management
  
  unloadPlugin(pluginName: string): void {
    this.loadPromises.delete(pluginName)
    this.loadedPlugins.delete(pluginName)
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`🗑️ Plugin "${pluginName}" unloaded from memory`)
    }
  }

  getMemoryUsage() {
    return {
      loadedPlugins: this.loadedPlugins.size,
      pendingLoads: this.loadPromises.size,
      metricsEntries: this.loadMetrics.size,
      estimatedMemoryKB: (this.loadedPlugins.size * 5) + (this.loadMetrics.size * 1) // rough estimate
    }
  }
}

/**
 * Create a lazy plugin loader from a dynamic import function
 */
export function createLazyPlugin(
  importFn: () => Promise<{ default: TachUIPlugin } | TachUIPlugin>
): () => Promise<TachUIPlugin> {
  return async () => {
    try {
      const module = await importFn()
      const plugin = 'default' in module ? module.default : module
      
      if (!plugin || typeof plugin !== 'object') {
        throw new PluginError('Plugin module must export a plugin object')
      }
      
      if (!plugin.name || !plugin.version || typeof plugin.install !== 'function') {
        throw new PluginError('Plugin must have name, version, and install method')
      }
      
      return plugin as TachUIPlugin
    } catch (error) {
      throw new PluginError(`Failed to load plugin: ${error}`)
    }
  }
}