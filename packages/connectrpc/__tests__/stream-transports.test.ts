/**
 * The stream adapters over real Connect transports, with no network.
 *
 * Connect's in-memory router carries the RPC behaviour: messages, an empty
 * stream, failures before and after the first message, metadata from the
 * application's interceptor and call options, and cancellation reaching the
 * handler. The Connect protocol over an HTTP client the test controls carries
 * incremental delivery: a browser transport decodes each enveloped message as
 * its bytes arrive, and the adapter must hand each one on before the response
 * ends. Neither can say anything about a proxy that buffers.
 */

import {
  Code,
  ConnectError,
  createContextKey,
  createContextValues,
  createRouterTransport,
} from '@connectrpc/connect'
import type { HandlerContext, Interceptor } from '@connectrpc/connect'
import { encodeEnvelope } from '@connectrpc/connect/protocol'
import type { UniversalClientFn } from '@connectrpc/connect/protocol'
import { createTransport } from '@connectrpc/connect/protocol-connect'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { createConnectStream, createConnectStreamList } from '../src/stream'
import { UserService } from './fixtures/schema'
import {
  disposeScopes,
  fieldOf,
  scope,
  settle,
  watchUsers,
} from './support/harness'

afterEach(() => {
  disposeScopes()
})

function nameOf(message: unknown): unknown {
  return fieldOf(message, 'name')
}

const tenantKey = createContextKey('none', { description: 'tenant' })

type WatchHandler = (
  request: { pageSize: number },
  context: HandlerContext
) => AsyncIterable<{ name: string }>

/** A router serving `WatchUsers` with `watch`, behind `interceptors`. */
function routerTransport(watch: WatchHandler, interceptors: Interceptor[] = []) {
  return createRouterTransport(
    ({ service }) => {
      service(UserService, {
        getUser: () => ({}),
        listUsers: () => ({}),
        watchUsers: watch,
      } as never)
    },
    { transport: { interceptors } }
  )
}

describe('through a router transport', () => {
  it('delivers every message in order and completes', async () => {
    const root = scope({
      default: routerTransport(async function* (request) {
        for (let index = 1; index <= request.pageSize; index += 1) {
          yield { name: `user-${index}` }
        }
      }),
    })

    const { value: list } = root.mount(() =>
      createConnectStreamList(watchUsers, () => ({ pageSize: 3 }), {
        itemKey: message => String(nameOf(message)),
      })
    )
    await vi.waitFor(() => expect(list.status()).toBe('completed'))

    expect(list.ids()).toEqual(['user-1', 'user-2', 'user-3'])
    expect(nameOf(list.latest())).toBe('user-3')
    expect(list.error()).toBeUndefined()
  })

  it('completes a stream that sends nothing', async () => {
    const root = scope({
      default: routerTransport(async function* () {
        // No messages.
      }),
    })

    const { value: stream } = root.mount(() =>
      createConnectStream(watchUsers, () => ({}))
    )
    await vi.waitFor(() => expect(stream.status()).toBe('completed'))

    expect(stream.latest()).toBeUndefined()
  })

  it('reports a failure after the first message as a ConnectError with its code', async () => {
    const root = scope({
      default: routerTransport(async function* () {
        yield { name: 'first' }
        throw new ConnectError('slow down', Code.ResourceExhausted)
      }),
    })

    const { value: stream } = root.mount(() =>
      createConnectStream(watchUsers, () => ({}), {
        initial: () => 0,
        reduce: (count: number) => count + 1,
      })
    )
    await vi.waitFor(() => expect(stream.status()).toBe('error'))

    const error = stream.error()
    expect(error).toBeInstanceOf(ConnectError)
    expect((error as ConnectError).code).toBe(Code.ResourceExhausted)
    expect((error as ConnectError).rawMessage).toBe('slow down')
    expect(stream.value()).toBe(1)
    expect(nameOf(stream.latest())).toBe('first')
  })

  it('reports a failure before any message as a ConnectError with its code', async () => {
    const root = scope({
      default: routerTransport(async function* () {
        yield* []
        throw new ConnectError('not yours', Code.PermissionDenied)
      }),
    })

    const { value: stream } = root.mount(() =>
      createConnectStream(watchUsers, () => ({}))
    )
    await vi.waitFor(() => expect(stream.status()).toBe('error'))

    expect(stream.error()).toBeInstanceOf(ConnectError)
    expect((stream.error() as ConnectError).code).toBe(Code.PermissionDenied)
  })

  it("carries the interceptor's metadata and the call options to the handler", async () => {
    // Context values are the client's, for its interceptors to read.
    const authenticate: Interceptor = next => request => {
      request.header.set('authorization', 'Bearer token')
      request.header.set('x-context', request.contextValues.get(tenantKey))
      return next(request)
    }
    const root = scope({
      default: routerTransport(async function* (_request, context) {
        yield { name: context.requestHeader.get('authorization') ?? 'none' }
        yield { name: context.requestHeader.get('x-tenant') ?? 'none' }
        yield { name: context.requestHeader.get('x-context') ?? 'none' }
      }, [authenticate]),
    })

    const { value: list } = root.mount(() =>
      createConnectStreamList(watchUsers, () => ({}), {
        itemKey: message => String(nameOf(message)),
        callOptions: {
          headers: { 'x-tenant': 'acme' },
          contextValues: createContextValues().set(tenantKey, 'from-context'),
        },
      })
    )
    await vi.waitFor(() => expect(list.status()).toBe('completed'))

    expect(list.ids()).toEqual(['Bearer token', 'acme', 'from-context'])
  })

  it("aborts the handler's call on cancel", async () => {
    let handlerSignal: AbortSignal | undefined
    const root = scope({
      default: routerTransport(async function* (_request, context) {
        handlerSignal = context.signal
        yield { name: 'first' }
        await new Promise(resolve =>
          context.signal.addEventListener('abort', resolve, { once: true })
        )
      }),
    })

    const { value: stream } = root.mount(() =>
      createConnectStream(watchUsers, () => ({}))
    )
    await vi.waitFor(() => expect(nameOf(stream.latest())).toBe('first'))

    stream.cancel()

    expect(stream.status()).toBe('cancelled')
    await vi.waitFor(() => expect(handlerSignal?.aborted).toBe(true))
    await settle()
    expect(stream.status()).toBe('cancelled')
    expect(stream.error()).toBeUndefined()
  })

  it('reports a deadline as deadline_exceeded', async () => {
    const root = scope({
      default: routerTransport(async function* (_request, context) {
        yield { name: 'first' }
        await new Promise(resolve =>
          context.signal.addEventListener('abort', resolve, { once: true })
        )
      }),
    })

    const { value: stream } = root.mount(() =>
      createConnectStream(watchUsers, () => ({}), {
        callOptions: { timeoutMs: 10 },
      })
    )
    await vi.waitFor(() => expect(stream.status()).toBe('error'))

    expect(stream.error()).toBeInstanceOf(ConnectError)
    expect((stream.error() as ConnectError).code).toBe(Code.DeadlineExceeded)
  })
})

