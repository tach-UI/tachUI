/**
 * Effect implementation for side effects in reactive system
 *
 * Effects run when their dependencies change, enabling reactive
 * side effects like DOM updates, logging, API calls, etc.
 */

import { ComputationImpl, getCurrentOwner } from './context'
import type { EffectFunction, EffectOptions } from './types'

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
 */
export function createEffect<T>(fn: EffectFunction<T>, options: EffectOptions = {}): Effect {
  const owner = getCurrentOwner()

  let previousValue: T | undefined
  let isFirst = true

  const effectFn = () => {
    const nextValue = fn(previousValue)

    if (!isFirst) {
      previousValue = nextValue
    } else {
      isFirst = false
      previousValue = nextValue
    }

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
    if (!hasRun) {
      hasRun = true
      // Track dependencies but don't run the effect
      return fn(previousValue)
    }

    const nextValue = fn(previousValue)
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
