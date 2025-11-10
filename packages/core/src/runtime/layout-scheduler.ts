/**
 * Layout Scheduler (Phase 4)
 *
 * FastDOM-style read/write separation to prevent layout thrashing.
 * Batches DOM reads (measurements) and writes (mutations) into separate phases.
 */

type ReadTask = () => void
type WriteTask = () => void

interface SchedulerState {
  reads: ReadTask[]
  writes: WriteTask[]
  scheduled: boolean
  measuring: boolean
  mutating: boolean
  deferredWrites: WriteTask[]
  rafScheduled: boolean
  rafId: number | null
}

/**
 * Global layout scheduler for batching DOM operations
 */
class LayoutScheduler {
  private state: SchedulerState = {
    reads: [],
    writes: [],
    scheduled: false,
    measuring: false,
    mutating: false,
    deferredWrites: [],
    rafScheduled: false,
    rafId: null,
  }

  // Dev mode tracking for layout thrash detection
  private thrashDetection = {
    enabled: typeof process !== 'undefined' && process.env?.NODE_ENV === 'development',
    lastOperation: null as 'read' | 'write' | null,
    thrashCount: 0,
    thrashThreshold: 3,
  }

  /**
   * Schedule a DOM read (measurement) operation
   * Reads are batched and executed before writes to avoid layout thrashing
   */
  read(task: ReadTask): void {
    this.state.reads.push(task)
    this.scheduleFlush()
  }

  /**
   * Schedule a DOM write (mutation) operation
   * Writes are batched and executed after all reads complete
   */
  write(task: WriteTask): void {
    this.state.writes.push(task)
    this.scheduleFlush()
  }

  /**
   * Schedule a deferred DOM write (mutation) using requestAnimationFrame
   * Use this for non-urgent updates that can wait until the next frame
   */
  defer(task: WriteTask): void {
    this.state.deferredWrites.push(task)
    this.scheduleDeferred()
  }

  /**
   * Execute a read immediately (use sparingly, prefer batched reads)
   */
  readNow<T>(task: () => T): T {
    if (this.thrashDetection.enabled) {
      this.detectThrash('read')
    }
    return task()
  }

  /**
   * Execute a write immediately (use sparingly, prefer batched writes)
   */
  writeNow(task: WriteTask): void {
    if (this.thrashDetection.enabled) {
      this.detectThrash('write')
    }
    task()
  }

  /**
   * Schedule the flush if not already scheduled
   */
  private scheduleFlush(): void {
    if (!this.state.scheduled) {
      this.state.scheduled = true
      // Use microtask for immediate flushing (better than RAF for most cases)
      // RAF would be used for deferred/low-priority updates
      Promise.resolve().then(() => this.flush())
    }
  }

  /**
   * Schedule deferred writes using requestAnimationFrame
   */
  private scheduleDeferred(): void {
    if (!this.state.rafScheduled) {
      this.state.rafScheduled = true

      // Check if we're in a browser environment
      if (typeof requestAnimationFrame !== 'undefined') {
        this.state.rafId = requestAnimationFrame(() => this.flushDeferred())
      } else {
        // Fallback to immediate execution in non-browser environments (tests, SSR)
        Promise.resolve().then(() => this.flushDeferred())
      }
    }
  }

  /**
   * Flush all pending reads and writes
   */
  private flush(): void {
    this.state.scheduled = false

    // Phase 1: Execute all reads (measurements)
    if (this.state.reads.length > 0) {
      this.state.measuring = true
      const reads = this.state.reads
      this.state.reads = []

      for (const read of reads) {
        try {
          read()
        } catch (error) {
          console.error('[LayoutScheduler] Read task error:', error)
        }
      }

      this.state.measuring = false
    }

    // Phase 2: Execute all writes (mutations)
    if (this.state.writes.length > 0) {
      this.state.mutating = true
      const writes = this.state.writes
      this.state.writes = []

      for (const write of writes) {
        try {
          write()
        } catch (error) {
          console.error('[LayoutScheduler] Write task error:', error)
        }
      }

      this.state.mutating = false
    }

    // If new tasks were added during flush, schedule another flush
    if (this.state.reads.length > 0 || this.state.writes.length > 0) {
      this.scheduleFlush()
    }
  }

  /**
   * Flush deferred writes
   */
  private flushDeferred(): void {
    this.state.rafScheduled = false
    this.state.rafId = null

    if (this.state.deferredWrites.length > 0) {
      this.state.mutating = true
      const writes = this.state.deferredWrites
      this.state.deferredWrites = []

      for (const write of writes) {
        try {
          write()
        } catch (error) {
          console.error('[LayoutScheduler] Deferred write task error:', error)
        }
      }

      this.state.mutating = false
    }

    // If new deferred tasks were added during flush, schedule another flush
    if (this.state.deferredWrites.length > 0) {
      this.scheduleDeferred()
    }
  }

  /**
   * Clear all pending operations (useful for cleanup/testing)
   */
  clear(): void {
    this.state.reads = []
    this.state.writes = []
    this.state.deferredWrites = []
    this.state.scheduled = false
    this.state.rafScheduled = false

    if (this.state.rafId !== null && typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(this.state.rafId)
      this.state.rafId = null
    }
  }

  /**
   * Detect layout thrashing patterns in dev mode
   */
  private detectThrash(operation: 'read' | 'write'): void {
    if (!this.thrashDetection.enabled) return

    // Detect interleaved read/write pattern
    if (
      this.thrashDetection.lastOperation &&
      this.thrashDetection.lastOperation !== operation
    ) {
      this.thrashDetection.thrashCount++

      if (this.thrashDetection.thrashCount >= this.thrashDetection.thrashThreshold) {
        console.warn(
          '[TachUI Performance Warning] Layout thrashing detected! ' +
          `Detected ${this.thrashDetection.thrashCount} interleaved read/write operations. ` +
          'Consider batching DOM reads and writes using the layout scheduler:\n' +
          '  - Use scheduler.read() for measurements (offsetWidth, getBoundingClientRect, etc.)\n' +
          '  - Use scheduler.write() for mutations (style changes, insertions, etc.)\n' +
          'Stack trace:',
          new Error().stack
        )
        // Reset counter after warning
        this.thrashDetection.thrashCount = 0
      }
    } else {
      // Same operation type, reset counter
      this.thrashDetection.thrashCount = 0
    }

    this.thrashDetection.lastOperation = operation
  }

  /**
   * Get current scheduler stats (for debugging/testing)
   */
  getStats() {
    return {
      pendingReads: this.state.reads.length,
      pendingWrites: this.state.writes.length,
      pendingDeferredWrites: this.state.deferredWrites.length,
      scheduled: this.state.scheduled,
      rafScheduled: this.state.rafScheduled,
      measuring: this.state.measuring,
      mutating: this.state.mutating,
      thrashCount: this.thrashDetection.thrashCount,
    }
  }
}

/**
 * Global layout scheduler instance
 */
export const layoutScheduler = new LayoutScheduler()

/**
 * Convenience functions for scheduling operations
 */
export function scheduleRead(task: ReadTask): void {
  layoutScheduler.read(task)
}

export function scheduleWrite(task: WriteTask): void {
  layoutScheduler.write(task)
}

export function readDOM<T>(task: () => T): T {
  return layoutScheduler.readNow(task)
}

export function writeDOM(task: WriteTask): void {
  layoutScheduler.writeNow(task)
}

export function deferWrite(task: WriteTask): void {
  layoutScheduler.defer(task)
}
