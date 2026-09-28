/**
 * `createConnectInfiniteQuery`: the pages of a unary list method accumulated
 * into one `@tachui/query` entry.
 *
 * Calls go through a scripted transport that records what it was handed and
 * settles when told, so each test decides when and how a page's call ends.
 * The query layer's own pagination semantics are its tests' to pin; these pin
 * what the adapter adds and what it must keep from the layer beneath it.
 */

import { create, fromBinary, toBinary } from '@bufbuild/protobuf'
import type { DescMessage, DescMethodUnary } from '@bufbuild/protobuf'
import { Code, ConnectError } from '@connectrpc/connect'
import { createSignal } from '@tachui/core'
import { createQueryClient, QueryError } from '@tachui/query'
import type { InfiniteData, QueryKey } from '@tachui/query'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ConnectAdapterError } from '../src/errors'
import { createConnectInfiniteQuery } from '../src/infinite'
import { buildConnectKey, connectQueryPrefix } from '../src/keys'
import { createConnectQuery } from '../src/query'
import type { ConnectInfiniteQueryResult } from '../src/types'
import {
  Lookup,
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
import type { RecordedCall, Scope } from './support/harness'

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  disposeScopes()
})

type Pages = InfiniteData<unknown, unknown>
type Result = ConnectInfiniteQueryResult<Pages>

/** The AIP-158 mapping: an empty `next_page_token` ends the list. */
function nextToken(page: unknown): string | undefined {
  return (fieldOf(page, 'nextPageToken') as string) || undefined
}

/** Creates an infinite query over ListUsers, paging on `pageToken` by default. */
function infinite(
  input: () => Record<string, unknown>,
  options: Record<string, unknown> = {}
): Result {
  return createConnectInfiniteQuery(listUsers, input as never, {
    pageParamKey: 'pageToken',
    getNextPageParam: nextToken,
    ...options,
  } as never) as unknown as Result
}

function mount(
  root: Scope,
  input: () => Record<string, unknown>,
  options?: Record<string, unknown>
): { value: Result; dispose: () => void } {
  return root.mount(() => infinite(input, options))
}

/** The token a recorded call asked for, at `path`. */
function tokenOf(call: RecordedCall, path = 'pageToken'): unknown {
  return path
    .split('.')
    .reduce<unknown>((holder, segment) => fieldOf(holder, segment), call.input)
}

/** Answers a page named after the token it was asked for. */
function answer(call: RecordedCall, next: string): void {
  call.respond({ names: [`at:${String(tokenOf(call))}`], nextPageToken: next })
}

/**
 * A transport serving a three-page list: '' (or any first token) leads to
 * 'p2', 'p2' to 'p3', and 'p3' is the last page.
 */
function threePages(): ReturnType<typeof scriptedTransport> {
  const next: Record<string, string> = { p2: 'p3', p3: '' }
  return scriptedTransport(call => answer(call, next[String(tokenOf(call))] ?? 'p2'))
}

/** The names on each page of a set, for comparing sets briefly. */
function namesOf(data: unknown): unknown[] {
  return ((data as Pages | undefined)?.pages ?? []).map(page => fieldOf(page, 'names'))
}

/** The key the adapter builds for ListUsers paged on `pageParamKey`. */
function infiniteKey(
  init: Record<string, unknown>,
  options: Record<string, unknown> = {}
): QueryKey {
  return buildConnectKey(listUsers, () => init, {
    pageParamKey: 'pageToken',
    ...options,
  }).key as QueryKey
}

/** The set a client holds under `key`, bypassing any observer. */
function heldSet(root: Scope, key: QueryKey): Pages | undefined {
  const observation = root.client.observe(key)
  try {
    return observation.entry().data as Pages | undefined
  } finally {
    observation.release()
  }
}

