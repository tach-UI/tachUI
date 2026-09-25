/**
 * The call plumbing the adapters share: the retry backoff, signal linking, and
 * deadlines. The adapters' own tests exercise these through real calls; these
 * pin the arithmetic and the edges directly.
 */

import { Code, ConnectError } from '@connectrpc/connect'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { linkSignals, raceAbort, retryDelay, startDeadline } from '../src/call'
import { RETRY_BASE_DELAY_MS, RETRY_MAX_DELAY_MS } from '../src/defaults'

afterEach(() => {
  vi.useRealTimers()
})

describe('retryDelay', () => {
  it('caps retry n at min(2000, 100 * 2^(n-1)) ms', () => {
    const atCap = (retryNumber: number) => retryDelay(retryNumber, () => 1)

    expect([1, 2, 3, 4, 5, 6, 7, 30].map(atCap)).toEqual([
      100, 200, 400, 800, 1_600, 2_000, 2_000, 2_000,
    ])
    expect(RETRY_BASE_DELAY_MS).toBe(100)
    expect(RETRY_MAX_DELAY_MS).toBe(2_000)
  })

  it('draws from zero up to the cap with full jitter', () => {
    expect(retryDelay(3, () => 0)).toBe(0)
    expect(retryDelay(3, () => 0.25)).toBe(100)
    // Math.random never reaches 1, so the cap itself is never drawn.
    for (let draw = 0; draw < 200; draw += 1) {
      const delay = retryDelay(4)
      expect(delay).toBeGreaterThanOrEqual(0)
      expect(delay).toBeLessThan(800)
    }
  })
})

describe('linkSignals', () => {
  it('aborts with the failure the first aborting source maps to', () => {
    const first = new AbortController()
    const second = new AbortController()
    const link = linkSignals([
      { signal: first.signal, failure: () => 'first' },
      { signal: undefined, failure: () => 'absent' },
      { signal: second.signal, failure: reason => ['second', reason] },
    ])

    second.abort('why')
    first.abort()

    expect(link.signal.reason).toEqual(['second', 'why'])
  })

  it('starts aborted for a source that already is', () => {
    const link = linkSignals([
      { signal: AbortSignal.abort('early'), failure: reason => reason },
    ])

    expect(link.signal.aborted).toBe(true)
    expect(link.signal.reason).toBe('early')
  })

  it('stops listening once released', () => {
    const source = new AbortController()
    const link = linkSignals([{ signal: source.signal, failure: () => 'late' }])

    link.release()
    source.abort()

    expect(link.signal.aborted).toBe(false)
  })
})

describe('startDeadline', () => {
  it('means no deadline for undefined or Infinity', () => {
    expect(startDeadline(undefined)).toBeUndefined()
    expect(startDeadline(Infinity)).toBeUndefined()
  })

  it('aborts with deadline_exceeded when the time is up, and not after clear()', () => {
    vi.useFakeTimers()
    const expiring = startDeadline(50)!
    const cleared = startDeadline(50)!
    cleared.clear()

    vi.advanceTimersByTime(50)

    expect(expiring.signal.reason).toBeInstanceOf(ConnectError)
    expect((expiring.signal.reason as ConnectError).code).toBe(Code.DeadlineExceeded)
    expect(cleared.signal.aborted).toBe(false)
  })

  it('has already passed at zero or less', () => {
    expect(startDeadline(0)!.signal.aborted).toBe(true)
    expect(startDeadline(-5)!.signal.aborted).toBe(true)
  })
})

describe('raceAbort', () => {
  it('rejects with the reason of a signal that has already aborted, whatever the work does', async () => {
    const reason = new Error('already')

    await expect(
      raceAbort(Promise.resolve('value'), AbortSignal.abort(reason))
    ).rejects.toBe(reason)
    // A rejection the race no longer waits for is observed, not left unhandled.
    await expect(
      raceAbort(Promise.reject(new Error('orphaned')), AbortSignal.abort(reason))
    ).rejects.toBe(reason)
  })

  it('settles as the work does, or with the reason once the signal aborts', async () => {
    const controller = new AbortController()
    await expect(raceAbort(Promise.resolve('value'), controller.signal)).resolves.toBe('value')

    const pending = raceAbort(new Promise(() => undefined), controller.signal)
    controller.abort('late')
    await expect(pending).rejects.toBe('late')
  })
})
