/**
 * Signal implementation - core reactive primitive
 *
 * Signals are the foundation of TachUI's reactive system, providing
 * fine-grained reactivity similar to SolidJS signals.
 */

import {
  getCurrentComputation,
  isBatchingUpdates,
  setFlushFunction,
} from './context'
import type { Computation, SignalImpl as ISignal } from './types'
import { ComputationState } from './types'

let signalIdCounter = 0

/**
 * Signal setter function type
 */
export type SignalSetter<T> = (value: T | ((prev: T) => T)) => T

/**
 * Internal signal implementation (keeping original behavior)
 */
class SignalImpl<T> implements ISignal<T> {
  readonly id: number
  readonly observers = new Set<Computation>()
  private _value: T

  constructor(initialValue: T) {
    this.id = ++signalIdCounter
    this._value = initialValue
  }

  /**
   * Get the current value and track dependency
   */
  getValue(): T {
    const computation = getCurrentComputation()
    if (computation && computation.state !== ComputationState.Disposed) {
      // Track this signal as a dependency
      this.observers.add(computation)
      computation.sources.add(this)
    } else {
    }
    return this._value
  }

  /**
   * Get the current value without tracking dependency
   */
  peek(): T {
    return this._value
  }

  /**
   * Set a new value and notify observers
   */
  set(newValue: T | ((prev: T) => T)): T {
    const value =
      typeof newValue === 'function'
        ? (newValue as (prev: T) => T)(this._value)
        : newValue

    if (value !== this._value) {
      this._value = value
      this.notify()
    } else {
    }

    return value
  }

  /**
   * Notify all observers that this signal has changed
   */
  private notify(): void {
    for (const observer of this.observers) {
      if (observer.state !== ComputationState.Disposed) {
        observer.state = ComputationState.Dirty
        scheduleUpdate(observer)
      } else {
      }
    }
  }

  /**
   * Remove an observer (cleanup)
   */
  removeObserver(computation: Computation): void {
    this.observers.delete(computation)
  }

  /**
   * Get debug information about this signal
   */
  [Symbol.for('tachui.debug')](): object {
    return {
      id: this.id,
      value: this._value,
      observerCount: this.observers.size,
      type: 'Signal',
    }
  }
}

/**
 * Update queue for batching reactive updates
 */
const updateQueue = new Set<Computation>()
let isFlushingUpdates = false

/**
 * Schedule a computation for update
 */
function scheduleUpdate(computation: Computation): void {
  updateQueue.add(computation)

  if (!isFlushingUpdates && !isBatchingUpdates()) {
    queueMicrotask(flushUpdates)
  }
}

/**
 * Flush all pending updates
 */
function flushUpdates(): void {
  if (isFlushingUpdates) return

  isFlushingUpdates = true

  try {
    // Keep processing until no more computations are added
    while (updateQueue.size > 0) {
      // Process updates in order of computation ID for deterministic execution
      const computations = Array.from(updateQueue).sort((a, b) => a.id - b.id)
      updateQueue.clear()

      for (const computation of computations) {
        if (computation.state === ComputationState.Dirty) {
          computation.execute()
        }
      }
    }
  } finally {
    isFlushingUpdates = false
  }
}

/**
 * Create a new reactive signal
 *
 * @param initialValue The initial value of the signal
 * @returns A tuple of [getter, setter] functions
 *
 * @example
 * ```typescript
 * const [count, setCount] = createSignal(0)
 *
 * console.log(count()) // 0
 * setCount(5)
 * console.log(count()) // 5
 *
 * // Functional update
 * setCount(prev => prev + 1)
 * console.log(count()) // 6
 * ```
 */
export function createSignal<T>(initialValue: T): [() => T, SignalSetter<T>] {
  const signal = new SignalImpl(initialValue)

  const getter = signal.getValue.bind(signal) as (() => T) & { peek: () => T }
  getter.peek = signal.peek.bind(signal)

  const setter: SignalSetter<T> = signal.set.bind(signal)

  // Add debug information
  Object.defineProperty(getter, Symbol.for('tachui.signal'), {
    value: signal,
    enumerable: false,
  })

  return [getter, setter]
}

/**
 * Type guard to check if a value is a signal
 */
export function isSignal<T = any>(
  value: any
): value is (() => T) & { peek: () => T } {
  return typeof value === 'function' && Symbol.for('tachui.signal') in value
}

/**
 * Get the underlying signal implementation for debugging
 */
export function getSignalImpl<T>(
  signal: (() => T) & { peek: () => T }
): SignalImpl<T> | null {
  return (signal as any)[Symbol.for('tachui.signal')] || null
}

/**
 * Public Signal type export (callable getter)
 */
export type { Signal } from './types'

// Export flush function for testing and manual control
export { flushUpdates as flushSync }

// Register flush function with context module
setFlushFunction(flushUpdates)
