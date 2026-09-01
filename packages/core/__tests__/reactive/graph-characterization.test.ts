/**
 * Standard reactive graph: characterization baseline (#269)
 *
 * Phase 0 of ADR 0001 changes published reactive behaviour: `createEffect`
 * gains execution-scoped cleanup (#270) and the parallel enhanced graph is
 * removed (#271). This file pins what the *standard* graph does today so any
 * later diff is provably intentional rather than incidental.
 *
 * These are characterization tests, not specification tests. Where a block
 * records behaviour that Phase 0 deliberately changes, it says so and names
 * the issue. The enhanced graph's (broken) behaviour is characterized
 * separately in `enhanced-deprecation.test.ts`.
 *
 * Audit required by #269 — every effect in the workspace that returns a
 * function, i.e. the exact population whose behaviour #270 changes:
 *
 *   - `packages/mobile/src/ActionSheet.ts:696`        (production)
 *   - `packages/navigation/src/unified-tab-view.ts:415` (production)
 *   - `packages/core/__tests__/assets/ColorAsset-reactive.test.ts:322` (test)
 *
 * All three return a teardown closure that today is silently swallowed as
 * `previousValue`, so all three leak. None of them consumes `previousValue`,
 * so none regresses when #270 starts invoking the returned function.
 */

import { describe, expect, it, vi } from 'vitest'
import {
  batch,
  createComputed,
  createEffect,
  createRoot,
  createSignal,
  flushSync,
  onCleanup,
  untrack,
} from '../../src/reactive'
import { ComputationState } from '../../src/reactive/types'

describe('standard graph characterization: dependency tracking (#269)', () => {
  it('re-runs an effect when a tracked signal changes', () => {
    const [get, set] = createSignal(0)
    const seen: number[] = []

    createEffect(() => {
      seen.push(get())
    })
    expect(seen).toEqual([0])

    set(1)
    flushSync()

    expect(seen).toEqual([0, 1])
  })

  it('does not re-run when a signal is set to an equal value', () => {
    const [get, set] = createSignal(0)
    let runs = 0

    createEffect(() => {
      get()
      runs++
    })

    set(0)
    flushSync()

    expect(runs).toBe(1)
  })

  it('runs an effect once per flush regardless of how many of its sources changed', () => {
    const [a, setA] = createSignal(0)
    const [b, setB] = createSignal(0)
    let runs = 0

    createEffect(() => {
      a()
      b()
      runs++
    })
    expect(runs).toBe(1)

    setA(1)
    setB(1)
    flushSync()

    expect(runs).toBe(2)
  })

  it('does not track reads made inside untrack', () => {
    const [tracked, setTracked] = createSignal(0)
    const [hidden, setHidden] = createSignal(0)
    let runs = 0

    createEffect(() => {
      tracked()
      untrack(() => hidden())
      runs++
    })

    setHidden(1)
    flushSync()
    expect(runs).toBe(1)

    setTracked(1)
    flushSync()
    expect(runs).toBe(2)
  })

  it('does not track reads made through peek', () => {
    const [get, set] = createSignal(0)
    let runs = 0

    createEffect(() => {
      get.peek()
      runs++
    })

    set(1)
    flushSync()

    expect(runs).toBe(1)
  })
})

describe('standard graph characterization: conditional dependencies (#269)', () => {
  it('drops a subscription once a branch stops reading it', () => {
    const [useFirst, setUseFirst] = createSignal(true)
    const [first, setFirst] = createSignal('a')
    const [second, setSecond] = createSignal('z')
    const seen: string[] = []

    createEffect(() => {
      seen.push(useFirst() ? first() : second())
    })
    expect(seen).toEqual(['a'])

    // Switch branches; the effect now reads `second` and not `first`.
    setUseFirst(false)
    flushSync()
    expect(seen).toEqual(['a', 'z'])

    // `first` is no longer a dependency: changing it must not re-run.
    setFirst('b')
    flushSync()
    expect(seen).toEqual(['a', 'z'])

    setSecond('y')
    flushSync()
    expect(seen).toEqual(['a', 'z', 'y'])
  })

  it('leaves no stale observer on a signal the effect stopped reading', () => {
    const [useFirst, setUseFirst] = createSignal(true)
    const [first] = createSignal('a')
    const [second] = createSignal('z')

    const effect = createEffect(() => {
      return useFirst() ? first() : second()
    })

    expect(effect.sources.size).toBe(2) // useFirst + first

    setUseFirst(false)
    flushSync()

    // Still two sources, but the *set* changed: useFirst + second.
    expect(effect.sources.size).toBe(2)
  })

  it('re-subscribes when a branch reads a signal again', () => {
    const [useFirst, setUseFirst] = createSignal(true)
    const [first, setFirst] = createSignal('a')
    const [second] = createSignal('z')
    const seen: string[] = []

    createEffect(() => {
      seen.push(useFirst() ? first() : second())
    })

    setUseFirst(false)
    flushSync()
    setUseFirst(true)
    flushSync()
    expect(seen).toEqual(['a', 'z', 'a'])

    setFirst('b')
    flushSync()

    expect(seen).toEqual(['a', 'z', 'a', 'b'])
  })
})

