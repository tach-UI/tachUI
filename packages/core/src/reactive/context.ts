/**
 * Reactive context and computation management
 *
 * Manages the reactive execution context, dependency tracking,
 * and computation lifecycle.
 */

import type {
  CleanupFunction,
  Computation,
  ComputationStateValue,
  Owner,
  ReactiveContext,
} from './types'
import { ComputationState } from './types'

let computationIdCounter = 0
let ownerIdCounter = 0

// Module instance identifier for debugging
const moduleInstanceId = Math.random().toString(36).substr(2, 6)

// Pure ESM module singleton - no globalThis
let currentComputation: Computation | null = null
let currentOwner: Owner | null = null
let isBatching = false

// Cleanup scope for the computation execution currently in progress (#270).
// Distinct from the owner: an owner's cleanups run once, when the owner is
// disposed, whereas an execution scope is torn down before every rerun of the
// computation that opened it.
let currentCleanupScope: CleanupFunction[] | null = null

/**
 * Run a list of cleanup functions in registration order, draining it.
 *
 * A throwing cleanup must not strand the cleanups queued behind it, so each
 * call is isolated and reported — matching how `OwnerImpl.dispose` and the
 * flush loop already treat failures.
 */
function drainCleanups(cleanups: CleanupFunction[]): void {
  if (cleanups.length === 0) return

  // Splice first: a cleanup that re-enters this computation must not see the
  // entries still queued, and nothing may run twice.
  const pending = cleanups.splice(0, cleanups.length)

  // Cleanups run outside any tracking or cleanup scope, so an onCleanup call
  // made from inside a cleanup cannot append to the list being drained.
  const prevComputation = currentComputation
  const prevScope = currentCleanupScope
  currentComputation = null
  currentCleanupScope = null

  try {
    for (const cleanup of pending) {
      try {
        cleanup()
      } catch (error) {
        console.error('Error in cleanup function:', error)
      }
    }
  } finally {
    currentComputation = prevComputation
    currentCleanupScope = prevScope
  }
}

/**
 * Register a cleanup on the execution scope currently in progress, if any.
 *
 * Returns false when there is no execution scope, so callers can fall back to
 * owner-scoped registration.
 */
export function registerExecutionCleanup(fn: CleanupFunction): boolean {
  if (!currentCleanupScope) return false
  currentCleanupScope.push(fn)
  return true
}

// Module instance tracking for debugging
const moduleInstances = new Set<string>()
moduleInstances.add(moduleInstanceId)

// Pure ESM Reactive context module loaded

// Export the singleton state directly
const reactiveContext = {
  get currentComputation() {
    return currentComputation
  },
  set currentComputation(value) {
    currentComputation = value
  },
  get currentOwner() {
    return currentOwner
  },
  set currentOwner(value) {
    currentOwner = value
  },
  get isBatching() {
    return isBatching
  },
  set isBatching(value) {
    isBatching = value
  },
}

/**
 * Get the current computation context
 */
export function getCurrentComputation(): Computation | null {
  const computation = reactiveContext.currentComputation
  return computation
}

/**
 * Get the current owner context
 */
export function getCurrentOwner(): Owner | null {
  return reactiveContext.currentOwner
}

/**
 * Check if we're currently batching updates
 */
export function isBatchingUpdates(): boolean {
  return reactiveContext.isBatching
}

/**
 * Owner implementation for managing cleanup and context
 */
class OwnerImpl implements Owner {
  readonly id: number
  readonly parent: Owner | null
  readonly context = new Map<symbol, any>()
  readonly cleanups: CleanupFunction[] = []
  readonly sources = new Set<Computation>()
  disposed = false

  constructor(parent: Owner | null = null) {
    this.id = ++ownerIdCounter
    this.parent = parent
  }

