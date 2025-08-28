/**
 * Component Loader Registry
 *
 * Manages lazy-loaded components at the plugin level, allowing components
 * to be registered as loaders rather than actual implementations.
 */

import {
  type LazyComponentLoader,
  type LazyComponentOptions,
  type LazyComponentState,
  lazy,
  preloadComponent,
} from '../runtime/lazy-component'
import type { ComponentInstance } from '../runtime/types'

// Re-export types for convenience
export type { LazyComponentLoader, LazyComponentOptions, LazyComponentState }

export interface ComponentLoaderDefinition {
  /** Component loader function */
  loader: LazyComponentLoader
  /** Bundle chunk this component belongs to */
  chunk?: string
  /** Plugin that owns this component */
  plugin: string
  /** Lazy loading options */
  options?: LazyComponentOptions
  /** Component metadata */
  metadata?: {
    description?: string
    version?: string
    dependencies?: string[]
    size?: number
  }
}

export interface ChunkLoadingStrategy {
  /** Load entire chunk when any component from it is requested */
  preloadChunk?: boolean
  /** Parallel load all components in chunk */
  parallel?: boolean
  /** Priority for chunk loading */
  priority?: 'low' | 'normal' | 'high'
}

/**
 * Registry for managing lazy-loaded components
 */
export class ComponentLoaderRegistry {
  private loaders = new Map<string, ComponentLoaderDefinition>()
  private loadedComponents = new Map<string, any>()
  private loadingPromises = new Map<string, Promise<any>>()
  private chunks = new Map<string, Set<string>>()
  private chunkStrategies = new Map<string, ChunkLoadingStrategy>()

  /**
   * Register a component loader
   */
  registerComponentLoader(name: string, definition: ComponentLoaderDefinition): void {
    this.loaders.set(name, definition)

    // Track chunk membership
    if (definition.chunk) {
      if (!this.chunks.has(definition.chunk)) {
        this.chunks.set(definition.chunk, new Set())
      }
      this.chunks.get(definition.chunk)!.add(name)
    }
  }

  /**
   * Register multiple component loaders from a plugin
   */
  registerPluginComponents(
    plugin: string,
    components: Record<
      string,
      {
        loader: LazyComponentLoader
        chunk?: string
        options?: LazyComponentOptions
        metadata?: ComponentLoaderDefinition['metadata']
      }
    >
  ): void {
    for (const [name, config] of Object.entries(components)) {
      this.registerComponentLoader(name, {
        ...config,
        plugin,
      })
    }
  }

  /**
   * Get a lazy component by name
   */
  getLazyComponent(name: string): ((props: any) => ComponentInstance) | null {
    const definition = this.loaders.get(name)
    if (!definition) {
      return null
    }

    return lazy(definition.loader, definition.options)
  }

  /**
   * Load a component immediately (not lazy)
   */
  async loadComponent(name: string): Promise<any> {
    // Return cached component if already loaded
    if (this.loadedComponents.has(name)) {
      return this.loadedComponents.get(name)
    }

    // Return existing loading promise if already loading
    if (this.loadingPromises.has(name)) {
      return this.loadingPromises.get(name)
    }

    const definition = this.loaders.get(name)
    if (!definition) {
      throw new Error(`Component '${name}' not found in registry`)
    }

    // Start loading
    const loadingPromise = this.loadComponentWithChunkStrategy(name, definition)
    this.loadingPromises.set(name, loadingPromise)

    try {
      const component = await loadingPromise
      this.loadedComponents.set(name, component)
      this.loadingPromises.delete(name)
      return component
    } catch (error) {
      this.loadingPromises.delete(name)
      throw error
    }
  }

  /**
   * Load component with chunk-aware strategy
   */
  private async loadComponentWithChunkStrategy(
    name: string,
    definition: ComponentLoaderDefinition
  ): Promise<any> {
    const { chunk } = definition

    if (chunk) {
      const strategy = this.chunkStrategies.get(chunk)

      if (strategy?.preloadChunk) {
        // Load entire chunk
        await this.preloadChunk(chunk, strategy.parallel)
        return this.loadedComponents.get(name)
      }
    }

    // Load single component
    return preloadComponent(definition.loader)
  }

  /**
   * Preload an entire chunk
   */
  async preloadChunk(chunkName: string, parallel = false): Promise<void> {
    const componentNames = this.chunks.get(chunkName)
    if (!componentNames) {
      throw new Error(`Chunk '${chunkName}' not found`)
    }

    const componentsToLoad = Array.from(componentNames).filter(
      (name) => !this.loadedComponents.has(name) && !this.loadingPromises.has(name)
    )

    if (componentsToLoad.length === 0) {
      return // All components already loaded/loading
    }

    if (parallel) {
      // Load all components in parallel
      const loadPromises = componentsToLoad.map((name) => {
        const definition = this.loaders.get(name)!
        const promise = preloadComponent(definition.loader)
        this.loadingPromises.set(name, promise)
        return promise.then((component) => {
          this.loadedComponents.set(name, component)
          this.loadingPromises.delete(name)
          return component
        })
      })

      await Promise.all(loadPromises)
    } else {
      // Load components sequentially
      for (const name of componentsToLoad) {
        await this.loadComponent(name)
      }
    }
  }

