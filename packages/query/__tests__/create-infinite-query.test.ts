/**
 * `createInfiniteQuery` (#359): pages accumulated into one cache entry.
 *
 * These pin the behaviour that pagination adds on top of the observer it is
 * built on — appending through the loader path, sequential refetch of the held
 * pages, the concurrency rules between an append and a refresh, `maxPages`
 * trimming, and the observer-local direction flags — plus the things it must
 * keep from `createQuery`: cancellation, retry, key changes, and the hydration
 * grace.
 */

import { afterEach, describe, expect, it, vi } from 'vitest'

import { createRoot, createSignal } from '@tachui/core'

import { createInfiniteQuery } from '../src/create-infinite-query'
import {
  createQueryClient,
  inspectQueryEntry,
  resetDefaultQueryClient,
} from '../src/client'
import type { InfiniteData } from '../src/types'

afterEach(() => {
  resetDefaultQueryClient()
})

/** Runs a body inside a root, handing back its dispose. */
function withOwner<T>(body: () => T): { value: T; dispose: () => void } {
  let value!: T
  let dispose!: () => void
  createRoot((disposeRoot) => {
    dispose = disposeRoot
    value = body()
  })
  return { value, dispose }
}

/**
 * Lets the loader, the cache's write-back chain, and any retry delay run.
 * A macrotask turn drains the microtask queue behind it, which a fixed number
 * of `Promise.resolve()` ticks does not.
 */
async function settle(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0))
}

interface Page {
  readonly at: number
  readonly items: readonly string[]
  readonly next: number | undefined
  readonly previous: number | undefined
}

/** A source of `total` pages, two items each, numbered from zero. */
function pages(total: number, revision = 'a') {
  return async ({ pageParam }: { pageParam: number }): Promise<Page> => ({
    at: pageParam,
    items: [`${revision}-${pageParam}-0`, `${revision}-${pageParam}-1`],
    next: pageParam + 1 < total ? pageParam + 1 : undefined,
    previous: pageParam > 0 ? pageParam - 1 : undefined,
  })
}

const nextParam = (page: Page): number | undefined => page.next
const previousParam = (page: Page): number | undefined => page.previous

/** The raw set the cache holds, bypassing any projection. */
function heldSet(
  client: ReturnType<typeof createQueryClient>,
  key: readonly unknown[]
): InfiniteData<Page, number> | undefined {
  return inspectQueryEntry(client, key)?.data as
    | InfiniteData<Page, number>
    | undefined
}

