/**
 * Compile-time contracts for @tachui/query's public types.
 *
 * This PR ships a type surface and no runtime, so the things most worth locking
 * down are invisible to vitest: `Object.keys` on a module namespace never sees a
 * type-only binding, so the barrel's `export type` block has no runtime gate at
 * all. These assertions are checked by
 * `bun run --filter @tachui/query type-check`, which includes this file; a
 * regression is a type error, not a failed run.
 *
 * Everything is imported through `../src/index` rather than `../src/types`, so
 * dropping a name from the barrel's re-export block fails here even when the
 * declaration itself survives in `types.ts`.
 */

import type { Signal } from '@tachui/core'

import type {
  AsyncStreamBaseOptions,
  AsyncStreamListOptions,
  AsyncStreamListResult,
  AsyncStreamOpenContext,
  AsyncStreamOptions,
  AsyncStreamResult,
  AsyncStreamStatus,
  CacheEntry,
  CacheEntryPolicy,
  DehydratedQuery,
  DehydratedState,
  FetchStatus,
  MutationOptions,
  MutationResult,
  MutationRunContext,
  MutationStatus,
  PlaceholderData,
  QueryClient,
  QueryKey,
  QueryKeyHash,
  QueryLoadContext,
  QueryOptions,
  QueryResult,
  QueryStatus,
  RetryPolicy,
} from '../src/index'

type Assert<T extends true> = T

type Equals<A, B> =
  (<G>() => G extends A ? 1 : 2) extends <G>() => G extends B ? 1 : 2 ? true : false

/** Whether `From` satisfies `To`, so a deliberate rejection can be asserted as `false`. */
type Assignable<From, To> = [From] extends [To] ? true : false

interface Message {
  body: string
}

/** What a loader returns and the cache stores, as opposed to what an observer projects. */
interface RawUser {
  id: string
  displayName: string
}

/** A domain error, so `E` is checked as a real parameter rather than pinned to `Error`. */
interface HttpError extends Error {
  statusCode: number
}

/**
 * Mirrors the barrel's `export type` block. The named import above is the actual
 * gate - removing a re-export from `src/index.ts` fails to resolve here - and
 * this map exists so every imported name is used under `noUnusedLocals`. The
 * instantiations are arbitrary; only the reference matters.
 */
export type PublicTypeSurface = {
  AsyncStreamBaseOptions: AsyncStreamBaseOptions<Message>
  AsyncStreamListOptions: AsyncStreamListOptions<Message, string>
  AsyncStreamListResult: AsyncStreamListResult<Message, string>
  AsyncStreamOpenContext: AsyncStreamOpenContext
  AsyncStreamOptions: AsyncStreamOptions<Message>
  AsyncStreamResult: AsyncStreamResult<Message>
  AsyncStreamStatus: AsyncStreamStatus
  CacheEntry: CacheEntry
  CacheEntryPolicy: CacheEntryPolicy
  DehydratedQuery: DehydratedQuery
  DehydratedState: DehydratedState
  FetchStatus: FetchStatus
  MutationOptions: MutationOptions<string, void>
  MutationResult: MutationResult<string, void>
  MutationRunContext: MutationRunContext
  MutationStatus: MutationStatus
  PlaceholderData: PlaceholderData<string>
  QueryClient: QueryClient
  QueryKey: QueryKey
  QueryKeyHash: QueryKeyHash
  QueryLoadContext: QueryLoadContext
  QueryOptions: QueryOptions<RawUser>
  QueryResult: QueryResult<RawUser>
  QueryStatus: QueryStatus
  RetryPolicy: RetryPolicy
}

/** Keys stay structured arrays so prefix invalidation can match a prefix of one. */
export type QueryKeyIsStructured = Assert<Equals<QueryKey, readonly unknown[]>>

/**
 * `select` is what gives `QueryOptions` its second parameter: `TRaw` is what the
 * loader returns and the cache stores, `TData` is what one observer projects.
 * The order is load-bearing - swapping it silently retypes every call site.
 */
export type SelectProjectsRawIntoData = Assert<
  Equals<QueryOptions<RawUser, string>['select'], ((data: RawUser) => string) | undefined>
>

/** `TData` defaults to `TRaw`, so a query without `select` names one parameter. */
export type ProjectedDataDefaultsToRaw = Assert<
  Equals<QueryOptions<RawUser>['select'], ((data: RawUser) => RawUser) | undefined>
>

/** The error type is the third parameter, and `retry` sees that same `E`. */
export type OptionsErrorIsThirdParameter = Assert<
  Equals<
    QueryOptions<RawUser, RawUser, HttpError>['retry'],
    RetryPolicy<HttpError> | undefined
  >
>

/** Placeholder data stands in for the projection, not for the cached value. */
export type PlaceholderIsProjected = Assert<
  Equals<QueryOptions<RawUser, string>['placeholderData'], PlaceholderData<string> | undefined>
>

/**
 * `QueryResult`'s first parameter is the projected `TData` and its second is the
 * error type. `select` adds no parameter here; it changes what the first means.
 */
export type ResultDataIsProjected = Assert<
  Equals<QueryResult<string>['data'], Signal<string | undefined>>
>

