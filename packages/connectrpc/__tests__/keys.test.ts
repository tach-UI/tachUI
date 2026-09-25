/**
 * Deterministic Connect query keys and method prefixes.
 *
 * Requests are built against descriptors from `fixtures/schema.ts`. Where the
 * question is whether the query cache agrees — invalidation, hydration — a
 * real `QueryClient` holds the entries, and the loader is the witness: an
 * entry an invalidation reached reloads, and one it did not is served.
 */

import { clone, create, isMessage, setExtension } from '@bufbuild/protobuf'
import type { DescMethod } from '@bufbuild/protobuf'
import { BinaryWriter, WireType } from '@bufbuild/protobuf/wire'
import { AnySchema, StringValueSchema, StructSchema } from '@bufbuild/protobuf/wkt'
import { createContextKey, createContextValues } from '@connectrpc/connect'
import type { Transport } from '@connectrpc/connect'
import {
  createComponentContext,
  createSignal,
  runWithComponentContext,
} from '@tachui/core'
import { createQueryClient, provideQueryClient } from '@tachui/query'
import type { QueryClient, QueryKey } from '@tachui/query'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ConnectAdapterError } from '../src/errors'
import { buildConnectKey, connectQueryPrefix } from '../src/keys'
import type { ConnectKeyBuildOptions } from '../src/keys'
import { provideConnectTransport, resolveConnectTransport } from '../src/transport'
import {
  FilterSchema,
  GetUser,
  GetUserRequestSchema,
  LegacyRequestSchema,
  ListUsers,
  ListUsersRequestSchema,
  Lookup,
  QuerySchema,
  traceTag,
} from './fixtures/schema'

function build(
  init: unknown,
  options?: ConnectKeyBuildOptions,
  method: DescMethod = ListUsers
) {
  return buildConnectKey(method, () => init as never, options)
}

/** The canonical request segment of a unary key. */
function canonical(init: unknown, method: DescMethod = ListUsers): unknown {
  return build(init, undefined, method).key[4]
}

function listUsers(init: Record<string, unknown>) {
  return create(ListUsersRequestSchema, init as never)
}

function inProduction(): void {
  vi.stubEnv('NODE_ENV', 'production')
}

const clients: QueryClient[] = []

function newClient(): QueryClient {
  const client = createQueryClient()
  clients.push(client)
  return client
}

afterEach(() => {
  vi.unstubAllEnvs()
  for (const client of clients.splice(0)) {
    client.dispose()
  }
})

function fakeTransport(): Transport {
  return {
    unary: () => Promise.reject(new Error('not called')),
    stream: () => Promise.reject(new Error('not called')),
  }
}

describe('unary key shape', () => {
  it('is root, transport name, service, method, and the canonical request', () => {
    expect(build({ pageSize: 50 }, { transport: 'account' }).key).toEqual([
      'connect',
      'account',
      'acme.users.v1.UserService',
      'ListUsers',
      '{"pageSize":50}',
    ])
  })

  it("uses 'default' when no transport name is supplied", () => {
    expect(build({ pageSize: 50 }).key).toEqual([
      'connect',
      'default',
      'acme.users.v1.UserService',
      'ListUsers',
      '{"pageSize":50}',
    ])
    expect(build({ pageSize: 50 }, {}).key).toEqual(build({ pageSize: 50 }).key)
  })

  it('names the method by its Protobuf name, not the generated local name', () => {
    expect(build({ id: 1n }, undefined, GetUser).key.slice(0, 4)).toEqual([
      'connect',
      'default',
      'acme.users.v1.UserService',
      'GetUser',
    ])
  })

  it('keys by name alone: distinct server and browser Transports under one name share a key, and a hydrated entry is hit', async () => {
    const serverClient = newClient()
    const browserClient = newClient()
    const serverScope = createComponentContext('server')
    const browserScope = createComponentContext('browser')
    const keyIn = (scope: ReturnType<typeof createComponentContext>, client: QueryClient) =>
      runWithComponentContext(scope, () => {
        provideQueryClient(client)
        provideConnectTransport(fakeTransport(), { name: 'account' })
        const { name } = resolveConnectTransport('account')
        return build({ pageSize: 50 }, { transport: name }).key
      })

    const serverKey = keyIn(serverScope, serverClient)
    const browserKey = keyIn(browserScope, browserClient)
    expect(browserKey).toEqual(serverKey)

    await serverClient.fetchQuery({
      key: () => serverKey,
      load: async () => 'from the server',
      snapshot: true,
      staleTime: 60_000,
    })
    browserClient.hydrate(serverClient.dehydrate())
    const load = vi.fn(async () => 'refetched in the browser')
    await expect(
      browserClient.fetchQuery({ key: () => browserKey, load, staleTime: 60_000 })
    ).resolves.toBe('from the server')
    expect(load).not.toHaveBeenCalled()
  })

  it('differs across transport names and across methods', () => {
    const base = build({ pageSize: 50 }).key
    expect(build({ pageSize: 50 }, { transport: 'account' }).key).not.toEqual(base)
    expect(build({}, undefined, GetUser).key[3]).not.toBe(base[3])
  })

  it.each([
    ['empty', ''],
    ['whitespace-only', '  '],
    ['non-string', 7],
    ['null', null],
  ])('refuses a %s transport name', (_label, transport) => {
    expect(() => build({}, { transport: transport as never })).toThrow(
      ConnectAdapterError
    )
  })
})

