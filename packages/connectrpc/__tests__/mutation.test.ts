/**
 * `createConnectMutation`: one unary call per `mutate`, through
 * `@tachui/query`'s mutation state, invalidation, and optimistic hooks.
 */

import { create } from '@bufbuild/protobuf'
import type { DescMessage, DescMethodUnary } from '@bufbuild/protobuf'
import { Code, ConnectError } from '@connectrpc/connect'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ConnectAdapterError } from '../src/errors'
import { buildConnectKey, connectQueryPrefix } from '../src/keys'
import { createConnectMutation } from '../src/mutation'
import { createConnectQuery } from '../src/query'
import { GetUserRequestSchema, WatchUsers } from './fixtures/schema'
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
  disposeScopes()
})

function nameOf(message: unknown): unknown {
  return fieldOf(message, 'name')
}

/** Whether the entry under `key` is marked for reload. */
function isInvalidated(root: Scope, key: readonly unknown[]): boolean {
  const observation = root.client.observe(key)
  try {
    return observation.entry().invalidated
  } finally {
    observation.release({ keepInFlight: true })
  }
}

/** Seeds a successful entry under `key`. */
async function seed(root: Scope, key: readonly unknown[], data: unknown): Promise<void> {
  await root.client.fetchQuery({ key: () => key, load: async () => data })
}

describe('calls and results', () => {
  it('sends the input once and exposes the response through state, mutate, and hooks', async () => {
    const { transport, calls } = scriptedTransport(call =>
      call.respond({ name: 'Ada' })
    )
    const root = scope({ default: transport })
    const onSuccess = vi.fn()
    const onSettled = vi.fn()

    const { value: mutation } = root.mount(() =>
      createConnectMutation(getUser, { onSuccess, onSettled })
    )
    const response = await mutation.mutate({ id: 3n })

    expect(calls).toHaveLength(1)
    expect(calls[0].method).toBe(getUser)
    expect(create(GetUserRequestSchema, calls[0].input)).toEqual(
      create(GetUserRequestSchema, { id: 3n })
    )
    expect(nameOf(response)).toBe('Ada')
    expect(mutation.status()).toBe('success')
    expect(mutation.data()).toBe(response)
    expect(onSuccess).toHaveBeenCalledWith(response, { id: 3n })
    expect(onSettled).toHaveBeenCalledWith(response, undefined, { id: 3n })
  })

  it('calls the named transport it was given', async () => {
    const fallback = scriptedTransport(call => call.respond({}))
    const account = scriptedTransport(call => call.respond({ name: 'account' }))
    const root = scope({ default: fallback.transport, account: account.transport })

    const { value: mutation } = root.mount(() =>
      createConnectMutation(getUser, { transport: 'account' })
    )
    await mutation.mutate({ id: 1n })

    expect(account.calls).toHaveLength(1)
    expect(fallback.calls).toHaveLength(0)
  })

  it('refuses a streaming method', () => {
    const root = scope({ default: scriptedTransport().transport })

    expect(() =>
      root.mount(() =>
        createConnectMutation(
          WatchUsers as unknown as DescMethodUnary<DescMessage, DescMessage>
        )
      )
    ).toThrowError(ConnectAdapterError)
  })

  it('names no streaming adapter the package does not have when refusing a stream', () => {
    const root = scope({ default: scriptedTransport().transport })

    let failure: unknown
    try {
      root.mount(() =>
        createConnectMutation(
          WatchUsers as unknown as DescMethodUnary<DescMessage, DescMessage>
        )
      )
    } catch (error) {
      failure = error
    }

    expect(failure).toBeInstanceOf(ConnectAdapterError)
    expect((failure as Error).message).toMatch(/Only unary methods are supported/)
    expect((failure as Error).message).not.toMatch(/createConnectStream/)
  })

  it('refuses a client option that is not the one the transport is bound to', () => {
    const { transport, calls } = scriptedTransport(call => call.respond({}))
    const root = scope({ default: transport })
    const other = scope({ default: transport }).client

    expect(() =>
      root.mount(() => createConnectMutation(getUser, { client: other }))
    ).toThrowError(/not the QueryClient the default transport/)
    expect(calls).toHaveLength(0)
  })

  it('accepts a client option that is the one the transport is bound to', async () => {
    const { transport } = scriptedTransport(call => call.respond({ name: 'Ada' }))
    const root = scope({ default: transport })

    const { value: mutation } = root.mount(() =>
      createConnectMutation(getUser, { client: root.client })
    )

    expect(nameOf(await mutation.mutate({ id: 1n }))).toBe('Ada')
  })
})

