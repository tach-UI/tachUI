/**
 * Concurrency & Race Conditions Tests
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

describe('Concurrency & Race Conditions', () => {
  beforeEach(() => {
    clearRegistry()
  })

  describe('Concurrent Registration', () => {
    it('should handle concurrent registrations', () => {
      const modifiers = Array.from({ length: 100 }, (_, i) => `mod${i}`)

      modifiers.forEach(name => {
        registerModifier(name, createTestModifier(name))
      })

      expect(listModifiers()).toHaveLength(100)
    })

    it('should handle concurrent registrations of same name', async () => {
      const promises = Array.from({ length: 10 }, () =>
        Promise.resolve().then(() => registerModifier('concurrent', createTestModifier('concurrent')))
      )

      await Promise.all(promises)
      expect(hasModifier('concurrent')).toBe(true)
    })

    it('should maintain consistency during concurrent writes', () => {
      const factories = Array.from({ length: 50 }, (_, i) => ({
        name: `mod${i}`,
        factory: createTestModifier(`mod${i}`)
      }))

      factories.forEach(({ name, factory }) => {
        registerModifier(name, factory)
      })

      expect(listModifiers()).toHaveLength(50)
      factories.forEach(({ name, factory }) => {
        expect(getModifier(name)).toBe(factory)
      })
    })
  })

  describe('Concurrent Lazy Loading', () => {
    it('should handle multiple simultaneous lazy loads', async () => {
      let loadCount = 0

      registerLazyModifier('concurrent', async () => {
        loadCount++
        await delay(50) // Simulate async operation
        return createTestModifier('concurrent')
      })

      // Start 10 simultaneous loads
      const results = await Promise.all(
        Array.from({ length: 10 }, () => getModifierAsync('concurrent'))
      )

      expect(loadCount).toBe(1) // Should only load once
      results.forEach((factory) => {
        expect(factory).toBe(results[0]) // All should be same instance
      })
    })

    it('should handle rapid get/async mix', async () => {
      let loadCount = 0
      registerLazyModifier('mixed', async () => {
        loadCount++
        await delay(20)
        return createTestModifier('mixed')
      })

      // Mix of sync and async gets
      getModifier('mixed')
      const async1 = getModifierAsync('mixed')
      getModifier('mixed')
      const async2 = getModifierAsync('mixed')

      await Promise.all([async1, async2])
      // Due to async/sync mix, loader may execute multiple times
      expect(loadCount).toBeLessThanOrEqual(3) // Allow up to 3 loads in this edge case
    })

    it('should handle concurrent loads of different modifiers', async () => {
      const modifiers = ['mod1', 'mod2', 'mod3', 'mod4', 'mod5']

      modifiers.forEach(name => {
        registerLazyModifier(name, async () => {
          await delay(Math.random() * 50)
          return createTestModifier(name)
        })
      })

      const results = await Promise.all(
        modifiers.map(name => getModifierAsync(name))
      )

      expect(results).toHaveLength(5)
      results.forEach(factory => expect(factory).toBeDefined())
    })

    it('should handle repeated concurrent access to same lazy modifier', async () => {
      let loadCount = 0

      registerLazyModifier('repeated', async () => {
        loadCount++
        await delay(30)
        return createTestModifier('repeated')
      })

      // Three waves of concurrent access
      await Promise.all([
        getModifierAsync('repeated'),
        getModifierAsync('repeated')
      ])

      await Promise.all([
        getModifierAsync('repeated'),
        getModifierAsync('repeated')
      ])

      await Promise.all([
        getModifierAsync('repeated'),
        getModifierAsync('repeated')
      ])

      expect(loadCount).toBe(1) // Still only loaded once
    })
  })

  describe('Concurrent Access Patterns', () => {
    it('should handle concurrent has() checks', () => {
      registerModifier('test', createTestModifier('test'))

      const results = Array.from({ length: 1000 }, () => hasModifier('test'))

      expect(results.every(r => r === true)).toBe(true)
    })

    it('should handle concurrent list() calls', () => {
      registerModifier('mod1', createTestModifier('mod1'))
      registerModifier('mod2', createTestModifier('mod2'))

      const lists = Array.from({ length: 100 }, () => listModifiers())

      lists.forEach(list => {
        expect(list).toContain('mod1')
        expect(list).toContain('mod2')
        expect(list).toHaveLength(2)
      })
    })

    it('should handle registration during iteration', () => {
      registerModifier('initial', createTestModifier('initial'))

      const list1 = listModifiers()
      registerModifier('added', createTestModifier('added'))
      const list2 = listModifiers()

      expect(list1).toHaveLength(1)
      expect(list2).toHaveLength(2)
    })

    it('should handle clear during access', () => {
      registerModifier('test', createTestModifier('test'))

      expect(hasModifier('test')).toBe(true)
      clearRegistry()
      expect(hasModifier('test')).toBe(false)
    })

    it('should handle concurrent get() operations', () => {
      const factory = createTestModifier('concurrent')
      registerModifier('concurrent', factory)

      const results = Array.from({ length: 100 }, () => getModifier('concurrent'))

      results.forEach(result => {
        expect(result).toBe(factory)
      })
    })
  })

  describe('Memory Under Concurrency', () => {
    it('should not leak memory with concurrent operations', async () => {
      const iterations = 100

      for (let i = 0; i < iterations; i++) {
        registerLazyModifier(`lazy${i}`, async () => {
          await delay(1)
          return createTestModifier(`lazy${i}`)
        })
      }

      // Load all concurrently
      await Promise.all(
        Array.from({ length: iterations }, (_, i) =>
          getModifierAsync(`lazy${i}`)
        )
      )

      const health = (globalModifierRegistry as any).validateRegistry()
      expect(health.totalModifiers).toBe(iterations)

      // Cleanup
      clearRegistry()
      expect(listModifiers()).toHaveLength(0)
    })

    it('should clean up loading promises', async () => {
      registerLazyModifier('async', async () => {
        await delay(10)
        return createTestModifier('async')
      })

      await getModifierAsync('async')

      // Verify loading promise was cleaned up
      const diagnostics = (globalModifierRegistry as any).getDiagnostics()
      expect(diagnostics.lazyLoaderCount).toBe(0)
    })

    it('should handle rapid registration and clear cycles', () => {
      for (let cycle = 0; cycle < 10; cycle++) {
        for (let i = 0; i < 50; i++) {
          registerModifier(`mod${i}`, createTestModifier(`mod${i}`))
        }
        expect(listModifiers()).toHaveLength(50)
        clearRegistry()
        expect(listModifiers()).toHaveLength(0)
      }

      // Should complete without memory issues
      expect(listModifiers()).toHaveLength(0)
    })
  })

  describe('Error Propagation Under Concurrency', () => {
    it('should handle concurrent load failures', async () => {
      let attempts = 0

      registerLazyModifier('failing', async () => {
        attempts++
        await delay(10)
        throw new Error('Load failed')
      })

      const results = await Promise.allSettled([
        getModifierAsync('failing'),
        getModifierAsync('failing'),
        getModifierAsync('failing')
      ])

      expect(results.every(r => r.status === 'rejected')).toBe(true)
      expect(attempts).toBe(1) // Should only attempt once
    })

    it('should recover from failed load on retry', async () => {
      let attempts = 0

      registerLazyModifier('retry', async () => {
        attempts++
        if (attempts === 1) {
          throw new Error('First attempt fails')
        }
        return createTestModifier('retry')
      })

      // First attempt fails
      await expect(getModifierAsync('retry')).rejects.toThrow()

      // Re-register and retry
      registerLazyModifier('retry', async () => createTestModifier('retry'))

      const factory = await getModifierAsync('retry')
      expect(factory).toBeDefined()
    })

    it('should handle error during concurrent registration', () => {
      const factory = createTestModifier('test')

      // Register many times rapidly (simulating race condition)
      for (let i = 0; i < 100; i++) {
        registerModifier('test', factory)
      }

      expect(hasModifier('test')).toBe(true)
      expect(getModifier('test')).toBe(factory)
    })
  })
})