describe('equivalent requests', () => {
  it.each([
    ['int64', { minId: 9007199254740993n }, { minId: '9007199254740993' }],
    ['int64 from a number', { minId: 42n }, { minId: 42 }],
    ['bytes', { fingerprint: new Uint8Array([1, 2, 3]) }, { fingerprint: Uint8Array.of(1, 2, 3) }],
    [
      'a scalar oneof',
      { selector: { case: 'userId', value: 7n } },
      { selector: { case: 'userId', value: 7 } },
    ],
    [
      'a message oneof',
      { selector: { case: 'byFilter', value: { name: 'Ada' } } },
      { selector: { case: 'byFilter', value: create(FilterSchema, { name: 'Ada' } as never) } },
    ],
    ['an int64 map', { quotas: { a: 1n, b: 2n } }, { quotas: { a: 1, b: '2' } }],
    [
      'a message map',
      { namedFilters: { admins: { name: 'Ada' } } },
      { namedFilters: { admins: create(FilterSchema, { name: 'Ada' } as never) } },
    ],
  ])('share a segment for %s, as initializer or generated message', (_label, first, second) => {
    const segment = canonical(first)
    expect(canonical(second)).toBe(segment)
    expect(canonical(listUsers(first))).toBe(segment)
    expect(canonical(listUsers(second))).toBe(segment)
  })

  it('renders int64 and bytes in their Protobuf JSON forms', () => {
    expect(
      canonical({ minId: 9007199254740993n, fingerprint: new Uint8Array([1, 2, 3]) })
    ).toBe('{"fingerprint":"AQID","minId":"9007199254740993"}')
  })

  it.each([
    ['int64', { minId: 1n }, { minId: 2n }],
    ['bytes', { fingerprint: new Uint8Array([1]) }, { fingerprint: new Uint8Array([2]) }],
    ['bytes length', { fingerprint: new Uint8Array([1]) }, { fingerprint: new Uint8Array([1, 0]) }],
    [
      'oneof case',
      { selector: { case: 'email', value: '7' } },
      { selector: { case: 'userId', value: 7n } },
    ],
    [
      'oneof value',
      { selector: { case: 'byFilter', value: { name: 'Ada' } } },
      { selector: { case: 'byFilter', value: { name: 'Grace' } } },
    ],
    ['map value', { quotas: { a: 1n } }, { quotas: { a: 2n } }],
    ['map key', { quotas: { a: 1n } }, { quotas: { b: 1n } }],
    ['repeated order', { ids: [1n, 2n] }, { ids: [2n, 1n] }],
    ['enum', { role: 1 }, { role: 2 }],
    ['string', { pageToken: 'a' }, { pageToken: 'b' }],
  ])('change the segment when the %s changes', (_label, first, second) => {
    expect(canonical(first)).not.toBe(canonical(second))
  })
})

describe('canonical request text', () => {
  it('ignores field construction order', () => {
    const forward = { pageSize: 50, pageToken: 't', role: 1, minId: 3n }
    const backward = { minId: 3n, role: 1, pageToken: 't', pageSize: 50 }
    expect(canonical(backward)).toBe(canonical(forward))
    expect(canonical(listUsers(backward))).toBe(canonical(forward))
  })

  it('ignores map insertion order, including in nested messages and message maps', () => {
    const forward = {
      quotas: { a: 1n, b: 2n, c: 3n },
      filter: { name: 'x', labels: { alpha: '1', beta: '2' } },
      namedFilters: {
        one: { labels: { m: '1', n: '2' } },
        two: { name: 'y' },
      },
    }
    const backward = {
      namedFilters: {
        two: { name: 'y' },
        one: { labels: { n: '2', m: '1' } },
      },
      filter: { labels: { beta: '2', alpha: '1' }, name: 'x' },
      quotas: { c: 3n, b: 2n, a: 1n },
    }
    expect(canonical(backward)).toBe(canonical(forward))
    expect(canonical(forward)).toBe(
      '{"filter":{"labels":{"alpha":"1","beta":"2"},"name":"x"},"namedFilters":{"one":{"labels":{"m":"1","n":"2"}},"two":{"name":"y"}},"quotas":{"a":"1","b":"2","c":"3"}}'
    )
  })

  it('is readable JSON that parses back to the request and is stable across builds', () => {
    const init = { pageSize: 50, filter: { name: 'Ada' } }
    const segment = canonical(init) as string
    expect(JSON.parse(segment)).toEqual({ filter: { name: 'Ada' }, pageSize: 50 })
    for (let attempt = 0; attempt < 3; attempt += 1) {
      expect(canonical(init)).toBe(segment)
    }
  })

  it('keeps a generated message out of the key, so the generic hasher only ever sees strings', async () => {
    const message = listUsers({ pageSize: 50, minId: 1n })
    const { key } = build(message)
    for (const segment of key) {
      expect(typeof segment).toBe('string')
    }

    expect(key).not.toContain(message)
    expect(key[4]).toBe('{"minId":"1","pageSize":50}')

    const client = newClient()
    await expect(
      client.fetchQuery({ key: () => key, load: async () => 'ok' })
    ).resolves.toBe('ok')
  })
})

describe('normalization and pinned JSON options', () => {
  it('normalizes a partial initializer through the input schema', () => {
    const partial = { filter: { name: 'Ada' } }
    expect(canonical(partial)).toBe(canonical(listUsers(partial)))
    expect(build(partial).request).toEqual(listUsers(partial))
  })

  it('writes camelCase field names and string enum names', () => {
    expect(canonical({ pageSize: 5, role: 1 })).toBe(
      '{"pageSize":5,"role":"ROLE_ADMIN"}'
    )
  })

  it.each([
    ['int32', { pageSize: 0 }],
    ['string', { pageToken: '' }],
    ['int64', { minId: 0n }],
    ['bytes', { fingerprint: new Uint8Array(0) }],
    ['enum', { role: 0 }],
    ['list', { ids: [] }],
    ['map', { quotas: {} }],
  ])('keys an explicit implicit %s zero exactly as its omission', (_label, zero) => {
    expect(canonical(zero)).toBe('{}')
    expect(canonical(listUsers(zero))).toBe('{}')
    expect(build(zero).key).toEqual(build({}).key)
  })

  it('keeps an explicitly present proto3 optional zero distinct from omission', () => {
    expect(canonical({ maxAge: 0 })).toBe('{"maxAge":0}')
    expect(canonical({ maxAge: 0 })).not.toBe(canonical({}))
    expect(canonical(listUsers({ maxAge: 0 }))).toBe('{"maxAge":0}')
  })

  it('keeps an explicitly present proto2 zero distinct from omission', () => {
    expect(canonical({ limit: 0 }, Lookup)).toBe('{"limit":0}')
    expect(canonical({}, Lookup)).toBe('{}')
    expect(
      canonical(create(LegacyRequestSchema, { limit: 0 } as never), Lookup)
    ).toBe('{"limit":0}')
  })

  it('keys a null or undefined member as its omission', () => {
    expect(
      canonical({ filter: null, pageToken: undefined, selector: null, maxAge: undefined })
    ).toBe('{}')
  })

  it('accepts an empty $unknown list, which carries nothing', () => {
    expect(canonical({ pageSize: 5, $unknown: [] })).toBe('{"pageSize":5}')
  })

  it('keeps a present empty message distinct from an absent one', () => {
    expect(canonical({ filter: {} })).toBe('{"filter":{}}')
    expect(canonical({ filter: {} })).not.toBe(canonical({}))
  })

  it('refuses a request Protobuf JSON cannot write, rather than keying it', () => {
    expect(() => build({ pageSize: 'fifty' })).toThrow(ConnectAdapterError)
    expect(() => build({ pageSize: 'fifty' })).toThrow(/not a valid acme\.users\.v1\.ListUsersRequest/)
  })
})