describe('invalidation', () => {
  it("invalidates the method's unary and infinite entries on that transport only", async () => {
    const account = scriptedTransport(call => call.respond({}))
    const fallback = scriptedTransport(call => call.respond({}))
    const root = scope({ default: fallback.transport, account: account.transport })
    const accountUnary = buildConnectKey(listUsers, () => ({ pageSize: 1 }), {
      transport: 'account',
    }).key
    const accountInfinite = buildConnectKey(listUsers, () => ({ pageSize: 1 }), {
      transport: 'account',
      pageParamKey: 'pageToken',
    }).key
    const defaultUnary = buildConnectKey(listUsers, () => ({ pageSize: 1 })).key
    const otherMethod = buildConnectKey(getUser, () => ({ id: 1n }), {
      transport: 'account',
    }).key
    for (const key of [accountUnary, accountInfinite, defaultUnary, otherMethod]) {
      await seed(root, key, 'cached')
    }

    const { value: mutation } = root.mount(() =>
      createConnectMutation(getUser, {
        transport: 'account',
        invalidates: [connectQueryPrefix(listUsers, { transport: 'account' })],
      })
    )
    await mutation.mutate({ id: 1n })

    expect(isInvalidated(root, accountUnary)).toBe(true)
    expect(isInvalidated(root, accountInfinite)).toBe(true)
    expect(isInvalidated(root, defaultUnary)).toBe(false)
    expect(isInvalidated(root, otherMethod)).toBe(false)
  })

  it('reloads an observed query it invalidates, without writing to its entry itself', async () => {
    let version = 0
    const { transport, calls } = scriptedTransport(call =>
      call.method === listUsers
        ? call.respond({ nextPageToken: `v${(version += 1)}` })
        : call.respond({ name: 'written' })
    )
    const root = scope({ default: transport })
    const { value: list } = root.mount(() =>
      createConnectQuery(listUsers, () => ({ pageSize: 1 }))
    )
    const { value: mutation } = root.mount(() =>
      createConnectMutation(getUser, { invalidates: [connectQueryPrefix(listUsers)] })
    )
    await settle()
    expect(fieldOf(list.data(), 'nextPageToken')).toBe('v1')

    await mutation.mutate({ id: 1n })
    await settle()

    // The list shows what it reloaded from the server, not the write's response.
    expect(calls.filter(call => call.method === listUsers)).toHaveLength(2)
    expect(fieldOf(list.data(), 'nextPageToken')).toBe('v2')
  })

  it('does not invalidate after a transport failure', async () => {
    const { transport } = scriptedTransport(call =>
      call.fail(new ConnectError('no', Code.PermissionDenied))
    )
    const root = scope({ default: transport })
    const key = buildConnectKey(listUsers, () => ({})).key
    await seed(root, key, 'cached')

    const { value: mutation } = root.mount(() =>
      createConnectMutation(getUser, { invalidates: [connectQueryPrefix(listUsers)] })
    )
    await mutation.mutate({ id: 1n }).catch(() => undefined)

    expect(isInvalidated(root, key)).toBe(false)
  })

  it('still invalidates and runs hooks for a completed call another superseded', async () => {
    const { transport, calls } = scriptedTransport()
    const root = scope({ default: transport })
    const key = buildConnectKey(listUsers, () => ({})).key
    await seed(root, key, 'cached')
    const onSuccess = vi.fn()

    const { value: mutation } = root.mount(() =>
      createConnectMutation(getUser, {
        invalidates: [connectQueryPrefix(listUsers)],
        onSuccess,
      })
    )
    const first = mutation.mutate({ id: 1n })
    const second = mutation.mutate({ id: 2n })
    calls[0].respond({ name: 'first' })
    await first

    expect(onSuccess).toHaveBeenCalledTimes(1)
    expect(isInvalidated(root, key)).toBe(true)
    // The newer call still owns the state.
    expect(mutation.status()).toBe('pending')
    calls[1].respond({ name: 'second' })
    await second
    expect(nameOf(mutation.data())).toBe('second')
  })
})

