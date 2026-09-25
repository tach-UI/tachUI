/**
 * Call plumbing shared by the adapters: validating call options and retry
 * counts, linking cancellation sources, and making one unary call that settles
 * promptly however the transport behaves.
 *
 * Failures keep their identity. A `ConnectError` the transport rejects with is
 * handed on as it is; only a cancellation or a deadline the adapter itself
 * enforces is turned into a new `ConnectError`, with `canceled` or
 * `deadline_exceeded`, so an application branches on one code whatever made
 * the call stop.
 */

import type {
  DescMessage,
  DescMethod,
  DescMethodUnary,
  MessageInitShape,
  MessageShape,
} from '@bufbuild/protobuf'
import { Code, ConnectError } from '@connectrpc/connect'
import type { Transport } from '@connectrpc/connect'

import { RETRY_BASE_DELAY_MS, RETRY_MAX_DELAY_MS } from './defaults'
import { ConnectAdapterError } from './errors'
import { describeMethod } from './keys'
import { assertOptionsObject } from './transport'
import type { ConnectCallOptions } from './types'

/**
 * Refuses anything but a unary method descriptor. The types already reject a
 * streaming one; this catches the call sites that reached here through `any`.
 */
export function assertUnaryMethod(
  method: unknown,
  caller: string
): asserts method is DescMethodUnary<DescMessage, DescMessage> {
  const candidate = method as Partial<DescMethod> | null
  if (
    typeof method !== 'object' ||
    candidate === null ||
    candidate.kind !== 'rpc' ||
    candidate.parent?.kind !== 'service'
  ) {
    throw new ConnectAdapterError(
      `${caller} was given ${method === null ? 'null' : typeof method}, not a method descriptor. Pass a generated unary method, for example UserService.method.getUser.`
    )
  }
  if (candidate.methodKind !== 'unary') {
    throw new ConnectAdapterError(
      `${caller} was given ${describeMethod(candidate as DescMethod)}, a ${String(candidate.methodKind)} method. Only unary methods have one response to cache; a server stream belongs to createConnectStream.`
    )
  }
}

/**
 * Reads a retry count. Only a finite, non-negative integer is a count: anything
 * else would either retry without bound or say nothing a caller could mean.
 */
export function retryCountFrom(retry: unknown, caller: string): number {
  if (retry === undefined) {
    return 0
  }
  if (typeof retry !== 'number' || !Number.isInteger(retry) || retry < 0) {
    throw new ConnectAdapterError(
      `${caller} was given ${typeof retry === 'number' ? String(retry) : typeof retry} as its retry count. Pass a whole number of retries, 0 or more; only unavailable and resource_exhausted are ever retried.`
    )
  }
  return retry
}

/**
 * Reads call options once, at creation. A malformed deadline is refused rather
 * than passed on: a NaN one would mean no deadline to one layer and an expired
 * one to another.
 */
export function callOptionsFrom(
  callOptions: unknown,
  caller: string
): ConnectCallOptions {
  assertOptionsObject(
    callOptions,
    `${caller}'s callOptions`,
    'Pass an object with signal, timeoutMs, headers, or contextValues, or omit it.'
  )
  const options = (callOptions ?? {}) as ConnectCallOptions
  const { timeoutMs } = options
  if (
    timeoutMs !== undefined &&
    (typeof timeoutMs !== 'number' || Number.isNaN(timeoutMs))
  ) {
    throw new ConnectAdapterError(
      `${caller} was given ${typeof timeoutMs === 'number' ? 'NaN' : typeof timeoutMs} as callOptions.timeoutMs. Pass a number of milliseconds, or omit it for no deadline.`
    )
  }
  return options
}

/** The failure a cancellation settles with. */
export function canceledError(message: string, cause?: unknown): ConnectError {
  return new ConnectError(message, Code.Canceled, undefined, undefined, cause)
}

/** The failure a deadline the adapter enforces settles with. */
export function deadlineError(timeoutMs: number): ConnectError {
  return new ConnectError(
    `the call did not complete within its ${timeoutMs} ms deadline`,
    Code.DeadlineExceeded
  )
}

/** One source of cancellation, and the failure it stops a call with. */
export interface SignalLink {
  readonly signal: AbortSignal | undefined
  readonly failure: (reason: unknown) => unknown
}

/** A signal that aborts when any linked one does. */
export interface LinkedSignal {
  readonly signal: AbortSignal
  /** Detaches from every source, so none keeps this call reachable. */
  release(): void
}

