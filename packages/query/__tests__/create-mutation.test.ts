/**
 * `createMutation` (#281): the imperative write primitive.
 *
 * These pin the acceptance criteria — the success and failure transitions,
 * cancellation, optimistic commit and rollback including a rollback that
 * lands after a concurrent invalidation, and the promise that nothing ever
 * retries — plus the ownership rules that decide which of several concurrent
 * calls the signals describe.
 */

import { afterEach, describe, expect, it, vi } from 'vitest'

import { createRoot } from '@tachui/core'

import { createMutation } from '../src/create-mutation'
import { createQuery } from '../src/create-query'
import {
  createQueryClient,
  inspectQueryEntry,
  resetDefaultQueryClient,
} from '../src/client'
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
 * Lets the run, the hooks, and the cache's write-back chain finish. A
 * macrotask turn drains the microtask queue behind it, which a fixed number of
 * `Promise.resolve()` ticks does not.
 */
async function settle(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0))
}

/** A promise with its settlement exposed, so a test can time the response. */
function deferred<T>(): {
  promise: Promise<T>
  resolve: (value: T) => void
  reject: (error: unknown) => void
} {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((resolveIt, rejectIt) => {
    resolve = resolveIt
    reject = rejectIt
  })
  return { promise, resolve, reject }
}

describe('the success path', () => {
  it('moves idle to pending to success and publishes the result', async () => {
    const gate = deferred<string>()
    const { value: mutation, dispose } = withOwner(() =>
      createMutation<number, string>({
        run: () => gate.promise,
      })
    )

    expect(mutation.status()).toBe('idle')
    expect(mutation.isPending()).toBe(false)

    const settled = mutation.mutate(1)
    // Synchronously pending: a form binds `submitting` to this and has to
    // disable itself on the same turn the submit handler runs.
    expect(mutation.status()).toBe('pending')
    expect(mutation.isPending()).toBe(true)
    expect(mutation.data()).toBeUndefined()

    gate.resolve('created')
    await expect(settled).resolves.toBe('created')

    expect(mutation.status()).toBe('success')
    expect(mutation.isPending()).toBe(false)
    expect(mutation.data()).toBe('created')
    expect(mutation.error()).toBeUndefined()
    dispose()
  })

  it('hands the input and the result to onSuccess and onSettled', async () => {
    const seen: unknown[] = []
    const { value: mutation, dispose } = withOwner(() =>
      createMutation<{ name: string }, string>({
        run: async (input) => `id:${input.name}`,
        onSuccess: (data, input) => {
          seen.push(['success', data, input])
        },
        onSettled: (data, error, input) => {
          seen.push(['settled', data, error, input])
        },
      })
    )

    await mutation.mutate({ name: 'ada' })

    expect(seen).toEqual([
      ['success', 'id:ada', { name: 'ada' }],
      ['settled', 'id:ada', undefined, { name: 'ada' }],
    ])
    dispose()
  })

  it('waits for an async onSuccess before mutate resolves', async () => {
    const order: string[] = []
    const gate = deferred<void>()
    const { value: mutation, dispose } = withOwner(() =>
      createMutation<void, string>({
        run: async () => 'done',
        onSuccess: async () => {
          order.push('onSuccess start')
          await gate.promise
          order.push('onSuccess end')
        },
      })
    )

    const settled = mutation.mutate().then(() => order.push('resolved'))
    await settle()
    expect(order).toEqual(['onSuccess start'])

    gate.resolve()
    await settled
    expect(order).toEqual(['onSuccess start', 'onSuccess end', 'resolved'])
    dispose()
  })

  it('clears the previous result when the next call starts', async () => {
    const { value: mutation, dispose } = withOwner(() =>
      createMutation<number, number>({
        run: async (input) => input * 2,
      })
    )

    await mutation.mutate(1)
    expect(mutation.data()).toBe(2)

    const second = mutation.mutate(5)
    // The previous response is the answer to a different call, not an
    // approximation of this one.
    expect(mutation.data()).toBeUndefined()
    await second
    expect(mutation.data()).toBe(10)
    dispose()
  })
})

