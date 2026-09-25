/**
 * @tachui/connectrpc - optional ConnectRPC adapter for tachUI.
 *
 * Maps generated Connect service methods onto `@tachui/query`. Applications
 * construct and configure their own transports; authentication, tracing, and
 * metadata stay in Connect interceptors. Nothing here serializes Protobuf,
 * speaks a Connect protocol, or builds a transport.
 *
 * @packageDocumentation
 */

export { DEFAULT_TRANSPORT_NAME, isRetryableCode } from './defaults'
export { ConnectAdapterError } from './errors'
export { provideConnectTransport, useConnectTransport } from './transport'
export type {
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
} from './types'
