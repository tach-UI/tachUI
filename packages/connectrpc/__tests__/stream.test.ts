/**
 * `createConnectStream` and `createConnectStreamList` against a transport the
 * test drives message by message.
 *
 * The lifecycle itself is `@tachui/query`'s and is tested there. What is under
 * test here is what the adapter adds: the key and request snapshot, the
 * transport and call options, cancellation reaching the Connect call, the
 * split between a local hang-up and a failed call, and errors keeping their
 * identity.
 */

import type { DescMessage, DescMethodServerStreaming } from '@bufbuild/protobuf'
import { Code, ConnectError } from '@connectrpc/connect'
import { createContextKey, createContextValues } from '@connectrpc/connect'
import { createSignal } from '@tachui/core'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ConnectAdapterError } from '../src/errors'
import { buildConnectKey } from '../src/keys'
import { createConnectStream, createConnectStreamList } from '../src/stream'
import { GetUser, WatchUsers } from './fixtures/schema'
import {
  disposeScopes,
  fieldOf,
  scope,
  settle,
  streamingTransport,
  watchUsers,
} from './support/harness'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
  disposeScopes()
})

function nameOf(message: unknown): unknown {
  return fieldOf(message, 'name')
}

/** A descriptor of another cardinality, as reached through `any`. */
function methodOfKind(
  methodKind: string
): DescMethodServerStreaming<DescMessage, DescMessage> {
  return { ...WatchUsers, methodKind } as unknown as DescMethodServerStreaming<
    DescMessage,
    DescMessage
  >
}

