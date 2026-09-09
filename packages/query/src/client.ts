/**
 * QueryClient ownership, environment provision, and the server global-client guard.
 *
 * Cache state lives on an explicit client object, never in module-global state:
 * a module-global cache leaks data between server requests and makes parallel
 * tests unsafe (the same defect class as the navigation environment in #224).
 *
 * Ownership has two levels. Entries are owned by the client's reactive root,
 * which is detached from any ambient owner, so they outlive whichever component
 * was rendering when the client was created. Observers (added with `createQuery`
 * in #280) are owned by the calling component owner through `onCleanup`, so
 * component teardown drops the observation while the entry survives.
 *
 * `prefetchQueries`, `dehydrate`, and `hydrate` are declared here so the
 * interface does not change later, with baseline behavior only; Phase 4 (#291)
 * owns the SSR prefetch sequence and payload rules. Key hashing, prefix
 * matching, and the payload codec live in `./keys` (#278).
 *
 * Entry lifecycle is #279: identical active keys share one execution, a
 * refresh keeps the prior value, and an entry with no observations is evicted
 * `gcTime` after it settles — a timer that an observation cancels outright and
 * a release restarts. Freshness is a calculation, not a trigger: `isStale`
 * marks data as worth refetching, `fetchQuery` still serves it, and nothing
 * refetches in the background. What acts on staleness is an observer's policy
 * (#280) and explicit `invalidate()`, which keeps a hydrated snapshot from
 * refetching on first paint (#291).
 */

import {
  createEnvironmentKey,
  createRoot,
  getCurrentComponentContextOrNull,
  runWithOwner,
} from '@tachui/core'

import {
  DEFAULT_GC_TIME,
  DEFAULT_SNAPSHOT,
  DEFAULT_STALE_TIME,
} from './defaults'
import { isServer, QueryError } from './errors'
import {
  decodeQueryKey,
  decodeSnapshotData,
  encodeQueryKey,
  encodeSnapshotData,
  hashEncodedKey,
  hashEncodedSegments,
  hashQueryKey,
  hashKeySegments,
  isKeyPrefixMatch,
} from './keys'
import type {
  CacheEntry,
  DehydratedQuery,
  DehydratedState,
  FetchQueryOptions,
  FetchStatus,
  QueryClient,
  QueryKey,
  QueryKeyHash,
  QueryObservation,
  QueryStatus,
} from './types'

/**
 * Environment key carrying the ambient client.
 *
 * No default value: resolution without a provider falls through to
 * {@link useQueryClient}, which refuses a global fallback on the server.
 */
export const QueryClientKey = createEnvironmentKey<QueryClient>('QueryClient')

/** An in-flight loader execution owned by the client root. */
interface InFlightRequest {
  readonly promise: Promise<unknown>
  readonly controller: AbortController
}

/** Cache entry state. Lifecycle policy (freshness, eviction) lands in #279. */
interface ClientCacheEntry {
  /**
   * The canonical structured key: equal to what the caller supplied, with
   * every `toJSON` hook resolved and sharing no references with it, so a
   * later mutation of the caller's array cannot desync the entry from its
   * hash. Retained for prefix matching and devtools (#278); the payload
   * carries {@link encodeQueryKey} of it, which decodes back to an equal key.
   */
  key: QueryKey
  readonly hash: QueryKeyHash
  /**
   * Per-segment hashes of the key as supplied, captured at insert. Prefix
   * matching compares these rather than re-hashing `key`: the stored
   * rendering collapses `undefined` to `null`, so matching on it would miss
   * the very entry `fetchQuery` created and hit a null-keyed sibling instead.
   */
  readonly segmentHashes: readonly QueryKeyHash[]
  data: unknown
  error: unknown
  status: QueryStatus
  fetchStatus: FetchStatus
  updatedAt: number | undefined
  /**
   * Live observations. While this is above zero the entry is retained; the
   * `gcTime` timer runs only at zero, so an observed entry is never evicted
   * out from under its observer.
   */
  observerCount: number
  /**
   * Pending eviction, or null when none is scheduled — either because the
   * entry is observed, because a request is in flight, or because `gcTime`
   * is not finite.
   */
  gcTimer: ReturnType<typeof setTimeout> | null
  /**
   * Observers to notify when this entry's state changes. Entries are plain
   * mutable objects, so a reactive result cannot track them by reading; the
   * writes announce themselves instead.
   */
  readonly listeners: Set<() => void>
  /**
   * Set by `hydrate()` and consumed by the first observation that would
   * otherwise refetch this entry for being stale.
   *
   * A snapshot arrives already stale at the default `staleTime` of 0, so
   * without this every server-rendered page would refetch everything it just
   * shipped on first paint — the double fetch #291's criterion forbids. The
   * server produced this value moments ago as part of the same page load, so
   * one observation is allowed to trust it; anything after that is ordinary
   * staleness.
   */
  hydrationGrace: boolean
  staleTime: number
  gcTime: number
  snapshot: boolean
  policyClaimed: { staleTime: boolean; gcTime: boolean; snapshot: boolean }
  invalidated: boolean
  /**
   * Bumped wherever an in-flight request stops being the one the entry is
   * waiting for: `invalidate()`, `hydrate()`, an observation marking the
   * entry for reload or aborting it, and the last observer leaving. A landing
   * response writes back only for the generation it was started under, so a
   * stale outcome can neither overwrite fresh data nor silently un-invalidate
   * the entry.
   */
  generation: number
  inFlight: InFlightRequest | null
}

