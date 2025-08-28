/**
 * Reactive context and computation management
 *
 * Manages the reactive execution context, dependency tracking,
 * and computation lifecycle.
 */

import type { CleanupFunction, Computation, Owner, ReactiveContext } from './types'
import { ComputationState } from './types'

let computationIdCounter = 0
let ownerIdCounter = 0

/**
 * Global reactive context
 */
let currentComputation: Computation | null = null
let currentOwner: Owner | null = null
let isBatching = false

/**
 * Get the current computation context
 */
export function getCurrentComputation(): Computation | null {
  return currentComputation
}

/**
 * Get the current owner context
 */
export function getCurrentOwner(): Owner | null {
  return currentOwner
}

/**
 * Check if we're currently batching updates
 */
export function isBatchingUpdates(): boolean {
  return isBatching
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
  state = ComputationState.Dirty
  value: any = undefined

  constructor(fn: () => any, owner: Owner | null = null) {
    this.id = ++computationIdCounter
    this.fn = fn
    this.owner = owner

    if (owner && !owner.disposed) {
      owner.sources.add(this)
    }
  }

  execute(): any {
    if (this.state === ComputationState.Disposed) {
      return this.value
    }

    // Clean up old dependencies
    for (const source of this.sources) {
      if (source && typeof source === 'object' && 'removeObserver' in source) {
        ;(source as any).removeObserver(this)
      }
    }
    this.sources.clear()

    const prevComputation = currentComputation
    currentComputation = this

    try {
      this.state = ComputationState.Clean
      this.value = this.fn()
      return this.value
    } catch (error) {
      this.state = ComputationState.Disposed
      // Don't suppress errors - let them propagate for proper error handling
      // Only log in non-test environments to avoid polluting test output
      if (typeof process === 'undefined' || process.env.NODE_ENV !== 'test') {
        console.error('Error in computation:', error)
      }
      throw error
    } finally {
      currentComputation = prevComputation
    }
  }

  dispose(): void {
    if (this.state === ComputationState.Disposed) return

    this.state = ComputationState.Disposed

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
  const owner = new OwnerImpl(currentOwner)
  const prevOwner = currentOwner
  currentOwner = owner

  try {
    return fn(() => owner.dispose())
  } finally {
    currentOwner = prevOwner
  }
}

/**
 * Run a function with a specific owner context
 */
export function runWithOwner<T>(owner: Owner | null, fn: () => T): T {
  const prevOwner = currentOwner
  currentOwner = owner

  try {
    return fn()
  } finally {
    currentOwner = prevOwner
  }
}

/**
 * Get the current owner context
 */
export function getOwner(): Owner | null {
  return currentOwner
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
  if (isBatching) {
    return fn()
  }

  const wasBatching = isBatching
  isBatching = true

  try {
    const result = fn()
    // Flush updates after batch completes
    if (!wasBatching && flushFunction) {
      flushFunction()
    }
    return result
  } finally {
    isBatching = wasBatching
  }
}

/**
 * Read a signal without tracking dependency
 */
export function untrack<T>(fn: () => T): T {
  const prevComputation = currentComputation
  currentComputation = null

  try {
    return fn()
  } finally {
    currentComputation = prevComputation
  }
}

/**
 * Add cleanup function to current owner
 */
export function onCleanup(fn: CleanupFunction): void {
  if (currentOwner && !currentOwner.disposed) {
    currentOwner.cleanups.push(fn)
  }
}

/**
 * Create a computation that runs immediately and tracks dependencies
 */
export function createComputation<T>(fn: () => T, owner?: Owner): ComputationImpl {
  const computation = new ComputationImpl(fn, owner || currentOwner)
  computation.execute()
  return computation
}

/**
 * Get reactive context information
 */
export function getReactiveContext(): ReactiveContext {
  return {
    computation: currentComputation,
    batch: isBatching,
  }
}

/**
 * Debug utilities
 */
export const DEBUG = {
  getCurrentComputation: () => currentComputation,
  getCurrentOwner: () => currentOwner,
  getComputationCount: () => computationIdCounter,
  getOwnerCount: () => ownerIdCounter,
  isBatching: () => isBatching,
}