describe('transport and request', () => {
  it('streams through the default transport with one snapshot of the request', async () => {
    const { transport, streams } = streamingTransport(stream => stream.open())
    const root = scope({ default: transport })
    const input = { pageSize: 5 }

    const { value: stream } = root.mount(() =>
      createConnectStream(watchUsers, () => input)
    )
    // Changing the caller's object afterwards changes nothing already sent.
    input.pageSize = 99
    await settle()

    expect(streams).toHaveLength(1)
    expect(streams[0]!.method).toBe(watchUsers)
    expect(streams[0]!.requests).toHaveLength(1)
    expect(fieldOf(streams[0]!.requests[0], 'pageSize')).toBe(5)
    expect(stream.status()).toBe('open')
  })

  it('streams through the named transport it was given', async () => {
    const fallback = streamingTransport(stream => stream.open())
    const account = streamingTransport(stream => stream.open())
    const root = scope({
      default: fallback.transport,
      account: account.transport,
    })

    root.mount(() =>
      createConnectStreamList(watchUsers, () => ({}), {
        transport: 'account',
        itemKey: message => String(nameOf(message)),
      })
    )
    await settle()

    expect(account.streams).toHaveLength(1)
    expect(fallback.streams).toHaveLength(0)
  })

  it('refuses a transport name nothing provides, before any call', () => {
    const { transport, streams } = streamingTransport()
    const root = scope({ default: transport })

    expect(() =>
      root.mount(() =>
        createConnectStream(watchUsers, () => ({}), { transport: 'account' })
      )
    ).toThrowError(/No provider for transport "account"/)
    expect(streams).toHaveLength(0)
  })

  it('refuses a stream created with no provider at all', () => {
    const root = scope({})

    expect(() =>
      root.mount(() => createConnectStream(watchUsers, () => ({})))
    ).toThrowError(ConnectAdapterError)
  })

  it('refuses an invalid transport name', () => {
    const { transport } = streamingTransport()
    const root = scope({ default: transport })

    expect(() =>
      root.mount(() =>
        createConnectStream(watchUsers, () => ({}), { transport: ' ' })
      )
    ).toThrowError(ConnectAdapterError)
  })

  it('refuses options that are not an object', () => {
    const { transport } = streamingTransport()
    const root = scope({ default: transport })

    expect(() =>
      root.mount(() =>
        createConnectStream(watchUsers, () => ({}), [] as never)
      )
    ).toThrowError(/an array as its options/)
  })

  it('keeps its own key and open over ones a caller slips past the types', async () => {
    const { transport, streams } = streamingTransport(stream => stream.open())
    const root = scope({ default: transport })
    const callerOpen = vi.fn(() => Promise.reject(new Error('caller open')))
    const callerKey = vi.fn(() => ['caller'])

    const { value: stream } = root.mount(() =>
      createConnectStream(watchUsers, () => ({}), {
        key: callerKey,
        open: callerOpen,
      } as never)
    )
    const { value: list } = root.mount(() =>
      createConnectStreamList(watchUsers, () => ({}), {
        itemKey: (message: unknown) => String(nameOf(message)),
        key: callerKey,
        open: callerOpen,
      } as never)
    )
    await settle()

    expect(streams).toHaveLength(2)
    expect(callerOpen).not.toHaveBeenCalled()
    expect(callerKey).not.toHaveBeenCalled()
    expect(stream.status()).toBe('open')
    expect(list.status()).toBe('open')

    streams[0]!.send({ name: 'a' })
    streams[1]!.send({ name: 'b' })
    await settle()
    expect(nameOf(stream.latest())).toBe('a')
    expect(list.ids()).toEqual(['b'])

    streams[0]!.finish()
    streams[1]!.finish()
    await settle()
    expect(stream.status()).toBe('completed')
    expect(list.status()).toBe('completed')
  })

  it('replaces the call when the request changes, and the old one publishes nothing', async () => {
    const { transport, streams } = streamingTransport(stream => stream.open())
    const root = scope({ default: transport })
    const [pageSize, setPageSize] = createSignal(1)

    const { value: stream } = root.mount(() =>
      createConnectStream(watchUsers, () => ({ pageSize: pageSize() }))
    )
    await settle()
    streams[0]!.send({ name: 'first' })
    await settle()
    expect(nameOf(stream.latest())).toBe('first')

    setPageSize(2)
    await settle()

    expect(streams).toHaveLength(2)
    expect(streams[0]!.signal?.aborted).toBe(true)
    expect(fieldOf(streams[1]!.requests[0], 'pageSize')).toBe(2)
    // A new call is a new sequence: nothing the old one said carries over.
    expect(stream.latest()).toBeUndefined()

    streams[0]!.send({ name: 'late' })
    streams[0]!.break(new ConnectError('late', Code.Internal))
    await settle()
    expect(stream.latest()).toBeUndefined()
    expect(stream.status()).toBe('open')

    streams[1]!.send({ name: 'second' })
    await settle()
    expect(nameOf(stream.latest())).toBe('second')
  })

  it('replaces the call when the key extension changes', async () => {
    const { transport, streams } = streamingTransport(stream => stream.open())
    const root = scope({ default: transport })
    const [tenant, setTenant] = createSignal('a')

    root.mount(() =>
      createConnectStream(watchUsers, () => ({}), {
        keyExtension: () => [tenant()],
      })
    )
    await settle()
    setTenant('b')
    await settle()

    expect(streams).toHaveLength(2)
    expect(streams[0]!.signal?.aborted).toBe(true)
  })

  it('keeps the call when the request changes to an equivalent one', async () => {
    const { transport, streams } = streamingTransport(stream => stream.open())
    const root = scope({ default: transport })
    const [pageSize, setPageSize] = createSignal<number | undefined>(undefined)

    root.mount(() =>
      createConnectStream(watchUsers, () => ({ pageSize: pageSize() }))
    )
    await settle()
    // An implicit zero keys exactly as its omission.
    setPageSize(0)
    await settle()

    expect(streams).toHaveLength(1)
  })
})

