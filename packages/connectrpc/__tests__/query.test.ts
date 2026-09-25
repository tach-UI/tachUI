/**
 * `createConnectQuery`: a unary method's response observed through
 * `@tachui/query`.
 *
 * Calls go through a scripted transport that records what it was handed and
 * settles when told, so each test decides when and how a call ends. Timing is
 * driven by fake timers wherever a deadline or a backoff is the subject.
 */

import { create } from '@bufbuild/protobuf'
import type { DescMessage, DescMethodUnary } from '@bufbuild/protobuf'
import { Code, ConnectError } from '@connectrpc/connect'
import {
  createComponentContext,
  createEffect,
  createRoot,
  createSignal,
  runWithComponentContext,
} from '@tachui/core'
import { createQueryClient, provideQueryClient } from '@tachui/query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ConnectAdapterError } from '../src/errors'
import { buildConnectKey } from '../src/keys'
import { createConnectQuery } from '../src/query'
import { provideConnectTransport, useConnectTransport } from '../src/transport'
import type { ConnectQueryResult } from '../src/types'
import {
  GetUserRequestSchema,
  ListUsersRequestSchema,
  WatchUsers,
} from './fixtures/schema'
import {
  disposeScopes,
  fieldOf,
  getUser,
  listUsers,
  scope,
  scriptedTransport,
  settle,
} from './support/harness'
import type { Scope } from './support/harness'

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  disposeScopes()
})

/** The name a user response carries, for comparing messages briefly. */
function nameOf(message: unknown): unknown {
  return fieldOf(message, 'name')
}

/** Lets exactly `count` microtasks run. */
async function microtasks(count: number): Promise<void> {
  for (let turn = 0; turn < count; turn += 1) {
    await Promise.resolve()
  }
}

/** Whether `error` is the adapter's own record of a call nobody waited for. */
function isAbandonment(error: unknown): boolean {
  return (
    error instanceof ConnectError &&
    error.message.includes('no observer is still waiting')
  )
}

/**
 * Mounts a query and records every status and error its signals hold, so a
 * test can say what an observer never showed.
 */
function mountRecorded(
  root: Scope,
  create: () => ConnectQueryResult<unknown>
): {
  query: ConnectQueryResult<unknown>
  seen: { status: string; error: unknown }[]
} {
  const seen: { status: string; error: unknown }[] = []
  const { value: query } = root.mount(() => {
    const observed = create()
    createEffect(() => {
      seen.push({ status: observed.status(), error: observed.error() })
    })
    return observed
  })
  return { query, seen }
}

describe('calls and results', () => {
  it('calls the default transport with the keyed request and exposes the response', async () => {
    const { transport, calls } = scriptedTransport(call =>
      call.respond({ name: 'Ada' })
    )
    const root = scope({ default: transport })

    const { value: query } = root.mount(() =>
      createConnectQuery(getUser, () => ({ id: 7n }))
    )
    await settle()

    expect(calls).toHaveLength(1)
    expect(calls[0].method).toBe(getUser)
    expect(calls[0].input).toEqual(create(GetUserRequestSchema, { id: 7n }))
    expect(query.status()).toBe('success')
    expect(nameOf(query.data())).toBe('Ada')
    expect(query.error()).toBeUndefined()

    // The response is cached under the key built from that same request.
    const { key } = buildConnectKey(getUser, () => ({ id: 7n }))
    const observation = root.client.observe(key)
    expect(nameOf(observation.entry().data)).toBe('Ada')
    observation.release()
  })

  it('calls the named transport it was given, and only that one', async () => {
    const fallback = scriptedTransport(call => call.respond({ name: 'default' }))
    const account = scriptedTransport(call => call.respond({ name: 'account' }))
    const root = scope({ default: fallback.transport, account: account.transport })

    const { value: query } = root.mount(() =>
      createConnectQuery(getUser, () => ({ id: 1n }), { transport: 'account' })
    )
    await settle()

    expect(account.calls).toHaveLength(1)
    expect(fallback.calls).toHaveLength(0)
    expect(nameOf(query.data())).toBe('account')
  })

  it('refetches through the transport and resolves with the new response', async () => {
    let served = 0
    const { transport, calls } = scriptedTransport(call =>
      call.respond({ name: `v${(served += 1)}` })
    )
    const root = scope({ default: transport })
    const { value: query } = root.mount(() =>
      createConnectQuery(getUser, () => ({ id: 1n }))
    )
    await settle()
    expect(nameOf(query.data())).toBe('v1')

    const refetched = await query.refetch()

    expect(calls).toHaveLength(2)
    expect(nameOf(refetched)).toBe('v2')
    await settle()
    expect(nameOf(query.data())).toBe('v2')
  })

  it('projects the response through select', async () => {
    const { transport } = scriptedTransport(call => call.respond({ name: 'Ada' }))
    const root = scope({ default: transport })

    const { value: query } = root.mount(() =>
      createConnectQuery(getUser, () => ({ id: 1n }), {
        select: response => String(nameOf(response)).length,
      })
    )
    await settle()

    expect(query.data()).toBe(3)
    await expect(query.refetch()).resolves.toBe(3)
  })

  it('refuses a streaming method', () => {
    const { transport } = scriptedTransport()
    const root = scope({ default: transport })

    expect(() =>
      root.mount(() =>
        createConnectQuery(
          WatchUsers as unknown as DescMethodUnary<DescMessage, DescMessage>,
          () => ({})
        )
      )
    ).toThrowError(/server_streaming method/)
  })

  it('names no streaming adapter the package does not have when refusing a stream', () => {
    const { transport } = scriptedTransport()
    const root = scope({ default: transport })

    let failure: unknown
    try {
      root.mount(() =>
        createConnectQuery(
          WatchUsers as unknown as DescMethodUnary<DescMessage, DescMessage>,
          () => ({})
        )
      )
    } catch (error) {
      failure = error
    }

    expect(failure).toBeInstanceOf(ConnectAdapterError)
    expect((failure as Error).message).toMatch(/Only unary methods are supported/)
    expect((failure as Error).message).not.toMatch(/createConnectStream/)
  })

  it('refuses something that is not a method descriptor', () => {
    const { transport } = scriptedTransport()
    const root = scope({ default: transport })

    expect(() =>
      root.mount(() =>
        createConnectQuery(
          null as unknown as DescMethodUnary<DescMessage, DescMessage>,
          () => ({})
        )
      )
    ).toThrowError(ConnectAdapterError)
  })
})

