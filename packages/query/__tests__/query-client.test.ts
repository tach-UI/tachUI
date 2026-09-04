/**
 * QueryClient ownership, environment provision, and the server guard (#277).
 *
 * These tests pin the acceptance criteria: per-client isolation, the
 * actionable server error for an implicit global client, two-level ownership
 * (observer disposal runs with the component owner while entries survive), and
 * nested providers that shadow without clobbering. Cache lifecycle policy
 * (freshness, gcTime eviction) belongs to #279; only the ownership roots that
 * policy builds on are asserted here.
 */

import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  createComponentContext,
  createRoot,
  runWithComponentContext,
} from '@tachui/core'

import {
  createQueryClient,
  provideQueryClient,
  resetDefaultQueryClient,
  useQueryClient,
} from '../src/client'
import { QueryError } from '../src/errors'
import type { DehydratedState, QueryClient } from '../src/types'

afterEach(() => {
  vi.unstubAllGlobals()
  resetDefaultQueryClient()
})

function keyOf(name: string): () => readonly unknown[] {
  return () => [name]
}

describe('fetchQuery caching', () => {
  it('runs the loader once for repeat fetches of one key', async () => {
    const client = createQueryClient()
    let loads = 0
    const options = {
      key: keyOf('users'),
      load: async () => {
        loads += 1
        return { count: loads }
      },
      staleTime: 1000,
      gcTime: 2000,
      snapshot: true,
    }

    const first = await client.fetchQuery(options)
    const second = await client.fetchQuery(options)

    expect(first).toEqual({ count: 1 })
    expect(second).toEqual({ count: 1 })
    expect(loads).toBe(1)
  })

  it('records the calling options as the entry policy', async () => {
    const client = createQueryClient()
    await client.fetchQuery({
      key: keyOf('users'),
      load: async () => 'ada',
      staleTime: 1000,
      gcTime: 2000,
      snapshot: true,
    })

    const seen = client.dehydrate((entry) => {
      expect(entry.options).toEqual({ staleTime: 1000, gcTime: 2000, snapshot: true })
      return true
    })
    expect(seen.queries).toHaveLength(1)
  })

  it('shares one execution between concurrent identical fetches', async () => {
    const client = createQueryClient()
    let loads = 0
    let releaseLoad: (() => void) | undefined
    const gate = new Promise<void>((resolveGate) => {
      releaseLoad = resolveGate
    })
    const options = {
      key: keyOf('users'),
      load: async () => {
        loads += 1
        await gate
        return 'ada'
      },
    }

    const first = client.fetchQuery(options)
    const second = client.fetchQuery(options)
    releaseLoad?.()
    await expect(first).resolves.toBe('ada')
    await expect(second).resolves.toBe('ada')
    expect(loads).toBe(1)
  })

  it('rejects a failed load and retries on the next call', async () => {
    const client = createQueryClient()
    let loads = 0
    const options = {
      key: keyOf('users'),
      load: async () => {
        loads += 1
        if (loads === 1) {
          throw new Error('socket closed')
        }
        return 'recovered'
      },
    }

    await expect(client.fetchQuery(options)).rejects.toThrow('socket closed')
    await expect(client.fetchQuery(options)).resolves.toBe('recovered')
    expect(loads).toBe(2)
  })

  it('caches a loader resolution of undefined instead of refetching', async () => {
    const client = createQueryClient()
    let loads = 0
    const options = {
      key: keyOf('maybe'),
      load: async (): Promise<string | undefined> => {
        loads += 1
        return undefined
      },
    }

    // Presence is tracked by entry status, not by the data value: a 204, an
    // empty body, or a "not found" lookup still populates the entry.
    await expect(client.fetchQuery(options)).resolves.toBeUndefined()
    await expect(client.fetchQuery(options)).resolves.toBeUndefined()
    expect(loads).toBe(1)
    // JSON cannot carry undefined, so the cached entry stays out of payloads
    // that hydrate() itself would reject.
    expect(client.dehydrate().queries).toHaveLength(0)
  })

  it('shares the slot with a reentrant fetch from inside the loader', async () => {
    const client = createQueryClient()
    let loads = 0
    let inner: Promise<string> | undefined
    const options = {
      key: keyOf('users'),
      load: () => {
        loads += 1
        // The slot is claimed before the loader runs, so this observes the
        // in-flight request instead of starting a second loader.
        inner = client.fetchQuery({
          key: keyOf('users'),
          load: async () => 'second',
        })
        return Promise.resolve('first')
      },
    }

    await expect(client.fetchQuery(options)).resolves.toBe('first')
    await expect(inner).resolves.toBe('first')
    expect(loads).toBe(1)
  })

  it('aborts when the loader reentrantly clears the client', async () => {
    const client = createQueryClient()
    let observedAborted: boolean | undefined
    const options = {
      key: keyOf('users'),
      load: (ctx: { signal: AbortSignal }) => {
        // The in-flight request is registered before the loader runs, so the
        // reentrant clear aborts it; the late value still resolves to its
        // caller but is never cached.
        client.clear()
        observedAborted = ctx.signal.aborted
        return Promise.resolve('late')
      },
    }

    await expect(client.fetchQuery(options)).resolves.toBe('late')
    expect(observedAborted).toBe(true)
    let reloads = 0
    await expect(
      client.fetchQuery({
        key: keyOf('users'),
        load: async () => {
          reloads += 1
          return 'fresh'
        },
      })
    ).resolves.toBe('fresh')
    expect(reloads).toBe(1)
  })

  it('recovers when the loader throws synchronously', async () => {
    const client = createQueryClient()
    let loads = 0
    const options = {
      key: keyOf('users'),
      load: () => {
        loads += 1
        if (loads === 1) {
          throw new Error('sync boom')
        }
        return Promise.resolve('recovered')
      },
    }

    // The slot is claimed before the loader runs, so the sync throw settles
    // and releases it instead of parking a rejected promise in the entry.
    await expect(client.fetchQuery(options)).rejects.toThrow('sync boom')
    await expect(client.fetchQuery(options)).resolves.toBe('recovered')
    expect(loads).toBe(2)
  })

  it('raises QueryError for an unserializable key', async () => {
    const client = createQueryClient()

    await expect(
      client.fetchQuery({ key: () => [10n], load: async () => 'unreachable' })
    ).rejects.toThrowError(QueryError)
  })

  it('delegates to an explicit client option, bypassing its own cache', async () => {
    const clientA = createQueryClient()
    const clientB = createQueryClient()
    let loadsB = 0
    const viaB = {
      key: keyOf('users'),
      load: async () => {
        loadsB += 1
        return 'from-b'
      },
      client: clientB,
    }

    await expect(clientA.fetchQuery(viaB)).resolves.toBe('from-b')
    // The value landed in B, not A: A still loads through its own cache.
    await expect(
      clientA.fetchQuery({ key: keyOf('users'), load: async () => 'from-a' })
    ).resolves.toBe('from-a')
    await expect(
      clientB.fetchQuery({ key: keyOf('users'), load: async () => 'stale' })
    ).resolves.toBe('from-b')
    // A client naming itself takes the normal path, without recursing.
    await expect(
      clientA.fetchQuery({
        key: keyOf('self'),
        load: async () => 'self',
        client: clientA,
      })
    ).resolves.toBe('self')
    expect(loadsB).toBe(1)
  })
})

