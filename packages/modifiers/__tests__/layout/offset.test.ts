/**
 * Offset Modifier Tests
 *
 * Comprehensive tests for the offset transform modifier
 * including reactive support, CSS transform preservation, and validation.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { OffsetModifier, offset } from '../../src/layout/offset'
import type { ModifierContext } from '@tachui/core/modifiers/types'
import type { DOMNode } from '@tachui/core/runtime/types'
import { createSignal, flushSync } from '@tachui/core/reactive'

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
        return target[prop] || ''
      },
    })
  }
}

// Mock console methods for development warnings
const mockConsole = {
  warn: vi.fn(),
  info: vi.fn(),
}

describe('Offset Modifier', () => {
  let mockElement: MockElement
  let mockContext: ModifierContext
  let originalConsole: any

  beforeEach(() => {
    mockElement = new MockElement()
    mockContext = {
      element: mockElement as unknown as HTMLElement,
    }

    // Mock console for development warnings
    originalConsole = { warn: console.warn, info: console.info }
    console.warn = mockConsole.warn
    console.info = mockConsole.info
    vi.clearAllMocks()
  })

  afterEach(() => {
    console.warn = originalConsole.warn
    console.info = originalConsole.info
  })

  describe('OffsetModifier Class', () => {
    it('should have correct type and priority', () => {
      const modifier = offset(10, 20)
      expect(modifier.type).toBe('offset')
      expect(modifier.priority).toBe(35)
    })

    it('should apply horizontal offset only', () => {
      const modifier = offset(10)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.transform).toBe('translate(10px, 0px)')
    })

    it('should apply both horizontal and vertical offsets', () => {
      const modifier = offset(15, 25)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.transform).toBe('translate(15px, 25px)')
    })

    it('should handle negative offsets', () => {
      const modifier = offset(-10, -20)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.transform).toBe('translate(-10px, -20px)')
    })

    it('should handle zero offsets', () => {
      const modifier = offset(0, 0)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.transform).toBe('translate(0px, 0px)')
    })

    it('should handle decimal offsets', () => {
      const modifier = offset(10.5, 20.75)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.transform).toBe('translate(10.5px, 20.75px)')
    })

    it('should preserve existing transforms', () => {
      mockElement.style.transform = 'scale(1.5) rotate(45deg)'
      const modifier = offset(10, 20)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.transform).toBe(
        'scale(1.5) rotate(45deg) translate(10px, 20px)'
      )
    })

    it('should replace existing translate transforms', () => {
      mockElement.style.transform = 'translate(5px, 10px) scale(1.2)'
      const modifier = offset(20, 30)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.transform).toBe(
        'scale(1.2) translate(20px, 30px)'
      )
    })

    it('should handle multiple existing translate transforms', () => {
      mockElement.style.transform =
        'translate(5px, 10px) rotate(45deg) translate3d(1px, 2px, 3px)'
      const modifier = offset(20, 30)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.transform).toBe(
        'rotate(45deg) translate(20px, 30px)'
      )
    })

    it('should handle empty context gracefully', () => {
      const modifier = offset(10, 20)
      const emptyContext = { element: undefined }

      expect(() => {
        modifier.apply({} as DOMNode, emptyContext)
      }).not.toThrow()
    })
  })

  describe('Reactive Support', () => {
    it('should handle reactive x value', () => {
      const [xOffset, setXOffset] = createSignal(10)
      const modifier = offset(xOffset, 20)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.transform).toBe('translate(10px, 20px)')

      // Update reactive value
      setXOffset(30)
      flushSync()
      expect(mockElement.style.transform).toBe('translate(30px, 20px)')
    })

    it('should handle reactive y value', () => {
      const [yOffset, setYOffset] = createSignal(15)
      const modifier = offset(10, yOffset)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.transform).toBe('translate(10px, 15px)')

      // Update reactive value
      setYOffset(25)
      flushSync()
      expect(mockElement.style.transform).toBe('translate(10px, 25px)')
    })

    it('should handle both reactive values', () => {
      const [xOffset, setXOffset] = createSignal(5)
      const [yOffset, setYOffset] = createSignal(15)
      const modifier = offset(xOffset, yOffset)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.transform).toBe('translate(5px, 15px)')

      // Update both values
      setXOffset(20)
      setYOffset(30)
      flushSync()
      expect(mockElement.style.transform).toBe('translate(20px, 30px)')
    })
  })

  describe('Development Mode Validation', () => {
    beforeEach(() => {
      // Mock development environment
      vi.stubGlobal('process', { env: { NODE_ENV: 'development' } })
    })

    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it('should warn about non-numeric x value', () => {
      const modifier = offset('invalid' as any, 10)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockConsole.warn).toHaveBeenCalledWith(
        'OffsetModifier: x value must be a number or reactive signal. Got: string'
      )
    })

    it('should warn about non-numeric y value', () => {
      const modifier = offset(10, 'invalid' as any)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockConsole.warn).toHaveBeenCalledWith(
        'OffsetModifier: y value must be a number or reactive signal. Got: string'
      )
    })

    it('should warn about very large offset values', () => {
      const modifier = offset(5000, 6000)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockConsole.warn).toHaveBeenCalledWith(
        'OffsetModifier: Very large offset values may cause layout issues'
      )
    })

    it('should provide performance tips for decimal precision', () => {
      const modifier = offset(10.123456, 20.789012)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockConsole.info).toHaveBeenCalledWith(
        'OffsetModifier: Consider rounding offset values to 2 decimal places for better performance'
      )
    })

    it('should not validate in production mode', () => {
      vi.stubGlobal('process', { env: { NODE_ENV: 'production' } })

      const modifier = offset('invalid' as any, 'also-invalid' as any)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockConsole.warn).not.toHaveBeenCalled()
    })
  })

  describe('Convenience Function', () => {
    it('should create offset modifier with x only', () => {
      const modifier = offset(15)
      expect(modifier).toBeInstanceOf(OffsetModifier)
      expect(modifier.properties.x).toBe(15)
      expect(modifier.properties.y).toBe(0)
    })

    it('should create offset modifier with both x and y', () => {
      const modifier = offset(10, 25)
      expect(modifier).toBeInstanceOf(OffsetModifier)
      expect(modifier.properties.x).toBe(10)
      expect(modifier.properties.y).toBe(25)
    })

    it('should create offset modifier with reactive values', () => {
      const [xOffset] = createSignal(5)
      const [yOffset] = createSignal(15)
      const modifier = offset(xOffset, yOffset)

      expect(modifier).toBeInstanceOf(OffsetModifier)
      expect(modifier.properties.x).toBe(xOffset)
      expect(modifier.properties.y).toBe(yOffset)
    })
  })

  describe('Edge Cases', () => {
    it('should handle very small decimal values', () => {
      const modifier = offset(0.001, 0.002)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.transform).toBe('translate(0.001px, 0.002px)')
    })

    it('should handle maximum safe integer values', () => {
      const modifier = offset(Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.transform).toBe(
        `translate(${Number.MAX_SAFE_INTEGER}px, ${Number.MIN_SAFE_INTEGER}px)`
      )
    })

    it('should handle complex existing transform', () => {
      mockElement.style.transform =
        'translate3d(10px, 20px, 30px) rotateX(45deg) scale(1.5) skew(10deg, 20deg) translate(100px, 200px)'

      const modifier = offset(50, 75)
      modifier.apply({} as DOMNode, mockContext)

      // Should preserve all transforms except translate functions
      expect(mockElement.style.transform).toBe(
        'rotateX(45deg) scale(1.5) skew(10deg, 20deg) translate(50px, 75px)'
      )
    })

    it('should handle whitespace in existing transform', () => {
      mockElement.style.transform = '  translate( 10px , 20px )  scale(1.2)  '

      const modifier = offset(30, 40)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.transform).toBe(
        'scale(1.2) translate(30px, 40px)'
      )
    })
  })

  describe('Transform Preservation Logic', () => {
    it('should handle translateX function', () => {
      mockElement.style.transform = 'translateX(10px) scale(1.2)'

      const modifier = offset(20, 30)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.transform).toBe(
        'scale(1.2) translate(20px, 30px)'
      )
    })

    it('should handle translateY function', () => {
      mockElement.style.transform = 'translateY(15px) rotate(45deg)'

      const modifier = offset(25, 35)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.transform).toBe(
        'rotate(45deg) translate(25px, 35px)'
      )
    })

    it('should handle translate3d function', () => {
      mockElement.style.transform = 'translate3d(10px, 20px, 30px) scale(1.5)'

      const modifier = offset(40, 50)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.transform).toBe(
        'scale(1.5) translate(40px, 50px)'
      )
    })

    it('should handle mixed translate functions', () => {
      mockElement.style.transform =
        'translateX(10px) rotate(90deg) translateY(20px) scale(2)'

      const modifier = offset(60, 70)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.transform).toBe(
        'rotate(90deg) scale(2) translate(60px, 70px)'
      )
    })
  })
})
