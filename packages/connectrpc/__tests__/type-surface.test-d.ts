/**
 * Compile-time contracts for @tachui/connectrpc's public types.
 *
 * The package ships a type surface ahead of its adapters, so most of what is
 * worth locking down is invisible to vitest. These are checked by
 * `bun run test:types`; a regression is a type error, not a failed run.
 *
 * Everything is imported through the package's export map, so the assertions
 * run against the built declarations a consumer receives. That is also why the
 * package's own `type-check` excludes this file.
 *
 * The message types are written by hand in the shape `protoc-gen-es` emits:
 * a `Message<TypeName>` intersected with its fields, carried by a
 * `GenMessage` descriptor. Only their types matter here.
 */

import type {
  DescMethodServerStreaming,
  DescMethodUnary,
  Message,
  MessageInitShape,
  MessageShape,
} from '@bufbuild/protobuf'
import type { GenMessage } from '@bufbuild/protobuf/codegenv2'
import type { CallOptions, ConnectError, Transport } from '@connectrpc/connect'
import type { Signal } from '@tachui/core'
import type { InfiniteData, QueryKey } from '@tachui/query'

import type {
  ConnectCallOptions,
  ConnectInfiniteQueryOptions,
  ConnectInfiniteQueryResult,
  ConnectKeyOptions,
  ConnectMutationOptions,
  ConnectMutationResult,
  ConnectPageParamAt,
  ConnectPageParamKey,
  ConnectQueryKey,
  ConnectQueryOptions,
  ConnectQueryPrefixOptions,
  ConnectQueryResult,
  ConnectRequestOptions,
  ConnectRetry,
  ConnectStreamListOptions,
  ConnectStreamListResult,
  ConnectStreamOptions,
  ConnectStreamResult,
  ConnectTransportName,
  ProvideConnectTransportOptions,
} from '@tachui/connectrpc'
import {
  connectQueryPrefix,
  DEFAULT_TRANSPORT_NAME,
  isRetryableCode,
  provideConnectTransport,
  useConnectTransport,
} from '@tachui/connectrpc'

import type { Assert, Assignable, Equals } from '../../../tools/testing/type-asserts'

type UserQuery = Message<'acme.users.v1.UserQuery'> & {
  cursor: string
  filter: string
}

type ListUsersRequest = Message<'acme.users.v1.ListUsersRequest'> & {
  pageSize: number
  pageToken: string
  query?: UserQuery
  tags: string[]
  labels: { [key: string]: string }
  choice:
    | { case: 'cursor'; value: string }
    | { case: 'offset'; value: number }
    | { case: undefined; value?: undefined }
}

type User = Message<'acme.users.v1.User'> & {
  id: string
  displayName: string
}

type ListUsersResponse = Message<'acme.users.v1.ListUsersResponse'> & {
  users: User[]
  nextPageToken: string
}

type ListUsersRequestSchema = GenMessage<ListUsersRequest>
type ListUsersResponseSchema = GenMessage<ListUsersResponse>
type UserSchema = GenMessage<User>

type ListUsers = DescMethodUnary<ListUsersRequestSchema, ListUsersResponseSchema>
type WatchUsers = DescMethodServerStreaming<ListUsersRequestSchema, UserSchema>

/**
 * Mirrors the barrel's `export type` block. The named import above is the
 * gate - dropping a re-export fails to resolve - and this map exists so every
 * imported name is used under `noUnusedLocals`.
 */