describe('client isolation', () => {
  it('shares no state between two clients in one process', async () => {
    const clientA = createQueryClient()
    const clientB = createQueryClient()
    let loadsA = 0
    let loadsB = 0

    await clientA.fetchQuery({
      key: keyOf('users'),
      load: async () => {
        loadsA += 1
        return 'a'
      },
    })
    await clientB.fetchQuery({
      key: keyOf('users'),
      load: async () => {
        loadsB += 1
        return 'b'
      },
    })
    await clientA.fetchQuery({
      key: keyOf('users'),
      load: async () => {
        loadsA += 1
        return 'a-again'
      },
    })

    expect(loadsA).toBe(1)
    expect(loadsB).toBe(1)
  })

  it('scopes clear() and hydrate() to the receiving client', async () => {
    const clientA = createQueryClient()
    const clientB = createQueryClient()
    let loadsB = 0
    const loadB = async () => {
      loadsB += 1
      return 'b'
    }

    await clientA.fetchQuery({ key: keyOf('a'), load: async () => 'a', snapshot: true })
    await clientB.fetchQuery({ key: keyOf('b'), load: loadB })
    clientA.clear()
    clientB.hydrate(clientA.dehydrate())

    // B keeps its own entry through A's clear, and ignores A's snapshot payload
    // for a key it never stored.
    await expect(clientB.fetchQuery({ key: keyOf('b'), load: loadB })).resolves.toBe('b')
    expect(loadsB).toBe(1)
  })
})

