/**
 * Cleanup and disposal utilities for reactive system
 *
 * Provides memory management, cleanup functions, and disposal
 * utilities to prevent memory leaks in reactive computations.
 */

import { getCurrentOwner } from './context'
import type { CleanupFunction, Owner } from './types'

/**
 * Add a cleanup function to the current reactive context
 *
 * @param fn Cleanup function to run when the context is disposed
 *
 * @example
 * ```typescript
 * createEffect(() => {
 *   const interval = setInterval(() => {
 *     console.log('tick')
 *   }, 1000)
 *
 *   onCleanup(() => {
 *     clearInterval(interval)
 *   })
 * })
 * ```
 */
export function onCleanup(fn: CleanupFunction): void {
  const owner = getCurrentOwner()
  if (owner && !owner.disposed) {
    owner.cleanups.push(fn)
  } else if (__DEV__) {
    console.warn('onCleanup called outside of reactive context')
  }
}

/**
 * Dispose a reactive owner and all its children
 *
 * @param owner The owner to dispose
 */
export function dispose(owner: Owner): void {
  if ('dispose' in owner && typeof owner.dispose === 'function') {
    owner.dispose()
  }
}

/**
 * Create a disposable resource with automatic cleanup
 *
 * @param fn Function that creates and returns a resource and its cleanup
 * @returns The created resource
 *
 * @example
 * ```typescript
 * const timer = createResource(() => {
 *   const id = setInterval(() => console.log('tick'), 1000)
 *   return [id, () => clearInterval(id)]
 * })
 * ```
 */
export function createResource<T>(fn: () => [T, CleanupFunction]): T {
  const [resource, cleanup] = fn()
  onCleanup(cleanup)
  return resource
}

/**
 * Create a cleanup group that can be disposed manually
 *
 * @returns Cleanup group with dispose function
 *
 * @example
 * ```typescript
 * const group = createCleanupGroup()
 *
 * group.add(() => console.log('cleanup 1'))
 * group.add(() => console.log('cleanup 2'))
 *
 * // Later...
 * group.dispose() // Runs both cleanup functions
 * ```
 */
export function createCleanupGroup(): {
  add: (fn: CleanupFunction) => void
  dispose: () => void
  disposed: boolean
} {
  const cleanups: CleanupFunction[] = []
  let disposed = false

  return {
    add(fn: CleanupFunction) {
      if (disposed) {
        if (__DEV__) {
          console.warn('Adding cleanup to disposed group')
        }
        return
      }
      cleanups.push(fn)
    },

    dispose() {
      if (disposed) return
      disposed = true

      for (const cleanup of cleanups) {
        try {
          cleanup()
        } catch (error) {
          console.error('Error in cleanup function:', error)
        }
      }
      cleanups.length = 0
    },

    get disposed() {
      return disposed
    },
  }
}

/**
 * Create a weak disposal tracker using WeakRef and FinalizationRegistry
 * for automatic cleanup of unreferenced objects
 */
export function createWeakDisposal<T extends object>(
  target: T,
  cleanup: CleanupFunction
): WeakRef<T> {
  const weakRef = new WeakRef(target)

  if (typeof FinalizationRegistry !== 'undefined') {
    const registry = new FinalizationRegistry(cleanup)
    registry.register(target, cleanup)
  }

  return weakRef
}

/**
 * Defer a cleanup function to run after the current reactive cycle
 *
 * @param fn Cleanup function to defer
 */
export function deferCleanup(fn: CleanupFunction): void {
  queueMicrotask(() => {
    try {
      fn()
    } catch (error) {
      console.error('Error in deferred cleanup:', error)
    }
  })
}

/**
 * Create a cleanup function that only runs once
 *
 * @param fn Cleanup function
 * @returns Cleanup function that only runs once
 */
export function createOnceCleanup(fn: CleanupFunction): CleanupFunction {
  let hasRun = false

  return () => {
    if (hasRun) return
    hasRun = true
    fn()
  }
}

/**
 * Create a timeout with automatic cleanup
 *
 * @param fn Function to run after timeout
 * @param delay Delay in milliseconds
 * @returns Timeout ID
 */
export function createTimeout(fn: () => void, delay: number): NodeJS.Timeout {
  const id = setTimeout(fn, delay)
  onCleanup(() => clearTimeout(id))
  return id
}

/**
 * Create an interval with automatic cleanup
 *
 * @param fn Function to run on interval
 * @param delay Delay in milliseconds
 * @returns Interval ID
 */
export function createInterval(fn: () => void, delay: number): NodeJS.Timeout {
  const id = setInterval(fn, delay)
  onCleanup(() => clearInterval(id))
  return id
}

/**
 * Create an event listener with automatic cleanup
 *
 * @param target Event target
 * @param event Event name
 * @param handler Event handler
 * @param options Event listener options
 */
export function createEventListener<K extends keyof WindowEventMap>(
  target: Window,
  event: K,
  handler: (event: WindowEventMap[K]) => void,
  options?: AddEventListenerOptions
): void
export function createEventListener<K extends keyof DocumentEventMap>(
  target: Document,
  event: K,
  handler: (event: DocumentEventMap[K]) => void,
  options?: AddEventListenerOptions
): void
export function createEventListener<K extends keyof HTMLElementEventMap>(
  target: HTMLElement,
  event: K,
  handler: (event: HTMLElementEventMap[K]) => void,
  options?: AddEventListenerOptions
): void
export function createEventListener(
  target: EventTarget,
  event: string,
  handler: (event: Event) => void,
  options?: AddEventListenerOptions
): void {
  target.addEventListener(event, handler, options)
  onCleanup(() => target.removeEventListener(event, handler, options))
}

// Development mode flag - simplified approach
if (typeof (globalThis as any).__DEV__ === 'undefined') {
  ;(globalThis as any).__DEV__ = process.env.NODE_ENV !== 'production'
}

// Re-export types
export type { CleanupFunction }