describe('transport resolution', () => {
  it("keeps #285's diagnostic for a transport nobody provided", () => {
    const { transport } = scriptedTransport()
    const root = scope({ default: transport })

    let expected: unknown
    try {
      root.mount(() => useConnectTransport('account'))
    } catch (error) {
      expected = error
    }

    expect(() =>
      root.mount(() =>
        createConnectQuery(getUser, () => ({ id: 1n }), { transport: 'account' })
      )
    ).toThrowError((expected as Error).message)
  })

  it('keeps the diagnostic for a name its client has bound to another transport', () => {
    const outer = scriptedTransport()
    const shadowing = scriptedTransport()
    const root = scope({ default: outer.transport })
    // One nested client, shared by two children: the first binds the name to
    // its own transport, so the second — which would inherit the root's —
    // cannot resolve it to a different one.
    const nested = createQueryClient()
    const first = createComponentContext('first', root.context)
    runWithComponentContext(first, () => {
      provideQueryClient(nested)
      provideConnectTransport(shadowing.transport)
    })
    const second = createComponentContext('second', root.context)
    runWithComponentContext(second, () => provideQueryClient(nested))

    expect(() =>
      runWithComponentContext(second, () =>
        createRoot(() => createConnectQuery(getUser, () => ({ id: 1n })))
      )
    ).toThrowError(/resolves here to a different Transport/)
    expect(outer.calls).toHaveLength(0)
    nested.dispose()
  })

  it('refuses a client option that is not the one the transport is bound to', () => {
    const { transport, calls } = scriptedTransport(call => call.respond({}))
    const root = scope({ default: transport })
    const other = createQueryClient()

    expect(() =>
      root.mount(() =>
        createConnectQuery(getUser, () => ({ id: 1n }), { client: other })
      )
    ).toThrowError(/not the QueryClient the default transport/)

    // Nothing was called, and nothing was cached in either client.
    expect(calls).toHaveLength(0)
    const { key } = buildConnectKey(getUser, () => ({ id: 1n }))
    for (const client of [other, root.client]) {
      const observation = client.observe(key)
      expect(observation.entry().status).toBe('idle')
      observation.release()
    }
    other.dispose()
  })

  it('accepts a client option that is the one the transport is bound to', async () => {
    const { transport } = scriptedTransport(call => call.respond({ name: 'Ada' }))
    const root = scope({ default: transport })

    const { value: query } = root.mount(() =>
      createConnectQuery(getUser, () => ({ id: 1n }), { client: root.client })
    )
    await settle()

    expect(nameOf(query.data())).toBe('Ada')
  })
})

describe('keys and requests', () => {
  it('builds each key and its request from one evaluation of the input', async () => {
    const { transport, calls } = scriptedTransport(call => call.respond({}))
    const root = scope({ default: transport })
    let evaluations = 0

    root.mount(() =>
      createConnectQuery(listUsers, () => ({ pageSize: (evaluations += 1) }))
    )
    await settle()

    expect(evaluations).toBe(1)
    expect(calls[0].input).toEqual(create(ListUsersRequestSchema, { pageSize: 1 }))
    const { key } = buildConnectKey(listUsers, () => ({ pageSize: 1 }))
    const observation = root.client.observe(key)
    expect(observation.entry().status).toBe('success')
    observation.release()
  })

  it('sends the keyed snapshot on every attempt, even if the caller changes its object', async () => {
    vi.useFakeTimers()
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    const { transport, calls } = scriptedTransport()
    const root = scope({ default: transport })
    const request = { pageSize: 50 }

    const { value: query } = root.mount(() =>
      createConnectQuery(listUsers, () => request, { retry: 1 })
    )
    await vi.advanceTimersByTimeAsync(0)
    calls[0].fail(new ConnectError('busy', Code.Unavailable))
    await vi.advanceTimersByTimeAsync(0)

    request.pageSize = 99
    await vi.advanceTimersByTimeAsync(100)

    expect(calls).toHaveLength(2)
    expect(calls[1].input).toEqual(create(ListUsersRequestSchema, { pageSize: 50 }))
    calls[1].respond({ nextPageToken: 'fifty' })
    await vi.advanceTimersByTimeAsync(0)
    expect(fieldOf(query.data(), 'nextPageToken')).toBe('fifty')
  })

  it("never lets a retry's result populate the key the input moved to", async () => {
    vi.useFakeTimers()
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    const { transport, calls } = scriptedTransport()
    const root = scope({ default: transport })
    const [size, setSize] = createSignal(50)

    const { value: moving } = root.mount(() =>
      createConnectQuery(listUsers, () => ({ pageSize: size() }), { retry: 1 })
    )
    // A second observer of the first key keeps its execution alive.
    const { value: staying } = root.mount(() =>
      createConnectQuery(listUsers, () => ({ pageSize: 50 }), { retry: 1 })
    )
    await vi.advanceTimersByTimeAsync(0)
    expect(calls).toHaveLength(1)
    calls[0].fail(new ConnectError('busy', Code.Unavailable))
    await vi.advanceTimersByTimeAsync(0)

    // The input moves during the backoff.
    setSize(60)
    await vi.advanceTimersByTimeAsync(0)
    const moved = calls.find(call => (call.input as { pageSize: number }).pageSize === 60)
    expect(moved).toBeDefined()

    await vi.advanceTimersByTimeAsync(100)
    const retried = calls.filter(call => (call.input as { pageSize: number }).pageSize === 50)
    expect(retried).toHaveLength(2)
    retried[1].respond({ nextPageToken: 'for-50' })
    moved!.respond({ nextPageToken: 'for-60' })
    await vi.advanceTimersByTimeAsync(0)

    expect(fieldOf(staying.data(), 'nextPageToken')).toBe('for-50')
    expect(fieldOf(moving.data(), 'nextPageToken')).toBe('for-60')
  })

  it('shares one entry and one call between equivalent requests', async () => {
    const { transport, calls } = scriptedTransport()
    const root = scope({ default: transport })

    const { value: plain } = root.mount(() =>
      createConnectQuery(listUsers, () => ({ pageSize: 50 }))
    )
    const { value: message } = root.mount(() =>
      createConnectQuery(listUsers, () =>
        create(ListUsersRequestSchema, { pageSize: 50 })
      )
    )
    await settle()

    expect(calls).toHaveLength(1)
    calls[0].respond({ nextPageToken: 'shared' })
    await settle()
    expect(plain.data()).toBe(message.data())
  })

  it('keeps different requests, extensions, transports, and clients apart', async () => {
    const first = scriptedTransport(call => call.respond({}))
    const second = scriptedTransport(call => call.respond({}))
    const root = scope({ default: first.transport, other: second.transport })
    const elsewhere = scope({ default: first.transport })

    root.mount(() => createConnectQuery(listUsers, () => ({ pageSize: 1 })))
    root.mount(() => createConnectQuery(listUsers, () => ({ pageSize: 2 })))
    root.mount(() =>
      createConnectQuery(listUsers, () => ({ pageSize: 1 }), {
        keyExtension: () => ['tenant-a'],
      })
    )
    root.mount(() =>
      createConnectQuery(listUsers, () => ({ pageSize: 1 }), { transport: 'other' })
    )
    elsewhere.mount(() => createConnectQuery(listUsers, () => ({ pageSize: 1 })))
    await settle()

    // Four distinct entries on the first transport (two clients among them),
    // and one on the other.
    expect(first.calls).toHaveLength(4)
    expect(second.calls).toHaveLength(1)
  })

  it('keeps headers and context values out of the key', async () => {
    const { transport, calls } = scriptedTransport()
    const root = scope({ default: transport })

    root.mount(() =>
      createConnectQuery(getUser, () => ({ id: 1n }), {
        callOptions: { headers: { authorization: 'Bearer one' } },
      })
    )
    root.mount(() =>
      createConnectQuery(getUser, () => ({ id: 1n }), {
        callOptions: { headers: { authorization: 'Bearer two' } },
      })
    )
    await settle()

    // One call: the headers did not split the entry, and nothing of them
    // reached the key.
    expect(calls).toHaveLength(1)
    const { key } = buildConnectKey(getUser, () => ({ id: 1n }))
    expect(JSON.stringify(key)).not.toMatch(/Bearer/)
  })

  it('separates response-affecting identity only through keyExtension', async () => {
    const { transport, calls } = scriptedTransport()
    const root = scope({ default: transport })

    for (const tenant of ['a', 'b']) {
      root.mount(() =>
        createConnectQuery(getUser, () => ({ id: 1n }), {
          callOptions: { headers: { 'x-tenant': tenant } },
          keyExtension: () => [tenant],
        })
      )
    }
    await settle()

    expect(calls.map(call => new Headers(call.header).get('x-tenant'))).toEqual([
      'a',
      'b',
    ])
  })

  it('surfaces a request that cannot be keyed through error, without a call', async () => {
    const { transport, calls } = scriptedTransport()
    const root = scope({ default: transport })

    const { value: query } = root.mount(() =>
      createConnectQuery(getUser, () => null as unknown as { id: bigint })
    )
    await settle()

    expect(calls).toHaveLength(0)
    expect(query.status()).toBe('error')
    expect(query.error()).toBeInstanceOf(ConnectAdapterError)
    await expect(query.refetch()).rejects.toBe(query.error())
  })

  it('recovers when the input becomes keyable again', async () => {
    const { transport, calls } = scriptedTransport(call => call.respond({ name: 'Ada' }))
    const root = scope({ default: transport })
    const [valid, setValid] = createSignal(false)

    const { value: query } = root.mount(() =>
      createConnectQuery(getUser, () =>
        valid() ? { id: 1n } : (null as unknown as { id: bigint })
      )
    )
    await settle()
    expect(query.error()).toBeInstanceOf(ConnectAdapterError)
    query.invalidate()

    setValid(true)
    await settle()

    expect(calls).toHaveLength(1)
    expect(query.status()).toBe('success')
    expect(query.error()).toBeUndefined()
  })
})

