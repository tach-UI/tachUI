/**
 * Clipped Modifier Tests
 *
 * Comprehensive tests for the clipped modifier including edge cases,
 * validation, and CSS overflow handling.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ClippedModifier, clipped } from '../../src/appearance/clipped'
import type { ModifierContext } from '@tachui/core/modifiers/types'
import type { DOMNode } from '@tachui/core/runtime/types'

// Mock DOM element that matches HTMLElement.style interface
class MockElement {
  style: {
    [key: string]: string
    setProperty: (property: string, value: string) => void
  }

  constructor() {
    this.style = new Proxy({} as any, {
      set: (target, prop, value) => {
        target[prop] = value
        return true
      },
      get: (target, prop) => {
        if (prop === 'setProperty') {
          return (property: string, value: string) => {
            target[property] = value
          }
        }
        return target[prop] || ''
      },
    })
  }
}

describe('Clipped Modifier', () => {
  let mockElement: MockElement
  let mockContext: ModifierContext

  beforeEach(() => {
    mockElement = new MockElement()
    mockContext = {
      componentId: 'test-component',
      element: mockElement as any,
      phase: 'creation',
    }
  })

  describe('Constructor and Factory Function', () => {
    it('should create ClippedModifier with default enabled', () => {
      const modifier = clipped()

      expect(modifier).toBeInstanceOf(ClippedModifier)
      expect(modifier.type).toBe('clipped')
      expect(modifier.priority).toBe(89)
      expect(modifier.properties.clipped).toBe(true)
    })

    it('should create ClippedModifier with enabled = true', () => {
      const modifier = clipped(true)

      expect(modifier.properties.clipped).toBe(true)
    })

    it('should create ClippedModifier with enabled = false', () => {
      const modifier = clipped(false)

      expect(modifier.properties.clipped).toBe(false)
    })

    it('should create ClippedModifier instance directly', () => {
      const modifier = new ClippedModifier({ clipped: true })

      expect(modifier.properties.clipped).toBe(true)
      expect(modifier.type).toBe('clipped')
      expect(modifier.priority).toBe(89)
    })
  })

  describe('Apply Method', () => {
    it('should set overflow hidden when clipped is true', () => {
      const modifier = clipped(true)

      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.overflow).toBe('hidden')
    })

    it('should reset overflow when clipped is false', () => {
      // Set initial overflow value
      mockElement.style.overflow = 'scroll'

      const modifier = clipped(false)

      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.overflow).toBe('')
    })

    it('should handle missing element gracefully', () => {
      const modifier = clipped(true)
      const contextWithoutElement = {
        ...mockContext,
        element: undefined,
      }

      expect(() => {
        modifier.apply({} as DOMNode, contextWithoutElement)
      }).not.toThrow()
    })

    it('should handle null element gracefully', () => {
      const modifier = clipped(true)
      const contextWithNullElement = {
        ...mockContext,
        element: null,
      }

      expect(() => {
        modifier.apply({} as DOMNode, contextWithNullElement)
      }).not.toThrow()
    })

    it('should return undefined (no DOM tree modification)', () => {
      const modifier = clipped(true)

      const result = modifier.apply({} as DOMNode, mockContext)

      expect(result).toBeUndefined()
    })
  })

  describe('CSS Overflow Handling', () => {
    it('should preserve existing overflow values when setting to hidden', () => {
      const modifier = clipped(true)

      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.overflow).toBe('hidden')

      // Applying again should maintain the value
      modifier.apply({} as DOMNode, mockContext)
      expect(mockElement.style.overflow).toBe('hidden')
    })

    it('should work with different initial overflow values', () => {
      const testValues = ['scroll', 'auto', 'visible', 'inherit', 'initial']

      testValues.forEach(initialValue => {
        mockElement.style.overflow = initialValue

        const modifier = clipped(true)
        modifier.apply({} as DOMNode, mockContext)

        expect(mockElement.style.overflow).toBe('hidden')

        // Reset for disabled case
        const disabledModifier = clipped(false)
        disabledModifier.apply({} as DOMNode, mockContext)

        expect(mockElement.style.overflow).toBe('')
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle rapid enable/disable toggling', () => {
      const enabledModifier = clipped(true)
      const disabledModifier = clipped(false)

      // Toggle multiple times
      for (let i = 0; i < 10; i++) {
        enabledModifier.apply({} as DOMNode, mockContext)
        expect(mockElement.style.overflow).toBe('hidden')

        disabledModifier.apply({} as DOMNode, mockContext)
        expect(mockElement.style.overflow).toBe('')
      }
    })

    it('should work with different context phases', () => {
      const modifier = clipped(true)
      const phases: Array<ModifierContext['phase']> = [
        'creation',
        'update',
        'cleanup',
      ]

      phases.forEach(phase => {
        const phaseContext = { ...mockContext, phase }

        modifier.apply({} as DOMNode, phaseContext)
        expect(mockElement.style.overflow).toBe('hidden')
      })
    })

    it('should handle invalid element properties gracefully', () => {
      const modifier = clipped(true)

      // Create element without style property
      const invalidElement = {}
      const invalidContext = {
        ...mockContext,
        element: invalidElement as any,
      }

      expect(() => {
        modifier.apply({} as DOMNode, invalidContext)
      }).not.toThrow()
    })
  })

  describe('Property Validation', () => {
    it('should validate clipped property type', () => {
      const modifier = new ClippedModifier({ clipped: true })
      expect(typeof modifier.properties.clipped).toBe('boolean')

      const falseModifier = new ClippedModifier({ clipped: false })
      expect(typeof falseModifier.properties.clipped).toBe('boolean')
    })

    it('should work with property access patterns', () => {
      const modifier = clipped(true)

      // Properties should be accessible
      expect(modifier.properties.clipped).toBe(true)

      // Apply should work with current properties
      modifier.apply({} as DOMNode, mockContext)
      expect(mockElement.style.overflow).toBe('hidden')

      // Test with false modifier
      const falseModifier = clipped(false)
      expect(falseModifier.properties.clipped).toBe(false)

      falseModifier.apply({} as DOMNode, mockContext)
      expect(mockElement.style.overflow).toBe('')
    })
  })

  describe('Performance', () => {
    it('should perform multiple applications efficiently', () => {
      const modifier = clipped(true)
      const iterations = 1000

      const start = performance.now()

      for (let i = 0; i < iterations; i++) {
        modifier.apply({} as DOMNode, mockContext)
      }

      const duration = performance.now() - start

      expect(duration).toBeLessThan(50) // Should complete within 50ms
      expect(mockElement.style.overflow).toBe('hidden')
    })

    it('should handle multiple modifier instances efficiently', () => {
      const modifiers = Array.from({ length: 100 }, () => clipped(true))

      const start = performance.now()

      modifiers.forEach(modifier => {
        modifier.apply({} as DOMNode, mockContext)
      })

      const duration = performance.now() - start

      expect(duration).toBeLessThan(20) // Should complete within 20ms
      expect(mockElement.style.overflow).toBe('hidden')
    })
  })
})
