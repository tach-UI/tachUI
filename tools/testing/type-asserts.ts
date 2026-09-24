/**
 * Assertions for the compile-time type-surface tests (`*.test-d.ts`).
 *
 * Shared so every package's surface is pinned by the same definitions: an
 * `Equals` that drifted between two files would let one of them pass what the
 * other rejects.
 */

export type Assert<T extends true> = T

export type Equals<A, B> =
  (<G>() => G extends A ? 1 : 2) extends <G>() => G extends B ? 1 : 2 ? true : false

/** Whether `From` satisfies `To`, so a deliberate rejection can be asserted as `false`. */
export type Assignable<From, To> = [From] extends [To] ? true : false