describe('call options', () => {
  it('passes headers and context values, never a deadline, to a shared call', async () => {
    vi.useFakeTimers()
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const { transport, calls } = scriptedTransport()
    const root = scope({ default: transport })
    const headers = { 'x-trace': 'abc' }
    const contextValues = { get: () => undefined, set: () => contextValues, delete: () => contextValues } as never

    root.mount(() =>
      createConnectQuery(getUser, () => ({ id: 1n }), {
        retry: 1,
        callOptions: { headers, contextValues, timeoutMs: 60_000 },
      })
    )
    await vi.advanceTimersByTimeAsync(0)
    calls[0].fail(new ConnectError('busy', Code.Unavailable))
    await vi.advanceTimersByTimeAsync(0)

    expect(calls).toHaveLength(2)
    for (const call of calls) {
      expect(call.header).toBe(headers)
      expect(call.contextValues).toBe(contextValues)
      expect(call.timeoutMs).toBeUndefined()
    }
  })

  it('passes absent values when no call options are given', async () => {
    const { transport, calls } = scriptedTransport()
    const root = scope({ default: transport })

    root.mount(() => createConnectQuery(getUser, () => ({ id: 1n })))
    await settle()

    expect(calls[0].header).toBeUndefined()
    expect(calls[0].contextValues).toBeUndefined()
    expect(calls[0].timeoutMs).toBeUndefined()
    expect(calls[0].signal).toBeInstanceOf(AbortSignal)
  })

  it('refuses malformed call options', () => {
    const { transport } = scriptedTransport()
    const root = scope({ default: transport })

    for (const callOptions of [[], 'soon', { timeoutMs: Number.NaN }, { timeoutMs: '5' }]) {
      expect(() =>
        root.mount(() =>
          createConnectQuery(getUser, () => ({ id: 1n }), {
            callOptions: callOptions as never,
          })
        )
      ).toThrowError(ConnectAdapterError)
    }
  })

  it.each([
    ['null', null],
    ['a string', 'abort'],
    ['an object shaped like a signal', { aborted: false }],
  ])(
    'refuses %s as the signal before any call, leaving a sharer of the key unharmed',
    async (_name, signal) => {
      const { transport, calls } = scriptedTransport()
      const root = scope({ default: transport })
      const { value: healthy } = root.mount(() =>
        createConnectQuery(getUser, () => ({ id: 1n }))
      )
      await settle()
      expect(calls).toHaveLength(1)

      expect(() =>
        root.mount(() =>
          createConnectQuery(getUser, () => ({ id: 1n }), {
            callOptions: { signal: signal as never },
          })
        )
      ).toThrowError(ConnectAdapterError)
      await settle()

      expect(calls).toHaveLength(1)
      expect(calls[0].signal?.aborted).toBe(false)
      calls[0].respond({ name: 'v1' })
      await settle()
      expect(healthy.error()).toBeUndefined()
      expect(nameOf(healthy.data())).toBe('v1')

      const refetched = healthy.refetch()
      calls[1].respond({ name: 'v2' })
      expect(nameOf(await refetched)).toBe('v2')
    }
  )

  it('refuses a finite deadline longer than a timer can hold, rather than expiring at once', () => {
    const { transport, calls } = scriptedTransport()
    const root = scope({ default: transport })

    for (const timeoutMs of [2_147_483_648, Number.MAX_SAFE_INTEGER]) {
      expect(() =>
        root.mount(() =>
          createConnectQuery(getUser, () => ({ id: 1n }), {
            callOptions: { timeoutMs },
          })
        )
      ).toThrowError(/longer than the 2147483647 ms a timer can hold/)
    }
    expect(calls).toHaveLength(0)
  })

  it('accepts the longest deadline a timer can hold, and Infinity', async () => {
    vi.useFakeTimers()
    const { transport, calls } = scriptedTransport()
    const root = scope({ default: transport })

    const queries = [2_147_483_647, Infinity].map(
      timeoutMs =>
        root.mount(() =>
          createConnectQuery(getUser, () => ({ id: 1n }), {
            callOptions: { timeoutMs },
          })
        ).value
    )
    await vi.advanceTimersByTimeAsync(1_000)

    expect(calls).toHaveLength(1)
    for (const query of queries) {
      expect(query.error()).toBeUndefined()
      expect(query.fetchStatus()).toBe('fetching')
    }
  })
})

