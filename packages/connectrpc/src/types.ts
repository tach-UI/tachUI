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
 * a transport-key handle, stream `reset()`, framework-managed optimistic cache
 * writes, and how call options behave when one request is shared by several
 * observers. Each is additive, so leaving it out now costs nothing later.
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
  QueryResult,
  SelectRequirement,
} from '@tachui/query'

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
 * The canonical request is always a JSON object, so it can never be mistaken
 * for the `'infinite'` segment.
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
   * put it here, or two different responses share one cache entry.
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
  QueryOptionsBase<MessageShape<O>, TData, ConnectError>,
  AdapterOwnedQueryOptions
> &
  ConnectRequestOptions &
  ConnectKeyOptions &
  AdapterOwnedQueryFields & {
    retry?: ConnectRetry
  } & SelectRequirement<MessageShape<O>, TData>

/** The result of `createConnectQuery`. Errors are `ConnectError`, never flattened. */
export type ConnectQueryResult<TData> = QueryResult<TData, ConnectError>

/** Bounds the recursion in {@link ConnectPageParamKey}. */
type PathDepth = [never, 0, 1, 2, 3]

/**
 * Fields a page param can never live in: Protobuf bookkeeping, and values whose
 * keys are not message fields.
 */
type NonFieldKey = '$typeName' | '$unknown'

/** A message initializer the path can descend into. */
type IsDescendable<T> = T extends
  | readonly unknown[]
  | Uint8Array
  | Date
  | ((...args: never[]) => unknown)
  ? false
  : T extends object
    ? true
    : false

/**
 * Every field path in a request initializer, as a dotted string: `'cursor'`,
 * or `'query.cursor'` for a token nested in a request sub-message.
 *
 * Bounded at four levels. Protobuf messages can recurse, and an unbounded path
 * type would never finish expanding.
 */
export type ConnectPageParamKey<T, Depth extends number = 4> = [Depth] extends [
  never,
]
  ? never
  : {
      [K in Exclude<keyof T, NonFieldKey> & string]:
        | K
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
 * Options for `createConnectInfiniteQuery`.
 *
 * `pageParamKey` names the request field that carries the continuation token.
 * It is read from the input for the first page and written for every later
 * one, and it never enters the key, so every page of one list shares one
 * entry. `@tachui/query` sees an opaque page param.
 *
 * For an API following AIP-158, the last page carries an empty
 * `next_page_token`, so `getNextPageParam: page => page.nextPageToken || undefined`
 * is the whole mapping.
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
    ConnectError
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
    /** Read from the input at `pageParamKey`. */
    initialPageParam?: never
    getPreviousPageParam?: never
    maxPages?: never
  } & SelectRequirement<
    InfiniteData<
      MessageShape<O>,
      ConnectPageParamAt<MessageInitShape<I>, ParamKey>
    >,
    TData
  >

/** The result of `createConnectInfiniteQuery`. */
export type ConnectInfiniteQueryResult<TData> = InfiniteQueryResult<
  TData,
  ConnectError
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
 */
export type ConnectMutationOptions<
  I extends DescMessage,
  O extends DescMessage,
  TContext = unknown,
> = DistributiveOmit<
  MutationOptions<MessageInitShape<I>, MessageShape<O>, ConnectError, TContext>,
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
> = MutationResult<MessageInitShape<I>, MessageShape<O>, ConnectError>

/** A stream's key and iterable come from the method descriptor. */
interface AdapterOwnedStreamFields {
  key?: never
  open?: never
}

/**
 * Options for `createConnectStream`, the reduction mode over a server stream.
 *
 * No automatic reconnection: a stream that fails stays failed until it is
 * connected again explicitly.
 */
export type ConnectStreamOptions<
  O extends DescMessage,
  A = undefined,
> = DistributiveOmit<AsyncStreamOptions<MessageShape<O>, A>, 'key' | 'open'> &
  ConnectRequestOptions &
  ConnectKeyOptions &
  AdapterOwnedStreamFields

/** The result of `createConnectStream`. */
export type ConnectStreamResult<
  O extends DescMessage,
  A = undefined,
> = AsyncStreamResult<MessageShape<O>, A, ConnectError>

/**
 * Options for `createConnectStreamList`, the collection mode over a server
 * stream. The right choice whenever the messages feed a List.
 */
export type ConnectStreamListOptions<
  O extends DescMessage,
  K extends PropertyKey = PropertyKey,
> = Omit<AsyncStreamListOptions<MessageShape<O>, K>, 'key' | 'open'> &
  ConnectRequestOptions &
  ConnectKeyOptions &
  AdapterOwnedStreamFields

/** The result of `createConnectStreamList`. */
export type ConnectStreamListResult<
  O extends DescMessage,
  K extends PropertyKey = PropertyKey,
> = AsyncStreamListResult<MessageShape<O>, K, ConnectError>
