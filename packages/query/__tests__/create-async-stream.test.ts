/**
 * `createAsyncStream` and `createAsyncStreamList` (#282): the stream primitives.
 *
 * These pin the acceptance criteria — the three endings staying
 * distinguishable, owner disposal terminating iteration, nothing reaching the
 * consumer after a cancellation, collection mode evicting at `limit` while
 * per-message cost stays flat, and unbounded array reduction not being what
 * you get by default — plus the connection lifecycle the two modes share.
 */

import { afterEach, describe, expect, it } from 'vitest'

import { createEffect, createRoot, createSignal } from '@tachui/core'

import {
  createAsyncStream,
  createAsyncStreamList,
} from '../src/create-async-stream'
import { resetDefaultQueryClient } from '../src/client'
import { QueryError } from '../src/errors'

afterEach(() => {
  resetDefaultQueryClient()
})

/** Runs a body inside a root, handing back its dispose. */
function withOwner<T>(body: () => T): { value: T; dispose: () => void } {
  let value!: T
  let dispose!: () => void
  createRoot((disposeRoot) => {
    dispose = disposeRoot
    value = body()
  })
  return { value, dispose }
}

/**
 * Lets the connection open and any queued messages be delivered. A macrotask
 * turn drains the microtask queue behind it, which a fixed number of
 * `Promise.resolve()` ticks does not.
 */
async function settle(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0))
}

interface Message {
  id: string
  body: string
}

/**
 * A source a test drives by hand.
 *
 * Messages are delivered one `next()` at a time, so a test can hold the
 * iterator mid-stream and observe what the stream does around it.
 */
function channel<T>() {
  const buffered: T[] = []
  let waiting: ((step: IteratorResult<T>) => void) | undefined
  let finished = false
  let returned = 0
  let nexts = 0

  function deliver(step: IteratorResult<T>): void {
    const resolve = waiting
    waiting = undefined
    resolve?.(step)
  }

  return {
    send(value: T): void {
      if (waiting === undefined) {
        buffered.push(value)
        return
      }
      deliver({ value, done: false })
    },
    finish(): void {
      finished = true
      deliver({ value: undefined, done: true })
    },
    /** How many times the consumer asked for another message. */
    nexts: () => nexts,
    /** How many times the consumer released the source. */
    returned: () => returned,
    iterable: {
      [Symbol.asyncIterator](): AsyncIterator<T> {
        return {
          next(): Promise<IteratorResult<T>> {
            nexts += 1
            if (buffered.length > 0) {
              return Promise.resolve({
                value: buffered.shift() as T,
                done: false,
              })
            }
            if (finished) {
              return Promise.resolve({ value: undefined, done: true })
            }
            return new Promise((resolve) => {
              waiting = resolve
            })
          },
          return(): Promise<IteratorResult<T>> {
            returned += 1
            return Promise.resolve({ value: undefined, done: true })
          },
        }
      },
    } as AsyncIterable<T>,
  }
}

/** A source that answers nothing, ever, and never looks at its signal. */
function deafSource<T>(): AsyncIterable<T> {
  return {
    [Symbol.asyncIterator](): AsyncIterator<T> {
      return {
        next: () =>
          new Promise<IteratorResult<T>>(() => {
            // never settles, and never listens for the abort either
          }),
      }
    },
  }
}