describe('the public surface', () => {
  it('refuses a streaming method, and something that is not a method at all', () => {
    const root = scope({ default: scriptedTransport().transport })

    for (const method of [WatchUsers, null]) {
      let failure: unknown
      try {
        root.mount(() =>
          createConnectInfiniteQuery(
            method as unknown as DescMethodUnary<DescMessage, DescMessage>,
            () => ({}),
            { pageParamKey: 'pageToken', getNextPageParam: () => undefined } as never
          )
        )
      } catch (error) {
        failure = error
      }
      expect(failure).toBeInstanceOf(ConnectAdapterError)
    }
    expect(() =>
      root.mount(() =>
        createConnectInfiniteQuery(
          WatchUsers as unknown as DescMethodUnary<DescMessage, DescMessage>,
          () => ({}),
          { pageParamKey: 'pageToken', getNextPageParam: () => undefined } as never
        )
      )
    ).toThrowError(/server_streaming method/)
  })

  it.each([
    ['names no field', 'pageTokn', /names no field of acme.users.v1.ListUsersRequest/],
    ['ends in no field', 'query.cursr', /names no field of acme.users.v1.Query/],
    ['passes through a scalar', 'pageToken.more', /not a singular message field/],
    ['passes through a list', 'filters.name', /not a singular message field/],
    ['passes through a wrapper', 'nickname.value', /not a singular message field/],
    ['ends at a message', 'query', /names a message field/],
    ['ends at a nested message', 'query.filter', /names a message field/],
    ['ends at a repeated field', 'ids', /names a repeated field/],
    ['ends at a map', 'quotas', /names a map field/],
    ['ends at a oneof', 'selector', /names a oneof/],
    ['ends at a scalar in a oneof', 'email', /names a field in oneof "selector" of acme.users.v1.ListUsersRequest/],
    ['ends at an int32 in a oneof', 'byRank', /names a field in oneof "selector"/],
    ['is empty', '', /an empty string/],
    ['is not a string', 7, /cannot use pageParamKey number/],
  ])('refuses a pageParamKey that %s, before any call', (_label, pageParamKey, message) => {
    const { transport, calls } = scriptedTransport()
    const root = scope({ default: transport })

    let failure: unknown
    try {
      mount(root, () => ({}), { pageParamKey })
    } catch (error) {
      failure = error
    }

    expect(failure).toBeInstanceOf(ConnectAdapterError)
    expect((failure as Error).message).toMatch(message)
    expect(calls).toHaveLength(0)
  })

  it.each([
    ['a string', 'pageToken', { pageToken: 'first' }, 'first'],
    ['an optional scalar', 'maxAge', { maxAge: 0 }, 0],
    ['an enum', 'role', { role: 2 }, 2],
    ['an int64', 'minId', { minId: 9n }, 9n],
    ['bytes', 'fingerprint', { fingerprint: new Uint8Array([1]) }, new Uint8Array([1])],
    ['a wrapper', 'nickname', { nickname: 'ada' }, 'ada'],
    ['a nested scalar', 'query.cursor', { query: { cursor: 'deep' } }, 'deep'],
    ['a nested optional scalar', 'filter.rank', { filter: { rank: 3 } }, 3],
  ])('accepts a token in %s field', async (_label, pageParamKey, init, first) => {
    const { transport, calls } = scriptedTransport(call => call.respond({}))
    const root = scope({ default: transport })

    const { value: query } = mount(root, () => init, { pageParamKey })
    await settle()

    expect(calls).toHaveLength(1)
    expect(tokenOf(calls[0], pageParamKey)).toEqual(first)
    expect((query.data() as Pages).pageParams).toEqual([first])
  })

  it('refuses options without a getNextPageParam function, or no options at all', () => {
    const root = scope({ default: scriptedTransport().transport })

    expect(() => mount(root, () => ({}), { getNextPageParam: 'nextPageToken' })).toThrowError(
      /was given string as getNextPageParam/
    )
    expect(() =>
      root.mount(() =>
        createConnectInfiniteQuery(listUsers, () => ({}), undefined as never)
      )
    ).toThrowError(ConnectAdapterError)
  })

  it('offers no backward pagination controls', () => {
    const root = scope({ default: scriptedTransport().transport })

    const { value: query } = mount(root, () => ({}))

    for (const member of ['hasPreviousPage', 'isFetchingPreviousPage', 'fetchPreviousPage']) {
      expect(member in query).toBe(false)
    }
    expect(typeof query.fetchNextPage).toBe('function')
  })

  it("ignores the adapter's own options if they are smuggled in", async () => {
    const { transport, calls } = threePages()
    const root = scope({ default: transport })
    const load = vi.fn()

    const { value: query } = mount(root, () => ({ pageToken: 'p2' }), {
      key: () => ['elsewhere'],
      load,
      initialPageParam: 'smuggled',
      initialPageParamFor: () => 'smuggled',
      getPreviousPageParam: () => 'p1',
      maxPages: 1,
    })
    await settle()
    await query.fetchNextPage()

    expect(load).not.toHaveBeenCalled()
    expect(calls.map(call => tokenOf(call))).toEqual(['p2', 'p3'])
    expect(namesOf(query.data())).toEqual([['at:p2'], ['at:p3']])
    expect(heldSet(root, infiniteKey({}))?.pageParams).toEqual(['p2', 'p3'])
  })
})

