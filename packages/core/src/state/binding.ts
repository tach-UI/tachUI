/**
 * @Binding Property Wrapper Implementation
 *
 * Implements SwiftUI's @Binding property wrapper for two-way data binding.
 * Provides reactive binding with automatic component re-rendering on changes.
 */

import type { Accessor, Setter } from '../reactive/types'
import { getCurrentComponentContext } from '../runtime/component-context'
import type { ComponentContext } from '../runtime/types'
import type * as Types from './types'
import type { Binding } from './types'

/**
 * Enhanced binding implementation with proper reactive updates
 */
export class BindingImpl<T> implements Binding<T> {
  private _get: Accessor<T>
  private _set: Setter<T>
  private _options: { name?: string }
  private _componentContext: ComponentContext
  private _propertyName: string

  constructor(
    get: Accessor<T>,
    set: Setter<T>,
    componentContext: ComponentContext,
    propertyName: string,
    options: { name?: string } = {}
  ) {
    this._get = get
    this._set = set
    this._componentContext = componentContext
    this._propertyName = propertyName
    this._options = options

    // Store binding in component context for lifecycle management
    componentContext.setBinding(propertyName, this)
  }

  get wrappedValue(): T {
    return this._get()
  }

  set wrappedValue(value: T) {
    this._set(value)
    // Trigger component re-render by updating component context
    this._componentContext.setState(`_binding_${this._propertyName}_trigger`, Date.now())
  }

  get projectedValue(): Binding<T> {
    return this
  }

  get(): T {
    return this._get()
  }

  set(value: T | ((prev: T) => T)): void {
    this._set(value as any)
    // Trigger component re-render
    this._componentContext.setState(`_binding_${this._propertyName}_trigger`, Date.now())
  }

  /**
   * Create a derived binding with transformation
   */
  map<U>(getter: (value: T) => U, setter: (newValue: U, oldValue: T) => T): Binding<U> {
    const mappedGet = () => getter(this._get())
    const mappedSet = (value: U | ((prev: U) => U)) => {
      const currentValue = this._get()
      const currentMapped = getter(currentValue)
      const newMapped =
        typeof value === 'function' ? (value as (prev: U) => U)(currentMapped) : value
      const newOriginal = setter(newMapped, currentValue)
      this._set(newOriginal as any)
      // Trigger re-render
      this._componentContext.setState(`_binding_${this._propertyName}_mapped_trigger`, Date.now())
    }

    return new BindingImpl(
      mappedGet as Accessor<U>,
      mappedSet as Setter<U>,
      this._componentContext,
      `${this._propertyName}_mapped`,
      { name: `${this._options.name || 'binding'}_mapped` }
    )
  }

  /**
   * Create a constant binding (read-only)
   */
  constant(): Binding<T> {
    const readOnlySet: Setter<T> = () => {
      console.warn('Attempted to set value on constant binding')
      return this._get()
    }

    return new BindingImpl(
      this._get,
      readOnlySet,
      this._componentContext,
      `${this._propertyName}_constant`,
      { name: `${this._options.name || 'binding'}_constant` }
    )
  }

  /**
   * Create a binding with validation
   */
  withValidation(validator: (value: T) => boolean, errorMessage?: string): Binding<T> {
    const validatingSet: Setter<T> = (value: T | ((prev: T) => T)) => {
      const newValue = typeof value === 'function' ? (value as (prev: T) => T)(this._get()) : value

      if (validator(newValue)) {
        this._set(newValue as any)
        // Trigger re-render
        this._componentContext.setState(
          `_binding_${this._propertyName}_validated_trigger`,
          Date.now()
        )
      } else {
        console.warn(errorMessage || `Validation failed for binding ${this._propertyName}`)
      }

      return newValue
    }

    return new BindingImpl(
      this._get,
      validatingSet,
      this._componentContext,
      `${this._propertyName}_validated`,
      { name: `${this._options.name || 'binding'}_validated` }
    )
  }

  /**
   * Create a debounced binding
   */
  debounced(delay: number = 300): Binding<T> {
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    const debouncedSet: Setter<T> = (value: T | ((prev: T) => T)) => {
      const newValue = typeof value === 'function' ? (value as (prev: T) => T)(this._get()) : value

      if (timeoutId) {
        clearTimeout(timeoutId)
      }

      timeoutId = setTimeout(() => {
        this._set(newValue as any)
        // Trigger re-render
        this._componentContext.setState(
          `_binding_${this._propertyName}_debounced_trigger`,
          Date.now()
        )
        timeoutId = null
      }, delay)

      return newValue
    }

    return new BindingImpl(
      this._get,
      debouncedSet,
      this._componentContext,
      `${this._propertyName}_debounced`,
      { name: `${this._options.name || 'binding'}_debounced` }
    )
  }
}

/**
 * Create a binding from external getter/setter functions
 */
export function createBinding<T>(
  get: Accessor<T>,
  set: Setter<T>,
  options: { name?: string } = {}
): Binding<T> {
  const componentContext = getCurrentComponentContext()
  const propertyName = getCallerPropertyName() || 'binding'

  return new BindingImpl(get, set, componentContext, propertyName, options)
}

/**
 * Create a binding from a State property wrapper
 */
