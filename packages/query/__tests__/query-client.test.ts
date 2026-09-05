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

  it('lets a throwing key function reject with its own error', async () => {
    const client = createQueryClient()

    // Dispatch failures that are not QueryErrors pass through untagged —
    // prefetch still swallows them as non-misuse.
    await expect(
      client.fetchQuery({
        key: () => {
          throw new TypeError('bad key fn')
        },
        load: async () => 'unreached',
      })
    ).rejects.toThrowError(TypeError)
  })

  it('raises QueryError for an unserializable key', async () => {
    const client = createQueryClient()

    await expect(
      client.fetchQuery({
        key: () => [new Set(['a'])],
        load: async () => 'unreachable',
      })
    ).rejects.toThrowError(QueryError)
  })

  it('rejects keys that JSON.stringify would silently collapse', async () => {
    const client = createQueryClient()
    const load = async () => 'unreached'
    const collapsing: Array<() => readonly unknown[]> = [
      () => ['u', new Set(['a'])],
      () => ['u', new Map([['a', 1]])],
      () => ['u', () => 'id'],
      () => ['u', Symbol('id')],
      () => ['u', Object.assign(['x'], { tag: 'sneaky' })],
      () => ['u', Object.assign(['x'], { [Symbol('s')]: 1 })],
    ]

    // Each resolves today to a shared wrong entry; all must raise instead.
    // (Explicit undefined, NaN, Infinity, -0, bigint, Uint8Array, and Date
    // are canonicalized rather than refused — see the encoding tests below —
    // as are toJSON, null-prototype objects, and cross-realm input.)
    const circular: unknown[] = ['u']
    circular.push(circular)
    await expect(
      client.fetchQuery({
        key: () => circular as readonly unknown[],
        load,
      })
    ).rejects.toThrowError(/circular/)
    for (const key of collapsing) {
      await expect(client.fetchQuery({ key, load })).rejects.toThrowError(
        QueryError
      )
    }
  })

  it('rejects keys shaped like the canonical encoding', async () => {
    const client = createQueryClient()
    let loads = 0
    const counting = (value: string) => async () => {
      loads += 1
      return value
    }

    // The shape is a tagged wrapper, so accepting it would serve
    // undefined-keyed data for it (or vice versa) and decode into a value
    // the caller never wrote.
    await expect(
      client.fetchQuery({
        key: () => ['u', { __tachuiQuery: 'undefined' }],
        load: counting('spoof'),
      })
    ).rejects.toThrowError(/reserved/)
    await expect(
      client.fetchQuery({ key: () => ['u', undefined], load: counting('real') })
    ).resolves.toBe('real')
    expect(loads).toBe(1)
  })

  it('wraps throwing and self-returning toJSON in QueryError', async () => {
    const client = createQueryClient()
    const load = async () => 'unreached'
    const sneaky: { toJSON: () => unknown } = { toJSON: () => sneaky }

    await expect(
      client.fetchQuery({
        key: () => [
          'u',
          {
            toJSON: () => {
              throw new Error('nope')
            },
          },
        ],
        load,
      })
    ).rejects.toThrowError(/toJSON threw/)
    await expect(
      client.fetchQuery({ key: () => ['u', sneaky], load })
    ).rejects.toThrowError(/circular/)
  })

  it('validates the serialized form of arrays with custom toJSON hooks', async () => {
    const client = createQueryClient()
    let loads = 0
    const counting = (value: string) => async () => {
      loads += 1
      return value
    }
    // The hook replaces the rendering, so the key hashes as null — and
    // shares the null entry consistently, on both sides of the hash.
    const hooked = Object.assign(['a'], { toJSON: () => null })
    await expect(
      client.fetchQuery({ key: () => ['u', hooked], load: counting('H') })
    ).resolves.toBe('H')
    await expect(
      client.fetchQuery({ key: () => ['u', null], load: counting('N') })
    ).resolves.toBe('H')
    expect(loads).toBe(1)

    // A hook whose output is unhashable is rejected, not collided with '{}'.
    const sneakyHook = Object.assign(['a'], { toJSON: () => new Set(['a']) })
    await expect(
      client.fetchQuery({ key: () => ['u', sneakyHook], load: counting('X') })
    ).rejects.toThrowError(QueryError)
    expect(loads).toBe(1)
  })

  it('rejects Dates that cannot survive serialization', async () => {
    const client = createQueryClient()
    const load = async () => 'unreached'
    const instant = '2024-01-01T00:00:00.000Z'

    // An invalid Date renders as null, colliding with a null segment.
    await expect(
      client.fetchQuery({ key: () => ['u', new Date(NaN)], load })
    ).rejects.toThrowError(/invalid Date/)
    // An overridden hook rendering an unhashable value is validated, not
    // silently collided with '{}'.
    const hooked = Object.assign(new Date(instant), {
      toJSON: () => new Set(['a']),
    })
    await expect(
      client.fetchQuery({ key: () => ['u', hooked], load })
    ).rejects.toThrowError(QueryError)
    // A brand spoof is not a genuine Date, and its symbol key is unhashable.
    await expect(
      client.fetchQuery({
        key: () => ['u', { [Symbol.toStringTag]: 'Date' }],
        load,
      })
    ).rejects.toThrowError(/symbol/)
    // A genuine valid Date still works.
    await expect(
      client.fetchQuery({
        key: () => ['u', new Date(instant)],
        load: async () => 'v',
      })
    ).resolves.toBe('v')
  })

  it('rejects object segments that differ only by symbol properties', async () => {
    const client = createQueryClient()
    let loads = 0
    const tagged = Object.assign({ id: 1 }, { [Symbol('tag')]: 'x' })

    // Stringify drops the symbol, so accepting this would serve the plain
    // twin's entry for it.
    await expect(
      client.fetchQuery({
        key: () => ['u', tagged],
        load: async () => {
          loads += 1
          return 'S'
        },
      })
    ).rejects.toThrowError(/symbol/)
    await expect(
      client.fetchQuery({
        key: () => ['u', { id: 1 }],
        load: async () => {
          loads += 1
          return 'P'
        },
      })
    ).resolves.toBe('P')
    expect(loads).toBe(1)
  })

  it('rejects key segments carrying properties the hash drops', async () => {
    const client = createQueryClient()
    let loads = 0
    const counting = (value: string) => async () => {
      loads += 1
      return value
    }
    const tenanted = Object.defineProperty({ id: 1 }, 'tenant', { value: 'a' })
    const hiddenTag = Object.defineProperty({ id: 1 }, Symbol('tag'), {
      value: 'x',
    })
    const augmented = Object.defineProperty([1], 'tag', { value: 'x' })

    // Stringify emits an object's own *enumerable* string keys and an
    // array's indexed elements, nothing else. A non-enumerable member — or a
    // non-enumerable symbol, which Object.keys never reported either — is
    // dropped, so accepting these would serve the plain twin's entry.
    await expect(
      client.fetchQuery({ key: () => ['u', tenanted], load: counting('T') })
    ).rejects.toThrowError(/non-enumerable/)
    await expect(
      client.fetchQuery({ key: () => ['u', hiddenTag], load: counting('H') })
    ).rejects.toThrowError(/symbol/)
    await expect(
      client.fetchQuery({ key: () => ['u', augmented], load: counting('A') })
    ).rejects.toThrowError(/non-index/)
    await expect(
      client.fetchQuery({ key: () => ['u', { id: 1 }], load: counting('P') })
    ).resolves.toBe('P')
    expect(loads).toBe(1)
  })

  it('decouples stored keys from the caller array', async () => {
    const client = createQueryClient()
    const key: unknown[] = ['user', 1]
    let loads = 0
    await client.fetchQuery({
      key: () => key,
      load: async () => {
        loads += 1
        return 'u1'
      },
      snapshot: true,
    })

    // Mutating the caller's array after the fetch must not desync the entry
    // from its hash: invalidating the original key still matches, and the
    // snapshot still names it.
    key[1] = 2
    client.invalidate(['user', 1])
    await expect(
      client.fetchQuery({
        key: () => ['user', 1],
        load: async () => {
          loads += 1
          return 'u1b'
        },
      })
    ).resolves.toBe('u1b')
    expect(loads).toBe(2)
    expect(client.dehydrate().queries[0]?.key).toEqual(['user', 1])
  })

  it('accepts a shared reference used twice in one key', async () => {
    const client = createQueryClient()
    const shared = { id: 1 }

    // Seen entries are removed once their subtree is done: only a true
    // revisit while still inside is circular.
    await expect(
      client.fetchQuery({
        key: () => ['u', shared, shared],
        load: async () => 'v',
      })
    ).resolves.toBe('v')
  })

  it('keeps undefined and null key segments apart', async () => {
    const client = createQueryClient()
    let loads = 0
    const counting = (value: string) => async () => {
      loads += 1
      return value
    }

    await expect(
      client.fetchQuery({ key: () => ['u', undefined], load: counting('A') })
    ).resolves.toBe('A')
    await expect(
      client.fetchQuery({ key: () => ['u', null], load: counting('B') })
    ).resolves.toBe('B')
    expect(loads).toBe(2)
  })

  it('accepts toJSON classes, null-prototype objects, and cross-realm clones', async () => {
    const client = createQueryClient()
    let loads = 0
    class NamedId {
      constructor(private readonly id: string) {}
      toJSON(): unknown {
        return { id: this.id };
      }
    }
    const nullProto: Record<string, unknown> = Object.create(null)
    nullProto.id = 1

    const keys: Array<() => readonly unknown[]> = [
      () => ['u', new NamedId('x')],
      () => ['u', nullProto],
      () => structuredClone(['u', { id: 2 }]),
    ]
    for (const key of keys) {
      await expect(
        client.fetchQuery({
          key,
          load: async () => {
            loads += 1
            return 'v'
          },
        })
      ).resolves.toBe('v')
    }
    expect(loads).toBe(3)
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

  it('strips a forwarding client so decorated clients terminate', async () => {
    const backend = createQueryClient()
    let loads = 0
    const decorated: QueryClient = {
      ...backend,
      fetchQuery: (request) => backend.fetchQuery(request),
    }

    // Without the strip, the intact options.client would bounce between the
    // decorator and the backend to RangeError.
    await expect(
      decorated.fetchQuery({
        key: keyOf('k'),
        load: async () => {
          loads += 1
          return 'v'
        },
        client: decorated,
      })
    ).resolves.toBe('v')
    expect(loads).toBe(1)
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

  it('invalidates Date and object segments by value, not reference', async () => {
    const client = createQueryClient()
    const instant = '2024-01-01T00:00:00.000Z'
    let loads = 0
    const counting = (value: string) => async () => {
      loads += 1
      return value
    }

    await client.fetchQuery({
      key: () => ['d', new Date(instant)],
      load: counting('a'),
    })
    await client.fetchQuery({
      key: () => ['o', { id: 1 }],
      load: counting('b'),
    })
    expect(loads).toBe(2)

    // Equal instants and shapes, different references: identity matching
    // would leave both entries stale forever.
    client.invalidate(['d', new Date(instant)])
    client.invalidate(['o', { id: 1 }])
    await expect(
      client.fetchQuery({
        key: () => ['d', new Date(instant)],
        load: counting('a2'),
      })
    ).resolves.toBe('a2')
    await expect(
      client.fetchQuery({ key: () => ['o', { id: 1 }], load: counting('b2') })
    ).resolves.toBe('b2')
    expect(loads).toBe(4)
  })

  it('invalidates an undefined-keyed entry without matching its null twin', async () => {
    const client = createQueryClient()
    let loads = 0
    const counting = (value: string) => async () => {
      loads += 1
      return value
    }

    await client.fetchQuery({
      key: () => ['users', undefined],
      load: counting('anon'),
    })
    await client.fetchQuery({ key: () => ['users', null], load: counting('none') })
    expect(loads).toBe(2)

    // The stored key is the wire rendering, where undefined reads as null:
    // matching on it would miss the entry fetchQuery created and hit its null
    // twin instead, serving pre-mutation data forever.
    client.invalidate(['users', undefined])
    await expect(
      client.fetchQuery({ key: () => ['users', undefined], load: counting('anon2') })
    ).resolves.toBe('anon2')
    await expect(
      client.fetchQuery({ key: () => ['users', null], load: counting('none2') })
    ).resolves.toBe('none')
    expect(loads).toBe(3)

    // And the reverse: an explicit null must not invalidate the undefined entry.
    client.invalidate(['users', null])
    await expect(
      client.fetchQuery({ key: () => ['users', undefined], load: counting('anon3') })
    ).resolves.toBe('anon2')
    await expect(
      client.fetchQuery({ key: () => ['users', null], load: counting('none3') })
    ).resolves.toBe('none3')
    expect(loads).toBe(4)
  })

  it('invalidates keys whose undefined is nested or a hole', async () => {
    const client = createQueryClient()
    let loads = 0
    const counting = () => async () => {
      loads += 1
      return 'v'
    }
    const sparse: unknown[] = ['s', 'x']
    sparse.length = 3

    await client.fetchQuery({ key: () => ['u', { id: undefined }], load: counting() })
    await client.fetchQuery({ key: () => sparse, load: counting() })
    expect(loads).toBe(2)

    // Both renderings lose the undefined on the wire — the member vanishes,
    // the hole fills with null — so matching on the stored key would leave
    // these entries permanently unreachable by invalidate().
    client.invalidate(['u', { id: undefined }])
    client.invalidate(sparse)
    await client.fetchQuery({ key: () => ['u', { id: undefined }], load: counting() })
    await client.fetchQuery({ key: () => sparse, load: counting() })
    expect(loads).toBe(4)
  })

  it('matches segments through a hook on the key array itself', async () => {
    const client = createQueryClient()
    let loads = 0
    const counting = (value: string) => async () => {
      loads += 1
      return value
    }
    const hooked = Object.assign(['raw'], { toJSON: () => ['wire'] })

    // The hook replaces the whole key before any element is read, so the
    // entry is keyed by ['wire'] — fetchQuery already shares it.
    await client.fetchQuery({ key: () => hooked, load: counting('a') })
    await expect(
      client.fetchQuery({ key: () => ['wire'], load: counting('b') })
    ).resolves.toBe('a')
    expect(loads).toBe(1)

    // Segments read from the raw elements would name ['raw'], which no
    // prefix can reach: the entry would stay stale after a mutation.
    client.invalidate(['wire'])
    await expect(
      client.fetchQuery({ key: () => ['wire'], load: counting('c') })
    ).resolves.toBe('c')
    expect(loads).toBe(2)
  })

  it('rejects an unhashable prefix even against an empty cache', () => {
    const client = createQueryClient()

    // Prefix hashes are hoisted out of the entry loop: with no entries the
    // loop would never run, silently no-op-ing instead of raising like
    // fetchQuery does.
    expect(() => client.invalidate(['u', new Set(['a'])])).toThrowError(QueryError)
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
    await expect(client.prefetchQueries([])).rejects.toThrowError(/after dispose/)
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

  it('surfaces prefetch misuse that is not a QueryError', async () => {
    const client = createQueryClient()

    // A garbage explicit client throws a TypeError, and a key accessor can
    // throw anything at all. Both are raised before a loader runs, so
    // classifying by type instead of by tag would leave a misconfigured SSR
    // prefetch warming nothing with no signal.
    await expect(
      client.prefetchQueries([
        { key: keyOf('k'), load: async () => 'v', client: {} as never },
      ])
    ).rejects.toThrowError(TypeError)
    await expect(
      client.prefetchQueries([
        {
          key: () => {
            throw new TypeError('key accessor blew up')
          },
          load: async () => 'v',
        },
      ])
    ).rejects.toThrowError(/key accessor blew up/)

    // A loader throwing the same type is still just a load failure.
    await expect(
      client.prefetchQueries([
        {
          key: keyOf('down'),
          load: async () => {
            throw new TypeError('backend blew up')
          },
        },
      ])
    ).resolves.toBeUndefined()
  })

  it('surfaces prefetch misuse instead of swallowing it', async () => {
    const client = createQueryClient()

    // An unhashable key or a disposed explicit client is a programmer error:
    // silent resolution would leave server prefetch with an empty cache.
    await expect(
      client.prefetchQueries([
        { key: () => ['u', new Set(['a'])], load: async () => 'x' },
      ])
    ).rejects.toThrowError(QueryError)
    const doomed = createQueryClient()
    doomed.dispose()
    await expect(
      client.prefetchQueries([
        { key: keyOf('k'), load: async () => 'x', client: doomed },
      ])
    ).rejects.toThrowError(/after dispose/)

    // Load failures — including QueryErrors raised BY a loader — still warm
    // without rejecting.
    await expect(
      client.prefetchQueries([
        {
          key: keyOf('down'),
          load: async () => {
            throw new Error('down')
          },
        },
        {
          key: keyOf('denied'),
          load: async () => {
            throw new QueryError('backend says no')
          },
        },
      ])
    ).resolves.toBeUndefined()
  })

  it('surfaces a key that cannot be stored, like any other misuse', async () => {
    const client = createQueryClient()
    let calls = 0
    const flaky = {
      toJSON: () => {
        calls += 1
        // Each hash invokes the hook twice (scan, then serialize), so the
        // insert-time hash succeeds and only the storing copy throws.
        if (calls > 2) {
          throw new Error('flaky')
        }
        return { a: 1 }
      },
    }

    // Raised in the dispatch frame, before any loader runs, so it is misuse
    // rather than a load failure and must not be swallowed.
    await expect(
      client.prefetchQueries([{ key: () => ['f', flaky], load: async () => 'v' }])
    ).rejects.toThrowError(/toJSON threw/)
  })

  it('swallows loader QueryErrors shared via dedup during prefetch', async () => {
    const client = createQueryClient()
    let release!: (value: string) => void
    const gate = new Promise<string>((resolve) => {
      release = resolve
    })

    // A direct fetch starts the flight; prefetch dedups onto it without ever
    // running a loader of its own.
    const direct = client.fetchQuery({
      key: keyOf('shared'),
      load: () =>
        gate.then(() => {
          throw new QueryError('shared loader failure')
        }),
    })
    const warming = client.prefetchQueries([
      { key: keyOf('shared'), load: async () => 'warm' },
    ])
    release('late')
    await expect(warming).resolves.toBeUndefined()
    await expect(direct).rejects.toThrowError(/shared loader failure/)
  })

  it('rejects use after dispose before forwarding an explicit client', async () => {
    const live = createQueryClient()
    const doomed = createQueryClient()
    doomed.dispose()

    await expect(
      doomed.fetchQuery({
        key: keyOf('k'),
        load: async () => 'x',
        client: live,
      })
    ).rejects.toThrowError(/after dispose/)
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

  it('lets an explicit snapshot opt-out veto a claimed opt-in, in either order', async () => {
    const client = createQueryClient()
    const load = async () => 'v'
    // Opt-in first, opt-out second: false is the safe value, so the opt-out
    // wins even though the field is already claimed.
    await client.fetchQuery({ key: keyOf('vetoed'), load, snapshot: true })
    await client.fetchQuery({ key: keyOf('vetoed'), load, snapshot: false })
    // Opt-out first, opt-in second: the veto sticks, not first-writer.
    await client.fetchQuery({ key: keyOf('sealed'), load, snapshot: false })
    await client.fetchQuery({ key: keyOf('sealed'), load, snapshot: true })
    // An unvetoed opt-in still ships, with first-writer freshness intact.
    await client.fetchQuery({
      key: keyOf('kept'),
      load,
      snapshot: true,
      staleTime: 60_000,
    })
    await client.fetchQuery({
      key: keyOf('kept'),
      load,
      staleTime: 0,
    })

    const state = client.dehydrate()
    expect(state.queries).toHaveLength(1)
    expect(state.queries[0]?.key).toEqual(['kept'])
    const seen = client.dehydrate((entry) => {
      expect(entry.options.staleTime).toBe(60_000)
      return true
    })
    expect(seen.queries).toHaveLength(1)
  })

  it('re-emits a hydrated undefined key as undefined, never as null', async () => {
    const client = createQueryClient()
    await client.fetchQuery({
      key: () => ['u', undefined],
      load: async () => 'anon',
      snapshot: true,
    })

    // A payload assembled in process — an SSR framework handing the object
    // over directly rather than through a socket — can still carry a raw
    // undefined, so hydrate() accepts both that and the encoded form.
    client.hydrate({
      queries: [{ key: ['u', undefined], data: 'restored', updatedAt: Date.now() }],
    })
    const state = client.dehydrate()
    expect(state.queries).toHaveLength(1)
    // Encoded, not collapsed: null would be a different key on the far side.
    expect(state.queries[0]?.key).toEqual(['u', { __tachuiQuery: 'undefined' }])

    // The restored data is still served, and only by the original key.
    let loads = 0
    const counting = () => async () => {
      loads += 1
      return 'fresh'
    }
    await expect(
      client.fetchQuery({ key: () => ['u', undefined], load: counting() })
    ).resolves.toBe('restored')
    await expect(
      client.fetchQuery({ key: () => ['u', null], load: counting() })
    ).resolves.toBe('fresh')
    expect(loads).toBe(1)
  })

  it('round-trips entries keyed by undefined', async () => {
    const server = createQueryClient()
    await server.fetchQuery({
      key: () => ['user', undefined],
      load: async () => 'anon',
      snapshot: true,
    })

    // The tag distinguishes an explicit undefined from null and from an
    // absent property, so the key survives JSON instead of becoming a dead
    // entry the browser could never match.
    expect(server.dehydrate().queries).toHaveLength(1)

    const browser = createQueryClient()
    browser.hydrate(JSON.parse(JSON.stringify(server.dehydrate())))
    let loads = 0
    await expect(
      browser.fetchQuery({
        key: () => ['user', undefined],
        load: async () => {
          loads += 1
          return 'fetched'
        },
      })
    ).resolves.toBe('anon')
    expect(loads).toBe(0)
    // ... and it is still a different entry from an explicit null.
    await expect(
      browser.fetchQuery({
        key: () => ['user', null],
        load: async () => {
          loads += 1
          return 'fetched'
        },
      })
    ).resolves.toBe('fetched')
    expect(loads).toBe(1)
  })

  it('serializes Date-keyed entries because toJSON is stable across the wire', async () => {
    const server = createQueryClient()
    const instant = '2024-01-01T00:00:00.000Z'
    const load = async () => 'v'
    await server.fetchQuery({
      key: () => ['d', new Date(instant)],
      load,
      snapshot: true,
    })
    await server.fetchQuery({
      key: () => ['d', { at: new Date(instant) }],
      load,
      snapshot: true,
    })

    // toJSON runs on both sides, so the hash is identical after the round
    // trip and the browser serves both entries without loading.
    const wire = JSON.parse(JSON.stringify(server.dehydrate()))
    expect(wire.queries).toHaveLength(2)

    const browser = createQueryClient()
    browser.hydrate(wire)
    let loads = 0
    const counting = (value: string) => async () => {
      loads += 1
      return value
    }
    await expect(
      browser.fetchQuery({
        key: () => ['d', new Date(instant)],
        load: counting('fresh'),
      })
    ).resolves.toBe('v')
    await expect(
      browser.fetchQuery({
        key: () => ['d', { at: new Date(instant) }],
        load: counting('fresh'),
      })
    ).resolves.toBe('v')
    expect(loads).toBe(0)
  })

  it('refuses keys that cannot be rendered for storage', async () => {
    const client = createQueryClient()
    let calls = 0
    const flaky = {
      toJSON: () => {
        calls += 1
        // Each hash invokes the hook twice (scan, then serialize), so the
        // insert-time hash succeeds and only the storing copy throws.
        if (calls > 2) {
          throw new Error('flaky')
        }
        return { a: 1 }
      },
    }

    // A key that cannot be rendered cannot be hashed, so the fetch is
    // refused loudly and nothing lingers.
    await expect(
      client.fetchQuery({
        key: () => ['f', flaky],
        load: async () => 'v',
        snapshot: true,
      })
    ).rejects.toThrowError(/toJSON threw/)
    expect(client.dehydrate().queries).toHaveLength(0)
  })

  it('round-trips entries keyed by nested undefined', async () => {
    const client = createQueryClient()
    await client.fetchQuery({
      key: () => ['u', { id: undefined }],
      load: async () => 'v',
      snapshot: true,
    })

    // An undefined member is tagged rather than dropped, so it stays
    // distinct from an object that simply lacks the property.
    const wire = JSON.parse(JSON.stringify(client.dehydrate()))
    expect(wire.queries).toHaveLength(1)

    const browser = createQueryClient()
    browser.hydrate(wire)
    let loads = 0
    await expect(
      browser.fetchQuery({
        key: () => ['u', { id: undefined }],
        load: async () => {
          loads += 1
          return 'fresh'
        },
      })
    ).resolves.toBe('v')
    await expect(
      browser.fetchQuery({
        key: () => ['u', {}],
        load: async () => {
          loads += 1
          return 'fresh'
        },
      })
    ).resolves.toBe('fresh')
    expect(loads).toBe(1)
  })

  it('refuses a key whose own toJSON renders a non-array', async () => {
    const client = createQueryClient()
    const scalarKey = Object.assign(['x'], { toJSON: () => 'rendered' })

    // Such a key has no addressable segments, so no prefix could name it and
    // the payload could not round-trip as a key. Refused at insert rather
    // than cached under a shape nothing can reach (#278).
    await expect(
      client.fetchQuery({
        key: () => scalarKey,
        load: async () => 'v',
        snapshot: true,
      })
    ).rejects.toThrowError(/must be an array/)
    expect(client.dehydrate().queries).toHaveLength(0)
  })

  it('does not serialize data carrying properties the wire drops', async () => {
    const client = createQueryClient()
    const load = async () =>
      Object.defineProperty({ id: 1 }, 'token', { value: 'x' })

    await client.fetchQuery({ key: keyOf('hidden'), load, snapshot: true })
    await client.fetchQuery({
      key: keyOf('augmented'),
      load: async () => Object.defineProperty([1], 'tag', { value: 'x' }),
      snapshot: true,
    })
    // The wire keeps only enumerable string keys and indexed elements, so
    // both would hydrate stripped and be served as a successful result that
    // never equals TRaw. A plain twin still ships.
    await client.fetchQuery({
      key: keyOf('plain'),
      load: async () => ({ id: 1 }),
      snapshot: true,
    })

    const state = client.dehydrate()
    expect(state.queries).toHaveLength(1)
    expect(state.queries[0]?.key).toEqual(['plain'])
  })

  it('round-trips sparse keys: a hole encodes as undefined, not null', async () => {
    const client = createQueryClient()
    const sparse: unknown[] = ['u', 'x']
    sparse.length = 3
    await client.fetchQuery({ key: () => sparse, load: async () => 'v', snapshot: true })

    // The hole is tagged as undefined rather than collapsing to null, so the
    // restored entry is the one the original key names.
    const wire = JSON.parse(JSON.stringify(client.dehydrate()))
    expect(wire.queries).toHaveLength(1)
    expect(wire.queries[0]?.key).toEqual([
      'u',
      'x',
      { __tachuiQuery: 'undefined' },
    ])

    const browser = createQueryClient()
    browser.hydrate(wire)
    let loads = 0
    await expect(
      browser.fetchQuery({
        key: () => sparse,
        load: async () => {
          loads += 1
          return 'fresh'
        },
      })
    ).resolves.toBe('v')
    expect(loads).toBe(0)
  })

  it('judges the wire gate on post-toJSON values, not the raw key', async () => {
    const server = createQueryClient()
    const load = async () => 'v'
    // The raw key carries undefined, but the hashed (serialized) form does
    // not — a raw walk would drop a round-trippable entry.
    await server.fetchQuery({
      key: () => ['a', { extra: undefined, toJSON: () => ({ kept: 1 }) }],
      load,
      snapshot: true,
    })
    // The hashed form is undefined, which the encoding tags rather than
    // collapsing, so this one survives the wire too.
    await server.fetchQuery({
      key: () => ['b', { toJSON: () => undefined }],
      load,
      snapshot: true,
    })

    const wire = JSON.parse(JSON.stringify(server.dehydrate()))
    expect(wire.queries).toHaveLength(2)
    expect(wire.queries[0]?.key).toEqual(['a', { kept: 1 }])
    expect(wire.queries[1]?.key).toEqual(['b', { __tachuiQuery: 'undefined' }])

    const browser = createQueryClient()
    browser.hydrate(wire)
    let loads = 0
    await expect(
      browser.fetchQuery({
        key: () => ['a', { extra: undefined, toJSON: () => ({ kept: 1 }) }],
        load: async () => {
          loads += 1
          return 'fresh'
        },
      })
    ).resolves.toBe('v')
    expect(loads).toBe(0)
  })

  it('decouples dehydrated payloads from the cache in both directions', async () => {
    const client = createQueryClient()
    const key = keyOf('obj')
    const throwing = (): Promise<{ n: number }> => {
      throw new Error('must not load')
    }
    await client.fetchQuery({ key, load: async () => ({ n: 1 }), snapshot: true })

    const payload = client.dehydrate()
    // Payload mutated after the fact: the cache still serves pristine data.
    const payloadData = payload.queries[0]?.data as { n: number }
    payloadData.n = 999
    await expect(client.fetchQuery({ key, load: throwing })).resolves.toEqual({
      n: 1,
    })

    // Cache mutated after the fact: the payload keeps pristine data.
    const served = await client.fetchQuery({ key, load: throwing })
    served.n = 555
    expect(payload.queries[0]?.data).toEqual({ n: 999 })
  })

  it('decouples hydrated entries from the payload in both directions', async () => {
    const client = createQueryClient()
    const throwing = (): Promise<{ n: number }> => {
      throw new Error('must not load')
    }
    const external = {
      queries: [{ key: ['h'], data: { n: 1 }, updatedAt: Date.now() }],
    }
    client.hydrate(external as DehydratedState)

    // Source mutated after the fact: the cache still serves pristine data.
    const externalData = external.queries[0]?.data as { n: number }
    externalData.n = 999
    await expect(
      client.fetchQuery({ key: () => ['h'], load: throwing })
    ).resolves.toEqual({ n: 1 })

    // Cache mutated after the fact: the source keeps pristine data.
    const served = await client.fetchQuery({ key: () => ['h'], load: throwing })
    served.n = 555
    expect(external.queries[0]?.data).toEqual({ n: 999 })
  })

  it('does not serialize entries whose data cannot survive the wire', async () => {
    const server = createQueryClient()
    const instant = '2024-01-01T00:00:00.000Z'
    await server.fetchQuery({
      key: keyOf('when'),
      load: async () => ({ at: new Date(instant) }),
      snapshot: true,
    })
    await server.fetchQuery({
      key: keyOf('hole'),
      load: async () => ({ a: 1, missing: undefined }),
      snapshot: true,
    })
    await server.fetchQuery({
      key: keyOf('plain'),
      load: async () => ({ n: 1 }),
      snapshot: true,
    })

    // The Date would revive as a string and the undefined member would
    // vanish, so both entries are skipped and refetch on the other side.
    const wire = JSON.parse(JSON.stringify(server.dehydrate()))
    expect(wire.queries).toHaveLength(1)
    expect(wire.queries[0]?.key).toEqual(['plain'])

    const browser = createQueryClient()
    browser.hydrate(wire)
    let loads = 0
    await expect(
      browser.fetchQuery({
        key: keyOf('when'),
        load: async () => {
          loads += 1
          return { at: new Date(instant) }
        },
      })
    ).resolves.toEqual({ at: new Date(instant) })
    expect(loads).toBe(1)
  })

  it('skips snapshot data the wire cannot preserve exactly', async () => {
    const server = createQueryClient()
    const circular: Record<string, unknown> = { a: 1 }
    circular.self = circular
    const sparseData: unknown[] = [1]
    sparseData.length = 2
    const lossy: unknown[] = [
      10n,
      () => 'fn',
      Symbol('s'),
      NaN,
      Number.POSITIVE_INFINITY,
      -0,
      undefined,
      new Date('2024-01-01T00:00:00.000Z'),
      new Map([['a', 1]]),
      { toJSON: () => ({ a: 1 }) },
      Object.assign({ a: 1 }, { [Symbol('tag')]: 'x' }),
      Object.assign(['x'], { toJSON: () => ['x'] }),
      Object.assign([1], { tag: 'x' }),
      circular,
      sparseData,
    ]
    for (const [index, data] of lossy.entries()) {
      await server.fetchQuery({
        key: () => ['lossy', index],
        load: async () => data,
        snapshot: true,
      })
    }
    await server.fetchQuery({
      key: keyOf('plain'),
      load: async () => ({ n: 1, list: [1, 'a', true, null] }),
      snapshot: true,
    })

    // Every lossy shape stays cached but unserialized; only the plain entry
    // ships. (In-session reads are unaffected — this gate is wire-only.)
    expect(server.dehydrate().queries).toHaveLength(1)
  })

  it('keeps a Date segment and its ISO string in separate entries', async () => {
    // The tagged encoding carries the type, so the two no longer share an
    // entry the way the stringly hash made them (#278).
    const client = createQueryClient()
    const instant = '2024-01-01T00:00:00.000Z'
    let loads = 0
    await client.fetchQuery({
      key: () => ['d', new Date(instant)],
      load: async () => {
        loads += 1
        return 'date'
      },
    })
    await expect(
      client.fetchQuery({
        key: () => ['d', instant],
        load: async () => {
          loads += 1
          return 'string'
        },
      })
    ).resolves.toBe('string')
    expect(loads).toBe(2)
  })

  it('reports observerCount 0 in dehydrate views until observers exist (#280)', async () => {
    const client = createQueryClient()
    await client.fetchQuery({
      key: keyOf('u'),
      load: async () => 'v',
      snapshot: true,
    })

    let seen = -1
    const state = client.dehydrate((entry) => {
      seen = entry.observerCount
      return true
    })
    expect(state.queries).toHaveLength(1)
    expect(seen).toBe(0)
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

  it('lets an explicit opt-out claim the field against later upgrades', async () => {
    const client = createQueryClient()
    const load = async () => 'v'
    await client.fetchQuery({
      key: keyOf('u'),
      load,
      snapshot: false,
      staleTime: 0,
    })

    // Both fields were explicitly set to their defaults, so the later
    // upgrade is refused on both: nothing leaks into the SSR payload, and
    // the explicit freshness stands.
    await client.fetchQuery({
      key: keyOf('u'),
      load,
      snapshot: true,
      staleTime: 60_000,
    })
    expect(client.dehydrate().queries).toHaveLength(0)
  })

  it('keeps the first explicit freshness when a later caller disagrees', async () => {
    const client = createQueryClient()
    const load = async () => 'v'
    await client.fetchQuery({
      key: keyOf('u'),
      load,
      snapshot: true,
      staleTime: 0,
    })
    // No snapshot field here: this test pins freshness first-writer-wins,
    // while an explicit false is a veto (see the test above).
    await client.fetchQuery({
      key: keyOf('u'),
      load,
      staleTime: 60_000,
    })

    const seen = client.dehydrate((entry) => {
      expect(entry.options.staleTime).toBe(0)
      return true
    })
    expect(seen.queries).toHaveLength(1)
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

  it('installs nothing when a later hydration entry is malformed', async () => {
    const client = createQueryClient()
    let loads = 0
    const state = {
      queries: [
        { key: ['ok'], data: 'stale-partial', updatedAt: Date.now() },
        {
          key: ['bad', { __tachuiQuery: 'not-a-tag' }],
          data: 'x',
          updatedAt: Date.now(),
        },
      ],
    }

    // The shape check passes, but the second key carries an unknown tag —
    // and the first entry must not survive the throw for a fallback fetch
    // to serve.
    expect(() => client.hydrate(state as DehydratedState)).toThrowError(QueryError)
    await expect(
      client.fetchQuery({
        key: () => ['ok'],
        load: async () => {
          loads += 1
          return 'fresh'
        },
      })
    ).resolves.toBe('fresh')
    expect(loads).toBe(1)
  })

  it('installs nothing when a later entry fails boundary cloning', async () => {
    const client = createQueryClient()
    let loads = 0
    const payload = {
      queries: [
        { key: ['a'], data: 'stale-partial', updatedAt: Date.now() },
        { key: ['b'], data: { run: () => 'x' }, updatedAt: Date.now() },
      ],
    }

    // Keys validate, but the second entry cannot be cloned: the throw must
    // leave the first entry uninstalled for a fallback fetch to miss.
    expect(() => client.hydrate(payload as DehydratedState)).toThrowError(
      /cannot cross the hydration boundary/
    )
    await expect(
      client.fetchQuery({
        key: () => ['a'],
        load: async () => {
          loads += 1
          return 'fresh'
        },
      })
    ).resolves.toBe('fresh')
    expect(loads).toBe(1)
  })

  it('rejects hydration payloads with a non-finite updatedAt', () => {
    const client = createQueryClient()
    const payload = {
      queries: [{ key: ['n'], data: 'x', updatedAt: NaN }],
    }

    // NaN rides the wire as null, which the next hop rejects — fail the
    // whole malformed payload here instead.
    expect(() => client.hydrate(payload as DehydratedState)).toThrowError(QueryError)
  })

  it('rejects hydration payloads that cannot cross the boundary', () => {
    const client = createQueryClient()
    const payload = {
      queries: [{ key: ['f'], data: { run: () => 'x' }, updatedAt: Date.now() }],
    }

    // Functions pass the shape check and the key validates, but the boundary
    // copy cannot clone them: loud QueryError instead of silent aliasing
    // (the wire would drop them).
    expect(() => client.hydrate(payload as DehydratedState)).toThrowError(
      /cannot cross the hydration boundary/
    )
  })
})
