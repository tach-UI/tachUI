/**
 * `createQuery` (#280): the observer between a component and a cache entry.
 *
 * These pin the acceptance criteria — key-change cancellation, late results
 * from an abandoned key, the meaning of `idle` under `enabled: false`, one
 * entry shared by observers with different projections, and the independence
 * of `status` and `fetchStatus` — plus the refetch-on-observe policy #279
 * deferred here and the retry policy.
 */

import { afterEach, describe, expect, it, vi } from 'vitest'

import { createRoot, createSignal } from '@tachui/core'

import { createQuery } from '../src/create-query'
import {
  createQueryClient,
  inspectQueryEntry,
  resetDefaultQueryClient,
} from '../src/client'

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
 * Lets the loader, the cache's write-back chain, and any retry delay run.
 * A macrotask turn drains the microtask queue behind it, which a fixed number
 * of `Promise.resolve()` ticks does not.
 */
async function settle(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0))
}

/**
 * Polls until `condition` holds, or gives up after `timeout`.
 *
 * For the things nothing announces — a freshness window elapsing — where the
 * test is that the wake-up arrives, not that it arrives inside a particular
 * number of milliseconds. A fixed sleep tuned to a developer machine turns a
 * loaded CI runner into a failure that says nothing about the code.
 */
async function waitUntil(
  condition: () => boolean,
  // A deadline, not a budget: it exists so a condition that never arrives
  // fails as a test rather than hanging the run. Generous on purpose — the
  // window being waited on here is 20ms, and anything tight enough to be
  // crossed by a loaded machine is measuring the machine.
  timeout = 30_000
): Promise<void> {
  const deadline = Date.now() + timeout
  while (!condition() && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 5))
  }
}

describe('key changes', () => {
  it('abandons the previous key and cancels its request', async () => {
    const client = createQueryClient()
    const aborted: unknown[] = []
    const [id, setId] = createSignal(1)

    const { value, dispose } = withOwner(() =>
      createQuery<string>({
        key: () => ['user', id()],
        load: ({ signal, key }) => {
          signal.addEventListener('abort', () => aborted.push(key[1]))
          return key[1] === 1
            ? new Promise<string>(() => {
                // never settles: the abort is what ends it
              })
            : Promise.resolve('second')
        },
        client,
      })
    )
    await settle()
    expect(value.fetchStatus()).toBe('fetching')

    setId(2)
    await settle()

    // Nothing is left watching key 1, so its request goes with the observer.
    expect(aborted).toEqual([1])
    expect(value.data()).toBe('second')
    dispose()
  })

  it('ignores a late result from an abandoned key', async () => {
    const client = createQueryClient()
    let releaseFirst!: (value: string) => void
    const [id, setId] = createSignal(1)

    const { value, dispose } = withOwner(() =>
      createQuery<string>({
        key: () => ['user', id()],
        load: ({ key }) =>
          key[1] === 1
            ? new Promise<string>((resolve) => {
                releaseFirst = resolve
              })
            : Promise.resolve('second'),
        client,
      })
    )
    await settle()

    setId(2)
    await settle()
    expect(value.data()).toBe('second')

    // The abandoned key resolves afterwards; it must not reach the observer,
    // which is now watching a different entry entirely.
    releaseFirst('first')
    await settle()
    expect(value.data()).toBe('second')
    dispose()
  })
})

describe('enabled', () => {
  it('performs no fetch and stays idle while gated off', async () => {
    const client = createQueryClient()
    let loads = 0
    const { value, dispose } = withOwner(() =>
      createQuery<string>({
        key: () => ['gated'],
        load: async () => {
          loads += 1
          return 'v'
        },
        enabled: false,
        client,
      })
    )
    await settle()

    expect(loads).toBe(0)
    expect(value.status()).toBe('idle')
    expect(value.fetchStatus()).toBe('idle')
    expect(value.data()).toBeUndefined()
    expect(value.isLoading()).toBe(false)
    dispose()
  })
})

