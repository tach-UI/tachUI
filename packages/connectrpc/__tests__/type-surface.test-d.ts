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
  DescMethodBiDiStreaming,
  DescMethodClientStreaming,
  DescMethodServerStreaming,
  DescMethodUnary,
  Message,
  MessageInitShape,
  MessageShape,
} from '@bufbuild/protobuf'
import type { GenMessage } from '@bufbuild/protobuf/codegenv2'
import type { CallOptions, ConnectError, Transport } from '@connectrpc/connect'
import type { Signal } from '@tachui/core'
import type { InfiniteData, QueryError, QueryKey } from '@tachui/query'

import type {
  ConnectAdapterError,
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
  createConnectInfiniteQuery,
  createConnectMutation,
  createConnectQuery,
  createConnectStream,
  createConnectStreamList,
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

/**
 * A failed call's `ConnectError` reaches the consumer unflattened, but so do
 * local failures with their own values, so the error is narrowed before use.
 */
export type QueryErrorMustBeNarrowed = Assert<
  Equals<ConnectQueryResult<string>['error'], Signal<unknown>>
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

/** A token is a single value, so a path ends at a scalar or enum field. */
type TokenRequest = {
  token: string
  maxAge?: number
  role: 0 | 1 | 2
  sinceId: bigint
  fingerprint: Uint8Array
  nickname?: string
  child?: { cursor: string; grandchild?: { rank?: number } }
  tags: string[]
  labels: { [key: string]: string }
  choice:
    | { case: 'email'; value: string }
    | { case: undefined; value?: undefined }
}

export type PathsEndAtTokenFields = Assert<
  Equals<
    ConnectPageParamKey<TokenRequest>,
    | 'token'
    | 'maxAge'
    | 'role'
    | 'sinceId'
    | 'fingerprint'
    | 'nickname'
    | 'child.cursor'
    | 'child.grandchild.rank'
  >
>

/** Neither a message, a list, a map, nor a oneof can carry the token. */
export type PathsRejectNonTokenLeaves = Assert<
  Equals<
    Extract<ConnectPageParamKey<RequestInit>, 'query' | 'tags' | 'labels' | 'choice'>,
    never
  >
>

/** An optional token field is typed as optional, and an enum as its values. */
export type OptionalAndEnumTokensAreTyped = Assert<
  Equals<
    [ConnectPageParamAt<TokenRequest, 'maxAge'>, ConnectPageParamAt<TokenRequest, 'role'>],
    [number | undefined, 0 | 1 | 2]
  >
>

// @ts-expect-error a message field cannot carry the token
export type MessagePathRejected = ConnectInfiniteQueryOptions<ListUsersRequestSchema, ListUsersResponseSchema, 'query'>

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

/**
 * A transport failure stays a `ConnectError`; a throwing `getNextPageParam`
 * is a `QueryError` and an adapter refusal a `ConnectAdapterError`.
 */
export type InfiniteErrorKeepsItsKinds = Assert<
  Equals<
    ConnectInfiniteQueryResult<string>['error'],
    Signal<ConnectError | ConnectAdapterError | QueryError | undefined>
  >
>

/** The set grows forward only, so the backward controls are absent. */
export type InfiniteResultOmitsBackwardControls = Assert<
  Equals<
    Extract<
      keyof ConnectInfiniteQueryResult<string>,
      'hasPreviousPage' | 'isFetchingPreviousPage' | 'fetchPreviousPage'
    >,
    never
  >
>

export type InfiniteResultGrowsForward = Assert<
  Equals<
    Pick<ConnectInfiniteQueryResult<string>, 'hasNextPage' | 'isFetchingNextPage'>,
    { readonly hasNextPage: Signal<boolean>; readonly isFetchingNextPage: Signal<boolean> }
  >
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
  onError: (error, input) =>
    void [error instanceof Error ? error.message : error, input.pageSize],
}

/** A hook's failure keeps its own value, so `onError` narrows before reading a code. */
export type MutationOnErrorMustNarrow = Assert<
  Equals<
    Parameters<
      NonNullable<ConnectMutationOptions<ListUsersRequestSchema, UserSchema>['onError']>
    >[0],
    unknown
  >
>

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

export type MutationErrorMustBeNarrowed = Assert<
  Equals<ConnectMutationResult<ListUsersRequestSchema, UserSchema>['error'], Signal<unknown>>
>

