/**
 * `createAsyncStream` and `createAsyncStreamList` — the stream primitives (#282).
 *
 * A stream is a subscription rather than a request: it has no cache entry, no
 * freshness, and no result to return. What it has is a lifecycle, and the
 * whole point of the status model is that its three endings stay apart —
 * `completed` is the server saying there is no more, `error` is it breaking,
 * and `cancelled` is us hanging up. Collapsing those would leave a consumer
 * unable to tell a finished feed from a dropped one.
 *
 * Two modes, because one shape cannot serve both. Reduction mode folds
 * messages into a bounded value: counters, a latest reading, a small derived
 * summary. Collection mode routes through `createSignalList`, so a list of a
 * thousand rows updates the one row a message touches instead of re-rendering
 * — a repeat key costs one item-signal write whatever the collection holds,
 * and `limit` is what keeps a live feed's cost flat, since adding a *new* key
 * rewrites the key array and so scales with what is retained. The naive
 * `reduce: (items, m) => [...items, m]` has neither property — it copies the
 * whole array per message and grows without bound — which is why `bufferSize`
 * exists for the folds that do accumulate arrays, and why collections have a
 * mode of their own.
 */

import {
  createEffect,
  createMemo,
  createSignal,
  createSignalListControls,
  onCleanup,
  untrack,
} from '@tachui/core'

import { raceAbort } from './abort'
import { QueryError } from './errors'
import { hashQueryKey } from './keys'
import type {
  AsyncStreamBaseOptions,
  AsyncStreamListOptions,
  AsyncStreamListResult,
  AsyncStreamOptions,
  AsyncStreamResult,
  AsyncStreamStatus,
  QueryKey,
} from './types'

/** Whether a value can actually be iterated as a stream of messages. */
function isAsyncIterable<T>(value: unknown): value is AsyncIterable<T> {
  if (value === null || (typeof value !== 'object' && typeof value !== 'function')) {
    return false
  }
  return (
    typeof (value as AsyncIterable<T>)[Symbol.asyncIterator] === 'function'
  )
}

/** Names what arrived, for a message about what should have. */
function describe(value: unknown): string {
  if (value === null) {
    return 'null'
  }
  return Array.isArray(value) ? 'an array' : typeof value
}

/**
 * Offers a source the chance to clean up, and never throws doing it.
 *
 * Called from a message loop nobody awaits and from a `then` handler nothing
 * catches, on objects that reached here without being verified — a `return`
 * that is present but not callable, or an iterator factory that throws, would
 * otherwise surface as an unhandled rejection, or replace the reason the
 * stream ended with the noise of tidying up after it.
 */
function safeReturn(source: AsyncIterable<unknown> | AsyncIterator<unknown>): void {
  try {
    const iterator =
      Symbol.asyncIterator in source
        ? (source as AsyncIterable<unknown>)[Symbol.asyncIterator]()
        : (source as AsyncIterator<unknown>)
    void Promise.resolve(iterator.return?.()).catch(() => undefined)
  } catch {
    // Nothing left to do: the source is being abandoned either way.
  }
}

/** Whether a stream is currently attached to a source. */
function isActive(status: AsyncStreamStatus): boolean {
  return status === 'connecting' || status === 'open'
}

/**
 * Validates a retention bound.
 *
 * Zero is refused rather than read as "retain nothing": a stream configured to
 * keep no messages is far more likely to be an uninitialized variable than an
 * intent, and the shape that genuinely wants none is not subscribing.
 */
function assertRetentionBound(value: number | undefined, name: string): void {
  if (value === undefined) {
    return
  }
  if (!Number.isInteger(value) || value < 1) {
    throw new QueryError(
      `Cannot configure stream: ${name} must be a positive integer number of messages. Received ${String(value)}.`
    )
  }
}

/**
 * Where a connection delivers what it receives.
 *
 * The lifecycle is identical in both modes and the retention is not, so the
 * connection owns status, errors, the key, and cancellation, while the sink
 * owns what a message means. `reset` runs at the start of every connection:
 * each one is a new sequence, and messages from the last are not part of it.
 */
interface StreamSink<T> {
  reset(): void
  receive(message: T): void
}

/** The lifecycle both modes share. */
interface StreamConnection<E> {
  readonly status: () => AsyncStreamStatus
  readonly error: () => E | undefined
  connect(): Promise<void>
  cancel(): void
  dispose(): void
}