describe('standard graph characterization: batching and scheduler timing (#269)', () => {
  it('coalesces writes inside batch into a single effect run', () => {
    const [get, set] = createSignal(0)
    const seen: number[] = []

    createEffect(() => {
      seen.push(get())
    })

    batch(() => {
      set(1)
      set(2)
      set(3)
    })

    expect(seen).toEqual([0, 3])
  })

  it('flushes only when the outermost batch completes', () => {
    const [get, set] = createSignal(0)
    let runs = 0

    createEffect(() => {
      get()
      runs++
    })

    batch(() => {
      set(1)
      batch(() => {
        set(2)
      })
      // The inner batch must not have flushed.
      expect(runs).toBe(1)
    })

    expect(runs).toBe(2)
  })

  it('defers an unbatched update to a microtask rather than running it synchronously', async () => {
    const [get, set] = createSignal(0)
    let runs = 0

    createEffect(() => {
      get()
      runs++
    })

    set(1)
    // Not yet: the update is queued on the microtask queue.
    expect(runs).toBe(1)

    await Promise.resolve()

    expect(runs).toBe(2)
  })

  it('flushSync drains the queue immediately', () => {
    const [get, set] = createSignal(0)
    let runs = 0

    createEffect(() => {
      get()
      runs++
    })

    set(1)
    flushSync()

    expect(runs).toBe(2)
  })

  it('processes a flush in ascending computation id order', () => {
    const [get, set] = createSignal(0)
    const order: string[] = []

    createEffect(() => {
      get()
      order.push('first')
    })
    createEffect(() => {
      get()
      order.push('second')
    })

    order.length = 0
    set(1)
    flushSync()

    expect(order).toEqual(['first', 'second'])
  })

  it('runs computations queued during a flush within the same flush', () => {
    const [a, setA] = createSignal(0)
    const [b, setB] = createSignal(0)
    const seen: number[] = []

    createEffect(() => {
      const value = a()
      if (value > 0) setB(value)
    })
    createEffect(() => {
      seen.push(b())
    })

    setA(5)
    flushSync()

    expect(seen).toEqual([0, 5])
  })
})

describe('standard graph characterization: error propagation and recovery (#269)', () => {
  it('propagates synchronously out of the initial effect execution', () => {
    expect(() => {
      createEffect(() => {
        throw new Error('boom')
      })
    }).toThrow('boom')
  })

  it('leaves a failed effect Dirty rather than Clean or Disposed', () => {
    const [get, set] = createSignal(0)

    const effect = createEffect(() => {
      if (get() === 1) throw new Error('boom')
    })
    expect(effect.state).toBe(ComputationState.Clean)

    set(1)
    flushSync()

    expect(effect.state).toBe(ComputationState.Dirty)
  })

  it('retains subscriptions from a failed run so recovery stays scheduled', () => {
    const [get, set] = createSignal(0)

    const effect = createEffect(() => {
      if (get() === 1) throw new Error('boom')
    })
    expect(effect.sources.size).toBe(1)

    set(1)
    flushSync()

    // The failing run threw before re-reading anything, but the previous
    // sources were restored, so the effect is still wired for recovery.
    expect(effect.sources.size).toBe(1)
  })

  it('recovers on the next update after a failing run', () => {
    const [get, set] = createSignal(0)
    let runs = 0

    // The first execution must succeed, or createEffect throws before returning.
    createEffect(() => {
      const value = get()
      runs++
      if (value === 1) throw new Error('boom')
    })

    set(1)
    flushSync()
    expect(runs).toBe(2)

    set(2)
    flushSync()

    expect(runs).toBe(3)
  })

  it('isolates a throwing effect from its siblings during a flush', () => {
    const [get, set] = createSignal(0)
    let siblingRuns = 0

    createEffect(() => {
      if (get() === 1) throw new Error('boom')
    })
    createEffect(() => {
      get()
      siblingRuns++
    })

    set(1)
    flushSync()

    expect(siblingRuns).toBe(2)
  })

  it('surfaces a failed computed on read instead of serving the stale cached value', () => {
    const [get, set] = createSignal(0)
    const doubled = createComputed(() => {
      if (get() === 1) throw new Error('boom')
      return get() * 2
    })

    expect(doubled()).toBe(0)

    set(1)

    expect(() => doubled()).toThrow('boom')
  })
})

