/**
 * What the unary adapters share and keep apart, over the router fixture:
 * deterministic keys, one call per key, invalidation after a write,
 * application-owned optimistic state, and the provider and client each call
 * resolves.
 */

import { create } from '@bufbuild/protobuf'
import { Code, ConnectError } from '@connectrpc/connect'
import {
  createComponentContext,
  createSignal,
  runWithComponentContext,
} from '@tachui/core'
import { createQueryClient, provideQueryClient } from '@tachui/query'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ConnectAdapterError } from '../src/errors'
import { buildConnectKey, connectQueryPrefix } from '../src/keys'
import { createConnectMutation } from '../src/mutation'
import { createConnectQuery } from '../src/query'
import { provideConnectTransport } from '../src/transport'
import { ListUsersRequestSchema, UserService } from './fixtures/generated'
import type { User } from './fixtures/generated'
import { disposeScopes, scope, settle } from './support/harness'
import { aborted, hold, userRouter } from './support/router'

const { getUser, listUsers, updateUser } = UserService.method

afterEach(() => {
  vi.useRealTimers()
  disposeScopes()
})

describe('keys', () => {
  const partial = {
    pageSize: 25,
    minId: 9_007_199_254_740_993n,
    fingerprint: new Uint8Array([0, 255, 7]),
    selector: { case: 'email' as const, value: 'ada@example.test' },
    quotas: { reads: 10n, writes: 2n },
  }
  // The same values built as a generated message, the map in another order.
  const generated = create(ListUsersRequestSchema, {
    quotas: { writes: 2n, reads: 10n },
    selector: { case: 'email', value: 'ada@example.test' },
    fingerprint: new Uint8Array([0, 255, 7]),
    minId: 9_007_199_254_740_993n,
    pageSize: 25,
  })

  it('gives equivalent partial and generated requests one key, one entry, and one call', async () => {
    const server = userRouter()
    const root = scope({ default: server.transport })

    const { value: fromPartial } = root.mount(() =>
      createConnectQuery(listUsers, () => partial)
    )
    const { value: fromMessage } = root.mount(() =>
      createConnectQuery(listUsers, () => generated)
    )
    await settle()

    expect(buildConnectKey(listUsers, () => partial).key).toEqual(
      buildConnectKey(listUsers, () => generated).key
    )
    expect(server.handledBy('listUsers')).toHaveLength(1)
    expect(fromPartial.data()).toBe(fromMessage.data())
  })

  it.each([
    ['an int64', { minId: 9_007_199_254_740_992n }],
    ['bytes', { fingerprint: new Uint8Array([0, 255, 8]) }],
    ['a oneof case', { selector: { case: 'userId' as const, value: 1n } }],
    ['a oneof value', { selector: { case: 'email' as const, value: 'grace@example.test' } }],
    ['a map value', { quotas: { reads: 10n, writes: 3n } }],
    ['a map key', { quotas: { reads: 10n, deletes: 2n } }],
  ])('keys a request with a different %s apart', async (_name, change) => {
    const server = userRouter()
    const root = scope({ default: server.transport })

    root.mount(() => createConnectQuery(listUsers, () => partial))
    root.mount(() => createConnectQuery(listUsers, () => ({ ...partial, ...change })))
    await settle()

    expect(buildConnectKey(listUsers, () => partial).key).not.toEqual(
      buildConnectKey(listUsers, () => ({ ...partial, ...change })).key
    )
    expect(server.handledBy('listUsers')).toHaveLength(2)
  })

  it('keys another transport name and an explicit keyExtension apart', async () => {
    const fallback = userRouter()
    const account = userRouter()
    const root = scope({ default: fallback.transport, account: account.transport })

    root.mount(() => createConnectQuery(getUser, () => ({ id: 1n })))
    root.mount(() =>
      createConnectQuery(getUser, () => ({ id: 1n }), { transport: 'account' })
    )
    root.mount(() =>
      createConnectQuery(getUser, () => ({ id: 1n }), {
        keyExtension: () => ['tenant', 'acme'],
      })
    )
    await settle()

    expect(fallback.handledBy('getUser')).toHaveLength(2)
    expect(account.handledBy('getUser')).toHaveLength(1)
  })

  it('shares a key between calls differing only in headers and context values, so tenant goes in keyExtension', async () => {
    const server = userRouter({
      handlers: {
        getUser: (_request, context) => ({
          name: `for ${context.requestHeader.get('x-tenant') ?? 'nobody'}`,
        }),
      },
    })
    const root = scope({ default: server.transport })

    const unkeyed = ['a', 'b'].map(
      tenant =>
        root.mount(() =>
          createConnectQuery(getUser, () => ({ id: 1n }), {
            callOptions: { headers: { 'x-tenant': tenant } },
          })
        ).value
    )
    await settle()
    // One call, whose tenant both observers now show: the header alone did
    // not make a second entry.
    expect(server.handledBy('getUser')).toHaveLength(1)
    expect(unkeyed.map(query => query.data()?.name)).toEqual(['for a', 'for a'])

    const keyed = ['c', 'd'].map(
      tenant =>
        root.mount(() =>
          createConnectQuery(getUser, () => ({ id: 1n }), {
            callOptions: { headers: { 'x-tenant': tenant } },
            keyExtension: () => ['tenant', tenant],
          })
        ).value
    )
    await settle()
    expect(server.handledBy('getUser')).toHaveLength(3)
    expect(keyed.map(query => query.data()?.name)).toEqual(['for c', 'for d'])
  })

  it.each([
    [
      'a request that is not an object',
      () => null as never,
      /its input function returned null\. Return a acme\.users\.v1\.ListUsersRequest initializer/,
    ],
    [
      'a populated google.protobuf.Any',
      () => ({
        attachment: { typeUrl: 'type.example.test/x', value: new Uint8Array([1]) },
      }),
      /holds a populated google\.protobuf\.Any \(type\.example\.test\/x\)/,
    ],
  ])('refuses %s with the key diagnostic, and makes no call', async (_name, input, diagnostic) => {
    const server = userRouter()
    const root = scope({ default: server.transport })

    const { value: query } = root.mount(() =>
      createConnectQuery(listUsers, input as () => never)
    )
    await settle()

    expect(query.error()).toBeInstanceOf(ConnectAdapterError)
    expect((query.error() as Error).message).toMatch(diagnostic)
    expect(server.handled).toHaveLength(0)
  })
})

