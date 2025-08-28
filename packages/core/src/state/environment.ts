/**
 * @EnvironmentObject Property Wrapper Implementation
 *
 * Implements SwiftUI's @EnvironmentObject property wrapper for dependency injection.
 * Provides reactive environment objects with automatic component re-rendering on changes.
 */

import { createEffect } from '../reactive/effect'
import { createSignal } from '../reactive/signal'
import type { Accessor, Setter } from '../reactive/types'
import {
  consumeEnvironmentValue,
  createEnvironmentKey,
  type EnvironmentKey,
  getCurrentComponentContext,
  provideEnvironmentValue,
} from '../runtime/component-context'
import type { ComponentContext } from '../runtime/types'

/**
 * Environment object wrapper interface
 */
export interface EnvironmentObject<T> {
  readonly wrappedValue: T
  readonly projectedValue: EnvironmentObject<T>
  readonly key: EnvironmentKey<T>
  readonly componentContext: ComponentContext
}

/**
 * Observable environment object that can notify subscribers of changes
 */
export class ObservableEnvironmentObject<T extends object> {
  private _signal: Accessor<T>
  private _setter: Setter<T>
  public _subscribers = new Set<() => void>()

  constructor(initialValue: T) {
    const [signal, setter] = createSignal(initialValue)
    this._signal = signal
    this._setter = setter
  }

  get value(): T {
    return this._signal()
  }

  set value(newValue: T) {
    this._setter(newValue)
    this.notifySubscribers()
  }

  /**
   * Update a property of the environment object
   */
  updateProperty<K extends keyof T>(key: K, value: T[K]): void {
    const currentValue = this._signal()
    const newValue = { ...currentValue, [key]: value }
    this._setter(newValue)
    this.notifySubscribers()
  }

  /**
   * Subscribe to changes
   */
  subscribe(callback: () => void): () => void {
    this._subscribers.add(callback)
    return () => this._subscribers.delete(callback)
  }

  private notifySubscribers(): void {
    for (const callback of this._subscribers) {
      try {
        callback()
      } catch (error) {
        console.error('Error in environment object subscriber:', error)
      }
    }
  }

  /**
   * Create a reactive effect that runs when this object changes
   */
  onChange(effect: (value: T) => void): () => void {
    const cleanup = createEffect(() => {
      effect(this._signal())
    })
    return () => cleanup.dispose()
  }
}

/**
 * Environment object implementation
 */
class EnvironmentObjectImpl<T> implements EnvironmentObject<T> {
  readonly key: EnvironmentKey<T>
  readonly componentContext: ComponentContext
  private _cachedValue: T | undefined
  private _subscriptionCleanup: (() => void) | undefined

  constructor(key: EnvironmentKey<T>, componentContext: ComponentContext) {
    this.key = key
    this.componentContext = componentContext

    // Set up cleanup on component unmount
    componentContext.onCleanup(() => {
      if (this._subscriptionCleanup) {
        this._subscriptionCleanup()
      }
    })
  }

  get wrappedValue(): T {
    if (this._cachedValue === undefined) {
      this._cachedValue = consumeEnvironmentValue(this.key)

      // Subscribe to changes if it's an observable environment object
      if (
        this._cachedValue &&
        typeof this._cachedValue === 'object' &&
        'subscribe' in this._cachedValue
      ) {
        const observableObject = this._cachedValue as any
        if (typeof observableObject.subscribe === 'function') {
          this._subscriptionCleanup = observableObject.subscribe(() => {
            // Trigger component re-render when environment object changes
            this.componentContext.setState(`_env_${this.key.name}_trigger`, Date.now())
          })
        }
      }
    }

    return this._cachedValue
  }

  get projectedValue(): EnvironmentObject<T> {
    return this
  }
}

/**
 * @EnvironmentObject property wrapper factory
 *
 * Creates an @EnvironmentObject property wrapper for dependency injection.
 *
 * @param key - The environment key to look up
 * @returns An EnvironmentObject property wrapper
 *
 * @example
 * ```typescript
 * // Define environment key
 * const UserServiceKey = createEnvironmentKey<UserService>('UserService')
 *
 * class MyComponent {
 *   @EnvironmentObject(UserServiceKey)
 *   private userService: UserService
 *
 *   render() {
 *     const user = this.userService.getCurrentUser()
 *     return Text(`Hello, ${user.name}!`)
 *   }
 * }
 * ```
 */
