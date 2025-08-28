/**
 * Component Loader Registry Tests
 *
 * Tests the component registry system for lazy loading
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  ComponentLoaderRegistry,
  createLazyComponentFromRegistry,
  globalComponentRegistry,
} from '../../src/plugins/component-loader-registry'

describe('Component Loader Registry', () => {
  let registry: ComponentLoaderRegistry

  beforeEach(() => {
    registry = new ComponentLoaderRegistry()
    globalComponentRegistry.clearCache()
  })

  describe('Basic Registration', () => {
    it('should register component loaders', () => {
      const mockLoader = vi.fn().mockResolvedValue({ default: () => ({}) })

      registry.registerComponentLoader('TestComponent', {
        loader: mockLoader,
        plugin: 'test-plugin',
        chunk: 'test-chunk',
      })

      expect(registry.hasComponent('TestComponent')).toBe(true)
      expect(registry.hasComponent('NonExistent')).toBe(false)
    })

    it('should register plugin components in bulk', () => {
      registry.registerPluginComponents('forms', {
        TextField: {
          loader: vi.fn().mockResolvedValue({ default: () => ({}) }),
          chunk: 'forms-inputs',
        },
        Select: {
          loader: vi.fn().mockResolvedValue({ default: () => ({}) }),
          chunk: 'forms-complex',
        },
      })

      expect(registry.hasComponent('TextField')).toBe(true)
      expect(registry.hasComponent('Select')).toBe(true)
    })

    it('should track chunk membership', () => {
      registry.registerComponentLoader('ComponentA', {
        loader: vi.fn(),
        plugin: 'test',
        chunk: 'chunk1',
      })

      registry.registerComponentLoader('ComponentB', {
        loader: vi.fn(),
        plugin: 'test',
        chunk: 'chunk1',
      })

      const stats = registry.getStatistics()
      expect(stats.chunkStats.chunk1).toBe(2)
    })
  })

  describe('Component Loading', () => {
    it('should load components on demand', async () => {
      const mockComponent = () => ({ type: 'element' as const, tag: 'div' })
      const mockLoader = vi.fn().mockResolvedValue({ default: mockComponent })

      registry.registerComponentLoader('TestComponent', {
        loader: mockLoader,
        plugin: 'test-plugin',
      })

      const component = await registry.loadComponent('TestComponent')

      expect(mockLoader).toHaveBeenCalledOnce()
      expect(component).toBe(mockComponent)
      expect(registry.isComponentLoaded('TestComponent')).toBe(true)
    })

    it('should cache loaded components', async () => {
      const mockComponent = () => ({ type: 'element' as const, tag: 'div' })
      const mockLoader = vi.fn().mockResolvedValue({ default: mockComponent })

      registry.registerComponentLoader('TestComponent', {
        loader: mockLoader,
        plugin: 'test-plugin',
      })

      // Load twice
      const component1 = await registry.loadComponent('TestComponent')
      const component2 = await registry.loadComponent('TestComponent')

      expect(mockLoader).toHaveBeenCalledOnce() // Should only load once
      expect(component1).toBe(component2)
    })

    it('should handle loading failures', async () => {
      const mockLoader = vi.fn().mockRejectedValue(new Error('Load failed'))

      registry.registerComponentLoader('FailingComponent', {
        loader: mockLoader,
        plugin: 'test-plugin',
      })

      await expect(registry.loadComponent('FailingComponent')).rejects.toThrow('Load failed')
      expect(registry.isComponentLoaded('FailingComponent')).toBe(false)
    })

    it('should prevent duplicate loading promises', async () => {
      const mockLoader = vi
        .fn()
        .mockImplementation(
          () => new Promise((resolve) => setTimeout(() => resolve({ default: () => ({}) }), 100))
        )

      registry.registerComponentLoader('SlowComponent', {
        loader: mockLoader,
        plugin: 'test-plugin',
      })

      // Start multiple loads simultaneously
      const promises = [
        registry.loadComponent('SlowComponent'),
        registry.loadComponent('SlowComponent'),
        registry.loadComponent('SlowComponent'),
      ]

      await Promise.all(promises)

      expect(mockLoader).toHaveBeenCalledOnce() // Should only load once
    })
  })

  describe('Chunk Loading', () => {
    it('should preload entire chunks', async () => {
      const mockLoaderA = vi.fn().mockResolvedValue({ default: () => ({}) })
      const mockLoaderB = vi.fn().mockResolvedValue({ default: () => ({}) })

      registry.registerComponentLoader('ComponentA', {
        loader: mockLoaderA,
        plugin: 'test',
        chunk: 'test-chunk',
      })

      registry.registerComponentLoader('ComponentB', {
        loader: mockLoaderB,
        plugin: 'test',
        chunk: 'test-chunk',
      })

      await registry.preloadChunk('test-chunk')

      expect(mockLoaderA).toHaveBeenCalledOnce()
      expect(mockLoaderB).toHaveBeenCalledOnce()
      expect(registry.isComponentLoaded('ComponentA')).toBe(true)
      expect(registry.isComponentLoaded('ComponentB')).toBe(true)
    })

    it('should support parallel chunk loading', async () => {
      const mockLoaderA = vi.fn().mockResolvedValue({ default: () => ({}) })
      const mockLoaderB = vi.fn().mockResolvedValue({ default: () => ({}) })

      registry.registerComponentLoader('ComponentA', {
        loader: mockLoaderA,
        plugin: 'test',
        chunk: 'test-chunk',
      })

      registry.registerComponentLoader('ComponentB', {
        loader: mockLoaderB,
        plugin: 'test',
        chunk: 'test-chunk',
      })

      const startTime = Date.now()
      await registry.preloadChunk('test-chunk', true) // parallel = true
      const endTime = Date.now()

      expect(mockLoaderA).toHaveBeenCalledOnce()
      expect(mockLoaderB).toHaveBeenCalledOnce()
      // Parallel loading should be faster (though hard to test reliably)
      expect(endTime - startTime).toBeLessThan(1000)
    })

    it('should configure chunk strategies', async () => {
      const mockLoader = vi.fn().mockResolvedValue({ default: () => ({}) })

      registry.registerComponentLoader('TestComponent', {
        loader: mockLoader,
        plugin: 'test',
        chunk: 'strategic-chunk',
      })

      registry.configureChunkStrategy('strategic-chunk', {
        preloadChunk: true,
        parallel: true,
        priority: 'high',
      })

      // When preloadChunk is true, loading one component should load the whole chunk
      await registry.loadComponent('TestComponent')

      expect(mockLoader).toHaveBeenCalledOnce()
    })
  })

  describe('Registry Management', () => {
    it('should provide statistics', () => {
      registry.registerComponentLoader('Component1', {
        loader: vi.fn(),
        plugin: 'plugin1',
        chunk: 'chunk1',
      })

      registry.registerComponentLoader('Component2', {
        loader: vi.fn(),
        plugin: 'plugin2',
        chunk: 'chunk1',
      })

      const stats = registry.getStatistics()

      expect(stats.totalComponents).toBe(2)
      expect(stats.loadedComponents).toBe(0)
      expect(stats.totalChunks).toBe(1)
      expect(stats.pluginStats.plugin1).toBe(1)
      expect(stats.pluginStats.plugin2).toBe(1)
      expect(stats.chunkStats.chunk1).toBe(2)
    })

    it('should list all components', () => {
      registry.registerComponentLoader('TestComponent', {
        loader: vi.fn(),
        plugin: 'test-plugin',
        chunk: 'test-chunk',
        metadata: { description: 'Test component', version: '1.0.0' },
      })

      const components = registry.listComponents()

      expect(components).toHaveLength(1)
      expect(components[0]).toMatchObject({
        name: 'TestComponent',
        plugin: 'test-plugin',
        chunk: 'test-chunk',
        loaded: false,
        loading: false,
        metadata: { description: 'Test component', version: '1.0.0' },
      })
    })

    it('should unregister components', () => {
      registry.registerComponentLoader('TestComponent', {
        loader: vi.fn(),
        plugin: 'test-plugin',
        chunk: 'test-chunk',
      })

      expect(registry.hasComponent('TestComponent')).toBe(true)

      const result = registry.unregisterComponent('TestComponent')

      expect(result).toBe(true)
      expect(registry.hasComponent('TestComponent')).toBe(false)
    })

    it('should clean up chunks when all components are unregistered', () => {
      registry.registerComponentLoader('OnlyComponent', {
        loader: vi.fn(),
        plugin: 'test',
        chunk: 'lonely-chunk',
      })

      let stats = registry.getStatistics()
      expect(stats.totalChunks).toBe(1)

      registry.unregisterComponent('OnlyComponent')

      stats = registry.getStatistics()
      expect(stats.totalChunks).toBe(0)
    })

    it('should clear cache', async () => {
      const mockLoader = vi.fn().mockResolvedValue({ default: () => ({}) })

      registry.registerComponentLoader('TestComponent', {
        loader: mockLoader,
        plugin: 'test',
      })

      await registry.loadComponent('TestComponent')
      expect(registry.isComponentLoaded('TestComponent')).toBe(true)

      registry.clearCache()
      expect(registry.isComponentLoaded('TestComponent')).toBe(false)
    })
  })

  describe('Helper Functions', () => {
    it('should create lazy components from registry', () => {
      globalComponentRegistry.registerComponentLoader('GlobalTestComponent', {
        loader: vi.fn().mockResolvedValue({ default: () => ({}) }),
        plugin: 'test',
      })

      const lazyComponent = createLazyComponentFromRegistry('GlobalTestComponent')
      expect(lazyComponent).toBeInstanceOf(Function)
    })

    it('should throw error for non-existent components', () => {
      expect(() => {
        createLazyComponentFromRegistry('NonExistentComponent')
      }).toThrow("Component 'NonExistentComponent' not found in registry")
    })

    it('should register forms components', () => {
      // Mock the import to avoid resolution issues in tests
      globalComponentRegistry.registerPluginComponents('forms', {
        TextField: {
          loader: vi.fn().mockResolvedValue({ default: () => ({}) }),
          chunk: 'forms-inputs',
        },
        EmailField: {
          loader: vi.fn().mockResolvedValue({ default: () => ({}) }),
          chunk: 'forms-inputs',
        },
        Select: {
          loader: vi.fn().mockResolvedValue({ default: () => ({}) }),
          chunk: 'forms-complex',
        },
      })

      expect(globalComponentRegistry.hasComponent('TextField')).toBe(true)
      expect(globalComponentRegistry.hasComponent('EmailField')).toBe(true)
      expect(globalComponentRegistry.hasComponent('Select')).toBe(true)
    })

    it('should register navigation components', () => {
      // Mock the import to avoid resolution issues in tests
      globalComponentRegistry.registerPluginComponents('navigation', {
        NavigationView: {
          loader: vi.fn().mockResolvedValue({ default: () => ({}) }),
          chunk: 'navigation-core',
        },
        TabView: {
          loader: vi.fn().mockResolvedValue({ default: () => ({}) }),
          chunk: 'navigation-core',
        },
        NavigationLink: {
          loader: vi.fn().mockResolvedValue({ default: () => ({}) }),
          chunk: 'navigation-core',
        },
      })

      expect(globalComponentRegistry.hasComponent('NavigationView')).toBe(true)
      expect(globalComponentRegistry.hasComponent('TabView')).toBe(true)
      expect(globalComponentRegistry.hasComponent('NavigationLink')).toBe(true)
    })
  })
})