describe('cancellation and deadlines', () => {
  it("aborts the call when the only observer's signal aborts", async () => {
    const { transport, calls } = scriptedTransport()
    const root = scope({ default: transport })
    const controller = new AbortController()

    const { value: query } = root.mount(() =>
      createConnectQuery(getUser, () => ({ id: 1n }), {
        callOptions: { signal: controller.signal },
      })
    )
    await settle()
    const refetched = query.refetch().catch((error: unknown) => error)

    controller.abort()
    await settle()

    expect(calls[0].signal?.aborted).toBe(true)
    expect(query.error()).toBeInstanceOf(ConnectError)
    expect((query.error() as ConnectError).code).toBe(Code.Canceled)
    expect(query.status()).toBe('error')
    expect(query.fetchStatus()).toBe('idle')
    expect(await refetched).toBe(query.error())
  })

  it('makes no call for a signal aborted in advance', async () => {
    const { transport, calls } = scriptedTransport()
    const root = scope({ default: transport })

    const { value: query } = root.mount(() =>
      createConnectQuery(getUser, () => ({ id: 1n }), {
        callOptions: { signal: AbortSignal.abort() },
      })
    )
    await settle()

    expect(calls).toHaveLength(0)
    expect((query.error() as ConnectError).code).toBe(Code.Canceled)
  })

  it('aborts the call when its owner is disposed', async () => {
    const { transport, calls } = scriptedTransport()
    const root = scope({ default: transport })

    const { value: query, dispose } = root.mount(() =>
      createConnectQuery(getUser, () => ({ id: 1n }))
    )
    await settle()
    const refetched = query.refetch()

    dispose()

    expect(calls.every(call => call.signal?.aborted)).toBe(true)
    const failure = await refetched.catch((error: unknown) => error)
    expect(failure).toBeInstanceOf(ConnectError)
    expect((failure as ConnectError).code).toBe(Code.Canceled)
  })

  it('settles cancel() promptly with canceled, though the transport never answers', async () => {
    const { transport, calls } = scriptedTransport()
    const root = scope({ default: transport })

    const { value: query } = root.mount(() =>
      createConnectQuery(getUser, () => ({ id: 1n }))
    )
    await settle()
    const refetched = query.refetch()

    query.cancel()

    const failure = await refetched.catch((error: unknown) => error)
    expect((failure as ConnectError).code).toBe(Code.Canceled)
    expect(query.error()).toBe(failure)
    expect(calls.every(call => call.signal?.aborted)).toBe(true)
  })

  it('does nothing on cancel() with nothing in flight', async () => {
    const { transport } = scriptedTransport(call => call.respond({ name: 'Ada' }))
    const root = scope({ default: transport })
    const { value: query } = root.mount(() =>
      createConnectQuery(getUser, () => ({ id: 1n }))
    )
    await settle()

    query.cancel()

    expect(query.status()).toBe('success')
    expect(query.error()).toBeUndefined()
  })

  it("settles one observer's deadline without ending another's wait", async () => {
    vi.useFakeTimers()
    const { transport, calls } = scriptedTransport()
    const root = scope({ default: transport })

    const { value: hurried } = root.mount(() =>
      createConnectQuery(getUser, () => ({ id: 1n }), {
        callOptions: { timeoutMs: 1_000 },
      })
    )
    const { value: patient } = root.mount(() =>
      createConnectQuery(getUser, () => ({ id: 1n }))
    )
    await vi.advanceTimersByTimeAsync(0)
    expect(calls).toHaveLength(1)
    const hurriedRefetch = hurried.refetch().catch((error: unknown) => error)

    await vi.advanceTimersByTimeAsync(1_000)

    expect((hurried.error() as ConnectError).code).toBe(Code.DeadlineExceeded)
    expect(await hurriedRefetch).toBe(hurried.error())
    // The shared call goes on for the observer still waiting.
    expect(calls).toHaveLength(1)
    expect(calls[0].signal?.aborted).toBe(false)
    expect(patient.fetchStatus()).toBe('fetching')

    calls[0].respond({ name: 'late' })
    await vi.advanceTimersByTimeAsync(0)
    expect(nameOf(patient.data())).toBe('late')
    // The response is in the cache now, so the hurried observer shows it too.
    expect(hurried.error()).toBeUndefined()
    expect(nameOf(hurried.data())).toBe('late')
  })

  it("settles one observer's signal without ending another's wait", async () => {
    const { transport, calls } = scriptedTransport()
    const root = scope({ default: transport })
    const controller = new AbortController()

    const { value: leaving } = root.mount(() =>
      createConnectQuery(getUser, () => ({ id: 1n }), {
        callOptions: { signal: controller.signal },
      })
    )
    const { value: staying } = root.mount(() =>
      createConnectQuery(getUser, () => ({ id: 1n }))
    )
    await settle()
    const stayingRefetch = staying.refetch()

    controller.abort()
    await settle()

    expect((leaving.error() as ConnectError).code).toBe(Code.Canceled)
    expect(calls.every(call => call.signal?.aborted === false)).toBe(true)
    calls[calls.length - 1].respond({ name: 'kept' })
    expect(nameOf(await stayingRefetch)).toBe('kept')
  })

  it('stops the shared call once every observer has given up', async () => {
    vi.useFakeTimers()
    const { transport, calls } = scriptedTransport()
    const root = scope({ default: transport })

    const { value: first } = root.mount(() =>
      createConnectQuery(getUser, () => ({ id: 1n }), {
        callOptions: { timeoutMs: 100 },
      })
    )
    const { value: second } = root.mount(() =>
      createConnectQuery(getUser, () => ({ id: 1n }), {
        callOptions: { timeoutMs: 200 },
      })
    )
    await vi.advanceTimersByTimeAsync(100)
    expect(calls[0].signal?.aborted).toBe(false)

    await vi.advanceTimersByTimeAsync(100)

    expect(calls[0].signal?.aborted).toBe(true)
    expect((first.error() as ConnectError).code).toBe(Code.DeadlineExceeded)
    expect((second.error() as ConnectError).code).toBe(Code.DeadlineExceeded)
  })

  it('cancels the underlying call when the last observer leaves', async () => {
    const { transport, calls } = scriptedTransport()
    const root = scope({ default: transport })

    const first = root.mount(() => createConnectQuery(getUser, () => ({ id: 1n })))
    const second = root.mount(() => createConnectQuery(getUser, () => ({ id: 1n })))
    await settle()

    first.dispose()
    expect(calls[0].signal?.aborted).toBe(false)
    second.dispose()
    expect(calls[0].signal?.aborted).toBe(true)
  })

  it('bounds the whole wait, retries and backoff included', async () => {
    vi.useFakeTimers()
    vi.spyOn(Math, 'random').mockReturnValue(0.999)
    const { transport, calls } = scriptedTransport(call =>
      call.fail(new ConnectError('busy', Code.Unavailable))
    )
    const root = scope({ default: transport })

    const { value: query } = root.mount(() =>
      createConnectQuery(getUser, () => ({ id: 1n }), {
        retry: 10,
        callOptions: { timeoutMs: 250 },
      })
    )
    // Attempts at 0, ~100, and ~300 ms; the deadline lands between the second
    // and the third.
    await vi.advanceTimersByTimeAsync(250)
    expect(calls).toHaveLength(2)
    expect((query.error() as ConnectError).code).toBe(Code.DeadlineExceeded)

    await vi.advanceTimersByTimeAsync(10_000)
    expect(calls).toHaveLength(2)
  })

  describe.each([
    ['a signal aborted in advance', { signal: AbortSignal.abort() }],
    ['a deadline of zero', { timeoutMs: 0 }],
  ])('an observer with %s sharing a key', (_name, doomedCallOptions) => {
    const doomedCode =
      'signal' in doomedCallOptions ? Code.Canceled : Code.DeadlineExceeded

    it.each([
      ['mounted first', true],
      ['mounted second', false],
    ])('settles only its own wait when %s', async (_order, doomedFirst) => {
      const { transport, calls } = scriptedTransport()
      const root = scope({ default: transport })
      const mountDoomed = () =>
        root.mount(() =>
          createConnectQuery(getUser, () => ({ id: 1n }), {
            callOptions: doomedCallOptions,
          })
        ).value
      const mountHealthy = () =>
        root.mount(() => createConnectQuery(getUser, () => ({ id: 1n }))).value

      const doomed = doomedFirst ? mountDoomed() : undefined
      const healthy = mountHealthy()
      const late = doomed ?? mountDoomed()
      await settle()

      // The call went out for the healthy observer; the doomed one gave up
      // on its own.
      expect(calls).toHaveLength(1)
      expect(calls[0].signal?.aborted).toBe(false)
      expect((late.error() as ConnectError).code).toBe(doomedCode)
      expect(healthy.error()).toBeUndefined()
      expect(healthy.fetchStatus()).toBe('fetching')

      calls[0].respond({ name: 'v1' })
      await settle()
      expect(nameOf(healthy.data())).toBe('v1')
      expect(healthy.error()).toBeUndefined()

      // Nothing was poisoned: the doomed observer's refetch settles on its
      // own, and the healthy one refetches as usual.
      const failure = await late.refetch().catch((error: unknown) => error)
      expect((failure as ConnectError).code).toBe(doomedCode)
      const refetched = healthy.refetch()
      expect(calls).toHaveLength(2)
      calls[1].respond({ name: 'v2' })
      expect(nameOf(await refetched)).toBe('v2')
    })
  })

  it("starts the call again for a refetch issued as the sole observer's deadline expires", async () => {
    vi.useFakeTimers()
    const { transport, calls } = scriptedTransport()
    const root = scope({ default: transport })
    const { value: query } = root.mount(() =>
      createConnectQuery(getUser, () => ({ id: 1n }), {
        callOptions: { timeoutMs: 100 },
      })
    )
    await vi.advanceTimersByTimeAsync(0)
    expect(calls).toHaveLength(1)

    // Synchronously: the deadline stops the call, and before its rejection
    // lands, a refetch joins the flight it belongs to.
    vi.advanceTimersByTime(100)
    expect(calls[0].signal?.aborted).toBe(true)
    const refetched = query.refetch()
    await vi.advanceTimersByTimeAsync(0)

    expect(calls).toHaveLength(2)
    expect(calls[1].signal?.aborted).toBe(false)
    calls[1].respond({ name: 'restarted' })
    expect(nameOf(await refetched)).toBe('restarted')
    expect(query.error()).toBeUndefined()
    expect(nameOf(query.data())).toBe('restarted')
  })

  it("answers an observer mounted as the sole observer's deadline expires", async () => {
    vi.useFakeTimers()
    const { transport, calls } = scriptedTransport()
    const root = scope({ default: transport })
    const { value: hurried } = root.mount(() =>
      createConnectQuery(getUser, () => ({ id: 1n }), {
        callOptions: { timeoutMs: 100 },
      })
    )
    await vi.advanceTimersByTimeAsync(0)

    vi.advanceTimersByTime(100)
    const { value: newcomer } = root.mount(() =>
      createConnectQuery(getUser, () => ({ id: 1n }))
    )
    await vi.advanceTimersByTimeAsync(0)

    expect((hurried.error() as ConnectError).code).toBe(Code.DeadlineExceeded)
    expect(newcomer.error()).toBeUndefined()
    expect(calls).toHaveLength(2)
    calls[1].respond({ name: 'for the newcomer' })
    await vi.advanceTimersByTimeAsync(0)
    expect(newcomer.error()).toBeUndefined()
    expect(nameOf(newcomer.data())).toBe('for the newcomer')
  })

  it.each([3, 4, 5, 6])(
    "starts a new call for a refetch %i microtasks after the sole observer's deadline expires",
    async turns => {
      vi.useFakeTimers()
      const { transport, calls } = scriptedTransport()
      const root = scope({ default: transport })
      const { value: query } = root.mount(() =>
        createConnectQuery(getUser, () => ({ id: 1n }), {
          callOptions: { timeoutMs: 100 },
        })
      )
      await vi.advanceTimersByTimeAsync(0)

      vi.advanceTimersByTime(100)
      await microtasks(turns)
      const refetched = query.refetch().catch((error: unknown) => error)
      await vi.advanceTimersByTimeAsync(0)

      expect(calls).toHaveLength(2)
      calls[1].respond({ name: 'restarted' })
      expect(nameOf(await refetched)).toBe('restarted')
      expect(query.error()).toBeUndefined()
    }
  )

  it.each([3, 4, 5, 6])(
    "starts a new call for an observer mounted %i microtasks after the sole observer's deadline expires",
    async turns => {
      vi.useFakeTimers()
      const { transport, calls } = scriptedTransport()
      const root = scope({ default: transport })
      root.mount(() =>
        createConnectQuery(getUser, () => ({ id: 1n }), {
          callOptions: { timeoutMs: 100 },
        })
      )
      await vi.advanceTimersByTimeAsync(0)

      vi.advanceTimersByTime(100)
      await microtasks(turns)
      const { query: newcomer, seen } = mountRecorded(root, () =>
        createConnectQuery(getUser, () => ({ id: 1n }))
      )
      await vi.advanceTimersByTimeAsync(0)

      expect(calls).toHaveLength(2)
      calls[1].respond({ name: 'for the newcomer' })
      await vi.advanceTimersByTimeAsync(0)
      expect(nameOf(newcomer.data())).toBe('for the newcomer')
      expect(seen.some(({ error }) => error !== undefined)).toBe(false)
    }
  )

  describe('a call every observer gave up on', () => {
    it("never shows a later observer the adapter's own cancellation", async () => {
      vi.useFakeTimers()
      const { transport, calls } = scriptedTransport()
      const root = scope({ default: transport })
      const { value: hurried } = root.mount(() =>
        createConnectQuery(getUser, () => ({ id: 1n }), {
          callOptions: { timeoutMs: 100 },
        })
      )
      await vi.advanceTimersByTimeAsync(100)
      expect((hurried.error() as ConnectError).code).toBe(Code.DeadlineExceeded)
      expect(calls[0].signal?.aborted).toBe(true)
      await vi.advanceTimersByTimeAsync(1_000)

      const { query: later, seen } = mountRecorded(root, () =>
        createConnectQuery(getUser, () => ({ id: 1n }))
      )
      await vi.advanceTimersByTimeAsync(0)

      expect(calls).toHaveLength(2)
      calls[1].respond({ name: 'fresh' })
      await vi.advanceTimersByTimeAsync(0)
      expect(nameOf(later.data())).toBe('fresh')
      expect(seen.some(({ error }) => isAbandonment(error))).toBe(false)
      expect(seen.some(({ status }) => status === 'error')).toBe(false)
    })

    it('leaves cached data showing as success to a later observer', async () => {
      vi.useFakeTimers()
      const { transport, calls } = scriptedTransport()
      const root = scope({ default: transport })
      const { value: hurried } = root.mount(() =>
        createConnectQuery(getUser, () => ({ id: 1n }), {
          staleTime: 60_000,
          callOptions: { timeoutMs: 100 },
        })
      )
      await vi.advanceTimersByTimeAsync(0)
      calls[0].respond({ name: 'cached' })
      await vi.advanceTimersByTimeAsync(0)

      const expired = hurried.refetch().catch((error: unknown) => error)
      await vi.advanceTimersByTimeAsync(100)
      expect(((await expired) as ConnectError).code).toBe(Code.DeadlineExceeded)
      await vi.advanceTimersByTimeAsync(1_000)

      const { query: later, seen } = mountRecorded(root, () =>
        createConnectQuery(getUser, () => ({ id: 1n }), { staleTime: 60_000 })
      )
      await vi.advanceTimersByTimeAsync(0)

      expect(nameOf(later.data())).toBe('cached')
      expect(later.status()).toBe('success')
      expect(seen.every(({ status }) => status === 'success')).toBe(true)
      expect(seen.some(({ error }) => error !== undefined)).toBe(false)
    })

    it('never shows a later observer the cancellation of a signal aborted in advance', async () => {
      const { transport, calls } = scriptedTransport()
      const root = scope({ default: transport })
      const { value: doomed } = root.mount(() =>
        createConnectQuery(getUser, () => ({ id: 1n }), {
          callOptions: { signal: AbortSignal.abort() },
        })
      )
      await settle()
      expect((doomed.error() as ConnectError).code).toBe(Code.Canceled)
      expect(calls).toHaveLength(0)

      const { query: later, seen } = mountRecorded(root, () =>
        createConnectQuery(getUser, () => ({ id: 1n }))
      )
      await settle()

      expect(calls).toHaveLength(1)
      calls[0].respond({ name: 'fresh' })
      await settle()
      expect(nameOf(later.data())).toBe('fresh')
      expect(seen.some(({ error }) => isAbandonment(error))).toBe(false)
      expect(seen.some(({ status }) => status === 'error')).toBe(false)
    })
  })

  it('applies a deadline of zero at once', async () => {
    const { transport, calls } = scriptedTransport()
    const root = scope({ default: transport })

    const { value: query } = root.mount(() =>
      createConnectQuery(getUser, () => ({ id: 1n }), {
        callOptions: { timeoutMs: 0 },
      })
    )
    await settle()

    expect(calls).toHaveLength(0)
    expect((query.error() as ConnectError).code).toBe(Code.DeadlineExceeded)
  })
})

