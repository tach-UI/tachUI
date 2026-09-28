/**
 * Test support for the adapters: a scriptable transport that records every
 * unary call it receives, and a way to mount an adapter in a component scope
 * that provides a client and transports.
 *
 * Importing it also keeps the importing suite off the network (see
 * `offline.ts`).
 */

import './offline'

import { create } from '@bufbuild/protobuf'
import type {
  DescMessage,
  DescMethod,
  DescMethodServerStreaming,
  DescMethodStreaming,
  DescMethodUnary,
  MessageInitShape,
} from '@bufbuild/protobuf'
import type {
  ContextValues,
  StreamResponse,
  Transport,
} from '@connectrpc/connect'
import {
  createComponentContext,
  createRoot,
  runWithComponentContext,
} from '@tachui/core'
import type { ComponentContext } from '@tachui/core'
import { createQueryClient, provideQueryClient } from '@tachui/query'
import type { QueryClient } from '@tachui/query'

import { provideConnectTransport } from '../../src/transport'
import { GetUser, ListUsers, WatchUsers } from '../fixtures/schema'

/** The fixture methods, typed as the descriptors generated code carries. */
export const getUser = GetUser as DescMethodUnary<DescMessage, DescMessage>
export const listUsers = ListUsers as DescMethodUnary<DescMessage, DescMessage>
export const watchUsers = WatchUsers as DescMethodServerStreaming<
  DescMessage,
  DescMessage
>

/** A field of a response message, read without its generated type. */
export function fieldOf(message: unknown, field: string): unknown {
  return (message as Record<string, unknown> | undefined)?.[field]
}

/** One call a {@link ScriptedTransport} received, and the means to settle it. */
export interface RecordedCall {
  readonly method: DescMethod
  readonly signal: AbortSignal | undefined
  readonly timeoutMs: number | undefined
  readonly header: HeadersInit | undefined
  readonly input: MessageInitShape<DescMessage>
  readonly contextValues: ContextValues | undefined
  respond(init?: Record<string, unknown>): void
  fail(error: unknown): void
}

export interface ScriptedTransport {
  readonly transport: Transport
  readonly calls: RecordedCall[]
}

/**
 * A transport whose calls stay pending until the test settles them, unless
 * `answer` settles each as it arrives. It ignores its signal and deadline, as
 * a transport is free to: the adapter has to settle promptly regardless.
 */
export function scriptedTransport(
  answer?: (call: RecordedCall) => void
): ScriptedTransport {
  const calls: RecordedCall[] = []
  const transport: Transport = {
    unary: (method, signal, timeoutMs, header, input, contextValues) =>
      new Promise((resolve, reject) => {
        const call: RecordedCall = {
          method,
          signal,
          timeoutMs,
          header,
          input: input as MessageInitShape<DescMessage>,
          contextValues,
          respond: init =>
            resolve({
              stream: false,
              service: method.parent,
              method,
              header: new Headers(),
              trailer: new Headers(),
              message: create(method.output, init as never),
            }),
          fail: reject,
        }
        calls.push(call)
        answer?.(call)
      }),
    stream: () => Promise.reject(new Error('not used by these tests')),
  }
  return { transport, calls }
}

/**
 * One server-streaming call a {@link streamingTransport} received, and the
 * means to drive it: open it, fail it, and send, finish, or break its
 * messages one at a time.
 */
export interface RecordedStream {
  readonly method: DescMethod
  readonly signal: AbortSignal | undefined
  readonly timeoutMs: number | undefined
  readonly header: HeadersInit | undefined
  readonly contextValues: ContextValues | undefined
  /** The request messages the call sent, read once the input is drained. */
  readonly requests: MessageInitShape<DescMessage>[]
  /** Resolves the call, so its response messages can be iterated. */
  open(): void
  /** Rejects the call before it opens. */
  fail(error: unknown): void
  send(init?: Record<string, unknown>): void
  finish(): void
  /** Breaks the message stream with `error`, as a failure mid-stream does. */
  break(error: unknown): void
  /** How many times the consumer asked for another message. */
  nexts(): number
  /** How many times the consumer released the response messages. */
  returned(): number
}

export interface StreamingTransport {
  readonly transport: Transport
  readonly streams: RecordedStream[]
  /** Unary calls, which these tests never expect. */
  readonly unaryCalls: number
}

