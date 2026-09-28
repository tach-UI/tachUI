/**
 * One query observer's side of the calls it shares with the other observers
 * of an entry: shared by `createConnectQuery` and `createConnectInfiniteQuery`.
 *
 * `@tachui/query` runs one loader for every observer of an entry, so a call is
 * shared, but a Connect call's signal and deadline belong to whoever asked.
 * This watches the entry the observer's key names, holds its wait on each call
 * made for that entry (see `./waits`), makes the calls themselves — retrying
 * only what may be retried — and reports a wait this observer gave up as a
 * failure local to it, which the adapter overlays on the query's own state.
 *
 * A call is one execution of the entry. A unary query makes one per load; an
 * infinite query makes one per page, so an observer's signal and deadline
 * bound its wait on each page's call.
 */

import type {
  DescMessage,
  DescMethodUnary,
  MessageInitShape,
  MessageShape,
} from '@bufbuild/protobuf'
import { ConnectError } from '@connectrpc/connect'
import type { Transport } from '@connectrpc/connect'
import { createEffect, createMemo, createSignal, untrack } from '@tachui/core'
import { hashQueryKey } from '@tachui/query'
import type {
  QueryClient,
  QueryKey,
  QueryKeyHash,
  QueryResult,
} from '@tachui/query'

import {
  callUnary,
  canceledError,
  linkSignals,
  retryDelay,
  sleep,
} from './call'
import { isRetryableCode } from './defaults'
import type { ConnectCallOptions } from './types'
import {
  beginExecution,
  currentExecution,
  resumeWhenJoined,
  settleExecution,
  Wait,
  watchEntry,
} from './waits'
import type { Execution, Watcher } from './waits'

/** An observer-local failure, and the execution it gave up on, if any. */
export interface LocalFailure {
  readonly error: unknown
  readonly execution?: Execution
}

/** What one observer's calls go through, read once when it is created. */
export interface SharedCallsConfig<I extends DescMessage, O extends DescMessage> {
  readonly method: DescMethodUnary<I, O>
  readonly transport: Transport
  readonly client: QueryClient
  /** Retries allowed per call; only two codes ever qualify. */
  readonly retry: number
  readonly callOptions: ConnectCallOptions
  /**
   * The key of the entry this observer shows, or `undefined` while it is gated
   * off or cannot be keyed. Tracked: the observer follows it as it changes.
   */
  readonly watched: () => QueryKey | undefined
}

export interface SharedCalls<O extends DescMessage> {
  /** Why this observer stopped waiting, while that is what it shows. */
  readonly local: () => LocalFailure | undefined
  /** Clears a local failure, as a fresh request from this observer does. */
  clear(): void
  /**
   * Makes one call as an execution of `key`'s entry, sending `request` on
   * every attempt. Everyone watching the entry waits on it; it stops once
   * nobody is, and is started over for whoever joins while the query layer
   * still holds it.
   */
  call(
    key: QueryKey,
    request: MessageInitShape<DescMessage>,
    signal: AbortSignal
  ): Promise<MessageShape<O>>
  /**
   * Bounds `pending`, work this observer just asked for on `key`'s entry, by
   * this observer's own signal and deadline: it rejects with the failure this
   * observer gives up with on any call for that entry while it is pending.
   */
  follow<T>(key: QueryKey, pending: Promise<T>): Promise<T>
  /** Gives up the current wait, as `cancel()` does. */
  giveUp(failure: unknown): void
  /** Stops watching for good, failing whatever is pending with `failure`. */
  dispose(failure: unknown): void
}

/**
 * Starts one observer's shared calls. Create it before the query, so a watcher
 * is in place when the first execution starts and a signal aborted in advance
 * stops it before a call.
 */