describe('one evaluation, one request', () => {
  it('evaluates the input exactly once per build', () => {
    const input = vi.fn(() => ({ pageSize: 50 }))
    buildConnectKey(ListUsers, input as never)
    expect(input).toHaveBeenCalledTimes(1)
  })

  it('evaluates keyExtension once per build too', () => {
    const keyExtension = vi.fn(() => ['tenant-a'])
    build({}, { keyExtension })
    expect(keyExtension).toHaveBeenCalledTimes(1)
  })

  it('returns a normalized message whose own key is the key it came with', () => {
    const { key, request } = build({ pageSize: 50, quotas: { b: 2n, a: 1n } })
    expect(isMessage(request, ListUsersRequestSchema)).toBe(true)
    expect(build(request).key).toEqual(key)
  })

  it('detaches both results from a caller-owned initializer', () => {
    const init = {
      pageSize: 50,
      fingerprint: new Uint8Array([1, 2]),
      ids: [1n, 2n],
      quotas: { a: 1n } as Record<string, bigint>,
      filter: { name: 'Ada', labels: { team: 'core' } as Record<string, string> },
      filters: [{ name: 'first' }],
    }
    const { key, request } = build(init)
    const keyBefore = [...key]
    const requestBefore = clone(ListUsersRequestSchema, request)

    init.pageSize = 99
    init.fingerprint[0] = 9
    init.ids.push(3n)
    init.quotas.b = 2n
    init.filter.name = 'Grace'
    init.filter.labels.team = 'infra'
    init.filters[0]!.name = 'changed'

    expect(key).toEqual(keyBefore)
    expect(request).toEqual(requestBefore)
    expect(build(request).key).toEqual(keyBefore)
  })

  it('detaches both results from a caller-owned generated message', () => {
    const message = listUsers({
      pageSize: 50,
      fingerprint: new Uint8Array([1, 2]),
      filter: { name: 'Ada' },
    })
    const { key, request } = build(message)
    expect(request).not.toBe(message)
    const keyBefore = [...key]

    const mutable = message as unknown as {
      pageSize: number
      fingerprint: Uint8Array
      filter: { name: string }
    }
    mutable.pageSize = 99
    mutable.fingerprint[0] = 9
    mutable.filter.name = 'Grace'

    expect(key).toEqual(keyBefore)
    expect(request).toEqual(
      listUsers({ pageSize: 50, fingerprint: new Uint8Array([1, 2]), filter: { name: 'Ada' } })
    )
  })

  it('keeps a reactive input change from reaching a request already keyed', () => {
    const [pageSize, setPageSize] = createSignal(50)
    const first = buildConnectKey(ListUsers, () => ({ pageSize: pageSize() }) as never)

    setPageSize(100)
    const second = buildConnectKey(ListUsers, () => ({ pageSize: pageSize() }) as never)

    expect(first.key[4]).toBe('{"pageSize":50}')
    expect((first.request as unknown as { pageSize: number }).pageSize).toBe(50)
    expect(second.key[4]).toBe('{"pageSize":100}')
    expect((second.request as unknown as { pageSize: number }).pageSize).toBe(100)
  })
})

describe('connectQueryPrefix', () => {
  it("targets the default transport when none is named", () => {
    expect(connectQueryPrefix(ListUsers)).toEqual([
      'connect',
      'default',
      'acme.users.v1.UserService',
      'ListUsers',
    ])
    expect(connectQueryPrefix(ListUsers, {})).toEqual(connectQueryPrefix(ListUsers))
  })

  it('targets a named transport', () => {
    expect(connectQueryPrefix(ListUsers, { transport: 'account' })).toEqual([
      'connect',
      'account',
      'acme.users.v1.UserService',
      'ListUsers',
    ])
  })

  it('is a prefix of every unary and infinite key for the method on its transport', () => {
    const prefix = connectQueryPrefix(ListUsers)
    const keys = [
      build({}).key,
      build({ pageSize: 50 }).key,
      build({ pageSize: 50 }, { pageParamKey: 'pageToken' }).key,
      build({ pageSize: 50 }, { keyExtension: () => ['tenant-a'] }).key,
    ]
    for (const key of keys) {
      expect(key.slice(0, prefix.length)).toEqual(prefix)
    }
  })

  describe('invalidation', () => {
    const entries = {
      unaryDefault: () => build({ pageSize: 50 }).key,
      unaryDefaultOther: () => build({ pageSize: 10, pageToken: 'x' }).key,
      infiniteDefault: () => build({ pageSize: 50 }, { pageParamKey: 'pageToken' }).key,
      extendedDefault: () => build({ pageSize: 50 }, { keyExtension: () => ['tenant-a'] }).key,
      unaryAccount: () => build({ pageSize: 50 }, { transport: 'account' }).key,
      infiniteAccount: () =>
        build({ pageSize: 50 }, { transport: 'account', pageParamKey: 'pageToken' }).key,
      otherMethodDefault: () => build({ id: 1n }, undefined, GetUser).key,
      otherMethodAccount: () => build({ id: 1n }, { transport: 'account' }, GetUser).key,
    }
    type EntryName = keyof typeof entries

    async function reloadedAfter(prefix: QueryKey): Promise<EntryName[]> {
      const client = newClient()
      const names = Object.keys(entries) as EntryName[]
      for (const name of names) {
        await client.fetchQuery({
          key: entries[name],
          load: async () => name,
          staleTime: 60_000,
        })
      }
      client.invalidate(prefix)
      const reloaded: EntryName[] = []
      for (const name of names) {
        await client.fetchQuery({
          key: entries[name],
          load: async () => {
            reloaded.push(name)
            return name
          },
          staleTime: 60_000,
        })
      }
      return reloaded
    }

    it('with the default prefix reaches only the default transport entries for the method', async () => {
      expect(await reloadedAfter(connectQueryPrefix(ListUsers))).toEqual([
        'unaryDefault',
        'unaryDefaultOther',
        'infiniteDefault',
        'extendedDefault',
      ])
    })

    it('with a named prefix reaches only that transport entries for the method', async () => {
      expect(
        await reloadedAfter(connectQueryPrefix(ListUsers, { transport: 'account' }))
      ).toEqual(['unaryAccount', 'infiniteAccount'])
    })

    it('with another method prefix leaves this method untouched', async () => {
      expect(await reloadedAfter(connectQueryPrefix(GetUser))).toEqual([
        'otherMethodDefault',
      ])
    })
  })

  it.each([
    ['an empty', '', '""'],
    ['a whitespace-only', '   ', '"   "'],
    ['a non-string', 42, 'number'],
    ['a null', null, 'null'],
  ])('refuses %s transport name with the provision diagnostic', (_label, name, given) => {
    const attempt = () => connectQueryPrefix(ListUsers, { transport: name as never })
    expect(attempt).toThrow(ConnectAdapterError)
    expect(attempt).toThrow(
      `[@tachui/connectrpc] connectQueryPrefix() was given ${given} as a transport name. A name must be a non-empty string; omit it to target the default transport.`
    )

    // The same rule, and the same wording, as provision.
    const scope = createComponentContext('provision')
    runWithComponentContext(scope, () => provideQueryClient(newClient()))
    expect(() =>
      runWithComponentContext(scope, () =>
        provideConnectTransport(fakeTransport(), { name: name as never })
      )
    ).toThrow(
      `[@tachui/connectrpc] provideConnectTransport() was given ${given} as a transport name. A name must be a non-empty string; omit it to provide the default transport.`
    )
  })

  it.each([
    ['an array', [], /was given an array as its options/],
    ['a string', 'account', /was given string as its options/],
  ])('refuses %s as its options', (_label, options, message) => {
    expect(() => connectQueryPrefix(ListUsers, options as never)).toThrow(message)
  })

  it.each([
    ['null', null],
    ['a service', { kind: 'service', name: 'UserService' }],
    ['a message descriptor', ListUsersRequestSchema],
  ])('refuses %s in place of a method descriptor', (_label, method) => {
    expect(() => connectQueryPrefix(method as never)).toThrow(
      /not a method descriptor/
    )
  })
})

