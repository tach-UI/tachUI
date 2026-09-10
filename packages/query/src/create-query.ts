/**
 * `createQuery` — the reactive query primitive (#280).
 *
 * An observer sits between a component and one cache entry. The cache owns
 * `TRaw` and the request lifecycle; the observer owns everything that is per
 * consumer: the projection through `select`, the placeholder shown before
 * there is data, and the decision of when observing should fetch.
 *
 * Two axes stay independent, which is the reason `QueryResult` has both.
 * `status` describes the data — a background refresh is `success` while
 * `fetching`, so `status === 'success'` never blinks off and consumers do not
 * have to guard it. `fetchStatus` describes the request. Collapsing them would
 * make every "has data?" check false for the duration of a refresh.
 *
 * Retention and cancellation follow ownership. The observation is released
 * from the calling owner's `onCleanup`, and the last one to leave an entry
 * takes its in-flight request with it — a key change or an unmount must not
 * leave an abandoned key loading, while a request two observers share
 * survives one of them leaving.
 */

import {
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  untrack,
} from '@tachui/core'

import { useQueryClient } from './client'
import { hashQueryKey } from './keys'
import { DEFAULT_ENABLED, DEFAULT_RETRY } from './defaults'
import type {
  CacheEntry,
  FetchStatus,
  QueryClient,
  QueryKey,
  QueryObservation,
  QueryOptions,
  QueryResult,
  QueryStatus,
  RetryPolicy,
} from './types'

/** The slice of entry state an observer renders. */
interface ObservedState<TRaw, E> {
  readonly data: TRaw | undefined
  readonly error: E | undefined
  readonly status: QueryStatus
  readonly fetchStatus: FetchStatus
  readonly updatedAt: number | undefined
  readonly isStale: boolean
}

/** Nothing observed yet: distinct from an entry that exists and is empty. */
function idleState<TRaw, E>(): ObservedState<TRaw, E> {
  return {
    data: undefined,
    error: undefined,
    status: 'idle',
    fetchStatus: 'idle',
    updatedAt: undefined,
    isStale: true,
  }
}

/**
 * Whether a snapshot has a value worth projecting.
 *
 * `updatedAt` is written only by a successful load, so it distinguishes a
 * failure that still has a previous value to show from one that has never had
 * anything — which is what lets a failed refresh keep rendering rather than
 * blanking the view.
 */
function hasValue<TRaw, E>(snapshot: ObservedState<TRaw, E>): boolean {
  return (
    snapshot.status === 'success' ||
    (snapshot.status === 'error' && snapshot.updatedAt !== undefined)
  )
}

function readState<TRaw, E>(entry: CacheEntry): ObservedState<TRaw, E> {
  return {
    data: entry.data as TRaw | undefined,
    error: entry.error as E | undefined,
    status: entry.status,
    fetchStatus: entry.fetchStatus,
    updatedAt: entry.updatedAt,
    isStale: entry.isStale,
  }
}

function shouldRetry<E>(
  policy: RetryPolicy<E> | undefined,
  attempt: number,
  error: E
): boolean {
  const resolved = policy ?? DEFAULT_RETRY
  return typeof resolved === 'function'
    ? resolved(attempt, error)
    : attempt < resolved
}

function wait(milliseconds: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(signal.reason)
      return
    }
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', onAbort)
      resolve()
    }, milliseconds)
    timer.unref?.()
    function onAbort(): void {
      clearTimeout(timer)
      reject(signal.reason)
    }
    signal.addEventListener('abort', onAbort, { once: true })
  })
}

/**
 * Observes a query and projects it for one consumer.
 *
 * The returned signals track one cache entry, following the key as it
 * changes. `select` runs outside the cache and is memoized per observer, so
 * two observers of the same key with different projections share a single
 * entry and a single request.
 */
