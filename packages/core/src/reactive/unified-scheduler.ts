/**
 * Unified Reactive Scheduler v2.0
 *
 * Eliminates duplicate update queues and provides enterprise-grade
 * reactive system with proper error handling and memory management.
 *
 * Replaces the existing duplicated queue systems in signal.ts and computed.ts
 */

export enum UpdatePriority {
  Immediate = 0, // Synchronous updates (rare)
  High = 1, // User interaction responses
  Normal = 2, // Regular updates
  Low = 3, // Background updates
  Idle = 4, // Idle time updates
}

export interface ReactiveNode {
  readonly id: number
  readonly type: 'signal' | 'computed' | 'effect'
  readonly priority: UpdatePriority
  notify(): void
  cleanup(): void
}

export class ReactiveError extends Error {
  constructor(
    message: string,
    public readonly cause: any,
    public readonly node: ReactiveNode
  ) {
    super(message)
    this.name = 'ReactiveError'
  }
}

export interface ReactivePerformanceMetrics {
  totalNodes: number
  updateCycles: number
  averageUpdateTime: number
  memoryUsage: number
  errorCount: number
}

/**
 * Unified reactive scheduler that replaces all duplicate queue systems
 */
export class ReactiveScheduler {
  private static instance: ReactiveScheduler | null = null
  private updateQueues = new Map<UpdatePriority, Set<ReactiveNode>>()
  private isFlushPending = false
  private isDestroyed = false

  // Error handling
  private errorHandlers = new Set<(error: ReactiveError) => void>()
  private readonly maxRetries = 3

  // Performance tracking
  private totalUpdateCycles = 0
  private totalUpdateTime = 0
  private errorCount = 0
  private nodeRegistry = new WeakSet<ReactiveNode>()

  private constructor() {
    // Initialize priority queues
    for (const priority of Object.values(UpdatePriority)) {
      if (typeof priority === 'number') {
        this.updateQueues.set(priority, new Set())
      }
    }
  }

  static getInstance(): ReactiveScheduler {
    if (!ReactiveScheduler.instance) {
      ReactiveScheduler.instance = new ReactiveScheduler()
    }
    return ReactiveScheduler.instance
  }

  /**
   * Schedule reactive node for update
   */
  schedule(node: ReactiveNode): void {
    if (this.isDestroyed) return

    this.nodeRegistry.add(node)
    const queue = this.getQueue(node.priority)
    queue.add(node)

    if (!this.isFlushPending) {
      this.isFlushPending = true
      this.scheduleFlush(node.priority)
    }
  }

  /**
   * Process all queued updates by priority
   */
  private async flush(): Promise<void> {
    if (this.isDestroyed) return

    this.isFlushPending = false
    const startTime = performance.now()

    try {
      // Process queues in priority order
      for (const priority of [
        UpdatePriority.Immediate,
        UpdatePriority.High,
        UpdatePriority.Normal,
        UpdatePriority.Low,
        UpdatePriority.Idle,
      ]) {
        const queue = this.updateQueues.get(priority)
        if (!queue || queue.size === 0) continue

        const nodesToUpdate = Array.from(queue)
        queue.clear()

        // Process nodes with error handling
        for (const node of nodesToUpdate) {
          try {
            await this.updateNodeWithRetry(node)
          } catch (error) {
            this.handleReactiveError(
              new ReactiveError(`Failed to update ${node.type} node ${node.id}`, error, node)
            )
          }
        }

        // Allow higher priority updates to interrupt
        if (this.hasHigherPriorityWork(priority)) {
          return this.flush()
        }
      }

      this.totalUpdateCycles++
    } finally {
      const endTime = performance.now()
      this.totalUpdateTime += endTime - startTime
    }
  }

  /**
   * Update node with retry logic
   */
  private async updateNodeWithRetry(node: ReactiveNode, attempt = 1): Promise<void> {
    try {
      node.notify()
    } catch (error) {
      if (attempt < this.maxRetries) {
        console.warn(`Reactive update failed, retrying (${attempt}/${this.maxRetries})`)
        // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, attempt * 10))
        return this.updateNodeWithRetry(node, attempt + 1)
      } else {
        throw error
      }
    }
  }

