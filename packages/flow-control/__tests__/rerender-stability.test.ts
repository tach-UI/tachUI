/**
 * `Show` and `ForEach` survive a re-render of the element they live in.
 *
 * Both used to build a container node in `render()` and then patch its element
 * from an effect created there too. `render()` runs on every render of the
 * node, so each one left another live effect writing into the same element, and
 * the mounting renderer kept reconciling `children` against its own record of
 * what was there. The two records drifted apart the moment the branch or the
 * collection changed without a re-render, and the next re-render paired the
 * incoming content against elements that were no longer mounted: `NONO` for a
 * `Show` sitting on its fallback, `bab` for a two-item `ForEach` (#318).
 *
 * The container is now owned, so exactly one writer fills it, and the
 * subscription is a `reactiveElement` binding the renderer owns, so exactly one
 * effect maintains it however many times the node is rendered.
 */

import { describe, expect, it } from 'vitest'
import { createSignal, flushSync, h, renderComponent } from '@tachui/core'
import type { ComponentInstance, DOMNode } from '@tachui/core'
import { Show } from '../src/conditional/Show'
import { ForEach } from '../src/iteration/ForEach'

async function settle(): Promise<void> {
  flushSync()
  for (let i = 0; i < 3; i += 1) {
    await new Promise(resolve => setTimeout(resolve, 0))
  }
}

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

/**
 * A parent that re-renders on its own signal and mounts `child` inline.
 *
 * The child is hoisted — created once, outside the render — so a repeat render
 * of the *same* component instance is what is under test, rather than inline
 * composition building a new one each pass.
 */
function reRenderingParent(
  child: ComponentInstance,
  bump: () => number
): ComponentInstance {
  return {
    type: 'component',
    id: 'parent',
    props: {},
    children: [],
    cleanup: [],
    render: () => {
      const node = h('div', { class: `pass-${bump()}` })
      const rendered = child.render()
      node.children = (
        Array.isArray(rendered) ? rendered : [rendered]
      ) as DOMNode[]
      return node
    },
  }
}

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

    // A stale effect per render would show up here: with four live effects, one
    // toggle renders the branch four times.
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
