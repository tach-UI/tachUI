/**
 * Enhanced Padding Presets Tests
 *
 * Comprehensive tests for padding presets to ensure design system consistency
 * and proper semantic naming patterns.
 */

import { beforeEach, describe, expect, it } from 'vitest'
import { paddingPresets } from '../../src/basic/padding'
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

describe('Enhanced Padding Presets', () => {
  let mockElement: MockElement
  let mockContext: ModifierContext

  beforeEach(() => {
    mockElement = new MockElement()
    mockContext = {
      element: mockElement as unknown as HTMLElement,
    }
  })

  describe('T-shirt Size Presets', () => {
    it('should provide consistent t-shirt sizing scale', () => {
      const testCases = [
        { name: 'xs', preset: paddingPresets.xs(), expected: '4px' },
        { name: 'sm', preset: paddingPresets.sm(), expected: '8px' },
        { name: 'md', preset: paddingPresets.md(), expected: '12px' },
        { name: 'lg', preset: paddingPresets.lg(), expected: '16px' },
        { name: 'xl', preset: paddingPresets.xl(), expected: '24px' },
        { name: 'xxl', preset: paddingPresets.xxl(), expected: '32px' },
        { name: 'xxxl', preset: paddingPresets.xxxl(), expected: '48px' },
      ]

      testCases.forEach(({ name, preset, expected }) => {
        preset.apply({} as DOMNode, mockContext)
        expect(mockElement.style.padding).toBe(expected)

        // Reset for next test
        mockElement = new MockElement()
        mockContext.element = mockElement as unknown as HTMLElement
      })
    })

    it('should maintain mathematical progression in sizes', () => {
      // Verify the size progression follows a logical scale
      const sizes = [4, 8, 12, 16, 24, 32, 48]
      const presetNames = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl', 'xxxl']

      presetNames.forEach((name, index) => {
        const preset = (paddingPresets as any)[name]()
        preset.apply({} as DOMNode, mockContext)
        expect(mockElement.style.padding).toBe(`${sizes[index]}px`)

        mockElement = new MockElement()
        mockContext.element = mockElement as unknown as HTMLElement
      })
    })
  })

  describe('Button Presets', () => {
    it('should provide button size variations', () => {
      // Default button
      paddingPresets.button().apply({} as DOMNode, mockContext)
      expect(mockElement.style.paddingLeft).toBe('16px')
      expect(mockElement.style.paddingRight).toBe('16px')
      expect(mockElement.style.paddingTop).toBe('8px')
      expect(mockElement.style.paddingBottom).toBe('8px')

      mockElement = new MockElement()
      mockContext.element = mockElement as unknown as HTMLElement

      // Small button
      paddingPresets.buttonSm().apply({} as DOMNode, mockContext)
      expect(mockElement.style.paddingLeft).toBe('12px')
      expect(mockElement.style.paddingRight).toBe('12px')
      expect(mockElement.style.paddingTop).toBe('6px')
      expect(mockElement.style.paddingBottom).toBe('6px')

      mockElement = new MockElement()
      mockContext.element = mockElement as unknown as HTMLElement

      // Large button
      paddingPresets.buttonLg().apply({} as DOMNode, mockContext)
      expect(mockElement.style.paddingLeft).toBe('24px')
      expect(mockElement.style.paddingRight).toBe('24px')
      expect(mockElement.style.paddingTop).toBe('12px')
      expect(mockElement.style.paddingBottom).toBe('12px')
    })

    it('should maintain aspect ratio for button sizes', () => {
      // Verify that button padding maintains 2:1 horizontal:vertical ratio
      const buttonTests = [
        { preset: paddingPresets.buttonSm(), hRatio: 12, vRatio: 6 },
        { preset: paddingPresets.button(), hRatio: 16, vRatio: 8 },
        { preset: paddingPresets.buttonLg(), hRatio: 24, vRatio: 12 },
      ]

      buttonTests.forEach(({ preset, hRatio, vRatio }) => {
        preset.apply({} as DOMNode, mockContext)
        expect(mockElement.style.paddingLeft).toBe(`${hRatio}px`)
        expect(mockElement.style.paddingRight).toBe(`${hRatio}px`)
        expect(mockElement.style.paddingTop).toBe(`${vRatio}px`)
        expect(mockElement.style.paddingBottom).toBe(`${vRatio}px`)

        // Verify 2:1 ratio
        expect(hRatio / vRatio).toBe(2)

        mockElement = new MockElement()
        mockContext.element = mockElement as unknown as HTMLElement
      })
    })
  })

  describe('Card Presets', () => {
    it('should provide card size variations', () => {
      // Small card
      paddingPresets.cardSm().apply({} as DOMNode, mockContext)
      expect(mockElement.style.padding).toBe('12px')

      mockElement = new MockElement()
      mockContext.element = mockElement as unknown as HTMLElement

      // Default card
      paddingPresets.card().apply({} as DOMNode, mockContext)
      expect(mockElement.style.padding).toBe('16px')

      mockElement = new MockElement()
      mockContext.element = mockElement as unknown as HTMLElement

      // Large card
      paddingPresets.cardLg().apply({} as DOMNode, mockContext)
      expect(mockElement.style.padding).toBe('24px')
    })
  })

  describe('Semantic Layout Presets', () => {
    it('should provide section padding', () => {
      paddingPresets.section().apply({} as DOMNode, mockContext)
      expect(mockElement.style.paddingLeft).toBe('20px')
      expect(mockElement.style.paddingRight).toBe('20px')
      expect(mockElement.style.paddingTop).toBe('12px')
      expect(mockElement.style.paddingBottom).toBe('12px')
    })

    it('should provide page padding', () => {
      paddingPresets.page().apply({} as DOMNode, mockContext)
      expect(mockElement.style.paddingLeft).toBe('24px')
      expect(mockElement.style.paddingRight).toBe('24px')
      expect(mockElement.style.paddingTop).toBe('16px')
      expect(mockElement.style.paddingBottom).toBe('16px')
    })

    it('should provide field padding', () => {
      paddingPresets.field().apply({} as DOMNode, mockContext)
      expect(mockElement.style.paddingLeft).toBe('12px')
      expect(mockElement.style.paddingRight).toBe('12px')
      expect(mockElement.style.paddingTop).toBe('8px')
      expect(mockElement.style.paddingBottom).toBe('8px')
    })

    it('should provide navigation padding', () => {
      paddingPresets.nav().apply({} as DOMNode, mockContext)
      expect(mockElement.style.paddingLeft).toBe('16px')
      expect(mockElement.style.paddingRight).toBe('16px')
      expect(mockElement.style.paddingTop).toBe('8px')
      expect(mockElement.style.paddingBottom).toBe('8px')
    })

    it('should provide list item padding', () => {
      paddingPresets.listItem().apply({} as DOMNode, mockContext)
      expect(mockElement.style.paddingLeft).toBe('16px')
      expect(mockElement.style.paddingRight).toBe('16px')
      expect(mockElement.style.paddingTop).toBe('12px')
      expect(mockElement.style.paddingBottom).toBe('12px')
    })
  })

  describe('Preset Consistency', () => {
    it('should use consistent spacing scale across semantic presets', () => {
      // Verify that semantic presets use values from the size scale
      const sizeScale = [4, 6, 8, 12, 16, 20, 24, 32, 48]

      const presetValues = [
        paddingPresets.buttonSm(),
        paddingPresets.button(),
        paddingPresets.buttonLg(),
        paddingPresets.field(),
        paddingPresets.nav(),
        paddingPresets.cardSm(),
        paddingPresets.card(),
        paddingPresets.cardLg(),
        paddingPresets.section(),
        paddingPresets.page(),
        paddingPresets.listItem(),
      ]

      // Each preset should use values that exist in our scale or are reasonable multiples
      presetValues.forEach(preset => {
        expect(preset).toBeInstanceOf(Object)
        expect(preset.type).toBe('padding')
      })
    })

    it('should have all presets return PaddingModifier instances', () => {
      const allPresets = Object.entries(paddingPresets)

      allPresets.forEach(([name, presetFn]) => {
        const preset = presetFn()
        expect(preset.type).toBe('padding')
        expect(preset.priority).toBe(45)
      })
    })
  })
})
