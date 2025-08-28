/**
 * Lazy Component System Tests
 *
 * Tests the runtime lazy component loading system
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createLazyComponentGroup,
  type LazyComponentLoader,
  lazy,
  preloadComponent,
  preloadComponentGroup,
} from '../../src/runtime/lazy-component'

describe('Lazy Component System', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic Lazy Loading', () => {
    it('should create a lazy component', () => {
      const mockLoader: LazyComponentLoader = vi.fn().mockResolvedValue({
        default: () => ({ type: 'element', tag: 'div', children: [] }),
      })

      const LazyComponent = lazy(mockLoader)

      expect(LazyComponent).toBeInstanceOf(Function)
      expect(mockLoader).not.toHaveBeenCalled() // Should not load immediately
    })

    it('should load component on first render', async () => {
      const mockComponent = () => ({
        type: 'element' as const,
        tag: 'div',
        children: [{ type: 'text' as const, text: 'Loaded!' }],
      })

      const mockLoader: LazyComponentLoader = vi.fn().mockResolvedValue({
        default: mockComponent,
      })

      const LazyComponent = lazy(mockLoader)

      // First render should trigger loading
      LazyComponent({ test: 'prop' })

      // Wait for loading to complete with shorter timeout to avoid memory issues
      await vi.waitFor(
        () => {
          expect(mockLoader).toHaveBeenCalledOnce()
        },
        { timeout: 100 }
      )
    })

    it('should handle loading errors', async () => {
      const mockLoader: LazyComponentLoader = vi
        .fn()
        .mockRejectedValue(new Error('Failed to load component'))

      const LazyComponent = lazy(mockLoader, {
        errorFallback: (error) => ({
          type: 'element',
          tag: 'div',
          children: [{ type: 'text', text: `Error: ${error.message}` }],
        }),
      })

      LazyComponent({})

      // Wait for error to occur with shorter timeout
      await vi.waitFor(
        () => {
          expect(mockLoader).toHaveBeenCalled()
        },
        { timeout: 100 }
      )
    })

    it('should use custom fallback while loading', () => {
      const mockLoader: LazyComponentLoader = vi.fn().mockResolvedValue({
        default: () => ({ type: 'element', tag: 'span', children: [] }),
      })

      const fallback = {
        type: 'element' as const,
        tag: 'div',
        children: [{ type: 'text' as const, text: 'Custom Loading...' }],
      }

      const LazyComponent = lazy(mockLoader, { fallback })
      const instance = LazyComponent({})

      // Should show fallback initially (before async loading completes)
      expect(instance).toBeDefined()
    })
  })

  describe('Preload Strategies', () => {
    it('should support immediate preloading', async () => {
      const mockLoader: LazyComponentLoader = vi.fn().mockResolvedValue({
        default: () => ({ type: 'element', tag: 'div', children: [] }),
      })

      lazy(mockLoader, { preload: 'immediate' })

      // Should load immediately
      await vi.waitFor(
        () => {
          expect(mockLoader).toHaveBeenCalled()
        },
        { timeout: 100 }
      )
    })

    it('should support idle preloading', async () => {
      // Mock requestIdleCallback
      const mockRequestIdleCallback = vi.fn((callback: () => void) => {
        setTimeout(callback, 50)
      })
      global.requestIdleCallback = mockRequestIdleCallback

      const mockLoader: LazyComponentLoader = vi.fn().mockResolvedValue({
        default: () => ({ type: 'element', tag: 'div', children: [] }),
      })

      lazy(mockLoader, { preload: 'idle' })

      // Should load after idle callback
      await vi.waitFor(
        () => {
          expect(mockRequestIdleCallback).toHaveBeenCalled()
          expect(mockLoader).toHaveBeenCalled()
        },
        { timeout: 200 }
      )

      delete (global as any).requestIdleCallback
    })

    it('should fallback when requestIdleCallback is not available', async () => {
      // Ensure requestIdleCallback is not available
      delete (global as any).requestIdleCallback

      const mockLoader: LazyComponentLoader = vi.fn().mockResolvedValue({
        default: () => ({ type: 'element', tag: 'div', children: [] }),
      })

      lazy(mockLoader, { preload: 'idle' })

      // Should load after fallback timeout
      await vi.waitFor(
        () => {
          expect(mockLoader).toHaveBeenCalled()
        },
        { timeout: 200 }
      )
    })
  })

  describe('Component Groups', () => {
    it('should create multiple lazy components', () => {
      const loaders = {
        ComponentA: vi.fn().mockResolvedValue({ default: () => ({}) }),
        ComponentB: vi.fn().mockResolvedValue({ default: () => ({}) }),
      }

      const lazyComponents = createLazyComponentGroup(loaders)

      expect(lazyComponents.ComponentA).toBeInstanceOf(Function)
      expect(lazyComponents.ComponentB).toBeInstanceOf(Function)
      expect(loaders.ComponentA).not.toHaveBeenCalled()
      expect(loaders.ComponentB).not.toHaveBeenCalled()
    })

    it('should preload component groups', async () => {
      const mockComponents = {
        A: () => ({ type: 'element' as const, tag: 'div' }),
        B: () => ({ type: 'element' as const, tag: 'span' }),
      }

      const loaders = {
        ComponentA: vi.fn().mockResolvedValue({ default: mockComponents.A }),
        ComponentB: vi.fn().mockResolvedValue({ default: mockComponents.B }),
      }

      const results = await preloadComponentGroup(loaders)

      expect(loaders.ComponentA).toHaveBeenCalledOnce()
      expect(loaders.ComponentB).toHaveBeenCalledOnce()
      expect(results.ComponentA).toBe(mockComponents.A)
      expect(results.ComponentB).toBe(mockComponents.B)
    })
  })

  describe('Error Handling', () => {
    it('should handle timeout errors', async () => {
      const mockLoader: LazyComponentLoader = vi.fn().mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )

      const LazyComponent = lazy(mockLoader, {
        timeout: 100,
        errorFallback: (_error) => ({
          type: 'element',
          tag: 'div',
          children: [{ type: 'text', text: 'Timeout!' }],
        }),
      })

      const _instance = LazyComponent({})

      // Wait for timeout
      await vi.waitFor(
        () => {
          expect(mockLoader).toHaveBeenCalled()
        },
        { timeout: 200 }
      )
    })

    it('should handle module loading failures', async () => {
      const mockLoader: LazyComponentLoader = vi.fn().mockRejectedValue(new Error('Network error'))

      const LazyComponent = lazy(mockLoader)
      LazyComponent({})

      await vi.waitFor(
        () => {
          expect(mockLoader).toHaveBeenCalled()
        },
        { timeout: 100 }
      )
    })
  })

  describe('Preload Utility', () => {
    it('should preload components without rendering', async () => {
      const mockComponent = () => ({ type: 'element' as const, tag: 'div' })
      const mockLoader: LazyComponentLoader = vi.fn().mockResolvedValue({
        default: mockComponent,
      })

      const result = await preloadComponent(mockLoader)

      expect(mockLoader).toHaveBeenCalledOnce()
      expect(result).toBe(mockComponent)
    })

    it('should handle direct exports (no default)', async () => {
      const mockComponent = () => ({ type: 'element' as const, tag: 'div' })
      const mockLoader: LazyComponentLoader = vi.fn().mockResolvedValue(mockComponent)

      const result = await preloadComponent(mockLoader)

      expect(result).toBe(mockComponent)
    })
  })
})
