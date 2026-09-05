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
  /**
   * The key as the wire renders it — `undefined` collapsed to `null`, hooks
   * applied — decoupled from whatever array the caller handed in. This is
   * what the snapshot payload carries, and `dehydrate()` emits it only when
   * it hashes back to {@link ClientCacheEntry.hash}, so a lossy rendering is
   * skipped rather than restored dead. Matching never reads it: the
   * rendering is lossy by design, so prefix comparison uses
   * {@link ClientCacheEntry.segmentHashes} instead.
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
 * Marker standing in for `undefined` key segments. Plain `JSON.stringify`
 * maps `undefined` to `null` in array positions (and drops it from objects),
 * which would collide `['user', undefined]` with `['user', null]` and serve
 * one key's data for another. #278 replaces all of this with a stable
 * stringify (sorted object keys, `bigint`/`Uint8Array`/`Date` handling) and
 * development errors for non-serializable input.
 */
const UNDEFINED_MARKER = '__tachuiQueryUndefined'
const UNDEFINED_SEGMENT = { [UNDEFINED_MARKER]: true }

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

/** Brand check that holds across realms (structured clones, SSR payloads). */
function isDateValue(value: unknown): value is Date {
  return Object.prototype.toString.call(value) === '[object Date]'
}

/** Whether a property name is one of the indices an array renders. */
function isRenderedIndex(member: string, length: number): boolean {
  const index = Number(member)
  return (
    Number.isInteger(index) &&
    index >= 0 &&
    index < length &&
    String(index) === member
  )
}

/** Own symbol properties, enumerable or not: nothing renders them. */
function hasOwnSymbol(value: object): boolean {
  return Object.getOwnPropertySymbols(value).length > 0
}

/**
 * Own properties neither the hash nor the wire renders. `JSON.stringify`
 * emits a plain object's own *enumerable* string keys and an array's indexed
 * elements — nothing else — so any other own property is silently dropped and
 * siblings differing only by one would hash identically and serve each
 * other's data. That covers symbols (enumerable or not), non-enumerable
 * string keys on an object, and non-index names on an array. Array indices
 * render regardless of enumerability, and an array's own `length` is
 * structural rather than a property.
 */
function hasUnrenderedOwnProps(value: object): boolean {
  if (hasOwnSymbol(value)) {
    return true
  }
  if (Array.isArray(value)) {
    return Object.getOwnPropertyNames(value).some(
      (member) => member !== 'length' && !isRenderedIndex(member, value.length)
    )
  }
  return Object.getOwnPropertyNames(value).some(
    (member) => !Object.prototype.propertyIsEnumerable.call(value, member)
  )
}

/**
 * Rejects own properties the hash cannot render: siblings differing only by
 * one would hash identically and serve each other's data.
 */