describe('pages and their requests', () => {
  it('asks for the first page with the input token, and the next with the returned one', async () => {
    const { transport, calls } = threePages()
    const root = scope({ default: transport })

    const { value: query } = mount(root, () => ({ pageSize: 2, pageToken: 'p2' }))
    await settle()
    const extended = await query.fetchNextPage()

    expect(calls.map(call => tokenOf(call))).toEqual(['p2', 'p3'])
    expect(calls[1].input).toEqual(
      create(ListUsersRequestSchema, { pageSize: 2, pageToken: 'p3' })
    )
    // Both pages and both tokens, in one entry.
    const held = heldSet(root, infiniteKey({ pageSize: 2 }))
    expect(namesOf(held)).toEqual([['at:p2'], ['at:p3']])
    expect(held?.pageParams).toEqual(['p2', 'p3'])
    expect(query.data()).toBe(held)
    expect(extended).toBe(held)
  })

  it('makes every page request a message of the input schema', async () => {
    const { transport, calls } = threePages()
    const root = scope({ default: transport })

    const { value: query } = mount(root, () => ({ pageSize: 2 }))
    await settle()
    await query.fetchNextPage()

    for (const call of calls) {
      expect(fieldOf(call.input, '$typeName')).toBe(ListUsersRequestSchema.typeName)
    }
  })

  it('starts an omitted implicit token from its default', async () => {
    const { transport, calls } = threePages()
    const root = scope({ default: transport })

    const { value: query } = mount(root, () => ({ pageSize: 2 }))
    await settle()

    expect(tokenOf(calls[0])).toBe('')
    expect((query.data() as Pages).pageParams).toEqual([''])
  })

  it('starts an omitted nested implicit token from its default when its parent is set', async () => {
    const { transport, calls } = threePages()
    const root = scope({ default: transport })

    mount(root, () => ({ query: { filter: { name: 'Ada' } } }), {
      pageParamKey: 'query.cursor',
    })
    await settle()

    expect(tokenOf(calls[0], 'query.cursor')).toBe('')
  })

  it.each([
    ['a token given as null', 'pageToken', { pageToken: null }, /gives "pageToken" as null/],
    ['a nested token given as null', 'query.cursor', { query: { cursor: null } }, /gives "query.cursor" as null/],
    ['an unset parent', 'query.cursor', {}, /leaves query unset/],
    ['a parent given as null', 'query.cursor', { query: null }, /leaves query null/],
    ['an unset optional token', 'maxAge', { pageSize: 2 }, /leaves "maxAge" unset, and the field tracks presence/],
    ['an unset nested optional token', 'filter.rank', { filter: {} }, /leaves "filter.rank" unset/],
    ['an unset wrapper token', 'nickname', {}, /leaves "nickname" unset/],
  ])('refuses %s through error, without a call', async (_label, pageParamKey, init, message) => {
    const { transport, calls } = scriptedTransport()
    const root = scope({ default: transport })

    const { value: query } = mount(root, () => init, { pageParamKey })
    await settle()

    expect(calls).toHaveLength(0)
    expect(query.status()).toBe('error')
    expect(query.error()).toBeInstanceOf(ConnectAdapterError)
    expect((query.error() as Error).message).toMatch(message)
    await expect(query.fetchNextPage()).rejects.toBe(query.error())
    await expect(query.refetch()).rejects.toBe(query.error())
  })

  it('refuses an unset presence-sensitive token in a proto2 request', async () => {
    const { transport, calls } = scriptedTransport()
    const root = scope({ default: transport })

    const { value: query } = root.mount(() =>
      createConnectInfiniteQuery(
        Lookup as DescMethodUnary<DescMessage, DescMessage>,
        () => ({}),
        { pageParamKey: 'label', getNextPageParam: () => undefined } as never
      )
    )
    await settle()

    expect(calls).toHaveLength(0)
    expect((query.error() as Error).message).toMatch(/leaves "label" unset/)
  })

  it('writes a nested token at its path, leaving the rest of the request and the input alone', async () => {
    const { transport, calls } = scriptedTransport(call =>
      call.respond({ nextPageToken: tokenOf(call, 'query.cursor') === 'c1' ? 'c2' : '' })
    )
    const root = scope({ default: transport })
    const init = {
      pageSize: 5,
      query: { cursor: 'c1', filter: { name: 'Ada', weight: 2 } },
    }
    const before = structuredClone(init)

    const { value: query } = mount(root, () => init, { pageParamKey: 'query.cursor' })
    await settle()
    await query.fetchNextPage()

    expect(calls).toHaveLength(2)
    expect(calls[1].input).toEqual(
      create(ListUsersRequestSchema, {
        pageSize: 5,
        query: { cursor: 'c2', filter: { name: 'Ada', weight: 2 } },
      })
    )
    expect(init).toEqual(before)
    // The first request was not written to either.
    expect(tokenOf(calls[0], 'query.cursor')).toBe('c1')
  })

  it('refuses a returned token of the wrong type as an adapter error, without a call', async () => {
    const { transport, calls } = scriptedTransport(call => call.respond({}))
    const root = scope({ default: transport })

    const { value: query } = mount(root, () => ({}), { getNextPageParam: () => 42 })
    await settle()
    const failure = await query.fetchNextPage().catch((error: unknown) => error)

    expect(calls).toHaveLength(1)
    expect(failure).toBeInstanceOf(ConnectAdapterError)
    expect((failure as Error).message).toMatch(/handed number as the token for "pageToken", which holds a string/)
    expect(query.error()).toBe(failure)
    expect((query.data() as Pages).pages).toHaveLength(1)
  })

  it.each([
    ['int32', 'pageSize', 1.5],
    ['int32', 'pageSize', Number.NaN],
    ['int32', 'pageSize', Number.POSITIVE_INFINITY],
    ['int32', 'pageSize', 2 ** 40],
    ['int32', 'pageSize', 2 ** 31],
    ['int32', 'pageSize', -(2 ** 31) - 1],
    ['int32', 'maxAge', 1.5],
    ['int32', 'minAge', Number.NaN],
    ['uint32', 'minRank', -1],
    ['uint32', 'minRank', 2 ** 32],
    ['uint32', 'minRank', 0.5],
  ])('refuses %s token %s = %s as an adapter error, without a call', async (_kind, pageParamKey, token) => {
    const { transport, calls } = scriptedTransport(call => call.respond({}))
    const root = scope({ default: transport })

    const { value: query } = mount(root, () => ({ maxAge: 0, minAge: 0 }), {
      pageParamKey,
      getNextPageParam: () => token,
    })
    await settle()
    const failure = await query.fetchNextPage().catch((error: unknown) => error)

    expect(calls).toHaveLength(1)
    expect(failure).toBeInstanceOf(ConnectAdapterError)
    expect(failure).not.toBeInstanceOf(ConnectError)
    expect((failure as Error).message).toMatch(`as the token for "${pageParamKey}"`)
  })

  it.each([
    ['pageSize', 0],
    ['pageSize', -1],
    ['pageSize', -(2 ** 31)],
    ['pageSize', 2 ** 31 - 1],
    ['maxAge', -7],
    ['minAge', 2 ** 31 - 1],
    ['minRank', 0],
    ['minRank', 2 ** 32 - 1],
  ])('sends %s token %s, and it encodes', async (pageParamKey, token) => {
    const { transport, calls } = scriptedTransport(call => call.respond({}))
    const root = scope({ default: transport })

    const { value: query } = mount(root, () => ({ maxAge: 0, minAge: 0 }), {
      pageParamKey,
      getNextPageParam: (_page: unknown, pages: readonly unknown[]) =>
        pages.length === 1 ? token : undefined,
    })
    await settle()
    await query.fetchNextPage()

    expect(calls).toHaveLength(2)
    const sent = fromBinary(
      ListUsersRequestSchema,
      toBinary(ListUsersRequestSchema, calls[1].input as never)
    )
    expect(fieldOf(sent, pageParamKey)).toBe(token)
  })

  it("sends an implicit token equal to its default as the field's absence", async () => {
    const { transport, calls } = threePages()
    const root = scope({ default: transport })

    mount(root, () => ({ pageSize: 2, pageToken: '' }))
    await settle()

    // Why an API whose cursors can be '' must page on an optional or wrapper field.
    expect(toBinary(ListUsersRequestSchema, calls[0].input as never)).toEqual(
      toBinary(ListUsersRequestSchema, create(ListUsersRequestSchema, { pageSize: 2 }))
    )
  })
})

