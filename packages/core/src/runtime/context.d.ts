/**
 * Context and Dependency Injection System (Phase 3.2.1)
 *
 * Reactive context system for state sharing and dependency injection
 * patterns. Provides Provider/Consumer patterns similar to React Context
 * but with fine-grained reactivity integration.
 */
import type {
  ComponentContext,
  ComponentInstance,
  ComponentProps,
} from './types'
/**
 * Context symbol for type-safe context identification
 */
export interface TachUIContext<T> {
  symbol: symbol
  defaultValue: T
  displayName?: string | undefined
}
/**
 * Context Manager for high-level context operations
 */
export declare class ContextManager {
  private registry
  /**
   * Create a context provider component
   */
  createProvider<T>(
    context: TachUIContext<T>,
    value: T,
    children: ComponentInstance[]
  ): ComponentInstance
  /**
   * Set current component for context resolution
   */
  setCurrentComponent(component: ComponentContext | null): void
  /**
   * Update a context value
   */
  updateContext<T>(context: TachUIContext<T>, newValue: T): boolean
  /**
   * Get all active contexts (for debugging)
   */
  getAllContexts(): Map<symbol, any>
  /**
   * Clear all contexts
   */
  clear(): void
}
/**
 * Create a new context
 */
export declare function createContext<T>(
  defaultValue: T,
  options?: {
    displayName?: string
  }
): TachUIContext<T>
/**
 * Use context hook equivalent
 */
export declare function useContext<T>(context: TachUIContext<T>): () => T
/**
 * Create context provider HOC
 */
export declare function withProvider<T, P extends ComponentProps>(
  context: TachUIContext<T>,
  value: T
): (
  WrappedComponent: (props: P) => ComponentInstance
) => (props: P) => ComponentInstance
/**
 * Create reactive context consumer
 */
export declare function createContextConsumer<T>(
  context: TachUIContext<T>,
  render: (value: T) => ComponentInstance
): ComponentInstance
/**
 * Dependency injection container
 */
export declare class DIContainer {
  private services
  private factories
  private singletons
  private scoped
  private dependencies
  /**
   * Register a service with the container
   */
  register<T>(
    key: symbol | string,
    implementation: T | (() => T),
    options?: {
      singleton?: boolean
      scoped?: boolean
      dependencies?: (symbol | string)[]
    }
  ): void
  /**
   * Resolve a service from the container
   */
  resolve<T>(key: symbol | string): T
  /**
   * Create instance with dependency injection
   */
  private createInstance
  /**
   * Check if service is registered
   */
  has(key: symbol | string): boolean
  /**
   * Clear the container
   */
  clear(): void
  /**
   * Get all registered services (for debugging)
   */
  getRegistered(): (symbol | string)[]
}
/**
 * Global DI container instance
 */
export declare const globalDI: DIContainer
/**
 * Inject dependencies into a component
 */
export declare function inject<T>(key: symbol | string): T
/**
 * Create service registration decorator (for future use)
 */
export declare function Injectable(
  key?: symbol | string
): <T extends new (...args: any[]) => any>(constructor: T) => T
/**
 * Context utilities
 */
export declare const contextUtils: {
  /**
   * Create multiple contexts at once
   */
  createContextGroup<T extends Record<string, any>>(
    defaults: T,
    options?: {
      prefix?: string
    }
  ): { [K in keyof T]: TachUIContext<T[K]> }
  /**
   * Combine multiple context providers
   */
  combineProviders<T extends Record<string, any>>(
    contexts: { [K in keyof T]: TachUIContext<T[K]> },
    values: T,
    children: ComponentInstance[]
  ): ComponentInstance
  /**
   * Create context with validation
   */
  createValidatedContext<T>(
    defaultValue: T,
    validator: (value: T) => boolean | string,
    options?: {
      displayName?: string
    }
  ): TachUIContext<T> & {
    validate: (value: T) => boolean | string
  }
}
/**
 * Default context manager instance
 */
export declare const defaultContextManager: ContextManager
//# sourceMappingURL=context.d.ts.map