describe('the failure path', () => {
  it('publishes the error, rejects, and clears any previous data', async () => {
    const failure = new Error('conflict')
    let shouldFail = false
    const { value: mutation, dispose } = withOwner(() =>
      createMutation<void, string>({
        run: async () => {
          if (shouldFail) {
            throw failure
          }
          return 'ok'
        },
      })
    )

    await mutation.mutate()
    expect(mutation.data()).toBe('ok')

    shouldFail = true
    await expect(mutation.mutate()).rejects.toBe(failure)

    expect(mutation.status()).toBe('error')
    expect(mutation.isPending()).toBe(false)
    expect(mutation.error()).toBe(failure)
    expect(mutation.data()).toBeUndefined()
    dispose()
  })

  it('runs onError and then onSettled, with no context when nothing was optimistic', async () => {
    const failure = new Error('rejected')
    const seen: unknown[] = []
    const { value: mutation, dispose } = withOwner(() =>
      createMutation<string, string>({
        run: async () => {
          throw failure
        },
        onError: (error, input, context) => {
          seen.push(['error', error, input, context])
        },
        onSettled: (data, error, input) => {
          seen.push(['settled', data, error, input])
        },
      })
    )

    await expect(mutation.mutate('a')).rejects.toBe(failure)

    expect(seen).toEqual([
      ['error', failure, 'a', undefined],
      ['settled', undefined, failure, 'a'],
    ])
    dispose()
  })

  it('never retries', async () => {
    let runs = 0
    const { value: mutation, dispose } = withOwner(() =>
      createMutation<void, string>({
        run: async () => {
          runs += 1
          throw new Error('transient')
        },
      })
    )

    await expect(mutation.mutate()).rejects.toThrow('transient')
    await settle()

    // A write that failed halfway is the application's to reason about. One
    // call, one attempt, whatever the failure looked like.
    expect(runs).toBe(1)
    dispose()
  })
})

describe('cancellation', () => {
  it('aborts the run and reports the abort rather than a result', async () => {
    let observed: AbortSignal | undefined
    const gate = deferred<string>()
    const { value: mutation, dispose } = withOwner(() =>
      createMutation<void, string>({
        run: (_input, ctx) => {
          observed = ctx.signal
          return new Promise<string>((resolve, reject) => {
            ctx.signal.addEventListener('abort', () => reject(ctx.signal.reason))
            void gate.promise.then(resolve)
          })
        },
      })
    )

    const settled = mutation.mutate()
    await settle()
    expect(observed?.aborted).toBe(false)

    mutation.cancel()
    await expect(settled).rejects.toThrow()

    expect(observed?.aborted).toBe(true)
    expect(mutation.status()).toBe('error')
    expect((mutation.error() as unknown as DOMException).name).toBe('AbortError')
    dispose()
  })

  it('keeps the cancellation even when the run ignores its signal', async () => {
    const gate = deferred<string>()
    const rolledBack: string[] = []
    const { value: mutation, dispose } = withOwner(() =>
      createMutation<void, string, Error, string>({
        run: () => gate.promise,
        optimisticUpdate: () => 'before',
        onError: (_error, _input, context) => {
          rolledBack.push(context as string)
        },
      })
    )

    const settled = mutation.mutate()
    await settle()
    mutation.cancel()
    // The run never looked at the signal and answers anyway. Honouring that
    // would leave the optimistic update applied after a cancel, with nothing
    // left to undo it.
    gate.resolve('landed anyway')

    await expect(settled).rejects.toThrow()
    expect(mutation.status()).toBe('error')
    expect(mutation.data()).toBeUndefined()
    expect(rolledBack).toEqual(['before'])
    dispose()
  })

  it('does nothing when there is no call in flight', async () => {
    const { value: mutation, dispose } = withOwner(() =>
      createMutation<void, string>({
        run: async () => 'ok',
      })
    )

    await mutation.mutate()
    mutation.cancel()

    expect(mutation.status()).toBe('success')
    expect(mutation.data()).toBe('ok')
    dispose()
  })

  it('ends every call in flight, not only the newest', async () => {
    const signals: AbortSignal[] = []
    const { value: mutation, dispose } = withOwner(() =>
      createMutation<number, string>({
        run: (_input, ctx) => {
          signals.push(ctx.signal)
          return new Promise<string>((_resolve, reject) => {
            ctx.signal.addEventListener('abort', () => reject(ctx.signal.reason))
          })
        },
      })
    )

    const first = mutation.mutate(1)
    const second = mutation.mutate(2)
    await settle()

    mutation.cancel()
    await expect(first).rejects.toThrow()
    await expect(second).rejects.toThrow()

    expect(signals.map((signal) => signal.aborted)).toEqual([true, true])
    dispose()
  })
})

