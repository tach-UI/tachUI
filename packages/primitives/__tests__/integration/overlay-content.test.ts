/**
 * Regression coverage for #302 — `overlay()` rendered an absolutely-positioned
 * container and dropped its content for every argument form.
 *
 * These run the real path: a real primitive, the real modifier pipeline, and
 * the real renderer. The modifier package's own tests can only mock so much;
 * the original bug survived precisely because a mock stood in for a component.
 */

import { describe, expect, it } from 'vitest'
import { createSignal, flushSync } from '@tachui/core'
import { h, renderComponent, text as textNode } from '@tachui/core/runtime'
import { overlay } from '@tachui/modifiers'
import { Text } from '../../src'

function render(component: any): HTMLElement {
  const container = document.createElement('div')
  renderComponent(component, container)
  return container
}

function overlayContainerOf(container: HTMLElement): HTMLElement {
  const overlayEl = container.querySelector(
    '[style*="position: absolute"]'
  ) as HTMLElement | null
  expect(overlayEl).not.toBeNull()
  return overlayEl!
}

describe('overlay() content rendering (#302)', () => {
  it('renders string content', () => {
    const container = render(
      Text('base').modifier.modifier(overlay('D', 'bottomTrailing')).build()
    )

    expect(overlayContainerOf(container).textContent).toBe('D')
  })

  it('renders a component instance', () => {
    const container = render(
      Text('base')
        .modifier.modifier(overlay(Text('D'), 'bottomTrailing'))
        .build()
    )

    const overlayEl = overlayContainerOf(container)
    expect(overlayEl.querySelector('.tachui-text')?.textContent).toBe('D')
  })

  it('renders an already-built component instance', () => {
    const container = render(
      Text('base')
        .modifier.modifier(
          overlay(Text('D').modifier.build(), 'bottomTrailing')
        )
        .build()
    )

    const overlayEl = overlayContainerOf(container)
    expect(overlayEl.querySelector('.tachui-text')?.textContent).toBe('D')
  })

  it('renders content returned from a closure', () => {
    const container = render(
      Text('base')
        .modifier.modifier(overlay(() => Text('D'), 'bottomTrailing'))
        .build()
    )

    const overlayEl = overlayContainerOf(container)
    expect(overlayEl.querySelector('.tachui-text')?.textContent).toBe('D')
  })

  it('renders signal content and tracks updates', () => {
    const [label, setLabel] = createSignal('D')
    const container = render(
      Text('base').modifier.modifier(overlay(label, 'bottomTrailing')).build()
    )

    const overlayEl = overlayContainerOf(container)
    expect(overlayEl.textContent).toBe('D')

    setLabel('E')
    flushSync()

    expect(overlayEl.textContent).toBe('E')
  })

  it('keeps the requested alignment while rendering content', () => {
    const container = render(
      Text('base')
        .modifier.modifier(overlay(Text('D'), 'bottomTrailing'))
        .build()
    )

    const overlayEl = overlayContainerOf(container)
    expect(overlayEl.style.bottom).toBe('0px')
    expect(overlayEl.style.right).toBe('0px')
    expect(overlayEl.textContent).toBe('D')
  })

  it('does not accumulate containers when the base re-renders', () => {
    // A content closure that reads a signal is tracked by the render effect, so
    // updating it re-runs the component's render — and the renderer re-applies
    // modifiers on every render, not only on element creation. Each pass used
    // to append another container and leave the previous one behind.
    const [label, setLabel] = createSignal('x')
    const container = render(
      Text('base')
        .modifier.overlay(() => Text(label()), 'bottomTrailing')
        .build()
    )

    const overlays = () =>
      container.querySelectorAll('[style*="position: absolute"]')

    expect(overlays()).toHaveLength(1)
    expect(overlays()[0]!.textContent).toBe('x')

    setLabel('y')
    flushSync()

    expect(overlays()).toHaveLength(1)
    expect(overlays()[0]!.textContent).toBe('y')

    setLabel('z')
    flushSync()

    expect(overlays()).toHaveLength(1)
    expect(overlays()[0]!.textContent).toBe('z')
  })

  it('does not accumulate when the chain is rebuilt on every render', () => {
    // Inline composition — `Text(...).overlay(...)` inside a parent's render —
    // produces a fresh overlay modifier every pass while the renderer reuses
    // the element. Bookkeeping held on the modifier instance cannot see the
    // previous pass's container; it has to live on the element.
    const [n, setN] = createSignal(0)
    const container = document.createElement('div')

    const parent: any = {
      type: 'component',
      id: 'rebuilds-chain',
      props: {},
      render: () => {
        const child: any = Text(`v${n()}`)
          .modifier.overlay(Text('D'), 'bottomTrailing')
          .build()
        const result = child.render()
        return Array.isArray(result) ? result : [result]
      },
    }
    renderComponent(parent, container)

    const overlays = () =>
      container.querySelectorAll('[style*="position: absolute"]')

    expect(overlays()).toHaveLength(1)

    setN(1)
    flushSync()
    expect(overlays()).toHaveLength(1)

    setN(2)
    flushSync()
    expect(overlays()).toHaveLength(1)
  })

  it('drops an overlay removed from a chain that still has others', () => {
    const [both, setBoth] = createSignal(true)
    const container = document.createElement('div')

    const parent: any = {
      type: 'component',
      id: 'conditional-overlay',
      props: {},
      render: () => {
        const node: any = h('div', { class: 'base' })
        node.modifiers = both()
          ? [
              overlay(Text('ring'), 'center'),
              overlay(Text('badge'), 'bottomTrailing'),
            ]
          : [overlay(Text('ring'), 'center')]
        return node
      },
    }
    renderComponent(parent, container)

    const labels = () =>
      Array.from(
        container.querySelectorAll('[style*="position: absolute"]')
      ).map(el => el.textContent)

    expect(labels()).toEqual(['ring', 'badge'])

    setBoth(false)
    flushSync()

    expect(labels()).toEqual(['ring'])
  })

  it('drops the sole overlay when it leaves the chain, and restores it', () => {
    // The pass with no overlay runs no overlay modifier at all, so nothing in
    // apply() can observe it. Modifiers are applied inside the render effect,
    // so the mount's execution-scoped cleanup fires before the next pass.
    const [show, setShow] = createSignal(true)
    const container = document.createElement('div')

    const parent: any = {
      type: 'component',
      id: 'sole-overlay',
      props: {},
      render: () => {
        const node: any = h('div', { class: 'base' })
        node.modifiers = show()
          ? [overlay(Text('badge'), 'bottomTrailing')]
          : []
        return node
      },
    }
    renderComponent(parent, container)

    const labels = () =>
      Array.from(
        container.querySelectorAll('[style*="position: absolute"]')
      ).map(el => el.textContent)

    expect(labels()).toEqual(['badge'])

    setShow(false)
    flushSync()
    expect(labels()).toEqual([])

    setShow(true)
    flushSync()
    expect(labels()).toEqual(['badge'])

    setShow(false)
    flushSync()
    expect(labels()).toEqual([])
  })

  it('keeps each layer distinct when a multi-overlay base re-renders', () => {
    const [badge, setBadge] = createSignal('1')
    const container = render(
      Text('base')
        .modifier.overlay(Text('ring'), 'center')
        .overlay(() => Text(badge()), 'bottomTrailing')
        .build()
    )

    const overlays = () =>
      Array.from(container.querySelectorAll('[style*="position: absolute"]'))

    expect(overlays().map(el => el.textContent)).toEqual(['ring', '1'])

    setBadge('2')
    flushSync()

    // The static ring must survive its sibling's re-application.
    expect(overlays().map(el => el.textContent)).toEqual(['ring', '2'])
  })

  it('coexists with the renderer reconciling the host element\'s children', () => {
    // An overlay container is foreign DOM hung off another component's
    // element — it is not a node in the tree, so it is never in the child
    // lists `updateChildren` matches against. It must therefore survive its
    // host's children being reconciled, and stay last so it paints on top.
    // This guards the boundary between the two mechanisms: content the
    // renderer mounts (DOMNode.owned) and DOM a modifier attaches itself.
    const [count, setCount] = createSignal(1)
    const container = document.createElement('div')

    const host: any = {
      type: 'component',
      id: 'overlay-host',
      props: {},
      render: () => {
        const kids = Array.from({ length: count() }, (_, i) =>
          h('span', { class: `k${i}` }, textNode(String(i)))
        )
        const node: any = h('div', { class: 'base' }, ...kids)
        node.modifiers = [overlay(Text('badge'), 'bottomTrailing')]
        return node
      },
    }
    renderComponent(host, container)

    const order = () =>
      Array.from(container.querySelector('.base')!.children).map(
        el => (el as HTMLElement).className.split(' ')[0] || el.tagName
      )
    const overlays = () =>
      container.querySelectorAll('[style*="position: absolute"]')

    expect(order()).toEqual(['k0', 'DIV'])

    setCount(3)
    flushSync()
    expect(order()).toEqual(['k0', 'k1', 'k2', 'DIV'])

    setCount(1)
    flushSync()
    expect(order()).toEqual(['k0', 'DIV'])

    expect(overlays()).toHaveLength(1)
    expect(overlays()[0]!.textContent).toBe('badge')
  })

  it('layers multiple overlays, as DSAvatar-style compositions need', () => {
    const container = render(
      Text('base')
        .modifier.modifier(overlay(Text('ring'), 'center'))
        .modifier(overlay(Text('badge'), 'bottomTrailing'))
        .build()
    )

    const overlays = Array.from(
      container.querySelectorAll('[style*="position: absolute"]')
    )
    expect(overlays).toHaveLength(2)
    expect(overlays.map(el => el.textContent)).toEqual(['ring', 'badge'])
  })
})