describe("the result's methods", () => {
  it('refetches a gated query on demand, bounded by its own deadline', async () => {
    vi.useFakeTimers()
    const { transport, calls } = scriptedTransport()
    const root = scope({ default: transport })

    const { value: query } = root.mount(() =>
      createConnectQuery(getUser, () => ({ id: 1n }), {
        enabled: false,
        callOptions: { timeoutMs: 500 },
      })
    )
    await vi.advanceTimersByTimeAsync(0)
    expect(calls).toHaveLength(0)

    const answered = query.refetch()
    calls[0].respond({ name: 'on demand' })
    expect(nameOf(await answered)).toBe('on demand')

    const expired = query.refetch().catch((error: unknown) => error)
    await vi.advanceTimersByTimeAsync(500)
    expect(((await expired) as ConnectError).code).toBe(Code.DeadlineExceeded)
    // A gated query shows nothing, as in @tachui/query.
    expect(query.status()).toBe('idle')
  })

  it('waits again when refetched after giving up, on the call still running', async () => {
    vi.useFakeTimers()
    const { transport, calls } = scriptedTransport()
    const root = scope({ default: transport })

    const { value: hurried } = root.mount(() =>
      createConnectQuery(getUser, () => ({ id: 1n }), {
        callOptions: { timeoutMs: 100 },
      })
    )
    root.mount(() => createConnectQuery(getUser, () => ({ id: 1n })))
    await vi.advanceTimersByTimeAsync(100)
    expect((hurried.error() as ConnectError).code).toBe(Code.DeadlineExceeded)

    const again = hurried.refetch()
    // Joined the call already running, rather than starting another.
    expect(calls).toHaveLength(1)
    expect(hurried.error()).toBeUndefined()
    calls[0].respond({ name: 'joined' })

    expect(nameOf(await again)).toBe('joined')
  })

  it('rejects a refetch at once when its signal has already aborted', async () => {
    const { transport, calls } = scriptedTransport()
    const root = scope({ default: transport })

    const { value: query } = root.mount(() =>
      createConnectQuery(getUser, () => ({ id: 1n }), {
        callOptions: { signal: AbortSignal.abort() },
      })
    )
    await settle()

    const failure = await query.refetch().catch((error: unknown) => error)

    expect((failure as ConnectError).code).toBe(Code.Canceled)
    expect(calls).toHaveLength(0)
  })

  it('reloads through the transport when invalidated', async () => {
    let served = 0
    const { transport, calls } = scriptedTransport(call =>
      call.respond({ name: `v${(served += 1)}` })
    )
    const root = scope({ default: transport })
    const { value: query } = root.mount(() =>
      createConnectQuery(getUser, () => ({ id: 1n }))
    )
    await settle()

    query.invalidate()
    await settle()

    expect(calls).toHaveLength(2)
    expect(nameOf(query.data())).toBe('v2')
  })

  it('cancels a pending refetch when disposed, and ignores later changes', async () => {
    const { transport, calls } = scriptedTransport()
    const root = scope({ default: transport })
    const [id, setId] = createSignal(1n)
    const { value: query } = root.mount(() =>
      createConnectQuery(getUser, () => ({ id: id() }))
    )
    await settle()
    const pending = query.refetch().catch((error: unknown) => error)

    query.dispose()
    setId(2n)
    await settle()

    expect(((await pending) as ConnectError).code).toBe(Code.Canceled)
    expect(calls.every(call => call.signal?.aborted)).toBe(true)
    expect(calls.some(call => (call.input as { id: bigint }).id === 2n)).toBe(false)
  })

  it('leaves a key the query layer refuses to that layer', async () => {
    const { transport, calls } = scriptedTransport()
    const root = scope({ default: transport })

    const { value: query } = root.mount(() =>
      createConnectQuery(getUser, () => ({ id: 1n }), {
        keyExtension: () => [Symbol('not hashable')],
      })
    )
    await settle()

    expect(calls).toHaveLength(0)
    expect(query.status()).toBe('error')
    await expect(query.refetch()).rejects.toBeDefined()
  })
})