/** Optimistic rollback is the application's; there is no framework option for it. */
export const noFrameworkRollback: ConnectMutationOptions<ListUsersRequestSchema, UserSchema> = {
  // @ts-expect-error rollbackOnError is not an option
  rollbackOnError: true,
}

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

/**
 * A failed call keeps its `ConnectError`, but a request that cannot be keyed
 * or a throwing `reduce` keeps its own value, so `error` is narrowed first.
 */
export type StreamErrorMustBeNarrowed = Assert<
  Equals<ConnectStreamResult<UserSchema>['error'], Signal<unknown>>
>
export type StreamListErrorMustBeNarrowed = Assert<
  Equals<ConnectStreamListResult<UserSchema, string>['error'], Signal<unknown>>
>

/** Restarting is `connect()`, which starts fresh; there is no `reset()`. */
export type StreamHasNoReset = Assert<
  Equals<'reset' extends keyof ConnectStreamResult<UserSchema> ? true : false, false>
>
export type StreamListHasNoReset = Assert<
  Equals<
    'reset' extends keyof ConnectStreamListResult<UserSchema, string> ? true : false,
    false
  >
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

// ---------------------------------------------------------------------------
// Adapters
// ---------------------------------------------------------------------------

declare const listUsers: ListUsers
declare const watchUsers: WatchUsers

/** The input function returns the method's request initializer. */
export const queryOverRequest = createConnectQuery(listUsers, () => ({
  pageSize: 50,
  query: { cursor: 'abc' },
}))

/** The response message is what the query holds. */
export type QueryHoldsTheResponse = Assert<
  Equals<typeof queryOverRequest, ConnectQueryResult<ListUsersResponse>>
>

// @ts-expect-error a request field of the wrong type is refused
export const queryWithWrongField = createConnectQuery(listUsers, () => ({ pageSize: 'fifty' }))

/** `select` projects the response, and the result is typed from it. */
export const projectedAdapterQuery = createConnectQuery(listUsers, () => ({}), {
  select: response => response.users.length,
})

export type SelectedQueryIsProjected = Assert<
  Equals<typeof projectedAdapterQuery, ConnectQueryResult<number>>
>

/** Naming a projection type without a projection is refused. */
export const projectionWithoutSelect = createConnectQuery<
  ListUsersRequestSchema,
  ListUsersResponseSchema,
  number
  // @ts-expect-error select is required once the data type differs from the response
>(listUsers, () => ({}), { staleTime: 1 })

// @ts-expect-error a server-streaming method has no single response to cache
export const streamingQuery = createConnectQuery(watchUsers, () => ({}))

/** A mutation takes the request initializer and resolves with the response. */
export const adapterMutation = createConnectMutation(listUsers, {
  onSuccess: (response, input) => void [response.nextPageToken, input.pageSize],
})

export type MutationTakesTheRequest = Assert<
  Equals<Parameters<typeof adapterMutation.mutate>[0], MessageInitShape<ListUsersRequestSchema>>
>

export type MutationResolvesWithTheResponse = Assert<
  Equals<ReturnType<typeof adapterMutation.mutate>, Promise<ListUsersResponse>>
>

// @ts-expect-error a server-streaming method is not a mutation
export const streamingMutation = createConnectMutation(watchUsers)

declare const uploadUsers: DescMethodClientStreaming<ListUsersRequestSchema, UserSchema>
declare const chatUsers: DescMethodBiDiStreaming<ListUsersRequestSchema, UserSchema>

/** A stream takes the request initializer and holds the output message. */
export const adapterStream = createConnectStream(watchUsers, () => ({
  pageSize: 50,
  query: { cursor: 'abc' },
}))

export type StreamHoldsTheMessage = Assert<
  Equals<typeof adapterStream, ConnectStreamResult<UserSchema>>
>

export type StreamLatestIsTheMessage = Assert<
  Equals<typeof adapterStream.latest, Signal<User | undefined>>
>

/** A fold's accumulator is inferred from `initial`, and `reduce` is typed by it. */
export const foldedAdapterStream = createConnectStream(watchUsers, () => ({}), {
  transport: 'account',
  initial: () => 0,
  reduce: (count, user) => count + user.displayName.length,
})

export type FoldedStreamValue = Assert<
  Equals<typeof foldedAdapterStream, ConnectStreamResult<UserSchema, number>>
>