/**
 * Drives one source at a time, publishing its lifecycle.
 *
 * Connecting again — by hand, or because the key changed — ends whatever was
 * attached before. There is no reconnection logic anywhere in here: nothing
 * retries automatically in this package, and a subscription that silently
 * re-established itself would be indistinguishable from one that never
 * dropped.
 */
function createStreamConnection<T, E = Error>(
  options: AsyncStreamBaseOptions<T>,
  sink: StreamSink<T>
): StreamConnection<E> {
  const [status, setStatus] = createSignal<AsyncStreamStatus>('idle')
  const [error, setError] = createSignal<E | undefined>(undefined)
  // Memoized so a key change triggers exactly once rather than once per
  // dependency the accessor happens to read.
  const key = createMemo<QueryKey>(() => options.key())

  /**
   * Identifies the live connection. Bumped by every `connect`, so a loop still
   * unwinding from a source that was replaced cannot publish over the one that
   * replaced it.
   */
  let generation = 0
  let controller: AbortController | undefined
  let disposed = false

  function owns(current: number): boolean {
    return current === generation && !disposed
  }

  /** Ends the current source, if any, without publishing anything. */
  function detach(): void {
    generation += 1
    controller?.abort()
    controller = undefined
  }

  /**
   * Pulls messages until the source ends, the caller hangs up, or it breaks.
   *
   * Each `next()` is raced against the abort rather than awaited outright: a
   * source that ignores its signal and never yields again would otherwise hold
   * the loop — and the owner's cleanup — for good. `return()` is still offered
   * afterwards so a cooperative source can release whatever it holds.
   */
  async function pump(
    iterator: AsyncIterator<T>,
    signal: AbortSignal,
    current: number
  ): Promise<void> {
    for (;;) {
      try {
        const step = await raceAbort(Promise.resolve(iterator.next()), signal)

        // Checked before the message is delivered, not after: a cancellation
        // is a promise that nothing further reaches the consumer, and a
        // message already in flight when it landed is exactly what that
        // promise is about.
        if (!owns(current) || signal.aborted) {
          return
        }
        if (step.done === true) {
          setStatus('completed')
          return
        }
        // `itemKey`, `reduce`, and the eviction they drive are caller code
        // running per message. One that throws ends the stream rather than
        // silently dropping messages into a value nobody can trust.
        sink.receive(step.value)
      } catch (failure) {
        // Everything above is inside the guard, including reading `step`: a
        // source that breaks the iterator protocol — resolving `undefined`
        // rather than a result — throws here, and outside the guard that
        // became an unhandled rejection with the status still reading `open`.
        // Nothing in a loop nobody awaits may throw.
        safeReturn(iterator)
        if (!owns(current)) {
          // Cancelled, disposed, or replaced. Every one of those raises the
          // generation before it aborts, so the abort arrives here already
          // disowned and the status has been set by whoever asked for it —
          // `cancelled` for a hang-up, untouched for a teardown. Publishing an
          // ending from inside the loop would only overwrite a truer one.
          return
        }
        setError(() => failure as E)
        setStatus('error')
        return
      }
    }
  }

  async function connect(): Promise<void> {
    if (disposed) {
      throw new QueryError(
        'connect() was called after its owner was disposed. A stream is bound to the owner that created it; create one in the component that renders it, or hold it in an owner that outlives the subscription.'
      )
    }
    detach()
    const current = generation
    const attempt = new AbortController()
    controller = attempt
    sink.reset()
    setError(() => undefined)
    setStatus('connecting')

    let released = false
    /**
     * Closes a source this connection no longer has any use for.
     *
     * Total by construction: it runs from a `then` handler whose rejection
     * nothing would catch, and the value it is handed may not be a source at
     * all — an `open` that resolved the wrong thing reaches here before
     * anything has checked it.
     */
    function releaseIfAbandoned(
      source: AsyncIterable<T> | AsyncIterator<T>
    ): void {
      if (owns(current) || released) {
        return
      }
      released = true
      safeReturn(source)
    }

    let iterable: AsyncIterable<T>
    let iterator: AsyncIterator<T>
    try {
      // The key read and the `open` call are both inside the guard, not above
      // it. `open` is an ordinary function and may throw before it ever
      // returns — `new EventSource(badUrl)` is the shape — and a key accessor
      // may throw too. Outside the guard, either one left the stream sitting
      // at `connecting` with nothing published, and under `autoConnect` the
      // rejection has nobody to reach: a silent failure in a primitive whose
      // whole purpose is an honest lifecycle.
      const opening = Promise.resolve(
        options.open({ signal: attempt.signal, key: untrack(key) })
      )
      // Watched separately from the race below, because losing that race is
      // precisely when this matters: the connection is replaced while `open`
      // is still working, the race rejects on the abort, and the source
      // arrives afterwards with nobody waiting for it. `open` is handed the
      // signal, but one that ignores it would otherwise hand back a live
      // subscription nothing is left to close. A rejection here is the race's
      // to report.
      opening.then(releaseIfAbandoned, () => undefined)
      iterable = await raceAbort(opening, attempt.signal)
      if (!isAsyncIterable(iterable)) {
        // Checked before `open` is announced rather than discovered by the
        // first `next()`, which happens after `status` already said `open` —
        // an actively false claim, with no pump behind it and nothing to
        // publish the eventual `TypeError`.
        throw new QueryError(
          'open() must return an async iterable, or a promise of one. Received ' +
            describe(iterable) +
            '. An async generator, or any object with a Symbol.asyncIterator method, satisfies this.'
        )
      }
      // Taken here rather than at the handoff below, because asking an object
      // for its iterator runs caller code too, and one that throws after the
      // status already read `open` would strand the same false claim this
      // check exists to prevent.
      iterator = iterable[Symbol.asyncIterator]()
    } catch (failure) {
      // Disowned means this attempt was cancelled or replaced, and whoever did
      // that has already said so; only a genuine failure to open is this
      // call's to report. It rejects either way, since the connection the
      // caller asked for did not happen.
      if (owns(current)) {
        setError(() => failure as E)
        setStatus('error')
      }
      throw failure
    }
    if (!owns(current)) {
      // Superseded in the hair's breadth between the race resolving and this
      // line. The source is nobody's, so it is closed rather than left running
      // against a stream that has moved on.
      // The iterator, not the iterable: it has already been created, and
      // asking for a second one would run the factory again.
      releaseIfAbandoned(iterator)
      return
    }
    setStatus('open')

    // Deliberately not awaited: `connect()` answers when the subscription is
    // established, not when the stream ends — awaiting an endless feed would
    // never return. A failure after this point has no promise left to reject,
    // so it reaches the consumer through `status` and `error`, which is where
    // a subscription's failures belong anyway.
    void pump(iterator, attempt.signal, current)
  }

  const autoConnect = options.autoConnect ?? true
  /** The key the effect last acted on; undefined until it has run once. */
  let actedOn: string | undefined
  /** Whether the published error is one the key itself caused. */
  let keyFault = false

  createEffect(() => {
    if (disposed) {
      return
    }
    let hash: string
    try {
      hash = hashQueryKey(key())
    } catch (failure) {
      // An unhashable key is a programmer error (#278), but throwing here
      // would take down the render that produced it. It surfaces through
      // `error` like any other failure, and `actedOn` is left alone so a
      // corrected key is picked up on the next run.
      detach()
      keyFault = true
      setError(() => failure as E)
      setStatus('error')
      return
    }
    if (keyFault) {
      // The key that failed has been corrected. Leaving its error standing
      // would describe a stream that is merely waiting to be connected as
      // broken — and without `autoConnect` nothing else would ever clear it,
      // since `connect()` is the only other thing that does and the caller has
      // no reason to think one is needed.
      keyFault = false
      setError(() => undefined)
      setStatus('idle')
    }
    if (hash === actedOn) {
      return
    }
    const first = actedOn === undefined
    actedOn = hash
    if (autoConnect) {
      void connect().catch(() => undefined)
      return
    }
    if (!first && untrack(() => isActive(status()))) {
      // The open connection belongs to the key that was just left. Nothing
      // reconnects without `autoConnect`, but streaming a key the caller has
      // moved off is worse than streaming nothing.
      detach()
      setStatus('cancelled')
    }
  })

  function teardown(): void {
    disposed = true
    detach()
  }

  onCleanup(teardown)

  return {
    status,
    error,
    connect,
    cancel: () => {
      if (!untrack(() => isActive(status()))) {
        // Nothing is attached. Reporting `cancelled` here would overwrite the
        // `completed` or `error` that says how the stream actually ended.
        return
      }
      detach()
      setStatus('cancelled')
    },
    dispose: teardown,
  }
}

