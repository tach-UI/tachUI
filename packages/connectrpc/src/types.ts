/**
 * Public type surface for @tachui/connectrpc.
 *
 * Declared ahead of the implementations, as `@tachui/query` did, because the
 * option and result shapes are what every call site is written against and are
 * effectively irreversible once released. Everything here is built on
 * `@tachui/query`'s types rather than restating them: the adapter supplies a key
 * and a loader, and the lifecycle, cache, and result signals are query's.
 *
 * What is deliberately *not* declared yet belongs to the issue that decides it:
 * a transport-key handle and framework-managed optimistic cache writes. Each
 * is additive, so leaving it out now costs nothing later. Streams have no
 * `reset()`: `connect()` starts a fresh call with fresh state.
 *
 * See ADR 0001: `docs/reference/adr/0001-data-and-communications-architecture.md`.
 */

import type {
  DescMessage,
  MessageInitShape,
  MessageShape,
} from '@bufbuild/protobuf'
import type { CallOptions, ConnectError } from '@connectrpc/connect'
import type {
  AsyncStreamListOptions,
  AsyncStreamListResult,
  AsyncStreamOptions,
  AsyncStreamResult,
  GetPageParam,
  InfiniteData,
  InfiniteQueryOptionsBase,
  InfiniteQueryResult,
  MutationOptions,
  MutationResult,
  QueryKey,
  QueryOptionsBase,
  QueryError,
  QueryResult,
  SelectRequirement,
} from '@tachui/query'

import type { ConnectAdapterError } from './errors'

/**
 * The name a transport is provided under.
 *
 * A name, never the `Transport` object: the server and the browser construct
 * different instances for the same logical backend, so a key derived from
 * object identity would miss on every hydrated entry. Within one `QueryClient`
 * a name identifies exactly one logical backend and security scope; where that
 * does not hold, use separate clients or a {@link ConnectKeyOptions.keyExtension}.
 */
export type ConnectTransportName = string

/** Options for providing a transport through the environment. */
export interface ProvideConnectTransportOptions {
  /** Defaults to `'default'`. */
  name?: ConnectTransportName
}

/**
 * A Connect query key.
 *
 * The root, transport name, fully qualified service name, and method name are
 * fixed; what follows is the canonical request and any application extension.
 * An infinite query adds an `'infinite'` segment after the method name, so a
 * method-level prefix still reaches both its unary and its infinite entries:
 *
 * ```ts
 * ['connect', 'account', 'acme.users.v1.UserService', 'ListUsers', '{"pageSize":50}']
 * ['connect', 'account', 'acme.users.v1.UserService', 'ListUsers', 'infinite', '{"pageSize":50}']
 * ```
 *
 * The canonical request is the request's Protobuf JSON with object members
 * sorted at every depth. It is always JSON text, and the bare word `infinite`
 * is not, so the two can never be mistaken for each other. An infinite key's
 * request omits the `pageParamKey` field, so every page shares one entry.
 */
export type ConnectQueryKey = readonly [
  'connect',
  ConnectTransportName,
  string,
  string,
  ...unknown[],
]

/** Options for `connectQueryPrefix`. */
export interface ConnectQueryPrefixOptions {
  /**
   * The transport whose entries the prefix targets. The name precedes the
   * method in the key, so a prefix can only ever reach one transport's entries.
   * Defaults to `'default'`.
   */
  transport?: ConnectTransportName
}

/**
 * The Connect call options the adapter passes through.
 *
 * Connect's own options rather than tachUI equivalents. The adapter combines
 * `signal` with an owner-bound one; an application's signal and deadline stay
 * effective alongside it.
 *
 * A mutation's or a stream's call is its own, so every option reaches
 * `Transport.unary` or `Transport.stream` as given. A query's call is shared by every observer of its key, so `signal`
 * and `timeoutMs` bound only this observer's wait: when either ends it, this
 * observer settles with `canceled` or `deadline_exceeded` while any other keeps
 * waiting, and the call stops only once nobody is. The transport is never
 * given a query's `timeoutMs`, which would cut the call off for everyone.
 * `headers` and `contextValues` travel with the call of whichever observer
 * started it, which is why anything in them that changes the response belongs
 * in {@link ConnectKeyOptions.keyExtension} too.
 *
 * `onHeader` and `onTrailer` are left out: a cached response is served to
 * observers that never made a call, so a callback on the call would fire for
 * some observers and not others.
 */
export type ConnectCallOptions = Pick<
  CallOptions,
  'signal' | 'timeoutMs' | 'headers' | 'contextValues'
> & {
  // Declared absent, not only left out of the `Pick`: an application's own
  // `CallOptions` object would otherwise pass through with its callbacks.
  onHeader?: never
  onTrailer?: never
}

