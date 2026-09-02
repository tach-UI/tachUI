/**
 * Overlay Modifier Tests
 *
 * Comprehensive tests for the overlay modifier including all alignment options,
 * content rendering, DOM manipulation, and positioning calculations.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createEffect,
  createRoot,
  createSignal,
  flushSync,
} from '@tachui/core/reactive'
import { h, text as textNode } from '@tachui/core/runtime'
import {
  OverlayModifier,
  overlay,
  type OverlayAlignment,
} from '../../src/layout/overlay'
import type { ModifierContext, ModifierResult } from '../../src/types'
import type { DOMNode } from '@tachui/core/runtime/types'

let componentCounter = 0

/**
 * A component instance shaped the way the framework actually produces them:
 * `render()` returns DOMNode *descriptions* with no `element` attached yet, so
 * the overlay has to go through the renderer to materialize them (#302).
 */
const createMockComponent = (elementType = 'span') => ({
  type: 'component' as const,
  id: `mock-component-${++componentCounter}`,
  props: {},
  render: vi.fn(() =>
    h(elementType, { class: 'overlay-content' }, textNode('content'))
  ),
})

const childrenOf = (element: Element) => Array.from(element.children)

// Mock console methods
const mockConsole = {
  warn: vi.fn(),
  error: vi.fn(),
}

async function flushReactiveUpdates(): Promise<void> {
  await new Promise<void>(resolve => queueMicrotask(resolve))
}

