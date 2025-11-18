/**
 * Reactive context and computation management
 *
 * Manages the reactive execution context, dependency tracking,
 * and computation lifecycle.
 */
import type { CleanupFunction, Computation, Owner, ReactiveContext } from './types';
import { ComputationState } from './types';
/**
 * Get the current computation context
 */
export declare function getCurrentComputation(): Computation | null;
/**
 * Get the current owner context
 */
export declare function getCurrentOwner(): Owner | null;
/**
 * Check if we're currently batching updates
 */
export declare function isBatchingUpdates(): boolean;
/**
 * Computation implementation
 */
export declare class ComputationImpl implements Computation {
    readonly id: number;
    readonly owner: Owner | null;
    readonly fn: () => any;
    readonly sources: Set<any>;
    readonly observers: Set<Computation>;
    state: ComputationState;
    value: any;
    constructor(fn: () => any, owner?: Owner | null);
    execute(): any;
    dispose(): void;
}
/**
 * Create a new reactive computation root
 */
export declare function createRoot<T>(fn: (dispose: () => void) => T): T;
/**
 * Run a function with a specific owner context
 */
export declare function runWithOwner<T>(owner: Owner | null, fn: () => T): T;
/**
 * Get the current owner context
 */
export declare function getOwner(): Owner | null;
/**
 * Set the flush function (called by signal module)
 */
export declare function setFlushFunction(fn: () => void): void;
/**
 * Batch multiple updates together
 */
export declare function batch<T>(fn: () => T): T;
/**
 * Read a signal without tracking dependency
 */
export declare function untrack<T>(fn: () => T): T;
/**
 * Add cleanup function to current owner
 */
export declare function onCleanup(fn: CleanupFunction): void;
/**
 * Create a computation that runs immediately and tracks dependencies
 */
export declare function createComputation<T>(fn: () => T, owner?: Owner): ComputationImpl;
/**
 * Get reactive context information
 */
export declare function getReactiveContext(): ReactiveContext;
/**
 * Debug utilities
 */
export declare const DEBUG: {
    getCurrentComputation: () => Computation | null;
    getCurrentOwner: () => Owner | null;
    getComputationCount: () => number;
    getOwnerCount: () => number;
    isBatching: () => boolean;
    getModuleInstances: () => string[];
    getModuleId: () => string;
};
//# sourceMappingURL=context.d.ts.map