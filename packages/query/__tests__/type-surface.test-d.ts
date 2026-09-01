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
  FetchQueryOptions,
  FetchStatus,
  MutationOptions,
  MutationOptionsBase,
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
  FetchQueryOptions: FetchQueryOptions<RawUser>
  FetchStatus: FetchStatus
  MutationOptions: MutationOptions<string, void>
  MutationOptionsBase: MutationOptionsBase<string, void>
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
 * Every member of the method-bearing interfaces is pinned by name. Instantiating
 * a type (as `PublicTypeSurface` does) only gates that the barrel still exports
 * the identifier - deleting `QueryClient.dispose` or `QueryResult.refetch` left
 * both type-check and the runtime suite green until these were added.
 */
export type QueryClientMembers = Assert<
  Equals<
    keyof QueryClient,
    'fetchQuery' | 'prefetchQueries' | 'invalidate' | 'dehydrate' | 'hydrate' | 'clear' | 'dispose'
  >
>

export type QueryResultMembers = Assert<
  Equals<
    keyof QueryResult<string>,
    | 'data'
    | 'error'
    | 'status'
    | 'fetchStatus'
    | 'isLoading'
    | 'isFetching'
    | 'isRefreshing'
    | 'isStale'
    | 'updatedAt'
    | 'refetch'
    | 'invalidate'
    | 'cancel'
    | 'dispose'
  >
>

export type MutationResultMembers = Assert<
  Equals<
    keyof MutationResult<string, void>,
    'status' | 'data' | 'error' | 'isPending' | 'mutate' | 'reset' | 'cancel'
  >
>

export type QueryOptionsMembers = Assert<
  Equals<
    keyof QueryOptions<RawUser>,
    | 'key'
    | 'load'
    | 'enabled'
    | 'select'
    | 'placeholderData'
    | 'staleTime'
    | 'gcTime'
    | 'retry'
    | 'retryDelay'
    | 'snapshot'
    | 'client'
    | 'refetchOnFocus'
    | 'refetchOnReconnect'
  >
>

export type AsyncStreamResultMembers = Assert<
  Equals<
    keyof AsyncStreamResult<Message>,
    'latest' | 'value' | 'status' | 'error' | 'connect' | 'cancel' | 'dispose'
  >
>

export type AsyncStreamListResultMembers = Assert<
  Equals<
    keyof AsyncStreamListResult<Message, string>,
    'ids' | 'get' | 'latest' | 'status' | 'error' | 'connect' | 'cancel' | 'dispose'
  >
>

export type AsyncStreamListOptionsMembers = Assert<
  Equals<
    keyof AsyncStreamListOptions<Message, string>,
    'key' | 'open' | 'autoConnect' | 'itemKey' | 'limit' | 'insert'
  >
>

/**
 * An imperative fetch cannot honour per-observer options. Accepting `select`
 * would silently drop a projection the caller wrote; accepting `enabled: false`
 * would leave a non-optional `Promise` with no defined resolution.
 */
export type FetchQueryKeepsHonourableOptions = Assert<
  Equals<
    Exclude<
      keyof FetchQueryOptions<RawUser>,
      'select' | 'placeholderData' | 'enabled' | 'refetchOnFocus' | 'refetchOnReconnect'
    >,
    'key' | 'load' | 'staleTime' | 'gcTime' | 'retry' | 'retryDelay' | 'snapshot' | 'client'
  >
>

/**
 * The excluded keys are still *present*, typed `never`. That is the mechanism:
 * omitting them only stops a fresh literal, while a `never`-typed property also
 * rejects a prebuilt variable that carries one.
 */
export type FetchQueryNevertypesObserverOptions = Assert<
  Equals<
    FetchQueryOptions<RawUser>['select' | 'placeholderData' | 'enabled'],
    undefined
  >
>

type FetchBase = {
  key: () => QueryKey
  load: (ctx: QueryLoadContext) => Promise<RawUser>
}

declare const fetchBase: FetchBase

/**
 * Written as literals under `@ts-expect-error` rather than as `Assignable`
 * assertions: structural assignability permits extra properties, and only a
 * fresh object literal gets excess-property checking. The literal is also the
 * shape a caller actually writes at a `fetchQuery` call site. Each of these
 * fails the type-check if the option stops being rejected.
 */

export const fetchQueryRejectsSelect: FetchQueryOptions<RawUser> = {
  ...fetchBase,
  // @ts-expect-error - `select` is per-observer; an imperative fetch would drop it silently
  select: (user: RawUser) => user.displayName,
}

export const fetchQueryRejectsEnabled: FetchQueryOptions<RawUser> = {
  ...fetchBase,
  // @ts-expect-error - `enabled: false` would leave a non-optional Promise unresolved
  enabled: false,
}