describe('invalidate and clear', () => {
  it('refetches entries under a matching prefix and keeps the rest', async () => {
    const client = createQueryClient()
    const loads = new Map<string, number>()
    const loadNamed = (name: string) => async () => {
      loads.set(name, (loads.get(name) ?? 0) + 1)
      return name
    }

    await client.fetchQuery({ key: () => ['users', 'list'], load: loadNamed('list') })
    await client.fetchQuery({ key: () => ['users', 'one'], load: loadNamed('one') })
    await client.fetchQuery({ key: () => ['orders'], load: loadNamed('orders') })

    client.invalidate(['users'])
    await client.fetchQuery({ key: () => ['users', 'list'], load: loadNamed('list') })
    await client.fetchQuery({ key: () => ['users', 'one'], load: loadNamed('one') })
    await client.fetchQuery({ key: () => ['orders'], load: loadNamed('orders') })

    expect(loads.get('list')).toBe(2)
    expect(loads.get('one')).toBe(2)
    expect(loads.get('orders')).toBe(1)
  })

  it('ignores a prefix longer than the stored key', async () => {
    const client = createQueryClient()
    let loads = 0
    const options = {
      key: keyOf('users'),
      load: async () => {
        loads += 1
        return 'ada'
      },
    }

    await client.fetchQuery(options)
    client.invalidate(['users', 'list', 'extra'])
    await client.fetchQuery(options)

    expect(loads).toBe(1)
  })

  it('drops a response that lands after invalidate()', async () => {
    const client = createQueryClient()
    let loads = 0
    let releaseLoad: (() => void) | undefined
    const gate = new Promise<void>((resolveGate) => {
      releaseLoad = resolveGate
    })
    const options = {
      key: keyOf('users'),
      load: async () => {
        loads += 1
        const seen = loads
        await gate
        return `v${seen}`
      },
    }

    const first = client.fetchQuery(options)
    client.invalidate(['users'])
    releaseLoad?.()
    // The pre-invalidation response still resolves to its waiter, but it must
    // not un-invalidate the entry: the next fetch reloads.
    await expect(first).resolves.toBe('v1')
    await expect(client.fetchQuery(options)).resolves.toBe('v2')
    expect(loads).toBe(2)
  })

  it('starts a fresh load for fetches issued after invalidate() but before landing', async () => {
    const client = createQueryClient()
    let loads = 0
    let releaseLoad: (() => void) | undefined
    const gate = new Promise<void>((resolveGate) => {
      releaseLoad = resolveGate
    })
    const options = {
      key: keyOf('users'),
      load: async () => {
        loads += 1
        const seen = loads
        await gate
        return `v${seen}`
      },
    }

    const first = client.fetchQuery(options)
    client.invalidate(['users'])
    // The detached pre-invalidation flight no longer occupies the slot, so
    // this starts its own load instead of sharing stale data.
    const second = client.fetchQuery(options)
    releaseLoad?.()
    await expect(first).resolves.toBe('v1')
    await expect(second).resolves.toBe('v2')
    await expect(client.fetchQuery(options)).resolves.toBe('v2')
    expect(loads).toBe(2)
  })

  it('drops an error that lands after invalidate()', async () => {
    const client = createQueryClient()
    let loads = 0
    let releaseLoad: (() => void) | undefined
    const gate = new Promise<void>((resolveGate) => {
      releaseLoad = resolveGate
    })

    const first = client.fetchQuery({
      key: keyOf('users'),
      load: async (): Promise<string> => {
        loads += 1
        await gate
        throw new Error('stale failure')
      },
    })
    client.invalidate(['users'])
    releaseLoad?.()
    await expect(first).rejects.toThrow('stale failure')
    // The stale error marked nothing: the retry runs the loader again.
    await expect(
      client.fetchQuery({
        key: keyOf('users'),
        load: async () => {
          loads += 1
          return 'fresh'
        },
      })
    ).resolves.toBe('fresh')
    expect(loads).toBe(2)
  })

  it('drops every entry on clear()', async () => {
    const client = createQueryClient()
    let loads = 0
    const options = {
      key: keyOf('users'),
      load: async () => {
        loads += 1
        return 'ada'
      },
    }

    await client.fetchQuery(options)
    client.clear()
    await client.fetchQuery(options)

    expect(loads).toBe(2)
  })

  it('aborts in-flight work on clear() without repopulating the cache', async () => {
    const client = createQueryClient()
    let loads = 0
    let observedSignal: AbortSignal | undefined
    let releaseLoad: (() => void) | undefined
    const gate = new Promise<void>((resolveGate) => {
      releaseLoad = resolveGate
    })
    const options = {
      key: keyOf('slow'),
      load: async (ctx: { signal: AbortSignal }) => {
        loads += 1
        observedSignal = ctx.signal
        await gate
        return 'late'
      },
    }

    const pending = client.fetchQuery(options)
    client.clear()
    releaseLoad?.()
    // The late result still resolves to its caller, but the cleared cache does
    // not keep it: the next fetch loads again.
    await expect(pending).resolves.toBe('late')
    expect(observedSignal?.aborted).toBe(true)
    await expect(client.fetchQuery(options)).resolves.toBe('late')
    expect(loads).toBe(2)
  })
})

