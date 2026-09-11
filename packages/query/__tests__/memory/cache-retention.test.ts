/**
 * Retention for @tachui/query (#283).
 *
 * Cache growth is the failure mode most likely to reach production unnoticed:
 * everything works, nothing is slow on the page that caused it, and the tab
 * dies an hour later. Unit tests cannot see it — they assert bookkeeping, and
 * bookkeeping is exactly what a leak keeps tidy while the heap fills.
 *
 * So these assert reachability instead. Each one parks a sentinel somewhere
 * only the thing under test can reach it, drops every other reference, forces
 * a collection, and asks whether it survived. The answer is a yes or a no
 * rather than a threshold, which is what separates this from the heap-growth
 * tier (`tools/testing/memory-leak-tester.ts`) and its allowances.
 *
 * Every cleanup case is paired with the state before that cleanup, where the
 * sentinel is *expected* to survive. A retention test that can only pass is
 * the thing this tier exists to stop being.
 */

import { afterEach, describe, expect, it } from 'vitest'

import { createRoot } from '@tachui/core'

import {
  canForceCollection,
  createSentinel,
  isRetained,
  weaklyHoldAsync,
} from '../support/retention'
import {
  createQueryClient,
  inspectQueryEntry,
  resetDefaultQueryClient,
} from '../../src/client'
import { createAsyncStream } from '../../src/create-async-stream'
import { createQuery } from '../../src/create-query'

/**
 * Skipped only where no collector could be obtained and nothing demanded one;
 * under `test:memory-leaks` that condition is fatal at import instead.
 */
const describeRetention = describe.skipIf(!canForceCollection)

afterEach(() => {
  resetDefaultQueryClient()
})

/** Lets loaders, the cache's write-back chain, and timers run. */
async function settle(milliseconds = 0): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, milliseconds))
}

/** Short enough to wait out in a test, long enough not to race the loader. */
const GC_TIME = 20

describeRetention('cache entries', () => {
  it('lets an unobserved entry go once gcTime has elapsed', async () => {
    const client = createQueryClient()
    const ref = await weaklyHoldAsync(async () => {
      const payload = createSentinel('unobserved-entry')
      await client.fetchQuery<object>({
        key: () => ['users', 1],
        load: async () => payload,
        gcTime: GC_TIME,
      })
      return payload
    })

    // Cached, which is the state the eviction below has to change. Checked
    // synchronously rather than by reachability: forcing a collection takes
    // several turns, and a retention window short enough to wait out in a
    // test elapses during them. The reachability control for a *held* entry
    // is the observed-entry test below, whose window is held open by the
    // observation rather than by the clock.
    expect(inspectQueryEntry(client, ['users', 1])).toBeDefined()

    await settle(GC_TIME * 3)

    expect(inspectQueryEntry(client, ['users', 1])).toBeUndefined()
    expect(await isRetained(ref)).toBe(false)
    client.dispose()
  })

  it('releases everything it holds when the client is disposed', async () => {
    const client = createQueryClient()
    const refs: WeakRef<object>[] = []
    // Built and dropped inside a frame that has returned before anything is
    // collected; only the weak references survive it.
    await (async () => {
      for (let index = 0; index < 3; index += 1) {
        const payload = createSentinel(`disposed-${index}`)
        refs.push(new WeakRef(payload))
        await client.fetchQuery<object>({
          key: () => ['kept', index],
          load: async () => payload,
          // Retained until something explicitly lets go, so eviction cannot
          // be what passes this test.
          gcTime: Number.POSITIVE_INFINITY,
        })
      }
    })()

    expect(await isRetained(refs[0] as WeakRef<object>)).toBe(true)

    client.dispose()

    for (const ref of refs) {
      expect(await isRetained(ref)).toBe(false)
    }
  })
})

describeRetention('observers', () => {
  it('releases an observed entry when the owner that made it is disposed', async () => {
    const client = createQueryClient()
    let disposeOwner!: () => void
    const ref = await weaklyHoldAsync(async () => {
      const payload = createSentinel('observed-entry')
      createRoot((dispose) => {
        disposeOwner = dispose
        createQuery<object>({
          key: () => ['observed'],
          load: async () => payload,
          gcTime: GC_TIME,
          client,
        })
      })
      await settle()
      return payload
    })

    // An observed entry is held against eviction for as long as it is
    // observed — the point of the observation, and the control for what
    // follows.
    await settle(GC_TIME * 3)
    expect(await isRetained(ref)).toBe(true)

    disposeOwner()
    await settle(GC_TIME * 3)

    // Cleanup released the observation, eviction followed, and nothing —
    // neither the entry, the loader closure, nor the query's own signals —
    // is left holding the response.
    expect(inspectQueryEntry(client, ['observed'])).toBeUndefined()
    expect(await isRetained(ref)).toBe(false)
    client.dispose()
  })

  /**
   * The control for this whole tier.
   *
   * An observation that is never released is the leak these tests exist to
   * catch, so one is made deliberately here and the tier is required to see
   * it. If this ever reports `false`, the checks above are passing for the
   * wrong reason and prove nothing.
   */
  it('sees an observer that was never released', async () => {
    const client = createQueryClient()
    const ref = await weaklyHoldAsync(async () => {
      const payload = createSentinel('leaked-observer')
      // Taken and deliberately never released, which is what a component that
      // forgets its cleanup leaves behind. The handle is dropped on purpose:
      // what pins the entry is the observer count this raised and nothing
      // lowers, not a reference anyone is holding — so keeping the handle
      // would retain no more than throwing it away does.
      client.observe(['leaked'])
      await client.fetchQuery<object>({
        key: () => ['leaked'],
        load: async () => payload,
        gcTime: GC_TIME,
      })
      return payload
    })

    await settle(GC_TIME * 3)

    expect(inspectQueryEntry(client, ['leaked'])).toBeDefined()
    expect(await isRetained(ref)).toBe(true)
    client.dispose()
  })
})