describe('keys', () => {
  it("files every page under the method's infinite key, with the token left out", async () => {
    const { transport } = threePages()
    const root = scope({ default: transport })

    const { value: query } = mount(root, () => ({ pageSize: 50, pageToken: 'p2' }))
    await settle()

    const key = [
      'connect',
      'default',
      'acme.users.v1.UserService',
      'ListUsers',
      'infinite',
      '{"pageSize":50}',
    ]
    expect(infiniteKey({ pageSize: 50, pageToken: 'p2' })).toEqual(key)
    expect(heldSet(root, key)).toBe(query.data())
  })

  it('leaves a nested token out of the key', async () => {
    const { transport } = threePages()
    const root = scope({ default: transport })

    const { value: query } = mount(
      root,
      () => ({ query: { cursor: 'c1', filter: { name: 'Ada' } } }),
      { pageParamKey: 'query.cursor' }
    )
    await settle()

    const key = infiniteKey(
      { query: { filter: { name: 'Ada' } } },
      { pageParamKey: 'query.cursor' }
    )
    expect(key[5]).toBe('{"query":{"filter":{"name":"Ada"}}}')
    expect(heldSet(root, key)).toBe(query.data())
  })

  it('keeps apart lists that differ in another field, a transport, or an extension', async () => {
    const first = threePages()
    const second = threePages()
    const root = scope({ default: first.transport, account: second.transport })

    mount(root, () => ({ pageSize: 1 }))
    mount(root, () => ({ pageSize: 1, pageToken: 'p2' }))
    mount(root, () => ({ pageSize: 2 }))
    mount(root, () => ({ pageSize: 1 }), { keyExtension: () => ['tenant-a'] })
    mount(root, () => ({ pageSize: 1 }), { transport: 'account' })
    await settle()

    // The token-only difference shares the first entry; the rest do not.
    expect(first.calls).toHaveLength(3)
    expect(second.calls).toHaveLength(1)
  })

  it('never collides with the unary entry for the same request', async () => {
    const { transport, calls } = scriptedTransport(call =>
      call.respond({ names: ['unary or infinite'] })
    )
    const root = scope({ default: transport })

    const { value: unary } = root.mount(() =>
      createConnectQuery(listUsers, () => ({ pageSize: 50 }))
    )
    const { value: pages } = mount(root, () => ({ pageSize: 50 }))
    await settle()

    expect(calls).toHaveLength(2)
    expect(fieldOf(unary.data(), 'names')).toEqual(['unary or infinite'])
    expect((pages.data() as Pages).pages).toHaveLength(1)
  })
})

