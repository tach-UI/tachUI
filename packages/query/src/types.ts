/**
 * Public type surface for @tachui/query.
 *
 * This package is backend-neutral: nothing here knows about Protobuf, ConnectRPC,
 * REST, or GraphQL. Transport-specific adapters (for example `@tachui/connectrpc`)
 * are expected to build on top of these types rather than replace them.
 *
 * The whole surface is declared up front, ahead of the implementations that land
 * in later phases, because several of these shapes are effectively irreversible
 * once released. See ADR 0001 for the reasoning:
 * `docs/reference/adr/0001-data-and-communications-architecture.md`.
 */

import type { Signal } from '@tachui/core'

/**
 * A structured query key.
 *
 * Keys stay arrays rather than opaque hashes because prefix invalidation needs to
 * match a prefix of the array, and devtools need to display the structure. The
 * array is hashed separately for map lookup.
 */
export type QueryKey = readonly unknown[]

/**
 * The deterministic hash derived from a {@link QueryKey}, used as the cache map key.
 */
export type QueryKeyHash = string

/**
 * Describes the data. Independent of {@link FetchStatus}.
 *
 * - `idle` - never fetched, including while `enabled` is false.
 * - `loading` - first fetch, no data yet.
 * - `success` - data is present.
 * - `error` - the last completed attempt failed.
 */
export type QueryStatus = 'idle' | 'loading' | 'success' | 'error'

/**
 * Describes the request. Independent of {@link QueryStatus}.
 *
 * A background refresh is `status: 'success'` with `fetchStatus: 'fetching'`.
 * A retry after failure is `status: 'error'` with `fetchStatus: 'fetching'`.
 *
 * `refreshing` is deliberately not a {@link QueryStatus} value: collapsing it into
 * `status` would make `status === 'success'` false during a background refetch and
 * break every consumer that branches on it.
 */
export type FetchStatus = 'idle' | 'fetching'

/**
 * Context handed to a query's `load` function.
 */
export interface QueryLoadContext {
  /** Aborted when the key changes, the query is cancelled, or the owner is disposed. */
  readonly signal: AbortSignal
  /** The resolved key this execution is loading. */
  readonly key: QueryKey
}

/**
 * Retry policy. A number is an attempt count; a predicate decides per attempt.
 * Defaults to `0` - nothing retries unless asked.
 */
export type RetryPolicy<E = Error> =
  | number
  | ((attempt: number, error: E) => boolean)

/**
 * Placeholder data used while no cached value exists. Receives the previous
 * projected value so a key change can keep rendering the prior page.
 */
export type PlaceholderData<TData> =
  | TData
  | ((previous: TData | undefined) => TData | undefined)

/**
 * Options for {@link QueryClient.fetchQuery} and `createQuery`.
 *
 * `TRaw` is what the loader returns and what the cache stores. `TData` is what a
 * single observer projects through `select`; the projection runs per observer and
 * outside the cache, so one cached response can serve many differently-shaped
 * consumers.
 */
export interface QueryOptions<TRaw, TData = TRaw, E = Error> {
  /**
   * Produces the query key. Called inside a memo so a key change triggers exactly
   * once rather than once per dependency it reads.
   */
  key: () => QueryKey

  /** Performs the request. Must respect `ctx.signal`. */
  load: (ctx: QueryLoadContext) => Promise<TRaw>

  /**
   * Gates fetching. While false the query performs no fetch and stays `idle`.
   * Defaults to true.
   */
  enabled?: boolean | (() => boolean)

  /**
   * Projects the cached `TRaw` into the shape this observer wants. Runs outside
   * the cache and is memoized per observer.
   */
  select?: (data: TRaw) => TData

  /** Value to present while there is no cached data. Never written to the cache. */
  placeholderData?: PlaceholderData<TData>

  /** Freshness window in milliseconds. Defaults to 0 - data is stale immediately. */
  staleTime?: number

  /**
   * How long an entry with zero observers is retained before eviction, in
   * milliseconds. Defaults to 300000. Distinct from `staleTime`.
   */
  gcTime?: number

  /** Retry policy for failed loads. Defaults to 0. */
  retry?: RetryPolicy<E>

  /** Delay before retry attempt `attempt`, in milliseconds. */
  retryDelay?: (attempt: number, error: E) => number

  /** Opt in to SSR snapshot serialization for this query. Defaults to false. */
  snapshot?: boolean

  /** Explicit client, bypassing environment resolution. */
  client?: QueryClient

  /**
   * Reserved. Named now so adding the behaviour later is not a breaking change.
   * Not implemented; defaults to false.
   */
  refetchOnFocus?: boolean