describe('call options', () => {
  it('passes every call option to its own call, the deadline included', async () => {
    const { transport, calls } = scriptedTransport(call => call.respond({}))
    const root = scope({ default: transport })
    const headers = { 'x-trace': 'abc' }
    const contextValues = {} as never

    const { value: mutation } = root.mount(() =>
      createConnectMutation(getUser, {
        callOptions: { headers, contextValues, timeoutMs: 5_000 },
      })
    )
    await mutation.mutate({ id: 1n })

    expect(calls[0].header).toBe(headers)
    expect(calls[0].contextValues).toBe(contextValues)
    expect(calls[0].timeoutMs).toBe(5_000)
  })

  it('passes absent values when no call options are given', async () => {
    const { transport, calls } = scriptedTransport(call => call.respond({}))
    const root = scope({ default: transport })

    const { value: mutation } = root.mount(() => createConnectMutation(getUser))
    await mutation.mutate({ id: 1n })

    expect(calls[0].header).toBeUndefined()
    expect(calls[0].contextValues).toBeUndefined()
    expect(calls[0].timeoutMs).toBeUndefined()
  })

  it('passes no deadline to the transport for a timeoutMs of Infinity', async () => {
    const { transport, calls } = scriptedTransport(call => call.respond({}))
    const root = scope({ default: transport })

    const { value: mutation } = root.mount(() =>
      createConnectMutation(getUser, { callOptions: { timeoutMs: Infinity } })
    )
    await mutation.mutate({ id: 1n })

    expect(calls).toHaveLength(1)
    expect(calls[0].timeoutMs).toBeUndefined()
  })

  it.each([
    ['past the longest timer', 2_147_483_648],
    ['NaN', Number.NaN],
  ])(
    'reads call options once, so a deadline changed to %s afterwards changes no call',
    async (_name, changed) => {
      const { transport, calls } = scriptedTransport(call => call.respond({}))
      const root = scope({ default: transport })
      const headers = { 'x-trace': 'abc' }
      const held: { timeoutMs: number; headers: HeadersInit } = {
        timeoutMs: 5_000,
        headers,
      }

      const { value: mutation } = root.mount(() =>
        createConnectMutation(getUser, { callOptions: held })
      )
      held.timeoutMs = changed
      held.headers = { 'x-trace': 'changed' }
      await mutation.mutate({ id: 1n })

      expect(calls).toHaveLength(1)
      expect(calls[0].timeoutMs).toBe(5_000)
      expect(calls[0].header).toBe(headers)
      expect(mutation.error()).toBeUndefined()
    }
  )
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
    const { transport, calls } = scriptedTransport(call => call.fail(failure))
    const root = scope({ default: transport })
    const onError = vi.fn()

    const { value: mutation } = root.mount(() =>
      createConnectMutation(getUser, { onError })
    )

    await expect(mutation.mutate({ id: 1n })).rejects.toBe(failure)
    expect(mutation.error()).toBe(failure)
    expect(onError).toHaveBeenCalledWith(failure, { id: 1n }, undefined)
    // Never retried, whatever the code.
    expect(calls).toHaveLength(1)
  })

  it('makes one attempt for concurrent calls that fail as unavailable', async () => {
    const { transport, calls } = scriptedTransport(call =>
      call.fail(new ConnectError('busy', Code.Unavailable))
    )
    const root = scope({ default: transport })
    const { value: mutation } = root.mount(() => createConnectMutation(getUser))

    await Promise.allSettled([
      mutation.mutate({ id: 1n }),
      mutation.mutate({ id: 2n }),
    ])
    await settle()

    expect(calls).toHaveLength(2)
  })

  it('settles cancel() promptly with canceled everywhere, as one instance', async () => {
    const { transport, calls } = scriptedTransport()
    const root = scope({ default: transport })
    const onError = vi.fn()
    const onSettled = vi.fn()
    const { value: mutation } = root.mount(() =>
      createConnectMutation(getUser, { onError, onSettled })
    )
    const pending = mutation.mutate({ id: 1n }).catch((error: unknown) => error)

    mutation.cancel()
    const failure = await pending

    expect(failure).toBeInstanceOf(ConnectError)
    expect((failure as ConnectError).code).toBe(Code.Canceled)
    expect(mutation.error()).toBe(failure)
    expect(onError.mock.calls[0][0]).toBe(failure)
    expect(onSettled.mock.calls[0][1]).toBe(failure)
    expect(calls[0].signal?.aborted).toBe(true)
  })

  it("settles the application's signal with canceled", async () => {
    const { transport, calls } = scriptedTransport()
    const root = scope({ default: transport })
    const controller = new AbortController()
    const onError = vi.fn()
    const { value: mutation } = root.mount(() =>
      createConnectMutation(getUser, {
        callOptions: { signal: controller.signal },
        onError,
      })
    )
    const pending = mutation.mutate({ id: 1n }).catch((error: unknown) => error)

    controller.abort()
    const failure = await pending

    expect((failure as ConnectError).code).toBe(Code.Canceled)
    expect(mutation.error()).toBe(failure)
    expect(onError.mock.calls[0][0]).toBe(failure)
    expect(calls[0].signal?.aborted).toBe(true)
  })

  it('makes no call once the application signal has aborted', async () => {
    const { transport, calls } = scriptedTransport()
    const root = scope({ default: transport })
    const { value: mutation } = root.mount(() =>
      createConnectMutation(getUser, { callOptions: { signal: AbortSignal.abort() } })
    )

    const failure = await mutation.mutate({ id: 1n }).catch((error: unknown) => error)

    expect((failure as ConnectError).code).toBe(Code.Canceled)
    expect(calls).toHaveLength(0)
  })

  it('settles owner disposal with canceled', async () => {
    const { transport, calls } = scriptedTransport()
    const root = scope({ default: transport })
    const onError = vi.fn()
    const { value: mutation, dispose } = root.mount(() =>
      createConnectMutation(getUser, { onError })
    )
    const pending = mutation.mutate({ id: 1n }).catch((error: unknown) => error)

    dispose()
    const failure = await pending

    expect((failure as ConnectError).code).toBe(Code.Canceled)
    expect(onError.mock.calls[0][0]).toBe(failure)
    expect(calls[0].signal?.aborted).toBe(true)
  })

  it('settles an expired deadline with deadline_exceeded, though the transport ignores it', async () => {
    vi.useFakeTimers()
    const { transport } = scriptedTransport()
    const root = scope({ default: transport })
    const onError = vi.fn()
    const { value: mutation } = root.mount(() =>
      createConnectMutation(getUser, { callOptions: { timeoutMs: 1_000 }, onError })
    )
    const pending = mutation.mutate({ id: 1n }).catch((error: unknown) => error)

    await vi.advanceTimersByTimeAsync(1_000)
    const failure = await pending

    expect((failure as ConnectError).code).toBe(Code.DeadlineExceeded)
    expect(mutation.error()).toBe(failure)
    expect(onError.mock.calls[0][0]).toBe(failure)
  })

  describe('cancel() or disposal just after another source stopped the call', () => {
    function expectCanceledEverywhere(
      failure: unknown,
      mutation: { error: () => unknown } | undefined,
      onError: ReturnType<typeof vi.fn>,
      onSettled: ReturnType<typeof vi.fn>
    ): void {
      expect(failure).toBeInstanceOf(ConnectError)
      expect((failure as ConnectError).code).toBe(Code.Canceled)
      if (mutation !== undefined) {
        expect(mutation.error()).toBe(failure)
      }
      expect(onError.mock.calls[0][0]).toBe(failure)
      expect(onSettled.mock.calls[0][1]).toBe(failure)
    }

    it("settles with canceled when cancel() follows the application's signal", async () => {
      const { transport } = scriptedTransport()
      const root = scope({ default: transport })
      const controller = new AbortController()
      const onError = vi.fn()
      const onSettled = vi.fn()
      const { value: mutation } = root.mount(() =>
        createConnectMutation(getUser, {
          callOptions: { signal: controller.signal },
          onError,
          onSettled,
        })
      )
      const pending = mutation.mutate({ id: 1n }).catch((error: unknown) => error)

      controller.abort()
      mutation.cancel()

      expectCanceledEverywhere(await pending, mutation, onError, onSettled)
    })

    it("settles with canceled when disposal follows the application's signal", async () => {
      const { transport } = scriptedTransport()
      const root = scope({ default: transport })
      const controller = new AbortController()
      const onError = vi.fn()
      const onSettled = vi.fn()
      const { value: mutation, dispose } = root.mount(() =>
        createConnectMutation(getUser, {
          callOptions: { signal: controller.signal },
          onError,
          onSettled,
        })
      )
      const pending = mutation.mutate({ id: 1n }).catch((error: unknown) => error)

      controller.abort()
      dispose()

      // The owner's state went with it; the promise and hooks remain.
      expectCanceledEverywhere(await pending, undefined, onError, onSettled)
    })

    it('settles with canceled when cancel() follows an expired deadline', async () => {
      vi.useFakeTimers()
      const { transport } = scriptedTransport()
      const root = scope({ default: transport })
      const onError = vi.fn()
      const onSettled = vi.fn()
      const { value: mutation } = root.mount(() =>
        createConnectMutation(getUser, {
          callOptions: { timeoutMs: 1_000 },
          onError,
          onSettled,
        })
      )
      const pending = mutation.mutate({ id: 1n }).catch((error: unknown) => error)
      await vi.advanceTimersByTimeAsync(0)

      vi.advanceTimersByTime(1_000)
      mutation.cancel()

      expectCanceledEverywhere(await pending, mutation, onError, onSettled)
    })
  })

  it('keeps a transport error that wins before the cancellation', async () => {
    const failure = new ConnectError('first', Code.AlreadyExists)
    const { transport, calls } = scriptedTransport()
    const root = scope({ default: transport })
    const { value: mutation } = root.mount(() => createConnectMutation(getUser))
    const pending = mutation.mutate({ id: 1n }).catch((error: unknown) => error)

    calls[0].fail(failure)
    await settle()
    mutation.cancel()

    expect(await pending).toBe(failure)
    expect(mutation.error()).toBe(failure)
  })

  it('keeps the values of local and hook failures', async () => {
    const { transport } = scriptedTransport(call => call.respond({}))
    const root = scope({ default: transport })
    const hookFailure = 'a string, thrown by onSuccess'
    const optimisticFailure = new RangeError('optimistic')
    const onError = vi.fn()

    const { value: failingHook } = root.mount(() =>
      createConnectMutation(getUser, {
        onSuccess: () => {
          throw hookFailure
        },
      })
    )
    const { value: failingOptimism } = root.mount(() =>
      createConnectMutation(getUser, {
        optimisticUpdate: () => {
          throw optimisticFailure
        },
        onError,
      })
    )

    await expect(failingHook.mutate({ id: 1n })).rejects.toBe(hookFailure)
    await expect(failingOptimism.mutate({ id: 1n })).rejects.toBe(optimisticFailure)
    expect(onError.mock.calls[0][0]).toBe(optimisticFailure)
  })
})