describeRetention('in-flight requests', () => {
  it('releases the controller and entry of a request that was abandoned', async () => {
    const client = createQueryClient()
    let disposeOwner!: () => void
    const ref = await weaklyHoldAsync(async () => {
      const payload = createSentinel('abandoned-request')
      createRoot((dispose) => {
        disposeOwner = dispose
        createQuery<object>({
          key: () => ['abandoned'],
          load: ({ signal }) =>
            new Promise<object>((_resolve, reject) => {
              // Respecting the signal is the loader's side of the contract,
              // and it is what lets the request settle and hand back its slot.
              // The listener closes over the response, so anything still
              // holding this controller holds that too.
              signal.addEventListener('abort', () => {
                void payload
                reject(signal.reason)
              })
            }),
          gcTime: GC_TIME,
          client,
        })
      })
      await settle()
      return payload
    })

    expect(inspectQueryEntry(client, ['abandoned'])?.fetchStatus).toBe(
      'fetching'
    )
    expect(await isRetained(ref)).toBe(true)

    disposeOwner()
    await settle(GC_TIME * 3)

    // The abort settles the request, which releases its slot and its
    // controller; the entry then ages out with nothing observing it. A
    // controller left in the client's active set would keep its listeners —
    // and everything they close over — for the life of the client.
    expect(inspectQueryEntry(client, ['abandoned'])).toBeUndefined()
    expect(await isRetained(ref)).toBe(false)
    client.dispose()
  })

  it('releases the controller of a loader that never answers its abort', async () => {
    const client = createQueryClient()
    let disposeOwner!: () => void
    const ref = await weaklyHoldAsync(async () => {
      const payload = createSentinel('deaf-request')
      createRoot((dispose) => {
        disposeOwner = dispose
        createQuery<object>({
          key: () => ['deaf'],
          load: ({ signal }) =>
            new Promise<object>(() => {
              // Registers interest in the abort and then ignores it, never
              // settling. The listener is what holds the response: a signal
              // keeps its listeners, a controller keeps its signal, and the
              // client keeps the controller — so this is reachable for as long
              // as the client tracks the flight.
              signal.addEventListener('abort', () => {
                void payload
              })
            }),
          gcTime: GC_TIME,
          client,
        })
      })
      await settle()
      return payload
    })

    expect(await isRetained(ref)).toBe(true)

    disposeOwner()
    await settle(GC_TIME * 3)

    // Abandoning the flight releases the controller, rather than leaving it
    // tracked until the whole client goes. Nothing else can clean this up:
    // the loader never settles, so the slot-release path never runs.
    expect(inspectQueryEntry(client, ['deaf'])).toBeUndefined()
    expect(await isRetained(ref)).toBe(false)
    client.dispose()
  })
})

describeRetention('streams', () => {
  it('lets its iterator go when the owner is disposed', async () => {
    const refs: WeakRef<object>[] = []
    /**
     * Holds the pending `next()` open from outside.
     *
     * A pending promise nothing can ever resolve is itself collectible, and
     * takes its whole reaction chain — including the suspended message loop —
     * with it. Keeping the resolver here keeps that promise reachable, so the
     * loop's frame, and the iterator it holds, survive exactly as long as the
     * subscription really does.
     */
    let resolveNext: ((step: IteratorResult<object>) => void) | undefined
    let disposeOwner!: () => void

    const source: AsyncIterable<object> = {
      [Symbol.asyncIterator]: () => {
        // Carried by the iterator itself, not by the source or by `open`'s
        // closure: those live in the owner's graph and would be released by
        // disposal whether or not the iteration ever stopped.
        const sentinel = createSentinel('stream-iterator')
        refs.push(new WeakRef(sentinel))
        return {
          sentinel,
          next: () =>
            new Promise<IteratorResult<object>>((resolve) => {
              resolveNext = resolve
            }),
        } as AsyncIterator<object> & { sentinel: object }
      },
    }

    createRoot((dispose) => {
      disposeOwner = dispose
      createAsyncStream<object>({
        key: () => ['feed'],
        open: () => source,
      })
    })
    await settle()

    const ref = refs[0] as WeakRef<object>
    // An open subscription is holding its iterator, which is the state
    // disposal has to change.
    expect(await isRetained(ref)).toBe(true)
    expect(typeof resolveNext).toBe('function')

    disposeOwner()
    await settle()

    // The loop ends with the owner rather than staying parked on a `next()`
    // that will never come, so nothing is left pointing at the iterator.
    expect(await isRetained(ref)).toBe(false)
  })
})
