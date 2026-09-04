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
 * owns the SSR prefetch sequence and payload rules. Key hashing and prefix
 * matching are provisional until #278 lands stable canonicalization, and entry
 * lifecycle policy (dedup, freshness, `gcTime` eviction) lands in #279.
 */

import {
  createEnvironmentKey,
  createRoot,
  getCurrentComponentContextOrNull,
  provideEnvironmentValue,
  runWithOwner,
} from '@tachui/core'

import {
  DEFAULT_GC_TIME,
  DEFAULT_SNAPSHOT,
  DEFAULT_STALE_TIME,
} from './defaults'
import { isServer, QueryError } from './errors'
import type {
  CacheEntry,
  DehydratedQuery,
  DehydratedState,
  FetchQueryOptions,
  FetchStatus,
  QueryClient,
  QueryKey,
  QueryKeyHash,
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
  key: QueryKey
  readonly hash: QueryKeyHash
  data: unknown
  error: unknown
  status: QueryStatus
  fetchStatus: FetchStatus
  updatedAt: number | undefined
  readonly observerCount: number
  staleTime: number
  gcTime: number
  snapshot: boolean
  invalidated: boolean
  /**
   * Bumped by `invalidate()` and `hydrate()`. A landing response writes back
   * only for the generation it was started under, so a stale outcome can
   * neither overwrite fresh data nor silently un-invalidate the entry.
   */
  generation: number
  inFlight: InFlightRequest | null
}

/**
 * Provisional key hash. Plain `JSON.stringify` until #278 replaces it with a
 * stable stringify (sorted object keys, `bigint`/`Uint8Array`/`Date` handling)
 * and development errors for non-serializable input.
 */
function hashQueryKey(key: QueryKey): QueryKeyHash {
  try {
    return JSON.stringify(key)
  } catch (serializationError) {
    throw new QueryError(
      'Query key is not serializable. Keys must be structured arrays of JSON-compatible values.',
      { cause: serializationError }
    )
  }
}

/**
 * Provisional prefix match over the structured key. Element identity only
 * until #278 defines structural comparison.
 */
function isKeyPrefixMatch(prefix: QueryKey, key: QueryKey): boolean {
  if (prefix.length > key.length) {
    return false
  }
  return prefix.every((segment, index) => Object.is(segment, key[index]))
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
      typeof (item as { updatedAt?: unknown }).updatedAt === 'number'
  )
}

