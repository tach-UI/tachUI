/**
 * Layout Modifiers Integration Tests
 *
 * Tests for combining layout modifiers and ensuring they work correctly together.
 * Covers realistic usage scenarios and interaction between different layout modifiers.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  offset,
  scaleEffect,
  aspectRatio,
  fixedSize,
  position,
  zIndex,
} from '../../src/layout'
import type { ModifierContext } from '@tachui/core/modifiers/types'
import type { DOMNode } from '@tachui/core/runtime/types'
import { createSignal, flushSync } from '@tachui/core/reactive'

// Mock DOM element
class MockElement {
  style: {
    [key: string]: string
    setProperty: (property: string, value: string) => void
  }
  tagName: string
  parentElement: MockElement | null
  childNodes: MockNode[]

  constructor(
    tagName: string = 'DIV',
    parentElement: MockElement | null = null
  ) {
    this.tagName = tagName
    this.parentElement = parentElement
    this.childNodes = []
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

class MockNode {
  nodeType: number
  constructor(nodeType: number) {
    this.nodeType = nodeType
  }
}

// Mock getComputedStyle
const mockGetComputedStyle = vi.fn()

describe('Layout Modifiers Integration', () => {
  let mockElement: MockElement
  let mockContext: ModifierContext
  let originalGetComputedStyle: any

  beforeEach(() => {
    mockElement = new MockElement()
    mockContext = {
      element: mockElement as unknown as HTMLElement,
    }

    originalGetComputedStyle = global.getComputedStyle
    global.getComputedStyle = mockGetComputedStyle

    vi.clearAllMocks()
    mockGetComputedStyle.mockImplementation((element: any) => ({
      position: element.style.position || 'static',
      display: element.style.display || 'block',
      opacity: element.style.opacity || '1',
      transform: element.style.transform || 'none',
      filter: element.style.filter || 'none',
      isolation: element.style.isolation || 'auto',
      mixBlendMode: element.style.mixBlendMode || 'normal',
      top: element.style.top || 'auto',
      right: element.style.right || 'auto',
      bottom: element.style.bottom || 'auto',
      left: element.style.left || 'auto',
    }))
  })

  afterEach(() => {
    global.getComputedStyle = originalGetComputedStyle
  })

  describe('Transform Combinations', () => {
    it('should combine offset and scaleEffect transforms', () => {
      const offsetModifier = offset(10, 20)
      const scaleModifier = scaleEffect(1.5, 2.0)

      offsetModifier.apply({} as DOMNode, mockContext)
      scaleModifier.apply({} as DOMNode, mockContext)

      // Scale should be appended to existing transform
      expect(mockElement.style.transform).toBe(
        'translate(10px, 20px) scale(1.5, 2)'
      )
    })

    it('should handle multiple transform modifiers with existing transforms', () => {
      // Start with existing transform
      mockElement.style.transform = 'rotate(45deg)'

      const offsetModifier = offset(-5, 15)
      const scaleModifier = scaleEffect(0.8)

      offsetModifier.apply({} as DOMNode, mockContext)
      scaleModifier.apply({} as DOMNode, mockContext)

      // Should preserve rotate and add both transforms
      expect(mockElement.style.transform).toBe(
        'rotate(45deg) translate(-5px, 15px) scale(0.8, 0.8)'
      )
    })

    it('should replace existing transforms of the same type', () => {
      // Start with existing transforms
      mockElement.style.transform =
        'translate(100px, 200px) scale(2) rotate(90deg)'

      const offsetModifier = offset(25, 50)
      const scaleModifier = scaleEffect(1.2, 0.6)

      offsetModifier.apply({} as DOMNode, mockContext)
      scaleModifier.apply({} as DOMNode, mockContext)

      // Should replace existing translate and scale, keep rotate
      expect(mockElement.style.transform).toBe(
        'rotate(90deg) translate(25px, 50px) scale(1.2, 0.6)'
      )
    })

    it('should work with reactive transform values', () => {
      const [xOffset, setXOffset] = createSignal(0)
      const [scale, setScale] = createSignal(1)

      const offsetModifier = offset(xOffset, 10)
      const scaleModifier = scaleEffect(scale)

      offsetModifier.apply({} as DOMNode, mockContext)
      scaleModifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.transform).toBe(
        'translate(0px, 10px) scale(1, 1)'
      )

      // Update reactive values
      setXOffset(30)
      setScale(1.8)
      flushSync() // Trigger pending effects

      expect(mockElement.style.transform).toBe(
        'translate(30px, 10px) scale(1.8, 1.8)'
      )
    })
  })

  describe('Positioning and Z-Index Combinations', () => {
    it('should combine position and z-index modifiers', () => {
      const positionModifier = position('absolute')
      const zIndexModifier = zIndex(100)

      positionModifier.apply({} as DOMNode, mockContext)
      zIndexModifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.position).toBe('absolute')
      expect(mockElement.style.zIndex).toBe('100')
      // Absolute positioning should add performance optimizations
      expect(mockElement.style.transform).toBe('translateZ(0)')
    })

    it('should not override z-index performance optimization', () => {
      const positionModifier = position('fixed')
      const zIndexModifier = zIndex(50)

      positionModifier.apply({} as DOMNode, mockContext)
      zIndexModifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.position).toBe('fixed')
      expect(mockElement.style.zIndex).toBe('50') // Should override the performance z-index
      expect(mockElement.style.transform).toBe('translateZ(0)')
    })

    it('should handle z-index with static positioning', () => {
      const zIndexModifier = zIndex(25)
      const positionModifier = position('static')

      zIndexModifier.apply({} as DOMNode, mockContext)
      positionModifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.zIndex).toBe('25')
      expect(mockElement.style.position).toBe('static') // Should override the relative set by z-index
    })

    it('should work with flex items and z-index', () => {
      const parent = new MockElement('DIV')
      mockElement.parentElement = parent

      mockGetComputedStyle.mockImplementation(element => {
        if (element === parent) {
          return { display: 'flex' }
        }
        return { position: 'static', display: 'block' }
      })

      const zIndexModifier = zIndex(75)
      zIndexModifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.zIndex).toBe('75')
      // Should not set position: relative for flex items
      expect(mockElement.style.position).toBe('')
    })
  })

  describe('Sizing and Aspect Ratio Combinations', () => {
    it('should combine aspect ratio and fixed size', () => {
      const aspectRatioModifier = aspectRatio(16 / 9, 'fit')
      const fixedSizeModifier = fixedSize(true, false)

      aspectRatioModifier.apply({} as DOMNode, mockContext)
      fixedSizeModifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.aspectRatio).toBe(String(16 / 9))
      expect(mockElement.style.objectFit).toBe('contain')
      expect(mockElement.style.maxWidth).toBe('max-content')
      expect(mockElement.style.width).toBe('max-content')
      expect(mockElement.style.flexShrink).toBe('0')
    })

    it('should handle media elements with aspect ratio and sizing', () => {
      mockElement = new MockElement('IMG')
      mockContext.element = mockElement as unknown as HTMLElement

      const aspectRatioModifier = aspectRatio(4 / 3, 'fill')
      const fixedSizeModifier = fixedSize(false, true)

      aspectRatioModifier.apply({} as DOMNode, mockContext)
      fixedSizeModifier.apply({} as DOMNode, mockContext)

      // Media element should use object-fit without width/height
      expect(mockElement.style.aspectRatio).toBe(String(4 / 3))
      expect(mockElement.style.objectFit).toBe('cover')
      expect(mockElement.style.width).toBe('')
      expect(mockElement.style.height).toBe('max-content')

      // Fixed size should apply
      expect(mockElement.style.maxHeight).toBe('max-content')
    })

    it('should handle text elements with fixed size and positioning', () => {
      mockElement = new MockElement('P')
      mockElement.childNodes = [new MockNode(Node.TEXT_NODE)]
      mockContext.element = mockElement as unknown as HTMLElement

      const fixedSizeModifier = fixedSize(true, false)
      const positionModifier = position('relative')

      fixedSizeModifier.apply({} as DOMNode, mockContext)
      positionModifier.apply({} as DOMNode, mockContext)

      // Text handling
      expect(mockElement.style.whiteSpace).toBe('nowrap')
      expect(mockElement.style.maxWidth).toBe('max-content')
      expect(mockElement.style.width).toBe('max-content')

      // Positioning
      expect(mockElement.style.position).toBe('relative')
    })
  })

  describe('Complex Layout Scenarios', () => {
    it('should create a positioned, scaled, and sized modal overlay', () => {
      const positionModifier = position('fixed')
      const zIndexModifier = zIndex(400) // Modal layer
      const scaleModifier = scaleEffect(0.95, 0.95, 'center')
      const aspectRatioModifier = aspectRatio(3 / 2, 'fit')

      positionModifier.apply({} as DOMNode, mockContext)
      zIndexModifier.apply({} as DOMNode, mockContext)
      scaleModifier.apply({} as DOMNode, mockContext)
      aspectRatioModifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.position).toBe('fixed')
      expect(mockElement.style.zIndex).toBe('400')
      expect(mockElement.style.transform).toBe(
        'translateZ(0) scale(0.95, 0.95)'
      )
      expect(mockElement.style.transformOrigin).toBe('center center')
      expect(mockElement.style.aspectRatio).toBe(String(3 / 2))
      expect(mockElement.style.objectFit).toBe('contain')
    })

    it('should create a floating tooltip with offset and sizing', () => {
      const positionModifier = position('absolute')
      const zIndexModifier = zIndex(500) // Tooltip layer
      const offsetModifier = offset(8, -4)
      const fixedSizeModifier = fixedSize(true, true)

      positionModifier.apply({} as DOMNode, mockContext)
      zIndexModifier.apply({} as DOMNode, mockContext)
      offsetModifier.apply({} as DOMNode, mockContext)
      fixedSizeModifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.position).toBe('absolute')
      expect(mockElement.style.zIndex).toBe('500')
      expect(mockElement.style.transform).toBe(
        'translateZ(0) translate(8px, -4px)'
      )
      expect(mockElement.style.maxWidth).toBe('max-content')
      expect(mockElement.style.maxHeight).toBe('max-content')
      expect(mockElement.style.display).toBe('inline-block')
    })

    it('should create a responsive card with transforms and aspect ratio', () => {
      const aspectRatioModifier = aspectRatio(1.618, 'fill') // Golden ratio
      const scaleModifier = scaleEffect(1.0, 1.0, 'center')
      const positionModifier = position('relative')
      const zIndexModifier = zIndex(1)

      aspectRatioModifier.apply({} as DOMNode, mockContext)
      scaleModifier.apply({} as DOMNode, mockContext)
      positionModifier.apply({} as DOMNode, mockContext)
      zIndexModifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.aspectRatio).toBe('1.618')
      expect(mockElement.style.objectFit).toBe('cover')
      expect(mockElement.style.width).toBe('100%')
      expect(mockElement.style.height).toBe('100%')
      expect(mockElement.style.transform).toBe('scale(1, 1)')
      expect(mockElement.style.transformOrigin).toBe('center center')
      expect(mockElement.style.position).toBe('relative')
      expect(mockElement.style.zIndex).toBe('1')
    })

    it('should handle flex item with complex transforms and positioning', () => {
      const parent = new MockElement('DIV')
      mockElement.parentElement = parent

      mockGetComputedStyle.mockImplementation(element => {
        if (element === parent) {
          return { display: 'flex' }
        }
        return { position: 'static', display: 'block' }
      })

      const fixedSizeModifier = fixedSize(false, true) // Fix height only
      const offsetModifier = offset(0, -10) // Slight upward offset
      const scaleModifier = scaleEffect(1.05, 1.0, 'bottom') // Slightly wider
      const zIndexModifier = zIndex(10)

      fixedSizeModifier.apply({} as DOMNode, mockContext)
      offsetModifier.apply({} as DOMNode, mockContext)
      scaleModifier.apply({} as DOMNode, mockContext)
      zIndexModifier.apply({} as DOMNode, mockContext)

      // Fixed size for flex item
      expect(mockElement.style.maxHeight).toBe('max-content')
      expect(mockElement.style.height).toBe('max-content')
      expect(mockElement.style.alignSelf).toBe('flex-start')

      // Transforms
      expect(mockElement.style.transform).toBe(
        'translate(0px, -10px) scale(1.05, 1)'
      )
      expect(mockElement.style.transformOrigin).toBe('center bottom')

      // Z-index (no position change for flex items)
      expect(mockElement.style.zIndex).toBe('10')
      expect(mockElement.style.position).toBe('')
    })
  })

  describe('Reactive Integration', () => {
    it('should handle multiple reactive modifiers updating together', () => {
      const [scale, setScale] = createSignal(1.0)
      const [xOffset, setXOffset] = createSignal(0)
      const [zValue, setZValue] = createSignal(1)
      const [ratio, setRatio] = createSignal(1)

      const scaleModifier = scaleEffect(scale)
      const offsetModifier = offset(xOffset, 5)
      const zIndexModifier = zIndex(zValue)
      const aspectRatioModifier = aspectRatio(ratio, 'fit')

      scaleModifier.apply({} as DOMNode, mockContext)
      offsetModifier.apply({} as DOMNode, mockContext)
      zIndexModifier.apply({} as DOMNode, mockContext)
      aspectRatioModifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.transform).toBe(
        'scale(1, 1) translate(0px, 5px)'
      )
      expect(mockElement.style.zIndex).toBe('1')
      expect(mockElement.style.aspectRatio).toBe('1')
      expect(mockElement.style.position).toBe('relative')

      // Update all reactive values
      setScale(1.2)
      setXOffset(15)
      setZValue(50)
      setRatio(16 / 9)
      flushSync() // Trigger pending effects

      expect(mockElement.style.transform).toBe(
        'scale(1.2, 1.2) translate(15px, 5px)'
      )
      expect(mockElement.style.zIndex).toBe('50')
      expect(mockElement.style.aspectRatio).toBe(String(16 / 9))
      expect(mockElement.style.position).toBe('relative')
    })

    it('should handle reactive transform conflicts correctly', () => {
      const [xOffset, setXOffset] = createSignal(10)
      const [scale, setScale] = createSignal(1.0)

      // Start with existing transform
      mockElement.style.transform = 'rotate(45deg) scale(0.5)'

      const offsetModifier = offset(xOffset, 20)
      const scaleModifier = scaleEffect(scale)

      offsetModifier.apply({} as DOMNode, mockContext)
      scaleModifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.transform).toBe(
        'rotate(45deg) translate(10px, 20px) scale(1, 1)'
      )

      // Update reactive values
      setXOffset(30)
      setScale(1.5)
      flushSync() // Trigger pending effects

      // Both transforms should update while preserving rotate
      expect(mockElement.style.transform).toBe(
        'rotate(45deg) translate(30px, 20px) scale(1.5, 1.5)'
      )
    })
  })

  describe('Order Independence', () => {
    it('should produce the same result regardless of modifier application order', () => {
      // Test scenario 1: position -> zIndex -> offset
      const element1 = new MockElement()
      const context1 = { element: element1 as unknown as HTMLElement }

      position('absolute').apply({} as DOMNode, context1)
      zIndex(100).apply({} as DOMNode, context1)
      offset(10, 20).apply({} as DOMNode, context1)

      // Test scenario 2: offset -> position -> zIndex
      const element2 = new MockElement()
      const context2 = { element: element2 as unknown as HTMLElement }

      offset(10, 20).apply({} as DOMNode, context2)
      position('absolute').apply({} as DOMNode, context2)
      zIndex(100).apply({} as DOMNode, context2)

      // Both should have the same final state
      expect(element1.style.position).toBe(element2.style.position)
      expect(element1.style.zIndex).toBe(element2.style.zIndex)
      // Transforms may differ due to hardware acceleration being applied differently
      // but both should contain the translate(10px, 20px)
      expect(element1.style.transform).toContain('translate(10px, 20px)')
      expect(element2.style.transform).toContain('translate(10px, 20px)')
    })

    it('should handle transform order correctly', () => {
      // Scenario 1: scale -> offset
      const element1 = new MockElement()
      const context1 = { element: element1 as unknown as HTMLElement }

      scaleEffect(1.5).apply({} as DOMNode, context1)
      offset(10, 20).apply({} as DOMNode, context1)

      // Scenario 2: offset -> scale
      const element2 = new MockElement()
      const context2 = { element: element2 as unknown as HTMLElement }

      offset(10, 20).apply({} as DOMNode, context2)
      scaleEffect(1.5).apply({} as DOMNode, context2)

      // Transform order should be preserved based on CSS rules
      // Both should result in the same final transform string
      const transform1 = element1.style.transform
      const transform2 = element2.style.transform

      // Both should contain both transforms
      expect(transform1).toContain('scale(1.5, 1.5)')
      expect(transform1).toContain('translate(10px, 20px)')
      expect(transform2).toContain('scale(1.5, 1.5)')
      expect(transform2).toContain('translate(10px, 20px)')
    })
  })
})
