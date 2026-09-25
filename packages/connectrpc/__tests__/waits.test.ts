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
  resumeWhenJoined,
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

describe('resumeWhenJoined', () => {
  const noBounds = { signal: undefined, timeoutMs: undefined, onGiveUp: () => undefined }

  function stopped(): { client: QueryClient; execution: Execution; reason: unknown } {
    const client = newClient()
    watch(client, watcher(AbortSignal.abort()).watcher)
    const execution = beginExecution(client, key)
    return { client, execution, reason: execution.stop.signal.reason }
  }

  function outcome(pending: Promise<void>): { settled: unknown } {
    const seen: { settled: unknown } = { settled: 'pending' }
    pending.then(
      () => (seen.settled = 'resumed'),
      (error: unknown) => (seen.settled = error)
    )
    return seen
  }

  it('starts a stopped execution over for somebody who joined it', async () => {
    const { client, execution, reason } = stopped()
    new Wait(execution, noBounds)

    await resumeWhenJoined(client, key, execution, reason, new AbortController().signal)

    expect(execution.stop.signal.aborted).toBe(false)
  })

  it('holds a watched execution nobody waits on until somebody joins', async () => {
    const { client, execution, reason } = stopped()
    const held = outcome(
      resumeWhenJoined(client, key, execution, reason, new AbortController().signal)
    )
    await Promise.resolve()
    expect(held.settled).toBe('pending')

    new Wait(execution, noBounds)
    await Promise.resolve()

    expect(held.settled).toBe('resumed')
    expect(execution.stop.signal.aborted).toBe(false)
  })

  it('is not woken by a joiner that gives up at once', async () => {
    const { client, execution, reason } = stopped()
    const held = outcome(
      resumeWhenJoined(client, key, execution, reason, new AbortController().signal)
    )

    new Wait(execution, { ...noBounds, signal: AbortSignal.abort() })
    await Promise.resolve()

    expect(held.settled).toBe('pending')
  })

  it("lets go with the stop once the loader's own signal aborts", async () => {
    const { client, execution, reason } = stopped()
    const loader = new AbortController()
    const held = outcome(resumeWhenJoined(client, key, execution, reason, loader.signal))

    loader.abort()
    await Promise.resolve()

    expect(held.settled).toBe(reason)
    new Wait(execution, noBounds)
    expect(execution.stop.signal.aborted).toBe(true)
  })

  it('rejects with the failure for another failure, once settled, or never stopped', async () => {
    const live = new AbortController().signal
    const { client, execution, reason } = stopped()
    new Wait(execution, noBounds)
    const other = new ConnectError('other', Code.Canceled)
    await expect(resumeWhenJoined(client, key, execution, other, live)).rejects.toBe(other)

    settleExecution(client, execution, false)
    await expect(resumeWhenJoined(client, key, execution, reason, live)).rejects.toBe(reason)
    expect(execution.stop.signal.aborted).toBe(true)

    const running = beginExecution(newClient(), key)
    await expect(
      resumeWhenJoined(newClient(), key, running, undefined, live)
    ).rejects.toBeUndefined()
  })

  it("detaches the query layer's flight, recording nothing, when nobody watches the entry", async () => {
    const client = newClient()
    let loaderSignal: AbortSignal | undefined
    void client
      .fetchQuery({
        key: () => key,
        load: ({ signal }) => {
          loaderSignal = signal
          return new Promise(() => undefined)
        },
      })
      .catch(() => undefined)
    const execution = beginExecution(client, key)
    new Wait(execution, noBounds).giveUp(new ConnectError('gone', Code.Canceled))
    const reason = execution.stop.signal.reason

    await expect(
      resumeWhenJoined(client, key, execution, reason, loaderSignal!)
    ).rejects.toBe(reason)

    expect(loaderSignal?.aborted).toBe(true)
    const observation = client.observe(key)
    expect(observation.entry().fetchStatus).toBe('idle')
    expect(observation.entry().status).toBe('idle')
    expect(observation.entry().error).toBeUndefined()
    observation.release({ keepInFlight: true })
  })
})