describe('appending pages', () => {
  it('adds one page and one param, leaving the pages already held untouched', async () => {
    const client = createQueryClient()
    const { value, dispose } = withOwner(() =>
      createInfiniteQuery<Page, number>({
        key: () => ['feed'],
        load: pages(5),
        initialPageParam: 0,
        getNextPageParam: nextParam,
        client,
      })
    )
    await settle()

    const first = value.data() as InfiniteData<Page, number>
    expect(first.pages).toHaveLength(1)
    expect(value.hasNextPage()).toBe(true)

    await value.fetchNextPage()

    const second = value.data() as InfiniteData<Page, number>
    expect(second.pages).toHaveLength(2)
    expect(second.pageParams).toEqual([0, 1])
    // By reference, not merely by value: a row projection leaves untouched
    // rows alone only because the page objects behind them do not churn.
    expect(second.pages[0]).toBe(first.pages[0])
    dispose()
    client.dispose()
  })

  it('goes through the loader path, so the entry is what holds the set', async () => {
    const client = createQueryClient()
    const { value, dispose } = withOwner(() =>
      createInfiniteQuery<Page, number>({
        key: () => ['feed'],
        load: pages(5),
        initialPageParam: 0,
        getNextPageParam: nextParam,
        client,
      })
    )
    await settle()
    await value.fetchNextPage()

    expect(heldSet(client, ['feed'])?.pages).toHaveLength(2)
    expect(value.status()).toBe('success')
    expect(value.fetchStatus()).toBe('idle')
    dispose()
    client.dispose()
  })

  it('reports the direction only to the observer that asked', async () => {
    const client = createQueryClient()
    let release!: (page: Page) => void
    const { value, dispose } = withOwner(() =>
      createInfiniteQuery<Page, number>({
        key: () => ['feed'],
        load: ({ pageParam }) =>
          pageParam === 0
            ? pages(5)({ pageParam })
            : new Promise<Page>((resolve) => {
                release = resolve
              }),
        initialPageParam: 0,
        getNextPageParam: nextParam,
        client,
      })
    )
    const other = withOwner(() =>
      createInfiniteQuery<Page, number>({
        key: () => ['feed'],
        load: pages(5),
        initialPageParam: 0,
        getNextPageParam: nextParam,
        client,
      })
    )
    await settle()

    const appended = value.fetchNextPage()
    await settle()
    expect(value.isFetchingNextPage()).toBe(true)
    expect(value.isFetchingPreviousPage()).toBe(false)
    // The entry is shared, the intent is not: the second observer never asked
    // for this page and must not report that it is loading one.
    expect(other.value.isFetching()).toBe(true)
    expect(other.value.isFetchingNextPage()).toBe(false)

    release(await pages(5)({ pageParam: 1 }))
    await appended
    expect(value.isFetchingNextPage()).toBe(false)
    other.dispose()
    dispose()
    client.dispose()
  })

  it('resolves with the current data and starts nothing once the set is complete', async () => {
    const client = createQueryClient()
    let loads = 0
    const { value, dispose } = withOwner(() =>
      createInfiniteQuery<Page, number>({
        key: () => ['feed'],
        load: ({ pageParam }) => {
          loads += 1
          return pages(1)({ pageParam })
        },
        initialPageParam: 0,
        getNextPageParam: nextParam,
        client,
      })
    )
    await settle()
    expect(loads).toBe(1)
    expect(value.hasNextPage()).toBe(false)

    const resolved = (await value.fetchNextPage()) as InfiniteData<Page, number>

    expect(loads).toBe(1)
    expect(resolved).toBe(value.data())
    expect(resolved.pages).toHaveLength(1)
    dispose()
    client.dispose()
  })
})

