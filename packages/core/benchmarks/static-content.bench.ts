/**
 * Static Content Optimization Benchmarks
 *
 * Measures performance improvements from static content optimization
 * compared to always creating reactive infrastructure.
 */

import { bench } from 'vitest'
import { EnhancedText, Text } from '../src/components/Text'
import { createSignal } from '../src/reactive'

describe('Static Content Performance Benchmarks', () => {
  bench('Static Text Components (Optimized)', () => {
    // Create 1000 static text components - should skip reactive infrastructure
    for (let i = 0; i < 1000; i++) {
      new EnhancedText({ content: `Static text ${i}` })
    }
  })

  bench('Dynamic Text Components (Full Reactive)', () => {
    // Create 1000 dynamic text components - needs full reactive infrastructure
    for (let i = 0; i < 1000; i++) {
      new EnhancedText({ content: () => `Dynamic text ${i}` })
    }
  })

  bench('Signal Text Components (Reactive)', () => {
    // Create 1000 signal-based text components
    for (let i = 0; i < 1000; i++) {
      const [content] = createSignal(`Signal text ${i}`)
      new EnhancedText({ content })
    }
  })

  bench('Mixed Static/Reactive Components (Realistic)', () => {
    // Realistic mix: 70% static, 30% reactive
    for (let i = 0; i < 1000; i++) {
      if (i % 10 < 7) {
        // 70% static content
        new EnhancedText({ content: `Static header ${i}` })
      } else {
        // 30% reactive content
        new EnhancedText({ content: () => `Dynamic content ${i}` })
      }
    }
  })

  bench('Text Factory Function - Static', () => {
    // Test the factory function performance for static content
    for (let i = 0; i < 1000; i++) {
      Text(`Static header ${i}`)
    }
  })

  bench('Text Factory Function - Dynamic', () => {
    // Test the factory function performance for dynamic content
    for (let i = 0; i < 1000; i++) {
      Text(() => `Dynamic content ${i}`)
    }
  })

  bench('Rendering Static Content', () => {
    // Test rendering performance for static components
    const components = []
    for (let i = 0; i < 100; i++) {
      components.push(new EnhancedText({ content: `Static text ${i}` }))
    }

    // Render all components
    for (const component of components) {
      component.render()
    }
  })

  bench('Rendering Dynamic Content', () => {
    // Test rendering performance for dynamic components
    const components = []
    for (let i = 0; i < 100; i++) {
      components.push(new EnhancedText({ content: () => `Dynamic text ${i}` }))
    }

    // Render all components
    for (const component of components) {
      component.render()
    }
  })

  bench('Memory Allocation: Static Components', () => {
    // Test memory usage patterns for static components
    const components = []
    for (let i = 0; i < 500; i++) {
      components.push(
        new EnhancedText({
          content: 'Static content',
          color: 'black',
          textAlign: 'left',
        })
      )
    }

    // Force garbage collection point
    components.length = 0
  })

  bench('Memory Allocation: Reactive Components', () => {
    // Test memory usage patterns for reactive components
    const components = []
    for (let i = 0; i < 500; i++) {
      const [content] = createSignal('Reactive content')
      components.push(
        new EnhancedText({
          content,
          color: 'black',
          textAlign: 'left',
        })
      )
    }

    // Cleanup reactive components
    for (const component of components) {
      component.cleanup.forEach((cleanup) => cleanup())
    }
    components.length = 0
  })
})
