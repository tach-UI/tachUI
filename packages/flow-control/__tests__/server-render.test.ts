/**
 * `Show` and `ForEach` where there is no DOM.
 *
 * Their container is owned on the client, and an owned node serializes as its
 * element — which a server process has no way to build. `DOMNode.owned` tells
 * an owner in that position to emit no owned node at all, so both emit an
 * ordinary node carrying the current content as children, for the serializer to
 * walk.
 */

import { afterEach, describe, expect, it, vi } from 'vitest'
import { createEffect, createRoot, createSignal, flushSync } from '@tachui/core'
import { serializeToHTML } from '../../ssr/src/serializer'
import { leaf } from './helpers'
import { getSubscriberCount } from '../../core/tools/testing/reactive-test-helpers'
import { Show } from '../src/conditional/Show'
import { ForEach, ForEachComponent } from '../src/iteration/ForEach'

function withoutDocument<T>(render: () => T): T {
  vi.stubGlobal('document', undefined)
  try {
    return render()
  } finally {
    vi.unstubAllGlobals()
  }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('rendering without a DOM', () => {
  it('emits the current Show branch as children rather than an owned node', () => {
    const [on] = createSignal(true)
    const show = Show({ when: on, children: leaf('YES'), fallback: leaf('NO') })

    const [node] = withoutDocument(() => show.render())

    expect(node?.owned).toBeUndefined()
    expect(node?.reactiveElement).toBeUndefined()
    expect(node?.element).toBeUndefined()
    expect(node?.props?.style).toEqual({ display: 'contents' })
    expect(node?.children?.[0]?.children?.[0]?.text).toBe('YES')
  })

  it('emits the fallback branch when the condition is false', () => {
    const [on] = createSignal(false)
    const show = Show({ when: on, children: leaf('YES'), fallback: leaf('NO') })

    const [node] = withoutDocument(() => show.render())

    expect(node?.children?.[0]?.children?.[0]?.text).toBe('NO')
  })

  it('emits the current ForEach collection as children rather than an owned node', () => {
    const [items] = createSignal(['a', 'b'])
    const list = ForEach({ data: items, children: (item: string) => leaf(item) })

    const rendered = withoutDocument(() => list.render())
    const [node] = Array.isArray(rendered) ? rendered : [rendered]

    expect(node?.owned).toBeUndefined()
    expect(node?.reactiveElement).toBeUndefined()
    expect(node?.element).toBeUndefined()
    expect(node?.children).toHaveLength(2)
    expect(node?.children?.[1]?.children?.[0]?.text).toBe('b')
  })

  it('does not subscribe the enclosing render to the condition', () => {
    const [on] = createSignal(true)
    const show = Show({ when: on, children: leaf('YES'), fallback: leaf('NO') })

    // `render()` is called inline inside the enclosing component's render
    // effect, so an ordinary read here would subscribe that effect and every
    // toggle would re-render the whole surrounding subtree.
    createRoot(() => {
      createEffect(() => {
        withoutDocument(() => show.render())
      })
    })
    flushSync()

    expect(getSubscriberCount(on)).toBe(0)
  })
})

/**
 * A server render with a DOM shim present is the other half of this, and it
 * takes the opposite path: `document` exists, so both components emit their
 * owned node, and the serializer has to reach the content through the accessor.
 *
 * It only does that for a node with no `element`. One carrying an element
 * serializes that instead — and the element is empty until the accessor has
 * filled it, so an eager one drops the whole branch from the markup.
 */
describe('rendering into a DOM shim', () => {
  it('serializes the current Show branch', () => {
    const [on] = createSignal(true)
    const show = Show({ when: on, children: leaf('YES'), fallback: leaf('NO') })

    expect(serializeToHTML(show.render()[0])).toBe(
      '<div style="display: contents;"><span>YES</span></div>'
    )
  })

  it('serializes the fallback branch when the condition is false', () => {
    const [on] = createSignal(false)
    const show = Show({ when: on, children: leaf('YES'), fallback: leaf('NO') })

    expect(serializeToHTML(show.render()[0])).toBe(
      '<div style="display: contents;"><span>NO</span></div>'
    )
  })

  it('serializes the current ForEach collection', () => {
    const [items] = createSignal(['a', 'b'])
    const list = new ForEachComponent({
      data: items,
      children: (item: string) => leaf(item),
    })

    expect(serializeToHTML(list.render()[0]!)).toBe(
      '<div style="display: contents;"><span>a</span><span>b</span></div>'
    )
  })

  it('hands the serializer a node it has to call the accessor for', () => {
    const [on] = createSignal(true)
    const show = Show({ when: on, children: leaf('YES') })
    const [node] = show.render()

    // The guarantee behind the three above, stated directly: an element on the
    // node would be preferred over the accessor, and at this point there is
    // nothing in it.
    expect(node?.element).toBeUndefined()
    expect(typeof node?.reactiveElement).toBe('function')
  })
})