describe('refetching a set', () => {
  it('reloads the held pages in sequence and swaps them in one write', async () => {
    const client = createQueryClient()
    const asked: number[] = []
    const [revision, setRevision] = createSignal('a')
    // Held open on request, so the assertions can land while the replacement
    // is genuinely mid-flight rather than betting on a scheduling order.
    let openGate: (() => void) | undefined
    let gate: Promise<void> | undefined
    const { value, dispose } = withOwner(() =>
      createInfiniteQuery<Page, number>({
        key: () => ['feed'],
        load: async ({ pageParam }) => {
          asked.push(pageParam)
          if (gate !== undefined) {
            await gate
          }
          return pages(5, revision())({ pageParam })
        },
        initialPageParam: 0,
        getNextPageParam: nextParam,
        client,
      })
    )
    await settle()
    await value.fetchNextPage()
    await value.fetchNextPage()
    expect(asked).toEqual([0, 1, 2])

    const before = value.data() as InfiniteData<Page, number>
    setRevision('b')
    asked.length = 0
    gate = new Promise<void>((resolve) => {
      openGate = resolve
    })

    const seen: number[] = []
    const refetched = value.refetch().then((data) => {
      seen.push((data as InfiniteData<Page, number>).pages.length)
      return data
    })
    await settle()
    // Old pages keep rendering while the replacement loads: the entry stays
    // `success` and only `fetchStatus` moves.
    expect(value.data()).toBe(before)
    expect(value.status()).toBe('success')
    expect(value.isFetching()).toBe(true)

    gate = undefined
    openGate?.()
    await refetched
    // Every held page reloaded, front to back, each result feeding the next.
    expect(asked).toEqual([0, 1, 2])
    expect(seen).toEqual([3])
    const after = value.data() as InfiniteData<Page, number>
    expect(after.pages.map((page) => page.items[0])).toEqual([
      'b-0-0',
      'b-1-0',
      'b-2-0',
    ])
    dispose()
    client.dispose()
  })

  it('starts a refetch from the first held param, not from initialPageParam', async () => {
    const client = createQueryClient()
    const asked: number[] = []
    const { value, dispose } = withOwner(() =>
      createInfiniteQuery<Page, number>({
        key: () => ['feed'],
        load: ({ pageParam }) => {
          asked.push(pageParam)
          return pages(9)({ pageParam })
        },
        initialPageParam: 0,
        getNextPageParam: nextParam,
        getPreviousPageParam: previousParam,
        maxPages: 2,
        client,
      })
    )
    await settle()
    await value.fetchNextPage()
    await value.fetchNextPage()
    // Three pages were loaded, the cap is two, so the set now begins at one.
    expect((value.data() as InfiniteData<Page, number>).pageParams).toEqual([
      1, 2,
    ])

    asked.length = 0
    await value.refetch()

    expect(asked).toEqual([1, 2])
    dispose()
    client.dispose()
  })

  it('stops short when the source has fewer pages than were held', async () => {
    const client = createQueryClient()
    const [total, setTotal] = createSignal(4)
    const { value, dispose } = withOwner(() =>
      createInfiniteQuery<Page, number>({
        key: () => ['feed'],
        load: ({ pageParam }) => pages(total())({ pageParam }),
        initialPageParam: 0,
        getNextPageParam: nextParam,
        client,
      })
    )
    await settle()
    await value.fetchNextPage()
    await value.fetchNextPage()
    expect((value.data() as InfiniteData<Page, number>).pages).toHaveLength(3)

    setTotal(2)
    await value.refetch()

    const after = value.data() as InfiniteData<Page, number>
    expect(after.pages).toHaveLength(2)
    expect(after.pageParams).toEqual([0, 1])
    expect(value.hasNextPage()).toBe(false)
    dispose()
    client.dispose()
  })
})

describe('an append racing something else', () => {
  it('is dropped by an invalidation that overtakes it, and a full refetch follows', async () => {
    const client = createQueryClient()
    const asked: number[] = []
    let release!: (page: Page) => void
    let held = false
    const { value, dispose } = withOwner(() =>
      createInfiniteQuery<Page, number>({
        key: () => ['feed'],
        load: ({ pageParam }) => {
          asked.push(pageParam)
          if (pageParam === 1 && !held) {
            held = true
            return new Promise<Page>((resolve) => {
              release = resolve
            })
          }
          return pages(5)({ pageParam })
        },
        initialPageParam: 0,
        getNextPageParam: nextParam,
        client,
      })
    )
    await settle()
    asked.length = 0

    const appended = value.fetchNextPage()
    await settle()
    expect(asked).toEqual([1])

    client.invalidate(['feed'])
    release(await pages(5)({ pageParam: 1 }))
    await appended
    await settle()

    // The append landed into a superseded generation, so it wrote nothing; the
    // entry was left marked, and the observer reloaded it from the front.
    expect(asked).toEqual([1, 0])
    const after = value.data() as InfiniteData<Page, number>
    expect(after.pages).toHaveLength(1)
    expect(after.pageParams).toEqual([0])
    dispose()
    client.dispose()
  })

  it('joins an identical append already in flight rather than loading twice', async () => {
    const client = createQueryClient()
    let loads = 0
    let release!: (page: Page) => void
    const { value, dispose } = withOwner(() =>
      createInfiniteQuery<Page, number>({
        key: () => ['feed'],
        load: ({ pageParam }) => {
          loads += 1
          return pageParam === 0
            ? pages(5)({ pageParam })
            : new Promise<Page>((resolve) => {
                release = resolve
              })
        },
        initialPageParam: 0,
        getNextPageParam: nextParam,
        client,
      })
    )
    await settle()
    loads = 0

    const first = value.fetchNextPage()
    const second = value.fetchNextPage()
    await settle()
    expect(loads).toBe(1)

    release(await pages(5)({ pageParam: 1 }))
    const [a, b] = await Promise.all([first, second])

    expect(loads).toBe(1)
    expect(a).toBe(b)
    expect((a as InfiniteData<Page, number>).pages).toHaveLength(2)
    dispose()
    client.dispose()
  })

  it('waits for a refresh in flight, then appends onto what the refresh left', async () => {
    const client = createQueryClient()
    const asked: number[] = []
    let release!: (page: Page) => void
    let holding = false
    const { value, dispose } = withOwner(() =>
      createInfiniteQuery<Page, number>({
        key: () => ['feed'],
        load: ({ pageParam }) => {
          asked.push(pageParam)
          if (holding) {
            return new Promise<Page>((resolve) => {
              release = resolve
            })
          }
          return pages(5)({ pageParam })
        },
        initialPageParam: 0,
        getNextPageParam: nextParam,
        client,
      })
    )
    await settle()
    asked.length = 0

    holding = true
    const refreshed = value.refetch()
    // No settle between them: the append is issued in the same tick as the
    // refresh, which is what a component firing both from one handler does.
    // The derived `isFetching` memo is not dirtied synchronously, so a guard
    // reading it here sees `false` and skips the wait entirely.
    const appended = value.fetchNextPage()
    await settle()
    expect(asked).toEqual([0])
    // Nothing started alongside the refresh, and the refresh was not cancelled.
    expect(asked).toEqual([0])

    holding = false
    release(await pages(5)({ pageParam: 0 }))
    await refreshed
    await appended

    expect(asked).toEqual([0, 1])
    expect((value.data() as InfiniteData<Page, number>).pageParams).toEqual([
      0, 1,
    ])
    dispose()
    client.dispose()
  })
})

