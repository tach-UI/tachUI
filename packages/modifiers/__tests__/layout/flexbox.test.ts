/**
 * Enhanced Flexbox Modifier Tests
 *
 * Comprehensive tests for the best-in-class flexbox implementation
 * including modern CSS features, presets, and comprehensive edge cases.
 */

import { beforeEach, describe, expect, it } from 'vitest'
import {
  FlexboxModifier,
  flexbox,
  flexGrow,
  flexShrink,
  flexBasis,
  justifyContent,
  alignItems,
  alignSelf,
  gap,
  flexDirection,
  flexWrap,
  flexboxPresets,
} from '../../src/layout/flexbox'
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

describe('Enhanced Flexbox Modifier System', () => {
  let mockElement: MockElement
  let mockContext: ModifierContext

  beforeEach(() => {
    mockElement = new MockElement()
    mockContext = {
      element: mockElement as unknown as HTMLElement,
    }
  })

  describe('FlexboxModifier Class', () => {
    it('should have correct type and priority', () => {
      const modifier = flexbox({ display: 'flex' })
      expect(modifier.type).toBe('flexbox')
      expect(modifier.priority).toBe(60)
    })

    it('should apply display property', () => {
      const modifier = flexbox({ display: 'flex' })
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.display).toBe('flex')
    })

    it('should apply inline-flex display', () => {
      const modifier = flexbox({ display: 'inline-flex' })
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.display).toBe('inline-flex')
    })

    it('should apply core flex properties', () => {
      const modifier = flexbox({
        flexGrow: 1,
        flexShrink: 0,
        flexBasis: 'auto',
        flex: '1 0 auto',
      })
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.flexGrow).toBe('1')
      expect(mockElement.style.flexShrink).toBe('0')
      expect(mockElement.style.flexBasis).toBe('auto')
      expect(mockElement.style.flex).toBe('1 0 auto')
    })

    it('should apply container alignment properties', () => {
      const modifier = flexbox({
        justifyContent: 'space-between',
        alignItems: 'center',
        alignContent: 'stretch',
      })
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.justifyContent).toBe('space-between')
      expect(mockElement.style.alignItems).toBe('center')
      expect(mockElement.style.alignContent).toBe('stretch')
    })

    it('should apply item-specific alignment', () => {
      const modifier = flexbox({ alignSelf: 'flex-end' })
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.alignSelf).toBe('flex-end')
    })

    it('should apply direction and wrapping', () => {
      const modifier = flexbox({
        flexDirection: 'column',
        flexWrap: 'wrap',
        flexFlow: 'column wrap',
      })
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.flexDirection).toBe('column')
      expect(mockElement.style.flexWrap).toBe('wrap')
      expect(mockElement.style.flexFlow).toBe('column wrap')
    })

    it('should apply gap properties with numeric values', () => {
      const modifier = flexbox({
        gap: 16,
        rowGap: 12,
        columnGap: 20,
      })
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.gap).toBe('16px')
      expect(mockElement.style.rowGap).toBe('12px')
      expect(mockElement.style.columnGap).toBe('20px')
    })

    it('should apply gap properties with CSS units', () => {
      const modifier = flexbox({
        gap: '1rem',
        rowGap: '2vh',
        columnGap: '10%',
      })
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.gap).toBe('1rem')
      expect(mockElement.style.rowGap).toBe('2vh')
      expect(mockElement.style.columnGap).toBe('10%')
    })

    it('should apply modern CSS Grid alignment properties', () => {
      const modifier = flexbox({
        placeItems: 'center',
        placeContent: 'space-around',
        placeSelf: 'end',
      })
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.placeItems).toBe('center')
      expect(mockElement.style.placeContent).toBe('space-around')
      expect(mockElement.style.placeSelf).toBe('end')
    })

    it('should handle modern alignment values', () => {
      const modifier = flexbox({
        justifyContent: 'start',
        alignItems: 'end',
        alignSelf: 'first baseline',
      })
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.justifyContent).toBe('start')
      expect(mockElement.style.alignItems).toBe('end')
      expect(mockElement.style.alignSelf).toBe('first baseline')
    })

    it('should handle flex-basis with different value types', () => {
      const testCases = [
        { value: 'auto', expected: 'auto' },
        { value: 200, expected: '200px' },
        { value: '50%', expected: '50%' },
        { value: 'content', expected: 'content' },
        { value: 'max-content', expected: 'max-content' },
        { value: 'fit-content', expected: 'fit-content' },
      ]

      testCases.forEach(({ value, expected }, index) => {
        const modifier = flexbox({ flexBasis: value })
        modifier.apply({} as DOMNode, mockContext)
        expect(mockElement.style.flexBasis).toBe(expected)

        if (index < testCases.length - 1) {
          mockElement = new MockElement()
          mockContext.element = mockElement as unknown as HTMLElement
        }
      })
    })

    it('should handle flex property variations', () => {
      const testCases = [
        { value: 1, expected: '1' },
        { value: 'auto', expected: 'auto' },
        { value: 'initial', expected: 'initial' },
        { value: 'none', expected: 'none' },
        { value: '1 0 200px', expected: '1 0 200px' },
      ]

      testCases.forEach(({ value, expected }, index) => {
        const modifier = flexbox({ flex: value })
        modifier.apply({} as DOMNode, mockContext)
        expect(mockElement.style.flex).toBe(expected)

        if (index < testCases.length - 1) {
          mockElement = new MockElement()
          mockContext.element = mockElement as unknown as HTMLElement
        }
      })
    })
  })

  describe('Convenience Functions', () => {
    it('should create flex-grow modifier', () => {
      const modifier = flexGrow(2)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.flexGrow).toBe('2')
    })

    it('should create flex-shrink modifier', () => {
      const modifier = flexShrink(0)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.flexShrink).toBe('0')
    })

    it('should create flex-basis modifier', () => {
      const modifier = flexBasis('50%')
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.flexBasis).toBe('50%')
    })

    it('should create justify-content modifier', () => {
      const modifier = justifyContent('space-evenly')
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.justifyContent).toBe('space-evenly')
    })

    it('should create align-items modifier', () => {
      const modifier = alignItems('baseline')
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.alignItems).toBe('baseline')
    })

    it('should create align-self modifier', () => {
      const modifier = alignSelf('stretch')
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.alignSelf).toBe('stretch')
    })

    it('should create gap modifier with numeric value', () => {
      const modifier = gap(24)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.gap).toBe('24px')
    })

    it('should create gap modifier with CSS units', () => {
      const modifier = gap('2rem')
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.gap).toBe('2rem')
    })

    it('should create flex-direction modifier', () => {
      const modifier = flexDirection('row-reverse')
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.flexDirection).toBe('row-reverse')
    })

    it('should create flex-wrap modifier', () => {
      const modifier = flexWrap('wrap-reverse')
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.flexWrap).toBe('wrap-reverse')
    })
  })

  describe('Design System Presets', () => {
    it('should provide container presets', () => {
      // Standard flex container
      flexboxPresets.container().apply({} as DOMNode, mockContext)
      expect(mockElement.style.display).toBe('flex')

      mockElement = new MockElement()
      mockContext.element = mockElement as unknown as HTMLElement

      // Inline flex container
      flexboxPresets.inline().apply({} as DOMNode, mockContext)
      expect(mockElement.style.display).toBe('inline-flex')
    })

    it('should provide alignment presets', () => {
      // Horizontal center
      flexboxPresets.hcenter().apply({} as DOMNode, mockContext)
      expect(mockElement.style.display).toBe('flex')
      expect(mockElement.style.flexDirection).toBe('row')
      expect(mockElement.style.justifyContent).toBe('center')
      expect(mockElement.style.alignItems).toBe('center')

      mockElement = new MockElement()
      mockContext.element = mockElement as unknown as HTMLElement

      // Vertical center
      flexboxPresets.vcenter().apply({} as DOMNode, mockContext)
      expect(mockElement.style.display).toBe('flex')
      expect(mockElement.style.flexDirection).toBe('column')
      expect(mockElement.style.justifyContent).toBe('center')
      expect(mockElement.style.alignItems).toBe('center')

      mockElement = new MockElement()
      mockContext.element = mockElement as unknown as HTMLElement

      // Space between
      flexboxPresets.spaceBetween().apply({} as DOMNode, mockContext)
      expect(mockElement.style.display).toBe('flex')
      expect(mockElement.style.justifyContent).toBe('space-between')
      expect(mockElement.style.alignItems).toBe('center')

      mockElement = new MockElement()
      mockContext.element = mockElement as unknown as HTMLElement

      // Space around
      flexboxPresets.spaceAround().apply({} as DOMNode, mockContext)
      expect(mockElement.style.display).toBe('flex')
      expect(mockElement.style.justifyContent).toBe('space-around')
      expect(mockElement.style.alignItems).toBe('center')
    })

    it('should provide layout presets', () => {
      // VStack
      flexboxPresets.vstack().apply({} as DOMNode, mockContext)
      expect(mockElement.style.display).toBe('flex')
      expect(mockElement.style.flexDirection).toBe('column')
      expect(mockElement.style.gap).toBe('16px')

      mockElement = new MockElement()
      mockContext.element = mockElement as unknown as HTMLElement

      // HStack
      flexboxPresets.hstack().apply({} as DOMNode, mockContext)
      expect(mockElement.style.display).toBe('flex')
      expect(mockElement.style.flexDirection).toBe('row')
      expect(mockElement.style.gap).toBe('16px')
      expect(mockElement.style.alignItems).toBe('center')

      mockElement = new MockElement()
      mockContext.element = mockElement as unknown as HTMLElement

      // Responsive wrap
      flexboxPresets.wrap().apply({} as DOMNode, mockContext)
      expect(mockElement.style.display).toBe('flex')
      expect(mockElement.style.flexWrap).toBe('wrap')
      expect(mockElement.style.gap).toBe('16px')
    })

    it('should provide semantic presets', () => {
      // Card layout
      flexboxPresets.card().apply({} as DOMNode, mockContext)
      expect(mockElement.style.display).toBe('flex')
      expect(mockElement.style.flexDirection).toBe('column')
      expect(mockElement.style.gap).toBe('12px')

      mockElement = new MockElement()
      mockContext.element = mockElement as unknown as HTMLElement

      // Form layout
      flexboxPresets.form().apply({} as DOMNode, mockContext)
      expect(mockElement.style.display).toBe('flex')
      expect(mockElement.style.flexDirection).toBe('column')
      expect(mockElement.style.gap).toBe('20px')

      mockElement = new MockElement()
      mockContext.element = mockElement as unknown as HTMLElement

      // Button group
      flexboxPresets.buttonGroup().apply({} as DOMNode, mockContext)
      expect(mockElement.style.display).toBe('flex')
      expect(mockElement.style.flexDirection).toBe('row')
      expect(mockElement.style.gap).toBe('8px')
      expect(mockElement.style.alignItems).toBe('center')

      mockElement = new MockElement()
      mockContext.element = mockElement as unknown as HTMLElement

      // Sidebar
      flexboxPresets.sidebar().apply({} as DOMNode, mockContext)
      expect(mockElement.style.display).toBe('flex')
      expect(mockElement.style.flexDirection).toBe('column')
      expect(mockElement.style.alignItems).toBe('stretch')
    })

    it('should provide flex item presets', () => {
      // Fill preset
      flexboxPresets.fill().apply({} as DOMNode, mockContext)
      expect(mockElement.style.flex).toBe('1')

      mockElement = new MockElement()
      mockContext.element = mockElement as unknown as HTMLElement

      // Fixed preset
      flexboxPresets.fixed().apply({} as DOMNode, mockContext)
      expect(mockElement.style.flexGrow).toBe('0')
      expect(mockElement.style.flexShrink).toBe('0')

      mockElement = new MockElement()
      mockContext.element = mockElement as unknown as HTMLElement

      // Stretch preset
      flexboxPresets.stretch().apply({} as DOMNode, mockContext)
      expect(mockElement.style.display).toBe('flex')
      expect(mockElement.style.alignItems).toBe('stretch')
    })
  })

  describe('Modern CSS Units Support', () => {
    it('should support viewport units', () => {
      const modifier = flexbox({
        gap: '5vw',
        flexBasis: '50vh',
      })
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.gap).toBe('5vw')
      expect(mockElement.style.flexBasis).toBe('50vh')
    })

    it('should support relative units', () => {
      const modifier = flexbox({
        gap: '1.5rem',
        flexBasis: '2em',
      })
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.gap).toBe('1.5rem')
      expect(mockElement.style.flexBasis).toBe('2em')
    })

    it('should support fr units (CSS Grid)', () => {
      const modifier = flexbox({ gap: '1fr' })
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.gap).toBe('1fr')
    })

    it('should handle invalid CSS values gracefully', () => {
      const modifier = flexbox({
        gap: 'invalid-unit',
        flexBasis: 'another-invalid',
      })
      modifier.apply({} as DOMNode, mockContext)

      // Should fall back to px for invalid values
      expect(mockElement.style.gap).toBe('invalid-unitpx')
      expect(mockElement.style.flexBasis).toBe('another-invalidpx')
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle zero values', () => {
      const modifier = flexbox({
        flexGrow: 0,
        gap: 0,
      })
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.flexGrow).toBe('0')
      expect(mockElement.style.gap).toBe('0px')
    })

    it('should handle decimal values', () => {
      const modifier = flexbox({
        flexGrow: 1.5,
        gap: 10.5,
      })
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.flexGrow).toBe('1.5')
      expect(mockElement.style.gap).toBe('10.5px')
    })

    it('should handle empty context gracefully', () => {
      const modifier = flexbox({ display: 'flex' })
      const emptyContext = { element: undefined }

      expect(() => {
        modifier.apply({} as DOMNode, emptyContext)
      }).not.toThrow()
    })

    it('should handle complex flex values', () => {
      const modifier = flexbox({
        flex: '2 1 300px',
      })
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.flex).toBe('2 1 300px')
    })
  })

  describe('Comprehensive Integration', () => {
    it('should apply complete flexbox layout', () => {
      const modifier = flexbox({
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'stretch',
        flexWrap: 'wrap',
        gap: '1rem',
        flexGrow: 1,
      })
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.display).toBe('flex')
      expect(mockElement.style.flexDirection).toBe('column')
      expect(mockElement.style.justifyContent).toBe('space-between')
      expect(mockElement.style.alignItems).toBe('stretch')
      expect(mockElement.style.flexWrap).toBe('wrap')
      expect(mockElement.style.gap).toBe('1rem')
      expect(mockElement.style.flexGrow).toBe('1')
    })

    it('should work with all modern CSS features', () => {
      const modifier = flexbox({
        display: 'flex',
        placeItems: 'center',
        gap: '2vw',
        flexBasis: 'fit-content',
        justifyContent: 'space-evenly',
        alignItems: 'first baseline',
      })
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.display).toBe('flex')
      expect(mockElement.style.placeItems).toBe('center')
      expect(mockElement.style.gap).toBe('2vw')
      expect(mockElement.style.flexBasis).toBe('fit-content')
      expect(mockElement.style.justifyContent).toBe('space-evenly')
      expect(mockElement.style.alignItems).toBe('first baseline')
    })
  })
})
