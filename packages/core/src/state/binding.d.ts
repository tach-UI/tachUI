/**
 * @Binding Property Wrapper Implementation
 *
 * Implements SwiftUI's @Binding property wrapper for two-way data binding.
 * Provides reactive binding with automatic component re-rendering on changes.
 */
import type { Accessor, Setter } from '../reactive/types';
import type { ComponentContext } from '../runtime/types';
import type * as Types from './types';
import type { Binding } from './types';
/**
 * Enhanced binding implementation with proper reactive updates
 */
export declare class BindingImpl<T> implements Binding<T> {
    private _get;
    private _set;
    private _options;
    private _componentContext;
    private _propertyName;
    constructor(get: Accessor<T>, set: Setter<T>, componentContext: ComponentContext, propertyName: string, options?: {
        name?: string;
    });
    get wrappedValue(): T;
    set wrappedValue(value: T);
    get projectedValue(): Binding<T>;
    get(): T;
    set(value: T | ((prev: T) => T)): void;
    /**
     * Create a derived binding with transformation
     */
    map<U>(getter: (value: T) => U, setter: (newValue: U, oldValue: T) => T): Binding<U>;
    /**
     * Create a constant binding (read-only)
     */
    constant(): Binding<T>;
    /**
     * Create a binding with validation
     */
    withValidation(validator: (value: T) => boolean, errorMessage?: string): Binding<T>;
    /**
     * Create a debounced binding
     */
    debounced(delay?: number): Binding<T>;
}
/**
 * Create a binding from external getter/setter functions
 */
export declare function createBinding<T>(get: Accessor<T>, set: Setter<T>, options?: {
    name?: string;
}): Binding<T>;
/**
 * Create a binding from a State property wrapper
 */
export declare function createStateBinding<T>(state: Types.State<T>, options?: {
    name?: string;
}): Binding<T>;
/**
 * Create a binding to a specific property of an object
 */
export declare function createPropertyBinding<T, K extends keyof T>(object: Accessor<T>, setObject: Setter<T>, property: K, options?: {
    name?: string;
}): Binding<T[K]>;
/**
 * Create a two-way binding between two state sources
 */
export declare function createTwoWayBinding<T>(source1: Types.State<T>, source2: Types.State<T>, options?: {
    name?: string;
    transform?: (value: T) => T;
    reverseTransform?: (value: T) => T;
}): [Binding<T>, Binding<T>];
/**
 * Type guard for Binding property wrappers
 */
export declare function isBinding<T>(value: any): value is Binding<T>;
/**
 * Utility functions for binding management
 */
export declare const BindingUtils: {
    /**
     * Check if a binding is read-only
     */
    isReadOnly<T>(binding: Binding<T>): boolean;
    /**
     * Create a computed binding from multiple sources
     */
    computed<T, Args extends readonly any[]>(sources: { [K in keyof Args]: Binding<Args[K]>; }, compute: (...values: Args) => T, options?: {
        name?: string;
    }): Binding<T>;
    /**
     * Chain multiple bindings together
     */
    chain<T>(bindings: Binding<T>[], options?: {
        name?: string;
    }): Binding<T[]>;
};
//# sourceMappingURL=binding.d.ts.map