  /**
   * Reserved. Named now so adding the behaviour later is not a breaking change.
   * Not implemented; defaults to false.
   */
  refetchOnReconnect?: boolean
}

/**
 * Options an imperative fetch can actually honour.
 *
 * `select`, `placeholderData` and `enabled` are per-observer concerns: there is
 * no observer here to project for, nothing to show a placeholder to, and no
 * reactive gate to re-open. Accepting them would let a caller write a projection
 * that is silently dropped, or disable a call whose non-optional `Promise` then
 * has no defined resolution. The reserved `refetchOn*` flags are excluded for the
 * same reason.
 */
export type FetchQueryOptions<TRaw, E = Error> = Omit<
  QueryOptions<TRaw, TRaw, E>,
  'select' | 'placeholderData' | 'enabled' | 'refetchOnFocus' | 'refetchOnReconnect'
> & {
  // `Omit` alone only rejects a fresh object literal. A `QueryOptions` variable
  // carrying `enabled: false` stays structurally assignable and slips through,
  // which is the likelier mistake: options get built once and passed around.
  // Declaring the excluded keys as `never` rejects the variable too.
  select?: never
  placeholderData?: never
  enabled?: never
  refetchOnFocus?: never
  refetchOnReconnect?: never
}

/**
 * The reactive result of observing a query.
 */
export interface QueryResult<TData, E = Error> {
  /** Current projected data, or undefined when there is none. */
  readonly data: Signal<TData | undefined>
  /** Error from the last completed attempt. */
  readonly error: Signal<E | undefined>
  /** State of the data. */
  readonly status: Signal<QueryStatus>
  /** State of the request. */
  readonly fetchStatus: Signal<FetchStatus>

  /** `status === 'loading'` - first fetch with no data yet. */
  readonly isLoading: Signal<boolean>
  /** `fetchStatus === 'fetching'` - a request is in flight, first or otherwise. */
  readonly isFetching: Signal<boolean>
  /** Fetching while data is already present - a background refresh. */
  readonly isRefreshing: Signal<boolean>
  /** Whether the cached value has aged past `staleTime`. */
  readonly isStale: Signal<boolean>
  /** When the cached value was last written, in epoch milliseconds. */
  readonly updatedAt: Signal<number | undefined>

  /** Forces a fetch regardless of freshness. */
  refetch(): Promise<TData>
  /** Marks this query's entry stale and refetches it if observed. */
  invalidate(): void
  /** Aborts the in-flight request, if any. */
  cancel(): void
  /** Releases this observer. Called automatically on owner disposal. */
  dispose(): void
}

/**
 * Cache policy carried by an entry, needed by `dehydrate` filters.
 */
export interface CacheEntryPolicy {
  readonly staleTime: number
  readonly gcTime: number
  readonly snapshot: boolean
}

/**
 * A read-only view of one cache entry, as handed to a `dehydrate` filter.
 */
export interface CacheEntry<TRaw = unknown, E = Error> {
  readonly key: QueryKey
  readonly hash: QueryKeyHash
  readonly data: TRaw | undefined
  readonly error: E | undefined
  /** Epoch milliseconds of the last successful write, or undefined if never. */
  readonly updatedAt: number | undefined
  readonly status: QueryStatus
  readonly fetchStatus: FetchStatus
  readonly observerCount: number
  readonly options: CacheEntryPolicy
}

/**
 * One serialized query, as produced by {@link QueryClient.dehydrate}.
 *
 * Only successful data is serialized. Transports, headers, credentials,
 * interceptor context, and error stacks are never included.
 */
export interface DehydratedQuery<TRaw = unknown> {
  readonly key: QueryKey
  readonly data: TRaw
  readonly updatedAt: number
}

/**
 * The serialized form of a client's cache.
 */
export interface DehydratedState {
  readonly queries: readonly DehydratedQuery[]
}

/**
 * Owns cache state. Created explicitly rather than implied by module state, so
 * that two clients in one process share nothing and a server request cannot leak
 * cached data into the next one.
 */
export interface QueryClient {
  /**
   * Resolves a query imperatively, using and populating the cache. Identical
   * in-flight keys share one execution.
   */
  fetchQuery<TRaw, E = Error>(options: FetchQueryOptions<TRaw, E>): Promise<TRaw>

  /**
   * Warms the cache for a set of queries. Intended for the server's prefetch
   * phase, which must complete before the synchronous render begins.
   */
  prefetchQueries(requests: readonly FetchQueryOptions<any, any>[]): Promise<void>

  /** Marks every entry whose key starts with `prefix` stale, refetching observed ones. */
  invalidate(prefix: QueryKey): void

