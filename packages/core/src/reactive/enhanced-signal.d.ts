/**
 * Enhanced Signal Implementation v2.0
 *
 * Integrates with the unified scheduler and provides custom equality functions
 * to fix signal update detection bugs and eliminate race conditions.
 */
import { type EqualityFunction } from './equality';
import type { Computation } from './types';
import { type ReactiveNode, UpdatePriority } from './unified-scheduler';
export interface SignalOptions<T> {
    equals?: EqualityFunction<T>;
    priority?: UpdatePriority;
    debugName?: string;
}
/**
 * Enhanced signal implementation with unified scheduler integration
 */
export declare class EnhancedSignalImpl<T> implements ReactiveNode {
    readonly id: number;
    readonly type: "signal";
    readonly priority: UpdatePriority;
    readonly observers: Set<Computation>;
    private _value;
    private scheduler;
    private equalsFn;
    private debugName?;
    private options;
    constructor(initialValue: T, options?: SignalOptions<T>);
    /**
     * Get the current value and track dependency
     */
    getValue(): T;
    /**
     * Get the current value without tracking dependency
     */
    peek(): T;
    /**
     * Set a new value using custom equality function
     */
    setValue(newValue: T | ((prev: T) => T)): T;
    /**
     * Notify all observers (called by scheduler)
     */
    notify(): void;
    /**
     * Remove an observer (cleanup)
     */
    removeObserver(computation: Computation): void;
    /**
     * Complete cleanup for memory management
     */
    cleanup(): void;
    toString(): string;
}
/**
 * Signal setter function type
 */
export type SignalSetter<T> = (value: T | ((prev: T) => T)) => T;
/**
 * Create a new enhanced reactive signal with custom equality
 */
export declare function createEnhancedSignal<T>(initialValue: T, options?: SignalOptions<T>): [() => T, SignalSetter<T>];
/**
 * Create a signal with deep equality comparison
 */
export declare function createDeepSignal<T>(initialValue: T, options?: Omit<SignalOptions<T>, 'equals'>): [() => T, SignalSetter<T>];
/**
 * Create a signal with shallow equality comparison
 */
export declare function createShallowSignal<T>(initialValue: T, options?: Omit<SignalOptions<T>, 'equals'>): [() => T, SignalSetter<T>];
/**
 * Get the underlying signal implementation for debugging
 */
export declare function getEnhancedSignalImpl<T>(signal: (() => T) & {
    peek: () => T;
}): EnhancedSignalImpl<T> | null;
/**
 * Type guard to check if a value is an enhanced signal
 */
export declare function isEnhancedSignal<T = any>(value: any): value is (() => T) & {
    peek: () => T;
};
/**
 * Flush all pending signal updates synchronously
 */
export declare function flushSignalUpdates(): void;
/**
 * Get performance metrics for all signals
 */
export declare function getSignalPerformanceMetrics(): import("./unified-scheduler").ReactivePerformanceMetrics;
//# sourceMappingURL=enhanced-signal.d.ts.map