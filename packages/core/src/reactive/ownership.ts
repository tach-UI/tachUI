/**
 * Ownership and reactive context management
 *
 * Provides utilities for managing reactive ownership contexts,
 * which control the lifecycle of reactive computations.
 */

import { createRoot, getOwner as getCurrentOwner, runWithOwner } from './context'
import type { Owner } from './types'

/**
 * Get the current owner context
 */
export function getOwner(): Owner | null {
  return getCurrentOwner()
}

/**
 * Run a function with a specific owner context
 */
export { runWithOwner }

/**
 * Create a new reactive root context
 */
export { createRoot }

/**
 * Check if we're currently in a reactive context
 */
export function isReactiveContext(): boolean {
  return getCurrentOwner() !== null
}

/**
 * Run a function outside of any reactive context
 */
export function runOutsideReactiveContext<T>(fn: () => T): T {
  return runWithOwner(null, fn)
}

/**
 * Create a detached reactive context that doesn't inherit from parent
 */
export function createDetachedRoot<T>(fn: (dispose: () => void) => T): T {
  return runOutsideReactiveContext(() => createRoot(fn))
}

/**
 * Get the root owner of the current ownership chain
 */
export function getRootOwner(): Owner | null {
  let owner = getCurrentOwner()
  if (!owner) return null

  while (owner.parent) {
    owner = owner.parent
  }

  return owner
}

/**
 * Get all owners in the ownership chain
 */
export function getOwnerChain(): (Owner | null)[] {
  const chain: (Owner | null)[] = []
  let owner = getCurrentOwner()

  while (owner) {
    chain.push(owner)
    owner = owner.parent
  }

  return chain
}

/**
 * Check if an owner is an ancestor of another owner
 */
export function isOwnerAncestor(ancestor: Owner, descendant: Owner): boolean {
  let current = descendant.parent

  while (current) {
    if (current === ancestor) {
      return true
    }
    current = current.parent
  }

  return false
}

/**
 * Find the common ancestor of two owners
 */
export function findCommonAncestor(owner1: Owner, owner2: Owner): Owner | null {
  const chain1 = new Set<Owner>()
  let current: Owner | null = owner1

  // Build chain for owner1
  while (current) {
    chain1.add(current)
    current = current.parent
  }

  // Walk chain for owner2 and find first common owner
  current = owner2
  while (current) {
    if (chain1.has(current)) {
      return current
    }
    current = current.parent
  }

  return null
}

/**
 * Get the depth of an owner in the ownership tree
 */
export function getOwnerDepth(owner: Owner): number {
  let depth = 0
  let current = owner.parent

  while (current) {
    depth++
    current = current.parent
  }

  return depth
}

/**
 * Create a child owner context
 */
export function createChildOwner(): Owner | null {
  const parent = getCurrentOwner()
  if (!parent) return null

  // This would be implemented in the OwnerImpl class
  // For now, return null as we don't expose the constructor
  return null
}

/**
 * Debug utilities for ownership
 */
export const OwnershipDebug = {
  getCurrentOwner,
  getRootOwner,
  getOwnerChain,
  getOwnerDepth,
  isReactiveContext,

  /**
   * Get ownership tree information
   */
  getOwnershipTree(): object {
    const root = getRootOwner()
    if (!root) return { tree: null }

    const buildTree = (owner: Owner): object => ({
      id: owner.id,
      disposed: owner.disposed,
      sourceCount: owner.sources.size,
      cleanupCount: owner.cleanups.length,
    })

    return { tree: buildTree(root) }
  },

  /**
   * Count total computations in ownership tree
   */
  countComputations(): number {
    const root = getRootOwner()
    if (!root) return 0

    return root.sources.size
  },
}
