/**
 * SwiftUI-Style State Management Types
 *
 * Type definitions for @State, @Binding, @ObservedObject, and @EnvironmentObject
 * property wrappers that provide SwiftUI-compatible state management patterns.
 */

import type { Accessor, Setter, Signal } from '../reactive/types'
import type { ComponentContext } from '../runtime/types'

/**
 * Property wrapper base interface
 */
export interface PropertyWrapper<T> {
  readonly wrappedValue: T
  readonly projectedValue?: any
}

/**
 * @State property wrapper for local component state
 * Provides a two-way binding to a reactive value
 */
export interface State<T> extends PropertyWrapper<T> {
  wrappedValue: T // State wrappedValue should be mutable
  readonly projectedValue: Binding<T>
}

/**
 * @Binding property wrapper for two-way data binding
 * Allows child components to read and write parent state
 */
export interface Binding<T> extends PropertyWrapper<T> {
  readonly wrappedValue: T
  readonly projectedValue: Binding<T>
  get(): T
  set(value: T | ((prev: T) => T)): void
  map<U>(getter: (value: T) => U, setter: (newValue: U, oldValue: T) => T): Binding<U>
  constant(): Binding<T>
}

/**
 * Observable object interface for @ObservedObject
 * Objects that can notify observers of changes
 */
export interface ObservableObject {
  readonly objectWillChange: Signal<void>
  readonly notificationCount: number
  notifyChange(): void
}

/**
 * @ObservedObject property wrapper for external observable objects
 * Automatically triggers re-renders when the observed object changes
 */
export interface ObservedObject<T extends ObservableObject> extends PropertyWrapper<T> {
  readonly wrappedValue: T
  readonly projectedValue: ObservedObject<T>
}

/**
 * @EnvironmentObject property wrapper for dependency injection
 * Provides access to objects from the environment context
 */
export interface EnvironmentObject<T> extends PropertyWrapper<T> {
  readonly wrappedValue: T
  readonly projectedValue: EnvironmentObject<T>
}

/**
 * Environment key for type-safe environment object access
 */
export interface EnvironmentKey<T> {
  readonly symbol: symbol
  readonly defaultValue?: T
}

/**
 * State wrapper configuration options
 */
export interface StateWrapperOptions {
  name?: string
  resetOnMount?: boolean
  persist?: boolean
  debounce?: number
}

/**
 * Binding configuration options
 */
export interface BindingOptions<T> {
  name?: string
  validate?: (value: T) => boolean
  transform?: {
    get?: (value: T) => T
    set?: (value: T) => T
  }
}

/**
 * Observable object configuration
 */
export interface ObservableObjectOptions {
  name?: string
  autoNotify?: boolean
}

/**
 * Environment object configuration
 */
export interface EnvironmentObjectOptions<T> {
  key: EnvironmentKey<T>
  required?: boolean
}

/**
 * State manager interface for component state lifecycle
 */
export interface StateManager {
  readonly componentContext: ComponentContext
  registerState<T>(state: State<T>, options?: StateWrapperOptions): void
  registerBinding<T>(binding: Binding<T>, options?: BindingOptions<T>): void
  registerObservedObject<T extends ObservableObject>(
    observedObject: ObservedObject<T>,
    options?: ObservableObjectOptions
  ): void
  registerEnvironmentObject<T>(
    environmentObject: EnvironmentObject<T>,
    options?: EnvironmentObjectOptions<T>
  ): void
  cleanup(): void
}

/**
 * Property wrapper metadata for runtime introspection
 */
export interface PropertyWrapperMetadata {
  readonly type: 'State' | 'Binding' | 'ObservedObject' | 'EnvironmentObject'
  readonly propertyName: string
  readonly componentId: string
  readonly options: Record<string, any>
}

/**
 * State binding syntax types for SwiftUI-style $ prefix bindings
 */
export type StateBinding<T> = T extends State<infer U> ? Binding<U> : never
export type BindingValue<T> = T extends Binding<infer U> ? U : never

/**
 * Environment object provider interface
 */
export interface EnvironmentObjectProvider<T> {
  readonly key: EnvironmentKey<T>
  readonly value: T
  provide(): void
  revoke(): void
}

/**
 * SwiftUI-compatible property wrapper factory types
 */
export type StateFactory = <T>(initialValue: T, options?: StateWrapperOptions) => State<T>
export type BindingFactory = <T>(
  get: Accessor<T>,
  set: Setter<T>,
  options?: BindingOptions<T>
) => Binding<T>
export type ObservedObjectFactory = <T extends ObservableObject>(
  object: T,
  options?: ObservableObjectOptions
) => ObservedObject<T>
export type EnvironmentObjectFactory = <T>(
  options: EnvironmentObjectOptions<T>
) => EnvironmentObject<T>

/**
 * Computed property types for derived state
 */
export interface ComputedProperty<T> extends PropertyWrapper<T> {
  readonly wrappedValue: T
  readonly projectedValue: ComputedProperty<T>
}

/**
 * Property wrapper registry for component lifecycle management
 */
export interface PropertyWrapperRegistry {
  register(metadata: PropertyWrapperMetadata): void
  unregister(componentId: string, propertyName: string): void
  cleanup(componentId: string): void
  getMetadata(componentId: string): PropertyWrapperMetadata[]
}