  dispose(): void {
    if (this.disposed) return

    this.disposed = true

    // Dispose all child computations
    for (const computation of this.sources) {
      computation.dispose()
    }
    this.sources.clear()

    // Run cleanup functions
    for (const cleanup of this.cleanups) {
      try {
        cleanup()
      } catch (error) {
        console.error('Error in cleanup function:', error)
      }
    }
    this.cleanups.length = 0

    // Remove from parent
    if (this.parent && !this.parent.disposed) {
      this.parent.sources.delete(this as any)
    }
  }
}

/**
 * Computation implementation
 */
export class ComputationImpl implements Computation {
  readonly id: number
  readonly owner: Owner | null
  readonly fn: () => any
  readonly sources = new Set<any>() // Signals this computation depends on
  readonly observers = new Set<Computation>() // Computations that depend on this
  // Cleanups registered by the execution currently in progress (#270). Torn
  // down before the next execution and again on disposal.
  readonly cleanups: CleanupFunction[] = []
  state: ComputationStateValue = ComputationState.Dirty
  value: any = undefined

  constructor(fn: () => any, owner: Owner | null = null) {
    this.id = ++computationIdCounter
    this.fn = fn
    this.owner = owner

    if (owner && !owner.disposed) {
      owner.sources.add(this)
    }
  }

  /**
   * Register a cleanup on this computation's current execution scope.
   *
   * Registering on an already-disposed computation runs the cleanup at once:
   * the scope that would have owned it is gone, and dropping it silently would
   * leak whatever it was holding. `createOnceEffect` disposes itself from
   * inside its own body and reaches exactly this path.
   */
  addCleanup(fn: CleanupFunction): void {
    if (this.state === ComputationState.Disposed) {
      try {
        fn()
      } catch (error) {
        console.error('Error in cleanup function:', error)
      }
      return
    }

    this.cleanups.push(fn)
  }

  execute(): any {
    if (this.state === ComputationState.Disposed) {
      return this.value
    }

    // Tear down the previous execution before the next one begins (#270), so
    // a disposer never overlaps the run that replaces it. This happens even
    // when the previous run threw: its cleanups were registered before the
    // throw and still own real resources.
    drainCleanups(this.cleanups)

    // Snapshot the current dependencies. Unsubscribing stale ones is
    // deferred until after a successful run: if fn() throws partway
    // through, previous subscriptions were never removed, so the
    // computation stays wired for recovery even when the failure happens
    // before any signal read re-tracks them (#217 review: an early failure
    // must not strand the computation with empty sources).
    const previousSources = Array.from(this.sources)
    this.sources.clear()

    const prevComputation = reactiveContext.currentComputation
    const prevCleanupScope = currentCleanupScope
    reactiveContext.currentComputation = this
    currentCleanupScope = this.cleanups

    try {
      this.state = ComputationState.Clean
      this.value = this.fn()

      // Success: drop subscriptions that were not re-read during this run
      for (const source of previousSources) {
        if (
          !this.sources.has(source) &&
          source &&
          typeof source === 'object' &&
          'removeObserver' in source
        ) {
          ;(source as any).removeObserver(this)
        }
      }

      return this.value
    } catch (error) {
      // Recoverable failure (#217): mark Dirty, not Clean/Disposed.
      // - A failed computed re-executes on its next read and surfaces the
      //   error synchronously instead of silently serving its stale cached
      //   value (Clean + _hasValue would do exactly that).
      // - Subscriptions from the failed run are retained: previous sources
      //   were never unsubscribed (only the tracking set was cleared), and
      //   partially re-tracked sources stay subscribed too, so the next
      //   change of any of them re-schedules recovery. The next successful
      //   run prunes whatever is no longer read.
      for (const source of previousSources) {
        this.sources.add(source)
      }

      this.state = ComputationState.Dirty
      // Don't suppress errors - let them propagate for proper error handling
      // Only log in non-test environments to avoid polluting test output
      if (typeof process === 'undefined' || process.env.NODE_ENV !== 'test') {
        console.error('Error in computation:', error)
      }
      throw error
    } finally {
      reactiveContext.currentComputation = prevComputation
      currentCleanupScope = prevCleanupScope
    }
  }