export function createSharedCalls<I extends DescMessage, O extends DescMessage>(
  config: SharedCallsConfig<I, O>
): SharedCalls<O> {
  const { method, transport, client, retry, watched } = config
  const { signal: applicationSignal, timeoutMs, headers, contextValues } =
    config.callOptions
  const callOptions = { headers, contextValues }
  const bounds = { signal: applicationSignal, timeoutMs }

  const [local, setLocal] = createSignal<LocalFailure | undefined>(undefined)
  // Mirrored outside the graph, for the callbacks that compare against it.
  let localFailure: LocalFailure | undefined
  function report(failure: LocalFailure | undefined): void {
    localFailure = failure
    setLocal(() => failure)
  }

  let wait: Wait | undefined
  // Waits a refetch took on an entry this observer does not watch, as a gated
  // query's do, so disposal can still withdraw them.
  const refetchWaits = new Set<Wait>()
  // Work this observer asked for, bounded by every wait it holds on the entry
  // while the work is pending, not only the first: an infinite query's work
  // spans a call per page.
  const followers = new Set<{
    readonly hash: QueryKeyHash
    readonly reject: (failure: unknown) => void
  }>()
  let watching: QueryKeyHash | undefined
  let unwatch: (() => void) | undefined
  let disposed = false

  /** Waits on `execution`, reporting a give-up only while watching its entry. */
  function waitOn(execution: Execution): Wait {
    return new Wait(execution, {
      ...bounds,
      onGiveUp: error => {
        if (watching === execution.hash) {
          report({ error, execution })
        }
        for (const follower of [...followers]) {
          if (follower.hash === execution.hash) {
            follower.reject(error)
          }
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
    if (failure !== undefined) {
      for (const refetchWait of [...refetchWaits]) {
        refetchWait.leave(failure)
      }
      refetchWaits.clear()
      for (const follower of [...followers]) {
        follower.reject(failure)
      }
      followers.clear()
    }
  }

  createEffect(() => {
    const key = watched()
    untrack(() => {
      if (disposed) {
        return
      }
      let hash: QueryKeyHash | undefined
      if (key !== undefined) {
        try {
          hash = hashQueryKey(key)
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

  /** Calls, retrying as allowed, until the call succeeds or has to stop. */
  async function callWithRetries(
    request: MessageInitShape<DescMessage>,
    signal: AbortSignal,
    execution: Execution,
    progress: { retries: number }
  ): Promise<MessageShape<O>> {
    const link = linkSignals([
      {
        signal,
        failure: reason => canceledError('the query was cancelled', reason),
      },
      { signal: execution.stop.signal, failure: reason => reason },
    ])
    try {
      for (;;) {
        try {
          // No transport deadline: the call is shared, and each observer's
          // deadline is enforced on its own wait instead.
          return await callUnary(
            transport,
            method,
            request as MessageInitShape<I>,
            link.signal,
            undefined,
            callOptions
          )
        } catch (error) {
          if (
            progress.retries >= retry ||
            !(error instanceof ConnectError) ||
            !isRetryableCode(error.code)
          ) {
            throw error
          }
          progress.retries += 1
          // Rejects with the stop reason if everyone leaves meanwhile, so no
          // later attempt starts for nobody. A restart then makes this retry
          // rather than another.
          await sleep(retryDelay(progress.retries), link.signal)
        }
      }
    } finally {
      link.release()
    }
  }

  return {
    local,
    clear: () => report(undefined),

    async call(key, request, signal) {
      const execution = beginExecution(client, key)
      // Carried across restarts, so one call never retries more than the
      // count allows however often everyone leaves and somebody joins.
      const progress = { retries: 0 }
      let succeeded = false
      try {
        for (;;) {
          try {
            const message = await callWithRetries(
              request,
              signal,
              execution,
              progress
            )
            succeeded = true
            return message
          } catch (error) {
            // Everyone left: the call waits for somebody to join, and starts
            // over for them.
            await resumeWhenJoined(client, key, execution, error, signal)
          }
        }
      } finally {
        settleExecution(client, execution, succeeded)
      }
    },

    follow<T>(key: QueryKey, pending: Promise<T>): Promise<T> {
      // The work has started or joined its execution synchronously, if it
      // runs one at all yet.
      const execution = currentExecution(client, key)
      if (execution === undefined) {
        return pending
      }
      let joined: Wait
      let release: (() => void) | undefined
      if (wait === undefined || wait.done || wait.execution !== execution) {
        joined = waitOn(execution)
        if (watching === execution.hash) {
          wait = joined
        } else {
          refetchWaits.add(joined)
          release = () => refetchWaits.delete(joined)
        }
      } else {
        joined = wait
      }
      return new Promise<T>((resolve, reject) => {
        const follower = { hash: execution.hash, reject }
        followers.add(follower)
        const finish = (): void => {
          followers.delete(follower)
          release?.()
        }
        joined.race(pending).then(
          value => {
            finish()
            resolve(value)
          },
          (error: unknown) => {
            finish()
            reject(error)
          }
        )
      })
    },

    giveUp(failure) {
      wait?.giveUp(failure)
    },

    dispose(failure) {
      disposed = true
      stopWatching(failure)
    },
  }
}

/** The part of a query result a local failure is shown over. */
type OverlaidState = Pick<
  QueryResult<unknown, unknown>,
  'error' | 'status' | 'fetchStatus' | 'isLoading' | 'isFetching' | 'isRefreshing'
>

/**
 * The query's own state, with `overlay`'s failure shown over it while there is
 * one: an observer that stopped waiting, or cannot key its request, shows why,
 * idle, whatever the shared entry is doing for everyone else.
 */
export function overlayState(
  query: Pick<QueryResult<unknown, unknown>, 'error' | 'status' | 'fetchStatus'>,
  overlay: () => LocalFailure | undefined
): OverlaidState {
  const status = createMemo(() =>
    overlay() === undefined ? query.status() : 'error'
  )
  const fetchStatus = createMemo(() =>
    overlay() === undefined ? query.fetchStatus() : 'idle'
  )
  return {
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
  }
}
