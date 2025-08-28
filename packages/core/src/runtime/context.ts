/**
 * Context and Dependency Injection System (Phase 3.2.1)
 *
 * Reactive context system for state sharing and dependency injection
 * patterns. Provides Provider/Consumer patterns similar to React Context
 * but with fine-grained reactivity integration.
 */

import { createComputed, createSignal } from '../reactive'
import { createComponentContext } from './component-context'
import type { ComponentContext, ComponentInstance, ComponentProps } from './types'

/**
 * Context symbol for type-safe context identification
 */
export interface TachUIContext<T> {
  symbol: symbol
  defaultValue: T
  displayName?: string | undefined
}

/**
 * Context value with reactive capabilities
 */
interface ContextValue<T> {
  value: T
  signal: [() => T, (value: T) => void]
  subscribers: Set<symbol>
  providers: Set<ComponentContext>
}

/**
 * Global context registry
 */
class ContextRegistry {
  private static instance: ContextRegistry
  private contexts = new Map<symbol, ContextValue<any>>()
  private providerStack = new Map<symbol, ContextValue<any>[]>()
  private currentComponent: ComponentContext | null = null

  static getInstance(): ContextRegistry {
    if (!ContextRegistry.instance) {
      ContextRegistry.instance = new ContextRegistry()
    }
    return ContextRegistry.instance
  }

  /**
   * Set the current component context for provider resolution
   */
  setCurrentComponent(component: ComponentContext | null): void {
    this.currentComponent = component
  }

  /**
   * Get the current component context
   */
  getCurrentComponent(): ComponentContext | null {
    return this.currentComponent
  }

  /**
   * Register a context provider
   */
  registerProvider<T>(contextSymbol: symbol, value: T, component: ComponentContext): () => void {
    // Create or get context stack
    if (!this.providerStack.has(contextSymbol)) {
      this.providerStack.set(contextSymbol, [])
    }

    const stack = this.providerStack.get(contextSymbol)!

    // Create reactive signal for the context value
    const [getValue, setValue] = createSignal<T>(value)

    const contextValue: ContextValue<T> = {
      value,
      signal: [getValue, setValue],
      subscribers: new Set(),
      providers: new Set([component]),
    }

    // Push to stack (nested providers)
    stack.push(contextValue)

    // Register in component's providers
    component.providers.set(contextSymbol, contextValue)

    // Return cleanup function
    return () => {
      // Remove from stack
      const index = stack.indexOf(contextValue)
      if (index !== -1) {
        stack.splice(index, 1)
      }

      // Remove from component
      component.providers.delete(contextSymbol)

      // Cleanup subscribers
      contextValue.subscribers.clear()
      contextValue.providers.clear()
    }
  }

  /**
   * Get context value with reactive subscription
   */
  getContextValue<T>(contextSymbol: symbol, defaultValue: T): [() => T, boolean] {
    // Find the nearest provider in the stack
    const stack = this.providerStack.get(contextSymbol)
    const contextValue = stack && stack.length > 0 ? stack[stack.length - 1] : null

    if (contextValue) {
      // Subscribe current component to context changes
      if (this.currentComponent) {
        contextValue.subscribers.add(this.currentComponent.id as any)
        this.currentComponent.consumers.add(contextSymbol)
      }

      // Return reactive value
      return [contextValue.signal[0], true]
    }

    // Return default value if no provider found
    const [defaultSignal] = createSignal<T>(defaultValue)
    return [defaultSignal, false]
  }

  /**
   * Update context value and notify subscribers
   */
  updateContextValue<T>(contextSymbol: symbol, newValue: T): boolean {
    const stack = this.providerStack.get(contextSymbol)
    const contextValue = stack && stack.length > 0 ? stack[stack.length - 1] : null

    if (contextValue) {
      contextValue.value = newValue
      contextValue.signal[1](newValue)
      return true
    }

    return false
  }

  /**
   * Get all registered contexts (for debugging)
   */
  getAllContexts(): Map<symbol, ContextValue<any>> {
    const allContexts = new Map<symbol, ContextValue<any>>()

    for (const [symbol, stack] of this.providerStack.entries()) {
      if (stack.length > 0) {
        allContexts.set(symbol, stack[stack.length - 1])
      }
    }

    return allContexts
  }