describe('invalidation through connectQueryPrefix', () => {
  it('reloads unary and infinite entries for the method on one transport only', async () => {
    const lists = threePages()
    const account = threePages()
    const root = scope({ default: lists.transport, account: account.transport })

    const { value: unary } = root.mount(() =>
      createConnectQuery(listUsers, () => ({ pageSize: 50 }))
    )
    const { value: pages } = mount(root, () => ({ pageSize: 50 }))
    root.mount(() => createConnectQuery(getUser, () => ({ id: 1n })))
    mount(root, () => ({ pageSize: 50 }), { transport: 'account' })
    await settle()
    await pages.fetchNextPage()
    await pages.fetchNextPage()
    const callsBefore = lists.calls.length
    const accountBefore = account.calls.length

    root.client.invalidate(connectQueryPrefix(listUsers))
    await settle()

    const reloaded = lists.calls.slice(callsBefore)
    // The unary entry once, and the three held pages in sequence from the
    // first held token; nothing for GetUser, and nothing on 'account'.
    expect(reloaded.every(call => call.method === listUsers)).toBe(true)
    expect(reloaded.map(call => tokenOf(call)).sort()).toEqual(['', '', 'p2', 'p3'])
    expect(
      reloaded.map(call => tokenOf(call)).filter(token => token !== '')
    ).toEqual(['p2', 'p3'])
    expect(account.calls).toHaveLength(accountBefore)
    expect(unary.status()).toBe('success')
    expect((pages.data() as Pages).pageParams).toEqual(['', 'p2', 'p3'])

    root.client.invalidate(connectQueryPrefix(listUsers, { transport: 'account' }))
    await settle()
    expect(account.calls).toHaveLength(accountBefore + 1)
    expect(lists.calls).toHaveLength(callsBefore + 4)
  })

  it('never lets an append that invalidation overtook into the refreshed set', async () => {
    const { transport, calls } = scriptedTransport()
    const root = scope({ default: transport })

    const { value: query } = mount(root, () => ({}))
    await settle()
    answer(calls[0], 'p2')
    await settle()
    const appending = query.fetchNextPage().catch((error: unknown) => error)
    await settle()
    expect(calls).toHaveLength(2)

    root.client.invalidate(connectQueryPrefix(listUsers))
    await settle()
    expect(calls).toHaveLength(3)
    expect(tokenOf(calls[2])).toBe('')
    calls[2].respond({ names: ['refreshed'], nextPageToken: 'p2' })
    await settle()
    // The overtaken append answers late.
    calls[1].respond({ names: ['stale'], nextPageToken: '' })
    await appending
    await settle()

    expect(namesOf(query.data())).toEqual([['refreshed']])
    expect(namesOf(heldSet(root, infiniteKey({})))).toEqual([['refreshed']])
  })
})

