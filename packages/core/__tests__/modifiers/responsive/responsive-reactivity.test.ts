/**
 * Responsive Modifier Reactivity Tests
 * 
 * Tests to verify that responsive modifiers properly handle reactive values
 * including ColorAssets and other reactive signals.
 */

import { describe, test, expect, beforeEach, vi } from 'vitest'
import { createSignal, createComputed, createRoot } from '../../../src/reactive'
import { setTheme } from '../../../src/reactive/theme'
import { ColorAsset } from '../../../src/assets/ColorAsset'
import { createResponsiveModifier } from '../../../src/modifiers/responsive'
import type { DOMNode } from '../../../src/runtime/types'

// Mock window and DOM APIs
const mockWindow = {
  innerWidth: 1024,
  innerHeight: 768,
  matchMedia: vi.fn(() => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  })),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn()
}

Object.defineProperty(global, 'window', {
  writable: true,
  value: mockWindow
})

// Mock document and CSS injection
const mockStyleSheet = {
  cssRules: [],
  insertRule: vi.fn((rule: string, index: number) => {
    mockStyleSheet.cssRules.splice(index, 0, rule)
    return index
  }),
  deleteRule: vi.fn((index: number) => {
    mockStyleSheet.cssRules.splice(index, 1)
  })
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
          contains: vi.fn(() => false)
        },
        setAttribute: vi.fn(),
        getAttribute: vi.fn(() => null),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      }
      if (tag === 'style') {
        element.sheet = mockStyleSheet
      }
      return element
    },
    head: {
      appendChild: vi.fn()
    }
  }
})

