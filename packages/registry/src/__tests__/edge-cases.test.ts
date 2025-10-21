/**
 * Edge Cases & Boundary Conditions Tests
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  registerModifier,
  registerLazyModifier,
  hasModifier,
  getModifier,
  getModifierAsync,
  listModifiers,
  validateRegistry,
  clearRegistry,
  resetRegistry,
  createIsolatedRegistry
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

describe('Edge Cases & Boundary Conditions', () => {
  beforeEach(() => {
    clearRegistry()
  })

  describe('Name Validation', () => {
    it('should handle empty string names', () => {
      registerModifier('', createTestModifier(''))
      expect(hasModifier('')).toBe(true)
    })

    it('should handle names with special characters', () => {
      const names = ['mod-name', 'mod_name', 'mod.name', 'mod:name', 'mod@name']

      names.forEach(name => {
        registerModifier(name, createTestModifier(name))
      })

      names.forEach(name => {
        expect(hasModifier(name)).toBe(true)
      })
    })

    it('should handle very long names', () => {
      const longName = 'a'.repeat(1000)
      registerModifier(longName, createTestModifier(longName))
      expect(hasModifier(longName)).toBe(true)
    })

    it('should handle unicode names', () => {
      const unicodeName = '修飾符'
      registerModifier(unicodeName, createTestModifier(unicodeName))
      expect(hasModifier(unicodeName)).toBe(true)
    })

    it('should handle emoji names', () => {
      registerModifier('🎨', createTestModifier('🎨'))
      expect(hasModifier('🎨')).toBe(true)
    })

    it('should treat names as case-sensitive', () => {
      registerModifier('MyModifier', createTestModifier('upper'))
      registerModifier('mymodifier', createTestModifier('lower'))

      expect(hasModifier('MyModifier')).toBe(true)
      expect(hasModifier('mymodifier')).toBe(true)
      expect(listModifiers()).toHaveLength(2)
    })

    it('should handle names with whitespace', () => {
      registerModifier('mod name', createTestModifier('space'))
      registerModifier('  leadingSpace', createTestModifier('leading'))
      registerModifier('trailingSpace  ', createTestModifier('trailing'))

      expect(hasModifier('mod name')).toBe(true)
      expect(hasModifier('  leadingSpace')).toBe(true)
      expect(hasModifier('trailingSpace  ')).toBe(true)
    })
  })

  describe('Duplicate Detection', () => {
    it('should not report duplicates in validateRegistry for normal usage', () => {
      registerModifier('dup', createTestModifier('dup1'))

      const health = validateRegistry()
      expect(health.duplicateNames).toEqual([])
    })

    it('should overwrite on duplicate registration', () => {
      const factory1 = createTestModifier('v1')
      const factory2 = createTestModifier('v2')

      registerModifier('dup', factory1)
      registerModifier('dup', factory2)

      expect(getModifier('dup')).toBe(factory2)
    })

    it('should handle overwrite with same factory', () => {
      const factory = createTestModifier('test')

      registerModifier('test', factory)
      registerModifier('test', factory)

      expect(getModifier('test')).toBe(factory)
      expect(listModifiers()).toHaveLength(1)
    })
  })

  describe('Large Scale Operations', () => {
    it('should handle 1000+ modifiers', () => {
      const count = 1000

      for (let i = 0; i < count; i++) {
        registerModifier(`mod${i}`, createTestModifier(`mod${i}`))
      }

      expect(listModifiers()).toHaveLength(count)
      expect(validateRegistry().totalModifiers).toBe(count)
    })

    it('should maintain performance with large registry', () => {
      const count = 500

      for (let i = 0; i < count; i++) {
        registerModifier(`mod${i}`, createTestModifier(`mod${i}`))
      }

      const start = performance.now()
      const exists = hasModifier('mod250')
      const duration = performance.now() - start

      expect(exists).toBe(true)
      expect(duration).toBeLessThan(1) // Should be instant
    })

    it('should list modifiers efficiently', () => {
      for (let i = 0; i < 500; i++) {
        registerModifier(`mod${i}`, createTestModifier(`mod${i}`))
      }

      const start = performance.now()
      const list = listModifiers()
      const duration = performance.now() - start

      expect(list).toHaveLength(500)
      expect(duration).toBeLessThan(10) // Should be fast
    })
  })

  describe('Clear and Reset Behaviors', () => {
    it('should clear lazily registered but not loaded modifiers', () => {
      registerLazyModifier('lazy1', () => createTestModifier('lazy1'))
      registerLazyModifier('lazy2', () => createTestModifier('lazy2'))

      clearRegistry()

      expect(listModifiers()).toHaveLength(0)
    })

    it('should clear loading promises', async () => {
      registerLazyModifier('async', async () => {
        await delay(100)
        return createTestModifier('async')
      })

      // Start loading
      getModifierAsync('async')

      // Clear immediately
      clearRegistry()

      expect(listModifiers()).toHaveLength(0)
    })

    it('should allow re-registration after clear', () => {
      registerModifier('mod', createTestModifier('v1'))
      clearRegistry()
      registerModifier('mod', createTestModifier('v2'))

      expect(hasModifier('mod')).toBe(true)
    })

    it('should handle reset in test environment', () => {
      registerModifier('test', createTestModifier('test'))
      expect(listModifiers()).toHaveLength(1)

      resetRegistry()

      expect(listModifiers()).toHaveLength(0)
    })

    it('should support multiple clear operations', () => {
      registerModifier('mod', createTestModifier('mod'))
      clearRegistry()
      clearRegistry()
      clearRegistry()

      expect(listModifiers()).toHaveLength(0)
    })
  })

  describe('Isolated Registry Edge Cases', () => {
    it('should create multiple isolated registries', () => {
      const iso1 = createIsolatedRegistry()
      const iso2 = createIsolatedRegistry()
      const iso3 = createIsolatedRegistry()

      iso1.register('mod1', createTestModifier('mod1'))
      iso2.register('mod2', createTestModifier('mod2'))
      iso3.register('mod3', createTestModifier('mod3'))

      expect(iso1.has('mod1')).toBe(true)
      expect(iso1.has('mod2')).toBe(false)
      expect(iso2.has('mod2')).toBe(true)
      expect(iso2.has('mod3')).toBe(false)
      expect(iso3.has('mod3')).toBe(true)
    })

    it('should handle lazy loading in isolated registry', async () => {
      const isolated = createIsolatedRegistry()

      isolated.registerLazy('lazy', async () => {
        await delay(10)
        return createTestModifier('lazy')
      })

      const factory = await isolated.get('lazy', { async: true })
      expect(factory).toBeDefined()
      expect(hasModifier('lazy')).toBe(false) // Not in global
    })

    it('should allow independent operations on isolated registries', () => {
      const iso1 = createIsolatedRegistry()
      const iso2 = createIsolatedRegistry()

      iso1.register('shared', createTestModifier('iso1'))
      iso2.register('shared', createTestModifier('iso2'))

      expect(iso1.has('shared')).toBe(true)
      expect(iso2.has('shared')).toBe(true)
      expect(iso1.get('shared')).not.toBe(iso2.get('shared'))
    })
  })

  describe('Environment Guards', () => {
    it('should throw on clearRegistry in production', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      expect(() => clearRegistry()).toThrow('not available in production')

      process.env.NODE_ENV = originalEnv
    })

    it('should throw on resetRegistry outside test', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      expect(() => resetRegistry()).toThrow('only available in test environment')

      process.env.NODE_ENV = originalEnv
    })

    it('should throw on createIsolatedRegistry outside test', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      expect(() => createIsolatedRegistry()).toThrow('only available in test environment')

      process.env.NODE_ENV = originalEnv
    })
  })

  describe('Boundary Value Tests', () => {
    it('should handle zero modifiers', () => {
      expect(listModifiers()).toHaveLength(0)
      expect(validateRegistry().totalModifiers).toBe(0)
    })

    it('should handle single modifier', () => {
      registerModifier('single', createTestModifier('single'))

      expect(listModifiers()).toHaveLength(1)
      expect(hasModifier('single')).toBe(true)
    })

    it('should handle alternating register/clear operations', () => {
      for (let i = 0; i < 10; i++) {
        registerModifier(`mod${i}`, createTestModifier(`mod${i}`))
        expect(listModifiers()).toHaveLength(1)
        clearRegistry()
        expect(listModifiers()).toHaveLength(0)
      }
    })
  })
})
