/**
 * Cache lifecycle policy (#279): observation, `gcTime` retention, the stale
 * calculation, and data preservation across a refresh.
 *
 * Deduplication and client-disposal aborts are pinned in `query-client.test.ts`
 * alongside the ownership roots they build on; this file covers what the
 * lifecycle adds on top.
 *
 * Staleness here is a signal and not a trigger: it marks data as worth
 * refetching without fetching anything. `fetchQuery` serves a stale entry, and
 * nothing refetches in the background. What acts on staleness is an observer's
 * policy (#280) and explicit `invalidate()`.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createQueryClient, inspectQueryEntry } from '../src/client'
import { QueryError } from '../src/errors'
import { DEFAULT_GC_TIME } from '../src/defaults'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

function keyOf(name: string): () => readonly unknown[] {
  return () => [name]
}

/** A loader that counts its runs, so eviction shows up as a second run. */
function counter(value: unknown = 'v') {
  const state = { loads: 0 }
  return {
    state,
    load: async () => {
      state.loads += 1
      return value
    },
  }
}

describe('gcTime retention', () => {
  it('evicts an unobserved entry after gcTime and not before', async () => {
    const client = createQueryClient()
    const { state, load } = counter()

    await client.fetchQuery({ key: keyOf('u'), load })
    expect(state.loads).toBe(1)

    // One tick short of the window: still cached.
    await vi.advanceTimersByTimeAsync(DEFAULT_GC_TIME - 1)
    await client.fetchQuery({ key: keyOf('u'), load })
    expect(state.loads).toBe(1)

    // The read above restarted nothing — retention measures time unobserved,
    // not time since last use — so the original deadline still lands.
    await vi.advanceTimersByTimeAsync(1)
    expect(inspectQueryEntry(client, ['u'])).toBeUndefined()
    await client.fetchQuery({ key: keyOf('u'), load })
    expect(state.loads).toBe(2)
  })

  it('reports no entry for a key the cache has never held', () => {
    const client = createQueryClient()

    expect(inspectQueryEntry(client, ['never'])).toBeUndefined()
  })

  it('honours a per-query gcTime over the default', async () => {
    const client = createQueryClient()
    const { state, load } = counter()

    await client.fetchQuery({ key: keyOf('u'), load, gcTime: 1_000 })
    await vi.advanceTimersByTimeAsync(999)
    await client.fetchQuery({ key: keyOf('u'), load, gcTime: 1_000 })
    expect(state.loads).toBe(1)

    await vi.advanceTimersByTimeAsync(1)
    await client.fetchQuery({ key: keyOf('u'), load, gcTime: 1_000 })
    expect(state.loads).toBe(2)
  })

  it('never evicts an entry whose gcTime is not finite', async () => {
    const client = createQueryClient()
    const { state, load } = counter()

    await client.fetchQuery({
      key: keyOf('u'),
      load,
      gcTime: Number.POSITIVE_INFINITY,
    })
    await vi.advanceTimersByTimeAsync(DEFAULT_GC_TIME * 10)
    await client.fetchQuery({
      key: keyOf('u'),
      load,
      gcTime: Number.POSITIVE_INFINITY,
    })

    expect(state.loads).toBe(1)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('does not evict an entry whose request outlives its gcTime', async () => {
    const client = createQueryClient()
    let release!: (value: string) => void
    const gate = new Promise<string>((resolve) => {
      release = resolve
    })
    let loads = 0

    const pending = client.fetchQuery({
      key: keyOf('slow'),
      load: () => {
        loads += 1
        return gate
      },
      gcTime: 1_000,
    })
    // A load slower than the window must not resolve into an entry that no
    // longer exists.
    await vi.advanceTimersByTimeAsync(5_000)
    release('late')
    await expect(pending).resolves.toBe('late')

    // Retention starts from the settle, not from the insert.
    await vi.advanceTimersByTimeAsync(999)
    await client.fetchQuery({
      key: keyOf('slow'),
      load: async () => 'fresh',
      gcTime: 1_000,
    })
    expect(loads).toBe(1)
  })

  it('replaces the default timer when gcTime is first claimed later', async () => {
    const client = createQueryClient()
    // hydrate() creates the entry with unclaimed defaults and a 300s timer;
    // the first query to name the key configures it. This is the shape #291's
    // SSR flow produces, so the configured window has to take effect.
    client.hydrate({
      queries: [{ key: ['u'], data: 'restored', updatedAt: Date.now() }],
    })
    await client.fetchQuery({
      key: keyOf('u'),
      load: async () => 'fresh',
      gcTime: 1_000,
    })

    await vi.advanceTimersByTimeAsync(999)
    expect(inspectQueryEntry(client, ['u'])).toBeDefined()
    await vi.advanceTimersByTimeAsync(1)
    expect(inspectQueryEntry(client, ['u'])).toBeUndefined()
  })

  it('rejects a window no caller could have meant', async () => {
    const client = createQueryClient()
    const load = async () => 'v'

    // Both fail silently when malformed: a NaN gcTime takes the same branch
    // as an intentional Infinity and retains forever, and a NaN staleTime
    // makes every comparison false.
    for (const bad of [Number.NaN, -1]) {
      await expect(
        client.fetchQuery({ key: keyOf('u'), load, gcTime: bad })
      ).rejects.toThrowError(/gcTime must be a non-negative/)
      await expect(
        client.fetchQuery({ key: keyOf('u'), load, staleTime: bad })
      ).rejects.toThrowError(/staleTime must be a non-negative/)
    }
    // Infinity stays valid for both: "never evict" and "never stale" are
    // real choices, and zero is the documented default.
    await expect(
      client.fetchQuery({
        key: keyOf('ok'),
        load,
        gcTime: Number.POSITIVE_INFINITY,
        staleTime: Number.POSITIVE_INFINITY,
      })
    ).resolves.toBe('v')
    await expect(
      client.fetchQuery({ key: keyOf('zero'), load, gcTime: 0, staleTime: 0 })
    ).resolves.toBe('v')
  })

  it('restarts retention after invalidate', async () => {
    const client = createQueryClient()
    const { state, load } = counter()

    await client.fetchQuery({ key: keyOf('u'), load, gcTime: 1_000 })
    await vi.advanceTimersByTimeAsync(900)
    client.invalidate(['u'])

    // The invalidation reset the clock, so the entry is still there to serve
    // the refetch rather than being rebuilt from nothing.
    await vi.advanceTimersByTimeAsync(900)
    await client.fetchQuery({ key: keyOf('u'), load, gcTime: 1_000 })
    expect(state.loads).toBe(2)
    expect(client.dehydrate(() => true).queries).toHaveLength(0)
  })

  it('leaves no pending timer behind on clear() or dispose()', async () => {
    const client = createQueryClient()
    await client.fetchQuery({ key: keyOf('a'), load: async () => 'v' })
    await client.fetchQuery({ key: keyOf('b'), load: async () => 'v' })
    expect(vi.getTimerCount()).toBe(2)

    client.clear()
    expect(vi.getTimerCount()).toBe(0)

    await client.fetchQuery({ key: keyOf('c'), load: async () => 'v' })
    expect(vi.getTimerCount()).toBe(1)
    client.dispose()
    // A dangling timer would keep its entry, and whatever the loader
    // captured, alive past the client that owned it.
    expect(vi.getTimerCount()).toBe(0)
  })
})

describe('entries dropped by clear() and dispose()', () => {
  it('does not let an observation held across clear() evict the replacement', async () => {
    const client = createQueryClient()
    await client.fetchQuery({ key: keyOf('u'), load: async () => 'a', gcTime: 100 })
    const observation = client.observe(['u'])

    // The observation still points at the dropped entry. Releasing it must
    // not arm a timer that later deletes by hash and takes out whichever
    // entry holds that hash by then.
    client.clear()
    await client.fetchQuery({ key: keyOf('u'), load: async () => 'b', gcTime: 5_000 })
    observation.release()

    await vi.advanceTimersByTimeAsync(150)
    expect(inspectQueryEntry(client, ['u'])?.data).toBe('b')
  })

  it('does not let a flight settling after clear() evict the replacement', async () => {
    const client = createQueryClient()
    let release!: (value: string) => void
    const gate = new Promise<string>((resolve) => {
      release = resolve
    })
    const pending = client.fetchQuery({
      key: keyOf('u'),
      load: () => gate,
      gcTime: 50,
    })

    // clear() aborts the flight but does not null its slot, so the settling
    // request still owns it and would otherwise schedule against the orphan.
    client.clear()
    await client.fetchQuery({ key: keyOf('u'), load: async () => 'b', gcTime: 5_000 })
    release('late')
    await pending.catch(() => undefined)

    await vi.advanceTimersByTimeAsync(150)
    expect(inspectQueryEntry(client, ['u'])?.data).toBe('b')
  })

  it('arms no timer when an observation is released after dispose()', async () => {
    const client = createQueryClient()
    await client.fetchQuery({ key: keyOf('u'), load: async () => 'a' })
    const observation = client.observe(['u'])

    client.dispose()
    expect(vi.getTimerCount()).toBe(0)
    // A timer here would hold the entry, and whatever its loader captured,
    // for a full gcTime past the client that owned it.
    observation.release()
    expect(vi.getTimerCount()).toBe(0)
  })
})

describe('observation', () => {
  it('holds an observed entry indefinitely', async () => {
    const client = createQueryClient()
    const { state, load } = counter()

    await client.fetchQuery({ key: keyOf('u'), load, gcTime: 1_000 })
    const observation = client.observe(['u'])

    await vi.advanceTimersByTimeAsync(DEFAULT_GC_TIME * 2)
    await client.fetchQuery({ key: keyOf('u'), load, gcTime: 1_000 })
    expect(state.loads).toBe(1)

    observation.release()
  })

  it('cancels a pending eviction when the entry is observed again', async () => {
    const client = createQueryClient()
    const { state, load } = counter()

    await client.fetchQuery({ key: keyOf('u'), load, gcTime: 1_000 })
    await vi.advanceTimersByTimeAsync(900)

    // Re-observing before the timer fires cancels it outright rather than
    // deferring it: the entry survives well past the original deadline.
    const observation = client.observe(['u'])
    await vi.advanceTimersByTimeAsync(10_000)
    await client.fetchQuery({ key: keyOf('u'), load, gcTime: 1_000 })
    expect(state.loads).toBe(1)

    // ... and releasing starts a fresh full window.
    observation.release()
    await vi.advanceTimersByTimeAsync(999)
    await client.fetchQuery({ key: keyOf('u'), load, gcTime: 1_000 })
    expect(state.loads).toBe(1)
    await vi.advanceTimersByTimeAsync(1)
    await client.fetchQuery({ key: keyOf('u'), load, gcTime: 1_000 })
    expect(state.loads).toBe(2)
  })

  it('retains while any observation is held', async () => {
    const client = createQueryClient()
    const { state, load } = counter()

    await client.fetchQuery({ key: keyOf('u'), load, gcTime: 1_000 })
    const first = client.observe(['u'])
    const second = client.observe(['u'])
    expect(inspectQueryEntry(client, ['u'])?.observerCount).toBe(2)

    first.release()
    await vi.advanceTimersByTimeAsync(10_000)
    await client.fetchQuery({ key: keyOf('u'), load, gcTime: 1_000 })
    expect(state.loads).toBe(1)

    second.release()
    await vi.advanceTimersByTimeAsync(1_000)
    await client.fetchQuery({ key: keyOf('u'), load, gcTime: 1_000 })
    expect(state.loads).toBe(2)
  })

  it('releases idempotently', async () => {
    const client = createQueryClient()
    const { state, load } = counter()

    await client.fetchQuery({ key: keyOf('u'), load, gcTime: 1_000 })
    const first = client.observe(['u'])
    const second = client.observe(['u'])

    // An owner may clean up more than once; a second release must not drive
    // the count negative and retain the entry forever.
    first.release()
    first.release()
    second.release()
    await vi.advanceTimersByTimeAsync(1_000)
    await client.fetchQuery({ key: keyOf('u'), load, gcTime: 1_000 })
    expect(state.loads).toBe(2)
  })

  it('observes a key no query has named yet', async () => {
    const client = createQueryClient()
    const observation = client.observe(['unfetched'])

    // The entry exists to be retained before any fetch resolves, so an
    // observer registered during render is not racing the load.
    const entry = inspectQueryEntry(client, ['unfetched'])
    expect(entry?.observerCount).toBe(1)
    expect(entry?.status).toBe('idle')

    const { state, load } = counter()
    await client.fetchQuery({ key: keyOf('unfetched'), load })
    expect(state.loads).toBe(1)
    expect(inspectQueryEntry(client, ['unfetched'])?.status).toBe('success')
    observation.release()
  })

  it('refuses to observe after dispose()', () => {
    const client = createQueryClient()
    client.dispose()

    expect(() => client.observe(['u'])).toThrowError(QueryError)
    expect(() => client.observe(['u'])).toThrowError(/after dispose/)
  })

  it('reports the observer count through the dehydrate view', async () => {
    const client = createQueryClient()
    await client.fetchQuery({
      key: keyOf('u'),
      load: async () => 'v',
      snapshot: true,
    })
    const observation = client.observe(['u'])

    let seen = -1
    client.dehydrate((entry) => {
      seen = entry.observerCount
      return true
    })
    expect(seen).toBe(1)
    expect(inspectQueryEntry(client, ['u'])?.observerCount).toBe(1)

    observation.release()
    expect(inspectQueryEntry(client, ['u'])?.observerCount).toBe(0)
  })
})

describe('freshness', () => {
  it('marks an entry stale once staleTime elapses, and not before', async () => {
    const client = createQueryClient()
    await client.fetchQuery({
      key: keyOf('u'),
      load: async () => 'v',
      staleTime: 1_000,
      snapshot: true,
    })

    const staleAt = (): boolean => {
      let seen = false
      client.dehydrate((entry) => {
        seen = entry.isStale
        return false
      })
      return seen
    }

    expect(staleAt()).toBe(false)
    await vi.advanceTimersByTimeAsync(999)
    expect(staleAt()).toBe(false)
    await vi.advanceTimersByTimeAsync(1)
    expect(staleAt()).toBe(true)
  })

  it('treats a never-written entry as stale', () => {
    const client = createQueryClient()
    const observation = client.observe(['u'])

    // There is nothing to be fresh: an entry with no value is stale.
    expect(inspectQueryEntry(client, ['u'])?.isStale).toBe(true)
    observation.release()
  })

  it('is stale immediately at the default staleTime of 0', async () => {
    const client = createQueryClient()
    await client.fetchQuery({
      key: keyOf('u'),
      load: async () => 'v',
      snapshot: true,
    })

    let seen = false
    client.dehydrate((entry) => {
      seen = entry.isStale
      return false
    })
    expect(seen).toBe(true)
  })

  it('serves a stale entry rather than reloading it', async () => {
    const client = createQueryClient()
    const { state, load } = counter()

    await client.fetchQuery({ key: keyOf('u'), load })
    await vi.advanceTimersByTimeAsync(60_000)

    // Staleness marks data as worth refetching; it does not fetch. Only an
    // observer's policy (#280) or an explicit invalidate() reloads.
    await expect(client.fetchQuery({ key: keyOf('u'), load })).resolves.toBe('v')
    expect(state.loads).toBe(1)
  })
})

describe('refresh', () => {
  it('preserves prior successful data while a refresh is in flight', async () => {
    const client = createQueryClient()
    let release!: (value: string) => void
    const gate = new Promise<string>((resolve) => {
      release = resolve
    })

    await client.fetchQuery({
      key: keyOf('u'),
      load: async () => 'first',
      snapshot: true,
    })
    client.invalidate(['u'])
    const refreshing = client.fetchQuery({ key: keyOf('u'), load: () => gate })

    // A background refresh is success + fetching: the prior value keeps
    // rendering instead of collapsing to a spinner.
    const refreshingEntry = inspectQueryEntry(client, ['u'])
    expect(refreshingEntry?.status).toBe('success')
    expect(refreshingEntry?.fetchStatus).toBe('fetching')
    expect(refreshingEntry?.data).toBe('first')

    release('second')
    await expect(refreshing).resolves.toBe('second')
  })

  it('keeps prior data when a refresh fails', async () => {
    const client = createQueryClient()
    await client.fetchQuery({
      key: keyOf('u'),
      load: async () => 'first',
      snapshot: true,
    })
    client.invalidate(['u'])
    await expect(
      client.fetchQuery({
        key: keyOf('u'),
        load: async () => {
          throw new Error('backend down')
        },
      })
    ).rejects.toThrow('backend down')

    // The failure is recorded without discarding what was already known.
    const failed = inspectQueryEntry(client, ['u'])
    expect(failed?.status).toBe('error')
    expect(failed?.data).toBe('first')
    expect((failed?.error as Error | undefined)?.message).toBe('backend down')
  })
})