describe('errors', () => {
  it.each([
    ['unavailable', Code.Unavailable],
    ['resource_exhausted', Code.ResourceExhausted],
    ['unauthenticated', Code.Unauthenticated],
    ['permission_denied', Code.PermissionDenied],
    ['invalid_argument', Code.InvalidArgument],
    ['not_found', Code.NotFound],
    ['already_exists', Code.AlreadyExists],
    ['deadline_exceeded', Code.DeadlineExceeded],
    ['cancelled', Code.Canceled],
  ])('hands on a transport %s ConnectError as the same instance', async (_name, code) => {
    const failure = new ConnectError('from the server', code)
    const { transport } = scriptedTransport(call => call.fail(failure))
    const root = scope({ default: transport })

    const { value: query } = root.mount(() =>
      createConnectQuery(getUser, () => ({ id: 1n }))
    )
    await settle()

    expect(query.error()).toBe(failure)
    expect(query.status()).toBe('error')
    await expect(query.refetch()).rejects.toBe(failure)
    expect((query.error() as ConnectError).code).toBe(code)
  })

  it('keeps a transport error that wins before the abort', async () => {
    const failure = new ConnectError('first', Code.NotFound)
    const { transport, calls } = scriptedTransport()
    const root = scope({ default: transport })
    const controller = new AbortController()
    const { value: query } = root.mount(() =>
      createConnectQuery(getUser, () => ({ id: 1n }), {
        callOptions: { signal: controller.signal },
      })
    )
    await settle()

    calls[0].fail(failure)
    await settle()
    controller.abort()
    await settle()

    expect(query.error()).toBe(failure)
  })

  it('hands on a failure that is not a ConnectError as it is', async () => {
    const failure = new TypeError('a transport bug')
    const { transport } = scriptedTransport(call => call.fail(failure))
    const root = scope({ default: transport })

    const { value: query } = root.mount(() =>
      createConnectQuery(getUser, () => ({ id: 1n }), { retry: 3 })
    )
    await settle()

    expect(query.error()).toBe(failure)
  })

  it('fails a transport that throws rather than rejecting', async () => {
    const failure = new Error('thrown')
    const root = scope({
      default: {
        unary: () => {
          throw failure
        },
        stream: () => Promise.reject(new Error('not used')),
      },
    })

    const { value: query } = root.mount(() =>
      createConnectQuery(getUser, () => ({ id: 1n }))
    )
    await settle()

    expect(query.error()).toBe(failure)
  })
})