export type ResultErrorIsSecondParameter = Assert<
  Equals<QueryResult<string, HttpError>['error'], Signal<HttpError | undefined>>
>

/**
 * `status` and `fetchStatus` stay separate signals over separate unions. Folding
 * `fetching` into `status` would make `status === 'success'` false during a
 * background refresh and break every consumer that branches on it.
 */
export type StatusAndFetchStatusAreSeparate = Assert<
  Equals<
    Pick<QueryResult<string>, 'status' | 'fetchStatus'>,
    { readonly status: Signal<QueryStatus>; readonly fetchStatus: Signal<FetchStatus> }
  >
>

export type QueryStatusMembers = Assert<
  Equals<QueryStatus, 'idle' | 'loading' | 'success' | 'error'>
>

export type FetchStatusMembers = Assert<Equals<FetchStatus, 'idle' | 'fetching'>>

/**
 * `CacheEntry` is what a `dehydrate` filter receives, so every field is part of
 * the contract; it is pinned whole rather than field by field.
 */
export type CacheEntryShape = Assert<
  Equals<
    CacheEntry<RawUser, HttpError>,
    {
      readonly key: QueryKey
      readonly hash: QueryKeyHash
      readonly data: RawUser | undefined
      readonly error: HttpError | undefined
      readonly updatedAt: number | undefined
      readonly status: QueryStatus
      readonly fetchStatus: FetchStatus
      readonly observerCount: number
      readonly options: CacheEntryPolicy
    }
  >
>

/**
 * Only successful data is serialized. No error, no status, no transport detail -
 * a new field here would cross a process boundary, so the shape is pinned whole.
 */
export type DehydratedQueryShape = Assert<
  Equals<
    DehydratedQuery<RawUser>,
    { readonly key: QueryKey; readonly data: RawUser; readonly updatedAt: number }
  >
>

export type DehydratedStateShape = Assert<
  Equals<DehydratedState, { readonly queries: readonly DehydratedQuery[] }>
>

export type MutationStatusMembers = Assert<
  Equals<MutationStatus, 'idle' | 'pending' | 'success' | 'error'>
>

/** A mutation is an imperative one-shot, so it grows no second status axis. */
export type MutationHasNoFetchStatus = Assert<
  Equals<'fetchStatus' extends keyof MutationResult<string, void> ? true : false, false>
>

/**
 * `onError` is the only rollback hook, so there is no second slot promising a
 * context that a failed `run` may never have produced.
 */
export type NoSeparateRollbackHook = Assert<
  Equals<'rollback' extends keyof MutationOptions<string, void> ? true : false, false>
>

/** The rollback context stays optional, because `optimisticUpdate` is optional. */
export type RollbackContextIsOptional = Assert<
  Equals<
    Parameters<
      NonNullable<MutationOptions<string, void, Error, { previous: string[] }>['onError']>
    >[2],
    { previous: string[] } | undefined
  >
>

export type AsyncStreamStatusMembers = Assert<
  Equals<
    AsyncStreamStatus,
    'idle' | 'connecting' | 'open' | 'completed' | 'error' | 'cancelled'
  >
>

/** The fields both stream modes share, used to probe each mode's extra requirements. */
type StreamBase = {
  key: () => QueryKey
  open: (ctx: AsyncStreamOpenContext) => AsyncIterable<Message>
}

/** Mode A without a reduction: the stream only tracks `latest`. */
export type PlainStreamAccepted = Assert<Assignable<StreamBase, AsyncStreamOptions<Message>>>

/** Mode A with a seeded reduction, which is what inhabits `A`. */
export type SeededFoldAccepted = Assert<
  Assignable<
    StreamBase & {
      initial: () => number
      reduce: (accumulated: number, message: Message) => number
    },
    AsyncStreamOptions<Message, number>
  >
>

/**
 * A fold with no seed is rejected by the type, not just by prose:
 * `AsyncStreamResult.value` promises a fully populated `A` and a seedless fold
 * has nothing to start from.
 */
export type SeedlessFoldRejected = Assert<
  Equals<
    Assignable<
      StreamBase & { reduce: (accumulated: number, message: Message) => number },
      AsyncStreamOptions<Message, number>
    >,
    false
  >
>

/** `bufferSize` caps an array accumulation, so it belongs to the reducing branch. */
export type BufferSizeWithoutFoldRejected = Assert<
  Equals<Assignable<StreamBase & { bufferSize: 100 }, AsyncStreamOptions<Message>>, false>
>

/** Without a reduction the accumulated value stays `undefined`. */
export type UnreducedStreamValue = Assert<
  Equals<AsyncStreamResult<Message>['value'], Signal<undefined>>
>

/** Mode B is keyed: `itemKey` is what lets one row update without touching the rest. */
export type ListModeRequiresItemKey = Assert<
  Equals<Assignable<StreamBase, AsyncStreamListOptions<Message, string>>, false>
>

/**
 * `get` is partial. `limit` evicts as messages arrive, so a key taken from
 * `ids()` can already be gone by the time it is looked up, and a total signature
 * would leave the consumer no branch to write.
 */
export type StreamGetIsPartial = Assert<
  Equals<ReturnType<AsyncStreamListResult<Message, string>['get']>, (() => Message) | undefined>
>