describe('select', () => {
  it('shares one entry and one request between different projections', async () => {
    const client = createQueryClient()
    let loads = 0
    const load = async () => {
      loads += 1
      return { id: 1, name: 'Ada' }
    }

    const first = withOwner(() =>
      createQuery<{ id: number; name: string }, string>({
        key: () => ['user', 1],
        load,
        select: (user) => user.name,
        client,
      })
    )
    const second = withOwner(() =>
      createQuery<{ id: number; name: string }, number>({
        key: () => ['user', 1],
        load,
        select: (user) => user.id,
        client,
      })
    )
    await settle()

    // One cached TRaw, two projections of it.
    expect(loads).toBe(1)
    expect(first.value.data()).toBe('Ada')
    expect(second.value.data()).toBe(1)

    first.dispose()
    second.dispose()
  })
})

describe('status and fetchStatus', () => {
  it('keeps success visible through a background refresh', async () => {
    const client = createQueryClient()
    let release!: (value: string) => void
    let calls = 0
    const { value, dispose } = withOwner(() =>
      createQuery<string>({
        key: () => ['u'],
        load: () => {
          calls += 1
          return calls === 1
            ? Promise.resolve('first')
            : new Promise<string>((resolve) => {
                release = resolve
              })
        },
        client,
      })
    )
    await settle()
    expect(value.status()).toBe('success')
    expect(value.data()).toBe('first')

    const refreshing = value.refetch()
    await settle()

    // A background refresh is success + fetching: the prior value keeps
    // rendering rather than collapsing to a spinner.
    expect(value.status()).toBe('success')
    expect(value.fetchStatus()).toBe('fetching')
    expect(value.isRefreshing()).toBe(true)
    expect(value.isLoading()).toBe(false)
    expect(value.data()).toBe('first')

    release('second')
    await refreshing
    await settle()
    expect(value.data()).toBe('second')
    expect(value.fetchStatus()).toBe('idle')
    dispose()
  })

  it('reports loading only on a first fetch with no data', async () => {
    const client = createQueryClient()
    let release!: (value: string) => void
    const { value, dispose } = withOwner(() =>
      createQuery<string>({
        key: () => ['u'],
        load: () =>
          new Promise<string>((resolve) => {
            release = resolve
          }),
        client,
      })
    )
    await settle()

    expect(value.status()).toBe('loading')
    expect(value.isLoading()).toBe(true)
    expect(value.isRefreshing()).toBe(false)

    release('v')
    await settle()
    expect(value.status()).toBe('success')
    dispose()
  })
})

describe('placeholderData', () => {
  it('shows a placeholder until there is cached data, and never caches it', async () => {
    const client = createQueryClient()
    let release!: (value: string) => void
    const { value, dispose } = withOwner(() =>
      createQuery<string>({
        key: () => ['u'],
        load: () =>
          new Promise<string>((resolve) => {
            release = resolve
          }),
        placeholderData: 'placeholder',
        client,
      })
    )
    await settle()

    expect(value.data()).toBe('placeholder')
    expect(value.status()).toBe('loading')

    release('real')
    await settle()
    expect(value.data()).toBe('real')
    // Nothing the placeholder touched reached the cache.
    expect(client.dehydrate(() => true).queries).toHaveLength(0)
    dispose()
  })
})

