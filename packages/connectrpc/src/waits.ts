/**
 * Per-observer waits on shared query executions.
 *
 * `@tachui/query` runs one loader for every observer of an entry, and that is
 * the point: two components showing one user make one call. But a Connect call
 * carries a signal and a deadline, and those belong to whoever asked. One
 * observer's short deadline must not cut off the call another is still waiting
 * for, so neither is handed to the shared call. Each observer instead holds a
 * wait on the execution in flight, bounded by its own signal and deadline, and
 * the execution is stopped only once nobody is waiting for it any longer.
 *
 * Executions are announced by the adapter's own loader rather than inferred
 * from entry state: an invalidation replaces a running execution with another
 * inside one notification, and nothing in the entry's state shows the seam.
 *
 * A stopped execution stays announced, and its loader stays pending, for as
 * long as somebody still watches its entry. The query layer holds its flight
 * meanwhile, so a refetch or a new observer joins that flight rather than
 * starting another, and whoever joins is waiting again: the loader starts the
 * call over for them. Settling the loader with the stop instead would record
 * an internal cancellation as the entry's error, and leave a flight settling
 * a few microtasks later that a joiner could adopt with nobody to answer it.
 */

import { hashQueryKey } from '@tachui/query'
import type { QueryClient, QueryKey, QueryKeyHash } from '@tachui/query'

import { canceledError, linkSignals, startDeadline } from './call'

/** One run of the adapter's loader for one cache entry. */
export interface Execution {
  readonly hash: QueryKeyHash
  /**
   * Aborted once nobody is waiting for this run any longer, and replaced if
   * somebody joins it again before it has settled.
   */
  stop: AbortController
  readonly waits: Set<Wait>
  settled: boolean
  /**
   * Set while the execution is being announced to its entry's watchers. One
   * that gives up at once must not stop it before the rest have joined.
   */
  announcing: boolean
  /** Starts a stopped execution over, while its loader is held for a joiner. */
  rejoin: (() => void) | undefined
}

/** An observer of one entry, told as each execution for it starts and ends. */
export interface Watcher {
  begin(execution: Execution): void
  settled(execution: Execution, succeeded: boolean): void
}

interface EntryCalls {
  execution: Execution | undefined
  readonly watchers: Set<Watcher>
}

/**
 * Keyed by client, so executions in one cache are never mistaken for another's,
 * and dropped with it.
 */
const callsByClient = new WeakMap<QueryClient, Map<QueryKeyHash, EntryCalls>>()

function callsFor(client: QueryClient, hash: QueryKeyHash): EntryCalls {
  let byHash = callsByClient.get(client)
  if (byHash === undefined) {
    byHash = new Map()
    callsByClient.set(client, byHash)
  }
  let calls = byHash.get(hash)
  if (calls === undefined) {
    calls = { execution: undefined, watchers: new Set() }
    byHash.set(hash, calls)
  }
  return calls
}

function prune(client: QueryClient, hash: QueryKeyHash, calls: EntryCalls): void {
  if (calls.execution === undefined && calls.watchers.size === 0) {
    callsByClient.get(client)?.delete(hash)
  }
}

/**
 * Starts watching an entry. A watcher arriving while an execution is running
 * joins it, as its observer joins the request.
 */
export function watchEntry(
  client: QueryClient,
  hash: QueryKeyHash,
  watcher: Watcher
): () => void {
  const calls = callsFor(client, hash)
  calls.watchers.add(watcher)
  if (calls.execution !== undefined) {
    watcher.begin(calls.execution)
  }
  return () => {
    calls.watchers.delete(watcher)
    prune(client, hash, calls)
  }
}

/** The execution running for an entry, if any. */
export function currentExecution(
  client: QueryClient,
  key: QueryKey
): Execution | undefined {
  let hash: QueryKeyHash
  try {
    hash = hashQueryKey(key)
  } catch {
    // The query surfaces an unhashable key itself; nothing runs for one.
    return undefined
  }
  return callsByClient.get(client)?.get(hash)?.execution
}

/** Announces a new execution for `key` to everyone watching its entry. */
export function beginExecution(client: QueryClient, key: QueryKey): Execution {
  const hash = hashQueryKey(key)
  const calls = callsFor(client, hash)
  const execution: Execution = {
    hash,
    stop: new AbortController(),
    waits: new Set(),
    settled: false,
    announcing: true,
    rejoin: undefined,
  }
  calls.execution = execution
  const watchers = [...calls.watchers]
  try {
    for (const watcher of watchers) {
      watcher.begin(execution)
    }
  } finally {
    execution.announcing = false
  }
  // With nobody watching, a refetch joins once this returns; otherwise every
  // watcher has had its say, and if all of them gave up the run is abandoned.
  if (watchers.length > 0) {
    stopIfAbandoned(execution)
  }
  return execution
}

/**
 * Holds a stopped execution's loader until somebody joins it, then starts it
 * over, so a call abandoned by one set of observers still answers the next.
 * Resolves when the execution may go on. Rejects with `failure` when it is not
 * this execution's stop, or once the loader's own `signal` aborts meanwhile:
 * the query layer has let go of the flight, and nobody can join it any longer.
 *
 * With nobody watching the entry nobody would ever join, so the flight is
 * detached instead of held, and the stop is not recorded as the entry's error.
 */