describe('maxPages', () => {
  it('trims the far end on append and lets fetchPreviousPage recover the head', async () => {
    const client = createQueryClient()
    const { value, dispose } = withOwner(() =>
      createInfiniteQuery<Page, number>({
        key: () => ['feed'],
        load: pages(9),
        initialPageParam: 0,
        getNextPageParam: nextParam,
        getPreviousPageParam: previousParam,
        maxPages: 2,
        client,
      })
    )
    await settle()
    await value.fetchNextPage()
    await value.fetchNextPage()

    const trimmed = value.data() as InfiniteData<Page, number>
    expect(trimmed.pageParams).toEqual([1, 2])
    expect(value.hasPreviousPage()).toBe(true)

    await value.fetchPreviousPage()

    const recovered = value.data() as InfiniteData<Page, number>
    // Grown at the front, trimmed at the back: the head is back and the cap
    // still holds.
    expect(recovered.pageParams).toEqual([0, 1])
    expect(recovered.pages).toHaveLength(2)
    dispose()
    client.dispose()
  })

  it('reports no previous page at the front of the set', async () => {
    const client = createQueryClient()
    const { value, dispose } = withOwner(() =>
      createInfiniteQuery<Page, number>({
        key: () => ['feed'],
        load: pages(9),
        initialPageParam: 0,
        getNextPageParam: nextParam,
        getPreviousPageParam: previousParam,
        maxPages: 3,
        client,
      })
    )
    await settle()

    expect(value.hasPreviousPage()).toBe(false)
    const resolved = await value.fetchPreviousPage()
    expect((resolved as InfiniteData<Page, number>).pages).toHaveLength(1)
    dispose()
    client.dispose()
  })
})