  /**
   * Serializes cached data for transfer to the client.
   *
   * With no filter this serializes only entries whose `options.snapshot` is
   * true. Snapshot serialization is opt-in per query (ADR 0001 item 22), so an
   * unmarked response cannot reach the HTML payload just because a caller
   * omitted an argument. A supplied filter narrows that set further; it does not
   * replace the gate.
   *
   * Successful data only. Errors, transports, headers, credentials, and
   * interceptor context are never serialized.
   */
  dehydrate(filter?: (entry: CacheEntry) => boolean): DehydratedState

  /** Restores entries produced by {@link QueryClient.dehydrate}. */
  hydrate(state: DehydratedState): void

  /** Drops every entry, aborting in-flight requests. */
  clear(): void

  /** Clears the cache and tears down the client's reactive root. */
  dispose(): void
}

/**
 * State of a mutation. Unlike queries there is no separate fetch status: a
 * mutation is an imperative one-shot, so `pending` is unambiguous.
 */
export type MutationStatus = 'idle' | 'pending' | 'success' | 'error'

/**
 * Context handed to a mutation's `run` function.
 */
export interface MutationRunContext {
  /** Aborted by `cancel()` or owner disposal. */
  readonly signal: AbortSignal
}

/**
 * The parts of `MutationOptions` that do not depend on whether the mutation
 * updates optimistically.
 */
export interface MutationOptionsBase<I, O, E = Error, TContext = unknown> {
  /** Performs the mutation. Must respect `ctx.signal`. */
  run: (input: I, ctx: MutationRunContext) => Promise<O>

  /** Runs after a successful mutation, before `mutate` resolves. */
  onSuccess?: (data: O, input: I) => void | Promise<void>

  /**
   * Runs after a failed mutation, before `mutate` rejects. This is where an
   * optimistic update is undone: `context` is whatever `optimisticUpdate`
   * returned, and `undefined` when none ran - including when `optimisticUpdate`
   * itself threw, which still reaches this hook with nothing to roll back.
   *
   * Declared here rather than only in the optimistic branch below so that
   * TypeScript can contextually type its parameters. Moving it into the union
   * costs every caller three explicit annotations.
   */
  onError?: (error: E, input: I, context: TContext | undefined) => void | Promise<void>

  /**
   * Runs after success or failure.
   *
   * Deliberately receives no optimistic context: it runs on both paths, and a
   * context that is meaningful on only one of them is a trap. Roll back in
   * `onError`, which is where the context is.
   */
  onSettled?: (
    data: O | undefined,
    error: E | undefined,
    input: I
  ) => void | Promise<void>

  /** Key prefixes to invalidate on success. */
  invalidates?: readonly QueryKey[]

  /** Explicit client, bypassing environment resolution. */
  client?: QueryClient
}

/**
 * Options for `createMutation`.
 *
 * An optimistic update and its rollback are paired in the type rather than only
 * in prose. Declaring `optimisticUpdate` without `onError` would leave a
 * mutation that mutates the UI on the way in and has nowhere to undo it when
 * `run` rejects - the optimistic change would simply stay, permanently, with no
 * compile-time signal. Supplying one requires the other, and `context` is then
 * non-optional because an optimistic update always produced one.
 */
export type MutationOptions<I, O, E = Error, TContext = unknown> =
  MutationOptionsBase<I, O, E, TContext> &
    (
      | { optimisticUpdate?: never }
      | {
          /**
           * Applies an optimistic update before `run` starts. Whatever it
           * returns is handed to `onError` to undo the change. Opt-in: the
           * server stays authoritative.
           */
          optimisticUpdate: (input: I) => TContext
          /**
           * Required alongside `optimisticUpdate`. Same signature as the base
           * declaration; restated here only to make it non-optional.
           */
          onError: (error: E, input: I, context: TContext | undefined) => void | Promise<void>
        }
    )

/**
 * The reactive result of a mutation. Mutations never retry automatically.
 */
export interface MutationResult<I, O, E = Error> {
  readonly status: Signal<MutationStatus>
  readonly data: Signal<O | undefined>
  readonly error: Signal<E | undefined>
  /** `status === 'pending'`. Mirrors `isLoading` on queries so form bindings work. */
  readonly isPending: Signal<boolean>

  mutate(input: I): Promise<O>
  reset(): void
  cancel(): void
}

/**
 * Lifecycle of an async stream.
 *
 * `completed`, `error`, and `cancelled` are distinct terminal states: a consumer
 * needs to tell "the server finished" from "it broke" from "we hung up".
 */
export type AsyncStreamStatus =
  | 'idle'
  | 'connecting'
  | 'open'
  | 'completed'
  | 'error'
  | 'cancelled'

