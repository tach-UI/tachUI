/**
 * `fetchInfiniteQuery` — the imperative half of pagination.
 *
 * An infinite query is one cache entry holding the whole set, not one entry per
 * page. Cursors chain, so per-page entries could refetch with a stale token, be
 * evicted from the middle of a set, or dehydrate half of one. Everything here
 * follows from that: the set is an ordinary value under the base key, and it
 * gets dedup, freshness, retention and dehydration for free because of it.
 */

import { afterEach, describe, expect, it } from 'vitest'

import {
  createQueryClient,
  inspectQueryEntry,
  resetDefaultQueryClient,
} from '../src/client'
import type { InfiniteData } from '../src/types'

afterEach(() => {
  resetDefaultQueryClient()
})

interface Page {
  readonly items: readonly string[]
  readonly next: number | undefined
}

/** Pages of two items, ending after `total`. */
function pageSource(total: number) {
  return async ({ pageParam }: { pageParam: number }): Promise<Page> => {
    const items = [`item-${pageParam}a`, `item-${pageParam}b`]
    const next = pageParam + 1 < total ? pageParam + 1 : undefined
    return { items, next }
  }
}

const nextParam = (page: Page): number | undefined => page.next

describe('one entry for the whole set', () => {
  it('stores the accumulated set under the base key and returns it', async () => {
    const client = createQueryClient()
    const data = await client.fetchInfiniteQuery<Page, number>({
      key: () => ['feed'],
      load: pageSource(3),
      initialPageParam: 0,
      getNextPageParam: nextParam,
    })

    expect(data.pages).toHaveLength(1)
    expect(data.pageParams).toEqual([0])

    // The base key, not a per-page key: what the cache holds is the set.
    const entry = inspectQueryEntry(client, ['feed'])
    expect(entry?.data).toEqual(data)
    client.dispose()
  })

  it('loads pages in sequence, feeding each result to getNextPageParam', async () => {
    const client = createQueryClient()
    const seen: number[] = []
    const data = await client.fetchInfiniteQuery<Page, number>({
      key: () => ['feed'],
      load: async ({ pageParam }) => {
        // Sequential by necessity: a cursor is only known once the page
        // before it has landed.
        seen.push(pageParam)
        return pageSource(5)({ pageParam })
      },
      initialPageParam: 0,
      getNextPageParam: nextParam,
      pages: 2,
    })

    expect(seen).toEqual([0, 1])
    expect(data.pageParams).toEqual([0, 1])
    expect(data.pages.flatMap((page) => page.items)).toEqual([
      'item-0a',
      'item-0b',
      'item-1a',
      'item-1b',
    ])
    client.dispose()
  })

  it('stops early when the source says there is no next page', async () => {
    const client = createQueryClient()
    let loads = 0
    const data = await client.fetchInfiniteQuery<Page, number>({
      key: () => ['feed'],
      load: async ({ pageParam }) => {
        loads += 1
        return pageSource(2)({ pageParam })
      },
      initialPageParam: 0,
      // Asking for more pages than exist is a question, not a mistake.
      getNextPageParam: nextParam,
      pages: 10,
    })

    expect(loads).toBe(2)
    expect(data.pages).toHaveLength(2)
    expect(data.pageParams).toEqual([0, 1])
    client.dispose()
  })

  it('defaults to a single page', async () => {
    const client = createQueryClient()
    let loads = 0
    await client.fetchInfiniteQuery<Page, number>({
      key: () => ['feed'],
      load: async ({ pageParam }) => {
        loads += 1
        return pageSource(9)({ pageParam })
      },
      initialPageParam: 0,
      getNextPageParam: nextParam,
    })

    expect(loads).toBe(1)
    client.dispose()
  })

  it('tells the loader which direction it is extending', async () => {
    const client = createQueryClient()
    const directions: string[] = []
    await client.fetchInfiniteQuery<Page, number>({
      key: () => ['feed'],
      load: async ({ pageParam, direction }) => {
        directions.push(direction)
        return pageSource(4)({ pageParam })
      },
      initialPageParam: 0,
      getNextPageParam: nextParam,
      pages: 3,
    })

    // A run of pages from the start is a series of forward loads, including
    // the first: there is nothing behind it to go backward from.
    expect(directions).toEqual(['forward', 'forward', 'forward'])
    client.dispose()
  })
})

describe('the set as an ordinary cached value', () => {
  it('survives a round trip through dehydrate and hydrate, page params included', async () => {
    const client = createQueryClient()
    const original = await client.fetchInfiniteQuery<Page, number>({
      key: () => ['feed'],
      load: pageSource(4),
      initialPageParam: 0,
      getNextPageParam: nextParam,
      pages: 2,
      snapshot: true,
    })

    const state = client.dehydrate()
    client.dispose()

    const restored = createQueryClient()
    restored.hydrate(state)

    // Both halves of the set cross the boundary: pages without their params
    // would be a set nothing could extend.
    const entry = inspectQueryEntry(restored, ['feed'])
    expect(entry?.data).toEqual(original)
    expect((entry?.data as InfiniteData<Page, number>).pageParams).toEqual([
      0, 1,
    ])
    restored.dispose()
  })

  it('serves a fresh set rather than reloading it', async () => {
    const client = createQueryClient()
    let loads = 0
    const request = {
      key: () => ['feed'],
      load: async ({ pageParam }: { pageParam: number }) => {
        loads += 1
        return pageSource(4)({ pageParam })
      },
      initialPageParam: 0,
      getNextPageParam: nextParam,
      staleTime: 60_000,
    }

    await client.fetchInfiniteQuery<Page, number>(request)
    await client.fetchInfiniteQuery<Page, number>(request)

    expect(loads).toBe(1)
    client.dispose()
  })
})

describe('prefetchQueries', () => {
  it('warms a mixed list of plain and infinite requests', async () => {
    const client = createQueryClient()

    await client.prefetchQueries([
      {
        key: () => ['plain'],
        load: async () => 'a plain value',
      },
      {
        key: () => ['feed'],
        load: pageSource(3),
        initialPageParam: 0,
        getNextPageParam: nextParam,
        pages: 2,
      },
    ])

    // Told apart by `initialPageParam`, which the plain shape declares absent
    // so the narrowing is sound rather than a guess.
    expect(inspectQueryEntry(client, ['plain'])?.data).toBe('a plain value')
    const infinite = inspectQueryEntry(client, ['feed'])?.data as InfiniteData<
      Page,
      number
    >
    expect(infinite.pages).toHaveLength(2)
    expect(infinite.pageParams).toEqual([0, 1])
    client.dispose()
  })
})
