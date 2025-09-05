/**
 * Scale Effect Modifier Tests
 *
 * Comprehensive tests for the scale transform modifier
 * including anchor points, reactive support, and CSS transform preservation.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ScaleEffectModifier, scaleEffect } from '../../src/layout/scale-effect'
import type { ModifierContext } from '@tachui/core/modifiers/types'
import type { DOMNode } from '@tachui/core/runtime/types'
import { createSignal, flushSync } from '@tachui/core/reactive'

// Mock DOM element
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

// Mock console methods
const mockConsole = {
  warn: vi.fn(),
  info: vi.fn(),
}

describe('Scale Effect Modifier', () => {
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

  describe('ScaleEffectModifier Class', () => {
    it('should have correct type and priority', () => {
      const modifier = scaleEffect(1.5)
      expect(modifier.type).toBe('scaleEffect')
      expect(modifier.priority).toBe(35)
    })

    it('should apply uniform scaling', () => {
      const modifier = scaleEffect(2.0)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.transform).toBe('scale(2, 2)')
      expect(mockElement.style.transformOrigin).toBe('center center')
    })

    it('should apply non-uniform scaling', () => {
      const modifier = scaleEffect(1.5, 0.8)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.transform).toBe('scale(1.5, 0.8)')
      expect(mockElement.style.transformOrigin).toBe('center center')
    })

    it('should handle zero scaling', () => {
      const modifier = scaleEffect(0, 0)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.transform).toBe('scale(0, 0)')
    })

    it('should handle negative scaling (flipping)', () => {
      const modifier = scaleEffect(-1, 1)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.transform).toBe('scale(-1, 1)')
    })

    it('should handle decimal scaling', () => {
      const modifier = scaleEffect(1.25, 0.75)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.transform).toBe('scale(1.25, 0.75)')
    })

    it('should preserve existing transforms', () => {
      mockElement.style.transform = 'translate(10px, 20px) rotate(45deg)'
      const modifier = scaleEffect(1.5)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.transform).toBe(
        'translate(10px, 20px) rotate(45deg) scale(1.5, 1.5)'
      )
    })

    it('should replace existing scale transforms', () => {
      mockElement.style.transform = 'scale(2) rotate(90deg) scale(0.5)'
      const modifier = scaleEffect(1.8)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.transform).toBe('rotate(90deg) scale(1.8, 1.8)')
    })

    it('should handle empty context gracefully', () => {
      const modifier = scaleEffect(1.5)
      const emptyContext = { element: undefined }

      expect(() => {
        modifier.apply({} as DOMNode, emptyContext)
      }).not.toThrow()
    })
  })

  describe('Anchor Point Support', () => {
    const anchorTests = [
      { anchor: 'center' as const, expected: 'center center' },
      { anchor: 'top' as const, expected: 'center top' },
      { anchor: 'topLeading' as const, expected: 'left top' },
      { anchor: 'topTrailing' as const, expected: 'right top' },
      { anchor: 'bottom' as const, expected: 'center bottom' },
      { anchor: 'bottomLeading' as const, expected: 'left bottom' },
      { anchor: 'bottomTrailing' as const, expected: 'right bottom' },
      { anchor: 'leading' as const, expected: 'left center' },
      { anchor: 'trailing' as const, expected: 'right center' },
    ]

    anchorTests.forEach(({ anchor, expected }) => {
      it(`should set transform-origin for ${anchor} anchor`, () => {
        const modifier = scaleEffect(1.5, 1.5, anchor)
        modifier.apply({} as DOMNode, mockContext)

        expect(mockElement.style.transformOrigin).toBe(expected)
        expect(mockElement.style.transform).toBe('scale(1.5, 1.5)')
      })
    })

    it('should default to center anchor', () => {
      const modifier = scaleEffect(1.2)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.transformOrigin).toBe('center center')
    })
  })

  describe('Reactive Support', () => {
    it('should handle reactive x value', () => {
      const [xScale, setXScale] = createSignal(1.5)
      const modifier = scaleEffect(xScale, 2.0)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.transform).toBe('scale(1.5, 2)')

      // Update reactive value
      setXScale(2.5)
      flushSync()
      expect(mockElement.style.transform).toBe('scale(2.5, 2)')
    })

    it('should handle reactive y value', () => {
      const [yScale, setYScale] = createSignal(0.8)
      const modifier = scaleEffect(1.2, yScale)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.transform).toBe('scale(1.2, 0.8)')

      // Update reactive value
      setYScale(1.8)
      flushSync()
      expect(mockElement.style.transform).toBe('scale(1.2, 1.8)')
    })

    it('should handle both reactive values', () => {
      const [xScale, setXScale] = createSignal(1.0)
      const [yScale, setYScale] = createSignal(1.0)
      const modifier = scaleEffect(xScale, yScale)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.transform).toBe('scale(1, 1)')

      // Update both values
      setXScale(2.0)
      setYScale(0.5)
      flushSync()
      expect(mockElement.style.transform).toBe('scale(2, 0.5)')
    })
  })

  describe('Development Mode Validation', () => {
    beforeEach(() => {
      vi.stubGlobal('process', { env: { NODE_ENV: 'development' } })
    })

    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it('should warn about invalid x scale type', () => {
      const modifier = scaleEffect('invalid' as any, 1.0)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining('x value must be a number or reactive signal')
      )
    })

    it('should warn about invalid y scale type', () => {
      const modifier = scaleEffect(1.0, 'invalid' as any)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining('y value must be a number or reactive signal')
      )
    })

    it('should warn about invalid anchor', () => {
      const modifier = scaleEffect(1.0, 1.0, 'invalid-anchor' as any)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockConsole.warn).toHaveBeenCalledWith(
        'ScaleEffectModifier: Invalid anchor "invalid-anchor". Valid anchors:',
        [
          'center',
          'top',
          'topLeading',
          'topTrailing',
          'bottom',
          'bottomLeading',
          'bottomTrailing',
          'leading',
          'trailing',
        ]
      )
    })

    it('should warn about zero or negative scaling making element invisible', () => {
      const modifier = scaleEffect(0, -0.5)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining('x scale value 0 will make element invisible')
      )
      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining(
          'y scale value -0.5 will make element invisible'
        )
      )
    })

    it('should warn about very large scale values', () => {
      const modifier = scaleEffect(15, 20)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining('Large x scale (15) may impact performance')
      )
      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining('Large y scale (20) may impact performance')
      )
    })

    it('should provide performance tips for high precision values', () => {
      const modifier = scaleEffect(1.123456, 2.789012)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('Consider rounding x scale to 2 decimal places')
      )
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('Consider rounding y scale to 2 decimal places')
      )
    })

    it('should not validate in production mode', () => {
      vi.stubGlobal('process', { env: { NODE_ENV: 'production' } })

      const modifier = scaleEffect(
        'invalid' as any,
        'also-invalid' as any,
        'bad-anchor' as any
      )
      modifier.apply({} as DOMNode, mockContext)

      expect(mockConsole.warn).not.toHaveBeenCalled()
    })
  })

  describe('Convenience Function', () => {
    it('should create uniform scale with single value', () => {
      const modifier = scaleEffect(1.5)
      expect(modifier).toBeInstanceOf(ScaleEffectModifier)
      expect(modifier.properties.x).toBe(1.5)
      expect(modifier.properties.y).toBeUndefined()
      expect(modifier.properties.anchor).toBe('center')
    })

    it('should create non-uniform scale with x and y values', () => {
      const modifier = scaleEffect(2.0, 0.5)
      expect(modifier).toBeInstanceOf(ScaleEffectModifier)
      expect(modifier.properties.x).toBe(2.0)
      expect(modifier.properties.y).toBe(0.5)
      expect(modifier.properties.anchor).toBe('center')
    })

    it('should create scale with custom anchor', () => {
      const modifier = scaleEffect(1.2, 1.8, 'topLeading')
      expect(modifier).toBeInstanceOf(ScaleEffectModifier)
      expect(modifier.properties.x).toBe(1.2)
      expect(modifier.properties.y).toBe(1.8)
      expect(modifier.properties.anchor).toBe('topLeading')
    })

    it('should create scale with reactive values', () => {
      const [xScale] = createSignal(1.0)
      const [yScale] = createSignal(2.0)
      const modifier = scaleEffect(xScale, yScale, 'bottom')

      expect(modifier).toBeInstanceOf(ScaleEffectModifier)
      expect(modifier.properties.x).toBe(xScale)
      expect(modifier.properties.y).toBe(yScale)
      expect(modifier.properties.anchor).toBe('bottom')
    })
  })

  describe('Edge Cases', () => {
    it('should handle very small scale values', () => {
      const modifier = scaleEffect(0.001, 0.002)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.transform).toBe('scale(0.001, 0.002)')
    })

    it('should handle very large scale values', () => {
      const modifier = scaleEffect(1000, 2000)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.transform).toBe('scale(1000, 2000)')
    })

    it('should handle identity scaling', () => {
      const modifier = scaleEffect(1, 1)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.transform).toBe('scale(1, 1)')
    })

    it('should handle complex existing transform with multiple scales', () => {
      mockElement.style.transform =
        'scale(0.5) translate(10px, 20px) scaleX(2) rotate(45deg) scaleY(1.5) scale3d(1, 2, 3)'

      const modifier = scaleEffect(1.8, 0.9)
      modifier.apply({} as DOMNode, mockContext)

      // Should preserve all non-scale transforms
      expect(mockElement.style.transform).toBe(
        'translate(10px, 20px) rotate(45deg) scale(1.8, 0.9)'
      )
    })

    it('should handle whitespace in existing transform', () => {
      mockElement.style.transform = '  scale( 1.5 )  rotate(90deg)  '

      const modifier = scaleEffect(2.5, 3.0)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.transform).toBe('rotate(90deg) scale(2.5, 3)')
    })
  })

  describe('Transform Preservation Logic', () => {
    it('should handle scaleX function', () => {
      mockElement.style.transform = 'scaleX(2) rotate(45deg)'

      const modifier = scaleEffect(1.5, 0.8)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.transform).toBe('rotate(45deg) scale(1.5, 0.8)')
    })

    it('should handle scaleY function', () => {
      mockElement.style.transform = 'scaleY(0.5) translate(10px, 20px)'

      const modifier = scaleEffect(1.2, 1.8)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.transform).toBe(
        'translate(10px, 20px) scale(1.2, 1.8)'
      )
    })

    it('should handle scale3d function', () => {
      mockElement.style.transform = 'scale3d(1, 2, 3) rotate(90deg)'

      const modifier = scaleEffect(2.5, 1.5)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.transform).toBe('rotate(90deg) scale(2.5, 1.5)')
    })

    it('should handle mixed scale functions', () => {
      mockElement.style.transform =
        'scaleX(1.5) translate(5px) scaleY(2) rotate(180deg) scale(0.8)'

      const modifier = scaleEffect(3.0, 0.6)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.transform).toBe(
        'translate(5px) rotate(180deg) scale(3, 0.6)'
      )
    })
  })

  describe('Y Value Defaulting', () => {
    it('should default y to x for uniform scaling when y is undefined', () => {
      const modifier = scaleEffect(1.75)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.transform).toBe('scale(1.75, 1.75)')
    })

    it('should use explicit y value when provided', () => {
      const modifier = scaleEffect(1.75, 0.25)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.transform).toBe('scale(1.75, 0.25)')
    })

    it('should handle y value of zero explicitly', () => {
      const modifier = scaleEffect(1.5, 0)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.transform).toBe('scale(1.5, 0)')
    })
  })
})