describe('reduction mode', () => {
  it('exposes the latest message and a fold over every message', async () => {
    const { transport, streams } = streamingTransport(stream => stream.open())
    const root = scope({ default: transport })

    const { value: stream } = root.mount(() =>
      createConnectStream(watchUsers, () => ({}), {
        initial: () => [] as string[],
        reduce: (names: string[], message) => [...names, String(nameOf(message))],
        bufferSize: 2,
      })
    )
    await settle()
    expect(stream.value()).toEqual([])

    streams[0]!.send({ name: 'a' })
    streams[0]!.send({ name: 'b' })
    streams[0]!.send({ name: 'c' })
    await settle()

    expect(nameOf(stream.latest())).toBe('c')
    expect(stream.value()).toEqual(['b', 'c'])
  })

  it('tracks only latest without a fold', async () => {
    const { transport, streams } = streamingTransport(stream => stream.open())
    const root = scope({ default: transport })

    const { value: stream } = root.mount(() =>
      createConnectStream(watchUsers, () => ({}))
    )
    await settle()
    streams[0]!.send({ name: 'a' })
    await settle()

    expect(nameOf(stream.latest())).toBe('a')
    expect(stream.value()).toBeUndefined()
  })

  it('starts a fresh call with fresh state on an explicit connect', async () => {
    const { transport, streams } = streamingTransport(stream => stream.open())
    const root = scope({ default: transport })

    const { value: stream } = root.mount(() =>
      createConnectStream(watchUsers, () => ({}), {
        initial: () => 0,
        reduce: (count: number) => count + 1,
      })
    )
    await settle()
    streams[0]!.send({ name: 'a' })
    streams[0]!.finish()
    await settle()
    expect(stream.status()).toBe('completed')
    expect(stream.value()).toBe(1)

    await stream.connect()

    expect(streams).toHaveLength(2)
    expect(stream.status()).toBe('open')
    expect(stream.value()).toBe(0)
    expect(stream.latest()).toBeUndefined()
    expect('reset' in stream).toBe(false)
  })
})

describe('collection mode', () => {
  it('keeps rows in order, updates a repeat key in place, and evicts the oldest at limit', async () => {
    const { transport, streams } = streamingTransport(stream => stream.open())
    const root = scope({ default: transport })

    const { value: list } = root.mount(() =>
      createConnectStreamList(watchUsers, () => ({}), {
        itemKey: message => String(nameOf(message)).split(':')[0]!,
        limit: 2,
      })
    )
    await settle()
    const rowA = list.get('a')

    streams[0]!.send({ name: 'a:1' })
    streams[0]!.send({ name: 'b:1' })
    streams[0]!.send({ name: 'a:2' })
    await settle()

    expect(list.ids()).toEqual(['a', 'b'])
    expect(nameOf(rowA())).toBe('a:2')
    expect(nameOf(list.latest())).toBe('a:2')

    streams[0]!.send({ name: 'c:1' })
    await settle()

    expect(list.ids()).toEqual(['b', 'c'])
    expect(rowA()).toBeUndefined()
  })

  it('prepends when asked', async () => {
    const { transport, streams } = streamingTransport(stream => stream.open())
    const root = scope({ default: transport })

    const { value: list } = root.mount(() =>
      createConnectStreamList(watchUsers, () => ({}), {
        itemKey: message => String(nameOf(message)),
        insert: 'prepend',
      })
    )
    await settle()
    streams[0]!.send({ name: 'a' })
    streams[0]!.send({ name: 'b' })
    await settle()

    expect(list.ids()).toEqual(['b', 'a'])
  })

  it('clears the rows when a new connection starts', async () => {
    const { transport, streams } = streamingTransport(stream => stream.open())
    const root = scope({ default: transport })

    const { value: list } = root.mount(() =>
      createConnectStreamList(watchUsers, () => ({}), {
        itemKey: message => String(nameOf(message)),
      })
    )
    await settle()
    streams[0]!.send({ name: 'a' })
    await settle()
    expect(list.ids()).toEqual(['a'])

    await list.connect()

    expect(streams[0]!.signal?.aborted).toBe(true)
    expect(list.ids()).toEqual([])
    expect(list.get('a')()).toBeUndefined()
    expect(list.latest()).toBeUndefined()
  })
})

