/**
 * @EnvironmentObject Property Wrapper Implementation
 *
 * Implements SwiftUI's @EnvironmentObject property wrapper for dependency injection.
 * Allows components to access shared objects from the environment context hierarchy.
 */

import { getCurrentOwner } from '../reactive/context'
import { createContext, useContext } from '../runtime/context'
import type { ComponentContext } from '../runtime/types'
import type * as Types from './types'
import type {
  EnvironmentKey,
  EnvironmentObjectOptions,
  EnvironmentObjectProvider,
  PropertyWrapperMetadata,
} from './types'

/**
 * Registry for environment object keys and providers
 */
class EnvironmentRegistry {
  private static instance: EnvironmentRegistry
  private keys = new Map<symbol, EnvironmentKey<any>>()
  private providers = new Map<symbol, EnvironmentObjectProvider<any>>()

  static getInstance(): EnvironmentRegistry {
    if (!EnvironmentRegistry.instance) {
      EnvironmentRegistry.instance = new EnvironmentRegistry()
    }
    return EnvironmentRegistry.instance
  }

  registerKey<T>(key: EnvironmentKey<T>): void {
    this.keys.set(key.symbol, key)
  }

  getKey<T>(symbol: symbol): EnvironmentKey<T> | undefined {
    return this.keys.get(symbol)
  }

  registerProvider<T>(provider: EnvironmentObjectProvider<T>): void {
    this.providers.set(provider.key.symbol, provider)
  }

  getProvider<T>(symbol: symbol): EnvironmentObjectProvider<T> | undefined {
    return this.providers.get(symbol)
  }

  removeProvider(symbol: symbol): void {
    this.providers.delete(symbol)
  }
}

/**
 * Create an environment key for type-safe environment object access
 *
 * @param defaultValue - Optional default value if no provider is found
 * @returns An environment key that can be used with @EnvironmentObject
 *
 * @example
 * ```typescript
 * interface UserSettings {
 *   theme: 'light' | 'dark'
 *   language: string
 * }
 *
 * const UserSettingsKey = createEnvironmentKey<UserSettings>(
 *   { theme: 'light', language: 'en' }
 * )
 * ```
 */
export function createEnvironmentKey<T>(defaultValue?: T): EnvironmentKey<T> {
  const symbol = Symbol('EnvironmentKey')
  const key: EnvironmentKey<T> = {
    symbol,
    defaultValue,
  }

  // Register the key for debugging and introspection
  EnvironmentRegistry.getInstance().registerKey(key)

  return key
}

/**
 * Internal environment object wrapper implementation
 */
class EnvironmentObjectImpl<T> implements Types.EnvironmentObject<T> {
  private _value: T
  private _metadata: PropertyWrapperMetadata
  private _key: EnvironmentKey<T>

  constructor(
    key: EnvironmentKey<T>,
    componentContext: ComponentContext,
    propertyName: string,
    options: EnvironmentObjectOptions<T>
  ) {
    this._key = key

    // Store metadata for introspection
    this._metadata = {
      type: 'EnvironmentObject',
      propertyName,
      componentId: componentContext.id,
      options,
    }

    // Try to resolve the environment object from context
    this._value = this.resolveEnvironmentObject(key, options.required)

    // Register with component context for lifecycle management
    if ((componentContext as any).stateManager) {
      ;(componentContext as any).stateManager.registerEnvironmentObject(this, options)
    }

    // Set up cleanup on component unmount
    const owner = getCurrentOwner()
    if (owner) {
      owner.cleanups.push(() => {
        this.cleanup()
      })
    }
  }

  get wrappedValue(): T {
    return this._value
  }

  get projectedValue(): Types.EnvironmentObject<T> {
    return this
  }

  /**
   * Get property wrapper metadata
   */
  get metadata(): PropertyWrapperMetadata {
    return this._metadata
  }

