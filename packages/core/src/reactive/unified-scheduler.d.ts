/**
 * Unified Reactive Scheduler v2.0
 *
 * Eliminates duplicate update queues and provides enterprise-grade
 * reactive system with proper error handling and memory management.
 *
 * Replaces the existing duplicated queue systems in signal.ts and computed.ts
 */
export declare enum UpdatePriority {
    Immediate = 0,// Synchronous updates (rare)
    High = 1,// User interaction responses
    Normal = 2,// Regular updates
    Low = 3,// Background updates
    Idle = 4
}
export interface ReactiveNode {
    readonly id: number;
    readonly type: 'signal' | 'computed' | 'effect';
    readonly priority: UpdatePriority;
    notify(): void;
    cleanup(): void;
}
export declare class ReactiveError extends Error {
    readonly cause: any;
    readonly node: ReactiveNode;
    constructor(message: string, cause: any, node: ReactiveNode);
}
export interface ReactivePerformanceMetrics {
    totalNodes: number;
    updateCycles: number;
    averageUpdateTime: number;
    memoryUsage: number;
    errorCount: number;
}
/**
 * Unified reactive scheduler that replaces all duplicate queue systems
 */
export declare class ReactiveScheduler {
    private static instance;
    private updateQueues;
    private isFlushPending;
    private isDestroyed;
    private errorHandlers;
    private readonly maxRetries;
    private totalUpdateCycles;
    private totalUpdateTime;
    private errorCount;
    private nodeRegistry;
    private constructor();
    static getInstance(): ReactiveScheduler;
    /**
     * Schedule reactive node for update
     */
    schedule(node: ReactiveNode): void;
    /**
     * Process all queued updates by priority
     */
    private flush;
    /**
     * Update node with retry logic
     */
    private updateNodeWithRetry;
    /**
     * Schedule flush based on priority
     */
    private scheduleFlush;
    /**
     * Check if there's higher priority work waiting
     */
    private hasHigherPriorityWork;
    /**
     * Get queue for priority level
     */
    private getQueue;
    /**
     * Register error handler
     */
    onError(handler: (error: ReactiveError) => void): () => void;
    /**
     * Handle reactive errors with recovery
     */
    private handleReactiveError;
    /**
     * Get performance metrics
     */
    getPerformanceMetrics(): ReactivePerformanceMetrics;
    /**
     * Estimate memory usage (rough approximation)
     */
    private estimateMemoryUsage;
    /**
     * Check if node is scheduled
     */
    hasNode(node: ReactiveNode): boolean;
    /**
     * Flush all pending updates synchronously
     */
    flushSync(): void;
    /**
     * Clear all pending updates
     */
    clearPending(): void;
    /**
     * Cleanup all reactive nodes and destroy scheduler
     */
    destroy(): void;
    /**
     * Get debug information
     */
    getDebugInfo(): object;
}
//# sourceMappingURL=unified-scheduler.d.ts.map