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
import { createEffect, createRoot, createSignal, flushSync, h } from '@tachui/core'
import type { ComponentInstance } from '@tachui/core'
import { getSubscriberCount } from '../../core/tools/testing/reactive-test-helpers'
import { Show } from '../src/conditional/Show'
import { ForEach } from '../src/iteration/ForEach'

function leaf(label: string): ComponentInstance {
  return {
    type: 'component',
    id: `leaf-${label}`,
    props: {},
    children: [],
    cleanup: [],
    render: () => [h('span', {}, label)],
  }
}

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

    const [node] = withoutDocument(() => list.render())

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