export type PublicTypeSurface = {
  ConnectCallOptions: ConnectCallOptions
  ConnectInfiniteQueryOptions: ConnectInfiniteQueryOptions<
    ListUsersRequestSchema,
    ListUsersResponseSchema,
    'pageToken'
  >
  ConnectInfiniteQueryResult: ConnectInfiniteQueryResult<string>
  ConnectKeyOptions: ConnectKeyOptions
  ConnectMutationOptions: ConnectMutationOptions<ListUsersRequestSchema, UserSchema>
  ConnectMutationResult: ConnectMutationResult<ListUsersRequestSchema, UserSchema>
  ConnectPageParamAt: ConnectPageParamAt<MessageInitShape<ListUsersRequestSchema>, 'pageToken'>
  ConnectPageParamKey: ConnectPageParamKey<MessageInitShape<ListUsersRequestSchema>>
  ConnectQueryKey: ConnectQueryKey
  ConnectQueryOptions: ConnectQueryOptions<ListUsersResponseSchema>
  ConnectQueryPrefixOptions: ConnectQueryPrefixOptions
  ConnectQueryResult: ConnectQueryResult<string>
  ConnectRequestOptions: ConnectRequestOptions
  ConnectRetry: ConnectRetry
  ConnectStreamListOptions: ConnectStreamListOptions<UserSchema, string>
  ConnectStreamListResult: ConnectStreamListResult<UserSchema, string>
  ConnectStreamOptions: ConnectStreamOptions<UserSchema>
  ConnectStreamResult: ConnectStreamResult<UserSchema>
  ConnectTransportName: ConnectTransportName
  ProvideConnectTransportOptions: ProvideConnectTransportOptions
}

// ---------------------------------------------------------------------------
// Runtime constants
// ---------------------------------------------------------------------------

/** The default name is a literal, so it can sit in a key tuple as-is. */
export type DefaultTransportNameIsLiteral = Assert<
  Equals<typeof DEFAULT_TRANSPORT_NAME, 'default'>
>

export type RetryableCodeIsAPredicate = Assert<
  Equals<Parameters<typeof isRetryableCode>, [code: ConnectError['code']]>
>

// ---------------------------------------------------------------------------
// Transports and keys
// ---------------------------------------------------------------------------

/** A transport is named by a string, never by the `Transport` object. */
export type TransportIsNamed = Assert<
  Equals<NonNullable<ProvideConnectTransportOptions['name']>, string>
>

export type PrefixTargetsOneTransport = Assert<
  Equals<NonNullable<ConnectQueryPrefixOptions['transport']>, string>
>

export type UnaryKeyIsAConnectKey = Assert<
  Assignable<
    ['connect', 'account', 'acme.users.v1.UserService', 'ListUsers', '{"pageSize":50}'],
    ConnectQueryKey
  >
>

export type InfiniteKeyIsAConnectKey = Assert<
  Assignable<
    ['connect', 'account', 'acme.users.v1.UserService', 'ListUsers', 'infinite', '{}'],
    ConnectQueryKey
  >
>

/** A key missing the method, or under another root, is not a Connect key. */
export type KeyNeedsAMethod = Assert<
  Equals<Assignable<['connect', 'account', 'acme.users.v1.UserService'], ConnectQueryKey>, false>
>
export type KeyNeedsTheConnectRoot = Assert<
  Equals<Assignable<['rest', 'account', 'Service', 'Method'], ConnectQueryKey>, false>
>

/** A Connect key is still a query key, so it works with every query-level API. */
export type ConnectKeyIsAQueryKey = Assert<Assignable<ConnectQueryKey, QueryKey>>

/** A prefix is itself a Connect key, so `invalidate` and `invalidates` take it. */
export type PrefixIsAConnectKey = Assert<
  Equals<ReturnType<typeof connectQueryPrefix>, ConnectQueryKey>
>

/** Any generated method is accepted, unary or streaming. */
export type PrefixTakesAnyMethod = Assert<
  Assignable<
    [ListUsers, ConnectQueryPrefixOptions] | [WatchUsers],
    Parameters<typeof connectQueryPrefix>
  >
>

/** Key extension is reactive, like the key it extends. */
export type KeyExtensionIsReactive = Assert<
  Equals<NonNullable<ConnectKeyOptions['keyExtension']>, () => QueryKey>
>

// ---------------------------------------------------------------------------
// Call options
// ---------------------------------------------------------------------------

/** Connect's own options, exactly these four, typed as Connect types them. */
export type CallOptionsArePassThrough = Assert<
  Equals<
    Pick<ConnectCallOptions, 'signal' | 'timeoutMs' | 'headers' | 'contextValues'>,
    Pick<CallOptions, 'signal' | 'timeoutMs' | 'headers' | 'contextValues'>
  >
>

export type CallOptionsCarryNothingElse = Assert<
  Equals<
    Exclude<keyof ConnectCallOptions, 'signal' | 'timeoutMs' | 'headers' | 'contextValues'>,
    'onHeader' | 'onTrailer'
  >
>