describe('the lifecycle', () => {
  it('connects when created and reports open before the first message', async () => {
    const source = channel<Message>()
    const { value: stream, dispose } = withOwner(() =>
      createAsyncStream<Message>({
        key: () => ['feed'],
        open: () => source.iterable,
      })
    )
    await settle()

    // Open is the subscription being established, not the first message
    // arriving: a quiet feed is connected, not pending.
    expect(stream.status()).toBe('open')
    expect(stream.latest()).toBeUndefined()

    source.send({ id: '1', body: 'first' })
    await settle()
    expect(stream.latest()).toEqual({ id: '1', body: 'first' })
    dispose()
  })

  it('answers connect() when the subscription is established, not when it ends', async () => {
    const source = channel<Message>()
    const { value: stream, dispose } = withOwner(() =>
      createAsyncStream<Message>({
        key: () => ['feed'],
        open: () => source.iterable,
        autoConnect: false,
      })
    )
    await settle()
    expect(stream.status()).toBe('idle')

    // Awaiting the end of an endless feed would never return.
    await stream.connect()
    expect(stream.status()).toBe('open')

    source.finish()
    await settle()
    expect(stream.status()).toBe('completed')
    dispose()
  })

  it('stays idle until asked when autoConnect is off', async () => {
    let opens = 0
    const { value: stream, dispose } = withOwner(() =>
      createAsyncStream<Message>({
        key: () => ['feed'],
        open: () => {
          opens += 1
          return channel<Message>().iterable
        },
        autoConnect: false,
      })
    )
    await settle()

    expect(opens).toBe(0)
    expect(stream.status()).toBe('idle')
    dispose()
  })

  it('keeps completion, failure, and cancellation apart', async () => {
    const completing = channel<Message>()
    const failing = channel<Message>()
    const cancelling = channel<Message>()
    const failure = new Error('socket closed')

    const done = withOwner(() =>
      createAsyncStream<Message>({
        key: () => ['done'],
        open: () => completing.iterable,
      })
    )
    const broken = withOwner(() =>
      createAsyncStream<Message>({
        key: () => ['broken'],
        open: () => ({
          [Symbol.asyncIterator]: () => ({
            next: () => Promise.reject(failure),
          }),
        }),
      })
    )
    const hungUp = withOwner(() =>
      createAsyncStream<Message>({
        key: () => ['hungup'],
        open: () => cancelling.iterable,
      })
    )
    await settle()

    completing.finish()
    hungUp.value.cancel()
    await settle()

    // Three endings a consumer has to be able to tell apart: the server said
    // there is no more, it broke, we hung up.
    expect(done.value.status()).toBe('completed')
    expect(broken.value.status()).toBe('error')
    expect(broken.value.error()).toBe(failure)
    expect(hungUp.value.status()).toBe('cancelled')

    expect(done.value.error()).toBeUndefined()
    expect(hungUp.value.error()).toBeUndefined()

    done.dispose()
    broken.dispose()
    hungUp.dispose()
    void failing
  })

  it('reports a failure to open and rejects the connect that asked for it', async () => {
    const failure = new Error('handshake refused')
    const { value: stream, dispose } = withOwner(() =>
      createAsyncStream<Message>({
        key: () => ['feed'],
        open: () => Promise.reject(failure),
        autoConnect: false,
      })
    )

    await expect(stream.connect()).rejects.toBe(failure)
    expect(stream.status()).toBe('error')
    expect(stream.error()).toBe(failure)
    dispose()
  })

  it('surfaces a mid-stream failure through status, which has no promise left', async () => {
    let fail!: (error: unknown) => void
    const failure = new Error('connection reset')
    const { value: stream, dispose } = withOwner(() =>
      createAsyncStream<Message>({
        key: () => ['feed'],
        open: () => ({
          [Symbol.asyncIterator]: () => ({
            next: () =>
              new Promise<IteratorResult<Message>>((_resolve, reject) => {
                fail = reject
              }),
          }),
        }),
      })
    )
    await settle()
    expect(stream.status()).toBe('open')

    fail(failure)
    await settle()

    expect(stream.status()).toBe('error')
    expect(stream.error()).toBe(failure)
    dispose()
  })

  it('refuses a connect after its owner was disposed', async () => {
    const { value: stream, dispose } = withOwner(() =>
      createAsyncStream<Message>({
        key: () => ['feed'],
        open: () => channel<Message>().iterable,
        autoConnect: false,
      })
    )
    dispose()

    await expect(stream.connect()).rejects.toBeInstanceOf(QueryError)
  })

  it('reports an unhashable key as an error rather than throwing into the render', async () => {
    const { value: stream, dispose } = withOwner(() =>
      createAsyncStream<Message>({
        // A function segment cannot be hashed (#278).
        key: () => [() => 'not hashable'],
        open: () => channel<Message>().iterable,
      })
    )
    await settle()

    expect(stream.status()).toBe('error')
    expect(stream.error()).toBeInstanceOf(QueryError)
    dispose()
  })
})

