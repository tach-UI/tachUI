/**
 * Per-observer waits on shared executions, driven directly. The query tests
 * exercise these through real observers; these pin the announcement and the
 * restart of a stopped execution, which observers reach only in narrow orders.
 */

import { Code, ConnectError } from '@connectrpc/connect'
import { createQueryClient, hashQueryKey } from '@tachui/query'
import type { QueryClient } from '@tachui/query'
import { afterEach, describe, expect, it } from 'vitest'

import {
  beginExecution,
  resumeIfJoined,
  settleExecution,
  Wait,
  watchEntry,
} from '../src/waits'
import type { Execution, Watcher } from '../src/waits'

const clients: QueryClient[] = []
const unwatchers: (() => void)[] = []

afterEach(() => {
  for (const unwatch of unwatchers.splice(0)) {
    unwatch()
  }
  for (const client of clients.splice(0)) {
    client.dispose()
  }
})

const key = ['connect', 'waits']

function newClient(): QueryClient {
  const client = createQueryClient()
  clients.push(client)
  return client
}

/** A watcher that waits on every execution with the given signal. */
function watcher(signal?: AbortSignal): { watcher: Watcher; failures: unknown[] } {
  const failures: unknown[] = []
  return {
    failures,
    watcher: {
      begin: execution => {
        new Wait(execution, {
          signal,
          timeoutMs: undefined,
          onGiveUp: failure => failures.push(failure),
        })
      },
      settled: () => undefined,
    },
  }
}

function watch(client: QueryClient, entry: Watcher): void {
  unwatchers.push(watchEntry(client, hashQueryKey(key), entry))
}

describe('beginExecution', () => {
  it('does not stop an execution while announcing it, when a later watcher still waits', () => {
    const client = newClient()
    const execution = beginExecution(client, key)
    settleExecution(client, execution, true)
    const doomed = watcher(AbortSignal.abort())
    const healthy = watcher()
    watch(client, doomed.watcher)
    watch(client, healthy.watcher)

    const next = beginExecution(client, key)

    expect(doomed.failures).toHaveLength(1)
    expect(healthy.failures).toHaveLength(0)
    expect(next.waits.size).toBe(1)
    expect(next.stop.signal.aborted).toBe(false)
  })

  it('stops an execution once announced if every watcher gave up', () => {
    const client = newClient()
    watch(client, watcher(AbortSignal.abort()).watcher)

    const execution = beginExecution(client, key)

    expect(execution.stop.signal.aborted).toBe(true)
    expect((execution.stop.signal.reason as ConnectError).code).toBe(Code.Canceled)
  })

  it('leaves an execution nobody watches running, for a refetch to join', () => {
    const execution = beginExecution(newClient(), key)

    expect(execution.stop.signal.aborted).toBe(false)
  })
})

describe('resumeIfJoined', () => {
  function stopped(): { client: QueryClient; execution: Execution; reason: unknown } {
    const client = newClient()
    watch(client, watcher(AbortSignal.abort()).watcher)
    const execution = beginExecution(client, key)
    return { client, execution, reason: execution.stop.signal.reason }
  }

  it('starts a stopped execution over for somebody who joined it', () => {
    const { execution, reason } = stopped()
    new Wait(execution, { signal: undefined, timeoutMs: undefined, onGiveUp: () => undefined })

    expect(resumeIfJoined(execution, reason)).toBe(true)
    expect(execution.stop.signal.aborted).toBe(false)
  })

  it('leaves it stopped with nobody waiting, for another failure, or once settled', () => {
    const { client, execution, reason } = stopped()
    expect(resumeIfJoined(execution, reason)).toBe(false)

    new Wait(execution, { signal: undefined, timeoutMs: undefined, onGiveUp: () => undefined })
    expect(resumeIfJoined(execution, new ConnectError('other', Code.Canceled))).toBe(false)

    settleExecution(client, execution, false)
    expect(resumeIfJoined(execution, reason)).toBe(false)
    expect(execution.stop.signal.aborted).toBe(true)
  })

  it('does nothing for an execution that was never stopped', () => {
    const execution = beginExecution(newClient(), key)

    expect(resumeIfJoined(execution, undefined)).toBe(false)
  })
})
