/**
 * `createInfiniteQueryList` (#360): pagination projected into a signal list.
 *
 * The point of the primitive is what it does *not* do — an append must not
 * touch the rows already on screen, and a refetch that changes one row must not
 * rewrite the structure. These count effect runs rather than inspecting state,
 * because "nothing re-rendered" is the property, and only a subscriber can tell
 * the difference between a signal that was written with an equal value and one
 * that was not written at all.
 */

import { afterEach, describe, expect, it } from 'vitest'

import { createEffect, createRoot, createSignal } from '@tachui/core'

import { createInfiniteQueryList } from '../src/create-infinite-query-list'
import { createQueryClient, resetDefaultQueryClient } from '../src/client'

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

async function settle(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0))
}

interface Row {
  readonly id: string
  readonly label: string
}

interface Page {
  readonly rows: readonly Row[]
  readonly next: number | undefined
  readonly previous: number | undefined
}

const nextParam = (page: Page): number | undefined => page.next
const previousParam = (page: Page): number | undefined => page.previous

/**
 * A paged source that hands back the same row objects until told otherwise.
 *
 * Stability is the point: a reload that produces equal-but-new objects would
 * write every row signal, and the tests below could not tell a surgical update
 * from a wholesale one.
 */
function source(total: number) {
  const rows = new Map<string, Row>()
  const row = (id: string, label: string): Row => {
    const held = rows.get(id)
    if (held !== undefined && held.label === label) {
      return held
    }
    const made = { id, label }
    rows.set(id, made)
    return made
  }
  const labels = new Map<string, string>()

  return {
    /** Replaces one row's label, so the next load returns a new object for it. */
    edit(id: string, label: string): void {
      labels.set(id, label)
    },
    load: async ({ pageParam }: { pageParam: number }): Promise<Page> => ({
      rows: [`${pageParam}a`, `${pageParam}b`].map((id) =>
        row(id, labels.get(id) ?? `row ${id}`)
      ),
      next: pageParam + 1 < total ? pageParam + 1 : undefined,
      previous: pageParam > 0 ? pageParam - 1 : undefined,
    }),
  }
}

/** Counts how many times each subscriber ran, keyed by name. */
function counter() {
  const runs = new Map<string, number>()
  return {
    tick(name: string): void {
      runs.set(name, (runs.get(name) ?? 0) + 1)
    },
    of(name: string): number {
      return runs.get(name) ?? 0
    },
  }
}

describe('appending', () => {
  it('leaves the rows already on screen alone and rewrites ids once', async () => {
    const client = createQueryClient()
    const feed = source(5)
    const seen = counter()

    const { value, dispose } = withOwner(() =>
      createInfiniteQueryList<Page, number, Row, string>({
        key: () => ['feed'],
        load: feed.load,
        initialPageParam: 0,
        getNextPageParam: nextParam,
        items: (page) => page.rows,
        itemKey: (item) => item.id,
        client,
      })
    )
    const watching = withOwner(() => {
      createEffect(() => {
        value.ids()
        seen.tick('ids')
      })
      createEffect(() => {
        value.get('0a')?.()
        seen.tick('row 0a')
      })
    })
    await settle()

    expect(value.ids()).toEqual(['0a', '0b'])
    const idsAfterFirstPage = seen.of('ids')
    const rowAfterFirstPage = seen.of('row 0a')

    await value.fetchNextPage()
    await settle()

    expect(value.ids()).toEqual(['0a', '0b', '1a', '1b'])
    // One structural write for the page, and nothing at all for the rows that
    // were already there.
    expect(seen.of('ids')).toBe(idsAfterFirstPage + 1)
    expect(seen.of('row 0a')).toBe(rowAfterFirstPage)
    expect(value.get('1a')?.()).toEqual({ id: '1a', label: 'row 1a' })

    watching.dispose()
    dispose()
    client.dispose()
  })
})

describe('refetching', () => {
  it('notifies nothing when every row comes back identical', async () => {
    const client = createQueryClient()
    const feed = source(5)
    const seen = counter()

    const { value, dispose } = withOwner(() =>
      createInfiniteQueryList<Page, number, Row, string>({
        key: () => ['feed'],
        load: feed.load,
        initialPageParam: 0,
        getNextPageParam: nextParam,
        items: (page) => page.rows,
        itemKey: (item) => item.id,
        client,
      })
    )
    await settle()
    await value.fetchNextPage()

    const watching = withOwner(() => {
      createEffect(() => {
        value.ids()
        seen.tick('ids')
      })
      for (const id of ['0a', '0b', '1a', '1b']) {
        createEffect(() => {
          value.get(id)?.()
          seen.tick(id)
        })
      }
    })

    await value.refetch()
    await settle()

    expect(seen.of('ids')).toBe(1)
    for (const id of ['0a', '0b', '1a', '1b']) {
      expect(seen.of(id)).toBe(1)
    }

    watching.dispose()
    dispose()
    client.dispose()
  })

  it('writes only the row that changed, and leaves ids untouched', async () => {
    const client = createQueryClient()
    const feed = source(5)
    const seen = counter()

    const { value, dispose } = withOwner(() =>
      createInfiniteQueryList<Page, number, Row, string>({
        key: () => ['feed'],
        load: feed.load,
        initialPageParam: 0,
        getNextPageParam: nextParam,
        items: (page) => page.rows,
        itemKey: (item) => item.id,
        client,
      })
    )
    await settle()
    await value.fetchNextPage()

    const watching = withOwner(() => {
      createEffect(() => {
        value.ids()
        seen.tick('ids')
      })
      for (const id of ['0a', '0b', '1a', '1b']) {
        createEffect(() => {
          value.get(id)?.()
          seen.tick(id)
        })
      }
    })

    feed.edit('1a', 'edited')
    await value.refetch()
    await settle()

    expect(value.get('1a')?.().label).toBe('edited')
    expect(seen.of('1a')).toBe(2)
    // Membership did not change, so the structure was never rewritten and the
    // other three rows were never told anything.
    expect(seen.of('ids')).toBe(1)
    expect(seen.of('0a')).toBe(1)
    expect(seen.of('0b')).toBe(1)
    expect(seen.of('1b')).toBe(1)

    watching.dispose()
    dispose()
    client.dispose()
  })
})