describe('observers sharing a key', () => {
  it('make one call and receive the one result', async () => {
    const server = userRouter()
    const root = scope({ default: server.transport })

    const [first, second] = [0, 1].map(
      () => root.mount(() => createConnectQuery(getUser, () => ({ id: 1n }))).value
    )
    await settle()

    expect(server.handledBy('getUser')).toHaveLength(1)
    expect(first.data()?.name).toBe('Ada')
    expect(second.data()).toBe(first.data())
  })

  it('let a joiner with its own signal stop observing without aborting the call the first dispatched', async () => {
    const reply = hold()
    const server = userRouter({
      handlers: {
        getUser: (_request, context) =>
          reply.promise.then(() => ({
            name: `for ${context.requestHeader.get('x-observer') ?? '?'}`,
          })),
      },
    })
    const root = scope({ default: server.transport })
    const controller = new AbortController()

    const { value: owner } = root.mount(() =>
      createConnectQuery(getUser, () => ({ id: 1n }), {
        callOptions: { headers: { 'x-observer': 'owner' } },
      })
    )
    const { value: joiner } = root.mount(() =>
      createConnectQuery(getUser, () => ({ id: 1n }), {
        callOptions: {
          headers: { 'x-observer': 'joiner' },
          signal: controller.signal,
          timeoutMs: 60_000,
        },
      })
    )
    await settle()
    expect(server.handledBy('getUser')).toHaveLength(1)

    controller.abort()
    await settle()
    expect((joiner.error() as ConnectError).code).toBe(Code.Canceled)
    expect(server.handledBy('getUser')[0].signal.aborted).toBe(false)

    reply.release()
    await settle()
    // The first dispatch's options made the call, and it finished.
    expect(owner.data()?.name).toBe('for owner')
    expect(server.handledBy('getUser')).toHaveLength(1)
  })

  it('keep the call for the other when one is disposed, and abort it when the last is', async () => {
    const server = userRouter({
      handlers: { getUser: (_request, context) => aborted(context.signal).then(() => ({})) },
    })
    const root = scope({ default: server.transport })

    const first = root.mount(() => createConnectQuery(getUser, () => ({ id: 1n })))
    const second = root.mount(() => createConnectQuery(getUser, () => ({ id: 1n })))
    await settle()
    const [call] = server.handledBy('getUser')

    first.dispose()
    await settle()
    expect(call.signal.aborted).toBe(false)
    expect(second.value.fetchStatus()).toBe('fetching')

    second.dispose()
    await vi.waitFor(() => expect(call.signal.aborted).toBe(true))
    expect(server.handledBy('getUser')).toHaveLength(1)
  })
})