  /**
   * Clear all contexts (for testing)
   */
  clear(): void {
    this.contexts.clear()
    this.providerStack.clear()
    this.currentComponent = null
  }
}

/**
 * Context Manager for high-level context operations
 */
export class ContextManager {
  private registry = ContextRegistry.getInstance()

  /**
   * Create a context provider component
   */
  createProvider<T>(
    context: TachUIContext<T>,
    value: T,
    children: ComponentInstance[]
  ): ComponentInstance {
    return {
      type: 'component',
      render: () => {
        // Register this provider
        const cleanup = this.registry.registerProvider(
          context.symbol,
          value,
          createComponentContext(`provider_${context.symbol.toString()}`)
        )

        // Render children with context available
        const childNodes = children.flatMap((child) => {
          const result = child.render()
          return Array.isArray(result) ? result : [result]
        })

        // Setup cleanup
        return [
          {
            type: 'element' as const,
            tag: 'div',
            props: { 'data-context-provider': context.displayName || 'provider' },
            children: childNodes,
            dispose: cleanup,
          },
        ]
      },
      props: { children },
      id: `provider_${Date.now()}`,
      children,
    }
  }

  /**
   * Set current component for context resolution
   */
  setCurrentComponent(component: ComponentContext | null): void {
    this.registry.setCurrentComponent(component)
  }

  /**
   * Update a context value
   */
  updateContext<T>(context: TachUIContext<T>, newValue: T): boolean {
    return this.registry.updateContextValue(context.symbol, newValue)
  }

  /**
   * Get all active contexts (for debugging)
   */
  getAllContexts(): Map<symbol, any> {
    return this.registry.getAllContexts()
  }

  /**
   * Clear all contexts
   */
  clear(): void {
    this.registry.clear()
  }
}

/**
 * Create a new context
 */
export function createContext<T>(
  defaultValue: T,
  options: {
    displayName?: string
  } = {}
): TachUIContext<T> {
  return {
    symbol: Symbol(options.displayName || 'TachUIContext'),
    defaultValue,
    displayName: options.displayName,
  }
}

/**
 * Use context hook equivalent
 */
export function useContext<T>(context: TachUIContext<T>): () => T {
  const registry = ContextRegistry.getInstance()
  const [getValue, hasProvider] = registry.getContextValue(context.symbol, context.defaultValue)

  if (!hasProvider) {
    console.warn(
      `Context ${context.displayName || 'unnamed'} used without a Provider. Using default value.`
    )
  }

  return getValue
}

/**
 * Create context provider HOC
 */
export function withProvider<T, P extends ComponentProps>(context: TachUIContext<T>, value: T) {
  return (WrappedComponent: (props: P) => ComponentInstance) =>
    function ProviderWrapper(props: P): ComponentInstance {
      const manager = new ContextManager()

      return manager.createProvider(context, value, [WrappedComponent(props)])
    }
}

/**
 * Create reactive context consumer
 */
export function createContextConsumer<T>(
  context: TachUIContext<T>,
  render: (value: T) => ComponentInstance
): ComponentInstance {
  return {
    type: 'component',
    render: () => {
      const getValue = useContext(context)

      // Create reactive effect for context changes
      const consumerInstance = createComputed(() => {
        const value = getValue()
        return render(value)
      })

      const result = consumerInstance().render()
      return Array.isArray(result) ? result : [result]
    },
    props: {},
    id: `consumer_${Date.now()}`,
  }
}

/**
 * Dependency injection container
 */
export class DIContainer {
  private services = new Map<symbol | string, any>()
  private factories = new Map<symbol | string, () => any>()
  private singletons = new Map<symbol | string, any>()
  private scoped = new Map<symbol | string, any>()
  private dependencies = new Map<symbol | string, (symbol | string)[]>()

  /**
   * Register a service with the container
   */
  register<T>(
    key: symbol | string,
    implementation: T | (() => T),
    options: {
      singleton?: boolean
      scoped?: boolean
      dependencies?: (symbol | string)[]
    } = {}
  ): void {
    // Always register as service - we'll handle function vs class in createInstance
    this.services.set(key, implementation)

    if (options.dependencies) {
      this.dependencies.set(key, options.dependencies)
    }

    if (options.singleton) {
      this.singletons.set(key, null) // Will be created on first access
    }

    if (options.scoped) {
      this.scoped.set(key, null) // Will be created per scope
    }
  }

