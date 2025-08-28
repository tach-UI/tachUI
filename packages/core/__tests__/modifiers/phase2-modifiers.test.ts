/**
 * Tests for Phase 2 SwiftUI Modifiers
 *
 * Tests for .aspectRatio(), .fixedSize(), .clipShape(), and .overlay() modifiers
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
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

// Mock content component for overlay tests
const mockOverlayComponent: ComponentInstance = {
  type: 'component',
  id: 'overlay-component',
  render: () => ({ element: document.createElement('span'), children: [] }),
}

// Mock DOM element for testing
const createMockElement = () => {
  const element = document.createElement('div')
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

describe('Phase 2 SwiftUI Modifiers', () => {
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

  describe('.aspectRatio(ratio, contentMode) modifier', () => {
    it('should add aspect ratio modifier with default fit mode', () => {
      const component = builder.aspectRatio(16 / 9).build()

      expect(component.modifiers).toHaveLength(1)
      expect(component.modifiers[0]).toBeInstanceOf(LayoutModifier)
      expect((component.modifiers[0] as LayoutModifier).properties).toEqual({
        aspectRatio: { ratio: 16 / 9, contentMode: 'fit' },
      })
    })

    it('should add aspect ratio modifier with fill mode', () => {
      const component = builder.aspectRatio(1, 'fill').build()

      expect(component.modifiers).toHaveLength(1)
      expect((component.modifiers[0] as LayoutModifier).properties).toEqual({
        aspectRatio: { ratio: 1, contentMode: 'fill' },
      })
    })

    it('should add aspect ratio modifier with reactive ratio', () => {
      const [ratioSignal] = createSignal(16 / 9)
      const component = builder.aspectRatio(ratioSignal, 'fit').build()

      expect(component.modifiers).toHaveLength(1)
      expect((component.modifiers[0] as LayoutModifier).properties).toEqual({
        aspectRatio: { ratio: ratioSignal, contentMode: 'fit' },
      })
    })

    it('should apply CSS aspect-ratio and object-fit when modifier is applied', () => {
      const aspectRatioModifier = new LayoutModifier({
        aspectRatio: { ratio: 16 / 9, contentMode: 'fit' },
      })

      aspectRatioModifier.apply({ element: mockElement, children: [] }, mockContext)

      expect(mockElement.style.aspectRatio).toBe('1.7777777777777777')
      expect(mockElement.style.objectFit).toBe('contain')
    })

    it('should apply object-fit cover for fill mode', () => {
      const aspectRatioModifier = new LayoutModifier({
        aspectRatio: { ratio: 1, contentMode: 'fill' },
      })

      aspectRatioModifier.apply({ element: mockElement, children: [] }, mockContext)

      expect(mockElement.style.aspectRatio).toBe('1')
      expect(mockElement.style.objectFit).toBe('cover')
    })

    it('should handle undefined ratio', () => {
      const aspectRatioModifier = new LayoutModifier({
        aspectRatio: { contentMode: 'fit' },
      })

      aspectRatioModifier.apply({ element: mockElement, children: [] }, mockContext)

      // Should not set aspect-ratio if ratio is undefined
      expect(mockElement.style.aspectRatio).toBe('')
    })
  })

  describe('.fixedSize(horizontal?, vertical?) modifier', () => {
    it('should add fixed size modifier with default both directions', () => {
      const component = builder.fixedSize().build()

      expect(component.modifiers).toHaveLength(1)
      expect(component.modifiers[0]).toBeInstanceOf(LayoutModifier)
      expect((component.modifiers[0] as LayoutModifier).properties).toEqual({
        fixedSize: { horizontal: true, vertical: true },
      })
    })

    it('should add fixed size modifier for horizontal only', () => {
      const component = builder.fixedSize(true, false).build()

      expect(component.modifiers).toHaveLength(1)
      expect((component.modifiers[0] as LayoutModifier).properties).toEqual({
        fixedSize: { horizontal: true, vertical: false },
      })
    })

    it('should add fixed size modifier for vertical only', () => {
      const component = builder.fixedSize(false, true).build()

      expect(component.modifiers).toHaveLength(1)
      expect((component.modifiers[0] as LayoutModifier).properties).toEqual({
        fixedSize: { horizontal: false, vertical: true },
      })
    })

    it('should apply CSS properties for horizontal fixed size', () => {
      const fixedSizeModifier = new LayoutModifier({
        fixedSize: { horizontal: true, vertical: false },
      })

      fixedSizeModifier.apply({ element: mockElement, children: [] }, mockContext)

      expect(mockElement.style.flexShrink).toBe('0')
      expect(mockElement.style.width).toBe('max-content')
      expect(mockElement.style.height).toBe('')
    })

    it('should apply CSS properties for vertical fixed size', () => {
      const fixedSizeModifier = new LayoutModifier({
        fixedSize: { horizontal: false, vertical: true },
      })

      fixedSizeModifier.apply({ element: mockElement, children: [] }, mockContext)

      expect(mockElement.style.height).toBe('max-content')
    })

    it('should apply CSS properties for both directions', () => {
      const fixedSizeModifier = new LayoutModifier({
        fixedSize: { horizontal: true, vertical: true },
      })

      fixedSizeModifier.apply({ element: mockElement, children: [] }, mockContext)

      expect(mockElement.style.flexShrink).toBe('0')
      expect(mockElement.style.width).toBe('max-content')
      expect(mockElement.style.height).toBe('max-content')
    })
  })

  describe('.clipShape(shape, parameters) modifier', () => {
    it('should add clip shape modifier for circle', () => {
      const component = builder.clipShape('circle').build()

      expect(component.modifiers).toHaveLength(1)
      expect(component.modifiers[0]).toBeInstanceOf(AppearanceModifier)
      expect((component.modifiers[0] as AppearanceModifier).properties).toEqual({
        clipShape: { shape: 'circle', parameters: {} },
      })
    })

    it('should add clip shape modifier for ellipse with parameters', () => {
      const component = builder.clipShape('ellipse', { radiusX: '60%', radiusY: '40%' }).build()

      expect(component.modifiers).toHaveLength(1)
      expect((component.modifiers[0] as AppearanceModifier).properties).toEqual({
        clipShape: {
          shape: 'ellipse',
          parameters: { radiusX: '60%', radiusY: '40%' },
        },
      })
    })

    it('should add clip shape modifier for polygon', () => {
      const points = '0% 0%, 100% 50%, 0% 100%'
      const component = builder.clipShape('polygon', { points }).build()

      expect(component.modifiers).toHaveLength(1)
      expect((component.modifiers[0] as AppearanceModifier).properties).toEqual({
        clipShape: {
          shape: 'polygon',
          parameters: { points },
        },
      })
    })

    it('should apply CSS clip-path for circle', () => {
      const clipShapeModifier = new AppearanceModifier({
        clipShape: { shape: 'circle', parameters: {} },
      })

      clipShapeModifier.apply({ element: mockElement, children: [] }, mockContext)

      expect(mockElement.style.clipPath).toBe('circle(50%)')
    })

    it('should apply CSS clip-path for ellipse', () => {
      const clipShapeModifier = new AppearanceModifier({
        clipShape: {
          shape: 'ellipse',
          parameters: { radiusX: '60%', radiusY: '40%' },
        },
      })

      clipShapeModifier.apply({ element: mockElement, children: [] }, mockContext)

      expect(mockElement.style.clipPath).toBe('ellipse(60% 40% at center)')
    })

    it('should apply CSS clip-path for rect with inset', () => {
      const clipShapeModifier = new AppearanceModifier({
        clipShape: {
          shape: 'rect',
          parameters: { inset: 10 },
        },
      })

      clipShapeModifier.apply({ element: mockElement, children: [] }, mockContext)

      expect(mockElement.style.clipPath).toBe('inset(10px)')
    })

    it('should apply CSS clip-path for polygon', () => {
      const points = '0% 0%, 100% 50%, 0% 100%'
      const clipShapeModifier = new AppearanceModifier({
        clipShape: {
          shape: 'polygon',
          parameters: { points },
        },
      })

      clipShapeModifier.apply({ element: mockElement, children: [] }, mockContext)

      expect(mockElement.style.clipPath).toBe(`polygon(${points})`)
    })

    it('should use default parameters when not provided', () => {
      const clipShapeModifier = new AppearanceModifier({
        clipShape: { shape: 'ellipse', parameters: {} },
      })

      clipShapeModifier.apply({ element: mockElement, children: [] }, mockContext)

      expect(mockElement.style.clipPath).toBe('ellipse(50% 50% at center)')
    })
  })

  describe('.overlay(content, alignment) modifier', () => {
    it('should add overlay modifier with default center alignment', () => {
      const component = builder.overlay(mockOverlayComponent).build()

      expect(component.modifiers).toHaveLength(1)
      expect(component.modifiers[0]).toBeInstanceOf(AnimationModifier)
      expect((component.modifiers[0] as AnimationModifier).properties).toEqual({
        overlay: { content: mockOverlayComponent, alignment: 'center' },
      })
    })

    it('should add overlay modifier with custom alignment', () => {
      const component = builder.overlay(mockOverlayComponent, 'topTrailing').build()

      expect(component.modifiers).toHaveLength(1)
      expect((component.modifiers[0] as AnimationModifier).properties).toEqual({
        overlay: { content: mockOverlayComponent, alignment: 'topTrailing' },
      })
    })

    it('should create overlay container and append to element', () => {
      const overlayModifier = new AnimationModifier({
        overlay: { content: mockOverlayComponent, alignment: 'center' },
      })

      // Mock the overlay component render
      mockOverlayComponent.render = vi.fn().mockReturnValue({
        element: document.createElement('span'),
        children: [],
      })

      overlayModifier.apply({ element: mockElement, children: [] }, mockContext)

      // Should set position relative
      expect(mockElement.style.position).toBe('relative')

      // Should create overlay container
      expect(mockElement.children.length).toBe(1)

      const overlayContainer = mockElement.children[0] as HTMLElement
      expect(overlayContainer.style.position).toBe('absolute')
      expect(overlayContainer.style.top).toBe('50%')
      expect(overlayContainer.style.left).toBe('50%')
      expect(overlayContainer.style.transform).toBe('translate(-50%, -50%)')
    })

    it('should handle different alignments correctly', () => {
      const alignments = [
        {
          alignment: 'top',
          expectedStyles: { top: '0px', left: '50%', transform: 'translateX(-50%)' },
        },
        {
          alignment: 'bottom',
          expectedStyles: { bottom: '0px', left: '50%', transform: 'translateX(-50%)' },
        },
        {
          alignment: 'leading',
          expectedStyles: { top: '50%', left: '0px', transform: 'translateY(-50%)' },
        },
        {
          alignment: 'trailing',
          expectedStyles: { top: '50%', right: '0px', transform: 'translateY(-50%)' },
        },
        { alignment: 'topLeading', expectedStyles: { top: '0px', left: '0px' } },
        { alignment: 'topTrailing', expectedStyles: { top: '0px', right: '0px' } },
        { alignment: 'bottomLeading', expectedStyles: { bottom: '0px', left: '0px' } },
        { alignment: 'bottomTrailing', expectedStyles: { bottom: '0px', right: '0px' } },
      ] as const

      alignments.forEach(({ alignment, expectedStyles }) => {
        const element = createMockElement()
        const overlayModifier = new AnimationModifier({
          overlay: { content: mockOverlayComponent, alignment },
        })

        mockOverlayComponent.render = vi.fn().mockReturnValue({
          element: document.createElement('span'),
          children: [],
        })

        overlayModifier.apply({ element, children: [] }, { ...mockContext, element })

        const overlayContainer = element.children[0] as HTMLElement

        Object.entries(expectedStyles).forEach(([prop, value]) => {
          expect(overlayContainer.style[prop as any]).toBe(value)
        })
      })
    })

    it('should handle function content', () => {
      const contentFunction = vi.fn().mockReturnValue(mockOverlayComponent)

      const overlayModifier = new AnimationModifier({
        overlay: { content: contentFunction, alignment: 'center' },
      })

      mockOverlayComponent.render = vi.fn().mockReturnValue({
        element: document.createElement('span'),
        children: [],
      })

      overlayModifier.apply({ element: mockElement, children: [] }, mockContext)

      expect(contentFunction).toHaveBeenCalled()
      expect(mockOverlayComponent.render).toHaveBeenCalled()
      expect(mockElement.children.length).toBe(1)
    })

    it('should handle HTML element content', () => {
      const htmlContent = document.createElement('div')
      htmlContent.textContent = 'Overlay content'

      const overlayModifier = new AnimationModifier({
        overlay: { content: htmlContent, alignment: 'center' },
      })

      overlayModifier.apply({ element: mockElement, children: [] }, mockContext)

      expect(mockElement.children.length).toBe(1)

      const overlayContainer = mockElement.children[0] as HTMLElement
      expect(overlayContainer.children.length).toBe(1)
      expect(overlayContainer.children[0]).toBe(htmlContent)
    })
  })

  describe('Modifier combinations', () => {
    it('should combine multiple Phase 2 modifiers', () => {
      const component = builder
        .aspectRatio(16 / 9, 'fit')
        .fixedSize(true, false)
        .clipShape('circle')
        .overlay(mockOverlayComponent, 'topTrailing')
        .build()

      expect(component.modifiers).toHaveLength(4)

      // Verify all modifiers are added correctly
      const layoutModifiers = component.modifiers.filter((m) => m instanceof LayoutModifier)
      const appearanceModifiers = component.modifiers.filter((m) => m instanceof AppearanceModifier)
      const animationModifiers = component.modifiers.filter((m) => m instanceof AnimationModifier)

      expect(layoutModifiers).toHaveLength(2) // aspectRatio + fixedSize
      expect(appearanceModifiers).toHaveLength(1) // clipShape
      expect(animationModifiers).toHaveLength(1) // overlay
    })

    it('should combine Phase 2 with Phase 1 modifiers', () => {
      const component = builder
        .offset(10, 20) // Phase 1
        .aspectRatio(1) // Phase 2
        .clipped() // Phase 1
        .clipShape('circle') // Phase 2
        .rotationEffect(45) // Phase 1
        .overlay(mockOverlayComponent) // Phase 2
        .build()

      expect(component.modifiers).toHaveLength(6)

      // Apply all modifiers to verify they work together
      component.modifiers.forEach((modifier) => {
        modifier.apply({ element: mockElement, children: [] }, mockContext)
      })

      // Check combined effects
      expect(mockElement.style.aspectRatio).toBe('1')
      expect(mockElement.style.overflow).toBe('hidden')
      expect(mockElement.style.clipPath).toBe('circle(50%)')
      expect(mockElement.style.position).toBe('relative')
      expect(mockElement.children.length).toBe(1) // Overlay container
    })

    it('should handle reactive values in combinations', () => {
      const [ratioSignal] = createSignal(16 / 9)
      const [angleSignal] = createSignal(45)

      const component = builder
        .aspectRatio(ratioSignal, 'fill')
        .fixedSize()
        .rotationEffect(angleSignal)
        .overlay(mockOverlayComponent)
        .build()

      expect(component.modifiers).toHaveLength(4)

      // Verify reactive properties are stored correctly
      const aspectRatioModifier = component.modifiers.find(
        (m) => m instanceof LayoutModifier && (m as any).properties.aspectRatio
      )
      expect((aspectRatioModifier as any).properties.aspectRatio.ratio).toBe(ratioSignal)

      const rotationModifier = component.modifiers.find(
        (m) => m instanceof AnimationModifier && (m as any).properties.rotationEffect
      )
      expect((rotationModifier as any).properties.rotationEffect.angle).toBe(angleSignal)
    })
  })

  describe('Error handling', () => {
    it('should handle missing element gracefully', () => {
      const aspectRatioModifier = new LayoutModifier({ aspectRatio: { ratio: 1 } })

      expect(() => {
        aspectRatioModifier.apply(
          { element: null as any, children: [] },
          { ...mockContext, element: null as any }
        )
      }).not.toThrow()
    })

    it('should handle invalid clip shape gracefully', () => {
      const clipShapeModifier = new AppearanceModifier({
        clipShape: { shape: 'invalid' as any, parameters: {} },
      })

      clipShapeModifier.apply({ element: mockElement, children: [] }, mockContext)

      // Should not set clipPath for invalid shape
      expect(mockElement.style.clipPath).toBe('')
    })

    it('should handle invalid overlay content gracefully', () => {
      const overlayModifier = new AnimationModifier({
        overlay: { content: null, alignment: 'center' },
      })

      expect(() => {
        overlayModifier.apply({ element: mockElement, children: [] }, mockContext)
      }).not.toThrow()

      // Should still create overlay container
      expect(mockElement.children.length).toBe(1)
    })
  })
})