describe('reset', () => {
  it('returns to idle and clears the last result', async () => {
    const { value: mutation, dispose } = withOwner(() =>
      createMutation<void, string>({
        run: async () => 'ok',
      })
    )

    await mutation.mutate()
    mutation.reset()

    expect(mutation.status()).toBe('idle')
    expect(mutation.data()).toBeUndefined()
    expect(mutation.error()).toBeUndefined()
    dispose()
  })

  it('leaves a call in flight running but no longer owning the state', async () => {
    const gate = deferred<string>()
    const invalidated: unknown[] = []
    const client = createQueryClient()
    const { value: mutation, dispose } = withOwner(() =>
      createMutation<void, string>({
        run: () => gate.promise,
        onSuccess: (data) => {
          invalidated.push(data)
        },
        client,
      })
    )

    const settled = mutation.mutate()
    mutation.reset()
    expect(mutation.status()).toBe('idle')

    gate.resolve('landed')
    await expect(settled).resolves.toBe('landed')

    // The write reached the server, so its hooks still run; what the reset
    // undid is the state, which must not quietly repopulate.
    expect(invalidated).toEqual(['landed'])
    expect(mutation.status()).toBe('idle')
    expect(mutation.data()).toBeUndefined()
    dispose()
  })
})

describe('concurrent calls', () => {
  it('lets the latest call own the state when an earlier one lands after it', async () => {
    const first = deferred<string>()
    const second = deferred<string>()
    const { value: mutation, dispose } = withOwner(() =>
      createMutation<number, string>({
        run: (input) => (input === 1 ? first.promise : second.promise),
      })
    )

    const firstCall = mutation.mutate(1)
    const secondCall = mutation.mutate(2)

    second.resolve('second')
    await expect(secondCall).resolves.toBe('second')
    expect(mutation.data()).toBe('second')

    first.resolve('first')
    await expect(firstCall).resolves.toBe('first')

    // Both calls reached the server and both settle their own promise, but
    // the signals describe the call that started last.
    expect(mutation.data()).toBe('second')
    expect(mutation.status()).toBe('success')
    dispose()
  })

  it('does not let a superseded failure paint the state as failed', async () => {
    const first = deferred<string>()
    const second = deferred<string>()
    const { value: mutation, dispose } = withOwner(() =>
      createMutation<number, string>({
        run: (input) => (input === 1 ? first.promise : second.promise),
      })
    )

    const firstCall = mutation.mutate(1)
    const secondCall = mutation.mutate(2)

    second.resolve('second')
    await secondCall

    first.reject(new Error('stale failure'))
    await expect(firstCall).rejects.toThrow('stale failure')

    expect(mutation.status()).toBe('success')
    expect(mutation.error()).toBeUndefined()
    dispose()
  })
})

