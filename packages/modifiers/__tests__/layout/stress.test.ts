/**
 * Layout Modifiers Stress Tests
 *
 * Performance and edge case testing for layout modifiers.
 * Tests high-volume operations, memory usage, and performance characteristics.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  offset,
  scaleEffect,
  aspectRatio,
  fixedSize,
  position,
  zIndex,
  ZIndexModifier,
  AspectRatioModifier,
} from '../../src/layout'
import type { ModifierContext } from '@tachui/core/modifiers/types'
import type { DOMNode } from '@tachui/core/runtime/types'
import { createSignal, flushSync } from '@tachui/core/reactive'

// Mock DOM element with performance tracking
class MockElement {
  style: {
    [key: string]: string
    setProperty: (property: string, value: string) => void
  }
  tagName: string
  parentElement: MockElement | null
  childNodes: MockNode[]
  _styleUpdates: number = 0

  constructor(
    tagName: string = 'DIV',
    parentElement: MockElement | null = null
  ) {
    this.tagName = tagName
    this.parentElement = parentElement
    this.childNodes = []
    this._styleUpdates = 0

    this.style = new Proxy({} as any, {
      set: (target, prop, value) => {
        target[prop] = value
        this._styleUpdates++
        return true
      },
      get: (target, prop) => {
        if (prop === 'setProperty') {
          return (property: string, value: string) => {
            target[property] = value
            this._styleUpdates++
          }
        }
        return target[prop] || ''
      },
    })
  }

  resetMetrics() {
    this._styleUpdates = 0
  }
}

class MockNode {
  nodeType: number
  constructor(nodeType: number) {
    this.nodeType = nodeType
  }
}

// Performance measurement helper
function measurePerformance(fn: () => void, iterations: number = 1000): number {
  const start = performance.now()
  for (let i = 0; i < iterations; i++) {
    fn()
  }
  const end = performance.now()
  return end - start
}

// Mock getComputedStyle
const mockGetComputedStyle = vi.fn()

describe('Layout Modifiers Stress Tests', () => {
  let mockElement: MockElement
  let mockContext: ModifierContext
  let originalGetComputedStyle: any
  let originalConsole: any

  beforeEach(() => {
    mockElement = new MockElement()
    mockContext = {
      element: mockElement as unknown as HTMLElement,
    }

    originalGetComputedStyle = global.getComputedStyle
    global.getComputedStyle = mockGetComputedStyle

    originalConsole = console.warn
    console.warn = vi.fn() // Suppress warnings in stress tests

    vi.clearAllMocks()
    mockGetComputedStyle.mockReturnValue({
      position: 'static',
      display: 'block',
      opacity: '1',
      transform: 'none',
      filter: 'none',
      isolation: 'auto',
      mixBlendMode: 'normal',
    })
  })

  afterEach(() => {
    global.getComputedStyle = originalGetComputedStyle
    console.warn = originalConsole
  })

  describe('High-Volume Operations', () => {
    it('should handle many offset modifier applications efficiently', () => {
      const iterations = 10000

      const time = measurePerformance(() => {
        const modifier = offset(Math.random() * 100, Math.random() * 100)
        modifier.apply({} as DOMNode, mockContext)
      }, iterations)

      // Should complete 10k operations in under 1 second
      expect(time).toBeLessThan(1000)

      // Performance metric: should average less than 0.1ms per operation
      const avgTime = time / iterations
      expect(avgTime).toBeLessThan(0.1)
    })

    it('should handle rapid scale effect changes efficiently', () => {
      const iterations = 5000

      const time = measurePerformance(() => {
        const scale = 0.5 + Math.random() * 2 // 0.5 to 2.5
        const modifier = scaleEffect(scale, scale)
        modifier.apply({} as DOMNode, mockContext)
      }, iterations)

      expect(time).toBeLessThan(1000)

      const avgTime = time / iterations
      expect(avgTime).toBeLessThan(0.2) // Scale is more complex than offset
    })

    it('should handle complex transform combinations efficiently', () => {
      const iterations = 1000

      const time = measurePerformance(() => {
        // Simulate complex existing transform
        mockElement.style.transform =
          'rotate(45deg) skew(10deg) translate3d(10px, 20px, 30px)'

        const offsetModifier = offset(Math.random() * 50, Math.random() * 50)
        const scaleModifier = scaleEffect(0.8 + Math.random() * 0.4)

        offsetModifier.apply({} as DOMNode, mockContext)
        scaleModifier.apply({} as DOMNode, mockContext)

        // Reset for next iteration
        mockElement = new MockElement()
        mockContext.element = mockElement as unknown as HTMLElement
      }, iterations)

      expect(time).toBeLessThan(2000) // Allow more time for complex operations

      const avgTime = time / iterations
      expect(avgTime).toBeLessThan(2)
    })

    it('should handle many z-index applications with stacking context checks', () => {
      const iterations = 2000

      const time = measurePerformance(() => {
        const zValue = Math.floor(Math.random() * 1000)
        const modifier = zIndex(zValue)
        modifier.apply({} as DOMNode, mockContext)

        // Reset position to force stacking context evaluation
        mockElement.style.position = ''
      }, iterations)

      expect(time).toBeLessThan(1500)

      const avgTime = time / iterations
      expect(avgTime).toBeLessThan(0.75) // Z-index has DOM queries
    })

    it('should handle aspect ratio calculations efficiently', () => {
      const iterations = 3000
      const ratios = [1, 4 / 3, 16 / 9, 3 / 2, 1.618, 21 / 9, 2 / 1]

      const time = measurePerformance(() => {
        const ratio = ratios[Math.floor(Math.random() * ratios.length)]
        const mode = Math.random() > 0.5 ? 'fit' : 'fill'
        const modifier = aspectRatio(ratio, mode)
        modifier.apply({} as DOMNode, mockContext)
      }, iterations)

      expect(time).toBeLessThan(1000)

      const avgTime = time / iterations
      expect(avgTime).toBeLessThan(0.33)
    })
  })

  describe('Memory and Resource Management', () => {
    it('should not create excessive DOM style updates', () => {
      mockElement.resetMetrics()

      const modifier = offset(10, 20)
      modifier.apply({} as DOMNode, mockContext)

      // Should make minimal style updates
      expect(mockElement._styleUpdates).toBeLessThanOrEqual(3) // transform only

      mockElement.resetMetrics()

      const scaleModifier = scaleEffect(1.5, 1.0, 'center')
      scaleModifier.apply({} as DOMNode, mockContext)

      // Should update transform and transformOrigin
      expect(mockElement._styleUpdates).toBeLessThanOrEqual(4)
    })

    it('should handle large numbers of reactive updates efficiently', () => {
      const reactiveValues = Array.from({ length: 100 }, () =>
        createSignal(Math.random() * 100)
      )
      const modifiers = reactiveValues.map(([val]) => offset(val, 0))

      const startTime = performance.now()

      // Apply all modifiers
      modifiers.forEach(modifier => {
        modifier.apply({} as DOMNode, mockContext)
        // Reset element for next modifier
        mockElement = new MockElement()
        mockContext.element = mockElement as unknown as HTMLElement
      })

      // Update all reactive values multiple times
      for (let i = 0; i < 10; i++) {
        reactiveValues.forEach(([getter, setter]) => {
          setter(Math.random() * 100)
        })
      }
      flushSync() // Trigger pending effects

      const endTime = performance.now()
      const totalTime = endTime - startTime

      // Should handle 100 modifiers * 10 updates efficiently
      expect(totalTime).toBeLessThan(500)
    })

    it('should handle deep parent chain traversal efficiently', () => {
      // Create deep DOM tree
      let currentElement = new MockElement('DIV', null)
      const elements = [currentElement]

      for (let i = 0; i < 100; i++) {
        const child = new MockElement('DIV', currentElement)
        elements.push(child)
        currentElement = child
      }

      // Mock deep parent chain for absolute positioning check
      mockGetComputedStyle.mockImplementation(element => {
        // Make the 50th element positioned
        if (element === elements[50]) {
          return { position: 'relative' }
        }
        return { position: 'static' }
      })

      mockElement = elements[99] // Use deepest element
      mockContext.element = mockElement as unknown as HTMLElement

      const startTime = performance.now()

      const positionModifier = position('absolute')
      positionModifier.apply({} as DOMNode, mockContext)

      const endTime = performance.now()
      const traversalTime = endTime - startTime

      // Should traverse 100-level deep tree quickly
      expect(traversalTime).toBeLessThan(50)
    })
  })

  describe('Edge Case Performance', () => {
    it('should handle extreme transform string parsing efficiently', () => {
      const complexTransforms = [
        'translate(10px, 20px) rotate(45deg) scale(1.5) skew(10deg, 20deg) translate3d(1px, 2px, 3px) rotateX(90deg) rotateY(180deg) scaleX(2) scaleY(0.5)',
        'matrix(1, 0, 0, 1, 100, 200) translate(50px, 75px) scale(1.2, 0.8) rotate(30deg) skew(5deg)',
        'perspective(1000px) rotateX(45deg) rotateY(90deg) rotateZ(180deg) translate3d(10px, 20px, 30px) scale3d(1.5, 2, 0.5)',
      ]

      const iterations = 1000

      complexTransforms.forEach(transform => {
        const time = measurePerformance(() => {
          mockElement.style.transform = transform

          const offsetModifier = offset(5, 10)
          offsetModifier.apply({} as DOMNode, mockContext)

          // Reset for next iteration
          mockElement = new MockElement()
          mockContext.element = mockElement as unknown as HTMLElement
        }, iterations)

        expect(time).toBeLessThan(1000) // Should handle complex parsing efficiently
      })
    })

    it('should handle rapid reactive updates without memory leaks', () => {
      const [xOffset, setXOffset] = createSignal(0)
      const [yOffset, setYOffset] = createSignal(0)
      const [scale, setScale] = createSignal(1)
      const [zValue, setZValue] = createSignal(0)

      const offsetModifier = offset(xOffset, yOffset)
      const scaleModifier = scaleEffect(scale)
      const zIndexModifier = zIndex(zValue)

      // Apply modifiers
      offsetModifier.apply({} as DOMNode, mockContext)
      scaleModifier.apply({} as DOMNode, mockContext)
      zIndexModifier.apply({} as DOMNode, mockContext)

      const startTime = performance.now()
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0

      // Rapid updates
      for (let i = 0; i < 10000; i++) {
        setXOffset(i % 100)
        setYOffset((i + 50) % 100)
        setScale(1 + (i % 10) * 0.1)
        setZValue(i % 1000)
      }
      flushSync() // Trigger pending effects

      const endTime = performance.now()
      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0

      const updateTime = endTime - startTime
      const memoryGrowth = finalMemory - initialMemory

      // Should complete 40k updates quickly
      expect(updateTime).toBeLessThan(1000)

      // Memory growth should be reasonable (less than 10MB)
      if (initialMemory > 0) {
        expect(memoryGrowth).toBeLessThan(10 * 1024 * 1024)
      }
    })

    it('should handle extreme stacking context analysis efficiently', () => {
      // Mock element with many stacking context properties
      mockGetComputedStyle.mockReturnValue({
        position: 'relative',
        opacity: '0.9',
        transform: 'translateZ(0) scale(1.1) rotate(45deg) skew(10deg)',
        filter: 'blur(2px) brightness(1.2) contrast(1.5)',
        isolation: 'isolate',
        mixBlendMode: 'multiply',
        // Additional properties that don't create stacking contexts
        backgroundColor: 'red',
        border: '1px solid blue',
        margin: '10px',
        padding: '5px',
      })

      const iterations = 1000

      const time = measurePerformance(() => {
        const modifier = zIndex(Math.floor(Math.random() * 100))
        modifier.apply({} as DOMNode, mockContext)
      }, iterations)

      expect(time).toBeLessThan(1500) // Complex style analysis should still be fast

      const avgTime = time / iterations
      expect(avgTime).toBeLessThan(1.5)
    })
  })

  describe('Boundary Testing', () => {
    it('should handle extreme numeric values efficiently', () => {
      const extremeValues = [
        Number.MAX_SAFE_INTEGER,
        Number.MIN_SAFE_INTEGER,
        Number.MAX_VALUE,
        -Number.MAX_VALUE,
        Number.EPSILON,
        1 / Number.EPSILON,
      ]

      extremeValues.forEach(value => {
        const startTime = performance.now()

        const offsetModifier = offset(value, value)
        offsetModifier.apply({} as DOMNode, mockContext)

        const scaleModifier = scaleEffect(
          Math.abs(value / 1e10),
          Math.abs(value / 1e10)
        )
        scaleModifier.apply({} as DOMNode, mockContext)

        const zIndexModifier = zIndex(Math.floor(Math.abs(value) % 1000000))
        zIndexModifier.apply({} as DOMNode, mockContext)

        const endTime = performance.now()
        const operationTime = endTime - startTime

        // Should handle extreme values without hanging
        expect(operationTime).toBeLessThan(100)

        // Reset for next test
        mockElement = new MockElement()
        mockContext.element = mockElement as unknown as HTMLElement
      })
    })

    it('should handle very long transform strings without performance degradation', () => {
      // Create very long transform string
      const longTransform = Array.from(
        { length: 100 },
        (_, i) =>
          `translate(${i}px, ${i * 2}px) scale(${1 + i * 0.01}) rotate(${i}deg)`
      ).join(' ')

      mockElement.style.transform = longTransform

      const startTime = performance.now()

      const offsetModifier = offset(50, 75)
      offsetModifier.apply({} as DOMNode, mockContext)

      const endTime = performance.now()
      const processingTime = endTime - startTime

      // Should handle very long transforms efficiently
      expect(processingTime).toBeLessThan(50)

      // Should still produce valid result
      expect(mockElement.style.transform).toContain('translate(50px, 75px)')
    })

    it('should maintain performance with many common layer constants', () => {
      const { COMMON_LAYERS } = ZIndexModifier
      const layerValues = Object.values(COMMON_LAYERS)

      const iterations = 5000

      const time = measurePerformance(() => {
        const randomLayer =
          layerValues[Math.floor(Math.random() * layerValues.length)]
        const modifier = zIndex(randomLayer)
        modifier.apply({} as DOMNode, mockContext)
      }, iterations)

      expect(time).toBeLessThan(1000)

      const avgTime = time / iterations
      expect(avgTime).toBeLessThan(0.2)
    })

    it('should handle many aspect ratio constants efficiently', () => {
      const { COMMON_RATIOS } = AspectRatioModifier
      const ratioValues = Object.values(COMMON_RATIOS)
      const contentModes = ['fit', 'fill'] as const

      const iterations = 3000

      const time = measurePerformance(() => {
        const randomRatio =
          ratioValues[Math.floor(Math.random() * ratioValues.length)]
        const randomMode =
          contentModes[Math.floor(Math.random() * contentModes.length)]
        const modifier = aspectRatio(randomRatio, randomMode)
        modifier.apply({} as DOMNode, mockContext)
      }, iterations)

      expect(time).toBeLessThan(1000)

      const avgTime = time / iterations
      expect(avgTime).toBeLessThan(0.33)
    })
  })

  describe('Concurrent Operations', () => {
    it('should handle multiple modifiers operating on the same element', () => {
      const iterations = 1000

      const time = measurePerformance(() => {
        // Apply multiple modifiers to same element
        const offsetModifier = offset(Math.random() * 10, Math.random() * 10)
        const scaleModifier = scaleEffect(0.9 + Math.random() * 0.2)
        const positionModifier = position(
          Math.random() > 0.5 ? 'relative' : 'absolute'
        )
        const zIndexModifier = zIndex(Math.floor(Math.random() * 100))
        const aspectRatioModifier = aspectRatio(
          1 + Math.random(),
          Math.random() > 0.5 ? 'fit' : 'fill'
        )

        // Apply in random order
        const modifiers = [
          offsetModifier,
          scaleModifier,
          positionModifier,
          zIndexModifier,
          aspectRatioModifier,
        ]
        modifiers.sort(() => Math.random() - 0.5)

        modifiers.forEach(modifier => {
          modifier.apply({} as DOMNode, mockContext)
        })

        // Reset for next iteration
        mockElement = new MockElement()
        mockContext.element = mockElement as unknown as HTMLElement
      }, iterations)

      expect(time).toBeLessThan(2000) // Multiple modifiers per iteration

      const avgTime = time / iterations
      expect(avgTime).toBeLessThan(2)
    })
  })
})