function assertRenderableOwnProps(value: object, path: string): void {
  if (hasOwnSymbol(value)) {
    throw new QueryError(
      `Cannot hash query key: symbol-keyed properties are not supported at ${path} (they are dropped from the hash, so distinct keys would collide).`
    )
  }
  if (hasUnrenderedOwnProps(value)) {
    throw new QueryError(
      `Cannot hash query key: non-enumerable properties are not supported at ${path} (they are dropped from the hash, so distinct keys would collide).`
    )
  }
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
      // -0 stringifies as 0, so the two would share an entry and serve each
      // other's data (notably with flipped reciprocals).
      if (Object.is(value, -0)) {
        throw new QueryError(
          `Cannot hash query key: -0 is not supported at ${path} (it serializes as 0).`
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
    // Extra own properties never render, so an augmented array would collide
    // with its bare twin. (Holes are absent from Object.keys and stay
    // allowed via the sentinel path.)
    if (hasUnrenderedOwnProps(value)) {
      throw new QueryError(
        `Cannot hash query key: arrays with non-index properties are not supported at ${path} (they are dropped from the hash, so distinct keys would collide).`
      )
    }
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
  assertRenderableOwnProps(value, path)
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
 * The segments the hash actually renders. A `toJSON` hook on the key array
 * itself replaces the whole key — `JSON.stringify` applies it before looking
 * at any element — so the raw elements are not what the entry is keyed by.
 * Reading them would hash segments no prefix could ever name, and
 * `invalidate()` would miss the very entry `fetchQuery` served.
 */
function renderKeySegments(key: QueryKey): readonly unknown[] {
  const hook = (key as { toJSON?: unknown }).toJSON
  if (typeof hook !== 'function') {
    return key
  }
  let rendered: unknown
  try {
    rendered = hook.call(key)
  } catch (hookError) {
    throw new QueryError('Cannot hash query key: toJSON threw at key.', {
      cause: hookError,
    })
  }
  // A hook rendering something other than an array leaves no addressable
  // segments: only the empty prefix matches, which it still does.
  return Array.isArray(rendered) ? rendered : []
}

/**
 * Per-segment hashes of a key. Index loop rather than map: holes read as
 * undefined, which the sentinel distinguishes from null instead of skipping
 * (map) or matching vacuously.
 */
function hashKeySegments(key: QueryKey): QueryKeyHash[] {
  const segments = renderKeySegments(key)
  const hashes: QueryKeyHash[] = []
  for (let index = 0; index < segments.length; index += 1) {
    hashes.push(hashQueryKey([segments[index]]))
  }
  return hashes
}

/**
 * Provisional prefix match over hashed segments. Comparing hashes rather than
 * values keeps Date and object segments reachable by value — the same entries
 * fetchQuery would serve — and keeps matching independent of the entry's
 * stored key, which is the (lossy) wire rendering. Both sides are hashed by
 * their owners, so an unhashable prefix segment raises exactly as it would
 * from fetchQuery.
 */
function isKeyPrefixMatch(
  prefixHashes: readonly QueryKeyHash[],
  segmentHashes: readonly QueryKeyHash[]
): boolean {
  if (prefixHashes.length > segmentHashes.length) {
    return false
  }
  for (let index = 0; index < prefixHashes.length; index += 1) {
    if (prefixHashes[index] !== segmentHashes[index]) {
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
      key: wireClone(entry.key),
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
        // The hash *is* the rendering, so an equal hash means an equal
        // stored key and equal segments: the hit path neither re-renders the
        // key nor overwrites what the entry already holds.
        entry = cached
      } else {
        // Decoupled copy: the entry must not alias the caller's array, or a
        // later mutation desyncs entry.key from entry.hash (breaking the
        // snapshot key). It is the wire rendering, so the dehydrate gate can
        // test it directly; matching uses segment hashes, which the
        // rendering cannot skew. A key that cannot even be rendered is
        // refused loudly.
        let storedKey: QueryKey
        try {
          storedKey = wireClone(resolvedKey)
        } catch (cloneError) {
          // Raised inside the dispatch frame: nothing has been cached and no
          // loader has run, so prefetch must surface this as misuse rather
          // than swallow it as a load failure.
          throw new QueryError('Cannot cache query: its key cannot be serialized.', {
            cause: cloneError,
          })
        }
        // Segmented last, so a key that renders inconsistently is reported by
        // the storage step above rather than as a second hashing failure.
        entry = createEntry(storedKey, hash, hashKeySegments(resolvedKey), options)
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
        // Keys that cannot survive the wire are skipped for the same
        // reason: the restored entry could never be matched. entry.key is
        // always the wire rendering — inserted and hydrated alike — so a
        // hash mismatch against the insert-time hash proves the round trip
        // is lossy (undefined became null, a hook resolved away, a hole
        // filled in).
        if (entry.hash !== hashQueryKey(entry.key)) {
          continue
        }
        // A hook on the key array can render a non-array, which hashes
        // consistently and so clears the gate above — but hydrate() rejects
        // the payload on its shape check. Nothing is emitted that this
        // client's own hydrate() would refuse.
        if (!Array.isArray(entry.key)) {
          continue
        }
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
          key: view.key,
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
      // Validate every key before committing any entry: a malformed later
      // entry must not leave earlier ones partially installed for a fallback
      // fetch to serve.
      const restored = state.queries.map((item) => ({
        item,
        hash: hashQueryKey(item.key),
        segmentHashes: hashKeySegments(item.key),
      }))
      // Clone every entry before committing any, for the same atomicity: a
      // clone failure must not leave earlier entries partially installed.
      // The key is stored as its wire rendering, exactly as fetchQuery
      // stores it, so a hydrated entry faces the dehydrate gate on the same
      // terms — a structured clone would preserve undefined segments the
      // wire cannot carry and let the gate pass vacuously, re-emitting the
      // key as null for the next hop to mismatch. Matching is unaffected:
      // it reads segmentHashes, taken from the payload key above. Data
      // keeps the structured clone — it has no gate of its own, so
      // functions and symbols must raise loudly rather than be dropped.
      const staged = restored.map(({ item, hash, segmentHashes }) => {
        let key: QueryKey
        let data: unknown
        try {
          key = wireClone(item.key)
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
