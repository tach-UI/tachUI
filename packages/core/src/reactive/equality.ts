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
export const defaultEquals = <T>(a: T, b: T): boolean => a === b

/**
 * Deep equality comparison for objects and arrays
 * Recursively compares all properties and array elements
 */
export const deepEquals = <T>(a: T, b: T): boolean => {
  if (a === b) return true
  if (a == null || b == null) return false
  if (typeof a !== typeof b) return false

  if (typeof a === 'object') {
    if (Array.isArray(a) !== Array.isArray(b)) return false

    if (Array.isArray(a)) {
      const arrayA = a as unknown as any[]
      const arrayB = b as unknown as any[]
      if (arrayA.length !== arrayB.length) return false
      return arrayA.every((item, index) => deepEquals(item, arrayB[index]))
    }

    const objA = a as Record<string, any>
    const objB = b as Record<string, any>

    const keysA = Object.keys(objA)
    const keysB = Object.keys(objB)
    if (keysA.length !== keysB.length) return false

    return keysA.every((key) => deepEquals(objA[key], objB[key]))
  }

  return false
}

/**
 * Shallow equality comparison for objects
 * Compares only the top-level properties with reference equality
 */
export const shallowEquals = <T>(a: T, b: T): boolean => {
  if (a === b) return true
  if (typeof a !== 'object' || typeof b !== 'object') return false
  if (a == null || b == null) return false

  const objA = a as Record<string, any>
  const objB = b as Record<string, any>

  const keysA = Object.keys(objA)
  const keysB = Object.keys(objB)
  if (keysA.length !== keysB.length) return false

  return keysA.every((key) => objA[key] === objB[key])
}

/**
 * Structural equality for specific data types
 */
export const structuralEquals = <T>(a: T, b: T): boolean => {
  if (a === b) return true

  // Handle Date objects
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime()
  }

  // Handle RegExp objects
  if (a instanceof RegExp && b instanceof RegExp) {
    return a.toString() === b.toString()
  }

  // Handle Set objects
  if (a instanceof Set && b instanceof Set) {
    if (a.size !== b.size) return false
    for (const item of a) {
      if (!b.has(item)) return false
    }
    return true
  }

  // Handle Map objects
  if (a instanceof Map && b instanceof Map) {
    if (a.size !== b.size) return false
    for (const [key, value] of a) {
      if (!b.has(key) || b.get(key) !== value) return false
    }
    return true
  }

  // Fall back to deep equals for other objects
  return deepEquals(a, b)
}

/**
 * JSON-based equality (serializes and compares)
 * Useful for complex nested structures but slower
 */
export const jsonEquals = <T>(a: T, b: T): boolean => {
  if (a === b) return true

  try {
    return JSON.stringify(a) === JSON.stringify(b)
  } catch {
    // If serialization fails, fall back to reference equality
    return a === b
  }
}

/**
 * Create a custom equality function based on a selector
 */
export const createSelectorEquals = <T, K>(
  selector: (value: T) => K,
  equalsFn: EqualityFunction<K> = defaultEquals
): EqualityFunction<T> => {
  return (a: T, b: T): boolean => {
    return equalsFn(selector(a), selector(b))
  }
}

/**
 * Create an array equality function with custom element comparison
 */
export const createArrayEquals = <T>(
  elementEquals: EqualityFunction<T> = defaultEquals
): EqualityFunction<T[]> => {
  return (a: T[], b: T[]): boolean => {
    if (a === b) return true
    if (a.length !== b.length) return false

    return a.every((item, index) => elementEquals(item, b[index]))
  }
}

/**
 * Create an object equality function with custom property comparison
 */
export const createObjectEquals = <T extends Record<string, any>>(
  propertyEquals: EqualityFunction<any> = defaultEquals
): EqualityFunction<T> => {
  return (a: T, b: T): boolean => {
    if (a === b) return true
    if (a == null || b == null) return false

    const keysA = Object.keys(a)
    const keysB = Object.keys(b)
    if (keysA.length !== keysB.length) return false

    return keysA.every((key) => propertyEquals(a[key], b[key]))
  }
}

/**
 * Combine multiple equality functions with AND logic
 */
export const combineEquals = <T>(
  ...equalsFunctions: EqualityFunction<T>[]
): EqualityFunction<T> => {
  return (a: T, b: T): boolean => {
    return equalsFunctions.every((equals) => equals(a, b))
  }
}

/**
 * Utility to wrap an equality function with debugging
 */
export const debugEquals = <T>(
  equalsFn: EqualityFunction<T>,
  debugName?: string
): EqualityFunction<T> => {
  return (a: T, b: T): boolean => {
    const result = equalsFn(a, b)
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${debugName || 'equals'}]`, { a, b, equal: result })
    }
    return result
  }
}
