/**
 * Performance Benchmarking Test Suite
 * 
 * Measures and validates performance characteristics of CSS Features
 * across different scenarios and scales.
 */

import { describe, test, expect, beforeEach } from 'vitest'
// Transform system
import {
  transform,
  scale,
  rotate,
  translate,
  skew,
  // Advanced transforms  
  matrix,
  matrix3d,
  rotate3d,
  scale3d,
  translate3d,
} from '../../src/modifiers/transformations'

// CSS filters
import {
  filter,
  blur,
  brightness,
  contrast,
  saturate,
  grayscale,
  sepia,
} from '../../src/modifiers/filters'

// Background clip text
import {
  gradientText,
  backgroundClip,
  backgroundImage,
} from '../../src/modifiers/text'

// Pseudo-elements
import {
  before,
  after,
  pseudoElements,
} from '../../src/modifiers/elements'

// Custom properties
import {
  customProperties,
  customProperty,
  cssVariables,
  themeColors,
  designTokens,
} from '../../src/modifiers/attributes'

// Hover effects
import {
  hoverEffect,
  hover,
  hoverWithTransition,
} from '../../src/modifiers/effects'

// Transitions
import {
  transition,
  transitions,
} from '../../src/modifiers/transitions'
import { createMockElement, createMockModifierContext } from './test-utils'

// Performance test utilities
interface PerformanceMetrics {
  averageTime: number
  minTime: number
  maxTime: number
  operationsPerSecond: number
  totalOperations: number
}

function measurePerformance(
  operation: () => void,
  iterations: number = 1000
): PerformanceMetrics {
  const times: number[] = []
  
  // Warm up (exclude from measurements)
  for (let i = 0; i < 10; i++) {
    operation()
  }
  
  // Actual measurements
  for (let i = 0; i < iterations; i++) {
    const start = performance.now()
    operation()
    const end = performance.now()
    times.push(end - start)
  }
  
  const totalTime = times.reduce((sum, time) => sum + time, 0)
  const averageTime = totalTime / iterations
  const minTime = Math.min(...times)
  const maxTime = Math.max(...times)
  const operationsPerSecond = 1000 / averageTime
  
  return {
    averageTime,
    minTime,
    maxTime,
    operationsPerSecond,
    totalOperations: iterations
  }
}

