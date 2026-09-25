/**
 * `createConnectMutation`: a unary Connect method as a `@tachui/query`
 * mutation.
 *
 * Each `mutate(input)` makes exactly one call, never retried: a write that
 * failed halfway is the application's to reason about. Its call is its own, so
 * every call option reaches the transport as given, the deadline included.
 * Invalidation, optimistic state, and rollback are `@tachui/query`'s: the
 * adapter writes nothing to the cache itself.
 */

import type {
  DescMessage,
  DescMethodUnary,
  MessageInitShape,
  MessageShape,
} from '@bufbuild/protobuf'
import type { ConnectError } from '@connectrpc/connect'
import { createMemo } from '@tachui/core'
import { createMutation } from '@tachui/query'
import type { MutationOptions } from '@tachui/query'

import {
  assertUnaryMethod,
  callOptionsFrom,
  callUnary,
  canceledError,
  linkSignals,
  startDeadline,
} from './call'
import { describeMethod } from './keys'
import { assertOptionsObject, resolveAdapterTransport } from './transport'
import type { ConnectMutationOptions, ConnectMutationResult } from './types'

/**
 * Creates a mutation that calls a unary method.
 *
 * Call it during a component render, below `provideConnectTransport`. The
 * transport is resolved here, and a missing provider, a conflicting binding, or
 * a `client` option that is not the one the transport is bound to throws a
 * `ConnectAdapterError` before anything is called.
 *
 * To refresh what a write changed, name it in `invalidates`, usually with
 * `connectQueryPrefix(method, { transport })`.
 */
export function createConnectMutation<
  I extends DescMessage,
  O extends DescMessage,
  TContext = unknown,
>(
  method: DescMethodUnary<I, O>,
  options?: ConnectMutationOptions<I, O, TContext>
): ConnectMutationResult<I, O> {
  assertUnaryMethod(method, 'createConnectMutation()')
  const caller = `createConnectMutation() for ${describeMethod(method)}`
  assertOptionsObject(options, caller, 'Pass an options object, or omit it.')
  const callOptions = callOptionsFrom(options?.callOptions, caller)
  const { transport, client } = resolveAdapterTransport(
    caller,
    options?.transport,
    options?.client
  )

  /**
   * `cancel()` and owner disposal abort the mutation's own signal, and the
   * query layer settles with that signal's reason. This maps each such reason
   * to the one `canceled` error the call itself stopped with, so the error
   * signal, the hooks, and the rejected promise all hold the same instance.
   */
  const cancellations = new WeakMap<object, ConnectError>()
  function asConnectFailure(error: unknown): unknown {
    return typeof error === 'object' && error !== null
      ? (cancellations.get(error) ?? error)
      : error
  }
  function cancelled(reason: unknown): ConnectError {
    const known =
      typeof reason === 'object' && reason !== null
        ? cancellations.get(reason)
        : undefined
    if (known !== undefined) {
      return known
    }
    const failure = canceledError('the mutation was cancelled', reason)
    if (typeof reason === 'object' && reason !== null) {
      cancellations.set(reason, failure)
    }
    return failure
  }

  async function run(
    input: MessageInitShape<I>,
    { signal }: { signal: AbortSignal }
  ): Promise<MessageShape<O>> {
    // Mapped whichever source stops the call first: a cancel() or disposal
    // after the application's signal or the deadline still settles the
    // mutation with the mutation signal's reason. The signal is this call's
    // alone, so the listener goes with it.
    if (!signal.aborted) {
      signal.addEventListener('abort', () => cancelled(signal.reason), {
        once: true,
      })
    }
    const deadline = startDeadline(callOptions.timeoutMs)
    const link = linkSignals([
      { signal, failure: cancelled },
      {
        signal: callOptions.signal,
        failure: reason =>
          canceledError('the mutation was cancelled by its signal', reason),
      },
      { signal: deadline?.signal, failure: reason => reason },
    ])
    try {
      return await callUnary(
        transport,
        method,
        input,
        link.signal,
        // Infinity is no deadline here, and absent is how Connect says so.
        callOptions.timeoutMs === Infinity ? undefined : callOptions.timeoutMs,
        callOptions
      )
    } finally {
      link.release()
      deadline?.clear()
    }
  }

  const { onError, onSettled } = options ?? {}
  const mutation = createMutation<
    MessageInitShape<I>,
    MessageShape<O>,
    unknown,
    TContext
  >({
    ...options,
    client,
    run,
    onError:
      onError === undefined
        ? undefined
        : (error, input, context) =>
            onError(asConnectFailure(error), input, context),
    onSettled:
      onSettled === undefined
        ? undefined
        : (data, error, input) =>
            onSettled(
              data,
              error === undefined ? undefined : asConnectFailure(error),
              input
            ),
  } as MutationOptions<MessageInitShape<I>, MessageShape<O>, unknown, TContext>)

  return {
    status: mutation.status,
    data: mutation.data,
    error: createMemo(() => asConnectFailure(mutation.error())),
    isPending: mutation.isPending,
    mutate: input =>
      mutation.mutate(input).catch((error: unknown) => {
        throw asConnectFailure(error)
      }),
    reset: mutation.reset,
    cancel: mutation.cancel,
  }
}