  /**
   * Get the environment key
   */
  get key(): EnvironmentKey<T> {
    return this._key
  }

  /**
   * Resolve the environment object from the context hierarchy
   */
  private resolveEnvironmentObject(key: EnvironmentKey<T>, required: boolean = false): T {
    try {
      // Try to use the context system to find the environment object
      const contextValue = useContext(
        createContext(key.defaultValue, { displayName: key.symbol.toString() })
      )
      if (contextValue !== undefined) {
        return contextValue as T
      }
    } catch (_error) {
      // Context resolution failed, try registry
    }

    // Try to find in the environment registry
    const provider = EnvironmentRegistry.getInstance().getProvider<T>(key.symbol)
    if (provider) {
      return provider.value
    }

    // Use default value if available
    if (key.defaultValue !== undefined) {
      return key.defaultValue
    }

    // Throw error if required and not found
    if (required) {
      throw new Error(
        `Required environment object not found for key ${key.symbol.toString()}. ` +
          `Make sure to provide the environment object using EnvironmentObjectProvider.`
      )
    }

    // Return undefined for optional environment objects
    return key.defaultValue as T
  }

  /**
   * Update the environment object value (for hot updates)
   */
  updateValue(newValue: T): void {
    this._value = newValue
  }

  /**
   * Cleanup resources
   */
  private cleanup(): void {
    // Any cleanup logic would go here
  }
}

/**
 * Environment object provider implementation
 */
class EnvironmentObjectProviderImpl<T> implements EnvironmentObjectProvider<T> {
  constructor(
    public readonly key: EnvironmentKey<T>,
    public readonly value: T
  ) {}

  provide(): void {
    EnvironmentRegistry.getInstance().registerProvider(this)
  }

  revoke(): void {
    EnvironmentRegistry.getInstance().removeProvider(this.key.symbol)
  }
}

/**
 * @EnvironmentObject property wrapper factory
 *
 * Creates an @EnvironmentObject property wrapper for accessing shared objects
 * from the environment context. The object must be provided by a parent component
 * using EnvironmentObjectProvider.
 *
 * @param options - Configuration options including the environment key
 * @returns An EnvironmentObject property wrapper
 *
 * @example
 * ```typescript
 * const UserSettingsKey = createEnvironmentKey<UserSettings>()
 *
 * class ChildComponent {
 *   @EnvironmentObject({ key: UserSettingsKey, required: true })
 *   private settings: UserSettings
 *
 *   render() {
 *     return Text(`Theme: ${this.settings.theme}`)
 *   }
 * }
 * ```
 */
export const EnvironmentObject = <T>(
  options: EnvironmentObjectOptions<T>
): Types.EnvironmentObject<T> => {
  // This will be replaced by the decorator transformer during compilation
  const componentContext = getCurrentComponentContext()
  const propertyName = getCallerPropertyName() || 'environmentObject'

  return new EnvironmentObjectImpl(options.key, componentContext, propertyName, options)
}

/**
 * Create an environment object provider
 *
 * @param key - The environment key for the object
 * @param value - The object value to provide
 * @returns An environment object provider
 *
 * @example
 * ```typescript
 * const userSettings = { theme: 'dark', language: 'en' }
 * const provider = createEnvironmentObjectProvider(UserSettingsKey, userSettings)
 *
 * // Provide the object to child components
 * provider.provide()
 *
 * // Later, revoke the provider
 * provider.revoke()
 * ```
 */
export function createEnvironmentObjectProvider<T>(
  key: EnvironmentKey<T>,
  value: T
): EnvironmentObjectProvider<T> {
  return new EnvironmentObjectProviderImpl(key, value)
}

/**
 * Environment object provider component wrapper
 *
 * @param key - The environment key
 * @param value - The value to provide
 * @param children - Child components that can access the environment object
 * @returns A provider component
 *
 * @example
 * ```typescript
 * const userSettings = { theme: 'dark', language: 'en' }
 *
 * return EnvironmentObjectProviderComponent(
 *   UserSettingsKey,
 *   userSettings,
 *   [
 *     ChildComponent1(),
 *     ChildComponent2()
 *   ]
 * )
 * ```
 */