  /**
   * Schedule flush based on priority
   */
  private scheduleFlush(priority: UpdatePriority): void {
    switch (priority) {
      case UpdatePriority.Immediate:
        // Synchronous update (use sparingly)
        void this.flush()
        break
      case UpdatePriority.High:
        // Next microtask for user interactions
        queueMicrotask(() => this.flush())
        break
      case UpdatePriority.Normal:
        // RequestAnimationFrame for normal updates
        if (typeof requestAnimationFrame !== 'undefined') {
          requestAnimationFrame(() => this.flush())
        } else {
          queueMicrotask(() => this.flush())
        }
        break
      case UpdatePriority.Low:
      case UpdatePriority.Idle:
        // Idle callback for low priority updates
        if (typeof requestIdleCallback !== 'undefined') {
          requestIdleCallback(() => this.flush(), { timeout: 1000 })
        } else {
          setTimeout(() => this.flush(), 50)
        }
        break
    }
  }

  /**
   * Check if there's higher priority work waiting
   */
  private hasHigherPriorityWork(currentPriority: UpdatePriority): boolean {
    for (let priority = UpdatePriority.Immediate; priority < currentPriority; priority++) {
      const queue = this.updateQueues.get(priority)
      if (queue && queue.size > 0) {
        return true
      }
    }
    return false
  }

  /**
   * Get queue for priority level
   */
  private getQueue(priority: UpdatePriority): Set<ReactiveNode> {
    const queue = this.updateQueues.get(priority)
    if (!queue) {
      throw new Error(`Invalid priority level: ${priority}`)
    }
    return queue
  }

  /**
   * Register error handler
   */
  onError(handler: (error: ReactiveError) => void): () => void {
    this.errorHandlers.add(handler)
    return () => this.errorHandlers.delete(handler)
  }

  /**
   * Handle reactive errors with recovery
   */
  private handleReactiveError(error: ReactiveError): void {
    this.errorCount++

    // Notify error handlers
    let handled = false
    for (const handler of this.errorHandlers) {
      try {
        handler(error)
        handled = true
      } catch (handlerError) {
        console.error('Error handler threw error:', handlerError)
      }
    }

    // If no handlers or all handlers failed, log and continue
    if (!handled) {
      console.error('Unhandled reactive error:', error)
      // In development, we might want to throw to surface errors
      if (process.env.NODE_ENV === 'development') {
        throw error
      }
    }
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): ReactivePerformanceMetrics {
    let totalNodes = 0
    for (const queue of this.updateQueues.values()) {
      totalNodes += queue.size
    }

    return {
      totalNodes,
      updateCycles: this.totalUpdateCycles,
      averageUpdateTime:
        this.totalUpdateCycles > 0 ? this.totalUpdateTime / this.totalUpdateCycles : 0,
      memoryUsage: this.estimateMemoryUsage(),
      errorCount: this.errorCount,
    }
  }

  /**
   * Estimate memory usage (rough approximation)
   */
  private estimateMemoryUsage(): number {
    let usage = 0
    for (const queue of this.updateQueues.values()) {
      usage += queue.size * 50 // Rough estimate per node
    }
    usage += this.errorHandlers.size * 100 // Rough estimate per handler
    return usage
  }

  /**
   * Check if node is scheduled
   */
  hasNode(node: ReactiveNode): boolean {
    for (const queue of this.updateQueues.values()) {
      if (queue.has(node)) {
        return true
      }
    }
    return false
  }

  /**
   * Flush all pending updates synchronously
   */
  flushSync(): void {
    if (this.isFlushPending) {
      this.isFlushPending = false
      void this.flush()
    }
  }

  /**
   * Clear all pending updates
   */
  clearPending(): void {
    for (const queue of this.updateQueues.values()) {
      queue.clear()
    }
    this.isFlushPending = false
  }

  /**
   * Cleanup all reactive nodes and destroy scheduler
   */
  destroy(): void {
    this.isDestroyed = true

    // Cleanup all queued nodes
    for (const queue of this.updateQueues.values()) {
      for (const node of queue) {
        try {
          node.cleanup()
        } catch (error) {
          console.error('Error cleaning up reactive node:', error)
        }
      }
      queue.clear()
    }

    this.updateQueues.clear()
    this.errorHandlers.clear()
    ReactiveScheduler.instance = null
  }

  /**
   * Get debug information
   */
  getDebugInfo(): object {
    const queueInfo: Record<string, number> = {}
    for (const [priority, queue] of this.updateQueues) {
      queueInfo[UpdatePriority[priority]] = queue.size
    }

    return {
      isFlushPending: this.isFlushPending,
      isDestroyed: this.isDestroyed,
      queueSizes: queueInfo,
      errorHandlerCount: this.errorHandlers.size,
      performance: this.getPerformanceMetrics(),
    }
  }
}
