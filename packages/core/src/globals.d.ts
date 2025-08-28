/**
 * Global type definitions for TachUI core
 */

declare global {
  /**
   * Development mode flag
   */
  const __DEV__: boolean

  /**
   * WeakRef support (ES2021+)
   */
  interface WeakRef<T extends object> {
    readonly [Symbol.toStringTag]: 'WeakRef'
    deref(): T | undefined
  }

  interface WeakRefConstructor {
    readonly prototype: WeakRef<any>
    new <T extends object>(target: T): WeakRef<T>
  }

  var WeakRef: WeakRefConstructor

  /**
   * FinalizationRegistry support (ES2021+)
   */
  interface FinalizationRegistry<T> {
    readonly [Symbol.toStringTag]: 'FinalizationRegistry'
    register(target: object, heldValue: T, unregisterToken?: object): void
    unregister(unregisterToken: object): boolean
  }

  interface FinalizationRegistryConstructor {
    readonly prototype: FinalizationRegistry<any>
    new <T>(cleanupCallback: (heldValue: T) => void): FinalizationRegistry<T>
  }

  var FinalizationRegistry: FinalizationRegistryConstructor
}

export {}