describe('retry', () => {
  it('does not retry by default', async () => {
    const client = createQueryClient()
    let attempts = 0
    const { value, dispose } = withOwner(() =>
      createQuery<string>({
        key: () => ['u'],
        load: async () => {
          attempts += 1
          throw new Error('down')
        },
        client,
      })
    )
    await settle()

    expect(attempts).toBe(1)
    expect(value.status()).toBe('error')
    expect(value.error()?.message).toBe('down')
    dispose()
  })

  it('retries up to the configured count before failing', async () => {
    const client = createQueryClient()
    let attempts = 0
    const { value, dispose } = withOwner(() =>
      createQuery<string>({
        key: () => ['u'],
        load: async () => {
          attempts += 1
          if (attempts <= 2) {
            throw new Error('flaky')
          }
          return 'recovered'
        },
        retry: 2,
        client,
      })
    )
    await settle()
    await settle()

    // Retries stay inside one cache execution, so the entry never publishes
    // the intermediate failures.
    expect(attempts).toBe(3)
    expect(value.status()).toBe('success')
    expect(value.data()).toBe('recovered')
    dispose()
  })

  it('lets a predicate decide per attempt', async () => {
    const client = createQueryClient()
    const seen: number[] = []
    let attempts = 0
    const { value, dispose } = withOwner(() =>
      createQuery<string>({
        key: () => ['u'],
        load: async () => {
          attempts += 1
          throw new Error(`attempt ${attempts}`)
        },
        retry: (attempt) => {
          seen.push(attempt)
          return attempt < 1
        },
        client,
      })
    )
    await settle()
    await settle()

    expect(attempts).toBe(2)
    expect(seen).toEqual([0, 1])
    expect(value.status()).toBe('error')
    dispose()
  })
})

describe('observing decides when to fetch', () => {
  it('serves fresh cached data without refetching', async () => {
    const client = createQueryClient()
    let loads = 0
    const load = async () => {
      loads += 1
      return 'v'
    }
    await client.fetchQuery({ key: () => ['u'], load, staleTime: 60_000 })

    const { value, dispose } = withOwner(() =>
      createQuery<string>({ key: () => ['u'], load, staleTime: 60_000, client })
    )
    await settle()

    expect(loads).toBe(1)
    expect(value.data()).toBe('v')
    dispose()
  })

  it('refetches stale cached data while still rendering it', async () => {
    const client = createQueryClient()
    let loads = 0
    const load = async () => {
      loads += 1
      return `load ${loads}`
    }
    await client.fetchQuery({ key: () => ['u'], load })

    const { value, dispose } = withOwner(() =>
      createQuery<string>({ key: () => ['u'], load, client })
    )
    await settle()

    // Stale-while-revalidate: the cached value is what renders, and the
    // replacement arrives without a spinner in between.
    expect(loads).toBe(2)
    expect(value.data()).toBe('load 2')
    dispose()
  })

  it('does not refetch a hydrated entry on its first observation', async () => {
    const client = createQueryClient()
    client.hydrate({
      queries: [{ key: ['u'], data: 'from server', updatedAt: Date.now() }],
    })
    let loads = 0
    const load = async () => {
      loads += 1
      return 'client'
    }

    const first = withOwner(() =>
      createQuery<string>({ key: () => ['u'], load, client })
    )
    await settle()

    // The server produced this moments ago as part of the same page load;
    // refetching would double every server-rendered page (#291).
    expect(loads).toBe(0)
    expect(first.value.data()).toBe('from server')
    first.dispose()

    // The allowance is spent: the next observation sees ordinary staleness.
    const second = withOwner(() =>
      createQuery<string>({ key: () => ['u'], load, client })
    )
    await settle()
    expect(loads).toBe(1)
    second.dispose()
  })
})

