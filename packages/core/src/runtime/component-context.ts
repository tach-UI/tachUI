/**
 * Component Context System
 *
 * Provides proper context injection for component state management,
 * environment objects, and dependency injection. This fixes the broken
 * @State, @Binding, and @EnvironmentObject implementations.
 */

import { getCurrentOwner } from '../reactive/context'
import type { ComponentContext, ComponentInstance, ComponentProps } from './types'

/**
 * Symbol for component context storage in reactive owner
 */
export const ComponentContextSymbol = Symbol('TachUI.ComponentContext')

/**
 * Symbol for environment object storage
 */
export const EnvironmentSymbol = Symbol('TachUI.Environment')

/**
 * Current component context (set during component render)
 */
let currentComponentContext: ComponentContext | null = null


/**
 * Component context implementation
 */
class ComponentContextImpl implements ComponentContext {
  readonly id: string
  readonly parent?: ComponentContext
  readonly providers = new Map<symbol, any>()
  readonly consumers = new Set<symbol>()
  readonly cleanup = new Set<() => void>()

  // State management
  private stateStore = new Map<string, any>()
  private bindingStore = new Map<string, any>()

  // Performance tracking
  private createdAt = Date.now()
  private updateCount = 0

  constructor(id: string, parent?: ComponentContext) {
    this.id = id
    this.parent = parent
  }

  /**
   * Store state value for a property
   */
  setState<T = any>(propertyName: string, value: T): void {
    this.stateStore.set(propertyName, value)
    this.updateCount++
  }

  /**
   * Get state value for a property
   */
  getState<T = any>(propertyName: string): T | undefined {
    return this.stateStore.get(propertyName)
  }

  /**
   * Check if state exists for a property
   */
  hasState(propertyName: string): boolean {
    return this.stateStore.has(propertyName)
  }

  /**
   * Store binding for a property
   */
  setBinding(propertyName: string, binding: any): void {
    this.bindingStore.set(propertyName, binding)
  }

  /**
   * Get binding for a property
   */
  getBinding(propertyName: string): any {
    return this.bindingStore.get(propertyName)
  }

  /**
   * Provide a value for dependency injection
   */
  provide<T>(symbol: symbol, value: T): void {
    this.providers.set(symbol, value)
  }

  /**
   * Consume a value from dependency injection hierarchy
   */
  consume<T>(symbol: symbol): T | undefined {
    this.consumers.add(symbol)

    // Check local providers first
    if (this.providers.has(symbol)) {
      return this.providers.get(symbol)
    }

    // Walk up parent chain
    let context = this.parent
    while (context) {
      if (context.providers.has(symbol)) {
        return context.providers.get(symbol)
      }
      context = context.parent
    }

    return undefined
  }

  /**
   * Register cleanup function
   */
  onCleanup(fn: () => void): void {
    this.cleanup.add(fn)
  }

  /**
   * Dispose of context and run cleanup
   */
  dispose(): void {
    // Run cleanup functions
    for (const cleanup of this.cleanup) {
      try {
        cleanup()
      } catch (error) {
        console.error(`Error in component context cleanup (${this.id}):`, error)
      }
    }
    this.cleanup.clear()

    // Clear stores
    this.stateStore.clear()
    this.bindingStore.clear()
    this.providers.clear()
    this.consumers.clear()
  }

  /**
   * Get performance metrics
   */
  getMetrics() {
    return {
      id: this.id,
      createdAt: this.createdAt,
      updateCount: this.updateCount,
      stateCount: this.stateStore.size,
      bindingCount: this.bindingStore.size,
      providerCount: this.providers.size,
      consumerCount: this.consumers.size,
    }
  }
}

/**
 * Create a new component context
 */
export function createComponentContext(
  componentId: string,
  parent?: ComponentContext
): ComponentContext {
  return new ComponentContextImpl(componentId, parent)
}

/**
 * Get the current component context
 */
