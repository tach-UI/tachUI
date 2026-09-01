/**
 * Effect implementation for side effects in reactive system
 *
 * Effects run when their dependencies change, enabling reactive
 * side effects like DOM updates, logging, API calls, etc.
 */

import { ComputationImpl, getCurrentOwner } from './context'
import type { CleanupFunction, EffectFunction, EffectOptions } from './types'

/**
 * Effect function type
 */
export type Effect = ComputationImpl

/**
 * Create a reactive effect that runs when dependencies change
 *
 * @param fn The effect function to run
 * @param options Effect configuration options
 * @returns The effect computation
 *
 * An effect may return a disposer function. It runs before the effect's next
 * execution and again when the effect is disposed, which is what makes it safe
 * to own a resource — a subscription, a timer, an in-flight request — from
 * inside an effect body.
 *
 * @example
 * ```typescript
 * const [count, setCount] = createSignal(0)
 *
 * createEffect(() => {
 *   console.log('Count changed:', count())
 * })
 *
 * setCount(5) // Logs: "Count changed: 5"
 * ```
 *
 * @example Returning a disposer
 * ```typescript
 * createEffect(() => {
 *   const controller = new AbortController()
 *   void fetch(`/api/item/${id()}`, { signal: controller.signal })
 *
 *   // Aborts the previous request when `id` changes, and on disposal.
 *   return () => controller.abort()
 * })
 * ```
 */
export function createEffect<T>(fn: EffectFunction<T>, options: EffectOptions = {}): Effect {
  const owner = getCurrentOwner()

  let previousValue: T | undefined

  const effectFn = () => {
    const nextValue = fn(previousValue)

    // A returned function is a disposer, not a value (#270). It is registered
    // last, so it runs after any onCleanup the same run registered, and the
    // next run receives `undefined` rather than the disposer: an effect uses
    // the disposer protocol or the previousValue protocol, never both.
    if (typeof nextValue === 'function') {
      effect.addCleanup(nextValue as CleanupFunction)
      previousValue = undefined
      return undefined
    }

    previousValue = nextValue
    return nextValue
  }

  // Create the computation
  const effect = new ComputationImpl(effectFn, owner)

  // Add debug name if provided
  if (options.name) {
    Object.defineProperty(effect, 'name', {
      value: options.name,
      enumerable: false,
    })
  }

  // Execute immediately to establish dependencies
  effect.execute()

  return effect
}

/**
 * Create an effect that only runs after dependencies change (not on first run)
 *
 * @param fn The effect function to run
 * @param options Effect configuration options
 * @returns The effect computation
 *
 * @example
 * ```typescript
 * const [count, setCount] = createSignal(0)
 *
 * createRenderEffect(() => {
 *   // This won't run immediately, only when count changes
 *   document.title = `Count: ${count()}`
 * })
 * ```
 */
export function createRenderEffect<T>(fn: EffectFunction<T>, options: EffectOptions = {}): Effect {
  const owner = getCurrentOwner()

  let previousValue: T | undefined
  let hasRun = false

  const effectFn = () => {
    const nextValue = fn(previousValue)

    // Same disposer protocol as createEffect (#270).
    if (typeof nextValue === 'function') {
      effect.addCleanup(nextValue as CleanupFunction)
      previousValue = undefined
      hasRun = true
      return undefined
    }

    // Unchanged from before #270: the first run does not seed previousValue.
    if (!hasRun) {
      hasRun = true
      return nextValue
    }

    previousValue = nextValue
    return nextValue
  }

  const effect = new ComputationImpl(effectFn, owner)

  if (options.name) {
    Object.defineProperty(effect, 'name', {
      value: options.name,
      enumerable: false,
    })
  }

  // Execute to establish dependencies but not run the actual effect
  effect.execute()

  return effect
}

/**
 * Create a one-time effect that disposes itself after first execution
 *
 * Deliberately does not take part in the returned-disposer protocol (#270).
 * The effect disposes itself from inside its own body, so a returned disposer
 * would fire immediately on the same tick — useless, and surprising enough to
 * be worse than ignoring it. Use `onCleanup` here if teardown is needed.
 *
 * @param fn The effect function to run once
 * @param options Effect configuration options
 * @returns The effect computation
 */
export function createOnceEffect<T>(fn: EffectFunction<T>, options: EffectOptions = {}): Effect {
  const owner = getCurrentOwner()

  const effectFn = () => {
    const result = fn(undefined)
    // Dispose the effect after first run
    effect.dispose()
    return result
  }

  const effect = new ComputationImpl(effectFn, owner)

  if (options.name) {
    Object.defineProperty(effect, 'name', {
      value: `${options.name}(once)`,
      enumerable: false,
    })
  }

  effect.execute()

  return effect
}

/**
 * Create an effect that runs synchronously (not batched)
 *
 * @param fn The effect function to run
 * @param options Effect configuration options
 * @returns The effect computation
 */
export function createSyncEffect<T>(fn: EffectFunction<T>, options: EffectOptions = {}): Effect {
  // TODO: Implement synchronous execution
  // For now, use regular effect
  return createEffect(fn, { ...options, name: `${options.name || 'sync'}(sync)` })
}

/**
 * Dispose an effect
 */
export function disposeEffect(effect: Effect): void {
  effect.dispose()
}

/**
 * Check if an effect is disposed
 */
export function isEffectDisposed(effect: Effect): boolean {
  return effect.state === 3 // ComputationState.Disposed
}

/**
 * Get effect debug information
 */
export function getEffectInfo(effect: Effect): object {
  return {
    id: effect.id,
    name: (effect as any).name || 'anonymous',
    state: effect.state,
    sourceCount: effect.sources.size,
    observerCount: effect.observers.size,
    disposed: isEffectDisposed(effect),
    type: 'Effect',
  }
}

// Re-export types
export type { EffectFunction, EffectOptions }