  /**
   * Resolve a service from the container
   */
  resolve<T>(key: symbol | string): T {
    // Check for singleton
    if (this.singletons.has(key)) {
      let instance = this.singletons.get(key)
      if (instance === null) {
        instance = this.createInstance<T>(key)
        this.singletons.set(key, instance)
      }
      return instance
    }

    // Check for scoped (simplified - would need scope management in real implementation)
    if (this.scoped.has(key)) {
      let instance = this.scoped.get(key)
      if (instance === null) {
        instance = this.createInstance<T>(key)
        this.scoped.set(key, instance)
      }
      return instance
    }

    // Create new instance
    return this.createInstance<T>(key)
  }

  /**
   * Create instance with dependency injection
   */
  private createInstance<T>(key: symbol | string): T {
    // Get dependencies
    const deps = this.dependencies.get(key) || []
    const resolvedDeps = deps.map((dep) => this.resolve(dep))

    // Check for factory
    const factory = this.factories.get(key)
    if (factory) {
      return (factory as any)(...resolvedDeps)
    }

    // Get service
    const service = this.services.get(key)
    if (service) {
      if (typeof service === 'function') {
        // Check if it's a class constructor or regular function
        try {
          return new (service as any)(...resolvedDeps)
        } catch (_error) {
          // If 'new' fails, try calling as function
          return (service as any)(...resolvedDeps)
        }
      }
      return service
    }

    throw new Error(`Service ${String(key)} not found in DI container`)
  }

  /**
   * Check if service is registered
   */
  has(key: symbol | string): boolean {
    return this.services.has(key) || this.factories.has(key)
  }

  /**
   * Clear the container
   */
  clear(): void {
    this.services.clear()
    this.factories.clear()
    this.singletons.clear()
    this.scoped.clear()
    this.dependencies.clear()
  }

  /**
   * Get all registered services (for debugging)
   */
  getRegistered(): (symbol | string)[] {
    return [...this.services.keys(), ...this.factories.keys()]
  }
}

/**
 * Global DI container instance
 */
export const globalDI = new DIContainer()

/**
 * Inject dependencies into a component
 */
export function inject<T>(key: symbol | string): T {
  return globalDI.resolve<T>(key)
}

/**
 * Create service registration decorator (for future use)
 */
export function Injectable(key?: symbol | string) {
  return <T extends new (...args: any[]) => any>(constructor: T) => {
    const serviceKey = key || constructor.name
    globalDI.register(serviceKey, constructor)
    return constructor
  }
}

/**
 * Context utilities
 */
export const contextUtils = {
  /**
   * Create multiple contexts at once
   */
  createContextGroup<T extends Record<string, any>>(
    defaults: T,
    options: { prefix?: string } = {}
  ): { [K in keyof T]: TachUIContext<T[K]> } {
    const contexts = {} as { [K in keyof T]: TachUIContext<T[K]> }

    for (const [key, value] of Object.entries(defaults)) {
      contexts[key as keyof T] = createContext(value, {
        displayName: options.prefix ? `${options.prefix}.${key}` : key,
      })
    }

    return contexts
  },

  /**
   * Combine multiple context providers
   */
  combineProviders<T extends Record<string, any>>(
    contexts: { [K in keyof T]: TachUIContext<T[K]> },
    values: T,
    children: ComponentInstance[]
  ): ComponentInstance {
    const manager = new ContextManager()

    // Nest providers
    let currentChildren = children

    for (const [key, context] of Object.entries(contexts)) {
      const value = values[key as keyof T]
      currentChildren = [manager.createProvider(context, value, currentChildren)]
    }

    return currentChildren[0]
  },

  /**
   * Create context with validation
   */
  createValidatedContext<T>(
    defaultValue: T,
    validator: (value: T) => boolean | string,
    options: { displayName?: string } = {}
  ): TachUIContext<T> & { validate: (value: T) => boolean | string } {
    const context = createContext(defaultValue, options)

    return {
      ...context,
      validate: validator,
    }
  },
}

/**
 * Default context manager instance
 */
export const defaultContextManager = new ContextManager()
