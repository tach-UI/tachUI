/**
 * @tachui/query - backend-neutral reactive query layer for tachUI.
 *
 * Request lifecycle, an in-memory cache, mutations, and async streams, built on
 * `@tachui/core` signals and ownership. It knows nothing about Protobuf,
 * ConnectRPC, REST, or GraphQL; transport adapters layer on top.
 *
 * @packageDocumentation
 */

export {
  DEFAULT_ENABLED,
  DEFAULT_GC_TIME,
  DEFAULT_RETRY,
  DEFAULT_SNAPSHOT,
  DEFAULT_STALE_TIME,
} from './defaults'
export { isDevelopment, isServer, QueryError } from './errors'
export type {
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
  QueryOptionsBase,
  QueryResult,
  QueryStatus,
  RetryPolicy,
} from './types'
