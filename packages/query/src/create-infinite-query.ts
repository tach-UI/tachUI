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

import {
  assertPageCap,
  assertPageParam,
  callPageParam,
  isEndOfSet,
  isPageParamFault,
  loadPageRun,
} from './pagination'
import { createQueryInternals, shouldRetry } from './create-query'
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
  const param = callPageParam(
    get,
    data.pages[index] as TPage,
    data.pages,
    data.pageParams[index] as TPageParam,
    data.pageParams
  )
  // Both spellings of "no page that way" collapse to one here, so every caller
  // below can ask a single question.
  return isEndOfSet(param) ? undefined : (param as TPageParam)
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
  // Checked once, at construction, beside where a query's other policy values
  // are checked. A fractional cap reaches `pages.length = 2.5` inside the
  // loader and throws a RangeError the retry loop then replays; a cap of zero
  // splices the whole set away and leaves a query that reports success, holds
  // nothing, and has no way back.
  assertPageCap(base.maxPages, 'createInfiniteQuery')

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
  const refetchPages: QueryLoadIntent<InfiniteData<TPage, TPageParam>> = (
    ctx: InternalLoadContext<InfiniteData<TPage, TPageParam>>
  ) => {
    assertPageParam(base.initialPageParam, 'createInfiniteQuery')
    const held = ctx.held ?? emptySet<TPage, TPageParam>()
    // Returned as one value by `loadPageRun`, so the set swaps atomically: no
    // render ever sees half the old pages beside half the new.
    return loadPageRun(
      base,
      ctx.signal,
      ctx.key,
      // At least one: a set that has never loaded, and one a previous run left
      // empty, both still have a first page to fetch.
      Math.max(held.pages.length, 1),
      held.pageParams.length > 0
        ? (held.pageParams[0] as TPageParam)
        : base.initialPageParam,
      ctx.withRetry
    )
  }

  /**
   * Names an append for the cache's dedup.
   *
   * Stable per direction rather than per call, so two `fetchNextPage()` calls —
   * from one observer or from two watching the same key — cost one request,
   * while a refetch racing an append is recognised as different work and queues
   * instead of being handed the append's result.
   */
  function intentName(towards: FetchDirection): string {
    return `append:${towards}`
  }

  /** Fetches the page beyond one end and returns the set it belongs to. */
  function appendPage(
    towards: FetchDirection
  ): QueryLoadIntent<InfiniteData<TPage, TPageParam>> {
    return async (ctx) => {
      assertPageParam(base.initialPageParam, 'createInfiniteQuery')
      const held = ctx.held ?? emptySet<TPage, TPageParam>()
      // Extending a set that holds nothing means loading its first page. The
      // guard in `extend` asks the observer, whose published state can still
      // describe the previous key for a tick after a key change, so an append
      // can arrive here against an entry that has never loaded. Writing the
      // empty set back would leave the new key `success` with no pages and
      // nothing to extend from.
      const param =
        held.pages.length === 0
          ? base.initialPageParam
          : paramBeyond(
              held,
              towards === 'forward'
                ? base.getNextPageParam
                : base.getPreviousPageParam,
              towards
            )

      if (param === undefined) {
        // Nothing that way. Returning what is held makes this an idempotent
        // write rather than a failure, which is what `hasNextPage === false`
        // has to mean for a race that loses.
        return held
      }

      const growing = held.pages.length === 0 ? 'forward' : towards

      const page = await ctx.withRetry(() =>
        base.load({
          signal: ctx.signal,
          key: ctx.key,
          pageParam: param,
          direction: growing,
        })
      )

      // Merged onto the pages this execution started from. An invalidation
      // that landed meanwhile has already raised the entry's generation, so
      // this outcome is dropped rather than resurrecting a superseded set.
      // Existing page objects are carried by reference, which is what lets a
      // row projection leave untouched rows alone.
      const pages =
        growing === 'forward' ? [...held.pages, page] : [page, ...held.pages]
      const pageParams =
        growing === 'forward'
          ? [...held.pageParams, param]
          : [param, ...held.pageParams]

      // The entry's bound, not this observer's. First declarer wins, the same
      // way `staleTime` and `gcTime` are claimed, so every observer of the key
      // trims to one number.
      const cap = internals.policy()?.maxPages ?? base.maxPages
      if (cap !== undefined && pages.length > cap) {
        // Trimmed from the end opposite the one that grew, which is what makes
        // `fetchPreviousPage` able to recover a head that an append dropped.
        if (growing === 'forward') {
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
    // A param function that threw will throw again on identical input, so a
    // retry spends the whole policy to arrive at the same error more slowly.
    // Load failures still retry exactly as configured.
    retry: (attempt: number, error: E) =>
      !isPageParamFault(error) && shouldRetry(base.retry, attempt, error),
    retryDelay: base.retryDelay,
    snapshot: base.snapshot,
    client: base.client,
    select: base.select,
    // Forwarded rather than dropped. They do nothing yet, but the options are
    // enumerated explicitly here, so anything left out silently stops working
    // for infinite queries on the day it starts working for plain ones.
    refetchOnFocus: base.refetchOnFocus,
    refetchOnReconnect: base.refetchOnReconnect,
    // Claimed on the entry like every other shared policy. The bound describes
    // the set, and the set is shared: an observer applying its own while
    // another applied none trimmed pages out from under it, leaving a set it
    // never capped and — with no `getPreviousPageParam` of its own — no way to
    // get them back.
    maxPages: base.maxPages,
    // The policy goes on each page, not on the run. See `withRetry`.
    retriesInternally: true,
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
  /** How an append ended, for whoever joined it. */
  type Outcome =
    | { readonly ok: true }
    | { readonly ok: false; readonly error: unknown }
    | { readonly ok: 'abandoned' }

  let pending:
    | {
        readonly towards: FetchDirection
        readonly joinable: Promise<Outcome>
        readonly abandon: () => void
      }
    | undefined

  /** Lets go of the append in flight without waiting for it to settle. */
  function abandon(): void {
    pending?.abandon()
    pending = undefined
    setDirection(undefined)
  }

  /**
   * The set this call's page belongs to, or nothing if there is no set.
   *
   * Deliberately not `result.data()`, which falls back to `placeholderData` —
   * a placeholder is what an observer shows while there is nothing cached, not
   * the set a page was just appended to, and returning one here would be
   * indistinguishable from a real load.
   */
  function currentData(): TData | undefined {
    return untrack(() => {
      const raw = internals.raw()
      return raw === undefined ? undefined : internals.project(raw)
    })
  }

  async function extend(
    towards: FetchDirection
  ): Promise<TData | undefined> {
    const running = pending
    if (running !== undefined) {
      const outcome = await running.joinable
      if (running.towards === towards) {
        // The same append was already in the air, so this call rides it rather
        // than appending the page after it. The leader's outcome is this
        // caller's too: a joiner told nothing would report success for a page
        // that failed, and its retry UI would never appear.
        if (outcome.ok === false) {
          throw outcome.error
        }
        return currentData()
      }
      // An append the other way. It has to land before this one can ask where
      // the set now ends.
    }

    // The slot is claimed before parking, not after. `cancel()` and `dispose()`
    // let go of whatever they find here, and an append that parked without
    // claiming would wake afterwards and start the request that was cancelled.
    let settle!: (outcome: Outcome) => void
    const slot = {
      towards,
      joinable: new Promise<Outcome>((resolve) => {
        settle = resolve
      }),
      abandon: () => settle({ ok: 'abandoned' }),
    }
    pending = slot

    try {
      if (internals.isFetchingNow()) {
        // A refetch is in flight. It has to land first: appending onto a set
        // that is about to be replaced would write pages the refresh has
        // already superseded. Waiting joins that execution rather than
        // cancelling it, so the refresh is not lost.
        await internals.refetchWith().then(
          () => undefined,
          () => undefined
        )
      }

      if (pending !== slot) {
        // Abandoned while parked, or replaced by a later dispatch. Either way
        // this call no longer speaks for the observer.
        return currentData()
      }

      // Re-asked after the wait, against whatever the refresh left behind.
      if (
        !untrack(() => (towards === 'forward' ? ends().next : ends().previous))
      ) {
        settle({ ok: true })
        return currentData()
      }

      setDirection(towards)
      await internals.refetchWith(appendPage(towards), intentName(towards))
      settle({ ok: true })
      return currentData()
    } catch (error) {
      settle({ ok: false, error })
      throw error
    } finally {
      // Only ever this call's own bookkeeping: an append abandoned and replaced
      // by a newer one must not clear the newer one's direction flag, which
      // would drop a spinner mid-load and let a third call append a second
      // extra page.
      if (pending === slot) {
        pending = undefined
        setDirection(undefined)
      }
    }
  }

  return {
    ...result,
    // A real load failure outranks a page-param fault: the load error is what
    // a consumer can act on, and a throwing param function reports itself again
    // the moment anything reads the ends.
    error: createMemo(() => result.error() ?? ends().error),
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
