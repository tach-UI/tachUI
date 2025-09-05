/**
 * Appearance Modifiers Integration Tests
 *
 * Tests for combining clipped and clipShape modifiers with other appearance
 * modifiers to ensure they work correctly together.
 */

import { beforeEach, describe, expect, it } from 'vitest'
import { clipShape, clipped } from '../../src/appearance'
import type { ModifierContext } from '@tachui/core/modifiers/types'
import type { DOMNode } from '@tachui/core/runtime/types'

// Mock DOM element
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

describe('Appearance Modifiers Integration', () => {
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

  describe('Clipped + ClipShape Combinations', () => {
    it('should apply both clipped and clipShape modifiers', () => {
      const clippedMod = clipped(true)
      const clipShapeMod = clipShape('circle')

      clippedMod.apply({} as DOMNode, mockContext)
      clipShapeMod.apply({} as DOMNode, mockContext)

      expect(mockElement.style.overflow).toBe('hidden')
      expect(mockElement.style.clipPath).toBe('circle(50%)')
    })

    it('should handle clipShape overriding clipped overflow', () => {
      const clippedMod = clipped(true)
      const clipShapeMod = clipShape('ellipse', {
        radiusX: '60%',
        radiusY: '40%',
      })

      clippedMod.apply({} as DOMNode, mockContext)
      clipShapeMod.apply({} as DOMNode, mockContext)

      // Both should be applied - they work together
      expect(mockElement.style.overflow).toBe('hidden')
      expect(mockElement.style.clipPath).toBe('ellipse(60% 40% at center)')
    })

    it('should support different clipShape types with clipped', () => {
      const shapes = [
        { shape: 'circle' as const, expected: 'circle(50%)' },
        {
          shape: 'rect' as const,
          params: { inset: 5 },
          expected: 'inset(5px)',
        },
        {
          shape: 'polygon' as const,
          params: { points: '0% 0%, 100% 50%, 0% 100%' },
          expected: 'polygon(0% 0%, 100% 50%, 0% 100%)',
        },
      ]

      shapes.forEach(({ shape, params, expected }) => {
        // Reset element
        mockElement = new MockElement()
        mockContext.element = mockElement as any

        const clippedMod = clipped(true)
        const clipShapeMod = clipShape(shape, params)

        clippedMod.apply({} as DOMNode, mockContext)
        clipShapeMod.apply({} as DOMNode, mockContext)

        expect(mockElement.style.overflow).toBe('hidden')
        expect(mockElement.style.clipPath).toBe(expected)
      })
    })
  })

  describe('Clipping Property Combinations', () => {
    it('should allow setting other styles alongside clipped', () => {
      const clippedMod = clipped(true)

      clippedMod.apply({} as DOMNode, mockContext)

      // Manually set other styles to test they don't interfere
      mockElement.style.backgroundColor = '#FF0000'
      mockElement.style.border = '1px solid black'

      expect(mockElement.style.overflow).toBe('hidden')
      expect(mockElement.style.backgroundColor).toBe('#FF0000')
      expect(mockElement.style.border).toBe('1px solid black')
    })

    it('should allow setting other styles alongside clipShape', () => {
      const clipShapeMod = clipShape('circle')

      clipShapeMod.apply({} as DOMNode, mockContext)

      // Manually set other styles to test they don't interfere
      mockElement.style.backgroundColor = 'rgba(255, 0, 0, 0.8)'
      mockElement.style.border = '2px dashed blue'

      expect(mockElement.style.clipPath).toBe('circle(50%)')
      expect(mockElement.style.backgroundColor).toBe('rgba(255, 0, 0, 0.8)')
      expect(mockElement.style.border).toBe('2px dashed blue')
    })
  })

  describe('Complex Clipping Combinations', () => {
    it('should handle clipped + clipShape together', () => {
      const clippedMod = clipped(true)
      const clipShapeMod = clipShape('ellipse', {
        radiusX: '70%',
        radiusY: '50%',
      })

      // Apply both modifiers
      clippedMod.apply({} as DOMNode, mockContext)
      clipShapeMod.apply({} as DOMNode, mockContext)

      expect(mockElement.style.overflow).toBe('hidden')
      expect(mockElement.style.clipPath).toBe('ellipse(70% 50% at center)')
    })

    it('should maintain correct clipping modifier application order', () => {
      const modifiers = [
        clipped(true),
        clipShape('polygon', { points: '50% 0%, 100% 50%, 50% 100%, 0% 50%' }),
      ]

      // Apply modifiers in different orders to ensure consistency
      const orders = [
        [0, 1],
        [1, 0],
      ]

      orders.forEach(order => {
        // Reset element
        mockElement = new MockElement()
        mockContext.element = mockElement as any

        // Apply modifiers in this order
        order.forEach(modifierIndex => {
          modifiers[modifierIndex].apply({} as DOMNode, mockContext)
        })

        // All should have the same final result regardless of order
        expect(mockElement.style.overflow).toBe('hidden')
        expect(mockElement.style.clipPath).toBe(
          'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)'
        )
      })
    })
  })

  describe('Modifier Priority and Conflicts', () => {
    it('should handle multiple clipShape applications (last wins)', () => {
      const clipShape1 = clipShape('circle')
      const clipShape2 = clipShape('ellipse', {
        radiusX: '60%',
        radiusY: '40%',
      })
      const clipShape3 = clipShape('rect', { inset: 5 })

      clipShape1.apply({} as DOMNode, mockContext)
      expect(mockElement.style.clipPath).toBe('circle(50%)')

      clipShape2.apply({} as DOMNode, mockContext)
      expect(mockElement.style.clipPath).toBe('ellipse(60% 40% at center)')

      clipShape3.apply({} as DOMNode, mockContext)
      expect(mockElement.style.clipPath).toBe('inset(5px)')
    })

    it('should handle clipped being disabled after being enabled', () => {
      const clippedEnabled = clipped(true)
      const clippedDisabled = clipped(false)

      clippedEnabled.apply({} as DOMNode, mockContext)
      expect(mockElement.style.overflow).toBe('hidden')

      clippedDisabled.apply({} as DOMNode, mockContext)
      expect(mockElement.style.overflow).toBe('')
    })

    it('should maintain other styles when clipping is toggled', () => {
      const clippedEnabled = clipped(true)
      const clippedDisabled = clipped(false)

      // Manually set other styles first
      mockElement.style.backgroundColor = '#FFFF00'
      mockElement.style.border = '2px solid #FF00FF'

      // Toggle clipping on
      clippedEnabled.apply({} as DOMNode, mockContext)
      expect(mockElement.style.overflow).toBe('hidden')
      expect(mockElement.style.backgroundColor).toBe('#FFFF00')
      expect(mockElement.style.border).toBe('2px solid #FF00FF')

      // Toggle clipping off
      clippedDisabled.apply({} as DOMNode, mockContext)
      expect(mockElement.style.overflow).toBe('')
      expect(mockElement.style.backgroundColor).toBe('#FFFF00')
      expect(mockElement.style.border).toBe('2px solid #FF00FF')
    })
  })

  describe('Performance with Combined Modifiers', () => {
    it('should perform clipping combinations efficiently', () => {
      const iterations = 200

      const start = performance.now()

      for (let i = 0; i < iterations; i++) {
        // Create fresh element for each iteration
        mockElement = new MockElement()
        mockContext.element = mockElement as any

        // Apply clipping modifiers
        clipped(true).apply({} as DOMNode, mockContext)
        clipShape('circle').apply({} as DOMNode, mockContext)

        // Manually set other styles for realism
        mockElement.style.backgroundColor = `hsl(${i * 3.6}, 100%, 50%)`
        mockElement.style.border = '1px solid #000'
      }

      const duration = performance.now() - start

      expect(duration).toBeLessThan(100) // Should complete within 100ms
    })

    it('should handle repeated clipping modifier applications efficiently', () => {
      const modifiers = [
        clipped(true),
        clipShape('ellipse', { radiusX: '75%', radiusY: '60%' }),
      ]

      const iterations = 300

      const start = performance.now()

      for (let i = 0; i < iterations; i++) {
        modifiers.forEach(modifier => {
          modifier.apply({} as DOMNode, mockContext)
        })
      }

      const duration = performance.now() - start

      expect(duration).toBeLessThan(50) // Should complete within 50ms

      // Verify final state
      expect(mockElement.style.overflow).toBe('hidden')
      expect(mockElement.style.clipPath).toBe('ellipse(75% 60% at center)')
    })
  })
})
