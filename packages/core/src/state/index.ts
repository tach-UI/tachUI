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
  CommonEnvironmentKeys,
  createEnvironmentKey,
  createObservableEnvironmentObject,
  provideEnvironmentObject,
} from './environment'
import { EnvironmentObject } from './environment-object'
import { makeObservable, observable } from './observed-object'
// Import actual implementations
import { createBinding, createStateBinding, State } from './state'

// Enhanced @Binding property wrapper
export {
  BindingImpl,
  BindingUtils,
  createBinding as createEnhancedBinding,
  isBinding as isEnhancedBinding,
} from './binding'
// @EnvironmentObject property wrapper — the corrected environment-object
// implementations: provider registry with provide()/revoke(), the
// options-object EnvironmentObject factory, and default-aware value
// resolution where registered providers take precedence over key defaults.
// createEnvironmentKey intentionally stays bound to the runtime variant
// (name-first signature, re-exported by './runtime' at the root barrel); its
// keys are fully compatible with the environment-object resolution paths.
export {
  CommonEnvironmentKeys,
  createEnvironmentKey,
  createObservableEnvironmentObject,
  provideEnvironmentObject,
} from './environment'
export {
  createEnvironmentObjectProvider,
  EnvironmentObject,
  isEnvironmentKey,
  isEnvironmentObject,
  useEnvironmentObject,
} from './environment-object'

// @ObservedObject property wrapper
export {
  createObservableStore,
  isObservableObject,
  isObservedObject,
  makeObservable,
  ObservableObjectBase,
  ObservedObjectWrapper as ObservedObject,
  observable,
} from './observed-object'
// @State property wrapper
export {
  createBinding,
  createStateBinding,
  isBinding,
  isState,
  State,
  unwrapValue,
} from './state'
// Core types
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

// Environment object utilities are re-exported from './environment-object'
// (see the @EnvironmentObject block above) — the previous legacy-compat
// aliases pointed at incompatible implementations from './environment'.

/**
 * Re-export commonly used reactive primitives from the reactive system
 */
export { createComputed, createEffect, createMemo, createSignal } from '../reactive'
// State manager
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
export const StateUtils = {
  /**
   * Check if a value is any kind of property wrapper
   */
  isPropertyWrapper(value: any): value is { wrappedValue: any; projectedValue: any } {
    return (
      value && typeof value === 'object' && 'wrappedValue' in value && 'projectedValue' in value
    )
  },

  /**
   * Extract the wrapped value from any property wrapper
   */
  unwrap<T>(wrapper: any): T {
    if (this.isPropertyWrapper(wrapper)) {
      return wrapper.wrappedValue
    }
    return wrapper
  },

  /**
   * Create a debug snapshot of all property wrappers in a component
   */
  createDebugSnapshot(componentId: string): any {
    if (typeof window !== 'undefined') {
      const debug = (window as any).__TACHUI_DEBUG__
      if (debug) {
        return {
          states: debug.states
            ? Object.keys(debug.states)
                .filter((key: string) => key.startsWith(componentId))
                .reduce((acc: any, key: string) => {
                  acc[key] = debug.states[key].getValue()
                  return acc
                }, {})
            : {},
          observedObjects: debug.observedObjects
            ? Object.keys(debug.observedObjects)
                .filter((key: string) => key.startsWith(componentId))
                .reduce((acc: any, key: string) => {
                  acc[key] = {
                    notificationCount: debug.observedObjects[key].getNotificationCount(),
                    object: debug.observedObjects[key].getObject(),
                  }
                  return acc
                }, {})
            : {},
        }
      }
    }
    return null
  },
}

/**
 * Default export with all property wrappers
 */
export default {
  State,
  EnvironmentObject,
  createStateBinding,
  createBinding,
  makeObservable,
  observable,
  createEnvironmentKey,
  provideEnvironmentObject,
  createObservableEnvironmentObject,
  CommonEnvironmentKeys,
  StateUtils,
}
