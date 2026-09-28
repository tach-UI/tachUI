/**
 * The stream adapters over real Connect transports, with no network.
 *
 * Connect's in-memory router carries the RPC behaviour: ordered messages, an
 * empty stream, failures before and after the first message, metadata from
 * the application's interceptor and call options, every way a call is ended
 * early, and what a call that was ended or replaced can no longer change. The
 * Connect protocol over an HTTP client the test controls carries incremental
 * delivery: a browser transport decodes each enveloped message as its bytes
 * arrive, and the adapter must hand each one on before the response ends.
 * Neither can say anything about a proxy that buffers; `grpc-web.test.ts`
 * covers the gRPC-Web browser transport the same way.
 */

import {
  Code,
  ConnectError,
  createContextKey,
  createContextValues,
} from '@connectrpc/connect'
import type { HandlerContext, Interceptor } from '@connectrpc/connect'
import { encodeEnvelope } from '@connectrpc/connect/protocol'
import type { UniversalClientFn } from '@connectrpc/connect/protocol'
import { createTransport } from '@connectrpc/connect/protocol-connect'
import { createSignal } from '@tachui/core'
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vitest'

import { createConnectStream, createConnectStreamList } from '../src/stream'
import { UserService } from './fixtures/generated'
import type { ListUsersRequest, User } from './fixtures/generated'
import { disposeScopes, fieldOf, scope, settle } from './support/harness'
import { aborted, hold, userRouter } from './support/router'

const { watchUsers } = UserService.method

afterEach(() => {
  disposeScopes()
})

function nameOf(message: unknown): unknown {
  return fieldOf(message, 'name')
}

const tenantKey = createContextKey('none', { description: 'tenant' })

type WatchHandler = (
  request: ListUsersRequest,
  context: HandlerContext
) => AsyncIterable<{ name: string }>

/** A router serving `WatchUsers` with `watch`, behind `interceptors`. */
function watchRouter(watch: WatchHandler, interceptors: Interceptor[] = []) {
  return userRouter({ handlers: { watchUsers: watch }, interceptors })
}