/**
 * Context handed to a stream's `open` function.
 */
export interface AsyncStreamOpenContext {
  /** Aborted by `cancel()` or owner disposal; terminates iteration. */
  readonly signal: AbortSignal
  readonly key: QueryKey
}

/**
 * Options shared by both stream modes.
 */
export interface AsyncStreamBaseOptions<T> {
  key: () => QueryKey
  open: (ctx: AsyncStreamOpenContext) => AsyncIterable<T> | Promise<AsyncIterable<T>>
  /** Connect when first observed and disconnect when unobserved. Defaults to true. */
  autoConnect?: boolean
}

/**
 * Mode A - bounded reduction, for counters, latest-value, and small derived state.
 *
 * Supply `bufferSize` whenever `reduce` accumulates an array. A naive
 * `(items, m) => [...items, m]` copies the whole array per message and grows
 * without bound; use `createAsyncStreamList` for collections instead.
 */
export type AsyncStreamOptions<T, A = undefined> = AsyncStreamBaseOptions<T> &
  (
    | ([undefined] extends [A]
        ? {
            /**
             * No reduction: the stream only tracks `latest`, and the accumulated
             * value stays `undefined`.
             *
             * This branch is available only when `A` can actually be `undefined`.
             * Without that guard, `createAsyncStream<Message, number>({ key, open })`
             * would type-check and hand back `value: Signal<number>` that nothing
             * can ever populate.
             */
            initial?: never
            reduce?: never
            bufferSize?: never
          }
        : never)
    | {
        /**
         * Seed for the reduction. Paired with `reduce` in the type rather than
         * only in prose, because `AsyncStreamResult.value` promises a fully
         * populated `A` and a seedless fold has nothing to start from.
         */
        initial: () => A
        /** Folds each message into the accumulated value. */
        reduce: (accumulated: A, message: T) => A
        /**
         * Caps an array-valued accumulation, dropping oldest entries.
         *
         * Only meaningful when the accumulator is an array - there is no general
         * way to drop the oldest entry of a Map or a plain object, so accepting
         * it there would promise a bound the implementation could only ignore.
         *
         * Wrapped in tuples to stop the conditional distributing: a bare
         * `A extends readonly unknown[]` maps over a union like
         * `Message[] | number` and yields `number | never`, so a fold that can
         * hold a plain number would still accept a cap it cannot honour.
         */
        bufferSize?: [A] extends [readonly unknown[]] ? number : never
      }
  )

/**
 * Mode B - collection mode, backed by `createSignalList` so a List updates one row
 * instead of re-rendering, and per-message cost stays constant.
 */
export interface AsyncStreamListOptions<T, K extends PropertyKey = PropertyKey>
  extends AsyncStreamBaseOptions<T> {
  /** Identity for each message. Repeat keys update in place. */
  itemKey: (message: T) => K
  /** Maximum retained messages. Oldest are evicted past this. */
  limit?: number
  /** Where new messages go. Defaults to 'append'. */
  insert?: 'append' | 'prepend'
}

/**
 * The reactive result of a stream in reduction mode.
 */
export interface AsyncStreamResult<T, A = undefined, E = Error> {
  /** The most recent message. */
  readonly latest: Signal<T | undefined>
  /**
   * The accumulated value. `A` is only inhabited by supplying `initial` and
   * `reduce`; without them it stays at its `undefined` default.
   */
  readonly value: Signal<A>
  readonly status: Signal<AsyncStreamStatus>
  readonly error: Signal<E | undefined>

  connect(): Promise<void>
  cancel(): void
  dispose(): void
}

/**
 * The reactive result of a stream in collection mode.
 */
export interface AsyncStreamListResult<T, K extends PropertyKey = PropertyKey, E = Error> {
  /**
   * Retained message keys, in display order.
   *
   * `readonly` because `createSignalList` hands back its stored array by
   * reference: an in-place `reverse()` or `push()` would mutate the list's own
   * state without a signal write, so nothing re-renders and the next message's
   * structural-change check sees an unchanged key set and skips the update.
   */
  readonly ids: Signal<readonly K[]>
  /**
   * Per-item reactive accessor, so one row can update without touching the rest.
   * Undefined for a key that is not retained: `limit` evicts as messages arrive,
   * so a key read from `ids()` can be gone by the time it is looked up.
   */
  get(key: K): (() => T) | undefined
  readonly latest: Signal<T | undefined>
  readonly status: Signal<AsyncStreamStatus>
  readonly error: Signal<E | undefined>

  connect(): Promise<void>
  cancel(): void
  dispose(): void
}