describe('cancellation', () => {
  it('terminates iteration and releases the source', async () => {
    const source = channel<Message>()
    let observed: AbortSignal | undefined
    const { value: stream, dispose } = withOwner(() =>
      createAsyncStream<Message>({
        key: () => ['feed'],
        open: ({ signal }) => {
          observed = signal
          return source.iterable
        },
      })
    )
    await settle()

    stream.cancel()
    await settle()

    expect(stream.status()).toBe('cancelled')
    expect(observed?.aborted).toBe(true)
    // Offered on the way out so a cooperative source can release what it holds.
    expect(source.returned()).toBe(1)
    dispose()
  })

  it('ends a source that never yields again and never reads its signal', async () => {
    const { value: stream, dispose } = withOwner(() =>
      createAsyncStream<Message>({
        key: () => ['feed'],
        open: () => deafSource<Message>(),
      })
    )
    await settle()
    expect(stream.status()).toBe('open')

    // Waiting on `next()` outright would hold the loop — and the owner's
    // cleanup — for as long as the process lives.
    stream.cancel()
    await settle()

    expect(stream.status()).toBe('cancelled')
    dispose()
  })

  it('lets no message reach the consumer after a cancellation', async () => {
    const source = channel<Message>()
    const { value: stream, dispose } = withOwner(() =>
      createAsyncStream<Message, Message[]>({
        key: () => ['feed'],
        open: () => source.iterable,
        initial: () => [],
        reduce: (seen, message) => [...seen, message],
        bufferSize: 10,
      })
    )
    await settle()

    source.send({ id: '1', body: 'before' })
    await settle()
    expect(stream.value()).toHaveLength(1)

    stream.cancel()
    source.send({ id: '2', body: 'after' })
    await settle()

    expect(stream.status()).toBe('cancelled')
    expect(stream.latest()).toEqual({ id: '1', body: 'before' })
    expect(stream.value()).toHaveLength(1)
    dispose()
  })

  it('withholds a message that resolved just before the cancel landed', async () => {
    const source = channel<Message>()
    const { value: stream, dispose } = withOwner(() =>
      createAsyncStream<Message>({
        key: () => ['feed'],
        open: () => source.iterable,
      })
    )
    await settle()

    source.send({ id: '1', body: 'before' })
    await settle()

    // The message is delivered to the loop, and the cancel lands in the gap
    // between that delivery and the loop acting on it — the one window the
    // abort race cannot close, because the race is already over by then.
    source.send({ id: '2', body: 'in the gap' })
    void Promise.resolve().then(() => {
      stream.cancel()
    })
    await settle()

    expect(stream.status()).toBe('cancelled')
    expect(stream.latest()).toEqual({ id: '1', body: 'before' })
    dispose()
  })

  it('drops a source that arrived in the gap before the cancel landed', async () => {
    const abandoned = channel<Message>()
    let releaseOpen!: (iterable: AsyncIterable<Message>) => void
    const { value: stream, dispose } = withOwner(() =>
      createAsyncStream<Message>({
        key: () => ['feed'],
        open: () =>
          new Promise<AsyncIterable<Message>>((resolve) => {
            releaseOpen = resolve
          }),
        autoConnect: false,
      })
    )
    const connecting = stream.connect()
    await settle()

    // The source is handed over, and the cancel lands before the connection
    // adopts it — too late for the abort race, too early for the message loop.
    // Nothing else would ever close it.
    releaseOpen(abandoned.iterable)
    void Promise.resolve().then(() => {
      stream.cancel()
    })
    await expect(connecting).resolves.toBeUndefined()
    await settle()

    expect(abandoned.returned()).toBe(1)
    expect(abandoned.nexts()).toBe(0)
    expect(stream.status()).toBe('cancelled')
    dispose()
  })

  it('does not overwrite how the stream actually ended', async () => {
    const source = channel<Message>()
    const { value: stream, dispose } = withOwner(() =>
      createAsyncStream<Message>({
        key: () => ['feed'],
        open: () => source.iterable,
      })
    )
    await settle()

    source.finish()
    await settle()
    expect(stream.status()).toBe('completed')

    stream.cancel()
    expect(stream.status()).toBe('completed')
    dispose()
  })

  it('terminates iteration when the owner is disposed', async () => {
    const source = channel<Message>()
    let observed: AbortSignal | undefined
    const { dispose } = withOwner(() =>
      createAsyncStream<Message>({
        key: () => ['feed'],
        open: ({ signal }) => {
          observed = signal
          return source.iterable
        },
      })
    )
    await settle()

    dispose()
    await settle()

    expect(observed?.aborted).toBe(true)
    expect(source.returned()).toBe(1)
  })

  it('stops pulling once disposed', async () => {
    const source = channel<Message>()
    const { dispose } = withOwner(() =>
      createAsyncStream<Message>({
        key: () => ['feed'],
        open: () => source.iterable,
      })
    )
    await settle()
    const before = source.nexts()

    dispose()
    source.send({ id: '1', body: 'ignored' })
    await settle()

    // The loop is gone, so nothing asks the source for more.
    expect(source.nexts()).toBe(before)
  })
})