describe('optimistic updates', () => {
  it('runs synchronously before the call, and hands its context to onError', async () => {
    const order: string[] = []
    const { transport } = scriptedTransport(call => {
      order.push('call')
      call.fail(new ConnectError('no', Code.FailedPrecondition))
    })
    const root = scope({ default: transport })
    const onError = vi.fn()

    const { value: mutation } = root.mount(() =>
      createConnectMutation(getUser, {
        optimisticUpdate: () => {
          order.push('optimistic')
          return { previous: 'Ada' }
        },
        onError,
      })
    )
    const pending = mutation.mutate({ id: 1n }).catch(() => undefined)
    expect(order).toEqual(['optimistic', 'call'])
    await pending

    expect(onError.mock.calls[0][2]).toEqual({ previous: 'Ada' })
  })

  it.each([
    ['cancellation', (mutation: { cancel(): void }) => mutation.cancel()],
    ['a reset', (mutation: { reset(): void }) => mutation.reset()],
  ])('hands the context to onError after %s', async (_name, interrupt) => {
    const { transport, calls } = scriptedTransport()
    const root = scope({ default: transport })
    const onError = vi.fn()
    const { value: mutation } = root.mount(() =>
      createConnectMutation(getUser, {
        optimisticUpdate: () => ({ previous: 'Ada' }),
        onError,
      })
    )
    const pending = mutation.mutate({ id: 1n }).catch(() => undefined)

    interrupt(mutation)
    if (!calls[0].signal?.aborted) {
      calls[0].fail(new ConnectError('no', Code.Aborted))
    }
    await pending

    expect(onError.mock.calls[0][2]).toEqual({ previous: 'Ada' })
  })

  it('hands each call its own context after supersession and concurrent invalidation', async () => {
    const { transport, calls } = scriptedTransport()
    const root = scope({ default: transport })
    const onError = vi.fn()
    const { value: mutation } = root.mount(() =>
      createConnectMutation(getUser, {
        optimisticUpdate: input => ({ previous: String(input.id) }),
        onError,
        invalidates: [connectQueryPrefix(listUsers)],
      })
    )
    const first = mutation.mutate({ id: 1n }).catch(() => undefined)
    const second = mutation.mutate({ id: 2n }).catch(() => undefined)
    root.client.invalidate(connectQueryPrefix(listUsers))

    calls[0].fail(new ConnectError('no', Code.Aborted))
    calls[1].fail(new ConnectError('no', Code.Aborted))
    await Promise.all([first, second])

    expect(onError.mock.calls.map(call => call[2])).toEqual([
      { previous: '1' },
      { previous: '2' },
    ])
  })
})

