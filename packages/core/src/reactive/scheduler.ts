/**
 * Reactive scheduler for managing update batching and timing
 *
 * Provides utilities for controlling when reactive updates are executed,
 * batching updates for performance, and scheduling priorities.
 */

import type { Scheduler } from './types'

/**
 * Default scheduler implementation using microtasks
 */
class MicrotaskScheduler implements Scheduler {
  private pending = new Set<() => void>()
  private isFlushScheduled = false

  schedule(fn: () => void): void {
    this.pending.add(fn)

    if (!this.isFlushScheduled) {
      this.isFlushScheduled = true
      queueMicrotask(() => this.flush())
    }
  }

  flush(): void {
    if (this.pending.size === 0) {
      this.isFlushScheduled = false
      return
    }

    const tasks = Array.from(this.pending)
    this.pending.clear()
    this.isFlushScheduled = false

    for (const task of tasks) {
      try {
        task()
      } catch (error) {
        console.error('Error in scheduled task:', error)
      }
    }

    // If new tasks were scheduled during execution, flush again
    if (this.pending.size > 0) {
      this.isFlushScheduled = true
      queueMicrotask(() => this.flush())
    }
  }
}

/**
 * Synchronous scheduler for immediate execution
 */
class SyncScheduler implements Scheduler {
  schedule(fn: () => void): void {
    try {
      fn()
    } catch (error) {
      console.error('Error in sync scheduled task:', error)
    }
  }

  flush(): void {
    // No-op for sync scheduler
  }
}

/**
 * RAF scheduler for animation-friendly updates
 */
class RAFScheduler implements Scheduler {
  private pending = new Set<() => void>()
  private rafId: number | null = null

  schedule(fn: () => void): void {
    this.pending.add(fn)

    if (this.rafId === null) {
      this.rafId = requestAnimationFrame(() => this.flush())
    }
  }

  flush(): void {
    if (this.pending.size === 0) {
      this.rafId = null
      return
    }

    const tasks = Array.from(this.pending)
    this.pending.clear()
    this.rafId = null

    for (const task of tasks) {
      try {
        task()
      } catch (error) {
        console.error('Error in RAF scheduled task:', error)
      }
    }

    // If new tasks were scheduled during execution, schedule another RAF
    if (this.pending.size > 0) {
      this.rafId = requestAnimationFrame(() => this.flush())
    }
  }
}

/**
 * Priority-based scheduler
 */
enum TaskPriority {
  Immediate = 0,
  High = 1,
  Normal = 2,
  Low = 3,
  Idle = 4,
}

interface PriorityTask {
  fn: () => void
  priority: TaskPriority
  id: number
}

class PriorityScheduler implements Scheduler {
  private queues = new Map<TaskPriority, Set<PriorityTask>>()
  private taskIdCounter = 0
  private isFlushScheduled = false

  constructor() {
    // Initialize priority queues
    for (const priority of Object.values(TaskPriority)) {
      if (typeof priority === 'number') {
        this.queues.set(priority, new Set())
      }
    }
  }

  schedule(fn: () => void, priority: TaskPriority = TaskPriority.Normal): void {
    const task: PriorityTask = {
      fn,
      priority,
      id: ++this.taskIdCounter,
    }

    const queue = this.queues.get(priority)
    if (queue) {
      queue.add(task)
    }

    if (!this.isFlushScheduled) {
      this.isFlushScheduled = true

      if (priority === TaskPriority.Immediate) {
        this.flush()
      } else {
        queueMicrotask(() => this.flush())
      }
    }
  }

  flush(): void {
    this.isFlushScheduled = false

    // Process queues by priority
    for (const priority of [
      TaskPriority.Immediate,
      TaskPriority.High,
      TaskPriority.Normal,
      TaskPriority.Low,
      TaskPriority.Idle,
    ]) {
      const queue = this.queues.get(priority)
      if (!queue || queue.size === 0) continue

      const tasks = Array.from(queue).sort((a, b) => a.id - b.id)
      queue.clear()

      for (const task of tasks) {
        try {
          task.fn()
        } catch (error) {
          console.error(`Error in priority ${priority} task:`, error)
        }
      }

      // Yield to browser after processing each priority level
      if (queue.size === 0 && this.hasMoreTasks()) {
        queueMicrotask(() => this.flush())
        return
      }
    }
  }

  private hasMoreTasks(): boolean {
    for (const queue of this.queues.values()) {
      if (queue.size > 0) return true
    }
    return false
  }
}

// Global scheduler instance
let currentScheduler: Scheduler = new MicrotaskScheduler()

/**
 * Get the current scheduler
 */
export function getScheduler(): Scheduler {
  return currentScheduler
}

/**
 * Set a custom scheduler
 */
export function setScheduler(scheduler: Scheduler): void {
  currentScheduler = scheduler
}

/**
 * Enable/disable scheduling (for testing)
 */
export function enableScheduling(enabled: boolean = true): void {
  if (enabled) {
    currentScheduler = new MicrotaskScheduler()
  } else {
    currentScheduler = new SyncScheduler()
  }
}

/**
 * Flush all pending updates synchronously
 */
export function flushSync(): void {
  currentScheduler.flush()
}

/**
 * Schedule a function to run in the next update cycle
 */
export function scheduleUpdate(fn: () => void): void {
  currentScheduler.schedule(fn)
}

/**
 * Create a scheduler with specific behavior
 */
export function createScheduler(type: 'microtask' | 'sync' | 'raf' | 'priority'): Scheduler {
  switch (type) {
    case 'microtask':
      return new MicrotaskScheduler()
    case 'sync':
      return new SyncScheduler()
    case 'raf':
      return new RAFScheduler()
    case 'priority':
      return new PriorityScheduler()
    default:
      return new MicrotaskScheduler()
  }
}

/**
 * Schedule with priority (if using priority scheduler)
 */
export function scheduleWithPriority(fn: () => void, priority: TaskPriority): void {
  if (currentScheduler instanceof PriorityScheduler) {
    ;(currentScheduler as any).schedule(fn, priority)
  } else {
    currentScheduler.schedule(fn)
  }
}

/**
 * Defer execution to idle time
 */
export function scheduleIdle(fn: () => void): void {
  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(fn)
  } else {
    setTimeout(fn, 0)
  }
}

/**
 * Cancel all pending updates
 */
export function cancelPendingUpdates(): void {
  if (
    currentScheduler instanceof MicrotaskScheduler ||
    currentScheduler instanceof PriorityScheduler
  ) {
    ;(currentScheduler as any).pending?.clear()
  }
}

// Export scheduler types
export { TaskPriority }
export type { Scheduler }
