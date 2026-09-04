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
  consumeEnvironmentValue,
  createEnvironmentKey,
  createRoot,
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
  readonly staleTime: number
  readonly gcTime: number
  readonly snapshot: boolean
  invalidated: boolean
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

function buildClient(disposeClientRoot: () => void): QueryClient {
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
    // Entry policy is fixed at creation; the first options to name a key win.
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
    const activeRequest = cached?.inFlight ?? null
    if (activeRequest !== null) {
      return activeRequest.promise as Promise<TRaw>
    }
    if (
      cached !== undefined &&
      cached.status === 'success' &&
      cached.data !== undefined &&
      !cached.invalidated
    ) {
      return cached.data as TRaw
    }
    const entry =
      cached ??
      createEntry(resolvedKey, hash, {
        staleTime: options.staleTime ?? DEFAULT_STALE_TIME,
        gcTime: options.gcTime ?? DEFAULT_GC_TIME,
        snapshot: options.snapshot ?? DEFAULT_SNAPSHOT,
      })
    entry.key = resolvedKey
    entry.fetchStatus = 'fetching'
    const controller = new AbortController()

    async function runLoad(): Promise<TRaw> {
      try {
        const loaded = await options.load({
          signal: controller.signal,
          key: resolvedKey,
        })
        // clear() and dispose() abort before dropping the entry, so a live
        // signal means this entry is still current. A late result after an
        // abort resolves to its caller but never repopulates the cache.
        if (!controller.signal.aborted) {
          entry.data = loaded
          entry.error = undefined
          entry.status = 'success'
          entry.fetchStatus = 'idle'
          entry.updatedAt = Date.now()
          entry.invalidated = false
        }
        return loaded
      } catch (loadError) {
        if (!controller.signal.aborted) {
          entry.error = loadError
          entry.status = 'error'
          entry.fetchStatus = 'idle'
        }
        throw loadError
      } finally {
        // Only one request can occupy the slot: a second fetch while one is
        // in flight shares it instead of replacing it.
        entry.inFlight = null
      }
    }

    const loadPromise: Promise<TRaw> = runLoad()
    entry.inFlight = { promise: loadPromise, controller }
    return loadPromise
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
        }
      }
    },

    dehydrate(filter?: (entry: CacheEntry) => boolean): DehydratedState {
      ensureUsable('dehydrate')
      const queries: DehydratedQuery[] = []
      for (const entry of entries.values()) {
        if (entry.status !== 'success' || entry.data === undefined) {
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
        entry.fetchStatus = 'idle'
        entry.updatedAt = item.updatedAt
        entry.invalidated = false
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
 * The implicit browser fallback, created on first use. Disposing it drops the
 * slot so the next resolution creates a fresh client instead of handing back a
 * dead one.
 */
function getDefaultQueryClient(): QueryClient {
  if (defaultClient === null) {
    const owned = createQueryClient()
    const ambient: QueryClient = {
      ...owned,
      dispose: () => {
        owned.dispose()
        if (defaultClient === ambient) {
          defaultClient = null
        }
      },
    }
    defaultClient = ambient
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
  let ambient: QueryClient | undefined
  try {
    ambient = consumeEnvironmentValue(QueryClientKey)
  } catch {
    ambient = undefined
  }
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
