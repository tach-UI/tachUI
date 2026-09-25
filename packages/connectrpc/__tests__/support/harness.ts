/**
 * Test support for the adapters: a scriptable transport that records every
 * unary call it receives, and a way to mount an adapter in a component scope
 * that provides a client and transports.
 */

import { create } from '@bufbuild/protobuf'
import type {
  DescMessage,
  DescMethod,
  DescMethodUnary,
  MessageInitShape,
} from '@bufbuild/protobuf'
import type { ContextValues, Transport } from '@connectrpc/connect'
import {
  createComponentContext,
  createRoot,
  runWithComponentContext,
} from '@tachui/core'
import type { ComponentContext } from '@tachui/core'
import { createQueryClient, provideQueryClient } from '@tachui/query'
import type { QueryClient } from '@tachui/query'

import { provideConnectTransport } from '../../src/transport'
import { GetUser, ListUsers } from '../fixtures/schema'

/** The fixture methods, typed as the unary descriptors generated code carries. */
export const getUser = GetUser as DescMethodUnary<DescMessage, DescMessage>
export const listUsers = ListUsers as DescMethodUnary<DescMessage, DescMessage>

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