/**
 * Observes a stream, folding its messages into a bounded value.
 *
 * For counters, a latest reading, and small derived state. Supply
 * `bufferSize` whenever `reduce` accumulates an array: a fold that keeps
 * everything is unbounded by construction, and a long-lived subscription with
 * one is a memory leak with a schedule. Collections belong in
 * {@link createAsyncStreamList} instead, where per-message cost stays flat.
 */
export function createAsyncStream<T, A = undefined, E = Error>(
  options: AsyncStreamOptions<T, A>
): AsyncStreamResult<T, A, E> {
  assertRetentionBound(options.bufferSize, 'bufferSize')

  const [latest, setLatest] = createSignal<T | undefined>(undefined)
  const seed = (): A =>
    options.initial === undefined ? (undefined as A) : options.initial()
  const [value, setValue] = createSignal<A>(seed())

  const connection = createStreamConnection<T, E>(options, {
    reset: () => {
      setLatest(() => undefined)
      setValue(() => seed())
    },
    receive: (message) => {
      if (options.reduce === undefined) {
        setLatest(() => message)
        return
      }
      // Folded before anything is published, so a `reduce` that throws leaves
      // `latest` as it was rather than pointing at the message the stream
      // could not process — which is what collection mode does, where the key
      // is read first.
      const folded = options.reduce(untrack(value), message)
      setLatest(() => message)
      const cap = options.bufferSize
      setValue(() =>
        cap !== undefined && Array.isArray(folded) && folded.length > cap
          ? // Oldest first, which is the only end a fold can drop without
            // knowing what the accumulator means. The cap is typed to array
            // accumulators for that reason: there is no general way to drop
            // the oldest entry of a Map or a plain object.
            (folded.slice(folded.length - cap) as A)
          : folded
      )
    },
  })

  return {
    latest: createMemo(() => latest()),
    value: createMemo(() => value()),
    status: createMemo(() => connection.status()),
    error: createMemo(() => connection.error()),
    connect: connection.connect,
    cancel: connection.cancel,
    dispose: connection.dispose,
  }
}