/**
 * An HTTP client whose one response body the test writes chunk by chunk, as a
 * streaming-capable network path delivers it. It sits where
 * `createFetchClient` puts `fetch`, so the Connect protocol above it — headers,
 * envelopes, the end-of-stream message — is the real one.
 */
function controlledHttpClient() {
  const encoder = new TextEncoder()
  const chunks: Uint8Array[] = []
  let closed = false
  let wake: (() => void) | undefined
  let signal: AbortSignal | undefined
  let calls = 0
  function push(chunk?: Uint8Array): void {
    if (chunk === undefined) {
      closed = true
    } else {
      chunks.push(chunk)
    }
    const resume = wake
    wake = undefined
    resume?.()
  }
  async function* body(): AsyncGenerator<Uint8Array> {
    for (;;) {
      const chunk = chunks.shift()
      if (chunk !== undefined) {
        yield chunk
        continue
      }
      if (closed) {
        return
      }
      await new Promise<void>(resolve => {
        wake = resolve
      })
    }
  }
  const httpClient: UniversalClientFn = request => {
    calls += 1
    signal = request.signal
    return Promise.resolve({
      status: 200,
      header: new Headers({ 'content-type': 'application/connect+json' }),
      body: body(),
      trailer: new Headers(),
    })
  }
  return {
    transport: createTransport({
      httpClient,
      baseUrl: 'https://api.example.test',
      useBinaryFormat: false,
      interceptors: [],
      acceptCompression: [],
      sendCompression: null,
      compressMinBytes: 1024,
      readMaxBytes: 0xffffffff,
      writeMaxBytes: 0xffffffff,
    }),
    /** Writes one enveloped message to the response body. */
    send(message: Record<string, unknown>): void {
      push(encodeEnvelope(0, encoder.encode(JSON.stringify(message))))
    },
    /** Writes the end-of-stream envelope and closes the body. */
    end(): void {
      push(encodeEnvelope(0b10, encoder.encode('{}')))
      push()
    },
    signal: () => signal,
    calls: () => calls,
  }
}

describe('through the Connect protocol over a streaming HTTP client', () => {
  it('hands on each message as it arrives, before the response ends', async () => {
    const network = controlledHttpClient()
    const root = scope({ default: network.transport })

    const { value: list } = root.mount(() =>
      createConnectStreamList(watchUsers, () => ({}), {
        itemKey: message => String(nameOf(message)),
      })
    )
    await vi.waitFor(() => expect(list.status()).toBe('open'))
    expect(network.calls()).toBe(1)

    network.send({ name: 'a' })
    await vi.waitFor(() => expect(list.ids()).toEqual(['a']))
    expect(list.status()).toBe('open')

    network.send({ name: 'b' })
    await vi.waitFor(() => expect(list.ids()).toEqual(['a', 'b']))
    expect(list.status()).toBe('open')

    network.end()
    await vi.waitFor(() => expect(list.status()).toBe('completed'))
  })

  it('aborts the HTTP request on cancel', async () => {
    const network = controlledHttpClient()
    const root = scope({ default: network.transport })

    const { value: stream } = root.mount(() =>
      createConnectStream(watchUsers, () => ({}))
    )
    await vi.waitFor(() => expect(stream.status()).toBe('open'))
    network.send({ name: 'a' })
    await vi.waitFor(() => expect(nameOf(stream.latest())).toBe('a'))

    stream.cancel()

    expect(stream.status()).toBe('cancelled')
    await vi.waitFor(() => expect(network.signal()?.aborted).toBe(true))
  })
})