export function EnvironmentObject<T>(key: EnvironmentKey<T>): EnvironmentObject<T> {
  const componentContext = getCurrentComponentContext()
  return new EnvironmentObjectImpl(key, componentContext)
}

/**
 * Provide an environment object to child components
 *
 * @param key - The environment key
 * @param value - The value to provide
 *
 * @example
 * ```typescript
 * const userService = new UserService()
 * provideEnvironmentObject(UserServiceKey, userService)
 * ```
 */
export function provideEnvironmentObject<T>(key: EnvironmentKey<T>, value: T): void {
  provideEnvironmentValue(key, value)
}

/**
 * Create an observable environment object
 *
 * @param key - The environment key
 * @param initialValue - The initial value
 * @returns An observable environment object
 *
 * @example
 * ```typescript
 * const ThemeKey = createEnvironmentKey<Theme>('Theme')
 * const theme = createObservableEnvironmentObject(ThemeKey, { mode: 'light' })
 * provideEnvironmentObject(ThemeKey, theme)
 * ```
 */
export function createObservableEnvironmentObject<T extends object>(
  _key: EnvironmentKey<ObservableEnvironmentObject<T>>,
  initialValue: T
): ObservableEnvironmentObject<T> {
  return new ObservableEnvironmentObject(initialValue)
}

/**
 * Create and provide an environment object in one step
 *
 * @param key - The environment key
 * @param value - The value to provide
 * @returns The provided value for chaining
 */
export function createEnvironmentObject<T>(key: EnvironmentKey<T>, value: T): T {
  provideEnvironmentObject(key, value)
  return value
}

/**
 * Type guard for EnvironmentObject property wrappers
 */
export function isEnvironmentObject<T>(value: any): value is EnvironmentObject<T> {
  return (
    value &&
    typeof value === 'object' &&
    'wrappedValue' in value &&
    'key' in value &&
    'componentContext' in value &&
    value instanceof EnvironmentObjectImpl
  )
}

/**
 * Environment object utilities
 */
export const EnvironmentObjectUtils = {
  /**
   * Check if an environment object is available
   */
  isAvailable<T>(key: EnvironmentKey<T>): boolean {
    try {
      const context = getCurrentComponentContext()
      return context.consume(key.symbol) !== undefined
    } catch {
      return false
    }
  },

  /**
   * Get environment object value without creating a dependency
   */
  peek<T>(key: EnvironmentKey<T>): T | undefined {
    try {
      const context = getCurrentComponentContext()
      return context.consume(key.symbol)
    } catch {
      return undefined
    }
  },

  /**
   * Create a derived environment object
   */
  derived<T, U>(
    sourceKey: EnvironmentKey<T>,
    targetKey: EnvironmentKey<U>,
    transform: (value: T) => U
  ): void {
    const sourceValue = consumeEnvironmentValue(sourceKey)
    const derivedValue = transform(sourceValue)
    provideEnvironmentObject(targetKey, derivedValue)
  },

  /**
   * Create a scoped environment context
   */
  scoped(setup: () => void, cleanup?: () => void): () => void {
    const context = getCurrentComponentContext()

    // Run setup
    setup()

    // Register cleanup
    if (cleanup) {
      context.onCleanup(cleanup)
    }

    return () => {
      if (cleanup) {
        cleanup()
      }
    }
  },
}

/**
 * Common environment keys for built-in services
 */
export const CommonEnvironmentKeys = {
  /**
   * Application theme
   */
  Theme: createEnvironmentKey<{
    mode: 'light' | 'dark'
    primaryColor: string
    secondaryColor: string
  }>('Theme', {
    mode: 'light',
    primaryColor: '#007AFF',
    secondaryColor: '#5856D6',
  }),

  /**
   * Localization service
   */
  Localization: createEnvironmentKey<{
    locale: string
    t: (key: string, params?: Record<string, any>) => string
  }>('Localization'),

  /**
   * Navigation service
   */
  Navigation: createEnvironmentKey<{
    navigate: (path: string) => void
    goBack: () => void
    getCurrentRoute: () => string
  }>('Navigation'),

  /**
   * Application configuration
   */
  Config: createEnvironmentKey<{
    apiUrl: string
    version: string
    environment: 'development' | 'staging' | 'production'
  }>('Config'),

  /**
   * User authentication
   */
  Auth: createEnvironmentKey<{
    isAuthenticated: boolean
    user?: { id: string; name: string; email: string }
    login: (credentials: any) => Promise<void>
    logout: () => Promise<void>
  }>('Auth'),
}

// Re-export environment key creation function
export { createEnvironmentKey }
