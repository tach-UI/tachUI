/**
 * Position Modifier Tests
 *
 * Comprehensive tests for the position modifier
 * including validation, performance optimizations, and browser compatibility.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PositionModifier, position } from '../../src/layout/position'
import type { ModifierContext } from '@tachui/core/modifiers/types'
import type { DOMNode } from '@tachui/core/runtime/types'
import { createSignal, flushSync } from '@tachui/core/reactive'

// Mock DOM element with parent chain
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

// Mock document.body
const mockDocumentBody = new MockElement('BODY', null)

// Mock getComputedStyle
const mockGetComputedStyle = vi.fn()

// Mock console methods
const mockConsole = {
  warn: vi.fn(),
  info: vi.fn(),
}

describe('Position Modifier', () => {
  let mockElement: MockElement
  let mockContext: ModifierContext
  let originalConsole: any
  let originalGetComputedStyle: any
  let originalDocument: any

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

    originalDocument = global.document
    global.document = { body: mockDocumentBody } as any

    vi.clearAllMocks()
    mockGetComputedStyle.mockReturnValue({
      position: 'static',
      top: 'auto',
      right: 'auto',
      bottom: 'auto',
      left: 'auto',
    })
  })

  afterEach(() => {
    console.warn = originalConsole.warn
    console.info = originalConsole.info
    global.getComputedStyle = originalGetComputedStyle
    global.document = originalDocument
  })

  describe('PositionModifier Class', () => {
    it('should have correct type and priority', () => {
      const modifier = position('relative')
      expect(modifier.type).toBe('position')
      expect(modifier.priority).toBe(50)
    })

    it('should apply static position', () => {
      const modifier = position('static')
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.position).toBe('static')
    })

    it('should apply relative position', () => {
      const modifier = position('relative')
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.position).toBe('relative')
    })

    it('should apply absolute position with optimizations', () => {
      const modifier = position('absolute')
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.position).toBe('absolute')
      expect(mockElement.style.zIndex).toBe('0')
      expect(mockElement.style.transform).toBe('translateZ(0)')
    })

    it('should apply fixed position with optimizations', () => {
      const modifier = position('fixed')
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.position).toBe('fixed')
      expect(mockElement.style.zIndex).toBe('0')
      expect(mockElement.style.transform).toBe('translateZ(0)')
    })

    it('should apply sticky position', () => {
      const modifier = position('sticky')
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.position).toBe('sticky')
    })

    it('should preserve existing z-index for positioned elements', () => {
      mockElement.style.zIndex = '10'

      const modifier = position('absolute')
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.position).toBe('absolute')
      expect(mockElement.style.zIndex).toBe('10') // Should not change
    })

    it('should preserve existing transform for positioned elements', () => {
      mockElement.style.transform = 'scale(1.5)'

      const modifier = position('fixed')
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.position).toBe('fixed')
      expect(mockElement.style.transform).toBe('scale(1.5)') // Should not change
    })

    it('should handle empty context gracefully', () => {
      const modifier = position('relative')
      const emptyContext = { element: undefined }

      expect(() => {
        modifier.apply({} as DOMNode, emptyContext)
      }).not.toThrow()
    })
  })

  describe('Reactive Support', () => {
    it('should handle reactive position value', () => {
      const [pos, setPos] = createSignal('relative')
      const modifier = position(pos)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.position).toBe('relative')

      // Update reactive value
      setPos('absolute')
      flushSync()
      expect(mockElement.style.position).toBe('absolute')
      expect(mockElement.style.zIndex).toBe('0') // Should apply optimizations
    })

    it('should apply different optimizations for reactive changes', () => {
      const [pos, setPos] = createSignal('static')
      const modifier = position(pos)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.position).toBe('static')
      expect(mockElement.style.zIndex).toBe('')

      // Change to positioned element
      setPos('fixed')
      flushSync()
      expect(mockElement.style.position).toBe('fixed')
      expect(mockElement.style.zIndex).toBe('0')
      expect(mockElement.style.transform).toBe('translateZ(0)')
    })
  })

  describe('Development Mode Validation', () => {
    beforeEach(() => {
      vi.stubGlobal('process', { env: { NODE_ENV: 'development' } })
    })

    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it('should warn about invalid position type', () => {
      const modifier = position('invalid' as any)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockConsole.warn).toHaveBeenCalledWith(
        'PositionModifier: Invalid position value "invalid". Valid values:',
        ['static', 'relative', 'absolute', 'fixed', 'sticky']
      )
    })

    it('should warn about invalid position value', () => {
      const modifier = position('invalid-position' as any)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockConsole.warn).toHaveBeenCalledWith(
        'PositionModifier: Invalid position value "invalid-position". Valid values:',
        ['static', 'relative', 'absolute', 'fixed', 'sticky']
      )
    })

    it('should provide mobile layout guidance for fixed positioning', () => {
      const modifier = position('fixed')
      modifier.apply({} as DOMNode, mockContext)

      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining(
          'Fixed positioning relative to viewport. Consider impact on mobile layouts.'
        )
      )
    })

    it('should provide browser compatibility info for sticky positioning', () => {
      const modifier = position('sticky')
      modifier.apply({} as DOMNode, mockContext)

      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining(
          'Sticky positioning may need vendor prefixes for older browsers'
        )
      )
    })

    it('should warn about missing positioned parent for absolute positioning', () => {
      const parent = new MockElement('DIV')
      mockElement.parentElement = parent

      // Mock getComputedStyle to return static for parent chain
      mockGetComputedStyle.mockImplementation(element => {
        if (element === parent || element === mockDocumentBody) {
          return { position: 'static' }
        }
        return { position: 'static' }
      })

      const modifier = position('absolute')
      modifier.apply({} as DOMNode, mockContext)

      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining(
          'Absolutely positioned element may not have expected behavior without a positioned parent'
        )
      )
    })

    it('should not warn when positioned parent exists for absolute positioning', () => {
      const parent = new MockElement('DIV')
      mockElement.parentElement = parent

      // Mock positioned parent
      mockGetComputedStyle.mockImplementation(element => {
        if (element === parent) {
          return { position: 'relative' }
        }
        return { position: 'static' }
      })

      const modifier = position('absolute')
      modifier.apply({} as DOMNode, mockContext)

      expect(mockConsole.warn).not.toHaveBeenCalledWith(
        expect.stringContaining('positioned parent')
      )
    })

    it('should warn about missing sticky properties', () => {
      mockGetComputedStyle.mockReturnValue({
        position: 'sticky',
        top: 'auto',
        right: 'auto',
        bottom: 'auto',
        left: 'auto',
      })

      const modifier = position('sticky')
      modifier.apply({} as DOMNode, mockContext)

      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining(
          'Sticky positioning requires at least one of top, right, bottom, or left to be set'
        )
      )
    })

    it('should not warn when sticky has positioning properties', () => {
      mockGetComputedStyle.mockReturnValue({
        position: 'sticky',
        top: '10px',
        right: 'auto',
        bottom: 'auto',
        left: 'auto',
      })

      const modifier = position('sticky')
      modifier.apply({} as DOMNode, mockContext)

      expect(mockConsole.warn).not.toHaveBeenCalledWith(
        expect.stringContaining('Sticky positioning requires')
      )
    })

    it('should warn about positioning properties on static elements', () => {
      mockGetComputedStyle.mockReturnValue({
        position: 'static',
        top: '10px',
        right: 'auto',
        bottom: 'auto',
        left: '20px',
      })

      const modifier = position('static')
      modifier.apply({} as DOMNode, mockContext)

      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining(
          'Static positioning ignores top, right, bottom, and left properties'
        )
      )
    })

    it('should validate reactive position values', () => {
      const [pos] = createSignal('invalid-value')
      const modifier = position(pos)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockConsole.warn).toHaveBeenCalledWith(
        'PositionModifier: Invalid position value "invalid-value". Valid values:',
        ['static', 'relative', 'absolute', 'fixed', 'sticky']
      )
    })

    it('should not validate in production mode', () => {
      vi.stubGlobal('process', { env: { NODE_ENV: 'production' } })

      const modifier = position('invalid-position' as any)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockConsole.warn).not.toHaveBeenCalled()
    })
  })

  describe('Performance Optimizations', () => {
    it('should not apply optimizations to static elements', () => {
      const modifier = position('static')
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.position).toBe('static')
      expect(mockElement.style.zIndex).toBe('')
      expect(mockElement.style.transform).toBe('')
    })

    it('should not apply optimizations to relative elements', () => {
      const modifier = position('relative')
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.position).toBe('relative')
      expect(mockElement.style.zIndex).toBe('')
      expect(mockElement.style.transform).toBe('')
    })

    it('should not apply optimizations to sticky elements', () => {
      const modifier = position('sticky')
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.position).toBe('sticky')
      expect(mockElement.style.zIndex).toBe('')
      expect(mockElement.style.transform).toBe('')
    })

    it('should apply optimizations only to absolute and fixed elements', () => {
      const absoluteModifier = position('absolute')
      absoluteModifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.position).toBe('absolute')
      expect(mockElement.style.zIndex).toBe('0')
      expect(mockElement.style.transform).toBe('translateZ(0)')

      // Reset
      mockElement = new MockElement()
      mockContext.element = mockElement as unknown as HTMLElement

      const fixedModifier = position('fixed')
      fixedModifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.position).toBe('fixed')
      expect(mockElement.style.zIndex).toBe('0')
      expect(mockElement.style.transform).toBe('translateZ(0)')
    })
  })

  describe('Convenience Function', () => {
    it('should create position modifier with static value', () => {
      const modifier = position('static')
      expect(modifier).toBeInstanceOf(PositionModifier)
      expect(modifier.properties.position).toBe('static')
    })

    it('should create position modifier with relative value', () => {
      const modifier = position('relative')
      expect(modifier).toBeInstanceOf(PositionModifier)
      expect(modifier.properties.position).toBe('relative')
    })

    it('should create position modifier with absolute value', () => {
      const modifier = position('absolute')
      expect(modifier).toBeInstanceOf(PositionModifier)
      expect(modifier.properties.position).toBe('absolute')
    })

    it('should create position modifier with fixed value', () => {
      const modifier = position('fixed')
      expect(modifier).toBeInstanceOf(PositionModifier)
      expect(modifier.properties.position).toBe('fixed')
    })

    it('should create position modifier with sticky value', () => {
      const modifier = position('sticky')
      expect(modifier).toBeInstanceOf(PositionModifier)
      expect(modifier.properties.position).toBe('sticky')
    })

    it('should create position modifier with reactive value', () => {
      const [pos] = createSignal('relative')
      const modifier = position(pos)

      expect(modifier).toBeInstanceOf(PositionModifier)
      expect(modifier.properties.position).toBe(pos)
    })
  })

  describe('Parent Chain Traversal', () => {
    it('should traverse up the parent chain looking for positioned elements', () => {
      const grandParent = new MockElement('DIV')
      const parent = new MockElement('DIV', grandParent)
      mockElement.parentElement = parent

      mockGetComputedStyle.mockImplementation(element => {
        if (element === grandParent) {
          return { position: 'relative' } // Positioned ancestor
        }
        return { position: 'static' }
      })

      const modifier = position('absolute')
      modifier.apply({} as DOMNode, mockContext)

      // Should not warn because positioned ancestor was found
      expect(mockConsole.warn).not.toHaveBeenCalledWith(
        expect.stringContaining('positioned parent')
      )
    })

    it('should stop traversal at document.body', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      const parent = new MockElement('DIV', mockDocumentBody)
      mockElement.parentElement = parent

      mockGetComputedStyle.mockImplementation(element => {
        // All elements are static
        return { position: 'static' }
      })

      const modifier = position('absolute')
      modifier.apply({} as DOMNode, mockContext)

      // Should warn because no positioned parent found before body
      expect(mockConsole.warn).toHaveBeenCalledWith(
        'PositionModifier: Absolutely positioned element may not have expected behavior without a positioned parent (relative, absolute, or fixed)'
      )

      process.env.NODE_ENV = originalEnv
    })

    it('should handle null parent chain', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      mockElement.parentElement = null

      const modifier = position('absolute')
      modifier.apply({} as DOMNode, mockContext)

      // Should warn because no parent exists
      expect(mockConsole.warn).toHaveBeenCalledWith(
        'PositionModifier: Absolutely positioned element may not have expected behavior without a positioned parent (relative, absolute, or fixed)'
      )

      process.env.NODE_ENV = originalEnv
    })
  })

  describe('Edge Cases', () => {
    it('should handle all valid position values', () => {
      const validPositions = [
        'static',
        'relative',
        'absolute',
        'fixed',
        'sticky',
      ] as const

      validPositions.forEach(pos => {
        const modifier = position(pos)
        modifier.apply({} as DOMNode, mockContext)

        expect(mockElement.style.position).toBe(pos)

        // Reset for next test
        mockElement = new MockElement()
        mockContext.element = mockElement as unknown as HTMLElement
      })
    })

    it('should handle complex parent chain with mixed positioning', () => {
      const body = new MockElement('BODY')
      const container = new MockElement('DIV', body)
      const section = new MockElement('SECTION', container)
      const parent = new MockElement('DIV', section)
      mockElement.parentElement = parent

      mockGetComputedStyle.mockImplementation(element => {
        if (element === container) {
          return { position: 'relative' } // First positioned ancestor
        }
        if (element === section) {
          return { position: 'absolute' } // Closer positioned ancestor (shouldn't reach here)
        }
        return { position: 'static' }
      })

      const modifier = position('absolute')
      modifier.apply({} as DOMNode, mockContext)

      // Should not warn - positioned ancestor found
      expect(mockConsole.warn).not.toHaveBeenCalledWith(
        expect.stringContaining('positioned parent')
      )
    })
  })
})