describe('imperative controls', () => {
  it('rejects refetch when the reload fails', async () => {
    const client = createQueryClient()
    const { value, dispose } = withOwner(() =>
      createQuery<string>({
        key: () => ['u'],
        load: async () => {
          throw new Error('down')
        },
        client,
      })
    )
    await settle()

    await expect(value.refetch()).rejects.toThrow('down')
    expect(value.status()).toBe('error')
    dispose()
  })

  it('returns the projection from refetch', async () => {
    const client = createQueryClient()
    let calls = 0
    const { value, dispose } = withOwner(() =>
      createQuery<{ n: number }, string>({
        key: () => ['u'],
        load: async () => ({ n: ++calls }),
        select: (raw) => `n=${raw.n}`,
        client,
      })
    )
    await settle()
    expect(value.data()).toBe('n=1')

    await expect(value.refetch()).resolves.toBe('n=2')
    dispose()
  })

  it('marks the entry for reload through invalidate()', async () => {
    const client = createQueryClient()
    let loads = 0
    const load = async () => {
      loads += 1
      return `load ${loads}`
    }
    const { value, dispose } = withOwner(() =>
      createQuery<string>({ key: () => ['u'], load, client })
    )
    await settle()
    expect(loads).toBe(1)

    value.invalidate()
    await client.fetchQuery({ key: () => ['u'], load, client })
    expect(loads).toBe(2)
    dispose()
  })

  it('drops the observation on cancel() and again on dispose()', async () => {
    const client = createQueryClient()
    const { value, dispose } = withOwner(() =>
      createQuery<string>({
        key: () => ['u'],
        load: async () => 'v',
        client,
      })
    )
    await settle()

    let seen = -1
    client.dehydrate((entry) => {
      seen = entry.observerCount
      return false
    })
    value.cancel()
    value.dispose()
    // Both are idempotent, and neither leaves the count negative.
    const observation = client.observe(['u'])
    expect(seen).toBe(-1)
    expect(client.dehydrate(() => false).queries).toHaveLength(0)
    observation.release()
    dispose()
  })
})

describe('placeholders and gates', () => {
  it('offers the previous projection to a placeholder function', async () => {
    const client = createQueryClient()
    const [id, setId] = createSignal(1)
    const seen: Array<string | undefined> = []
    let releaseSecond!: (value: string) => void
    const { value, dispose } = withOwner(() =>
      createQuery<string>({
        key: () => ['u', id()],
        load: ({ key }) =>
          key[1] === 1
            ? Promise.resolve('user 1')
            : new Promise<string>((resolve) => {
                releaseSecond = resolve
              }),
        placeholderData: (previous) => {
          seen.push(previous)
          return previous ?? 'first load'
        },
        client,
      })
    )
    await settle()
    expect(value.data()).toBe('user 1')

    // A key change keeps the last page rendering rather than blanking, and
    // the placeholder is offered the projection it had.
    setId(2)
    await settle()
    expect(value.status()).toBe('loading')
    expect(value.data()).toBe('user 1')
    expect(seen.at(-1)).toBe('user 1')

    releaseSecond('user 2')
    await settle()
    expect(value.data()).toBe('user 2')
    dispose()
  })

  it('fetches when a reactive gate opens, and not before', async () => {
    const client = createQueryClient()
    const [open, setOpen] = createSignal(false)
    let loads = 0
    const { value, dispose } = withOwner(() =>
      createQuery<string>({
        key: () => ['gated'],
        load: async () => {
          loads += 1
          return 'v'
        },
        enabled: open,
        client,
      })
    )
    await settle()
    expect(loads).toBe(0)
    expect(value.status()).toBe('idle')

    setOpen(true)
    await settle()
    expect(loads).toBe(1)
    expect(value.data()).toBe('v')

    // Closing the gate returns to idle without showing the loaded value.
    setOpen(false)
    await settle()
    expect(value.status()).toBe('idle')
    expect(value.data()).toBeUndefined()
    dispose()
  })

  it('surfaces an unhashable key through error rather than throwing', async () => {
    const client = createQueryClient()
    const { value, dispose } = withOwner(() =>
      createQuery<string>({
        key: () => ['u', new Set(['a'])],
        load: async () => 'v',
        client,
      })
    )
    await settle()

    // Throwing here would take down the render that produced the key.
    expect(value.status()).toBe('error')
    expect(value.error()?.message).toMatch(/class instances without toJSON/)
    dispose()
  })
})

describe('retryDelay', () => {
  it('waits between attempts', async () => {
    const client = createQueryClient()
    let attempts = 0
    const delays: number[] = []
    const { value, dispose } = withOwner(() =>
      createQuery<string>({
        key: () => ['u'],
        load: async () => {
          attempts += 1
          if (attempts <= 2) {
            throw new Error('flaky')
          }
          return 'recovered'
        },
        retry: 2,
        retryDelay: (attempt) => {
          delays.push(attempt)
          return 1
        },
        client,
      })
    )
    await new Promise((resolve) => setTimeout(resolve, 20))

    expect(attempts).toBe(3)
    expect(delays).toEqual([0, 1])
    expect(value.data()).toBe('recovered')
    dispose()
  })
})

