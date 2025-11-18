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

    const prevComputation = reactiveContext.currentComputation
    reactiveContext.currentComputation = this

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
      reactiveContext.currentComputation = prevComputation
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
 * Add cleanup function to current owner
 */
export function onCleanup(fn: CleanupFunction): void {
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