describe('lifecycle and errors', () => {
  it('moves from idle through connecting and open to completed', async () => {
    const { transport, streams } = streamingTransport()
    const root = scope({ default: transport })

    const { value: stream } = root.mount(() =>
      createConnectStream(watchUsers, () => ({}), { autoConnect: false })
    )
    await settle()
    expect(stream.status()).toBe('idle')
    expect(streams).toHaveLength(0)

    const connecting = stream.connect()
    await settle()
    expect(stream.status()).toBe('connecting')

    streams[0]!.open()
    await connecting
    expect(stream.status()).toBe('open')

    streams[0]!.finish()
    await settle()
    expect(stream.status()).toBe('completed')
    expect(stream.error()).toBeUndefined()
  })

  it('completes a stream that sent no messages', async () => {
    const { transport } = streamingTransport(stream => {
      stream.open()
      stream.finish()
    })
    const root = scope({ default: transport })

    const { value: list } = root.mount(() =>
      createConnectStreamList(watchUsers, () => ({}), {
        itemKey: message => String(nameOf(message)),
      })
    )
    await settle()

    expect(list.status()).toBe('completed')
    expect(list.ids()).toEqual([])
  })

  it('rejects connect with the ConnectError the call failed to open with', async () => {
    const failure = new ConnectError('no', Code.PermissionDenied)
    const { transport } = streamingTransport(stream => stream.fail(failure))
    const root = scope({ default: transport })

    const { value: stream } = root.mount(() =>
      createConnectStream(watchUsers, () => ({}), { autoConnect: false })
    )

    await expect(stream.connect()).rejects.toBe(failure)
    expect(stream.status()).toBe('error')
    expect(stream.error()).toBe(failure)
    expect((stream.error() as ConnectError).code).toBe(Code.PermissionDenied)
  })

  it('fails a transport that throws instead of rejecting', async () => {
    const failure = new ConnectError('thrown', Code.Internal)
    const root = scope({
      default: {
        unary: () => Promise.reject(new Error('unused')),
        stream: () => {
          throw failure
        },
      },
    })

    const { value: stream } = root.mount(() =>
      createConnectStream(watchUsers, () => ({}), { autoConnect: false })
    )

    await expect(stream.connect()).rejects.toBe(failure)
    expect(stream.error()).toBe(failure)
  })

  it('reports a later failure through status and error, with its identity', async () => {
    const failure = new ConnectError('gone', Code.Unavailable)
    const { transport, streams } = streamingTransport(stream => stream.open())
    const root = scope({ default: transport })

    const { value: stream } = root.mount(() =>
      createConnectStream(watchUsers, () => ({}), { autoConnect: false })
    )
    await stream.connect()
    streams[0]!.send({ name: 'a' })
    await settle()
    streams[0]!.break(failure)
    await settle()

    expect(stream.status()).toBe('error')
    expect(stream.error()).toBe(failure)
    expect(nameOf(stream.latest())).toBe('a')
  })

  it("reports an application signal's abort as an error, not a cancellation", async () => {
    const { transport, streams } = streamingTransport(stream => stream.open())
    const root = scope({ default: transport })
    const controller = new AbortController()

    const { value: stream } = root.mount(() =>
      createConnectStream(watchUsers, () => ({}), {
        callOptions: { signal: controller.signal },
      })
    )
    await settle()
    expect(stream.status()).toBe('open')

    const reason = new Error('navigated away')
    controller.abort(reason)
    await settle()

    expect(stream.status()).toBe('error')
    const error = stream.error()
    expect(error).toBeInstanceOf(ConnectError)
    expect((error as ConnectError).code).toBe(Code.Canceled)
    expect((error as ConnectError).cause).toBe(reason)
    expect(streams[0]!.signal?.aborted).toBe(true)
    expect(streams[0]!.returned()).toBeGreaterThan(0)
  })

  it('binds the application signal for the result, so connect after its abort fails without a call', async () => {
    const { transport, streams } = streamingTransport(stream => stream.open())
    const root = scope({ default: transport })
    const controller = new AbortController()

    const { value: stream } = root.mount(() =>
      createConnectStream(watchUsers, () => ({}), {
        callOptions: { signal: controller.signal },
      })
    )
    await settle()
    streams[0]!.send({ name: 'a' })
    await settle()

    controller.abort()
    await settle()
    expect(stream.status()).toBe('error')
    expect((stream.error() as ConnectError).code).toBe(Code.Canceled)

    const reconnect = stream.connect()
    await expect(reconnect).rejects.toBeInstanceOf(ConnectError)
    await expect(reconnect).rejects.toHaveProperty('code', Code.Canceled)
    expect(streams).toHaveLength(1)
    expect(stream.status()).toBe('error')
  })

  it('makes no call when the application signal aborted in advance', async () => {
    const { transport, streams } = streamingTransport(stream => stream.open())
    const root = scope({ default: transport })
    const controller = new AbortController()
    controller.abort()

    const { value: stream } = root.mount(() =>
      createConnectStream(watchUsers, () => ({}), {
        autoConnect: false,
        callOptions: { signal: controller.signal },
      })
    )

    await expect(stream.connect()).rejects.toBeInstanceOf(ConnectError)
    expect(streams).toHaveLength(0)
    expect(stream.status()).toBe('error')
    expect((stream.error() as ConnectError).code).toBe(Code.Canceled)
  })

  it('reports a deadline as an error while the call is open', async () => {
    vi.useFakeTimers()
    const { transport, streams } = streamingTransport(stream => stream.open())
    const root = scope({ default: transport })

    const { value: stream } = root.mount(() =>
      createConnectStream(watchUsers, () => ({}), {
        callOptions: { timeoutMs: 50 },
      })
    )
    await vi.advanceTimersByTimeAsync(0)
    expect(stream.status()).toBe('open')
    // The deadline is the call's, so the transport is given it too.
    expect(streams[0]!.timeoutMs).toBe(50)

    await vi.advanceTimersByTimeAsync(50)

    expect(stream.status()).toBe('error')
    expect(stream.error()).toBeInstanceOf(ConnectError)
    expect((stream.error() as ConnectError).code).toBe(Code.DeadlineExceeded)
    expect(streams[0]!.signal?.aborted).toBe(true)
  })

  it('reports a deadline that passes while opening as a rejected connect', async () => {
    vi.useFakeTimers()
    const { transport } = streamingTransport()
    const root = scope({ default: transport })

    const { value: stream } = root.mount(() =>
      createConnectStream(watchUsers, () => ({}), {
        autoConnect: false,
        callOptions: { timeoutMs: 20 },
      })
    )
    const connecting = stream.connect()
    const rejected = expect(connecting).rejects.toBeInstanceOf(ConnectError)
    await vi.advanceTimersByTimeAsync(20)
    await rejected

    expect(stream.status()).toBe('error')
    expect((stream.error() as ConnectError).code).toBe(Code.DeadlineExceeded)
  })

  it('keeps the deadline from firing after the stream completed', async () => {
    vi.useFakeTimers()
    const { transport, streams } = streamingTransport(stream => stream.open())
    const root = scope({ default: transport })

    const { value: stream } = root.mount(() =>
      createConnectStream(watchUsers, () => ({}), {
        callOptions: { timeoutMs: 50 },
      })
    )
    await vi.advanceTimersByTimeAsync(0)
    streams[0]!.finish()
    await vi.advanceTimersByTimeAsync(0)
    expect(stream.status()).toBe('completed')

    await vi.advanceTimersByTimeAsync(100)
    expect(stream.status()).toBe('completed')
    expect(vi.getTimerCount()).toBe(0)
  })

  it('publishes a request that cannot be keyed as the adapter error, unchanged', async () => {
    const { transport, streams } = streamingTransport()
    const root = scope({ default: transport })
    const thrown = new Error('no account yet')

    const { value: stream } = root.mount(() =>
      createConnectStream(
        watchUsers,
        () => {
          throw thrown
        },
        { autoConnect: false }
      )
    )
    await settle()

    const error = stream.error()
    expect(stream.status()).toBe('error')
    expect(error).toBeInstanceOf(ConnectAdapterError)
    expect((error as Error).cause).toBe(thrown)
    await expect(stream.connect()).rejects.toBe(error)
    expect(stream.error()).toBe(error)
    expect(streams).toHaveLength(0)
  })

  it('recovers once the request can be keyed again', async () => {
    const { transport, streams } = streamingTransport(stream => stream.open())
    const root = scope({ default: transport })
    const [broken, setBroken] = createSignal(false)

    const { value: stream } = root.mount(() =>
      createConnectStream(watchUsers, () => {
        if (broken()) {
          throw new Error('no account yet')
        }
        return {}
      })
    )
    await settle()
    setBroken(true)
    await settle()
    expect(stream.status()).toBe('error')
    expect(streams[0]!.signal?.aborted).toBe(true)

    setBroken(false)
    await settle()
    expect(stream.status()).toBe('open')
    expect(streams).toHaveLength(2)
  })

  it('ends the stream with whatever reduce threw', async () => {
    const thrown = { reason: 'not an Error at all' }
    const { transport, streams } = streamingTransport(stream => stream.open())
    const root = scope({ default: transport })

    const { value: stream } = root.mount(() =>
      createConnectStream(watchUsers, () => ({}), {
        initial: () => 0,
        reduce: (): number => {
          throw thrown
        },
      })
    )
    await settle()
    streams[0]!.send({ name: 'a' })
    await settle()

    expect(stream.status()).toBe('error')
    expect(stream.error()).toBe(thrown)
    expect(streams[0]!.returned()).toBeGreaterThan(0)
  })

  it('ends the list with whatever itemKey threw', async () => {
    const thrown = new TypeError('no id')
    const { transport, streams } = streamingTransport(stream => stream.open())
    const root = scope({ default: transport })

    const { value: list } = root.mount(() =>
      createConnectStreamList(watchUsers, () => ({}), {
        itemKey: (): string => {
          throw thrown
        },
      })
    )
    await settle()
    streams[0]!.send({ name: 'a' })
    await settle()

    expect(list.status()).toBe('error')
    expect(list.error()).toBe(thrown)
  })
})

