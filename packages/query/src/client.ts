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
 * Marker standing in for `undefined` key segments. Plain `JSON.stringify`
 * maps `undefined` to `null` in array positions (and drops it from objects),
 * which would collide `['user', undefined]` with `['user', null]` and serve
 * one key's data for another. #278 replaces all of this with a stable
 * stringify (sorted object keys, `bigint`/`Uint8Array`/`Date` handling) and
 * development errors for non-serializable input.
 */
const UNDEFINED_MARKER = '__tachuiQueryUndefined'
const UNDEFINED_SEGMENT = { [UNDEFINED_MARKER]: true }

/** Brand check that holds across realms (structured clones, SSR payloads). */
function isDateValue(value: unknown): value is Date {
  return Object.prototype.toString.call(value) === '[object Date]'
}

/**
 * Rejects own enumerable symbol properties: Object.keys and JSON.stringify
 * both drop them, so sibling objects differing only by one would hash
 * identically and serve each other's data.
 */
function assertNoSymbolKeys(value: object, path: string): void {
  const hidden = Object.getOwnPropertySymbols(value).some((symbol) =>
    Object.prototype.propertyIsEnumerable.call(value, symbol)
  )
  if (hidden) {
    throw new QueryError(
      `Cannot hash query key: symbol-keyed properties are not supported at ${path} (they are dropped from the hash, so distinct keys would collide).`
    )
  }
}

/**
 * Plain-or-protoless check that holds across realms: a plain object has at
 * most one link above it (its realm's object prototype, or nothing).
 */
function isPlainObject(value: object): boolean {
  const prototype: unknown = Object.getPrototypeOf(value)
  return (
    prototype === Object.prototype ||
    prototype === null ||
    Object.getPrototypeOf(prototype) === null
  )
}

/**
 * Provisional key validation. The rule is to validate what the hash renders:
 * `JSON.stringify` silently collapses several inputs — Sets, Maps, and class
 * instances to `{}`, functions and symbols in array positions to `null` — so
 * distinct keys would share an entry and serve each other's data. Anything
 * the hash cannot render exactly is rejected here with a path instead of
 * colliding silently. `undefined` stays supported via the sentinel above.
 * #278 canonicalizes the rest instead of rejecting it.
 */
function assertHashable(value: unknown, path: string, seen: Set<object> = new Set()): void {
  if (value === null || value === undefined) {
    return
  }
  switch (typeof value) {
    case 'string':
    case 'boolean':
      return
    case 'number':
      if (!Number.isFinite(value)) {
        throw new QueryError(
          `Cannot hash query key: non-finite numbers are not supported at ${path}.`
        )
      }
      return
    case 'bigint':
      throw new QueryError(
        `Cannot hash query key: bigint is not supported yet at ${path} (stable canonicalization lands in #278).`
      )
    case 'function':
      throw new QueryError(
        `Cannot hash query key: functions are not supported at ${path}.`
      )
    case 'symbol':
      throw new QueryError(
        `Cannot hash query key: symbols are not supported at ${path}.`
      )
    default:
      break
  }
  // Invalid Dates carry no identity — the engines render them as null, which
  // would collide with an ordinary null segment — so they are rejected before
  // any hook runs. A brand spoof without a Date internal slot falls through
  // to the symbol check below.
  if (isDateValue(value)) {
    let time: number | undefined
    try {
      time = Date.prototype.getTime.call(value)
    } catch {
      time = undefined
    }
    if (time !== undefined && Number.isNaN(time)) {
      throw new QueryError(
        `Cannot hash query key: invalid Dates cannot be hashed at ${path} (they serialize as null).`
      )
    }
  }
  // A toJSON hook replaces the rendering, so it is validated first: the scan
  // must see the serialized representation, not the carrier. This covers
  // plain objects, class instances, genuine Dates (via the prototype hook,
  // which renders ISO strings), and arrays with custom hooks (whose indexed
  // elements the hash would otherwise never render).
  const toJSON = (value as { toJSON?: unknown }).toJSON
  if (typeof toJSON === 'function') {
    let serialized: unknown
    try {
      serialized = toJSON.call(value)
    } catch (toJSONError) {
      throw new QueryError(
        `Cannot hash query key: toJSON threw at ${path}.`,
        { cause: toJSONError }
      )
    }
    // Validated inside the parent's frame so a self-returning toJSON trips
    // the circular check instead of overflowing the stack.
    enterStructure(value as object, path, seen, () => {
      assertHashable(serialized, path, seen)
    })
    return
  }
  if (Array.isArray(value)) {
    assertNoSymbolKeys(value, path)
    // Index loop rather than forEach: holes read as undefined, which the
    // sentinel distinguishes instead of collapsing to null.
    enterStructure(value, path, seen, () => {
      for (let index = 0; index < value.length; index += 1) {
        assertHashable(value[index], `${path}[${index}]`, seen)
      }
    })
    return
  }
  if (!isPlainObject(value)) {
    throw new QueryError(
      `Cannot hash query key: class instances without toJSON are not supported at ${path}.`
    )
  }
  assertNoSymbolKeys(value, path)
  if (UNDEFINED_MARKER in (value as Record<string, unknown>)) {
    // A user object with this shape would hash identically to an undefined
    // segment and be served the other key's data, so the shape is reserved.
    // #278 encodes undefined as a bare token and lifts this restriction.
    throw new QueryError(
      `Cannot hash query key: the shape { ${UNDEFINED_MARKER}: ... } is reserved for the undefined encoding at ${path}.`
    )
  }
  enterStructure(value, path, seen, () => {
    for (const member of Object.keys(value)) {
      assertHashable(
        (value as Record<string, unknown>)[member],
        `${path}.${member}`,
        seen
      )
    }
  })
}

