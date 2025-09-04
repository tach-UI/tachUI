/**
 * Enhanced Effect System v2.0
 *
 * Provides proper error propagation and integrates with the unified scheduler
 * to fix silent error suppression and incomplete cleanup issues.
 */
import { type ReactiveNode, UpdatePriority } from './unified-scheduler'
export interface EffectOptions {
  priority?: UpdatePriority
  debugName?: string
  onError?: (error: Error) => void
  fireImmediately?: boolean
}
/**
 * Enhanced effect implementation with proper error propagation
 */
export declare class EffectImpl implements ReactiveNode {
  private effectFn
  readonly id: number
  readonly type: 'effect'
  readonly priority: UpdatePriority
  readonly sources: Set<any>
  readonly observers: Set<never>
  private isDisposed
  private cleanupFn?
  private options
  private owner
  constructor(effectFn: () => undefined | (() => void), options?: EffectOptions)
  /**
   * Notify method called by unified scheduler
   */
  notify(): void
  /**
   * Execute the effect with proper error handling
   */
  private execute
  /**
   * Complete cleanup for memory management
   */
  cleanup(): void
  /**
   * Dispose the effect (alias for cleanup)
   */
  dispose(): void
  /**
   * Check if effect is disposed
   */
  get disposed(): boolean
  toString(): string
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
export declare function createEnhancedEffect(
  effectFn: () => undefined | (() => void),
  options?: EffectOptions
): () => void
/**
 * Create an effect with high priority for user interactions
 */
export declare function createHighPriorityEffect(
  effectFn: () => undefined | (() => void),
  options?: Omit<EffectOptions, 'priority'>
): () => void
/**
 * Create an effect with low priority for background tasks
 */
export declare function createLowPriorityEffect(
  effectFn: () => undefined | (() => void),
  options?: Omit<EffectOptions, 'priority'>
): () => void
/**
 * Create an effect that only runs when dependencies change (not immediately)
 */
export declare function createWatchEffect(
  effectFn: () => undefined | (() => void),
  options?: Omit<EffectOptions, 'fireImmediately'>
): () => void
/**
 * Create an effect with automatic error recovery
 */
export declare function createResilientEffect(
  effectFn: () => undefined | (() => void),
  onError?: (error: Error, attempt: number) => boolean, // return true to retry
  maxRetries?: number,
  options?: EffectOptions
): () => void
/**
 * Batch multiple effect creations for performance
 */
export declare function createEffectBatch(
  effects: Array<{
    fn: () => undefined | (() => void)
    options?: EffectOptions
  }>
): () => void
/**
 * Get performance metrics for all effects
 */
export declare function getEffectPerformanceMetrics(): import('./unified-scheduler').ReactivePerformanceMetrics
/**
 * Flush all pending effect updates synchronously
 */
export declare function flushEffectUpdates(): void
//# sourceMappingURL=enhanced-effect.d.ts.map