describe('two-level ownership', () => {
  it('lets in-flight work and entries survive component-owner disposal', async () => {
    const client = createQueryClient()
    let loads = 0
    let releaseLoad: (() => void) | undefined
    const gate = new Promise<void>((resolveGate) => {
      releaseLoad = resolveGate
    })
    const options = {
      key: keyOf('user'),
      load: async () => {
        loads += 1
        await gate
        return { name: 'ada' }
      },
    }

    // The flight is owned by the client root, not the calling owner, so
    // disposing the component mid-flight neither aborts the load nor drops
    // the entry it populates. (Observer-side disposal — an `onCleanup` that
    // detaches the observation — arrives with `createQuery` in #280; there
    // are no observers yet to dispose.)
    let pending: Promise<{ name: string }> | undefined
    createRoot((disposeComponent) => {
      pending = client.fetchQuery(options)
      disposeComponent()
    })
    releaseLoad?.()
    await expect(pending).resolves.toEqual({ name: 'ada' })
    await expect(client.fetchQuery(options)).resolves.toEqual({ name: 'ada' })
    expect(loads).toBe(1)
  })

  it('keeps a client created inside a component usable after that component is gone', async () => {
    let client: QueryClient | undefined
    createRoot((disposeComponent) => {
      client = createQueryClient()
      disposeComponent()
    })

    await expect(
      client?.fetchQuery({ key: keyOf('k'), load: async () => 1 })
    ).resolves.toBe(1)
  })

  it('drops the cache on dispose() and refuses further use', async () => {
    const client = createQueryClient()
    await client.fetchQuery({ key: keyOf('k'), load: async () => 'v' })
    client.dispose()

    await expect(
      client.fetchQuery({ key: keyOf('k'), load: async () => 'v' })
    ).rejects.toThrowError(/after dispose/)
    expect(() => client.prefetchQueries([])).toThrowError(/after dispose/)
    expect(() => client.invalidate(['k'])).toThrowError(/after dispose/)
    expect(() => client.dehydrate()).toThrowError(/after dispose/)
    expect(() => client.hydrate({ queries: [] })).toThrowError(/after dispose/)
    expect(() => client.clear()).toThrowError(/after dispose/)
    expect(() => client.dispose()).not.toThrow()
  })

  it('aborts a detached flight when the client is disposed', async () => {
    const client = createQueryClient()
    let observedSignal: AbortSignal | undefined
    const pending = client.fetchQuery({
      key: keyOf('slow'),
      load: (ctx: { signal: AbortSignal }) =>
        new Promise<never>((_resolve, reject) => {
          observedSignal = ctx.signal
          ctx.signal.addEventListener('abort', () => reject(new Error('aborted')))
        }),
    })

    // Detaching via invalidate() must not drop the client's only handle to
    // the flight: disposal still aborts it.
    client.invalidate(['slow'])
    client.dispose()

    expect(observedSignal?.aborted).toBe(true)
    await expect(pending).rejects.toThrow('aborted')
  })

  it('aborts a hydrate-detached flight when the client is disposed', async () => {
    const client = createQueryClient()
    let observedSignal: AbortSignal | undefined
    const pending = client.fetchQuery({
      key: keyOf('slow'),
      load: (ctx: { signal: AbortSignal }) =>
        new Promise<never>((_resolve, reject) => {
          observedSignal = ctx.signal
          ctx.signal.addEventListener('abort', () => reject(new Error('aborted')))
        }),
    })

    // Same reachability rule as invalidate-detach: releasing the slot must
    // not drop the client's only abort handle.
    client.hydrate({
      queries: [{ key: ['slow'], data: 'restored', updatedAt: Date.now() }],
    })
    client.dispose()

    expect(observedSignal?.aborted).toBe(true)
    await expect(pending).rejects.toThrow('aborted')
  })

  it('aborts in-flight work on dispose()', async () => {
    const client = createQueryClient()
    let observedSignal: AbortSignal | undefined
    const pending = client.fetchQuery({
      key: keyOf('slow'),
      load: (ctx: { signal: AbortSignal }) =>
        new Promise<never>((_resolve, reject) => {
          observedSignal = ctx.signal
          ctx.signal.addEventListener('abort', () => reject(new Error('aborted')))
        }),
    })

    client.dispose()

    await expect(pending).rejects.toThrow('aborted')
    expect(observedSignal?.aborted).toBe(true)
  })
})

