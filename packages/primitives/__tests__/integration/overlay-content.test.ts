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
import { renderComponent } from '@tachui/core/runtime'
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
