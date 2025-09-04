/**
 * Cleanup and disposal utilities for reactive system
 *
 * Provides memory management, cleanup functions, and disposal
 * utilities to prevent memory leaks in reactive computations.
 */
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
export declare function onCleanup(fn: CleanupFunction): void
/**
 * Dispose a reactive owner and all its children
 *
 * @param owner The owner to dispose
 */
export declare function dispose(owner: Owner): void
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
export declare function createResource<T>(fn: () => [T, CleanupFunction]): T
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
export declare function createCleanupGroup(): {
  add: (fn: CleanupFunction) => void
  dispose: () => void
  disposed: boolean
}
/**
 * Create a weak disposal tracker using WeakRef and FinalizationRegistry
 * for automatic cleanup of unreferenced objects
 */
export declare function createWeakDisposal<T extends object>(
  target: T,
  cleanup: CleanupFunction
): WeakRef<T>
/**
 * Defer a cleanup function to run after the current reactive cycle
 *
 * @param fn Cleanup function to defer
 */
export declare function deferCleanup(fn: CleanupFunction): void
/**
 * Create a cleanup function that only runs once
 *
 * @param fn Cleanup function
 * @returns Cleanup function that only runs once
 */
export declare function createOnceCleanup(fn: CleanupFunction): CleanupFunction
/**
 * Create a timeout with automatic cleanup
 *
 * @param fn Function to run after timeout
 * @param delay Delay in milliseconds
 * @returns Timeout ID
 */
export declare function createTimeout(
  fn: () => void,
  delay: number
): NodeJS.Timeout
/**
 * Create an interval with automatic cleanup
 *
 * @param fn Function to run on interval
 * @param delay Delay in milliseconds
 * @returns Interval ID
 */
export declare function createInterval(
  fn: () => void,
  delay: number
): NodeJS.Timeout
/**
 * Create an event listener with automatic cleanup
 *
 * @param target Event target
 * @param event Event name
 * @param handler Event handler
 * @param options Event listener options
 */
export declare function createEventListener<K extends keyof WindowEventMap>(
  target: Window,
  event: K,
  handler: (event: WindowEventMap[K]) => void,
  options?: AddEventListenerOptions
): void
export declare function createEventListener<K extends keyof DocumentEventMap>(
  target: Document,
  event: K,
  handler: (event: DocumentEventMap[K]) => void,
  options?: AddEventListenerOptions
): void
export declare function createEventListener<
  K extends keyof HTMLElementEventMap,
>(
  target: HTMLElement,
  event: K,
  handler: (event: HTMLElementEventMap[K]) => void,
  options?: AddEventListenerOptions
): void
export type { CleanupFunction }
//# sourceMappingURL=cleanup.d.ts.map
