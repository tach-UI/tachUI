/**
 * `createInfiniteQuery` — the accumulating pagination primitive (#359).
 *
 * Built on `createQuery`'s observer rather than beside it. Retention,
 * cancellation, freshness, the hydration grace and key changes are hard to get
 * right once; writing them a second time for pages would mean two places to
 * keep correct, and one of them would drift.
 *
 * What pagination adds is the shape of the value and who decides what to load
 * next. One entry holds `InfiniteData<TPage, TPageParam>` under the base key —
 * pages are never separate entries, because cursors chain and a per-page entry
 * could refetch with a stale token, be evicted from the middle of a set, or
 * dehydrate half of one.
 *
 * Every write goes through the loader path. An append is an ordinary cache
 * execution whose loader fetches one page and returns the merged set, so the
 * entry's generation guard drops an append that an invalidation overtook, and
 * no cache-write primitive has to exist. A refetch reloads the pages that are
 * held, in sequence, and swaps the set in one write — the old pages keep
 * rendering while it runs, because the entry stays `success` while `fetching`.
 */

import { createMemo, createSignal, untrack } from '@tachui/core'

import { createQueryInternals } from './create-query'
import type {
  InternalLoadContext,
  InternalQueryOptions,
  QueryLoadIntent,
} from './create-query'
import type {
  FetchDirection,
  GetPageParam,
  InfiniteData,
  InfiniteQueryOptions,
  InfiniteQueryOptionsBase,
  InfiniteQueryResult,
} from './types'

/** A query that has never loaded, so that "no pages" needs no special case. */
const EMPTY: InfiniteData<never, never> = { pages: [], pageParams: [] }

/** The options a primitive reads, with the parts the public union hides. */
type ResolvedOptions<TPage, TPageParam, TData, E> = InfiniteQueryOptionsBase<
  TPage,
  TPageParam,
  TData,
  E
> & {
  getPreviousPageParam?: GetPageParam<TPage, TPageParam>
  maxPages?: number
  select?: (data: InfiniteData<TPage, TPageParam>) => TData
}

function emptySet<TPage, TPageParam>(): InfiniteData<TPage, TPageParam> {
  return EMPTY as InfiniteData<TPage, TPageParam>
}

/**
 * The param that would extend a set at one end, or `undefined` for neither.
 *
 * Asked of raw pages only. `getNextPageParam` is defined over pages and their
 * params, so whatever `select` projected is never handed to it.
 */
function paramBeyond<TPage, TPageParam>(
  data: InfiniteData<TPage, TPageParam> | undefined,
  get: GetPageParam<TPage, TPageParam> | undefined,
  end: FetchDirection
): TPageParam | undefined {
  if (get === undefined || data === undefined || data.pages.length === 0) {
    return undefined
  }
  const index = end === 'forward' ? data.pages.length - 1 : 0
  return get(
    data.pages[index] as TPage,
    data.pages,
    data.pageParams[index] as TPageParam,
    data.pageParams
  )
}

/**
 * Observes an infinite query, accumulating its pages into one cached set.
 */
export function createInfiniteQuery<
  TPage,
  TPageParam,
  TData = InfiniteData<TPage, TPageParam>,
  E = Error,
