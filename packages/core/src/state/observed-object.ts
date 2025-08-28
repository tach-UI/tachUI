/**
 * @ObservedObject Property Wrapper Implementation
 *
 * Implements SwiftUI's @ObservedObject property wrapper for observing external objects
 * that conform to the ObservableObject protocol. Automatically triggers component
 * re-renders when the observed object changes.
 */

import { getCurrentOwner } from '../reactive/context'
import { createEffect } from '../reactive/effect'
import { createSignal } from '../reactive/signal'
import type { Signal } from '../reactive/types'
import type { ComponentContext } from '../runtime/types'
import type {
  ObservableObject,
  ObservableObjectOptions,
  ObservedObject,
  ObservedObjectFactory,
  PropertyWrapperMetadata,
} from './types'

/**
 * Base class for objects that can be observed
 * Provides the foundation for SwiftUI's ObservableObject protocol
 */
export class ObservableObjectBase implements ObservableObject {
  private _objectWillChange: Signal<void>
  private _notifyCount = 0

  constructor() {
    const [getNotify, setNotify] = createSignal<void>(undefined)
    this._objectWillChange = {
      getValue: getNotify,
      peek: getNotify,
    } as unknown as Signal<void>

    // Track notification setter for manual triggering
    ;(this as any)._notifySetter = setNotify
  }

  get objectWillChange(): Signal<void> {
    return this._objectWillChange
  }

  /**
   * Notify observers that the object has changed
   * Call this method whenever properties of the object change
   */
  notifyChange(): void {
    this._notifyCount++
    const setter = (this as any)._notifySetter
    if (setter) {
      setter(undefined)
    }
  }

  /**
   * Get the current notification count (for debugging)
   */
  get notificationCount(): number {
    return this._notifyCount
  }
}

/**
 * Internal observed object wrapper implementation
 */
class ObservedObjectImpl<T extends ObservableObject> implements ObservedObject<T> {
  private _object: T
  private _metadata: PropertyWrapperMetadata
  private _effectCleanup?: () => void

  constructor(
    object: T,
    componentContext: ComponentContext,
    propertyName: string,
    options: ObservableObjectOptions = {}
  ) {
    this._object = object

    // Store metadata for introspection
    this._metadata = {
      type: 'ObservedObject',
      propertyName,
      componentId: componentContext.id,
      options,
    }

    // Register with component context for lifecycle management
    // TODO: Integrate StateManager with ComponentContext in future version
    // if (componentContext.stateManager) {
    //   componentContext.stateManager.registerObservedObject(this, options)
    // }

    // Set up observation effect
    this.setupObservation()

    // Set up cleanup on component unmount
    const owner = getCurrentOwner()
    if (owner) {
      owner.cleanups.push(() => {
        this.cleanup()
      })
    }
  }

  get wrappedValue(): T {
    return this._object
  }

  get projectedValue(): ObservedObject<T> {
    return this
  }

  /**
   * Get property wrapper metadata
   */
  get metadata(): PropertyWrapperMetadata {
    return this._metadata
  }

  /**
   * Set up reactive observation of the object
   */
  private setupObservation(): void {
    // Create an effect that tracks the object's objectWillChange signal
    const effect = createEffect(() => {
      // Access the objectWillChange signal to create dependency
      this._object.objectWillChange()

      // The effect will re-run whenever the object notifies changes
      // This will trigger component re-renders automatically
    })
    this._effectCleanup = () => effect.dispose()
  }

  /**
   * Cleanup observation
   */
  private cleanup(): void {
    if (this._effectCleanup) {
      this._effectCleanup()
      this._effectCleanup = undefined
    }
  }

  /**
   * Replace the observed object (advanced usage)
   */
  updateObject(newObject: T): void {
    this.cleanup()
    this._object = newObject
    this.setupObservation()
  }
}

/**
 * @ObservedObject property wrapper factory
 *
 * Creates an @ObservedObject property wrapper for observing external objects.
 * The observed object must implement the ObservableObject interface.
 *
 * @param object - The observable object to observe
 * @param options - Configuration options for the observed object wrapper
 * @returns An ObservedObject property wrapper
 *
 * @example
 * ```typescript
 * class UserData extends ObservableObjectBase {
 *   private _name = 'Unknown'
 *   private _age = 0
 *
 *   get name() { return this._name }
 *   set name(value: string) {
 *     this._name = value
 *     this.notifyChange()
 *   }
 *
 *   get age() { return this._age }
 *   set age(value: number) {
 *     this._age = value
 *     this.notifyChange()
 *   }
 * }
 *
 * class UserProfile {
 *   @ObservedObject(userData)
 *   private user: UserData
 *
 *   render() {
 *     return Text(`${this.user.name}, age ${this.user.age}`)
 *   }
 * }
 * ```
 */
