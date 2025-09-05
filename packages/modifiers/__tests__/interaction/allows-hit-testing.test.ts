/**
 * Tests for AllowsHitTesting Modifier
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  AllowsHitTestingModifier,
  allowsHitTesting,
  enableHitTesting,
  disableHitTesting,
  type AllowsHitTestingOptions,
} from '../../src/interaction/allows-hit-testing'
import type { ModifierContext, DOMNode } from '../../src/types'

// Mock DOM environment
class MockElement {
  public style: Record<string, string> = {}
  public tabIndex = -1
}

describe('AllowsHitTestingModifier', () => {
  let mockElement: MockElement
  let mockContext: ModifierContext
  let mockNode: DOMNode

  beforeEach(() => {
    mockElement = new MockElement()
    mockContext = {
      componentId: 'test-component',
      element: mockElement as unknown as HTMLElement,
      phase: 'creation',
    }
    mockNode = { element: mockElement as unknown as HTMLElement, children: [] }
  })

  describe('basic functionality', () => {
    it('should create modifier with enabled option', () => {
      const modifier = new AllowsHitTestingModifier({ enabled: true })

      expect(modifier.type).toBe('allowsHitTesting')
      expect(modifier.priority).toBe(95)
      expect(modifier.properties.enabled).toBe(true)
    })

    it('should apply modifier to element', () => {
      const modifier = new AllowsHitTestingModifier({ enabled: true })

      const result = modifier.apply(mockNode, mockContext)

      expect(result).toBeUndefined()
      expect((mockElement as any)._hitTestingEnabled).toBe(true)
    })

    it('should handle null context element gracefully', () => {
      const modifier = new AllowsHitTestingModifier({ enabled: true })
      const nullContext = { ...mockContext, element: undefined }

      expect(() => {
        modifier.apply(mockNode, nullContext)
      }).not.toThrow()
    })

    it('should handle non-HTMLElement gracefully', () => {
      const svgElement = { tagName: 'svg' } as unknown as HTMLElement
      const svgContext = { ...mockContext, element: svgElement }
      const modifier = new AllowsHitTestingModifier({ enabled: true })

      expect(() => {
        modifier.apply(mockNode, svgContext)
      }).not.toThrow()
    })
  })

  describe('enabling hit testing', () => {
    it('should enable hit testing when enabled is true', () => {
      mockElement.style.pointerEvents = 'none' // Start disabled

      const modifier = new AllowsHitTestingModifier({ enabled: true })

      modifier.apply(mockNode, mockContext)

      expect(mockElement.style.pointerEvents).toBe('')
      expect((mockElement as any)._hitTestingEnabled).toBe(true)
    })

    it('should not change pointerEvents if not previously set to none', () => {
      mockElement.style.pointerEvents = 'auto'

      const modifier = new AllowsHitTestingModifier({ enabled: true })

      modifier.apply(mockNode, mockContext)

      // Should not change existing value if it's not 'none'
      expect(mockElement.style.pointerEvents).toBe('auto')
      expect((mockElement as any)._hitTestingEnabled).toBe(true)
    })

    it('should clear pointerEvents when enabling from disabled state', () => {
      mockElement.style.pointerEvents = 'none'

      const modifier = new AllowsHitTestingModifier({ enabled: true })

      modifier.apply(mockNode, mockContext)

      expect(mockElement.style.pointerEvents).toBe('')
      expect((mockElement as any)._hitTestingEnabled).toBe(true)
    })
  })

  describe('disabling hit testing', () => {
    it('should disable hit testing when enabled is false', () => {
      const modifier = new AllowsHitTestingModifier({ enabled: false })

      modifier.apply(mockNode, mockContext)

      expect(mockElement.style.pointerEvents).toBe('none')
      expect((mockElement as any)._hitTestingEnabled).toBe(false)
    })

    it('should override existing pointerEvents when disabling', () => {
      mockElement.style.pointerEvents = 'auto'

      const modifier = new AllowsHitTestingModifier({ enabled: false })

      modifier.apply(mockNode, mockContext)

      expect(mockElement.style.pointerEvents).toBe('none')
      expect((mockElement as any)._hitTestingEnabled).toBe(false)
    })
  })

  describe('state tracking', () => {
    it('should store hit testing state on element', () => {
      const enabledModifier = new AllowsHitTestingModifier({ enabled: true })
      enabledModifier.apply(mockNode, mockContext)

      expect((mockElement as any)._hitTestingEnabled).toBe(true)

      const disabledModifier = new AllowsHitTestingModifier({ enabled: false })
      disabledModifier.apply(mockNode, mockContext)

      expect((mockElement as any)._hitTestingEnabled).toBe(false)
    })
  })

  describe('factory functions', () => {
    it('should create modifier via allowsHitTesting factory', () => {
      const modifier = allowsHitTesting(true)

      expect(modifier).toBeInstanceOf(AllowsHitTestingModifier)
      expect(modifier.properties.enabled).toBe(true)
    })

    it('should create modifier for disabling hit testing', () => {
      const modifier = allowsHitTesting(false)

      expect(modifier).toBeInstanceOf(AllowsHitTestingModifier)
      expect(modifier.properties.enabled).toBe(false)
    })

    it('should create enabled modifier via enableHitTesting convenience factory', () => {
      const modifier = enableHitTesting()

      expect(modifier).toBeInstanceOf(AllowsHitTestingModifier)
      expect(modifier.properties.enabled).toBe(true)
    })

    it('should create disabled modifier via disableHitTesting convenience factory', () => {
      const modifier = disableHitTesting()

      expect(modifier).toBeInstanceOf(AllowsHitTestingModifier)
      expect(modifier.properties.enabled).toBe(false)
    })

    it('should support AllowsHitTestingOptions interface', () => {
      const options: AllowsHitTestingOptions = { enabled: false }
      const modifier = new AllowsHitTestingModifier(options)

      expect(modifier.properties).toEqual(options)
    })
  })

  describe('CSS pointer-events behavior', () => {
    it('should work correctly with different initial pointer-events values', () => {
      const testCases = [
        { initial: '', enabled: false, expected: 'none' },
        { initial: 'auto', enabled: false, expected: 'none' },
        { initial: 'all', enabled: false, expected: 'none' },
        { initial: 'none', enabled: true, expected: '' },
        { initial: 'auto', enabled: true, expected: 'auto' }, // Should not change
        { initial: '', enabled: true, expected: '' },
      ]

      testCases.forEach(({ initial, enabled, expected }) => {
        const element = new MockElement()
        element.style.pointerEvents = initial
        const context = {
          ...mockContext,
          element: element as unknown as HTMLElement,
        }

        const modifier = new AllowsHitTestingModifier({ enabled })
        modifier.apply(mockNode, context)

        expect(element.style.pointerEvents).toBe(expected)
      })
    })
  })

  describe('priority and integration', () => {
    it('should have high priority for proper application order', () => {
      const modifier = new AllowsHitTestingModifier({ enabled: true })

      // Priority 95 should be higher than most other modifiers
      expect(modifier.priority).toBe(95)
      expect(modifier.priority).toBeGreaterThan(80) // Higher than interaction modifiers
    })

    it('should work correctly when applied multiple times', () => {
      const modifier1 = new AllowsHitTestingModifier({ enabled: false })
      const modifier2 = new AllowsHitTestingModifier({ enabled: true })

      // Disable first
      modifier1.apply(mockNode, mockContext)
      expect(mockElement.style.pointerEvents).toBe('none')
      expect((mockElement as any)._hitTestingEnabled).toBe(false)

      // Then enable
      modifier2.apply(mockNode, mockContext)
      expect(mockElement.style.pointerEvents).toBe('')
      expect((mockElement as any)._hitTestingEnabled).toBe(true)
    })

    it('should handle rapid enable/disable cycles', () => {
      const disableModifier = new AllowsHitTestingModifier({ enabled: false })
      const enableModifier = new AllowsHitTestingModifier({ enabled: true })

      // Rapid cycling
      for (let i = 0; i < 5; i++) {
        disableModifier.apply(mockNode, mockContext)
        expect(mockElement.style.pointerEvents).toBe('none')

        enableModifier.apply(mockNode, mockContext)
        expect(mockElement.style.pointerEvents).toBe('')
      }

      expect((mockElement as any)._hitTestingEnabled).toBe(true)
    })
  })

  describe('edge cases', () => {
    it('should handle boolean true/false correctly', () => {
      const trueModifier = new AllowsHitTestingModifier({ enabled: true })
      const falseModifier = new AllowsHitTestingModifier({ enabled: false })

      trueModifier.apply(mockNode, mockContext)
      expect((mockElement as any)._hitTestingEnabled).toBe(true)

      falseModifier.apply(mockNode, mockContext)
      expect((mockElement as any)._hitTestingEnabled).toBe(false)
    })

    it('should preserve element reference in state tracking', () => {
      const modifier = new AllowsHitTestingModifier({ enabled: true })

      modifier.apply(mockNode, mockContext)

      expect((mockElement as any)._hitTestingEnabled).toBe(true)

      // Should be the same reference
      const storedState = (mockElement as any)._hitTestingEnabled
      expect(typeof storedState).toBe('boolean')
    })

    it('should handle elements without style property', () => {
      const elementWithoutStyle = {} as unknown as HTMLElement
      const contextWithoutStyle = {
        ...mockContext,
        element: elementWithoutStyle,
      }
      const modifier = new AllowsHitTestingModifier({ enabled: true })

      expect(() => {
        modifier.apply(mockNode, contextWithoutStyle)
      }).not.toThrow()
    })
  })

  describe('real-world usage scenarios', () => {
    it('should properly disable click-through on overlays', () => {
      // Simulate overlay that should block clicks
      mockElement.style.position = 'absolute'
      mockElement.style.zIndex = '1000'

      const modifier = new AllowsHitTestingModifier({ enabled: false })
      modifier.apply(mockNode, mockContext)

      expect(mockElement.style.pointerEvents).toBe('none')
      expect((mockElement as any)._hitTestingEnabled).toBe(false)
    })

    it('should properly enable interactions on transparent elements', () => {
      // Simulate transparent element that should still be clickable
      mockElement.style.backgroundColor = 'transparent'
      mockElement.style.pointerEvents = 'none' // Initially disabled

      const modifier = new AllowsHitTestingModifier({ enabled: true })
      modifier.apply(mockNode, mockContext)

      expect(mockElement.style.pointerEvents).toBe('')
      expect((mockElement as any)._hitTestingEnabled).toBe(true)
    })

    it('should work with disabled interactive elements', () => {
      // Simulate disabled button that should not receive clicks
      mockElement.style.opacity = '0.5'

      const modifier = new AllowsHitTestingModifier({ enabled: false })
      modifier.apply(mockNode, mockContext)

      expect(mockElement.style.pointerEvents).toBe('none')
      expect((mockElement as any)._hitTestingEnabled).toBe(false)
    })
  })
})
