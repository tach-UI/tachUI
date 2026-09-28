/**
 * The unary adapters over Connect's own in-memory router transport, with the
 * generated service types: the path a real call takes, minus the network.
 *
 * The scripted-transport suites (`query.test.ts`, `mutation.test.ts`) pin the
 * adapters' edge cases one transport call at a time. Here the same contracts
 * are checked end to end: requests are serialized, handlers run with the
 * call's metadata, signal, and deadline, and failures come back through the
 * Connect protocol.
 */

import { create } from '@bufbuild/protobuf'
import {
  Code,
  ConnectError,
  createContextKey,
  createContextValues,
} from '@connectrpc/connect'
import type { Interceptor } from '@connectrpc/connect'
import { createConnectTransport } from '@connectrpc/connect-web'
import { createSignal } from '@tachui/core'
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vitest'

import { buildConnectKey } from '../src/keys'
import { createConnectMutation } from '../src/mutation'
import { createConnectQuery } from '../src/query'
import {
  GetUserRequestSchema,
  UserService,
} from './fixtures/generated'
import type { User } from './fixtures/generated'
import { disposeScopes, scope, settle } from './support/harness'
import { takeNetworkAttempts } from './support/offline'
import { aborted, hold, userRouter } from './support/router'

const { getUser, updateUser } = UserService.method

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  disposeScopes()
})

const tenantKey = createContextKey('none', { description: 'tenant' })

describe('the router fixture', () => {
  it('serves the generated service through the adapters, with a provided client and transport', async () => {
    const server = userRouter()
    const root = scope({ default: server.transport })

    const { value: query } = root.mount(() =>
      createConnectQuery(getUser, () => ({ id: 1n }))
    )
    await settle()

    expect(query.data()?.name).toBe('Ada')
    expect(server.handledBy('getUser')).toHaveLength(1)
    const { key } = buildConnectKey(getUser, () => ({ id: 1n }))
    const observation = root.client.observe(key)
    expect(observation.entry().data).toBe(query.data())
    observation.release()
  })

  it('keeps state between calls, so a write changes the next read', async () => {
    const server = userRouter()
    const root = scope({ default: server.transport })

    const { value: mutation } = root.mount(() => createConnectMutation(updateUser))
    await mutation.mutate({ id: 3n, name: 'Hedy' })

    expect(server.users.get(3n)).toBe('Hedy')
    const { value: query } = root.mount(() =>
      createConnectQuery(getUser, () => ({ id: 3n }))
    )
    await settle()
    expect(query.data()?.name).toBe('Hedy')
  })
})

describe('the network guard', () => {
  it('refuses and records a transport that reaches for the global fetch', async () => {
    const root = scope({
      default: createConnectTransport({ baseUrl: 'https://api.example.test' }),
    })

    const { value: query } = root.mount(() =>
      createConnectQuery(getUser, () => ({ id: 1n }))
    )
    await vi.waitFor(() => expect(query.status()).toBe('error'))

    // The transport turned the refusal into a ConnectError, which a test about
    // failures could take for the one it expected; the record is what fails it.
    expect(query.error()).toBeInstanceOf(ConnectError)
    expect(takeNetworkAttempts()).toEqual([
      'fetch https://api.example.test/acme.users.v1.UserService/GetUser',
    ])
  })

  it('refuses XMLHttpRequest, WebSocket, and EventSource', () => {
    expect(() =>
      new XMLHttpRequest().open('POST', 'https://api.example.test/rpc')
    ).toThrow(/real network request/)
    expect(() => new WebSocket('wss://api.example.test/socket')).toThrow(
      /real network request/
    )
    expect(() => new EventSource('https://api.example.test/events')).toThrow(
      /real network request/
    )

    expect(takeNetworkAttempts()).toEqual([
      'XMLHttpRequest POST https://api.example.test/rpc',
      'WebSocket wss://api.example.test/socket',
      'EventSource https://api.example.test/events',
    ])
  })
})

