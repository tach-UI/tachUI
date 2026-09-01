/**
 * Execution-scoped effect cleanup (#270)
 *
 * Before this change an effect had no per-execution cleanup. `onCleanup`
 * registered on the owner, so it ran only when the root was disposed, and a
 * function returned from an effect body was fed back in as `previousValue`
 * and never invoked. A dependency change therefore could not cancel anything
 * the previous run had started.
 *
 * The contract these tests pin:
 *
 *   1. A returned function is a disposer. It runs before the next execution
 *      and again on final disposal, in that order.
 *   2. `onCleanup` inside a computation body is execution-scoped; outside one
 *      it stays owner-scoped.
 *   3. Ordering is deterministic: registration order, with a returned disposer
 *      last because it is registered when the body returns.
 *
 * The pre-change behaviour is recorded in `graph-characterization.test.ts`.
 */

import { describe, expect, it, vi } from 'vitest'
import {
  batch,
  createEffect,
  createRenderEffect,
  createRoot,
  createSignal,
  flushSync,
  onCleanup,
  untrack,
} from '../../src/reactive'

describe('returned disposer (#270)', () => {
  it('runs the disposer before the next execution', () => {
    const [get, set] = createSignal(0)
    const order: string[] = []

    createEffect(() => {
      const value = get()
      order.push(`run-${value}`)
      return () => order.push(`dispose-${value}`)
    })

    set(1)
    flushSync()
    set(2)
    flushSync()

    expect(order).toEqual([
      'run-0',
      'dispose-0',
      'run-1',
      'dispose-1',
      'run-2',
    ])
  })

  it('runs the disposer again on final disposal', () => {
    const [get, set] = createSignal(0)
    const order: string[] = []

    const effect = createEffect(() => {
      const value = get()
      return () => order.push(`dispose-${value}`)
    })

    set(1)
    flushSync()
    expect(order).toEqual(['dispose-0'])

    effect.dispose()

    expect(order).toEqual(['dispose-0', 'dispose-1'])
  })

  it('runs the disposer when the owning root is disposed', () => {
    const order: string[] = []

    createRoot((dispose) => {
      createEffect(() => {
        return () => order.push('disposed')
      })

      expect(order).toEqual([])
      dispose()
    })

    expect(order).toEqual(['disposed'])
  })

  it('runs each disposer exactly once', () => {
    const [get, set] = createSignal(0)
    let calls = 0

    const effect = createEffect(() => {
      get()
      return () => calls++
    })

    set(1)
    flushSync()
    expect(calls).toBe(1)

    effect.dispose()
    expect(calls).toBe(2)

    // Disposing twice must not re-run the last disposer.
    effect.dispose()
    expect(calls).toBe(2)
  })

  it('does not feed the disposer back in as previousValue', () => {
    const [get, set] = createSignal(0)
    const seen: unknown[] = []

    createEffect((prev) => {
      seen.push(prev)
      get()
      return () => {}
    })

    set(1)
    flushSync()

    expect(seen).toEqual([undefined, undefined])
  })

  it('still passes a returned non-function value through as previousValue', () => {
    const [get, set] = createSignal(1)
    const seen: (number | undefined)[] = []

    createEffect<number>((prev) => {
      seen.push(prev)
      return get() * 10
    })

    set(2)
    flushSync()

    expect(seen).toEqual([undefined, 10])
  })

  it('supports a run that returns a disposer only on some executions', () => {
    const [enabled, setEnabled] = createSignal(false)
    const order: string[] = []

    createEffect(() => {
      if (!enabled()) {
        order.push('idle')
        return
      }
      order.push('open')
      return () => order.push('close')
    })

    setEnabled(true)
    flushSync()
    setEnabled(false)
    flushSync()

    expect(order).toEqual(['idle', 'open', 'close', 'idle'])
  })

  it('supports the disposer on createRenderEffect too', () => {
    const [get, set] = createSignal(0)
    const order: string[] = []

    createRenderEffect(() => {
      const value = get()
      return () => order.push(`dispose-${value}`)
    })

    set(1)
    flushSync()

    expect(order).toEqual(['dispose-0'])
  })
})

