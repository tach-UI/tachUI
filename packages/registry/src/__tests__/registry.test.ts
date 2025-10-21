/**
 * Registry Tests
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { 
  globalModifierRegistry,
  registerModifier,
  hasModifier,
  listModifiers,
  validateRegistry,
  getModifier,
  clearRegistry,
  resetRegistry,
  createIsolatedRegistry
} from '../index'
import type { ModifierFactory, Modifier } from '../types'

// Mock modifier factory for testing
const createTestModifier = (name: string): ModifierFactory<{ value: string }> => 
  ({ value }) => ({
    type: name,
    priority: 100,
    properties: { value },
    apply: (node) => node
  })

describe('Registry API', () => {
  beforeEach(() => {
    // Clear registry before each test
    clearRegistry()
  })

  describe('Basic Registration and Retrieval', () => {
    it('should register and retrieve modifiers', () => {
      const testModifier = createTestModifier('testMod')

      registerModifier('testMod', testModifier)

      expect(hasModifier('testMod')).toBe(true)
      expect(getModifier('testMod')).toBe(testModifier)
      expect(listModifiers()).toContain('testMod')
    })

    it('should overwrite existing modifier when re-registered', () => {
      const factory1 = createTestModifier('v1')
      const factory2 = createTestModifier('v2')

      registerModifier('mod', factory1)
      expect(getModifier('mod')).toBe(factory1)

      registerModifier('mod', factory2)
      expect(getModifier('mod')).toBe(factory2)
      expect(listModifiers()).toHaveLength(1)
    })

    it('should handle registration with complex property types', () => {
      interface ComplexProps {
        value: string
        nested: { data: number[] }
        callback: () => void
      }

      const complexFactory: ModifierFactory<ComplexProps> = (props) => ({
        type: 'complex',
        priority: 100,
        properties: props,
        apply: (node) => node
      })

      registerModifier('complex', complexFactory)
      expect(hasModifier('complex')).toBe(true)
      expect(getModifier<ComplexProps>('complex')).toBe(complexFactory)
    })

    it('should register multiple modifiers without conflicts', () => {
      const modifiers = ['mod1', 'mod2', 'mod3', 'mod4', 'mod5']

      modifiers.forEach(name => {
        registerModifier(name, createTestModifier(name))
      })

      expect(listModifiers()).toHaveLength(5)
      modifiers.forEach(name => {
        expect(hasModifier(name)).toBe(true)
      })
    })

    it('should maintain registration order in list()', () => {
      registerModifier('first', createTestModifier('first'))
      registerModifier('second', createTestModifier('second'))
      registerModifier('third', createTestModifier('third'))

      const list = listModifiers()
      expect(list).toEqual(['first', 'second', 'third'])
    })

    it('should return undefined for unregistered modifiers', () => {
      expect(getModifier('nonexistent')).toBeUndefined()
      expect(hasModifier('nonexistent')).toBe(false)
    })
  })

  describe('Modifier Retrieval', () => {
    it('should get modifier by exact name', () => {
      const factory = createTestModifier('exact')
      registerModifier('exact', factory)

      expect(getModifier('exact')).toBe(factory)
    })

    it('should return undefined for non-existent modifier', () => {
      registerModifier('exists', createTestModifier('exists'))
      expect(getModifier('doesNotExist')).toBeUndefined()
    })

    it('should return same factory instance on multiple gets', () => {
      const factory = createTestModifier('test')
      registerModifier('test', factory)

      const retrieved1 = getModifier('test')
      const retrieved2 = getModifier('test')
      const retrieved3 = getModifier('test')

      expect(retrieved1).toBe(factory)
      expect(retrieved2).toBe(factory)
      expect(retrieved3).toBe(factory)
      expect(retrieved1).toBe(retrieved2)
    })
  })

  describe('Registry Health and Diagnostics', () => {
    it('should validate registry health', () => {
      registerModifier('mod1', createTestModifier('mod1'))
      registerModifier('mod2', createTestModifier('mod2'))

      const health = validateRegistry()

      expect(health.totalModifiers).toBe(2)
      expect(health.duplicateNames).toEqual([])
      expect(health.instanceId).toBeDefined()
      expect(health.createdAt).toBeGreaterThan(0)
    })

    it('should track instance count correctly', () => {
      const health1 = validateRegistry()
      expect(health1.instanceCount).toBeGreaterThanOrEqual(1)

      const health2 = validateRegistry()
      expect(health2.instanceCount).toBe(health1.instanceCount)
    })

    it('should report createdAt timestamp', () => {
      const beforeCreation = Date.now()
      const health = validateRegistry()
      const afterCheck = Date.now()

      expect(health.createdAt).toBeGreaterThanOrEqual(beforeCreation - 1000)
      expect(health.createdAt).toBeLessThanOrEqual(afterCheck)
    })

    it('should calculate totalModifiers correctly', () => {
      expect(validateRegistry().totalModifiers).toBe(0)

      registerModifier('mod1', createTestModifier('mod1'))
      expect(validateRegistry().totalModifiers).toBe(1)

      registerModifier('mod2', createTestModifier('mod2'))
      registerModifier('mod3', createTestModifier('mod3'))
      expect(validateRegistry().totalModifiers).toBe(3)
    })
  })

  describe('Clear and Reset Operations', () => {
    it('should clear all modifiers', () => {
      registerModifier('mod1', createTestModifier('mod1'))
      registerModifier('mod2', createTestModifier('mod2'))

      expect(listModifiers()).toHaveLength(2)

      clearRegistry()

      expect(listModifiers()).toHaveLength(0)
      expect(hasModifier('mod1')).toBe(false)
      expect(hasModifier('mod2')).toBe(false)
    })

    it('should reset registry in test environment', () => {
      registerModifier('testMod', createTestModifier('testMod'))
      expect(listModifiers()).toHaveLength(1)

      resetRegistry()
      expect(listModifiers()).toHaveLength(0)
    })
  })

  describe('Isolated Registry', () => {
    it('should create isolated registry for testing', () => {
      const isolated = createIsolatedRegistry()

      // Register in global
      registerModifier('globalMod', createTestModifier('globalMod'))

      // Register in isolated
      isolated.register('isolatedMod', createTestModifier('isolatedMod'))

      // They should be separate
      expect(hasModifier('globalMod')).toBe(true)
      expect(hasModifier('isolatedMod')).toBe(false)
      expect(isolated.has('globalMod')).toBe(false)
      expect(isolated.has('isolatedMod')).toBe(true)
    })
  })

  describe('Singleton Pattern', () => {
    it('should use singleton pattern', () => {
      const registry1 = globalModifierRegistry
      const registry2 = globalModifierRegistry

      expect(registry1).toBe(registry2)
    })
  })
})