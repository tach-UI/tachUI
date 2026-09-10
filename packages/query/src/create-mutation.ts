/**
 * `createMutation` — the imperative write primitive (#281).
 *
 * A mutation is a one-shot the caller starts, so it has none of a query's
 * ambiguity about what a request means: there is no separate fetch status, no
 * background refresh, and nothing that starts on its own. `mutate` is the only
 * thing that runs `run`, and nothing retries — a write that failed halfway is
 * the application's to reason about, not this package's to repeat.
 *
 * What it owns beyond the call itself is the state a form binds to
 * (`isPending`, `error`), the invalidation that follows a successful write,
 * and the optimistic update's rollback. The server stays authoritative
 * throughout: an optimistic change is opt-in, and the value that survives is
 * whatever the invalidated queries reload.
 */

import { createMemo, createSignal, onCleanup } from '@tachui/core'

import { useQueryClient } from './client'
import { QueryError } from './errors'
import type {
  MutationOptions,
  MutationResult,
  MutationStatus,
  QueryClient,
  QueryKey,
} from './types'

/**
 * Creates a mutation bound to the calling owner.
 *
 * The returned signals describe the most recently started call. Concurrent
 * calls are allowed — two submits of the same form both reach the server —
 * but only the latest owns the state, so an earlier one landing afterwards
 * cannot overwrite what the current one is showing. Every call still runs its
 * own hooks and settles its own promise, because a write that happened has to
 * be able to invalidate and to roll back whether or not anyone is still
 * rendering its result.
 */