describe('invalidation on success', () => {
  it('reloads an observed query whose key sits under an invalidated prefix', async () => {
    const client = createQueryClient()
    let loads = 0
    const { value, dispose } = withOwner(() => {
      const users = createQuery<string>({
        key: () => ['users', 1],
        load: async () => {
          loads += 1
          return `user@${loads}`
        },
        client,
      })
      const rename = createMutation<string, string>({
        run: async (input) => input,
        invalidates: [['users']],
        client,
      })
      return { users, rename }
    })
    await settle()
    expect(value.users.data()).toBe('user@1')

    await value.rename.mutate('renamed')
    await settle()

    // Prefix semantics: the mutation names ['users'] and the observer of
    // ['users', 1] is what reloads.
    expect(loads).toBe(2)
    expect(value.users.data()).toBe('user@2')
    dispose()
    client.dispose()
  })

  it('does not invalidate when the mutation fails', async () => {
    const client = createQueryClient()
    let loads = 0
    const { value, dispose } = withOwner(() => {
      const users = createQuery<string>({
        key: () => ['users'],
        load: async () => {
          loads += 1
          return `user@${loads}`
        },
        client,
      })
      const rename = createMutation<void, string>({
        run: async () => {
          throw new Error('nope')
        },
        invalidates: [['users']],
        client,
      })
      return { users, rename }
    })
    await settle()
    expect(loads).toBe(1)

    await expect(value.rename.mutate()).rejects.toThrow('nope')
    await settle()

    expect(loads).toBe(1)
    dispose()
    client.dispose()
  })

  it('invalidates before onSuccess runs, so the hook sees the reload already ordered', async () => {
    const client = createQueryClient()
    const { value: mutation, dispose } = withOwner(() =>
      createMutation<void, string>({
        run: async () => 'ok',
        invalidates: [['users']],
        onSuccess: () => {
          const entry = inspectQueryEntry(client, ['users'])
          expect(entry?.invalidated).toBe(true)
        },
        client,
      })
    )

    await client.fetchQuery<string>({
      key: () => ['users'],
      load: async () => 'cached',
    })
    expect(inspectQueryEntry(client, ['users'])?.invalidated).toBe(false)

    await mutation.mutate()
    dispose()
    client.dispose()
  })

  it('needs no client at all when nothing is invalidated', async () => {
    // A mutation that never touches the cache must not require one. Checked
    // where there is no implicit client to fall back on, because that is
    // where demanding one bites: a server-rendered form would throw for a
    // dependency it does not have.
    vi.stubGlobal('document', undefined)
    try {
      const { value: mutation, dispose } = withOwner(() =>
        createMutation<void, string>({
          run: async () => 'ok',
        })
      )
      await expect(mutation.mutate()).resolves.toBe('ok')
      dispose()
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('reports the missing client when there is something to invalidate', () => {
    vi.stubGlobal('document', undefined)
    try {
      expect(() =>
        withOwner(() =>
          createMutation<void, string>({
            run: async () => 'ok',
            invalidates: [['users']],
          })
        )
      ).toThrow(QueryError)
    } finally {
      vi.unstubAllGlobals()
    }
  })
})

describe('optimistic updates', () => {
  it('applies the update before the run and keeps it on success', async () => {
    const order: string[] = []
    const gate = deferred<string>()
    const { value: mutation, dispose } = withOwner(() =>
      createMutation<string, string, Error, string>({
        run: (input) => {
          order.push(`run:${input}`)
          return gate.promise
        },
        optimisticUpdate: (input) => {
          order.push(`optimistic:${input}`)
          return 'previous'
        },
        onError: () => {
          order.push('rollback')
        },
      })
    )

    const settled = mutation.mutate('next')
    expect(order).toEqual(['optimistic:next', 'run:next'])

    gate.resolve('server')
    await settled

    // The server stays authoritative: nothing rolls back, and what the
    // mutation publishes is the response rather than the optimistic guess.
    expect(order).toEqual(['optimistic:next', 'run:next'])
    expect(mutation.data()).toBe('server')
    dispose()
  })

  it('hands the context to onError so the change can be undone', async () => {
    let displayed = 'saved'
    const failure = new Error('server said no')
    const { value: mutation, dispose } = withOwner(() =>
      createMutation<string, string, Error, string>({
        run: async () => {
          throw failure
        },
        optimisticUpdate: (input) => {
          const previous = displayed
          displayed = input
          return previous
        },
        onError: (_error, _input, context) => {
          displayed = context as string
        },
      })
    )

    await expect(mutation.mutate('typed')).rejects.toBe(failure)

    expect(displayed).toBe('saved')
    expect(mutation.error()).toBe(failure)
    dispose()
  })

  it('rolls back after a concurrent invalidation without resurrecting the stale value', async () => {
    const client = createQueryClient()
    let serverName = 'ada'
    let optimisticName: string | undefined
    const failure = new Error('rejected')
    const runGate = deferred<string>()

    const { value, dispose } = withOwner(() => {
      const profile = createQuery<string>({
        key: () => ['profile'],
        load: async () => serverName,
        client,
      })
      const rename = createMutation<string, string, Error, string | undefined>({
        run: () => runGate.promise,
        optimisticUpdate: (input) => {
          const previous = optimisticName
          optimisticName = input
          return previous
        },
        onError: (_error, _input, context) => {
          optimisticName = context
        },
        client,
      })
      return { profile, rename }
    })
    await settle()
    expect(value.profile.data()).toBe('ada')

    const settled = value.rename.mutate('grace')
    expect(optimisticName).toBe('grace')

    // Something else changes the same resource while the mutation is in
    // flight — another tab, a subscription, a sibling mutation — and the
    // query reloads underneath it.
    serverName = 'lovelace'
    client.invalidate(['profile'])
    await settle()
    expect(value.profile.data()).toBe('lovelace')

    runGate.reject(failure)
    await expect(settled).rejects.toBe(failure)

    // The rollback undoes only what the optimistic update did. The value the
    // concurrent reload produced is newer than anything this mutation saw and
    // must survive it.
    expect(optimisticName).toBeUndefined()
    expect(value.profile.data()).toBe('lovelace')
    dispose()
    client.dispose()
  })

  it('reaches onError with no context when the optimistic update itself throws', async () => {
    const failure = new Error('bad optimistic write')
    let runs = 0
    const seen: unknown[] = []
    const { value: mutation, dispose } = withOwner(() =>
      createMutation<string, string, Error, string>({
        run: async () => {
          runs += 1
          return 'unreachable'
        },
        optimisticUpdate: () => {
          throw failure
        },
        onError: (error, input, context) => {
          seen.push([error, input, context])
        },
      })
    )

    await expect(mutation.mutate('x')).rejects.toBe(failure)

    // There is nothing to roll back, and nothing was sent: the failure still
    // travels the one path every failure takes.
    expect(runs).toBe(0)
    expect(seen).toEqual([[failure, 'x', undefined]])
    expect(mutation.status()).toBe('error')
    dispose()
  })
})

describe('hooks that throw', () => {
  it('rejects with a throwing onSuccess while keeping the state successful', async () => {
    const hookFailure = new Error('cache write blew up')
    const { value: mutation, dispose } = withOwner(() =>
      createMutation<void, string>({
        run: async () => 'written',
        onSuccess: () => {
          throw hookFailure
        },
      })
    )

    await expect(mutation.mutate()).rejects.toBe(hookFailure)

    // The write happened. Saying otherwise would show a failure for a record
    // the server holds.
    expect(mutation.status()).toBe('success')
    expect(mutation.data()).toBe('written')
    expect(mutation.error()).toBeUndefined()
    dispose()
  })

  it('still runs onSettled when onSuccess throws', async () => {
    const settledWith: unknown[] = []
    const { value: mutation, dispose } = withOwner(() =>
      createMutation<void, string>({
        run: async () => 'written',
        onSuccess: () => {
          throw new Error('hook')
        },
        onSettled: (data, error) => {
          settledWith.push([data, error])
        },
      })
    )

    await expect(mutation.mutate()).rejects.toThrow('hook')
    expect(settledWith).toEqual([['written', undefined]])
    dispose()
  })

  it('keeps the server error when the rollback itself throws', async () => {
    const failure = new Error('server said no')
    const { value: mutation, dispose } = withOwner(() =>
      createMutation<void, string, Error, string>({
        run: async () => {
          throw failure
        },
        optimisticUpdate: () => 'previous',
        onError: () => {
          throw new Error('rollback is broken')
        },
      })
    )

    // The caller is already being told the write failed; replacing that with
    // the rollback's own bug would hide the answer they branch on.
    await expect(mutation.mutate()).rejects.toBe(failure)
    expect(mutation.error()).toBe(failure)
    dispose()
  })

  it('rejects with a throwing onSettled while keeping the state successful', async () => {
    const hookFailure = new Error('settled hook blew up')
    const { value: mutation, dispose } = withOwner(() =>
      createMutation<void, string>({
        run: async () => 'written',
        onSettled: () => {
          throw hookFailure
        },
      })
    )

    await expect(mutation.mutate()).rejects.toBe(hookFailure)
    expect(mutation.status()).toBe('success')
    expect(mutation.data()).toBe('written')
    dispose()
  })

  it('reports the earlier hook failure when both success hooks throw', async () => {
    const first = new Error('onSuccess')
    const { value: mutation, dispose } = withOwner(() =>
      createMutation<void, string>({
        run: async () => 'written',
        onSuccess: () => {
          throw first
        },
        onSettled: () => {
          throw new Error('onSettled')
        },
      })
    )

    // First failure wins, on this path as on the other: the later throw
    // happened while already unwinding the earlier one.
    await expect(mutation.mutate()).rejects.toBe(first)
    dispose()
  })

  it('keeps the server error when onSettled throws on the failure path', async () => {
    const failure = new Error('server said no')
    const { value: mutation, dispose } = withOwner(() =>
      createMutation<void, string>({
        run: async () => {
          throw failure
        },
        onSettled: () => {
          throw new Error('settled hook is broken')
        },
      })
    )

    await expect(mutation.mutate()).rejects.toBe(failure)
    expect(mutation.error()).toBe(failure)
    dispose()
  })

  it('still runs onSuccess when an invalidation prefix is unusable', async () => {
    const client = createQueryClient()
    let calledOnSuccess = false
    const { value: mutation, dispose } = withOwner(() =>
      createMutation<void, string>({
        run: async () => 'ok',
        // A function segment cannot be hashed (#278): a programmer error, and
        // one that must not also swallow the application's own hook.
        invalidates: [[() => 'not hashable']],
        onSuccess: () => {
          calledOnSuccess = true
        },
        client,
      })
    )

    await expect(mutation.mutate()).rejects.toBeInstanceOf(QueryError)
    expect(calledOnSuccess).toBe(true)
    expect(mutation.status()).toBe('success')
    dispose()
    client.dispose()
  })
})

describe('ownership', () => {
  it('aborts a call in flight when the owner is disposed', async () => {
    let observed: AbortSignal | undefined
    const { value: mutation, dispose } = withOwner(() =>
      createMutation<void, string>({
        run: (_input, ctx) => {
          observed = ctx.signal
          return new Promise<string>((_resolve, reject) => {
            ctx.signal.addEventListener('abort', () => reject(ctx.signal.reason))
          })
        },
      })
    )

    const settled = mutation.mutate()
    await settle()
    dispose()

    await expect(settled).rejects.toThrow()
    expect(observed?.aborted).toBe(true)
  })

  it('refuses a call started after disposal', async () => {
    const { value: mutation, dispose } = withOwner(() =>
      createMutation<void, string>({
        run: async () => 'ok',
      })
    )
    dispose()

    await expect(mutation.mutate()).rejects.toBeInstanceOf(QueryError)
  })

  it('undoes an optimistic change when the call lands after disposal', async () => {
    const gate = deferred<string>()
    let displayed = 'saved'
    const { value: mutation, dispose } = withOwner(() =>
      createMutation<string, string, Error, string>({
        run: () => gate.promise,
        optimisticUpdate: (input) => {
          const previous = displayed
          displayed = input
          return previous
        },
        onError: (_error, _input, context) => {
          displayed = context as string
        },
      })
    )

    const settled = mutation.mutate('typed')
    expect(displayed).toBe('typed')
    dispose()
    // Disposal aborted the call, so a run that answers anyway is treated the
    // way a cancelled one is: the abort wins, and the rollback still runs.
    // An optimistic change usually touches state outside this owner, and
    // leaving it applied would outlive the component that made it.
    gate.resolve('late')

    await expect(settled).rejects.toThrow()
    expect(displayed).toBe('saved')
  })
})