describe('standard graph characterization: disposal ordering (#269)', () => {
  it('runs owner cleanups in registration order on dispose', () => {
    const order: string[] = []

    createRoot((dispose) => {
      onCleanup(() => order.push('first'))
      onCleanup(() => order.push('second'))
      onCleanup(() => order.push('third'))
      dispose()
    })

    expect(order).toEqual(['first', 'second', 'third'])
  })

  it('disposes child computations before running owner cleanups', () => {
    const order: string[] = []
    const [get, set] = createSignal(0)

    createRoot((dispose) => {
      createEffect(() => {
        get()
        order.push('effect-run')
      })
      onCleanup(() => order.push('cleanup'))

      order.length = 0
      dispose()
    })

    expect(order).toEqual(['cleanup'])

    // The disposed effect must not run again.
    set(1)
    flushSync()
    expect(order).toEqual(['cleanup'])
  })

  it('is idempotent: a second dispose runs no cleanup twice', () => {
    let runs = 0

    createRoot((dispose) => {
      onCleanup(() => runs++)
      dispose()
      dispose()
    })

    expect(runs).toBe(1)
  })

  it('disposes a nested root when its parent root is disposed', () => {
    // Before the owner-subtree fix this asserted ['outer']: OwnerImpl recorded
    // `this.parent` but never added itself to any parent-side registry, so the
    // outer dispose never reached the inner owner.
    const order: string[] = []

    createRoot((disposeOuter) => {
      onCleanup(() => order.push('outer'))
      createRoot(() => {
        onCleanup(() => order.push('inner'))
      })
      disposeOuter()
    })

    expect(order).toEqual(['inner', 'outer'])
  })

  it('continues past a throwing cleanup and reports it', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const order: string[] = []

    try {
      createRoot((dispose) => {
        onCleanup(() => {
          throw new Error('cleanup boom')
        })
        onCleanup(() => order.push('after'))
        dispose()
      })

      expect(order).toEqual(['after'])
      expect(error).toHaveBeenCalled()
    } finally {
      error.mockRestore()
    }
  })

  it('drops a disposed effect from its signals observer sets', () => {
    const [get, set] = createSignal(0)
    let runs = 0

    const effect = createEffect(() => {
      get()
      runs++
    })

    effect.dispose()
    expect(effect.sources.size).toBe(0)

    set(1)
    flushSync()

    expect(runs).toBe(1)
  })

  it('registers onCleanup on the effect execution, not on the owner (#270)', () => {
    // Before #270 this accumulated three cleanups on the owner and ran none of
    // them until disposal. Now each run tears down the run before it.
    const [get, set] = createSignal(0)
    const order: string[] = []

    createRoot((dispose) => {
      createEffect(() => {
        const value = get()
        onCleanup(() => order.push(`cleanup-${value}`))
      })

      set(1)
      flushSync()
      expect(order).toEqual(['cleanup-0'])

      set(2)
      flushSync()
      expect(order).toEqual(['cleanup-0', 'cleanup-1'])

      dispose()
    })

    expect(order).toEqual(['cleanup-0', 'cleanup-1', 'cleanup-2'])
  })

  it('still registers onCleanup on the owner outside a computation body (#270)', () => {
    const order: string[] = []

    createRoot((dispose) => {
      onCleanup(() => order.push('owner'))
      expect(order).toEqual([])
      dispose()
    })

    expect(order).toEqual(['owner'])
  })
})

describe('standard graph characterization: effect return values (#269)', () => {
  // This block records the contract that #270 changes. A non-function return
  // value must keep flowing into the next run as `previousValue`; a function
  // return value is the population #270 reinterprets as a disposer.

  it('passes a returned non-function value into the next run as previousValue', () => {
    const [get, set] = createSignal(1)
    const seen: (number | undefined)[] = []

    createEffect<number>((prev) => {
      seen.push(prev)
      return get() * 10
    })

    set(2)
    flushSync()
    set(3)
    flushSync()

    expect(seen).toEqual([undefined, 10, 20])
  })

  it('passes undefined as previousValue on the first run', () => {
    const seen: unknown[] = []

    createEffect((prev) => {
      seen.push(prev)
      return 'value'
    })

    expect(seen).toEqual([undefined])
  })

  it('CHANGED BY #270: a returned function is a disposer, not a previousValue', () => {
    // Before #270 this asserted the opposite: the returned function was fed
    // back as `previousValue` and never invoked, so every run leaked.
    const [get, set] = createSignal(0)
    let disposerCalls = 0
    const seen: unknown[] = []

    createEffect((prev) => {
      seen.push(prev)
      get()
      return () => {
        disposerCalls++
      }
    })

    set(1)
    flushSync()

    expect(disposerCalls).toBe(1)
    expect(seen).toEqual([undefined, undefined])
  })
})
