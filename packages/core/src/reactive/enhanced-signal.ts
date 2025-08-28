/**
 * Enhanced Signal Implementation v2.0
 *
 * Integrates with the unified scheduler and provides custom equality functions
 * to fix signal update detection bugs and eliminate race conditions.
 */

import { getCurrentComputation } from './context'
import { defaultEquals, deepEquals, shallowEquals, type EqualityFunction } from './equality'
import type { Computation } from './types'
import { ComputationState } from './types'
import { type ReactiveNode, ReactiveScheduler, UpdatePriority } from './unified-scheduler'

let signalIdCounter = 0

export interface SignalOptions<T> {
  equals?: EqualityFunction<T>
  priority?: UpdatePriority
  debugName?: string
}

/**
 * Enhanced signal implementation with unified scheduler integration
 */
export class EnhancedSignalImpl<T> implements ReactiveNode {
  readonly id = ++signalIdCounter
  readonly type = 'signal' as const
  readonly priority: UpdatePriority
  readonly observers = new Set<Computation>()

  private _value: T
  private scheduler = ReactiveScheduler.getInstance()
  private equalsFn: EqualityFunction<T>
  private debugName?: string
  private options: SignalOptions<T>

  constructor(initialValue: T, options: SignalOptions<T> = {}) {
    this._value = initialValue
    this.options = options
    this.priority = options.priority ?? UpdatePriority.Normal
    this.equalsFn = options.equals ?? defaultEquals
    this.debugName = options.debugName
  }

  /**
   * Get the current value and track dependency
   */
  getValue(): T {
    const computation = getCurrentComputation()
    if (computation && computation.state !== ComputationState.Disposed) {
      // Establish bidirectional relationship
      this.observers.add(computation)
      computation.sources.add(this)
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
   * Set a new value using custom equality function
   */
  setValue(newValue: T | ((prev: T) => T)): T {
    const value =
      typeof newValue === 'function' ? (newValue as (prev: T) => T)(this._value) : newValue

    // Use custom equality function instead of simple !== check
    if (!this.equalsFn(value, this._value)) {
      const oldValue = this._value
      this._value = value

      if (process.env.NODE_ENV === 'development' && this.debugName) {
        console.debug(`[Signal:${this.debugName}] ${oldValue} -> ${value}`)
      }

      // Schedule update through unified scheduler
      this.scheduler.schedule(this)
    }

    return value
  }

  /**
   * Notify all observers (called by scheduler)
   */
  notify(): void {
    // Mark all observers as dirty and schedule them
    for (const observer of this.observers) {
      if (observer.state !== ComputationState.Disposed) {
        observer.state = ComputationState.Dirty

        // Schedule observer if it's also a ReactiveNode
        if ('type' in observer && 'priority' in observer) {
          this.scheduler.schedule(observer as any)
        }
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
   * Complete cleanup for memory management
   */
  cleanup(): void {
    // Complete bidirectional cleanup to prevent memory leaks
    for (const observer of this.observers) {
      observer.sources.delete(this)
    }
    this.observers.clear()
  }

  /**
   * Get debug information about this signal
   */
  [Symbol.for('tachui.debug')](): object {
    return {
      id: this.id,
      type: this.type,
      value: this._value,
      observerCount: this.observers.size,
      priority: UpdatePriority[this.priority],
      debugName: this.debugName,
      equalsFn: this.equalsFn.name || 'anonymous',
    }
  }

  toString(): string {
    return `Signal(${this.options.debugName || this.id}): ${this._value}`
  }
}

/**
 * Signal setter function type
 */
export type SignalSetter<T> = (value: T | ((prev: T) => T)) => T

/**
 * Create a new enhanced reactive signal with custom equality
 */
export function createEnhancedSignal<T>(
  initialValue: T,
  options?: SignalOptions<T>
): [() => T, SignalSetter<T>] {
  const signal = new EnhancedSignalImpl(initialValue, options)

  const getter = signal.getValue.bind(signal) as (() => T) & { peek: () => T }
  getter.peek = signal.peek.bind(signal)

  const setter: SignalSetter<T> = signal.setValue.bind(signal)

  // Add debug information for compatibility
  Object.defineProperty(getter, Symbol.for('tachui.signal'), {
    value: signal,
    enumerable: false,
  })

  return [getter, setter]
}

/**
 * Create a signal with deep equality comparison
 */
export function createDeepSignal<T>(
  initialValue: T,
  options?: Omit<SignalOptions<T>, 'equals'>
): [() => T, SignalSetter<T>] {
  return createEnhancedSignal(initialValue, {
    ...options,
    equals: deepEquals,
  })
}

/**
 * Create a signal with shallow equality comparison
 */
export function createShallowSignal<T>(
  initialValue: T,
  options?: Omit<SignalOptions<T>, 'equals'>
): [() => T, SignalSetter<T>] {
  return createEnhancedSignal(initialValue, {
    ...options,
    equals: shallowEquals,
  })
}

/**
 * Get the underlying signal implementation for debugging
 */
export function getEnhancedSignalImpl<T>(
  signal: (() => T) & { peek: () => T }
): EnhancedSignalImpl<T> | null {
  return (signal as any)[Symbol.for('tachui.signal')] || null
}

/**
 * Type guard to check if a value is an enhanced signal
 */
export function isEnhancedSignal<T = any>(value: any): value is (() => T) & { peek: () => T } {
  return typeof value === 'function' && Symbol.for('tachui.signal') in value
}

/**
 * Flush all pending signal updates synchronously
 */
export function flushSignalUpdates(): void {
  const scheduler = ReactiveScheduler.getInstance()
  scheduler.flushSync()
}

/**
 * Get performance metrics for all signals
 */
export function getSignalPerformanceMetrics() {
  const scheduler = ReactiveScheduler.getInstance()
  return scheduler.getPerformanceMetrics()
}
