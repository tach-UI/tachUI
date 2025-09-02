/**
 * Tests for computed signal compatibility with modifier system
 */

import { beforeEach, describe, expect, it } from 'vitest'
import { Text } from '@tachui/primitives'
import { createComputed, createSignal } from '../../src/reactive'

// Mock DOM for testing
beforeEach(() => {
  document.body.innerHTML = ''
})

describe('Computed Signal Modifier Compatibility', () => {
  describe('Basic Modifier Support', () => {
    it('should accept computed signals in foregroundColor modifier', () => {
      const [isDark] = createSignal(false)
      const textColor = createComputed(() => (isDark() ? '#ffffff' : '#000000'))

      expect(() => {
        Text('Hello').modifier.foregroundColor(textColor).build()
      }).not.toThrow()
    })

    it('should accept computed signals in backgroundColor modifier', () => {
      const [isDark] = createSignal(false)
      const bgColor = createComputed(() => (isDark() ? '#333333' : '#ffffff'))

      expect(() => {
        Text('Hello').modifier.backgroundColor(bgColor).build()
      }).not.toThrow()
    })

    it('should accept computed signals in fontSize modifier', () => {
      const [size] = createSignal<'small' | 'large'>('small')
      const fontSize = createComputed(() => (size() === 'large' ? 20 : 14))

      expect(() => {
        Text('Hello').modifier.fontSize(fontSize).build()
      }).not.toThrow()
    })

    it('should accept computed signals in opacity modifier', () => {
      const [visible] = createSignal(true)
      const opacity = createComputed(() => (visible() ? 1.0 : 0.5))

      expect(() => {
        Text('Hello').modifier.opacity(opacity).build()
      }).not.toThrow()
    })

    it('should accept computed signals in cornerRadius modifier', () => {
      const [rounded] = createSignal(true)
      const radius = createComputed(() => (rounded() ? 12 : 0))

      expect(() => {
        Text('Hello').modifier.cornerRadius(radius).build()
      }).not.toThrow()
    })
  })

  describe('Border Modifier Support', () => {
    it('should accept computed signals in border width', () => {
      const [thick] = createSignal(false)
      const borderWidth = createComputed(() => (thick() ? 3 : 1))

      expect(() => {
        Text('Hello').modifier.border(borderWidth, '#000000').build()
      }).not.toThrow()
    })

    it('should accept computed signals in border color', () => {
      const [isDark] = createSignal(false)
      const borderColor = createComputed(() =>
        isDark() ? '#ffffff' : '#000000'
      )

      expect(() => {
        Text('Hello').modifier.border(1, borderColor).build()
      }).not.toThrow()
    })

    it('should accept computed signals in directional borders', () => {
      const [active] = createSignal(false)
      const width = createComputed(() => (active() ? 2 : 1))
      const color = createComputed(() => (active() ? '#007AFF' : '#e0e0e0'))

      expect(() => {
        Text('Hello')
          .modifier.borderTop(width, color)
          .borderRight(width, color)
          .borderBottom(width, color)
          .borderLeft(width, color)
          .build()
      }).not.toThrow()
    })
  })

  describe('Complex Scenarios', () => {
    it('should handle multiple computed signals in single component', () => {
      const [theme] = createSignal<'light' | 'dark'>('light')
      const [size] = createSignal<'small' | 'large'>('small')

      const textColor = createComputed(() =>
        theme() === 'dark' ? '#ffffff' : '#000000'
      )
      const bgColor = createComputed(() =>
        theme() === 'dark' ? '#333333' : '#ffffff'
      )
      const fontSize = createComputed(() => (size() === 'large' ? 20 : 14))
      const borderWidth = createComputed(() => (size() === 'large' ? 2 : 1))
      const opacity = createComputed(() => (theme() === 'dark' ? 0.9 : 1.0))

      expect(() => {
        Text('Complex Component')
          .modifier.foregroundColor(textColor)
          .backgroundColor(bgColor)
          .fontSize(fontSize)
          .border(borderWidth, textColor)
          .opacity(opacity)
          .padding(16)
          .cornerRadius(8)
          .build()
      }).not.toThrow()
    })

    it('should handle computed signals derived from other computed signals', () => {
      const [baseSize] = createSignal(16)
      const mediumSize = createComputed(() => baseSize() * 1.2)
      const largeSize = createComputed(() => mediumSize() * 1.5)

      expect(() => {
        Text('Nested Computed').modifier.fontSize(largeSize).build()
      }).not.toThrow()
    })

    it('should maintain type safety with computed signals', () => {
      const [count] = createSignal(0)

      // Should accept computed number for fontSize
      const fontSize = createComputed(() => count() + 14)
      expect(() => {
        Text('Counter').modifier.fontSize(fontSize).build()
      }).not.toThrow()

      // Should accept computed string for fontSize
      const fontSizeString = createComputed(() => `${count() + 14}px`)
      expect(() => {
        Text('Counter').modifier.fontSize(fontSizeString).build()
      }).not.toThrow()
    })
  })

  describe('Signal Type Compatibility', () => {
    it('should accept both regular signals and computed signals', () => {
      const [regularColor, _setRegularColor] = createSignal('#000000')
      const [isDark] = createSignal(false)
      const computedColor = createComputed(() =>
        isDark() ? '#ffffff' : '#333333'
      )

      // Both should work in the same modifier
      expect(() => {
        Text('Mixed Signals')
          .modifier.foregroundColor(regularColor)
          .backgroundColor(computedColor)
          .build()
      }).not.toThrow()
    })

    it('should work with mixed static and computed signal values', () => {
      const [dynamic] = createSignal(true)
      const dynamicColor = createComputed(() =>
        dynamic() ? '#007AFF' : '#34C759'
      )

      expect(() => {
        Text('Mixed Values')
          .modifier.foregroundColor(dynamicColor) // Computed signal
          .backgroundColor('#ffffff') // Static value
          .fontSize(16) // Static value
          .padding(12) // Static value
          .build()
      }).not.toThrow()
    })
  })

  describe('Component Creation Verification', () => {
    it('should create valid component instances with computed signals', () => {
      const [theme] = createSignal<'light' | 'dark'>('light')
      const textColor = createComputed(() =>
        theme() === 'dark' ? '#ffffff' : '#000000'
      )

      const component = Text('Test Component')
        .modifier.foregroundColor(textColor)
        .build()

      expect(component).toBeDefined()
      expect(component.type).toBe('component')
      expect(component.id).toBeDefined()
      expect(Array.isArray(component.modifiers)).toBe(true)
      expect(component.modifiers.length).toBeGreaterThan(0)
    })
  })
})