describe('invalidation after a mutation', () => {
  function mountReads(root: ReturnType<typeof scope>, transport?: string) {
    return {
      user: root.mount(() =>
        createConnectQuery(getUser, () => ({ id: 1n }), { transport })
      ).value,
      list: root.mount(() => createConnectQuery(listUsers, () => ({}), { transport }))
        .value,
    }
  }

  it("reloads the observed queries under the method's prefix on the default transport only", async () => {
    const fallback = userRouter()
    const account = userRouter()
    const root = scope({ default: fallback.transport, account: account.transport })
    const defaults = mountReads(root)
    const accounts = mountReads(root, 'account')
    await settle()

    const { value: mutation } = root.mount(() =>
      createConnectMutation(updateUser, { invalidates: [connectQueryPrefix(getUser)] })
    )
    await mutation.mutate({ id: 1n, name: 'Ada King' })
    await settle()

    expect(fallback.handledBy('getUser')).toHaveLength(2)
    expect(defaults.user.data()?.name).toBe('Ada King')
    // Another method on the same transport, and the same method on another.
    expect(fallback.handledBy('listUsers')).toHaveLength(1)
    expect(account.handledBy('getUser')).toHaveLength(1)
    expect(defaults.list.data()?.names).toEqual(['Ada', 'Grace'])
    expect(accounts.user.data()?.name).toBe('Ada')
  })

  it('reloads the observed queries under a named transport prefix only', async () => {
    const fallback = userRouter()
    const account = userRouter()
    const root = scope({ default: fallback.transport, account: account.transport })
    const defaults = mountReads(root)
    const accounts = mountReads(root, 'account')
    await settle()

    const { value: mutation } = root.mount(() =>
      createConnectMutation(updateUser, {
        transport: 'account',
        invalidates: [connectQueryPrefix(listUsers, { transport: 'account' })],
      })
    )
    await mutation.mutate({ id: 3n, name: 'Hedy' })
    await settle()

    expect(account.handledBy('listUsers')).toHaveLength(2)
    expect(accounts.list.data()?.names).toEqual(['Ada', 'Grace', 'Hedy'])
    expect(account.handledBy('getUser')).toHaveLength(1)
    expect(fallback.handledBy('listUsers')).toHaveLength(1)
    expect(defaults.list.data()?.names).toEqual(['Ada', 'Grace'])
  })

  it('reloads nothing after a failed mutation', async () => {
    const server = userRouter({
      handlers: {
        updateUser: () => {
          throw new ConnectError('no', Code.PermissionDenied)
        },
      },
    })
    const root = scope({ default: server.transport })
    mountReads(root)
    await settle()

    const { value: mutation } = root.mount(() =>
      createConnectMutation(updateUser, {
        invalidates: [connectQueryPrefix(getUser), connectQueryPrefix(listUsers)],
      })
    )
    await mutation.mutate({ id: 1n, name: 'x' }).catch(() => undefined)
    await settle()

    expect(server.handledBy('getUser')).toHaveLength(1)
    expect(server.handledBy('listUsers')).toHaveLength(1)
    const observation = root.client.observe(buildConnectKey(getUser, () => ({ id: 1n })).key)
    expect(observation.entry().invalidated).toBe(false)
    observation.release()
  })
})

