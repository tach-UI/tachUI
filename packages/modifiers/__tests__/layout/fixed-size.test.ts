/**
 * Fixed Size Modifier Tests
 *
 * Comprehensive tests for the fixed size modifier
 * including intrinsic sizing, text elements, and flex item handling.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { FixedSizeModifier, fixedSize } from '../../src/layout/fixed-size'
import type { ModifierContext } from '@tachui/core/modifiers/types'
import type { DOMNode } from '@tachui/core/runtime/types'

// Mock DOM element with parent and node support
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

// Mock node for text content
class MockNode {
  nodeType: number
  textContent: string

  constructor(nodeType: number, textContent: string = '') {
    this.nodeType = nodeType
    this.textContent = textContent
  }
}

// Mock getComputedStyle
const mockGetComputedStyle = vi.fn()

// Mock console methods
const mockConsole = {
  warn: vi.fn(),
  info: vi.fn(),
}

describe('Fixed Size Modifier', () => {
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
    mockGetComputedStyle.mockReturnValue({ display: 'block' })
  })

  afterEach(() => {
    console.warn = originalConsole.warn
    console.info = originalConsole.info
    global.getComputedStyle = originalGetComputedStyle
  })

  describe('FixedSizeModifier Class', () => {
    it('should have correct type and priority', () => {
      const modifier = fixedSize()
      expect(modifier.type).toBe('fixedSize')
      expect(modifier.priority).toBe(25)
    })

    it('should fix both dimensions by default', () => {
      const modifier = fixedSize()
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.maxWidth).toBe('max-content')
      expect(mockElement.style.width).toBe('max-content')
      expect(mockElement.style.maxHeight).toBe('max-content')
      expect(mockElement.style.height).toBe('max-content')
      expect(mockElement.style.display).toBe('inline-block')
    })

    it('should fix only horizontal dimension', () => {
      const modifier = fixedSize(true, false)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.maxWidth).toBe('max-content')
      expect(mockElement.style.width).toBe('max-content')
      expect(mockElement.style.flexShrink).toBe('0')
      expect(mockElement.style.flexBasis).toBe('auto')

      // Should not affect vertical sizing
      expect(mockElement.style.maxHeight).toBe('')
      expect(mockElement.style.height).toBe('')
    })

    it('should fix only vertical dimension', () => {
      const modifier = fixedSize(false, true)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.maxHeight).toBe('max-content')
      expect(mockElement.style.height).toBe('max-content')

      // Should not affect horizontal sizing
      expect(mockElement.style.maxWidth).toBe('')
      expect(mockElement.style.width).toBe('')
      expect(mockElement.style.flexShrink).toBe('')
    })

    it('should handle both dimensions false (no-op)', () => {
      const modifier = fixedSize(false, false)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.maxWidth).toBe('')
      expect(mockElement.style.width).toBe('')
      expect(mockElement.style.maxHeight).toBe('')
      expect(mockElement.style.height).toBe('')
    })

    it('should handle empty context gracefully', () => {
      const modifier = fixedSize()
      const emptyContext = { element: undefined }

      expect(() => {
        modifier.apply({} as DOMNode, emptyContext)
      }).not.toThrow()
    })
  })

  describe('Text Element Handling', () => {
    const textElements = [
      'P',
      'SPAN',
      'DIV',
      'H1',
      'H2',
      'H3',
      'H4',
      'H5',
      'H6',
      'LABEL',
    ]

    textElements.forEach(tagName => {
      it(`should prevent wrapping for ${tagName} with horizontal fixed size`, () => {
        mockElement = new MockElement(tagName)
        mockElement.childNodes = [
          new MockNode(Node.TEXT_NODE, 'Some text content'),
        ]
        mockContext.element = mockElement as unknown as HTMLElement

        const modifier = fixedSize(true, false)
        modifier.apply({} as DOMNode, mockContext)

        expect(mockElement.style.whiteSpace).toBe('nowrap')
        expect(mockElement.style.maxWidth).toBe('max-content')
      })
    })

    it('should detect text content in child nodes', () => {
      mockElement = new MockElement('DIV')
      mockElement.childNodes = [
        new MockNode(Node.ELEMENT_NODE, ''),
        new MockNode(Node.TEXT_NODE, 'Text content'),
        new MockNode(Node.COMMENT_NODE, 'comment'),
      ]
      mockContext.element = mockElement as unknown as HTMLElement

      const modifier = fixedSize(true, false)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.whiteSpace).toBe('nowrap')
    })

    it('should not set whiteSpace for non-text elements without text content', () => {
      mockElement = new MockElement('BUTTON')
      mockElement.childNodes = [new MockNode(Node.ELEMENT_NODE, '')]
      mockContext.element = mockElement as unknown as HTMLElement

      const modifier = fixedSize(true, false)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.whiteSpace).toBe('')
    })
  })

  describe('Flex Item Handling', () => {
    it('should handle flex item with horizontal fixed size', () => {
      const parent = new MockElement('DIV')
      mockElement = new MockElement('DIV', parent)
      mockContext.element = mockElement as unknown as HTMLElement

      mockGetComputedStyle.mockReturnValue({ display: 'flex' })

      const modifier = fixedSize(true, false)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.flexShrink).toBe('0')
      expect(mockElement.style.flexBasis).toBe('auto')
    })

    it('should handle flex item with vertical fixed size', () => {
      const parent = new MockElement('DIV')
      mockElement = new MockElement('DIV', parent)
      mockContext.element = mockElement as unknown as HTMLElement

      mockGetComputedStyle.mockReturnValue({ display: 'flex' })

      const modifier = fixedSize(false, true)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.alignSelf).toBe('flex-start')
    })

    it('should handle inline-flex parent', () => {
      const parent = new MockElement('DIV')
      mockElement = new MockElement('DIV', parent)
      mockContext.element = mockElement as unknown as HTMLElement

      mockGetComputedStyle.mockReturnValue({ display: 'inline-flex' })

      const modifier = fixedSize(false, true)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.alignSelf).toBe('flex-start')
    })

    it('should handle non-flex parent', () => {
      const parent = new MockElement('DIV')
      mockElement = new MockElement('DIV', parent)
      mockContext.element = mockElement as unknown as HTMLElement

      mockGetComputedStyle.mockReturnValue({ display: 'block' })

      const modifier = fixedSize(false, true)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.alignSelf).toBe('')
    })

    it('should handle element without parent', () => {
      mockElement = new MockElement('DIV', null)
      mockContext.element = mockElement as unknown as HTMLElement

      const modifier = fixedSize(false, true)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.alignSelf).toBe('')
    })
  })

  describe('Display Property Handling', () => {
    it('should set inline-block when both dimensions are fixed', () => {
      mockElement.style.display = ''

      const modifier = fixedSize(true, true)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.display).toBe('inline-block')
    })

    it('should preserve existing display when both dimensions are fixed', () => {
      mockElement.style.display = 'flex'

      const modifier = fixedSize(true, true)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.display).toBe('flex')
    })

    it('should not change display when only one dimension is fixed', () => {
      mockElement.style.display = ''

      const modifier = fixedSize(true, false)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.display).toBe('')

      const modifier2 = fixedSize(false, true)
      modifier2.apply({} as DOMNode, mockContext)

      expect(mockElement.style.display).toBe('')
    })
  })

  describe('Development Mode Validation', () => {
    beforeEach(() => {
      vi.stubGlobal('process', { env: { NODE_ENV: 'development' } })
    })

    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it('should warn about invalid horizontal type', () => {
      const modifier = fixedSize('invalid' as any, true)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining('horizontal must be a boolean')
      )
    })

    it('should warn about invalid vertical type', () => {
      const modifier = fixedSize(true, 'invalid' as any)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining('vertical must be a boolean')
      )
    })

    it('should warn when both parameters are false', () => {
      const modifier = fixedSize(false, false)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining(
          'Both horizontal and vertical are false - this modifier has no effect'
        )
      )
    })

    it('should provide guidance for both dimensions fixed', () => {
      const modifier = fixedSize(true, true)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining(
          'Element will be sized to its content in both dimensions'
        )
      )
    })

    it('should provide guidance for horizontal only', () => {
      const modifier = fixedSize(true, false)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('Element width will be fixed to content size')
      )
    })

    it('should provide guidance for vertical only', () => {
      const modifier = fixedSize(false, true)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('Element height will be fixed to content size')
      )
    })

    it('should not validate in production mode', () => {
      vi.stubGlobal('process', { env: { NODE_ENV: 'production' } })

      const modifier = fixedSize('invalid' as any, 'also-invalid' as any)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockConsole.warn).not.toHaveBeenCalled()
    })
  })

  describe('Convenience Function', () => {
    it('should create fixed size with default parameters (both true)', () => {
      const modifier = fixedSize()
      expect(modifier).toBeInstanceOf(FixedSizeModifier)
      expect(modifier.properties.horizontal).toBe(true)
      expect(modifier.properties.vertical).toBe(true)
    })

    it('should create fixed size with explicit parameters', () => {
      const modifier = fixedSize(true, false)
      expect(modifier).toBeInstanceOf(FixedSizeModifier)
      expect(modifier.properties.horizontal).toBe(true)
      expect(modifier.properties.vertical).toBe(false)
    })

    it('should create fixed size with both false', () => {
      const modifier = fixedSize(false, false)
      expect(modifier).toBeInstanceOf(FixedSizeModifier)
      expect(modifier.properties.horizontal).toBe(false)
      expect(modifier.properties.vertical).toBe(false)
    })
  })

  describe('Edge Cases', () => {
    it('should handle complex text element detection', () => {
      mockElement = new MockElement('DIV')
      mockElement.childNodes = [
        new MockNode(Node.ELEMENT_NODE, ''),
        new MockNode(Node.TEXT_NODE, '   '), // whitespace text
        new MockNode(Node.TEXT_NODE, 'actual content'),
      ]
      mockContext.element = mockElement as unknown as HTMLElement

      const modifier = fixedSize(true, false)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.whiteSpace).toBe('nowrap')
    })

    it('should handle element with no child nodes', () => {
      mockElement = new MockElement('DIV')
      mockElement.childNodes = []
      mockContext.element = mockElement as unknown as HTMLElement

      const modifier = fixedSize(true, false)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.whiteSpace).toBe('')
    })

    it('should handle deep nesting for flex detection', () => {
      const grandParent = new MockElement('DIV')
      const parent = new MockElement('DIV', grandParent)
      mockElement = new MockElement('DIV', parent)
      mockContext.element = mockElement as unknown as HTMLElement

      // Parent is flex
      mockGetComputedStyle.mockImplementation(element => {
        if (element === parent) {
          return { display: 'flex' }
        }
        return { display: 'block' }
      })

      const modifier = fixedSize(false, true)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.alignSelf).toBe('flex-start')
    })
  })

  describe('Integration Scenarios', () => {
    it('should handle text element with flex parent and both dimensions fixed', () => {
      const parent = new MockElement('DIV')
      mockElement = new MockElement('P', parent)
      mockElement.childNodes = [new MockNode(Node.TEXT_NODE, 'Some text')]
      mockContext.element = mockElement as unknown as HTMLElement

      mockGetComputedStyle.mockReturnValue({ display: 'flex' })

      const modifier = fixedSize(true, true)
      modifier.apply({} as DOMNode, mockContext)

      // Horizontal sizing
      expect(mockElement.style.maxWidth).toBe('max-content')
      expect(mockElement.style.width).toBe('max-content')
      expect(mockElement.style.flexShrink).toBe('0')
      expect(mockElement.style.flexBasis).toBe('auto')
      expect(mockElement.style.whiteSpace).toBe('nowrap')

      // Vertical sizing
      expect(mockElement.style.maxHeight).toBe('max-content')
      expect(mockElement.style.height).toBe('max-content')
      expect(mockElement.style.alignSelf).toBe('flex-start')

      // Both dimensions
      expect(mockElement.style.display).toBe('inline-block')
    })

    it('should handle non-text element with grid parent', () => {
      const parent = new MockElement('DIV')
      mockElement = new MockElement('BUTTON', parent)
      mockContext.element = mockElement as unknown as HTMLElement

      mockGetComputedStyle.mockReturnValue({ display: 'grid' })

      const modifier = fixedSize(true, true)
      modifier.apply({} as DOMNode, mockContext)

      // Should not apply text-specific styles
      expect(mockElement.style.whiteSpace).toBe('')

      // Should not apply flex-specific styles
      expect(mockElement.style.alignSelf).toBe('')
      expect(mockElement.style.flexShrink).toBe('0') // Still applies for horizontal

      // Should apply basic sizing
      expect(mockElement.style.maxWidth).toBe('max-content')
      expect(mockElement.style.maxHeight).toBe('max-content')
      expect(mockElement.style.display).toBe('inline-block')
    })
  })
})
