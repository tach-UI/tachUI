/**
 * Disposing a mounted `Show` or `ForEach` directly.
 *
 * The subscription that keeps the container current is a `reactiveElement`
 * binding the renderer owns, not a root the component holds — which is what
 * makes it survive a re-render. It also means the component cannot end it by
 * dropping its own state: `dispose()` emptied the element, the binding stayed
 * subscribed, and the next change to the condition or the collection refilled
 * it. Before the container was owned, direct disposal drained a
 * component-owned root and did end it.
 *
 * Disposal now goes through the container, which retires the binding via the
 * composite `dispose` the renderer installs on an owned node.
 */

import { describe, expect, it } from 'vitest'
import { createSignal, DOMRenderer } from '@tachui/core'
import type { ComponentInstance } from '@tachui/core'
import { leaf, mountFirstNode, settle } from './helpers'
import { getSubscriberCount } from '../../core/tools/testing/reactive-test-helpers'
import { Show } from '../src/conditional/Show'
// The class rather than the factory: `ForEach()` is typed as a plain
// `ComponentInstance`, which does not expose `dispose`.
import { ForEachComponent } from '../src/iteration/ForEach'

function mount(component: ComponentInstance): HTMLElement {
  return mountFirstNode(component, new DOMRenderer())
}

describe('direct disposal while mounted', () => {
  it('stops a Show from repopulating its element', async () => {
    const [on, setOn] = createSignal(true)
    const show = Show({ when: on, children: leaf('yes'), fallback: leaf('no') })

    const element = mount(show)
    await settle()
    expect(element.textContent).toBe('yes')

    show.dispose()
    expect(element.textContent).toBe('')
    expect(getSubscriberCount(on)).toBe(0)

    setOn(false)
    await settle()
    expect(element.textContent).toBe('')
  })

  it('stops a ForEach from repopulating its element', async () => {
    const [items, setItems] = createSignal(['a'])
    const list = new ForEachComponent({
      data: items,
      children: (item: string) => leaf(item),
    })

    const element = mount(list)
    await settle()
    expect(element.textContent).toBe('a')

    list.dispose()
    expect(element.textContent).toBe('')
    expect(getSubscriberCount(items)).toBe(0)

    setItems(['b'])
    await settle()
    expect(element.textContent).toBe('')
  })

  it('disposes the component when the renderer removes the element', async () => {
    const [on] = createSignal(true)
    const show = Show({ when: on, children: leaf('yes') })

    let teardowns = 0
    show.cleanup.push(() => {
      teardowns += 1
    })

    const renderer = new DOMRenderer()
    const [node] = show.render()
    const element = renderer.render(node!) as HTMLElement
    await settle()
    expect(element.textContent).toBe('yes')

    // Removal runs the element's cleanups, which reach the component, which
    // retires the binding, whose composite calls the component back. The guard
    // makes that one disposal rather than an unbounded round trip.
    renderer.removeNode(node!)
    expect(teardowns).toBe(1)
    expect(getSubscriberCount(on)).toBe(0)
  })

  it('comes back when rendered again after disposal', async () => {
    const [on, setOn] = createSignal(true)
    const show = Show({ when: on, children: leaf('yes'), fallback: leaf('no') })

    const element = mount(show)
    await settle()
    show.dispose()
    expect(element.textContent).toBe('')

    // A render after disposal is a fresh mount, as it was when the component
    // held its own root.
    const remounted = mount(show)
    await settle()
    expect(remounted).toBe(element)
    expect(element.textContent).toBe('yes')

    setOn(false)
    await settle()
    expect(element.textContent).toBe('no')
  })

  it('is idempotent', async () => {
    const [items] = createSignal(['a'])
    const list = new ForEachComponent({
      data: items,
      children: (item: string) => leaf(item),
    })

    const element = mount(list)
    await settle()

    list.dispose()
    list.dispose()
    expect(element.textContent).toBe('')
    expect(getSubscriberCount(items)).toBe(0)
  })
})