/**
 * Errors raised before any loader runs (unhashable key, use after dispose, a
 * garbage `options.client`, a key accessor that throws). Prefetch rethrows
 * these and swallows everything else; a WeakSet (not a subclass) keeps the
 * public error type stable and lets any thrown object be tagged, not just
 * QueryError — a misconfigured prefetch must not resolve silently just
 * because the failure was a TypeError. Entries die with their error objects.
 * A thrown primitive cannot be tagged and stays swallowed.
 */
const dispatchErrors = new WeakSet<object>()

function isTaggableError(error: unknown): error is object {
  return typeof error === 'object' && error !== null
}

function markDispatchError<T>(error: T): T {
  if (isTaggableError(error)) {
    dispatchErrors.add(error)
  }
  return error
}

function isDehydratedState(state: unknown): state is DehydratedState {
  if (typeof state !== 'object' || state === null) {
    return false
  }
  const queries = (state as { queries?: unknown }).queries
  if (!Array.isArray(queries)) {
    return false
  }
  return queries.every(
    (item): item is DehydratedQuery =>
      typeof item === 'object' &&
      item !== null &&
      Array.isArray((item as { key?: unknown }).key) &&
      'data' in item &&
      // Finite: NaN rides the wire as null, which the next hop rejects —
      // fail the whole malformed payload here instead.
      Number.isFinite((item as { updatedAt?: unknown }).updatedAt)
  )
}

/**
 * Test support. Entry state is otherwise visible only through `dehydrate`,
 * whose filter runs *after* the snapshot gates — an idle, invalidated, or
 * failed entry never reaches it — so the lifecycle in this module could not be
 * asserted through the public surface. Keyed by client in a WeakMap rather
 * than added to {@link QueryClient}: what a cache inspector should expose to
 * real consumers is #293's call, not something to settle by accident here.
 */
const inspectors = new WeakMap<
  QueryClient,
  (key: QueryKey) => CacheEntry | undefined
>()

/** Test support. See {@link inspectors}. Not part of the public barrel. */
export function inspectQueryEntry(
  client: QueryClient,
  key: QueryKey
): CacheEntry | undefined {
  return inspectors.get(client)?.(key)
}

/**
 * Rejects a freshness or retention window that would put the cache into a
 * state no caller could have meant. Both are load-bearing as of #279, and both
 * fail silently when malformed: a NaN `gcTime` takes the same branch as an
 * intentional Infinity and retains the entry forever, and a NaN `staleTime`
 * makes every comparison false so the entry is never stale. A negative window
 * evicts on the next tick. Infinity stays valid for both — "never evict" and
 * "never stale" are real choices.
 */
function assertPolicyWindow(value: number | undefined, name: string): void {
  if (value === undefined) {
    return
  }
  if (Number.isNaN(value) || value < 0) {
    throw new QueryError(
      `Cannot configure query: ${name} must be a non-negative number of milliseconds, or Infinity. Received ${String(value)}.`
    )
  }
}