describe('optimistic mutation state', () => {
  function optimisticRename(fail: boolean) {
    const reply = hold()
    const server = userRouter({
      handlers: {
        updateUser: async ({ name }) => {
          await reply.promise
          if (fail) {
            throw new ConnectError('conflict', Code.Aborted)
          }
          return { name }
        },
      },
    })
    const root = scope({ default: server.transport })
    // Application-owned state the view reads; the cache is not touched.
    const [displayName, setDisplayName] = createSignal('Ada')
    const onError = vi.fn((_error: unknown, _input: unknown, context: string | undefined) => {
      if (context !== undefined) {
        setDisplayName(context)
      }
    })
    const { value: mutation } = root.mount(() =>
      createConnectMutation(updateUser, {
        optimisticUpdate: ({ name }) => {
          const previous = displayName()
          setDisplayName(name ?? '')
          return previous
        },
        onError,
      })
    )
    return { server, root, reply, displayName, onError, mutation }
  }

  it('changes application state synchronously, before the reply', async () => {
    const { reply, displayName, mutation, server } = optimisticRename(false)

    const pending = mutation.mutate({ id: 1n, name: 'Ada King' })

    expect(displayName()).toBe('Ada King')
    expect(server.handledBy('updateUser')).toHaveLength(0)
    reply.release()
    await pending
    expect(displayName()).toBe('Ada King')
  })

  it("restores the prior state from optimisticUpdate's context on failure", async () => {
    const { reply, displayName, mutation, onError, root } = optimisticRename(true)

    const pending = mutation.mutate({ id: 1n, name: 'Ada King' }).catch((error: unknown) => error)
    expect(displayName()).toBe('Ada King')
    reply.release()
    const failure = await pending

    expect(onError).toHaveBeenCalledTimes(1)
    expect(onError.mock.calls[0][0]).toBe(failure)
    expect(onError.mock.calls[0][2]).toBe('Ada')
    expect(displayName()).toBe('Ada')
    // Nothing was written to the query cache on the way.
    const observation = root.client.observe(buildConnectKey(getUser, () => ({ id: 1n })).key)
    expect(observation.entry().data).toBeUndefined()
    observation.release()
  })
})

describe('providers and clients', () => {
  it('resolves default and named calls to their own provider and QueryClient', async () => {
    const fallback = userRouter()
    const account = userRouter({ users: [[1n, 'Account Ada']] })
    const client = createQueryClient()
    const root = scope({ default: fallback.transport, account: account.transport }, client)

    const { value: fromDefault } = root.mount(() =>
      createConnectQuery(getUser, () => ({ id: 1n }))
    )
    const { value: fromAccount } = root.mount(() =>
      createConnectQuery(getUser, () => ({ id: 1n }), { transport: 'account' })
    )
    await settle()

    expect(fromDefault.data()?.name).toBe('Ada')
    expect(fromAccount.data()?.name).toBe('Account Ada')
    for (const [transport, data] of [
      [undefined, fromDefault.data()],
      ['account', fromAccount.data()],
    ] as const) {
      const observation = client.observe(
        buildConnectKey(getUser, () => ({ id: 1n }), { transport }).key
      )
      expect(observation.entry().data).toBe(data)
      observation.release()
    }
  })

  it('keeps separate roots and clients from sharing providers or cached results', async () => {
    const first = userRouter({ users: [[1n, 'first']] })
    const second = userRouter({ users: [[1n, 'second']] })
    const firstRoot = scope({ default: first.transport })
    const secondRoot = scope({ default: second.transport })

    const results = [firstRoot, secondRoot].map(
      root => root.mount(() => createConnectQuery(getUser, () => ({ id: 1n }))).value
    )
    await settle()

    expect(results.map(query => (query.data() as User | undefined)?.name)).toEqual([
      'first',
      'second',
    ])
    expect(first.handledBy('getUser')).toHaveLength(1)
    expect(second.handledBy('getUser')).toHaveLength(1)
    expect(firstRoot.client).not.toBe(secondRoot.client)
  })

  it('refuses a transport nobody provided with an actionable ConnectAdapterError', () => {
    const root = scope({ default: userRouter().transport })

    const attempt = () =>
      root.mount(() => createConnectQuery(getUser, () => ({ id: 1n }), { transport: 'billing' }))

    expect(attempt).toThrowError(ConnectAdapterError)
    expect(attempt).toThrowError(
      'Call provideConnectTransport(transport, { name: "billing" })'
    )
  })

  it('refuses to provide a transport without a provided QueryClient, with an actionable ConnectAdapterError', () => {
    const context = createComponentContext('no-client')

    const attempt = () =>
      runWithComponentContext(context, () => provideConnectTransport(userRouter().transport))

    expect(attempt).toThrowError(ConnectAdapterError)
    expect(attempt).toThrowError(/provideQueryClient\(\)/)
  })

  it('rejects a different Transport under a bound name, and treats the same one again as a no-op', async () => {
    const server = userRouter()
    const client = createQueryClient()
    const context = createComponentContext('root')
    runWithComponentContext(context, () => {
      provideQueryClient(client)
      provideConnectTransport(server.transport, { name: 'account' })
    })

    expect(() =>
      runWithComponentContext(context, () =>
        provideConnectTransport(userRouter().transport, { name: 'account' })
      )
    ).toThrowError(ConnectAdapterError)
    expect(() =>
      runWithComponentContext(context, () =>
        provideConnectTransport(server.transport, { name: 'account' })
      )
    ).not.toThrow()
    client.dispose()
  })
})