describe('environment provision', () => {
  it('throws an actionable QueryError when providing outside a component context', () => {
    const client = createQueryClient()
    try {
      expect(() => provideQueryClient(client)).toThrowError(QueryError)
      expect(() => provideQueryClient(client)).toThrowError(/component context/)
    } finally {
      client.dispose()
    }
  })

  it('round-trips the provided client instead of the ambient fallback', () => {
    const client = createQueryClient()
    const context = createComponentContext('provision')

    runWithComponentContext(context, () => {
      provideQueryClient(client)
      expect(useQueryClient()).toBe(client)
    })
  })

  it('lets nested providers shadow without clobbering the parent scope', () => {
    const clientA = createQueryClient()
    const clientB = createQueryClient()
    const outerContext = createComponentContext('outer')
    let innerSeen: QueryClient | undefined

    runWithComponentContext(outerContext, () => {
      provideQueryClient(clientA)
      const innerContext = createComponentContext('inner', outerContext)
      runWithComponentContext(innerContext, () => {
        provideQueryClient(clientB)
        innerSeen = useQueryClient()
      })
      // The inner provider is gone: the outer scope still resolves to A.
      expect(useQueryClient()).toBe(clientA)
    })

    expect(innerSeen).toBe(clientB)
  })

  it('returns one shared ambient client outside any provider', async () => {
    const first = useQueryClient()
    const second = useQueryClient()

    expect(second).toBe(first)
    await expect(
      first.fetchQuery({ key: keyOf('k'), load: async () => 'ambient' })
    ).resolves.toBe('ambient')
  })

  it('serves an ambient client that names itself in options.client', async () => {
    const ambient = useQueryClient()

    // The ambient client is the object fetchQuery closed over — not a wrapper
    // — so the identity guard takes the normal path instead of delegating to
    // itself forever. This is the shape `createQuery` will use in #280.
    await expect(
      ambient.fetchQuery({
        key: keyOf('k'),
        load: async () => 'v',
        client: ambient,
      })
    ).resolves.toBe('v')
  })

  it('drops the ambient fallback on reset and on direct dispose', () => {
    const first = useQueryClient()
    resetDefaultQueryClient()
    const second = useQueryClient()

    expect(second).not.toBe(first)

    second.dispose()
    const third = useQueryClient()
    expect(third).not.toBe(second)
  })

  it('throws an actionable error for a missing provider on the server', () => {
    vi.stubGlobal('document', undefined)

    expect(() => useQueryClient()).toThrowError(QueryError)
    expect(() => useQueryClient()).toThrowError(/per request/)
  })

  it('still serves provided and explicit clients on the server', async () => {
    vi.stubGlobal('document', undefined)
    const provided = createQueryClient()
    const explicit = createQueryClient()
    const context = createComponentContext('ssr')

    const seen = runWithComponentContext(context, () => {
      provideQueryClient(provided)
      return useQueryClient()
    })
    expect(seen).toBe(provided)

    // SSR prefetch uses the client directly and never needs ambient state.
    await expect(
      explicit.fetchQuery({ key: keyOf('route'), load: async () => 'ready' })
    ).resolves.toBe('ready')
  })
})

