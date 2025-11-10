/**
 * Performance Characteristics Tests
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  globalModifierRegistry,
  registerModifier,
  registerLazyModifier,
  hasModifier,
  getModifier,
  getModifierAsync,
  listModifiers,
  clearRegistry
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

describe('Performance Characteristics', () => {
  beforeEach(() => {
    clearRegistry()
  })

  describe('Registration Performance', () => {
    it('should register 1000 modifiers quickly', () => {
      const start = performance.now()

      for (let i = 0; i < 1000; i++) {
        registerModifier(`mod${i}`, createTestModifier(`mod${i}`))
      }

      const duration = performance.now() - start

      expect(duration).toBeLessThan(100) // Should be under 100ms
      expect(listModifiers()).toHaveLength(1000)
    })

    it('should register lazy loaders with minimal overhead', () => {
      const start = performance.now()

      for (let i = 0; i < 1000; i++) {
        registerLazyModifier(`lazy${i}`, () => createTestModifier(`lazy${i}`))
      }

      const duration = performance.now() - start

      expect(duration).toBeLessThan(50) // Should be faster than eager
    })
  })

  describe('Lookup Performance', () => {
    beforeEach(() => {
      // Populate registry
      for (let i = 0; i < 1000; i++) {
        registerModifier(`mod${i}`, createTestModifier(`mod${i}`))
      }
    })

    it('should find modifiers in constant time', () => {
      const times: number[] = []

      for (let i = 0; i < 100; i++) {
        const start = performance.now()
        hasModifier(`mod${Math.floor(Math.random() * 1000)}`)
        times.push(performance.now() - start)
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length
      expect(avgTime).toBeLessThan(0.1) // Should be < 0.1ms
    })

    it('should get modifiers in constant time', () => {
      const times: number[] = []

      for (let i = 0; i < 100; i++) {
        const start = performance.now()
        getModifier(`mod${Math.floor(Math.random() * 1000)}`)
        times.push(performance.now() - start)
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length
      expect(avgTime).toBeLessThan(0.1)
    })
  })

  describe('List Performance', () => {
    it('should list 1000 modifiers quickly', () => {
      for (let i = 0; i < 1000; i++) {
        registerModifier(`mod${i}`, createTestModifier(`mod${i}`))
      }

      const start = performance.now()
      const list = listModifiers()
      const duration = performance.now() - start

      expect(list).toHaveLength(1000)
      expect(duration).toBeLessThan(5) // Should be under 5ms
    })
  })

  describe('Clear Performance', () => {
    it('should clear 1000 modifiers quickly', () => {
      for (let i = 0; i < 1000; i++) {
        registerModifier(`mod${i}`, createTestModifier(`mod${i}`))
      }

      const start = performance.now()
      clearRegistry()
      const duration = performance.now() - start

      expect(duration).toBeLessThan(10) // Should be under 10ms
      expect(listModifiers()).toHaveLength(0)
    })
  })

  describe('Memory Efficiency', () => {
    it('should not leak memory on repeated clear/register cycles', () => {
      const iterations = 100

      for (let cycle = 0; cycle < iterations; cycle++) {
        for (let i = 0; i < 100; i++) {
          registerModifier(`mod${i}`, createTestModifier(`mod${i}`))
        }
        clearRegistry()
      }

      // If we get here without crashing, memory management is working
      expect(listModifiers()).toHaveLength(0)
    })

    it('should clean up lazy loaders after loading', async () => {
      for (let i = 0; i < 100; i++) {
        registerLazyModifier(`lazy${i}`, async () => {
          await delay(1)
          return createTestModifier(`lazy${i}`)
        })
      }

      // Load all
      await Promise.all(
        Array.from({ length: 100 }, (_, i) => getModifierAsync(`lazy${i}`))
      )

      const diagnostics = (globalModifierRegistry as any).getDiagnostics()
      expect(diagnostics.lazyLoaderCount).toBe(0)
      expect(diagnostics.modifierCount).toBe(100)
    })
  })

  describe('Validation Performance', () => {
    it('should validate large registry quickly', () => {
      for (let i = 0; i < 1000; i++) {
        registerModifier(`mod${i}`, createTestModifier(`mod${i}`))
      }

      const start = performance.now()
      const health = (globalModifierRegistry as any).validateRegistry()
      const duration = performance.now() - start

      expect(duration).toBeLessThan(20) // Should be under 20ms
      expect(health.totalModifiers).toBe(1000)
    })
  })

  describe('Scalability', () => {
    it('should handle increasing load gracefully', () => {
      const sizes = [100, 500, 1000, 2000]
      const durations: number[] = []

      sizes.forEach(size => {
        clearRegistry()

        const start = performance.now()
        for (let i = 0; i < size; i++) {
          registerModifier(`mod${i}`, createTestModifier(`mod${i}`))
        }
        const duration = performance.now() - start
        durations.push(duration / size) // Time per registration

        expect(listModifiers()).toHaveLength(size)
      })

      // Check that time per operation doesn't grow significantly
      const firstAvg = durations[0]
      const lastAvg = durations[durations.length - 1]
      expect(lastAvg).toBeLessThan(firstAvg * 4) // Allow up to 4x variation
    })
  })
})