export function createStateBinding<T>(
  state: Types.State<T>,
  options: { name?: string } = {}
): Binding<T> {
  // Cast to implementation type to access internal methods
  const stateImpl = state as any

  const setter: Setter<T> = (value: T | ((prev: T) => T)) => {
    if (typeof value === 'function') {
      state.wrappedValue = (value as (prev: T) => T)(state.wrappedValue)
    } else {
      state.wrappedValue = value
    }
    return state.wrappedValue
  }

  return createBinding(() => state.wrappedValue, setter, {
    ...options,
    name: options.name || `${stateImpl.metadata?.propertyName || 'state'}Binding`,
  })
}

/**
 * Create a binding to a specific property of an object
 */
export function createPropertyBinding<T, K extends keyof T>(
  object: Accessor<T>,
  setObject: Setter<T>,
  property: K,
  options: { name?: string } = {}
): Binding<T[K]> {
  const get = () => object()[property]
  const set = (value: T[K] | ((prev: T[K]) => T[K])) => {
    const currentObject = object()
    const newValue =
      typeof value === 'function' ? (value as (prev: T[K]) => T[K])(currentObject[property]) : value
    const newObject = { ...currentObject, [property]: newValue }
    setObject(newObject as any)
  }

  return createBinding(get, set as Setter<T[K]>, {
    ...options,
    name: options.name || `${String(property)}PropertyBinding`,
  })
}

/**
 * Create a two-way binding between two state sources
 */
export function createTwoWayBinding<T>(
  source1: Types.State<T>,
  source2: Types.State<T>,
  options: {
    name?: string
    transform?: (value: T) => T
    reverseTransform?: (value: T) => T
  } = {}
): [Binding<T>, Binding<T>] {
  const transform = options.transform || ((v: T) => v)
  const reverseTransform = options.reverseTransform || options.transform || ((v: T) => v)

  const binding1 = createBinding(
    () => transform(source1.wrappedValue),
    (value: T | ((prev: T) => T)) => {
      const newValue =
        typeof value === 'function' ? (value as (prev: T) => T)(source1.wrappedValue) : value
      const transformedValue = reverseTransform(newValue)
      source1.wrappedValue = transformedValue
      source2.wrappedValue = transformedValue
      return transformedValue
    },
    { name: `${options.name || 'twoWay'}Binding1` }
  )

  const binding2 = createBinding(
    () => transform(source2.wrappedValue),
    (value: T | ((prev: T) => T)) => {
      const newValue =
        typeof value === 'function' ? (value as (prev: T) => T)(source2.wrappedValue) : value
      const transformedValue = reverseTransform(newValue)
      source1.wrappedValue = transformedValue
      source2.wrappedValue = transformedValue
      return transformedValue
    },
    { name: `${options.name || 'twoWay'}Binding2` }
  )

  return [binding1, binding2]
}

/**
 * Helper to get the property name of the caller (used for metadata)
 */
function getCallerPropertyName(): string | null {
  try {
    const stack = new Error().stack
    if (stack) {
      // Parse stack to get property name - this is a fallback for debugging
      const match = stack.match(/at (\w+)\./)?.[1]
      return match || null
    }
  } catch {
    // Ignore errors in stack parsing
  }
  return null
}

/**
 * Type guard for Binding property wrappers
 */
export function isBinding<T>(value: any): value is Binding<T> {
  return (
    value &&
    typeof value === 'object' &&
    'get' in value &&
    'set' in value &&
    'wrappedValue' in value &&
    value instanceof BindingImpl
  )
}

/**
 * Utility functions for binding management
 */
export const BindingUtils = {
  /**
   * Check if a binding is read-only
   */
  isReadOnly<T>(binding: Binding<T>): boolean {
    if (binding instanceof BindingImpl) {
      // Check if it's a constant binding by testing the setter
      try {
        const originalValue = binding.get()
        const consoleWarn = console.warn
        let warningCalled = false
        console.warn = (...args) => {
          if (args[0] === 'Attempted to set value on constant binding') {
            warningCalled = true
          }
        }

        binding.set(originalValue)
        console.warn = consoleWarn

        return warningCalled
      } catch {
        return true
      }
    }
    return false
  },

  /**
   * Create a computed binding from multiple sources
   */
  computed<T, Args extends readonly any[]>(
    sources: { [K in keyof Args]: Binding<Args[K]> },
    compute: (...values: Args) => T,
    options: { name?: string } = {}
  ): Binding<T> {
    const get = () => {
      const values = sources.map((source) => source.get()) as any as Args
      return compute(...values)
    }

    const set = () => {
      console.warn('Cannot set computed binding value')
      return get()
    }

    return createBinding(get, set, options)
  },

  /**
   * Chain multiple bindings together
   */
  chain<T>(bindings: Binding<T>[], options: { name?: string } = {}): Binding<T[]> {
    const get = () => bindings.map((binding) => binding.get())
    const set = (values: T[] | ((prev: T[]) => T[])) => {
      const newValues = typeof values === 'function' ? values(get()) : values
      bindings.forEach((binding, index) => {
        if (index < newValues.length) {
          binding.set(newValues[index])
        }
      })
      return newValues
    }

    return createBinding(get, set as Setter<T[]>, options)
  },
}
