/**
 * Enhanced Margin Modifier Tests
 *
 * Comprehensive tests for the best-in-class margin implementation
 * including SwiftUI compatibility, CSS units, presets, and edge cases.
 */

import { beforeEach, describe, expect, it } from 'vitest'
import {
  MarginModifier,
  margin,
  marginBottom,
  marginHorizontal,
  marginLeading,
  marginLeft,
  marginPresets,
  marginRight,
  marginTop,
  marginTrailing,
  marginVertical,
} from '../../src/basic/margin'
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
            // Also set camelCase version for test compatibility
            const camelCase = property.replace(/-([a-z])/g, (match, letter) =>
              letter.toUpperCase()
            )
            target[camelCase] = value
          }
        }
        return target[prop]
      },
    })
  }
}

describe('Enhanced Margin Modifier System', () => {
  let mockElement: MockElement
  let mockContext: ModifierContext

  beforeEach(() => {
    mockElement = new MockElement()
    mockContext = {
      element: mockElement as unknown as HTMLElement,
    }
  })

  describe('MarginModifier Class', () => {
    it('should have correct type and priority', () => {
      const modifier = margin(16)
      expect(modifier.type).toBe('margin')
      expect(modifier.priority).toBe(50)
    })

    it('should apply all-sides margin with numeric value', () => {
      const modifier = margin({ all: 16 })
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.margin).toBe('16px')
    })

    it('should apply all-sides margin with CSS units', () => {
      const modifier = margin({ all: '1rem' })
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.margin).toBe('1rem')
    })

    it('should apply symmetric margins', () => {
      const modifier = margin({ vertical: 20, horizontal: 16 })
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.marginTop).toBe('20px')
      expect(mockElement.style.marginBottom).toBe('20px')
      expect(mockElement.style.marginLeft).toBe('16px')
      expect(mockElement.style.marginRight).toBe('16px')
    })

    it('should apply individual side margins', () => {
      const modifier = margin({
        top: 10,
        right: 20,
        bottom: 30,
        left: 40,
      })
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.marginTop).toBe('10px')
      expect(mockElement.style.marginRight).toBe('20px')
      expect(mockElement.style.marginBottom).toBe('30px')
      expect(mockElement.style.marginLeft).toBe('40px')
    })

    it('should handle SwiftUI-style leading/trailing', () => {
      const modifier = margin({
        leading: 16,
        trailing: 24,
        vertical: 12,
      })
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.marginTop).toBe('12px')
      expect(mockElement.style.marginBottom).toBe('12px')
      expect(mockElement.style.marginLeft).toBe('16px') // leading -> left in LTR
      expect(mockElement.style.marginRight).toBe('24px') // trailing -> right in LTR
    })

    it('should override symmetric with specific sides', () => {
      const modifier = margin({
        horizontal: 20,
        vertical: 10,
        top: 30,
        left: 40,
      })
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.marginTop).toBe('30px') // overridden
      expect(mockElement.style.marginBottom).toBe('10px') // from vertical
      expect(mockElement.style.marginLeft).toBe('40px') // overridden
      expect(mockElement.style.marginRight).toBe('20px') // from horizontal
    })

    it('should handle auto values', () => {
      const modifier = margin({ horizontal: 'auto' })
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.marginLeft).toBe('auto')
      expect(mockElement.style.marginRight).toBe('auto')
    })

    it('should validate and normalize CSS values', () => {
      const modifier = margin({
        top: '2rem',
        right: '10%',
        bottom: '3vh',
        left: 'invalid-value', // Should fall back to px
      })
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.marginTop).toBe('2rem')
      expect(mockElement.style.marginRight).toBe('10%')
      expect(mockElement.style.marginBottom).toBe('3vh')
      expect(mockElement.style.marginLeft).toBe('invalid-valuepx') // fallback
    })
  })

  describe('Convenience Functions', () => {
    it('should create margin with shorthand numeric value', () => {
      const modifier = margin(24)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.margin).toBe('24px')
    })

    it('should create margin with shorthand string value', () => {
      const modifier = margin('auto')
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.margin).toBe('auto')
    })

    it('should apply top margin', () => {
      const modifier = marginTop(16)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.marginTop).toBe('16px')
    })

    it('should apply bottom margin', () => {
      const modifier = marginBottom('2rem')
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.marginBottom).toBe('2rem')
    })

    it('should apply left margin', () => {
      const modifier = marginLeft(12)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.marginLeft).toBe('12px')
    })

    it('should apply right margin', () => {
      const modifier = marginRight('1rem')
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.marginRight).toBe('1rem')
    })

    it('should apply leading margin (SwiftUI style)', () => {
      const modifier = marginLeading(16)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.marginLeft).toBe('16px') // leading -> left in LTR
    })

    it('should apply trailing margin (SwiftUI style)', () => {
      const modifier = marginTrailing('0.5rem')
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.marginRight).toBe('0.5rem') // trailing -> right in LTR
    })

    it('should apply horizontal margins', () => {
      const modifier = marginHorizontal(20)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.marginLeft).toBe('20px')
      expect(mockElement.style.marginRight).toBe('20px')
    })

    it('should apply vertical margins', () => {
      const modifier = marginVertical('1rem')
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.marginTop).toBe('1rem')
      expect(mockElement.style.marginBottom).toBe('1rem')
    })
  })

  describe('Design System Presets', () => {
    it('should provide t-shirt size presets', () => {
      const testCases = [
        { preset: marginPresets.xs(), expected: '4px' },
        { preset: marginPresets.sm(), expected: '8px' },
        { preset: marginPresets.md(), expected: '12px' },
        { preset: marginPresets.lg(), expected: '16px' },
        { preset: marginPresets.xl(), expected: '24px' },
        { preset: marginPresets.xxl(), expected: '32px' },
        { preset: marginPresets.xxxl(), expected: '48px' },
      ]

      testCases.forEach(({ preset, expected }) => {
        preset.apply({} as DOMNode, mockContext)
        expect(mockElement.style.margin).toBe(expected)
        mockElement = new MockElement()
        mockContext.element = mockElement as unknown as HTMLElement
      })
    })

    it('should provide semantic presets', () => {
      // Component separation
      marginPresets.component().apply({} as DOMNode, mockContext)
      expect(mockElement.style.marginTop).toBe('16px')
      expect(mockElement.style.marginBottom).toBe('16px')
      expect(mockElement.style.marginLeft).toBe('0px')
      expect(mockElement.style.marginRight).toBe('0px')

      mockElement = new MockElement()
      mockContext.element = mockElement as unknown as HTMLElement

      // Section separation
      marginPresets.section().apply({} as DOMNode, mockContext)
      expect(mockElement.style.marginTop).toBe('24px')
      expect(mockElement.style.marginBottom).toBe('24px')
      expect(mockElement.style.marginLeft).toBe('0px')
      expect(mockElement.style.marginRight).toBe('0px')

      mockElement = new MockElement()
      mockContext.element = mockElement as unknown as HTMLElement

      // Page centering
      marginPresets.page().apply({} as DOMNode, mockContext)
      expect(mockElement.style.marginLeft).toBe('auto')
      expect(mockElement.style.marginRight).toBe('auto')

      mockElement = new MockElement()
      mockContext.element = mockElement as unknown as HTMLElement

      // Button spacing
      marginPresets.button().apply({} as DOMNode, mockContext)
      expect(mockElement.style.marginTop).toBe('4px')
      expect(mockElement.style.marginBottom).toBe('4px')
      expect(mockElement.style.marginLeft).toBe('8px')
      expect(mockElement.style.marginRight).toBe('8px')
    })

    it('should provide utility presets', () => {
      // None preset
      marginPresets.none().apply({} as DOMNode, mockContext)
      expect(mockElement.style.margin).toBe('0px')

      mockElement = new MockElement()
      mockContext.element = mockElement as unknown as HTMLElement

      // Auto preset
      marginPresets.auto().apply({} as DOMNode, mockContext)
      expect(mockElement.style.margin).toBe('auto')
    })
  })

  describe('Modern CSS Units Support', () => {
    it('should support viewport units', () => {
      const modifier = margin({
        top: '10vw',
        right: '5vh',
        bottom: '2vmin',
        left: '3vmax',
      })
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.marginTop).toBe('10vw')
      expect(mockElement.style.marginRight).toBe('5vh')
      expect(mockElement.style.marginBottom).toBe('2vmin')
      expect(mockElement.style.marginLeft).toBe('3vmax')
    })

    it('should support relative units', () => {
      const modifier = margin({
        vertical: '2rem',
        horizontal: '1.5em',
      })
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.marginTop).toBe('2rem')
      expect(mockElement.style.marginBottom).toBe('2rem')
      expect(mockElement.style.marginLeft).toBe('1.5em')
      expect(mockElement.style.marginRight).toBe('1.5em')
    })

    it('should support percentage units', () => {
      const modifier = margin({ horizontal: '10%' })
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.marginLeft).toBe('10%')
      expect(mockElement.style.marginRight).toBe('10%')
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle zero values', () => {
      const modifier = margin({ all: 0 })
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.margin).toBe('0px')
    })

    it('should handle negative values', () => {
      const modifier = margin({ top: -10 })
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.marginTop).toBe('-10px')
    })

    it('should handle decimal values', () => {
      const modifier = margin({ all: 10.5 })
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.margin).toBe('10.5px')
    })

    it('should handle empty context gracefully', () => {
      const modifier = margin(16)
      const emptyContext = { element: undefined }

      expect(() => {
        modifier.apply({} as DOMNode, emptyContext)
      }).not.toThrow()
    })
  })

  describe('Type Safety', () => {
    it('should prevent conflicting property combinations with types', () => {
      // These should be caught by TypeScript at compile time
      // Testing that valid combinations work at runtime

      // Valid: all only
      expect(() => margin({ all: 16 })).not.toThrow()

      // Valid: symmetric only
      expect(() => margin({ vertical: 10, horizontal: 20 })).not.toThrow()

      // Valid: individual sides
      expect(() =>
        margin({ top: 10, right: 20, bottom: 30, left: 40 })
      ).not.toThrow()

      // Valid: SwiftUI style
      expect(() =>
        margin({ leading: 16, trailing: 24, vertical: 12 })
      ).not.toThrow()
    })
  })
})