describe('infinite keys', () => {
  it("add 'infinite' immediately after the method name", () => {
    expect(build({ pageSize: 50 }, { pageParamKey: 'pageToken' }).key).toEqual([
      'connect',
      'default',
      'acme.users.v1.UserService',
      'ListUsers',
      'infinite',
      '{"pageSize":50}',
    ])
  })

  it('never collide with the unary key for the same request', () => {
    expect(build({ pageSize: 50 }, { pageParamKey: 'pageToken' }).key).not.toEqual(
      build({ pageSize: 50 }).key
    )
  })

  it('share one entry across continuation tokens, and keep the token in the request', () => {
    const first = build({ pageSize: 50 }, { pageParamKey: 'pageToken' })
    const second = build({ pageSize: 50, pageToken: 'abc' }, { pageParamKey: 'pageToken' })
    const third = build({ pageToken: 'def', pageSize: 50 }, { pageParamKey: 'pageToken' })
    expect(second.key).toEqual(first.key)
    expect(third.key).toEqual(first.key)
    expect((second.request as unknown as { pageToken: string }).pageToken).toBe('abc')
  })

  it('still distinguish different lists', () => {
    expect(build({ pageSize: 50 }, { pageParamKey: 'pageToken' }).key).not.toEqual(
      build({ pageSize: 10 }, { pageParamKey: 'pageToken' }).key
    )
  })

  it('omit a token nested in a request sub-message', () => {
    const first = build({ query: { filter: { name: 'Ada' } } }, { pageParamKey: 'query.cursor' })
    const next = build(
      { query: { cursor: 'abc', filter: { name: 'Ada' } } },
      { pageParamKey: 'query.cursor' }
    )
    expect(next.key).toEqual(first.key)
    expect(next.key[5]).toBe('{"query":{"filter":{"name":"Ada"}}}')
    expect(
      (next.request as unknown as { query: { cursor: string } }).query.cursor
    ).toBe('abc')
  })

  it('omit a oneof named as the page param', () => {
    expect(
      build({ selector: { case: 'email', value: 'a@b' } }, { pageParamKey: 'selector' }).key
    ).toEqual(build({}, { pageParamKey: 'selector' }).key)
  })

  it('resolve a nested path whose parent the request leaves unset', () => {
    expect(build({}, { pageParamKey: 'query.cursor' }).key[5]).toBe('{}')
  })

  it('key a parent alike whether absent, present but empty, or holding only the token', () => {
    const options = { pageParamKey: 'query.cursor' }
    const absent = build({}, options)
    const empty = build({ query: {} }, options)
    const tokenOnly = build({ query: { cursor: 'abc' } }, options)
    expect(absent.key[5]).toBe('{}')
    expect(empty.key).toEqual(absent.key)
    expect(tokenOnly.key).toEqual(absent.key)
    expect(
      (tokenOnly.request as unknown as { query: { cursor: string } }).query.cursor
    ).toBe('abc')
    expect(
      build({ query: { cursor: 'abc', filter: { name: 'Ada' } } }, options).key[5]
    ).toBe('{"query":{"filter":{"name":"Ada"}}}')
  })

  it('drop every parent the token leaves empty, and stop at one it does not', () => {
    const options = { pageParamKey: 'query.filter.name' }
    const absent = build({}, options).key
    expect(absent[5]).toBe('{}')
    expect(build({ query: {} }, options).key).toEqual(absent)
    expect(build({ query: { filter: {} } }, options).key).toEqual(absent)
    expect(build({ query: { filter: { name: 'Ada' } } }, options).key).toEqual(absent)
    expect(
      build({ query: { cursor: 'c', filter: { name: 'Ada' } } }, options).key[5]
    ).toBe('{"query":{"cursor":"c"}}')
  })

  it.each([
    ['names no field', 'pageTokn', /names no field/],
    ['ends in no field', 'query.cursr', /names no field/],
    ['passes through a scalar', 'pageToken.more', /not a singular message field/],
    ['passes through a list', 'filters.name', /not a singular message field/],
    ['passes through a oneof', 'selector.value', /not a singular message field/],
    ['passes through a wrapper', 'nickname.value', /not a singular message field/],
    ['passes through a Struct', 'metadata.fields', /not a singular message field/],
    ['is empty', '', /must be a request field name/],
    ['is not a string', 7, /must be a request field name/],
  ])('refuse a pageParamKey that %s', (_label, pageParamKey, message) => {
    expect(() => build({}, { pageParamKey: pageParamKey as never })).toThrow(message)
  })

  describe.each([
    ['development', () => {}],
    ['production', inProduction],
  ])('in %s', (_environment, setUp) => {
    it.each([
      ['a wrapper, set', { nickname: 'a' }, 'nickname.value'],
      ['a Struct, set', { metadata: { x: 1 } }, 'metadata.fields'],
      ['a wrapper, unset', {}, 'nickname.value'],
    ])('refuse a path through %s', (_label, init, pageParamKey) => {
      setUp()
      const attempt = () => build(init, { pageParamKey })
      expect(attempt).toThrow(ConnectAdapterError)
      expect(attempt).toThrow(/not a singular message field/)
    })

    it.each(['pageToken', 'query.cursor', 'nickname', 'selector'])(
      'accept %s',
      pageParamKey => {
        setUp()
        expect(build({}, { pageParamKey }).key[4]).toBe('infinite')
      }
    )

    /** Options whose pageParamKey getter answers `first` twice, then `later`. */
    function shiftingOptions(
      first: string | undefined,
      later: string | undefined
    ): ConnectKeyBuildOptions {
      let reads = 0
      return {
        get pageParamKey() {
          reads += 1
          return reads <= 2 ? first : later
        },
      }
    }

    it('shape the key and omit the token from one read of pageParamKey', () => {
      setUp()
      const init = { pageSize: 50, pageToken: 'abc' }
      const unary = build({ pageSize: 50 }).key

      const infinite = build(init, shiftingOptions('pageToken', undefined)).key
      expect(infinite).toEqual(build({ pageSize: 50 }, { pageParamKey: 'pageToken' }).key)
      expect(infinite[5]).toBe('{"pageSize":50}')
      expect(infinite).not.toEqual(unary)

      const plain = build(init, shiftingOptions(undefined, 'pageToken')).key
      expect(plain).toEqual(build(init).key)
      expect(plain[4]).toBe('{"pageSize":50,"pageToken":"abc"}')
      expect(plain).not.toEqual(unary)
    })
  })
})