function buildClient(disposeClientRoot: () => void, onDispose?: () => void): QueryClient {
  const entries = new Map<QueryKeyHash, ClientCacheEntry>()
  const activeControllers = new Set<AbortController>()
  let disposed = false

  function ensureUsable(method: string): void {
    if (disposed) {
      throw new QueryError(
        `QueryClient.${method}() called after dispose(). Create a new client with createQueryClient().`
      )
    }
  }

  /**
   * Empties the cache, cancelling every pending eviction first. A dangling
   * timer would keep its entry — and whatever the loader captured — alive
   * past the client that owned it, which is the leak this cache exists
   * inside a reactive root to avoid.
   */
  function dropEntries(): void {
    const observed: ClientCacheEntry[] = []
    for (const entry of entries.values()) {
      cancelEviction(entry)
      detachFlight(entry)
      if (entry.listeners.size > 0) {
        // An observed entry is emptied in place rather than removed. Its
        // observers hold this object; dropping it would leave them watching
        // something the cache no longer has, reading whatever it last held
        // forever while their own reloads populated a different entry
        // entirely. Emptied and kept, they see the reset and reload.
        entry.data = undefined
        entry.error = undefined
        entry.status = 'idle'
        entry.updatedAt = undefined
        entry.hydrationGrace = false
        // Marked, not merely emptied. An observer reloads what is marked, and
        // marking says why the entry is empty — cleared, rather than
        // cancelled, which also leaves an entry idle and must not restart.
        entry.invalidated = true
        observed.push(entry)
      }
    }
    entries.clear()
    for (const entry of observed) {
      entries.set(entry.hash, entry)
      notify(entry)
    }
  }

  function abortActive(): void {
    // Attached and detached flights alike: invalidate() and hydrate() release
    // the entry slot, but a detached request is still the client's to cancel
    // until it settles and removes itself below.
    for (const controller of activeControllers) {
      controller.abort()
    }
    activeControllers.clear()
  }

  function createEntry(
    key: QueryKey,
    hash: QueryKeyHash,
    segmentHashes: readonly QueryKeyHash[],
    policy: { staleTime?: number; gcTime?: number; snapshot?: boolean }
  ): ClientCacheEntry {
    const entry: ClientCacheEntry = {
      key,
      hash,
      segmentHashes,
      data: undefined,
      error: undefined,
      status: 'idle',
      fetchStatus: 'idle',
      updatedAt: undefined,
      observerCount: 0,
      gcTimer: null,
      listeners: new Set(),
      hydrationGrace: false,
      staleTime: policy.staleTime ?? DEFAULT_STALE_TIME,
      gcTime: policy.gcTime ?? DEFAULT_GC_TIME,
      snapshot: policy.snapshot ?? DEFAULT_SNAPSHOT,
      // Claimedness is tracked separately from value: a field explicitly set
      // to its default (staleTime: 0, snapshot: false) is still a deliberate
      // choice, and a later caller must not override it. Value-equality with
      // the default cannot tell "unset" from "explicitly default".
      policyClaimed: {
        staleTime: policy.staleTime !== undefined,
        gcTime: policy.gcTime !== undefined,
        snapshot: policy.snapshot !== undefined,
      },
      invalidated: false,
      generation: 0,
      inFlight: null,
    }
    entries.set(hash, entry)
    scheduleEviction(entry)
    return entry
  }

  /**
   * Announces a state change to this entry's observers. Called after the
   * write rather than around it, so a listener always reads settled state.
   * A listener that throws must not stop the others from hearing, nor leave
   * the write half-announced.
   */
  function notify(entry: ClientCacheEntry): void {
    for (const listener of [...entry.listeners]) {
      try {
        listener()
      } catch {
        // An observer's own failure is its business; the cache has already
        // committed and the remaining observers still need telling.
      }
    }
  }

  /**
   * Ends the entry's in-flight request and frees its slot.
   *
   * Aborting alone is not enough: a filled slot tells the next caller that a
   * request is already on its way, so it waits for one that has been
   * abandoned. The generation bump makes the abandoned outcome unwelcome if
   * it lands anyway, and a first fetch that never produced anything returns
   * to `idle` rather than sitting at `loading` with nothing running.
   */
  function detachFlight(entry: ClientCacheEntry): void {
    if (entry.inFlight === null) {
      return
    }
    entry.inFlight.controller.abort()
    entry.inFlight = null
    entry.fetchStatus = 'idle'
    entry.generation += 1
    if (entry.status === 'loading') {
      entry.status = 'idle'
    }
  }

  function cancelEviction(entry: ClientCacheEntry): void {
    if (entry.gcTimer !== null) {
      clearTimeout(entry.gcTimer)
      entry.gcTimer = null
    }
  }

  /**
   * (Re)starts the retention timer for an unobserved entry.
   *
   * Called wherever the inputs change — creation, each settle, invalidate,
   * hydrate, and observer release — because `gcTime` measures time spent
   * unobserved rather than time since the entry was written. An observed
   * entry, an in-flight one, and an entry whose `gcTime` is not finite are
   * all held indefinitely; the in-flight case matters because a load slower
   * than `gcTime` would otherwise resolve into an entry that no longer
   * exists.
   */
  function scheduleEviction(entry: ClientCacheEntry): void {
    // Currency first. An entry dropped by clear() or dispose() can still be
    // reached afterwards — by an observation held across the boundary, or by
    // a flight that was in the air when the map was emptied and whose
    // releaseSlot still owns its slot. Arming a timer for one of those would
    // delete by hash later and take out whichever entry then holds it, and
    // after dispose() it would keep the entry, and whatever its loader
    // captured, alive for a whole gcTime past the client. Every legitimate
    // caller holds a live entry, so this filters only orphans.
    if (entries.get(entry.hash) !== entry) {
      cancelEviction(entry)
      return
    }
    cancelEviction(entry)
    if (
      entry.observerCount > 0 ||
      entry.inFlight !== null ||
      !Number.isFinite(entry.gcTime)
    ) {
      return
    }
    entry.gcTimer = setTimeout(() => {
      // No re-check here, deliberately. Every event that would make this
      // entry unevictable cancels the timer first — observe() and the slot
      // claim in fetchQuery both call cancelEviction, and clear()/dispose()
      // drop the whole map through dropEntries — so a firing timer means the
      // entry is still unobserved, settled, and current. Re-checking would be
      // an unreachable branch pretending to be a safety net; the guarantee
      // lives at those call sites, which is where a future path must keep it.
      entry.gcTimer = null
      entries.delete(entry.hash)
    }, entry.gcTime)
    // Node keeps the process alive for a pending timer; a cache entry must
    // not hold a server open past its work.
    entry.gcTimer.unref?.()
  }

  /**
   * Whether an entry has aged past its freshness window. An entry that has
   * never been written is stale: there is nothing to be fresh.
   */
  function isStale(entry: ClientCacheEntry): boolean {
    return (
      entry.updatedAt === undefined ||
      Date.now() - entry.updatedAt >= entry.staleTime
    )
  }

  /**
   * @param dataCopy A decoupled copy of the entry's data, chosen by the
   * caller rather than defaulted here — an entry's data may legitimately be
   * `undefined`, so there is no value left to mean "not supplied".
   * `dehydrate` passes what it decodes from the payload it is about to ship,
   * which is both exactly what the far side will see and always cloneable; a
   * structured clone throws for values the encoding handles fine (a Proxy
   * above all), and one awkward entry must not take down a whole snapshot.
   */
  function toCacheEntryView(
    entry: ClientCacheEntry,
    dataCopy: unknown
  ): CacheEntry {
    // Decoupled copies: the filter — and the payload built from this view —
    // must not alias the cache, so mutating either side cannot rewrite the
    // other. Errors stay live references; they never cross the boundary.
    return {
      // The key is canonical, so a structured clone is lossless — Dates,
      // bigints, and byte arrays all survive it, unlike a JSON round trip.
      key: structuredClone(entry.key) as QueryKey,
      hash: entry.hash,
      // Lossless: the entry's data may hold Dates or byte arrays, which a
      // JSON round trip would flatten before the filter ever sees them.
      data: dataCopy,
      error: entry.error as Error | undefined,
      updatedAt: entry.updatedAt,
      status: entry.status,
      fetchStatus: entry.fetchStatus,
      observerCount: entry.observerCount,
      invalidated: entry.invalidated,
      isStale: isStale(entry),
      options: {
        staleTime: entry.staleTime,
        gcTime: entry.gcTime,
        snapshot: entry.snapshot,
      },
    }
  }

  async function fetchQuery<TRaw, TError = Error>(
    options: FetchQueryOptions<TRaw, TError>
  ): Promise<TRaw> {
    // Dispatch first: lifecycle before delegation, so a disposed client
    // naming a live explicit client still rejects for use after dispose()
    // like every other method. Dispatch failures are tagged (see
    // dispatchErrors) so prefetch can tell misuse from load failure. The
    // forward is returned without await, so the inner call's loader failures
    // never pass through this frame's tag.
    let resolvedKey: QueryKey
    let entry: ClientCacheEntry
    try {
      ensureUsable('fetchQuery')
      if (options.client !== undefined && options.client !== client) {
        // Strip the forwarder: a decorated/proxied client that delegates back
        // here would otherwise recurse on the intact options to RangeError.
        return options.client.fetchQuery({ ...options, client: undefined })
      }
      assertPolicyWindow(options.staleTime, 'staleTime')
      assertPolicyWindow(options.gcTime, 'gcTime')
      resolvedKey = options.key()
      // One encoding pass feeds the hash, the segments, and the stored key.
      // Encoding three times would invoke each toJSON hook three times, so a
      // non-deterministic hook could seat an entry whose key, hash, and
      // segments disagree with one another.
      const encodedKey = encodeQueryKey(resolvedKey)
      const hash = hashEncodedKey(encodedKey)
      const cached = entries.get(hash)
      if (cached !== undefined) {
        // An equal hash means an equal stored key and equal segments, so the
        // hit path neither decodes the key nor overwrites what the entry
        // holds.
        entry = cached
      } else {
        // Decoupled canonical copy: the entry must not alias the caller's
        // array, or a later mutation desyncs entry.key from entry.hash.
        entry = createEntry(
          decodeQueryKey(encodedKey),
          hash,
          hashEncodedSegments(encodedKey),
          options
        )
      }
    } catch (error) {
      // Every dispatch-phase failure is tagged, whatever its type: a garbage
      // options.client throws a TypeError, and a prefetch that swallowed it
      // would warm nothing with no signal at all.
      throw markDispatchError(error)
    }
    // Explicitly passed options upgrade the entry policy — but only while the
    // field is still unclaimed. An entry restored by hydrate() starts
    // unclaimed and picks up the developer's configuration from the first
    // query that names the key; once any caller sets a freshness field —
    // even to its default value — a later caller sharing the key cannot
    // silently revoke it. snapshot is the exception: it is veto-wins (see
    // below), because only false keeps data out of the SSR payload.
    if (options.staleTime !== undefined && !entry.policyClaimed.staleTime) {
      entry.staleTime = options.staleTime
      entry.policyClaimed.staleTime = true
    }
    if (options.gcTime !== undefined && !entry.policyClaimed.gcTime) {
      entry.gcTime = options.gcTime
      entry.policyClaimed.gcTime = true
      // The pending timer was armed against the default window, so it has to
      // be replaced or the configured one never takes effect — the shape
      // hydrate() then a first fetch produces, which #291's SSR flow relies
      // on. This restarts a full window from the claim rather than preserving
      // elapsed time, matching how invalidate() and hydrate() restart it, and
      // it happens at most once per entry.
      scheduleEviction(entry)
    }
    // snapshot is veto-wins, not first-writer-wins: false is the safe value
    // (it keeps data out of the SSR payload), so an explicit opt-out
    // overrides a claimed opt-in and seals the entry — a later opt-in cannot
    // silently re-ship another consumer's opted-out data.
    if (options.snapshot !== undefined && (!entry.policyClaimed.snapshot || options.snapshot === false)) {
      entry.snapshot = options.snapshot
      entry.policyClaimed.snapshot = true
    }
    const activeRequest = entry.inFlight
    if (activeRequest !== null) {
      return activeRequest.promise as Promise<TRaw>
    }
    // Presence is tracked by status, not by the data value: a loader that
    // legitimately resolves `undefined` (a 204, an empty body, a "not found"
    // lookup) still populates the entry and must not refetch on every call.
    if (entry.status === 'success' && !entry.invalidated) {
      return entry.data as TRaw
    }
    const controller = new AbortController()
    // First fetch, no data yet: distinguishable from "never fetched" for
    // createQuery (#280). Retries keep 'error' and refreshes keep 'success'.
    if (entry.status === 'idle') {
      entry.status = 'loading'
    }
    entry.fetchStatus = 'fetching'
    notify(entry)
    const requestGeneration = entry.generation

    // The slot is claimed before the loader runs: a loader that reentrantly
    // calls clear()/dispose()/fetchQuery must observe the real request, not
    // an empty slot. Otherwise a reentrant clear cannot abort the flight, and
    // a reentrant same-key fetch starts a second loader that fights the first
    // over the slot. The resolvers release the slot as they settle the shared
    // promise, so every path — including a synchronously throwing loader —
    // settles and cleans up exactly once.
    let resolveRequest!: (value: TRaw) => void
    let rejectRequest!: (reason?: unknown) => void
    const requestPromise = new Promise<TRaw>((resolve, reject) => {
      // The executor runs synchronously, so both handles are assigned before
      // the promise escapes; the assertions only silence the definite-
      // assignment check, they never observe an unassigned binding.
      resolveRequest = (value) => {
        releaseSlot()
        resolve(value)
      }
      rejectRequest = (reason) => {
        releaseSlot()
        reject(reason)
      }
    })
    entry.inFlight = { promise: requestPromise, controller }
    activeControllers.add(controller)
    cancelEviction(entry)

    function ownsSlot(): boolean {
      return entry.inFlight?.promise === requestPromise
    }

    function unwindStaleOutcome(): void {
      // A dropped outcome must not leave the first-fetch marker up: with no
      // newer flight owning the slot, the entry reads never-fetched (idle),
      // not loading-forever, for createQuery's isLoading (#280). A newer
      // flight in progress keeps 'loading' — its own landing settles status.
      if (
        entry.generation !== requestGeneration &&
        entry.inFlight === null &&
        entry.status === 'loading'
      ) {
        entry.status = 'idle'
        notify(entry)
      }
    }

    function releaseSlot(): void {
      // Always runs exactly once per request, attached or detached, so the
      // client-level set never outlives the flight it tracks.
      activeControllers.delete(controller)
      // `fetchStatus` mirrors `inFlight`: whatever clears the slot marks it
      // idle, so no path leaves a settled entry reading as fetching, and no
      // stale flight clears a newer flight's slot.
      if (ownsSlot()) {
        entry.inFlight = null
        entry.fetchStatus = 'idle'
        // Retention resumes from the settle rather than from the insert: a
        // load slower than gcTime must not resolve into an evicted entry.
        scheduleEviction(entry)
        notify(entry)
      }
    }

    // A synchronously throwing loader becomes a rejection rather than
    // escaping before the slot exists and poisoning the key.
    let loadOutcome: Promise<TRaw>
    try {
      loadOutcome = Promise.resolve(
        options.load({ signal: controller.signal, key: resolvedKey })
      )
    } catch (syncError) {
      loadOutcome = Promise.reject(syncError)
    }

    loadOutcome.then(
      (loaded) => {
        // clear() and dispose() abort before dropping the entry, so a live
        // signal means this entry is still current. A newer generation
        // (invalidate() or hydrate() during the flight) owns the entry now:
        // resolve to the caller but drop the stale outcome instead of
        // un-invalidating it or overwriting fresh data.
        unwindStaleOutcome()
        if (!controller.signal.aborted && entry.generation === requestGeneration) {
          entry.data = loaded
          entry.error = undefined
          entry.status = 'success'
          entry.updatedAt = Date.now()
          entry.invalidated = false
          entry.hydrationGrace = false
          notify(entry)
        }
        return loaded
      },
      (loadError) => {
        unwindStaleOutcome()
        if (!controller.signal.aborted && entry.generation === requestGeneration) {
          entry.error = loadError
          entry.status = 'error'
          // A completed attempt consumes the mark, success or not. Leaving it
          // set means an observer that reloads on seeing it marked reloads
          // again the instant the failure lands, and again, with no delay
          // between attempts — an unbounded storm against a backend that is
          // already failing. An error entry is refetched on its status
          // anyway, and an explicit invalidation still marks it afresh.
          entry.invalidated = false
          notify(entry)
        }
        throw loadError
      }
    ).then(resolveRequest, rejectRequest)
    return requestPromise
  }

  const client: QueryClient = {
    fetchQuery,

    async prefetchQueries(requests: readonly FetchQueryOptions<any, any>[]): Promise<void> {
      ensureUsable('prefetchQueries')
      await Promise.all(
        requests.map((request) =>
          client.fetchQuery(request).then(
            () => undefined,
            (error: unknown) => {
              // Load failures are swallowed — prefetch only warms — but
              // dispatch-phase misuse (unhashable key, disposed client, a
              // garbage explicit client) surfaces. The tag alone decides, so
              // type is irrelevant in both directions: a QueryError thrown BY
              // a loader — including one shared via dedup onto another
              // caller's flight — is a load failure, and a TypeError raised
              // before any loader ran is not.
              if (isTaggableError(error) && dispatchErrors.has(error)) {
                throw error
              }
            }
          )
        )
      )
    },

    observe(key: QueryKey, onChange?: () => void): QueryObservation {
      ensureUsable('observe')
      const encoded = encodeQueryKey(key)
      const hash = hashEncodedKey(encoded)
      const entry =
        entries.get(hash) ??
        // Unclaimed defaults: an observer can arrive before any query names
        // the key, and the first fetch that does configures the entry.
        createEntry(
          decodeQueryKey(encoded),
          hash,
          hashEncodedSegments(encoded),
          {}
        )
      entry.observerCount += 1
      cancelEviction(entry)
      if (onChange !== undefined) {
        entry.listeners.add(onChange)
      }
      let released = false
      return {
        // The cached value itself, not a copy. An observer projects TRaw
        // through `select`, and a structured clone would strip class
        // prototypes — methods and all — and throw outright for a Proxy or a
        // function, wedging a query whose data the cache is perfectly
        // entitled to hold. The view is read-only by contract; only the
        // dehydrate filter, which is about to ship its argument over a wire,
        // needs a decoupled one.
        entry: () => toCacheEntryView(entry, entry.data),
        abortInFlight: () => {
          // Without releasing: the observer is still watching, and a caller
          // that cancels a request has not stopped caring about the query.
          // Releasing instead would detach the listener and freeze the
          // result's signals wherever they happened to be.
          detachFlight(entry)
          notify(entry)
        },
        markForReload: () => {
          // This one entry, not the prefix beneath it. Going through the
          // public invalidate() would mark every key starting with this one,
          // so an observer of ['users'] refreshing itself would also
          // invalidate a perfectly fresh ['users', 1].
          entry.invalidated = true
          entry.generation += 1
          if (entry.inFlight !== null) {
            entry.inFlight = null
            entry.fetchStatus = 'idle'
          }
          scheduleEviction(entry)
          notify(entry)
        },
        consumeHydrationGrace: () => {
          const granted = entry.hydrationGrace
          entry.hydrationGrace = false
          return granted
        },
        release: () => {
          // Idempotent: an owner may clean up more than once, and a second
          // release must not drive the count negative and retain the entry
          // forever.
          if (released) {
            return
          }
          released = true
          if (onChange !== undefined) {
            entry.listeners.delete(onChange)
          }
          entry.observerCount -= 1
          if (entry.observerCount === 0) {
            // The last observer leaving takes any request it was waiting on
            // with it: nothing is left to receive the result, and a key
            // change must not leave the abandoned key loading. A shared
            // flight survives, because the others are still listening.
            // Detached rather than merely aborted: see detachFlight.
            detachFlight(entry)
            scheduleEviction(entry)
            // No notify: the count is zero, so every listener has just been
            // removed and there is nobody left to tell.
          }
        },
      }
    },

    invalidate(prefix: QueryKey): void {
      ensureUsable('invalidate')
      // Hoisted out of the entry loop: an unhashable prefix raises
      // consistently even against an empty cache (instead of no-op-ing),
      // and segments hash once rather than per entry.
      const prefixHashes = hashKeySegments(prefix)
      for (const entry of entries.values()) {
        if (isKeyPrefixMatch(prefixHashes, entry.segmentHashes)) {
          entry.invalidated = true
          entry.generation += 1
          if (entry.inFlight !== null) {
            // Detach the pre-invalidation flight: its waiter still settles,
            // but it no longer blocks a fresh load, and the generation guard
            // drops its stale outcome instead of un-invalidating the entry.
            // `fetchStatus` mirrors the slot, so it goes idle here. The
            // flight stays in the client-level set, so clear()/dispose()
            // still abort it.
            entry.inFlight = null
            entry.fetchStatus = 'idle'
          }
          scheduleEviction(entry)
          notify(entry)
        }
      }
    },

    dehydrate(filter?: (entry: CacheEntry) => boolean): DehydratedState {
      ensureUsable('dehydrate')
      const queries: DehydratedQuery[] = []
      for (const entry of entries.values()) {
        if (entry.status !== 'success') {
          continue
        }
        // Invalidated entries are stale by definition: serializing one would
        // let the invalidation silently not survive the dehydrate/hydrate
        // boundary, serving pre-mutation data on the other side indefinitely.
        if (entry.invalidated) {
          continue
        }
        // The key rides the wire as its canonical encoding, which is
        // JSON-safe by construction and decodes back to an equal key — so
        // undefined segments, Dates, bigints, and byte arrays all survive
        // rather than being skipped as unrepresentable (#278). Nothing here
        // can fail: entry.key is already canonical, and a key that could not
        // encode was refused at insert.
        const encodedKey = encodeQueryKey(entry.key)
        // Data rides the wire as its canonical encoding too, so a Date,
        // bigint, byte array, or explicit undefined inside the payload
        // survives rather than costing the whole entry its snapshot. What
        // still cannot round-trip exactly — a class instance, a toJSON
        // carrier, a function, a cycle — raises here, and the entry stays
        // cached but unserialized rather than hydrating as a value that was
        // never TRaw.
        let encodedData: unknown
        try {
          encodedData = encodeSnapshotData(entry.data)
        } catch {
          continue
        }
        // Snapshot serialization is opt-in per query; a filter narrows the
        // opt-in set further and never widens it.
        if (!entry.snapshot) {
          continue
        }
        const view = toCacheEntryView(entry, decodeSnapshotData(encodedData))
        if (filter !== undefined && !filter(view)) {
          continue
        }
        queries.push({
          key: encodedKey,
          data: encodedData,
          updatedAt: view.updatedAt ?? Date.now(),
        })
      }
      return { queries }
    },

    hydrate(state: DehydratedState): void {
      ensureUsable('hydrate')
      if (!isDehydratedState(state)) {
        throw new QueryError(
          'hydrate() requires a DehydratedState with a queries array, as produced by dehydrate().'
        )
      }
      // Decode and validate every key before committing any entry: a
      // malformed later entry must not leave earlier ones partially
      // installed for a fallback fetch to serve. The payload carries the
      // canonical encoding, so decoding restores Dates, bigints, byte
      // arrays, and explicit undefined exactly as the producing client held
      // them — and rejects an unknown tag or a malformed token rather than
      // trusting a payload that crossed a process boundary.
      const restored = state.queries.map((item) => {
        const key = decodeQueryKey(item.key)
        // Re-encoded once, so a payload that arrived in a non-canonical but
        // acceptable form (raw Dates, a hand-built object) is keyed by the
        // same hash a fetch would compute for it.
        const encoded = encodeQueryKey(key)
        return {
          item,
          key,
          hash: hashEncodedKey(encoded),
          segmentHashes: hashEncodedSegments(encoded),
        }
      })
      // Decode data before committing any entry, for the same atomicity: a
      // malformed later entry must not leave earlier ones installed. Decoding
      // restores Dates, bigints, byte arrays, and explicit undefined exactly
      // as the producing client held them, builds fresh structures so nothing
      // aliases the payload, and refuses a value no snapshot could carry
      // rather than dropping it silently.
      const staged = restored.map(({ item, key, hash, segmentHashes }) => {
        let data: unknown
        try {
          data = decodeSnapshotData(item.data)
        } catch (decodeError) {
          throw new QueryError(
            'hydrate() payload contains values that cannot cross the hydration boundary.',
            { cause: decodeError }
          )
        }
        return { item, hash, segmentHashes, key, data }
      })
      for (const { item, hash, segmentHashes, key, data } of staged) {
        const entry =
          entries.get(hash) ??
          // Unclaimed defaults: the first query that names the key configures
          // the restored entry.
          createEntry(key, hash, segmentHashes, {})
        entry.key = key
        entry.data = data
        entry.error = undefined
        entry.status = 'success'
        entry.updatedAt = item.updatedAt
        entry.invalidated = false
        // The restored snapshot is newer than any flight started before it:
        // release the slot so a later fetch serves the restored data instead
        // of sharing the stale flight (its waiter still settles, but the
        // generation guard drops its outcome). `fetchStatus` mirrors the slot.
        entry.hydrationGrace = true
        entry.generation += 1
        entry.inFlight = null
        entry.fetchStatus = 'idle'
        scheduleEviction(entry)
        notify(entry)
      }
    },

    clear(): void {
      ensureUsable('clear')
      abortActive()
      dropEntries()
    },

    dispose(): void {
      if (disposed) {
        return
      }
      abortActive()
      dropEntries()
      disposed = true
      disposeClientRoot()
      onDispose?.()
    },
  }

  inspectors.set(client, (key) => {
    const entry = entries.get(hashQueryKey(key))
    return entry === undefined
      ? undefined
      // Not cloned, for the same reason an observation is not: the cache is
      // entitled to hold a Proxy or a class instance, and a test that cannot
      // inspect those is worse than one that reads the live value.
      : toCacheEntryView(entry, entry.data)
  })

  return client
}

