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
 * matching, and the payload key codec live in `./keys` (#278); entry lifecycle
 * policy (dedup, freshness, `gcTime` eviction) lands in #279.
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
  canonicalizeQueryKey,
  decodeQueryKey,
  encodeQueryKey,
  hasUnrenderedOwnProps,
  hashKeySegments,
  hashQueryKey,
  isKeyPrefixMatch,
  isPlainObject,
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
  readonly observerCount: number
  staleTime: number
  gcTime: number
  snapshot: boolean
  policyClaimed: { staleTime: boolean; gcTime: boolean; snapshot: boolean }
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

/**
 * Whether snapshot data round-trips through the wire codec unchanged. Unlike
 * keys, data has no sentinel and no hook rendering: a Date revives as a
 * string, undefined members vanish, class instances lose their prototype, so
 * serving the revived value as success would contradict TRaw. Only plain
 * JSON survives exactly; anything else skips the snapshot and refetches on
 * the other side.
 */
function dataSurvivesWire(value: unknown, seen: Set<object> = new Set()): boolean {
  if (value === undefined) {
    return false
  }
  if (value === null) {
    return true
  }
  switch (typeof value) {
    case 'string':
    case 'boolean':
      return true
    case 'number':
      // -0 renders as 0 on the wire, so a hydrated entry would serve a value
      // TRaw never held (notably with a flipped reciprocal).
      return Number.isFinite(value) && !Object.is(value, -0)
    case 'bigint':
    case 'function':
    case 'symbol':
      return false
    default:
      break
  }
  const target = value as object
  // Own properties the wire drops — symbols, non-enumerable string keys, an
  // array's non-index names — would hydrate as altered data served as a
  // success, so the snapshot is skipped instead.
  if (hasUnrenderedOwnProps(target)) {
    return false
  }
  // A hook replaces the rendering, so the carrier never survives it — even
  // when the output is plain JSON, the revived value has lost the carrier.
  if (typeof (target as { toJSON?: unknown }).toJSON === 'function') {
    return false
  }
  if (seen.has(target)) {
    // Circular: the wire throws, so this could never round-trip.
    return false
  }
  seen.add(target)
  try {
    if (Array.isArray(value)) {
      // Index loop, mirroring the scan: holes read as undefined, which the
      // wire renders as null.
      for (let index = 0; index < value.length; index += 1) {
        if (!dataSurvivesWire(value[index], seen)) {
          return false
        }
      }
      return true
    }
    if (!isPlainObject(value)) {
      return false
    }
    for (const member of Object.keys(value)) {
      if (!dataSurvivesWire((value as Record<string, unknown>)[member], seen)) {
        return false
      }
    }
    return true
  } finally {
    seen.delete(target)
  }
}

/**
 * Wire-true copy for the dehydrate boundary: the payload must equal what
 * survives serialization, so mutating either side afterwards cannot rewrite
 * the other. Total on gated keys and data (both already survived a JSON
 * round trip to reach the push).
 */
function wireClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
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
    return entry
  }

  function toCacheEntryView(entry: ClientCacheEntry): CacheEntry {
    // Decoupled copies: the filter — and the payload built from this view —
    // must not alias the cache, so mutating either side cannot rewrite the
    // other. Errors stay live references; they never cross the boundary.
    return {
      // The key is canonical, so a structured clone is lossless — Dates,
      // bigints, and byte arrays all survive it, unlike a JSON round trip.
      key: structuredClone(entry.key) as QueryKey,
      hash: entry.hash,
      data: wireClone(entry.data),
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
      resolvedKey = options.key()
      const hash = hashQueryKey(resolvedKey)
      const cached = entries.get(hash)
      if (cached !== undefined) {
        // The hash is derived from the canonical encoding, so an equal hash
        // means an equal stored key and equal segments: the hit path neither
        // re-canonicalizes the key nor overwrites what the entry holds.
        entry = cached
      } else {
        // Decoupled canonical copy: the entry must not alias the caller's
        // array, or a later mutation desyncs entry.key from entry.hash.
        // Canonicalizing cannot fail here — the hash above already encoded
        // the same key — so any failure is the key's, not the storage step's.
        entry = createEntry(
          canonicalizeQueryKey(resolvedKey),
          hash,
          hashKeySegments(resolvedKey),
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
        }
        return loaded
      },
      (loadError) => {
        unwindStaleOutcome()
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
        // Data that cannot survive the wire stays cached but is not
        // serialized: a Date revives as a string, undefined members vanish,
        // class instances lose their prototype — serving any of those as
        // success on the other side would contradict TRaw. Skipped entries
        // refetch instead.
        if (!dataSurvivesWire(entry.data)) {
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
          key: encodedKey,
          data: view.data,
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
        return {
          item,
          key,
          hash: hashQueryKey(key),
          segmentHashes: hashKeySegments(key),
        }
      })
      // Clone data before committing any entry, for the same atomicity: a
      // clone failure must not leave earlier entries partially installed.
      // Keys need no clone — decoding already built fresh structures. Data
      // has no codec of its own, so functions and symbols must raise loudly
      // rather than be dropped.
      const staged = restored.map(({ item, key, hash, segmentHashes }) => {
        let data: unknown
        try {
          data = structuredClone(item.data)
        } catch (cloneError) {
          throw new QueryError(
            'hydrate() payload contains values that cannot cross the hydration boundary.',
            { cause: cloneError }
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
        entry.generation += 1
        entry.inFlight = null
        entry.fetchStatus = 'idle'
      }
    },

    clear(): void {
      ensureUsable('clear')
      abortActive()
      entries.clear()
    },

    dispose(): void {
      if (disposed) {
        return
      }
      abortActive()
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
      'No QueryClient provided. Create one per request with createQueryClient() and expose it with provideQueryClient(), or pass an explicit client option. A module-global client would leak cached data between server requests.'
    )
  }
  return getDefaultQueryClient()
}
