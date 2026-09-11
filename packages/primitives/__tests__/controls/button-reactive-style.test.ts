/**
 * Signal-driven style modifier values.
 *
 * The report said a `Signal` colour was read once and never updated. It is
 * not: effects flush on a microtask, so a read in the same task as the write
 * is stale by design, and the reporter measured synchronously. Nothing was
 * pinning it either way, though, which is why the claim was plausible enough
 * to file — these are that pin.
 *
 * Each one reads after a flush, and also asserts the value *before* the change
 * so a modifier that silently stopped applying colour at all could not pass.
 */

import { beforeEach, describe, expect, it } from 'vitest'

import {
  createComputed,
  createSignal,
  mountComponentTree,
  renderComponent,
} from '@tachui/core'

import { Button } from '../../src'

let host: HTMLElement

beforeEach(() => {
  host = document.createElement('div')
  document.body.appendChild(host)
})

/** Lets the scheduler's batched effects run; reads before this are stale. */
async function flush(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0))
}

function renderButton(component: unknown): HTMLButtonElement {
  renderComponent(component as never, host)
  const button = host.querySelector('button')
  if (button === null) {
    throw new Error('Button did not render an element')
  }
  return button
}

describe('foregroundColor', () => {
  it('re-applies when its signal changes', async () => {
    const [tint, setTint] = createSignal('red')
    const button = renderButton(
      Button('plus', { action: () => undefined })
        .foregroundColor(tint)
        .build()
    )
    await flush()
    expect(button.style.color).toBe('red')

    setTint('gray')
    await flush()

    expect(button.style.color).toBe('gray')
  })

  it('re-applies when a computed derived from a signal changes', async () => {
    // The reporter's shape: a threshold over a counter.
    const [count, setCount] = createSignal(0)
    const button = renderButton(
      Button('plus', { action: () => undefined })
        .foregroundColor(createComputed(() => (count() < 8 ? 'red' : 'gray')))
        .build()
    )
    await flush()
    expect(button.style.color).toBe('red')

    setCount(8)
    await flush()

    expect(button.style.color).toBe('gray')
  })
})

describe('backgroundColor', () => {
  it('re-applies when its signal changes', async () => {
    const [background, setBackground] = createSignal('blue')
    const button = renderButton(
      Button('plus', { action: () => undefined })
        .backgroundColor(background)
        .build()
    )
    await flush()
    expect(button.style.backgroundColor).toBe('blue')

    setBackground('green')
    await flush()

    expect(button.style.backgroundColor).toBe('green')
  })
})

describe('a disabled button', () => {
  it('looks disabled, and goes back when it is enabled again', async () => {
    const [enabled, setEnabled] = createSignal(true)
    const button = renderButton(
      Button('minus', { action: () => undefined, isEnabled: enabled }).build()
    )
    await flush()
    expect(button.style.cursor).toBe('pointer')
    expect(button.style.opacity).toBe('1')

    setEnabled(false)
    await flush()

    // The attribute and the action gating were fixed first; this is the half a
    // user actually sees. Styles reach the element through the renderer now,
    // rather than an effect that ran on DOM ready — which this path never
    // fires, so a Button rendered the ordinary way had no styles at all.
    expect(button.style.cursor).toBe('not-allowed')
    expect(button.style.opacity).toBe('0.6')

    setEnabled(true)
    await flush()
    expect(button.style.cursor).toBe('pointer')
    expect(button.style.opacity).toBe('1')
  })

  it('looks disabled when mounted directly as well', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    mountComponentTree(
      Button('x', { action: () => undefined, isEnabled: false }).build() as never,
      container
    )
    await flush()

    const button = container.querySelector('button')
    expect(button?.style.cursor).toBe('not-allowed')
    expect(button?.style.opacity).toBe('0.6')
    container.remove()
  })
})

describe('modifier precedence', () => {
  it('leaves a modifier value alone on both paths', async () => {
    const rendered = renderButton(
      Button('a', { action: () => undefined }).opacity(0.25).build()
    )
    await flush()
    // Styles now arrive before modifiers rather than after, so precedence is
    // the order they are applied in rather than a guess about what is already
    // on the element.
    expect(rendered.style.opacity).toBe('0.25')

    const container = document.createElement('div')
    document.body.appendChild(container)
    mountComponentTree(
      Button('b', { action: () => undefined }).opacity(0.25).build() as never,
      container
    )
    await flush()
    expect(container.querySelector('button')?.style.opacity).toBe('0.25')
    container.remove()
  })
})
