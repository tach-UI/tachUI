/**
 * Equality Functions for Reactive System
 *
 * Provides various equality comparison functions for signal updates
 * including deep, shallow, and custom equality checking.
 */
export type EqualityFunction<T> = (a: T, b: T) => boolean
/**
 * Default reference equality (===)
 */
export declare const defaultEquals: <T>(a: T, b: T) => boolean
/**
 * Deep equality comparison for objects and arrays
 * Recursively compares all properties and array elements
 */
export declare const deepEquals: <T>(a: T, b: T) => boolean
/**
 * Shallow equality comparison for objects
 * Compares only the top-level properties with reference equality
 */
export declare const shallowEquals: <T>(a: T, b: T) => boolean
/**
 * Structural equality for specific data types
 */
export declare const structuralEquals: <T>(a: T, b: T) => boolean
/**
 * JSON-based equality (serializes and compares)
 * Useful for complex nested structures but slower
 */
export declare const jsonEquals: <T>(a: T, b: T) => boolean
/**
 * Create a custom equality function based on a selector
 */
export declare const createSelectorEquals: <T, K>(
  selector: (value: T) => K,
  equalsFn?: EqualityFunction<K>
) => EqualityFunction<T>
/**
 * Create an array equality function with custom element comparison
 */
export declare const createArrayEquals: <T>(
  elementEquals?: EqualityFunction<T>
) => EqualityFunction<T[]>
/**
 * Create an object equality function with custom property comparison
 */
export declare const createObjectEquals: <T extends Record<string, any>>(
  propertyEquals?: EqualityFunction<any>
) => EqualityFunction<T>
/**
 * Combine multiple equality functions with AND logic
 */
export declare const combineEquals: <T>(
  ...equalsFunctions: EqualityFunction<T>[]
) => EqualityFunction<T>
/**
 * Utility to wrap an equality function with debugging
 */
export declare const debugEquals: <T>(
  equalsFn: EqualityFunction<T>,
  debugName?: string
) => EqualityFunction<T>
//# sourceMappingURL=equality.d.ts.map
