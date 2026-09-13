/**
 * `createInfiniteQueryList` — pagination projected into a signal list (#360).
 *
 * The same relationship `createAsyncStreamList` has to `createAsyncStream`: the
 * primitive underneath produces a value, and this turns it into rows that each
 * own their signal. An append creates row signals only for the new rows, and the
 * rows already on screen are not written at all, because an append carries the
 * pages it already held by reference.
 *
 * A refetch writes every row it is given, and the signals discard the writes
 * that changed nothing — they compare by reference. So "only the rows that
 * changed notify" holds exactly as far as the source's row identities are
 * stable: a loader returning the same objects for unchanged rows costs one
 * notification when one row moves, and one that rebuilds equal-but-new objects
 * notifies every row however little moved. That is the source's property, not
 * this primitive's.
 *
 * `ids` is what a component tracks for structure, and it is rewritten when
 * membership *or order* changes — a reorder is a structural change, since a
 * list rendering from `ids` would otherwise show fresh rows in stale positions.
 */

import {
  createEffect,
  createMemo,
  createSignal,
  createSignalListControls,
  untrack,
} from '@tachui/core'

import { createInfiniteQuery } from './create-infinite-query'
import type {
  InfiniteData,
  InfiniteQueryListOptions,
  InfiniteQueryListResult,
  InfiniteQueryOptions,
} from './types'

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
  const { items, itemKey, trackedRows, ...queryOptions } = options

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

  const controls = createSignalListControls<T, K>([], itemKey, {
    trackedKeys: trackedRows,
  })

  /**
   * Whatever `items` or `itemKey` last threw.
   *
   * Symmetric with how the query beneath reports a throwing page-param
   * function. Both are caller code the primitive has to run to do its job, and
   * letting either take down the effect that flattens the set would leave the
   * list frozen with no way to say why.
   */
  const [projectionError, setProjectionError] = createSignal<E | undefined>(
    undefined
  )

  const flatten = createEffect(() => {
    const data = query.data()
    const rows: T[] = []
    const at = new Map<K, number>()

    try {
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
    } catch (thrown) {
      // The rows already on screen are left alone: a projection that threw
      // halfway through says nothing about the rows it had already produced,
      // and emptying the list would discard them on a guess.
      untrack(() => setProjectionError(() => thrown as E))
      return
    }

    untrack(() => {
      setProjectionError(() => undefined)
    })
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
   * Core's own signal, handed straight on. Wrapping it — in a memo or in a
   * hand-rolled accessor with a `peek` — either loses the brand `isSignal`
   * looks for, which is what `List` consults before it subscribes at all, or
   * adds a layer that notifies on writes the underlying signal skipped.
   */
  const ids = controls.ids

  const {
    data: _data,
    refetch,
    fetchNextPage,
    fetchPreviousPage,
    dispose: disposeQuery,
    ...rest
  } = query
  void _data

  return {
    ...rest,
    dispose: () => {
      // The rows outlive the query otherwise. The observation goes on the
      // owner's cleanup, but an explicit dispose is a caller saying it is done
      // now — and the flatten effect would keep projecting into row signals
      // nobody reads, holding every page object the set ever carried.
      flatten.dispose()
      controls.clear()
      disposeQuery()
    },
    // A real load failure outranks a projection fault: the load error is the
    // one a consumer can act on, and the projection will report itself again
    // on the next write.
    error: createMemo(() => rest.error() ?? projectionError()),
    ids,
    // Tracked, not looked up. The row is subscribed to on its own, so it hears
    // about its own arrival, edit and departure and nothing else — which is why
    // this can be reactive without an append touching every row on screen.
    get: (key: K) => controls.track(key),
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
