/**
 * `ForEach` disposes an item through the renderer that mounted it.
 *
 * The same shape as the `Show` defect: `ForEach` owns a private `DOMRenderer`
 * and dropped items by calling `node.dispose` alone, which reaches only what a
 * component put on the node. Everything the renderer registered against the
 * element — reactive prop effects, event delegation, `reactiveElement`
 * bindings — stayed live, and the renderer's rendered-node set grew with every
 * collection change.
 */

import { beforeEach, describe, expect, it } from 'vitest'
import { createSignal, flushSync, DOMRenderer } from '@tachui/core'
import type { ComponentInstance, DOMNode } from '@tachui/core'
import { ForEach } from '../../src/iteration/ForEach'

/** An item holding one `reactiveElement` slot, so bindings are countable. */
function PaintedItem(
  marker: () => string,
  onPaint: () => void
): ComponentInstance {
  let cached: { key: string; element: Element } | undefined

  return {
    type: 'component',
    id: `painted-${Math.random()}`,
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

describe('ForEach item disposal', () => {
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

  it('leaves one live binding per surviving item', () => {
    const [items, setItems] = createSignal([1])
    const [marker, setMarker] = createSignal('A')
    let paints = 0

    mount(
      ForEach({
        data: items,
        children: () => PaintedItem(marker, () => paints++),
      })
    )

    // The single item is replaced five times over; each dropped one should take
    // its binding with it.
    for (let i = 0; i < 5; i++) {
      setItems([])
      flushSync()
      setItems([1])
      flushSync()
    }

    paints = 0
    setMarker('B')
    flushSync()

    expect(paints).toBe(1)
    expect(container.querySelectorAll('[data-marker]')).toHaveLength(1)
  })

  it('does not accumulate rendered nodes across collection changes', () => {
    const [items, setItems] = createSignal([1])
    const [marker] = createSignal('A')

    const forEach = ForEach({
      data: items,
      children: () => PaintedItem(marker, () => {}),
    })
    mount(forEach)

    // Reaching into the private renderer is the only way to see the set that
    // used to grow; the leak is invisible from the DOM.
    const itemRenderer = (forEach as any).renderer as DOMRenderer
    const trackedCount = () =>
      ((itemRenderer as any).renderedNodes as Set<DOMNode>).size

    setItems([])
    flushSync()
    setItems([1])
    flushSync()

    const afterFirstCycle = trackedCount()

    for (let i = 0; i < 5; i++) {
      setItems([])
      flushSync()
      setItems([1])
      flushSync()
    }

    expect(trackedCount()).toBe(afterFirstCycle)
  })
})
