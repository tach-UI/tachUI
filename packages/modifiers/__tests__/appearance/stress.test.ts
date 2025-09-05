/**
 * Appearance Modifiers Stress Tests
 *
 * Performance and stress tests for clipped and clipShape modifiers
 * to ensure they can handle high-volume usage scenarios.
 */

import { beforeEach, describe, expect, it } from 'vitest'
import { clipShape, clipped } from '../../src/appearance'
import type { ModifierContext } from '@tachui/core/modifiers/types'
import type { DOMNode } from '@tachui/core/runtime/types'

// Mock DOM element
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
          }
        }
        return target[prop] || ''
      },
    })
  }
}

describe('Appearance Modifiers Stress Tests', () => {
  let mockContext: ModifierContext

  beforeEach(() => {
    mockContext = {
      componentId: 'stress-test-component',
      element: new MockElement() as any,
      phase: 'creation',
    }
  })

  describe('High-Volume Clipped Modifier Tests', () => {
    it('should handle rapid clipped enable/disable cycles', () => {
      const enabledModifier = clipped(true)
      const disabledModifier = clipped(false)
      const cycles = 10000

      const start = performance.now()

      for (let i = 0; i < cycles; i++) {
        const modifier = i % 2 === 0 ? enabledModifier : disabledModifier
        modifier.apply({} as DOMNode, mockContext)
      }

      const duration = performance.now() - start
      const mockElement = mockContext.element as any

      expect(duration).toBeLessThan(200) // Should complete within 200ms
      expect(mockElement.style.overflow).toBe('') // Last operation was disable
    })

    it('should handle many clipped modifier instances', () => {
      const instances = Array.from({ length: 5000 }, () => clipped(true))

      const start = performance.now()

      instances.forEach(modifier => {
        modifier.apply({} as DOMNode, mockContext)
      })

      const duration = performance.now() - start
      const mockElement = mockContext.element as any

      expect(duration).toBeLessThan(100) // Should complete within 100ms
      expect(mockElement.style.overflow).toBe('hidden')
    })

    it('should handle concurrent clipped applications efficiently', () => {
      const mockElements = Array.from({ length: 1000 }, () => new MockElement())
      const modifier = clipped(true)

      const start = performance.now()

      mockElements.forEach(element => {
        const context = { ...mockContext, element: element as any }
        modifier.apply({} as DOMNode, context)
      })

      const duration = performance.now() - start

      expect(duration).toBeLessThan(80) // Should complete within 80ms

      // Verify all elements were modified
      mockElements.forEach(element => {
        expect(element.style.overflow).toBe('hidden')
      })
    })
  })

  describe('High-Volume ClipShape Modifier Tests', () => {
    it('should handle many circle clipShape applications', () => {
      const modifier = clipShape('circle')
      const iterations = 5000

      const start = performance.now()

      for (let i = 0; i < iterations; i++) {
        modifier.apply({} as DOMNode, mockContext)
      }

      const duration = performance.now() - start
      const mockElement = mockContext.element as any

      expect(duration).toBeLessThan(100) // Should complete within 100ms
      expect(mockElement.style.clipPath).toBe('circle(50%)')
    })

    it('should handle many ellipse clipShape applications with parameters', () => {
      const modifier = clipShape('ellipse', { radiusX: '75%', radiusY: '60%' })
      const iterations = 3000

      const start = performance.now()

      for (let i = 0; i < iterations; i++) {
        modifier.apply({} as DOMNode, mockContext)
      }

      const duration = performance.now() - start
      const mockElement = mockContext.element as any

      expect(duration).toBeLessThan(80) // Should complete within 80ms
      expect(mockElement.style.clipPath).toBe('ellipse(75% 60% at center)')
    })

    it('should handle complex polygon clipPath generations', () => {
      // Generate complex polygon with many points
      const points = Array.from({ length: 100 }, (_, i) => {
        const angle = (i / 100) * 360
        const x = 50 + 50 * Math.cos((angle * Math.PI) / 180)
        const y = 50 + 50 * Math.sin((angle * Math.PI) / 180)
        return `${x.toFixed(3)}% ${y.toFixed(3)}%`
      }).join(', ')

      const modifier = clipShape('polygon', { points })
      const iterations = 500

      const start = performance.now()

      for (let i = 0; i < iterations; i++) {
        modifier.apply({} as DOMNode, mockContext)
      }

      const duration = performance.now() - start
      const mockElement = mockContext.element as any

      expect(duration).toBeLessThan(100) // Should complete within 100ms
      expect(mockElement.style.clipPath).toBe(`polygon(${points})`)
    })

    it('should handle varied clipShape types efficiently', () => {
      const shapes = [
        clipShape('circle'),
        clipShape('ellipse', { radiusX: '60%', radiusY: '40%' }),
        clipShape('rect', { inset: 10 }),
        clipShape('polygon', { points: '0% 0%, 100% 50%, 0% 100%' }),
      ]

      const iterations = 2500 // 10000 total applications

      const start = performance.now()

      for (let i = 0; i < iterations; i++) {
        shapes.forEach(modifier => {
          modifier.apply({} as DOMNode, mockContext)
        })
      }

      const duration = performance.now() - start
      const mockElement = mockContext.element as any

      expect(duration).toBeLessThan(150) // Should complete within 150ms
      // Last applied should be polygon
      expect(mockElement.style.clipPath).toBe(
        'polygon(0% 0%, 100% 50%, 0% 100%)'
      )
    })
  })

  describe('Memory and Resource Management', () => {
    it('should not leak memory with many modifier instances', () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0

      // Create and apply many modifiers
      const modifiers: any[] = []
      for (let i = 0; i < 10000; i++) {
        const modifier = i % 2 === 0 ? clipped(true) : clipShape('circle')
        modifiers.push(modifier)
      }

      // Apply all modifiers
      modifiers.forEach(modifier => {
        modifier.apply({} as DOMNode, mockContext)
      })

      // Clear references
      modifiers.length = 0

      // Force garbage collection if available
      if (typeof global !== 'undefined' && (global as any).gc) {
        ;(global as any).gc()
      }

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0

      // Memory usage should not grow excessively (allow for some variance)
      if (initialMemory > 0 && finalMemory > 0) {
        const memoryGrowth = finalMemory - initialMemory
        expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024) // Less than 50MB growth
      }
    })

    it('should handle property mutations efficiently', () => {
      const baseProperties = { radiusX: '50%', radiusY: '50%' }
      const iterations = 1000

      const start = performance.now()

      for (let i = 0; i < iterations; i++) {
        const properties = {
          ...baseProperties,
          radiusX: `${50 + (i % 50)}%`,
          radiusY: `${50 + ((i * 2) % 50)}%`,
        }

        const modifier = clipShape('ellipse', properties)
        modifier.apply({} as DOMNode, mockContext)
      }

      const duration = performance.now() - start

      expect(duration).toBeLessThan(100) // Should complete within 100ms
    })

    it('should handle string concatenation efficiently for complex paths', () => {
      const iterations = 1000

      const start = performance.now()

      for (let i = 0; i < iterations; i++) {
        // Generate dynamic polygon points
        const pointCount = 10 + (i % 10)
        const points = Array.from({ length: pointCount }, (_, j) => {
          const angle = (j / pointCount) * 360
          const x = 50 + 30 * Math.cos((angle * Math.PI) / 180)
          const y = 50 + 30 * Math.sin((angle * Math.PI) / 180)
          return `${x.toFixed(2)}% ${y.toFixed(2)}%`
        }).join(', ')

        const modifier = clipShape('polygon', { points })
        modifier.apply({} as DOMNode, mockContext)
      }

      const duration = performance.now() - start

      expect(duration).toBeLessThan(150) // Should complete within 150ms
    })
  })

  describe('Edge Case Stress Tests', () => {
    it('should handle rapid shape switching', () => {
      const shapes = [
        () => clipShape('circle'),
        () => clipShape('ellipse', { radiusX: '60%', radiusY: '40%' }),
        () => clipShape('rect', { inset: 5 }),
        () => clipShape('polygon', { points: '50% 0%, 100% 100%, 0% 100%' }),
      ]

      const iterations = 5000

      const start = performance.now()

      for (let i = 0; i < iterations; i++) {
        const shapeFactory = shapes[i % shapes.length]
        const modifier = shapeFactory()
        modifier.apply({} as DOMNode, mockContext)
      }

      const duration = performance.now() - start

      expect(duration).toBeLessThan(200) // Should complete within 200ms
    })

    it.skipIf(process.env.TEST_ISOLATION === 'true')(
      'should handle invalid parameters gracefully at scale',
      () => {
        const invalidModifiers = [
          clipShape('ellipse', { radiusX: undefined, radiusY: null }),
          clipShape('polygon', { points: null }),
          clipShape('rect', { inset: undefined }),
          new (clipShape as any)('invalid', {}),
        ]

        const iterations = 1000

        const start = performance.now()

        for (let i = 0; i < iterations; i++) {
          invalidModifiers.forEach(modifier => {
            expect(() => {
              modifier.apply({} as DOMNode, mockContext)
            }).not.toThrow()
          })
        }

        const duration = performance.now() - start

        expect(duration).toBeLessThan(200) // Should complete within 200ms
      }
    )

    it('should handle concurrent applications on different elements', () => {
      const elementCount = 1000
      const mockElements = Array.from(
        { length: elementCount },
        () => new MockElement()
      )
      const modifiers = [
        clipped(true),
        clipShape('circle'),
        clipShape('ellipse', { radiusX: '70%', radiusY: '50%' }),
      ]

      const start = performance.now()

      mockElements.forEach((element, index) => {
        const context = { ...mockContext, element: element as any }
        const modifier = modifiers[index % modifiers.length]
        modifier.apply({} as DOMNode, context)
      })

      const duration = performance.now() - start

      expect(duration).toBeLessThan(150) // Should complete within 150ms

      // Verify elements were modified correctly
      mockElements.forEach((element, index) => {
        const modifierType = index % modifiers.length
        if (modifierType === 0) {
          expect(element.style.overflow).toBe('hidden')
        } else if (modifierType === 1) {
          expect(element.style.clipPath).toBe('circle(50%)')
        } else {
          expect(element.style.clipPath).toBe('ellipse(70% 50% at center)')
        }
      })
    })
  })

  describe('Real-World Usage Simulation', () => {
    it('should handle typical UI component usage patterns', () => {
      // Simulate a typical UI with cards, buttons, and images using clipping
      const componentTypes = [
        { type: 'card', modifier: () => clipShape('rect', { inset: 2 }) },
        { type: 'avatar', modifier: () => clipShape('circle') },
        { type: 'image', modifier: () => clipped(true) },
        {
          type: 'button',
          modifier: () =>
            clipShape('ellipse', { radiusX: '50%', radiusY: '25px' }),
        },
        { type: 'badge', modifier: () => clipShape('circle') },
      ]

      const componentsPerType = 200 // 1000 total components

      const start = performance.now()

      componentTypes.forEach(({ modifier }) => {
        for (let i = 0; i < componentsPerType; i++) {
          const mod = modifier()
          mod.apply({} as DOMNode, mockContext)
        }
      })

      const duration = performance.now() - start

      expect(duration).toBeLessThan(100) // Should complete within 100ms
    })

    it('should handle dynamic clipping updates', () => {
      // Simulate dynamic updates like hover effects, animations, etc.
      const states = [
        clipped(false),
        clipShape('circle'),
        clipShape('ellipse', { radiusX: '80%', radiusY: '60%' }),
        clipped(true),
        clipShape('rect', { inset: 5 }),
      ]

      const updateCycles = 500

      const start = performance.now()

      for (let cycle = 0; cycle < updateCycles; cycle++) {
        states.forEach(modifier => {
          modifier.apply({} as DOMNode, mockContext)
        })
      }

      const duration = performance.now() - start

      expect(duration).toBeLessThan(150) // Should complete within 150ms
    })
  })
})
