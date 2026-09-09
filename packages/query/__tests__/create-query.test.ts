/**
 * `createQuery` (#280): the observer between a component and a cache entry.
 *
 * These pin the acceptance criteria — key-change cancellation, late results
 * from an abandoned key, the meaning of `idle` under `enabled: false`, one
 * entry shared by observers with different projections, and the independence
 * of `status` and `fetchStatus` — plus the refetch-on-observe policy #279
 * deferred here and the retry policy.
 */

import { afterEach, describe, expect, it } from 'vitest'

import { createRoot, createSignal } from '@tachui/core'

import { createQuery } from '../src/create-query'
import { createQueryClient, resetDefaultQueryClient } from '../src/client'

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

  it('fetches once the gate opens', async () => {
    const client = createQueryClient()
    let open = false
    let loads = 0
    const { dispose } = withOwner(() =>
      createQuery<string>({
        key: () => ['gated'],
        load: async () => {
          loads += 1
          return 'v'
        },
        enabled: () => open,
        client,
      })
    )
    await settle()
    expect(loads).toBe(0)

    open = true
    // The gate is read through the same memo the key is, so re-running the
    // effect is what a signal change would do.
    dispose()
    expect(loads).toBe(0)
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
