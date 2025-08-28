/**
 * @State Property Wrapper Implementation
 *
 * Implements SwiftUI's @State property wrapper for local component state management.
 * Provides reactive state with automatic component re-rendering on changes.
 */

import { getCurrentOwner } from '../reactive/context'
import { createEffect } from '../reactive/effect'
import { createSignal } from '../reactive/signal'
import type { Accessor, Setter } from '../reactive/types'
import { getCurrentComponentContext } from '../runtime/component-context'
import type { ComponentContext } from '../runtime/types'
import type * as Types from './types'
import type { Binding, PropertyWrapperMetadata, StateFactory, StateWrapperOptions } from './types'

/**
 * Internal state wrapper implementation
 */
class StateImpl<T> implements Types.State<T> {
  private _accessor: Accessor<T>
  private _setter: Setter<T>
  private _binding: Binding<T>
  private _metadata: PropertyWrapperMetadata

  constructor(
    initialValue: T,
    componentContext: ComponentContext,
    propertyName: string,
    options: StateWrapperOptions = {}
  ) {
    // Create the underlying reactive signal
    const [accessor, setter] = createSignal(initialValue)
    this._accessor = accessor
    this._setter = setter

    // Create the projected binding
    this._binding = createBinding(accessor, setter, {
      name: options.name || `${propertyName}Binding`,
    })

    // Store metadata for introspection
    this._metadata = {
      type: 'State',
      propertyName,
      componentId: componentContext.id,
      options,
    }

    // Register with component context for lifecycle management
    componentContext.setState(propertyName, initialValue)

    // Set up cleanup on component unmount
    const owner = getCurrentOwner()
    if (owner) {
      owner.cleanups.push(() => {
        // Cleanup any resources if needed
        this.cleanup()
      })
    }

    // Handle reset on mount if configured
    if (options.resetOnMount) {
      this.resetToInitialValue(initialValue)
    }

    // Set up persistence if configured
    if (options.persist && typeof window !== 'undefined') {
      this.setupPersistence(propertyName, initialValue)
    }
  }

  get wrappedValue(): T {
    return this._accessor()
  }

  set wrappedValue(value: T) {
    this._setter(value)
  }

  get projectedValue(): Binding<T> {
    return this._binding
  }

  /**
   * Get the underlying signal accessor (for advanced usage)
   */
  get accessor(): Accessor<T> {
    return this._accessor
  }

  /**
   * Get the underlying signal setter (for advanced usage)
   */
  get setter(): Setter<T> {
    return this._setter
  }

  /**
   * Get property wrapper metadata
   */
  get metadata(): PropertyWrapperMetadata {
    return this._metadata
  }

  /**
   * Reset to initial value
   */
  private resetToInitialValue(initialValue: T): void {
    this._setter(initialValue)
  }

  /**
   * Set up local storage persistence
   */
  private setupPersistence(propertyName: string, _initialValue: T): void {
    const storageKey = `tachui_state_${this._metadata.componentId}_${propertyName}`

    // Try to load persisted value
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored !== null && stored !== undefined && stored !== 'undefined') {
        const parsedValue = JSON.parse(stored)
        this._setter(parsedValue)
      }
    } catch (error) {
      console.warn(`Failed to load persisted state for ${propertyName}:`, error)
    }

    // Set up automatic persistence on changes
    createEffect(() => {
      const currentValue = this._accessor()
      try {
        localStorage.setItem(storageKey, JSON.stringify(currentValue))
      } catch (error) {
        console.warn(`Failed to persist state for ${propertyName}:`, error)
      }
    })
  }

  /**
   * Cleanup resources
   */
  private cleanup(): void {
    // Any cleanup logic would go here
    // Currently no cleanup needed for basic state
  }
}

/**
 * Create a binding from getter and setter functions
 */
function createBinding<T>(
  get: Accessor<T>,
  set: Setter<T>,
  options: { name?: string } = {}
): Binding<T> {
  return new BindingImpl(get, set, options)
}

/**
 * Internal binding implementation
 */
class BindingImpl<T> implements Binding<T> {
  constructor(
    private _get: Accessor<T>,
    private _set: Setter<T>,
    private _options: { name?: string } = {}
  ) {}

  get wrappedValue(): T {
    return this._get()
  }

  set wrappedValue(value: T) {
    this._set(value)
  }

  get projectedValue(): Binding<T> {
    return this
  }

  get(): T {
    return this._get()
  }

  set(value: T | ((prev: T) => T)): void {
    this._set(value)
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
      this._set(newOriginal)
    }

    return createBinding(mappedGet, mappedSet as Setter<U>, {
      name: `${this._options.name || 'binding'}_mapped`,
    })
  }

  /**
   * Create a constant binding (read-only)
   */
  constant(): Binding<T> {
    return createBinding(
      this._get,
      () => {
        console.warn('Attempted to set value on constant binding')
        return this._get()
      },
      { name: `${this._options.name || 'binding'}_constant` }
    )
  }
}

/**
 * @State property wrapper factory
 *
 * Creates a @State property wrapper for local component state.
 *
 * @param initialValue - The initial value for the state
 * @param options - Configuration options for the state wrapper
 * @returns A State property wrapper
 *
 * @example
 * ```typescript
 * class MyComponent {
 *   @State(0)
 *   private count: number
 *
 *   @State('Hello')
 *   private message: string
 *
 *   render() {
 *     return Text(`${this.message}: ${this.count}`)
 *       .modifier
 *       .onTap(() => this.count++)
 *       .build()
 *   }
 * }
 * ```
 */
export const State: StateFactory = <T>(
  initialValue: T,
  options: StateWrapperOptions = {}
): Types.State<T> => {
  // This will be replaced by the decorator transformer during compilation
  // For runtime usage, we need component context
  const componentContext = getCurrentComponentContext()
  const propertyName = getCallerPropertyName() || 'state'

  return new StateImpl(initialValue, componentContext, propertyName, options)
}

/**
 * Create a binding from external getter/setter functions
 *
 * @param get - Function to get current value
 * @param set - Function to set new value
 * @param options - Configuration options
 * @returns A Binding property wrapper
 *
 * @example
 * ```typescript
 * const binding = createBinding(
 *   () => externalValue,
 *   (value) => { externalValue = value },
 *   { name: 'externalBinding' }
 * )
 * ```
 */
export const createStateBinding = createBinding

// getCurrentComponentContext is now imported from component-context module

/**
 * Helper to get the property name of the caller (used for metadata)
 */
function getCallerPropertyName(): string | null {
  // This would be replaced by the compiler with actual property name
  // For runtime debugging, we can try to infer from call stack
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

// ComponentContextSymbol is now imported from component-context module

/**
 * Export binding factory for external use
 */
export { createBinding }

/**
 * Type guard for State property wrappers
 */
export function isState<T>(value: any): value is Types.State<T> {
  return value && typeof value === 'object' && 'wrappedValue' in value && 'projectedValue' in value
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
    'wrappedValue' in value
  )
}

/**
 * Utility to extract the raw value from State or Binding
 */
export function unwrapValue<T>(wrapper: Types.State<T> | Binding<T> | T): T {
  if (isState(wrapper) || isBinding(wrapper)) {
    return (wrapper as Types.State<T> | Binding<T>).wrappedValue
  }
  return wrapper as T
}
