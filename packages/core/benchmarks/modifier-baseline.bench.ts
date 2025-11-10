/**
 * Modifier System Baseline Performance Benchmark
 *
 * Phase 0: Captures baseline performance metrics for the current modifier system
 * before implementing the new SwiftUI-compatible proxy-based approach.
 *
 * Key Metrics:
 * - Modifier application time
 * - Component creation time
 * - Memory usage (approximate via object count)
 * - Method call overhead
 * - Chaining performance
 *
 * These baselines will be used to validate that the new implementation
 * maintains or improves performance (target: <50% overhead).
 */

import { bench, describe } from 'vitest'
import { LayoutComponent } from '../src/components/wrapper'
import { LayoutModifier, AppearanceModifier, InteractionModifier } from '../src/modifiers/base'
import type { ComponentInstance } from '../src/runtime/types'
import { JSDOM } from 'jsdom'

// Set up DOM environment
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>')
global.document = dom.window.document as any
global.window = dom.window as any
global.HTMLElement = dom.window.HTMLElement as any
global.Element = dom.window.Element as any

// Helper to create a simple test component
function createTestComponent(id: string = 'test'): ComponentInstance {
  return {
    type: 'component',
    id,
    props: {},
    mounted: false,
    cleanup: [],
    render() {
      return [{
        type: 'element' as const,
        tag: 'div',
        props: { className: 'test' },
        children: []
      }]
    }
  }
}

// Helper to create DOM element for modifier testing
function createElement(): HTMLElement {
  return document.createElement('div')
}

