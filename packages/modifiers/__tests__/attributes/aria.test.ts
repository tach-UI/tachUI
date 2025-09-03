/**
 * Enhanced ARIA Attributes Tests
 *
 * Comprehensive tests for ARIA accessibility modifiers with full validation,
 * type safety, and accessibility compliance testing.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AriaModifier, aria } from '../../src/attributes/aria'
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

describe('Enhanced ARIA Attributes System', () => {
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

  describe('AriaModifier Class', () => {
    it('should have correct type and priority', () => {
      const modifier = aria({ label: 'Close' })
      expect(modifier.type).toBe('aria')
      expect(modifier.priority).toBe(90)
    })

    it('should apply basic ARIA attributes', () => {
      const modifier = aria({
        label: 'Close dialog',
        role: 'button',
        expanded: false,
      })
      modifier.apply({} as DOMNode, mockContext)

      const attributes = mockElement.getAllAttributes()
      expect(attributes['aria-label']).toBe('Close dialog')
      expect(attributes['role']).toBe('button')
      expect(attributes['aria-expanded']).toBe('false')
    })

    it('should handle camelCase to kebab-case conversion', () => {
      const modifier = aria({
        labelledby: 'label-1',
        describedby: 'desc-1',
        multiselectable: true,
        valuemax: 100,
      })
      modifier.apply({} as DOMNode, mockContext)

      const attributes = mockElement.getAllAttributes()
      expect(attributes['aria-labelledby']).toBe('label-1')
      expect(attributes['aria-describedby']).toBe('desc-1')
      expect(attributes['aria-multiselectable']).toBe('true')
      expect(attributes['aria-valuemax']).toBe('100')
    })

    it('should handle special role attribute', () => {
      const modifier = aria({ role: 'tabpanel' })
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.getAttribute('role')).toBe('tabpanel')
      expect(mockElement.getAttribute('aria-role')).toBeNull()
    })

    it('should handle boolean values correctly', () => {
      const modifier = aria({
        expanded: true,
        hidden: false,
        atomic: true,
        busy: false,
        disabled: true,
        grabbed: false,
        multiline: true,
        multiselectable: false,
        pressed: true,
        readonly: false,
        required: true,
        selected: false,
      })
      modifier.apply({} as DOMNode, mockContext)

      const attributes = mockElement.getAllAttributes()
      expect(attributes['aria-expanded']).toBe('true')
      expect(attributes['aria-hidden']).toBe('false')
      expect(attributes['aria-atomic']).toBe('true')
      expect(attributes['aria-busy']).toBe('false')
      expect(attributes['aria-disabled']).toBe('true')
      expect(attributes['aria-grabbed']).toBe('false')
      expect(attributes['aria-multiline']).toBe('true')
      expect(attributes['aria-multiselectable']).toBe('false')
      expect(attributes['aria-pressed']).toBe('true')
      expect(attributes['aria-readonly']).toBe('false')
      expect(attributes['aria-required']).toBe('true')
      expect(attributes['aria-selected']).toBe('false')
    })

    it('should handle string boolean values for backward compatibility', () => {
      const modifier = aria({
        grabbed: 'true',
        pressed: 'false',
        haspopup: 'menu',
      })
      modifier.apply({} as DOMNode, mockContext)

      const attributes = mockElement.getAllAttributes()
      expect(attributes['aria-grabbed']).toBe('true')
      expect(attributes['aria-pressed']).toBe('false')
      expect(attributes['aria-haspopup']).toBe('menu')
    })

    it('should handle numeric values correctly', () => {
      const modifier = aria({
        level: 2,
        posinset: 3,
        setsize: 10,
        valuemax: 100,
        valuemin: 0,
        valuenow: 50,
      })
      modifier.apply({} as DOMNode, mockContext)

      const attributes = mockElement.getAllAttributes()
      expect(attributes['aria-level']).toBe('2')
      expect(attributes['aria-posinset']).toBe('3')
      expect(attributes['aria-setsize']).toBe('10')
      expect(attributes['aria-valuemax']).toBe('100')
      expect(attributes['aria-valuemin']).toBe('0')
      expect(attributes['aria-valuenow']).toBe('50')
    })

    it('should handle enumerated values correctly', () => {
      const modifier = aria({
        live: 'polite',
        current: 'page',
        invalid: 'grammar',
        orientation: 'vertical',
        sort: 'ascending',
        haspopup: 'dialog',
      })
      modifier.apply({} as DOMNode, mockContext)

      const attributes = mockElement.getAllAttributes()
      expect(attributes['aria-live']).toBe('polite')
      expect(attributes['aria-current']).toBe('page')
      expect(attributes['aria-invalid']).toBe('grammar')
      expect(attributes['aria-orientation']).toBe('vertical')
      expect(attributes['aria-sort']).toBe('ascending')
      expect(attributes['aria-haspopup']).toBe('dialog')
    })

    it('should handle common typo: labeledby -> labelledby', () => {
      const modifier = aria({
        labeledby: 'header-1', // Common typo
      })
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.getAttribute('aria-labelledby')).toBe('header-1')
      expect(mockElement.getAttribute('aria-labeledby')).toBeNull()
    })

    it('should skip undefined and null values', () => {
      const modifier = aria({
        label: 'Valid label',
        describedby: undefined,
        expanded: null as any,
        hidden: false, // This should still be set
      })
      modifier.apply({} as DOMNode, mockContext)

      const attributes = mockElement.getAllAttributes()
      expect(attributes['aria-label']).toBe('Valid label')
      expect(attributes['aria-describedby']).toBeUndefined()
      expect(attributes['aria-expanded']).toBeUndefined()
      expect(attributes['aria-hidden']).toBe('false')
    })

    it('should validate ARIA attributes in development mode', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const originalEnv = process.env.NODE_ENV

      try {
        process.env.NODE_ENV = 'development'

        // Test unknown ARIA attribute
        const modifier = aria({
          unknownAttribute: 'value',
        })
        modifier.apply({} as DOMNode, mockContext)

        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Unknown ARIA attribute "unknownAttribute"')
        )
      } finally {
        process.env.NODE_ENV = originalEnv
        consoleSpy.mockRestore()
      }
    })

    it('should validate specific ARIA attribute values in development', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const originalEnv = process.env.NODE_ENV

      try {
        process.env.NODE_ENV = 'development'

        const modifier = aria({
          live: 'invalid' as any,
          haspopup: 'invalid' as any,
          current: 'invalid' as any,
          invalid: 'invalid' as any,
          orientation: 'invalid' as any,
          sort: 'invalid' as any,
          pressed: 'invalid' as any,
        })
        modifier.apply({} as DOMNode, mockContext)

        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Invalid value "invalid" for aria-live')
        )
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Invalid value "invalid" for aria-haspopup')
        )
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Invalid value "invalid" for aria-current')
        )
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Invalid value "invalid" for aria-invalid')
        )
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining(
            'Invalid value "invalid" for aria-orientation'
          )
        )
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Invalid value "invalid" for aria-sort')
        )
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Invalid value "invalid" for aria-pressed')
        )
      } finally {
        process.env.NODE_ENV = originalEnv
        consoleSpy.mockRestore()
      }
    })

    it('should validate numeric values in development', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const originalEnv = process.env.NODE_ENV

      try {
        process.env.NODE_ENV = 'development'

        const modifier = aria({
          level: -1, // Negative number
          posinset: 1.5, // Non-integer
          setsize: -5, // Negative number
        })
        modifier.apply({} as DOMNode, mockContext)

        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Invalid value "-1" for aria-level')
        )
      } finally {
        process.env.NODE_ENV = originalEnv
        consoleSpy.mockRestore()
      }
    })

    it('should provide typo suggestions in development', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const originalEnv = process.env.NODE_ENV

      try {
        process.env.NODE_ENV = 'development'

        const modifier = aria({
          lable: 'test', // typo for 'label'
          descripedby: 'test', // typo for 'describedby'
          expaned: true, // typo for 'expanded'
          hiden: false, // typo for 'hidden'
          disbled: true, // typo for 'disabled'
          requird: true, // typo for 'required'
          selectd: false, // typo for 'selected'
        })
        modifier.apply({} as DOMNode, mockContext)

        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Did you mean "label"?')
        )
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Did you mean "describedby"?')
        )
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Did you mean "expanded"?')
        )
      } finally {
        process.env.NODE_ENV = originalEnv
        consoleSpy.mockRestore()
      }
    })

    it('should not validate in production mode', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const originalEnv = process.env.NODE_ENV

      try {
        process.env.NODE_ENV = 'production'

        const modifier = aria({
          unknownAttribute: 'value',
          live: 'invalid' as any,
        })
        modifier.apply({} as DOMNode, mockContext)

        // Should still set the attributes
        expect(mockElement.getAttribute('aria-unknown-attribute')).toBe('value')
        expect(mockElement.getAttribute('aria-live')).toBe('invalid')
        // But should not warn
        expect(consoleSpy).not.toHaveBeenCalled()
      } finally {
        process.env.NODE_ENV = originalEnv
        consoleSpy.mockRestore()
      }
    })

    it('should handle empty context element gracefully', () => {
      const modifier = aria({ label: 'test' })
      const emptyContext = { element: null }

      expect(() => {
        modifier.apply({} as DOMNode, emptyContext)
      }).not.toThrow()
    })
  })

  describe('Common ARIA Patterns', () => {
    it('should support button accessibility pattern', () => {
      const modifier = aria({
        role: 'button',
        label: 'Close dialog',
        pressed: false,
      })
      modifier.apply({} as DOMNode, mockContext)

      const attributes = mockElement.getAllAttributes()
      expect(attributes['role']).toBe('button')
      expect(attributes['aria-label']).toBe('Close dialog')
      expect(attributes['aria-pressed']).toBe('false')
    })

    it('should support form field accessibility pattern', () => {
      const modifier = aria({
        required: true,
        invalid: false,
        describedby: 'field-error',
        labelledby: 'field-label',
      })
      modifier.apply({} as DOMNode, mockContext)

      const attributes = mockElement.getAllAttributes()
      expect(attributes['aria-required']).toBe('true')
      expect(attributes['aria-invalid']).toBe('false')
      expect(attributes['aria-describedby']).toBe('field-error')
      expect(attributes['aria-labelledby']).toBe('field-label')
    })

    it('should support tab panel accessibility pattern', () => {
      const modifier = aria({
        role: 'tabpanel',
        labelledby: 'tab-1',
        hidden: false,
      })
      modifier.apply({} as DOMNode, mockContext)

      const attributes = mockElement.getAllAttributes()
      expect(attributes['role']).toBe('tabpanel')
      expect(attributes['aria-labelledby']).toBe('tab-1')
      expect(attributes['aria-hidden']).toBe('false')
    })

    it('should support live region accessibility pattern', () => {
      const modifier = aria({
        live: 'polite',
        atomic: true,
        relevant: 'additions text',
      })
      modifier.apply({} as DOMNode, mockContext)

      const attributes = mockElement.getAllAttributes()
      expect(attributes['aria-live']).toBe('polite')
      expect(attributes['aria-atomic']).toBe('true')
      expect(attributes['aria-relevant']).toBe('additions text')
    })

    it('should support disclosure widget accessibility pattern', () => {
      const modifier = aria({
        expanded: true,
        controls: 'content-section',
        haspopup: true,
      })
      modifier.apply({} as DOMNode, mockContext)

      const attributes = mockElement.getAllAttributes()
      expect(attributes['aria-expanded']).toBe('true')
      expect(attributes['aria-controls']).toBe('content-section')
      expect(attributes['aria-haspopup']).toBe('true')
    })

    it('should support listbox accessibility pattern', () => {
      const modifier = aria({
        role: 'option',
        selected: true,
        posinset: 2,
        setsize: 5,
      })
      modifier.apply({} as DOMNode, mockContext)

      const attributes = mockElement.getAllAttributes()
      expect(attributes['role']).toBe('option')
      expect(attributes['aria-selected']).toBe('true')
      expect(attributes['aria-posinset']).toBe('2')
      expect(attributes['aria-setsize']).toBe('5')
    })

    it('should support slider accessibility pattern', () => {
      const modifier = aria({
        role: 'slider',
        valuemin: 0,
        valuemax: 100,
        valuenow: 50,
        valuetext: '50 percent',
        orientation: 'horizontal',
      })
      modifier.apply({} as DOMNode, mockContext)

      const attributes = mockElement.getAllAttributes()
      expect(attributes['role']).toBe('slider')
      expect(attributes['aria-valuemin']).toBe('0')
      expect(attributes['aria-valuemax']).toBe('100')
      expect(attributes['aria-valuenow']).toBe('50')
      expect(attributes['aria-valuetext']).toBe('50 percent')
      expect(attributes['aria-orientation']).toBe('horizontal')
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty ARIA attributes object', () => {
      const modifier = aria({})

      expect(() => {
        modifier.apply({} as DOMNode, mockContext)
      }).not.toThrow()

      expect(mockElement.getAllAttributes()).toEqual({})
    })

    it('should handle special characters in string values', () => {
      const modifier = aria({
        label: 'Navigate to "Home" page',
        describedby: 'help-text-with-special-chars',
        valuetext: 'Temperature: 72°F (22°C)',
        placeholder: 'Enter your email address...',
      })
      modifier.apply({} as DOMNode, mockContext)

      const attributes = mockElement.getAllAttributes()
      expect(attributes['aria-label']).toBe('Navigate to "Home" page')
      expect(attributes['aria-describedby']).toBe(
        'help-text-with-special-chars'
      )
      expect(attributes['aria-valuetext']).toBe('Temperature: 72°F (22°C)')
      expect(attributes['aria-placeholder']).toBe('Enter your email address...')
    })

    it('should handle unicode characters', () => {
      const modifier = aria({
        label: '🚀 Launch application',
        valuetext: '⭐⭐⭐⭐⭐ 5 out of 5 stars',
      })
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.getAttribute('aria-label')).toBe(
        '🚀 Launch application'
      )
      expect(mockElement.getAttribute('aria-valuetext')).toBe(
        '⭐⭐⭐⭐⭐ 5 out of 5 stars'
      )
    })

    it('should handle very long attribute values', () => {
      const longLabel =
        'This is a very long aria-label that might be used to provide detailed information about a complex interactive element that requires extensive explanation for accessibility purposes.'
      const modifier = aria({
        label: longLabel,
        describedby:
          'very-detailed-description-with-multiple-ids id1 id2 id3 id4 id5',
      })
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.getAttribute('aria-label')).toBe(longLabel)
      expect(mockElement.getAttribute('aria-describedby')).toBe(
        'very-detailed-description-with-multiple-ids id1 id2 id3 id4 id5'
      )
    })
  })

  describe('Performance Considerations', () => {
    it('should handle many ARIA attributes efficiently', () => {
      const startTime = performance.now()

      const modifier = aria({
        role: 'application',
        label: 'Complex widget',
        describedby: 'description',
        expanded: true,
        hidden: false,
        live: 'polite',
        atomic: true,
        busy: false,
        controls: 'panel',
        current: 'page',
        disabled: false,
        grabbed: false,
        haspopup: 'menu',
        invalid: false,
        level: 1,
        multiline: true,
        multiselectable: false,
        orientation: 'vertical',
        owns: 'owned-elements',
        placeholder: 'Enter text',
        posinset: 1,
        pressed: false,
        readonly: false,
        relevant: 'all',
        required: true,
        selected: true,
        setsize: 10,
        sort: 'none',
        valuemax: 100,
        valuemin: 0,
        valuenow: 50,
        valuetext: '50%',
      })

      modifier.apply({} as DOMNode, mockContext)

      const duration = performance.now() - startTime

      // Should complete within reasonable time
      expect(duration).toBeLessThan(10)

      // Verify all attributes were set
      const attributes = mockElement.getAllAttributes()
      expect(Object.keys(attributes).length).toBeGreaterThan(25)
    })

    it('should minimize memory allocation', () => {
      const initialMemory = process.memoryUsage?.() || { heapUsed: 0 }

      // Create many ARIA modifiers
      for (let i = 0; i < 1000; i++) {
        const modifier = aria({
          label: `Label ${i}`,
          describedby: `desc-${i}`,
          expanded: i % 2 === 0,
          level: i % 5,
        })
        modifier.apply({} as DOMNode, mockContext)
      }

      const finalMemory = process.memoryUsage?.() || { heapUsed: 0 }
      const memoryGrowth = finalMemory.heapUsed - initialMemory.heapUsed

      // Memory growth should be reasonable (less than 10MB for 1000 operations)
      expect(memoryGrowth).toBeLessThan(10 * 1024 * 1024)
    })
  })

  describe('Type Safety', () => {
    it('should create modifier correctly', () => {
      const modifier = aria({ label: 'test', role: 'button' })
      expect(modifier).toBeInstanceOf(AriaModifier)
      expect(modifier.properties.aria).toEqual({
        label: 'test',
        role: 'button',
      })
    })

    it('should handle valid ARIA attribute combinations', () => {
      // Form field pattern
      expect(() =>
        aria({
          required: true,
          invalid: false,
          describedby: 'error',
        })
      ).not.toThrow()

      // Button pattern
      expect(() =>
        aria({
          role: 'button',
          pressed: true,
          label: 'Toggle',
        })
      ).not.toThrow()

      // Slider pattern
      expect(() =>
        aria({
          role: 'slider',
          valuemin: 0,
          valuemax: 100,
          valuenow: 50,
        })
      ).not.toThrow()
    })
  })
})