/** A per-call callback would fire for some observers of a shared response and not others. */
export type CallOptionsRejectHeaderCallbacks = Assert<
  Equals<Assignable<{ timeoutMs: 1; onHeader: (headers: Headers) => void }, ConnectCallOptions>, false>
>

/** Nor does a prebuilt Connect `CallOptions` object carry them through. */
export type CallOptionsRejectConnectsOwnObject = Assert<
  Equals<Assignable<CallOptions, ConnectCallOptions>, false>
>

// ---------------------------------------------------------------------------
// Unary queries
// ---------------------------------------------------------------------------

/** The cache stores the method's output message. */
export const plainQuery: ConnectQueryOptions<ListUsers['output']> = {
  transport: 'account',
  staleTime: 30_000,
  callOptions: { timeoutMs: 5_000 },
  retry: 2,
}

/** `select` projects the output message, and is typed from it. */
export const projectedQuery: ConnectQueryOptions<ListUsersResponseSchema, number> = {
  select: response => response.users.length,
}

/** Declaring a projection type without a projection is rejected, as in `@tachui/query`. */
export type ProjectionRequiresSelect = Assert<
  Equals<Assignable<{ staleTime: 1 }, ConnectQueryOptions<ListUsersResponseSchema, number>>, false>
>

/** The adapter owns the key and the loader. */
export type QueryRejectsKey = Assert<
  Equals<Assignable<{ staleTime: 1; key: () => QueryKey }, ConnectQueryOptions<ListUsersResponseSchema>>, false>
>
export type QueryRejectsLoad = Assert<
  Equals<
    Assignable<{ staleTime: 1; load: () => Promise<ListUsersResponse> }, ConnectQueryOptions<ListUsersResponseSchema>>,
    false
  >
>

/** Retry is a count. A predicate could opt a non-retryable code back in. */
export type QueryRejectsRetryPredicate = Assert<
  Equals<
    Assignable<{ staleTime: 1; retry: () => boolean }, ConnectQueryOptions<ListUsersResponseSchema>>,
    false
  >
>
export type QueryRejectsRetryDelay = Assert<
  Equals<
    Assignable<{ staleTime: 1; retryDelay: () => number }, ConnectQueryOptions<ListUsersResponseSchema>>,
    false
  >
>

/** Errors reach the consumer as `ConnectError`, never flattened. */
export type QueryErrorIsConnectError = Assert<
  Equals<ConnectQueryResult<string>['error'], Signal<ConnectError | undefined>>
>

// ---------------------------------------------------------------------------
// Page param paths
// ---------------------------------------------------------------------------

type RequestInit = MessageInitShape<ListUsersRequestSchema>

/** Top-level fields and fields of nested request messages, dotted. */
export type PathsIncludeNestedFields = Assert<
  Equals<
    Extract<ConnectPageParamKey<RequestInit>, 'pageToken' | 'query.cursor' | 'query.filter'>,
    'pageToken' | 'query.cursor' | 'query.filter'
  >
>

/** Protobuf bookkeeping is never a field. */
export type PathsExcludeTypeName = Assert<
  Equals<Extract<ConnectPageParamKey<RequestInit>, '$typeName' | `${string}.$typeName`>, never>
>

/** Arrays are not descended into: an element index is not a field. */
export type PathsDoNotDescendArrays = Assert<
  Equals<Extract<ConnectPageParamKey<RequestInit>, `tags.${string}`>, never>
>

/** A map field is not descended into: an entry key is not a field. */
export type PathsDoNotDescendMaps = Assert<
  Equals<Extract<ConnectPageParamKey<RequestInit>, `labels.${string}`>, never>
>

/** A oneof is not descended into: `case` and `value` are its wrapper, not fields. */
export type PathsDoNotDescendOneofs = Assert<
  Equals<Extract<ConnectPageParamKey<RequestInit>, `choice.${string}`>, never>
>

type Level4 = { token: string }
type Level3 = { token: string; l4: Level4 }
type Level2 = { l3: Level3 }
type Level1 = { l2: Level2 }
type DeepRequest = { l1: Level1 }

/** Paths are bounded at four segments, as documented. */
export type PathsReachFourSegments = Assert<
  Equals<Assignable<'l1.l2.l3.token', ConnectPageParamKey<DeepRequest>>, true>
