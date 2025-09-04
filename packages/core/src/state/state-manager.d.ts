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
  PropertyWrapperRegistry,
  State,
  StateManager,
  StateWrapperOptions,
} from './types'
/**
 * Internal state manager implementation
 */
export declare class StateManagerImpl implements StateManager {
  readonly componentContext: ComponentContext
  private states
  private bindings
  private observedObjects
  private environmentObjects
  private registry
  constructor(componentContext: ComponentContext)
  /**
   * Register a @State property wrapper
   */
  registerState<T>(state: State<T>, _options?: StateWrapperOptions): void
  /**
   * Register a @Binding property wrapper
   */
  registerBinding<T>(binding: Binding<T>, options?: BindingOptions<T>): void
  /**
   * Register an @ObservedObject property wrapper
   */
  registerObservedObject<T extends ObservableObject>(
    observedObject: ObservedObject<T>,
    _options?: ObservableObjectOptions
  ): void
  /**
   * Register an @EnvironmentObject property wrapper
   */
  registerEnvironmentObject<T>(
    environmentObject: EnvironmentObject<T>,
    _options: EnvironmentObjectOptions<T>
  ): void
  /**
   * Clean up all property wrappers for this component
   */
  cleanup(): void
  /**
   * Get all registered states (for debugging)
   */
  getStates(): Map<string, State<any>>
  /**
   * Get all registered bindings (for debugging)
   */
  getBindings(): Map<string, Binding<any>>
  /**
   * Get all registered observed objects (for debugging)
   */
  getObservedObjects(): Map<string, ObservedObject<any>>
  /**
   * Get all registered environment objects (for debugging)
   */
  getEnvironmentObjects(): Map<string, EnvironmentObject<any>>
  /**
   * Get property wrapper registry
   */
  getRegistry(): PropertyWrapperRegistry
  /**
   * Set up debugging for @State property wrappers
   */
  private setupStateDebugging
  /**
   * Set up debugging for @ObservedObject property wrappers
   */
  private setupObservedObjectDebugging
}
/**
 * Create a state manager for a component
 */
export declare function createStateManager(
  componentContext: ComponentContext
): StateManager
/**
 * Register a state manager globally
 */
export declare function registerStateManager(
  componentId: string,
  manager: StateManager
): void
/**
 * Unregister a state manager globally
 */
export declare function unregisterStateManager(componentId: string): void
/**
 * Get a state manager by component ID
 */
export declare function getStateManager(
  componentId: string
): StateManager | undefined
/**
 * Get all state managers (for debugging)
 */
export declare function getAllStateManagers(): Map<string, StateManager>
/**
 * Get debugging information for all state managers
 */
export declare function getStateManagerDebugInfo(): any
/**
 * Initialize global debugging utilities
 */
export declare function initializeStateDebugging(): void
//# sourceMappingURL=state-manager.d.ts.map
