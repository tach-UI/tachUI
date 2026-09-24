/**
 * Named transport provision through the component environment.
 *
 * Transports here are inert stand-ins except where the generic `Transport`
 * contract itself is the point: provision never calls one, so identity is all
 * that matters.
 */

import { createRouterTransport } from '@connectrpc/connect'
import type { Transport } from '@connectrpc/connect'
import {
  createComponentContext,
  runWithComponentContext,
} from '@tachui/core'
import type { ComponentContext } from '@tachui/core'
import {
  createQueryClient,
  provideQueryClient,
  useQueryClient,
} from '@tachui/query'
import type { QueryClient } from '@tachui/query'
import { afterEach, describe, expect, it } from 'vitest'

import { DEFAULT_TRANSPORT_NAME } from '../src/defaults'
import { ConnectAdapterError } from '../src/errors'
import {
  provideConnectTransport,
  resolveConnectTransport,
  useConnectTransport,
} from '../src/transport'

function fakeTransport(): Transport {
  return {
    unary: () => Promise.reject(new Error('not called')),
    stream: () => Promise.reject(new Error('not called')),
  }
}

const clients: QueryClient[] = []

function newClient(): QueryClient {
  const client = createQueryClient()
  clients.push(client)
  return client
}

afterEach(() => {
  for (const client of clients.splice(0)) {
    client.dispose()
  }
})

/** A root scope with its own provided client. */
function rootWithClient(id: string, client = newClient()): ComponentContext {
  const context = createComponentContext(id)
  runWithComponentContext(context, () => provideQueryClient(client))
  return context
}

function inScope<T>(context: ComponentContext, fn: () => T): T {
  return runWithComponentContext(context, fn)
}

describe('provideConnectTransport and useConnectTransport', () => {
  it("accept Connect's generic Transport, such as an in-memory router transport", () => {
    const transport = createRouterTransport(() => {})
    const root = rootWithClient('root')

    inScope(root, () => provideConnectTransport(transport))

    expect(inScope(root, () => useConnectTransport())).toBe(transport)
  })

  it("resolve an unnamed transport as the default, with or without 'default'", () => {
    const transport = fakeTransport()
    const root = rootWithClient('root')

    inScope(root, () => provideConnectTransport(transport))

    expect(inScope(root, () => useConnectTransport())).toBe(transport)
    expect(inScope(root, () => useConnectTransport('default'))).toBe(transport)
  })

  it('keep differently named transports side by side in one scope', () => {
    const fallback = fakeTransport()
    const publicApi = fakeTransport()
    const account = fakeTransport()
    const root = rootWithClient('root')

    inScope(root, () => {
      provideConnectTransport(fallback)
      provideConnectTransport(publicApi, { name: 'public' })
      provideConnectTransport(account, { name: 'account' })
    })

    inScope(root, () => {
      expect(useConnectTransport()).toBe(fallback)
      expect(useConnectTransport('public')).toBe(publicApi)
      expect(useConnectTransport('account')).toBe(account)
    })
  })

  it('never resolve a name to a transport provided under another', () => {
    const root = rootWithClient('root')
    inScope(root, () => provideConnectTransport(fakeTransport(), { name: 'public' }))

    expect(() => inScope(root, () => useConnectTransport())).toThrowError(
      ConnectAdapterError
    )
    expect(() => inScope(root, () => useConnectTransport('account'))).toThrowError(
      ConnectAdapterError
    )
  })
})

