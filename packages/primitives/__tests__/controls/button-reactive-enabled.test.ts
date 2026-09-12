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

  it('leaves nothing subscribed to a colour signal either', () => {
    const [tint] = createSignal('#ff0000')
    const observers = (): number =>
      (getSignalImpl(tint as never) as unknown as { observers: Set<unknown> })
        .observers.size
    const baseline = observers()

    for (let cycle = 0; cycle < 10; cycle += 1) {
      const container = document.createElement('div')
      document.body.appendChild(container)
      const dispose = mountComponentTree(
        Button('x', { action: () => undefined, tint }).build() as never,
        container
      )
      dispose()
      container.remove()
    }

    // Same path, same undisposable effect, different prop: the reactive style
    // effect reads `tint`, `backgroundColor` and `foregroundColor`, and each
    // one it subscribes to is a caller's signal held for good.
    expect(observers()).toBe(baseline)
  })

  it('follows the signal there too, and says nothing', async () => {
    const warnings: unknown[] = []
    const realWarn = console.warn
    console.warn = (...args: unknown[]) => {
      warnings.push(args[0])
    }
    try {
      const [enabled, setEnabled] = createSignal(true)
      const container = document.createElement('div')
      document.body.appendChild(container)
      const dispose = mountComponentTree(
        Button('x', { action: () => undefined, isEnabled: enabled }).build() as never,
        container
      )
      const button = container.querySelector('button')
      expect(button?.hasAttribute('disabled')).toBe(false)

      setEnabled(false)
      await flush()

      // This path used to hand over a snapshot, because a render here happened
      // in no reactive scope and a subscription made in one could never be
      // released. The mount now renders under an owner of its own, so the
      // control behaves the same way in a sheet as on a page — and there is
      // nothing left to warn about.
      expect(button?.hasAttribute('disabled')).toBe(true)
      expect(
        warnings.some(
          warning =>
            typeof warning === 'string' &&
            warning.includes('outside a reactive owner')
        )
      ).toBe(false)

      dispose()
      container.remove()
    } finally {
      console.warn = realWarn
    }
  })
})

describe('rendering outside any owner', () => {
  it('hands over a snapshot and says why', () => {
    const warnings: unknown[] = []
    const realWarn = console.warn
    console.warn = (...args: unknown[]) => {
      warnings.push(args[0])
    }
    try {
      const [enabled] = createSignal(true)
      const built = Button('x', {
        action: () => undefined,
        isEnabled: enabled,
      }).build() as unknown as {
        render: () => { props: { disabled: unknown } } | { props: { disabled: unknown } }[]
      }

      // Both framework mount paths render under an owner, so this is only
      // reached by calling render() directly. A memo made here would belong to
      // nothing and never be released, so a plain value goes over instead.
      const rendered = built.render()
      const node = Array.isArray(rendered) ? rendered[0] : rendered
      expect(typeof node?.props.disabled).toBe('boolean')
      expect(
        warnings.some(
          warning =>
            typeof warning === 'string' &&
            warning.includes('outside a reactive owner')
        )
      ).toBe(true)
    } finally {
      console.warn = realWarn
    }
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