describe('cancellation', () => {
  it('aborts the call while it is still opening, and drops what opens later', async () => {
    const { transport, streams } = streamingTransport()
    const root = scope({ default: transport })

    const { value: stream } = root.mount(() =>
      createConnectStream(watchUsers, () => ({}), { autoConnect: false })
    )
    const connecting = stream.connect()
    await settle()

    stream.cancel()

    // The connection the caller asked for did not happen.
    await expect(connecting).rejects.toBeDefined()
    expect(stream.status()).toBe('cancelled')
    expect(stream.error()).toBeUndefined()
    expect(streams[0]!.signal?.aborted).toBe(true)

    // The transport ignored its signal and opened anyway.
    streams[0]!.open()
    streams[0]!.send({ name: 'late' })
    await settle()

    expect(stream.status()).toBe('cancelled')
    expect(stream.latest()).toBeUndefined()
    expect(streams[0]!.returned()).toBe(1)
  })

  it('aborts the call and ends a pending next', async () => {
    const { transport, streams } = streamingTransport(stream => stream.open())
    const root = scope({ default: transport })

    const { value: stream } = root.mount(() =>
      createConnectStream(watchUsers, () => ({}))
    )
    await settle()
    expect(streams[0]!.nexts()).toBe(1)

    stream.cancel()
    await settle()

    expect(stream.status()).toBe('cancelled')
    expect(stream.error()).toBeUndefined()
    expect(streams[0]!.signal?.aborted).toBe(true)
    expect(streams[0]!.returned()).toBeGreaterThan(0)

    streams[0]!.send({ name: 'late' })
    streams[0]!.break(new ConnectError('late', Code.Internal))
    await settle()
    expect(stream.latest()).toBeUndefined()
    expect(stream.status()).toBe('cancelled')
    expect(stream.error()).toBeUndefined()
  })

  it('aborts the call when the owner is disposed, while opening', async () => {
    const { transport, streams } = streamingTransport()
    const root = scope({ default: transport })

    const { dispose } = root.mount(() =>
      createConnectStream(watchUsers, () => ({}))
    )
    await settle()
    dispose()

    expect(streams[0]!.signal?.aborted).toBe(true)
  })

  it('aborts the call when the owner is disposed, during a pending next', async () => {
    const { transport, streams } = streamingTransport(stream => stream.open())
    const root = scope({ default: transport })

    const { dispose } = root.mount(() =>
      createConnectStreamList(watchUsers, () => ({}), {
        itemKey: message => String(nameOf(message)),
      })
    )
    await settle()
    expect(streams[0]!.nexts()).toBe(1)
    dispose()
    await settle()

    expect(streams[0]!.signal?.aborted).toBe(true)
    expect(streams[0]!.returned()).toBeGreaterThan(0)
    // Nothing asks for another message once the owner is gone.
    streams[0]!.send({ name: 'late' })
    await settle()
    expect(streams[0]!.nexts()).toBe(1)
  })

  it('reports cancelled on an explicit dispose while open', async () => {
    const { transport, streams } = streamingTransport(stream => stream.open())
    const root = scope({ default: transport })

    const { value: stream } = root.mount(() =>
      createConnectStream(watchUsers, () => ({}))
    )
    await settle()
    stream.dispose()

    expect(stream.status()).toBe('cancelled')
    expect(streams[0]!.signal?.aborted).toBe(true)
    await expect(stream.connect()).rejects.toThrow(/after its owner was disposed/)
  })

  it('does not overwrite a completed or failed ending', async () => {
    const failure = new ConnectError('broke', Code.DataLoss)
    const { transport, streams } = streamingTransport(stream => stream.open())
    const root = scope({ default: transport })

    const { value: completed } = root.mount(() =>
      createConnectStream(watchUsers, () => ({}))
    )
    const { value: failed } = root.mount(() =>
      createConnectStream(watchUsers, () => ({ pageSize: 2 }))
    )
    await settle()
    streams[0]!.finish()
    streams[1]!.break(failure)
    await settle()

    completed.cancel()
    failed.cancel()
    completed.dispose()
    failed.dispose()

    expect(completed.status()).toBe('completed')
    expect(failed.status()).toBe('error')
    expect(failed.error()).toBe(failure)
  })

  it('keeps cancelling effective alongside an application signal', async () => {
    const { transport, streams } = streamingTransport(stream => stream.open())
    const root = scope({ default: transport })
    const controller = new AbortController()

    const { value: stream } = root.mount(() =>
      createConnectStream(watchUsers, () => ({}), {
        callOptions: { signal: controller.signal },
      })
    )
    await settle()
    stream.cancel()
    controller.abort()
    await settle()

    expect(stream.status()).toBe('cancelled')
    expect(stream.error()).toBeUndefined()
    expect(streams[0]!.signal?.aborted).toBe(true)
  })
})

