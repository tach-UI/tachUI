/**
 * State Manager Implementation
 *
 * Manages the lifecycle of all property wrappers (@State, @Binding, @ObservedObject, @EnvironmentObject)
 * within a component context. Handles registration, cleanup, and debugging utilities.
 */

import type { ComponentContext } from '../runtime/types'
import type {
  Binding,
  BindingOptions,
  EnvironmentObject,
  EnvironmentObjectOptions,
  ObservableObject,
  ObservableObjectOptions,
  ObservedObject,
  PropertyWrapperMetadata,
  PropertyWrapperRegistry,
  State,
  StateManager,
  StateWrapperOptions,
} from './types'

/**
 * Internal state manager implementation
 */
export class StateManagerImpl implements StateManager {
  private states = new Map<string, State<any>>()
  private bindings = new Map<string, Binding<any>>()
  private observedObjects = new Map<string, ObservedObject<any>>()
  private environmentObjects = new Map<string, EnvironmentObject<any>>()
  private registry: PropertyWrapperRegistry

  constructor(public readonly componentContext: ComponentContext) {
    this.registry = new PropertyWrapperRegistryImpl()
  }

  /**
   * Register a @State property wrapper
   */
  registerState<T>(state: State<T>, _options: StateWrapperOptions = {}): void {
    const metadata = (state as any).metadata as PropertyWrapperMetadata
    if (metadata) {
      const key = `${metadata.componentId}_${metadata.propertyName}`
      this.states.set(key, state)
      this.registry.register(metadata)

      // Set up debugging if in development mode
      if (process.env.NODE_ENV === 'development') {
        this.setupStateDebugging(state, metadata)
      }
    }
  }

  /**
   * Register a @Binding property wrapper
   */
  registerBinding<T>(binding: Binding<T>, options: BindingOptions<T> = {}): void {
    const key = `${this.componentContext.id}_${options.name || 'binding'}_${Date.now()}`
    this.bindings.set(key, binding)

    const metadata: PropertyWrapperMetadata = {
      type: 'Binding',
      propertyName: options.name || 'binding',
      componentId: this.componentContext.id,
      options,
    }
    this.registry.register(metadata)
  }

  /**
   * Register an @ObservedObject property wrapper
   */
  registerObservedObject<T extends ObservableObject>(
    observedObject: ObservedObject<T>,
    _options: ObservableObjectOptions = {}
  ): void {
    const metadata = (observedObject as any).metadata as PropertyWrapperMetadata
    if (metadata) {
      const key = `${metadata.componentId}_${metadata.propertyName}`
      this.observedObjects.set(key, observedObject)
      this.registry.register(metadata)

      // Set up debugging if in development mode
      if (process.env.NODE_ENV === 'development') {
        this.setupObservedObjectDebugging(observedObject, metadata)
      }
    }
  }

  /**
   * Register an @EnvironmentObject property wrapper
   */
  registerEnvironmentObject<T>(
    environmentObject: EnvironmentObject<T>,
    _options: EnvironmentObjectOptions<T>
  ): void {
    const metadata = (environmentObject as any).metadata as PropertyWrapperMetadata
    if (metadata) {
      const key = `${metadata.componentId}_${metadata.propertyName}`
      this.environmentObjects.set(key, environmentObject)
      this.registry.register(metadata)
    }
  }

  /**
   * Clean up all property wrappers for this component
   */
  cleanup(): void {
    // Clear all registered property wrappers
    this.states.clear()
    this.bindings.clear()
    this.observedObjects.clear()
    this.environmentObjects.clear()

    // Clean up registry
    this.registry.cleanup(this.componentContext.id)
  }

  /**
   * Get all registered states (for debugging)
   */
  getStates(): Map<string, State<any>> {
    return new Map(this.states)
  }

  /**
   * Get all registered bindings (for debugging)
   */
  getBindings(): Map<string, Binding<any>> {
    return new Map(this.bindings)
  }

  /**
   * Get all registered observed objects (for debugging)
   */
  getObservedObjects(): Map<string, ObservedObject<any>> {
    return new Map(this.observedObjects)
  }

  /**
   * Get all registered environment objects (for debugging)
   */
  getEnvironmentObjects(): Map<string, EnvironmentObject<any>> {
    return new Map(this.environmentObjects)
  }

  /**
   * Get property wrapper registry
   */
  getRegistry(): PropertyWrapperRegistry {
    return this.registry
  }

  /**
   * Set up debugging for @State property wrappers
   */
  private setupStateDebugging<T>(state: State<T>, metadata: PropertyWrapperMetadata): void {
    if (typeof window !== 'undefined') {
      // Add to global debug object
      const globalDebug = (window as any).__TACHUI_DEBUG__ || {}
      if (!globalDebug.states) globalDebug.states = {}

      globalDebug.states[`${metadata.componentId}_${metadata.propertyName}`] = {
        state,
        metadata,
        getValue: () => state.wrappedValue,
        setValue: (value: T) => {
          state.projectedValue.set(value)
        },
        getBinding: () => state.projectedValue,
      }

      ;(window as any).__TACHUI_DEBUG__ = globalDebug
    }
  }

