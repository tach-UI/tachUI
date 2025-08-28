/**
 * Tests for Phase 1 SwiftUI Modifiers
 *
 * Tests for .offset(), .clipped(), and .rotationEffect() modifiers
 */

import { beforeEach, describe, expect, it } from 'vitest'
import { AnimationModifier, AppearanceModifier, LayoutModifier } from '../../src/modifiers/base'
import { ModifierBuilderImpl } from '../../src/modifiers/builder'
import type { ModifierContext } from '../../src/modifiers/types'
import { createSignal } from '../../src/reactive'
import type { ComponentInstance } from '../../src/runtime/types'

// Mock component for testing
const mockComponent: ComponentInstance = {
  type: 'component',
  id: 'test-component',
  render: () => ({ element: document.createElement('div'), children: [] }),
}

// Mock DOM element for testing
const createMockElement = () => {
  const element = document.createElement('div')
  // Mock getBoundingClientRect for intersection observer
  element.getBoundingClientRect = () => ({
    top: 0,
    left: 0,
    bottom: 100,
    right: 100,
    width: 100,
    height: 100,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  })
  return element
}

describe('Phase 1 SwiftUI Modifiers', () => {
  let builder: ModifierBuilderImpl
  let mockElement: HTMLElement
  let mockContext: ModifierContext

  beforeEach(() => {
    builder = new ModifierBuilderImpl(mockComponent)
    mockElement = createMockElement()
    mockContext = {
      componentId: 'test-component',
      element: mockElement,
      phase: 'creation',
    }
  })

  describe('.offset(x, y) modifier', () => {
    it('should add offset modifier with static values', () => {
      const component = builder.offset(10, 20).build()

      expect(component.modifiers).toHaveLength(1)
      expect(component.modifiers[0]).toBeInstanceOf(LayoutModifier)
      expect((component.modifiers[0] as LayoutModifier).properties).toEqual({
        offset: { x: 10, y: 20 },
      })
    })

    it('should add offset modifier with only x value', () => {
      const component = builder.offset(15).build()

      expect(component.modifiers).toHaveLength(1)
      expect((component.modifiers[0] as LayoutModifier).properties).toEqual({
        offset: { x: 15, y: 0 },
      })
    })

    it('should add offset modifier with reactive values', () => {
      const [xSignal, _setX] = createSignal(5)
      const [ySignal, _setY] = createSignal(10)

      const component = builder.offset(xSignal, ySignal).build()

      expect(component.modifiers).toHaveLength(1)
      expect((component.modifiers[0] as LayoutModifier).properties).toEqual({
        offset: { x: xSignal, y: ySignal },
      })
    })

    it('should apply CSS transform translate when modifier is applied', () => {
      const offsetModifier = new LayoutModifier({ offset: { x: 10, y: 20 } })

      offsetModifier.apply({ element: mockElement, children: [] }, mockContext)

      expect(mockElement.style.transform).toBe('translate(10px, 20px)')
    })

    it('should combine with existing transforms', () => {
      // Set existing transform
      mockElement.style.transform = 'scale(1.2)'

      const offsetModifier = new LayoutModifier({ offset: { x: 10, y: 20 } })

      offsetModifier.apply({ element: mockElement, children: [] }, mockContext)

      expect(mockElement.style.transform).toBe('scale(1.2) translate(10px, 20px)')
    })

    it('should handle reactive offset values setup', () => {
      const [xSignal, setX] = createSignal(0)
      const [ySignal, setY] = createSignal(0)

      const offsetModifier = new LayoutModifier({
        offset: { x: xSignal, y: ySignal },
      })

      // Verify the modifier stores the signals correctly
      expect((offsetModifier.properties as any).offset.x).toBe(xSignal)
      expect((offsetModifier.properties as any).offset.y).toBe(ySignal)

      // Update signal values to verify reactivity works
      setX(25)
      setY(35)

      expect(xSignal()).toBe(25)
      expect(ySignal()).toBe(35)
    })
  })

  describe('.clipped() modifier', () => {
    it('should add clipped modifier', () => {
      const component = builder.clipped().build()

      expect(component.modifiers).toHaveLength(1)
      expect(component.modifiers[0]).toBeInstanceOf(AppearanceModifier)
      expect((component.modifiers[0] as AppearanceModifier).properties).toEqual({
        clipped: true,
      })
    })

    it('should apply overflow hidden when modifier is applied', () => {
      const clippedModifier = new AppearanceModifier({ clipped: true })

      clippedModifier.apply({ element: mockElement, children: [] }, mockContext)

      expect(mockElement.style.overflow).toBe('hidden')
    })

    it('should not affect element when clipped is false', () => {
      const clippedModifier = new AppearanceModifier({ clipped: false })

      clippedModifier.apply({ element: mockElement, children: [] }, mockContext)

      expect(mockElement.style.overflow).toBe('')
    })

    it('should work in combination with other appearance modifiers', () => {
      const component = builder.backgroundColor('#FF0000').clipped().cornerRadius(8).build()

      expect(component.modifiers).toHaveLength(3)

      // Apply all modifiers
      component.modifiers.forEach((modifier) => {
        modifier.apply({ element: mockElement, children: [] }, mockContext)
      })

      expect(mockElement.style.backgroundColor).toBe('rgb(255, 0, 0)')
      expect(mockElement.style.overflow).toBe('hidden')
      expect(mockElement.style.borderRadius).toBe('8px')
    })
  })

  describe('.rotationEffect(angle, anchor) modifier', () => {
    it('should add rotation effect modifier with static angle', () => {
      const component = builder.rotationEffect(45).build()

      expect(component.modifiers).toHaveLength(1)
      expect(component.modifiers[0]).toBeInstanceOf(AnimationModifier)
      expect((component.modifiers[0] as AnimationModifier).properties).toEqual({
        rotationEffect: { angle: 45, anchor: 'center' },
      })
    })

    it('should add rotation effect modifier with custom anchor', () => {
      const component = builder.rotationEffect(90, 'topLeading').build()

      expect(component.modifiers).toHaveLength(1)
      expect((component.modifiers[0] as AnimationModifier).properties).toEqual({
        rotationEffect: { angle: 90, anchor: 'topLeading' },
      })
    })

    it('should add rotation effect modifier with reactive angle', () => {
      const [angleSignal] = createSignal(30)
      const component = builder.rotationEffect(angleSignal, 'bottom').build()

      expect(component.modifiers).toHaveLength(1)
      expect((component.modifiers[0] as AnimationModifier).properties).toEqual({
        rotationEffect: { angle: angleSignal, anchor: 'bottom' },
      })
    })

    it('should apply CSS transform rotate with center anchor', () => {
      const rotationModifier = new AnimationModifier({
        rotationEffect: { angle: 45, anchor: 'center' },
      })

      rotationModifier.apply({ element: mockElement, children: [] }, mockContext)

      expect(mockElement.style.transformOrigin).toBe('50% 50%')
      expect(mockElement.style.transform).toBe('rotate(45deg)')
    })

    it('should apply CSS transform rotate with topLeading anchor', () => {
      const rotationModifier = new AnimationModifier({
        rotationEffect: { angle: 90, anchor: 'topLeading' },
      })

      rotationModifier.apply({ element: mockElement, children: [] }, mockContext)

      expect(mockElement.style.transformOrigin).toBe('0% 0%')
      expect(mockElement.style.transform).toBe('rotate(90deg)')
    })

    it('should apply CSS transform rotate with bottomTrailing anchor', () => {
      const rotationModifier = new AnimationModifier({
        rotationEffect: { angle: -45, anchor: 'bottomTrailing' },
      })

      rotationModifier.apply({ element: mockElement, children: [] }, mockContext)

      expect(mockElement.style.transformOrigin).toBe('100% 100%')
      expect(mockElement.style.transform).toBe('rotate(-45deg)')
    })

    it('should combine rotation with existing transforms', () => {
      // Set existing transform
      mockElement.style.transform = 'translate(10px, 20px) scale(1.5)'

      const rotationModifier = new AnimationModifier({
        rotationEffect: { angle: 60, anchor: 'center' },
      })

      rotationModifier.apply({ element: mockElement, children: [] }, mockContext)

      expect(mockElement.style.transform).toBe('translate(10px, 20px) scale(1.5) rotate(60deg)')
    })

    it('should replace existing rotation transforms', () => {
      // Set existing transform with rotation
      mockElement.style.transform = 'translate(10px, 20px) rotate(30deg) scale(1.2)'

      const rotationModifier = new AnimationModifier({
        rotationEffect: { angle: 120, anchor: 'center' },
      })

      rotationModifier.apply({ element: mockElement, children: [] }, mockContext)

      expect(mockElement.style.transform).toBe('translate(10px, 20px) scale(1.2) rotate(120deg)')
    })

    it('should handle all anchor positions correctly', () => {
      const anchors = [
        { anchor: 'center', expected: '50% 50%' },
        { anchor: 'top', expected: '50% 0%' },
        { anchor: 'topLeading', expected: '0% 0%' },
        { anchor: 'topTrailing', expected: '100% 0%' },
        { anchor: 'bottom', expected: '50% 100%' },
        { anchor: 'bottomLeading', expected: '0% 100%' },
        { anchor: 'bottomTrailing', expected: '100% 100%' },
        { anchor: 'leading', expected: '0% 50%' },
        { anchor: 'trailing', expected: '100% 50%' },
      ] as const

      anchors.forEach(({ anchor, expected }) => {
        const element = createMockElement()
        const rotationModifier = new AnimationModifier({
          rotationEffect: { angle: 45, anchor },
        })

        rotationModifier.apply({ element, children: [] }, { ...mockContext, element })

        expect(element.style.transformOrigin).toBe(expected)
        expect(element.style.transform).toBe('rotate(45deg)')
      })
    })
  })

  describe('Modifier combinations', () => {
    it('should combine offset, clipped, and rotation modifiers', () => {
      const component = builder
        .offset(10, 20)
        .clipped()
        .rotationEffect(45, 'topLeading')
        .backgroundColor('#FF0000')
        .build()

      expect(component.modifiers).toHaveLength(4)

      // Apply all modifiers
      component.modifiers.forEach((modifier) => {
        modifier.apply({ element: mockElement, children: [] }, mockContext)
      })

      // Check combined effects
      expect(mockElement.style.transform).toContain('translate(10px, 20px)')
      expect(mockElement.style.transform).toContain('rotate(45deg)')
      expect(mockElement.style.transformOrigin).toBe('0% 0%')
      expect(mockElement.style.overflow).toBe('hidden')
      expect(mockElement.style.backgroundColor).toBe('rgb(255, 0, 0)')
    })

    it('should handle reactive values in combination', () => {
      const [xSignal] = createSignal(5)
      const [angleSignal] = createSignal(30)

      const component = builder.offset(xSignal, 10).clipped().rotationEffect(angleSignal).build()

      expect(component.modifiers).toHaveLength(3)

      // Verify modifier properties
      const offsetModifier = component.modifiers.find((m) => m instanceof LayoutModifier)
      const appearanceModifier = component.modifiers.find((m) => m instanceof AppearanceModifier)
      const animationModifier = component.modifiers.find((m) => m instanceof AnimationModifier)

      expect(offsetModifier).toBeDefined()
      expect(appearanceModifier).toBeDefined()
      expect(animationModifier).toBeDefined()

      expect((offsetModifier as LayoutModifier).properties).toEqual({
        offset: { x: xSignal, y: 10 },
      })
      expect((appearanceModifier as AppearanceModifier).properties).toEqual({
        clipped: true,
      })
      expect((animationModifier as AnimationModifier).properties).toEqual({
        rotationEffect: { angle: angleSignal, anchor: 'center' },
      })
    })
  })

  describe('Error handling', () => {
    it('should handle missing element gracefully', () => {
      const offsetModifier = new LayoutModifier({ offset: { x: 10, y: 20 } })

      expect(() => {
        offsetModifier.apply(
          { element: null as any, children: [] },
          { ...mockContext, element: null as any }
        )
      }).not.toThrow()
    })

    it('should handle undefined context gracefully', () => {
      const clippedModifier = new AppearanceModifier({ clipped: true })

      expect(() => {
        clippedModifier.apply(
          { element: mockElement, children: [] },
          { ...mockContext, element: undefined }
        )
      }).not.toThrow()
    })

    it('should handle invalid anchor values by defaulting to center', () => {
      const rotationModifier = new AnimationModifier({
        rotationEffect: { angle: 45, anchor: 'invalid' as any },
      })

      rotationModifier.apply({ element: mockElement, children: [] }, mockContext)

      // Should default to center
      expect(mockElement.style.transformOrigin).toBe('50% 50%')
    })
  })
})