describe('generated unary calls', () => {
  it("returns the query handler's response, typed as the method's output", async () => {
    const root = scope({ default: userRouter().transport })

    const { value: query } = root.mount(() =>
      createConnectQuery(getUser, () => ({ id: 2n }))
    )
    await settle()

    expectTypeOf(query.data).returns.toEqualTypeOf<User | undefined>()
    const user = query.data()
    expect(user?.$typeName).toBe('acme.users.v1.GetUserResponse')
    expect(user?.name).toBe('Grace')
  })

  it("returns the mutation handler's response, typed as the method's output", async () => {
    const server = userRouter()
    const root = scope({ default: server.transport })

    const { value: mutation } = root.mount(() => createConnectMutation(updateUser))
    const written = await mutation.mutate({ id: 1n, name: 'Ada Lovelace' })

    expectTypeOf(written).toEqualTypeOf<User>()
    expectTypeOf(mutation.mutate).parameter(0).toHaveProperty('name')
    expect(written.name).toBe('Ada Lovelace')
    expect(mutation.data()).toBe(written)
    expect(server.handledBy('updateUser')[0].request).toEqual(
      expect.objectContaining({ id: 1n, name: 'Ada Lovelace' })
    )
  })
})

describe('the request a query sends', () => {
  it("sends the keyed snapshot on every attempt, whatever happens to the caller's object", async () => {
    vi.useFakeTimers()
    vi.spyOn(Math, 'random').mockReturnValue(0)
    let attempts = 0
    const server = userRouter({
      handlers: {
        getUser: ({ id }) => {
          attempts += 1
          if (attempts < 3) {
            throw new ConnectError('busy', Code.Unavailable)
          }
          return { name: `user ${String(id)}` }
        },
      },
    })
    const root = scope({ default: server.transport })
    const request = { id: 1n }

    const { value: query } = root.mount(() =>
      createConnectQuery(getUser, () => request, { retry: 2 })
    )
    // Changed after the key was built and the first attempt dispatched.
    request.id = 99n
    await vi.advanceTimersByTimeAsync(10)

    expect(server.handledBy('getUser').map(call => call.request)).toEqual([
      create(GetUserRequestSchema, { id: 1n }),
      create(GetUserRequestSchema, { id: 1n }),
      create(GetUserRequestSchema, { id: 1n }),
    ])
    expect(query.data()?.name).toBe('user 1')
  })

  it('keeps the snapshot for a pending retry when the input moves to another request', async () => {
    vi.useFakeTimers()
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    const server = userRouter({
      handlers: {
        getUser: ({ id }) => {
          if (id === 1n) {
            throw new ConnectError('busy', Code.Unavailable)
          }
          return { name: `user ${String(id)}` }
        },
      },
    })
    const root = scope({ default: server.transport })
    const [id, setId] = createSignal(1n)
    // A second observer keeps the first key's call, and its retries, alive.
    root.mount(() => createConnectQuery(getUser, () => ({ id: 1n }), { retry: 1 }))

    const { value: query } = root.mount(() =>
      createConnectQuery(getUser, () => ({ id: id() }), { retry: 1 })
    )
    await vi.advanceTimersByTimeAsync(0)
    setId(2n)
    await vi.advanceTimersByTimeAsync(1_000)

    const sent = server.handledBy('getUser').map(call => (call.request as { id: bigint }).id)
    expect(sent.filter(sentId => sentId === 1n)).toHaveLength(2)
    expect(sent.filter(sentId => sentId === 2n)).toHaveLength(1)
    expect(query.data()?.name).toBe('user 2')
  })
})

const FAILURE_CODES = [
  ['unauthenticated', Code.Unauthenticated],
  ['permission_denied', Code.PermissionDenied],
  ['invalid_argument', Code.InvalidArgument],
  ['not_found', Code.NotFound],
  ['already_exists', Code.AlreadyExists],
  ['resource_exhausted', Code.ResourceExhausted],
  ['unavailable', Code.Unavailable],
  ['deadline_exceeded', Code.DeadlineExceeded],
  ['cancelled', Code.Canceled],
] as const