const ObservedObjectFactory: ObservedObjectFactory = <T extends ObservableObject>(
  object: T,
  options: ObservableObjectOptions = {}
): ObservedObject<T> => {
  // This will be replaced by the decorator transformer during compilation
  const componentContext = getCurrentComponentContext()
  const propertyName = getCallerPropertyName() || 'observedObject'

  return new ObservedObjectImpl(object, componentContext, propertyName, options)
}

/**
 * Create an observable object with automatic change notification
 *
 * @param target - The target object to make observable
 * @param options - Configuration options
 * @returns An observable version of the target object
 *
 * @example
 * ```typescript
 * const observableData = makeObservable({
 *   count: 0,
 *   name: 'Test'
 * })
 *
 * // Changes to properties will automatically trigger notifications
 * observableData.count = 10 // Triggers objectWillChange
 * ```
 */
export function makeObservable<T extends Record<string, any>>(
  target: T,
  options: ObservableObjectOptions = {}
): T & ObservableObject {
  const observableBase = new ObservableObjectBase()

  // Create a proxy that intercepts property changes
  const proxy = new Proxy(target, {
    set(obj, prop, value) {
      const oldValue = obj[prop as keyof T]
      const result = Reflect.set(obj, prop, value)

      // Only notify if the value actually changed
      if (result && oldValue !== value && options.autoNotify !== false) {
        observableBase.notifyChange()
      }

      return result
    },

    get(obj, prop) {
      // Provide access to ObservableObject methods
      if (prop === 'objectWillChange') {
        return observableBase.objectWillChange
      }
      if (prop === 'notifyChange') {
        return () => observableBase.notifyChange()
      }
      if (prop === 'notificationCount') {
        return observableBase.notificationCount
      }

      return Reflect.get(obj, prop)
    },
  })

  return proxy as T & ObservableObject
}

/**
 * Create an observable class decorator
 *
 * @param options - Configuration options
 * @returns A class decorator that makes the class observable
 *
 * @example
 * ```typescript
 * @observable()
 * class TodoItem {
 *   text: string = ''
 *   completed: boolean = false
 *
 *   toggle() {
 *     this.completed = !this.completed
 *     // Change notification happens automatically
 *   }
 * }
 * ```
 */
export function observable(options: ObservableObjectOptions = {}) {
  return <T extends new (...args: any[]) => any>(constructor: T) =>
    class extends constructor implements ObservableObject {
      private _observableBase = new ObservableObjectBase()

      get objectWillChange(): Signal<void> {
        return this._observableBase.objectWillChange
      }

      get notificationCount(): number {
        return this._observableBase.notificationCount
      }

      notifyChange(): void {
        this._observableBase.notifyChange()
      }

      constructor(...args: any[]) {
        super(...args)

        // If auto-notify is enabled, set up property interception
        if (options.autoNotify !== false) {
          this.setupAutoNotification()
        }
      }

      private setupAutoNotification(): void {
        const propertyNames = Object.getOwnPropertyNames(this)

        for (const propName of propertyNames) {
          if (propName.startsWith('_') || typeof this[propName as keyof this] === 'function') {
            continue
          }

          let value = this[propName as keyof this]

          Object.defineProperty(this, propName, {
            get: () => value,
            set: (newValue) => {
              if (value !== newValue) {
                value = newValue
                this.notifyChange()
              }
            },
            enumerable: true,
            configurable: true,
          })
        }
      }
    } as any
}

/**
 * Helper to get current component context (will be injected by compiler)
 */
function getCurrentComponentContext(): ComponentContext {
  const owner = getCurrentOwner()
  if (!owner?.context.has(ComponentContextSymbol)) {
    throw new Error('@ObservedObject can only be used within a component context')
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
 * Type guard for ObservableObject
 */
export function isObservableObject(value: any): value is ObservableObject {
  return (
    value && typeof value === 'object' && 'objectWillChange' in value && 'notifyChange' in value
  )
}

/**
 * Type guard for ObservedObject property wrapper
 */
export function isObservedObject<T extends ObservableObject>(
  value: any
): value is ObservedObject<T> {
  return (
    value &&
    typeof value === 'object' &&
    'wrappedValue' in value &&
    'projectedValue' in value &&
    isObservableObject(value.wrappedValue)
  )
}

/**
 * Utility to create a simple observable store
 */
export function createObservableStore<T extends Record<string, any>>(
  initialState: T,
  options: ObservableObjectOptions = {}
): T & ObservableObject {
  return makeObservable({ ...initialState }, options)
}

/**
 * Export the ObservedObject factory function
 */
export const ObservedObjectWrapper = ObservedObjectFactory
