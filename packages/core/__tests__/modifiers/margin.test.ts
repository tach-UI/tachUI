/**
 * Unit tests for MarginModifier
 */

import { beforeEach, describe, expect, it } from 'vitest'
import {
  MarginModifier,
  margin,
  marginBottom,
  marginHorizontal,
  marginTop,
  marginVertical,
} from '../../src/modifiers/margin'
import { createSignal } from '../../src/reactive'

describe('MarginModifier', () => {
  let mockElement: HTMLElement
  let mockContext: any

  beforeEach(() => {
    const mockStyle = {
      setProperty: (property: string, value: string) => {
        ;(mockStyle as any)[property] = value
        // Also set camelCase properties for backward compatibility
        const camelCase = property.replace(/-([a-z])/g, (g) => g[1].toUpperCase())
        if (camelCase !== property) {
          ;(mockStyle as any)[camelCase] = value
        }
      },
    } as CSSStyleDeclaration

    mockElement = {
      style: mockStyle,
    } as HTMLElement

    mockContext = {
      componentId: 'test-component',
      element: mockElement,
      phase: 'creation',
    }
  })

  describe('basic functionality', () => {
    it('should apply all margins', () => {
      const modifier = margin({ all: 16 })
      modifier.apply({} as any, mockContext)

      expect(mockElement.style.margin).toBe('16px')
    })

    it('should apply directional margins', () => {
      const modifier = margin({ top: 8, bottom: 16, left: 12, right: 4 })
      modifier.apply({} as any, mockContext)

      expect(mockElement.style.marginTop).toBe('8px')
      expect(mockElement.style.marginBottom).toBe('16px')
      expect(mockElement.style.marginLeft).toBe('12px')
      expect(mockElement.style.marginRight).toBe('4px')
    })

    it('should apply shorthand margins', () => {
      const modifier = margin({ vertical: 12, horizontal: 8 })
      modifier.apply({} as any, mockContext)

      expect(mockElement.style.marginTop).toBe('12px')
      expect(mockElement.style.marginBottom).toBe('12px')
      expect(mockElement.style.marginLeft).toBe('8px')
      expect(mockElement.style.marginRight).toBe('8px')
    })

    it('should prioritize specific sides over shorthand', () => {
      const modifier = margin({
        vertical: 10,
        horizontal: 20,
        top: 5,
        left: 15,
      })
      modifier.apply({} as any, mockContext)

      // Vertical sets top and bottom to 10, but top is overridden to 5
      expect(mockElement.style.marginTop).toBe('5px')
      expect(mockElement.style.marginBottom).toBe('10px')

      // Horizontal sets left and right to 20, but left is overridden to 15
      expect(mockElement.style.marginLeft).toBe('15px')
      expect(mockElement.style.marginRight).toBe('20px')
    })

    it('should prioritize all over everything else', () => {
      const modifier = margin({
        all: 24,
        vertical: 10,
        horizontal: 20,
        top: 5,
      })
      modifier.apply({} as any, mockContext)

      // When 'all' is specified, it should override everything
      expect(mockElement.style.margin).toBe('24px')
      // Other properties should not be set when 'all' is used
      expect(mockElement.style.marginTop).toBeUndefined()
    })
  })

  describe('convenience functions', () => {
    it('should support marginTop convenience function', () => {
      const modifier = marginTop(24)
      modifier.apply({} as any, mockContext)

      expect(mockElement.style.marginTop).toBe('24px')
      expect(mockElement.style.marginBottom).toBeUndefined()
      expect(mockElement.style.marginLeft).toBeUndefined()
      expect(mockElement.style.marginRight).toBeUndefined()
    })

    it('should support marginBottom convenience function', () => {
      const modifier = marginBottom(32)
      modifier.apply({} as any, mockContext)

      expect(mockElement.style.marginBottom).toBe('32px')
      expect(mockElement.style.marginTop).toBeUndefined()
    })

    it('should support marginHorizontal convenience function', () => {
      const modifier = marginHorizontal(16)
      modifier.apply({} as any, mockContext)

      expect(mockElement.style.marginLeft).toBe('16px')
      expect(mockElement.style.marginRight).toBe('16px')
      expect(mockElement.style.marginTop).toBeUndefined()
      expect(mockElement.style.marginBottom).toBeUndefined()
    })

    it('should support marginVertical convenience function', () => {
      const modifier = marginVertical(20)
      modifier.apply({} as any, mockContext)

      expect(mockElement.style.marginTop).toBe('20px')
      expect(mockElement.style.marginBottom).toBe('20px')
      expect(mockElement.style.marginLeft).toBeUndefined()
      expect(mockElement.style.marginRight).toBeUndefined()
    })

    it('should support number shorthand for all margins', () => {
      const modifier = margin(18)
      modifier.apply({} as any, mockContext)

      expect(mockElement.style.margin).toBe('18px')
    })
  })

  describe('reactive values', () => {
    it('should support signals in object syntax', () => {
      const [topMargin, setTopMargin] = createSignal(8)
      const [bottomMargin, setBottomMargin] = createSignal(16)

      const modifier = margin({ top: topMargin, bottom: bottomMargin })

      // Initial application
      modifier.apply({} as any, mockContext)
      expect(mockElement.style.marginTop).toBe('8px')
      expect(mockElement.style.marginBottom).toBe('16px')

      // Update signals
      setTopMargin(12)
      setBottomMargin(24)

      // Re-apply to simulate reactive update
      modifier.apply({} as any, mockContext)
      expect(mockElement.style.marginTop).toBe('12px')
      expect(mockElement.style.marginBottom).toBe('24px')
    })

    it('should support signals with shorthand properties', () => {
      const [verticalMargin, setVerticalMargin] = createSignal(10)
      const [horizontalMargin, setHorizontalMargin] = createSignal(20)

      const modifier = margin({
        vertical: verticalMargin,
        horizontal: horizontalMargin,
      })

      modifier.apply({} as any, mockContext)
      expect(mockElement.style.marginTop).toBe('10px')
      expect(mockElement.style.marginBottom).toBe('10px')
      expect(mockElement.style.marginLeft).toBe('20px')
      expect(mockElement.style.marginRight).toBe('20px')

      setVerticalMargin(15)
      setHorizontalMargin(25)

      modifier.apply({} as any, mockContext)
      expect(mockElement.style.marginTop).toBe('15px')
      expect(mockElement.style.marginBottom).toBe('15px')
      expect(mockElement.style.marginLeft).toBe('25px')
      expect(mockElement.style.marginRight).toBe('25px')
    })

    it('should support signals with all property', () => {
      const [allMargin, setAllMargin] = createSignal(14)

      const modifier = margin({ all: allMargin })

      modifier.apply({} as any, mockContext)
      expect(mockElement.style.margin).toBe('14px')

      setAllMargin(28)
      modifier.apply({} as any, mockContext)
      expect(mockElement.style.margin).toBe('28px')
    })
  })

  describe('edge cases', () => {
    it('should handle zero values', () => {
      const modifier = margin({ all: 0 })
      modifier.apply({} as any, mockContext)

      expect(mockElement.style.margin).toBe('0px')
    })

    it('should handle negative values', () => {
      const modifier = margin({ top: -8, left: -4 })
      modifier.apply({} as any, mockContext)

      expect(mockElement.style.marginTop).toBe('-8px')
      expect(mockElement.style.marginLeft).toBe('-4px')
    })

    it('should handle partial directional margins', () => {
      const modifier = margin({ top: 10, right: 20 })
      modifier.apply({} as any, mockContext)

      expect(mockElement.style.marginTop).toBe('10px')
      expect(mockElement.style.marginRight).toBe('20px')
      expect(mockElement.style.marginBottom).toBeUndefined()
      expect(mockElement.style.marginLeft).toBeUndefined()
    })

    it('should preserve existing styles not managed by the modifier', () => {
      mockElement.style.color = 'blue'
      mockElement.style.fontSize = '14px'

      const modifier = margin({ all: 16 })
      modifier.apply({} as any, mockContext)

      expect(mockElement.style.margin).toBe('16px')
      expect(mockElement.style.color).toBe('blue')
      expect(mockElement.style.fontSize).toBe('14px')
    })
  })

  describe('type safety', () => {
    it('should prevent conflicting type combinations at compile time', () => {
      // These should be type errors if TypeScript is working correctly:
      // margin({ all: 16, top: 8 }) // Should be type error
      // margin({ all: 16, vertical: 12 }) // Should be type error
      // margin({ vertical: 10, horizontal: 20, all: 16 }) // Should be type error

      // These should be valid:
      const valid1 = margin({ all: 16 })
      const valid2 = margin({ vertical: 12, horizontal: 8 })
      const valid3 = margin({ top: 8, bottom: 16, left: 4, right: 12 })
      const valid4 = margin({ horizontal: 20, top: 5, bottom: 15 })

      expect(valid1).toBeInstanceOf(MarginModifier)
      expect(valid2).toBeInstanceOf(MarginModifier)
      expect(valid3).toBeInstanceOf(MarginModifier)
      expect(valid4).toBeInstanceOf(MarginModifier)
    })
  })

  describe('modifier properties', () => {
    it('should have correct type and priority', () => {
      const modifier = margin({ all: 16 })

      expect(modifier.type).toBe('margin')
      expect(modifier.priority).toBe(50)
    })
  })
})