describe('through a router transport', () => {
  it('delivers every message in order and completes', async () => {
    const root = scope({
      default: watchRouter(async function* (request) {
        for (let index = 1; index <= request.pageSize; index += 1) {
          yield { name: `user-${index}` }
        }
      }).transport,
    })

    const { value: list } = root.mount(() =>
      createConnectStreamList(watchUsers, () => ({ pageSize: 3 }), {
        itemKey: message => message.name,
      })
    )
    await vi.waitFor(() => expect(list.status()).toBe('completed'))

    expect(list.ids()).toEqual(['user-1', 'user-2', 'user-3'])
    expect(list.latest()?.name).toBe('user-3')
    expect(list.error()).toBeUndefined()
  })

  it('updates the latest message and the reduced state with each message, in order', async () => {
    const gates = [hold(), hold()]
    const root = scope({
      default: watchRouter(async function* () {
        yield { name: 'a' }
        await gates[0].promise
        yield { name: 'b' }
        await gates[1].promise
        yield { name: 'c' }
      }).transport,
    })

    const { value: stream } = root.mount(() =>
      createConnectStream(watchUsers, () => ({}), {
        initial: () => [] as string[],
        reduce: (names: string[], message) => [...names, message.name],
      })
    )
    expectTypeOf(stream.latest).returns.toEqualTypeOf<User | undefined>()

    await vi.waitFor(() => expect(stream.value()).toEqual(['a']))
    expect(stream.latest()?.name).toBe('a')
    expect(stream.status()).toBe('open')
    gates[0].release()
    await vi.waitFor(() => expect(stream.value()).toEqual(['a', 'b']))
    expect(stream.latest()?.name).toBe('b')
    gates[1].release()
    await vi.waitFor(() => expect(stream.status()).toBe('completed'))
    expect(stream.value()).toEqual(['a', 'b', 'c'])
    expect(stream.latest()?.name).toBe('c')
  })

  it('completes a stream that sends nothing', async () => {
    const root = scope({
      default: watchRouter(async function* () {
        // No messages.
      }).transport,
    })

    const { value: stream } = root.mount(() =>
      createConnectStream(watchUsers, () => ({}))
    )
    await vi.waitFor(() => expect(stream.status()).toBe('completed'))

    expect(stream.latest()).toBeUndefined()
  })

  it('reports a failure after the first message as the ConnectError the stream ended with', async () => {
    const server = watchRouter(async function* () {
      yield { name: 'first' }
      throw new ConnectError('slow down', Code.ResourceExhausted)
    })
    const root = scope({ default: server.transport })

    const { value: stream } = root.mount(() =>
      createConnectStream(watchUsers, () => ({}), {
        initial: () => 0,
        reduce: (count: number) => count + 1,
      })
    )
    await vi.waitFor(() => expect(stream.status()).toBe('error'))

    const error = stream.error()
    expect(server.failures).toHaveLength(1)
    expect(error).toBe(server.failures[0])
    expect((error as ConnectError).code).toBe(Code.ResourceExhausted)
    expect((error as ConnectError).rawMessage).toBe('slow down')
    expect(stream.value()).toBe(1)
    expect(nameOf(stream.latest())).toBe('first')
  })

  it('reports a failure before any message as the ConnectError the call failed with', async () => {
    const server = watchRouter(async function* () {
      yield* []
      throw new ConnectError('not yours', Code.PermissionDenied)
    })
    const root = scope({ default: server.transport })

    const { value: stream } = root.mount(() =>
      createConnectStream(watchUsers, () => ({}))
    )
    await vi.waitFor(() => expect(stream.status()).toBe('error'))

    expect(stream.error()).toBe(server.failures[0])
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
      default: watchRouter(async function* (_request, context) {
        yield { name: context.requestHeader.get('authorization') ?? 'none' }
        yield { name: context.requestHeader.get('x-tenant') ?? 'none' }
        yield { name: context.requestHeader.get('x-context') ?? 'none' }
      }, [authenticate]).transport,
    })

    const { value: list } = root.mount(() =>
      createConnectStreamList(watchUsers, () => ({}), {
        itemKey: message => message.name,
        callOptions: {
          headers: { 'x-tenant': 'acme' },
          contextValues: createContextValues().set(tenantKey, 'from-context'),
        },
      })
    )
    await vi.waitFor(() => expect(list.status()).toBe('completed'))

    expect(list.ids()).toEqual(['Bearer token', 'acme', 'from-context'])
  })

  it('reports a deadline as an error with deadline_exceeded', async () => {
    const root = scope({
      default: watchRouter(async function* (_request, context) {
        yield { name: 'first' }
        await aborted(context.signal)
      }).transport,
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

describe('ending a call early, through a router transport', () => {
  /**
   * A handler that stays opening, before its first message, or pending on its
   * second, until the call is aborted; it records its signal and never sends
   * anything after the abort unless `late` lets it.
   */
  function stalledRouter(stage: 'opening' | 'pending next', late = hold()) {
    const signals: AbortSignal[] = []
    const server = watchRouter(async function* (_request, context) {
      signals.push(context.signal)
      if (stage === 'pending next') {
        yield { name: 'first' }
      }
      await aborted(context.signal)
      await late.promise
      yield { name: 'late' }
      throw new ConnectError('late failure', Code.Internal)
    })
    return { server, signals, late }
  }

  async function reach(
    stage: 'opening' | 'pending next',
    stream: { status: () => string; latest: () => unknown },
    signals: AbortSignal[]
  ): Promise<void> {
    await vi.waitFor(() => expect(signals).toHaveLength(1))
    if (stage === 'pending next') {
      await vi.waitFor(() => expect(nameOf(stream.latest())).toBe('first'))
      expect(stream.status()).toBe('open')
    } else {
      expect(stream.status()).toBe('connecting')
    }
  }

  describe.each(['opening', 'pending next'] as const)('while %s', stage => {
    it('reports an explicit cancel as cancelled, aborts the handler, and ignores what comes later', async () => {
      const { server, signals, late } = stalledRouter(stage)
      const root = scope({ default: server.transport })
      const { value: stream } = root.mount(() =>
        createConnectStream(watchUsers, () => ({}))
      )
      await reach(stage, stream, signals)

      stream.cancel()

      expect(stream.status()).toBe('cancelled')
      await vi.waitFor(() => expect(signals[0].aborted).toBe(true))
      late.release()
      await settle()
      await settle()
      expect(stream.status()).toBe('cancelled')
      expect(stream.error()).toBeUndefined()
      expect(nameOf(stream.latest())).toBe(stage === 'opening' ? undefined : 'first')
    })

    it('reports an explicit dispose as cancelled, aborts the handler, and ignores what comes later', async () => {
      const { server, signals, late } = stalledRouter(stage)
      const root = scope({ default: server.transport })
      const { value: stream } = root.mount(() =>
        createConnectStream(watchUsers, () => ({}))
      )
      await reach(stage, stream, signals)

      stream.dispose()

      expect(stream.status()).toBe('cancelled')
      await vi.waitFor(() => expect(signals[0].aborted).toBe(true))
      late.release()
      await settle()
      await settle()
      expect(stream.status()).toBe('cancelled')
      expect(stream.error()).toBeUndefined()
      expect(nameOf(stream.latest())).toBe(stage === 'opening' ? undefined : 'first')
    })

    it('aborts the handler on owner disposal, and nothing later changes the result', async () => {
      const { server, signals, late } = stalledRouter(stage)
      const root = scope({ default: server.transport })
      const { value: stream, dispose } = root.mount(() =>
        createConnectStream(watchUsers, () => ({}))
      )
      await reach(stage, stream, signals)
      const before = stream.status()

      dispose()

      await vi.waitFor(() => expect(signals[0].aborted).toBe(true))
      late.release()
      await settle()
      await settle()
      // Owner cleanup publishes no status: nothing is left to read one written
      // while the owner is torn down (@tachui/query's teardown contract). An
      // explicit dispose(), above, is the ending that reports `cancelled`.
      expect(stream.status()).toBe(before)
      expect(stream.error()).toBeUndefined()
      expect(nameOf(stream.latest())).toBe(stage === 'opening' ? undefined : 'first')
      await expect(stream.connect()).rejects.toThrow(/after its owner was disposed/)
    })

    it("stops the call at the application's signal, reporting an error coded canceled", async () => {
      const { server, signals, late } = stalledRouter(stage)
      const root = scope({ default: server.transport })
      const controller = new AbortController()
      const { value: stream } = root.mount(() =>
        createConnectStream(watchUsers, () => ({}), {
          callOptions: { signal: controller.signal },
        })
      )
      await reach(stage, stream, signals)

      controller.abort()

      await vi.waitFor(() => expect(signals[0].aborted).toBe(true))
      // An application abort is a failure of the call, not a local hang-up:
      // the stream adapter's contract reports it as `error` with a `canceled`
      // ConnectError, and keeps `cancelled` for cancel() and dispose().
      await vi.waitFor(() => expect(stream.status()).toBe('error'))
      const failure = stream.error()
      expect((failure as ConnectError).code).toBe(Code.Canceled)
      late.release()
      await settle()
      await settle()
      expect(stream.error()).toBe(failure)
      expect(nameOf(stream.latest())).toBe(stage === 'opening' ? undefined : 'first')
    })
  })

  it('ignores the late messages and failure of a call its request superseded', async () => {
    const late = hold()
    const server = watchRouter(async function* (request, context) {
      if (request.pageSize === 1) {
        yield { name: 'old' }
        await aborted(context.signal)
        await late.promise
        yield { name: 'old late' }
        throw new ConnectError('old failure', Code.Internal)
      }
      yield { name: 'new' }
      await aborted(context.signal)
    })
    const root = scope({ default: server.transport })
    const [pageSize, setPageSize] = createSignal(1)

    const { value: stream } = root.mount(() =>
      createConnectStream(watchUsers, () => ({ pageSize: pageSize() }))
    )
    await vi.waitFor(() => expect(stream.latest()?.name).toBe('old'))

    setPageSize(2)
    await vi.waitFor(() => expect(stream.latest()?.name).toBe('new'))
    const handled = server.handledBy('watchUsers')
    await vi.waitFor(() => expect(handled[0].signal.aborted).toBe(true))
    late.release()
    await settle()
    await settle()

    expect(stream.latest()?.name).toBe('new')
    expect(stream.status()).toBe('open')
    expect(stream.error()).toBeUndefined()
    stream.cancel()
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
        itemKey: message => message.name,
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