describe('connecting', () => {
  it('never retries a failed or completed call', async () => {
    vi.useFakeTimers()
    const { transport, streams } = streamingTransport(stream => stream.open())
    const root = scope({ default: transport })

    const { value: failed } = root.mount(() =>
      createConnectStream(watchUsers, () => ({}))
    )
    const { value: completed } = root.mount(() =>
      createConnectStream(watchUsers, () => ({ pageSize: 2 }))
    )
    await vi.advanceTimersByTimeAsync(0)
    streams[0]!.break(new ConnectError('down', Code.Unavailable))
    streams[1]!.finish()
    await vi.advanceTimersByTimeAsync(60_000)

    expect(failed.status()).toBe('error')
    expect(completed.status()).toBe('completed')
    expect(streams).toHaveLength(2)
  })

  it('stays idle without autoConnect, and a key change only detaches an open call', async () => {
    const { transport, streams } = streamingTransport(stream => stream.open())
    const root = scope({ default: transport })
    const [pageSize, setPageSize] = createSignal(1)

    const { value: stream } = root.mount(() =>
      createConnectStream(watchUsers, () => ({ pageSize: pageSize() }), {
        autoConnect: false,
      })
    )
    await settle()
    setPageSize(2)
    await settle()
    expect(stream.status()).toBe('idle')
    expect(streams).toHaveLength(0)

    await stream.connect()
    expect(fieldOf(streams[0]!.requests[0], 'pageSize')).toBe(2)

    setPageSize(3)
    await settle()

    expect(stream.status()).toBe('cancelled')
    expect(streams[0]!.signal?.aborted).toBe(true)
    expect(streams).toHaveLength(1)
  })

  it('opens nothing on its own in a server render, and connects when asked', async () => {
    vi.stubGlobal('document', undefined)
    const { transport, streams } = streamingTransport(stream => stream.open())
    const root = scope({ default: transport })

    const { value: stream } = root.mount(() =>
      createConnectStream(watchUsers, () => ({}))
    )
    const { value: list } = root.mount(() =>
      createConnectStreamList(watchUsers, () => ({ pageSize: 2 }), {
        itemKey: message => String(nameOf(message)),
      })
    )
    await settle()

    expect(stream.status()).toBe('idle')
    expect(list.status()).toBe('idle')
    expect(streams).toHaveLength(0)

    await stream.connect()
    expect(stream.status()).toBe('open')
    expect(streams).toHaveLength(1)
  })
})