describe('teardown during a retry backoff', () => {
  it('abandons the wait when the last observer leaves', async () => {
    const client = createQueryClient()
    let attempts = 0
    const { dispose } = withOwner(() =>
      createQuery<string>({
        key: () => ['u'],
        load: async () => {
          attempts += 1
          throw new Error('down')
        },
        retry: 5,
        retryDelay: () => 10_000,
        client,
      })
    )
    await settle()
    expect(attempts).toBe(1)

    // Releasing the last observation aborts the request, and the backoff has
    // to end with it rather than holding a timer for ten seconds and then
    // retrying for a component that is gone.
    dispose()
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(attempts).toBe(1)
  })
})

describe('reacting to invalidation', () => {
  it('reloads an observed query when its entry is invalidated', async () => {
    const client = createQueryClient()
    let loads = 0
    const { value, dispose } = withOwner(() =>
      createQuery<string>({
        key: () => ['u'],
        load: async () => `load ${(loads += 1)}`,
        staleTime: 60_000,
        client,
      })
    )
    await settle()
    expect(loads).toBe(1)

    // The contract is that an observed query refetches, so marking it is not
    // enough — someone has to act, and the observer watching it is who.
    value.invalidate()
    await settle()
    expect(loads).toBe(2)
    expect(value.data()).toBe('load 2')
    dispose()
  })

  it('reloads when something else invalidates the prefix', async () => {
    const client = createQueryClient()
    let loads = 0
    const { value, dispose } = withOwner(() =>
      createQuery<string>({
        key: () => ['users', 1],
        load: async () => `load ${(loads += 1)}`,
        staleTime: 60_000,
        client,
      })
    )
    await settle()

    // This is the shape a mutation's `invalidates` will take (#281).
    client.invalidate(['users'])
    await settle()
    expect(loads).toBe(2)
    expect(value.data()).toBe('load 2')
    dispose()
  })

  it('reloads only its own entry when refreshing a prefix key', async () => {
    const client = createQueryClient()
    let childLoads = 0
    const childLoad = async () => `child ${(childLoads += 1)}`
    await client.fetchQuery({
      key: () => ['users', 1],
      load: childLoad,
      staleTime: 60_000,
      client,
    })

    const { value, dispose } = withOwner(() =>
      createQuery<string>({
        key: () => ['users'],
        load: async () => 'list',
        staleTime: 60_000,
        client,
      })
    )
    await settle()
    await value.refetch()
    await settle()

    // Refreshing ['users'] through prefix invalidation would have taken a
    // fresh ['users', 1] down with it, for a child nothing asked about.
    expect(inspectQueryEntry(client, ['users', 1])?.isStale).toBe(false)
    await client.fetchQuery({
      key: () => ['users', 1],
      load: childLoad,
      staleTime: 60_000,
      client,
    })
    expect(childLoads).toBe(1)
    dispose()
  })
})

describe('data the cache is allowed to hold', () => {
  it('projects a class instance with its methods intact', async () => {
    const client = createQueryClient()
    class User {
      constructor(readonly name: string) {}
      greet(): string {
        return `hi ${this.name}`
      }
    }

    // A structured copy would strip the prototype, so select would call a
    // method that no longer exists.
    const { value, dispose } = withOwner(() =>
      createQuery<User, string>({
        key: () => ['u'],
        load: async () => new User('Ada'),
        select: (user) => user.greet(),
        client,
      })
    )
    await settle()

    expect(value.data()).toBe('hi Ada')
    dispose()
  })

  it('does not wedge on data that cannot be cloned', async () => {
    const client = createQueryClient()
    const { value, dispose } = withOwner(() =>
      createQuery<{ id: number }>({
        key: () => ['p'],
        load: async () => new Proxy({ id: 1 }, {}),
        client,
      })
    )
    await settle()

    // structuredClone throws DataCloneError for every Proxy; the query is
    // entitled to cache one even though it could never be dehydrated.
    expect(value.status()).toBe('success')
    expect(value.data()?.id).toBe(1)
    dispose()
  })
})