  dispose(): void {
    if (this.state === ComputationState.Disposed) return

    this.state = ComputationState.Disposed

    // Final teardown of the last execution's scope (#270). Runs before the
    // computation is unwired so a disposer can still read this computation's
    // own state.
    drainCleanups(this.cleanups)

    // Remove from all sources
    for (const source of this.sources) {
      if (source && typeof source === 'object' && 'removeObserver' in source) {
        ;(source as any).removeObserver(this)
      }
    }
    this.sources.clear()

    // Notify observers that this computation is disposed
    for (const observer of this.observers) {
      observer.sources.delete(this)
    }
    this.observers.clear()

    // Remove from owner
    if (this.owner && !this.owner.disposed) {
      this.owner.sources.delete(this)
    }
  }
}

/**
 * Create a new reactive computation root
 */
export function createRoot<T>(fn: (dispose: () => void) => T): T {
  const owner = new OwnerImpl(reactiveContext.currentOwner)
  const prevOwner = reactiveContext.currentOwner
  reactiveContext.currentOwner = owner

  try {
    return fn(() => owner.dispose())
  } finally {
    reactiveContext.currentOwner = prevOwner
  }
}

/**
 * Run a function with a specific owner context
 */
export function runWithOwner<T>(owner: Owner | null, fn: () => T): T {
  const prevOwner = reactiveContext.currentOwner
  reactiveContext.currentOwner = owner

  try {
    return fn()
  } finally {
    reactiveContext.currentOwner = prevOwner
  }
}

/**
 * Get the current owner context
 */
export function getOwner(): Owner | null {
  return reactiveContext.currentOwner
}

// Global flush function reference
let flushFunction: (() => void) | null = null

/**
 * Set the flush function (called by signal module)
 */
export function setFlushFunction(fn: () => void): void {
  flushFunction = fn
}

/**
 * Batch multiple updates together
 */
export function batch<T>(fn: () => T): T {
  if (reactiveContext.isBatching) {
    return fn()
  }

  const wasBatching = reactiveContext.isBatching
  reactiveContext.isBatching = true

  try {
    const result = fn()
    // Flush updates after batch completes
    if (!wasBatching && flushFunction) {
      flushFunction()
    }
    return result
  } finally {
    reactiveContext.isBatching = wasBatching
  }
}

/**
 * Read a signal without tracking dependency
 */
export function untrack<T>(fn: () => T): T {
  const prevComputation = reactiveContext.currentComputation
  reactiveContext.currentComputation = null

  try {
    return fn()
  } finally {
    reactiveContext.currentComputation = prevComputation
  }
}

/**
 * Add a cleanup function to the innermost active scope.
 *
 * Inside a computation body this is the execution scope (#270), so the cleanup
 * runs before that computation's next execution and again on its disposal.
 * Outside one — directly in a `createRoot` body, say — it falls back to
 * owner-scoped registration and runs when the owner is disposed.
 */
export function onCleanup(fn: CleanupFunction): void {
  if (registerExecutionCleanup(fn)) return

  const owner = reactiveContext.currentOwner
  if (owner && !owner.disposed) {
    owner.cleanups.push(fn)
  }
}

/**
 * Create a computation that runs immediately and tracks dependencies
 */
export function createComputation<T>(
  fn: () => T,
  owner?: Owner
): ComputationImpl {
  const computation = new ComputationImpl(
    fn,
    owner || reactiveContext.currentOwner
  )
  computation.execute()
  return computation
}

/**
 * Get reactive context information
 */
export function getReactiveContext(): ReactiveContext {
  return {
    computation: reactiveContext.currentComputation,
    batch: reactiveContext.isBatching,
  }
}

/**
 * Debug utilities
 */
export const DEBUG = {
  getCurrentComputation: () => reactiveContext.currentComputation,
  getCurrentOwner: () => reactiveContext.currentOwner,
  getComputationCount: () => computationIdCounter,
  getOwnerCount: () => ownerIdCounter,
  isBatching: () => reactiveContext.isBatching,
  getModuleInstances: () => Array.from(moduleInstances),
  getModuleId: () => moduleInstanceId,
}