describe('scoping', () => {
  it('resolves each name from the nearest provider in the ancestry', () => {
    const outerDefault = fakeTransport()
    const outerAccount = fakeTransport()
    const innerAccount = fakeTransport()
    const root = rootWithClient('root')
    inScope(root, () => {
      provideConnectTransport(outerDefault)
      provideConnectTransport(outerAccount, { name: 'account' })
    })
    // The nested scope has its own client, so its 'account' is a different
    // backend for a different cache and may shadow the ancestor's.
    const inner = createComponentContext('inner', root)
    inScope(inner, () => {
      provideQueryClient(newClient())
      provideConnectTransport(innerAccount, { name: 'account' })
    })
    const leaf = createComponentContext('leaf', inner)

    inScope(leaf, () => {
      expect(useConnectTransport('account')).toBe(innerAccount)
      // Not provided by the nearer scope, so it comes from the root.
      expect(useConnectTransport()).toBe(outerDefault)
    })
    expect(inScope(root, () => useConnectTransport('account'))).toBe(outerAccount)
  })

  it('lets a nested scope re-provide the transport its client already binds', () => {
    const transport = fakeTransport()
    const root = rootWithClient('root')
    inScope(root, () => provideConnectTransport(transport))
    const inner = createComponentContext('inner', root)

    expect(() => inScope(inner, () => provideConnectTransport(transport))).not.toThrow()
    expect(inScope(inner, () => useConnectTransport())).toBe(transport)
  })

  it('leaves the ancestor transport in place when a nested scope ends', () => {
    const outer = fakeTransport()
    const root = rootWithClient('root')
    inScope(root, () => provideConnectTransport(outer))
    const inner = createComponentContext('inner', root)
    inScope(inner, () => {
      provideQueryClient(newClient())
      provideConnectTransport(fakeTransport())
    })

    inner.dispose()

    expect(inScope(root, () => useConnectTransport())).toBe(outer)
    const later = createComponentContext('later', root)
    expect(inScope(later, () => useConnectTransport())).toBe(outer)
  })

  it('keeps sibling subtrees from seeing each other', () => {
    const root = rootWithClient('root')
    const left = createComponentContext('left', root)
    const right = createComponentContext('right', root)
    const leftTransport = fakeTransport()
    inScope(left, () => provideConnectTransport(leftTransport, { name: 'left' }))

    expect(inScope(left, () => useConnectTransport('left'))).toBe(leftTransport)
    expect(() => inScope(right, () => useConnectTransport('left'))).toThrowError(
      /No provider for transport 'left'/
    )
  })

  it('keeps independent roots, interleaved as concurrent renders are, apart', () => {
    const first = fakeTransport()
    const second = fakeTransport()
    const rootA = rootWithClient('request-a')
    const rootB = rootWithClient('request-b')

    inScope(rootA, () => provideConnectTransport(first))
    inScope(rootB, () => provideConnectTransport(second))

    expect(inScope(rootA, () => useConnectTransport())).toBe(first)
    expect(inScope(rootB, () => useConnectTransport())).toBe(second)
    // A root that provided nothing inherits nothing from the others.
    const rootC = rootWithClient('request-c')
    expect(() => inScope(rootC, () => useConnectTransport())).toThrowError(
      ConnectAdapterError
    )
  })
})

describe('duplicate provision in one scope', () => {
  it('fails for a second transport under the same name', () => {
    const root = rootWithClient('root')
    const first = fakeTransport()
    inScope(root, () => provideConnectTransport(first, { name: 'account' }))

    expect(() =>
      inScope(root, () => provideConnectTransport(fakeTransport(), { name: 'account' }))
    ).toThrowError(/transport 'account' is already provided in this scope/)
    expect(inScope(root, () => useConnectTransport('account'))).toBe(first)
  })

  it('treats the same transport under the same name as a no-op, so a render can run again', () => {
    const root = rootWithClient('root')
    const transport = fakeTransport()

    inScope(root, () => provideConnectTransport(transport))

    expect(() => inScope(root, () => provideConnectTransport(transport))).not.toThrow()
    expect(() =>
      inScope(root, () => provideConnectTransport(transport, { name: DEFAULT_TRANSPORT_NAME }))
    ).not.toThrow()
    expect(inScope(root, () => useConnectTransport())).toBe(transport)
  })
})

describe('client bindings', () => {
  it('refuses a nested scope binding a different transport to a name its client holds', () => {
    const root = rootWithClient('root')
    const outer = fakeTransport()
    inScope(root, () => provideConnectTransport(outer, { name: 'account' }))
    const inner = createComponentContext('inner', root)

    expect(() =>
      inScope(inner, () => provideConnectTransport(fakeTransport(), { name: 'account' }))
    ).toThrowError(/already bound to a different Transport for this QueryClient/)
    expect(inScope(inner, () => useConnectTransport('account'))).toBe(outer)
  })

  it('refuses a rebind under a fixed name after the first scope has ended', () => {
    const client = newClient()
    const signedIn = rootWithClient('first-account', client)
    inScope(signedIn, () => provideConnectTransport(fakeTransport()))
    signedIn.dispose()

    // An account change: same client, same name, a new transport.
    const switched = rootWithClient('second-account', client)
    expect(() =>
      inScope(switched, () => provideConnectTransport(fakeTransport()))
    ).toThrowError(ConnectAdapterError)
  })

  it('accepts the new transport once it comes with a new client', () => {
    const client = newClient()
    const signedIn = rootWithClient('first-account', client)
    inScope(signedIn, () => provideConnectTransport(fakeTransport()))
    signedIn.dispose()

    const replacement = fakeTransport()
    const switched = rootWithClient('second-account')
    inScope(switched, () => provideConnectTransport(replacement))

    expect(inScope(switched, () => useConnectTransport())).toBe(replacement)
  })

  it('keeps separate tenants on separate clients from sharing a binding', () => {
    const tenantA = fakeTransport()
    const tenantB = fakeTransport()
    const root = createComponentContext('page')
    const left = createComponentContext('tenant-a', root)
    const right = createComponentContext('tenant-b', root)

    inScope(left, () => {
      provideQueryClient(newClient())
      provideConnectTransport(tenantA, { name: 'tenant' })
    })
    inScope(right, () => {
      provideQueryClient(newClient())
      provideConnectTransport(tenantB, { name: 'tenant' })
    })

    expect(inScope(left, () => useConnectTransport('tenant'))).toBe(tenantA)
    expect(inScope(right, () => useConnectTransport('tenant'))).toBe(tenantB)
  })

  it('refuses two tenants sharing one client under one name', () => {
    const root = rootWithClient('page')
    const left = createComponentContext('tenant-a', root)
    const right = createComponentContext('tenant-b', root)

    inScope(left, () => provideConnectTransport(fakeTransport(), { name: 'tenant' }))

    expect(() =>
      inScope(right, () => provideConnectTransport(fakeTransport(), { name: 'tenant' }))
    ).toThrowError(ConnectAdapterError)
  })
})