describe('remounting', () => {
  it('fetches again after the previous observer left mid-flight', async () => {
    const client = createQueryClient()
    let starts = 0
    const first = withOwner(() =>
      createQuery<string>({
        key: () => ['u'],
        load: () =>
          new Promise<string>(() => {
            starts += 1
          }),
        client,
      })
    )
    await settle()
    expect(starts).toBe(1)
    first.dispose()

    // The abandoned request is detached, not merely aborted: leaving the slot
    // filled would tell the remount a request was already in flight for it,
    // so it would wait for one that never arrives.
    const second = withOwner(() =>
      createQuery<string>({ key: () => ['u'], load: async () => 'second', client })
    )
    await settle()
    expect(second.value.status()).toBe('success')
    expect(second.value.data()).toBe('second')
    second.dispose()
  })
})

describe('freshness over time', () => {
  it('reports itself stale once the window elapses', async () => {
    const client = createQueryClient()
    const { value, dispose } = withOwner(() =>
      createQuery<string>({
        key: () => ['u'],
        load: async () => 'v',
        staleTime: 20,
        client,
      })
    )
    await settle()
    expect(value.isStale()).toBe(false)

    // A window elapsing is not a cache event, so nothing would announce it;
    // the observer schedules its own wake-up. Polled rather than slept on a
    // fixed budget: the assertion is that the wake-up happens at all, and a
    // loaded runner can overshoot a 20ms window by more than any margin worth
    // hard-coding.
    await waitUntil(() => value.isStale())

    // Reported with its surroundings rather than as a bare boolean. This test
    // has failed on CI twice for two different reasons — once a one-shot
    // freshness timer that never re-armed, once unexplained — and
    // `expected false to be true` says nothing about which. If it goes again,
    // the entry's state is in the failure.
    expect({
      isStale: value.isStale(),
      status: value.status(),
      fetchStatus: value.fetchStatus(),
      updatedAt: value.updatedAt(),
      entryIsStale: inspectQueryEntry(client, ['u'])?.isStale,
      entryUpdatedAt: inspectQueryEntry(client, ['u'])?.updatedAt,
      now: Date.now(),
    }).toMatchObject({ isStale: true })
    dispose()
  })

  it('arms the wake-up again when the timer lands a hair early', async () => {
    // Node fires a timer up to a millisecond ahead of the delay it was given,
    // so the observer can wake to find its window has not elapsed after all.
    // A one-shot wake-up publishes that still-fresh snapshot and schedules
    // nothing further, and the query then reports itself fresh forever.
    //
    // Reproduced by running the clock five milliseconds behind for as long as
    // the first wake-up takes to arrive, which is exactly what an early timer
    // shows the observer.
    const client = createQueryClient()
    const realNow = Date.now
    let skew = 0
    vi.spyOn(Date, 'now').mockImplementation(() => realNow() + skew)
    try {
      const { value, dispose } = withOwner(() =>
        createQuery<string>({
          key: () => ['u'],
          load: async () => 'v',
          staleTime: 20,
          client,
        })
      )
      await settle()
      expect(value.isStale()).toBe(false)

      skew = -5
      // Real time, unaffected by the skewed clock: the window has genuinely
      // elapsed by the time this lands, so only a re-armed wake-up can see it.
      setTimeout(() => {
        skew = 0
      }, 30)

      await waitUntil(() => value.isStale())
      expect(value.isStale()).toBe(true)
      dispose()
    } finally {
      vi.restoreAllMocks()
    }
  })
})

