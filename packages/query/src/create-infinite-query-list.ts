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
  /**
   * The keys the list currently holds.
   *
   * A plain value, not a signal, and `get` reads it without subscribing. `ids`
   * is the structural signal — a consumer tracks that to learn which rows
   * exist, then looks each one up here. Making `get` reactive was measured to
   * cost exactly what rows own signals for: every consumer holding any row
   * accessor re-ran whenever membership changed anywhere in the set, so an
   * append touched every row on screen.
   */
  let retained: ReadonlySet<K> = new Set<K>()

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
      retained = new Set(at.keys())
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
      // Cleared alongside the signals it indexes: `get` answers from this, and
      // core's `get` throws for a key it no longer holds.
      retained = new Set<K>()
      disposeQuery()
    },
    // A real load failure outranks a projection fault: the load error is the
    // one a consumer can act on, and the projection will report itself again
    // on the next write.
    error: createMemo(() => rest.error() ?? projectionError()),
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
