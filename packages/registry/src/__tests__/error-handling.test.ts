/**
 * Error Handling Tests
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
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

describe('Error Handling', () => {
  beforeEach(() => {
    clearRegistry()
  })

  describe('Loader Errors', () => {
    it('should handle synchronous loader errors', () => {
      registerLazyModifier('error', () => {
        throw new Error('Sync load error')
      })

      const factory = getModifier('error')
      expect(factory).toBeUndefined()
      expect(hasModifier('error')).toBe(true) // Loader still registered
    })

    it('should handle async loader errors', async () => {
      registerLazyModifier('asyncError', async () => {
        await delay(10)
        throw new Error('Async load error')
      })

      await expect(getModifierAsync('asyncError')).rejects.toThrow('Async load error')
    })

    it('should allow retry after failed load', async () => {
      let attempts = 0

      registerLazyModifier('retry', async () => {
        attempts++
        if (attempts === 1) {
          throw new Error('First attempt')
        }
        return createTestModifier('retry')
      })

      await expect(getModifierAsync('retry')).rejects.toThrow('First attempt')

      // Retry (loader is gone, need to re-register)
      registerLazyModifier('retry', async () => createTestModifier('retry'))
      const factory = await getModifierAsync('retry')

      expect(factory).toBeDefined()
    })

    it('should not cache failed loads', async () => {
      let attempts = 0

      registerLazyModifier('fail', async () => {
        attempts++
        throw new Error(`Attempt ${attempts}`)
      })

      await expect(getModifierAsync('fail')).rejects.toThrow('Attempt 1')

      // Re-register same loader
      registerLazyModifier('fail', async () => {
        attempts++
        throw new Error(`Attempt ${attempts}`)
      })

      await expect(getModifierAsync('fail')).rejects.toThrow('Attempt 2')
      expect(attempts).toBe(2)
    })

    it('should handle loader returning null', () => {
      registerLazyModifier('null', () => null as any)

      const factory = getModifier('null')
      expect(factory).toBe(null)
    })

    it('should handle loader returning undefined', () => {
      registerLazyModifier('undefined', () => undefined as any)

      const factory = getModifier('undefined')
      expect(factory).toBe(undefined)
    })
  })

  describe('Invalid Inputs', () => {
    it('should handle null factory', () => {
      expect(() => {
        registerModifier('null', null as any)
      }).not.toThrow() // Map accepts any value

      expect(hasModifier('null')).toBe(true)
    })

    it('should handle undefined factory', () => {
      registerModifier('undefined', undefined as any)
      expect(hasModifier('undefined')).toBe(true)
    })

    it('should handle non-function factory', () => {
      registerModifier('invalid', { not: 'a function' } as any)
      expect(hasModifier('invalid')).toBe(true)

      // Getting it won't work properly but registry stores it
      const factory = getModifier('invalid')
      expect(factory).toBeDefined()
    })
  })

  describe('Type System Edge Cases', () => {
    it('should handle generic type mismatches', () => {
      interface Props1 { value: string }
      interface Props2 { value: number }

      const factory = createTestModifier('typed') as ModifierFactory<Props1>
      registerModifier<Props2>('typed', factory as any)

      // TypeScript type system allows this at compile time
      // Runtime should handle gracefully
      expect(hasModifier('typed')).toBe(true)
    })

    it('should handle modifier without apply method', () => {
      const invalidModifier = {
        type: 'invalid',
        priority: 100,
        properties: {},
        // missing apply method
      }

      registerModifier('invalid', (() => invalidModifier) as any)

      const factory = getModifier('invalid')
      expect(factory).toBeDefined()
    })
  })

  describe('Concurrent Error Scenarios', () => {
    it('should handle multiple simultaneous load failures', async () => {
      registerLazyModifier('failing', async () => {
        await delay(10)
        throw new Error('Load failed')
      })

      const results = await Promise.allSettled([
        getModifierAsync('failing'),
        getModifierAsync('failing'),
        getModifierAsync('failing')
      ])

      expect(results.every(r => r.status === 'rejected')).toBe(true)
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

    it('should handle mixed success and failure in concurrent loads', async () => {
      registerLazyModifier('working', async () => createTestModifier('working'))
      registerLazyModifier('failing', async () => {
        throw new Error('Failed')
      })

      const results = await Promise.allSettled([
        getModifierAsync('working'),
        getModifierAsync('failing')
      ])

      expect(results[0].status).toBe('fulfilled')
      expect(results[1].status).toBe('rejected')
    })
  })
})