describe('the scope it needs', () => {
  it('refuses malformed call options', () => {
    const root = scope({ default: scriptedTransport().transport })

    expect(() =>
      root.mount(() =>
        createConnectMutation(getUser, { callOptions: { timeoutMs: Number.NaN } })
      )
    ).toThrowError(ConnectAdapterError)
  })

  it.each([
    ['null', null],
    ['a string', 'abort'],
    ['an object shaped like a signal', { aborted: false }],
  ])('refuses %s as the signal, before any call', async (_name, signal) => {
    const { transport, calls } = scriptedTransport(call => call.respond({ name: 'Ada' }))
    const root = scope({ default: transport })

    expect(() =>
      root.mount(() =>
        createConnectMutation(getUser, { callOptions: { signal: signal as never } })
      )
    ).toThrowError(ConnectAdapterError)
    expect(calls).toHaveLength(0)

    const { value: healthy } = root.mount(() => createConnectMutation(getUser))
    expect(nameOf(await healthy.mutate({ id: 1n }))).toBe('Ada')
  })

  it('refuses a finite deadline longer than a timer can hold, rather than expiring at once', () => {
    const { transport, calls } = scriptedTransport()
    const root = scope({ default: transport })

    for (const timeoutMs of [2_147_483_648, Number.MAX_SAFE_INTEGER]) {
      expect(() =>
        root.mount(() => createConnectMutation(getUser, { callOptions: { timeoutMs } }))
      ).toThrowError(/longer than the 2147483647 ms a timer can hold/)
    }
    expect(calls).toHaveLength(0)
  })
})
