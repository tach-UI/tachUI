/**
 * Attributes Stress Tests
 *
 * Stress tests for attribute modifiers under high load conditions,
 * memory pressure, and edge cases for production validation.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  id,
  data,
  tabIndex,
  aria,
  customProperties,
  themeColors,
  designTokens,
} from '../../src/attributes'
import type { ModifierContext } from '@tachui/core/modifiers/types'
import type { DOMNode } from '@tachui/core/runtime/types'

// Mock DOM element for stress testing
class MockElement {
  private attributes: Record<string, string> = {}
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

  setAttribute(name: string, value: string): void {
    this.attributes[name] = value
  }

  getAttribute(name: string): string | null {
    return this.attributes[name] !== undefined ? this.attributes[name] : null
  }

  getAllAttributes(): Record<string, string> {
    return { ...this.attributes }
  }

  getAttributeCount(): number {
    return Object.keys(this.attributes).length
  }

  getStylePropertyCount(): number {
    return Object.keys(this.style).filter(key => key !== 'setProperty').length
  }
}

function createMockContext(): ModifierContext {
  return {
    element: new MockElement() as unknown as HTMLElement,
  }
}

describe('Attributes Stress Tests', () => {
  let mockElement: MockElement
  let mockContext: ModifierContext

  beforeEach(() => {
    mockElement = new MockElement()
    mockContext = {
      element: mockElement as unknown as HTMLElement,
    }

    vi.clearAllMocks()
  })

  describe('High Volume Operations', () => {
    it('should handle 1000 ID modifier instances efficiently', () => {
      const startTime = performance.now()

      const modifiers = Array.from({ length: 1000 }, (_, i) =>
        id(`test-id-${i}`)
      )

      modifiers.forEach(modifier => {
        const context = createMockContext()
        modifier.apply({} as DOMNode, context)
      })

      const duration = performance.now() - startTime

      // Should handle 1000 operations within reasonable time
      expect(duration).toBeLessThan(100)
      expect(modifiers).toHaveLength(1000)
    })

    it('should handle massive data attribute operations', () => {
      const startTime = performance.now()

      const largeDataSet: Record<string, any> = {}
      for (let i = 0; i < 500; i++) {
        largeDataSet[`attribute${i}`] = `value${i}`
        largeDataSet[`flag${i}`] = i % 2 === 0
        largeDataSet[`counter${i}`] = i
      }

      const modifier = data(largeDataSet)
      modifier.apply({} as DOMNode, mockContext)

      const duration = performance.now() - startTime

      // Should handle 1500 data attributes efficiently
      expect(duration).toBeLessThan(50)
      expect(mockElement.getAttributeCount()).toBe(1500) // 500 * 3 attributes
    })

    it('should handle complex ARIA attribute combinations', () => {
      const startTime = performance.now()

      const modifiers = Array.from({ length: 100 }, (_, i) =>
        aria({
          role: i % 2 === 0 ? 'button' : 'menuitem',
          label: `Action item ${i}`,
          describedby: `desc-${i}`,
          expanded: i % 3 === 0,
          selected: i % 4 === 0,
          level: Math.floor(i / 10) + 1,
          posinset: i + 1,
          setsize: 100,
        })
      )

      modifiers.forEach(modifier => {
        const context = createMockContext()
        modifier.apply({} as DOMNode, context)
      })

      const duration = performance.now() - startTime

      // Should handle complex ARIA operations efficiently
      expect(duration).toBeLessThan(50)
      expect(modifiers).toHaveLength(100)
    })

    it('should handle massive CSS custom properties', () => {
      const startTime = performance.now()

      const largePropertySet: Record<string, string | number> = {}

      // Generate many different types of CSS properties
      for (let i = 0; i < 200; i++) {
        largePropertySet[`color-${i}`] = `hsl(${i * 1.8}, 50%, 50%)`
        largePropertySet[`size-${i}`] = i * 2
        largePropertySet[`spacing-${i}`] = `${i * 4}px`
        largePropertySet[`opacity-${i}`] = (i % 100) / 100
        largePropertySet[`gradient-${i}`] =
          `linear-gradient(${i}deg, red, blue)`
      }

      const modifier = customProperties({ properties: largePropertySet })
      modifier.apply({} as DOMNode, mockContext)

      const duration = performance.now() - startTime

      // Should handle 1000 CSS properties efficiently
      expect(duration).toBeLessThan(30)
      // Due to the proxy setProperty also setting camelCase versions, we get double the properties
      expect(mockElement.getStylePropertyCount()).toBeGreaterThanOrEqual(1000) // At least 1000, may be more due to camelCase copies
    })
  })

  describe('Complex Nested Operations', () => {
    it('should handle deeply nested modifier chains', () => {
      const contexts = Array.from({ length: 50 }, () => createMockContext())

      const startTime = performance.now()

      contexts.forEach((context, i) => {
        // Apply multiple layers of modifiers to each context
        id(`nested-element-${i}`).apply({} as DOMNode, context)

        data({
          testId: `nested-test-${i}`,
          level: Math.floor(i / 5),
          index: i,
          category: `category-${i % 10}`,
        }).apply({} as DOMNode, context)

        aria({
          role: 'treeitem',
          level: Math.floor(i / 5) + 1,
          posinset: (i % 5) + 1,
          setsize: 5,
          expanded: i % 3 === 0,
          selected: i === 25, // Middle item selected
        }).apply({} as DOMNode, context)

        tabIndex(i === 25 ? 0 : -1).apply({} as DOMNode, context) // Only selected item tabbable

        customProperties({
          properties: {
            [`item-color-${i}`]: `hsl(${i * 7.2}, 60%, 60%)`,
            [`item-indent-${i}`]: `${Math.floor(i / 5) * 20}px`,
            [`item-font-weight-${i}`]: i === 25 ? 600 : 400,
          },
        }).apply({} as DOMNode, context)
      })

      const duration = performance.now() - startTime

      // Should handle complex nested operations efficiently
      expect(duration).toBeLessThan(100)

      // Verify structure is correct
      contexts.forEach((context, i) => {
        const element = context.element as unknown as MockElement
        expect(element.getAttribute('id')).toBe(`nested-element-${i}`)
        expect(element.getAttribute('aria-level')).toBe(
          String(Math.floor(i / 5) + 1)
        )
        expect(element.getAttribute('tabindex')).toBe(i === 25 ? '0' : '-1')
      })
    })

    it('should handle concurrent theme system operations', () => {
      const operations = Array.from({ length: 20 }, (_, i) => ({
        context: createMockContext(),
        themeIndex: i,
      }))

      const startTime = performance.now()

      const promises = operations.map(({ context, themeIndex }) =>
        Promise.resolve().then(() => {
          // Different theme variations
          const baseHue = themeIndex * 18 // Distribute across color wheel

          themeColors({
            primary: `hsl(${baseHue}, 70%, 50%)`,
            secondary: `hsl(${(baseHue + 120) % 360}, 70%, 50%)`,
            accent: `hsl(${(baseHue + 240) % 360}, 70%, 50%)`,
            background: themeIndex % 2 === 0 ? '#FFFFFF' : '#000000',
            text: themeIndex % 2 === 0 ? '#000000' : '#FFFFFF',
          }).apply({} as DOMNode, context)

          designTokens({
            'spacing-unit': 4 + (themeIndex % 4),
            'font-size-base': 14 + (themeIndex % 6),
            'border-radius': 2 + (themeIndex % 8),
            'animation-speed': `${200 + themeIndex * 50}ms`,
          }).apply({} as DOMNode, context)

          return { context, themeIndex }
        })
      )

      return Promise.all(promises).then(results => {
        const duration = performance.now() - startTime

        // Should handle concurrent operations efficiently
        expect(duration).toBeLessThan(100)

        // Verify each theme is correct
        results.forEach(({ context, themeIndex }) => {
          const element = context.element as unknown as MockElement
          const expectedHue = themeIndex * 18
          expect(element.style['--theme-color-primary']).toBe(
            `hsl(${expectedHue}, 70%, 50%)`
          )
          expect(element.style['--token-spacing-unit']).toBe(
            String(4 + (themeIndex % 4))
          )
        })
      })
    })
  })

  describe('Memory and Resource Management', () => {
    it('should handle repeated modifier creation and application', () => {
      const initialMemory = process.memoryUsage?.() || { heapUsed: 0 }

      // Create and apply many modifiers in batches
      for (let batch = 0; batch < 10; batch++) {
        const batchModifiers = []

        // Create batch of modifiers
        for (let i = 0; i < 100; i++) {
          const index = batch * 100 + i

          batchModifiers.push(
            id(`batch-${batch}-item-${i}`),
            data({
              batchId: batch,
              itemIndex: i,
              timestamp: Date.now() + index,
            }),
            aria({
              role: 'listitem',
              posinset: i + 1,
              setsize: 100,
              label: `Batch ${batch} Item ${i}`,
            }),
            customProperties({
              properties: {
                [`batch-${batch}-color`]: `hsl(${index % 360}, 50%, 50%)`,
                [`batch-${batch}-size`]: index % 50,
              },
            })
          )
        }

        // Apply all modifiers in batch
        batchModifiers.forEach(modifier => {
          const context = createMockContext()
          modifier.apply({} as DOMNode, context)
        })

        // Force garbage collection opportunity
        if (global.gc) {
          global.gc()
        }
      }

      const finalMemory = process.memoryUsage?.() || { heapUsed: 0 }
      const memoryGrowth = finalMemory.heapUsed - initialMemory.heapUsed

      // Memory growth should be reasonable (less than 30MB for 4000 modifier operations)
      expect(memoryGrowth).toBeLessThan(30 * 1024 * 1024)
    })

    it('should handle rapid creation and destruction cycles', () => {
      const startTime = performance.now()

      const cycles = 50

      for (let cycle = 0; cycle < cycles; cycle++) {
        const contexts = Array.from({ length: 20 }, () => createMockContext())

        // Apply modifiers
        contexts.forEach((context, i) => {
          id(`cycle-${cycle}-item-${i}`).apply({} as DOMNode, context)
          data({ cycle, item: i }).apply({} as DOMNode, context)
          aria({ label: `Cycle ${cycle} Item ${i}` }).apply(
            {} as DOMNode,
            context
          )
          customProperties({
            properties: { [`cycle-${cycle}-prop`]: cycle * i },
          }).apply({} as DOMNode, context)
        })

        // Simulate cleanup - contexts go out of scope
        contexts.length = 0
      }

      const duration = performance.now() - startTime

      // Should handle rapid cycles efficiently
      expect(duration).toBeLessThan(200)
    })
  })

  describe('Edge Cases Under Load', () => {
    it('should handle extreme data attribute values', () => {
      const extremeValues = {
        veryLongString: 'a'.repeat(1000),
        unicodeString: '🚀'.repeat(100),
        jsonString: JSON.stringify({
          deep: { nested: { object: { with: { many: { levels: 'value' } } } } },
        }),
        specialChars: '!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~'.repeat(5),
        numberString: '123456789'.repeat(10),
        mixedContent:
          'Text with 🚀 emojis and 123 numbers and "quotes" and special @#$% chars',
        empty: '',
        whitespace: '   \t\n\r   ',
        xmlContent: '<root><item attr="value">Content &amp; more</item></root>',
      }

      const startTime = performance.now()

      const modifier = data(extremeValues)
      modifier.apply({} as DOMNode, mockContext)

      const duration = performance.now() - startTime

      // Should handle extreme values efficiently
      expect(duration).toBeLessThan(10)

      // Verify all values were set correctly
      Object.entries(extremeValues).forEach(([key, value]) => {
        const attributeName = `data-${key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)}`
        const attributeValue = mockElement.getAttribute(attributeName)
        if (value === '') {
          // Empty string should be set as empty string, not null
          expect(attributeValue).toBe('')
        } else {
          expect(attributeValue).toBe(String(value))
        }
      })
    })

    it('should handle maximum CSS property complexity', () => {
      const complexProperties = {
        complexGradient:
          'linear-gradient(45deg, rgba(255,0,0,0.8) 0%, rgba(255,154,0,0.8) 10%, rgba(208,222,33,0.8) 20%, rgba(79,220,74,0.8) 30%, rgba(63,218,216,0.8) 40%, rgba(47,201,226,0.8) 50%, rgba(28,127,238,0.8) 60%, rgba(95,21,242,0.8) 70%, rgba(186,12,248,0.8) 80%, rgba(251,7,217,0.8) 90%, rgba(255,0,0,0.8) 100%)',
        complexTransform:
          'perspective(1000px) rotateX(45deg) rotateY(45deg) rotateZ(45deg) translateX(100px) translateY(50px) translateZ(-200px) scale3d(1.2, 1.5, 0.8)',
        complexFilter:
          'blur(5px) brightness(1.1) contrast(1.2) drop-shadow(0 0 10px rgba(0,0,0,0.5)) grayscale(0.3) hue-rotate(90deg) invert(0.1) opacity(0.9) saturate(1.3) sepia(0.2)',
        complexAnimation:
          'bounce 2s infinite alternate, fade 1s ease-in-out, slide 3s linear infinite',
        complexCalc:
          'calc((100vw - 2 * var(--container-padding)) / var(--columns) - var(--gap) * (var(--columns) - 1) / var(--columns))',
        complexClamp:
          'clamp(var(--min-size, 1rem), var(--preferred-size, 2.5vw), var(--max-size, 3rem))',
        complexGrid:
          'repeat(auto-fit, minmax(max(200px, calc((100% - 5 * var(--gap)) / 6)), 1fr))',
        longVariableList: Array.from(
          { length: 20 },
          (_, i) => `var(--custom-${i})`
        ).join(', '),
      }

      const startTime = performance.now()

      const modifier = customProperties({ properties: complexProperties })
      modifier.apply({} as DOMNode, mockContext)

      const duration = performance.now() - startTime

      // Should handle complex CSS efficiently
      expect(duration).toBeLessThan(10)

      // Verify complex properties were set
      expect(mockElement.style['--complex-gradient']).toContain(
        'linear-gradient'
      )
      expect(mockElement.style['--complex-transform']).toContain('perspective')
      expect(mockElement.style['--complex-calc']).toContain('calc(')
    })

    it('should handle validation stress in development mode', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const originalEnv = process.env.NODE_ENV

      try {
        process.env.NODE_ENV = 'development'

        const startTime = performance.now()

        // Create many modifiers with validation issues
        for (let i = 0; i < 100; i++) {
          // Invalid IDs
          id(`${i}invalid-id`).apply({} as DOMNode, createMockContext())

          // Invalid ARIA attributes
          aria({
            live: 'invalid' as any,
            orientation: 'invalid' as any,
            sort: 'invalid' as any,
          }).apply({} as DOMNode, createMockContext())

          // Invalid data attributes
          data({
            [`${i}invalid-key`]: 'value',
          }).apply({} as DOMNode, createMockContext())
        }

        const duration = performance.now() - startTime

        // Should handle validation efficiently even with many warnings
        expect(duration).toBeLessThan(100)

        // Should have generated warnings
        expect(consoleSpy).toHaveBeenCalled()
      } finally {
        process.env.NODE_ENV = originalEnv
        consoleSpy.mockRestore()
      }
    })
  })

  describe('Performance Benchmarks', () => {
    it('should meet attribute modifier creation benchmarks', () => {
      const startTime = performance.now()

      const modifiers = []
      for (let i = 0; i < 5000; i++) {
        modifiers.push(
          id(`benchmark-${i}`),
          data({ index: i, category: `cat-${i % 10}` }),
          aria({ label: `Item ${i}`, posinset: i + 1 }),
          tabIndex(i % 100 === 0 ? 0 : -1),
          customProperties({ properties: { [`prop-${i}`]: i } })
        )
      }

      const duration = performance.now() - startTime
      const opsPerSecond = (modifiers.length / duration) * 1000

      // Should create at least 10,000 modifiers per second
      expect(opsPerSecond).toBeGreaterThan(10000)
      expect(modifiers).toHaveLength(25000) // 5000 * 5 modifiers
    })

    it('should meet attribute modifier application benchmarks', () => {
      const modifiers = Array.from({ length: 1000 }, (_, i) => ({
        id: id(`perf-test-${i}`),
        data: data({ test: i, category: `cat-${i % 5}` }),
        aria: aria({ label: `Test ${i}`, level: (i % 3) + 1 }),
        css: customProperties({ properties: { [`test-${i}`]: i } }),
      }))

      const startTime = performance.now()

      modifiers.forEach(
        ({ id: idMod, data: dataMod, aria: ariaMod, css: cssMod }) => {
          const context = createMockContext()
          idMod.apply({} as DOMNode, context)
          dataMod.apply({} as DOMNode, context)
          ariaMod.apply({} as DOMNode, context)
          cssMod.apply({} as DOMNode, context)
        }
      )

      const duration = performance.now() - startTime
      const opsPerSecond = ((modifiers.length * 4) / duration) * 1000

      // Should apply at least 5,000 modifiers per second
      expect(opsPerSecond).toBeGreaterThan(5000)
    })

    it('should handle massive theme system efficiently', () => {
      const startTime = performance.now()

      // Create a comprehensive design system
      const themeModifier = themeColors({
        // Base colors
        primary: '#007AFF',
        primaryLight: '#40A0FF',
        primaryDark: '#005BB5',
        secondary: '#34C759',
        secondaryLight: '#5ED879',
        secondaryDark: '#28A745',
        accent: '#FF9500',
        accentLight: '#FFB040',
        accentDark: '#CC7700',

        // Neutral colors
        background: '#FFFFFF',
        backgroundSecondary: '#F2F2F7',
        backgroundTertiary: '#FFFFFF',
        surface: '#FFFFFF',
        surfaceSecondary: '#F2F2F7',
        surfaceTertiary: '#E5E5EA',

        // Text colors
        text: '#000000',
        textSecondary: '#3C3C43',
        textTertiary: '#3C3C4399',
        textInverse: '#FFFFFF',
        textInverseSecondary: '#FFFFFFCC',
        textInverseTertiary: '#FFFFFF99',

        // Semantic colors
        success: '#34C759',
        successLight: '#5ED879',
        successDark: '#28A745',
        warning: '#FF9500',
        warningLight: '#FFB040',
        warningDark: '#CC7700',
        error: '#FF3B30',
        errorLight: '#FF6B60',
        errorDark: '#E02E24',
        info: '#007AFF',
        infoLight: '#40A0FF',
        infoDark: '#005BB5',

        // Border colors
        border: '#C6C6C8',
        borderSecondary: '#E5E5EA',
        borderTertiary: '#F2F2F7',
      })

      const tokensModifier = designTokens({
        // Spacing scale
        'spacing-0': 0,
        'spacing-1': 4,
        'spacing-2': 8,
        'spacing-3': 12,
        'spacing-4': 16,
        'spacing-5': 20,
        'spacing-6': 24,
        'spacing-8': 32,
        'spacing-10': 40,
        'spacing-12': 48,
        'spacing-16': 64,
        'spacing-20': 80,
        'spacing-24': 96,
        'spacing-32': 128,

        // Font sizes
        'font-size-xs': 12,
        'font-size-sm': 14,
        'font-size-base': 16,
        'font-size-lg': 18,
        'font-size-xl': 20,
        'font-size-2xl': 24,
        'font-size-3xl': 30,
        'font-size-4xl': 36,

        // Font weights
        'font-weight-light': 300,
        'font-weight-normal': 400,
        'font-weight-medium': 500,
        'font-weight-semibold': 600,
        'font-weight-bold': 700,
        'font-weight-extrabold': 800,

        // Line heights
        'line-height-tight': 1.25,
        'line-height-snug': 1.375,
        'line-height-normal': 1.5,
        'line-height-relaxed': 1.625,
        'line-height-loose': 2,

        // Border radius
        'radius-none': 0,
        'radius-sm': 2,
        'radius-md': 4,
        'radius-lg': 8,
        'radius-xl': 12,
        'radius-2xl': 16,
        'radius-full': '50%',

        // Shadows
        'shadow-sm': '0 1px 2px rgba(0, 0, 0, 0.05)',
        'shadow-md': '0 4px 6px rgba(0, 0, 0, 0.1)',
        'shadow-lg': '0 10px 15px rgba(0, 0, 0, 0.1)',
        'shadow-xl': '0 20px 25px rgba(0, 0, 0, 0.1)',

        // Animation durations
        'duration-75': '75ms',
        'duration-100': '100ms',
        'duration-150': '150ms',
        'duration-200': '200ms',
        'duration-300': '300ms',
        'duration-500': '500ms',
      })

      // Apply to many contexts
      const contexts = Array.from({ length: 100 }, () => createMockContext())

      contexts.forEach(context => {
        themeModifier.apply({} as DOMNode, context)
        tokensModifier.apply({} as DOMNode, context)
      })

      const duration = performance.now() - startTime

      // Should handle massive theme system efficiently
      expect(duration).toBeLessThan(200)

      // Verify theme was applied to all contexts
      contexts.forEach(context => {
        const element = context.element as unknown as MockElement
        expect(element.style['--theme-color-primary']).toBe('#007AFF')
        expect(element.style['--token-spacing-4']).toBe('16')
      })
    })
  })
})