/** A list's row key is inferred from `itemKey`. */
export const adapterStreamList = createConnectStreamList(watchUsers, () => ({}), {
  itemKey: user => user.id,
  limit: 100,
  insert: 'prepend',
})

export type StreamListKeysAreItemKeys = Assert<
  Equals<typeof adapterStreamList, ConnectStreamListResult<UserSchema, string>>
>

// @ts-expect-error a request field of the wrong type is refused
export const streamWithWrongField = createConnectStream(watchUsers, () => ({ pageSize: 'fifty' }))

// @ts-expect-error a unary method is not a server stream
export const unaryStream = createConnectStream(listUsers, () => ({}))

// @ts-expect-error a client-streaming method is not a server stream
export const clientStream = createConnectStream(uploadUsers, () => ({}))

export const bidiStreamList = createConnectStreamList(
  // @ts-expect-error a bidirectional method is not a server stream
  chatUsers,
  () => ({}),
  { itemKey: (user: User) => user.id }
)

export const streamWithOpen = createConnectStream(watchUsers, () => ({}), {
  // @ts-expect-error the adapter opens the call from the method descriptor
  open: () => ({}) as AsyncIterable<User>,
})

export const streamListWithKey = createConnectStreamList(watchUsers, () => ({}), {
  itemKey: user => user.id,
  // @ts-expect-error the adapter builds the key from the request
  key: () => ['mine'],
})

export const streamWithHeaderCallback = createConnectStream(watchUsers, () => ({}), {
  callOptions: {
    // @ts-expect-error header callbacks are not accepted through call options
    onHeader: () => undefined,
  },
})

// @ts-expect-error collection mode needs row identity
export const streamListWithoutItemKey = createConnectStreamList(watchUsers, () => ({}), {})

/**
 * An infinite query takes the request initializer, and its pages are the
 * response messages, keyed by the named field's type.
 */
export const adapterInfiniteQuery = createConnectInfiniteQuery(
  listUsers,
  () => ({ pageSize: 50, pageToken: '' }),
  {
    pageParamKey: 'pageToken',
    getNextPageParam: page => page.nextPageToken || undefined,
  }
)

export type InfinitePagesAreResponses = Assert<
  Equals<
    typeof adapterInfiniteQuery,
    ConnectInfiniteQueryResult<InfiniteData<ListUsersResponse, string | undefined>>
  >
>

/** A nested token is typed from the nested field. */
export const nestedAdapterInfiniteQuery = createConnectInfiniteQuery(
  listUsers,
  () => ({ query: { filter: 'active' } }),
  { pageParamKey: 'query.cursor', getNextPageParam: page => page.nextPageToken || undefined }
)

export type NestedInfinitePagesAreResponses = Assert<
  Equals<
    typeof nestedAdapterInfiniteQuery,
    ConnectInfiniteQueryResult<InfiniteData<ListUsersResponse, string | undefined>>
  >
>

/** `select` projects the set, and the result is typed from it. */
export const projectedAdapterInfiniteQuery = createConnectInfiniteQuery(
  listUsers,
  () => ({}),
  {
    pageParamKey: 'pageToken',
    getNextPageParam: page => page.nextPageToken || undefined,
    select: data => data.pages.flatMap(page => page.users),
  }
)

export type ProjectedInfiniteIsProjected = Assert<
  Equals<typeof projectedAdapterInfiniteQuery, ConnectInfiniteQueryResult<User[]>>
>

export const infiniteWithMessagePath = createConnectInfiniteQuery(listUsers, () => ({}), {
  // @ts-expect-error a message field cannot carry the token
  pageParamKey: 'query',
  getNextPageParam: () => undefined,
})

export const infiniteWithWrongTokenType = createConnectInfiniteQuery(listUsers, () => ({}), {
  pageParamKey: 'pageToken',
  // @ts-expect-error the next token has the named field's type
  getNextPageParam: () => 42,
})

// @ts-expect-error a server-streaming method has no pages to ask for
export const streamingInfinite = createConnectInfiniteQuery(watchUsers, () => ({}), {
  pageParamKey: 'pageToken',
  getNextPageParam: () => undefined,
})

export const infiniteWithInitialPageParam = createConnectInfiniteQuery(listUsers, () => ({}), {
  pageParamKey: 'pageToken',
  getNextPageParam: () => undefined,
  // @ts-expect-error the first token is read from the input
  initialPageParam: 'first',
})