describe('key evaluations', () => {
  it('evaluates the input once per key evaluation, and never for a page or a retry', async () => {
    // Retries wait no time at all.
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const next: Record<string, string> = { '': 'p2', p2: 'p3', p3: '' }
    let failNext = false
    const { transport, calls } = scriptedTransport(call => {
      const token = String(tokenOf(call))
      if (failNext && token === 'p2') {
        failNext = false
        call.fail(new ConnectError('busy', Code.Unavailable))
        return
      }
      answer(call, next[token])
    })
    const attempts = (): unknown[] => calls.map(call => tokenOf(call))
    const root = scope({ default: transport })
    let evaluations = 0

    const { value: query } = mount(
      root,
      () => {
        evaluations += 1
        return { pageSize: 2 }
      },
      { retry: 1 }
    )
    await settle()
    await query.fetchNextPage()
    await query.fetchNextPage()
    expect(attempts()).toEqual(['', 'p2', 'p3'])

    // A sequential refetch whose second page fails once.
    failNext = true
    await query.refetch()

    expect(evaluations).toBe(1)
    // The failed page alone is asked for again; the one before it is not.
    expect(attempts().slice(3)).toEqual(['', 'p2', 'p2', 'p3'])
    expect((query.data() as Pages).pageParams).toEqual(['', 'p2', 'p3'])
  })

  it("sends a pending page and its retry from the snapshot, whatever happens to the caller's object", async () => {
    vi.useFakeTimers()
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    const { transport, calls } = scriptedTransport()
    const root = scope({ default: transport })
    const request = { pageSize: 50, pageToken: 'first' }

    const { value: query } = mount(root, () => request, { retry: 1 })
    await vi.advanceTimersByTimeAsync(0)
    answer(calls[0], 'second')
    await vi.advanceTimersByTimeAsync(0)
    const appended = query.fetchNextPage()
    await vi.advanceTimersByTimeAsync(0)
    calls[1].fail(new ConnectError('busy', Code.Unavailable))
    await vi.advanceTimersByTimeAsync(0)

    request.pageSize = 99
    request.pageToken = 'changed'
    await vi.advanceTimersByTimeAsync(50)

    expect(calls).toHaveLength(3)
    expect(calls[2].input).toEqual(
      create(ListUsersRequestSchema, { pageSize: 50, pageToken: 'second' })
    )
    answer(calls[2], '')
    await appended
    expect(heldSet(root, infiniteKey({ pageSize: 50 }))?.pageParams).toEqual([
      'first',
      'second',
    ])
  })

  it("never lets a page's response land under the key the input moved to", async () => {
    const { transport, calls } = scriptedTransport()
    const root = scope({ default: transport })
    const [size, setSize] = createSignal(50)

    const { value: moving } = mount(root, () => ({ pageSize: size() }))
    const { value: staying } = mount(root, () => ({ pageSize: 50 }))
    await settle()
    expect(calls).toHaveLength(1)

    setSize(60)
    await settle()
    const moved = calls.find(call => fieldOf(call.input, 'pageSize') === 60)
    expect(moved).toBeDefined()
    answer(calls[0], '')
    moved!.respond({ names: ['for-60'], nextPageToken: '' })
    await settle()

    expect(namesOf(staying.data())).toEqual([['at:']])
    expect(namesOf(moving.data())).toEqual([['for-60']])
  })

  it('starts a newly selected key from the token in its own input', async () => {
    const { transport, calls } = threePages()
    const root = scope({ default: transport })
    const [list, setList] = createSignal({ pageSize: 1, pageToken: 'p2' })

    const { value: query } = mount(root, () => list())
    await settle()
    await query.fetchNextPage()

    setList({ pageSize: 2, pageToken: 'p3' })
    await settle()

    expect(calls.map(call => [fieldOf(call.input, 'pageSize'), tokenOf(call)])).toEqual([
      [1, 'p2'],
      [1, 'p3'],
      [2, 'p3'],
    ])
    expect((query.data() as Pages).pageParams).toEqual(['p3'])
    expect(heldSet(root, infiniteKey({ pageSize: 1 }))?.pageParams).toEqual(['p2', 'p3'])
  })

  it('keeps the current entry when only the token changes', async () => {
    const { transport, calls } = threePages()
    const root = scope({ default: transport })
    const [token, setToken] = createSignal('')

    const { value: query } = mount(root, () => ({ pageSize: 1, pageToken: token() }))
    await settle()
    const held = query.data()

    setToken('p3')
    await settle()

    expect(calls).toHaveLength(1)
    expect(query.data()).toBe(held)
    expect((query.data() as Pages).pageParams).toEqual([''])
  })

  it('surfaces an input that cannot be keyed through error, and recovers', async () => {
    const { transport, calls } = threePages()
    const root = scope({ default: transport })
    const [valid, setValid] = createSignal(false)

    const { value: query } = mount(root, () =>
      valid() ? { pageSize: 1 } : (null as unknown as Record<string, unknown>)
    )
    await settle()
    expect(calls).toHaveLength(0)
    expect(query.error()).toBeInstanceOf(ConnectAdapterError)
    expect(query.hasNextPage()).toBe(false)

    setValid(true)
    await settle()

    expect(calls).toHaveLength(1)
    expect(query.status()).toBe('success')
    expect(query.error()).toBeUndefined()
    expect(query.hasNextPage()).toBe(true)
  })
})

describe('failures', () => {
  it.each([
    ['unavailable', Code.Unavailable],
    ['not_found', Code.NotFound],
    ['permission_denied', Code.PermissionDenied],
  ])(
    'keeps the pages held when an append fails with %s, and hands on the same ConnectError',
    async (_name, code) => {
      const failure = new ConnectError('from the server', code)
      const { transport, calls } = scriptedTransport()
      const root = scope({ default: transport })

      const { value: query } = mount(root, () => ({}))
      await settle()
      answer(calls[0], 'p2')
      await settle()
      const held = query.data()

      const appended = query.fetchNextPage().catch((error: unknown) => error)
      await settle()
      calls[1].fail(failure)

      expect(await appended).toBe(failure)
      await settle()
      expect(query.error()).toBe(failure)
      expect((query.error() as ConnectError).code).toBe(code)
      expect(query.data()).toBe(held)
      expect(namesOf(query.data())).toEqual([['at:']])

      // A later attempt asks for the same page again.
      const retried = query.fetchNextPage()
      await settle()
      expect(tokenOf(calls[2])).toBe('p2')
      answer(calls[2], '')
      await retried
      expect(namesOf(query.data())).toEqual([['at:'], ['at:p2']])
      expect(query.error()).toBeUndefined()
    }
  )

  it('surfaces a throwing getNextPageParam as a QueryError carrying what it threw', async () => {
    const thrown = new Error('no idea where the list goes')
    const { transport } = threePages()
    const root = scope({ default: transport })

    const { value: query } = mount(root, () => ({}), {
      getNextPageParam: () => {
        throw thrown
      },
    })
    await settle()

    expect(query.error()).toBeInstanceOf(QueryError)
    expect(query.error()).not.toBeInstanceOf(ConnectError)
    expect((query.error() as Error).cause).toBe(thrown)
  })
})

