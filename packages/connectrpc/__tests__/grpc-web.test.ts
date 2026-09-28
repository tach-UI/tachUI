/**
 * The adapters over `@connectrpc/connect-web`'s `createGrpcWebTransport`, the
 * browser transport an application reaching a gRPC-Web proxy constructs, with
 * a `fetch` the test controls in place of the network.
 *
 * Each response is written as gRPC-Web frames: enveloped Protobuf messages,
 * then a trailer frame carrying the status. The stream's body is written a
 * frame at a time, so the adapter is seen to hand on each message as the
 * transport decodes it, before the response ends. None of this says anything
 * about whether a real proxy flushes those frames promptly.
 */

import { create, fromBinary, toBinary } from '@bufbuild/protobuf'
import { Code, ConnectError } from '@connectrpc/connect'
import { encodeEnvelope } from '@connectrpc/connect/protocol'
import { trailerFlag, trailerSerialize } from '@connectrpc/connect/protocol-grpc-web'
import { createGrpcWebTransport } from '@connectrpc/connect-web'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { createConnectMutation } from '../src/mutation'
import { createConnectQuery } from '../src/query'
import { createConnectStream, createConnectStreamList } from '../src/stream'
import {
  GetUserRequestSchema,
  UserSchema,
  UserService,
} from './fixtures/generated'
import { disposeScopes, scope } from './support/harness'

const { getUser, updateUser, watchUsers } = UserService.method

const BASE_URL = 'https://proxy.example.test'

afterEach(() => {
  disposeScopes()
})

/** gRPC's status for success, which Connect's `Code` has no member for. */
const OK = 0

function messageFrame(name: string): Uint8Array {
  return encodeEnvelope(0, toBinary(UserSchema, create(UserSchema, { name })))
}

function trailerFrame(code: Code | typeof OK, message?: string): Uint8Array {
  const trailer = new Headers({ 'grpc-status': String(code) })
  if (message !== undefined) {
    trailer.set('grpc-message', encodeURIComponent(message))
  }
  return encodeEnvelope(trailerFlag, trailerSerialize(trailer))
}

/** The frames as one response body. */
function concat(frames: Uint8Array[]): Uint8Array<ArrayBuffer> {
  const joined = new Uint8Array(frames.reduce((total, frame) => total + frame.length, 0))
  let offset = 0
  for (const frame of frames) {
    joined.set(frame, offset)
    offset += frame.length
  }
  return joined
}

const RESPONSE_HEADERS = { 'content-type': 'application/grpc-web+proto' }

/** A request the controlled `fetch` received. */
interface FetchedRequest {
  readonly url: string
  readonly headers: Headers
  readonly body: Uint8Array
  readonly signal: AbortSignal | undefined
}

/**
 * A `fetch` answering every request with `respond`'s response, recording what
 * it was asked. It is handed to the transport, never installed globally.
 */
function controlledFetch(respond: (request: FetchedRequest) => Response) {
  const requests: FetchedRequest[] = []
  const fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const request: FetchedRequest = {
      url: String(input),
      headers: new Headers(init?.headers),
      body: new Uint8Array(await new Response(init?.body).arrayBuffer()),
      signal: init?.signal ?? undefined,
    }
    requests.push(request)
    return respond(request)
  })
  return {
    transport: createGrpcWebTransport({ baseUrl: BASE_URL, fetch: fetch as typeof globalThis.fetch }),
    requests,
  }
}

/** The request message inside a gRPC-Web request body. */
function requestMessage(body: Uint8Array) {
  // A five-byte envelope header: one flag byte, then a big-endian length.
  return fromBinary(GetUserRequestSchema, body.subarray(5))
}