describe('failure', () => {
  it('keeps the pages, reports the error, and still offers the next page', async () => {
    const client = createQueryClient()
    let fail = false
    const { value, dispose } = withOwner(() =>
      createInfiniteQuery<Page, number>({
        key: () => ['feed'],
        load: ({ pageParam }) =>
          fail
            ? Promise.reject(new Error('page unavailable'))
            : pages(5)({ pageParam }),
        initialPageParam: 0,
        getNextPageParam: nextParam,
        client,
      })
    )
    await settle()
    const before = value.data() as InfiniteData<Page, number>

    fail = true
    await expect(value.fetchNextPage()).rejects.toThrow('page unavailable')
    await settle()

    expect(value.data()).toBe(before)
    expect(value.error()).toBeInstanceOf(Error)
    expect(value.status()).toBe('error')
    // The page is still out there; the request for it failed.
    expect(value.hasNextPage()).toBe(true)
    dispose()
    client.dispose()
  })

  it('reports a throwing getNextPageParam instead of throwing out of a memo', async () => {
    const client = createQueryClient()
    let asked = 0
    const { value, dispose } = withOwner(() =>
      createInfiniteQuery<Page, number>({
        key: () => ['feed'],
        load: pages(5),
        initialPageParam: 0,
        getNextPageParam: () => {
          // Lands the first page, then throws when the memo asks where the set
          // ends — so the failure happens on the read path a render takes,
          // which is the path under test.
          asked += 1
          if (asked === 1) {
            return undefined
          }
          throw new Error('cursor is not a number')
        },
        client,
      })
    )
    await settle()
    expect(value.status()).toBe('success')

    // Reading it is what a render does, and a render must not be taken down by
    // a page-param function.
    expect(() => value.hasNextPage()).not.toThrow()
    expect(value.hasNextPage()).toBe(false)
    const reported = value.error() as Error
    expect(reported.message).toContain('a page-param function threw')
    expect((reported.cause as Error).message).toBe('cursor is not a number')
    dispose()
    client.dispose()
  })

  it('lets a real load failure outrank a throwing page-param function', async () => {
    const client = createQueryClient()
    let failing = false
    const { value, dispose } = withOwner(() =>
      createInfiniteQuery<Page, number>({
        key: () => ['feed'],
        load: ({ pageParam }) =>
          failing
            ? Promise.reject(new Error('the feed is down'))
            : pages(5)({ pageParam }),
        initialPageParam: 0,
        getNextPageParam: (page) => {
          if (failing) {
            throw new Error('cursor is not a number')
          }
          return page.next
        },
        client,
      })
    )
    await settle()

    failing = true
    await expect(value.refetch()).rejects.toThrow('the feed is down')
    await settle()

    // The load failure is the one a consumer can act on; the param fault will
    // report itself again the moment anything reads the ends.
    expect((value.error() as Error).message).toBe('the feed is down')
    dispose()
    client.dispose()
  })

  it('does not retry a page-param fault the way it retries a load', async () => {
    const client = createQueryClient()
    let loads = 0
    const { value, dispose } = withOwner(() =>
      createInfiniteQuery<Page, number>({
        key: () => ['feed'],
        load: ({ pageParam }) => {
          loads += 1
          return pages(5)({ pageParam })
        },
        initialPageParam: 0,
        getNextPageParam: () => {
          throw new Error('cursor is not a number')
        },
        retry: 2,
        client,
      })
    )
    await settle()

    // One attempt, not three: the same input throws the same way every time,
    // so a retry spends the policy to arrive at the same error more slowly.
    expect(loads).toBe(1)
    expect(value.status()).toBe('error')
    dispose()
    client.dispose()
  })
})