describe('a reload that fails', () => {
  it('stops after one attempt instead of looping', async () => {
    const client = createQueryClient()
    let loads = 0
    const { value } = withOwner(() =>
      createQuery<string>({
        key: () => ['u'],
        load: async () => {
          loads += 1
          if (loads === 1) {
            return 'first'
          }
          throw new Error('backend down')
        },
        staleTime: 60_000,
        client,
      })
    )
    await settle()
    expect(loads).toBe(1)

    // A completed attempt consumes the reload mark. Leaving it set means the
    // failure notification looks like "needs reloading" again, and the next
    // reload fails the same way, with no delay between attempts.
    await expect(value.refetch()).rejects.toThrow('backend down')
    await settle()
    await settle()

    expect(loads).toBe(2)
    expect(value.status()).toBe('error')
    expect(value.error()?.message).toBe('backend down')
  })

  it('keeps rendering the value it already had', async () => {
    const client = createQueryClient()
    let loads = 0
    const { value, dispose } = withOwner(() =>
      createQuery<string>({
        key: () => ['u'],
        load: async () => {
          loads += 1
          if (loads === 1) {
            return 'first'
          }
          throw new Error('down')
        },
        staleTime: 60_000,
        client,
      })
    )
    await settle()

    await expect(value.refetch()).rejects.toThrow('down')
    await settle()

    // A failed background refresh must not blank the view.
    expect(value.status()).toBe('error')
    expect(value.data()).toBe('first')
    dispose()
  })

  it('retries on re-observation even while the failure is fresh', async () => {
    const client = createQueryClient()
    let loads = 0
    const load = async () => {
      loads += 1
      if (loads === 1) {
        throw new Error('down')
      }
      return 'recovered'
    }
    const first = withOwner(() =>
      createQuery<string>({ key: () => ['u'], load, staleTime: 60_000, client })
    )
    await settle()
    expect(first.value.status()).toBe('error')
    first.dispose()

    // An error has nothing worth keeping, so freshness must not strand it.
    const second = withOwner(() =>
      createQuery<string>({ key: () => ['u'], load, staleTime: 60_000, client })
    )
    await settle()
    expect(second.value.data()).toBe('recovered')
    second.dispose()
  })
})

describe('cancel()', () => {
  it('aborts the request and keeps the result usable', async () => {
    const client = createQueryClient()
    let loads = 0
    const { value, dispose } = withOwner(() =>
      createQuery<string>({
        key: () => ['u'],
        load: () =>
          new Promise<string>(() => {
            loads += 1
          }),
        client,
      })
    )
    await settle()
    expect(value.fetchStatus()).toBe('fetching')

    value.cancel()
    await settle()

    // Releasing the observation would abort too, but it also detaches the
    // listener and freezes these signals at loading/fetching forever.
    expect(value.fetchStatus()).toBe('idle')
    expect(value.status()).toBe('idle')

    // Still observing, so it can still be driven — which is the whole point
    // of aborting without releasing.
    void value.refetch().catch(() => undefined)
    await settle()
    expect(loads).toBe(2)
    expect(value.fetchStatus()).toBe('fetching')
    dispose()
  })
})

describe('client-level teardown', () => {
  it('resets an observed query when the cache is cleared', async () => {
    const client = createQueryClient()
    let loads = 0
    const { value, dispose } = withOwner(() =>
      createQuery<string>({
        key: () => ['u'],
        load: async () => `load ${(loads += 1)}`,
        staleTime: 60_000,
        client,
      })
    )
    await settle()
    expect(value.data()).toBe('load 1')

    // Dropping the entry silently would leave the observer reading a value
    // the cache no longer has, while its own reloads populated a different
    // entry it was not watching.
    client.clear()
    await settle()
    expect(loads).toBe(2)
    expect(value.data()).toBe('load 2')
    dispose()
  })

  it('starts no work after an explicit dispose()', async () => {
    const client = createQueryClient()
    const [id, setId] = createSignal(1)
    let loads = 0
    const { value, dispose } = withOwner(() =>
      createQuery<string>({
        key: () => ['u', id()],
        load: async () => `load ${(loads += 1)}`,
        client,
      })
    )
    await settle()
    expect(loads).toBe(1)

    value.dispose()
    setId(2)
    await settle()

    // Signals outlive dispose(); a dead observer must not re-observe or load.
    expect(loads).toBe(1)
    dispose()
  })
})