export function createMutation<I, O, E = Error, TContext = unknown>(
  options: MutationOptions<I, O, E, TContext>
): MutationResult<I, O, E> {
  const invalidates: readonly QueryKey[] = options.invalidates ?? []
  /**
   * Resolved at creation rather than inside `mutate`: the ambient client
   * comes from the component context, and by the time an event handler fires
   * that context is gone.
   *
   * Resolved only when there is something to invalidate. A mutation that
   * never touches the cache — a plain form submit, which is the common one —
   * would otherwise have to be handed a client it will not use, and on the
   * server, where there is no implicit fallback, rendering that form would
   * throw for a dependency it does not have.
   */
  const client: QueryClient | undefined =
    options.client ?? (invalidates.length > 0 ? useQueryClient() : undefined)

  const [statusValue, setStatus] = createSignal<MutationStatus>('idle')
  const [dataValue, setData] = createSignal<O | undefined>(undefined)
  const [errorValue, setError] = createSignal<E | undefined>(undefined)

  /**
   * Identifies the call that owns the signals. Bumped by `mutate`, so a newer
   * call takes ownership, and by `reset`, so a call already in flight loses it
   * and cannot quietly undo the reset when it lands.
   */
  let latest = 0
  /**
   * Requests still running, so `cancel()` and owner disposal can end all of
   * them. A call removes itself as it settles.
   */
  const inFlight = new Set<AbortController>()
  let disposed = false

  function owns(generation: number): boolean {
    return generation === latest && !disposed
  }

  function abortAll(): void {
    // Copied: aborting settles the call, which removes it from the set.
    for (const controller of [...inFlight]) {
      controller.abort()
    }
  }

  /**
   * Runs the success hooks and reports the first failure among them.
   *
   * Invalidation and `onSuccess` are attempted independently: an unhashable
   * prefix is a programmer error, and letting it skip the application's own
   * hook would turn one mistake into two. `onSettled` runs on both paths, so
   * it appears here and in `settleError` rather than wrapped around either.
   */
  async function runSuccessHooks(value: O, input: I): Promise<void> {
    let failure: unknown
    let failed = false
    if (client !== undefined) {
      try {
        for (const prefix of invalidates) {
          client.invalidate(prefix)
        }
      } catch (hookError) {
        failure = hookError
        failed = true
      }
    }
    try {
      await options.onSuccess?.(value, input)
    } catch (hookError) {
      if (!failed) {
        failure = hookError
        failed = true
      }
    }
    try {
      await options.onSettled?.(value, undefined, input)
    } catch (hookError) {
      if (!failed) {
        failure = hookError
        failed = true
      }
    }
    if (failed) {
      throw failure
    }
  }

  /**
   * Publishes a failure, gives `onError` its chance to undo an optimistic
   * update, and rejects.
   *
   * `mutate` rejects with the error the mutation itself produced, not with
   * whatever a hook threw on top of it: the caller is already being told the
   * write failed, and replacing that with a rollback's own bug would hide the
   * server's answer from the code branching on it. The first failure wins on
   * either path — on the success path the hook's error is the only one there
   * is, so that is what surfaces.
   */
  async function settleError(
    failure: E,
    input: I,
    context: TContext | undefined,
    generation: number
  ): Promise<never> {
    if (owns(generation)) {
      setData(() => undefined)
      setError(() => failure)
      setStatus('error')
    }
    try {
      await options.onError?.(failure, input, context)
    } catch {
      // Swallowed deliberately; see this function's note on which error wins.
    }
    try {
      await options.onSettled?.(undefined, failure, input)
    } catch {
      // Same.
    }
    throw failure
  }

  async function mutate(input: I): Promise<O> {
    if (disposed) {
      throw new QueryError(
        'mutate() was called after its owner was disposed. A mutation is bound to the owner that created it; create one in the component that submits it, or hold it in an owner that outlives the call.'
      )
    }
    const generation = (latest += 1)
    const controller = new AbortController()
    inFlight.add(controller)
    // Cleared rather than preserved: unlike a query's data, which is the same
    // resource being refreshed, this is the result of one specific call. The
    // previous call's response is not an approximation of this one's.
    setData(() => undefined)
    setError(() => undefined)
    setStatus('pending')

    let context: TContext | undefined
    try {
      context = options.optimisticUpdate?.(input)
    } catch (optimisticError) {
      // `run` never starts, so the state this was to be optimistic about was
      // never changed. It still reaches `onError`, with nothing to roll back,
      // so one hook covers every path that ends in failure.
      inFlight.delete(controller)
      return await settleError(
        optimisticError as E,
        input,
        undefined,
        generation
      )
    }

    let value: O
    try {
      value = await options.run(input, { signal: controller.signal })
    } catch (runError) {
      inFlight.delete(controller)
      return await settleError(
        controller.signal.aborted
          ? (controller.signal.reason as E)
          : (runError as E),
        input,
        context,
        generation
      )
    }
    inFlight.delete(controller)

    if (controller.signal.aborted) {
      // A `run` that ignores its signal can resolve after the abort. The
      // cancellation still wins: an optimistic update has to be rolled back,
      // and a caller who cancelled and then saw `success` would have no way to
      // tell which of the two had happened.
      return await settleError(
        controller.signal.reason as E,
        input,
        context,
        generation
      )
    }

    if (owns(generation)) {
      setError(() => undefined)
      setData(() => value)
      setStatus('success')
    }
    await runSuccessHooks(value, input)
    return value
  }

  onCleanup(() => {
    disposed = true
    abortAll()
  })

  return {
    // Published as memos rather than as the raw setters' getters: a `Signal`
    // is a getter that also carries `peek`, and that is what a consumer
    // reading one outside a computation needs.
    status: createMemo(() => statusValue()),
    data: createMemo(() => dataValue()),
    error: createMemo(() => errorValue()),
    isPending: createMemo(() => statusValue() === 'pending'),

    mutate,

    reset: () => {
      // Ownership is given up rather than the request aborted: the write may
      // already have reached the server, and `cancel()` is what says to stop
      // it. What this undoes is the state, so a call still running lands on a
      // result nobody is holding.
      latest += 1
      setStatus('idle')
      setData(() => undefined)
      setError(() => undefined)
    },

    cancel: () => {
      // Every call still running, not only the newest: they are all this
      // mutation's, and leaving an older one alive would let it invalidate and
      // roll back after the caller said to stop.
      abortAll()
    },
  }
}
