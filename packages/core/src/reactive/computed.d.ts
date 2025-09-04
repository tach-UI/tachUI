/**
 * Computed values implementation
 *
 * Computed values are derived reactive values that automatically
 * update when their dependencies change, with memoization.
 */
import { ComputationImpl } from './context'
import { type EqualityFunction } from './equality'
import type { Computation, Signal } from './types'
import { type ReactiveNode, UpdatePriority } from './unified-scheduler'
export interface ComputedOptions<T> {
  equals?: EqualityFunction<T>
  priority?: UpdatePriority
  debugName?: string
  onError?: (error: Error) => T
}
/**
 * Robust computed value implementation with error recovery
 */
declare class ComputedImpl<T> extends ComputationImpl implements ReactiveNode {
  readonly type: 'computed'
  readonly priority: UpdatePriority
  private _hasValue
  private _error
  private equalsFn
  private options
  constructor(
    fn: () => T,
    options?: ComputedOptions<T>,
    owner?: import('./types').Owner | null
  )
  /**
   * Get the computed value, tracking dependency and lazily computing
   */
  getValue(): T
  /**
   * Get the current value without tracking dependency
   */
  peek(): T
  /**
   * Remove an observer (cleanup)
   */
  removeObserver(computation: Computation): void
  /**
   * Execute the computation and notify observers
   */
  execute(): T
  /**
   * Notify method for ReactiveNode compatibility
   */
  notify(): void
  /**
   * Complete cleanup for memory management
   */
  cleanup(): void
  /**
   * Dispose the computed value
   */
  dispose(): void
  toString(): string
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
export declare function createComputed<T>(
  fn: () => T,
  options?: ComputedOptions<T>
): Signal<T>
/**
 * Create a memo (alias for createComputed for SolidJS compatibility)
 */
export declare function createMemo<T>(
  fn: () => T,
  options?: ComputedOptions<T>
): Signal<T>
/**
 * Type guard to check if a value is a computed
 */
export declare function isComputed<T = any>(value: any): value is Signal<T>
/**
 * Get the underlying computed implementation for debugging
 */
export declare function getComputedImpl<T>(
  computed: Signal<T>
): ComputedImpl<T> | null
/**
 * Create a computed value with explicit dependency tracking
 *
 * @param fn The computation function
 * @param deps Explicit dependencies (optional)
 * @returns An accessor function for the computed value
 */
export declare function createDerivedSignal<T>(
  fn: () => T,
  deps?: (() => any)[]
): Signal<T>
/**
 * Create a computed value that only updates when a condition is met
 *
 * @param fn The computation function
 * @param when Condition function that must return true for updates
 * @returns An accessor function for the computed value
 */
export declare function createConditionalComputed<T>(
  fn: () => T,
  when: () => boolean
): Signal<T>
/**
 * Public Computed type export
 */
export type Computed<T> = Signal<T>

//# sourceMappingURL=computed.d.ts.map