>

export type PathsStopBeforeFiveSegments = Assert<
  Equals<Assignable<'l1.l2.l3.l4.token', ConnectPageParamKey<DeepRequest>>, false>
>

type RecursiveRequest = { token: string; child?: RecursiveRequest }

/** A recursive message still expands, to the same four segments. */
export type PathsBoundRecursiveMessages = Assert<
  Equals<
    Extract<ConnectPageParamKey<RecursiveRequest>, `${string}.token`>,
    'child.token' | 'child.child.token' | 'child.child.child.token'
  >
>

/**
 * The bound can be lowered but not raised: past 3 the recursion has no end.
 * Checked on a non-recursive message, where the constraint is the only error;
 * a recursive one fails at depth 4 whatever the constraint says.
 */
// @ts-expect-error a depth past 3 is not a bound
export type DepthPastThreeRejected = ConnectPageParamKey<DeepRequest, 4>

/** A field named `case` does not make a message a oneof; only `case` with `value` does. */
type CaseFieldRequest = { outer: { case: string; nested: { token: string } } }

export type PathsDescendMessagesWithACaseField = Assert<
  Equals<Assignable<'outer.nested.token', ConnectPageParamKey<CaseFieldRequest>>, true>
>

export type TopLevelParamIsOptional = Assert<
  Equals<ConnectPageParamAt<RequestInit, 'pageToken'>, string | undefined>
>

/** A nested token is optional too: its parent message may be absent. */
export type NestedParamIsOptional = Assert<
  Equals<ConnectPageParamAt<RequestInit, 'query.cursor'>, string | undefined>
>

// ---------------------------------------------------------------------------
// Infinite queries
// ---------------------------------------------------------------------------

/** The AIP-158 mapping, typed from the method's output and the named field. */
export const infiniteQuery: ConnectInfiniteQueryOptions<
  ListUsersRequestSchema,
  ListUsersResponseSchema,
  'pageToken'
> = {
  pageParamKey: 'pageToken',
  getNextPageParam: page => page.nextPageToken || undefined,
}

export const nestedInfiniteQuery: ConnectInfiniteQueryOptions<
  ListUsersRequestSchema,
  ListUsersResponseSchema,
  'query.cursor'
> = {
  pageParamKey: 'query.cursor',
  getNextPageParam: page => page.nextPageToken || undefined,
}

/** A field that does not exist cannot carry the token. */
export type InfiniteRejectsUnknownField = Assert<
  Equals<Assignable<'nope', ConnectPageParamKey<RequestInit>>, false>
>

/** Nor can a map entry: the key's type parameter is constrained to field paths. */
// @ts-expect-error a map entry is not a request field
export type MapPathRejected = ConnectInfiniteQueryOptions<ListUsersRequestSchema, ListUsersResponseSchema, 'labels.anything'>

/** The page param is the field's type; the cache holds pages of the output message. */
export type InfiniteDataIsTyped = Assert<
  Equals<
    Parameters<
      ConnectInfiniteQueryOptions<
        ListUsersRequestSchema,
        ListUsersResponseSchema,
        'pageToken'
      >['getNextPageParam']
    >[2],
    string | undefined
  >
>

/** The first page's param comes from the input, so `initialPageParam` is the adapter's. */
export type InfiniteRejectsInitialPageParam = Assert<
  Equals<
    Assignable<
      {
        pageParamKey: 'pageToken'
        getNextPageParam: () => undefined
        initialPageParam: string
      },
      ConnectInfiniteQueryOptions<ListUsersRequestSchema, ListUsersResponseSchema, 'pageToken'>
    >,
    false
  >
>

/** Nothing in a Connect list method says how to ask for an earlier page. */
export type InfiniteRejectsBackwardPagination = Assert<
  Equals<
    Assignable<
      {
        pageParamKey: 'pageToken'
        getNextPageParam: () => undefined
        getPreviousPageParam: () => undefined
      },
      ConnectInfiniteQueryOptions<ListUsersRequestSchema, ListUsersResponseSchema, 'pageToken'>
    >,
    false
  >
>

type ListUsersInfiniteOptions = ConnectInfiniteQueryOptions<
  ListUsersRequestSchema,
  ListUsersResponseSchema,
  'pageToken'