describe('headers, context values, and keyExtension', () => {
  it('keys a request alike whatever headers or context values accompany it', () => {
    const tenant = createContextKey('none', { description: 'tenant' })
    const base = build({ pageSize: 50 }).key
    const withHeaders = build(
      { pageSize: 50 },
      { callOptions: { headers: { 'x-tenant': 'a' }, timeoutMs: 1000 } }
    ).key
    const withOtherHeaders = build(
      { pageSize: 50 },
      { callOptions: { headers: { 'x-tenant': 'b' } } }
    ).key
    const withContext = build(
      { pageSize: 50 },
      { callOptions: { contextValues: createContextValues().set(tenant, 'a') } }
    ).key
    expect(withHeaders).toEqual(base)
    expect(withOtherHeaders).toEqual(base)
    expect(withContext).toEqual(base)
  })

  it('appends keyExtension segments after the canonical request', () => {
    expect(
      build({ pageSize: 50 }, { keyExtension: () => ['tenant', { id: 'a' }] }).key
    ).toEqual([
      'connect',
      'default',
      'acme.users.v1.UserService',
      'ListUsers',
      '{"pageSize":50}',
      'tenant',
      { id: 'a' },
    ])
    expect(
      build({}, { pageParamKey: 'pageToken', keyExtension: () => ['tenant-a'] }).key.slice(4)
    ).toEqual(['infinite', '{}', 'tenant-a'])
  })

  it('separates response identities supplied through keyExtension', () => {
    const forTenant = (tenant: string) =>
      build({ pageSize: 50 }, { keyExtension: () => [tenant] }).key
    expect(forTenant('a')).not.toEqual(forTenant('b'))
    expect(forTenant('a')).not.toEqual(build({ pageSize: 50 }).key)
  })

  it('refuses a keyExtension that is not a function, throws, or returns no array', () => {
    expect(() => build({}, { keyExtension: ['a'] as never })).toThrow(
      /keyExtension is an array, not a function/
    )
    const failure = new Error('no tenant')
    let thrown: unknown
    try {
      build({}, { keyExtension: () => { throw failure } })
    } catch (error) {
      thrown = error
    }
    expect(thrown).toBeInstanceOf(ConnectAdapterError)
    expect((thrown as Error).cause).toBe(failure)
    expect(() => build({}, { keyExtension: () => 'tenant' as never })).toThrow(
      /keyExtension returned string/
    )
  })
})

describe('Any and extensions', () => {
  const populatedAny = () =>
    create(AnySchema, {
      typeUrl: 'type.googleapis.com/acme.users.v1.Filter',
      value: new Uint8Array([10, 3, 65, 100, 97]),
    })

  const cases: [string, () => unknown, RegExp][] = [
    ['a singular field', () => ({ attachment: populatedAny() }), /request\.attachment holds/],
    [
      'an initializer',
      () => ({ attachment: { typeUrl: 'type.googleapis.com/x.Y' } }),
      /request\.attachment holds/,
    ],
    ['a list element', () => ({ attachments: [{}, populatedAny()] }), /request\.attachments\[1\] holds/],
    [
      'a map value',
      () => ({ attachmentsByName: { main: populatedAny() } }),
      /request\.attachmentsByName\["main"\] holds/,
    ],
    [
      'bytes with no type URL',
      () => ({ attachment: { value: new Uint8Array([1]) } }),
      /request\.attachment holds/,
    ],
  ]

  describe.each([
    ['development', () => {}],
    ['production', inProduction],
  ])('in %s', (_environment, setUp) => {
    it.each(cases)('refuses a populated Any in %s, naming the field', (_label, init, field) => {
      setUp()
      const attempt = () => build(init())
      expect(attempt).toThrow(ConnectAdapterError)
      expect(attempt).toThrow(field)
      expect(attempt).toThrow(/registries are not yet supported/)
    })

    it('refuses extension data, naming the extension field', () => {
      setUp()
      const request = create(LegacyRequestSchema, { limit: 5 } as never)
      setExtension(request as never, traceTag, 'trace-1' as never)
      const attempt = () => build(request, undefined, Lookup)
      expect(attempt).toThrow(ConnectAdapterError)
      expect(attempt).toThrow(/request carries extension data \(field number 100 of acme\.legacy\.v1\.LegacyRequest\)/)
      expect(attempt).toThrow(/registries are not yet supported/)
    })
  })

  it('accepts an Any left unset or empty', () => {
    expect(canonical({})).toBe('{}')
    expect(canonical({ attachment: {} })).toBe('{"attachment":{}}')
    expect(canonical({ attachments: [] })).toBe('{}')
  })
})