>(
  options: InfiniteQueryOptions<TPage, TPageParam, TData, E>
): InfiniteQueryResult<TData, E> {
  const base = options as ResolvedOptions<TPage, TPageParam, TData, E>

  /**
   * Which direction *this observer* asked for, if any.
   *
   * Observer-local on purpose: an entry is shared, and a second observer of it
   * did not ask for this page. That one sees `isFetching`, which is true, and
   * not `isFetchingNextPage`, which for it is not.
   */
  const [direction, setDirection] = createSignal<FetchDirection | undefined>(
    undefined
  )

  /**
   * Reloads the pages that are held, front to back.
   *
   * This is the query's own loader — what runs whenever anything other than an
   * append asks for a reload: an invalidation, a stale window elapsing, a key
   * change, `refetch()`. Sequential by necessity rather than by choice, since
   * a cursor is only known once the page before it has landed.
   */
  const refetchPages: QueryLoadIntent<InfiniteData<TPage, TPageParam>> = async (
    ctx: InternalLoadContext<InfiniteData<TPage, TPageParam>>
  ) => {
    const held = ctx.held ?? emptySet<TPage, TPageParam>()
    // At least one: a set that has never loaded, and one a previous run left
    // empty, both still have a first page to fetch.
    const wanted = Math.max(held.pages.length, 1)
    const pages: TPage[] = []
    const pageParams: TPageParam[] = []
    let pageParam: TPageParam | undefined =
      held.pageParams.length > 0
        ? (held.pageParams[0] as TPageParam)
        : base.initialPageParam

    for (let index = 0; index < wanted; index += 1) {
      if (pageParam === undefined) {
        // The source has fewer pages than it did. Stopping short is the
        // answer, not an error.
        break
      }
      const param = pageParam
      const page = await base.load({
        signal: ctx.signal,
        key: ctx.key,
        pageParam: param,
        direction: 'forward',
      })
      pages.push(page)
      pageParams.push(param)
      pageParam = base.getNextPageParam(page, pages, param, pageParams)
    }

    // Returned as one value, so the set swaps atomically: no render ever sees
    // half the old pages beside half the new.
    return { pages, pageParams }
  }

  /** Fetches the page beyond one end and returns the set it belongs to. */
  function appendPage(
    towards: FetchDirection
  ): QueryLoadIntent<InfiniteData<TPage, TPageParam>> {
    return async (ctx) => {
      const held = ctx.held ?? emptySet<TPage, TPageParam>()
      const param = paramBeyond(
        held,
        towards === 'forward' ? base.getNextPageParam : base.getPreviousPageParam,
        towards
      )

      if (param === undefined) {
        // Nothing that way. Returning what is held makes this an idempotent
        // write rather than a failure, which is what `hasNextPage === false`
        // has to mean for a race that loses.
        return held
      }

      const page = await base.load({
        signal: ctx.signal,
        key: ctx.key,
        pageParam: param,
        direction: towards,
      })

      // Merged onto the pages this execution started from. An invalidation
      // that landed meanwhile has already raised the entry's generation, so
      // this outcome is dropped rather than resurrecting a superseded set.
      // Existing page objects are carried by reference, which is what lets a
      // row projection leave untouched rows alone.
      const pages =
        towards === 'forward' ? [...held.pages, page] : [page, ...held.pages]
      const pageParams =
        towards === 'forward'
          ? [...held.pageParams, param]
          : [param, ...held.pageParams]

      const cap = base.maxPages
      if (cap !== undefined && pages.length > cap) {
        // Trimmed from the end opposite the one that grew, which is what makes
        // `fetchPreviousPage` able to recover a head that an append dropped.
        if (towards === 'forward') {
          const over = pages.length - cap
          pages.splice(0, over)
          pageParams.splice(0, over)
        } else {
          pages.length = cap
          pageParams.length = cap
        }
      }

      return { pages, pageParams }
    }
  }

  const internals = createQueryInternals<
    InfiniteData<TPage, TPageParam>,
    TData,
    E
  >({
    key: base.key,
    load: refetchPages,
    enabled: base.enabled,
    placeholderData: base.placeholderData,
    staleTime: base.staleTime,
    gcTime: base.gcTime,
    retry: base.retry,
    retryDelay: base.retryDelay,
    snapshot: base.snapshot,
    client: base.client,
    select: base.select,
  } as InternalQueryOptions<InfiniteData<TPage, TPageParam>, TData, E>)

  const result = internals.result

  /**
   * Whether the set can grow at either end, and whatever asking threw.
   *
   * Both ends come from one memo so the raw value is read once. A page-param
   * function that throws is a programmer error, but throwing it out of a memo
   * would take down whatever was rendering; it surfaces through `error`, the
   * same way a load failure does.
   */
  const ends = createMemo<{
    readonly next: boolean
    readonly previous: boolean
    readonly error: E | undefined
  }>(() => {
    const data = internals.raw()
    try {
      return {
        next: paramBeyond(data, base.getNextPageParam, 'forward') !== undefined,
        previous:
          paramBeyond(data, base.getPreviousPageParam, 'backward') !== undefined,
        error: undefined,
      }
    } catch (thrown) {
      return { next: false, previous: false, error: thrown as E }
    }
  })

  /**
   * The append this observer currently has running, if any.
   *
   * `joinable` settles when the append is over *or* abandoned, which is not
   * the same as when its promise settles: a request aborted by `cancel()` or
   * by `dispose()` leaves a loader that may never settle at all, and a later
   * append waiting on that promise would wait forever.
   */
  let pending:
    | {
        readonly towards: FetchDirection
        readonly joinable: Promise<void>
        readonly abandon: () => void
      }
    | undefined

  /** Lets go of the append in flight without waiting for it to settle. */
  function abandon(): void {
    pending?.abandon()
    pending = undefined
    setDirection(undefined)
  }

  /** What the caller of a no-op or a completed page fetch gets back. */
  function currentData(): TData {
    return untrack(() => {
      const raw = internals.raw()
      return raw === undefined
        ? (result.data() as TData)
        : internals.project(raw)
    })
  }

  async function extend(towards: FetchDirection): Promise<TData> {
    const running = pending
    if (
      running !== undefined &&
      running.towards === towards &&
      untrack(() => result.isFetching())
    ) {
      // The same append is already in the air, so this call joins it: the
      // cache would dedup a second request anyway, but without this the
      // second caller would go on to append the page after it, not the same
      // one.
      await running.joinable
      return currentData()
    }

    if (untrack(() => result.isFetching())) {
      // A refetch, or an append the other way, is in flight. It has to land
      // first: appending onto a set that is about to be replaced would write
      // pages the refetch has already superseded. Waiting joins that
      // execution rather than cancelling it, so the refresh is not lost.
      await internals.refetchWith().then(
        () => undefined,
        () => undefined
      )
    }

    // Re-asked after the wait, against whatever the refresh left behind.
    if (untrack(() => (towards === 'forward' ? ends().next : ends().previous))) {
      setDirection(towards)
      let release!: () => void
      pending = {
        towards,
        joinable: new Promise<void>((resolve) => {
          release = resolve
        }),
        abandon: () => release(),
      }
      try {
        await internals.refetchWith(appendPage(towards))
      } finally {
        pending = undefined
        release()
        setDirection(undefined)
      }
    }

    return currentData()
  }

  return {
    ...result,
    error: createMemo(() => ends().error ?? result.error()),
    hasNextPage: createMemo(() => ends().next),
    hasPreviousPage: createMemo(() => ends().previous),
    isFetchingNextPage: createMemo(
      () => direction() === 'forward' && result.isFetching()
    ),
    isFetchingPreviousPage: createMemo(
      () => direction() === 'backward' && result.isFetching()
    ),
    fetchNextPage: () => extend('forward'),
    fetchPreviousPage: () => extend('backward'),
    cancel: () => {
      // The bookkeeping is dropped here rather than left to the append's own
      // `finally`, which runs only once the loader settles — and a loader that
      // takes the abort as a reason to stop without settling would otherwise
      // leave every later append waiting on it.
      abandon()
      result.cancel()
    },
    dispose: () => {
      abandon()
      result.dispose()
    },
  }
}
