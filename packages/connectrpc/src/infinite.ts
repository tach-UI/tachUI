/**
 * `createConnectInfiniteQuery`: a unary Connect list method as a
 * `@tachui/query` infinite query.
 *
 * The adapter supplies what the method descriptor and `pageParamKey` decide —
 * the key, where the first page starts, and how a page is asked for — and
 * `@tachui/query` does the rest: one entry holding every page, appends through
 * the loader path, sequential refetch from the first page held, invalidation,
 * and per-page retry. The continuation token stays opaque to it.
 *
 * Each key evaluation takes one value from the input function. The key is
 * built from it with the token left out, and a normalized snapshot of it is
 * kept beside the key: every page for that key, retries included, is that
 * snapshot with its token written in, so nothing the caller does to its object
 * or its signals afterwards reaches a request already keyed. A newly selected
 * key starts from the token in its own snapshot; a change to the token alone
 * keeps the key, and so the pages already held.
 *
 * Calls are shared and bounded per observer exactly as a unary query's are
 * (see `./observer`), with one call per page.
 */

import type {
  DescMessage,
  DescMethodUnary,
  MessageInitShape,
  MessageShape,
} from '@bufbuild/protobuf'
import { createMemo, onCleanup, untrack } from '@tachui/core'
import { createInfiniteQuery } from '@tachui/query'
import type {
  InfiniteData,
  InfiniteQueryLoadContext,
  InfiniteQueryOptions,
  QueryKey,
} from '@tachui/query'

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
import {
  initialPageParam,
  resolvePageParamPath,
  withPageParam,
} from './page-param'
import { assertOptionsObject, resolveAdapterTransport } from './transport'
import type {
  ConnectInfiniteQueryOptions,
  ConnectInfiniteQueryResult,
  ConnectPageParamAt,
  ConnectPageParamKey,
  ConnectQueryKey,
} from './types'

/** Where every page of one key starts: its request, and its first token. */
interface KeyStart<I extends DescMessage> {
  readonly request: MessageShape<I>
  readonly pageParam: unknown
}

/** A key evaluation: the key, or why there is none. */
type Keyed = { readonly key: ConnectQueryKey } | { readonly failure: unknown }

/** What the query layer is handed while the request cannot be keyed. */
const UNKEYED: QueryKey = ['connect', 'unkeyed', 'infinite']

/**
 * Observes the pages of a unary list method for the request `input` returns,
 * accumulated into one cached set.
 *
 * Call it during a component render, below `provideConnectTransport`. The
 * transport, `pageParamKey`, and the other options are checked here: a missing
 * provider, a conflicting binding, a `client` option that is not the one the
 * transport is bound to, a non-unary method, or a `pageParamKey` that is not a
 * path to a singular scalar or enum request field throws a
 * `ConnectAdapterError` before anything is called or cached.
 *
 * `input` is reactive, and the first page is asked for with the token it
 * gives at `pageParamKey`. An implicit field left out starts from its default;
 * a token given as `null`, a message on the path left unset, or an `optional`
 * token field left unset is reported through `error` without a call.
 * `options.retry` retries a page only for `unavailable` and
 * `resource_exhausted`, and never replays the pages before it.
 */
export function createConnectInfiniteQuery<
  I extends DescMessage,
  O extends DescMessage,
  ParamKey extends ConnectPageParamKey<MessageInitShape<I>>,
>(
  method: DescMethodUnary<I, O>,
  input: () => MessageInitShape<I>,
  options: ConnectInfiniteQueryOptions<I, O, ParamKey>
): ConnectInfiniteQueryResult<
  InfiniteData<MessageShape<O>, ConnectPageParamAt<MessageInitShape<I>, ParamKey>>
>
export function createConnectInfiniteQuery<
  I extends DescMessage,
  O extends DescMessage,
  ParamKey extends ConnectPageParamKey<MessageInitShape<I>>,
  TData,
>(
  method: DescMethodUnary<I, O>,
  input: () => MessageInitShape<I>,
  options: ConnectInfiniteQueryOptions<I, O, ParamKey, TData>
): ConnectInfiniteQueryResult<TData>
export function createConnectInfiniteQuery<
  I extends DescMessage,
  O extends DescMessage,
  ParamKey extends ConnectPageParamKey<MessageInitShape<I>>,
  TData,