describe('wrapper and Struct fields', () => {
  describe.each([
    ['development', () => {}],
    ['production', inProduction],
  ])('in %s', (_environment, setUp) => {
    it.each([
      ['a StringValue', { nickname: 'Ada' }, '{"nickname":"Ada"}'],
      ['an Int64Value', { sinceId: 9007199254740993n }, '{"sinceId":"9007199254740993"}'],
    ])('key %s as its bare scalar, as initializer or generated message', (_label, init, segment) => {
      setUp()
      expect(canonical(init)).toBe(segment)
      expect(canonical(listUsers(init))).toBe(segment)
      expect(build(init).request).toEqual(listUsers(init))
    })

    it('keeps a present wrapper zero distinct from omission', () => {
      setUp()
      expect(canonical({ nickname: '' })).toBe('{"nickname":""}')
      expect(canonical({ sinceId: 0n })).toBe('{"sinceId":"0"}')
      expect(canonical(listUsers({ nickname: '' }))).toBe('{"nickname":""}')
      expect(canonical({ nickname: '' })).not.toBe(canonical({}))
    })

    it('still checks a wrapper in a oneof as a message', () => {
      setUp()
      const init = { selector: { case: 'byNickname', value: { value: 'Ada' } } }
      expect(canonical(init)).toBe('{"byNickname":"Ada"}')
      expect(canonical(listUsers(init))).toBe('{"byNickname":"Ada"}')
      expect(() =>
        build({ selector: { case: 'byNickname', value: 'Ada' } })
      ).toThrow(/request\.selector\.value is string, but google\.protobuf\.StringValue is a message/)
    })

    it.each([
      ['a generated message', () => ({ nickname: create(StringValueSchema, { value: 'x' }) })],
      ['an initializer', () => ({ nickname: { value: 'x' } })],
    ])('refuses a wrapper held as %s outside a oneof', (_label, init) => {
      setUp()
      expect(() => build(init())).toThrow(ConnectAdapterError)
    })

    // `fields` is the Struct message's own field name, and must key like any other.
    const json = { fields: 1, b: [true, null, 'x'], a: { z: 2, y: {} } }
    const jsonText = '{"a":{"y":{},"z":2},"b":[true,null,"x"],"fields":1}'

    it.each([
      ['a singular field', { metadata: json }, `{"metadata":${jsonText}}`],
      ['a list element', { metadataList: [json] }, `{"metadataList":[${jsonText}]}`],
      ['a map value', { metadataByName: { main: json } }, `{"metadataByName":{"main":${jsonText}}}`],
      [
        'a oneof member',
        { selector: { case: 'byMetadata', value: json } },
        `{"byMetadata":${jsonText}}`,
      ],
    ])('key a Struct in %s as its JSON object, keys sorted', (_label, init, segment) => {
      setUp()
      expect(canonical(init)).toBe(segment)
      expect(canonical(listUsers(init))).toBe(segment)
    })

    it('refuses something other than a JSON object where a Struct belongs', () => {
      setUp()
      expect(() => build({ metadata: 'x' })).toThrow(
        /request\.metadata is string, but google\.protobuf\.Struct is a JSON object/
      )
    })

    it.each([
      [
        'a singular field',
        () => ({ metadata: create(StructSchema, {}) }),
        /request\.metadata is a google\.protobuf\.Struct message/,
      ],
      [
        'a list element',
        () => ({ metadataList: [{}, create(StructSchema, {})] }),
        /request\.metadataList\[1\] is a google\.protobuf\.Struct message/,
      ],
    ])('refuses a Struct message in %s, naming the field', (_label, init, field) => {
      setUp()
      const attempt = () => build(init())
      expect(attempt).toThrow(ConnectAdapterError)
      expect(attempt).toThrow(field)
      expect(attempt).toThrow(/takes a plain JSON object/)
    })

    it.each([
      [
        'another message where a Struct belongs',
        () => ({ metadata: create(FilterSchema, { name: 'x' } as never) }),
        /request\.metadata is a acme\.users\.v1\.Filter message/,
      ],
      [
        'a Struct message inside Struct JSON',
        () => ({ metadata: { a: create(StructSchema, {}) } }),
        /request\.metadata\["a"\] is a google\.protobuf\.Struct message/,
      ],
      [
        'an Any message inside Struct JSON',
        () => ({
          metadataByName: {
            main: {
              a: [
                create(AnySchema, {
                  typeUrl: 'type.googleapis.com/acme.users.v1.Filter',
                  value: new Uint8Array([10, 1, 120]),
                }),
              ],
            },
          },
        }),
        /request\.metadataByName\["main"\]\["a"\]\[0\] is a google\.protobuf\.Any message/,
      ],
      [
        'a message carrying unknown fields inside Struct JSON',
        () => {
          const filter = create(FilterSchema, { name: 'x' } as never) as unknown as {
            $unknown?: unknown
          }
          filter.$unknown = [{ no: 50, wireType: WireType.Varint, data: new Uint8Array([1]) }]
          return { metadataList: [{ inner: filter }] }
        },
        /request\.metadataList\[0\]\["inner"\] is a acme\.users\.v1\.Filter message/,
      ],
    ])('refuses %s, naming the position', (_label, init, position) => {
      setUp()
      const attempt = () => build(init())
      expect(attempt).toThrow(ConnectAdapterError)
      expect(attempt).toThrow(position)
      expect(attempt).toThrow(/takes a plain JSON object/)
    })

    it.each([
      ['undefined as a direct member', { metadata: { a: undefined } }, /request\.metadata\["a"\] is undefined/],
      ['undefined as a nested member', { metadata: { a: { b: undefined } } }, /request\.metadata\["a"\]\["b"\] is undefined/],
      ['undefined as a list element', { metadata: { a: [undefined] } }, /request\.metadata\["a"\]\[0\] is undefined/],
      ['a bigint as a direct member', { metadata: { id: 1n } }, /request\.metadata\["id"\] is bigint/],
      ['a bigint as a nested member', { metadata: { a: { id: 1n } } }, /request\.metadata\["a"\]\["id"\] is bigint/],
      ['a bigint as a list element', { metadata: { a: [1n] } }, /request\.metadata\["a"\]\[0\] is bigint/],
    ])('refuses %s of Struct JSON, naming the position', (_label, init, position) => {
      setUp()
      const attempt = () => build(init)
      expect(attempt).toThrow(ConnectAdapterError)
      expect(attempt).toThrow(position)
      expect(attempt).toThrow(/holds only JSON values/)
    })

    it('refuses distinct bigint Struct members rather than keying them alike', () => {
      setUp()
      expect(() => build({ metadata: { id: 1n } })).toThrow(ConnectAdapterError)
      expect(() => build({ metadata: { id: 2n } })).toThrow(ConnectAdapterError)
    })

    it('keys and sends a $typeName member naming no request message type as data', () => {
      setUp()
      const init = { metadata: { a: { $typeName: 'order', total: 3 } } }
      expect(canonical(init)).toBe('{"metadata":{"a":{"$typeName":"order","total":3}}}')
      const sent = build(init).request as unknown as { metadata: unknown }
      expect(sent.metadata).toEqual({ a: { $typeName: 'order', total: 3 } })
    })

    it('keys a negative zero apart from zero', () => {
      setUp()
      expect(canonical({ metadata: { a: 0 } })).toBe('{"metadata":{"a":0}}')
      expect(canonical({ metadata: { a: -0 } })).toBe('{"metadata":{"a":-0}}')
      expect(canonical({ metadataList: [{ a: [-0] }] })).toBe(
        '{"metadataList":[{"a":[-0]}]}'
      )
    })
  })
})