/**
 * Creates a client owning its cache. The cache map is allocated inside a
 * reactive root detached from any ambient owner, so entries outlive whichever
 * component was rendering at creation time; only `dispose()` tears it down.
 */
export function createQueryClient(): QueryClient {
  return runWithOwner(null, () =>
    createRoot((disposeRoot) => buildClient(disposeRoot))
  )
}

/**
 * Exposes a client to the component subtree through the environment. Scoped to
 * the providing context with parent-chain lookup, so a nested provider shadows
 * its parent without clobbering it.
 */
export function provideQueryClient(client: QueryClient): void {
  // Resolved directly rather than through provideEnvironmentValue so a call
  // outside any component context raises an actionable QueryError naming this
  // function — not core's `@State`-flavored missing-context error, which
  // misdirects and cannot be discriminated as a query misuse.
  const context = getCurrentComponentContextOrNull()
  if (context === null) {
    throw new QueryError(
      'provideQueryClient() requires a component context. Call it during a component render, or inside runWithComponentContext() in tests and setup code.'
    )
  }
  context.provide(QueryClientKey.symbol, client)
}

let defaultClient: QueryClient | null = null

/**
 * The implicit browser fallback, created on first use. This is the same object
 * `buildClient` closed over — not a wrapper — so the `options.client` identity
 * guard in `fetchQuery` recognizes it instead of delegating to itself forever.
 * Disposing it clears the module slot so the next resolution creates a fresh
 * client rather than handing back a dead one.
 */
