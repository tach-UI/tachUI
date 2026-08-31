/**
 * Reactive error isolation tests (#217)
 *
 * A single throwing effect/computed must not abort the update flush (sibling
 * updates must complete) and must not be permanently disposed — it stays
 * subscribed to the sources it read before throwing and re-runs on their next
 * change. Disposal through the explicit dispose() path is unaffected.
 */

import { describe, expect, it, vi, afterEach } from 'vitest'
import {
  createComputed,
  createEffect,
  createSignal,
  flushSync,
} from '../../src/reactive'
// ComputationState is only re-exported as a type from the reactive index;
// the runtime const lives in the types re-export
import { ComputationState } from '../../src/reactive/types'

describe('reactive error isolation (#217)', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('a throwing effect does not prevent sibling effects from running', () => {
    const [value, setValue] = createSignal(0)
    const siblingValues: number[] = []

    // Throws only when the signal is set to 2
    createEffect(() => {
      if (value() === 2) {
        throw new Error('boom')
      }
    })
    createEffect(() => {
      siblingValues.push(value())
    })

    expect(siblingValues).toEqual([0])

    setValue(2)
    flushSync()

    // The sibling effect still ran with the new value in the same flush
    expect(siblingValues).toEqual([0, 2])
  })

  it('a throwing effect recovers and re-runs on subsequent updates', () => {
    const [value, setValue] = createSignal(0)
    const seen: number[] = []
    let calls = 0

    createEffect(() => {
      calls++
      const current = value()
      if (current === 2) {
        throw new Error('boom')
      }
      seen.push(current)
    })

    expect(calls).toBe(1)

    // Faulting update: the effect throws but stays subscribed
    setValue(2)
    flushSync()
    expect(calls).toBe(2)

    // Fault clears: the previously-throwing effect runs again
    setValue(3)
    flushSync()
    expect(calls).toBe(3)
    expect(seen).toEqual([0, 3])
  })

  it('reports the flush-level error via console.error', () => {
    // Production error logging is suppressed under NODE_ENV=test; stub a
    // non-test environment so the reporting path can be asserted without
    // weakening production behavior.
    vi.stubEnv('NODE_ENV', 'production')
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const [value, setValue] = createSignal(0)
    createEffect(() => {
      if (value() === 1) {
        throw new Error('reported')
      }
    })

    setValue(1)
    flushSync()

    // Both isolation layers report: the computation itself and the flush loop
    expect(errorSpy).toHaveBeenCalledWith(
      'Error in computation:',
      expect.any(Error)
    )
    expect(errorSpy).toHaveBeenCalledWith(
      'Error in computation during flush:',
      expect.any(Error)
    )
  })

  it('an early failure preserves prior dependencies so recovery stays scheduled', () => {
    const [source, setSource] = createSignal(1)
    let shouldThrow = false
    let runs = 0

    createEffect(() => {
      runs++
      // On the faulting run this guard throws BEFORE the signal is read —
      // execute() has already cleared the previous dependency set at that
      // point, so the computation must fall back to its prior subscriptions
      if (shouldThrow) {
        throw new Error('transient guard failure')
      }
      source()
    })

    expect(runs).toBe(1)

    shouldThrow = true
    setSource(2)
    flushSync()
    expect(runs).toBe(2)

    // The source subscription survived the early failure — a later change
    // must re-schedule the effect for recovery
    shouldThrow = false
    setSource(3)
    flushSync()
    expect(runs).toBe(3)
  })

  it('a failed computed surfaces the error on read instead of serving a stale value', () => {
    const [source, setSource] = createSignal(1)
    let shouldThrow = false

    const computed = createComputed(() => {
      if (shouldThrow) {
        throw new Error('computed failure')
      }
      return source() * 2
    })

    expect(computed()).toBe(2)

    // The queued recompute fails during the flush: the computed must not be
    // treated as clean — the next read re-executes and surfaces the error
    shouldThrow = true
    setSource(2)
    flushSync()
    expect(() => computed()).toThrow('computed failure')
    expect(() => computed.peek()).toThrow('computed failure')

    // Fault clears: the computed re-executes with the current source (2 * 2)
    shouldThrow = false
    expect(computed()).toBe(4)
  })

  it('a disposed computation stays disposed (explicit dispose path unaffected)', () => {
    const [value, setValue] = createSignal(0)
    let runs = 0

    const effect = createEffect(() => {
      value()
      runs++
    })

    expect(runs).toBe(1)
    expect(effect.state).toBe(ComputationState.Clean)

    effect.dispose()
    expect(effect.state).toBe(ComputationState.Disposed)

    // Signal changes must not resurrect a disposed computation
    setValue(1)
    flushSync()
    expect(runs).toBe(1)
    expect(effect.state).toBe(ComputationState.Disposed)
  })
})
