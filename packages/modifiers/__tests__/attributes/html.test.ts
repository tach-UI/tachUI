/**
 * Enhanced HTML Attributes Tests
 *
 * Comprehensive tests for HTML attribute modifiers including ID, data attributes,
 * and tab index with full validation, edge cases, and performance considerations.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  IdModifier,
  id,
  DataModifier,
  data,
  TabIndexModifier,
  tabIndex,
} from '../../src/attributes/html'
import type { ModifierContext } from '@tachui/core/modifiers/types'
import type { DOMNode } from '@tachui/core/runtime/types'

// Mock DOM element that matches HTMLElement interface
class MockElement {
  private attributes: Record<string, string> = {}

  setAttribute(name: string, value: string): void {
    this.attributes[name] = value
  }

  getAttribute(name: string): string | null {
    return this.attributes[name] !== undefined ? this.attributes[name] : null
  }

  hasAttribute(name: string): boolean {
    return name in this.attributes
  }

  removeAttribute(name: string): void {
    delete this.attributes[name]
  }

  // For testing - get all attributes
  getAllAttributes(): Record<string, string> {
    return { ...this.attributes }
  }
}

describe('Enhanced HTML Attributes System', () => {
  let mockElement: MockElement
  let mockContext: ModifierContext

  beforeEach(() => {
    mockElement = new MockElement()
    mockContext = {
      element: mockElement as unknown as HTMLElement,
    }

    // Reset console spies
    vi.clearAllMocks()
  })

  describe('IdModifier Class', () => {
    it('should have correct type and priority', () => {
      const modifier = id('test-id')
      expect(modifier.type).toBe('id')
      expect(modifier.priority).toBe(85)
    })

    it('should apply ID attribute correctly', () => {
      const modifier = id('main-header')
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.getAttribute('id')).toBe('main-header')
    })

    it('should handle various valid ID formats', () => {
      const testCases = [
        'a', // Single letter
        'header', // Simple word
        'main-content', // With hyphen
        'user_profile', // With underscore
        'section:content', // With colon
        'item.detail', // With period
        'a1b2c3', // Letters and numbers
        'navigation-menu-2024', // Complex valid ID
      ]

      testCases.forEach((idValue, index) => {
        const modifier = id(idValue)
        modifier.apply({} as DOMNode, mockContext)
        expect(mockElement.getAttribute('id')).toBe(idValue)

        // Reset for next test
        if (index < testCases.length - 1) {
          mockElement = new MockElement()
          mockContext.element = mockElement as unknown as HTMLElement
        }
      })
    })

    it('should validate ID format in development mode', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const originalEnv = process.env.NODE_ENV

      try {
        process.env.NODE_ENV = 'development'

        // Test invalid IDs
        const invalidIds = [
          '1invalid', // Starts with number
          '-invalid', // Starts with hyphen
          'invalid space', // Contains space
          'invalid@id', // Contains invalid character
        ]

        invalidIds.forEach(invalidId => {
          const modifier = id(invalidId)
          modifier.apply({} as DOMNode, mockContext)
          expect(consoleSpy).toHaveBeenCalledWith(
            expect.stringContaining(`Invalid ID format "${invalidId}"`)
          )
        })
      } finally {
        process.env.NODE_ENV = originalEnv
        consoleSpy.mockRestore()
      }
    })

    it('should check for duplicate IDs in development mode', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const originalEnv = process.env.NODE_ENV

      try {
        process.env.NODE_ENV = 'development'

        // Mock document.getElementById to return an existing element
        const mockGetElementById = vi
          .spyOn(document, 'getElementById')
          .mockReturnValue(document.createElement('div'))

        const modifier = id('existing-id')
        modifier.apply({} as DOMNode, mockContext)

        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Duplicate ID "existing-id" detected')
        )

        mockGetElementById.mockRestore()
      } finally {
        process.env.NODE_ENV = originalEnv
        consoleSpy.mockRestore()
      }
    })

    it('should handle empty context element gracefully', () => {
      const modifier = id('test')
      const emptyContext = { element: null }

      expect(() => {
        modifier.apply({} as DOMNode, emptyContext)
      }).not.toThrow()
    })

    it('should not validate in production mode', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const originalEnv = process.env.NODE_ENV

      try {
        process.env.NODE_ENV = 'production'

        const modifier = id('1invalid-production-id')
        modifier.apply({} as DOMNode, mockContext)

        // Should still set the attribute
        expect(mockElement.getAttribute('id')).toBe('1invalid-production-id')
        // But should not warn
        expect(consoleSpy).not.toHaveBeenCalled()
      } finally {
        process.env.NODE_ENV = originalEnv
        consoleSpy.mockRestore()
      }
    })
  })

  describe('DataModifier Class', () => {
    it('should have correct type and priority', () => {
      const modifier = data({ testId: 'button' })
      expect(modifier.type).toBe('data')
      expect(modifier.priority).toBe(80)
    })

    it('should apply single data attribute', () => {
      const modifier = data({ testId: 'login-button' })
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.getAttribute('data-test-id')).toBe('login-button')
    })

    it('should apply multiple data attributes', () => {
      const modifier = data({
        testId: 'user-card',
        userId: 123,
        active: true,
        category: 'premium',
      })
      modifier.apply({} as DOMNode, mockContext)

      const attributes = mockElement.getAllAttributes()
      expect(attributes['data-test-id']).toBe('user-card')
      expect(attributes['data-user-id']).toBe('123')
      expect(attributes['data-active']).toBe('true')
      expect(attributes['data-category']).toBe('premium')
    })

    it('should handle camelCase to kebab-case conversion', () => {
      const modifier = data({
        customAttribute: 'value',
        veryLongAttributeName: 'test',
        HTMLElement: 'element',
      })
      modifier.apply({} as DOMNode, mockContext)

      const attributes = mockElement.getAllAttributes()
      expect(attributes['data-custom-attribute']).toBe('value')
      expect(attributes['data-very-long-attribute-name']).toBe('test')
      expect(attributes['data--h-t-m-l-element']).toBe('element') // HTMLElement becomes --H-T-M-L-Element -> data--h-t-m-l-element
    })

    it('should preserve existing data- prefix', () => {
      const modifier = data({
        'data-existing': 'kept',
        'data-another-existing': 'also-kept',
      })
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.getAttribute('data-existing')).toBe('kept')
      expect(mockElement.getAttribute('data-another-existing')).toBe(
        'also-kept'
      )
    })

    it('should handle different value types correctly', () => {
      const modifier = data({
        stringValue: 'text',
        numberValue: 42,
        booleanTrue: true,
        booleanFalse: false,
        zeroValue: 0,
        emptyString: '',
      })
      modifier.apply({} as DOMNode, mockContext)

      const attributes = mockElement.getAllAttributes()
      expect(attributes['data-string-value']).toBe('text')
      expect(attributes['data-number-value']).toBe('42')
      expect(attributes['data-boolean-true']).toBe('true')
      expect(attributes['data-boolean-false']).toBe('false')
      expect(attributes['data-zero-value']).toBe('0')
      expect(attributes['data-empty-string']).toBe('')
    })

    it('should validate data attributes in development mode', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const originalEnv = process.env.NODE_ENV

      try {
        process.env.NODE_ENV = 'development'

        // Test invalid key formats
        const modifier = data({
          '1invalid': 'value',
          'invalid-@key': 'value',
          'invalid space': 'value',
        })
        modifier.apply({} as DOMNode, mockContext)

        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Invalid data attribute key')
        )
      } finally {
        process.env.NODE_ENV = originalEnv
        consoleSpy.mockRestore()
      }
    })

    it('should handle empty data attributes object', () => {
      const modifier = data({})

      expect(() => {
        modifier.apply({} as DOMNode, mockContext)
      }).not.toThrow()

      expect(mockElement.getAllAttributes()).toEqual({})
    })

    it('should handle special characters in values', () => {
      const modifier = data({
        json: '{"key": "value"}',
        url: 'https://example.com/path?param=value',
        unicode: '🚀💯✨',
        quotes: '"quoted text"',
        html: '<div>content</div>',
      })
      modifier.apply({} as DOMNode, mockContext)

      const attributes = mockElement.getAllAttributes()
      expect(attributes['data-json']).toBe('{"key": "value"}')
      expect(attributes['data-url']).toBe(
        'https://example.com/path?param=value'
      )
      expect(attributes['data-unicode']).toBe('🚀💯✨')
      expect(attributes['data-quotes']).toBe('"quoted text"')
      expect(attributes['data-html']).toBe('<div>content</div>')
    })
  })

  describe('TabIndexModifier Class', () => {
    it('should have correct type and priority', () => {
      const modifier = tabIndex(0)
      expect(modifier.type).toBe('tabIndex')
      expect(modifier.priority).toBe(75)
    })

    it('should apply tabindex attribute correctly', () => {
      const testCases = [
        { value: 0, expected: '0' },
        { value: -1, expected: '-1' },
        { value: 1, expected: '1' },
        { value: 999, expected: '999' },
      ]

      testCases.forEach(({ value, expected }, index) => {
        const modifier = tabIndex(value)
        modifier.apply({} as DOMNode, mockContext)

        expect(mockElement.getAttribute('tabindex')).toBe(expected)

        // Reset for next test
        if (index < testCases.length - 1) {
          mockElement = new MockElement()
          mockContext.element = mockElement as unknown as HTMLElement
        }
      })
    })

    it('should provide helpful guidance for positive tabIndex in development', () => {
      const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
      const originalEnv = process.env.NODE_ENV

      try {
        process.env.NODE_ENV = 'development'

        const modifier = tabIndex(5)
        modifier.apply({} as DOMNode, mockContext)

        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining(
            'Positive tabIndex values can disrupt natural tab order'
          )
        )
      } finally {
        process.env.NODE_ENV = originalEnv
        consoleSpy.mockRestore()
      }
    })

    it('should warn about invalid tabIndex values in development', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const originalEnv = process.env.NODE_ENV

      try {
        process.env.NODE_ENV = 'development'

        // Test values less than -1
        const modifier = tabIndex(-5)
        modifier.apply({} as DOMNode, mockContext)

        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining(
            'tabIndex values less than -1 are not recommended'
          )
        )
      } finally {
        process.env.NODE_ENV = originalEnv
        consoleSpy.mockRestore()
      }
    })

    it('should validate integer values in development', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const originalEnv = process.env.NODE_ENV

      try {
        process.env.NODE_ENV = 'development'

        // Test non-integer value
        const modifier = tabIndex(1.5 as any)
        modifier.apply({} as DOMNode, mockContext)

        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('tabIndex must be an integer')
        )
      } finally {
        process.env.NODE_ENV = originalEnv
        consoleSpy.mockRestore()
      }
    })

    it('should handle common accessibility patterns', () => {
      // Focusable in tab order
      const focusable = tabIndex(0)
      focusable.apply({} as DOMNode, mockContext)
      expect(mockElement.getAttribute('tabindex')).toBe('0')

      // Reset
      mockElement = new MockElement()
      mockContext.element = mockElement as unknown as HTMLElement

      // Programmatically focusable, not in tab order
      const programmatic = tabIndex(-1)
      programmatic.apply({} as DOMNode, mockContext)
      expect(mockElement.getAttribute('tabindex')).toBe('-1')
    })

    it('should not validate in production mode', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const originalEnv = process.env.NODE_ENV

      try {
        process.env.NODE_ENV = 'production'

        const modifier = tabIndex(-999)
        modifier.apply({} as DOMNode, mockContext)

        // Should still set the attribute
        expect(mockElement.getAttribute('tabindex')).toBe('-999')
        // But should not warn
        expect(consoleSpy).not.toHaveBeenCalled()
      } finally {
        process.env.NODE_ENV = originalEnv
        consoleSpy.mockRestore()
      }
    })
  })

  describe('Convenience Functions', () => {
    it('should create modifiers correctly', () => {
      const idMod = id('test-id')
      expect(idMod).toBeInstanceOf(IdModifier)
      expect(idMod.properties.id).toBe('test-id')

      const dataMod = data({ test: 'value' })
      expect(dataMod).toBeInstanceOf(DataModifier)
      expect(dataMod.properties.data).toEqual({ test: 'value' })

      const tabMod = tabIndex(0)
      expect(tabMod).toBeInstanceOf(TabIndexModifier)
      expect(tabMod.properties.tabIndex).toBe(0)
    })

    it('should handle edge case values', () => {
      // ID with maximum length practical value
      const longId = 'a'.repeat(100) + '1'.repeat(100)
      const idMod = id(longId)
      idMod.apply({} as DOMNode, mockContext)
      expect(mockElement.getAttribute('id')).toBe(longId)

      // Reset
      mockElement = new MockElement()
      mockContext.element = mockElement as unknown as HTMLElement

      // Data with large numbers
      const dataMod = data({ bigNumber: Number.MAX_SAFE_INTEGER })
      dataMod.apply({} as DOMNode, mockContext)
      expect(mockElement.getAttribute('data-big-number')).toBe(
        String(Number.MAX_SAFE_INTEGER)
      )
    })
  })

  describe('Type Safety', () => {
    it('should enforce correct parameter types', () => {
      // These should be caught by TypeScript at compile time
      // Testing that valid combinations work at runtime

      expect(() => id('valid-id')).not.toThrow()
      expect(() => data({ valid: 'data' })).not.toThrow()
      expect(() => tabIndex(0)).not.toThrow()
      expect(() => tabIndex(-1)).not.toThrow()
      expect(() => tabIndex(1)).not.toThrow()
    })
  })

  describe('Performance Considerations', () => {
    it('should handle bulk data attribute operations efficiently', () => {
      const startTime = performance.now()

      // Create modifier with many attributes
      const manyAttributes: Record<string, any> = {}
      for (let i = 0; i < 100; i++) {
        manyAttributes[`attribute${i}`] = `value${i}`
        manyAttributes[`flag${i}`] = i % 2 === 0
        manyAttributes[`count${i}`] = i
      }

      const modifier = data(manyAttributes)
      modifier.apply({} as DOMNode, mockContext)

      const duration = performance.now() - startTime

      // Should complete within reasonable time (less than 10ms)
      expect(duration).toBeLessThan(10)

      // Verify all attributes were set
      const attributes = mockElement.getAllAttributes()
      expect(Object.keys(attributes)).toHaveLength(300) // 100 * 3 attributes each
    })

    it('should minimize memory allocation', () => {
      const initialMemory = process.memoryUsage?.() || { heapUsed: 0 }

      // Create many modifiers
      for (let i = 0; i < 1000; i++) {
        const modifier = id(`id-${i}`)
        modifier.apply({} as DOMNode, mockContext)
      }

      const finalMemory = process.memoryUsage?.() || { heapUsed: 0 }
      const memoryGrowth = finalMemory.heapUsed - initialMemory.heapUsed

      // Memory growth should be reasonable (less than 5MB for 1000 operations)
      expect(memoryGrowth).toBeLessThan(5 * 1024 * 1024)
    })
  })
})
