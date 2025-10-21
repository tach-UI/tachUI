/**
 * Integration Scenarios Tests
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
  validateRegistry,
  clearRegistry,
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

describe('Integration Scenarios', () => {
  beforeEach(() => {
    clearRegistry()
  })

  describe('Plugin Development Patterns', () => {
    it('should support plugin registration pattern', () => {
      // Simulate plugin registration
      function installAnimationPlugin() {
        registerModifier('fadeIn', createTestModifier('fadeIn'))
        registerModifier('slideUp', createTestModifier('slideUp'))
        registerModifier('bounce', createTestModifier('bounce'))
      }

      installAnimationPlugin()

      expect(hasModifier('fadeIn')).toBe(true)
      expect(hasModifier('slideUp')).toBe(true)
      expect(hasModifier('bounce')).toBe(true)
    })

    it('should support lazy plugin loading', async () => {
      function installLazyPlugin() {
        registerLazyModifier('heavy1', async () => {
          await delay(10)
          return createTestModifier('heavy1')
        })
        registerLazyModifier('heavy2', async () => {
          await delay(10)
          return createTestModifier('heavy2')
        })
      }

      installLazyPlugin()

      // Load on demand
      const factory = await getModifierAsync('heavy1')
      expect(factory).toBeDefined()

      // heavy2 not yet loaded
      const diagnostics = (globalModifierRegistry as any).getDiagnostics()
      expect(diagnostics.lazyLoaderCount).toBe(1)
      expect(diagnostics.modifierCount).toBe(1)
    })

    it('should support plugin with mixed eager and lazy modifiers', () => {
      function installMixedPlugin() {
        // Core modifiers loaded immediately
        registerModifier('core1', createTestModifier('core1'))
        registerModifier('core2', createTestModifier('core2'))

        // Advanced modifiers loaded lazily
        registerLazyModifier('advanced1', () => createTestModifier('advanced1'))
        registerLazyModifier('advanced2', () => createTestModifier('advanced2'))
      }

      installMixedPlugin()

      expect(listModifiers()).toHaveLength(4)
      expect(hasModifier('core1')).toBe(true)
      expect(hasModifier('advanced1')).toBe(true)
    })
  })

  describe('Multi-Package Scenarios', () => {
    it('should handle modifiers from multiple packages', () => {
      // Simulate @tachui/modifiers
      registerModifier('padding', createTestModifier('padding'))
      registerModifier('margin', createTestModifier('margin'))

      // Simulate @tachui/effects
      registerModifier('blur', createTestModifier('blur'))
      registerModifier('shadow', createTestModifier('shadow'))

      // Simulate custom user plugin
      registerModifier('customEffect', createTestModifier('customEffect'))

      const list = listModifiers()
      expect(list).toHaveLength(5)
    })

    it('should prevent package conflicts with same names', () => {
      // Package A registers padding
      const paddingA = createTestModifier('paddingA')
      registerModifier('padding', paddingA)

      // Package B tries to register padding (should overwrite)
      const paddingB = createTestModifier('paddingB')
      registerModifier('padding', paddingB)

      expect(getModifier('padding')).toBe(paddingB)
    })

    it('should support namespace-like naming for packages', () => {
      // Package-scoped naming convention
      registerModifier('@pkg1/modifier', createTestModifier('pkg1'))
      registerModifier('@pkg2/modifier', createTestModifier('pkg2'))
      registerModifier('@user/custom', createTestModifier('user'))

      expect(hasModifier('@pkg1/modifier')).toBe(true)
      expect(hasModifier('@pkg2/modifier')).toBe(true)
      expect(hasModifier('@user/custom')).toBe(true)
    })
  })

  describe('Development Workflow', () => {
    it('should support hot reload simulation', () => {
      // Initial load
      registerModifier('component', createTestModifier('v1'))
      expect(getModifier('component')).toBeDefined()

      // Hot reload - overwrite
      registerModifier('component', createTestModifier('v2'))
      expect(getModifier('component')).toBeDefined()

      // Should work without issues
      expect(listModifiers()).toContain('component')
    })

    it('should support test isolation', () => {
      const iso1 = createIsolatedRegistry()
      const iso2 = createIsolatedRegistry()

      // Test 1 uses iso1
      iso1.register('testMod', createTestModifier('test1'))
      expect(iso1.list()).toHaveLength(1)

      // Test 2 uses iso2 (clean slate)
      iso2.register('testMod', createTestModifier('test2'))
      expect(iso2.list()).toHaveLength(1)

      // Global registry unaffected
      expect(listModifiers()).toHaveLength(0)
    })

    it('should support debugging workflow', () => {
      registerModifier('mod1', createTestModifier('mod1'))
      registerModifier('mod2', createTestModifier('mod2'))

      const health = validateRegistry()
      expect(health.totalModifiers).toBe(2)
      expect(health.instanceId).toBeDefined()

      const list = listModifiers()
      expect(list).toContain('mod1')
      expect(list).toContain('mod2')
    })
  })

  describe('Production Scenarios', () => {
    it('should handle large-scale production registry', () => {
      // Simulate production with all @tachui packages
      const packages = [
        { name: 'primitives', count: 15 },
        { name: 'modifiers', count: 95 },
        { name: 'effects', count: 20 },
        { name: 'forms', count: 10 }
      ]

      let totalRegistered = 0
      packages.forEach(pkg => {
        for (let i = 0; i < pkg.count; i++) {
          registerModifier(`${pkg.name}_${i}`, createTestModifier(`${pkg.name}_${i}`))
          totalRegistered++
        }
      })

      const health = validateRegistry()
      expect(health.totalModifiers).toBe(totalRegistered)
      expect(health.duplicateNames).toHaveLength(0)
    })

    it('should support progressive enhancement', async () => {
      // Core modifiers loaded immediately
      registerModifier('padding', createTestModifier('padding'))
      registerModifier('margin', createTestModifier('margin'))

      // Advanced modifiers loaded lazily
      registerLazyModifier('advancedEffect', async () => {
        await delay(50) // Simulate heavy module
        return createTestModifier('advancedEffect')
      })

      // Can use core immediately
      expect(hasModifier('padding')).toBe(true)

      // Advanced loads on demand
      const advanced = await getModifierAsync('advancedEffect')
      expect(advanced).toBeDefined()
    })

    it('should maintain performance under production load', () => {
      // Register realistic production set
      for (let i = 0; i < 200; i++) {
        registerModifier(`mod${i}`, createTestModifier(`mod${i}`))
      }

      const start = performance.now()

      // Simulate typical production operations
      hasModifier('mod50')
      getModifier('mod100')
      listModifiers()
      validateRegistry()

      const duration = performance.now() - start
      expect(duration).toBeLessThan(10) // Should be fast
    })
  })

  describe('Error Recovery', () => {
    it('should recover from partial plugin load failure', async () => {
      // Plugin with some successful, some failing loads
      registerLazyModifier('working1', async () => createTestModifier('working1'))
      registerLazyModifier('failing', async () => {
        throw new Error('Failed to load')
      })
      registerLazyModifier('working2', async () => createTestModifier('working2'))

      // Load all
      const results = await Promise.allSettled([
        getModifierAsync('working1'),
        getModifierAsync('failing'),
        getModifierAsync('working2')
      ])

      expect(results[0].status).toBe('fulfilled')
      expect(results[1].status).toBe('rejected')
      expect(results[2].status).toBe('fulfilled')

      // Working modifiers should be available
      expect(hasModifier('working1')).toBe(true)
      expect(hasModifier('working2')).toBe(true)
    })

    it('should handle registry validation after errors', async () => {
      registerModifier('good1', createTestModifier('good1'))
      registerLazyModifier('bad', async () => {
        throw new Error('Bad loader')
      })
      registerModifier('good2', createTestModifier('good2'))

      // Try to load bad
      await expect(getModifierAsync('bad')).rejects.toThrow()

      // Registry should still be healthy
      const health = validateRegistry()
      expect(health.totalModifiers).toBe(3) // good1, bad (still registered), good2
    })

    it('should support fallback patterns', async () => {
      registerLazyModifier('primary', async () => {
        throw new Error('Primary failed')
      })

      registerModifier('fallback', createTestModifier('fallback'))

      // Try primary, use fallback on failure
      let modifier
      try {
        modifier = await getModifierAsync('primary')
      } catch {
        modifier = getModifier('fallback')
      }

      expect(modifier).toBeDefined()
    })
  })

  describe('Real-World Usage Patterns', () => {
    it('should support modifier discovery pattern', () => {
      // Register various modifiers
      registerModifier('padding', createTestModifier('padding'))
      registerModifier('margin', createTestModifier('margin'))
      registerModifier('color', createTestModifier('color'))

      // Discover available layout modifiers
      const allModifiers = listModifiers()
      const layoutModifiers = allModifiers.filter(name =>
        name === 'padding' || name === 'margin'
      )

      expect(layoutModifiers).toHaveLength(2)
    })

    it('should support conditional registration', () => {
      const isDevelopment = process.env.NODE_ENV === 'test' // Using test for this test

      if (isDevelopment) {
        registerModifier('debugOverlay', createTestModifier('debugOverlay'))
      }

      expect(hasModifier('debugOverlay')).toBe(true)
    })
  })
})