describe('Responsive Modifier Reactivity', () => {
  let mockElement: HTMLElement

  beforeEach(() => {
    // Create mock element
    mockElement = {
      tagName: 'DIV',
      style: {},
      classList: {
        add: vi.fn(),
        remove: vi.fn(),
        contains: vi.fn(() => false)
      },
      setAttribute: vi.fn(),
      getAttribute: vi.fn(() => null),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    } as any

    // Reset theme
    setTheme('light')

    // Clear mock CSS
    mockStyleSheet.cssRules.length = 0
    vi.clearAllMocks()
  })

  describe('ColorAsset Reactivity', () => {
    test.skip('should reactively update responsive ColorAsset values when theme changes', async () => {
      return new Promise<void>((resolve, reject) => {
        createRoot(() => {
          try {
            // Create a theme-reactive ColorAsset
            const themeBackground = ColorAsset.init({
              default: '#ffffff',
              light: '#ffffff', 
              dark: '#000000',
              name: 'themeBackground'
            })

            // Create responsive modifier with ColorAsset at different breakpoints
            const responsiveModifier = createResponsiveModifier({
              backgroundColor: {
                base: themeBackground,
                md: themeBackground,
                lg: themeBackground
              }
            })

            // Apply modifier to element
            const node: DOMNode = { element: mockElement }
            const context = {
              element: mockElement,
              componentId: 'test-responsive-theme'
            }

            responsiveModifier.apply(node, context)

            // Initial state should be light theme
            setTimeout(() => {
              // Should have generated CSS with light theme colors
              expect(mockStyleSheet.insertRule).toHaveBeenCalled()
              
              // Check that the modifier detected reactive values
              expect(responsiveModifier['hasReactiveValues'](responsiveModifier.config)).toBe(true)

              // Change to dark theme
              setTheme('dark')

              // Should regenerate CSS with dark theme colors
              setTimeout(() => {
                // Should have been called again for the theme change
                expect(mockStyleSheet.insertRule).toHaveBeenCalledTimes(2)
                resolve()
              }, 10)
            }, 10)
          } catch (error) {
            reject(error)
          }
        })
      })
    })

    test.skip('should handle mixed reactive and static values in responsive config', async () => {
      return new Promise<void>((resolve, reject) => {
        createRoot(() => {
          try {
            const [dynamicPadding, setDynamicPadding] = createSignal(16)
            
            const themeColor = ColorAsset.init({
              default: '#333',
              light: '#333',
              dark: '#ccc',
              name: 'dynamicColor'
            })

            // Mix of static, signal, and Asset values across breakpoints
            const responsiveModifier = createResponsiveModifier({
              padding: {
                base: 8, // static
                md: dynamicPadding, // signal
                lg: 24 // static
              },
              color: {
                base: themeColor, // Asset
                md: '#ff0000', // static
                lg: themeColor // Asset
              }
            })

            const node: DOMNode = { element: mockElement }
            const context = {
              element: mockElement,
              componentId: 'test-mixed-reactive'
            }

            responsiveModifier.apply(node, context)

            setTimeout(() => {
              // Should detect reactive values
              expect(responsiveModifier['hasReactiveValues'](responsiveModifier.config)).toBe(true)

              // Test signal change
              setDynamicPadding(32)

              setTimeout(() => {
                // Should have regenerated CSS
                expect(mockStyleSheet.insertRule).toHaveBeenCalled()

                // Test theme change
                setTheme('dark')

                setTimeout(() => {
                  // Should have regenerated CSS again for theme change
                  expect(mockStyleSheet.insertRule).toHaveBeenCalled()
                  resolve()
                }, 10)
              }, 10)
            }, 10)
          } catch (error) {
            reject(error)
          }
        })
      })
    })
  })

  describe('Signal Reactivity', () => {
    test.skip('should detect and react to signal changes in responsive values', async () => {
      return new Promise<void>((resolve, reject) => {
        createRoot(() => {
          try {
            const [fontSize, setFontSize] = createSignal(14)
            const [padding, setPadding] = createSignal(8)

            const responsiveModifier = createResponsiveModifier({
              fontSize: {
                base: fontSize,
                md: 16,
                lg: 18
              },
              padding: {
                base: padding,
                lg: 16
              }
            })

            const node: DOMNode = { element: mockElement }
            const context = {
              element: mockElement,
              componentId: 'test-signal-reactive'
            }

            responsiveModifier.apply(node, context)

            setTimeout(() => {
              const initialCalls = mockStyleSheet.insertRule.mock.calls.length

              // Change signal values
              setFontSize(16)
              setPadding(12)

              setTimeout(() => {
                // Should have regenerated CSS for signal changes
                expect(mockStyleSheet.insertRule.mock.calls.length).toBeGreaterThan(initialCalls)
                resolve()
              }, 10)
            }, 10)
          } catch (error) {
            reject(error)
          }
        })
      })
    })

    test.skip('should handle computed signals in responsive values', async () => {
      return new Promise<void>((resolve, reject) => {
        createRoot(() => {
          try {
            const [screenSize, setScreenSize] = createSignal<'mobile' | 'desktop'>('mobile')
            
            const responsiveFontSize = createComputed(() => 
              screenSize() === 'desktop' ? 18 : 14
            )
            
            const responsivePadding = createComputed(() =>
              screenSize() === 'desktop' ? 24 : 12
            )

            const responsiveModifier = createResponsiveModifier({
              fontSize: {
                base: responsiveFontSize,
                lg: 20
              },
              padding: {
                base: responsivePadding,
                md: 16
              }
            })

            const node: DOMNode = { element: mockElement }
            const context = {
              element: mockElement,
              componentId: 'test-computed-reactive'
            }

            responsiveModifier.apply(node, context)

            setTimeout(() => {
              // Should detect reactive values
              expect(responsiveModifier['hasReactiveValues'](responsiveModifier.config)).toBe(true)

              const initialCalls = mockStyleSheet.insertRule.mock.calls.length

              // Change the underlying signal
              setScreenSize('desktop')

              setTimeout(() => {
                // Should have regenerated CSS for computed signal changes
                expect(mockStyleSheet.insertRule.mock.calls.length).toBeGreaterThan(initialCalls)
                resolve()
              }, 10)
            }, 10)
          } catch (error) {
            reject(error)
          }
        })
      })
    })
  })

  describe('Reactive Value Detection', () => {
    test('should correctly identify responsive values with signals', () => {
      const [testSignal] = createSignal('#ff0000')
      
      const responsiveModifier = createResponsiveModifier({
        backgroundColor: {
          base: testSignal,
          md: '#00ff00'
        }
      })

      expect(responsiveModifier['hasReactiveValues'](responsiveModifier.config)).toBe(true)
    })

    test('should correctly identify responsive values with Assets', () => {
      const colorAsset = ColorAsset.init({
        default: '#ffffff',
        light: '#ffffff',
        dark: '#000000',
        name: 'testAsset'
      })
      
      const responsiveModifier = createResponsiveModifier({
        color: {
          base: colorAsset,
          md: '#333333'
        }
      })

      expect(responsiveModifier['hasReactiveValues'](responsiveModifier.config)).toBe(true)
    })

    test('should return false for purely static responsive values', () => {
      const responsiveModifier = createResponsiveModifier({
        fontSize: {
          base: 14,
          md: 16,
          lg: 18
        },
        color: {
          base: '#333',
          md: '#666',
          lg: '#999'
        }
      })

      expect(responsiveModifier['hasReactiveValues'](responsiveModifier.config)).toBe(false)
    })
  })

  describe('CSS Regeneration', () => {
    test.skip('should regenerate CSS when reactive values change', async () => {
      return new Promise<void>((resolve, reject) => {
        createRoot(() => {
          try {
            const [backgroundColor, setBackgroundColor] = createSignal('#ffffff')
            
            const responsiveModifier = createResponsiveModifier({
              backgroundColor: {
                base: backgroundColor,
                md: '#f0f0f0',
                lg: '#e0e0e0'
              }
            })

            const node: DOMNode = { element: mockElement }
            const context = {
              element: mockElement,
              componentId: 'test-css-regen'
            }

            responsiveModifier.apply(node, context)

            setTimeout(() => {
              const initialCallCount = mockStyleSheet.insertRule.mock.calls.length
              expect(initialCallCount).toBeGreaterThan(0)

              // Change the reactive value
              setBackgroundColor('#ff0000')

              setTimeout(() => {
                // Should have regenerated CSS
                const newCallCount = mockStyleSheet.insertRule.mock.calls.length
                expect(newCallCount).toBeGreaterThan(initialCallCount)
                resolve()
              }, 10)
            }, 10)
          } catch (error) {
            reject(error)
          }
        })
      })
    })
  })
})