/**
 * Enhanced CSS Properties Tests
 *
 * Comprehensive tests for CSS custom properties modifiers including variables,
 * theme colors, design tokens with full validation and performance testing.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  CustomPropertiesModifier,
  customProperties,
  customProperty,
  cssVariables,
  themeColors,
  designTokens,
} from '../../src/attributes/css-properties'
import type { ModifierContext } from '@tachui/core/modifiers/types'
import type { DOMNode } from '@tachui/core/runtime/types'

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
            // Also set camelCase version for test compatibility
            const camelCase = property.replace(/-([a-z])/g, (match, letter) =>
              letter.toUpperCase()
            )
            target[camelCase] = value
          }
        }
        return target[prop]
      },
    })
  }
}

describe('Enhanced CSS Properties System', () => {
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

  describe('CustomPropertiesModifier Class', () => {
    it('should have correct type and priority', () => {
      const modifier = customProperties({ properties: { test: 'value' } })
      expect(modifier.type).toBe('customProperties')
      expect(modifier.priority).toBe(5)
    })

    it('should apply CSS custom properties correctly', () => {
      const modifier = customProperties({
        properties: {
          'primary-color': '#007AFF',
          'font-size': 16,
          '--custom-spacing': '1rem',
        },
      })
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style['--primary-color']).toBe('#007AFF')
      expect(mockElement.style['--font-size']).toBe('16')
      expect(mockElement.style['--custom-spacing']).toBe('1rem')
    })

    it('should auto-prefix properties with --', () => {
      const modifier = customProperties({
        properties: {
          color: '#FF0000',
          size: 24,
        },
      })
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style['--color']).toBe('#FF0000')
      expect(mockElement.style['--size']).toBe('24')
    })

    it('should preserve existing -- prefix', () => {
      const modifier = customProperties({
        properties: {
          '--already-prefixed': 'value',
          'not-prefixed': 'value2',
        },
      })
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style['--already-prefixed']).toBe('value')
      expect(mockElement.style['--not-prefixed']).toBe('value2')
    })

    it('should handle different value types correctly', () => {
      const modifier = customProperties({
        properties: {
          'string-value': 'text',
          'number-value': 42,
          'zero-value': 0,
          'negative-number': -10,
          'decimal-value': 1.5,
          'color-hex': '#FF0000',
          'color-rgb': 'rgb(255, 0, 0)',
          'color-hsl': 'hsl(0, 100%, 50%)',
          'unit-px': '16px',
          'unit-rem': '1.5rem',
          'unit-em': '2em',
          'unit-percent': '100%',
          'unit-vw': '50vw',
          'unit-vh': '100vh',
        },
      })
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style['--string-value']).toBe('text')
      expect(mockElement.style['--number-value']).toBe('42')
      expect(mockElement.style['--zero-value']).toBe('0')
      expect(mockElement.style['--negative-number']).toBe('-10')
      expect(mockElement.style['--decimal-value']).toBe('1.5')
      expect(mockElement.style['--color-hex']).toBe('#FF0000')
      expect(mockElement.style['--color-rgb']).toBe('rgb(255, 0, 0)')
      expect(mockElement.style['--color-hsl']).toBe('hsl(0, 100%, 50%)')
      expect(mockElement.style['--unit-px']).toBe('16px')
      expect(mockElement.style['--unit-rem']).toBe('1.5rem')
      expect(mockElement.style['--unit-em']).toBe('2em')
      expect(mockElement.style['--unit-percent']).toBe('100%')
      expect(mockElement.style['--unit-vw']).toBe('50vw')
      expect(mockElement.style['--unit-vh']).toBe('100vh')
    })

    it('should handle empty properties object', () => {
      const modifier = customProperties({ properties: {} })

      expect(() => {
        modifier.apply({} as DOMNode, mockContext)
      }).not.toThrow()
    })

    it('should handle scope option correctly', () => {
      // Scope doesn't affect the CSS property setting directly but should be stored
      const localModifier = customProperties({
        properties: { test: 'local' },
        scope: 'local',
      })
      const globalModifier = customProperties({
        properties: { test: 'global' },
        scope: 'global',
      })

      expect(localModifier.properties.scope).toBe('local')
      expect(globalModifier.properties.scope).toBe('global')
    })

    it('should handle empty context element gracefully', () => {
      const modifier = customProperties({ properties: { test: 'value' } })
      const emptyContext = { element: null }

      expect(() => {
        modifier.apply({} as DOMNode, emptyContext)
      }).not.toThrow()
    })
  })

  describe('Convenience Functions', () => {
    it('should create single custom property', () => {
      const modifier = customProperty('primary-color', '#007AFF')
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style['--primary-color']).toBe('#007AFF')
    })

    it('should handle already prefixed property names', () => {
      const modifier = customProperty('--font-size', 16)
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style['--font-size']).toBe('16')
    })

    it('should support scope parameter', () => {
      const modifier = customProperty('theme-background', '#f0f0f0', 'global')
      expect(modifier.properties.scope).toBe('global')
    })

    it('should default scope to local', () => {
      const modifier = customProperty('color', 'red')
      expect(modifier.properties.scope).toBe('local')
    })

    it('should create CSS variables with cssVariables function', () => {
      const modifier = cssVariables({
        primary: '#007AFF',
        secondary: '#34C759',
        spacing: 16,
        'border-radius': '8px',
      })
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style['--primary']).toBe('#007AFF')
      expect(mockElement.style['--secondary']).toBe('#34C759')
      expect(mockElement.style['--spacing']).toBe('16')
      expect(mockElement.style['--border-radius']).toBe('8px')
    })
  })

  describe('Theme Colors', () => {
    it('should create theme color variables with semantic prefixes', () => {
      const modifier = themeColors({
        primary: '#007AFF',
        secondary: '#34C759',
        accent: '#FF9500',
        background: '#FFFFFF',
        surface: '#F2F2F7',
        text: '#000000',
        textSecondary: '#6D6D80',
        border: '#D1D1D6',
        error: '#FF3B30',
        warning: '#FF9500',
        success: '#34C759',
        info: '#007AFF',
      })
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style['--theme-color-primary']).toBe('#007AFF')
      expect(mockElement.style['--theme-color-secondary']).toBe('#34C759')
      expect(mockElement.style['--theme-color-accent']).toBe('#FF9500')
      expect(mockElement.style['--theme-color-background']).toBe('#FFFFFF')
      expect(mockElement.style['--theme-color-surface']).toBe('#F2F2F7')
      expect(mockElement.style['--theme-color-text']).toBe('#000000')
      expect(mockElement.style['--theme-color-text-secondary']).toBe('#6D6D80')
      expect(mockElement.style['--theme-color-border']).toBe('#D1D1D6')
      expect(mockElement.style['--theme-color-error']).toBe('#FF3B30')
      expect(mockElement.style['--theme-color-warning']).toBe('#FF9500')
      expect(mockElement.style['--theme-color-success']).toBe('#34C759')
      expect(mockElement.style['--theme-color-info']).toBe('#007AFF')
    })

    it('should handle camelCase to kebab-case conversion', () => {
      const modifier = themeColors({
        primaryLight: '#4A90E2',
        primaryDark: '#2171B5',
        backgroundSecondary: '#F8F9FA',
        textAccentColor: '#6366F1',
      })
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style['--theme-color-primary-light']).toBe('#4A90E2')
      expect(mockElement.style['--theme-color-primary-dark']).toBe('#2171B5')
      expect(mockElement.style['--theme-color-background-secondary']).toBe(
        '#F8F9FA'
      )
      expect(mockElement.style['--theme-color-text-accent-color']).toBe(
        '#6366F1'
      )
    })

    it('should handle custom theme colors', () => {
      const modifier = themeColors({
        brandPrimary: '#6366F1',
        brandSecondary: '#EC4899',
        neutralLight: '#F8FAFC',
        neutralDark: '#0F172A',
      })
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style['--theme-color-brand-primary']).toBe('#6366F1')
      expect(mockElement.style['--theme-color-brand-secondary']).toBe('#EC4899')
      expect(mockElement.style['--theme-color-neutral-light']).toBe('#F8FAFC')
      expect(mockElement.style['--theme-color-neutral-dark']).toBe('#0F172A')
    })

    it('should skip undefined values', () => {
      const modifier = themeColors({
        primary: '#007AFF',
        secondary: undefined,
        accent: '#FF9500',
      })
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style['--theme-color-primary']).toBe('#007AFF')
      expect(mockElement.style['--theme-color-secondary']).toBeUndefined()
      expect(mockElement.style['--theme-color-accent']).toBe('#FF9500')
    })

    it('should handle empty theme colors', () => {
      const modifier = themeColors({})

      expect(() => {
        modifier.apply({} as DOMNode, mockContext)
      }).not.toThrow()
    })
  })

  describe('Design Tokens', () => {
    it('should create spacing tokens', () => {
      const modifier = designTokens({
        'spacing-xs': 4,
        'spacing-sm': 8,
        'spacing-md': 16,
        'spacing-lg': 24,
        'spacing-xl': 32,
        'spacing-2xl': 48,
      })
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style['--token-spacing-xs']).toBe('4')
      expect(mockElement.style['--token-spacing-sm']).toBe('8')
      expect(mockElement.style['--token-spacing-md']).toBe('16')
      expect(mockElement.style['--token-spacing-lg']).toBe('24')
      expect(mockElement.style['--token-spacing-xl']).toBe('32')
      expect(mockElement.style['--token-spacing-2xl']).toBe('48')
    })

    it('should create typography tokens', () => {
      const modifier = designTokens({
        'font-size-xs': 12,
        'font-size-sm': 14,
        'font-size-base': 16,
        'font-size-lg': 18,
        'font-size-xl': 20,
        'font-size-2xl': 24,
        'font-weight-light': 300,
        'font-weight-normal': 400,
        'font-weight-medium': 500,
        'font-weight-semibold': 600,
        'font-weight-bold': 700,
        'line-height-tight': 1.2,
        'line-height-normal': 1.5,
        'line-height-relaxed': 1.75,
        'line-height-loose': 2,
      })
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style['--token-font-size-xs']).toBe('12')
      expect(mockElement.style['--token-font-size-sm']).toBe('14')
      expect(mockElement.style['--token-font-size-base']).toBe('16')
      expect(mockElement.style['--token-font-weight-normal']).toBe('400')
      expect(mockElement.style['--token-font-weight-bold']).toBe('700')
      expect(mockElement.style['--token-line-height-tight']).toBe('1.2')
      expect(mockElement.style['--token-line-height-normal']).toBe('1.5')
    })

    it('should create border and effects tokens', () => {
      const modifier = designTokens({
        'radius-none': 0,
        'radius-sm': 4,
        'radius-md': 8,
        'radius-lg': 12,
        'radius-full': '50%',
        'shadow-sm': '0 1px 2px rgba(0, 0, 0, 0.05)',
        'shadow-md': '0 4px 6px rgba(0, 0, 0, 0.1)',
        'shadow-lg': '0 10px 15px rgba(0, 0, 0, 0.1)',
        'shadow-xl': '0 20px 25px rgba(0, 0, 0, 0.1)',
      })
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style['--token-radius-none']).toBe('0')
      expect(mockElement.style['--token-radius-sm']).toBe('4')
      expect(mockElement.style['--token-radius-full']).toBe('50%')
      expect(mockElement.style['--token-shadow-sm']).toBe(
        '0 1px 2px rgba(0, 0, 0, 0.05)'
      )
      expect(mockElement.style['--token-shadow-lg']).toBe(
        '0 10px 15px rgba(0, 0, 0, 0.1)'
      )
    })

    it('should create animation tokens', () => {
      const modifier = designTokens({
        'duration-fast': '150ms',
        'duration-normal': '300ms',
        'duration-slow': '500ms',
      })
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style['--token-duration-fast']).toBe('150ms')
      expect(mockElement.style['--token-duration-normal']).toBe('300ms')
      expect(mockElement.style['--token-duration-slow']).toBe('500ms')
    })

    it('should create custom design tokens', () => {
      const modifier = designTokens({
        'container-max-width': '1200px',
        'sidebar-width': '280px',
        'header-height': '64px',
        'z-index-modal': 1000,
        'z-index-tooltip': 1100,
        'breakpoint-sm': '640px',
        'breakpoint-md': '768px',
        'breakpoint-lg': '1024px',
      })
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style['--token-container-max-width']).toBe('1200px')
      expect(mockElement.style['--token-sidebar-width']).toBe('280px')
      expect(mockElement.style['--token-header-height']).toBe('64px')
      expect(mockElement.style['--token-z-index-modal']).toBe('1000')
      expect(mockElement.style['--token-z-index-tooltip']).toBe('1100')
      expect(mockElement.style['--token-breakpoint-sm']).toBe('640px')
    })

    it('should skip undefined values', () => {
      const modifier = designTokens({
        'spacing-sm': 8,
        'spacing-md': undefined,
        'spacing-lg': 24,
      })
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style['--token-spacing-sm']).toBe('8')
      expect(mockElement.style['--token-spacing-md']).toBeUndefined()
      expect(mockElement.style['--token-spacing-lg']).toBe('24')
    })

    it('should handle empty design tokens', () => {
      const modifier = designTokens({})

      expect(() => {
        modifier.apply({} as DOMNode, mockContext)
      }).not.toThrow()
    })
  })

  describe('Complex CSS Values', () => {
    it('should handle complex CSS function values', () => {
      const modifier = cssVariables({
        gradient: 'linear-gradient(45deg, #FF6B6B, #4ECDC4)',
        'calc-value': 'calc(100% - 32px)',
        'clamp-value': 'clamp(1rem, 2.5vw, 2rem)',
        'min-max': 'max(16px, min(24px, 5vw))',
        'multiple-shadows':
          '0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)',
        transform: 'translateX(50%) rotate(45deg) scale(1.2)',
        filter: 'blur(5px) brightness(1.1) contrast(1.2)',
      })
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style['--gradient']).toBe(
        'linear-gradient(45deg, #FF6B6B, #4ECDC4)'
      )
      expect(mockElement.style['--calc-value']).toBe('calc(100% - 32px)')
      expect(mockElement.style['--clamp-value']).toBe(
        'clamp(1rem, 2.5vw, 2rem)'
      )
      expect(mockElement.style['--min-max']).toBe('max(16px, min(24px, 5vw))')
      expect(mockElement.style['--multiple-shadows']).toBe(
        '0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)'
      )
      expect(mockElement.style['--transform']).toBe(
        'translateX(50%) rotate(45deg) scale(1.2)'
      )
      expect(mockElement.style['--filter']).toBe(
        'blur(5px) brightness(1.1) contrast(1.2)'
      )
    })

    it('should handle CSS custom property references', () => {
      const modifier = cssVariables({
        'base-color': '#007AFF',
        'light-color': 'color-mix(in srgb, var(--base-color) 50%, white)',
        'dark-color': 'color-mix(in srgb, var(--base-color) 80%, black)',
        'dynamic-size': 'calc(var(--base-size) * 1.5)',
      })
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style['--base-color']).toBe('#007AFF')
      expect(mockElement.style['--light-color']).toBe(
        'color-mix(in srgb, var(--base-color) 50%, white)'
      )
      expect(mockElement.style['--dark-color']).toBe(
        'color-mix(in srgb, var(--base-color) 80%, black)'
      )
      expect(mockElement.style['--dynamic-size']).toBe(
        'calc(var(--base-size) * 1.5)'
      )
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle special characters in property names', () => {
      const modifier = cssVariables({
        'property-with-hyphens': 'value',
        property_with_underscores: 'value',
        propertyWithNumbers123: 'value',
        PROPERTY_WITH_CAPS: 'value',
      })
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style['--property-with-hyphens']).toBe('value')
      expect(mockElement.style['--property_with_underscores']).toBe('value')
      expect(mockElement.style['--property-with-numbers123']).toBe('value') // Numbers cause kebab-case conversion
      expect(mockElement.style['--PROPERTY_WITH_CAPS']).toBe('value')
    })

    it('should handle very long property values', () => {
      const longValue =
        'This is a very long CSS value that might be used for things like data URIs or complex CSS functions with many parameters and might exceed typical string length expectations.'
      const modifier = cssVariables({
        'long-value': longValue,
      })
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style['--long-value']).toBe(longValue)
    })

    it('should handle unicode characters in values', () => {
      const modifier = cssVariables({
        'unicode-content': '🎉✨🚀💯⭐',
        'unicode-font':
          '"Helvetica Neue", "Apple Color Emoji", "Segoe UI Emoji"',
      })
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style['--unicode-content']).toBe('🎉✨🚀💯⭐')
      expect(mockElement.style['--unicode-font']).toBe(
        '"Helvetica Neue", "Apple Color Emoji", "Segoe UI Emoji"'
      )
    })

    it('should handle JSON-like values', () => {
      const modifier = cssVariables({
        'config-data': '{"theme": "dark", "size": "large"}',
        'array-data': '[1, 2, 3, 4, 5]',
      })
      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style['--config-data']).toBe(
        '{"theme": "dark", "size": "large"}'
      )
      expect(mockElement.style['--array-data']).toBe('[1, 2, 3, 4, 5]')
    })
  })

  describe('Performance Considerations', () => {
    it('should handle many custom properties efficiently', () => {
      const startTime = performance.now()

      // Create modifier with many properties
      const manyProperties: Record<string, any> = {}
      for (let i = 0; i < 100; i++) {
        manyProperties[`property-${i}`] = `value-${i}`
        manyProperties[`number-${i}`] = i
        manyProperties[`color-${i}`] = `hsl(${i * 3.6}, 50%, 50%)`
      }

      const modifier = cssVariables(manyProperties)
      modifier.apply({} as DOMNode, mockContext)

      const duration = performance.now() - startTime

      // Should complete within reasonable time
      expect(duration).toBeLessThan(20)

      // Verify all properties were set
      expect(mockElement.style['--property-50']).toBe('value-50')
      expect(mockElement.style['--number-75']).toBe('75')
      expect(mockElement.style['--color-25']).toBe('hsl(90, 50%, 50%)')
    })

    it('should minimize memory allocation', () => {
      const initialMemory = process.memoryUsage?.() || { heapUsed: 0 }

      // Create many custom property modifiers
      for (let i = 0; i < 1000; i++) {
        const modifier = customProperty(`dynamic-prop-${i}`, `value-${i}`)
        modifier.apply({} as DOMNode, mockContext)
      }

      const finalMemory = process.memoryUsage?.() || { heapUsed: 0 }
      const memoryGrowth = finalMemory.heapUsed - initialMemory.heapUsed

      // Memory growth should be reasonable (less than 15MB for 1000 operations)
      expect(memoryGrowth).toBeLessThan(15 * 1024 * 1024)
    })
  })

  describe('Type Safety and Modifiers', () => {
    it('should create modifiers correctly', () => {
      const customPropsMod = customProperties({
        properties: { test: 'value' },
        scope: 'local',
      })
      expect(customPropsMod).toBeInstanceOf(CustomPropertiesModifier)

      const singlePropMod = customProperty('test', 'value')
      expect(singlePropMod).toBeInstanceOf(CustomPropertiesModifier)

      const cssVarsMod = cssVariables({ test: 'value' })
      expect(cssVarsMod).toBeInstanceOf(CustomPropertiesModifier)

      const themeMod = themeColors({ primary: '#000' })
      expect(themeMod).toBeInstanceOf(CustomPropertiesModifier)

      const tokensMod = designTokens({ 'spacing-md': 16 })
      expect(tokensMod).toBeInstanceOf(CustomPropertiesModifier)
    })

    it('should handle valid property combinations', () => {
      // Full theme setup
      expect(() =>
        customProperties({
          properties: {
            primary: '#007AFF',
            secondary: '#34C759',
            'spacing-unit': 8,
            'border-radius': 4,
          },
          scope: 'global',
        })
      ).not.toThrow()

      // Design system tokens
      expect(() =>
        designTokens({
          'font-size-base': 16,
          'line-height-normal': 1.5,
          'spacing-md': 16,
          'color-primary': '#007AFF',
        })
      ).not.toThrow()
    })
  })
})