export function getCurrentComponentContext(): ComponentContext {
  // ALWAYS check global context first for immediate availability
  // This is more reliable when reactive context gets lost
  if (currentComponentContext) {
    return currentComponentContext
  }
  
  // Then check reactive owner chain as fallback
  let owner = getCurrentOwner()
  
  while (owner) {
    if (owner.context.has(ComponentContextSymbol)) {
      const context = owner.context.get(ComponentContextSymbol) as ComponentContext
      return context
    }
    owner = owner.parent
  }

  throw new Error(
    '@State can only be used within a component context. ' +
      'Make sure you are using @State inside a TachUI component render function.'
  )
}

/**
 * Set the current component context (used during rendering)
 */
export function setCurrentComponentContext(context: ComponentContext | null): void {
  currentComponentContext = context
}

/**
 * Run a function with a specific component context
 */
export function runWithComponentContext<T>(context: ComponentContext, fn: () => T): T {
  const prevContext = currentComponentContext
  currentComponentContext = context

  // CRITICAL: Always set in reactive owner if available
  // This is the primary mechanism for context storage
  const owner = getCurrentOwner()
  if (owner) {
    owner.context.set(ComponentContextSymbol, context)
  }

  try {
    const result = fn()
    return result
  } finally {
    // IMPORTANT: Only restore context if we're still the active context
    // Don't clear it if there was an error or if it was changed by something else
    if (currentComponentContext === context) {
      currentComponentContext = prevContext
    }

    // Clean up reactive owner context
    if (owner) {
      if (prevContext) {
        owner.context.set(ComponentContextSymbol, prevContext)
      } else {
        owner.context.delete(ComponentContextSymbol)
      }
    }
  }
}

/**
 * Enhanced component wrapper that provides context injection
 */
export function withComponentContext<P extends ComponentProps>(
  component: (props: P) => ComponentInstance<P>,
  contextId?: string
) {
  return (props: P): ComponentInstance<P> => {
    const componentId = contextId || `component-${Math.random().toString(36).substr(2, 9)}`

    // Get parent context if available
    const parentContext = currentComponentContext || undefined

    // Create component context
    const context = createComponentContext(componentId, parentContext)

    // Create the component instance with context
    return runWithComponentContext(context, () => {
      const instance = component(props)

      // Inject context into instance
      instance.context = context

      // Set up cleanup
      if (!instance.cleanup) {
        instance.cleanup = []
      }
      instance.cleanup.push(() => context.dispose())

      return instance
    })
  }
}

/**
 * Environment object key type
 */
export interface EnvironmentKey<T> {
  readonly symbol: symbol
  readonly defaultValue?: T
  readonly name: string
}

/**
 * Create an environment key
 */
export function createEnvironmentKey<T>(name: string, defaultValue?: T): EnvironmentKey<T> {
  return {
    symbol: Symbol(`Environment.${name}`),
    defaultValue,
    name,
  }
}

/**
 * Provide environment value
 */
export function provideEnvironmentValue<T>(key: EnvironmentKey<T>, value: T): void {
  const context = getCurrentComponentContext()
  context.provide(key.symbol, value)
}

/**
 * Consume environment value
 */
export function consumeEnvironmentValue<T>(key: EnvironmentKey<T>): T {
  const context = getCurrentComponentContext()
  const value = context.consume<T>(key.symbol)

  if (value !== undefined) {
    return value
  }

  if (key.defaultValue !== undefined) {
    return key.defaultValue
  }

  throw new Error(
    `Environment value for '${key.name}' not found. ` +
      `Make sure to provide this value higher in the component hierarchy.`
  )
}

/**
 * Debug utilities
 */
export const ComponentContextDebug = {
  getCurrentContext: () => currentComponentContext,

  getContextHierarchy: () => {
    const hierarchy: ComponentContext[] = []
    let context: ComponentContext | undefined = currentComponentContext || undefined
    while (context) {
      hierarchy.push(context)
      context = context.parent
    }
    return hierarchy
  },

  getContextMetrics: (context?: ComponentContext) => {
    const ctx = context || currentComponentContext
    return ctx ? (ctx as ComponentContextImpl).getMetrics() : null
  },
}