/**
 * A transport whose server-streaming calls stay pending until the test drives
 * them, unless `answer` does as each arrives. Like {@link scriptedTransport} it
 * ignores its signal and deadline: the adapter has to end promptly regardless.
 */
export function streamingTransport(
  answer?: (stream: RecordedStream) => void
): StreamingTransport {
  const streams: RecordedStream[] = []
  let unaryCalls = 0
  const transport: Transport = {
    unary: () => {
      unaryCalls += 1
      return Promise.reject(new Error('not used by these tests'))
    },
    stream: (method, signal, timeoutMs, header, input, contextValues) =>
      new Promise((resolve, reject) => {
        const buffered: IteratorResult<unknown>[] = []
        let failure: { error: unknown } | undefined
        let waiting:
          | { resolve: (step: IteratorResult<unknown>) => void; reject: (error: unknown) => void }
          | undefined
        let nexts = 0
        let returned = 0
        function deliver(step: IteratorResult<unknown>): void {
          if (waiting === undefined) {
            buffered.push(step)
            return
          }
          const current = waiting
          waiting = undefined
          current.resolve(step)
        }
        const requests: MessageInitShape<DescMessage>[] = []
        void (async () => {
          for await (const request of input) {
            requests.push(request as MessageInitShape<DescMessage>)
          }
        })()
        const messages: AsyncIterable<unknown> = {
          [Symbol.asyncIterator]: () => ({
            next: () => {
              nexts += 1
              const step = buffered.shift()
              if (step !== undefined) {
                return Promise.resolve(step)
              }
              if (failure !== undefined) {
                return Promise.reject(failure.error)
              }
              return new Promise((resolveNext, rejectNext) => {
                waiting = { resolve: resolveNext, reject: rejectNext }
              })
            },
            return: () => {
              returned += 1
              return Promise.resolve({ value: undefined, done: true })
            },
          }),
        }
        const stream: RecordedStream = {
          method,
          signal,
          timeoutMs,
          header,
          contextValues,
          requests,
          open: () =>
            resolve({
              stream: true,
              service: method.parent,
              method: method as DescMethodStreaming,
              header: new Headers(),
              trailer: new Headers(),
              message: messages,
            } as StreamResponse),
          fail: reject,
          send: init =>
            deliver({ value: create(method.output, init as never), done: false }),
          finish: () => deliver({ value: undefined, done: true }),
          break: error => {
            if (waiting === undefined) {
              failure = { error }
              return
            }
            const current = waiting
            waiting = undefined
            current.reject(error)
          },
          nexts: () => nexts,
          returned: () => returned,
        }
        streams.push(stream)
        answer?.(stream)
      }) as never,
  }
  return {
    transport,
    streams,
    get unaryCalls() {
      return unaryCalls
    },
  }
}

export interface Scope {
  readonly context: ComponentContext
  readonly client: QueryClient
  /** Runs `body` in this scope under a fresh owner, handing back its dispose. */
  mount<T>(body: () => T): { value: T; dispose: () => void }
}

const clients: QueryClient[] = []

/** Disposes every client a scope created. Call from `afterEach`. */
export function disposeScopes(): void {
  for (const client of clients.splice(0)) {
    client.dispose()
  }
}

/**
 * A root scope that provides a client and the given transports, each under its
 * name (`'default'` provides the default transport).
 */
export function scope(
  transports: Record<string, Transport>,
  client: QueryClient = createQueryClient()
): Scope {
  clients.push(client)
  const context = createComponentContext('root')
  runWithComponentContext(context, () => {
    provideQueryClient(client)
    for (const [name, transport] of Object.entries(transports)) {
      provideConnectTransport(transport, { name })
    }
  })
  return {
    context,
    client,
    mount<T>(body: () => T) {
      let value!: T
      let dispose!: () => void
      runWithComponentContext(context, () =>
        createRoot(disposeRoot => {
          dispose = disposeRoot
          value = body()
        })
      )
      return { value, dispose }
    },
  }
}

/**
 * Lets pending promise chains and effects run. A macrotask turn drains the
 * microtask queue behind it, which a fixed number of ticks does not.
 */
export async function settle(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 0))
}
