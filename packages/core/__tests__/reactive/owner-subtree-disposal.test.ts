/**
 * Owner subtree disposal
 *
 * Ownership was tracked through a single child registry, `OwnerImpl.sources`,
 * typed `Set<Computation>`. Computations registered themselves into it from
 * their constructor; owners never did. `createRoot` stored `this.parent` on the
 * new owner, so the link was one-directional — a child knew its parent, a
 * parent had no idea its child existed.
 *
 * A nested `createRoot` was therefore orphaned. Disposing the enclosing root
 * never reached it, so its cleanups never ran AND its computations were never
 * disposed: they kept their signal subscriptions and kept executing after
 * their owner was gone.
 *
 * `OwnerImpl.dispose` ended with `this.parent.sources.delete(this as any)` —
 * the deregistration half, written against a registration that did not exist,
 * cast past the type error that would have caught it. It could never match.
 *
 * These tests pin the repaired contract: disposal reaches the whole owner
 * subtree, deepest first.
 */

import { describe, expect, it } from 'vitest'
import {
  createDetachedRoot,
  createEffect,
  createRoot,
  createSignal,
  flushSync,
  getOwner,
  onCleanup,
  runWithOwner,
} from '../../src/reactive'
import type { Computation, Owner } from '../../src/reactive/types'