>
type InfiniteRequired = { pageParamKey: 'pageToken'; getNextPageParam: () => undefined }

/** The control: without the rejected field, each shape below is accepted. */
export type InfiniteRequiredIsAccepted = Assert<
  Assignable<InfiniteRequired, ListUsersInfiniteOptions>
>

/** Nor is there a page to drop once the window is full. */
export type InfiniteRejectsMaxPages = Assert<
  Equals<Assignable<InfiniteRequired & { maxPages: 3 }, ListUsersInfiniteOptions>, false>
>

/** The adapter owns the key and the loader, as for a unary query. */
export type InfiniteRejectsKey = Assert<
  Equals<Assignable<InfiniteRequired & { key: () => QueryKey }, ListUsersInfiniteOptions>, false>
>
export type InfiniteRejectsLoad = Assert<
  Equals<
    Assignable<InfiniteRequired & { load: () => Promise<ListUsersResponse> }, ListUsersInfiniteOptions>,
    false
  >
>

/** Retry is a count here too. */
export type InfiniteRejectsRetryPredicate = Assert<
  Equals<Assignable<InfiniteRequired & { retry: () => boolean }, ListUsersInfiniteOptions>, false>
>
export type InfiniteRejectsRetryDelay = Assert<
  Equals<Assignable<InfiniteRequired & { retryDelay: () => number }, ListUsersInfiniteOptions>, false>
>

/** A projection over the set is required once `TData` differs from it. */
export const projectedInfiniteQuery: ConnectInfiniteQueryOptions<
  ListUsersRequestSchema,
  ListUsersResponseSchema,
  'pageToken',
  User[]
> = {
  pageParamKey: 'pageToken',
  getNextPageParam: page => page.nextPageToken || undefined,
  select: (data: InfiniteData<ListUsersResponse, string | undefined>) =>
    data.pages.flatMap(page => page.users),
}

export type InfiniteProjectionRequiresSelect = Assert<
  Equals<
    Assignable<
      InfiniteRequired,
      ConnectInfiniteQueryOptions<ListUsersRequestSchema, ListUsersResponseSchema, 'pageToken', User[]>
    >,
    false
  >
>

export type InfiniteErrorIsConnectError = Assert<
  Equals<ConnectInfiniteQueryResult<string>['error'], Signal<ConnectError | undefined>>
>

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/** Input is the request initializer, as a generated client takes it. */
export type MutationInputIsInitShape = Assert<
  Equals<
    Parameters<ConnectMutationResult<ListUsersRequestSchema, UserSchema>['mutate']>[0],
    MessageInitShape<ListUsersRequestSchema>
  >
>

export type MutationOutputIsMessageShape = Assert<
  Equals<
    ConnectMutationResult<ListUsersRequestSchema, UserSchema>['data'],
    Signal<MessageShape<UserSchema> | undefined>
  >
>

/** The adapter supplies `run` from the method descriptor. */
export type MutationRejectsRun = Assert<
  Equals<
    Assignable<
      { transport: 'account'; run: () => Promise<User> },
      ConnectMutationOptions<ListUsersRequestSchema, UserSchema>
    >,
    false
  >
>

/**
 * Callbacks are contextually typed without annotations, including `onError`
 * across both optimistic branches — `noImplicitAny` fails this otherwise.
 */
export const mutation: ConnectMutationOptions<ListUsersRequestSchema, UserSchema> = {
  transport: 'account',
  invalidates: [['connect', 'account', 'acme.users.v1.UserService', 'ListUsers']],
  onSuccess: (user, input) => void [user.id, input.pageSize],
  onError: (error, input) => void [error.code, input.pageSize],
}

/** Optimistic state stays the application's, paired with its rollback. */
export const optimisticMutation: ConnectMutationOptions<
  ListUsersRequestSchema,
  UserSchema,
  { previous: number }
> = {
  optimisticUpdate: input => ({ previous: input.pageSize ?? 0 }),
  onError: (_error, _input, context) => void context?.previous,
}

export type OptimisticRequiresRollback = Assert<
  Equals<
    Assignable<
      { optimisticUpdate: () => { previous: number } },
      ConnectMutationOptions<ListUsersRequestSchema, UserSchema, { previous: number }>
    >,
    false
  >
>