describe('negative zero', () => {
  describe.each([
    ['development', () => {}],
    ['production', inProduction],
  ])('in %s', (_environment, setUp) => {
    it.each([
      ['a proto3 optional int32', { maxAge: -0 }, { maxAge: 0 }, '{"maxAge":0}'],
      ['a repeated int32', { pageSizes: [-0, 1] }, { pageSizes: [0, 1] }, '{"pageSizes":[0,1]}'],
      ['an int32 map value', { limits: { a: -0 } }, { limits: { a: 0 } }, '{"limits":{"a":0}}'],
      ['an Int32Value', { minAge: -0 }, { minAge: 0 }, '{"minAge":0}'],
      [
        'a nested message int32',
        { filter: { rank: -0 } },
        { filter: { rank: 0 } },
        '{"filter":{"rank":0}}',
      ],
      [
        'a list-of-messages int32',
        { filters: [{ rank: -0 }] },
        { filters: [{ rank: 0 }] },
        '{"filters":[{"rank":0}]}',
      ],
      [
        'a map-of-messages int32',
        { namedFilters: { a: { rank: -0 } } },
        { namedFilters: { a: { rank: 0 } } },
        '{"namedFilters":{"a":{"rank":0}}}',
      ],
      [
        'a oneof int32 case',
        { selector: { case: 'byRank', value: -0 } },
        { selector: { case: 'byRank', value: 0 } },
        '{"byRank":0}',
      ],
      [
        'a oneof message case int32',
        { selector: { case: 'byFilter', value: { rank: -0 } } },
        { selector: { case: 'byFilter', value: { rank: 0 } } },
        '{"byFilter":{"rank":0}}',
      ],
      [
        'a oneof Int32Value case',
        { selector: { case: 'byMinAge', value: { value: -0 } } },
        { selector: { case: 'byMinAge', value: { value: 0 } } },
        '{"byMinAge":0}',
      ],
    ])('keys %s -0 as 0, which the wire encodes alike', (_label, negative, zero, segment) => {
      setUp()
      expect(canonical(zero)).toBe(segment)
      expect(canonical(negative)).toBe(segment)
      expect(canonical(listUsers(negative))).toBe(segment)
    })

    it('keeps a double and a Struct -0 apart from 0', () => {
      setUp()
      expect(canonical({ score: -0 })).toBe('{"score":-0}')
      expect(canonical({ score: 0 })).toBe('{}')
      expect(canonical({ metadata: { a: -0 } })).toBe('{"metadata":{"a":-0}}')
      expect(canonical({ metadata: { a: 0 } })).toBe('{"metadata":{"a":0}}')
    })

    it('keeps a nested double and Struct -0 apart from 0', () => {
      setUp()
      expect(canonical({ filter: { weight: -0 } })).toBe('{"filter":{"weight":-0}}')
      expect(canonical({ filter: { weight: 0 } })).toBe('{"filter":{}}')
      expect(canonical({ filters: [{ weight: -0 }] })).toBe('{"filters":[{"weight":-0}]}')
      expect(canonical({ selector: { case: 'byMetadata', value: { a: -0 } } })).toBe(
        '{"byMetadata":{"a":-0}}'
      )
      expect(canonical({ selector: { case: 'byMetadata', value: { a: 0 } } })).toBe(
        '{"byMetadata":{"a":0}}'
      )
    })

    it('sends the -0 the caller wrote, normalizing only the key', () => {
      setUp()
      const { request } = build({ maxAge: -0, pageSizes: [-0] })
      const sent = request as unknown as { maxAge: number; pageSizes: number[] }
      expect(Object.is(sent.maxAge, -0)).toBe(true)
      expect(Object.is(sent.pageSizes[0], -0)).toBe(true)
    })
  })
})

describe('map keys', () => {
  const protoKey = () => JSON.parse('{"__proto__":1,"a":2}') as Record<string, unknown>

  describe.each([
    ['development', () => {}],
    ['production', inProduction],
  ])('in %s', (_environment, setUp) => {
    it.each([
      ['a scalar map', () => ({ quotas: protoKey() }), /request\.quotas\["__proto__"\]/],
      [
        'a nested map',
        () => ({ filter: { labels: JSON.parse('{"__proto__":"x"}') } }),
        /request\.filter\.labels\["__proto__"\]/,
      ],
      [
        'a message map',
        () => ({ namedFilters: JSON.parse('{"__proto__":{}}') }),
        /request\.namedFilters\["__proto__"\]/,
      ],
      [
        'a Struct',
        () => ({ metadata: { a: protoKey() } }),
        /request\.metadata\["a"\]\["__proto__"\]/,
      ],
    ])('refuses a "__proto__" key in %s, naming it', (_label, init, path) => {
      setUp()
      const attempt = () => build(init())
      expect(attempt).toThrow(ConnectAdapterError)
      expect(attempt).toThrow(path)
    })

    it('keys an empty map as its omission', () => {
      setUp()
      expect(canonical({ quotas: {} })).toBe('{}')
    })
  })
})

