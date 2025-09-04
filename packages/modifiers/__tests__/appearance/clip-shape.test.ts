/**
 * Clip Shape Modifier Tests
 *
 * Comprehensive tests for the clip shape modifier including all supported shapes,
 * parameter validation, and CSS clip-path generation.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ClipShapeModifier, clipShape } from '../../src/appearance/clip-shape'
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

describe('Clip Shape Modifier', () => {
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
    it('should create ClipShapeModifier with circle shape', () => {
      const modifier = clipShape('circle')

      expect(modifier).toBeInstanceOf(ClipShapeModifier)
      expect(modifier.type).toBe('clip-shape')
      expect(modifier.priority).toBe(90)
      expect(modifier.properties.shape).toBe('circle')
      expect(modifier.properties.parameters).toEqual({})
    })

    it('should create ClipShapeModifier with ellipse and parameters', () => {
      const parameters = { radiusX: '60%', radiusY: '40%' }
      const modifier = clipShape('ellipse', parameters)

      expect(modifier.properties.shape).toBe('ellipse')
      expect(modifier.properties.parameters).toEqual(parameters)
    })

    it('should create ClipShapeModifier with polygon and points', () => {
      const parameters = { points: '0% 0%, 100% 50%, 0% 100%' }
      const modifier = clipShape('polygon', parameters)

      expect(modifier.properties.shape).toBe('polygon')
      expect(modifier.properties.parameters).toEqual(parameters)
    })

    it('should create ClipShapeModifier instance directly', () => {
      const options = { shape: 'rect' as const, parameters: { inset: 10 } }
      const modifier = new ClipShapeModifier(options)

      expect(modifier.properties.shape).toBe('rect')
      expect(modifier.properties.parameters).toEqual({ inset: 10 })
      expect(modifier.type).toBe('clip-shape')
      expect(modifier.priority).toBe(90)
    })
  })

  describe('Circle Shape', () => {
    it('should apply circle clip path with default radius', () => {
      const modifier = clipShape('circle')

      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.clipPath).toBe('circle(50%)')
    })

    it('should apply circle clip path with empty parameters', () => {
      const modifier = clipShape('circle', {})

      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.clipPath).toBe('circle(50%)')
    })

    it('should ignore extra parameters for circle shape', () => {
      const modifier = clipShape('circle', { radiusX: '30%', inset: 5 })

      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.clipPath).toBe('circle(50%)')
    })
  })

  describe('Ellipse Shape', () => {
    it('should apply ellipse clip path with default radii', () => {
      const modifier = clipShape('ellipse')

      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.clipPath).toBe('ellipse(50% 50% at center)')
    })

    it('should apply ellipse clip path with custom radii', () => {
      const modifier = clipShape('ellipse', { radiusX: '60%', radiusY: '40%' })

      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.clipPath).toBe('ellipse(60% 40% at center)')
    })

    it('should apply ellipse clip path with partial parameters', () => {
      const modifier = clipShape('ellipse', { radiusX: '80%' })

      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.clipPath).toBe('ellipse(80% 50% at center)')
    })

    it('should handle various radius units', () => {
      const testCases = [
        {
          radiusX: '100px',
          radiusY: '50px',
          expected: 'ellipse(100px 50px at center)',
        },
        {
          radiusX: '2rem',
          radiusY: '1.5rem',
          expected: 'ellipse(2rem 1.5rem at center)',
        },
        {
          radiusX: '75%',
          radiusY: '25%',
          expected: 'ellipse(75% 25% at center)',
        },
      ]

      testCases.forEach(({ radiusX, radiusY, expected }) => {
        const modifier = clipShape('ellipse', { radiusX, radiusY })

        modifier.apply({} as DOMNode, mockContext)

        expect(mockElement.style.clipPath).toBe(expected)
      })
    })
  })

  describe('Rectangle Shape', () => {
    it('should apply rect clip path with default inset', () => {
      const modifier = clipShape('rect')

      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.clipPath).toBe('inset(0px)')
    })

    it('should apply rect clip path with custom inset', () => {
      const modifier = clipShape('rect', { inset: 10 })

      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.clipPath).toBe('inset(10px)')
    })

    it('should handle different inset values', () => {
      const testCases = [
        { inset: 0, expected: 'inset(0px)' },
        { inset: 5, expected: 'inset(5px)' },
        { inset: 25, expected: 'inset(25px)' },
        { inset: 100, expected: 'inset(100px)' },
      ]

      testCases.forEach(({ inset, expected }) => {
        const modifier = clipShape('rect', { inset })

        modifier.apply({} as DOMNode, mockContext)

        expect(mockElement.style.clipPath).toBe(expected)
      })
    })
  })

  describe('Polygon Shape', () => {
    it('should apply polygon clip path with points', () => {
      const points = '0% 0%, 100% 50%, 0% 100%'
      const modifier = clipShape('polygon', { points })

      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.clipPath).toBe(`polygon(${points})`)
    })

    it('should handle complex polygon points', () => {
      const points = '50% 0%, 100% 50%, 50% 100%, 0% 50%'
      const modifier = clipShape('polygon', { points })

      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.clipPath).toBe(`polygon(${points})`)
    })

    it('should return empty string when points are missing', () => {
      const modifier = clipShape('polygon', {})

      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.clipPath).toBe('')
    })

    it('should handle undefined points', () => {
      const modifier = clipShape('polygon', { points: undefined })

      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.clipPath).toBe('')
    })
  })

  describe('Invalid Shape Handling', () => {
    it('should handle invalid shape gracefully', () => {
      const modifier = new ClipShapeModifier({
        shape: 'invalid' as any,
        parameters: {},
      })

      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.clipPath).toBe('')
    })

    it('should not set clipPath for unsupported shapes', () => {
      const invalidShapes = ['triangle', 'hexagon', 'star'] as any[]

      invalidShapes.forEach(shape => {
        const modifier = new ClipShapeModifier({ shape, parameters: {} })

        modifier.apply({} as DOMNode, mockContext)

        expect(mockElement.style.clipPath).toBe('')
      })
    })
  })

  describe('Apply Method Edge Cases', () => {
    it('should handle missing element gracefully', () => {
      const modifier = clipShape('circle')
      const contextWithoutElement = {
        ...mockContext,
        element: undefined,
      }

      expect(() => {
        modifier.apply({} as DOMNode, contextWithoutElement)
      }).not.toThrow()
    })

    it('should handle null element gracefully', () => {
      const modifier = clipShape('circle')
      const contextWithNullElement = {
        ...mockContext,
        element: null,
      }

      expect(() => {
        modifier.apply({} as DOMNode, contextWithNullElement)
      }).not.toThrow()
    })

    it('should return undefined (no DOM tree modification)', () => {
      const modifier = clipShape('circle')

      const result = modifier.apply({} as DOMNode, mockContext)

      expect(result).toBeUndefined()
    })
  })

  describe('CSS ClipPath Persistence', () => {
    it('should preserve clipPath when applied multiple times', () => {
      const modifier = clipShape('circle')

      modifier.apply({} as DOMNode, mockContext)
      expect(mockElement.style.clipPath).toBe('circle(50%)')

      // Apply again
      modifier.apply({} as DOMNode, mockContext)
      expect(mockElement.style.clipPath).toBe('circle(50%)')
    })

    it('should override existing clipPath', () => {
      // Set initial clipPath
      mockElement.style.clipPath = 'circle(25%)'

      const modifier = clipShape('ellipse', { radiusX: '60%', radiusY: '40%' })

      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.clipPath).toBe('ellipse(60% 40% at center)')
    })
  })

  describe('Parameter Validation', () => {
    it('should handle undefined parameters gracefully', () => {
      const modifier = clipShape('ellipse', undefined as any)

      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.clipPath).toBe('ellipse(50% 50% at center)')
    })

    it('should handle null parameters gracefully', () => {
      const modifier = clipShape('rect', null as any)

      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.clipPath).toBe('inset(0px)')
    })

    it('should work with property references', () => {
      const parameters = { radiusX: '60%', radiusY: '40%' }
      const modifier = clipShape('ellipse', parameters)

      modifier.apply({} as DOMNode, mockContext)

      // Should apply the initial values correctly
      expect(mockElement.style.clipPath).toBe('ellipse(60% 40% at center)')

      // Test that the modifier maintains its functionality
      const freshElement = new MockElement()
      const freshContext = { ...mockContext, element: freshElement as any }

      modifier.apply({} as DOMNode, freshContext)
      expect(freshElement.style.clipPath).toBe('ellipse(60% 40% at center)')
    })
  })

  describe('Performance', () => {
    it('should perform multiple applications efficiently', () => {
      const modifier = clipShape('circle')
      const iterations = 1000

      const start = performance.now()

      for (let i = 0; i < iterations; i++) {
        modifier.apply({} as DOMNode, mockContext)
      }

      const duration = performance.now() - start

      expect(duration).toBeLessThan(50) // Should complete within 50ms
      expect(mockElement.style.clipPath).toBe('circle(50%)')
    })

    it('should handle complex polygon efficiently', () => {
      const complexPoints = Array.from({ length: 20 }, (_, i) => {
        const angle = (i / 20) * 360
        const x = 50 + 50 * Math.cos((angle * Math.PI) / 180)
        const y = 50 + 50 * Math.sin((angle * Math.PI) / 180)
        return `${x.toFixed(2)}% ${y.toFixed(2)}%`
      }).join(', ')

      const modifier = clipShape('polygon', { points: complexPoints })
      const iterations = 100

      const start = performance.now()

      for (let i = 0; i < iterations; i++) {
        modifier.apply({} as DOMNode, mockContext)
      }

      const duration = performance.now() - start

      expect(duration).toBeLessThan(20) // Should complete within 20ms
      expect(mockElement.style.clipPath).toBe(`polygon(${complexPoints})`)
    })
  })
})