/**
 * Observes a stream as a collection, backed by `createSignalList`.
 *
 * Each message is an item identified by `itemKey`, so a repeat key updates
 * that one row in place and a List re-renders nothing else. `limit` evicts the
 * oldest as new ones arrive, which is what keeps a live feed's cost flat
 * rather than proportional to how long the page has been open.
 */
export function createAsyncStreamList<
  T,
  K extends PropertyKey = PropertyKey,
  E = Error,
>(options: AsyncStreamListOptions<T, K>): AsyncStreamListResult<T, K, E> {
  assertRetentionBound(options.limit, 'limit')
  const prepend = options.insert === 'prepend'
  const controls = createSignalListControls<T, K>([], options.itemKey)

  const [latest, setLatest] = createSignal<T | undefined>(undefined)
  /**
   * Retained keys in display order, and the same keys as a set.
   *
   * The list's own `ids` carries the order too, but reading it here would mean
   * touching a signal from inside the message loop, and its `get` throws for a
   * key it does not hold rather than reporting absence — which is precisely
   * what {@link AsyncStreamListResult.get} has to be able to do, since `limit`
   * can evict a key between reading it from `ids` and looking it up.
   */
  let order: K[] = []
  let retained = new Set<K>()

  const connection = createStreamConnection<T, E>(options, {
    reset: () => {
      order = []
      retained = new Set<K>()
      controls.clear()
      setLatest(() => undefined)
    },
    receive: (message) => {
      const itemKey = options.itemKey(message)
      setLatest(() => message)
      if (retained.has(itemKey)) {
        // A repeat key is the same item saying something new. It updates in
        // place: it does not move, and it does not age anything out.
        controls.update(itemKey, message)
        return
      }

      retained.add(itemKey)
      if (prepend) {
        order.unshift(itemKey)
      } else {
        order.push(itemKey)
      }
      controls.update(itemKey, message)
      if (prepend) {
        // `update` appends a key it has not seen. Reordering straight after
        // puts it where this stream wants it, at the cost of one extra write
        // to the key array — the item signals, which are what a row renders,
        // are untouched.
        controls.reorder(order)
      }

      const limit = options.limit
      if (limit !== undefined && order.length > limit) {
        // The far end from the one new messages arrive at: appending makes the
        // first key oldest, prepending makes the last one oldest.
        const evicted = prepend ? order.pop() : order.shift()
        if (evicted !== undefined) {
          retained.delete(evicted)
          controls.remove(evicted)
        }
      }
    },
  })

  return {
    ids: createMemo<readonly K[]>(() => controls.ids()),
    get: (itemKey) =>
      retained.has(itemKey) ? controls.get(itemKey) : undefined,
    latest: createMemo(() => latest()),
    status: createMemo(() => connection.status()),
    error: createMemo(() => connection.error()),
    connect: connection.connect,
    cancel: connection.cancel,
    dispose: connection.dispose,
  }
}
