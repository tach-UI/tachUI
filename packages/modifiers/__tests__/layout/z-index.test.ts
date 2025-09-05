/**
 * Z-Index Modifier Tests
 *
 * Comprehensive tests for the z-index modifier
 * including stacking context management, validation, and semantic layers.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ZIndexModifier, zIndex } from '../../src/layout/z-index'
import type { ModifierContext } from '@tachui/core/modifiers/types'
import type { DOMNode } from '@tachui/core/runtime/types'
import { createSignal, flushSync } from '@tachui/core/reactive'

// Mock DOM element with parent support
class MockElement {
  style: {
    [key: string]: string
    setProperty: (property: string, value: string) => void
  }
  tagName: string
  parentElement: MockElement | null

  constructor(
    tagName: string = 'DIV',
    parentElement: MockElement | null = null
  ) {
    this.tagName = tagName
    this.parentElement = parentElement
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

// Mock getComputedStyle
const mockGetComputedStyle = vi.fn()

// Mock console methods
const mockConsole = {
  warn: vi.fn(),
  info: vi.fn(),
}

describe('Z-Index Modifier', () => {
  let mockElement: MockElement
  let mockContext: ModifierContext
  let originalConsole: any
  let originalGetComputedStyle: any

  beforeEach(() => {
    mockElement = new MockElement()
    mockContext = {
      element: mockElement as unknown as HTMLElement,
    }

    originalConsole = { warn: console.warn, info: console.info }
    console.warn = mockConsole.warn
    console.info = mockConsole.info

    originalGetComputedStyle = global.getComputedStyle
    global.getComputedStyle = mockGetComputedStyle

    vi.clearAllMocks()
    mockGetComputedStyle.mockReturnValue({
      position: 'static',
      display: 'block',
      opacity: '1',
      transform: 'none',
      filter: 'none',
      isolation: 'auto',
      mixBlendMode: 'normal',
    })
  })

  afterEach(() => {
    console.warn = originalConsole.warn
    console.info = originalConsole.info
    global.getComputedStyle = originalGetComputedStyle
  })

  describe('ZIndexModifier Class', () => {
    it('should have correct type and priority', () => {
      const modifier = zIndex(10)
      expect(modifier.type).toBe('zIndex')
      expect(modifier.priority).toBe(45)
    })

    it('should apply z-index value', () => {
      const modifier = zIndex(100)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.zIndex).toBe('100')
    })

    it('should handle negative z-index', () => {
      const modifier = zIndex(-1)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.zIndex).toBe('-1')
    })

    it('should handle zero z-index', () => {
      const modifier = zIndex(0)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.zIndex).toBe('0')
    })

    it('should handle large z-index values', () => {
      const modifier = zIndex(999999)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.zIndex).toBe('999999')
    })

    it('should make element positioned when needed', () => {
      mockGetComputedStyle.mockReturnValue({
        position: 'static',
        display: 'block',
      })

      const modifier = zIndex(50)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.zIndex).toBe('50')
      expect(mockElement.style.position).toBe('relative')
    })

    it('should not change position if element is already positioned', () => {
      mockGetComputedStyle.mockReturnValue({
        position: 'absolute',
        display: 'block',
      })

      const modifier = zIndex(25)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.zIndex).toBe('25')
      expect(mockElement.style.position).toBe('')
    })

    it('should handle empty context gracefully', () => {
      const modifier = zIndex(10)
      const emptyContext = { element: undefined }

      expect(() => {
        modifier.apply({} as DOMNode, emptyContext)
      }).not.toThrow()
    })
  })

  describe('Stacking Context Management', () => {
    it('should work with flex items', () => {
      const parent = new MockElement('DIV')
      mockElement.parentElement = parent

      mockGetComputedStyle.mockImplementation(element => {
        if (element === parent) {
          return { display: 'flex' }
        }
        return { position: 'static', display: 'block' }
      })

      const modifier = zIndex(30)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.zIndex).toBe('30')
      // Should not set position: relative for flex items
      expect(mockElement.style.position).toBe('')
    })

    it('should work with inline-flex items', () => {
      const parent = new MockElement('DIV')
      mockElement.parentElement = parent

      mockGetComputedStyle.mockImplementation(element => {
        if (element === parent) {
          return { display: 'inline-flex' }
        }
        return { position: 'static', display: 'block' }
      })

      const modifier = zIndex(40)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.zIndex).toBe('40')
      expect(mockElement.style.position).toBe('')
    })

    it('should work with grid items', () => {
      const parent = new MockElement('DIV')
      mockElement.parentElement = parent

      mockGetComputedStyle.mockImplementation(element => {
        if (element === parent) {
          return { display: 'grid' }
        }
        return { position: 'static', display: 'block' }
      })

      const modifier = zIndex(60)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.zIndex).toBe('60')
      expect(mockElement.style.position).toBe('')
    })

    it('should work with inline-grid items', () => {
      const parent = new MockElement('DIV')
      mockElement.parentElement = parent

      mockGetComputedStyle.mockImplementation(element => {
        if (element === parent) {
          return { display: 'inline-grid' }
        }
        return { position: 'static', display: 'block' }
      })

      const modifier = zIndex(70)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.zIndex).toBe('70')
      expect(mockElement.style.position).toBe('')
    })

    it('should set relative position for regular static elements', () => {
      mockGetComputedStyle.mockReturnValue({
        position: 'static',
        display: 'block',
      })

      const modifier = zIndex(80)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.zIndex).toBe('80')
      expect(mockElement.style.position).toBe('relative')
    })

    it('should handle element without parent', () => {
      mockElement.parentElement = null

      const modifier = zIndex(90)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.zIndex).toBe('90')
      expect(mockElement.style.position).toBe('relative')
    })
  })

  describe('Common Layers Constants', () => {
    it('should provide semantic z-index values', () => {
      const { COMMON_LAYERS } = ZIndexModifier

      expect(COMMON_LAYERS.background).toBe(-1)
      expect(COMMON_LAYERS.base).toBe(0)
      expect(COMMON_LAYERS.content).toBe(1)
      expect(COMMON_LAYERS.navigation).toBe(100)
      expect(COMMON_LAYERS.dropdown).toBe(200)
      expect(COMMON_LAYERS.overlay).toBe(300)
      expect(COMMON_LAYERS.modal).toBe(400)
      expect(COMMON_LAYERS.tooltip).toBe(500)
      expect(COMMON_LAYERS.toast).toBe(600)
      expect(COMMON_LAYERS.debug).toBe(9999)
    })

    it('should work with semantic layer values', () => {
      const modifier = zIndex(ZIndexModifier.COMMON_LAYERS.modal)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.zIndex).toBe('400')
    })
  })

  describe('Reactive Support', () => {
    it('should handle reactive z-index value', () => {
      const [zValue, setZValue] = createSignal(100)
      const modifier = zIndex(zValue)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.zIndex).toBe('100')

      // Update reactive value
      setZValue(200)
      flushSync()
      expect(mockElement.style.zIndex).toBe('200')
    })

    it('should handle reactive updates with stacking context changes', () => {
      mockGetComputedStyle.mockReturnValue({
        position: 'static',
        display: 'block',
      })

      const [zValue, setZValue] = createSignal(50)
      const modifier = zIndex(zValue)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.zIndex).toBe('50')
      expect(mockElement.style.position).toBe('relative')

      // Update reactive value
      setZValue(150)
      flushSync()
      expect(mockElement.style.zIndex).toBe('150')
      // Position should remain set
      expect(mockElement.style.position).toBe('relative')
    })
  })

  describe('Development Mode Validation', () => {
    beforeEach(() => {
      vi.stubGlobal('process', { env: { NODE_ENV: 'development' } })
    })

    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it('should warn about non-numeric z-index', () => {
      const modifier = zIndex('invalid' as any)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining('zIndex must be a number or reactive signal')
      )
    })

    it('should warn about non-integer z-index', () => {
      const modifier = zIndex(10.5)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining('z-index should be an integer')
      )
    })

    it('should warn about unsafe integer values', () => {
      const modifier = zIndex(Number.MAX_SAFE_INTEGER + 1)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining('z-index value')
      )
      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining('outside safe integer range')
      )
    })

    it('should provide guidance for negative z-index', () => {
      const modifier = zIndex(-5)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining(
          'Negative z-index will layer behind the normal stacking order'
        )
      )
    })

    it('should warn about very high z-index values', () => {
      const modifier = zIndex(5000)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining(
          'Very high z-index (5000) may cause stacking conflicts'
        )
      )
    })

    it('should provide info when element sets position relative', () => {
      mockGetComputedStyle.mockReturnValue({
        position: 'static',
        display: 'block',
      })

      const modifier = zIndex(10)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining(
          'Set position: relative on element to enable z-index stacking'
        )
      )
    })

    it('should detect stacking context from opacity', () => {
      mockGetComputedStyle.mockReturnValue({
        position: 'relative',
        opacity: '0.8',
        transform: 'none',
        filter: 'none',
        isolation: 'auto',
        mixBlendMode: 'normal',
      })

      const modifier = zIndex(10)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('Element creates new stacking context due to:'),
        expect.stringContaining('opacity: 0.8')
      )
    })

    it('should detect stacking context from transform', () => {
      mockGetComputedStyle.mockReturnValue({
        position: 'relative',
        opacity: '1',
        transform: 'scale(1.1)',
        filter: 'none',
        isolation: 'auto',
        mixBlendMode: 'normal',
      })

      const modifier = zIndex(10)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('Element creates new stacking context due to:'),
        expect.stringContaining('transform: scale(1.1)')
      )
    })

    it('should detect stacking context from filter', () => {
      mockGetComputedStyle.mockReturnValue({
        position: 'relative',
        opacity: '1',
        transform: 'none',
        filter: 'blur(2px)',
        isolation: 'auto',
        mixBlendMode: 'normal',
      })

      const modifier = zIndex(10)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('Element creates new stacking context due to:'),
        expect.stringContaining('filter: blur(2px)')
      )
    })

    it('should detect stacking context from isolation', () => {
      mockGetComputedStyle.mockReturnValue({
        position: 'relative',
        opacity: '1',
        transform: 'none',
        filter: 'none',
        isolation: 'isolate',
        mixBlendMode: 'normal',
      })

      const modifier = zIndex(10)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('Element creates new stacking context due to:'),
        expect.stringContaining('isolation: isolate')
      )
    })

    it('should detect stacking context from mix-blend-mode', () => {
      mockGetComputedStyle.mockReturnValue({
        position: 'relative',
        opacity: '1',
        transform: 'none',
        filter: 'none',
        isolation: 'auto',
        mixBlendMode: 'multiply',
      })

      const modifier = zIndex(10)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('Element creates new stacking context due to:'),
        expect.stringContaining('mix-blend-mode: multiply')
      )
    })

    it('should detect multiple stacking context properties', () => {
      mockGetComputedStyle.mockReturnValue({
        position: 'relative',
        opacity: '0.9',
        transform: 'translateZ(0)',
        filter: 'none',
        isolation: 'auto',
        mixBlendMode: 'normal',
      })

      const modifier = zIndex(10)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('Element creates new stacking context due to:'),
        expect.stringContaining('opacity: 0.9, transform: translateZ(0)')
      )
    })

    it('should validate reactive z-index values', () => {
      const [zValue] = createSignal(10.7)
      const modifier = zIndex(zValue)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining('z-index should be an integer')
      )
    })

    it('should not validate in production mode', () => {
      vi.stubGlobal('process', { env: { NODE_ENV: 'production' } })

      const modifier = zIndex('invalid' as any)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockConsole.warn).not.toHaveBeenCalled()
    })
  })

  describe('Convenience Function', () => {
    it('should create z-index modifier with numeric value', () => {
      const modifier = zIndex(100)
      expect(modifier).toBeInstanceOf(ZIndexModifier)
      expect(modifier.properties.zIndex).toBe(100)
    })

    it('should create z-index modifier with negative value', () => {
      const modifier = zIndex(-1)
      expect(modifier).toBeInstanceOf(ZIndexModifier)
      expect(modifier.properties.zIndex).toBe(-1)
    })

    it('should create z-index modifier with zero value', () => {
      const modifier = zIndex(0)
      expect(modifier).toBeInstanceOf(ZIndexModifier)
      expect(modifier.properties.zIndex).toBe(0)
    })

    it('should create z-index modifier with reactive value', () => {
      const [zValue] = createSignal(200)
      const modifier = zIndex(zValue)

      expect(modifier).toBeInstanceOf(ZIndexModifier)
      expect(modifier.properties.zIndex).toBe(zValue)
    })

    it('should create z-index modifier with common layer values', () => {
      const modifier = zIndex(ZIndexModifier.COMMON_LAYERS.tooltip)
      expect(modifier).toBeInstanceOf(ZIndexModifier)
      expect(modifier.properties.zIndex).toBe(500)
    })
  })

  describe('Edge Cases', () => {
    it('should handle very large z-index values', () => {
      const modifier = zIndex(Number.MAX_SAFE_INTEGER)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.zIndex).toBe(String(Number.MAX_SAFE_INTEGER))
    })

    it('should handle very small negative z-index values', () => {
      const modifier = zIndex(Number.MIN_SAFE_INTEGER)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.zIndex).toBe(String(Number.MIN_SAFE_INTEGER))
    })

    it('should handle complex parent display types', () => {
      const parent = new MockElement('DIV')
      mockElement.parentElement = parent

      // Test various parent display types that don't create stacking contexts
      const nonStackingDisplays = [
        'block',
        'inline',
        'table',
        'list-item',
        'run-in',
      ]

      nonStackingDisplays.forEach(display => {
        mockGetComputedStyle.mockImplementation(element => {
          if (element === parent) {
            return { display }
          }
          return { position: 'static', display: 'block' }
        })

        const modifier = zIndex(50)
        modifier.apply({} as DOMNode, mockContext)

        expect(mockElement.style.zIndex).toBe('50')
        expect(mockElement.style.position).toBe('relative')

        // Reset
        mockElement = new MockElement()
        mockContext.element = mockElement as unknown as HTMLElement
        mockElement.parentElement = parent
      })
    })
  })
})
