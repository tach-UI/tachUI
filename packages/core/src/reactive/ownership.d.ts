/**
 * Ownership and reactive context management
 *
 * Provides utilities for managing reactive ownership contexts,
 * which control the lifecycle of reactive computations.
 */
import { createRoot, getOwner as getCurrentOwner, runWithOwner } from './context';
import type { Owner } from './types';
/**
 * Get the current owner context
 */
export declare function getOwner(): Owner | null;
/**
 * Run a function with a specific owner context
 */
export { runWithOwner };
/**
 * Create a new reactive root context
 */
export { createRoot };
/**
 * Check if we're currently in a reactive context
 */
export declare function isReactiveContext(): boolean;
/**
 * Run a function outside of any reactive context
 */
export declare function runOutsideReactiveContext<T>(fn: () => T): T;
/**
 * Create a detached reactive context that doesn't inherit from parent
 */
export declare function createDetachedRoot<T>(fn: (dispose: () => void) => T): T;
/**
 * Get the root owner of the current ownership chain
 */
export declare function getRootOwner(): Owner | null;
/**
 * Get all owners in the ownership chain
 */
export declare function getOwnerChain(): (Owner | null)[];
/**
 * Check if an owner is an ancestor of another owner
 */
export declare function isOwnerAncestor(ancestor: Owner, descendant: Owner): boolean;
/**
 * Find the common ancestor of two owners
 */
export declare function findCommonAncestor(owner1: Owner, owner2: Owner): Owner | null;
/**
 * Get the depth of an owner in the ownership tree
 */
export declare function getOwnerDepth(owner: Owner): number;
/**
 * Create a child owner context
 */
export declare function createChildOwner(): Owner | null;
/**
 * Debug utilities for ownership
 */
export declare const OwnershipDebug: {
    getCurrentOwner: typeof getCurrentOwner;
    getRootOwner: typeof getRootOwner;
    getOwnerChain: typeof getOwnerChain;
    getOwnerDepth: typeof getOwnerDepth;
    isReactiveContext: typeof isReactiveContext;
    /**
     * Get ownership tree information
     */
    getOwnershipTree(): object;
    /**
     * Count total computations in ownership tree
     */
    countComputations(): number;
};
//# sourceMappingURL=ownership.d.ts.map