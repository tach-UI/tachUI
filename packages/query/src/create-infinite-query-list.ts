/**
 * `createInfiniteQueryList` — pagination projected into a signal list (#360).
 *
 * The same relationship `createAsyncStreamList` has to `createAsyncStream`: the
 * primitive underneath produces a value, and this turns it into rows that each
 * own their signal. An append then creates signals for the new rows only, and a
 * refetch writes only the rows whose data actually changed — signal writes
 * compare by reference, and an append carries the pages it already held by
 * reference, so a list of a thousand rows costs one row write when one row
 * moves.
 *
 * `ids` is what a component tracks for structure. It is rewritten only when
 * membership changes, so growing the set re-renders the list once and editing a
 * row never does.
 */

import { createEffect, createSignalListControls, untrack } from '@tachui/core'

import { createInfiniteQuery } from './create-infinite-query'
import type {
  InfiniteData,
  InfiniteQueryListOptions,
  InfiniteQueryListResult,
  InfiniteQueryOptions,
} from './types'
import type { Signal } from '@tachui/core'

/**
 * Observes an infinite query as a keyed list of rows.
 */
export function createInfiniteQueryList<
  TPage,
  TPageParam,
  T,
  K extends PropertyKey = PropertyKey,
  E = Error,
>(
  options: InfiniteQueryListOptions<TPage, TPageParam, T, K, E>
): InfiniteQueryListResult<T, K, E> {
  const { items, itemKey, ...queryOptions } = options

  const query = createInfiniteQuery<
    TPage,
    TPageParam,
    InfiniteData<TPage, TPageParam>,
    E
  >(
    queryOptions as InfiniteQueryOptions<
      TPage,
      TPageParam,
      InfiniteData<TPage, TPageParam>,
      E
    >
  )

  const controls = createSignalListControls<T, K>([], itemKey)

  /**
   * The keys the list currently holds.
   *
   * Kept alongside the controls so `get` can answer for a key it does not hold
   * without reading `ids` — which would make every row depend on the list's
   * structure, and re-render all of them whenever a page arrives.
   */
  let retained: ReadonlySet<K> = new Set<K>()

  createEffect(() => {
    const data = query.data()
    const rows: T[] = []
    const at = new Map<K, number>()

    for (const page of data?.pages ?? []) {
      for (const item of items(page)) {
        const key = itemKey(item)
        const seen = at.get(key)
        if (seen === undefined) {
          at.set(key, rows.length)
          rows.push(item)
        } else {
          // The same row reached by two pages — a feed that shifted under a
          // cursor, most often. It updates where it already is; a second row
          // with the same identity is not a row, it is a duplicate.
          rows[seen] = item
        }
      }
    }

    retained = new Set(at.keys())
    // Untracked: this effect depends on the set and on nothing else. `set`
    // only writes today, but a dependency picked up from inside core's list
    // would re-run the flatten on a row edit — the one thing rows own signals
    // to avoid.
    untrack(() => {
      controls.set(rows)
    })
  })

  /**
   * The retained keys, in display order.
   *
   * Core's `SignalListControls` types `ids` as a bare accessor even though it
   * is a signal, so the `peek` half is supplied here rather than asserted.
   */
  const ids: Signal<readonly K[]> = Object.assign(() => controls.ids(), {
    peek: () => untrack(() => controls.ids()),
  })

  const { data: _data, refetch, fetchNextPage, fetchPreviousPage, ...rest } = query
  void _data

  return {
    ...rest,
    ids,
    get: (key: K) => (retained.has(key) ? controls.get(key) : undefined),
    // Resolving `void` rather than the set: the rows are the data here, and
    // handing back the pages as well would invite exactly the copy this exists
    // to avoid.
    refetch: async () => {
      await refetch()
    },
    fetchNextPage: async () => {
      await fetchNextPage()
    },
    fetchPreviousPage: async () => {
      await fetchPreviousPage()
    },
  }
}
