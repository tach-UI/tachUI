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

    /**
     * Median lookup cost over `samples` runs.
     *
     * A mean is the wrong summary for wall-clock timing: noise only ever
     * makes a run slower, so one GC pause among a hundred samples is enough
     * to move it past a 0.1ms budget on its own — which is how this flaked
     * (0.181 against 0.1) while every individual lookup was fast. The median
     * says what "constant time" is actually claiming: the typical lookup,
     * not the unluckiest one.
     */
    function medianLookupTime(lookup: (name: string) => unknown): number {
      const name = (): string => `mod${Math.floor(Math.random() * 1000)}`
      // Warm-up: discard JIT and cold-cache costs so the timed runs measure
      // steady state.
      for (let i = 0; i < 20; i++) {
        lookup(name())
      }

      const times: number[] = []
      for (let i = 0; i < 100; i++) {
        const start = performance.now()
        lookup(name())
        times.push(performance.now() - start)
      }
      times.sort((a, b) => a - b)
      return times[Math.floor(times.length / 2)]!
    }

    it('should find modifiers in constant time', () => {
      expect(medianLookupTime(hasModifier)).toBeLessThan(0.1) // Should be < 0.1ms
    })

    it('should get modifiers in constant time', () => {
      expect(medianLookupTime(getModifier)).toBeLessThan(0.1)
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
      const runsPerSize = 5

      sizes.forEach(size => {
        const perRunDurations: number[] = []

        for (let run = 0; run < runsPerSize; run++) {
          clearRegistry()

          const start = performance.now()
          for (let i = 0; i < size; i++) {
            registerModifier(`mod${i}`, createTestModifier(`mod${i}`))
          }
          const duration = performance.now() - start
          perRunDurations.push(duration / size) // Time per registration
        }

        // Use median to reduce sensitivity to scheduler jitter in CI.
        perRunDurations.sort((a, b) => a - b)
        const medianDuration = perRunDurations[Math.floor(perRunDurations.length / 2)]
        durations.push(medianDuration)

        expect(listModifiers()).toHaveLength(size)
      })

      // Check that time per operation doesn't grow significantly
      const firstAvg = Math.max(durations[0], 0.01) // Protect against sub-ms timer quantization noise.
      const lastAvg = durations[durations.length - 1]
      expect(lastAvg).toBeLessThan(firstAvg * 8) // Allow for normal CI variability while catching superlinear growth.
    })
  })
})