describe('owner subtree disposal', () => {
  it('registers a nested root with its parent', () => {
    createRoot(() => {
      const outer = getOwner()!
      expect(outer.childOwners.size).toBe(0)

      createRoot(() => {
        const inner = getOwner()!

        expect(inner.parent).toBe(outer)
        expect(outer.childOwners.has(inner)).toBe(true)
      })
    })
  })

  it('runs a nested root cleanup when the parent is disposed', () => {
    const order: string[] = []

    createRoot((disposeOuter) => {
      onCleanup(() => order.push('outer'))
      createRoot(() => {
        onCleanup(() => order.push('inner'))
      })

      expect(order).toEqual([])
      disposeOuter()
    })

    expect(order).toEqual(['inner', 'outer'])
  })

  it('stops a nested root effect when the parent is disposed', () => {
    // The defect this fixes: the inner effect kept firing after its enclosing
    // root was disposed, because the inner owner was never reached.
    const [get, set] = createSignal(0)
    const outerRuns: number[] = []
    const innerRuns: number[] = []

    createRoot((disposeOuter) => {
      createEffect(() => outerRuns.push(get()))
      createRoot(() => {
        createEffect(() => innerRuns.push(get()))
      })
      disposeOuter()
    })

    set(1)
    flushSync()
    set(2)
    flushSync()

    expect(outerRuns).toEqual([0])
    expect(innerRuns).toEqual([0])
  })

  it('drops the nested root effect from the signal observer set', () => {
    const [get, set] = createSignal(0)
    let innerEffect: ReturnType<typeof createEffect> | undefined

    createRoot((disposeOuter) => {
      createRoot(() => {
        innerEffect = createEffect(() => {
          get()
        })
      })
      disposeOuter()
    })

    expect(innerEffect!.sources.size).toBe(0)

    set(1)
    flushSync()
  })

  it('reaches arbitrarily deep nesting, deepest first', () => {
    const order: string[] = []

    createRoot((disposeOuter) => {
      onCleanup(() => order.push('level-0'))
      createRoot(() => {
        onCleanup(() => order.push('level-1'))
        createRoot(() => {
          onCleanup(() => order.push('level-2'))
          createRoot(() => {
            onCleanup(() => order.push('level-3'))
          })
        })
      })
      disposeOuter()
    })

    expect(order).toEqual(['level-3', 'level-2', 'level-1', 'level-0'])
  })

  it('disposes sibling nested roots in creation order', () => {
    const order: string[] = []

    createRoot((disposeOuter) => {
      createRoot(() => onCleanup(() => order.push('first')))
      createRoot(() => onCleanup(() => order.push('second')))
      createRoot(() => onCleanup(() => order.push('third')))
      disposeOuter()
    })

    expect(order).toEqual(['first', 'second', 'third'])
  })

  it('lets a nested root dispose itself without affecting the parent', () => {
    const order: string[] = []

    createRoot((disposeOuter) => {
      const outer = getOwner()!
      onCleanup(() => order.push('outer'))

      createRoot((disposeInner) => {
        onCleanup(() => order.push('inner'))
        disposeInner()
      })

      expect(order).toEqual(['inner'])
      // The self-disposed child deregistered itself.
      expect(outer.childOwners.size).toBe(0)

      disposeOuter()
    })

    // 'inner' ran exactly once, despite the parent disposing afterwards.
    expect(order).toEqual(['inner', 'outer'])
  })

  it('does not re-run a nested root cleanup when the parent disposes twice', () => {
    let innerCleanups = 0

    createRoot((disposeOuter) => {
      createRoot(() => {
        onCleanup(() => innerCleanups++)
      })
      disposeOuter()
      disposeOuter()
    })

    expect(innerCleanups).toBe(1)
  })

  it('leaves createDetachedRoot genuinely detached', () => {
    // With parentage now meaningful, this distinction is real: a detached root
    // has no parent and survives the enclosing root's disposal.
    const order: string[] = []

    createRoot((disposeOuter) => {
      const outer = getOwner()!

      createDetachedRoot(() => {
        expect(getOwner()!.parent).toBeNull()
        onCleanup(() => order.push('detached'))
      })

      expect(outer.childOwners.size).toBe(0)
      disposeOuter()
    })

    expect(order).toEqual([])
  })

  it('disposes a nested root created in an effect body when the effect reruns', () => {
    const [get, set] = createSignal(0)
    const order: string[] = []

    createRoot((disposeOuter) => {
      createEffect(() => {
        const value = get()
        createRoot(() => {
          onCleanup(() => order.push(`nested-${value}`))
        })
      })

      set(1)
      flushSync()

      // The rerun tore down the root the previous run created.
      expect(order).toEqual(['nested-0'])
      disposeOuter()
    })

    expect(order).toEqual(['nested-0', 'nested-1'])
  })

  it('registers an onCleanup inside a nested root on that root, not the effect', () => {
    // A root is an ownership boundary, so it closes the enclosing execution
    // cleanup scope opened by #270. Both scopes are torn down at the same
    // point here, so this is checked through the owner tree instead: the
    // cleanup must belong to the nested root, not to the effect.
    const order: string[] = []
    let nestedOwner: ReturnType<typeof getOwner>

    createRoot((disposeOuter) => {
      createEffect(() => {
        createRoot(() => {
          nestedOwner = getOwner()
          onCleanup(() => order.push('nested'))
        })
      })

      expect(nestedOwner!.cleanups).toHaveLength(1)
      expect(order).toEqual([])
      disposeOuter()
    })

    expect(order).toEqual(['nested'])
  })

  it('owns a root created during a rerun flushed outside the enclosing stack', () => {
    // Regression for the gap Codex flagged. `ComputationImpl.execute()` used
    // to restore `currentComputation` but not `currentOwner`, so once the
    // flush arrived on a later microtask — the normal case — `getOwner()` was
    // null during the rerun and any root created there was orphaned: it
    // survived disposal of the enclosing root with its cleanups unrun.
    //
    // Assertions are collected and checked after the flush, never inside the
    // effect body: the flush loop isolates and swallows errors thrown by a
    // computation, so an expect() in there cannot fail a test.
    const [get, set] = createSignal(0)
    const order: string[] = []
    const ownerWasNull: boolean[] = []
    let disposeOuter = () => {}

    createRoot((dispose) => {
      disposeOuter = dispose
      createEffect(() => {
        const value = get()
        ownerWasNull.push(getOwner() === null)
        createRoot(() => {
          onCleanup(() => order.push(`nested-${value}`))
        })
      })
    })

    // The flush happens outside the createRoot call stack.
    set(1)
    flushSync()

    expect(ownerWasNull).toEqual([false, false])
    // The rerun disposed the first run's root.
    expect(order).toEqual(['nested-0'])

    disposeOuter()

    expect(order).toEqual(['nested-0', 'nested-1'])
  })

  it('does not accumulate per-rerun children on the enclosing root', () => {
    // The fix Codex recommended — parenting to `this.owner` — would pile every
    // rerun's children onto the root and only release them when the root died.
    const [get, set] = createSignal(0)
    let rootOwner: ReturnType<typeof getOwner>

    createRoot((disposeOuter) => {
      rootOwner = getOwner()
      createEffect(() => {
        get()
        createRoot(() => {
          onCleanup(() => {})
        })
      })

      for (let i = 1; i <= 20; i++) {
        set(i)
        flushSync()
      }

      // One live child owner: the effect's current execution scope.
      expect(rootOwner!.childOwners!.size).toBe(1)
      disposeOuter()
    })
  })

  it('disposes an effect created during a rerun when the effect reruns again', () => {
    const [outer, setOuter] = createSignal(0)
    const [inner, setInner] = createSignal(0)
    const innerRuns: number[] = []

    createRoot(() => {
      createEffect(() => {
        outer()
        createEffect(() => {
          innerRuns.push(inner())
        })
      })
    })

    setInner(1)
    flushSync()
    expect(innerRuns).toEqual([0, 1])

    // Rerunning the outer effect disposes the inner one it previously created,
    // with no explicit disposer written by the caller.
    setOuter(1)
    flushSync()
    setInner(2)
    flushSync()

    // The replacement inner effect runs immediately against the current value
    // (1), then once more for 2. If the first inner effect had survived, 2
    // would appear twice.
    expect(innerRuns).toEqual([0, 1, 1, 2])
  })
})

