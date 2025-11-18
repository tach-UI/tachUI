/**
 * Effect implementation for side effects in reactive system
 *
 * Effects run when their dependencies change, enabling reactive
 * side effects like DOM updates, logging, API calls, etc.
 */
import { ComputationImpl } from './context';
import type { EffectFunction, EffectOptions } from './types';
/**
 * Effect function type
 */
export type Effect = ComputationImpl;
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
export declare function createEffect<T>(fn: EffectFunction<T>, options?: EffectOptions): Effect;
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
export declare function createRenderEffect<T>(fn: EffectFunction<T>, options?: EffectOptions): Effect;
/**
 * Create a one-time effect that disposes itself after first execution
 *
 * @param fn The effect function to run once
 * @param options Effect configuration options
 * @returns The effect computation
 */
export declare function createOnceEffect<T>(fn: EffectFunction<T>, options?: EffectOptions): Effect;
/**
 * Create an effect that runs synchronously (not batched)
 *
 * @param fn The effect function to run
 * @param options Effect configuration options
 * @returns The effect computation
 */
export declare function createSyncEffect<T>(fn: EffectFunction<T>, options?: EffectOptions): Effect;
/**
 * Dispose an effect
 */
export declare function disposeEffect(effect: Effect): void;
/**
 * Check if an effect is disposed
 */
export declare function isEffectDisposed(effect: Effect): boolean;
/**
 * Get effect debug information
 */
export declare function getEffectInfo(effect: Effect): object;
export type { EffectFunction, EffectOptions };
//# sourceMappingURL=effect.d.ts.map