describe('unary calls', () => {
  it('decodes a successful response for a query', async () => {
    const network = controlledFetch(
      () =>
        new Response(concat([messageFrame('Ada'), trailerFrame(OK)]), {
          status: 200,
          headers: RESPONSE_HEADERS,
        })
    )
    const root = scope({ default: network.transport })

    const { value: query } = root.mount(() =>
      createConnectQuery(getUser, () => ({ id: 7n }))
    )
    await vi.waitFor(() => expect(query.status()).toBe('success'))

    expect(query.data()?.name).toBe('Ada')
    const [request] = network.requests
    expect(request.url).toBe(`${BASE_URL}/acme.users.v1.UserService/GetUser`)
    expect(request.headers.get('content-type')).toBe('application/grpc-web+proto')
    expect(requestMessage(request.body).id).toBe(7n)
  })

  it('decodes a successful response for a mutation', async () => {
    const network = controlledFetch(
      () =>
        new Response(concat([messageFrame('Hedy'), trailerFrame(OK)]), {
          status: 200,
          headers: RESPONSE_HEADERS,
        })
    )
    const root = scope({ default: network.transport })

    const { value: mutation } = root.mount(() => createConnectMutation(updateUser))
    const written = await mutation.mutate({ id: 3n, name: 'Hedy' })

    expect(written.name).toBe('Hedy')
    expect(network.requests[0].url).toBe(`${BASE_URL}/acme.users.v1.UserService/UpdateUser`)
  })

  it.each([
    ['a trailer frame', 'frame'],
    ['a trailers-only response', 'headers'],
  ])('surfaces an error status in %s as a ConnectError with its code', async (_name, form) => {
    const network = controlledFetch(() =>
      form === 'frame'
        ? new Response(concat([trailerFrame(Code.NotFound, 'no such user')]), {
            status: 200,
            headers: RESPONSE_HEADERS,
          })
        : new Response(null, {
            status: 200,
            headers: {
              ...RESPONSE_HEADERS,
              'grpc-status': String(Code.NotFound),
              'grpc-message': 'no such user',
            },
          })
    )
    const root = scope({ default: network.transport })

    const { value: query } = root.mount(() =>
      createConnectQuery(getUser, () => ({ id: 404n }))
    )
    const { value: mutation } = root.mount(() => createConnectMutation(updateUser))
    await vi.waitFor(() => expect(query.status()).toBe('error'))
    const written = await mutation
      .mutate({ id: 404n, name: 'x' })
      .catch((error: unknown) => error)

    for (const failure of [query.error(), written]) {
      expect(failure).toBeInstanceOf(ConnectError)
      expect((failure as ConnectError).code).toBe(Code.NotFound)
      expect((failure as ConnectError).rawMessage).toBe('no such user')
    }
    expect(mutation.error()).toBe(written)
  })
})

/**
 * A gRPC-Web response whose body the test writes a frame at a time, as a
 * proxy that flushes each frame delivers it.
 */
function incrementalResponse() {
  let controller!: ReadableStreamDefaultController<Uint8Array>
  const body = new ReadableStream<Uint8Array>({
    start(started) {
      controller = started
    },
  })
  const network = controlledFetch(
    () => new Response(body, { status: 200, headers: RESPONSE_HEADERS })
  )
  return {
    ...network,
    send(name: string): void {
      controller.enqueue(messageFrame(name))
    },
    end(code: Code | typeof OK, message?: string): void {
      controller.enqueue(trailerFrame(code, message))
      controller.close()
    },
  }
}

describe('server streams', () => {
  it('hands on each message as its frame arrives, then completes on an OK trailer', async () => {
    const network = incrementalResponse()
    const root = scope({ default: network.transport })

    const { value: list } = root.mount(() =>
      createConnectStreamList(watchUsers, () => ({}), {
        itemKey: message => message.name,
      })
    )
    await vi.waitFor(() => expect(list.status()).toBe('open'))
    expect(network.requests[0].url).toBe(
      `${BASE_URL}/acme.users.v1.UserService/WatchUsers`
    )

    network.send('ada')
    await vi.waitFor(() => expect(list.ids()).toEqual(['ada']))
    expect(list.status()).toBe('open')

    network.send('grace')
    await vi.waitFor(() => expect(list.ids()).toEqual(['ada', 'grace']))
    expect(list.status()).toBe('open')

    network.end(OK)
    await vi.waitFor(() => expect(list.status()).toBe('completed'))
    expect(list.error()).toBeUndefined()
  })

  it('reports an error trailer after a message as a failure with its code', async () => {
    const network = incrementalResponse()
    const root = scope({ default: network.transport })

    const { value: stream } = root.mount(() =>
      createConnectStream(watchUsers, () => ({}))
    )
    network.send('ada')
    await vi.waitFor(() => expect(stream.latest()?.name).toBe('ada'))

    network.end(Code.ResourceExhausted, 'slow down')
    await vi.waitFor(() => expect(stream.status()).toBe('error'))

    expect(stream.error()).toBeInstanceOf(ConnectError)
    expect((stream.error() as ConnectError).code).toBe(Code.ResourceExhausted)
    expect((stream.error() as ConnectError).rawMessage).toBe('slow down')
    expect(stream.latest()?.name).toBe('ada')
  })

  it('aborts the fetch on cancel', async () => {
    const network = incrementalResponse()
    const root = scope({ default: network.transport })

    const { value: stream } = root.mount(() =>
      createConnectStream(watchUsers, () => ({}))
    )
    network.send('ada')
    await vi.waitFor(() => expect(stream.latest()?.name).toBe('ada'))

    stream.cancel()

    expect(stream.status()).toBe('cancelled')
    await vi.waitFor(() => expect(network.requests[0].signal?.aborted).toBe(true))
  })
})
