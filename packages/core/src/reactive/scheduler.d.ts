/**
 * Reactive scheduler for managing update batching and timing
 *
 * Provides utilities for controlling when reactive updates are executed,
 * batching updates for performance, and scheduling priorities.
 */
import type { Scheduler } from './types';
/**
 * Priority-based scheduler
 */
declare enum TaskPriority {
    Immediate = 0,
    High = 1,
    Normal = 2,
    Low = 3,
    Idle = 4
}
/**
 * Get the current scheduler
 */
export declare function getScheduler(): Scheduler;
/**
 * Set a custom scheduler
 */
export declare function setScheduler(scheduler: Scheduler): void;
/**
 * Enable/disable scheduling (for testing)
 */
export declare function enableScheduling(enabled?: boolean): void;
/**
 * Flush all pending updates synchronously
 */
export declare function flushSync(): void;
/**
 * Schedule a function to run in the next update cycle
 */
export declare function scheduleUpdate(fn: () => void): void;
/**
 * Create a scheduler with specific behavior
 */
export declare function createScheduler(type: 'microtask' | 'sync' | 'raf' | 'priority'): Scheduler;
/**
 * Schedule with priority (if using priority scheduler)
 */
export declare function scheduleWithPriority(fn: () => void, priority: TaskPriority): void;
/**
 * Defer execution to idle time
 */
export declare function scheduleIdle(fn: () => void): void;
/**
 * Cancel all pending updates
 */
export declare function cancelPendingUpdates(): void;
export { TaskPriority };
export type { Scheduler };
//# sourceMappingURL=scheduler.d.ts.map