function createAmbientClient(): QueryClient {
  const ambient = runWithOwner(null, () =>
    createRoot((disposeRoot) =>
      buildClient(disposeRoot, () => {
        if (defaultClient === ambient) {
          defaultClient = null
        }
      })
    )
  )
  return ambient
}

function getDefaultQueryClient(): QueryClient {
  if (defaultClient === null) {
    defaultClient = createAmbientClient()
  }
  return defaultClient
}

/**
 * Test support. Disposes and drops the implicit fallback so test files can
 * isolate from ambient-client leakage. Not part of the public barrel.
 */
export function resetDefaultQueryClient(): void {
  if (defaultClient !== null) {
    const stale = defaultClient
    defaultClient = null
    stale.dispose()
  }
}

/**
 * Resolves the ambient client: the nearest provided client first, then the
 * implicit browser fallback. On the server there is no fallback — a shared
 * cache would leak one request's data into the next — so a missing provider is
 * an actionable error naming the per-request shape.
 */
export function useQueryClient(): QueryClient {
  // A direct context read rather than consumeEnvironmentValue: that helper
  // throws for both "no context" and "no value", and a blanket catch would
  // also swallow a genuine lookup fault and silently degrade to shared global
  // state. Here absence and failure stay distinct — a null context or a
  // missing value simply falls through to the server guard below.
  const context = getCurrentComponentContextOrNull()
  const ambient = context?.consume<QueryClient>(QueryClientKey.symbol)
  if (ambient !== undefined) {
    return ambient
  }
  if (isServer()) {
    throw new QueryError(
      'No QueryClient provided. Create one with createQueryClient() and expose it with provideQueryClient(), or pass an explicit client option. Outside a browser document there is no implicit client: on a server that would leak one request\'s cached data into the next, and in a worker or edge runtime this cannot tell an isolated scope from one shared across requests.'
    )
  }
  return getDefaultQueryClient()
}
