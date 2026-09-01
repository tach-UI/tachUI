/**
 * Enhanced reactive branch: deprecation and known-broken behaviour (#271)
 *
 * `@tachui/core` exports two reactive runtimes. The enhanced one never tracks
 * dependencies — `EnhancedEffect.execute` resolves a `setCurrentComputation`
 * member that does not exist and falls back to a no-op — so an enhanced effect
 * does not re-run when a signal it read changes.
 *
 * These tests pin that behaviour deliberately. They are NOT an endorsement:
 * they document what ships today so the removal in 0.9.0 has a reference, and
 * so the silent failure is at least written down somewhere executable.
 * Consolidation is #271, gated on the characterization in #269.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createEffect,
  createEnhancedEffect,
  createEnhancedSignal,
  createSignal,
  flushSync,
} from '../../src/reactive'
import { __resetEnhancedReactiveWarningsForTests } from '../../src/reactive/deprecation'

let warn: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  __resetEnhancedReactiveWarningsForTests()
  warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  warn.mockRestore()
})

describe('enhanced reactive deprecation (#271)', () => {
  it('warns when createEnhancedSignal is used', () => {
    createEnhancedSignal(0)

    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0][0]).toContain('createEnhancedSignal')
    expect(warn.mock.calls[0][0]).toContain('DOES NOT WORK')
  })

  it('warns when createEnhancedEffect is used', () => {
    createEnhancedEffect(() => undefined)

    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0][0]).toContain('createEnhancedEffect')
  })

  it('warns once per symbol rather than once per call', () => {
    createEnhancedSignal(0)
    createEnhancedSignal(1)
    createEnhancedSignal(2)

    expect(warn).toHaveBeenCalledTimes(1)
  })

  it('points at the standard replacement and the tracking issue', () => {
    createEnhancedEffect(() => undefined)
    const message = warn.mock.calls[0][0] as string

    expect(message).toContain('createEffect')
    expect(message).toContain('issues/271')
  })
})

describe('enhanced reactive: known-broken tracking (#271)', () => {
  // The baseline. If this ever fails, the standard graph broke, not the
  // enhanced one, and the assertions below are meaningless.
  it('standard signal + standard effect re-runs on change', () => {
    const [get, set] = createSignal(0)
    let runs = 0

    createEffect(() => {
      get()
      runs++
    })
    expect(runs).toBe(1)

    set(1)
    flushSync()

    expect(runs).toBe(2)
  })

  it('enhanced effect does NOT re-run when an enhanced signal changes', () => {
    const [get, set] = createEnhancedSignal(0)
    let runs = 0

    createEnhancedEffect(() => {
      get()
      runs++
      return undefined
    })
    expect(runs).toBe(1)

    set(1)
    flushSync()

    // Documented defect, not desired behaviour.
    expect(runs).toBe(1)
  })

  it('enhanced effect does NOT re-run for a standard signal either', () => {
    const [get, set] = createSignal(0)
    let runs = 0

    createEnhancedEffect(() => {
      get()
      runs++
      return undefined
    })
    expect(runs).toBe(1)

    set(1)
    flushSync()

    // The effect is the broken half — the signal type makes no difference.
    expect(runs).toBe(1)
  })
})