describe('malformed input', () => {
  describe.each([
    ['development', () => {}],
    ['production', inProduction],
  ])('in %s', (_environment, setUp) => {
    it('refuses a message of another type', () => {
      setUp()
      const attempt = () => build(create(GetUserRequestSchema, { id: 1n } as never))
      expect(attempt).toThrow(ConnectAdapterError)
      expect(attempt).toThrow(
        /request is a acme\.users\.v1\.GetUserRequest message where acme\.users\.v1\.ListUsersRequest is expected/
      )
    })

    it('refuses a nested message of another type', () => {
      setUp()
      expect(() =>
        build({ filter: create(QuerySchema, { cursor: 'x' } as never) })
      ).toThrow(/request\.filter is a acme\.users\.v1\.Query message where acme\.users\.v1\.Filter is expected/)
      expect(() =>
        build({ filters: [create(QuerySchema, {} as never)] })
      ).toThrow(/request\.filters\[0\] is a acme\.users\.v1\.Query/)
      expect(() =>
        build({ selector: { case: 'byFilter', value: create(QuerySchema, {} as never) } })
      ).toThrow(/request\.selector\.value is a acme\.users\.v1\.Query/)
    })

    it('refuses preserved unknown fields', () => {
      setUp()
      const bytes = new BinaryWriter().tag(99, WireType.Varint).int32(1).finish()
      const parsed = listUsers({ pageSize: 50 }) as unknown as { $unknown?: unknown }
      parsed.$unknown = [{ no: 99, wireType: WireType.Varint, data: bytes.subarray(2) }]
      const attempt = () => build(parsed)
      expect(attempt).toThrow(ConnectAdapterError)
      expect(attempt).toThrow(/request carries unknown fields \(field numbers 99\)/)
    })

    it('refuses unknown fields on a nested message', () => {
      setUp()
      expect(() =>
        build({ filter: { name: 'x', $unknown: [{ no: 50, wireType: 0, data: new Uint8Array([1]) }] } })
      ).toThrow(/request\.filter carries unknown fields/)
    })

    it('refuses a malformed $unknown rather than ignoring it', () => {
      setUp()
      expect(() => build({ pageSize: 5, $unknown: 'junk' })).toThrow(
        /request carries unknown fields, preserved from a binary parse/
      )
    })

    it.each([
      ['undefined', undefined],
      ['null', null],
      ['a number', 5],
      ['a string', 'pageSize=50'],
      ['an array', [{ pageSize: 50 }]],
    ])('refuses %s as the request', (_label, init) => {
      setUp()
      const attempt = () => build(init)
      expect(attempt).toThrow(ConnectAdapterError)
      expect(attempt).toThrow(/its input function returned/)
    })

    it.each([
      ['a Promise', () => Promise.resolve({ pageSize: 1 })],
      ['an async function', async () => ({ pageSize: 1 })],
    ])('refuses %s as the input, rather than keying an empty request', (_label, input) => {
      setUp()
      const attempt = () => buildConnectKey(ListUsers, input as never)
      expect(attempt).toThrow(ConnectAdapterError)
      expect(attempt).toThrow(/its input function returned a Promise/)
    })

    it('keys an empty request, and a class instance by its own fields', () => {
      setUp()
      class Request {
        pageSize = 5
        pageToken = 't'
      }
      expect(canonical({})).toBe('{}')
      expect(canonical(new Request())).toBe('{"pageSize":5,"pageToken":"t"}')
    })

    it('refuses a throwing input function, keeping the cause', () => {
      setUp()
      const failure = new Error('signal read failed')
      let thrown: unknown
      try {
        buildConnectKey(ListUsers, () => {
          throw failure
        })
      } catch (error) {
        thrown = error
      }
      expect(thrown).toBeInstanceOf(ConnectAdapterError)
      expect((thrown as Error).message).toMatch(/its input function threw/)
      expect((thrown as Error).cause).toBe(failure)
    })

    it('refuses a request whose property read throws, keeping the cause', () => {
      setUp()
      const init = {
        get pageSize(): number {
          throw 'unreadable'
        },
      }
      let thrown: unknown
      try {
        build(init)
      } catch (error) {
        thrown = error
      }
      expect(thrown).toBeInstanceOf(ConnectAdapterError)
      expect((thrown as Error).message).toMatch(
        /the request is not a valid acme\.users\.v1\.ListUsersRequest \(unreadable\)/
      )
      expect((thrown as Error).cause).toBe('unreadable')
    })

    it('refuses a request whose then read throws, keeping the cause', () => {
      setUp()
      const failure = new Error('then unreadable')
      let thrown: unknown
      try {
        build({
          get then(): unknown {
            throw failure
          },
        })
      } catch (error) {
        thrown = error
      }
      expect(thrown).toBeInstanceOf(ConnectAdapterError)
      expect((thrown as Error).message).toMatch(
        /the request is not a valid acme\.users\.v1\.ListUsersRequest \(then unreadable\)/
      )
      expect((thrown as Error).cause).toBe(failure)
    })

    it('refuses an input that is not a function', () => {
      setUp()
      expect(() => buildConnectKey(ListUsers, { pageSize: 50 } as never)).toThrow(
        /its input is object, not a function/
      )
    })

    it.each([
      ['a string', { filter: 'Ada' }, /request\.filter is string, but acme\.users\.v1\.Filter is a message/],
      ['an array', { filters: [['Ada']] }, /request\.filters\[0\] is an array, but acme\.users\.v1\.Filter is a message/],
    ])('refuses %s where a message belongs', (_label, init, message) => {
      setUp()
      expect(() => build(init)).toThrow(message)
    })

    it('refuses a request that contains itself', () => {
      setUp()
      const filter: Record<string, unknown> = { name: 'loop' }
      filter.parent = filter
      expect(() => build({ filter })).toThrow(
        /request\.filter\.parent refers back to an object that contains it/
      )
    })

    it('refuses something other than a method descriptor', () => {
      setUp()
      expect(() => buildConnectKey(null as never, () => ({}) as never)).toThrow(
        /not a method descriptor/
      )
    })
  })

  describe('unknown initializer properties', () => {
    const cases: [string, Record<string, unknown>, Record<string, unknown>, RegExp][] = [
      [
        'a misspelled field',
        { pageSize: 50, pagesize: 10 },
        { pageSize: 50 },
        /request\.pagesize is not a field of acme\.users\.v1\.ListUsersRequest/,
      ],
      [
        'the proto name instead of the local name',
        { page_size: 10 },
        {},
        /request\.page_size is not a field/,
      ],
      [
        'a oneof member at the top level',
        { email: 'a@b' },
        {},
        /request\.email is not a field/,
      ],
      [
        'a field of a nested message',
        { filter: { name: 'Ada', nmae: 'x' } },
        { filter: { name: 'Ada' } },
        /request\.filter\.nmae is not a field of acme\.users\.v1\.Filter/,
      ],
      [
        'a field of a message map value',
        { namedFilters: { a: { bogus: 1 } } },
        { namedFilters: { a: {} } },
        /request\.namedFilters\["a"\]\.bogus is not a field/,
      ],
      [
        'an unknown oneof case',
        { selector: { case: 'nickname', value: 'x' } },
        {},
        /request\.selector\.case is "nickname", which is not a field of the oneof selector/,
      ],
      [
        'an extra property on a oneof',
        { selector: { case: 'email', value: 'a@b', extra: 1 } },
        { selector: { case: 'email', value: 'a@b' } },
        /request\.selector\.extra is not part of a oneof/,
      ],
      [
        'a scalar where a oneof belongs',
        { selector: 'email' },
        {},
        /request\.selector is string, but selector is a oneof/,
      ],
    ]

    it.each(cases)('fail explicitly in development for %s', (_label, init, _clean, message) => {
      const attempt = () => build(init)
      expect(attempt).toThrow(ConnectAdapterError)
      expect(attempt).toThrow(message)
    })

    it.each(cases)(
      'follow normalization in production for %s, reaching neither key nor request',
      (_label, init, clean) => {
        inProduction()
        const withExtra = build(init)
        const without = build(clean)
        expect(withExtra.key).toEqual(without.key)
        expect(withExtra.request).toEqual(without.request)
      }
    )
  })
})