describe('Modifier Baseline Performance', () => {

  describe('Single Modifier Application', () => {
    bench('Layout modifier - padding', () => {
      const modifier = new LayoutModifier({ padding: 16 })
      const element = createElement()
      const node = {
        type: 'element' as const,
        tag: 'div',
        props: {},
        children: [],
        element
      }
      const context = {
        componentId: 'test',
        element,
        modifiers: [modifier]
      }

      modifier.apply(node, context)
    })

    bench('Layout modifier - frame', () => {
      const modifier = new LayoutModifier({
        frame: { width: 100, height: 100 }
      })
      const element = createElement()
      const node = {
        type: 'element' as const,
        tag: 'div',
        props: {},
        children: [],
        element
      }
      const context = {
        componentId: 'test',
        element,
        modifiers: [modifier]
      }

      modifier.apply(node, context)
    })

    bench('Appearance modifier - color', () => {
      const modifier = new AppearanceModifier({
        foregroundColor: 'red',
        backgroundColor: 'blue'
      })
      const element = createElement()
      const node = {
        type: 'element' as const,
        tag: 'div',
        props: {},
        children: [],
        element
      }
      const context = {
        componentId: 'test',
        element,
        modifiers: [modifier]
      }

      modifier.apply(node, context)
    })

    bench('Appearance modifier - border', () => {
      const modifier = new AppearanceModifier({
        border: { width: 2, color: 'black', style: 'solid' },
        cornerRadius: 8
      })
      const element = createElement()
      const node = {
        type: 'element' as const,
        tag: 'div',
        props: {},
        children: [],
        element
      }
      const context = {
        componentId: 'test',
        element,
        modifiers: [modifier]
      }

      modifier.apply(node, context)
    })

    bench('Interaction modifier - event handlers', () => {
      const modifier = new InteractionModifier({
        onTap: () => {},
        onHover: () => {}
      })
      const element = createElement()
      const node = {
        type: 'element' as const,
        tag: 'div',
        props: {},
        children: [],
        element
      }
      const context = {
        componentId: 'test',
        element,
        modifiers: [modifier]
      }

      modifier.apply(node, context)
    })
  })

  describe('Multiple Modifier Application', () => {
    bench('Apply 3 modifiers sequentially', () => {
      const element = createElement()
      const node = {
        type: 'element' as const,
        tag: 'div',
        props: {},
        children: [],
        element
      }

      const modifiers = [
        new LayoutModifier({ padding: 16 }),
        new AppearanceModifier({ foregroundColor: 'red' }),
        new InteractionModifier({ onTap: () => {} })
      ]

      modifiers.forEach(modifier => {
        const context = {
          componentId: 'test',
          element,
          modifiers
        }
        modifier.apply(node, context)
      })
    })

    bench('Apply 5 modifiers sequentially', () => {
      const element = createElement()
      const node = {
        type: 'element' as const,
        tag: 'div',
        props: {},
        children: [],
        element
      }

      const modifiers = [
        new LayoutModifier({ padding: 16 }),
        new LayoutModifier({ frame: { width: 100, height: 100 } }),
        new AppearanceModifier({ foregroundColor: 'red' }),
        new AppearanceModifier({ border: { width: 2, color: 'black' } }),
        new InteractionModifier({ onTap: () => {} })
      ]

      modifiers.forEach(modifier => {
        const context = {
          componentId: 'test',
          element,
          modifiers
        }
        modifier.apply(node, context)
      })
    })

    bench('Apply 10 modifiers sequentially', () => {
      const element = createElement()
      const node = {
        type: 'element' as const,
        tag: 'div',
        props: {},
        children: [],
        element
      }

      const modifiers = [
        new LayoutModifier({ padding: 16 }),
        new LayoutModifier({ frame: { width: 100, height: 100 } }),
        new LayoutModifier({ margin: 8 }),
        new AppearanceModifier({ foregroundColor: 'red' }),
        new AppearanceModifier({ backgroundColor: 'blue' }),
        new AppearanceModifier({ border: { width: 2, color: 'black' } }),
        new AppearanceModifier({ cornerRadius: 8 }),
        new AppearanceModifier({ opacity: 0.8 }),
        new InteractionModifier({ onTap: () => {} }),
        new InteractionModifier({ onHover: () => {} })
      ]

      modifiers.forEach(modifier => {
        const context = {
          componentId: 'test',
          element,
          modifiers
        }
        modifier.apply(node, context)
      })
    })
  })

  describe('Component Creation', () => {
    bench('Create simple component (no modifiers)', () => {
      createTestComponent()
    })

    bench('Create component with render', () => {
      const component = createTestComponent()
      component.render()
    })

    bench('Create VStack with 3 children', () => {
      const children = [
        createTestComponent('child-1'),
        createTestComponent('child-2'),
        createTestComponent('child-3')
      ]

      new LayoutComponent({}, 'vstack', children, {
        spacing: 8,
        alignment: 'center'
      })
    })

    bench('Create VStack with 10 children', () => {
      const children = Array.from({ length: 10 }, (_, i) =>
        createTestComponent(`child-${i}`)
      )

      new LayoutComponent({}, 'vstack', children, {
        spacing: 8,
        alignment: 'center'
      })
    })
  })

  describe('Modifier Object Creation', () => {
    bench('Create LayoutModifier', () => {
      new LayoutModifier({ padding: 16 })
    })

    bench('Create AppearanceModifier', () => {
      new AppearanceModifier({ foregroundColor: 'red' })
    })

    bench('Create InteractionModifier', () => {
      new InteractionModifier({ onTap: () => {} })
    })

    bench('Create 10 modifiers', () => {
      for (let i = 0; i < 10; i++) {
        new LayoutModifier({ padding: i })
      }
    })
  })

  describe('Memory Characteristics', () => {
    bench('Create 100 components (memory pressure)', () => {
      const components = []
      for (let i = 0; i < 100; i++) {
        components.push(createTestComponent(`component-${i}`))
      }
      // Components stored in array to measure object creation overhead
      return components.length
    })

    bench('Create 100 modifiers (memory pressure)', () => {
      const modifiers = []
      for (let i = 0; i < 100; i++) {
        modifiers.push(new LayoutModifier({ padding: i }))
      }
      // Modifiers stored in array to measure object creation overhead
      return modifiers.length
    })

    bench('Create 100 DOM elements (memory pressure)', () => {
      const elements = []
      for (let i = 0; i < 100; i++) {
        elements.push(createElement())
      }
      // Elements stored in array to measure object creation overhead
      return elements.length
    })
  })

  describe('Complex Scenarios', () => {
    bench('VStack with 5 children + 3 modifiers each', () => {
      const children = Array.from({ length: 5 }, (_, i) =>
        createTestComponent(`child-${i}`)
      )

      const vstack = new LayoutComponent({}, 'vstack', children, {
        spacing: 8,
        alignment: 'center'
      })

      // Simulate applying modifiers to each child
      children.forEach(() => {
        const element = createElement()
        const node = {
          type: 'element' as const,
          tag: 'div',
          props: {},
          children: [],
          element
        }

        const modifiers = [
          new LayoutModifier({ padding: 16 }),
          new AppearanceModifier({ foregroundColor: 'red' }),
          new InteractionModifier({ onTap: () => {} })
        ]

        modifiers.forEach(modifier => {
          const context = {
            componentId: 'test',
            element,
            modifiers
          }
          modifier.apply(node, context)
        })
      })

      return vstack
    })

    bench('Deep nesting: VStack > HStack > Components (3 levels)', () => {
      const innerComponents = Array.from({ length: 3 }, (_, i) =>
        createTestComponent(`inner-${i}`)
      )

      const hstack = new LayoutComponent({}, 'hstack', innerComponents, {
        spacing: 4,
        alignment: 'center'
      })

      const vstack = new LayoutComponent({}, 'vstack', [hstack as any], {
        spacing: 8,
        alignment: 'center'
      })

      return vstack
    })
  })

  describe('Worst Case Scenarios', () => {
    bench('20 modifiers on single element', () => {
      const element = createElement()
      const node = {
        type: 'element' as const,
        tag: 'div',
        props: {},
        children: [],
        element
      }

      const modifiers = []
      for (let i = 0; i < 20; i++) {
        modifiers.push(
          i % 3 === 0 ? new LayoutModifier({ padding: i }) :
          i % 3 === 1 ? new AppearanceModifier({ opacity: i / 20 }) :
          new InteractionModifier({ onTap: () => {} })
        )
      }

      modifiers.forEach(modifier => {
        const context = {
          componentId: 'test',
          element,
          modifiers
        }
        modifier.apply(node, context)
      })
    })

    bench('VStack with 20 children, each with 5 modifiers', () => {
      const children = Array.from({ length: 20 }, (_, i) =>
        createTestComponent(`child-${i}`)
      )

      const vstack = new LayoutComponent({}, 'vstack', children, {
        spacing: 8,
        alignment: 'center'
      })

      // Apply 5 modifiers to each child
      children.forEach(() => {
        const element = createElement()
        const node = {
          type: 'element' as const,
          tag: 'div',
          props: {},
          children: [],
          element
        }

        const modifiers = [
          new LayoutModifier({ padding: 16 }),
          new LayoutModifier({ frame: { width: 100, height: 100 } }),
          new AppearanceModifier({ foregroundColor: 'red' }),
          new AppearanceModifier({ border: { width: 2, color: 'black' } }),
          new InteractionModifier({ onTap: () => {} })
        ]

        modifiers.forEach(modifier => {
          const context = {
            componentId: 'test',
            element,
            modifiers
          }
          modifier.apply(node, context)
        })
      })

      return vstack
    })
  })
})

// Export baseline information
export const BASELINE_INFO = {
  date: new Date().toISOString(),
  version: '0.8.1-alpha',
  purpose: 'Pre-SwiftUI-Enhancement Baseline',
  metrics: [
    'Single modifier application time',
    'Multiple modifier application time',
    'Component creation overhead',
    'Modifier object creation overhead',
    'Memory pressure characteristics',
    'Complex scenario performance',
    'Worst case scenario performance'
  ],
  notes: [
    'Current implementation uses class-based modifiers',
    'Modifiers have explicit apply() method calls',
    'No proxy overhead in current system',
    'Direct method calls throughout'
  ]
}
