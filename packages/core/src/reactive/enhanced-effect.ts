/**
 * Enhanced Effect System v2.0
 *
 * Provides proper error propagation and integrates with the unified scheduler
 * to fix silent error suppression and incomplete cleanup issues.
 */

import { getCurrentComputation, getCurrentOwner } from './context'
import type { Owner } from './types'
import { type ReactiveNode, ReactiveScheduler, UpdatePriority } from './unified-scheduler'

let effectIdCounter = 0

export interface EffectOptions {
  priority?: UpdatePriority
  debugName?: string
  onError?: (error: Error) => void
  fireImmediately?: boolean
}

/**
 * Enhanced effect implementation with proper error propagation
 */
export class EffectImpl implements ReactiveNode {
  readonly id = ++effectIdCounter
  readonly type = 'effect' as const
  readonly priority: UpdatePriority
  readonly sources = new Set<any>()
  readonly observers = new Set<never>() // Effects don't have observers

  private isDisposed = false
  private cleanupFn?: () => void
  private options: EffectOptions
  private owner: Owner | null

  constructor(
    private effectFn: () => undefined | (() => void),
    options: EffectOptions = {}
  ) {
    this.priority = options.priority ?? UpdatePriority.Normal
    this.options = options
    this.owner = getCurrentOwner()

    if (options.fireImmediately !== false) {
      this.execute()
    }
  }

  /**
   * Notify method called by unified scheduler
   */
  notify(): void {
    if (this.isDisposed) return

    this.execute()
  }

  /**
   * Execute the effect with proper error handling
   */
  private execute(): void {
    if (this.isDisposed) return

    // Cleanup previous effect run
    if (this.cleanupFn) {
      try {
        this.cleanupFn()
      } catch (error) {
        console.error('Effect cleanup error:', error)
      }
      this.cleanupFn = undefined
    }

    // Clear existing dependencies
    for (const source of this.sources) {
      if ('removeObserver' in source && typeof source.removeObserver === 'function') {
        source.removeObserver(this)
      } else if ('observers' in source && source.observers instanceof Set) {
        source.observers.delete(this)
      }
    }
    this.sources.clear()

    // Execute effect with dependency tracking
    const previousComputation = getCurrentComputation()
    // We need to set this as the current computation for dependency tracking
    const setCurrentComputation = (this as any).setCurrentComputation || (() => {})
    setCurrentComputation(this)

    try {
      const result = this.effectFn()

      // Store cleanup function if returned
      if (typeof result === 'function') {
        this.cleanupFn = result
      }
    } catch (error) {
      if (this.options.onError) {
        try {
          this.options.onError(error as Error)
        } catch (handlerError) {
          console.error('Effect error handler threw error:', handlerError)
          // Re-throw the original error since handler failed
          throw error
        }
      } else {
        // Don't suppress errors like the old implementation - re-throw them
        console.error(`Effect ${this.options.debugName || this.id} threw error:`, error)
        throw error
      }
    } finally {
      setCurrentComputation(previousComputation)
    }
  }

  /**
   * Complete cleanup for memory management
   */
  cleanup(): void {
    this.isDisposed = true

    // Cleanup effect function
    if (this.cleanupFn) {
      try {
        this.cleanupFn()
      } catch (error) {
        console.error('Effect cleanup error:', error)
      }
      this.cleanupFn = undefined
    }

    // Remove from all sources
    for (const source of this.sources) {
      if ('removeObserver' in source && typeof source.removeObserver === 'function') {
        source.removeObserver(this)
      } else if ('observers' in source && source.observers instanceof Set) {
        source.observers.delete(this)
      }
    }
    this.sources.clear()

    // Remove from owner cleanup
    if (this.owner?.cleanups) {
      const index = this.owner.cleanups.indexOf(this.cleanup.bind(this))
      if (index >= 0) {
        this.owner.cleanups.splice(index, 1)
      }
    }
  }

  /**
   * Dispose the effect (alias for cleanup)
   */
  dispose(): void {
    this.cleanup()
  }