describe('handler failures', () => {
  it.each(FAILURE_CODES)(
    'hands a query the %s ConnectError the transport rejected with, as that instance',
    async (_name, code) => {
      const server = userRouter({
        handlers: {
          getUser: () => {
            throw new ConnectError('refused by the handler', code)
          },
        },
      })
      const root = scope({ default: server.transport })

      const { value: query } = root.mount(() =>
        createConnectQuery(getUser, () => ({ id: 1n }))
      )
      await settle()

      expect(server.failures).toHaveLength(1)
      const failure = server.failures[0]
      expect(failure).toBeInstanceOf(ConnectError)
      expect(query.error()).toBe(failure)
      expect((query.error() as ConnectError).code).toBe(code)
      expect((query.error() as ConnectError).rawMessage).toBe('refused by the handler')
      expect(query.status()).toBe('error')
    }
  )

  it.each(FAILURE_CODES)(
    'hands a mutation the %s ConnectError the transport rejected with, as that instance',
    async (_name, code) => {
      const onError = vi.fn()
      const server = userRouter({
        handlers: {
          updateUser: () => {
            throw new ConnectError('refused by the handler', code)
          },
        },
      })
      const root = scope({ default: server.transport })

      const { value: mutation } = root.mount(() =>
        createConnectMutation(updateUser, { onError })
      )
      const failure = await mutation
        .mutate({ id: 1n, name: 'x' })
        .catch((error: unknown) => error)

      expect(server.failures).toEqual([failure])
      expect(mutation.error()).toBe(failure)
      expect(onError.mock.calls[0][0]).toBe(failure)
      expect((failure as ConnectError).code).toBe(code)
    }
  )

  it('settles a query cancelled locally with one canceled ConnectError in its error and its promise', async () => {
    const server = userRouter({
      handlers: { getUser: (_request, context) => aborted(context.signal).then(() => ({})) },
    })
    const root = scope({ default: server.transport })
    const { value: query } = root.mount(() =>
      createConnectQuery(getUser, () => ({ id: 1n }))
    )
    await settle()
    const refetched = query.refetch().catch((error: unknown) => error)

    query.cancel()
    const failure = await refetched

    expect(failure).toBeInstanceOf(ConnectError)
    expect((failure as ConnectError).code).toBe(Code.Canceled)
    expect(query.error()).toBe(failure)
    await vi.waitFor(() =>
      expect(server.handledBy('getUser').every(call => call.signal.aborted)).toBe(true)
    )
  })

  it('settles a mutation cancelled locally with one canceled ConnectError in its error and its promise', async () => {
    const server = userRouter({
      handlers: { updateUser: (_request, context) => aborted(context.signal).then(() => ({})) },
    })
    const root = scope({ default: server.transport })
    const { value: mutation } = root.mount(() => createConnectMutation(updateUser))
    const pending = mutation
      .mutate({ id: 1n, name: 'x' })
      .catch((error: unknown) => error)
    await settle()

    mutation.cancel()
    const failure = await pending

    expect((failure as ConnectError).code).toBe(Code.Canceled)
    expect(mutation.error()).toBe(failure)
    await vi.waitFor(() =>
      expect(server.handledBy('updateUser')[0].signal.aborted).toBe(true)
    )
  })

  it("keeps a handler's ConnectError when a local cancellation follows it", async () => {
    const server = userRouter({
      handlers: {
        getUser: () => {
          throw new ConnectError('gone', Code.NotFound)
        },
        updateUser: () => {
          throw new ConnectError('taken', Code.AlreadyExists)
        },
      },
    })
    const root = scope({ default: server.transport })
    const { value: query } = root.mount(() =>
      createConnectQuery(getUser, () => ({ id: 1n }))
    )
    const { value: mutation } = root.mount(() => createConnectMutation(updateUser))
    await settle()
    const written = await mutation
      .mutate({ id: 1n, name: 'x' })
      .catch((error: unknown) => error)

    query.cancel()
    mutation.cancel()
    await settle()

    expect(query.error()).toBe(server.failures[0])
    expect((query.error() as ConnectError).code).toBe(Code.NotFound)
    expect(mutation.error()).toBe(written)
    expect((written as ConnectError).code).toBe(Code.AlreadyExists)
  })
})