export const fetchQueryRejectsPlaceholder: FetchQueryOptions<RawUser> = {
  ...fetchBase,
  // @ts-expect-error - there is no observer to show placeholder data to
  placeholderData: { id: '0', displayName: '' },
}

/** The options an imperative fetch can honour are still accepted. */
export const fetchQueryAcceptsCachePolicy: FetchQueryOptions<RawUser> = {
  ...fetchBase,
  staleTime: 30_000,
  gcTime: 60_000,
  retry: 2,
  snapshot: true,
}

/**
 * `onError` must stay contextually typeable. It lives on the base interface
 * rather than inside the union for exactly this reason: moving it into the
 * branches makes TypeScript unable to pick a signature, and every caller has to
 * annotate all three parameters by hand.
 */
export const contextualTypingSurvives: MutationOptions<string, number, Error, number> = {
  run: async input => input.length,
  optimisticUpdate: input => input.length,
  onError: (error, input, context) => {
    void error.message
    void input.length
    void context
  },
}

/**
 * The observer-only options are rejected through a *variable*, not just a fresh
 * literal. `Omit` alone only triggers excess-property checking on literals, and
 * options objects are routinely built once and passed around.
 */
declare const observerOptions: QueryOptions<RawUser>
export type FetchQueryRejectsOptionsVariable = Assert<
  Equals<Assignable<typeof observerOptions, FetchQueryOptions<RawUser>>, false>
>

/**
 * A mixed accumulator cannot claim a `bufferSize`. The conditional is written
 * non-distributively, so `Message[] | number` does not map to `number | never`
 * and quietly permit a cap on a fold that may hold a plain number.
 */
export type MixedAccumulatorRejectsBufferSize = Assert<
  Equals<
    Assignable<
      StreamBase & {
        initial: () => number
        reduce: (acc: Message[] | number, m: Message) => Message[] | number
        bufferSize: 5
      },
      AsyncStreamOptions<Message, Message[] | number>
    >,
    false
  >
>

/** There is no second rollback slot; `onError` is where the context lives. */
export type NoSeparateRollbackHook = Assert<
  Equals<'rollback' extends keyof MutationOptions<string, void> ? true : false, false>
>

type MutationBase = { run: (input: string) => Promise<number> }

/** A mutation with no optimistic update needs no rollback hook. */
export type PlainMutationAccepted = Assert<
  Assignable<MutationBase, MutationOptions<string, number>>
>

/**
 * An optimistic update without `onError` is rejected: it would mutate the UI on
 * the way in with nowhere to undo it when `run` rejects.
 */
export type OptimisticWithoutRollbackRejected = Assert<
  Equals<
    Assignable<
      MutationBase & { optimisticUpdate: (input: string) => number },
      MutationOptions<string, number, Error, number>
    >,
    false
  >
>

/**
 * Paired, it is accepted. The context stays `TContext | undefined` even here:
 * `optimisticUpdate` can itself throw before returning, and `onError` still runs
 * on that path with nothing to roll back.
 */
export type OptimisticWithRollbackAccepted = Assert<
  Assignable<
    MutationBase & {
      optimisticUpdate: (input: string) => number
      onError: (error: Error, input: string, context: number | undefined) => void
    },
    MutationOptions<string, number, Error, number>
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

/**
 * The no-fold branch is gated on `A` being inhabitable by `undefined`. Without
 * that gate an explicit accumulator with no `initial`/`reduce` type-checked and
 * `value()` was statically `number` while nothing could ever populate it.
 */
export type ExplicitAccumulatorRequiresFold = Assert<
  Equals<Assignable<StreamBase, AsyncStreamOptions<Message, number>>, false>
>

/** `bufferSize` caps an array; on a Map there is no oldest entry to drop. */
export type BufferSizeOnNonArrayRejected = Assert<
  Equals<
    Assignable<
      StreamBase & {
        initial: () => Map<string, Message>
        reduce: (acc: Map<string, Message>, m: Message) => Map<string, Message>
        bufferSize: 100
      },
      AsyncStreamOptions<Message, Map<string, Message>>
    >,
    false
  >
>

/** On an array accumulator it is accepted. */
export type BufferSizeOnArrayAccepted = Assert<
  Assignable<
    StreamBase & {
      initial: () => Message[]
      reduce: (acc: Message[], m: Message) => Message[]
      bufferSize: 100
    },
    AsyncStreamOptions<Message, Message[]>
  >
>

/** The retained id list is readonly: mutating it in place would desync the list. */
export type StreamListIdsAreReadonly = Assert<
  Equals<AsyncStreamListResult<Message, string>['ids'], Signal<readonly string[]>>
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
