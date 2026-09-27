/**
 * `createConnectStream` and `createConnectStreamList`: a server-streaming
 * Connect method as a `@tachui/query` async stream.
 *
 * The adapter supplies what the method descriptor decides — the key, and an
 * `open` that makes one Connect call and hands its response messages on as an
 * async iterable — and `@tachui/query` does everything else: the lifecycle,
 * the reduction or the signal list, cancellation, and source replacement when
 * the key changes. A stream has no cache entry, so nothing a message says is
 * ever written to the query cache.
 *
 * Nothing reconnects on its own. A stream that completed or failed stays that
 * way until `connect()` starts a fresh call, which clears what the last one
 * retained; a changed key starts a new subscription rather than recovering the
 * old one.
 */

import type {
  DescMessage,
  DescMethodServerStreaming,
  MessageInitShape,
  MessageShape,
} from '@bufbuild/protobuf'
import type { StreamResponse } from '@connectrpc/connect'
import { createMemo } from '@tachui/core'
import {
  createAsyncStream,
  createAsyncStreamList,
  isServer,
  raceAbort,
} from '@tachui/query'
import type {
  AsyncStreamListOptions,
  AsyncStreamOpenContext,
  AsyncStreamOptions,
  QueryKey,
} from '@tachui/query'

import {
  assertServerStreamingMethod,
  callOptionsFrom,
  canceledError,
  linkSignals,
  startDeadline,
} from './call'
import { DEFAULT_TRANSPORT_NAME } from './defaults'
import { ConnectAdapterError } from './errors'
import { buildConnectKey, describeMethod } from './keys'
import { assertOptionsObject, resolveAdapterTransport } from './transport'
import type {
  ConnectStreamListOptions,
  ConnectStreamListResult,
  ConnectStreamOptions,
  ConnectStreamResult,
} from './types'

/** A key evaluation: the key and its request, or why there is neither. */
type Keyed<I extends DescMessage> =
  | { readonly key: QueryKey; readonly request: MessageShape<I> }
  | { readonly failure: unknown }

/** What the adapter hands `@tachui/query` in place of the caller's key and open. */
interface ConnectStreamSource<O extends DescMessage> {
  readonly key: () => QueryKey
  readonly open: (
    context: AsyncStreamOpenContext
  ) => Promise<AsyncIterable<MessageShape<O>>>
  readonly autoConnect: boolean
}

/** The options both modes share, as the adapter reads them. */
type SharedStreamOptions = Pick<
  ConnectStreamListOptions<DescMessage>,
  'transport' | 'callOptions' | 'keyExtension' | 'autoConnect'
>

/**
 * Offers an iterator the chance to clean up, and never throws doing it: the
 * call is being abandoned either way.
 */
function closeQuietly(iterator: AsyncIterator<unknown> | undefined): void {
  try {
    void Promise.resolve(iterator?.return?.()).catch(() => undefined)
  } catch {
    // Nothing left to do.
  }
}

/** The one request message a server-streaming call sends. */
async function* only<T>(message: T): AsyncGenerator<T> {
  yield message
}

/**
 * Validates the method and options, resolves the transport, and builds the
 * key and `open` both modes hand to `@tachui/query`.
 */
function connectStreamSource<I extends DescMessage, O extends DescMessage>(
  adapter: string,
  method: DescMethodServerStreaming<I, O>,
  input: () => MessageInitShape<I>,
  options: SharedStreamOptions | undefined
): ConnectStreamSource<O> {
  assertOptionsObject(options, adapter, 'Pass an options object, or omit it.')
  // Checked before the transport is resolved or anything is called, and named
  // with the transport it would have gone to.
  assertServerStreamingMethod(
    method,
    adapter,
    typeof options?.transport === 'string'
      ? options.transport
      : DEFAULT_TRANSPORT_NAME
  )
  const caller = `${adapter} for ${describeMethod(method)}`
  // Read once: changing the options object afterwards changes no call, and
  // cannot slip a deadline past the checks made on it here.
  const { signal: applicationSignal, timeoutMs, headers, contextValues } =
    callOptionsFrom(options?.callOptions, caller)
  const { name, transport } = resolveAdapterTransport(
    caller,
    options?.transport,
    undefined
  )

  // The request each key was built from, by the key's identity: `open` is
  // handed back the very array the key accessor returned, so a connection
  // always sends the request its key describes.
  const requests = new WeakMap<QueryKey, MessageShape<I>>()
  const keyOptions = { transport: name, keyExtension: options?.keyExtension }
  // Memoized apart from the stream's own key, so a request that cannot be
  // keyed fails with one value however often the stream reads its key.
  const keyed = createMemo<Keyed<I>>(() => {
    try {
      const built = buildConnectKey(method, input, keyOptions)
      requests.set(built.key, built.request)
      return built
    } catch (failure) {
      return { failure }
    }
  })

  return {
    key: () => {
      const current = keyed()
      if ('failure' in current) {
        // The stream publishes a key that throws as its error, unchanged, and
        // detaches whatever the previous key had open.
        throw current.failure
      }
      return current.key
    },
    open: openCall,
    // A server render never opens a stream on its own; `connect()` still does.
    autoConnect: (options?.autoConnect ?? true) && !isServer(),
  }

  /**
   * Makes one server-streaming call for the key `@tachui/query` is connecting,
   * and resolves with its messages once the call is open.
   *
   * The stream's signal ends it on `cancel()`, owner disposal, and a key that
   * replaced it. The application's signal and deadline end it too, but those
   * are failures of the call rather than local hang-ups: the messages reject
   * with a `ConnectError`, `canceled` or `deadline_exceeded`, and the stream
   * reports `error`.
   */
  async function openCall({
    signal,
    key,
  }: AsyncStreamOpenContext): Promise<AsyncIterable<MessageShape<O>>> {
    const request = requests.get(key)
    if (request === undefined) {
      throw new ConnectAdapterError(
        `${caller} was asked to open a key it did not build, so it has no request to send.`
      )
    }
    const deadline = startDeadline(timeoutMs)
    const link = linkSignals([
      {
        signal,
        failure: reason => canceledError('the stream was cancelled', reason),
      },
      {
        signal: applicationSignal,
        failure: reason =>
          canceledError('the stream was cancelled by its signal', reason),
      },
      { signal: deadline?.signal, failure: reason => reason },
    ])
    let released = false
    function release(): void {
      if (released) {
        return
      }
      released = true
      link.release()
      deadline?.clear()
    }
    // Nothing is sent once the call has already been stopped: an application
    // signal aborted in advance, or a deadline already passed.
    if (link.signal.aborted) {
      release()
      throw link.signal.reason
    }
    // Every ending the stream decides on — a hang-up, a replacement, and its
    // own completion or failure — aborts its signal, and so this one.
    link.signal.addEventListener('abort', release, { once: true })

    let pending: Promise<StreamResponse<I, O>>
    try {
      pending = Promise.resolve(
        transport.stream(
          method,
          link.signal,
          // Infinity is no deadline here, and absent is how Connect says so.
          timeoutMs === Infinity ? undefined : timeoutMs,
          headers,
          only(request as MessageInitShape<I>),
          contextValues
        )
      )
    } catch (error) {
      // A transport that throws instead of rejecting still fails this call only.
      pending = Promise.reject(error)
    }
    // A transport is asked to respect its signal and nothing can make it: a
    // call that opens after the stream stopped waiting is closed, not leaked.
    // A rejection here is the race's to report.
    pending.then(
      response => {
        if (link.signal.aborted) {
          try {
            closeQuietly(response.message[Symbol.asyncIterator]())
          } catch {
            // Not iterable: nothing was opened that could be closed.
          }
        }
      },
      () => undefined
    )
    let response: StreamResponse<I, O>
    try {
      response = await raceAbort(pending, link.signal)
    } catch (error) {
      release()
      throw error
    }
    return messagesOf(response.message, link.signal, release)
  }
}