describe('a missing QueryClient', () => {
  it('fails provision with an actionable diagnostic', () => {
    const context = createComponentContext('no-client')

    expect(() => inScope(context, () => provideConnectTransport(fakeTransport()))).toThrowError(
      /found no QueryClient.*provideQueryClient\(\)/
    )
  })

  it('fails even where the browser ambient client exists', () => {
    // The ambient fallback is created on first use.
    expect(useQueryClient()).toBeDefined()
    const context = createComponentContext('ambient-only')

    expect(() => inScope(context, () => provideConnectTransport(fakeTransport()))).toThrowError(
      ConnectAdapterError
    )
    expect(() => inScope(context, () => useConnectTransport())).toThrowError(
      ConnectAdapterError
    )
  })
})

describe('diagnostics', () => {
  it('names a missing default transport and how to provide it', () => {
    const root = rootWithClient('root')

    expect(() => inScope(root, () => useConnectTransport())).toThrowError(
      "[@tachui/connectrpc] No provider for the default transport ('default'). Call provideConnectTransport(transport) in this component or an ancestor, below provideQueryClient()."
    )
  })

  it('names a missing named transport and how to provide it', () => {
    const root = rootWithClient('root')

    expect(() => inScope(root, () => useConnectTransport('account'))).toThrowError(
      "No provider for transport 'account'. Call provideConnectTransport(transport, { name: 'account' })"
    )
  })

  it('refuses lookup and provision outside a component context', () => {
    expect(() => useConnectTransport()).toThrowError(/requires a component context/)
    expect(() => provideConnectTransport(fakeTransport())).toThrowError(
      /requires a component context/
    )
  })

  it.each([
    ['undefined', undefined],
    ['null', null],
    ['an object without unary and stream', { unary: () => {} }],
  ])('refuses %s as a transport', (_label, value) => {
    const root = rootWithClient('root')

    expect(() =>
      inScope(root, () => provideConnectTransport(value as unknown as Transport))
    ).toThrowError(/not a Connect Transport/)
    expect(() => inScope(root, () => useConnectTransport())).toThrowError(
      ConnectAdapterError
    )
  })

  it('is a ConnectAdapterError, distinguishable from a failed call', () => {
    const error = new ConnectAdapterError('x')

    expect(error).toBeInstanceOf(Error)
    expect(error.name).toBe('ConnectAdapterError')
    expect(error.message).toBe('[@tachui/connectrpc] x')
  })
})

describe('transport identity', () => {
  it("is the name, 'default' included, never omitted", () => {
    const root = rootWithClient('root')
    inScope(root, () => provideConnectTransport(fakeTransport()))

    expect(inScope(root, () => resolveConnectTransport().name)).toBe('default')
    expect(inScope(root, () => resolveConnectTransport('default').name)).toBe('default')
  })

  it('differs for every distinct name', () => {
    const root = rootWithClient('root')
    inScope(root, () => {
      provideConnectTransport(fakeTransport(), { name: 'public' })
      provideConnectTransport(fakeTransport(), { name: 'account' })
    })

    const names = inScope(root, () => [
      resolveConnectTransport('public').name,
      resolveConnectTransport('account').name,
    ])
    expect(new Set(names).size).toBe(2)
  })

  it('does not depend on the Transport object', () => {
    // As on a server and in a browser: one logical backend, two instances.
    const server = rootWithClient('server')
    const browser = rootWithClient('browser')
    inScope(server, () => provideConnectTransport(fakeTransport(), { name: 'account' }))
    inScope(browser, () => provideConnectTransport(fakeTransport(), { name: 'account' }))

    const onServer = inScope(server, () => resolveConnectTransport('account'))
    const inBrowser = inScope(browser, () => resolveConnectTransport('account'))
    expect(onServer.transport).not.toBe(inBrowser.transport)
    expect(onServer.name).toBe(inBrowser.name)
  })
})