  /**
   * Check if effect is disposed
   */
  get disposed(): boolean {
    return this.isDisposed
  }

  /**
   * Debug information
   */
  [Symbol.for('tachui.debug')](): object {
    return {
      id: this.id,
      type: this.type,
      priority: UpdatePriority[this.priority],
      debugName: this.options.debugName,
      disposed: this.isDisposed,
      sourceCount: this.sources.size,
      hasCleanup: !!this.cleanupFn,
    }
  }

  toString(): string {
    return `Effect(${this.options.debugName || this.id})`
  }
}

/**
 * Create a reactive effect with proper error handling
 *
 * @param effectFn The effect function to run
 * @param options Effect configuration options
 * @returns Cleanup function to dispose the effect
 *
 * @example
 * ```typescript
 * const [count, setCount] = createSignal(0)
 *
 * const cleanup = createEnhancedEffect(() => {
 *   console.log('Count changed:', count())
 * }, {
 *   debugName: 'countLogger',
 *   onError: (error) => {
 *     console.error('Effect failed:', error)
 *   }
 * })
 *
 * // Later, cleanup when no longer needed
 * cleanup()
 * ```
 */
export function createEnhancedEffect(
  effectFn: () => undefined | (() => void),
  options?: EffectOptions
): () => void {
  const effect = new EffectImpl(effectFn, options)

  // Register cleanup with owner if available
  const owner = getCurrentOwner()
  if (owner) {
    owner.cleanups.push(() => effect.cleanup())
  }

  return () => effect.cleanup()
}

/**
 * Create an effect with high priority for user interactions
 */
export function createHighPriorityEffect(
  effectFn: () => undefined | (() => void),
  options?: Omit<EffectOptions, 'priority'>
): () => void {
  return createEnhancedEffect(effectFn, { ...options, priority: UpdatePriority.High })
}

/**
 * Create an effect with low priority for background tasks
 */
export function createLowPriorityEffect(
  effectFn: () => undefined | (() => void),
  options?: Omit<EffectOptions, 'priority'>
): () => void {
  return createEnhancedEffect(effectFn, { ...options, priority: UpdatePriority.Low })
}

/**
 * Create an effect that only runs when dependencies change (not immediately)
 */
export function createWatchEffect(
  effectFn: () => undefined | (() => void),
  options?: Omit<EffectOptions, 'fireImmediately'>
): () => void {
  return createEnhancedEffect(effectFn, { ...options, fireImmediately: false })
}

/**
 * Create an effect with automatic error recovery
 */
export function createResilientEffect(
  effectFn: () => undefined | (() => void),
  onError?: (error: Error, attempt: number) => boolean, // return true to retry
  maxRetries = 3,
  options?: EffectOptions
): () => void {
  let attempt = 0

  const resilientFn = () => {
    try {
      return effectFn()
    } catch (error) {
      attempt++

      if (onError && attempt <= maxRetries && onError(error as Error, attempt)) {
        // Retry after a short delay
        setTimeout(() => resilientFn(), attempt * 100)
        return
      } else {
        // Give up and re-throw
        throw error
      }
    }
  }

  return createEnhancedEffect(resilientFn, {
    ...options,
    debugName: `${options?.debugName || 'effect'}(resilient)`,
  })
}

/**
 * Batch multiple effect creations for performance
 */
export function createEffectBatch(
  effects: Array<{
    fn: () => undefined | (() => void)
    options?: EffectOptions
  }>
): () => void {
  const cleanups = effects.map(({ fn, options }) => createEnhancedEffect(fn, options))

  return () => {
    cleanups.forEach((cleanup) => cleanup())
  }
}

/**
 * Get performance metrics for all effects
 */
export function getEffectPerformanceMetrics() {
  const scheduler = ReactiveScheduler.getInstance()
  return scheduler.getPerformanceMetrics()
}

/**
 * Flush all pending effect updates synchronously
 */
export function flushEffectUpdates(): void {
  const scheduler = ReactiveScheduler.getInstance()
  scheduler.flushSync()
}
