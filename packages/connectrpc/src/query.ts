/**
 * `createConnectQuery`: a unary Connect method as a `@tachui/query` query.
 *
 * The adapter supplies what the method descriptor decides — the key, the
 * loader, and a retry policy restricted to two codes — and `@tachui/query`
 * does everything else: the cache entry, deduplication, freshness, retention,
 * invalidation, and the signals a component binds to.
 *
 * Each key evaluation builds the key and the request from one call of the
 * input function, and the request is what every attempt for that key sends,
 * retries included. Observers of one key share one call; each one's signal and
 * deadline bound only its own wait on it (see `./waits`).
 */

import type {
  DescMessage,
  DescMethodUnary,
  MessageInitShape,
  MessageShape,
} from '@bufbuild/protobuf'
import { createMemo, onCleanup, untrack } from '@tachui/core'
import { createQuery } from '@tachui/query'
import type { QueryKey, QueryLoadContext, QueryOptions } from '@tachui/query'

import {
  assertUnaryMethod,
  callOptionsFrom,
  canceledError,
  retryCountFrom,
} from './call'
import { ConnectAdapterError } from './errors'
import { buildConnectKey, describeMethod } from './keys'
import { createSharedCalls, overlayState } from './observer'
import type { LocalFailure } from './observer'
import { assertOptionsObject, resolveAdapterTransport } from './transport'
import type {
  ConnectQueryKey,
  ConnectQueryOptions,
  ConnectQueryResult,
} from './types'

/** A key evaluation: the key and its request, or why there is neither. */
type Keyed<I extends DescMessage> =
  | { readonly key: ConnectQueryKey; readonly request: MessageShape<I> }
  | { readonly failure: unknown }

/**
 * What the query layer is handed while the request cannot be keyed. Never
 * observed or fetched — the query is gated off meanwhile — but a key accessor
 * has to return something.
 */
const UNKEYED: QueryKey = ['connect', 'unkeyed']

/**
 * Observes a unary method's response for the request `input` returns.
 *
 * Call it during a component render, below `provideConnectTransport`. The
 * transport named by `options.transport` (default `'default'`) is resolved
 * here, and a missing provider, a conflicting binding, or a `client` option
 * that is not the one the transport is bound to throws a `ConnectAdapterError`
 * before anything is called or cached.
 *
 * `input` is reactive: reading a signal in it changes the request, and so the
 * key. `options.retry` retries only `unavailable` and `resource_exhausted`,
 * with capped exponential backoff and full jitter.
 */
export function createConnectQuery<I extends DescMessage, O extends DescMessage>(
  method: DescMethodUnary<I, O>,
  input: () => MessageInitShape<I>,
  options?: ConnectQueryOptions<O>
): ConnectQueryResult<MessageShape<O>>
export function createConnectQuery<
  I extends DescMessage,
  O extends DescMessage,
  TData,
>(
  method: DescMethodUnary<I, O>,
  input: () => MessageInitShape<I>,
  options: ConnectQueryOptions<O, TData>
): ConnectQueryResult<TData>
export function createConnectQuery<
  I extends DescMessage,
  O extends DescMessage,
  TData,
>(
  method: DescMethodUnary<I, O>,
  input: () => MessageInitShape<I>,
  options?: ConnectQueryOptions<O, TData> | ConnectQueryOptions<O>
): ConnectQueryResult<TData> {
  assertUnaryMethod(method, 'createConnectQuery()')
  const caller = `createConnectQuery() for ${describeMethod(method)}`
  assertOptionsObject(
    options,
    caller,
    'Pass an options object, or omit it.'
  )
  const retry = retryCountFrom(options?.retry, caller)
  // Read once: changing the options object afterwards changes no call, a
  // retry included, and cannot slip past the checks made on it here.
  const callOptions = callOptionsFrom(options?.callOptions, caller)
  const { name, transport, client } = resolveAdapterTransport(
    caller,
    options?.transport,
    options?.client
  )
  const userEnabled = options?.enabled
  const gateOpen = (): boolean =>
    typeof userEnabled === 'function' ? userEnabled() : (userEnabled ?? true)

  // The request each key was built from, by the key's identity: the loader is
  // handed back the very array the key accessor returned.
  const requests = new WeakMap<QueryKey, MessageShape<I>>()
  const keyOptions = { transport: name, keyExtension: options?.keyExtension }
  const keyed = createMemo<Keyed<I>>(() => {
    try {
      const built = buildConnectKey(method, input, keyOptions)
      requests.set(built.key, built.request)
      return built
    } catch (failure) {
      // Surfaced through `error` rather than thrown into whatever rendered.
      return { failure }
    }
  })

  const calls = createSharedCalls({
    method,
    transport,
    client,
    retry,
    callOptions,
    watched: () => {
      const current = keyed()
      return gateOpen() && 'key' in current ? current.key : undefined
    },
  })

  async function load({
    signal,
    key,
  }: QueryLoadContext): Promise<MessageShape<O>> {
    const request = requests.get(key)
    if (request === undefined) {
      throw new ConnectAdapterError(
        `${caller} was asked to load a key it did not build, so it has no request to send.`
      )
    }
    return calls.call(key, request as MessageInitShape<DescMessage>, signal)
  }

  const query = createQuery<MessageShape<O>, TData, unknown>({
    ...(options as QueryOptions<MessageShape<O>, TData, unknown>),
    key: () => {
      const current = keyed()
      return 'key' in current ? current.key : UNKEYED
    },
    enabled: () => !('failure' in keyed()) && gateOpen(),
    load,
    // Retries happen inside the loader, where only two codes qualify.
    retry: 0,
    retryDelay: undefined,
    client,
  })

  onCleanup(() => {
    calls.dispose(canceledError('the query observer was disposed'))
  })

  const overlay = createMemo<LocalFailure | undefined>(() => {
    const current = keyed()
    return 'failure' in current ? { error: current.failure } : calls.local()
  })

  return {
    data: query.data,
    ...overlayState(query, overlay),
    isStale: query.isStale,
    updatedAt: query.updatedAt,

    refetch: () => {
      const current = untrack(keyed)
      if ('failure' in current) {
        return Promise.reject(current.failure)
      }
      calls.clear()
      return calls.follow(current.key, query.refetch())
    },
    invalidate: () => {
      if (!('failure' in untrack(keyed))) {
        query.invalidate()
      }
    },
    cancel: () => {
      query.cancel()
      calls.giveUp(canceledError('the query was cancelled'))
    },
    dispose: () => {
      calls.dispose(canceledError('the query observer was disposed'))
      query.dispose()
    },
  }
}
