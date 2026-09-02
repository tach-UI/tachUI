/**
 * `Show` disposes a branch through the renderer that mounted it.
 *
 * `Show` owns a private `DOMRenderer` and used to swap branches by calling
 * `node.dispose` alone, which reaches only what a component put on the node.
 * Everything the renderer registered against the element — reactive prop
 * effects, event delegation, `reactiveElement` bindings — stayed live, and the
 * renderer's rendered-node set grew by a branch on every toggle.
 */

import { beforeEach, describe, expect, it } from 'vitest'
import { createSignal, flushSync, DOMRenderer } from '@tachui/core'
import type { ComponentInstance, DOMNode } from '@tachui/core'
import { Show } from '../../src/conditional/Show'

/** A component holding one `reactiveElement` slot, so bindings are countable. */
function Painted(marker: () => string, onPaint: () => void): ComponentInstance {
  let cached: { key: string; element: Element } | undefined

  return {
    type: 'component',
    id: 'painted',
    props: {},
    children: [],
    cleanup: [],
    render: () => [
      {
        type: 'element',
        tag: 'span',
        props: {},
        children: [
          {
            type: 'element',
            tag: 'i',
            props: {},
            children: [],
            reactiveElement: () => {
              onPaint()
              const key = marker()
              if (cached?.key !== key) {
                const element = document.createElement('i')
                element.setAttribute('data-marker', key)
                cached = { key, element }
              }
              return cached.element
            },
          },
        ],
      } as DOMNode,
    ],
  }
}

describe('Show branch disposal', () => {
  let container: HTMLElement
  let renderer: DOMRenderer

  beforeEach(() => {
    container = document.createElement('div')
    renderer = new DOMRenderer()
  })

  function mount(component: ComponentInstance): void {
    const rendered = component.render()
    const nodes = Array.isArray(rendered) ? rendered : [rendered]
    container.appendChild(renderer.render(nodes[0]) as Element)
  }

  it('leaves exactly one live binding after repeated toggles', () => {
    const [visible, setVisible] = createSignal(true)
    const [marker, setMarker] = createSignal('A')
    let paints = 0

    mount(
      Show({
        when: visible,
        children: Painted(marker, () => paints++),
      })
    )

    for (let i = 0; i < 5; i++) {
      setVisible(false)
      flushSync()
      setVisible(true)
      flushSync()
    }

    paints = 0
    setMarker('B')
    flushSync()

    // One binding repaints, not six: each hidden branch's binding was disposed
    // along with the branch.
    expect(paints).toBe(1)
    expect(container.querySelectorAll('[data-marker]')).toHaveLength(1)
    expect(container.querySelector('[data-marker]')?.getAttribute('data-marker')).toBe('B')
  })

  it('keeps repainting the branch that is currently shown', () => {
    const [visible, setVisible] = createSignal(true)
    const [marker, setMarker] = createSignal('A')

    mount(
      Show({
        when: visible,
        children: Painted(marker, () => {}),
      })
    )

    setVisible(false)
    flushSync()
    setVisible(true)
    flushSync()

    setMarker('B')
    flushSync()

    // The C1 case: a disposed branch is re-rendered, and the fresh mount rebinds
    // rather than staying frozen at whatever it last painted.
    expect(container.querySelector('[data-marker]')?.getAttribute('data-marker')).toBe('B')
  })

  it('does not accumulate rendered nodes across toggles', () => {
    const [visible, setVisible] = createSignal(true)
    const [marker] = createSignal('A')

    const show = Show({
      when: visible,
      children: Painted(marker, () => {}),
    })
    mount(show)

    // Reaching into the private renderer is the only way to see the set that
    // used to grow; the leak is invisible from the DOM.
    const branchRenderer = (show as any).renderer as DOMRenderer
    const trackedCount = () => ((branchRenderer as any).renderedNodes as Set<DOMNode>).size

    setVisible(false)
    flushSync()
    setVisible(true)
    flushSync()

    const afterFirstToggle = trackedCount()

    for (let i = 0; i < 5; i++) {
      setVisible(false)
      flushSync()
      setVisible(true)
      flushSync()
    }

    expect(trackedCount()).toBe(afterFirstToggle)
  })
})