export type MutationErrorIsConnectError = Assert<
  Equals<
    ConnectMutationResult<ListUsersRequestSchema, UserSchema>['error'],
    Signal<ConnectError | undefined>
  >
>

// ---------------------------------------------------------------------------
// Server streams
// ---------------------------------------------------------------------------

/** Reduction mode folds the output message of a server-streaming method. */
export const reducedStream: ConnectStreamOptions<WatchUsers['output'], number> = {
  transport: 'account',
  initial: () => 0,
  reduce: (count, user) => count + user.displayName.length,
}

/** Without a fold, the stream tracks only `latest`. */
export const latestOnlyStream: ConnectStreamOptions<WatchUsers['output']> = {
  autoConnect: false,
}

export type StreamRejectsOpen = Assert<
  Equals<
    Assignable<
      { autoConnect: false; open: () => AsyncIterable<User> },
      ConnectStreamOptions<UserSchema>
    >,
    false
  >
>

export type StreamRejectsKey = Assert<
  Equals<
    Assignable<{ autoConnect: false; key: () => QueryKey }, ConnectStreamOptions<UserSchema>>,
    false
  >
>

/**
 * A fold is `initial` and `reduce` together, and required once the value type
 * leaves out `undefined`: nothing else could ever populate it.
 */
export type StreamFoldIsRequired = Assert<
  Equals<Assignable<{ autoConnect: false }, ConnectStreamOptions<UserSchema, number>>, false>
>
export type StreamFoldNeedsReduce = Assert<
  Equals<Assignable<{ initial: () => number }, ConnectStreamOptions<UserSchema, number>>, false>
>
export type StreamFoldNeedsInitial = Assert<
  Equals<
    Assignable<
      { reduce: (count: number, user: User) => number },
      ConnectStreamOptions<UserSchema, number>
    >,
    false
  >
>

/**
 * The pairing holds with the default accumulator too, where the no-fold
 * branch also exists and a union collapsed into its common keys would let
 * half a fold through.
 */
export type DefaultStreamFoldNeedsReduce = Assert<
  Equals<Assignable<{ initial: () => undefined }, ConnectStreamOptions<UserSchema>>, false>
>
export type DefaultStreamFoldNeedsInitial = Assert<
  Equals<
    Assignable<
      { reduce: (acc: undefined, user: User) => undefined },
      ConnectStreamOptions<UserSchema>
    >,
    false
  >
>

export type StreamValueIsTheFold = Assert<
  Equals<ConnectStreamResult<UserSchema, number>['value'], Signal<number>>
>

export type StreamErrorIsConnectError = Assert<
  Equals<ConnectStreamResult<UserSchema>['error'], Signal<ConnectError | undefined>>
>

/** Collection mode needs row identity. */
export const streamList: ConnectStreamListOptions<UserSchema, string> = {
  itemKey: user => user.id,
  limit: 500,
}

export type StreamListRejectsOpen = Assert<
  Equals<
    Assignable<
      { itemKey: (user: User) => string; open: () => AsyncIterable<User> },
      ConnectStreamListOptions<UserSchema, string>
    >,
    false
  >
>

export type StreamListRejectsKey = Assert<
  Equals<
    Assignable<
      { itemKey: (user: User) => string; key: () => QueryKey },
      ConnectStreamListOptions<UserSchema, string>
    >,
    false
  >
>

export type StreamListRequiresItemKey = Assert<
  Equals<Assignable<{ limit: 1 }, ConnectStreamListOptions<UserSchema, string>>, false>
>

export type StreamListRowsAreMessages = Assert<
  Equals<
    ReturnType<ConnectStreamListResult<UserSchema, string>['get']>,
    () => User | undefined
  >
>

// Transport provision takes Connect's generic `Transport`, never a
// browser-specific one, and hands the same interface back.
export type ProvideTakesGenericTransport = Assert<
  Equals<
    Parameters<typeof provideConnectTransport>,
    [transport: Transport, options?: ProvideConnectTransportOptions]
  >
>

export type UseReturnsGenericTransport = Assert<
  Equals<ReturnType<typeof useConnectTransport>, Transport>
>

export type UseTakesOptionalName = Assert<
  Equals<Parameters<typeof useConnectTransport>, [name?: ConnectTransportName]>
>