describe('the key', () => {
  it('reconnects on a key change and starts the fold over', async () => {
    const first = channel<Message>()
    const second = channel<Message>()
    const opened: unknown[] = []
    const [room, setRoom] = createSignal('a')
    const { value: stream, dispose } = withOwner(() =>
      createAsyncStream<Message, number>({
        key: () => ['room', room()],
        open: ({ key }) => {
          opened.push(key[1])
          return key[1] === 'a' ? first.iterable : second.iterable
        },
        initial: () => 0,
        reduce: (count) => count + 1,
      })
    )
    await settle()

    first.send({ id: '1', body: 'a1' })
    await settle()
    expect(stream.value()).toBe(1)

    setRoom('b')
    await settle()

    // A new key is a different subscription, so the accumulation starts from
    // its seed rather than carrying the last room's messages forward.
    expect(opened).toEqual(['a', 'b'])
    expect(stream.value()).toBe(0)
    expect(stream.latest()).toBeUndefined()
    expect(first.returned()).toBe(1)

    second.send({ id: '2', body: 'b1' })
    await settle()
    expect(stream.value()).toBe(1)
    dispose()
  })

  it('ends a connection whose key was left, even without autoConnect', async () => {
    const source = channel<Message>()
    let opens = 0
    const [room, setRoom] = createSignal('a')
    const { value: stream, dispose } = withOwner(() =>
      createAsyncStream<Message>({
        key: () => ['room', room()],
        open: () => {
          opens += 1
          return source.iterable
        },
        autoConnect: false,
      })
    )
    await stream.connect()
    expect(stream.status()).toBe('open')

    setRoom('b')
    await settle()

    // Nothing reconnects without autoConnect, but streaming a key the caller
    // has moved off is worse than streaming nothing.
    expect(stream.status()).toBe('cancelled')
    expect(opens).toBe(1)
    dispose()
  })

  it('leaves an idle stream alone when its key changes', async () => {
    let opens = 0
    const [room, setRoom] = createSignal('a')
    const { value: stream, dispose } = withOwner(() =>
      createAsyncStream<Message>({
        key: () => ['room', room()],
        open: () => {
          opens += 1
          return channel<Message>().iterable
        },
        autoConnect: false,
      })
    )
    await settle()

    setRoom('b')
    await settle()

    expect(stream.status()).toBe('idle')
    expect(opens).toBe(0)
    dispose()
  })

  it('drops a source that opened after the stream had moved on', async () => {
    const abandoned = channel<Message>()
    const current = channel<Message>()
    let releaseFirstOpen!: (iterable: AsyncIterable<Message>) => void
    const [room, setRoom] = createSignal('a')
    const { value: stream, dispose } = withOwner(() =>
      createAsyncStream<Message>({
        key: () => ['room', room()],
        open: ({ key }) =>
          key[1] === 'a'
            ? new Promise<AsyncIterable<Message>>((resolve) => {
                releaseFirstOpen = resolve
              })
            : current.iterable,
      })
    )
    await settle()

    setRoom('b')
    await settle()
    expect(stream.status()).toBe('open')

    // The first `open` finally answers, with a source nobody asked for any
    // more. It is closed rather than left running against a stream that has
    // moved on.
    releaseFirstOpen(abandoned.iterable)
    await settle()

    expect(abandoned.returned()).toBe(1)
    expect(abandoned.nexts()).toBe(0)
    expect(stream.status()).toBe('open')
    dispose()
  })
})