function buildClient(disposeClientRoot: () => void, onDispose?: () => void): QueryClient {
  const entries = new Map<QueryKeyHash, ClientCacheEntry>()
  let disposed = false

  function ensureUsable(method: string): void {
    if (disposed) {
      throw new QueryError(
        `QueryClient.${method}() called after dispose(). Create a new client with createQueryClient().`
      )
    }
  }

  function createEntry(
    key: QueryKey,
    hash: QueryKeyHash,
    policy: { staleTime: number; gcTime: number; snapshot: boolean }
  ): ClientCacheEntry {
    const entry: ClientCacheEntry = {
      key,
      hash,
      data: undefined,
      error: undefined,
      status: 'idle',
      fetchStatus: 'idle',
      updatedAt: undefined,
      observerCount: 0,
      staleTime: policy.staleTime,
      gcTime: policy.gcTime,
      snapshot: policy.snapshot,
      invalidated: false,
      generation: 0,
      inFlight: null,
    }
    entries.set(hash, entry)
    return entry
  }

  function toCacheEntryView(entry: ClientCacheEntry): CacheEntry {
    return {
      key: entry.key,
      hash: entry.hash,
      data: entry.data,
      error: entry.error as Error | undefined,
      updatedAt: entry.updatedAt,
      status: entry.status,
      fetchStatus: entry.fetchStatus,
      observerCount: entry.observerCount,
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
    if (options.client !== undefined && options.client !== client) {
      return options.client.fetchQuery(options)
    }
    ensureUsable('fetchQuery')
    const resolvedKey = options.key()
    const hash = hashQueryKey(resolvedKey)
    const cached = entries.get(hash)
    const entry =
      cached ??
      createEntry(resolvedKey, hash, {
        staleTime: options.staleTime ?? DEFAULT_STALE_TIME,
        gcTime: options.gcTime ?? DEFAULT_GC_TIME,
        snapshot: options.snapshot ?? DEFAULT_SNAPSHOT,
      })
    entry.key = resolvedKey
    // Explicitly passed options update the entry policy, on both the hit and
    // miss paths; absent options leave it alone. An entry restored by
    // hydrate() starts on defaults and picks up the developer's configuration
    // from the first query that names the key instead of keeping snapshot
    // defaults forever.
    if (options.staleTime !== undefined) {
      entry.staleTime = options.staleTime
    }
    if (options.gcTime !== undefined) {
      entry.gcTime = options.gcTime
    }
    if (options.snapshot !== undefined) {
      entry.snapshot = options.snapshot
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
    entry.fetchStatus = 'fetching'
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

    function ownsSlot(): boolean {
      return entry.inFlight?.promise === requestPromise
    }

    function releaseSlot(): void {
      // `fetchStatus` mirrors `inFlight`: whatever clears the slot marks it
      // idle, so no path leaves a settled entry reading as fetching, and no
      // stale flight clears a newer flight's slot.
      if (ownsSlot()) {
        entry.inFlight = null
        entry.fetchStatus = 'idle'
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
        if (!controller.signal.aborted && entry.generation === requestGeneration) {
          entry.data = loaded
          entry.error = undefined
          entry.status = 'success'
          entry.updatedAt = Date.now()
          entry.invalidated = false
        }
        return loaded
      },
      (loadError) => {
        if (!controller.signal.aborted && entry.generation === requestGeneration) {
          entry.error = loadError
          entry.status = 'error'
        }
        throw loadError
      }
    ).then(resolveRequest, rejectRequest)
    return requestPromise
  }

  const client: QueryClient = {
    fetchQuery,

    prefetchQueries(requests: readonly FetchQueryOptions<any, any>[]): Promise<void> {
      ensureUsable('prefetchQueries')
      return Promise.all(
        requests.map((request) =>
          client
            .fetchQuery(request)
            .then(
              () => undefined,
              () => undefined
            )
        )
      ).then(() => undefined)
    },

    invalidate(prefix: QueryKey): void {
      ensureUsable('invalidate')
      for (const entry of entries.values()) {
        if (isKeyPrefixMatch(prefix, entry.key)) {
          entry.invalidated = true
          entry.generation += 1
          if (entry.inFlight !== null) {
            // Detach the pre-invalidation flight: its waiter still settles,
            // but it no longer blocks a fresh load, and the generation guard
            // drops its stale outcome instead of un-invalidating the entry.
            // `fetchStatus` mirrors the slot, so it goes idle here.
            entry.inFlight = null
            entry.fetchStatus = 'idle'
          }
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
        // Entries whose data is undefined stay cached but are not serialized:
        // JSON cannot carry an undefined value, so including one would produce
        // a payload that hydrate() itself rejects.
        if (entry.data === undefined) {
          continue
        }
        // Snapshot serialization is opt-in per query; a filter narrows the
        // opt-in set further and never widens it.
        if (!entry.snapshot) {
          continue
        }
        const view = toCacheEntryView(entry)
        if (filter !== undefined && !filter(view)) {
          continue
        }
        queries.push({
          key: entry.key,
          data: entry.data,
          updatedAt: entry.updatedAt ?? Date.now(),
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
      for (const item of state.queries) {
        const hash = hashQueryKey(item.key)
        const entry =
          entries.get(hash) ??
          createEntry(item.key, hash, {
            staleTime: DEFAULT_STALE_TIME,
            gcTime: DEFAULT_GC_TIME,
            snapshot: DEFAULT_SNAPSHOT,
          })
        entry.key = item.key
        entry.data = item.data
        entry.error = undefined
        entry.status = 'success'
        entry.updatedAt = item.updatedAt
        entry.invalidated = false
        // The restored snapshot is newer than any flight started before it:
        // release the slot so a later fetch serves the restored data instead
        // of sharing the stale flight (its waiter still settles, but the
        // generation guard drops its outcome). `fetchStatus` mirrors the slot.
        entry.generation += 1
        entry.inFlight = null
        entry.fetchStatus = 'idle'
      }
    },

    clear(): void {
      ensureUsable('clear')
      for (const entry of entries.values()) {
        entry.inFlight?.controller.abort()
      }
      entries.clear()
    },

    dispose(): void {
      if (disposed) {
        return
      }
      for (const entry of entries.values()) {
        entry.inFlight?.controller.abort()
      }
      entries.clear()
      disposed = true
      disposeClientRoot()
      onDispose?.()
    },
  }

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
  provideEnvironmentValue(QueryClientKey, client)
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
      'No QueryClient provided. Create one per request with createQueryClient() and expose it with provideQueryClient(), or pass an explicit client option. A module-global client would leak cached data between server requests.'
    )
  }
  return getDefaultQueryClient()
}