describe('call options', () => {
  it('passes headers, context values, and the deadline to the transport', async () => {
    const { transport, streams } = streamingTransport(stream => stream.open())
    const root = scope({ default: transport })
    const tenant = createContextKey('none')
    const contextValues = createContextValues().set(tenant, 'acme')

    root.mount(() =>
      createConnectStream(watchUsers, () => ({}), {
        callOptions: {
          headers: { 'x-tenant': 'acme' },
          contextValues,
          timeoutMs: 5_000,
        },
      })
    )
    await settle()

    expect(streams[0]!.header).toEqual({ 'x-tenant': 'acme' })
    expect(streams[0]!.contextValues).toBe(contextValues)
    expect(streams[0]!.timeoutMs).toBe(5_000)
  })

  it('refuses a malformed call option at creation', () => {
    const { transport } = streamingTransport()
    const root = scope({ default: transport })

    expect(() =>
      root.mount(() =>
        createConnectStream(watchUsers, () => ({}), {
          callOptions: { timeoutMs: Number.NaN },
        })
      )
    ).toThrowError(ConnectAdapterError)
  })

  it('reads call options once, at creation', async () => {
    const { transport, streams } = streamingTransport(stream => stream.open())
    const root = scope({ default: transport })
    const callOptions: { timeoutMs?: number } = { timeoutMs: 1_000 }

    const { value: stream } = root.mount(() =>
      createConnectStream(watchUsers, () => ({}), {
        autoConnect: false,
        callOptions,
      })
    )
    callOptions.timeoutMs = 1
    await stream.connect()

    expect(streams[0]!.timeoutMs).toBe(1_000)
  })
})