/** Where a call goes and how it is made. Shared by every adapter. */
export interface ConnectRequestOptions {
  /** The provided transport to call through. Defaults to `'default'`. */
  transport?: ConnectTransportName
  callOptions?: ConnectCallOptions
}

/** Key options shared by every cached or keyed adapter. */
export interface ConnectKeyOptions {
  /**
   * Extra key segments, appended after the canonical request.
   *
   * Headers and context values never enter the key on their own. When one of
   * them changes what the server returns — a tenant, an account, a locale —
   * put it here, or two different responses share one cache entry. Put an
   * identifier here, never a credential: a key is visible in devtools and can
   * travel in a server-rendered snapshot.
   */
  keyExtension?: () => QueryKey
}

/**
 * Retry for a Connect call: an attempt count, never a predicate.
 *
 * Only `unavailable` and `resource_exhausted` are ever retried, with capped
 * exponential backoff, whatever the count. A predicate could opt an
 * `unauthenticated` or `deadline_exceeded` failure back in; a deadline is the
 * caller's, and retrying past it compounds latency. Defaults to `0`.
 *
 * A query's call is shared by every observer of its key, so its attempts
 * follow the count of the observer that started it, as its headers do; an
 * observer that joins a running call with another count shares its attempts.
 */
export type ConnectRetry = number

/**
 * Query options that the adapter owns, and so a caller cannot set: the key and
 * loader come from the method descriptor, and retry is restricted to a count.
 */
type AdapterOwnedQueryOptions = 'key' | 'load' | 'retry' | 'retryDelay'

/**
 * The adapter-owned options, declared absent rather than merely omitted.
 *
 * `Omit` alone rejects only a fresh object literal. Options get built once and
 * passed around, and a prebuilt object carrying its own `load` stays
 * structurally assignable — the adapter would then ignore it without a word.
 */
interface AdapterOwnedQueryFields {
  key?: never
  load?: never
  retryDelay?: never
}

/**
 * Options for `createConnectQuery`.
 *
 * `O` is the method's output descriptor, and the cache stores its message
 * shape. `select` is required exactly when `TData` differs from it, by the same
 * rule `@tachui/query` applies.
 */
export type ConnectQueryOptions<
  O extends DescMessage,
  TData = MessageShape<O>,
> = Omit<
  QueryOptionsBase<MessageShape<O>, TData, unknown>,
  AdapterOwnedQueryOptions
> &
  ConnectRequestOptions &
  ConnectKeyOptions &
  AdapterOwnedQueryFields & {
    retry?: ConnectRetry
  } & SelectRequirement<MessageShape<O>, TData>

/**
 * The result of `createConnectQuery`.
 *
 * A failed call surfaces the `ConnectError` the transport rejected with, never
 * flattened; a cancellation or an expired deadline is a `ConnectError` with
 * `canceled` or `deadline_exceeded`. But not every failure is a call's: a
 * request that cannot be keyed is a `ConnectAdapterError`, and the query layer
 * can refuse a key of its own. Those keep their own values, so `error` is
 * `unknown` and is narrowed with `instanceof ConnectError` before reading a
 * code.
 */
export type ConnectQueryResult<TData> = QueryResult<TData, unknown>

/**
 * Bounds the recursion in {@link ConnectPageParamKey}: each level indexes the
 * next, and `never` ends the path. The default depth of 3 emits at 3, 2, 1 and
 * 0, so a path has at most four segments.
 */
type PathDepth = [never, 0, 1, 2]

/**
 * Fields a page param can never live in: Protobuf bookkeeping, and values whose
 * keys are not message fields.
 */
type NonFieldKey = '$typeName' | '$unknown'

/**
 * A message initializer the path can descend into. A map field is an index
 * signature and a oneof is a `{ case, value }` wrapper: neither has fields, so
 * a path into one would write the token into a map entry or the discriminator.
 *
 * A oneof is recognized by both keys, so a message that merely has a field
 * named `case` stays descendable. `value` is tested as a key rather than a
 * property because the unset branch declares it optional.
 */
type IsDescendable<T> = T extends
  | readonly unknown[]
  | Uint8Array
  | Date
  | ((...args: never[]) => unknown)
  ? false
  : T extends object
    ? string extends keyof T
      ? false
      : T extends { case: unknown }
        ? 'value' extends keyof T
          ? false
          : true
        : true
    : false

/**
 * What a continuation token can be: a scalar, an enum's number, or bytes. A
 * message, list, map, or oneof holds no single value a token could be.
 */
type TokenValue = string | number | bigint | boolean | Uint8Array

/** Whether a field's value is one a token can be, `optional` or not. */
type IsTokenField<T> = [T] extends [never]
  ? false
  : T extends TokenValue
    ? true
    : false

