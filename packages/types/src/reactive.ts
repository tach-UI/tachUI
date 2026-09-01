/**
 * Core reactive system types
 */

/**
 * A reactive accessor function that returns the current value
 */
export type Accessor<T = any> = () => T

/**
 * A setter function that updates a reactive value
 */
export type Setter<T> = (value: T | ((prev: T) => T)) => T

/**
 * Extract the value type from an Accessor
 */
export type AccessorValue<T> = T extends Accessor<infer U> ? U : never

/**
 * Owner context for reactive computations and cleanup
 */
export interface Owner {
  readonly id: number
  readonly parent: Owner | null
  readonly context: Map<symbol, any>
  readonly cleanups: CleanupFunction[]
  /** Computations owned directly by this owner. */
  readonly sources: Set<Computation>
  /**
   * Owners nested inside this one, so disposal reaches the whole subtree.
   *
   * Kept separate from `sources` because that set is typed to computations
   * and its members are torn down through the computation disposal path.
   *
   * Optional so that an `Owner` produced by an older version of the runtime,
   * or a hand-rolled structural implementation, still satisfies this interface.
   * `runWithOwner` accepts any `Owner`, so the core must tolerate one that
   * predates this field rather than throwing on it.
   */
  readonly childOwners?: Set<Owner>
  disposed: boolean
  /**
   * Optional for the same reason as `childOwners`: the core already guards
   * this at runtime rather than assuming it is present.
   */
  dispose?(): void
}

/**
 * Computation state constants
 */
export const ComputationState = {
  Clean: 0, // Up to date
  Check: 1, // Potentially stale, needs checking
  Dirty: 2, // Definitely stale, needs recomputation
  Disposed: 3, // Disposed, should not be used
} as const

export type ComputationStateValue = typeof ComputationState[keyof typeof ComputationState]

/**
 * Base computation interface
 */
export interface Computation {
  readonly id: number
  readonly owner: Owner | null
  readonly fn: () => any
  readonly sources: Set<any>
  readonly observers: Set<Computation>
  state: ComputationStateValue
  value?: any
  execute(): any
  dispose(): void
}

/**
 * Signal interface (internal)
 */
export interface SignalImpl<T> {
  readonly id: number
  readonly observers: Set<Computation>
  getValue(): T
  peek(): T
}

/**
 * Signal getter function type (what createSignal returns)
 */
export type Signal<T> = (() => T) & { peek(): T }

/**
 * Effect function type
 */
export type EffectFunction<T = any> = (prev?: T) => T

/**
 * Effect options
 */
export interface EffectOptions {
  name?: string
}

/**
 * Cleanup function type
 */
export type CleanupFunction = () => void

/**
 * Reactive context for tracking dependencies
 */
export interface ReactiveContext {
  readonly computation: Computation | null
  readonly batch: boolean
}

/**
 * Scheduler interface for managing updates
 */
export interface Scheduler {
  schedule(fn: () => void): void
  flush(): void
}