describe('cardinality', () => {
  it.each(['unary', 'client_streaming', 'bidi_streaming'])(
    'refuses a %s method before any transport call',
    methodKind => {
      const { transport, streams, unaryCalls } = streamingTransport()
      const root = scope({ default: transport, account: transport })

      let failure: unknown
      try {
        root.mount(() =>
          createConnectStreamList(methodOfKind(methodKind), () => ({}), {
            transport: 'account',
            itemKey: message => String(nameOf(message)),
          })
        )
      } catch (error) {
        failure = error
      }

      expect(failure).toBeInstanceOf(ConnectAdapterError)
      const message = (failure as Error).message
      expect(message).toMatch(/acme\.users\.v1\.UserService\.WatchUsers/)
      expect(message).toMatch(/"account"/)
      expect(message).toMatch(/requires a server_streaming method/)
      expect(streams).toHaveLength(0)
      expect(unaryCalls).toBe(0)
    }
  )

  it('points a unary method at the unary adapters', () => {
    const root = scope({ default: streamingTransport().transport })

    expect(() =>
      root.mount(() =>
        createConnectStream(
          GetUser as DescMethodServerStreaming<DescMessage, DescMessage>,
          () => ({})
        )
      )
    ).toThrowError(/for transport "default".*createConnectQuery/)
  })

  it('refuses something that is not a method descriptor', () => {
    const root = scope({ default: streamingTransport().transport })

    expect(() =>
      root.mount(() =>
        createConnectStream(
          null as unknown as DescMethodServerStreaming<DescMessage, DescMessage>,
          () => ({})
        )
      )
    ).toThrowError(/not a method descriptor/)
  })
})

describe('keys', () => {
  it('builds the key the unary adapters would, uncached', async () => {
    const { transport } = streamingTransport(stream => stream.open())
    const root = scope({ default: transport })

    root.mount(() =>
      createConnectStream(watchUsers, () => ({ pageSize: 3 }))
    )
    await settle()

    const { key } = buildConnectKey(watchUsers, () => ({ pageSize: 3 }))
    expect(key.slice(0, 4)).toEqual([
      'connect',
      'default',
      'acme.users.v1.UserService',
      'WatchUsers',
    ])
    // A stream is a subscription: nothing it receives becomes a cache entry.
    const observation = root.client.observe(key)
    expect(observation.entry().status).not.toBe('success')
    observation.release()
  })
})