describe('the entry a load is writing', () => {
  it('builds the new key\'s set from the new key, not from the old one', async () => {
    const client = createQueryClient()
    const [feed, setFeed] = createSignal('a')
    const { value, dispose } = withOwner(() =>
      createInfiniteQuery<Page, number>({
        key: () => ['feed', feed()],
        load: async ({ pageParam, key }) => ({
          at: pageParam,
          items: [`${String(key[1])}-${pageParam}`],
          next: pageParam + 1 < 9 ? pageParam + 1 : undefined,
          previous: pageParam > 0 ? pageParam - 1 : undefined,
        }),
        initialPageParam: 0,
        getNextPageParam: nextParam,
        client,
      })
    )
    await settle()
    await value.fetchNextPage()
    await value.fetchNextPage()

    // Appended in the same tick as the key change. The effect that follows a
    // key change is scheduled, so the observer still publishes feed a's set
    // while the key already reads feed b.
    setFeed('b')
    await value.fetchNextPage()
    await settle()

    const moved = inspectQueryEntry(client, ['feed', 'b'])?.data as InfiniteData<
      Page,
      number
    >
    expect(moved.pages.flatMap((page) => page.items)).toEqual(['b-0'])
    expect(moved.pageParams).toEqual([0])

    // And the key being left keeps what it had.
    const left = inspectQueryEntry(client, ['feed', 'a'])?.data as InfiniteData<
      Page,
      number
    >
    expect(left.pages.flatMap((page) => page.items)).toEqual([
      'a-0',
      'a-1',
      'a-2',
    ])
    dispose()
    client.dispose()
  })

  it('does not truncate a shared set on behalf of a gated observer', async () => {
    const client = createQueryClient()
    const watcher = withOwner(() =>
      createInfiniteQuery<Page, number>({
        key: () => ['feed'],
        load: pages(9),
        initialPageParam: 0,
        getNextPageParam: nextParam,
        client,
      })
    )
    await settle()
    await watcher.value.fetchNextPage()
    await watcher.value.fetchNextPage()
    expect(
      (watcher.value.data() as InfiniteData<Page, number>).pages
    ).toHaveLength(3)

    // A gated observer has no data of its own, and refetching through it must
    // reload the entry's three pages rather than the observer's nothing.
    const gated = withOwner(() =>
      createInfiniteQuery<Page, number>({
        key: () => ['feed'],
        load: pages(9),
        initialPageParam: 0,
        getNextPageParam: nextParam,
        enabled: false,
        client,
      })
    )
    await settle()
    await gated.value.refetch()
    await settle()

    expect(
      (watcher.value.data() as InfiniteData<Page, number>).pageParams
    ).toEqual([0, 1, 2])
    gated.dispose()
    watcher.dispose()
    client.dispose()
  })
})

