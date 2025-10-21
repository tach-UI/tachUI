/**
 * Lazy Loading Tests
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  registerModifier,
  registerLazyModifier,
  hasModifier,
  getModifier,
  getModifierAsync,
  listModifiers,
  clearRegistry,
  globalModifierRegistry
} from '../index'
import type { ModifierFactory } from '../types'

// Helper function for delays
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Mock modifier factory for testing
const createTestModifier = (name: string): ModifierFactory<{ value: string }> =>
  ({ value }) => ({
    type: name,
    priority: 100,
    properties: { value },
    apply: (node) => node
  })

describe('Lazy Loading', () => {
  beforeEach(() => {
    clearRegistry()
  })

  describe('registerLazy()', () => {
    it('should register lazy loader without executing it', () => {
      let executed = false
      const loader = () => {
        executed = true
        return createTestModifier('lazy')
      }

      registerLazyModifier('lazy', loader)
      expect(executed).toBe(false)
      expect(hasModifier('lazy')).toBe(true)
    })

    it('should not overwrite eager registration with lazy', () => {
      const eagerFactory = createTestModifier('eager')
      registerModifier('eager', eagerFactory)

      const lazyFactory = createTestModifier('lazy')
      registerLazyModifier('eager', () => lazyFactory)

      expect(getModifier('eager')).toBe(eagerFactory)
      expect(getModifier('eager')).not.toBe(lazyFactory)
    })

    it('should handle async loader functions', () => {
      registerLazyModifier('async', async () => {
        await delay(10)
        return createTestModifier('async')
      })

      expect(hasModifier('async')).toBe(true)
    })

    it('should register multiple lazy loaders', () => {
      registerLazyModifier('lazy1', () => createTestModifier('lazy1'))
      registerLazyModifier('lazy2', () => createTestModifier('lazy2'))
      registerLazyModifier('lazy3', () => createTestModifier('lazy3'))

      expect(listModifiers()).toHaveLength(3)
      expect(hasModifier('lazy1')).toBe(true)
      expect(hasModifier('lazy2')).toBe(true)
      expect(hasModifier('lazy3')).toBe(true)
    })
  })

  describe('get() with lazy loading', () => {
    it('should load modifier on first get() call', () => {
      let loadCount = 0
      registerLazyModifier('lazy', () => {
        loadCount++
        return createTestModifier('lazy')
      })

      getModifier('lazy')
      expect(loadCount).toBe(1)
    })

    it('should cache loaded modifier', () => {
      let loadCount = 0
      registerLazyModifier('lazy', () => {
        loadCount++
        return createTestModifier('lazy')
      })

      getModifier('lazy')
      getModifier('lazy')
      getModifier('lazy')

      expect(loadCount).toBe(1) // Only loaded once
    })

    it('should remove lazy loader after loading', () => {
      registerLazyModifier('lazy', () => createTestModifier('lazy'))

      const diagnostics1 = (globalModifierRegistry as any).getDiagnostics()
      expect(diagnostics1.lazyLoaderCount).toBe(1)

      getModifier('lazy')

      const diagnostics2 = (globalModifierRegistry as any).getDiagnostics()
      expect(diagnostics2.lazyLoaderCount).toBe(0)
      expect(diagnostics2.modifierCount).toBe(1)
    })

    it('should handle sync loader returning modifier', () => {
      registerLazyModifier('sync', () => createTestModifier('sync'))
      const factory = getModifier('sync')
      expect(factory).toBeDefined()
    })

    it('should return loaded factory from cache', () => {
      const factory = createTestModifier('test')
      registerLazyModifier('test', () => factory)

      const loaded1 = getModifier('test')
      const loaded2 = getModifier('test')

      expect(loaded1).toBe(factory)
      expect(loaded2).toBe(factory)
      expect(loaded1).toBe(loaded2)
    })
  })

  describe('getAsync()', () => {
    it('should load async modifiers', async () => {
      registerLazyModifier('async', async () => {
        await delay(10)
        return createTestModifier('async')
      })

      const factory = await getModifierAsync('async')
      expect(factory).toBeDefined()
    })

    it('should cache loading promises', async () => {
      let loadCount = 0
      registerLazyModifier('async', async () => {
        loadCount++
        await delay(50)
        return createTestModifier('async')
      })

      // Start multiple loads simultaneously
      const [f1, f2, f3] = await Promise.all([
        getModifierAsync('async'),
        getModifierAsync('async'),
        getModifierAsync('async')
      ])

      expect(loadCount).toBe(1) // Only loaded once
      expect(f1).toBe(f2)
      expect(f2).toBe(f3)
    })

    it('should return undefined for non-existent async modifier', async () => {
      const factory = await getModifierAsync('nonexistent')
      expect(factory).toBeUndefined()
    })

    it('should handle loader errors gracefully', async () => {
      registerLazyModifier('error', async () => {
        throw new Error('Load failed')
      })

      await expect(getModifierAsync('error')).rejects.toThrow('Load failed')
    })

    it('should remove loading promise after completion', async () => {
      registerLazyModifier('async', async () => {
        await delay(10)
        return createTestModifier('async')
      })

      await getModifierAsync('async')

      // Second call should not use loading promise
      const factory = await getModifierAsync('async')
      expect(factory).toBeDefined()
    })

    it('should handle sync loader via async get', async () => {
      registerLazyModifier('sync', () => createTestModifier('sync'))

      const factory = await getModifierAsync('sync')
      expect(factory).toBeDefined()
    })

    it('should handle multiple async loaders concurrently', async () => {
      registerLazyModifier('async1', async () => {
        await delay(20)
        return createTestModifier('async1')
      })
      registerLazyModifier('async2', async () => {
        await delay(15)
        return createTestModifier('async2')
      })
      registerLazyModifier('async3', async () => {
        await delay(10)
        return createTestModifier('async3')
      })

      const [f1, f2, f3] = await Promise.all([
        getModifierAsync('async1'),
        getModifierAsync('async2'),
        getModifierAsync('async3')
      ])

      expect(f1).toBeDefined()
      expect(f2).toBeDefined()
      expect(f3).toBeDefined()
    })
  })

  describe('Lazy Loading Edge Cases', () => {
    it('should handle loader throwing sync error', () => {
      registerLazyModifier('error', () => {
        throw new Error('Sync error')
      })

      const factory = getModifier('error')
      expect(factory).toBeUndefined()
    })

    it('should list both loaded and lazy modifiers', () => {
      registerModifier('loaded', createTestModifier('loaded'))
      registerLazyModifier('lazy', () => createTestModifier('lazy'))

      const list = listModifiers()
      expect(list).toContain('loaded')
      expect(list).toContain('lazy')
      expect(list).toHaveLength(2)
    })

    it('should report correct count in validateRegistry', () => {
      registerModifier('loaded1', createTestModifier('loaded1'))
      registerModifier('loaded2', createTestModifier('loaded2'))
      registerLazyModifier('lazy1', () => createTestModifier('lazy1'))
      registerLazyModifier('lazy2', () => createTestModifier('lazy2'))

      const health = (globalModifierRegistry as any).validateRegistry()
      expect(health.totalModifiers).toBe(4)
    })

    it('should handle mixed eager and lazy with same names', () => {
      registerLazyModifier('test', () => createTestModifier('lazy'))
      expect(hasModifier('test')).toBe(true)

      // Overwrite with eager
      const eagerFactory = createTestModifier('eager')
      registerModifier('test', eagerFactory)

      expect(getModifier('test')).toBe(eagerFactory)
    })

    it('should clear both loaded and lazy modifiers', () => {
      registerModifier('loaded', createTestModifier('loaded'))
      registerLazyModifier('lazy', () => createTestModifier('lazy'))

      expect(listModifiers()).toHaveLength(2)

      clearRegistry()

      expect(listModifiers()).toHaveLength(0)
      expect(hasModifier('loaded')).toBe(false)
      expect(hasModifier('lazy')).toBe(false)
    })

    it('should support re-registration after load', () => {
      const factory1 = createTestModifier('v1')
      registerLazyModifier('test', () => factory1)

      getModifier('test')
      expect(getModifier('test')).toBe(factory1)

      const factory2 = createTestModifier('v2')
      registerModifier('test', factory2)

      expect(getModifier('test')).toBe(factory2)
    })
  })
})
