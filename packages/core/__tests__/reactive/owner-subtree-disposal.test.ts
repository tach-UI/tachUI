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
} from '../../src/reactive'

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

  it('disposes nested roots created inside an effect body', () => {
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

      // A nested root is owned by the enclosing owner, not by the effect, so
      // both runs' roots are still alive here — an effect rerun does not
      // dispose the root the previous run created. Use a returned disposer if
      // per-run teardown is wanted.
      expect(order).toEqual([])
      disposeOuter()
    })

    expect(order).toEqual(['nested-0', 'nested-1'])
  })

  it('registers an onCleanup inside a nested root on that root, not the effect', () => {
    // A root is an ownership boundary, so it closes the enclosing execution
    // cleanup scope opened by #270. Without that, this cleanup would land on
    // the effect's execution scope and fire on the effect's next run.
    const [get, set] = createSignal(0)
    const order: string[] = []

    createRoot((disposeOuter) => {
      createEffect(() => {
        get()
        createRoot(() => {
          onCleanup(() => order.push('nested'))
        })
      })

      set(1)
      flushSync()

      expect(order).toEqual([])
      disposeOuter()
    })

    expect(order).toEqual(['nested', 'nested'])
  })

  it('LIMIT: a root created during a rerun flushed outside the owner stack is orphaned', () => {
    // `ComputationImpl.execute()` restores `currentComputation` but not
    // `currentOwner`. When the flush happens inside the enclosing createRoot
    // call stack the owner is still set, but once it happens outside — the
    // normal microtask case — `getOwner()` is null during the rerun and any
    // root created there has no parent to dispose it.
    //
    // Pre-existing and distinct from the owner-subtree fix: closing it means
    // making a computation establish an owner scope for its own execution.
    // Characterized, not endorsed.
    const [get, set] = createSignal(0)
    const order: string[] = []
    let disposeOuter = () => {}

    createRoot((dispose) => {
      disposeOuter = dispose
      createEffect(() => {
        const value = get()
        expect(getOwner() === null).toBe(value !== 0)
        createRoot(() => {
          onCleanup(() => order.push(`nested-${value}`))
        })
      })
    })

    set(1)
    flushSync()
    disposeOuter()

    // 'nested-1' is missing: that root was created with no owner.
    expect(order).toEqual(['nested-0'])
  })
})
