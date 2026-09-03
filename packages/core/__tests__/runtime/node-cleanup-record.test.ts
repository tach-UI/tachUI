/**
 * What the renderer keeps against an element, and what it lets go of.
 *
 * Two bits of bookkeeping that only misbehave once a node outlives a render:
 * the cleanups registered against an element accumulate one entry per render of
 * the node, and a disposed node keeps the record of a render whose elements are
 * gone. Both surfaced through the flow-control components, which hold DOM
 * across renders and cache the nodes they built (#318).
 */

import { describe, expect, it } from 'vitest'
import { DOMRenderer } from '../../src/runtime/renderer'
import type { DOMNode } from '../../src/runtime/types'

function elementNode(overrides: Partial<DOMNode> = {}): DOMNode {
  return {
    type: 'element',
    tag: 'div',
    props: {},
    children: [],
    ...overrides,
  } as DOMNode
}

describe('renderer element cleanups', () => {
  it('registers a stable disposer once however often its node is rendered', () => {
    const renderer = new DOMRenderer()
    let disposals = 0
    const dispose = () => {
      disposals += 1
    }
    const element = document.createElement('div')

    // A component holding DOM across renders hands back the same element and
    // the same disposer on every render; only the node object is new.
    let latest = elementNode({ element, owned: true, dispose })
    for (let pass = 0; pass < 4; pass += 1) {
      latest = elementNode({ element, owned: true, dispose })
      renderer.render(latest)
    }

    renderer.removeNode(latest)
    // Every render registered the disposer against the same element, so a
    // per-render entry would show up here as a repeated disposal.
    expect(disposals).toBe(1)
  })

  it('runs distinct disposers registered against the same element', () => {
    const renderer = new DOMRenderer()
    const ran: string[] = []
    const element = document.createElement('div')

    const node = elementNode({
      element,
      owned: true,
      dispose: () => ran.push('first'),
    })
    renderer.render(node)
    renderer.render(
      elementNode({ element, owned: true, dispose: () => ran.push('second') })
    )

    renderer.removeNode(node)
    expect(ran).toEqual(['first', 'second'])
  })
})

describe('renderer node records', () => {
  it('rebuilds a disposed node rather than diffing against gone elements', () => {
    const renderer = new DOMRenderer()
    const host = document.createElement('div')

    // The node object is kept by its owner across mounts, as a component that
    // caches the nodes it built per item does.
    const child: DOMNode = { type: 'text', text: 'item' }
    const node = elementNode({ children: [child] })

    const first = renderer.render(node, host) as HTMLElement
    expect(first.textContent).toBe('item')

    renderer.disposeNode(node)
    // Disposal is not removal: the element is still in the DOM, and it is the
    // owner that takes it out.
    first.remove()

    const second = renderer.render(node, host) as HTMLElement
    expect(second).not.toBe(first)
    // Kept, the record would pair the identical child list against a text node
    // whose element was let go, take the update path and render nothing.
    expect(second.textContent).toBe('item')
  })

  it('reapplies props to a node rendered again after disposal', () => {
    const renderer = new DOMRenderer()
    const node = elementNode({ props: { 'data-role': 'card' } })

    const first = renderer.render(node) as HTMLElement
    expect(first.getAttribute('data-role')).toBe('card')

    renderer.disposeNode(node)

    const second = renderer.render(node) as HTMLElement
    expect(second).not.toBe(first)
    expect(second.getAttribute('data-role')).toBe('card')
  })
})