export function createQuery<TRaw, TData = TRaw, E = Error>(
  options: QueryOptions<TRaw, TData, E>
): QueryResult<TData, E> {
  const client: QueryClient = options.client ?? useQueryClient()
  // Memoized so a key change triggers exactly once rather than once per
  // dependency the accessor happens to read.
  const key = createMemo<QueryKey>(() => options.key())
  const enabled = createMemo(() => {
    const gate = options.enabled ?? DEFAULT_ENABLED
    return typeof gate === 'function' ? gate() : gate
  })

  const [state, setState] = createSignal<ObservedState<TRaw, E>>(idleState())
  let observation: QueryObservation | undefined
  /**
   * What the observation currently watches: a key hash, or null while gated
   * off. Undefined until the effect has run once.
   *
   * The effect compares against this instead of tearing down and rebuilding
   * unconditionally, so re-running it for any reason is a no-op. Without that
   * the observer would release its own observation mid-flight — and releasing
   * the last one aborts the request — so an extra run would cancel the very
   * fetch it had just started.
   */
  let observing: string | null | undefined
  let disposed = false
  /**
   * Fires when the current value ages out of its freshness window.
   *
   * `isStale` is derived from the clock, and nothing in the cache writes when
   * a window merely elapses, so without this a query with a positive
   * `staleTime` would keep reporting itself fresh forever after.
   */
  let freshnessTimer: ReturnType<typeof setTimeout> | undefined

  function clearFreshnessTimer(): void {
    if (freshnessTimer !== undefined) {
      clearTimeout(freshnessTimer)
      freshnessTimer = undefined
    }
  }

  /** Runs the loader, applying this observer's retry policy. */
  async function runLoad(
    resolvedKey: QueryKey,
    signal: AbortSignal
  ): Promise<TRaw> {
    for (let attempt = 0; ; attempt += 1) {
      try {
        return await options.load({ signal, key: resolvedKey })
      } catch (error) {
        // Retries stay inside one cache execution, so the entry reads as
        // fetching throughout and its prior value keeps rendering. Only the
        // final failure becomes the entry's error.
        if (signal.aborted || !shouldRetry(options.retry, attempt, error as E)) {
          throw error
        }
        const delay = options.retryDelay?.(attempt, error as E) ?? 0
        if (delay > 0) {
          await wait(delay, signal)
        }
      }
    }
  }

  /**
   * Reloads regardless of what is cached.
   *
   * `fetchQuery` serves a stale entry rather than reloading it — staleness is
   * a signal, not a trigger (#279) — so an observer that has decided to
   * revalidate has to make the cached value ineligible first. The entry keeps
   * its data and its `success` status throughout, so this is a background
   * refresh rather than a return to loading.
   */
  function forceFetch(resolvedKey: QueryKey): Promise<TRaw> {
    // Marked through an observation of *this* key, not through whichever one
    // this query happens to hold. There may be none — `enabled: false` never
    // observes — and just after a key change the one it holds still watches
    // the old entry, so marking that would reload the key being left while
    // the new one served a cache hit.
    let held = observation
    if (held !== undefined) {
      let matches = false
      try {
        matches = held.entry().hash === hashQueryKey(resolvedKey)
      } catch {
        matches = false
      }
      if (!matches) {
        held = undefined
      }
    }
    if (held !== undefined) {
      if (held.entry().fetchStatus === 'fetching') {
        // Already loading: joining that execution is what the caller wants.
        // Marking first would detach it and start a second loader alongside,
        // so one refetch would cost two requests.
        return fetch(resolvedKey)
      }
      held.markForReload()
      return fetch(resolvedKey)
    }
    // No observation of this key: take one just long enough to mark the
    // entry, which is also what creates it if the cache has never held it.
    const transient = client.observe(resolvedKey)
    try {
      if (transient.entry().fetchStatus !== 'fetching') {
        transient.markForReload()
      }
    } finally {
      transient.release()
    }
    return fetch(resolvedKey)
  }

  function fetch(resolvedKey: QueryKey): Promise<TRaw> {
    return client.fetchQuery<TRaw, E>({
      key: () => resolvedKey,
      load: ({ signal, key: loadingKey }) => runLoad(loadingKey, signal),
      staleTime: options.staleTime,
      gcTime: options.gcTime,
      snapshot: options.snapshot,
      client,
    })
  }

  /**
   * Whether observing this entry should fetch.
   *
   * Never fetched means there is nothing to render, so it always fetches.
   * Stale means the value is worth replacing but is still worth rendering
   * while the replacement arrives — except immediately after `hydrate()`,
   * where the server produced it moments ago and refetching would double
   * every server-rendered page load (#291).
   */
  function shouldFetchOnObserve(
    entry: CacheEntry,
    current: QueryObservation
  ): boolean {
    if (entry.fetchStatus === 'fetching') {
      return false
    }
    if (entry.status === 'idle') {
      return true
    }
    if (entry.status === 'error') {
      // Checked before freshness and before the grace: an error entry has
      // nothing worth keeping, and a failure that happens to be recent is
      // still a failure. Leaving it to staleness would strand a query whose
      // staleTime has not elapsed, and spending the hydration allowance on
      // one would suppress the recovery it exists to protect.
      return true
    }
    if (!entry.isStale) {
      return false
    }
    return !current.consumeHydrationGrace()
  }

  /**
   * Publishes an entry's state, and arranges for whatever the entry will not
   * announce on its own.
   *
   * Two things fall to the observer here. A window that elapses is not a
   * cache event, so `isStale` needs a timer to become true. And an entry
   * marked for reload — by this query, or by a mutation invalidating a prefix
   * — has to be reloaded by someone, and the observer watching it is who.
   */
  function publish(current: QueryObservation, resolvedKey: QueryKey): void {
    const entry = current.entry()
    setState(readState<TRaw, E>(entry))
    clearFreshnessTimer()

    if (entry.invalidated && entry.fetchStatus === 'idle') {
      // Marked for reload — by this query, by a prefix invalidation, or by
      // clear() emptying an entry someone is still watching. An ordinary
      // fetch runs the loader, since a marked entry is not servable. Guarded
      // on fetchStatus so the fetch's own notification cannot start a second.
      //
      // Deliberately not "status is idle": cancel() leaves the entry idle too,
      // and restarting the request a caller just cancelled is the opposite of
      // what they asked for.
      void fetch(resolvedKey).catch(() => undefined)
      return
    }

    const window = entry.options.staleTime
    if (
      entry.status === 'success' &&
      entry.updatedAt !== undefined &&
      Number.isFinite(window) &&
      window > 0
    ) {
      const remaining = entry.updatedAt + window - Date.now()
      if (remaining > 0) {
        freshnessTimer = setTimeout(() => {
          freshnessTimer = undefined
          if (!disposed && observation === current) {
            // Republished rather than merely re-read, so the wake-up arms
            // itself again if the window has not in fact elapsed. A timer is
            // allowed to land a hair early — Node's fire up to a millisecond
            // ahead of the delay they were given — and a one-shot wake-up
            // that lands early publishes a still-fresh snapshot and schedules
            // nothing, leaving the query reporting itself fresh forever.
            publish(current, resolvedKey)
          }
        }, remaining)
        freshnessTimer.unref?.()
      }
    }
  }

  createEffect(() => {
    if (disposed) {
      // Signals outlive an explicit dispose(): without this, later activity
      // re-observes and runs side-effectful loads for an observer nobody is
      // reading, and holds the entry against eviction until owner cleanup.
      return
    }
    const resolvedKey = key()
    const isEnabled = enabled()
    let desired: string | null = null
    if (isEnabled) {
      try {
        desired = hashQueryKey(resolvedKey)
      } catch (error) {
        // An unhashable key is a programmer error (#278), but throwing here
        // would take down the render that produced it. It surfaces through
        // `error` like any other failure, and `observing` is left unset so a
        // corrected key is picked up on the next run.
        clearFreshnessTimer()
        observation?.release()
        observation = undefined
        observing = undefined
        setState({ ...idleState<TRaw, E>(), status: 'error', error: error as E })
        return
      }
    }
    if (desired === observing) {
      return
    }
    observing = desired

    // The previous entry loses this observer before the next one gains it, so
    // an abandoned key does not stay retained — or, if nothing else is
    // watching it, keep loading.
    observation?.release()
    observation = undefined

    if (!isEnabled) {
      // `idle` means never fetched, and that includes "gated off". A
      // previously loaded value is not shown through a closed gate.
      clearFreshnessTimer()
      setState(idleState())
      return
    }

    let current: QueryObservation
    try {
      current = client.observe(
        resolvedKey,
        () => {
          if (!disposed && observation === current) {
            publish(current, resolvedKey)
          }
        },
        // Claimed even when this observation declines to fetch: otherwise a
        // hydrated entry keeps the default freshness of 0 and reads as stale
        // the moment its hydration allowance is spent.
        {
          staleTime: options.staleTime,
          gcTime: options.gcTime,
          snapshot: options.snapshot,
        }
      )
    } catch (error) {
      // A client disposed while this query was mounted. Surfaced like any
      // other failure rather than thrown from inside the effect, where it
      // would take down whatever re-rendered.
      clearFreshnessTimer()
      observing = undefined
      setState({ ...idleState<TRaw, E>(), status: 'error', error: error as E })
      return
    }
    observation = current
    publish(current, resolvedKey)

    if (untrack(() => shouldFetchOnObserve(current.entry(), current))) {
      // A rejection here is recorded on the entry and surfaced through
      // `error`; nothing is left to catch it at the call site.
      void (
        untrack(() => state().status) === 'idle'
          ? fetch(resolvedKey)
          : forceFetch(resolvedKey)
      ).catch(() => undefined)
    }
  })

  onCleanup(() => {
    disposed = true
    observing = null
    clearFreshnessTimer()
    observation?.release()
    observation = undefined
  })

  // Memoized per observer and outside the cache: one cached TRaw serves many
  // projections. Keyed on the raw value's identity rather than on the state
  // snapshot, which is a fresh object on every notification — otherwise
  // `select` re-runs for a refetch that returned the same value, and the
  // projection's identity churns for consumers downstream.
  let projectedRaw: TRaw | undefined
  let projectedValue: TData | undefined
  let hasProjection = false

  /** Projects a raw value, reusing the last result for the same one. */
  function project(raw: TRaw): TData {
    if (hasProjection && Object.is(raw, projectedRaw)) {
      return projectedValue as TData
    }
    projectedRaw = raw
    projectedValue =
      options.select === undefined
        ? (raw as unknown as TData)
        : options.select(raw)
    hasProjection = true
    return projectedValue
  }

  const projected = createMemo<TData | undefined>(() => {
    const snapshot = state()
    if (!hasValue(snapshot)) {
      return undefined
    }
    return project(snapshot.data as TRaw)
  })

  let lastProjected: TData | undefined
  const data = createMemo<TData | undefined>(() => {
    const value = projected()
    // Read from the current snapshot, not from whether a projection was ever
    // made: after a key change the previous one is still cached, and using it
    // here would suppress the placeholder for the new key.
    if (hasValue(state())) {
      lastProjected = value
      return value
    }
    // Placeholder data is never written to the cache: it is what this
    // observer shows while there is nothing cached, and the previous
    // projection is offered so a key change can keep rendering the last page.
    const placeholder = options.placeholderData
    return typeof placeholder === 'function'
      ? (placeholder as (previous: TData | undefined) => TData | undefined)(
          lastProjected
        )
      : placeholder
  })

  const status = createMemo(() => state().status)
  const fetchStatus = createMemo(() => state().fetchStatus)

  return {
    data,
    error: createMemo(() => state().error),
    status,
    fetchStatus,
    isLoading: createMemo(() => status() === 'loading'),
    isFetching: createMemo(() => fetchStatus() === 'fetching'),
    isRefreshing: createMemo(
      () => fetchStatus() === 'fetching' && status() === 'success'
    ),
    isStale: createMemo(() => state().isStale),
    updatedAt: createMemo(() => state().updatedAt),

    refetch: async () => {
      // Projects what this call loaded rather than reading the observer's
      // state afterwards. That state may not have been published yet, and
      // with `enabled: false` there is no observation to publish into at all
      // — a gated query can still be refetched on demand, and returning
      // `undefined` for a load that succeeded would be a lie. A failure
      // rejects, because forceFetch does.
      // Through the same projection cache the signals use, so a reload that
      // returned an unchanged value does not run `select` a second time.
      return project(await forceFetch(untrack(key)))
    },
    invalidate: () => {
      // Prefix semantics, matching the client method it mirrors: this query's
      // key and everything beneath it. The reload of *this* entry follows
      // from the notification, which `publish` acts on.
      client.invalidate(untrack(key))
    },
    cancel: () => {
      // Aborts the request and keeps observing. Releasing would abort too,
      // but it also detaches the listener, freezing these signals wherever
      // they stood — a first fetch cancelled that way reads `loading` and
      // `fetching` forever.
      observation?.abortInFlight()
    },
    dispose: () => {
      disposed = true
      observing = null
      clearFreshnessTimer()
      observation?.release()
      observation = undefined
    },
  }
}