describe('execution-scoped onCleanup (#270)', () => {
  it('runs an onCleanup from the previous run before the next run', () => {
    const [get, set] = createSignal(0)
    const order: string[] = []

    createEffect(() => {
      const value = get()
      onCleanup(() => order.push(`cleanup-${value}`))
      order.push(`run-${value}`)
    })

    set(1)
    flushSync()

    expect(order).toEqual(['run-0', 'cleanup-0', 'run-1'])
  })

  it('does not accumulate cleanups across runs', () => {
    const [get, set] = createSignal(0)
    let calls = 0

    createRoot((dispose) => {
      createEffect(() => {
        get()
        onCleanup(() => calls++)
      })

      for (let i = 1; i <= 5; i++) {
        set(i)
        flushSync()
      }

      // Five reruns tore down five prior runs; the fifth run's cleanup is
      // still pending.
      expect(calls).toBe(5)
      dispose()
    })

    expect(calls).toBe(6)
  })

  it('keeps owner-scoped registration outside a computation body', () => {
    const order: string[] = []

    createRoot((dispose) => {
      onCleanup(() => order.push('owner'))
      createEffect(() => {
        onCleanup(() => order.push('effect'))
      })

      expect(order).toEqual([])
      dispose()
    })

    // Child computations are disposed before owner cleanups run, so the
    // effect's execution scope drains first.
    expect(order).toEqual(['effect', 'owner'])
  })

  it('registers a cleanup made inside untrack on the execution scope', () => {
    // untrack suspends dependency tracking, not the cleanup scope.
    const [tracked, setTracked] = createSignal(0)
    const order: string[] = []

    createEffect(() => {
      const value = tracked()
      untrack(() => {
        onCleanup(() => order.push(`cleanup-${value}`))
      })
    })

    setTracked(1)
    flushSync()

    expect(order).toEqual(['cleanup-0'])
  })
})

describe('cleanup ordering (#270)', () => {
  it('runs cleanups in registration order, disposer last', () => {
    const [get, set] = createSignal(0)
    const order: string[] = []

    createEffect(() => {
      get()
      onCleanup(() => order.push('first'))
      onCleanup(() => order.push('second'))
      return () => order.push('disposer')
    })

    set(1)
    flushSync()

    expect(order).toEqual(['first', 'second', 'disposer'])
  })

  it('tears the previous run down completely before the next run starts', () => {
    const [get, set] = createSignal(0)
    const order: string[] = []

    createEffect(() => {
      const value = get()
      onCleanup(() => order.push(`cleanup-${value}`))
      order.push(`body-${value}`)
      return () => order.push(`disposer-${value}`)
    })

    set(1)
    flushSync()

    expect(order).toEqual([
      'body-0',
      'cleanup-0',
      'disposer-0',
      'body-1',
    ])
  })

  it('runs cleanup once per flush when several dependencies change together', () => {
    const [a, setA] = createSignal(0)
    const [b, setB] = createSignal(0)
    let cleanups = 0

    createEffect(() => {
      a()
      b()
      onCleanup(() => cleanups++)
    })

    batch(() => {
      setA(1)
      setB(1)
    })

    expect(cleanups).toBe(1)
  })

  it('nests: an inner effect is torn down when the outer effect reruns', () => {
    const [outer, setOuter] = createSignal(0)
    const [inner, setInner] = createSignal(0)
    const innerRuns: number[] = []

    createEffect(() => {
      outer()
      const child = createEffect(() => {
        innerRuns.push(inner())
      })
      return () => child.dispose()
    })

    setInner(1)
    flushSync()
    expect(innerRuns).toEqual([0, 1])

    // Rerunning the outer effect disposes the old inner effect and creates a
    // fresh one, so the count grows by exactly one per inner change.
    setOuter(1)
    flushSync()
    expect(innerRuns).toEqual([0, 1, 1])

    setInner(2)
    flushSync()

    // If the first inner effect had survived, this would push 2 twice.
    expect(innerRuns).toEqual([0, 1, 1, 2])
  })
})

describe('cleanup failure isolation (#270)', () => {
  it('runs the remaining cleanups when one throws, and still reruns the effect', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const [get, set] = createSignal(0)
    const order: string[] = []

    try {
      createEffect(() => {
        const value = get()
        onCleanup(() => {
          throw new Error('cleanup boom')
        })
        onCleanup(() => order.push(`after-${value}`))
        order.push(`run-${value}`)
      })

      set(1)
      flushSync()

      expect(order).toEqual(['run-0', 'after-0', 'run-1'])
      expect(error).toHaveBeenCalled()
    } finally {
      error.mockRestore()
    }
  })

  it('runs the previous run cleanup even when the previous run threw', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const [get, set] = createSignal(0)
    const order: string[] = []

    try {
      createEffect(() => {
        const value = get()
        onCleanup(() => order.push(`cleanup-${value}`))
        if (value === 1) throw new Error('boom')
      })

      set(1)
      flushSync()
      expect(order).toEqual(['cleanup-0'])

      set(2)
      flushSync()

      // The failing run registered its cleanup before throwing; it must not
      // be stranded.
      expect(order).toEqual(['cleanup-0', 'cleanup-1'])
    } finally {
      error.mockRestore()
    }
  })

  it('does not register a cleanup on a disposed effect without running it', () => {
    let calls = 0

    createRoot((dispose) => {
      const effect = createEffect(() => {})
      effect.dispose()
      effect.addCleanup(() => calls++)
      dispose()
    })

    // Nothing would ever drain it, so it runs immediately rather than leaking.
    expect(calls).toBe(1)
  })
})