describe('Overlay Modifier', () => {
  let mockElement: HTMLElement
  let mockContext: ModifierContext
  let mockComponent: ReturnType<typeof createMockComponent>
  let originalConsole: any

  beforeEach(() => {
    mockElement = document.createElement('div')
    mockContext = {
      componentId: 'test-component',
      element: mockElement,
      phase: 'creation',
    }
    mockComponent = createMockComponent()

    // Mock console methods
    originalConsole = {
      warn: console.warn,
      error: console.error,
    }
    console.warn = mockConsole.warn
    console.error = mockConsole.error
  })

  afterEach(() => {
    // Restore console methods
    console.warn = originalConsole.warn
    console.error = originalConsole.error

    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  describe('Constructor and Factory Function', () => {
    it('should create OverlayModifier with default center alignment', () => {
      const modifier = overlay(mockComponent)

      expect(modifier).toBeInstanceOf(OverlayModifier)
      expect(modifier.type).toBe('overlay')
      expect(modifier.priority).toBe(10)
      expect(modifier.properties.content).toBe(mockComponent)
      expect(modifier.properties.alignment).toBe('center')
    })

    it('should create OverlayModifier with custom alignment', () => {
      const modifier = overlay(mockComponent, 'topLeading')

      expect(modifier.properties.content).toBe(mockComponent)
      expect(modifier.properties.alignment).toBe('topLeading')
    })

    it('should create OverlayModifier instance directly', () => {
      const options = {
        content: mockComponent,
        alignment: 'bottom' as OverlayAlignment,
      }
      const modifier = new OverlayModifier(options)

      expect(modifier.properties.content).toBe(mockComponent)
      expect(modifier.properties.alignment).toBe('bottom')
      expect(modifier.type).toBe('overlay')
      expect(modifier.priority).toBe(10)
    })
  })

  describe('DOM Positioning Setup', () => {
    it('should set element position to relative when static', () => {
      mockElement.style.position = 'static'
      const modifier = overlay(mockComponent)

      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.position).toBe('relative')
    })

    it('should set element position to relative when empty', () => {
      mockElement.style.position = ''
      const modifier = overlay(mockComponent)

      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.style.position).toBe('relative')
    })

    it('should not change position when already positioned', () => {
      const positions = ['absolute', 'relative', 'fixed', 'sticky']

      positions.forEach(position => {
        mockElement.style.position = position
        const modifier = overlay(mockComponent)

        modifier.apply({} as DOMNode, mockContext)

        expect(mockElement.style.position).toBe(position)
      })
    })
  })

  describe('Overlay Container Creation', () => {
    it('should create overlay container with correct styles', () => {
      const modifier = overlay(mockComponent)

      modifier.apply({} as DOMNode, mockContext)

      expect(mockElement.children).toHaveLength(1)

      const overlayContainer = mockElement.children[0]
      expect(overlayContainer.style.position).toBe('absolute')
      expect(overlayContainer.style.pointerEvents).toBe('none')
    })

    it('should apply center alignment styles by default', () => {
      const modifier = overlay(mockComponent)

      modifier.apply({} as DOMNode, mockContext)

      const overlayContainer = mockElement.children[0]
      expect(overlayContainer.style.top).toBe('50%')
      expect(overlayContainer.style.left).toBe('50%')
      expect(overlayContainer.style.transform).toBe('translate(-50%, -50%)')
    })
  })

  describe('Alignment Positioning', () => {
    const alignmentTests: Array<{
      alignment: OverlayAlignment
      expectedStyles: Record<string, string>
    }> = [
      {
        alignment: 'center',
        expectedStyles: {
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        },
      },
      {
        alignment: 'top',
        expectedStyles: {
          top: '0px',
          left: '50%',
          transform: 'translateX(-50%)',
        },
      },
      {
        alignment: 'bottom',
        expectedStyles: {
          bottom: '0px',
          left: '50%',
          transform: 'translateX(-50%)',
        },
      },
      {
        alignment: 'leading',
        expectedStyles: {
          top: '50%',
          left: '0px',
          transform: 'translateY(-50%)',
        },
      },
      {
        alignment: 'trailing',
        expectedStyles: {
          top: '50%',
          right: '0px',
          transform: 'translateY(-50%)',
        },
      },
      {
        alignment: 'topLeading',
        expectedStyles: {
          top: '0px',
          left: '0px',
        },
      },
      {
        alignment: 'topTrailing',
        expectedStyles: {
          top: '0px',
          right: '0px',
        },
      },
      {
        alignment: 'bottomLeading',
        expectedStyles: {
          bottom: '0px',
          left: '0px',
        },
      },
      {
        alignment: 'bottomTrailing',
        expectedStyles: {
          bottom: '0px',
          right: '0px',
        },
      },
    ]

    alignmentTests.forEach(({ alignment, expectedStyles }) => {
      it(`should apply correct styles for ${alignment} alignment`, () => {
        const modifier = overlay(mockComponent, alignment)

        modifier.apply({} as DOMNode, mockContext)

        const overlayContainer = mockElement.children[0]

        Object.entries(expectedStyles).forEach(([property, expectedValue]) => {
          expect(overlayContainer.style[property]).toBe(expectedValue)
        })
      })
    })
  })

  describe('Content Rendering', () => {
    it('should render component instance content', () => {
      const modifier = overlay(mockComponent)

      modifier.apply({} as DOMNode, mockContext)

      expect(mockComponent.render).toHaveBeenCalled()
      expect(mockElement.children).toHaveLength(1)

      const overlayContainer = mockElement.children[0]!
      expect(overlayContainer.children).toHaveLength(1)
      expect(overlayContainer.innerHTML).toBe(
        '<span class="overlay-content">content</span>'
      )
    })

    it('should render function content', () => {
      const contentFunction = vi.fn().mockReturnValue(mockComponent)
      const modifier = overlay(contentFunction)

      modifier.apply({} as DOMNode, mockContext)

      expect(contentFunction).toHaveBeenCalled()
      expect(mockComponent.render).toHaveBeenCalled()

      const overlayContainer = mockElement.children[0]!
      expect(overlayContainer.children).toHaveLength(1)
      expect(overlayContainer.textContent).toBe('content')
    })

    it('should render an already-built component instance', () => {
      // `Text('D').modifier.build()` shape: a plain instance, no builder left.
      const built = {
        type: 'component' as const,
        id: 'built-component',
        props: {},
        render: () => h('b', null, textNode('D')),
      }
      const modifier = overlay(built)

      modifier.apply({} as DOMNode, mockContext)

      const overlayContainer = mockElement.children[0]!
      expect(overlayContainer.innerHTML).toBe('<b>D</b>')
    })

    it('should build an unbuilt modifier builder before rendering', () => {
      // `Text('D').modifier` shape: exposes build(), not render().
      const builder = {
        build: () => ({
          type: 'component' as const,
          id: 'built-from-builder',
          props: {},
          render: () => h('i', null, textNode('D')),
        }),
      }
      const modifier = overlay(builder as any)

      modifier.apply({} as DOMNode, mockContext)

      const overlayContainer = mockElement.children[0]!
      expect(overlayContainer.innerHTML).toBe('<i>D</i>')
    })

    it('should render string content as text', () => {
      const modifier = overlay('D')

      modifier.apply({} as DOMNode, mockContext)

      const overlayContainer = mockElement.children[0]!
      expect(overlayContainer.textContent).toBe('D')
    })

    it('should render numeric content as text', () => {
      const modifier = overlay(7)

      modifier.apply({} as DOMNode, mockContext)

      const overlayContainer = mockElement.children[0]!
      expect(overlayContainer.textContent).toBe('7')
    })

    it('should render signal content reactively', async () => {
      const [label, setLabel] = createSignal('D')
      const modifier = overlay(label)

      const dispose = createRoot(dispose => {
        modifier.apply({} as DOMNode, mockContext)
        return dispose
      })

      const overlayContainer = mockElement.children[0]!
      expect(overlayContainer.textContent).toBe('D')

      setLabel('E')
      flushSync()
      await flushReactiveUpdates()

      expect(overlayContainer.textContent).toBe('E')

      dispose()
    })

    it('should render HTMLElement content', () => {
      const htmlElement = document.createElement('span')
      const modifier = overlay(htmlElement)

      modifier.apply({} as DOMNode, mockContext)

      const overlayContainer = mockElement.children[0]!
      expect(childrenOf(overlayContainer)).toContain(htmlElement)
    })

    it('should handle component without render method gracefully', () => {
      const invalidComponent = { type: 'component', id: 'invalid' }
      const modifier = overlay(invalidComponent as any)

      expect(() => {
        modifier.apply({} as DOMNode, mockContext)
      }).not.toThrow()

      const overlayContainer = mockElement.children[0]!
      expect(overlayContainer.children).toHaveLength(0)
    })

    it('should handle function returning invalid component', () => {
      const contentFunction = vi.fn().mockReturnValue(null)
      const modifier = overlay(contentFunction)

      expect(() => {
        modifier.apply({} as DOMNode, mockContext)
      }).not.toThrow()

      expect(contentFunction).toHaveBeenCalled()

      const overlayContainer = mockElement.children[0]!
      expect(overlayContainer.children).toHaveLength(0)
    })

    it('should handle null and undefined content', () => {
      for (const content of [null, undefined]) {
        const element = document.createElement('div')
        const modifier = overlay(content)

        expect(() => {
          modifier.apply({} as DOMNode, { ...mockContext, element })
        }).not.toThrow()

        expect(element.children[0]!.childNodes).toHaveLength(0)
      }
    })
  })

  describe('Re-application on re-render', () => {
    // `renderSingle` applies modifiers on every render of a node, not only when
    // the element is created, so a base component that re-renders drives
    // apply() again on the same element. The pipeline's cleanup does not run
    // until unmount, so nothing removes the previous pass's overlay.
    //
    // `applyModifiersToNode` builds one ModifierContext per element render and
    // hands the same object to every modifier in that pass, so a fresh context
    // here is exactly what a re-render looks like.
    const pass = (): ModifierContext => ({
      componentId: 'test-component',
      element: mockElement,
      phase: 'update',
    })

    it('should replace its overlay rather than append another', () => {
      const modifier = overlay(mockComponent, 'bottomTrailing')

      modifier.apply({} as DOMNode, pass())
      modifier.apply({} as DOMNode, pass())
      modifier.apply({} as DOMNode, pass())

      expect(mockElement.children).toHaveLength(1)
    })

    it('should replace overlays mounted by a previous modifier instance', () => {
      // A component that builds its chain inline produces a fresh modifier
      // every render while the renderer reuses the element, so the new instance
      // has no knowledge of its predecessor. State has to live on the element.
      overlay(createMockComponent('b'), 'center').apply({} as DOMNode, pass())
      overlay(createMockComponent('i'), 'center').apply({} as DOMNode, pass())

      expect(mockElement.children).toHaveLength(1)
      expect(mockElement.children[0]!.querySelector('i')).not.toBeNull()
    })

    it('should mount every overlay applied within a single pass', () => {
      const shared = pass()
      overlay(createMockComponent('b'), 'center').apply({} as DOMNode, shared)
      overlay(createMockComponent('i'), 'bottomTrailing').apply(
        {} as DOMNode,
        shared
      )

      expect(mockElement.children).toHaveLength(2)
    })

    it('should carry sibling overlays across a re-render', () => {
      const ring = overlay(createMockComponent('b'), 'center')
      const badge = overlay(createMockComponent('i'), 'bottomTrailing')

      const first = pass()
      ring.apply({} as DOMNode, first)
      badge.apply({} as DOMNode, first)
      expect(mockElement.children).toHaveLength(2)

      const second = pass()
      ring.apply({} as DOMNode, second)
      badge.apply({} as DOMNode, second)

      expect(mockElement.children).toHaveLength(2)
      expect(mockElement.children[0]!.querySelector('b')).not.toBeNull()
      expect(mockElement.children[1]!.querySelector('i')).not.toBeNull()
    })

    it('should drop an overlay that leaves a chain which still has others', () => {
      const ring = overlay(createMockComponent('b'), 'center')
      const badge = overlay(createMockComponent('i'), 'bottomTrailing')

      const first = pass()
      ring.apply({} as DOMNode, first)
      badge.apply({} as DOMNode, first)
      expect(mockElement.children).toHaveLength(2)

      // Next pass renders the ring only — the badge is gone from the chain.
      ring.apply({} as DOMNode, pass())

      expect(mockElement.children).toHaveLength(1)
      expect(mockElement.children[0]!.querySelector('b')).not.toBeNull()
    })

    it('should track elements independently when applied to several', () => {
      const modifier = overlay(mockComponent)
      const other = document.createElement('div')

      modifier.apply({} as DOMNode, pass())
      modifier.apply({} as DOMNode, {
        componentId: 'other',
        element: other,
        phase: 'creation',
      })
      modifier.apply({} as DOMNode, pass())

      // Re-applying to one element must not tear down the other's overlay.
      expect(mockElement.children).toHaveLength(1)
      expect(other.children).toHaveLength(1)
    })

    it('should hand back cleanup once, not once per re-render', () => {
      const modifier = overlay(mockComponent)

      const results = [pass(), pass(), pass(), pass()].map(
        ctx => modifier.apply({} as DOMNode, ctx) as ModifierResult
      )

      // The pipeline chains every returned cleanup onto node.dispose and never
      // drops the previous one, so returning one per pass would accumulate
      // stale teardowns that all replay at unmount.
      const withCleanup = results.filter(r => r.cleanup?.length)
      expect(withCleanup).toHaveLength(1)
      expect(results[0]!.cleanup).toBeDefined()
    })

    it('should tear down the current overlay from the single cleanup', () => {
      const modifier = overlay(mockComponent)

      const first = modifier.apply({} as DOMNode, pass()) as ModifierResult
      modifier.apply({} as DOMNode, pass())
      modifier.apply({} as DOMNode, pass())

      expect(mockElement.children).toHaveLength(1)

      // The one cleanup handed back on the first pass must dispose whatever is
      // mounted now, not the container it happened to see back then.
      first.cleanup!.forEach(fn => fn())

      expect(mockElement.children).toHaveLength(0)
    })

    it('should dispose the last overlay when it leaves the chain', () => {
      // Nothing runs from apply() on a pass with no overlay modifier, so the
      // reconciliation above cannot see this. Modifiers are applied inside the
      // render effect, so an execution-scoped cleanup covers it.
      const [show, setShow] = createSignal(true)
      const modifier = overlay(mockComponent, 'bottomTrailing')

      const dispose = createRoot(dispose => {
        createEffect(() => {
          if (show()) modifier.apply({} as DOMNode, pass())
        })
        return dispose
      })

      expect(mockElement.children).toHaveLength(1)

      setShow(false)
      flushSync()

      expect(mockElement.children).toHaveLength(0)

      dispose()
    })

    it('should remount when the overlay returns to the chain', () => {
      const [show, setShow] = createSignal(true)
      const modifier = overlay(mockComponent, 'bottomTrailing')

      const dispose = createRoot(dispose => {
        createEffect(() => {
          if (show()) modifier.apply({} as DOMNode, pass())
        })
        return dispose
      })

      setShow(false)
      flushSync()
      expect(mockElement.children).toHaveLength(0)

      setShow(true)
      flushSync()
      expect(mockElement.children).toHaveLength(1)

      setShow(false)
      flushSync()
      expect(mockElement.children).toHaveLength(0)

      dispose()
    })

    it('should remount cleanly after teardown', () => {
      const modifier = overlay(mockComponent)

      const first = modifier.apply({} as DOMNode, pass()) as ModifierResult
      first.cleanup!.forEach(fn => fn())
      expect(mockElement.children).toHaveLength(0)

      const again = modifier.apply({} as DOMNode, pass()) as ModifierResult
      expect(mockElement.children).toHaveLength(1)
      expect(again.cleanup?.length).toBe(1)
    })
  })

  describe('Multiple Overlay Handling', () => {
    it('should support multiple overlays on same element', () => {
      const modifier1 = overlay(mockComponent, 'topLeading')
      const modifier2 = overlay(createMockComponent(), 'bottomTrailing')

      modifier1.apply({} as DOMNode, mockContext)
      modifier2.apply({} as DOMNode, mockContext)

      expect(mockElement.children).toHaveLength(2)

      // First overlay
      const overlay1 = mockElement.children[0]
      expect(overlay1.style.top).toBe('0px')
      expect(overlay1.style.left).toBe('0px')

      // Second overlay
      const overlay2 = mockElement.children[1]
      expect(overlay2.style.bottom).toBe('0px')
      expect(overlay2.style.right).toBe('0px')
    })

    it('should handle overlays with different alignments efficiently', () => {
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

      alignments.forEach((alignment, index) => {
        const modifier = overlay(createMockComponent(), alignment)
        modifier.apply({} as DOMNode, mockContext)
      })

      expect(mockElement.children).toHaveLength(alignments.length)
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle missing element gracefully', () => {
      const modifier = overlay(mockComponent)
      const contextWithoutElement = {
        ...mockContext,
        element: undefined,
      }

      expect(() => {
        modifier.apply({} as DOMNode, contextWithoutElement)
      }).not.toThrow()
    })

    it('should handle null element gracefully', () => {
      const modifier = overlay(mockComponent)
      const contextWithNullElement = {
        ...mockContext,
        element: null,
      }

      expect(() => {
        modifier.apply({} as DOMNode, contextWithNullElement)
      }).not.toThrow()
    })

    it('should handle non-HTMLElement gracefully', () => {
      const modifier = overlay(mockComponent)
      const contextWithTextNode = {
        ...mockContext,
        element: { nodeType: 3 } as any, // Text node
      }

      expect(() => {
        modifier.apply({} as DOMNode, contextWithTextNode)
      }).not.toThrow()
    })

    it('should return cleanup that tears the overlay back down', () => {
      const modifier = overlay(mockComponent)
      const node = {} as DOMNode

      const result = modifier.apply(node, mockContext) as ModifierResult

      // The node passes straight through — overlay never rewrites the tree.
      expect(result.node).toBe(node)
      expect(mockElement.children).toHaveLength(1)

      result.cleanup!.forEach(fn => fn())

      expect(mockElement.children).toHaveLength(0)
    })

    it('should return cleanup for non-reactive content too', () => {
      const modifier = overlay(document.createElement('span'))

      const result = modifier.apply({} as DOMNode, mockContext) as ModifierResult

      expect(mockElement.children).toHaveLength(1)

      result.cleanup!.forEach(fn => fn())

      expect(mockElement.children).toHaveLength(0)
    })

    it('should handle invalid alignment by defaulting to center', () => {
      const modifier = new OverlayModifier({
        content: mockComponent,
        alignment: 'invalid' as any,
      })

      modifier.apply({} as DOMNode, mockContext)

      const overlayContainer = mockElement.children[0]
      expect(overlayContainer.style.top).toBe('50%')
      expect(overlayContainer.style.left).toBe('50%')
      expect(overlayContainer.style.transform).toBe('translate(-50%, -50%)')
    })
  })

  describe('Performance', () => {
    it('should perform multiple overlay applications efficiently', () => {
      const modifier = overlay(mockComponent)
      const iterations = 100 // Reduced for DOM operations

      const start = performance.now()

      for (let i = 0; i < iterations; i++) {
        // Create fresh element for each iteration to avoid accumulation
        const freshElement = document.createElement('div')
        const freshContext = { ...mockContext, element: freshElement }
        modifier.apply({} as DOMNode, freshContext)
      }

      const duration = performance.now() - start

      expect(duration).toBeLessThan(100) // Should complete within 100ms
    })

    it('should handle multiple different overlays efficiently', () => {
      const overlays = Array.from({ length: 50 }, (_, i) =>
        overlay(createMockComponent(), 'center')
      )

      const start = performance.now()

      overlays.forEach(modifier => {
        modifier.apply({} as DOMNode, mockContext)
      })

      const duration = performance.now() - start

      expect(duration).toBeLessThan(150) // Should complete within 150ms
      expect(mockElement.children).toHaveLength(overlays.length)
    })

    it('should handle complex content rendering efficiently', () => {
      const complexComponent = {
        type: 'component' as const,
        id: 'complex-component',
        props: {},
        render: vi.fn().mockImplementation(() =>
          // Simulate complex rendering
          h(
            'div',
            null,
            ...Array.from({ length: 10 }, (_, i) =>
              h('span', null, textNode(String(i)))
            )
          )
        ),
      }

      const modifier = overlay(complexComponent, 'center')
      const iterations = 20

      const start = performance.now()

      for (let i = 0; i < iterations; i++) {
        const freshElement = document.createElement('div')
        const freshContext = { ...mockContext, element: freshElement }
        modifier.apply({} as DOMNode, freshContext)
      }

      const duration = performance.now() - start

      expect(duration).toBeLessThan(50) // Should complete within 50ms
      expect(complexComponent.render).toHaveBeenCalledTimes(iterations)
    })
  })

  describe('Signal Reactivity', () => {
    const disposers = new Set<() => void>()

    afterEach(() => {
      disposers.forEach(dispose => dispose())
      disposers.clear()
    })

    it('updates side positioning when side signal changes', async () => {
      const [side, setSide] = createSignal<'top' | 'bottom'>('top')
      const modifier = new OverlayModifier({
        content: mockComponent,
        side,
      })

      const dispose = createRoot(dispose => {
        modifier.apply({} as DOMNode, mockContext)
        return dispose
      })
      disposers.add(dispose)

      const overlayContainer = mockElement.children[0]
      expect(overlayContainer.style.top).toBe('0px')
      expect(overlayContainer.style.left).toBe('50%')

      setSide('bottom')
      flushSync()
      await flushReactiveUpdates()

      expect(overlayContainer.style.top).toBe('')
      expect(overlayContainer.style.bottom).toBe('0px')
      expect(overlayContainer.style.left).toBe('50%')
    })

    it('updates side offset when offset signal changes', async () => {
      const [offset, setOffset] = createSignal(8)
      const modifier = new OverlayModifier({
        content: mockComponent,
        side: 'top',
        offset,
      })

      const dispose = createRoot(dispose => {
        modifier.apply({} as DOMNode, mockContext)
        return dispose
      })
      disposers.add(dispose)

      const overlayContainer = mockElement.children[0]
      expect(overlayContainer.style.top).toBe('8px')

      setOffset(24)
      flushSync()
      await flushReactiveUpdates()

      expect(overlayContainer.style.top).toBe('24px')
    })

    it('toggles overlay visibility when enabled signal changes', async () => {
      const [enabled, setEnabled] = createSignal(true)
      const modifier = new OverlayModifier({
        content: mockComponent,
        enabled,
      })

      const dispose = createRoot(dispose => {
        modifier.apply({} as DOMNode, mockContext)
        return dispose
      })
      disposers.add(dispose)

      const overlayContainer = mockElement.children[0]
      expect(overlayContainer.style.display).toBe('')

      setEnabled(false)
      flushSync()
      await flushReactiveUpdates()

      expect(overlayContainer.style.display).toBe('none')

      setEnabled(true)
      flushSync()
      await flushReactiveUpdates()

      expect(overlayContainer.style.display).toBe('')
    })
  })
})
