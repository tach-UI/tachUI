/**
 * HTML and ARIA Attributes Tests
 *
 * Comprehensive tests for HTML attributes, ARIA accessibility, and related modifiers.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { 
  IdModifier,
  DataModifier,
  AriaModifier,
  TabIndexModifier,
  id,
  data,
  aria,
  tabIndex
} from '../../src/modifiers/attributes'

// Mock DOM environment
const mockElement = {
  style: {
    setProperty: vi.fn(),
    removeProperty: vi.fn(),
    getPropertyValue: vi.fn(),
    // Add direct property access
    textShadow: undefined as any,
  },
  setAttribute: vi.fn(),
  removeAttribute: vi.fn(),
  getAttribute: vi.fn(),
  hasAttribute: vi.fn(),
  classList: {
    add: vi.fn(),
    remove: vi.fn(),
    contains: vi.fn(),
  },
} as any

const mockContext = {
  componentId: 'test-component',
  element: mockElement,
  phase: 'creation' as const,
}

describe('HTML and ARIA Attributes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset mock element style
    mockElement.style.textShadow = undefined
    mockElement.style.setProperty = vi.fn((prop, value) => {
      // Simulate setting the property
      if (prop === 'text-shadow') {
        mockElement.style.textShadow = value
      }
      ;(mockElement.style as any)[prop] = value
    })
    // Mock console methods
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'info').mockImplementation(() => {})
    // Mock document.getElementById for ID validation
    vi.spyOn(document, 'getElementById').mockImplementation(() => null)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ============================================================================
  // ID Modifier Tests
  // ============================================================================

  describe('IdModifier', () => {
    it('should set id attribute', () => {
      const modifier = new IdModifier({ id: 'test-id' })
      
      modifier.apply({} as any, mockContext)
      
      expect(mockElement.setAttribute).toHaveBeenCalledWith('id', 'test-id')
    })

    it('should have correct type and priority', () => {
      const modifier = new IdModifier({ id: 'test' })
      
      expect(modifier.type).toBe('id')
      expect(modifier.priority).toBeGreaterThan(0)
    })

    it('should validate ID format in development', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      // Test invalid ID starting with number
      const modifier = new IdModifier({ id: '123invalid' })
      modifier.apply({} as any, mockContext)
      
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Invalid ID format "123invalid"')
      )

      process.env.NODE_ENV = originalEnv
    })

    it('should warn about duplicate IDs in development', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      // Mock existing element with same ID
      vi.spyOn(document, 'getElementById').mockReturnValue(document.createElement('div'))

      const modifier = new IdModifier({ id: 'duplicate-id' })
      modifier.apply({} as any, mockContext)
      
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Duplicate ID "duplicate-id" detected')
      )

      process.env.NODE_ENV = originalEnv
    })

    it('should work with factory function', () => {
      const modifier = id('factory-test')
      
      expect(modifier).toBeInstanceOf(IdModifier)
      expect(modifier.properties.id).toBe('factory-test')
    })
  })

  // ============================================================================
  // Data Modifier Tests
  // ============================================================================

  describe('DataModifier', () => {
    it('should set data attributes with proper formatting', () => {
      const modifier = new DataModifier({
        data: {
          testid: 'my-component',
          index: 42,
          active: true,
          disabled: false
        }
      })
      
      modifier.apply({} as any, mockContext)
      
      expect(mockElement.setAttribute).toHaveBeenCalledWith('data-testid', 'my-component')
      expect(mockElement.setAttribute).toHaveBeenCalledWith('data-index', '42')
      expect(mockElement.setAttribute).toHaveBeenCalledWith('data-active', 'true')
      expect(mockElement.setAttribute).toHaveBeenCalledWith('data-disabled', 'false')
    })

    it('should handle camelCase attribute names', () => {
      const modifier = new DataModifier({
        data: {
          myTestValue: 'test',
          anotherCamelCase: 123
        }
      })
      
      modifier.apply({} as any, mockContext)
      
      expect(mockElement.setAttribute).toHaveBeenCalledWith('data-my-test-value', 'test')
      expect(mockElement.setAttribute).toHaveBeenCalledWith('data-another-camel-case', '123')
    })

    it('should preserve existing data- prefix', () => {
      const modifier = new DataModifier({
        data: {
          'data-existing': 'value'
        }
      })
      
      modifier.apply({} as any, mockContext)
      
      expect(mockElement.setAttribute).toHaveBeenCalledWith('data-existing', 'value')
    })

    it('should validate attribute names in development', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      const modifier = new DataModifier({
        data: {
          '123invalid': 'value',
          'valid-name': 'value'
        }
      })
      
      modifier.apply({} as any, mockContext)
      
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Invalid data attribute key "123invalid"')
      )

      process.env.NODE_ENV = originalEnv
    })

    it('should work with factory function', () => {
      const modifier = data({ test: 'value', count: 5 })
      
      expect(modifier).toBeInstanceOf(DataModifier)
      expect(modifier.properties.data).toEqual({ test: 'value', count: 5 })
    })
  })

  // ============================================================================
  // ARIA Modifier Tests
  // ============================================================================

  describe('AriaModifier', () => {
    it('should set aria attributes with proper formatting', () => {
      const modifier = new AriaModifier({
        aria: {
          label: 'Test button',
          expanded: true,
          haspopup: 'menu',
          level: 2
        }
      })
      
      modifier.apply({} as any, mockContext)
      
      expect(mockElement.setAttribute).toHaveBeenCalledWith('aria-label', 'Test button')
      expect(mockElement.setAttribute).toHaveBeenCalledWith('aria-expanded', 'true')
      expect(mockElement.setAttribute).toHaveBeenCalledWith('aria-haspopup', 'menu')
      expect(mockElement.setAttribute).toHaveBeenCalledWith('aria-level', '2')
    })

    it('should handle special role attribute', () => {
      const modifier = new AriaModifier({
        aria: {
          role: 'button',
          label: 'Custom button'
        }
      })
      
      modifier.apply({} as any, mockContext)
      
      expect(mockElement.setAttribute).toHaveBeenCalledWith('role', 'button')
      expect(mockElement.setAttribute).toHaveBeenCalledWith('aria-label', 'Custom button')
    })

    it('should handle camelCase attributes', () => {
      const modifier = new AriaModifier({
        aria: {
          labelledby: 'header-id',
          describedby: 'description-id'
        }
      })
      
      modifier.apply({} as any, mockContext)
      
      expect(mockElement.setAttribute).toHaveBeenCalledWith('aria-labelledby', 'header-id')
      expect(mockElement.setAttribute).toHaveBeenCalledWith('aria-describedby', 'description-id')
    })

    it('should skip undefined values', () => {
      const modifier = new AriaModifier({
        aria: {
          label: 'Test',
          expanded: undefined,
          hidden: false
        }
      })
      
      modifier.apply({} as any, mockContext)
      
      expect(mockElement.setAttribute).toHaveBeenCalledWith('aria-label', 'Test')
      expect(mockElement.setAttribute).toHaveBeenCalledWith('aria-hidden', 'false')
      expect(mockElement.setAttribute).not.toHaveBeenCalledWith('aria-expanded', expect.anything())
    })

    it('should validate ARIA attributes in development', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      const modifier = new AriaModifier({
        aria: {
          unknownAttribute: 'value',
          live: 'invalid-value' as any
        }
      })
      
      modifier.apply({} as any, mockContext)
      
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Unknown ARIA attribute "unknownAttribute"')
      )
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Invalid value "invalid-value" for aria-live')
      )

      process.env.NODE_ENV = originalEnv
    })

    it('should provide helpful suggestions for typos', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      const modifier = new AriaModifier({
        aria: {
          lable: 'Test' as any // typo: should be 'label'
        }
      })
      
      modifier.apply({} as any, mockContext)
      
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Did you mean "label"?')
      )

      process.env.NODE_ENV = originalEnv
    })

    it('should work with factory function', () => {
      const modifier = aria({ label: 'Test', expanded: true })
      
      expect(modifier).toBeInstanceOf(AriaModifier)
      expect(modifier.properties.aria).toEqual({ label: 'Test', expanded: true })
    })
  })

  // NOTE: TextShadow tests moved to enhanced.test.ts since textShadow is now part of the enhanced shadow system

  // ============================================================================
  // Tab Index Modifier Tests
  // ============================================================================

  describe('TabIndexModifier', () => {
    it('should set tabindex attribute', () => {
      const modifier = new TabIndexModifier({ tabIndex: 5 })
      
      modifier.apply({} as any, mockContext)
      
      expect(mockElement.setAttribute).toHaveBeenCalledWith('tabindex', '5')
    })

    it('should handle negative tabindex', () => {
      const modifier = new TabIndexModifier({ tabIndex: -1 })
      
      modifier.apply({} as any, mockContext)
      
      expect(mockElement.setAttribute).toHaveBeenCalledWith('tabindex', '-1')
    })

    it('should handle zero tabindex', () => {
      const modifier = new TabIndexModifier({ tabIndex: 0 })
      
      modifier.apply({} as any, mockContext)
      
      expect(mockElement.setAttribute).toHaveBeenCalledWith('tabindex', '0')
    })

    it('should validate tabindex in development', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      // Test non-integer value
      const modifier = new TabIndexModifier({ tabIndex: 1.5 as any })
      modifier.apply({} as any, mockContext)
      
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('tabIndex must be an integer')
      )

      process.env.NODE_ENV = originalEnv
    })

    it('should provide guidance for positive tabindex values', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      const modifier = new TabIndexModifier({ tabIndex: 10 })
      modifier.apply({} as any, mockContext)
      
      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('Positive tabIndex values can disrupt natural tab order')
      )

      process.env.NODE_ENV = originalEnv
    })

    it('should warn about invalid tabindex values', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      const modifier = new TabIndexModifier({ tabIndex: -5 })
      modifier.apply({} as any, mockContext)
      
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('tabIndex values less than -1 are not recommended')
      )

      process.env.NODE_ENV = originalEnv
    })

    it('should work with factory function', () => {
      const modifier = tabIndex(3)
      
      expect(modifier).toBeInstanceOf(TabIndexModifier)
      expect(modifier.properties.tabIndex).toBe(3)
    })
  })

  // ============================================================================
  // Integration Tests
  // ============================================================================

  describe('Integration Tests', () => {
    it('should work together in a component chain', () => {
      const idMod = id('integration-test')
      const dataMod = data({ component: 'test-card', priority: 'high' })
      const ariaMod = aria({ label: 'Test card', expanded: false })
      const tabIndexMod = tabIndex(0)

      // Apply all modifiers
      idMod.apply({} as any, mockContext)
      dataMod.apply({} as any, mockContext)
      ariaMod.apply({} as any, mockContext)
      tabIndexMod.apply({} as any, mockContext)

      // Verify all attributes are set
      expect(mockElement.setAttribute).toHaveBeenCalledWith('id', 'integration-test')
      expect(mockElement.setAttribute).toHaveBeenCalledWith('data-component', 'test-card')
      expect(mockElement.setAttribute).toHaveBeenCalledWith('data-priority', 'high')
      expect(mockElement.setAttribute).toHaveBeenCalledWith('aria-label', 'Test card')
      expect(mockElement.setAttribute).toHaveBeenCalledWith('aria-expanded', 'false')
      expect(mockElement.setAttribute).toHaveBeenCalledWith('tabindex', '0')
    })

    it('should have appropriate priority ordering', () => {
      const idMod = new IdModifier({ id: 'test' })
      const dataMod = new DataModifier({ data: { test: 'value' } })
      const ariaMod = new AriaModifier({ aria: { label: 'test' } })
      const tabIndexMod = new TabIndexModifier({ tabIndex: 0 })

      // Check priorities are reasonable for application order
      expect(idMod.priority).toBeGreaterThan(0)
      expect(dataMod.priority).toBeGreaterThan(0)
      expect(ariaMod.priority).toBeGreaterThan(dataMod.priority) // ARIA should come after data attributes
      expect(tabIndexMod.priority).toBeGreaterThan(0)
    })
  })
})