describe('owner subtree disposal: foreign and legacy owners', () => {
  /**
   * An `Owner` shaped like the interface before `childOwners` and `dispose`
   * existed — what a hand-rolled JS object, a downstream structural
   * implementation, or an already-compiled consumer on an older
   * `@tachui/types` would hand to `runWithOwner`.
   */
  function createLegacyOwner(): Owner {
    return {
      id: -1,
      parent: null,
      context: new Map<symbol, unknown>(),
      cleanups: [],
      sources: new Set<Computation>(),
      disposed: false,
    } as Owner
  }

  it('does not throw when a root is created under a legacy owner', () => {
    const legacy = createLegacyOwner()
    let ran = false

    expect(() => {
      runWithOwner(legacy, () => {
        createRoot(() => {
          ran = true
        })
      })
    }).not.toThrow()

    expect(ran).toBe(true)
  })

  it('does not throw when a root under a legacy owner disposes itself', () => {
    const legacy = createLegacyOwner()
    const order: string[] = []

    expect(() => {
      runWithOwner(legacy, () => {
        createRoot((dispose) => {
          onCleanup(() => order.push('inner'))
          dispose()
        })
      })
    }).not.toThrow()

    expect(order).toEqual(['inner'])
  })

  it('runs effects normally under a legacy owner', () => {
    const legacy = createLegacyOwner()
    const [get, set] = createSignal(0)
    const seen: number[] = []

    runWithOwner(legacy, () => {
      createRoot(() => {
        createEffect(() => seen.push(get()))
      })
    })

    set(1)
    flushSync()

    expect(seen).toEqual([0, 1])
  })

  it('degrades to unparented rather than throwing, and says so', () => {
    // A legacy owner cannot record children, so a root created under it is
    // not disposed by it. That is the pre-fix behaviour, deliberately kept as
    // the fallback: silently unparented beats throwing before the body runs.
    const legacy = createLegacyOwner()
    const order: string[] = []

    runWithOwner(legacy, () => {
      createRoot(() => {
        onCleanup(() => order.push('inner'))
      })
    })

    expect(legacy.childOwners).toBeUndefined()
    expect(order).toEqual([])
  })
})
