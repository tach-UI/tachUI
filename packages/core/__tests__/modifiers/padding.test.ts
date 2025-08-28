/**
 * Padding Modifier Tests
 *
 * Tests for all directional padding modifiers and their edge cases.
 */

import { beforeEach, describe, expect, it } from 'vitest'
import {
  PaddingModifier,
  padding,
  paddingBottom,
  paddingHorizontal,
  paddingLeading,
  paddingLeft,
  paddingPresets,
  paddingRight,
  paddingTop,
  paddingTrailing,
  paddingVertical,
} from '../../src/modifiers/padding'
import type { ModifierContext } from '../../src/modifiers/types'
import type { DOMNode } from '../../src/runtime/types'

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
        return target[prop]
      },
    })
  }
}

describe('Padding Modifier System', () => {
  let mockElement: MockElement
  let context: ModifierContext
  let mockNode: DOMNode

  beforeEach(() => {
    mockElement = new MockElement()
    mockNode = {} as DOMNode
    context = {
      element: mockElement as any,
      componentId: 'test-component',
      instanceId: 'test-instance',
    }
  })

  describe('PaddingModifier Class', () => {
    it('should create padding modifier with correct type and priority', () => {
      const modifier = new PaddingModifier({ all: 16 })
      expect(modifier.type).toBe('padding')
      expect(modifier.priority).toBe(45)
    })

    it('should apply all-sides padding correctly', () => {
      const modifier = new PaddingModifier({ all: 16 })
      modifier.apply(mockNode, context)

      expect(mockElement.style.padding).toBe('16px')
      expect(mockElement.style['padding-top']).toBeUndefined()
      expect(mockElement.style['padding-right']).toBeUndefined()
      expect(mockElement.style['padding-bottom']).toBeUndefined()
      expect(mockElement.style['padding-left']).toBeUndefined()
    })

    it('should apply symmetric padding correctly', () => {
      const modifier = new PaddingModifier({ horizontal: 20, vertical: 12 })
      modifier.apply(mockNode, context)

      expect(mockElement.style['padding-top']).toBe('12px')
      expect(mockElement.style['padding-bottom']).toBe('12px')
      expect(mockElement.style['padding-left']).toBe('20px')
      expect(mockElement.style['padding-right']).toBe('20px')
      expect(mockElement.style.padding).toBeUndefined()
    })

    it('should apply individual sides correctly', () => {
      const modifier = new PaddingModifier({
        top: 8,
        right: 12,
        bottom: 16,
        left: 20,
      })
      modifier.apply(mockNode, context)

      expect(mockElement.style['padding-top']).toBe('8px')
      expect(mockElement.style['padding-right']).toBe('12px')
      expect(mockElement.style['padding-bottom']).toBe('16px')
      expect(mockElement.style['padding-left']).toBe('20px')
    })

    it('should apply SwiftUI-style leading/trailing correctly', () => {
      const modifier = new PaddingModifier({
        leading: 16,
        trailing: 8,
        vertical: 12,
      })
      modifier.apply(mockNode, context)

      expect(mockElement.style['padding-left']).toBe('16px') // leading = left in LTR
      expect(mockElement.style['padding-right']).toBe('8px') // trailing = right in LTR
      expect(mockElement.style['padding-top']).toBe('12px')
      expect(mockElement.style['padding-bottom']).toBe('12px')
    })

    it('should handle specific sides overriding symmetric values', () => {
      const modifier = new PaddingModifier({
        horizontal: 16,
        vertical: 12,
        top: 20, // Override vertical top
      })
      modifier.apply(mockNode, context)

      expect(mockElement.style['padding-top']).toBe('20px') // Overridden
      expect(mockElement.style['padding-bottom']).toBe('12px') // From vertical
      expect(mockElement.style['padding-left']).toBe('16px') // From horizontal
      expect(mockElement.style['padding-right']).toBe('16px') // From horizontal
    })

    it('should handle leading/trailing overriding horizontal values', () => {
      const modifier = new PaddingModifier({
        horizontal: 16,
        leading: 24, // Override horizontal left
      })
      modifier.apply(mockNode, context)

      expect(mockElement.style['padding-left']).toBe('24px') // Overridden by leading
      expect(mockElement.style['padding-right']).toBe('16px') // From horizontal
    })

    it('should handle zero values correctly', () => {
      const modifier = new PaddingModifier({ all: 0 })
      modifier.apply(mockNode, context)

      expect(mockElement.style.padding).toBe('0px')
    })

    it('should not apply styles when element is not available', () => {
      const modifier = new PaddingModifier({ all: 16 })
      const contextWithoutElement = {
        ...context,
        element: null,
      } as ModifierContext

      modifier.apply(mockNode, contextWithoutElement)
      expect(mockElement.style.padding).toBeUndefined()
    })
  })

  describe('Padding Convenience Functions', () => {
    describe('padding() function', () => {
      it('should create modifier with number value', () => {
        const modifier = padding(16)
        expect(modifier).toBeInstanceOf(PaddingModifier)

        modifier.apply(mockNode, context)
        expect(mockElement.style.padding).toBe('16px')
      })

      it('should create modifier with options object', () => {
        const modifier = padding({ horizontal: 20, vertical: 12 })
        expect(modifier).toBeInstanceOf(PaddingModifier)

        modifier.apply(mockNode, context)
        expect(mockElement.style['padding-left']).toBe('20px')
        expect(mockElement.style['padding-right']).toBe('20px')
        expect(mockElement.style['padding-top']).toBe('12px')
        expect(mockElement.style['padding-bottom']).toBe('12px')
      })
    })

    describe('Directional padding functions', () => {
      it('should create paddingTop modifier', () => {
        const modifier = paddingTop(16)
        modifier.apply(mockNode, context)

        expect(mockElement.style['padding-top']).toBe('16px')
        expect(mockElement.style['padding-right']).toBeUndefined()
        expect(mockElement.style['padding-bottom']).toBeUndefined()
        expect(mockElement.style['padding-left']).toBeUndefined()
      })

      it('should create paddingBottom modifier', () => {
        const modifier = paddingBottom(20)
        modifier.apply(mockNode, context)

        expect(mockElement.style['padding-bottom']).toBe('20px')
        expect(mockElement.style['padding-top']).toBeUndefined()
        expect(mockElement.style['padding-right']).toBeUndefined()
        expect(mockElement.style['padding-left']).toBeUndefined()
      })

      it('should create paddingLeft modifier', () => {
        const modifier = paddingLeft(12)
        modifier.apply(mockNode, context)

        expect(mockElement.style['padding-left']).toBe('12px')
        expect(mockElement.style['padding-top']).toBeUndefined()
        expect(mockElement.style['padding-right']).toBeUndefined()
        expect(mockElement.style['padding-bottom']).toBeUndefined()
      })

      it('should create paddingRight modifier', () => {
        const modifier = paddingRight(8)
        modifier.apply(mockNode, context)

        expect(mockElement.style['padding-right']).toBe('8px')
        expect(mockElement.style['padding-top']).toBeUndefined()
        expect(mockElement.style['padding-bottom']).toBeUndefined()
        expect(mockElement.style['padding-left']).toBeUndefined()
      })
    })

    describe('SwiftUI-style directional functions', () => {
      it('should create paddingLeading modifier (maps to left)', () => {
        const modifier = paddingLeading(16)
        modifier.apply(mockNode, context)

        expect(mockElement.style['padding-left']).toBe('16px')
        expect(mockElement.style['padding-right']).toBeUndefined()
      })

      it('should create paddingTrailing modifier (maps to right)', () => {
        const modifier = paddingTrailing(8)
        modifier.apply(mockNode, context)

        expect(mockElement.style['padding-right']).toBe('8px')
        expect(mockElement.style['padding-left']).toBeUndefined()
      })
    })

    describe('Symmetric padding functions', () => {
      it('should create paddingHorizontal modifier', () => {
        const modifier = paddingHorizontal(16)
        modifier.apply(mockNode, context)

        expect(mockElement.style['padding-left']).toBe('16px')
        expect(mockElement.style['padding-right']).toBe('16px')
        expect(mockElement.style['padding-top']).toBeUndefined()
        expect(mockElement.style['padding-bottom']).toBeUndefined()
      })

      it('should create paddingVertical modifier', () => {
        const modifier = paddingVertical(12)
        modifier.apply(mockNode, context)

        expect(mockElement.style['padding-top']).toBe('12px')
        expect(mockElement.style['padding-bottom']).toBe('12px')
        expect(mockElement.style['padding-left']).toBeUndefined()
        expect(mockElement.style['padding-right']).toBeUndefined()
      })
    })
  })

  describe('Padding Presets', () => {
    it('should provide extra small padding preset', () => {
      const modifier = paddingPresets.xs()
      modifier.apply(mockNode, context)
      expect(mockElement.style.padding).toBe('4px')
    })

    it('should provide small padding preset', () => {
      const modifier = paddingPresets.sm()
      modifier.apply(mockNode, context)
      expect(mockElement.style.padding).toBe('8px')
    })

    it('should provide medium padding preset', () => {
      const modifier = paddingPresets.md()
      modifier.apply(mockNode, context)
      expect(mockElement.style.padding).toBe('12px')
    })

    it('should provide large padding preset', () => {
      const modifier = paddingPresets.lg()
      modifier.apply(mockNode, context)
      expect(mockElement.style.padding).toBe('16px')
    })

    it('should provide extra large padding preset', () => {
      const modifier = paddingPresets.xl()
      modifier.apply(mockNode, context)
      expect(mockElement.style.padding).toBe('24px')
    })

    it('should provide extra extra large padding preset', () => {
      const modifier = paddingPresets.xxl()
      modifier.apply(mockNode, context)
      expect(mockElement.style.padding).toBe('32px')
    })

    it('should provide button padding preset', () => {
      const modifier = paddingPresets.button()
      modifier.apply(mockNode, context)

      expect(mockElement.style['padding-left']).toBe('16px')
      expect(mockElement.style['padding-right']).toBe('16px')
      expect(mockElement.style['padding-top']).toBe('8px')
      expect(mockElement.style['padding-bottom']).toBe('8px')
    })

    it('should provide card padding preset', () => {
      const modifier = paddingPresets.card()
      modifier.apply(mockNode, context)
      expect(mockElement.style.padding).toBe('16px')
    })

    it('should provide section padding preset', () => {
      const modifier = paddingPresets.section()
      modifier.apply(mockNode, context)

      expect(mockElement.style['padding-left']).toBe('20px')
      expect(mockElement.style['padding-right']).toBe('20px')
      expect(mockElement.style['padding-top']).toBe('12px')
      expect(mockElement.style['padding-bottom']).toBe('12px')
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle conflicting all and directional properties (all takes precedence)', () => {
      const modifier = new PaddingModifier({
        all: 20,
        // These should be ignored due to type constraints
      } as any)
      modifier.apply(mockNode, context)

      expect(mockElement.style.padding).toBe('20px')
      expect(mockElement.style['padding-top']).toBeUndefined()
    })

    it('should handle large padding values', () => {
      const modifier = padding(1000)
      modifier.apply(mockNode, context)
      expect(mockElement.style.padding).toBe('1000px')
    })

    it('should handle decimal padding values', () => {
      const modifier = padding(16.5)
      modifier.apply(mockNode, context)
      expect(mockElement.style.padding).toBe('16.5px')
    })

    it('should handle negative padding values', () => {
      const modifier = padding(-10)
      modifier.apply(mockNode, context)
      expect(mockElement.style.padding).toBe('-10px')
    })
  })

  describe('Complex Combinations', () => {
    it('should handle mixed symmetric and directional padding', () => {
      const modifier = padding({
        horizontal: 16,
        top: 8,
        bottom: 24,
      })
      modifier.apply(mockNode, context)

      expect(mockElement.style['padding-left']).toBe('16px') // From horizontal
      expect(mockElement.style['padding-right']).toBe('16px') // From horizontal
      expect(mockElement.style['padding-top']).toBe('8px') // Specific override
      expect(mockElement.style['padding-bottom']).toBe('24px') // Specific override
    })

    it('should handle SwiftUI-style with traditional directional', () => {
      const modifier = padding({
        leading: 20,
        trailing: 8,
        top: 12,
        bottom: 16,
      })
      modifier.apply(mockNode, context)

      expect(mockElement.style['padding-left']).toBe('20px') // From leading
      expect(mockElement.style['padding-right']).toBe('8px') // From trailing
      expect(mockElement.style['padding-top']).toBe('12px') // Specific
      expect(mockElement.style['padding-bottom']).toBe('16px') // Specific
    })

    it('should handle all possible properties together with precedence', () => {
      const modifier = padding({
        vertical: 10,
        horizontal: 12,
        top: 8, // Overrides vertical top
        left: 16, // Overrides horizontal left
        leading: 20, // Overrides left (leading comes after left in processing)
      })
      modifier.apply(mockNode, context)

      expect(mockElement.style['padding-top']).toBe('8px') // Specific top overrides vertical
      expect(mockElement.style['padding-bottom']).toBe('10px') // From vertical
      expect(mockElement.style['padding-left']).toBe('20px') // Leading overrides horizontal and left
      expect(mockElement.style['padding-right']).toBe('12px') // From horizontal
    })
  })
})
