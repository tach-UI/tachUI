/**
 * Reactive `isEnabled` on Button.
 *
 * `isEnabled` is typed `boolean | Signal<boolean>`, and a signal in that slot
 * did nothing at all: no `disabled` attribute, no disabled styling, and the
 * action fired. Two faults stacked — `isSignal` did not recognise a computed,
 * so the prop fell through to the `true` default, and even a plain signal was
 * read once at render and never again.
 *
 * These assert the attribute rather than click suppression. A real browser
 * suppresses clicks on a disabled button natively; jsdom does not, so an
 * assertion on "did the action fire" would pass for the wrong reason in one
 * environment and fail for the wrong reason in the other.
 */

import { beforeEach, describe, expect, it } from 'vitest'

import {
  createComputed,
  createSignal,
  getSignalImpl,
  isSignal,
  renderComponent,
} from '@tachui/core'
import { mountComponentTree } from '@tachui/core/runtime/dom-bridge'

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

describe('isSignal', () => {
  it('recognises a computed, which is what the Signal type promises', () => {
    const [value] = createSignal(1)
    const derived = createComputed(() => value() > 0)

    // The root cause. `createComputed` marks its accessor `tachui.computed`
    // and `isSignal` looked only for `tachui.signal`, so a computed failed the
    // guard for its own type — and every `isSignal(x) ? x() : x` split in the
    // codebase handed the function on as a value.
    expect(isSignal(derived)).toBe(true)
    expect(isSignal(value)).toBe(true)
  })
})

describe('Button isEnabled', () => {
  it('renders disabled for a computed that starts false', async () => {
    const [value] = createSignal(0)
    const button = renderButton(
      Button('minus', {
        action: () => undefined,
        isEnabled: createComputed(() => value() > 0),
      }).build()
    )
    await flush()

    expect(button.hasAttribute('disabled')).toBe(true)
  })

  it('follows a computed in both directions', async () => {
    const [value, setValue] = createSignal(0)
    const button = renderButton(
      Button('minus', {
        action: () => undefined,
        isEnabled: createComputed(() => value() > 0),
      }).build()
    )
    await flush()
    expect(button.hasAttribute('disabled')).toBe(true)

    setValue(1)
    await flush()
    expect(button.hasAttribute('disabled')).toBe(false)

    // Back again: a one-shot read at mount could pass the enable and still
    // fail this.
    setValue(0)
    await flush()
    expect(button.hasAttribute('disabled')).toBe(true)
  })

  it('follows a plain signal too', async () => {
    const [enabled, setEnabled] = createSignal(true)
    const button = renderButton(
      Button('plus', { action: () => undefined, isEnabled: enabled }).build()
    )
    await flush()
    expect(button.hasAttribute('disabled')).toBe(false)

    setEnabled(false)
    await flush()
    expect(button.hasAttribute('disabled')).toBe(true)
  })

  it('keeps a plain boolean working', async () => {
    const button = renderButton(
      Button('off', { action: () => undefined, isEnabled: false }).build()
    )
    await flush()

    expect(button.hasAttribute('disabled')).toBe(true)
  })

  it('does not run the action while a signal says it is disabled', async () => {
    const [enabled, setEnabled] = createSignal(false)
    let fired = 0
    const button = renderButton(
      Button('gated', {
        action: () => {
          fired += 1
        },
        isEnabled: enabled,
      }).build()
    )
    await flush()

    // jsdom dispatches clicks to a disabled button, so the attribute alone
    // guarantees nothing here — the handler has to decline as well.
    button.click()
    expect(fired).toBe(0)

    setEnabled(true)
    await flush()
    button.click()
    expect(fired).toBe(1)
  })
})

describe('an enclosing re-render', () => {
  it('keeps disabled tracking when a parent re-renders for its own reasons', async () => {
    const [tick, setTick] = createSignal(0)
    const [enabled, setEnabled] = createSignal(true)
    const child = Button('x', {
      action: () => undefined,
      isEnabled: enabled,
    }).build()

    // A render runs inside an effect, so a parent reading any signal at all
    // re-renders its children and disposes the scope their subscriptions were
    // made in. The renderer then diffs new props against old by identity and
    // skips whatever is unchanged — so an accessor cached across renders is
    // recognised, skipped, and never resubscribed.
    const parent = {
      type: 'component' as const,
      id: 'parent',
      props: {},
      render: () => {
        tick()
        return (child as unknown as { render: () => unknown }).render()
      },
    }
    renderComponent(parent as never, host)
    await flush()

    const button = host.querySelector('button')
    expect(button?.hasAttribute('disabled')).toBe(false)

    setTick(1)
    await flush()

    setEnabled(false)
    await flush()

    expect(host.querySelector('button')?.hasAttribute('disabled')).toBe(true)
  })
})

describe('isLoading', () => {
  it('declines the action while loading, as the press guard always has', async () => {
    const [loading, setLoading] = createSignal(true)
    let fired = 0
    const button = renderButton(
      Button('save', {
        action: () => {
          fired += 1
        },
        isLoading: loading,
      }).build()
    )
    await flush()

    // `handlePress` has always refused while loading; the click handler had no
    // such guard, so the two disagreed depending on which path a press took.
    // A loading button now declines on both.
    button.click()
    expect(fired).toBe(0)

    setLoading(false)
    await flush()
    button.click()
    expect(fired).toBe(1)
  })
})

describe('mounting directly', () => {
  it('leaves nothing subscribed to the caller\'s signal after unmount', () => {
    const [enabled] = createSignal(true)
    const observers = (): number =>
      (getSignalImpl(enabled as never) as unknown as { observers: Set<unknown> })
        .observers.size
    const baseline = observers()

    for (let cycle = 0; cycle < 10; cycle += 1) {
      const container = document.createElement('div')
      document.body.appendChild(container)
      const dispose = mountComponentTree(
        Button('x', { action: () => undefined, isEnabled: enabled }).build() as never,
        container
      )
      dispose()
      container.remove()
    }

    // The direct mount path disposes nothing a render created — `build()`
    // copies the component's cleanup array before render can add to it, and
    // the renderer's element cleanup does not run either. So anything that
    // subscribes to a caller's signal from inside a render here is held for
    // the life of the process, one more for every sheet, popover or split view
    // that has ever been opened.
    expect(observers()).toBe(baseline)
  })
})

describe('the reported repro', () => {
  it('gates the decrement and leaves the increment live', async () => {
    // The reporter's bounded stepper: controls disable at the range bounds.
    const [count, setCount] = createSignal(0)
    const decrement = renderButton(
      Button('minus', {
        action: () => setCount(count() - 1),
        isEnabled: createComputed(() => count() > 0),
      }).build()
    )
    await flush()

    expect(decrement.hasAttribute('disabled')).toBe(true)

    setCount(3)
    await flush()
    expect(decrement.hasAttribute('disabled')).toBe(false)
  })
})