describe('retry', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('makes one attempt by default', async () => {
    const { transport, calls } = scriptedTransport(call =>
      call.fail(new ConnectError('busy', Code.Unavailable))
    )
    const root = scope({ default: transport })

    root.mount(() => createConnectQuery(getUser, () => ({ id: 1n })))
    await vi.advanceTimersByTimeAsync(60_000)

    expect(calls).toHaveLength(1)
  })

  it.each([
    ['unavailable', Code.Unavailable],
    ['resource_exhausted', Code.ResourceExhausted],
  ])('retries %s up to the count, then exposes the final error', async (_name, code) => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const failures: ConnectError[] = []
    const { transport, calls } = scriptedTransport(call => {
      const failure = new ConnectError(`attempt ${failures.length + 1}`, code)
      failures.push(failure)
      call.fail(failure)
    })
    const root = scope({ default: transport })

    const { value: query } = root.mount(() =>
      createConnectQuery(getUser, () => ({ id: 1n }), { retry: 2 })
    )
    await vi.advanceTimersByTimeAsync(10)

    expect(calls).toHaveLength(3)
    expect(query.error()).toBe(failures[2])
  })

  it('succeeds on a retry that succeeds', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    let attempts = 0
    const { transport } = scriptedTransport(call =>
      (attempts += 1) < 3
        ? call.fail(new ConnectError('busy', Code.Unavailable))
        : call.respond({ name: 'third time' })
    )
    const root = scope({ default: transport })

    const { value: query } = root.mount(() =>
      createConnectQuery(getUser, () => ({ id: 1n }), { retry: 5 })
    )
    await vi.advanceTimersByTimeAsync(10)

    expect(attempts).toBe(3)
    expect(nameOf(query.data())).toBe('third time')
  })

  it.each([
    ['unauthenticated', Code.Unauthenticated],
    ['permission_denied', Code.PermissionDenied],
    ['invalid_argument', Code.InvalidArgument],
    ['not_found', Code.NotFound],
    ['deadline_exceeded', Code.DeadlineExceeded],
    ['cancelled', Code.Canceled],
    ['internal', Code.Internal],
  ])('never retries %s', async (_name, code) => {
    const { transport, calls } = scriptedTransport(call =>
      call.fail(new ConnectError('no', code))
    )
    const root = scope({ default: transport })

    root.mount(() => createConnectQuery(getUser, () => ({ id: 1n }), { retry: 3 }))
    await vi.advanceTimersByTimeAsync(60_000)

    expect(calls).toHaveLength(1)
  })

  it('waits the jittered fraction of a cap doubling from 100 ms to 2,000 ms', async () => {
    // Half of each cap, which is exact in binary, so the timer lands on it.
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    const { transport, calls } = scriptedTransport(call =>
      call.fail(new ConnectError('busy', Code.Unavailable))
    )
    const root = scope({ default: transport })

    root.mount(() => createConnectQuery(getUser, () => ({ id: 1n }), { retry: 7 }))
    await vi.advanceTimersByTimeAsync(0)
    expect(calls).toHaveLength(1)

    // Caps of 100, 200, 400, 800, and 1600 ms, then 2000 ms from there on.
    for (const cap of [100, 200, 400, 800, 1_600, 2_000, 2_000]) {
      const before = calls.length
      await vi.advanceTimersByTimeAsync(cap / 2 - 1)
      expect(calls).toHaveLength(before)
      await vi.advanceTimersByTimeAsync(1)
      expect(calls).toHaveLength(before + 1)
    }
  })

  it('starts no further attempt once every observer has cancelled during backoff', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.999)
    const { transport, calls } = scriptedTransport(call =>
      call.fail(new ConnectError('busy', Code.Unavailable))
    )
    const root = scope({ default: transport })
    const controllers = [new AbortController(), new AbortController()]

    const queries = controllers.map(controller =>
      root.mount(() =>
        createConnectQuery(getUser, () => ({ id: 1n }), {
          retry: 3,
          callOptions: { signal: controller.signal },
        })
      ).value
    )
    await vi.advanceTimersByTimeAsync(0)
    expect(calls).toHaveLength(1)

    controllers[0].abort()
    await vi.advanceTimersByTimeAsync(100)
    // One observer is still waiting, so the retry goes ahead.
    expect(calls).toHaveLength(2)

    controllers[1].abort()
    await vi.advanceTimersByTimeAsync(60_000)
    expect(calls).toHaveLength(2)
    for (const query of queries) {
      expect((query.error() as ConnectError).code).toBe(Code.Canceled)
    }
  })

  it('keeps retrying for an observer still waiting after another expires', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.999)
    const { transport, calls } = scriptedTransport(call =>
      call.fail(new ConnectError('busy', Code.Unavailable))
    )
    const root = scope({ default: transport })

    root.mount(() =>
      createConnectQuery(getUser, () => ({ id: 1n }), {
        retry: 2,
        callOptions: { timeoutMs: 50 },
      })
    )
    const { value: patient } = root.mount(() =>
      createConnectQuery(getUser, () => ({ id: 1n }), { retry: 2 })
    )
    await vi.advanceTimersByTimeAsync(1_000)

    expect(calls).toHaveLength(3)
    expect((patient.error() as ConnectError).code).toBe(Code.Unavailable)
  })

  it.each([
    ['no retries', 0, 3, 1],
    ['three retries', 3, 0, 4],
  ])(
    'follows the retry count of the observer that started the call (%s)',
    async (_name, starterRetry, joinerRetry, expectedCalls) => {
      vi.spyOn(Math, 'random').mockReturnValue(0)
      const { transport, calls } = scriptedTransport(call =>
        call.fail(new ConnectError('busy', Code.Unavailable))
      )
      const root = scope({ default: transport })

      const { value: starter } = root.mount(() =>
        createConnectQuery(getUser, () => ({ id: 1n }), { retry: starterRetry })
      )
      const { value: joiner } = root.mount(() =>
        createConnectQuery(getUser, () => ({ id: 1n }), { retry: joinerRetry })
      )
      await vi.advanceTimersByTimeAsync(60_000)

      expect(calls).toHaveLength(expectedCalls)
      for (const query of [starter, joiner]) {
        expect((query.error() as ConnectError).code).toBe(Code.Unavailable)
      }
    }
  )

  it('keeps the retry count across a restart for somebody who joined', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.999)
    const failures: ConnectError[] = []
    const { transport, calls } = scriptedTransport(call => {
      const failure = new ConnectError(`attempt ${failures.length + 1}`, Code.Unavailable)
      failures.push(failure)
      call.fail(failure)
    })
    const root = scope({ default: transport })

    root.mount(() =>
      createConnectQuery(getUser, () => ({ id: 1n }), {
        retry: 1,
        callOptions: { timeoutMs: 50 },
      })
    )
    // The first attempt fails at once, and the deadline lands in the ~100 ms
    // backoff before the one retry allowed. The joiner joins that execution
    // as it stops, so the retry it makes is the starter's one.
    await vi.advanceTimersByTimeAsync(49)
    vi.advanceTimersByTime(1)
    expect(calls).toHaveLength(1)

    const { value: joiner } = root.mount(() =>
      createConnectQuery(getUser, () => ({ id: 1n }))
    )
    await vi.advanceTimersByTimeAsync(60_000)

    expect(calls).toHaveLength(2)
    expect(joiner.error()).toBe(failures[1])
  })

  it.each([-1, 1.5, Number.NaN, Infinity, '2'])('refuses %s as a retry count', retry => {
    const { transport } = scriptedTransport()
    const root = scope({ default: transport })

    expect(() =>
      root.mount(() =>
        createConnectQuery(getUser, () => ({ id: 1n }), { retry: retry as number })
      )
    ).toThrowError(/retry count/)
  })
})
