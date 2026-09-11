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

import { createComputed, createSignal, renderComponent } from '@tachui/core'

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