  /**
   * Set up debugging for @ObservedObject property wrappers
   */
  private setupObservedObjectDebugging<T extends ObservableObject>(
    observedObject: ObservedObject<T>,
    metadata: PropertyWrapperMetadata
  ): void {
    if (typeof window !== 'undefined') {
      // Add to global debug object
      const globalDebug = (window as any).__TACHUI_DEBUG__ || {}
      if (!globalDebug.observedObjects) globalDebug.observedObjects = {}

      globalDebug.observedObjects[`${metadata.componentId}_${metadata.propertyName}`] = {
        observedObject,
        metadata,
        getObject: () => observedObject.wrappedValue,
        getNotificationCount: () => (observedObject.wrappedValue as any).notificationCount || 0,
        triggerChange: () => observedObject.wrappedValue.notifyChange(),
      }

      ;(window as any).__TACHUI_DEBUG__ = globalDebug
    }
  }
}

/**
 * Property wrapper registry implementation
 */
class PropertyWrapperRegistryImpl implements PropertyWrapperRegistry {
  private metadata = new Map<string, PropertyWrapperMetadata[]>()

  /**
   * Register property wrapper metadata
   */
  register(metadata: PropertyWrapperMetadata): void {
    const key = metadata.componentId
    const existing = this.metadata.get(key) || []
    existing.push(metadata)
    this.metadata.set(key, existing)
  }

  /**
   * Unregister a specific property wrapper
   */
  unregister(componentId: string, propertyName: string): void {
    const existing = this.metadata.get(componentId) || []
    const filtered = existing.filter((m) => m.propertyName !== propertyName)

    if (filtered.length > 0) {
      this.metadata.set(componentId, filtered)
    } else {
      this.metadata.delete(componentId)
    }
  }

  /**
   * Clean up all metadata for a component
   */
  cleanup(componentId: string): void {
    this.metadata.delete(componentId)
  }

  /**
   * Get all metadata for a component
   */
  getMetadata(componentId: string): PropertyWrapperMetadata[] {
    return this.metadata.get(componentId) || []
  }

  /**
   * Get all registered metadata (for debugging)
   */
  getAllMetadata(): Map<string, PropertyWrapperMetadata[]> {
    return new Map(this.metadata)
  }
}

/**
 * Create a state manager for a component
 */
export function createStateManager(componentContext: ComponentContext): StateManager {
  return new StateManagerImpl(componentContext)
}

/**
 * Global state manager registry for debugging and introspection
 */
class GlobalStateManagerRegistry {
  private static instance: GlobalStateManagerRegistry
  private managers = new Map<string, StateManager>()

  static getInstance(): GlobalStateManagerRegistry {
    if (!GlobalStateManagerRegistry.instance) {
      GlobalStateManagerRegistry.instance = new GlobalStateManagerRegistry()
    }
    return GlobalStateManagerRegistry.instance
  }

  register(componentId: string, manager: StateManager): void {
    this.managers.set(componentId, manager)
  }

  unregister(componentId: string): void {
    this.managers.delete(componentId)
  }

  getManager(componentId: string): StateManager | undefined {
    return this.managers.get(componentId)
  }

  getAllManagers(): Map<string, StateManager> {
    return new Map(this.managers)
  }

  /**
   * Get debugging information for all components
   */
  getDebugInfo(): any {
    const info: any = {}

    for (const [componentId, manager] of this.managers) {
      info[componentId] = {
        states: (manager as StateManagerImpl).getStates().size,
        bindings: (manager as StateManagerImpl).getBindings().size,
        observedObjects: (manager as StateManagerImpl).getObservedObjects().size,
        environmentObjects: (manager as StateManagerImpl).getEnvironmentObjects().size,
        metadata: (manager as StateManagerImpl).getRegistry().getMetadata(componentId),
      }
    }

    return info
  }
}

/**
 * Register a state manager globally
 */
export function registerStateManager(componentId: string, manager: StateManager): void {
  GlobalStateManagerRegistry.getInstance().register(componentId, manager)
}

/**
 * Unregister a state manager globally
 */
export function unregisterStateManager(componentId: string): void {
  GlobalStateManagerRegistry.getInstance().unregister(componentId)
}

/**
 * Get a state manager by component ID
 */
export function getStateManager(componentId: string): StateManager | undefined {
  return GlobalStateManagerRegistry.getInstance().getManager(componentId)
}

/**
 * Get all state managers (for debugging)
 */
export function getAllStateManagers(): Map<string, StateManager> {
  return GlobalStateManagerRegistry.getInstance().getAllManagers()
}

/**
 * Get debugging information for all state managers
 */
export function getStateManagerDebugInfo(): any {
  return GlobalStateManagerRegistry.getInstance().getDebugInfo()
}

/**
 * Initialize global debugging utilities
 */
export function initializeStateDebugging(): void {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    const globalDebug = (window as any).__TACHUI_DEBUG__ || {}

    globalDebug.stateManagers = {
      getAll: getAllStateManagers,
      getDebugInfo: getStateManagerDebugInfo,
      getManager: getStateManager,
    }

    ;(window as any).__TACHUI_DEBUG__ = globalDebug

    console.log(
      'TachUI State Management debugging enabled. Use window.__TACHUI_DEBUG__.stateManagers'
    )
  }
}