describe('projection identity', () => {
  it('re-runs select only when the raw value changes', async () => {
    const client = createQueryClient()
    const shared = { id: 1 }
    let selects = 0
    const { value, dispose } = withOwner(() =>
      createQuery<{ id: number }, string>({
        key: () => ['u'],
        // The same object every time, as a cache serving unchanged data does.
        load: async () => shared,
        select: (raw) => {
          selects += 1
          return `id=${raw.id}`
        },
        staleTime: 60_000,
        client,
      })
    )
    await settle()
    // Memos are lazy, so the projection runs on first read.
    const firstProjection = value.data()
    expect(selects).toBe(1)

    await value.refetch()
    await settle()
    await value.refetch()
    await settle()

    // Every notification replaces the state snapshot, so keying the memo on
    // that would re-project for refetches that changed nothing — and hand
    // consumers a new identity each time.
    expect(selects).toBe(1)
    expect(value.data()).toBe(firstProjection)
    dispose()
  })
})

describe('shared requests', () => {
  it('survives one of two observers leaving', async () => {
    const client = createQueryClient()
    let loads = 0
    let release!: (value: string) => void
    const load = () => {
      loads += 1
      return new Promise<string>((resolve) => {
        release = resolve
      })
    }
    const first = withOwner(() =>
      createQuery<string>({ key: () => ['u'], load, client })
    )
    const second = withOwner(() =>
      createQuery<string>({ key: () => ['u'], load, client })
    )
    await settle()
    expect(loads).toBe(1)

    // One leaving is not the last: the other is still waiting on the result.
    first.dispose()
    release('shared')
    await settle()

    expect(second.value.data()).toBe('shared')
    expect(loads).toBe(1)
    second.dispose()
  })
})

describe('client disposal', () => {
  it('starts no replacement load while tearing down', async () => {
    const client = createQueryClient()
    let loads = 0
    const { dispose } = withOwner(() =>
      createQuery<string>({
        key: () => ['u'],
        load: async () => `load ${(loads += 1)}`,
        staleTime: 60_000,
        client,
      })
    )
    await settle()
    expect(loads).toBe(1)

    // Only clear() resets and reloads. Doing it on dispose would run real
    // loaders, with real side effects, into a cache nobody will read again.
    client.dispose()
    await settle()
    expect(loads).toBe(1)
    dispose()
  })
})

describe('policy on a hydrated entry', () => {
  it('claims the observer freshness even when it declines to fetch', async () => {
    const client = createQueryClient()
    client.hydrate({
      queries: [{ key: ['u'], data: 'from server', updatedAt: Date.now() }],
    })
    let loads = 0
    const load = async () => `load ${(loads += 1)}`

    const { value, dispose } = withOwner(() =>
      createQuery<string>({ key: () => ['u'], load, staleTime: 60_000, client })
    )
    await settle()

    expect(loads).toBe(0)
    // fetchQuery is otherwise the only thing that claims policy, so a
    // hydrated entry would keep the default window of 0, read as stale the
    // moment its hydration allowance was spent, and refetch on remount.
    expect(inspectQueryEntry(client, ['u'])?.options.staleTime).toBe(60_000)
    expect(value.isStale()).toBe(false)
    dispose()
  })
})

describe('refetch without an observation', () => {
  it('reloads and projects even while gated off', async () => {
    const client = createQueryClient()
    let loads = 0
    const load = async () => `load ${(loads += 1)}`
    await client.fetchQuery({ key: () => ['u'], load, staleTime: 60_000 })

    const { value, dispose } = withOwner(() =>
      createQuery<string>({
        key: () => ['u'],
        load,
        enabled: false,
        staleTime: 60_000,
        client,
      })
    )
    await settle()

    // `enabled: false` never observes, so there is nothing to mark — and
    // reading the observer's state afterwards would report undefined for a
    // load that succeeded.
    await expect(value.refetch()).resolves.toBe('load 2')
    expect(loads).toBe(2)
    dispose()
  })
})
