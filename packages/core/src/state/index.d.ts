/**
 * SwiftUI-Style State Management
 *
 * This module provides SwiftUI-compatible property wrappers for state management:
 * - @State: Local component state with automatic reactivity
 * - @Binding: Two-way data binding between parent and child components
 * - @ObservedObject: Observation of external objects that implement ObservableObject
 * - @EnvironmentObject: Dependency injection through environment context
 */
import {
  createEnvironmentKey,
  createObservableEnvironmentObject,
  EnvironmentObject,
  provideEnvironmentObject,
} from './environment'
import { makeObservable, observable } from './observed-object'
import { createBinding } from './state'
export {
  BindingImpl,
  BindingUtils,
  createBinding as createEnhancedBinding,
  isBinding as isEnhancedBinding,
} from './binding'
export {
  CommonEnvironmentKeys,
  createEnvironmentKey,
  createObservableEnvironmentObject,
  EnvironmentObject,
  isEnvironmentObject,
  provideEnvironmentObject,
} from './environment'
export {
  createObservableStore,
  isObservableObject,
  isObservedObject,
  makeObservable,
  ObservableObjectBase,
  ObservedObjectWrapper as ObservedObject,
  observable,
} from './observed-object'
export {
  createBinding,
  createStateBinding,
  isBinding,
  isState,
  State,
  unwrapValue,
} from './state'
export type {
  Binding,
  BindingFactory,
  BindingOptions,
  BindingValue,
  ComputedProperty,
  EnvironmentKey,
  EnvironmentObject as IEnvironmentObject,
  EnvironmentObjectFactory,
  EnvironmentObjectOptions,
  EnvironmentObjectProvider,
  ObservableObject,
  ObservableObjectOptions,
  ObservedObject as IObservedObject,
  ObservedObjectFactory,
  PropertyWrapper,
  PropertyWrapperMetadata,
  PropertyWrapperRegistry,
  State as IState,
  StateBinding,
  StateFactory,
  StateManager,
  StateWrapperOptions,
} from './types'
export declare const createEnvironmentObjectProvider: typeof provideEnvironmentObject
export declare function useEnvironmentObject(
  key: any
): EnvironmentObject<unknown>
/**
 * Re-export commonly used reactive primitives from the reactive system
 */
export {
  createComputed,
  createEffect,
  createMemo,
  createSignal,
} from '../reactive'
export {
  createStateManager,
  getAllStateManagers,
  getStateManager,
  getStateManagerDebugInfo,
  initializeStateDebugging,
  registerStateManager,
  StateManagerImpl,
  unregisterStateManager,
} from './state-manager'
/**
 * Utility functions for working with property wrappers
 */
export declare const StateUtils: {
  /**
   * Check if a value is any kind of property wrapper
   */
  isPropertyWrapper(value: any): value is {
    wrappedValue: any
    projectedValue: any
  }
  /**
   * Extract the wrapped value from any property wrapper
   */
  unwrap<T>(wrapper: any): T
  /**
   * Create a debug snapshot of all property wrappers in a component
   */
  createDebugSnapshot(componentId: string): any
}
/**
 * Default export with all property wrappers
 */
declare const _default: {
  State: import('./types').StateFactory
  EnvironmentObject: typeof EnvironmentObject
  createStateBinding: typeof createBinding
  createBinding: typeof createBinding
  makeObservable: typeof makeObservable
  observable: typeof observable
  createEnvironmentKey: typeof createEnvironmentKey
  provideEnvironmentObject: typeof provideEnvironmentObject
  createObservableEnvironmentObject: typeof createObservableEnvironmentObject
  CommonEnvironmentKeys: {
    Theme: import('../runtime/component-context').EnvironmentKey<{
      mode: 'light' | 'dark'
      primaryColor: string
      secondaryColor: string
    }>
    Localization: import('../runtime/component-context').EnvironmentKey<{
      locale: string
      t: (key: string, params?: Record<string, any>) => string
    }>
    Navigation: import('../runtime/component-context').EnvironmentKey<{
      navigate: (path: string) => void
      goBack: () => void
      getCurrentRoute: () => string
    }>
    Config: import('../runtime/component-context').EnvironmentKey<{
      apiUrl: string
      version: string
      environment: 'development' | 'staging' | 'production'
    }>
    Auth: import('../runtime/component-context').EnvironmentKey<{
      isAuthenticated: boolean
      user?: {
        id: string
        name: string
        email: string
      }
      login: (credentials: any) => Promise<void>
      logout: () => Promise<void>
    }>
  }
  StateUtils: {
    /**
     * Check if a value is any kind of property wrapper
     */
    isPropertyWrapper(value: any): value is {
      wrappedValue: any
      projectedValue: any
    }
    /**
     * Extract the wrapped value from any property wrapper
     */
    unwrap<T>(wrapper: any): T
    /**
     * Create a debug snapshot of all property wrappers in a component
     */
    createDebugSnapshot(componentId: string): any
  }
}
export default _default
//# sourceMappingURL=index.d.ts.map