describe('the key', () => {
  it('stops watching the key once the result is disposed', async () => {
    let opens = 0
    const [room, setRoom] = createSignal('a')
    const { value: stream, dispose } = withOwner(() =>
      createAsyncStream<Message>({
        key: () => ['room', room()],
        open: () => {
          opens += 1
          return channel<Message>().iterable
        },
      })
    )
    await settle()
    expect(opens).toBe(1)

    // The owner is still alive, so the effect is too. Disposing through the
    // result has to stop it reconnecting on its own.
    stream.dispose()
    setRoom('b')
    await settle()

    expect(opens).toBe(1)
    dispose()
  })
})

describe('reduction mode', () => {
  it('tracks only latest when no fold is supplied', async () => {
    const source = channel<Message>()
    const { value: stream, dispose } = withOwner(() =>
      createAsyncStream<Message>({
        key: () => ['feed'],
        open: () => source.iterable,
      })
    )
    await settle()

    source.send({ id: '1', body: 'one' })
    source.send({ id: '2', body: 'two' })
    await settle()

    expect(stream.latest()).toEqual({ id: '2', body: 'two' })
    // Unbounded array reduction is not what you get by default: with no fold
    // there is no accumulation at all.
    expect(stream.value()).toBeUndefined()
    dispose()
  })

  it('folds each message into the accumulated value', async () => {
    const source = channel<{ id: string; amount: number }>()
    const { value: stream, dispose } = withOwner(() =>
      createAsyncStream<{ id: string; amount: number }, number>({
        key: () => ['ledger'],
        open: () => source.iterable,
        initial: () => 100,
        reduce: (total, entry) => total + entry.amount,
      })
    )
    await settle()

    source.send({ id: '1', amount: 5 })
    source.send({ id: '2', amount: 7 })
    await settle()

    expect(stream.value()).toBe(112)
    dispose()
  })

  it('caps an array fold at bufferSize, dropping the oldest', async () => {
    const source = channel<Message>()
    const { value: stream, dispose } = withOwner(() =>
      createAsyncStream<Message, Message[]>({
        key: () => ['feed'],
        open: () => source.iterable,
        initial: () => [],
        reduce: (seen, message) => [...seen, message],
        bufferSize: 3,
      })
    )
    await settle()

    for (let index = 1; index <= 6; index += 1) {
      source.send({ id: String(index), body: `m${index}` })
    }
    await settle()

    expect(stream.value().map((message) => message.id)).toEqual(['4', '5', '6'])
    dispose()
  })

  it('leaves a non-array accumulation alone', async () => {
    const source = channel<Message>()
    const { value: stream, dispose } = withOwner(() =>
      createAsyncStream<Message, number>({
        key: () => ['feed'],
        open: () => source.iterable,
        initial: () => 0,
        reduce: (count) => count + 1,
      })
    )
    await settle()

    source.send({ id: '1', body: 'one' })
    await settle()

    expect(stream.value()).toBe(1)
    dispose()
  })

  it('ends the stream when the fold throws', async () => {
    const source = channel<Message>()
    const failure = new Error('bad fold')
    const { value: stream, dispose } = withOwner(() =>
      createAsyncStream<Message, number>({
        key: () => ['feed'],
        open: () => source.iterable,
        initial: () => 0,
        reduce: () => {
          throw failure
        },
      })
    )
    await settle()

    source.send({ id: '1', body: 'one' })
    await settle()

    // Caller code running per message. One that throws ends the stream rather
    // than dropping messages into a value nobody can trust.
    expect(stream.status()).toBe('error')
    expect(stream.error()).toBe(failure)
    expect(source.returned()).toBe(1)
    dispose()
  })

  it('refuses a bufferSize that retains nothing', () => {
    expect(() =>
      withOwner(() =>
        createAsyncStream<Message, Message[]>({
          key: () => ['feed'],
          open: () => channel<Message>().iterable,
          initial: () => [],
          reduce: (seen, message) => [...seen, message],
          bufferSize: 0,
        })
      )
    ).toThrow(QueryError)
  })
})