describe('what it keeps from the observer beneath it', () => {
  it('shares one entry between observers with different projections', async () => {
    const client = createQueryClient()
    let loads = 0
    const counted = vi.fn(
      (data: InfiniteData<Page, number>) => data.pages.length
    )
    const request = {
      key: () => ['feed'],
      load: ({ pageParam }: { pageParam: number }) => {
        loads += 1
        return pages(5)({ pageParam })
      },
      initialPageParam: 0,
      getNextPageParam: nextParam,
      client,
    }

    const counts = withOwner(() =>
      createInfiniteQuery<Page, number, number>({
        ...request,
        select: counted,
      })
    )
    const items = withOwner(() =>
      createInfiniteQuery<Page, number, readonly string[]>({
        ...request,
        select: (data) => data.pages.flatMap((page) => page.items),
      })
    )
    await settle()

    expect(loads).toBe(1)
    expect(counts.value.data()).toBe(1)
    expect(items.value.data()).toHaveLength(2)

    await counts.value.fetchNextPage()
    await settle()

    expect(loads).toBe(2)
    expect(counts.value.data()).toBe(2)
    expect(items.value.data()).toHaveLength(4)
    // One write, one projection per observer: reading again does not re-run it.
    expect(counted).toHaveBeenCalledTimes(2)
    counts.value.data()
    expect(counted).toHaveBeenCalledTimes(2)

    items.dispose()
    counts.dispose()
    client.dispose()
  })

  it('aborts the page in flight on cancel() and on owner disposal', async () => {
    const client = createQueryClient()
    const aborted: number[] = []
    const { value, dispose } = withOwner(() =>
      createInfiniteQuery<Page, number>({
        key: () => ['feed'],
        load: ({ pageParam, signal }) => {
          if (pageParam === 0) {
            return pages(5)({ pageParam })
          }
          signal.addEventListener('abort', () => aborted.push(pageParam))
          return new Promise<Page>(() => {
            // never settles: the abort is what ends it
          })
        },
        initialPageParam: 0,
        getNextPageParam: nextParam,
        client,
      })
    )
    await settle()

    void value.fetchNextPage()
    await settle()
    value.cancel()
    expect(aborted).toEqual([1])

    void value.fetchNextPage()
    await settle()
    dispose()
    expect(aborted).toEqual([1, 1])
    client.dispose()
  })

  it('retries an append as an append, not as a refetch', async () => {
    const client = createQueryClient()
    const asked: number[] = []
    let failures = 2
    const { value, dispose } = withOwner(() =>
      createInfiniteQuery<Page, number>({
        key: () => ['feed'],
        load: ({ pageParam }) => {
          asked.push(pageParam)
          if (pageParam === 1 && failures > 0) {
            failures -= 1
            return Promise.reject(new Error('flaky'))
          }
          return pages(5)({ pageParam })
        },
        initialPageParam: 0,
        getNextPageParam: nextParam,
        retry: 2,
        client,
      })
    )
    await settle()
    asked.length = 0

    await value.fetchNextPage()

    // Three attempts, all of them for the page being appended: a retry that
    // reverted to the query's own loader would have asked for page 0.
    expect(asked).toEqual([1, 1, 1])
    expect((value.data() as InfiniteData<Page, number>).pageParams).toEqual([
      0, 1,
    ])
    dispose()
    client.dispose()
  })

  it('starts the new key from its first page, keeping the old set on screen', async () => {
    const client = createQueryClient()
    const aborted: string[] = []
    const [feed, setFeed] = createSignal('a')
    let holding = true
    const { value, dispose } = withOwner(() =>
      createInfiniteQuery<Page, number>({
        key: () => ['feed', feed()],
        load: ({ pageParam, key, signal }) => {
          if (key[1] === 'b' && holding) {
            signal.addEventListener('abort', () => aborted.push('b'))
            return new Promise<Page>(() => {
              // never settles until the key moves on again
            })
          }
          return pages(5)({ pageParam })
        },
        initialPageParam: 0,
        getNextPageParam: nextParam,
        placeholderData: (previous) => previous,
        client,
      })
    )
    await settle()
    await value.fetchNextPage()
    const original = value.data() as InfiniteData<Page, number>
    expect(original.pages).toHaveLength(2)

    setFeed('b')
    await settle()
    // Nothing cached for the new key yet, so the previous set keeps rendering.
    expect(value.data()).toBe(original)
    expect(value.isFetching()).toBe(true)

    setFeed('c')
    await settle()
    expect(aborted).toEqual(['b'])
    // The new key starts from the first page rather than inheriting a cursor.
    const fresh = value.data() as InfiniteData<Page, number>
    expect(fresh.pageParams).toEqual([0])
    dispose()
    client.dispose()
  })

  it('does not refetch a hydrated set on first observe', async () => {
    const server = createQueryClient()
    await server.fetchInfiniteQuery<Page, number>({
      key: () => ['feed'],
      load: pages(5),
      initialPageParam: 0,
      getNextPageParam: nextParam,
      pages: 2,
      snapshot: true,
    })
    const state = server.dehydrate()
    server.dispose()

    const client = createQueryClient()
    client.hydrate(state)
    let loads = 0
    const { value, dispose } = withOwner(() =>
      createInfiniteQuery<Page, number>({
        key: () => ['feed'],
        load: ({ pageParam }) => {
          loads += 1
          return pages(5)({ pageParam })
        },
        initialPageParam: 0,
        getNextPageParam: nextParam,
        client,
      })
    )
    await settle()

    expect(loads).toBe(0)
    const hydrated = value.data() as InfiniteData<Page, number>
    expect(hydrated.pageParams).toEqual([0, 1])
    // And the set is extendable from what crossed the boundary.
    expect(value.hasNextPage()).toBe(true)
    dispose()
    client.dispose()
  })
})
