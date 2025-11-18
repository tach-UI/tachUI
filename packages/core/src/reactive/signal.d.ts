/**
 * Signal implementation - core reactive primitive
 *
 * Signals are the foundation of TachUI's reactive system, providing
 * fine-grained reactivity similar to SolidJS signals.
 */
import type { Computation, SignalImpl as ISignal } from './types';
/**
 * Signal setter function type
 */
export type SignalSetter<T> = (value: T | ((prev: T) => T)) => T;
/**
 * Internal signal implementation (keeping original behavior)
 */
declare class SignalImpl<T> implements ISignal<T> {
    readonly id: number;
    readonly observers: Set<Computation>;
    private _value;
    constructor(initialValue: T);
    /**
     * Get the current value and track dependency
     */
    getValue(): T;
    /**
     * Get the current value without tracking dependency
     */
    peek(): T;
    /**
     * Set a new value and notify observers
     */
    set(newValue: T | ((prev: T) => T)): T;
    /**
     * Notify all observers that this signal has changed
     */
    private notify;
    /**
     * Remove an observer (cleanup)
     */
    removeObserver(computation: Computation): void;
}
/**
 * Flush all pending updates
 */
declare function flushUpdates(): void;
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
export declare function createSignal<T>(initialValue: T): [() => T, SignalSetter<T>];
/**
 * Type guard to check if a value is a signal
 */
export declare function isSignal<T = any>(value: any): value is (() => T) & {
    peek: () => T;
};
/**
 * Get the underlying signal implementation for debugging
 */
export declare function getSignalImpl<T>(signal: (() => T) & {
    peek: () => T;
}): SignalImpl<T> | null;
/**
 * Public Signal type export (callable getter)
 */
export type { Signal } from './types';
export { flushUpdates as flushSync };
//# sourceMappingURL=signal.d.ts.map