describe('retry', () => {
  it('makes one attempt at an append by default', async () => {
    vi.useFakeTimers()
    const { transport, calls } = scriptedTransport()
    const root = scope({ default: transport })

    const { value: query } = mount(root, () => ({}))
    await vi.advanceTimersByTimeAsync(0)
    answer(calls[0], 'p2')
    await vi.advanceTimersByTimeAsync(0)
    const appended = query.fetchNextPage().catch((error: unknown) => error)
    await vi.advanceTimersByTimeAsync(0)
    calls[1].fail(new ConnectError('busy', Code.Unavailable))
    await vi.advanceTimersByTimeAsync(60_000)

    expect(calls).toHaveLength(2)
    expect((await appended as ConnectError).code).toBe(Code.Unavailable)
  })

  it.each([
    ['unavailable', Code.Unavailable, 3],
    ['resource_exhausted', Code.ResourceExhausted, 3],
    ['not_found', Code.NotFound, 1],
    ['unauthenticated', Code.Unauthenticated, 1],
    ['deadline_exceeded', Code.DeadlineExceeded, 1],
  ])('retries an append that fails with %s only if it may', async (_name, code, attempts) => {
    vi.useFakeTimers()
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const { transport, calls } = scriptedTransport(call =>
      tokenOf(call) === 'p2'
        ? call.fail(new ConnectError('no', code))
        : answer(call, 'p2')
    )
    const root = scope({ default: transport })

    const { value: query } = mount(root, () => ({}), { retry: 2 })
    await vi.advanceTimersByTimeAsync(0)
    const appended = query.fetchNextPage().catch((error: unknown) => error)
    await vi.advanceTimersByTimeAsync(60_000)

    expect(calls.filter(call => tokenOf(call) === 'p2')).toHaveLength(attempts)
    expect((await appended as ConnectError).code).toBe(code)
    expect((query.data() as Pages).pages).toHaveLength(1)
  })
})

describe('call options', () => {
  it('passes headers and context values to every page call, and no deadline', async () => {
    const { transport, calls } = threePages()
    const root = scope({ default: transport })
    const headers = { 'x-trace': 'abc' }
    const contextValues = { get: () => undefined, set: () => contextValues, delete: () => contextValues } as never

    const { value: query } = mount(root, () => ({}), {
      callOptions: { headers, contextValues, timeoutMs: 60_000 },
    })
    await settle()
    await query.fetchNextPage()

    expect(calls).toHaveLength(2)
    for (const call of calls) {
      expect(call.header).toBe(headers)
      expect(call.contextValues).toBe(contextValues)
      expect(call.timeoutMs).toBeUndefined()
    }
  })

  it("cancels an append when the application's signal aborts", async () => {
    const { transport, calls } = scriptedTransport()
    const root = scope({ default: transport })
    const controller = new AbortController()

    const { value: query } = mount(root, () => ({}), {
      callOptions: { signal: controller.signal },
    })
    await settle()
    answer(calls[0], 'p2')
    await settle()
    const appended = query.fetchNextPage().catch((error: unknown) => error)
    await settle()

    controller.abort()
    const failure = await appended

    expect(calls[1].signal?.aborted).toBe(true)
    expect(failure).toBeInstanceOf(ConnectError)
    expect((failure as ConnectError).code).toBe(Code.Canceled)
    expect(query.error()).toBe(failure)
    expect(namesOf(query.data())).toEqual([['at:']])
  })

  it('ends an append at its deadline, though the transport never answers', async () => {
    vi.useFakeTimers()
    const { transport, calls } = scriptedTransport()
    const root = scope({ default: transport })

    const { value: query } = mount(root, () => ({}), {
      callOptions: { timeoutMs: 1_000 },
    })
    await vi.advanceTimersByTimeAsync(0)
    answer(calls[0], 'p2')
    await vi.advanceTimersByTimeAsync(0)
    const appended = query.fetchNextPage().catch((error: unknown) => error)
    await vi.advanceTimersByTimeAsync(999)
    expect(calls[1].signal?.aborted).toBe(false)

    await vi.advanceTimersByTimeAsync(1)

    const failure = await appended
    expect((failure as ConnectError).code).toBe(Code.DeadlineExceeded)
    expect(query.error()).toBe(failure)
    expect(calls[1].signal?.aborted).toBe(true)
  })

  it('cancels an append when its owner is disposed', async () => {
    const { transport, calls } = scriptedTransport()
    const root = scope({ default: transport })

    const { value: query, dispose } = mount(root, () => ({}))
    await settle()
    answer(calls[0], 'p2')
    await settle()
    const appended = query.fetchNextPage().catch((error: unknown) => error)
    await settle()

    dispose()

    expect(calls[1].signal?.aborted).toBe(true)
    expect(((await appended) as ConnectError).code).toBe(Code.Canceled)
  })

  it('settles cancel() promptly with canceled', async () => {
    const { transport, calls } = scriptedTransport()
    const root = scope({ default: transport })

    const { value: query } = mount(root, () => ({}))
    await settle()
    answer(calls[0], 'p2')
    await settle()
    const appended = query.fetchNextPage().catch((error: unknown) => error)
    await settle()

    query.cancel()

    expect(((await appended) as ConnectError).code).toBe(Code.Canceled)
    expect(calls[1].signal?.aborted).toBe(true)
  })

  it("shares one call for an append two observers join, under the first one's options", async () => {
    const { transport, calls } = scriptedTransport()
    const root = scope({ default: transport })

    const { value: first } = mount(root, () => ({}), {
      callOptions: { headers: { 'x-observer': 'first' } },
    })
    const { value: second } = mount(root, () => ({}), {
      callOptions: { headers: { 'x-observer': 'second' } },
    })
    await settle()
    expect(calls).toHaveLength(1)
    answer(calls[0], 'p2')
    await settle()

    const firstAppend = first.fetchNextPage()
    const secondAppend = second.fetchNextPage()
    await settle()

    expect(calls).toHaveLength(2)
    expect(new Headers(calls[1].header).get('x-observer')).toBe('first')
    answer(calls[1], '')
    await Promise.all([firstAppend, secondAppend])
    expect(namesOf(first.data())).toEqual([['at:'], ['at:p2']])
    expect(second.data()).toBe(first.data())
  })

  it("ends one observer's wait at its deadline without ending another's", async () => {
    vi.useFakeTimers()
    const { transport, calls } = scriptedTransport()
    const root = scope({ default: transport })

    const { value: hurried } = mount(root, () => ({}), {
      callOptions: { timeoutMs: 1_000 },
    })
    const { value: patient } = mount(root, () => ({}))
    await vi.advanceTimersByTimeAsync(0)
    answer(calls[0], 'p2')
    await vi.advanceTimersByTimeAsync(0)
    const hurriedAppend = hurried.fetchNextPage().catch((error: unknown) => error)
    const patientAppend = patient.fetchNextPage()
    await vi.advanceTimersByTimeAsync(1_000)

    expect(((await hurriedAppend) as ConnectError).code).toBe(Code.DeadlineExceeded)
    expect(calls).toHaveLength(2)
    expect(calls[1].signal?.aborted).toBe(false)

    answer(calls[1], '')
    await patientAppend
    expect(namesOf(patient.data())).toEqual([['at:'], ['at:p2']])
  })

  it('refuses a client option that is not the one the transport is bound to', () => {
    const { transport, calls } = scriptedTransport(call => call.respond({}))
    const root = scope({ default: transport })
    const other = createQueryClient()

    expect(() => mount(root, () => ({}), { client: other })).toThrowError(
      /not the QueryClient the default transport/
    )

    expect(calls).toHaveLength(0)
    for (const client of [other, root.client]) {
      const observation = client.observe(infiniteKey({}))
      expect(observation.entry().status).toBe('idle')
      observation.release()
    }
    other.dispose()
  })

  it('accepts a client option that is the one the transport is bound to', async () => {
    const { transport } = threePages()
    const root = scope({ default: transport })

    const { value: query } = mount(root, () => ({}), { client: root.client })
    await settle()

    expect(namesOf(query.data())).toEqual([['at:']])
  })
})