describe('retry', () => {
  function failingRouter(code: Code) {
    return userRouter({
      handlers: {
        getUser: () => {
          throw new ConnectError('no', code)
        },
        updateUser: () => {
          throw new ConnectError('no', code)
        },
      },
    })
  }

  it('makes one query attempt by default', async () => {
    vi.useFakeTimers()
    const server = failingRouter(Code.Unavailable)
    const root = scope({ default: server.transport })

    root.mount(() => createConnectQuery(getUser, () => ({ id: 1n })))
    await vi.advanceTimersByTimeAsync(60_000)

    expect(server.handledBy('getUser')).toHaveLength(1)
  })

  it.each([
    ['unavailable', Code.Unavailable],
    ['resource_exhausted', Code.ResourceExhausted],
  ])('retries %s up to the count, after a capped exponential delay', async (_name, code) => {
    vi.useFakeTimers()
    // Half of each cap: 50, 100, 200, 400, 800, then 1,000 ms from the cap on.
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    const server = failingRouter(code)
    const root = scope({ default: server.transport })

    const { value: query } = root.mount(() =>
      createConnectQuery(getUser, () => ({ id: 1n }), { retry: 6 })
    )
    await vi.advanceTimersByTimeAsync(0)
    expect(server.handledBy('getUser')).toHaveLength(1)

    for (const delay of [50, 100, 200, 400, 800, 1_000]) {
      const before = server.handledBy('getUser').length
      await vi.advanceTimersByTimeAsync(delay - 1)
      expect(server.handledBy('getUser')).toHaveLength(before)
      await vi.advanceTimersByTimeAsync(1)
      expect(server.handledBy('getUser')).toHaveLength(before + 1)
    }
    await vi.advanceTimersByTimeAsync(60_000)

    expect(server.handledBy('getUser')).toHaveLength(7)
    expect(query.error()).toBe(server.failures[6])
  })

  it.each(
    FAILURE_CODES.filter(
      ([, code]) => code !== Code.Unavailable && code !== Code.ResourceExhausted
    )
  )('never retries %s', async (_name, code) => {
    vi.useFakeTimers()
    const server = failingRouter(code)
    const root = scope({ default: server.transport })

    root.mount(() => createConnectQuery(getUser, () => ({ id: 1n }), { retry: 3 }))
    await vi.advanceTimersByTimeAsync(60_000)

    expect(server.handledBy('getUser')).toHaveLength(1)
  })

  it('makes no further call once its only observer aborts during backoff', async () => {
    vi.useFakeTimers()
    vi.spyOn(Math, 'random').mockReturnValue(0.999)
    const server = failingRouter(Code.Unavailable)
    const root = scope({ default: server.transport })
    const controller = new AbortController()

    const { value: query } = root.mount(() =>
      createConnectQuery(getUser, () => ({ id: 1n }), {
        retry: 3,
        callOptions: { signal: controller.signal },
      })
    )
    await vi.advanceTimersByTimeAsync(0)
    expect(server.handledBy('getUser')).toHaveLength(1)

    controller.abort()
    await vi.advanceTimersByTimeAsync(60_000)

    expect(server.handledBy('getUser')).toHaveLength(1)
    expect((query.error() as ConnectError).code).toBe(Code.Canceled)
  })

  it.each([
    ['unavailable', Code.Unavailable],
    ['resource_exhausted', Code.ResourceExhausted],
  ])('never retries a mutation, even on %s', async (_name, code) => {
    vi.useFakeTimers()
    const server = failingRouter(code)
    const root = scope({ default: server.transport })
    const { value: mutation } = root.mount(() =>
      // A retry count smuggled past the types changes nothing.
      createConnectMutation(updateUser, { retry: 3 } as never)
    )

    const failure = mutation.mutate({ id: 1n, name: 'x' }).catch((error: unknown) => error)
    await vi.advanceTimersByTimeAsync(60_000)

    expect(server.handledBy('updateUser')).toHaveLength(1)
    expect((await failure as ConnectError).code).toBe(code)
  })
})

