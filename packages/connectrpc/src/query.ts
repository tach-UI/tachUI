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
import { ConnectError } from '@connectrpc/connect'
import {
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  untrack,
} from '@tachui/core'
import { createQuery, hashQueryKey } from '@tachui/query'
import type {
  QueryKey,
  QueryKeyHash,
  QueryLoadContext,
  QueryOptions,
} from '@tachui/query'

import {
  assertUnaryMethod,
  callOptionsFrom,
  callUnary,
  canceledError,
  linkSignals,
  retryCountFrom,
  retryDelay,
  sleep,
} from './call'
import { isRetryableCode } from './defaults'
import { ConnectAdapterError } from './errors'
import { buildConnectKey, describeMethod } from './keys'
import { assertOptionsObject, resolveAdapterTransport } from './transport'
import type {
  ConnectQueryKey,
  ConnectQueryOptions,
  ConnectQueryResult,
} from './types'
import {
  beginExecution,
  currentExecution,
  settleExecution,
  Wait,
  watchEntry,
} from './waits'
import type { Execution, Watcher } from './waits'

/** A key evaluation: the key and its request, or why there is neither. */
type Keyed<I extends DescMessage> =
  | { readonly key: ConnectQueryKey; readonly request: MessageShape<I> }
  | { readonly failure: unknown }

/** An observer-local failure, and the execution it gave up on, if any. */
interface LocalFailure {
  readonly error: unknown
  readonly execution?: Execution
}

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

  const [local, setLocal] = createSignal<LocalFailure | undefined>(undefined)
  // Mirrored outside the graph, for the callbacks that compare against it.
  let localFailure: LocalFailure | undefined
  function report(failure: LocalFailure | undefined): void {
    localFailure = failure
    setLocal(() => failure)
  }

  let wait: Wait | undefined
  let watching: QueryKeyHash | undefined
  let unwatch: (() => void) | undefined
  let disposed = false
  const bounds = { signal: callOptions.signal, timeoutMs: callOptions.timeoutMs }

  /** Waits on `execution`, reporting a give-up only while watching its entry. */
  function waitOn(execution: Execution): Wait {
    return new Wait(execution, {
      ...bounds,
      onGiveUp: error => {
        if (watching === execution.hash) {
          report({ error, execution })
        }
      },
    })
  }

  const watcher: Watcher = {
    begin(execution) {
      wait?.leave()
      report(undefined)
      wait = waitOn(execution)
    },
    settled(execution, succeeded) {
      if (wait?.execution === execution) {
        wait = undefined
      }
      // The response arrived after all, for someone still waiting: it is in
      // the cache now, so this observer shows it rather than why it stopped.
      if (succeeded && localFailure?.execution === execution) {
        report(undefined)
      }
    },
  }

  function stopWatching(failure?: unknown): void {
    unwatch?.()
    unwatch = undefined
    watching = undefined
    wait?.leave(failure)
    wait = undefined
  }

  // Created before the query, so a watcher is in place when its first
  // execution starts and a signal aborted in advance stops it before a call.
  createEffect(() => {
    const current = keyed()
    const open = gateOpen()
    untrack(() => {
      if (disposed) {
        return
      }
      let hash: QueryKeyHash | undefined
      if (open && 'key' in current) {
        try {
          hash = hashQueryKey(current.key)
        } catch {
          // The query surfaces an unhashable key itself.
          hash = undefined
        }
      }
      if (hash === watching) {
        return
      }
      stopWatching()
      report(undefined)
      if (hash !== undefined) {
        watching = hash
        unwatch = watchEntry(client, hash, watcher)
      }
    })
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
    const execution = beginExecution(client, key)
    const link = linkSignals([
      {
        signal,
        failure: reason => canceledError('the query was cancelled', reason),
      },
      { signal: execution.stop.signal, failure: reason => reason },
    ])
    let succeeded = false
    try {
      for (let attempt = 0; ; attempt += 1) {
        try {
          // No transport deadline: the call is shared, and each observer's
          // deadline is enforced on its own wait instead.
          const message = await callUnary(
            transport,
            method,
            request as MessageInitShape<I>,
            link.signal,
            undefined,
            callOptions
          )
          succeeded = true
          return message
        } catch (error) {
          if (
            attempt >= retry ||
            !(error instanceof ConnectError) ||
            !isRetryableCode(error.code)
          ) {
            throw error
          }
          // Rejects with the stop reason if everyone leaves meanwhile, so no
          // later attempt starts for nobody.
          await sleep(retryDelay(attempt + 1), link.signal)
        }
      }
    } finally {
      link.release()
      settleExecution(client, execution, succeeded)
    }
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
    disposed = true
    stopWatching(canceledError('the query observer was disposed'))
  })

  const overlay = createMemo<LocalFailure | undefined>(() => {
    const current = keyed()
    return 'failure' in current ? { error: current.failure } : local()
  })
  const status = createMemo(() =>
    overlay() === undefined ? query.status() : 'error'
  )
  const fetchStatus = createMemo(() =>
    overlay() === undefined ? query.fetchStatus() : 'idle'
  )

  return {
    data: query.data,
    error: createMemo(() => {
      const failure = overlay()
      return failure === undefined ? query.error() : failure.error
    }),
    status,
    fetchStatus,
    isLoading: createMemo(() => status() === 'loading'),
    isFetching: createMemo(() => fetchStatus() === 'fetching'),
    isRefreshing: createMemo(
      () => fetchStatus() === 'fetching' && status() === 'success'
    ),
    isStale: query.isStale,
    updatedAt: query.updatedAt,

    refetch: () => {
      const current = untrack(keyed)
      if ('failure' in current) {
        return Promise.reject(current.failure)
      }
      report(undefined)
      const pending = query.refetch()
      // The refetch has started or joined its execution synchronously.
      const execution = currentExecution(client, current.key)
      if (execution === undefined) {
        return pending
      }
      if (wait === undefined || wait.done || wait.execution !== execution) {
        const joined = waitOn(execution)
        if (watching === execution.hash) {
          wait = joined
        }
        return joined.race(pending)
      }
      return wait.race(pending)
    },
    invalidate: () => {
      if (!('failure' in untrack(keyed))) {
        query.invalidate()
      }
    },
    cancel: () => {
      query.cancel()
      wait?.giveUp(canceledError('the query was cancelled'))
    },
    dispose: () => {
      disposed = true
      stopWatching(canceledError('the query observer was disposed'))
      query.dispose()
    },
  }
}