describe('rows that repeat across pages', () => {
  it('updates the row in place and holds the key once', async () => {
    const client = createQueryClient()
    const seen = counter()
    // A feed that shifted under the cursor: page 1 carries a row page 0
    // already had, with newer content.
    const load = async ({ pageParam }: { pageParam: number }): Promise<Page> =>
      pageParam === 0
        ? {
            rows: [
              { id: 'a', label: 'first' },
              { id: 'b', label: 'second' },
            ],
            next: 1,
            previous: undefined,
          }
        : {
            rows: [
              { id: 'b', label: 'second, revised' },
              { id: 'c', label: 'third' },
            ],
            next: undefined,
            previous: 0,
          }

    const { value, dispose } = withOwner(() =>
      createInfiniteQueryList<Page, number, Row, string>({
        key: () => ['feed'],
        load,
        initialPageParam: 0,
        getNextPageParam: nextParam,
        items: (page) => page.rows,
        itemKey: (item) => item.id,
        client,
      })
    )
    await settle()
    // Subscribed once the row exists: `get` answers for the keys the list
    // holds now, which is what a component reading `ids` has in hand.
    const watching = withOwner(() => {
      createEffect(() => {
        value.get('b')?.()
        seen.tick('b')
      })
    })

    await value.fetchNextPage()
    await settle()

    // Once in the list, at the position it already had.
    expect(value.ids()).toEqual(['a', 'b', 'c'])
    expect(value.get('b')?.().label).toBe('second, revised')
    expect(seen.of('b')).toBe(2)

    watching.dispose()
    dispose()
    client.dispose()
  })
})

describe('rows the list no longer holds', () => {
  it('returns undefined for a key maxPages dropped', async () => {
    const client = createQueryClient()
    const feed = source(9)

    const { value, dispose } = withOwner(() =>
      createInfiniteQueryList<Page, number, Row, string>({
        key: () => ['feed'],
        load: feed.load,
        initialPageParam: 0,
        getNextPageParam: nextParam,
        getPreviousPageParam: previousParam,
        maxPages: 2,
        items: (page) => page.rows,
        itemKey: (item) => item.id,
        client,
      })
    )
    await settle()
    await value.fetchNextPage()
    expect(value.get('0a')).toBeDefined()

    await value.fetchNextPage()
    await settle()

    // The cap dropped the head page, and with it the rows it carried.
    expect(value.ids()).toEqual(['1a', '1b', '2a', '2b'])
    expect(value.get('0a')).toBeUndefined()
    expect(value.get('2a')?.().id).toBe('2a')

    await value.fetchPreviousPage()
    await settle()

    expect(value.ids()).toEqual(['0a', '0b', '1a', '1b'])
    expect(value.get('0a')?.().id).toBe('0a')
    expect(value.get('2a')).toBeUndefined()

    dispose()
    client.dispose()
  })
})

describe('what it reports about the query beneath it', () => {
  it('mirrors status, error, and the page flags', async () => {
    const client = createQueryClient()
    const [failing, setFailing] = createSignal(false)
    const feed = source(3)
    let release: ((page: Page) => void) | undefined

    const { value, dispose } = withOwner(() =>
      createInfiniteQueryList<Page, number, Row, string>({
        key: () => ['feed'],
        load: ({ pageParam }) => {
          if (failing()) {
            return Promise.reject(new Error('page unavailable'))
          }
          if (pageParam === 1) {
            return new Promise<Page>((resolve) => {
              release = resolve
            })
          }
          return feed.load({ pageParam })
        },
        initialPageParam: 0,
        getNextPageParam: nextParam,
        items: (page) => page.rows,
        itemKey: (item) => item.id,
        client,
      })
    )
    await settle()

    expect(value.status()).toBe('success')
    expect(value.hasNextPage()).toBe(true)
    expect(value.isFetchingNextPage()).toBe(false)

    const appended = value.fetchNextPage()
    await settle()
    expect(value.isFetchingNextPage()).toBe(true)
    expect(value.isFetching()).toBe(true)

    release?.(await feed.load({ pageParam: 1 }))
    await appended
    expect(value.isFetchingNextPage()).toBe(false)
    expect(value.ids()).toHaveLength(4)

    setFailing(true)
    await expect(value.refetch()).rejects.toThrow('page unavailable')
    await settle()

    expect(value.status()).toBe('error')
    expect((value.error() as Error).message).toBe('page unavailable')
    // The rows stay: a failed refresh is not a reason to empty the screen.
    expect(value.ids()).toHaveLength(4)

    dispose()
    client.dispose()
  })
})
