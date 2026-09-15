/**
 * Overlay Modifier Stress Tests
 *
 * Performance and stress tests for overlay modifier to ensure it can handle
 * high-volume DOM manipulation and complex overlay scenarios.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createRoot } from '@tachui/core/reactive'
import { h, text as textNode } from '@tachui/core/runtime'
import { overlay, type OverlayAlignment } from '../../src/layout/overlay'
import type { ModifierContext, ModifierResult } from '../../src/types'
import type { DOMNode } from '@tachui/core/runtime/types'

// Mock component factory
//
// `render()` returns DOMNode *descriptions*, the way the framework actually
// produces them, so the overlay materializes them through the renderer (#302).
// The older shape here returned a node with no `type` and the renderer threw on
// every one of these tests; nothing noticed, because the tier never ran (#229).
const createMockComponent = (id: string) => ({
  type: 'component' as const,
  id,
  props: {},
  render: vi.fn(() => h('span', { class: 'overlay-content' }, textNode(id))),
})

describe('Overlay Modifier Stress Tests', () => {
  let baseContext: ModifierContext

  beforeEach(() => {
    baseContext = {
      componentId: 'stress-test-component',
      element: document.createElement('div'),
      phase: 'creation',
    }
  })

  describe('High-Volume Overlay Creation', () => {
    it('should handle many overlay applications efficiently', () => {
      const component = createMockComponent('test-component')
      const modifier = overlay(component, 'center')
      const iterations = 1000

      const start = performance.now()

      for (let i = 0; i < iterations; i++) {
        // Use fresh element for each iteration to avoid DOM accumulation
        const freshElement = document.createElement('div')
        const context = { ...baseContext, element: freshElement }
        modifier.apply({} as DOMNode, context)
      }

      const duration = performance.now() - start

      expect(duration).toBeLessThan(4000)
      expect(component.render).toHaveBeenCalledTimes(iterations)
    })

    it('should handle multiple overlays on single element', () => {
      const overlayCount = 100
      const parentElement = document.createElement('div')
      const context = { ...baseContext, element: parentElement }

      const overlays = Array.from({ length: overlayCount }, (_, i) =>
        overlay(createMockComponent(`component-${i}`), 'center')
      )

      const start = performance.now()

      overlays.forEach(modifier => {
        modifier.apply({} as DOMNode, context)
      })

      const duration = performance.now() - start

      expect(duration).toBeLessThan(3000)
      expect(parentElement.children).toHaveLength(overlayCount)
      expect(parentElement.style.position).toBe('relative')
    })

    it('should handle all alignment types efficiently', () => {
      const alignments: OverlayAlignment[] = [
        'center',
        'top',
        'bottom',
        'leading',
        'trailing',
        'topLeading',
        'topTrailing',
        'bottomLeading',
        'bottomTrailing',
      ]

      const iterationsPerAlignment = 200

      const start = performance.now()

      alignments.forEach(alignment => {
        for (let i = 0; i < iterationsPerAlignment; i++) {
          const component = createMockComponent(`${alignment}-${i}`)
          const modifier = overlay(component, alignment)
          const freshElement = document.createElement('div')
          const context = { ...baseContext, element: freshElement }

          modifier.apply({} as DOMNode, context)
        }
      })

      const duration = performance.now() - start

      expect(duration).toBeLessThan(6000)
    })
  })

  describe('Complex Content Rendering Stress', () => {
    it('should handle complex component hierarchies', () => {
      const createComplexContent = (depth: number, width: number): DOMNode =>
        depth > 0
          ? h(
              'div',
              { class: `depth-${depth}` },
              ...Array.from({ length: width }, () =>
                createComplexContent(depth - 1, Math.min(width, 3))
              )
            )
          : h('span', null, textNode('leaf'))

      const createComplexComponent = (depth: number, width: number): any => ({
        type: 'component' as const,
        id: `complex-${depth}-${width}`,
        props: {},
        render: vi.fn(() => createComplexContent(depth, width)),
      })

      const complexComponents = Array.from(
        { length: 50 },
        () => createComplexComponent(3, 2) // 3 levels deep, 2 children per level
      )

      const start = performance.now()

      complexComponents.forEach(component => {
        const modifier = overlay(component, 'center')
        const freshElement = document.createElement('div')
        const context = { ...baseContext, element: freshElement }

        modifier.apply({} as DOMNode, context)
      })

      const duration = performance.now() - start

      expect(duration).toBeLessThan(2000)
    })

    it('should handle function content efficiently', () => {
      const contentFunctions = Array.from({ length: 1000 }, (_, i) =>
        vi.fn().mockReturnValue(createMockComponent(`func-component-${i}`))
      )

      const start = performance.now()

      contentFunctions.forEach(contentFunc => {
        const modifier = overlay(contentFunc, 'center')
        const freshElement = document.createElement('div')
        const context = { ...baseContext, element: freshElement }

        modifier.apply({} as DOMNode, context)
      })

      const duration = performance.now() - start

      expect(duration).toBeLessThan(3000)

      // Verify all functions were called
      contentFunctions.forEach(func => {
        expect(func).toHaveBeenCalledOnce()
      })
    })

    it('should handle HTMLElement content efficiently', () => {
      const htmlElements = Array.from({ length: 1000 }, () =>
        document.createElement('div')
      )

      const start = performance.now()

      htmlElements.forEach(element => {
        const modifier = overlay(element, 'center')
        const freshElement = document.createElement('div')
        const context = { ...baseContext, element: freshElement }

        modifier.apply({} as DOMNode, context)
      })

      const duration = performance.now() - start

      expect(duration).toBeLessThan(2000)
    })
  })

  describe('Memory and Resource Management', () => {
    it('should release every overlay it mounts', () => {
      // This used to read `performance.memory`, which jsdom does not define —
      // both samples came back 0, the only assertion sat behind
      // `if (initialMemory > 0 …)`, and the test asserted nothing at all. It
      // passed for the same reason it would have passed with an empty body.
      //
      // What "released" can actually mean here is structural, so assert that
      // instead: the container leaves the host, and the element's entry leaves
      // the module's WeakMap-keyed state — which is what the teardown does.
      const overlayCount = 5000
      const hosts: HTMLElement[] = []
      const teardowns: (() => void)[] = []

      const disposeRoot = createRoot(dispose => {
        for (let i = 0; i < overlayCount; i++) {
          const host = document.createElement('div')
          const result = overlay(
            createMockComponent(`mem-test-${i}`),
            'center'
          ).apply({} as DOMNode, { ...baseContext, element: host }) as
            | ModifierResult
            | undefined

          hosts.push(host)
          // A first mount on a fresh element always hands its teardown back.
          expect(result?.cleanup).toHaveLength(1)
          teardowns.push(...(result!.cleanup as (() => void)[]))
        }

        return dispose
      })

      expect(hosts.every(host => host.children.length === 1)).toBe(true)

      teardowns.forEach(teardown => teardown())

      expect(hosts.every(host => host.children.length === 0)).toBe(true)

      // Idempotent: the owner disposing after an explicit teardown must not
      // throw or re-run what already ran.
      expect(() => disposeRoot()).not.toThrow()
      expect(hosts.every(host => host.children.length === 0)).toBe(true)
    })

    it('releases mounted overlays when the owner is disposed', () => {
      // The other half of the same claim: nothing calls the teardown, the
      // reactive owner just goes away. Small n — this one is about the path,
      // not the volume.
      const hosts = Array.from({ length: 50 }, () =>
        document.createElement('div')
      )

      const disposeRoot = createRoot(dispose => {
        hosts.forEach((host, i) => {
          overlay(createMockComponent(`owner-${i}`), 'center').apply(
            {} as DOMNode,
            { ...baseContext, element: host }
          )
        })

        return dispose
      })

      expect(hosts.every(host => host.children.length === 1)).toBe(true)

      disposeRoot()

      expect(hosts.every(host => host.children.length === 0)).toBe(true)
    })

    it('should handle DOM tree cleanup efficiently', () => {
      const parentElement = document.createElement('div')
      const context = { ...baseContext, element: parentElement }

      // Add many overlays
      for (let i = 0; i < 500; i++) {
        const component = createMockComponent(`cleanup-${i}`)
        const modifier = overlay(component, 'center')
        modifier.apply({} as DOMNode, context)
      }

      expect(parentElement.children).toHaveLength(500)

      // Simulate cleanup by removing children
      const start = performance.now()

      while (parentElement.children.length > 0) {
        parentElement.removeChild(parentElement.children[0])
      }

      const duration = performance.now() - start

      expect(duration).toBeLessThan(1000)
      expect(parentElement.children).toHaveLength(0)
    })
  })

  describe('Error Handling Under Stress', () => {
    it(
      'should handle many invalid content types gracefully',
      () => {
        const invalidContents = [
          null,
          undefined,
          {},
          { render: null },
          { render: 'not-a-function' },
          'string-content',
          42,
          [],
        ]

        const iterations = 500

        const start = performance.now()

        for (let i = 0; i < iterations; i++) {
          invalidContents.forEach(content => {
            const modifier = overlay(content, 'center')
            const freshElement = document.createElement('div')
            const context = { ...baseContext, element: freshElement }

            expect(() => {
              modifier.apply({} as DOMNode, context)
            }).not.toThrow()
          })
        }

        const duration = performance.now() - start

        expect(duration).toBeLessThan(6000) // Allow extra headroom for proxy instrumentation
      }
    )

    it(
      'should handle missing elements gracefully at scale',
      () => {
        const component = createMockComponent('missing-element-test')
        const modifier = overlay(component, 'center')
        const iterations = 2000

        const invalidContexts = [
          { ...baseContext, element: undefined },
          { ...baseContext, element: null },
          { ...baseContext, element: { nodeType: 3 } as any }, // Text node
        ]

        const start = performance.now()

        for (let i = 0; i < iterations; i++) {
          const context = invalidContexts[i % invalidContexts.length]

          expect(() => {
            modifier.apply({} as DOMNode, context)
          }).not.toThrow()
        }

        const duration = performance.now() - start

        expect(duration).toBeLessThan(2000)
      }
    )

    it('should handle invalid alignments at scale', () => {
      const component = createMockComponent('invalid-alignment-test')
      const invalidAlignments = [
        'invalid',
        '',
        'topCenter',
        'middleLeft',
        'corner',
      ] as any[]
      const iterations = 1000

      const start = performance.now()

      for (let i = 0; i < iterations; i++) {
        const alignment = invalidAlignments[i % invalidAlignments.length]
        const modifier = overlay(component, alignment)
        const freshElement = document.createElement('div')
        const context = { ...baseContext, element: freshElement }

        modifier.apply({} as DOMNode, context)

        // Should default to center alignment
        const overlayContainer = freshElement.children[0]
        expect(overlayContainer.style.justifyItems).toBe('center')
        expect(overlayContainer.style.alignItems).toBe('center')
      }

      const duration = performance.now() - start

      expect(duration).toBeLessThan(3000)
    })
  })

  describe('Real-World Usage Patterns', () => {
    it('should handle typical modal/tooltip patterns', () => {
      // Simulate modals, tooltips, and popovers
      const usagePatterns = [
        { type: 'modal', alignment: 'center' as const, count: 50 },
        { type: 'tooltip', alignment: 'top' as const, count: 200 },
        { type: 'popover', alignment: 'bottom' as const, count: 100 },
        { type: 'badge', alignment: 'topTrailing' as const, count: 300 },
        { type: 'notification', alignment: 'topLeading' as const, count: 150 },
      ]

      const start = performance.now()

      usagePatterns.forEach(({ type, alignment, count }) => {
        for (let i = 0; i < count; i++) {
          const component = createMockComponent(`${type}-${i}`)
          const modifier = overlay(component, alignment)
          const freshElement = document.createElement('div')
          const context = { ...baseContext, element: freshElement }

          modifier.apply({} as DOMNode, context)
        }
      })

      const duration = performance.now() - start

      expect(duration).toBeLessThan(4000)
    })

    it('should handle dynamic overlay updates', () => {
      const parentElement = document.createElement('div')
      const context = { ...baseContext, element: parentElement }
      const component = createMockComponent('dynamic-test')

      const alignments: OverlayAlignment[] = [
        'center',
        'top',
        'bottom',
        'leading',
        'trailing',
      ]

      const updateCycles = 200

      const start = performance.now()

      for (let cycle = 0; cycle < updateCycles; cycle++) {
        // Clear existing overlays (simulate removal)
        parentElement.replaceChildren()

        // Apply new overlay with different alignment
        const alignment = alignments[cycle % alignments.length]
        const modifier = overlay(component, alignment)
        modifier.apply({} as DOMNode, context)
      }

      const duration = performance.now() - start

      expect(duration).toBeLessThan(2000)
      expect(parentElement.children).toHaveLength(1)
    })

    it('should handle nested overlay scenarios', () => {
      // Overlay within overlay: each level mounts its container into the
      // container the level above it created, so the nesting is real rather
      // than five independent applications.
      const applyNested = (root: Element, depth: number) => {
        let host = root

        for (let level = depth; level > 0; level--) {
          overlay(createMockComponent(`nested-${level}`), 'center').apply(
            {} as DOMNode,
            { ...baseContext, element: host }
          )

          const container = host.lastElementChild
          expect(container).not.toBeNull()
          host = container!
        }
      }

      const nestedDepth = 5
      const nestedCount = 20

      const start = performance.now()

      for (let i = 0; i < nestedCount; i++) {
        applyNested(document.createElement('div'), nestedDepth)
      }

      const duration = performance.now() - start

      expect(duration).toBeLessThan(3000)
    })
  })
})
