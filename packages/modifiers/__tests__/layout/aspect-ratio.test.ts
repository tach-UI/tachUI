/**
 * Aspect Ratio Modifier Tests
 *
 * Comprehensive tests for the aspect ratio modifier
 * including content modes, reactive support, and media element handling.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AspectRatioModifier, aspectRatio } from '../../src/layout/aspect-ratio'
import type { ModifierContext } from '@tachui/core/modifiers/types'
import type { DOMNode } from '@tachui/core/runtime/types'
import { createSignal, flushSync } from '@tachui/core/reactive'

// Mock DOM element with tagName support
class MockElement {
  style: {
    [key: string]: string
    setProperty: (property: string, value: string) => void
  }
  tagName: string

  constructor(tagName: string = 'DIV') {
    this.tagName = tagName
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

// Mock console methods
const mockConsole = {
  warn: vi.fn(),
  info: vi.fn(),
}

describe('Aspect Ratio Modifier', () => {
  let mockElement: MockElement
  let mockContext: ModifierContext
  let originalConsole: any

  beforeEach(() => {
    mockElement = new MockElement()
    mockContext = {
      element: mockElement as unknown as HTMLElement,
    }

    originalConsole = { warn: console.warn, info: console.info }
    console.warn = mockConsole.warn
    console.info = mockConsole.info
    vi.clearAllMocks()
  })

  afterEach(() => {
    console.warn = originalConsole.warn
    console.info = originalConsole.info
  })

  describe('AspectRatioModifier Class', () => {
    it('should have correct type and priority', () => {
      const modifier = aspectRatio(16 / 9)
      expect(modifier.type).toBe('aspectRatio')
      expect(modifier.priority).toBe(20)
    })

    it('should apply aspect ratio with fit mode', () => {
      const modifier = aspectRatio(16 / 9, 'fit')
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.aspectRatio).toBe(String(16 / 9))
      expect(mockElement.style.objectFit).toBe('contain')
      expect(mockElement.style.maxWidth).toBe('100%')
      expect(mockElement.style.maxHeight).toBe('100%')
    })

    it('should apply aspect ratio with fill mode', () => {
      const modifier = aspectRatio(4 / 3, 'fill')
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.aspectRatio).toBe(String(4 / 3))
      expect(mockElement.style.objectFit).toBe('cover')
      expect(mockElement.style.width).toBe('100%')
      expect(mockElement.style.height).toBe('100%')
    })

    it('should default to fit content mode', () => {
      const modifier = aspectRatio(1)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.aspectRatio).toBe('1')
      expect(mockElement.style.objectFit).toBe('contain')
    })

    it('should handle content mode only without ratio', () => {
      const modifier = aspectRatio(undefined, 'fill')
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.aspectRatio).toBe('')
      expect(mockElement.style.objectFit).toBe('cover')
      expect(mockElement.style.width).toBe('100%')
      expect(mockElement.style.height).toBe('100%')
    })

    it('should handle empty context gracefully', () => {
      const modifier = aspectRatio(16 / 9)
      const emptyContext = { element: undefined }

      expect(() => {
        modifier.apply({} as DOMNode, emptyContext)
      }).not.toThrow()
    })
  })

  describe('Media Element Handling', () => {
    const mediaElements = ['IMG', 'VIDEO', 'CANVAS', 'SVG', 'IFRAME']

    mediaElements.forEach(tagName => {
      it(`should handle ${tagName} element with fit mode`, () => {
        mockElement = new MockElement(tagName)
        mockContext.element = mockElement as unknown as HTMLElement

        const modifier = aspectRatio(16 / 9, 'fit')
        modifier.apply({} as DOMNode, mockContext)

        expect(mockElement.style.aspectRatio).toBe(String(16 / 9))
        expect(mockElement.style.objectFit).toBe('contain')
        // Should not set width/height for media elements
        expect(mockElement.style.maxWidth).toBe('')
        expect(mockElement.style.maxHeight).toBe('')
      })

      it(`should handle ${tagName} element with fill mode`, () => {
        mockElement = new MockElement(tagName)
        mockContext.element = mockElement as unknown as HTMLElement

        const modifier = aspectRatio(4 / 3, 'fill')
        modifier.apply({} as DOMNode, mockContext)

        expect(mockElement.style.aspectRatio).toBe(String(4 / 3))
        expect(mockElement.style.objectFit).toBe('cover')
        // Should not set width/height for media elements
        expect(mockElement.style.width).toBe('')
        expect(mockElement.style.height).toBe('')
      })
    })

    it('should handle non-media elements differently', () => {
      mockElement = new MockElement('DIV')
      mockContext.element = mockElement as unknown as HTMLElement

      const modifier = aspectRatio(1, 'fill')
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.aspectRatio).toBe('1')
      expect(mockElement.style.objectFit).toBe('cover')
      expect(mockElement.style.width).toBe('100%')
      expect(mockElement.style.height).toBe('100%')
    })
  })

  describe('Common Ratios', () => {
    const commonRatios = AspectRatioModifier.COMMON_RATIOS

    it('should provide common aspect ratios', () => {
      expect(commonRatios.square).toBe(1)
      expect(commonRatios.portrait).toBe(3 / 4)
      expect(commonRatios.landscape).toBe(4 / 3)
      expect(commonRatios.widescreen).toBe(16 / 9)
      expect(commonRatios.ultrawide).toBe(21 / 9)
      expect(commonRatios.golden).toBe(1.618)
      expect(commonRatios.photo).toBe(3 / 2)
    })

    it('should work with common ratios', () => {
      const modifier = aspectRatio(commonRatios.widescreen, 'fit')
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.aspectRatio).toBe(String(16 / 9))
    })
  })

  describe('Reactive Support', () => {
    it('should handle reactive ratio value', () => {
      const [ratio, setRatio] = createSignal(16 / 9)
      const modifier = aspectRatio(ratio, 'fit')
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.aspectRatio).toBe(String(16 / 9))

      // Update reactive value
      setRatio(4 / 3)
      flushSync() // Trigger pending effects
      expect(mockElement.style.aspectRatio).toBe(String(4 / 3))
    })

    it('should handle reactive ratio updates with different content modes', () => {
      const [ratio, setRatio] = createSignal(1)
      const modifier = aspectRatio(ratio, 'fill')
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.aspectRatio).toBe('1')
      expect(mockElement.style.objectFit).toBe('cover')

      // Update ratio
      setRatio(2.5)
      flushSync() // Trigger pending effects
      expect(mockElement.style.aspectRatio).toBe('2.5')
      expect(mockElement.style.objectFit).toBe('cover')
    })
  })

  describe('Development Mode Validation', () => {
    beforeEach(() => {
      vi.stubGlobal('process', { env: { NODE_ENV: 'development' } })
    })

    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it('should warn about invalid ratio type', () => {
      const modifier = aspectRatio('invalid' as any, 'fit')
      modifier.apply({} as DOMNode, mockContext)

      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining('ratio must be a number or reactive signal')
      )
    })

    it('should warn about negative ratio', () => {
      const modifier = aspectRatio(-1, 'fit')
      modifier.apply({} as DOMNode, mockContext)

      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining('ratio must be positive')
      )
    })

    it('should warn about zero ratio', () => {
      const modifier = aspectRatio(0, 'fit')
      modifier.apply({} as DOMNode, mockContext)

      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining('ratio must be positive')
      )
    })

    it('should warn about very large ratio', () => {
      const modifier = aspectRatio(150, 'fit')
      modifier.apply({} as DOMNode, mockContext)

      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining(
          'Very large ratio (150) may cause layout issues'
        )
      )
    })

    it('should warn about very small ratio', () => {
      const modifier = aspectRatio(0.005, 'fit')
      modifier.apply({} as DOMNode, mockContext)

      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining(
          'Very small ratio (0.005) may cause layout issues'
        )
      )
    })

    it('should warn about invalid content mode', () => {
      const modifier = aspectRatio(16 / 9, 'invalid' as any)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockConsole.warn).toHaveBeenCalledWith(
        'AspectRatioModifier: Invalid content mode "invalid". Valid modes:',
        ['fit', 'fill']
      )
    })

    it('should validate reactive ratio values', () => {
      const [ratio] = createSignal(-2)
      const modifier = aspectRatio(ratio, 'fit')
      modifier.apply({} as DOMNode, mockContext)

      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining('ratio must be positive')
      )
    })

    it('should not validate in production mode', () => {
      vi.stubGlobal('process', { env: { NODE_ENV: 'production' } })

      const modifier = aspectRatio(-1, 'invalid' as any)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockConsole.warn).not.toHaveBeenCalled()
    })
  })

  describe('Convenience Function', () => {
    it('should create aspect ratio with ratio and content mode', () => {
      const modifier = aspectRatio(16 / 9, 'fill')
      expect(modifier).toBeInstanceOf(AspectRatioModifier)
      expect(modifier.properties.ratio).toBe(16 / 9)
      expect(modifier.properties.contentMode).toBe('fill')
    })

    it('should create aspect ratio with default fit mode', () => {
      const modifier = aspectRatio(4 / 3)
      expect(modifier).toBeInstanceOf(AspectRatioModifier)
      expect(modifier.properties.ratio).toBe(4 / 3)
      expect(modifier.properties.contentMode).toBe('fit')
    })

    it('should create aspect ratio with no ratio (content mode only)', () => {
      const modifier = aspectRatio(undefined, 'fill')
      expect(modifier).toBeInstanceOf(AspectRatioModifier)
      expect(modifier.properties.ratio).toBeUndefined()
      expect(modifier.properties.contentMode).toBe('fill')
    })

    it('should create aspect ratio with reactive ratio', () => {
      const [ratio] = createSignal(2.5)
      const modifier = aspectRatio(ratio, 'fit')

      expect(modifier).toBeInstanceOf(AspectRatioModifier)
      expect(modifier.properties.ratio).toBe(ratio)
      expect(modifier.properties.contentMode).toBe('fit')
    })
  })

  describe('Edge Cases', () => {
    it('should handle very precise decimal ratios', () => {
      const modifier = aspectRatio(1.6180339887, 'fit')
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.aspectRatio).toBe('1.6180339887')
    })

    it('should handle ratio of 1 (square)', () => {
      const modifier = aspectRatio(1, 'fit')
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.aspectRatio).toBe('1')
      expect(mockElement.style.objectFit).toBe('contain')
    })

    it('should handle extremely wide ratio', () => {
      const modifier = aspectRatio(10, 'fill')
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.aspectRatio).toBe('10')
      expect(mockElement.style.objectFit).toBe('cover')
    })

    it('should handle extremely tall ratio', () => {
      const modifier = aspectRatio(0.1, 'fit')
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.aspectRatio).toBe('0.1')
      expect(mockElement.style.objectFit).toBe('contain')
    })
  })

  describe('Content Mode Behavior', () => {
    it('should apply fit mode to non-media elements', () => {
      mockElement = new MockElement('DIV')
      mockContext.element = mockElement as unknown as HTMLElement

      const modifier = aspectRatio(16 / 9, 'fit')
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.objectFit).toBe('contain')
      expect(mockElement.style.maxWidth).toBe('100%')
      expect(mockElement.style.maxHeight).toBe('100%')
      expect(mockElement.style.width).toBe('')
      expect(mockElement.style.height).toBe('')
    })

    it('should apply fill mode to non-media elements', () => {
      mockElement = new MockElement('SPAN')
      mockContext.element = mockElement as unknown as HTMLElement

      const modifier = aspectRatio(4 / 3, 'fill')
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.objectFit).toBe('cover')
      expect(mockElement.style.width).toBe('100%')
      expect(mockElement.style.height).toBe('100%')
      expect(mockElement.style.maxWidth).toBe('')
      expect(mockElement.style.maxHeight).toBe('')
    })

    it('should handle content mode without ratio', () => {
      const modifier = aspectRatio(undefined, 'fit')
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.aspectRatio).toBe('')
      expect(mockElement.style.objectFit).toBe('contain')
      expect(mockElement.style.maxWidth).toBe('100%')
      expect(mockElement.style.maxHeight).toBe('100%')
    })
  })

  describe('Integration with Common Ratios', () => {
    it('should work correctly with all common ratios', () => {
      const { COMMON_RATIOS } = AspectRatioModifier
      const testCases = [
        { name: 'square', ratio: COMMON_RATIOS.square },
        { name: 'portrait', ratio: COMMON_RATIOS.portrait },
        { name: 'landscape', ratio: COMMON_RATIOS.landscape },
        { name: 'widescreen', ratio: COMMON_RATIOS.widescreen },
        { name: 'ultrawide', ratio: COMMON_RATIOS.ultrawide },
        { name: 'golden', ratio: COMMON_RATIOS.golden },
        { name: 'photo', ratio: COMMON_RATIOS.photo },
      ]

      testCases.forEach(({ name, ratio }) => {
        const modifier = aspectRatio(ratio, 'fit')
        modifier.apply({} as DOMNode, mockContext)

        expect(mockElement.style.aspectRatio).toBe(String(ratio))

        // Reset for next test
        mockElement = new MockElement()
        mockContext.element = mockElement as unknown as HTMLElement
      })
    })
  })
})
