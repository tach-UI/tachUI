/**
 * Responsive Modifier Reactivity Tests
 *
 * Tests to verify that responsive modifiers properly handle reactive values
 * including ColorAssets and other reactive signals.
 */

import { describe, test, expect, beforeEach, vi } from 'vitest'
import { createSignal, createComputed, createRoot } from '@tachui/core'
import { setTheme } from '@tachui/core'
import { ColorAsset } from '@tachui/core'
import { createResponsiveModifier } from '../../../src/modifiers/responsive'
// import type { DOMNode } from '@tachui/core'

// Mock window and DOM APIs
const mockWindow = {
  innerWidth: 1024,
  innerHeight: 768,
  matchMedia: vi.fn(() => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
}

Object.defineProperty(global, 'window', {
  writable: true,
  value: mockWindow,
})

// Mock document and CSS injection
const mockStyleSheet = {
  cssRules: [] as any[],
  insertRule: vi.fn((rule: string, index?: number) => {
    const idx = index ?? mockStyleSheet.cssRules.length
    mockStyleSheet.cssRules.splice(idx, 0, rule)
    return idx
  }),
  deleteRule: vi.fn((index: number) => {
    mockStyleSheet.cssRules.splice(index, 1)
  }),
}

Object.defineProperty(global, 'document', {
  writable: true,
  value: {
    createElement: (tag: string) => {
      const element = {
        tagName: tag.toUpperCase(),
        style: {},
        classList: {
          add: vi.fn(),
          remove: vi.fn(),
          contains: vi.fn(() => false),
        },
        setAttribute: vi.fn(),
        getAttribute: vi.fn(() => null),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        sheet: tag === 'style' ? mockStyleSheet : undefined,
      } as any
      return element
    },
    head: {
      appendChild: vi.fn(),
    },
  },
})

describe('Responsive Modifier Reactivity', () => {
  beforeEach(() => {
    // Reset theme
    setTheme('light')

    // Clear mock CSS
    mockStyleSheet.cssRules.length = 0
    vi.clearAllMocks()
  })

  describe('ColorAsset Reactivity', () => {
    test('should reactively update responsive ColorAsset values when theme changes', () => {
      createRoot(() => {
        // Create a theme-reactive ColorAsset
        const themeBackground = ColorAsset.init({
          default: '#ffffff',
          light: '#ffffff',
          dark: '#000000',
          name: 'themeBackground',
        })

        // Create responsive modifier with ColorAsset at different breakpoints
        const responsiveModifier = createResponsiveModifier({
          backgroundColor: {
            base: themeBackground as any,
            md: themeBackground as any,
            lg: themeBackground as any,
          },
        })

        // Check that the modifier detected reactive values
        expect(
          responsiveModifier['hasReactiveValues'](responsiveModifier.config)
        ).toBe(true)

        // Change to dark theme and verify ColorAsset reacts
        setTheme('dark')
        expect(themeBackground.resolve()).toBe('#000000')

        setTheme('light')
        expect(themeBackground.resolve()).toBe('#ffffff')
      })
    })

    test('should handle mixed reactive and static values in responsive config', () => {
      createRoot(() => {
        const [dynamicPadding, setDynamicPadding] = createSignal(16)

        const themeColor = ColorAsset.init({
          default: '#333',
          light: '#333',
          dark: '#ccc',
          name: 'dynamicColor',
        })

        // Mix of static, signal, and Asset values across breakpoints
        const responsiveModifier = createResponsiveModifier({
          padding: {
            base: 8, // static
            md: dynamicPadding as any, // signal
            lg: 24, // static
          },
          color: {
            base: themeColor as any, // Asset
            md: '#ff0000', // static
            lg: themeColor as any, // Asset
          },
        })

        // Should detect reactive values
        expect(
          responsiveModifier['hasReactiveValues'](responsiveModifier.config)
        ).toBe(true)

        // Test signal change
        setDynamicPadding(32)
        expect(dynamicPadding()).toBe(32)

        // Test theme change
        setTheme('dark')
        expect(themeColor.resolve()).toBe('#ccc')
      })
    })
  })

  describe('Signal Reactivity', () => {
    test('should detect and react to signal changes in responsive values', () => {
      createRoot(() => {
        const [fontSize, setFontSize] = createSignal(14)
        const [padding, setPadding] = createSignal(8)

        const responsiveModifier = createResponsiveModifier({
          fontSize: {
            base: fontSize as any,
            md: 16,
            lg: 18,
          },
          padding: {
            base: padding as any,
            lg: 16,
          },
        })

        // Should detect reactive values
        expect(
          responsiveModifier['hasReactiveValues'](responsiveModifier.config)
        ).toBe(true)

        // Test signal changes
        setFontSize(16)
        expect(fontSize()).toBe(16)

        setPadding(12)
        expect(padding()).toBe(12)
      })
    })

    test('should handle computed signals in responsive values', () => {
      createRoot(() => {
        const [screenSize, setScreenSize] = createSignal<'mobile' | 'desktop'>(
          'mobile'
        )

        const responsiveFontSize = createComputed(() =>
          screenSize() === 'desktop' ? 18 : 14
        )

        const responsivePadding = createComputed(() =>
          screenSize() === 'desktop' ? 24 : 12
        )

        const responsiveModifier = createResponsiveModifier({
          fontSize: {
            base: responsiveFontSize as any,
            lg: 20,
          },
          padding: {
            base: responsivePadding as any,
            md: 16,
          },
        })

        // Should detect reactive values
        expect(
          responsiveModifier['hasReactiveValues'](responsiveModifier.config)
        ).toBe(true)

        // Test computed signal changes
        expect(responsiveFontSize()).toBe(14)
        expect(responsivePadding()).toBe(12)

        setScreenSize('desktop')
        expect(responsiveFontSize()).toBe(18)
        expect(responsivePadding()).toBe(24)
      })
    })
  })

  describe('Reactive Value Detection', () => {
    test('should correctly identify responsive values with signals', () => {
      const [testSignal] = createSignal('#ff0000')

      const responsiveModifier = createResponsiveModifier({
        backgroundColor: {
          base: testSignal as any,
          md: '#00ff00',
        },
      })

      expect(
        responsiveModifier['hasReactiveValues'](responsiveModifier.config)
      ).toBe(true)
    })

    test('should correctly identify responsive values with Assets', () => {
      const colorAsset = ColorAsset.init({
        default: '#ffffff',
        light: '#ffffff',
        dark: '#000000',
        name: 'testAsset',
      })

      const responsiveModifier = createResponsiveModifier({
        color: {
          base: colorAsset as any,
          md: '#333333',
        },
      })

      expect(
        responsiveModifier['hasReactiveValues'](responsiveModifier.config)
      ).toBe(true)
    })

    test('should return false for purely static responsive values', () => {
      const responsiveModifier = createResponsiveModifier({
        fontSize: {
          base: 14,
          md: 16,
          lg: 18,
        },
        color: {
          base: '#333',
          md: '#666',
          lg: '#999',
        },
      })

      expect(
        responsiveModifier['hasReactiveValues'](responsiveModifier.config)
      ).toBe(false)
    })
  })

  describe('CSS Regeneration', () => {
    test('should regenerate CSS when reactive values change', () => {
      createRoot(() => {
        const [backgroundColor, setBackgroundColor] = createSignal('#ffffff')

        const responsiveModifier = createResponsiveModifier({
          backgroundColor: {
            base: backgroundColor as any,
            md: '#f0f0f0',
            lg: '#e0e0e0',
          },
        })

        // Should detect reactive values
        expect(
          responsiveModifier['hasReactiveValues'](responsiveModifier.config)
        ).toBe(true)

        // Test reactive value changes
        expect(backgroundColor()).toBe('#ffffff')
        setBackgroundColor('#ff0000')
        expect(backgroundColor()).toBe('#ff0000')
      })
    })
  })
})