>(
  method: DescMethodUnary<I, O>,
  input: () => MessageInitShape<I>,
  options:
    | ConnectInfiniteQueryOptions<I, O, ParamKey, TData>
    | ConnectInfiniteQueryOptions<I, O, ParamKey>
): ConnectInfiniteQueryResult<TData> {
  assertUnaryMethod(method, 'createConnectInfiniteQuery()')
  const caller = `createConnectInfiniteQuery() for ${describeMethod(method)}`
  const shape = 'Pass an options object with pageParamKey and getNextPageParam.'
  assertOptionsObject(options, caller, shape)
  if (options === undefined) {
    throw new ConnectAdapterError(`${caller} was given no options. ${shape}`)
  }
  // Read once, so the path the key omits and the path pages are written to
  // are always the same one.
  const path = resolvePageParamPath(method.input, options.pageParamKey, caller)
  const getNextPageParam = options.getNextPageParam
  if (typeof getNextPageParam !== 'function') {
    throw new ConnectAdapterError(
      `${caller} was given ${typeof getNextPageParam} as getNextPageParam. Pass a function that returns the next page's token from a response, or undefined or null when there is none.`
    )
  }
  const retry = retryCountFrom(options.retry, caller)
  // Read once: changing the options object afterwards changes no call, a
  // retry included, and cannot slip past the checks made on it here.
  const callOptions = callOptionsFrom(options.callOptions, caller)
  const { name, transport, client } = resolveAdapterTransport(
    caller,
    options.transport,
    options.client
  )
  const userEnabled = options.enabled
  const gateOpen = (): boolean =>
    typeof userEnabled === 'function' ? userEnabled() : (userEnabled ?? true)

  // Where each key's pages start, by the key's identity: the loader and the
  // first-page lookup are handed back the very array the key accessor returned.
  const starts = new WeakMap<QueryKey, KeyStart<I>>()
  const keyOptions = {
    transport: name,
    keyExtension: options.keyExtension,
    pageParamKey: path.key,
  }
  const keyed = createMemo<Keyed>(() => {
    try {
      let init: unknown
      const built = buildConnectKey(method, () => {
        init = input()
        return init as MessageInitShape<I>
      }, keyOptions)
      starts.set(built.key, {
        request: built.request,
        pageParam: initialPageParam(path, built.request, init, caller),
      })
      return { key: built.key }
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

  function startOf(key: QueryKey): KeyStart<I> {
    const start = starts.get(key)
    if (start === undefined) {
      throw new ConnectAdapterError(
        `${caller} was asked to load a key it did not build, so it has no request to send.`
      )
    }
    return start
  }

  async function load({
    signal,
    key,
    pageParam,
  }: InfiniteQueryLoadContext<unknown>): Promise<MessageShape<O>> {
    const request = withPageParam(
      method.input,
      path,
      startOf(key).request,
      pageParam,
      caller
    )
    return calls.call(key, request, signal)
  }

  const query = createInfiniteQuery<MessageShape<O>, unknown, TData, unknown>({
    ...(options as unknown as InfiniteQueryOptions<
      MessageShape<O>,
      unknown,
      TData,
      unknown
    >),
    key: () => {
      const current = keyed()
      return 'key' in current ? current.key : UNKEYED
    },
    enabled: () => !('failure' in keyed()) && gateOpen(),
    load,
    // Asked only of an entry holding no pages: a held set reloads from its
    // own first token, whoever observes it.
    initialPageParamFor: (key: QueryKey) => startOf(key).pageParam,
    initialPageParam: undefined,
    getNextPageParam,
    getPreviousPageParam: undefined,
    maxPages: undefined,
    // Retries happen inside the loader, per page, where only two codes qualify.
    retry: 0,
    retryDelay: undefined,
    client,
  } as InfiniteQueryOptions<MessageShape<O>, unknown, TData, unknown>)

  onCleanup(() => {
    calls.dispose(canceledError('the query observer was disposed'))
  })

  const overlay = createMemo<LocalFailure | undefined>(() => {
    const current = keyed()
    return 'failure' in current ? { error: current.failure } : calls.local()
  })

  /** Runs work this observer asked for, bounded by its own waits. */
  function follow<T>(work: () => Promise<T>): Promise<T> {
    const current = untrack(keyed)
    if ('failure' in current) {
      return Promise.reject(current.failure)
    }
    calls.clear()
    return calls.follow(current.key, work())
  }

  const result = {
    data: query.data,
    ...overlayState(query, overlay),
    isStale: query.isStale,
    updatedAt: query.updatedAt,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: createMemo(
      () => overlay() === undefined && query.isFetchingNextPage()
    ),

    refetch: () => follow(() => query.refetch()),
    fetchNextPage: () => follow(() => query.fetchNextPage()),
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
  return result as ConnectInfiniteQueryResult<TData>
}