/**
 * Every path to a field that can carry a continuation token, as a dotted
 * string: `'cursor'`, or `'query.cursor'` for a token nested in a request
 * sub-message. A path passes through singular message fields and ends at a
 * singular scalar or enum field, `optional` ones included.
 *
 * Bounded at four levels. Protobuf messages can recurse, and an unbounded path
 * type would never finish expanding. `Depth` can only lower the bound: past 3,
 * {@link PathDepth} has no next index and the recursion would never end.
 */
export type ConnectPageParamKey<T, Depth extends 0 | 1 | 2 | 3 = 3> = [
  Depth,
] extends [
  never,
]
  ? never
  : {
      [K in Exclude<keyof T, NonFieldKey> & string]:
        | (IsTokenField<NonNullable<T[K]>> extends true ? K : never)
        | (IsDescendable<NonNullable<T[K]>> extends true
            ? `${K}.${ConnectPageParamKey<NonNullable<T[K]>, PathDepth[Depth]>}`
            : never)
    }[Exclude<keyof T, NonFieldKey> & string]

/**
 * The type of the field at a {@link ConnectPageParamKey} path.
 *
 * Includes `undefined` wherever the initializer leaves the field optional,
 * which is how the first page of a list is asked for without a token.
 */
export type ConnectPageParamAt<T, P extends string> =
  P extends `${infer Head}.${infer Rest}`
    ? Head extends keyof T
      ? ConnectPageParamAt<NonNullable<T[Head]>, Rest> | undefined
      : never
    : P extends keyof T
      ? T[P]
      : never

/**
 * What a Connect infinite query fails with.
 *
 * A call's failure is the `ConnectError` the transport rejected with, never
 * flattened, or one coded `canceled` or `deadline_exceeded` when a signal or
 * deadline ended this observer's wait. A `getNextPageParam` that throws is a
 * `QueryError` whose `cause` is what it threw, and anything the adapter
 * refuses — a request it cannot key, a missing first token, a token of the
 * wrong type — is a `ConnectAdapterError`, so neither passes for an RPC error.
 */
type ConnectInfiniteQueryError = ConnectError | ConnectAdapterError | QueryError

/**
 * Options for `createConnectInfiniteQuery`.
 *
 * `pageParamKey` names the request field that carries the continuation token.
 * It is read from the input for the first page and written for every later
 * one, and it never enters the key, so every page of one list shares one
 * entry. `@tachui/query` sees an opaque page param.
 *
 * `getNextPageParam` decides whether there is another page: `undefined` or
 * `null` ends the list, and anything else, an empty string included, is the
 * next page's token. The adapter reads no convention into a response. For an
 * API following AIP-158, whose last page carries an empty `next_page_token`,
 * `getNextPageParam: page => page.nextPageToken || undefined` is the whole
 * mapping.
 *
 * Observers whose keys are equal share one set of pages: a second observer
 * reuses the pages held rather than starting over from its own first token.
 * So observers of one key must agree on the first token and on
 * `getNextPageParam`; one that needs a different starting point or rule for
 * the same request adds a `keyExtension` segment to get an entry of its own.
 *
 * Backward pagination and `maxPages` are not offered: nothing in a Connect
 * list method says how to ask for an earlier page.
 */
export type ConnectInfiniteQueryOptions<
  I extends DescMessage,
  O extends DescMessage,
  ParamKey extends ConnectPageParamKey<MessageInitShape<I>>,
  TData = InfiniteData<
    MessageShape<O>,
    ConnectPageParamAt<MessageInitShape<I>, ParamKey>
  >,
> = Omit<
  InfiniteQueryOptionsBase<
    MessageShape<O>,
    ConnectPageParamAt<MessageInitShape<I>, ParamKey>,
    TData,
    ConnectInfiniteQueryError
  >,
  AdapterOwnedQueryOptions | 'initialPageParam' | 'getNextPageParam'
> &
  ConnectRequestOptions &
  ConnectKeyOptions &
  AdapterOwnedQueryFields & {
    pageParamKey: ParamKey
    getNextPageParam: GetPageParam<
      MessageShape<O>,
      ConnectPageParamAt<MessageInitShape<I>, ParamKey>
    >
    retry?: ConnectRetry
    /** Read from the input at `pageParamKey`, per key. */
    initialPageParam?: never
    initialPageParamFor?: never
    getPreviousPageParam?: never
    maxPages?: never
  } & SelectRequirement<
    InfiniteData<
      MessageShape<O>,
      ConnectPageParamAt<MessageInitShape<I>, ParamKey>
    >,
    TData
  >

/**
 * The result of `createConnectInfiniteQuery`: an infinite query that grows
 * forward only, so the backward controls are absent rather than inert.
 */
export type ConnectInfiniteQueryResult<TData> = Omit<
  InfiniteQueryResult<TData, ConnectInfiniteQueryError>,
  'hasPreviousPage' | 'isFetchingPreviousPage' | 'fetchPreviousPage'
