/**
 * `Show` and `ForEach` survive a re-render of the element they live in.
 *
 * Both used to build a container node in `render()` and then patch its element
 * from an effect created there too, while the mounting renderer went on
 * reconciling the node's declared `children` into the same element. Two writers
 * and two records of what was mounted: the renderer's record named the branch
 * that was there at the last render, the element held whatever the effect had
 * patched in since, and the next re-render diffed the incoming content against
 * the stale record and adopted a detached element. `NONO` for a `Show` sitting
 * on its fallback, `bab` for a two-item `ForEach` (#318).
 *
 * The container is now owned, so exactly one writer fills it, and the
 * subscription is a `reactiveElement` binding the renderer owns, so exactly one
 * effect maintains it however many times the node is rendered.
 */

import { describe, expect, it } from 'vitest'
import { createSignal, h } from '@tachui/core'
import type { ComponentInstance } from '@tachui/core'
import { leaf, reRenderingParent, settle } from './helpers'
import { renderComponent } from '@tachui/core'
import { Show } from '../src/conditional/Show'
import { ForEach } from '../src/iteration/ForEach'

describe('re-render stability', () => {
  it('leaves Show on the current branch when its parent re-renders', async () => {
    const host = document.createElement('div')
    const [on, setOn] = createSignal(true)
    const [bump, setBump] = createSignal(0)

    const show = Show({
      when: on,
      children: leaf('YES'),
      fallback: leaf('NO'),
    })
    renderComponent(reRenderingParent(show, bump), host)
    await settle()
    expect(host.textContent).toBe('YES')

    setOn(false)
    await settle()
    expect(host.textContent).toBe('NO')

    // The defect: the parent re-render mounted the fallback a second time,
    // leaving `NONO` until the condition changed again.
    setBump(1)
    await settle()
    expect(host.textContent).toBe('NO')
    expect(host.querySelectorAll('span')).toHaveLength(1)

    setOn(true)
    await settle()
    expect(host.textContent).toBe('YES')
  })

  it('leaves ForEach on the current collection when its parent re-renders', async () => {
    const host = document.createElement('div')
    const [items, setItems] = createSignal(['a'])
    const [bump, setBump] = createSignal(0)

    const list = ForEach({ data: items, children: (item: string) => leaf(item) })
    renderComponent(reRenderingParent(list, bump), host)
    await settle()
    expect(host.textContent).toBe('a')

    setItems(['a', 'b'])
    await settle()
    expect(host.textContent).toBe('ab')

    // The defect: the parent re-render replayed the collection against a stale
    // record of it and left `bab`.
    setBump(1)
    await settle()
    expect(host.textContent).toBe('ab')
    expect(host.querySelectorAll('span')).toHaveLength(2)

    setItems(['a', 'b', 'c'])
    await settle()
    expect(host.textContent).toBe('abc')
  })

  // Held by the old code too, which disposed its previous root at the top of
  // `render()`. It is asserted here because the guarantee now rests on the
  // renderer retiring the previous binding and rebinding a dead one, which is a
  // different mechanism with its own ways to end up with two.
  it('keeps one live effect maintaining Show however often it is rendered', async () => {
    const host = document.createElement('div')
    const [on, setOn] = createSignal(true)
    const [bump, setBump] = createSignal(0)

    let branchRenders = 0
    const counted: ComponentInstance = {
      type: 'component',
      id: 'counted',
      props: {},
      children: [],
      cleanup: [],
      render: () => {
        branchRenders += 1
        return [h('span', {}, 'YES')]
      },
    }

    const show = Show({ when: on, children: counted, fallback: leaf('NO') })
    renderComponent(reRenderingParent(show, bump), host)
    await settle()

    for (let pass = 1; pass <= 3; pass += 1) {
      setBump(pass)
      await settle()
    }

    // A second live binding would show up here: two of them render the branch
    // twice for one toggle.
    branchRenders = 0
    setOn(false)
    await settle()
    setOn(true)
    await settle()
    expect(branchRenders).toBe(1)
  })

  it('keeps the element of an item a ForEach re-render did not change', async () => {
    const host = document.createElement('div')
    const [items, setItems] = createSignal(['a'])
    const [bump, setBump] = createSignal(0)

    const list = ForEach({
      data: items,
      children: (item: string) => leaf(item),
      getItemId: (item: string) => item,
    })
    renderComponent(reRenderingParent(list, bump), host)
    await settle()

    const first = host.querySelector('span')
    expect(first).not.toBeNull()

    setBump(1)
    await settle()
    expect(host.querySelector('span')).toBe(first)

    // Appending leaves the untouched item where it is rather than re-inserting
    // it, which would drop focus and reset scroll inside it.
    setItems(['a', 'b'])
    await settle()
    expect(host.querySelector('span')).toBe(first)
    expect(host.textContent).toBe('ab')
  })

  it('keeps the element of a Show branch a re-render did not change', async () => {
    const host = document.createElement('div')
    const [on] = createSignal(true)
    const [label, setLabel] = createSignal('one')
    const [bump, setBump] = createSignal(0)

    // Reads the signal in `render()`, so only re-rendering the branch updates
    // it — the case that rules out memoizing the branch on the condition alone.
    const dynamic: ComponentInstance = {
      type: 'component',
      id: 'dynamic',
      props: {},
      children: [],
      cleanup: [],
      render: () => [h('span', {}, label())],
    }

    const show = Show({ when: on, children: dynamic })
    renderComponent(reRenderingParent(show, bump), host)
    await settle()

    const span = host.querySelector('span')
    expect(span?.textContent).toBe('one')

    setLabel('two')
    await settle()
    expect(host.textContent).toBe('two')
    expect(host.querySelector('span')).toBe(span)

    setBump(1)
    await settle()
    expect(host.textContent).toBe('two')
    expect(host.querySelector('span')).toBe(span)
  })
})