export function resumeWhenJoined(
  client: QueryClient,
  key: QueryKey,
  execution: Execution,
  failure: unknown,
  signal: AbortSignal
): Promise<void> {
  const stop = execution.stop.signal
  if (
    !stop.aborted ||
    failure !== stop.reason ||
    execution.settled ||
    signal.aborted
  ) {
    return Promise.reject(failure)
  }
  const watched =
    (callsByClient.get(client)?.get(execution.hash)?.watchers.size ?? 0) > 0
  if (execution.waits.size === 0 && !watched) {
    detachFlight(client, key)
    return Promise.reject(failure)
  }
  return new Promise<void>((resolve, reject) => {
    const onAbort = (): void => {
      execution.rejoin = undefined
      reject(failure)
    }
    const restart = (): void => {
      execution.rejoin = undefined
      signal.removeEventListener('abort', onAbort)
      execution.stop = new AbortController()
      resolve()
    }
    if (execution.waits.size > 0) {
      restart()
      return
    }
    execution.rejoin = restart
    signal.addEventListener('abort', onAbort, { once: true })
  })
}

/**
 * Ends the query layer's flight for `key` without recording anything on its
 * entry, through an observation taken just long enough to reach it.
 */
function detachFlight(client: QueryClient, key: QueryKey): void {
  const observation = client.observe(key)
  try {
    observation.abortInFlight()
  } finally {
    // The abort is the whole point; releasing must not repeat it against
    // whatever starts next.
    observation.release({ keepInFlight: true })
  }
}

/** Nobody is waiting any longer, so no further attempt should start. */
function stopIfAbandoned(execution: Execution): void {
  if (
    !execution.announcing &&
    !execution.settled &&
    execution.waits.size === 0 &&
    !execution.stop.signal.aborted
  ) {
    execution.stop.abort(
      canceledError('no observer is still waiting for this call')
    )
  }
}

/** Ends every wait on an execution and tells its entry's watchers. */
export function settleExecution(
  client: QueryClient,
  execution: Execution,
  succeeded: boolean
): void {
  execution.settled = true
  for (const wait of [...execution.waits]) {
    wait.end()
  }
  const calls = callsByClient.get(client)?.get(execution.hash)
  if (calls === undefined) {
    return
  }
  if (calls.execution === execution) {
    calls.execution = undefined
  }
  for (const watcher of [...calls.watchers]) {
    watcher.settled(execution, succeeded)
  }
  prune(client, execution.hash, calls)
}

/** What bounds one observer's wait. */
export interface WaitBounds {
  /** The application's signal: aborting it ends the wait as cancelled. */
  readonly signal: AbortSignal | undefined
  /** How long the whole wait may take, retries and backoff included. */
  readonly timeoutMs: number | undefined
  /** Told the failure the wait gave up with, when it does. */
  readonly onGiveUp: (failure: unknown) => void
}

/**
 * One observer waiting on one execution.
 *
 * It ends in one of three ways: the execution settles, the observer gives up
 * (its signal, its deadline, or `cancel()`), or the observer leaves (a key
 * change, or disposal). Giving up and leaving both withdraw it from the
 * execution, and the last to withdraw stops it.
 */
export class Wait {
  private finished = false
  private failure: { readonly error: unknown } | undefined
  private readonly rejecters = new Set<(error: unknown) => void>()
  private readonly onGiveUp: (failure: unknown) => void
  private readonly release: () => void

  constructor(
    readonly execution: Execution,
    bounds: WaitBounds
  ) {
    this.onGiveUp = bounds.onGiveUp
    execution.waits.add(this)
    const deadline = startDeadline(bounds.timeoutMs)
    const link = linkSignals([
      {
        signal: bounds.signal,
        failure: reason =>
          canceledError('the query was cancelled by its signal', reason),
      },
      { signal: deadline?.signal, failure: reason => reason },
    ])
    const onAbort = (): void => this.giveUp(link.signal.reason)
    this.release = () => {
      link.signal.removeEventListener('abort', onAbort)
      link.release()
      deadline?.clear()
    }
    if (link.signal.aborted) {
      this.giveUp(link.signal.reason)
    } else {
      link.signal.addEventListener('abort', onAbort, { once: true })
      // Somebody is waiting again on an execution held for a joiner.
      execution.rejoin?.()
    }
  }

  /** Whether this wait is over, however it ended. */
  get done(): boolean {
    return this.finished
  }

  /** Stops waiting, reporting `failure` to the observer and its pending calls. */
  giveUp(failure: unknown): void {
    if (this.finished) {
      return
    }
    this.finish()
    this.failure = { error: failure }
    this.onGiveUp(failure)
    this.rejectPending(failure)
    stopIfAbandoned(this.execution)
  }

  /**
   * Stops waiting without reporting anything to the observer. Pending calls
   * reject with `failure` when one is given, and otherwise keep following the
   * request they were made against.
   */
  leave(failure?: unknown): void {
    if (this.finished) {
      return
    }
    this.finish()
    if (failure !== undefined) {
      this.failure = { error: failure }
      this.rejectPending(failure)
    }
    stopIfAbandoned(this.execution)
  }

  /** The execution settled: its own outcome reaches everyone. */
  end(): void {
    if (!this.finished) {
      this.finish()
    }
  }

  /**
   * Settles as `work` does, unless this wait gives up first, in which case it
   * rejects with the failure the wait gave up with.
   */
  race<T>(work: Promise<T>): Promise<T> {
    if (this.failure !== undefined) {
      // Observed and dropped: the caller has its answer already.
      work.catch(() => undefined)
      return Promise.reject(this.failure.error)
    }
    return new Promise<T>((resolve, reject) => {
      this.rejecters.add(reject)
      work.then(
        value => {
          this.rejecters.delete(reject)
          resolve(value)
        },
        (error: unknown) => {
          this.rejecters.delete(reject)
          reject(error)
        }
      )
    })
  }

  private finish(): void {
    this.finished = true
    this.execution.waits.delete(this)
    this.release()
  }

  private rejectPending(failure: unknown): void {
    for (const reject of [...this.rejecters]) {
      reject(failure)
    }
    this.rejecters.clear()
  }
}