  /**
   * Configure chunk loading strategy
   */
  configureChunkStrategy(chunk: string, strategy: ChunkLoadingStrategy): void {
    this.chunkStrategies.set(chunk, strategy)
  }

  /**
   * Get registry statistics
   */
  getStatistics() {
    const totalComponents = this.loaders.size
    const loadedComponents = this.loadedComponents.size
    const loadingComponents = this.loadingPromises.size
    const totalChunks = this.chunks.size

    const pluginStats = new Map<string, number>()
    const chunkStats = new Map<string, number>()

    for (const [, definition] of this.loaders) {
      // Plugin stats
      const current = pluginStats.get(definition.plugin) || 0
      pluginStats.set(definition.plugin, current + 1)

      // Chunk stats
      if (definition.chunk) {
        const currentChunk = chunkStats.get(definition.chunk) || 0
        chunkStats.set(definition.chunk, currentChunk + 1)
      }
    }

    return {
      totalComponents,
      loadedComponents,
      loadingComponents,
      totalChunks,
      loadingPercentage: Math.round((loadedComponents / totalComponents) * 100),
      pluginStats: Object.fromEntries(pluginStats),
      chunkStats: Object.fromEntries(chunkStats),
    }
  }

  /**
   * Check if component is registered
   */
  hasComponent(name: string): boolean {
    return this.loaders.has(name)
  }

  /**
   * Check if component is loaded
   */
  isComponentLoaded(name: string): boolean {
    return this.loadedComponents.has(name)
  }

  /**
   * Check if component is currently loading
   */
  isComponentLoading(name: string): boolean {
    return this.loadingPromises.has(name)
  }

  /**
   * Get component metadata
   */
  getComponentMetadata(name: string): ComponentLoaderDefinition['metadata'] | null {
    return this.loaders.get(name)?.metadata || null
  }

  /**
   * List all registered components
   */
  listComponents(): Array<{
    name: string
    plugin: string
    chunk?: string
    loaded: boolean
    loading: boolean
    metadata?: ComponentLoaderDefinition['metadata']
  }> {
    return Array.from(this.loaders.entries()).map(([name, definition]) => ({
      name,
      plugin: definition.plugin,
      chunk: definition.chunk,
      loaded: this.isComponentLoaded(name),
      loading: this.isComponentLoading(name),
      metadata: definition.metadata,
    }))
  }

  /**
   * Clear all loaded components (useful for testing)
   */
  clearCache(): void {
    this.loadedComponents.clear()
    this.loadingPromises.clear()
  }

  /**
   * Unregister a component loader
   */
  unregisterComponent(name: string): boolean {
    const definition = this.loaders.get(name)
    if (!definition) {
      return false
    }

    this.loaders.delete(name)
    this.loadedComponents.delete(name)
    this.loadingPromises.delete(name)

    // Remove from chunk
    if (definition.chunk) {
      const chunkComponents = this.chunks.get(definition.chunk)
      if (chunkComponents) {
        chunkComponents.delete(name)
        if (chunkComponents.size === 0) {
          this.chunks.delete(definition.chunk)
          this.chunkStrategies.delete(definition.chunk)
        }
      }
    }

    return true
  }
}

// Global component loader registry instance
export const globalComponentRegistry = new ComponentLoaderRegistry()

/**
 * Helper function to create lazy components from registry
 */
export function createLazyComponentFromRegistry(name: string) {
  const lazyComponent = globalComponentRegistry.getLazyComponent(name)
  if (!lazyComponent) {
    throw new Error(`Component '${name}' not found in registry. Make sure the plugin is installed.`)
  }
  return lazyComponent
}

/**
 * Helper to register plugin components dynamically
 * NOTE: This should be called from plugin packages, not core
 */
export function createPluginComponentRegistrar(pluginName: string, baseModulePath: string) {
  return (components: Record<string, {
    path: string
    chunk?: string
    metadata?: ComponentLoaderDefinition['metadata']
  }>) => {
    const componentDefinitions: Record<string, any> = {}
    
    for (const [name, config] of Object.entries(components)) {
      componentDefinitions[name] = {
        loader: () => {
          const modulePath = `${baseModulePath}/${config.path}`
          return import(/* @vite-ignore */ modulePath)
        },
        chunk: config.chunk,
        metadata: config.metadata,
      }
    }
    
    globalComponentRegistry.registerPluginComponents(pluginName, componentDefinitions)
  }
}