describe('prefetchQueries', () => {
  it('warms the cache for every request without rejecting', async () => {
    const client = createQueryClient()
    const loads = new Map<string, number>()
    const loadNamed = (name: string, fails = false) => async () => {
      loads.set(name, (loads.get(name) ?? 0) + 1)
      if (fails) {
        throw new Error(`no ${name}`)
      }
      return name
    }

    await expect(
      client.prefetchQueries([
        { key: () => ['a'], load: loadNamed('a') },
        { key: () => ['b'], load: loadNamed('b', true) },
      ])
    ).resolves.toBeUndefined()

    // The success is cached; the failure is not, so it retries on demand.
    await expect(
      client.fetchQuery({ key: () => ['a'], load: loadNamed('a') })
    ).resolves.toBe('a')
    await expect(
      client.fetchQuery({ key: () => ['b'], load: loadNamed('b', true) })
    ).rejects.toThrow('no b')
    expect(loads.get('a')).toBe(1)
    expect(loads.get('b')).toBe(2)
  })
})

describe('dehydrate and hydrate', () => {
  it('serializes only successful snapshot opt-ins', async () => {
    const client = createQueryClient()
    await client.fetchQuery({
      key: keyOf('snapshotted'),
      load: async () => 'keep',
      snapshot: true,
    })
    await client.fetchQuery({ key: keyOf('plain'), load: async () => 'skip' })
    await expect(
      client.fetchQuery({
        key: keyOf('broken'),
        load: async (): Promise<string> => {
          throw new Error('nope')
        },
        snapshot: true,
      })
    ).rejects.toThrow('nope')

    const state = client.dehydrate()

    expect(state.queries).toHaveLength(1)
    expect(state.queries[0]?.key).toEqual(['snapshotted'])
    expect(state.queries[0]?.data).toBe('keep')
    expect(typeof state.queries[0]?.updatedAt).toBe('number')
  })

  it('does not serialize invalidated entries, so invalidation survives a round trip', async () => {
    const server = createQueryClient()
    await server.fetchQuery({
      key: keyOf('u'),
      load: async () => 'stale-v1',
      snapshot: true,
    })
    // A mutation landed during the request: the stale value must not cross
    // the process boundary and serve indefinitely on the other side.
    server.invalidate(['u'])
    expect(server.dehydrate().queries).toHaveLength(0)

    const browser = createQueryClient()
    browser.hydrate(server.dehydrate())
    let loads = 0
    await expect(
      browser.fetchQuery({
        key: keyOf('u'),
        load: async () => {
          loads += 1
          return 'fresh-v2'
        },
      })
    ).resolves.toBe('fresh-v2')
    expect(loads).toBe(1)
  })

  it('does not let a later caller revoke an earlier snapshot opt-in', async () => {
    const client = createQueryClient()
    await client.fetchQuery({
      key: keyOf('u'),
      load: async () => 'v',
      snapshot: true,
      staleTime: 60_000,
    })
    expect(client.dehydrate().queries).toHaveLength(1)

    // Policy upgrades apply only while the field still holds its default, so
    // a call that performs no fetch at all still cannot revoke the opt-in —
    // or the freshness — another consumer configured.
    await client.fetchQuery({
      key: keyOf('u'),
      load: async () => 'v',
      snapshot: false,
      staleTime: 0,
    })
    expect(client.dehydrate().queries).toHaveLength(1)
    const seen = client.dehydrate((entry) => {
      expect(entry.options.staleTime).toBe(60_000)
      return true
    })
    expect(seen.queries).toHaveLength(1)
  })

  it('hashes undefined key segments distinctly from null', async () => {
    const client = createQueryClient()
    let loads = 0
    const counting = (value: string) => async () => {
      loads += 1
      return value
    }

    // `['user', userId()]` with an unset id is ordinary; it must not share an
    // entry with an explicit null.
    await expect(
      client.fetchQuery({ key: () => ['u', undefined], load: counting('A') })
    ).resolves.toBe('A')
    await expect(
      client.fetchQuery({ key: () => ['u', null], load: counting('B') })
    ).resolves.toBe('B')
    expect(loads).toBe(2)
  })

  it('lets a filter narrow the snapshot set, never widen it', async () => {
    const client = createQueryClient()
    await client.fetchQuery({
      key: keyOf('snapshotted'),
      load: async () => 'keep',
      snapshot: true,
    })
    await client.fetchQuery({ key: keyOf('plain'), load: async () => 'skip' })

    const narrowed = client.dehydrate(() => false)
    expect(narrowed.queries).toHaveLength(0)

    // A permissive filter still cannot pull in the non-snapshot entry.
    const permissive = client.dehydrate(() => true)
    expect(permissive.queries).toHaveLength(1)
  })

  it('restores entries so the next fetch serves them without loading', async () => {
    const source = createQueryClient()
    const target = createQueryClient()
    let loads = 0
    const options = {
      key: keyOf('users'),
      load: async () => {
        loads += 1
        return 'ada'
      },
    }

    await source.fetchQuery({ ...options, snapshot: true })
    target.hydrate(source.dehydrate())

    await expect(target.fetchQuery(options)).resolves.toBe('ada')
    expect(loads).toBe(1)
  })

  it('upgrades a hydrated entry policy from later options', async () => {
    const source = createQueryClient()
    const target = createQueryClient()
    await source.fetchQuery({
      key: keyOf('users'),
      load: async () => 'ada',
      snapshot: true,
    })
    target.hydrate(source.dehydrate())

    // Served from the restored entry without loading, and the snapshot flag
    // carried over, so the entry re-serializes.
    await expect(
      target.fetchQuery({
        key: keyOf('users'),
        load: async (): Promise<string> => {
          throw new Error('must not load')
        },
        snapshot: true,
        staleTime: 60_000,
        gcTime: 60_000,
      })
    ).resolves.toBe('ada')
    const restored = target.dehydrate((entry) => {
      expect(entry.options).toEqual({ staleTime: 60_000, gcTime: 60_000, snapshot: true })
      return true
    })
    expect(restored.queries).toHaveLength(1)
  })

  it('serves restored data instead of a flight that started before hydrate()', async () => {
    const client = createQueryClient()
    let loads = 0
    let releaseLoad: (() => void) | undefined
    const gate = new Promise<void>((resolveGate) => {
      releaseLoad = resolveGate
    })

    const pending = client.fetchQuery({
      key: keyOf('users'),
      load: async () => {
        loads += 1
        await gate
        return 'stale'
      },
    })
    client.hydrate({
      queries: [{ key: ['users'], data: 'restored', updatedAt: Date.now() }],
    })
    releaseLoad?.()

    // The stale flight still resolves to its waiter, but the entry keeps the
    // restored data and serves it without reloading.
    await expect(pending).resolves.toBe('stale')
    await expect(
      client.fetchQuery({
        key: keyOf('users'),
        load: async () => 'unreached',
      })
    ).resolves.toBe('restored')
    expect(loads).toBe(1)
  })

  it('accepts an empty payload as a no-op', () => {
    const client = createQueryClient()

    expect(() => client.hydrate({ queries: [] })).not.toThrow()
    expect(client.dehydrate().queries).toHaveLength(0)
  })

  it('rejects malformed payloads with QueryError', () => {
    const client = createQueryClient()
    const malformed: unknown[] = [
      null,
      'nope',
      {},
      { queries: 'nope' },
      { queries: [42] },
      { queries: [null] },
      { queries: [{ key: 'nope', data: 1, updatedAt: 1 }] },
      { queries: [{ key: [], updatedAt: 1 }] },
      { queries: [{ key: [], data: 1 }] },
    ]

    for (const payload of malformed) {
      expect(() => client.hydrate(payload as DehydratedState)).toThrowError(QueryError)
    }
  })
})