describe('call options on an executing call', () => {
  const trace: Interceptor = next => request => {
    request.header.set('x-trace', 'traced-by-the-transport')
    return next(request)
  }

  it("carries a query's headers and context values to the handler, beside the transport's interceptors", async () => {
    const server = userRouter({ interceptors: [trace] })
    const root = scope({ default: server.transport })

    root.mount(() =>
      createConnectQuery(getUser, () => ({ id: 1n }), {
        callOptions: {
          headers: { 'x-tenant': 'acme' },
          contextValues: createContextValues().set(tenantKey, 'acme'),
        },
      })
    )
    await settle()

    const [call] = server.handledBy('getUser')
    expect(call.header.get('x-tenant')).toBe('acme')
    expect(call.header.get('x-trace')).toBe('traced-by-the-transport')
  })

  it("carries a mutation's headers, context values, and deadline to the call, beside the transport's interceptors", async () => {
    let seenTenant: string | undefined
    const tenantInterceptor: Interceptor = next => request => {
      seenTenant = request.contextValues.get(tenantKey)
      return next(request)
    }
    const server = userRouter({ interceptors: [trace, tenantInterceptor] })
    const root = scope({ default: server.transport })

    const { value: mutation } = root.mount(() =>
      createConnectMutation(updateUser, {
        callOptions: {
          headers: { 'x-tenant': 'acme' },
          contextValues: createContextValues().set(tenantKey, 'acme'),
          timeoutMs: 30_000,
        },
      })
    )
    await mutation.mutate({ id: 1n, name: 'x' })

    const [call] = server.handledBy('updateUser')
    expect(call.header.get('x-tenant')).toBe('acme')
    expect(call.header.get('x-trace')).toBe('traced-by-the-transport')
    expect(seenTenant).toBe('acme')
    expect(call.timeoutMs).toBeGreaterThan(0)
    expect(call.timeoutMs).toBeLessThanOrEqual(30_000)
  })

  it("ends a query at its application signal, and a late reply is not success", async () => {
    const reply = hold()
    const server = userRouter({
      handlers: { getUser: () => reply.promise.then(() => ({ name: 'late' })) },
    })
    const root = scope({ default: server.transport })
    const controller = new AbortController()
    const { value: query } = root.mount(() =>
      createConnectQuery(getUser, () => ({ id: 1n }), {
        callOptions: { signal: controller.signal },
      })
    )
    await settle()

    controller.abort()
    await settle()
    reply.release()
    await settle()

    expect(query.status()).toBe('error')
    expect((query.error() as ConnectError).code).toBe(Code.Canceled)
    expect(query.data()).toBeUndefined()
    expect(server.handledBy('getUser')[0].signal.aborted).toBe(true)
  })

  it('ends a query at its deadline, and a late reply is not success', async () => {
    vi.useFakeTimers()
    const reply = hold()
    const server = userRouter({
      handlers: { getUser: () => reply.promise.then(() => ({ name: 'late' })) },
    })
    const root = scope({ default: server.transport })
    const { value: query } = root.mount(() =>
      createConnectQuery(getUser, () => ({ id: 1n }), {
        callOptions: { timeoutMs: 1_000 },
      })
    )
    await vi.advanceTimersByTimeAsync(1_000)
    reply.release()
    await vi.advanceTimersByTimeAsync(0)

    expect((query.error() as ConnectError).code).toBe(Code.DeadlineExceeded)
    expect(query.data()).toBeUndefined()
  })

  it('ends a query when its owner is disposed, aborting the handler', async () => {
    const server = userRouter({
      handlers: { getUser: (_request, context) => aborted(context.signal).then(() => ({})) },
    })
    const root = scope({ default: server.transport })
    const { value: query, dispose } = root.mount(() =>
      createConnectQuery(getUser, () => ({ id: 1n }))
    )
    await settle()

    dispose()

    await vi.waitFor(() =>
      expect(server.handledBy('getUser')[0].signal.aborted).toBe(true)
    )
    expect(query.data()).toBeUndefined()
  })

  it.each([
    ['application signal', Code.Canceled],
    ['deadline', Code.DeadlineExceeded],
  ])('ends a mutation at its %s, and a late reply is not success', async (source, code) => {
    const reply = hold()
    const server = userRouter({
      handlers: {
        updateUser: ({ name }) => reply.promise.then(() => ({ name })),
      },
    })
    const root = scope({ default: server.transport })
    const controller = new AbortController()
    const { value: mutation } = root.mount(() =>
      createConnectMutation(updateUser, {
        callOptions:
          source === 'deadline' ? { timeoutMs: 20 } : { signal: controller.signal },
      })
    )
    const pending = mutation.mutate({ id: 1n, name: 'x' }).catch((error: unknown) => error)
    await settle()

    if (source === 'application signal') {
      controller.abort()
    }
    const failure = await pending
    reply.release()
    await settle()

    expect((failure as ConnectError).code).toBe(code)
    expect(mutation.status()).toBe('error')
    expect(mutation.data()).toBeUndefined()
  })

  it('ends a mutation when its owner is disposed, aborting the handler', async () => {
    const server = userRouter({
      handlers: { updateUser: (_request, context) => aborted(context.signal).then(() => ({})) },
    })
    const root = scope({ default: server.transport })
    const { value: mutation, dispose } = root.mount(() => createConnectMutation(updateUser))
    const pending = mutation.mutate({ id: 1n, name: 'x' }).catch((error: unknown) => error)
    await settle()

    dispose()

    expect(((await pending) as ConnectError).code).toBe(Code.Canceled)
    await vi.waitFor(() =>
      expect(server.handledBy('updateUser')[0].signal.aborted).toBe(true)
    )
  })
})