describe('the end of the list', () => {
  it.each([
    ['undefined', undefined],
    ['null', null],
  ])('ends when getNextPageParam returns %s, without a call', async (_label, end) => {
    const { transport, calls } = threePages()
    const root = scope({ default: transport })

    const { value: query } = mount(root, () => ({}), { getNextPageParam: () => end })
    await settle()
    const held = query.data()

    expect(query.hasNextPage()).toBe(false)
    await query.fetchNextPage()

    expect(calls).toHaveLength(1)
    expect(query.data()).toBe(held)
  })

  it('treats an empty string as a token, not as the end', async () => {
    const { transport, calls } = scriptedTransport(call => call.respond({}))
    const root = scope({ default: transport })

    const { value: query } = mount(root, () => ({ pageToken: 'first' }), {
      getNextPageParam: (page: unknown) => fieldOf(page, 'nextPageToken'),
    })
    await settle()

    expect(query.hasNextPage()).toBe(true)
    await query.fetchNextPage()

    expect(calls.map(call => tokenOf(call))).toEqual(['first', ''])
    expect((query.data() as Pages).pageParams).toEqual(['first', ''])
  })
})

describe('observers sharing a key', () => {
  it("reuse the pages held rather than starting over from a later observer's token", async () => {
    const { transport, calls } = threePages()
    const root = scope({ default: transport })

    const { value: first } = mount(root, () => ({ pageSize: 1 }))
    await settle()
    await first.fetchNextPage()

    const { value: later } = mount(root, () => ({ pageSize: 1, pageToken: 'p3' }), {
      staleTime: 60_000,
    })
    await settle()

    expect(calls).toHaveLength(2)
    expect(later.data()).toBe(first.data())
    expect((later.data() as Pages).pageParams).toEqual(['', 'p2'])
  })

  it('get an entry of their own through keyExtension', async () => {
    const { transport, calls } = threePages()
    const root = scope({ default: transport })

    const { value: first } = mount(root, () => ({ pageSize: 1 }))
    const { value: windowed } = mount(root, () => ({ pageSize: 1, pageToken: 'p3' }), {
      keyExtension: () => ['from-p3'],
    })
    await settle()

    expect(calls.map(call => tokenOf(call))).toEqual(['', 'p3'])
    expect((first.data() as Pages).pageParams).toEqual([''])
    expect((windowed.data() as Pages).pageParams).toEqual(['p3'])
  })
})