/**
 * The call's messages, each `next()` raced against the call's signal.
 *
 * `@tachui/query` already races its own signal; this adds the application's
 * signal and deadline, so a transport that ignores them still ends promptly,
 * and it rejects with the `ConnectError` they map to.
 */
function messagesOf<T>(
  source: AsyncIterable<T>,
  signal: AbortSignal,
  release: () => void
): AsyncIterable<T> {
  return {
    [Symbol.asyncIterator](): AsyncIterator<T> {
      const iterator = source[Symbol.asyncIterator]()
      return {
        async next(): Promise<IteratorResult<T>> {
          try {
            const step = await raceAbort(Promise.resolve(iterator.next()), signal)
            if (step.done === true) {
              release()
            }
            return step
          } catch (error) {
            release()
            closeQuietly(iterator)
            throw error
          }
        },
        async return(): Promise<IteratorResult<T>> {
          release()
          closeQuietly(iterator)
          return { value: undefined, done: true }
        },
      }
    },
  }
}

/**
 * Observes a server-streaming method, folding its messages into a bounded
 * value.
 *
 * Call it during a component render, below `provideConnectTransport`. The
 * transport named by `options.transport` (default `'default'`) is resolved
 * here, and a missing provider or a conflicting binding throws a
 * `ConnectAdapterError` before anything is called; so does a descriptor that is
 * not server-streaming.
 *
 * `input` is reactive: reading a signal in it changes the request, and so the
 * key, and a changed key replaces the call. Each connection sends the request
 * its key was built from. With `autoConnect` (the default) the stream opens
 * when created, in the browser only; a server render opens nothing until
 * `connect()` is called.
 *
 * For messages that feed a List, use {@link createConnectStreamList}.
 */
export function createConnectStream<
  I extends DescMessage,
  O extends DescMessage,
  A = undefined,
>(
  method: DescMethodServerStreaming<I, O>,
  input: () => MessageInitShape<I>,
  options?: ConnectStreamOptions<O, A>
): ConnectStreamResult<O, A> {
  const source = connectStreamSource(
    'createConnectStream()',
    method,
    input,
    options
  )
  return createAsyncStream<MessageShape<O>, A, unknown>({
    ...(options as AsyncStreamOptions<MessageShape<O>, A>),
    // Last, so a key or open slipped past the types never replaces the call.
    ...source,
  })
}

/**
 * Observes a server-streaming method as a collection, backed by
 * `createSignalList`: the right choice whenever the messages feed a List.
 *
 * Each message is a row identified by `itemKey`, so a repeat key updates that
 * row in place, `limit` evicts the oldest, and `insert` chooses the end new
 * rows arrive at. Transport resolution, keys, and the lifecycle are as for
 * {@link createConnectStream}.
 */
export function createConnectStreamList<
  I extends DescMessage,
  O extends DescMessage,
  K extends PropertyKey = PropertyKey,
>(
  method: DescMethodServerStreaming<I, O>,
  input: () => MessageInitShape<I>,
  options: ConnectStreamListOptions<O, K>
): ConnectStreamListResult<O, K> {
  const source = connectStreamSource(
    'createConnectStreamList()',
    method,
    input,
    options
  )
  return createAsyncStreamList<MessageShape<O>, K, unknown>({
    ...(options as unknown as AsyncStreamListOptions<MessageShape<O>, K>),
    // Last, so a key or open slipped past the types never replaces the call.
    ...source,
  })
}