export function EnvironmentObjectProviderComponent<T>(
  key: EnvironmentKey<T>,
  value: T,
  children: any[]
): any {
  const provider = createEnvironmentObjectProvider(key, value)

  // Provide the environment object
  provider.provide()

  // Create a context provider component

  return {
    type: 'environment-provider',
    key: key.symbol,
    value,
    children,
    // Cleanup function to revoke provider
    cleanup: () => provider.revoke(),
  }
}

/**
 * Utility to access environment objects directly (outside of property wrappers)
 *
 * @param key - The environment key
 * @param required - Whether the object is required
 * @returns The environment object value
 *
 * @example
 * ```typescript
 * const settings = useEnvironmentObject(UserSettingsKey, true)
 * console.log(settings.theme)
 * ```
 */
export function useEnvironmentObject<T>(key: EnvironmentKey<T>, required: boolean = false): T {
  // Try context first
  try {
    const contextValue = useContext(
      createContext(key.defaultValue, { displayName: key.symbol.toString() })
    )
    if (contextValue !== undefined) {
      return contextValue as T
    }
  } catch (_error) {
    // Context resolution failed
  }

  // Try registry
  const provider = EnvironmentRegistry.getInstance().getProvider<T>(key.symbol)
  if (provider) {
    return provider.value
  }

  // Use default value
  if (key.defaultValue !== undefined) {
    return key.defaultValue
  }

  // Handle required case
  if (required) {
    throw new Error(`Required environment object not found for key ${key.symbol.toString()}`)
  }

  return key.defaultValue as T
}

/**
 * Get all registered environment keys (for debugging)
 */
export function getRegisteredEnvironmentKeys(): EnvironmentKey<any>[] {
  const registry = EnvironmentRegistry.getInstance()
  return Array.from((registry as any).keys.values())
}

/**
 * Get all active environment providers (for debugging)
 */
export function getActiveEnvironmentProviders(): EnvironmentObjectProvider<any>[] {
  const registry = EnvironmentRegistry.getInstance()
  return Array.from((registry as any).providers.values())
}

/**
 * Clear all environment providers (for testing)
 */
export function clearEnvironmentProviders(): void {
  const registry = EnvironmentRegistry.getInstance()
  ;(registry as any).providers.clear()
}

/**
 * Helper to get current component context (will be injected by compiler)
 */
function getCurrentComponentContext(): ComponentContext {
  const owner = getCurrentOwner()
  if (!owner?.context.has(ComponentContextSymbol)) {
    throw new Error('@EnvironmentObject can only be used within a component context')
  }
  return owner.context.get(ComponentContextSymbol) as ComponentContext
}

/**
 * Helper to get the property name of the caller (used for metadata)
 */
function getCallerPropertyName(): string | null {
  try {
    const stack = new Error().stack
    if (stack) {
      const match = stack.match(/at (\w+)\./)?.[1]
      return match || null
    }
  } catch {
    // Ignore errors in stack parsing
  }
  return null
}

/**
 * Symbol for component context storage
 */
const ComponentContextSymbol = Symbol('TachUI.ComponentContext')

/**
 * Type guard for EnvironmentObject property wrapper
 */
export function isEnvironmentObject<T>(value: any): value is Types.EnvironmentObject<T> {
  return (
    value &&
    typeof value === 'object' &&
    'wrappedValue' in value &&
    'projectedValue' in value &&
    'key' in value
  )
}

/**
 * Type guard for EnvironmentKey
 */
export function isEnvironmentKey<T>(value: any): value is EnvironmentKey<T> {
  return value && typeof value === 'object' && 'symbol' in value && typeof value.symbol === 'symbol'
}
