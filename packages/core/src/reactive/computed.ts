/**
 * Computed values implementation
 *
 * Computed values are derived reactive values that automatically
 * update when their dependencies change, with memoization.
 */

import { ComputationImpl, getCurrentComputation, getCurrentOwner } from './context'
import { defaultEquals, type EqualityFunction } from './equality'
import type { Computation, Signal } from './types'
import { ComputationState } from './types'
import { type ReactiveNode, UpdatePriority } from './unified-scheduler'

export interface ComputedOptions<T> {
  equals?: EqualityFunction<T>
  priority?: UpdatePriority
  debugName?: string
  onError?: (error: Error) => T // Error recovery function
}

/**
 * Robust computed value implementation with error recovery
 */
class ComputedImpl<T> extends ComputationImpl implements ReactiveNode {
  readonly type = 'computed' as const
  readonly priority: UpdatePriority

  private _hasValue = false
  private _error: Error | null = null
  private equalsFn: EqualityFunction<T>
  private options: ComputedOptions<T>

  constructor(fn: () => T, options: ComputedOptions<T> = {}, owner = getCurrentOwner()) {
    super(fn, owner)
    this.priority = options.priority ?? UpdatePriority.Normal
    this.equalsFn = options.equals ?? defaultEquals
    this.options = options
  }

  /**
   * Get the computed value, tracking dependency and lazily computing
   */
  getValue(): T {
    // Track this computed as a dependency if we're in a reactive context
    const computation = getCurrentComputation()
    if (computation && computation.state !== ComputationState.Disposed) {
      this.observers.add(computation)
      computation.sources.add(this)
    }

    // Compute value if needed
    if (this.state === ComputationState.Dirty || !this._hasValue) {
      this.execute()
      this._hasValue = true
    }

    return this.value
  }

  /**
   * Get the current value without tracking dependency
   */
  peek(): T {
    if (this.state === ComputationState.Dirty || !this._hasValue) {
      this.execute()
      this._hasValue = true
    }
    return this.value
  }

  /**
   * Remove an observer (cleanup)
   */
  removeObserver(computation: Computation): void {
    this.observers.delete(computation)
  }

  /**
   * Execute the computation and notify observers
   */
  execute(): T {
    const previousValue = this._hasValue ? this.value : undefined
    const result = super.execute()

    // Only notify observers if the value actually changed
    if (!this._hasValue || !this.equalsFn(previousValue, result)) {
      // Notify dependent computations
      for (const observer of this.observers) {
        if (observer.state !== ComputationState.Disposed) {
          observer.state = ComputationState.Dirty
          // Use the signal's scheduling mechanism for consistency
          if ('execute' in observer && typeof observer.execute === 'function') {
            queueMicrotask(() => {
              if (observer.state === ComputationState.Dirty) {
                observer.execute()
              }
            })
          }
        }
      }
    }

    return result
  }

  /**
   * Notify method for ReactiveNode compatibility
   */
  notify(): void {
    // For computations, notify means execute
    this.execute()
  }

  /**
   * Complete cleanup for memory management
   */
  cleanup(): void {
    // Complete bidirectional cleanup
    for (const source of this.sources) {
      if ('removeObserver' in source) {
        ;(source as any).removeObserver(this)
      }
    }
    this.sources.clear()

    for (const observer of this.observers) {
      observer.sources.delete(this)
    }
    this.observers.clear()

    this._hasValue = false
    this._error = null
    this.state = ComputationState.Disposed
  }

  /**
   * Dispose the computed value
   */
  dispose(): void {
    this.cleanup()
    super.dispose()
  }

  /**
   * Debug information
   */
  [Symbol.for('tachui.debug')](): object {
    return {
      id: this.id,
      type: this.type,
      value: this._hasValue ? this.value : undefined,
      hasValue: this._hasValue,
      error: this._error?.message,
      state: this.state,
      sourceCount: this.sources.size,
      observerCount: this.observers.size,
      priority: UpdatePriority[this.priority],
      debugName: this.options.debugName,
      equalsFn: this.equalsFn.name || 'anonymous',
    }
  }

  toString(): string {
    return `Computed(${this.options.debugName || this.id}): ${this._hasValue ? this.value : 'no value'}`
  }
}

/**
 * Create a computed value that automatically updates when dependencies change
 *
 * @param fn The computation function
 * @param options Configuration options for the computed value
 * @returns An accessor function for the computed value
 *
 * @example
 * ```typescript
 * const [count, setCount] = createSignal(0)
 * const doubleCount = createComputed(() => count() * 2, {
 *   debugName: 'doubleCounter',
 *   onError: (error) => {
 *     console.error('Computation failed:', error)
 *     return 0 // fallback value
 *   }
 * })
 *
 * console.log(doubleCount()) // 0
 * setCount(5)
 * console.log(doubleCount()) // 10
 * ```
 */
export function createComputed<T>(fn: () => T, options?: ComputedOptions<T>): Signal<T> {
  const computed = new ComputedImpl(fn, options)

  // Create bound accessor with peek method - this is already a Signal<T>
  const accessor = computed.getValue.bind(computed) as Signal<T>
  accessor.peek = computed.peek.bind(computed)

  // Add debug information
  Object.defineProperty(accessor, Symbol.for('tachui.computed'), {
    value: computed,
    enumerable: false,
  })

  return accessor
}

/**
 * Create a memo (alias for createComputed for SolidJS compatibility)
 */
export function createMemo<T>(fn: () => T, options?: ComputedOptions<T>): Signal<T> {
  return createComputed(fn, options)
}

/**
 * Type guard to check if a value is a computed
 */
export function isComputed<T = any>(value: any): value is Signal<T> {
  return typeof value === 'function' && Symbol.for('tachui.computed') in value
}

/**
 * Get the underlying computed implementation for debugging
 */
export function getComputedImpl<T>(computed: Signal<T>): ComputedImpl<T> | null {
  return (computed as any)[Symbol.for('tachui.computed')] || null
}

/**
 * Create a computed value with explicit dependency tracking
 *
 * @param fn The computation function
 * @param deps Explicit dependencies (optional)
 * @returns An accessor function for the computed value
 */
export function createDerivedSignal<T>(fn: () => T, deps?: (() => any)[]): Signal<T> {
  if (!deps) {
    return createComputed(fn)
  }

  // Wrap function to explicitly track dependencies
  const wrappedFn = () => {
    // Read all dependencies to track them
    for (const dep of deps) {
      dep()
    }
    return fn()
  }

  return createComputed(wrappedFn)
}

/**
 * Create a computed value that only updates when a condition is met
 *
 * @param fn The computation function
 * @param when Condition function that must return true for updates
 * @returns An accessor function for the computed value
 */
export function createConditionalComputed<T>(fn: () => T, when: () => boolean): Signal<T> {
  let lastValue: T
  let hasValue = false

  return createComputed(() => {
    if (when()) {
      lastValue = fn()
      hasValue = true
    }

    if (!hasValue) {
      lastValue = fn()
      hasValue = true
    }

    return lastValue
  })
}

/**
 * Public Computed type export
 */
export type Computed<T> = Signal<T>