describe('authentication', () => {
  function authenticatingRouter(interceptors: Interceptor[]) {
    return userRouter({
      interceptors,
      handlers: {
        getUser: ({ id }, context) => {
          const authorization = context.requestHeader.get('authorization')
          if (authorization === null) {
            throw new ConnectError('who are you?', Code.Unauthenticated)
          }
          return { name: `${authorization} asked for ${String(id)}` }
        },
      },
    })
  }

  it("authenticates through the application's interceptor, never the key", async () => {
    let token = 'secret-token'
    const authenticate: Interceptor = next => request => {
      request.header.set('authorization', `Bearer ${token}`)
      return next(request)
    }
    const root = scope({ default: authenticatingRouter([authenticate]).transport })

    const { value: query } = root.mount(() =>
      createConnectQuery(getUser, () => ({ id: 7n }))
    )
    await settle()

    expect(query.data()?.name).toBe('Bearer secret-token asked for 7')
    const { key } = buildConnectKey(getUser, () => ({ id: 7n }))
    const observation = root.client.observe(key)
    expect(observation.entry().status).toBe('success')
    observation.release()
    expect(JSON.stringify(key)).not.toMatch(/secret/)

    token = 'rotated-token'
    const { value: mutation } = root.mount(() => createConnectMutation(getUser))
    const written = await mutation.mutate({ id: 8n })
    expect(written.name).toBe('Bearer rotated-token asked for 8')
  })

  it("hands on the server's refusal, leaving authorization to the server", async () => {
    const root = scope({ default: authenticatingRouter([]).transport })

    const { value: query } = root.mount(() =>
      createConnectQuery(getUser, () => ({ id: 1n }))
    )
    await settle()

    expect(query.error()).toBeInstanceOf(ConnectError)
    expect((query.error() as ConnectError).code).toBe(Code.Unauthenticated)
  })
})