describe('collection mode', () => {
  it('retains each message as a row, in arrival order', async () => {
    const source = channel<Message>()
    const { value: stream, dispose } = withOwner(() =>
      createAsyncStreamList<Message, string>({
        key: () => ['feed'],
        open: () => source.iterable,
        itemKey: (message) => message.id,
      })
    )
    await settle()

    source.send({ id: 'a', body: 'first' })
    source.send({ id: 'b', body: 'second' })
    await settle()

    expect(stream.ids()).toEqual(['a', 'b'])
    expect(stream.get('a')?.()).toEqual({ id: 'a', body: 'first' })
    expect(stream.latest()).toEqual({ id: 'b', body: 'second' })
    dispose()
  })

  it('updates a repeat key in place without moving or aging anything', async () => {
    const source = channel<Message>()
    const { value: stream, dispose } = withOwner(() =>
      createAsyncStreamList<Message, string>({
        key: () => ['feed'],
        open: () => source.iterable,
        itemKey: (message) => message.id,
      })
    )
    await settle()

    source.send({ id: 'a', body: 'draft' })
    source.send({ id: 'b', body: 'other' })
    await settle()

    source.send({ id: 'a', body: 'edited' })
    await settle()

    expect(stream.ids()).toEqual(['a', 'b'])
    expect(stream.get('a')?.()).toEqual({ id: 'a', body: 'edited' })
    dispose()
  })

  it('evicts the oldest at limit and reports an evicted key as gone', async () => {
    const source = channel<Message>()
    const { value: stream, dispose } = withOwner(() =>
      createAsyncStreamList<Message, string>({
        key: () => ['feed'],
        open: () => source.iterable,
        itemKey: (message) => message.id,
        limit: 3,
      })
    )
    await settle()

    for (let index = 1; index <= 5; index += 1) {
      source.send({ id: String(index), body: `m${index}` })
    }
    await settle()

    expect(stream.ids()).toEqual(['3', '4', '5'])
    // `limit` evicts as messages arrive, so a key read from `ids` can be gone
    // by the time it is looked up. That has to report absence, not throw.
    expect(stream.get('1')).toBeUndefined()
    expect(stream.get('5')?.()).toEqual({ id: '5', body: 'm5' })
    dispose()
  })

  it('prepends newest first and evicts from the far end', async () => {
    const source = channel<Message>()
    const { value: stream, dispose } = withOwner(() =>
      createAsyncStreamList<Message, string>({
        key: () => ['feed'],
        open: () => source.iterable,
        itemKey: (message) => message.id,
        insert: 'prepend',
        limit: 3,
      })
    )
    await settle()

    for (let index = 1; index <= 5; index += 1) {
      source.send({ id: String(index), body: `m${index}` })
    }
    await settle()

    expect(stream.ids()).toEqual(['5', '4', '3'])
    expect(stream.get('1')).toBeUndefined()
    dispose()
  })

  it('holds per-message cost flat as the collection grows', async () => {
    const source = channel<Message>()
    let firstRowReads = 0
    const { value: stream, dispose } = withOwner(() =>
      createAsyncStreamList<Message, string>({
        key: () => ['feed'],
        open: () => source.iterable,
        itemKey: (message) => message.id,
      })
    )
    await settle()

    source.send({ id: 'watched', body: 'original' })
    await settle()

    const row = stream.get('watched')
    createRoot((disposeRow) => {
      createEffect(() => {
        row?.()
        firstRowReads += 1
      })
      return disposeRow
    })
    expect(firstRowReads).toBe(1)

    for (let index = 0; index < 50; index += 1) {
      source.send({ id: `m${index}`, body: 'noise' })
    }
    await settle()

    // Fifty messages later the watched row has not been rewritten once: this
    // is what a List needs in order to update one row instead of re-rendering.
    expect(firstRowReads).toBe(1)
    expect(stream.ids()).toHaveLength(51)

    source.send({ id: 'watched', body: 'edited' })
    await settle()
    expect(firstRowReads).toBe(2)
    dispose()
  })

  it('clears the collection when the stream reconnects', async () => {
    const first = channel<Message>()
    const second = channel<Message>()
    const [room, setRoom] = createSignal('a')
    const { value: stream, dispose } = withOwner(() =>
      createAsyncStreamList<Message, string>({
        key: () => ['room', room()],
        open: ({ key }) => (key[1] === 'a' ? first.iterable : second.iterable),
        itemKey: (message) => message.id,
      })
    )
    await settle()

    first.send({ id: 'a1', body: 'from a' })
    await settle()
    expect(stream.ids()).toEqual(['a1'])

    setRoom('b')
    await settle()

    // Rows from the room that was left would otherwise mix two sources into
    // one list.
    expect(stream.ids()).toEqual([])
    expect(stream.get('a1')).toBeUndefined()
    expect(stream.latest()).toBeUndefined()
    dispose()
  })

  it('ends the stream when itemKey throws', async () => {
    const source = channel<Message>()
    const failure = new Error('no id on this message')
    const { value: stream, dispose } = withOwner(() =>
      createAsyncStreamList<Message, string>({
        key: () => ['feed'],
        open: () => source.iterable,
        itemKey: () => {
          throw failure
        },
      })
    )
    await settle()

    source.send({ id: 'a', body: 'first' })
    await settle()

    expect(stream.status()).toBe('error')
    expect(stream.error()).toBe(failure)
    dispose()
  })

  it('keeps the lifecycle it shares with reduction mode', async () => {
    const source = channel<Message>()
    const { value: stream, dispose } = withOwner(() =>
      createAsyncStreamList<Message, string>({
        key: () => ['feed'],
        open: () => source.iterable,
        itemKey: (message) => message.id,
      })
    )
    await settle()
    expect(stream.status()).toBe('open')

    source.send({ id: 'a', body: 'first' })
    await settle()
    stream.cancel()
    source.send({ id: 'b', body: 'after' })
    await settle()

    expect(stream.status()).toBe('cancelled')
    expect(stream.ids()).toEqual(['a'])
    dispose()
  })

  it('refuses a limit that retains nothing', () => {
    expect(() =>
      withOwner(() =>
        createAsyncStreamList<Message, string>({
          key: () => ['feed'],
          open: () => channel<Message>().iterable,
          itemKey: (message) => message.id,
          limit: 0,
        })
      )
    ).toThrow(QueryError)
  })

  it('disposes through the result as well as the owner', async () => {
    const source = channel<Message>()
    const { value: stream, dispose } = withOwner(() =>
      createAsyncStreamList<Message, string>({
        key: () => ['feed'],
        open: () => source.iterable,
        itemKey: (message) => message.id,
      })
    )
    await settle()

    stream.dispose()
    await settle()

    expect(source.returned()).toBe(1)
    await expect(stream.connect()).rejects.toBeInstanceOf(QueryError)
    dispose()
  })
})