/**
 * Links cancellation sources into one signal, whose reason is the failure the
 * first source to abort maps to. Hand-rolled rather than `AbortSignal.any`,
 * which not every supported runtime has.
 */
export function linkSignals(links: readonly SignalLink[]): LinkedSignal {
  const controller = new AbortController()
  const detach: (() => void)[] = []
  const release = (): void => {
    for (const remove of detach.splice(0)) {
      remove()
    }
  }
  for (const { signal, failure } of links) {
    if (signal === undefined) {
      continue
    }
    if (signal.aborted) {
      controller.abort(failure(signal.reason))
      release()
      break
    }
    const onAbort = (): void => {
      release()
      controller.abort(failure(signal.reason))
    }
    signal.addEventListener('abort', onAbort, { once: true })
    detach.push(() => signal.removeEventListener('abort', onAbort))
  }
  return { signal: controller.signal, release }
}

/**
 * A timer that aborts with `deadline_exceeded`, or nothing without a deadline.
 * A deadline of zero or less has already passed, as it has for Connect.
 */
export function startDeadline(
  timeoutMs: number | undefined
): { readonly signal: AbortSignal; clear(): void } | undefined {
  if (timeoutMs === undefined || timeoutMs === Infinity) {
    return undefined
  }
  const controller = new AbortController()
  if (timeoutMs <= 0) {
    controller.abort(deadlineError(timeoutMs))
    return { signal: controller.signal, clear: () => undefined }
  }
  const timer = setTimeout(
    () => controller.abort(deadlineError(timeoutMs)),
    timeoutMs
  )
  return { signal: controller.signal, clear: () => clearTimeout(timer) }
}

/**
 * Settles as `work` does, or rejects with the signal's reason the moment it
 * aborts. A transport is asked to respect its signal and nothing can make it;
 * racing the two ends the wait whatever the transport does.
 */
function raceAbort<T>(work: Promise<T>, signal: AbortSignal): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const onAbort = (): void => reject(signal.reason)
    signal.addEventListener('abort', onAbort, { once: true })
    // Both handlers attached, so a rejection that loses the race is still
    // handled rather than surfacing as an unhandled rejection.
    work.then(
      value => {
        signal.removeEventListener('abort', onAbort)
        resolve(value)
      },
      (error: unknown) => {
        signal.removeEventListener('abort', onAbort)
        reject(error)
      }
    )
  })
}

/**
 * Makes one unary call and resolves with the response message.
 *
 * Nothing is sent once the signal has aborted. Headers and context values are
 * passed as the caller gave them, `undefined` included: authentication,
 * tracing, and metadata are the transport's interceptors' to add.
 */
export async function callUnary<I extends DescMessage, O extends DescMessage>(
  transport: Transport,
  method: DescMethodUnary<I, O>,
  request: MessageInitShape<I>,
  signal: AbortSignal,
  timeoutMs: number | undefined,
  callOptions: ConnectCallOptions
): Promise<MessageShape<O>> {
  if (signal.aborted) {
    throw signal.reason
  }
  let work: ReturnType<Transport['unary']>
  try {
    work = transport.unary(
      method,
      signal,
      timeoutMs,
      callOptions.headers,
      request,
      callOptions.contextValues
    )
  } catch (error) {
    // A transport that throws instead of rejecting still fails this call only.
    work = Promise.reject(error)
  }
  const response = await raceAbort(Promise.resolve(work), signal)
  return response.message as MessageShape<O>
}

/**
 * The delay before retry number `retryNumber` (1 for the first retry): full
 * jitter over `[0, min(2000, 100 * 2^(n-1)))` milliseconds, so clients that
 * failed together do not come back together.
 */
export function retryDelay(
  retryNumber: number,
  random: () => number = Math.random
): number {
  const cap = Math.min(
    RETRY_MAX_DELAY_MS,
    RETRY_BASE_DELAY_MS * 2 ** (retryNumber - 1)
  )
  return random() * cap
}

/** Waits `milliseconds`, or rejects with the signal's reason if it aborts. */
export function sleep(milliseconds: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(signal.reason)
      return
    }
    const onAbort = (): void => {
      clearTimeout(timer)
      reject(signal.reason)
    }
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', onAbort)
      resolve()
    }, milliseconds)
    signal.addEventListener('abort', onAbort, { once: true })
  })
}