describe('CSS Features Performance Benchmarks', () => {
  let mockElement: HTMLElement
  let mockContext: ReturnType<typeof createMockModifierContext>

  beforeEach(() => {
    mockElement = createMockElement()
    mockContext = createMockModifierContext(mockElement)
  })

  describe('Transform System Performance', () => {
    test('2D transform operations should be fast', () => {
      const metrics = measurePerformance(() => {
        const element = createMockElement()
        const context = createMockModifierContext(element)
        
        const scaleModifier = scale(1.2)
        scaleModifier.apply(null, context)
      }, 1000)
      
      expect(metrics.averageTime).toBeLessThan(1) // Less than 1ms average
      expect(metrics.operationsPerSecond).toBeGreaterThan(1000) // More than 1000 ops/sec
      
      console.log('2D Transform Performance:', {
        averageTime: `${metrics.averageTime.toFixed(3)}ms`,
        opsPerSec: Math.round(metrics.operationsPerSecond),
        totalOps: metrics.totalOperations
      })
    })

    test('3D transform operations should be efficient', () => {
      const metrics = measurePerformance(() => {
        const element = createMockElement()
        const context = createMockModifierContext(element)
        
        const matrix3dModifier = matrix3d([
          1, 0, 0, 0,
          0, 1, 0, 0,
          0, 0, 1, 0,
          10, 20, 5, 1
        ])
        matrix3dModifier.apply(null, context)
      }, 500)
      
      expect(metrics.averageTime).toBeLessThan(2) // Less than 2ms average
      expect(metrics.operationsPerSecond).toBeGreaterThan(500) // More than 500 ops/sec
      
      console.log('3D Transform Performance:', {
        averageTime: `${metrics.averageTime.toFixed(3)}ms`,
        opsPerSec: Math.round(metrics.operationsPerSecond),
        totalOps: metrics.totalOperations
      })
    })

    test('complex transform combinations should remain performant', () => {
      const metrics = measurePerformance(() => {
        const element = createMockElement()
        const context = createMockModifierContext(element)
        
        const complexTransform = transform({
          perspective: 1000,
          scale: 1.2,
          rotate: '45deg',
          translate: { x: 10, y: 20, z: 5 },
          rotateX: '30deg',
          rotateY: '15deg'
        })
        complexTransform.apply(null, context)
      }, 500)
      
      expect(metrics.averageTime).toBeLessThan(3) // Less than 3ms average
      expect(metrics.operationsPerSecond).toBeGreaterThan(300) // More than 300 ops/sec
      
      console.log('Complex Transform Performance:', {
        averageTime: `${metrics.averageTime.toFixed(3)}ms`,
        opsPerSec: Math.round(metrics.operationsPerSecond),
        totalOps: metrics.totalOperations
      })
    })
  })

  describe('Filter System Performance', () => {
    // NOTE: Backdrop filter performance tests moved to backdrop.test.ts or separate performance tests
    test('CSS filter operations should be efficient', () => {
      const metrics = measurePerformance(() => {
        const element = createMockElement()
        const context = createMockModifierContext(element)
        
        const filterModifier = filter({
          blur: 10,
          brightness: 1.2,
          saturate: 1.5
        })
        filterModifier.apply(null, context)
      }, 500)
      
      expect(metrics.averageTime).toBeLessThan(2) // Less than 2ms average
      expect(metrics.operationsPerSecond).toBeGreaterThan(500) // More than 500 ops/sec
      
      console.log('Backdrop Filter Performance:', {
        averageTime: `${metrics.averageTime.toFixed(3)}ms`,
        opsPerSec: Math.round(metrics.operationsPerSecond),
        totalOps: metrics.totalOperations
      })
    })

    test('CSS filter operations should be fast', () => {
      const metrics = measurePerformance(() => {
        const element = createMockElement()
        const context = createMockModifierContext(element)
        
        const filterModifier = filter({
          blur: 5,
          brightness: 1.1,
          contrast: 1.2,
          saturate: 1.3,
          sepia: 0.2,
          hueRotate: '90deg'
        })
        filterModifier.apply(null, context)
      }, 500)
      
      expect(metrics.averageTime).toBeLessThan(2) // Less than 2ms average
      
      console.log('CSS Filter Performance:', {
        averageTime: `${metrics.averageTime.toFixed(3)}ms`,
        opsPerSec: Math.round(metrics.operationsPerSecond),
        totalOps: metrics.totalOperations
      })
    })
  })

  describe('Background Clip Text Performance', () => {
    test('gradient text operations should be fast', () => {
      const metrics = measurePerformance(() => {
        const element = createMockElement()
        const context = createMockModifierContext(element)
        
        const gradientModifier = gradientText('linear-gradient(45deg, #007AFF, #FF3B30, #34C759)')
        gradientModifier.apply(null, context)
      }, 1000)
      
      expect(metrics.averageTime).toBeLessThan(1) // Less than 1ms average
      expect(metrics.operationsPerSecond).toBeGreaterThan(1000) // More than 1000 ops/sec
      
      console.log('Gradient Text Performance:', {
        averageTime: `${metrics.averageTime.toFixed(3)}ms`,
        opsPerSec: Math.round(metrics.operationsPerSecond),
        totalOps: metrics.totalOperations
      })
    })
  })

  describe('Pseudo-elements Performance', () => {
    test('pseudo-element creation should be efficient', () => {
      // Mock CSS injection for pseudo-element tests
      const mockStyleSheet = { insertRule: () => {} }
      const mockStyle = { id: '', sheet: mockStyleSheet }
      
      global.document = {
        ...global.document,
        createElement: (tagName: string) => {
          if (tagName === 'style') return mockStyle as any
          return document.createElement(tagName)
        },
        head: {
          ...global.document?.head,
          appendChild: () => null
        },
        getElementById: (id: string) => {
          if (id === 'tachui-pseudo-elements') return mockStyle as any
          return null
        }
      } as any
      
      const metrics = measurePerformance(() => {
        const element = createMockElement()
        const context = createMockModifierContext(element)
        
        const beforeModifier = before({
          content: '★',
          color: '#FFD60A',
          marginRight: 5,
          position: 'absolute',
          top: 0,
          left: 0
        })
        beforeModifier.apply(null, context)
      }, 200)
      
      expect(metrics.averageTime).toBeLessThan(5) // Less than 5ms average
      
      console.log('Pseudo-element Performance:', {
        averageTime: `${metrics.averageTime.toFixed(3)}ms`,
        opsPerSec: Math.round(metrics.operationsPerSecond),
        totalOps: metrics.totalOperations
      })
    })
  })

  describe('CSS Custom Properties Performance', () => {
    test('custom property operations should be fast', () => {
      const metrics = measurePerformance(() => {
        const element = createMockElement()
        const context = createMockModifierContext(element)
        
        const customPropModifier = customProperty('primary-color', '#007AFF')
        customPropModifier.apply(null, context)
      }, 1000)
      
      expect(metrics.averageTime).toBeLessThan(1) // Less than 1ms average
      expect(metrics.operationsPerSecond).toBeGreaterThan(1000) // More than 1000 ops/sec
      
      console.log('Custom Property Performance:', {
        averageTime: `${metrics.averageTime.toFixed(3)}ms`,
        opsPerSec: Math.round(metrics.operationsPerSecond),
        totalOps: metrics.totalOperations
      })
    })

    test('theme color systems should be efficient', () => {
      const metrics = measurePerformance(() => {
        const element = createMockElement()
        const context = createMockModifierContext(element)
        
        const themeModifier = themeColors({
          primary: '#007AFF',
          secondary: '#5856D6',
          success: '#34C759',
          warning: '#FF9500',
          danger: '#FF3B30'
        })
        themeModifier.apply(null, context)
      }, 500)
      
      expect(metrics.averageTime).toBeLessThan(3) // Less than 3ms average
      
      console.log('Theme Colors Performance:', {
        averageTime: `${metrics.averageTime.toFixed(3)}ms`,
        opsPerSec: Math.round(metrics.operationsPerSecond),
        totalOps: metrics.totalOperations
      })
    })
  })

  describe('Hover Effects Performance', () => {
    test('hover effect operations should be fast', () => {
      const metrics = measurePerformance(() => {
        const element = createMockElement()
        const context = createMockModifierContext(element)
        
        const hoverModifier = hoverEffect('lift')
        hoverModifier.apply(null, context)
      }, 1000)
      
      expect(metrics.averageTime).toBeLessThan(1) // Less than 1ms average
      expect(metrics.operationsPerSecond).toBeGreaterThan(1000) // More than 1000 ops/sec
      
      console.log('Hover Effect Performance:', {
        averageTime: `${metrics.averageTime.toFixed(3)}ms`,
        opsPerSec: Math.round(metrics.operationsPerSecond),
        totalOps: metrics.totalOperations
      })
    })
  })

  describe('Transition System Performance', () => {
    test('transition operations should be efficient', () => {
      const metrics = measurePerformance(() => {
        const element = createMockElement()
        const context = createMockModifierContext(element)
        
        const transitionModifier = transitions({
          backgroundColor: { duration: 200, easing: 'ease-out' },
          transform: { duration: 300, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', delay: 50 },
          opacity: { duration: 150, easing: 'ease-in-out' }
        })
        transitionModifier.apply(null, context)
      }, 500)
      
      expect(metrics.averageTime).toBeLessThan(2) // Less than 2ms average
      
      console.log('Transition Performance:', {
        averageTime: `${metrics.averageTime.toFixed(3)}ms`,
        opsPerSec: Math.round(metrics.operationsPerSecond),
        totalOps: metrics.totalOperations
      })
    })
  })

  describe('Scale Performance Tests', () => {
    test('should handle large-scale modifier applications efficiently', () => {
      const startTime = performance.now()
      
      // Simulate applying modifiers to 1000 elements
      for (let i = 0; i < 1000; i++) {
        const element = createMockElement()
        const context = createMockModifierContext(element)
        
        // Apply a combination of modifiers
        transform({ scale: 1.05, rotate: '2deg' }).apply(null, context)
        gradientText('linear-gradient(45deg, #007AFF, #FF3B30)').apply(null, context)
        customProperty('index', i.toString()).apply(null, context)
      }
      
      const endTime = performance.now()
      const totalTime = endTime - startTime
      const averageTimePerElement = totalTime / 1000
      
      expect(totalTime).toBeLessThan(500) // Less than 500ms total for 1000 elements
      expect(averageTimePerElement).toBeLessThan(0.5) // Less than 0.5ms per element
      
      console.log('Large Scale Performance:', {
        totalTime: `${totalTime.toFixed(2)}ms`,
        averagePerElement: `${averageTimePerElement.toFixed(3)}ms`,
        elementsPerSecond: Math.round(1000 / (totalTime / 1000))
      })
    })

    test('should maintain performance under memory pressure', () => {
      // Create a large number of modifiers to simulate memory pressure
      const modifiers = []
      
      for (let i = 0; i < 100; i++) {
        modifiers.push(
          scale(1 + i * 0.01),
          rotate(`${i}deg`),
          gradientText(`linear-gradient(${i}deg, #007AFF, #FF3B30)`),
          customProperty(`var-${i}`, `value-${i}`)
        )
      }
      
      const startTime = performance.now()
      
      // Apply all modifiers
      modifiers.forEach(modifier => {
        const element = createMockElement()
        const context = createMockModifierContext(element)
        modifier.apply(null, context)
      })
      
      const endTime = performance.now()
      const totalTime = endTime - startTime
      const averageTime = totalTime / modifiers.length
      
      expect(totalTime).toBeLessThan(200) // Less than 200ms total
      expect(averageTime).toBeLessThan(2) // Less than 2ms per modifier
      
      console.log('Memory Pressure Performance:', {
        totalModifiers: modifiers.length,
        totalTime: `${totalTime.toFixed(2)}ms`,
        averageTime: `${averageTime.toFixed(3)}ms`
      })
    })
  })

  describe('CSS Generation Efficiency', () => {
    test('CSS string generation should be optimized', () => {
      const complexTransform = transform({
        perspective: 1000,
        scale: 1.2,
        rotate: '45deg',
        translate: { x: 10, y: 20, z: 5 },
        rotateX: '30deg',
        rotateY: '15deg',
        skew: { x: '5deg', y: '2deg' }
      })
      
      const metrics = measurePerformance(() => {
        const element = createMockElement()
        const context = createMockModifierContext(element)
        complexTransform.apply(null, context)
      }, 500)
      
      expect(metrics.averageTime).toBeLessThan(3) // CSS generation should be fast
      
      console.log('CSS Generation Performance:', {
        averageTime: `${metrics.averageTime.toFixed(3)}ms`,
        opsPerSec: Math.round(metrics.operationsPerSecond)
      })
    })
  })

  describe('Performance Regression Prevention', () => {
    test('should establish performance baselines', () => {
      const baselines = {
        simpleTransform: 1.0, // 1ms
        complexTransform: 3.0, // 3ms
        gradientText: 1.0, // 1ms
        customProperty: 1.0, // 1ms
        hoverEffect: 1.0, // 1ms
        filter: 2.0, // 2ms
        backdropFilter: 2.0, // 2ms
      }
      
      // Test simple transform
      const simpleMetrics = measurePerformance(() => {
        const element = createMockElement()
        const context = createMockModifierContext(element)
        scale(1.2).apply(null, context)
      }, 100)
      
      expect(simpleMetrics.averageTime).toBeLessThan(baselines.simpleTransform)
      
      console.log('Performance Baselines Validated:', {
        simpleTransform: `${simpleMetrics.averageTime.toFixed(3)}ms (baseline: ${baselines.simpleTransform}ms)`
      })
    })
  })
})