/**
 * Core reactive system types
 */
/**
 * A reactive accessor function that returns the current value
 */
export type Accessor<T = any> = () => T;
/**
 * A setter function that updates a reactive value
 */
export type Setter<T> = (value: T | ((prev: T) => T)) => T;
/**
 * Extract the value type from an Accessor
 */
export type AccessorValue<T> = T extends Accessor<infer U> ? U : never;
/**
 * Owner context for reactive computations and cleanup
 */
export interface Owner {
    readonly id: number;
    readonly parent: Owner | null;
    readonly context: Map<symbol, any>;
    readonly cleanups: CleanupFunction[];
    readonly sources: Set<Computation>;
    disposed: boolean;
}
/**
 * Base computation interface
 */
export interface Computation {
    readonly id: number;
    readonly owner: Owner | null;
    readonly fn: () => any;
    readonly sources: Set<any>;
    readonly observers: Set<Computation>;
    state: ComputationState;
    value?: any;
    execute(): any;
    dispose(): void;
}
/**
 * Computation state enum
 */
export declare enum ComputationState {
    Clean = 0,// Up to date
    Check = 1,// Potentially stale, needs checking
    Dirty = 2,// Definitely stale, needs recomputation
    Disposed = 3
}
/**
 * Signal interface (internal)
 */
export interface SignalImpl<T> {
    readonly id: number;
    readonly observers: Set<Computation>;
    getValue(): T;
    peek(): T;
}
/**
 * Signal getter function type (what createSignal returns)
 */
export type Signal<T> = (() => T) & {
    peek(): T;
};
/**
 * Effect function type
 */
export type EffectFunction<T = any> = (prev?: T) => T;
/**
 * Effect options
 */
export interface EffectOptions {
    name?: string;
}
/**
 * Cleanup function type
 */
export type CleanupFunction = () => void;
/**
 * Reactive context for tracking dependencies
 */
export interface ReactiveContext {
    readonly computation: Computation | null;
    readonly batch: boolean;
}
/**
 * Scheduler interface for managing updates
 */
export interface Scheduler {
    schedule(fn: () => void): void;
    flush(): void;
}
//# sourceMappingURL=types.d.ts.map