>

/**
 * `Omit` applied to each member of a union separately, so a union of option
 * shapes keeps its branches instead of collapsing into their common keys.
 */
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown
  ? Omit<T, K>
  : never

/**
 * Options for `createConnectMutation`.
 *
 * The input is the method's request initializer, as a generated Connect
 * client takes it. Optimistic state is the application's, exactly as in
 * `@tachui/query`: `optimisticUpdate` and `onError` are paired, and `onError`
 * receives what `optimisticUpdate` returned. Mutations never retry.
 *
 * Errors are `unknown` for the reason given on {@link ConnectQueryResult}, and
 * more so here: a throwing `optimisticUpdate` reaches `onError`, and a throwing
 * `onSuccess` rejects `mutate`, each with whatever it threw.
 */
export type ConnectMutationOptions<
  I extends DescMessage,
  O extends DescMessage,
  TContext = unknown,
> = DistributiveOmit<
  MutationOptions<MessageInitShape<I>, MessageShape<O>, unknown, TContext>,
  'run'
> &
  ConnectRequestOptions & {
    /** Supplied by the adapter from the method descriptor. */
    run?: never
  }

/** The result of `createConnectMutation`. */
export type ConnectMutationResult<
  I extends DescMessage,
  O extends DescMessage,
> = MutationResult<MessageInitShape<I>, MessageShape<O>, unknown>

/** A stream's key and iterable come from the method descriptor. */
interface AdapterOwnedStreamFields {
  key?: never
  open?: never
}

/**
 * Options for `createConnectStream`, the reduction mode over a server stream.
 *
 * No automatic reconnection: a stream that fails stays failed until it is
 * connected again explicitly, and `connect()` starts a fresh call with fresh
 * state. `autoConnect` opens the stream when it is created in the browser; a
 * server render never opens one on its own.
 *
 * Every call option reaches `Transport.stream`, as a mutation's do: the call is
 * this stream's own. An application `signal` or a `timeoutMs` deadline that
 * ends it is a failure of the call, reported as `error`; only `cancel()` and
 * owner disposal are a local hang-up, reported as `cancelled`.
 *
 * `callOptions.signal` is read once, at creation, and bound for the result's
 * lifetime: once it aborts, every later `connect()` on that result fails with
 * a `ConnectError` coded `canceled`, without a transport call. To stream again,
 * create a new result with a new options object.
 */
export type ConnectStreamOptions<
  O extends DescMessage,
  A = undefined,
> = DistributiveOmit<AsyncStreamOptions<MessageShape<O>, A>, 'key' | 'open'> &
  ConnectRequestOptions &
  ConnectKeyOptions &
  AdapterOwnedStreamFields

/**
 * The result of `createConnectStream`.
 *
 * A failed call surfaces the `ConnectError` it failed with, never flattened;
 * an application signal or deadline that ended it is a `ConnectError` with
 * `canceled` or `deadline_exceeded`. But not every failure is a call's: a
 * request that cannot be keyed is a `ConnectAdapterError`, and a throwing
 * `reduce` or `initial` ends the stream with whatever it threw. So `error` is
 * `unknown`, and is narrowed with `instanceof ConnectError` before reading a
 * code.
 */
export type ConnectStreamResult<
  O extends DescMessage,
  A = undefined,
> = AsyncStreamResult<MessageShape<O>, A, unknown>

/**
 * Options for `createConnectStreamList`, the collection mode over a server
 * stream. The right choice whenever the messages feed a List. Lifecycle and
 * call options are as for {@link ConnectStreamOptions}.
 *
 * `callOptions.signal` is read once, at creation, and bound for the result's
 * lifetime: once it aborts, every later `connect()` on that result fails with
 * a `ConnectError` coded `canceled`, without a transport call. To stream again,
 * create a new result with a new options object.
 *
 * Omitting `limit` retains every message the server ever sends, one row per
 * distinct item key, without bound. That is unsafe for any feed the
 * application does not fully control. Set `limit` to bound the rows, and tune
 * `trackedRows`, how many evicted rows stay addressable, for a feed that
 * revisits keys.
 */
export type ConnectStreamListOptions<
  O extends DescMessage,
  K extends PropertyKey = PropertyKey,
> = Omit<AsyncStreamListOptions<MessageShape<O>, K>, 'key' | 'open'> &
  ConnectRequestOptions &
  ConnectKeyOptions &
  AdapterOwnedStreamFields

/**
 * The result of `createConnectStreamList`. `error` is `unknown` for the reason
 * given on {@link ConnectStreamResult}; a throwing `itemKey` ends the stream
 * with whatever it threw.
 */
export type ConnectStreamListResult<
  O extends DescMessage,
  K extends PropertyKey = PropertyKey,
> = AsyncStreamListResult<MessageShape<O>, K, unknown>