/**
 * Cycle guard for the scan. A shared (non-circular) reference revisits after
 * its subtree is done, so entries are removed on the way out; only a true
 * revisit while still inside throws.
 */
function enterStructure(
  value: object,
  path: string,
  seen: Set<object>,
  visit: () => void
): void {
  if (seen.has(value)) {
    throw new QueryError(
      `Cannot hash query key: circular reference detected at ${path}.`
    )
  }
  seen.add(value)
  try {
    visit()
  } finally {
    seen.delete(value)
  }
}

/**
 * Whether the key round-trips through the wire codec to the same hash. The
 * hash runs on post-toJSON values, so walking the raw key disagrees in both
 * directions: a toJSON value carrying a raw `undefined` would be dropped
 * although it matches, and a toJSON resolving to `undefined` would be
 * emitted as a dead entry. The self-consistency check below compares the
 * hash before and after a JSON round trip instead of enumerating lossy
 * shapes. Anything unserializable is already rejected at insert time; the
 * catch is for a non-deterministic toJSON, which fails safe (skipped).
 */
function keySurvivesWire(key: QueryKey): boolean {
  try {
    const revived = JSON.parse(JSON.stringify(key)) as QueryKey
    return hashQueryKey(key) === hashQueryKey(revived)
  } catch {
    return false
  }
}

/**
 * Provisional key hash. The scan above rejects everything `stringify` could
 * choke on, so there is no fallback: anything reaching serialization is
 * exactly renderable. See {@link UNDEFINED_SEGMENT} and #278.
 */
function hashQueryKey(key: QueryKey): QueryKeyHash {
  assertHashable(key, 'key')
  return JSON.stringify(key, (_segment, value: unknown) =>
    value === undefined ? UNDEFINED_SEGMENT : value
  )
}

/**
 * Provisional prefix match over the structured key. Segments compare by hash,
 * not identity, so Date and object segments are reachable by value — the same
 * entries fetchQuery would serve. (An unhashable segment raises here exactly
 * as it would from fetchQuery.) Index loop: every/some skip holes, and a
 * hole prefix must compare as undefined, not match vacuously.
 */
function isKeyPrefixMatch(prefix: QueryKey, key: QueryKey): boolean {
  if (prefix.length > key.length) {
    return false
  }
  for (let index = 0; index < prefix.length; index += 1) {
    if (hashQueryKey([prefix[index]]) !== hashQueryKey([key[index]])) {
      return false
    }
  }
  return true
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
    policy: { staleTime?: number; gcTime?: number; snapshot?: boolean }
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
      // Strip the forwarder: a decorated/proxied client that delegates back
      // here would otherwise recurse on the intact options to RangeError.
      return options.client.fetchQuery({ ...options, client: undefined })
    }
    ensureUsable('fetchQuery')
    const resolvedKey = options.key()
    const hash = hashQueryKey(resolvedKey)
    const cached = entries.get(hash)
    const entry = cached ?? createEntry(resolvedKey, hash, options)
    entry.key = resolvedKey
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

    async prefetchQueries(requests: readonly FetchQueryOptions<any, any>[]): Promise<void> {
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
        // Keys that cannot survive the wire are skipped for the same
        // reason: the restored entry could never be matched.
        if (!keySurvivesWire(entry.key)) {
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
      // Validate every key before committing any entry: a malformed later
      // entry must not leave earlier ones partially installed for a fallback
      // fetch to serve.
      const restored = state.queries.map((item) => ({
        item,
        hash: hashQueryKey(item.key),
      }))
      for (const { item, hash } of restored) {
        const entry =
          entries.get(hash) ??
          // Unclaimed defaults: the first query that names the key configures
          // the restored entry.
          createEntry(item.key, hash, {})
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
