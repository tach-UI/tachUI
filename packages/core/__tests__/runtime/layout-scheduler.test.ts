/**
 * Layout Scheduler Tests
 *
 * Tests for Phase 4: FastDOM-style read/write separation
 */

import { JSDOM } from 'jsdom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { layoutScheduler, scheduleRead, scheduleWrite, readDOM, writeDOM, deferWrite } from '../../src/runtime/layout-scheduler'

describe('Layout Scheduler', () => {
  let dom: JSDOM

  beforeEach(() => {
    // Create a JSDOM environment
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>')
    global.document = dom.window.document
    global.window = dom.window as any
    global.requestAnimationFrame = vi.fn((callback) => {
      setTimeout(callback, 16)
      return 1
    }) as any
    global.cancelAnimationFrame = vi.fn()

    // Clear any pending operations
    layoutScheduler.clear()
  })

  describe('Basic Scheduling', () => {
    it('should schedule and execute read tasks', async () => {
      const readTask = vi.fn()

      scheduleRead(readTask)

      expect(readTask).not.toHaveBeenCalled()

      // Wait for microtask to execute
      await Promise.resolve()

      expect(readTask).toHaveBeenCalledTimes(1)
    })

    it('should schedule and execute write tasks', async () => {
      const writeTask = vi.fn()

      scheduleWrite(writeTask)

      expect(writeTask).not.toHaveBeenCalled()

      // Wait for microtask to execute
      await Promise.resolve()

      expect(writeTask).toHaveBeenCalledTimes(1)
    })

    it('should batch multiple read tasks', async () => {
      const task1 = vi.fn()
      const task2 = vi.fn()
      const task3 = vi.fn()

      scheduleRead(task1)
      scheduleRead(task2)
      scheduleRead(task3)

      expect(task1).not.toHaveBeenCalled()
      expect(task2).not.toHaveBeenCalled()
      expect(task3).not.toHaveBeenCalled()

      await Promise.resolve()

      expect(task1).toHaveBeenCalledTimes(1)
      expect(task2).toHaveBeenCalledTimes(1)
      expect(task3).toHaveBeenCalledTimes(1)
    })

    it('should batch multiple write tasks', async () => {
      const task1 = vi.fn()
      const task2 = vi.fn()
      const task3 = vi.fn()

      scheduleWrite(task1)
      scheduleWrite(task2)
      scheduleWrite(task3)

      expect(task1).not.toHaveBeenCalled()

      await Promise.resolve()

      expect(task1).toHaveBeenCalledTimes(1)
      expect(task2).toHaveBeenCalledTimes(1)
      expect(task3).toHaveBeenCalledTimes(1)
    })
  })

  describe('Read/Write Phase Separation', () => {
    it('should execute all reads before any writes', async () => {
      const executionOrder: string[] = []

      scheduleWrite(() => executionOrder.push('write1'))
      scheduleRead(() => executionOrder.push('read1'))
      scheduleWrite(() => executionOrder.push('write2'))
      scheduleRead(() => executionOrder.push('read2'))

      await Promise.resolve()

      expect(executionOrder).toEqual(['read1', 'read2', 'write1', 'write2'])
    })

    it('should handle interleaved read/write scheduling correctly', async () => {
      const executionOrder: string[] = []

      scheduleRead(() => executionOrder.push('read1'))
      scheduleWrite(() => executionOrder.push('write1'))
      scheduleRead(() => executionOrder.push('read2'))
      scheduleWrite(() => executionOrder.push('write2'))
      scheduleRead(() => executionOrder.push('read3'))

      await Promise.resolve()

      // All reads should execute before all writes
      expect(executionOrder).toEqual(['read1', 'read2', 'read3', 'write1', 'write2'])
    })

    it('should allow writes scheduled during reads to execute in same flush', async () => {
      const executionOrder: string[] = []

      scheduleRead(() => {
        executionOrder.push('read1')
        // Schedule a write during read phase
        scheduleWrite(() => executionOrder.push('write-from-read'))
      })

      await Promise.resolve()

      expect(executionOrder).toEqual(['read1', 'write-from-read'])
    })

    it('should handle recursive scheduling across multiple flushes', async () => {
      const executionOrder: string[] = []
      let count = 0

      scheduleRead(() => {
        executionOrder.push('read1')
        if (count < 2) {
          count++
          scheduleRead(() => executionOrder.push(`read-recursive-${count}`))
        }
      })

      await Promise.resolve()
      // Need another microtask to wait for the recursive flush
      await Promise.resolve()

      // First flush executes read1, which schedules another read
      // Second flush executes read-recursive-1
      expect(executionOrder).toEqual(['read1', 'read-recursive-1'])
    })
  })

  describe('Immediate Execution', () => {
    it('should execute readNow immediately', () => {
      const result = readDOM(() => {
        return 'test-value'
      })

      expect(result).toBe('test-value')
    })

    it('should execute writeNow immediately', () => {
      const writeTask = vi.fn()

      writeDOM(writeTask)

      expect(writeTask).toHaveBeenCalledTimes(1)
    })

    it('should return value from readNow', () => {
      const element = document.createElement('div')
      element.style.width = '100px'
      document.body.appendChild(element)

      const width = readDOM(() => {
        return element.offsetWidth
      })

      // JSDOM doesn't compute layout, so offsetWidth is 0
      expect(width).toBeDefined()
    })
  })

  describe('Deferred Writes', () => {
    it('should schedule deferred writes using RAF', () => {
      const task = vi.fn()

      deferWrite(task)

      expect(global.requestAnimationFrame).toHaveBeenCalledTimes(1)
      expect(task).not.toHaveBeenCalled()
    })

    it('should execute deferred writes in RAF callback', async () => {
      const task = vi.fn()

      // Mock RAF to execute callback immediately
      global.requestAnimationFrame = vi.fn((callback) => {
        callback(0)
        return 1
      }) as any

      deferWrite(task)

      await Promise.resolve()

      expect(task).toHaveBeenCalledTimes(1)
    })

    it('should batch multiple deferred writes into single RAF', () => {
      const task1 = vi.fn()
      const task2 = vi.fn()
      const task3 = vi.fn()

      deferWrite(task1)
      deferWrite(task2)
      deferWrite(task3)

      // Should only call RAF once for all three tasks
      expect(global.requestAnimationFrame).toHaveBeenCalledTimes(1)
    })

    it('should handle deferred writes when RAF is not available', async () => {
      // Simulate non-browser environment
      global.requestAnimationFrame = undefined as any

      const task = vi.fn()

      deferWrite(task)

      // Should fallback to Promise
      await Promise.resolve()

      expect(task).toHaveBeenCalledTimes(1)
    })
  })

  describe('Error Handling', () => {
    it('should catch and log errors in read tasks', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const errorTask = vi.fn(() => {
        throw new Error('Read error')
      })
      const successTask = vi.fn()

      scheduleRead(errorTask)
      scheduleRead(successTask)

      await Promise.resolve()

      expect(errorTask).toHaveBeenCalledTimes(1)
      expect(successTask).toHaveBeenCalledTimes(1)
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[LayoutScheduler] Read task error:',
        expect.any(Error)
      )

      consoleErrorSpy.mockRestore()
    })

    it('should catch and log errors in write tasks', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const errorTask = vi.fn(() => {
        throw new Error('Write error')
      })
      const successTask = vi.fn()

      scheduleWrite(errorTask)
      scheduleWrite(successTask)

      await Promise.resolve()

      expect(errorTask).toHaveBeenCalledTimes(1)
      expect(successTask).toHaveBeenCalledTimes(1)
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[LayoutScheduler] Write task error:',
        expect.any(Error)
      )

      consoleErrorSpy.mockRestore()
    })

    it('should catch and log errors in deferred tasks', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      // Mock RAF to execute immediately
      global.requestAnimationFrame = vi.fn((callback) => {
        callback(0)
        return 1
      }) as any

      const errorTask = vi.fn(() => {
        throw new Error('Deferred error')
      })

      deferWrite(errorTask)

      await Promise.resolve()

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[LayoutScheduler] Deferred write task error:',
        expect.any(Error)
      )

      consoleErrorSpy.mockRestore()
    })
  })

  describe('Clear Functionality', () => {
    it('should clear pending read tasks', async () => {
      const task = vi.fn()

      scheduleRead(task)
      layoutScheduler.clear()

      await Promise.resolve()

      expect(task).not.toHaveBeenCalled()
    })

    it('should clear pending write tasks', async () => {
      const task = vi.fn()

      scheduleWrite(task)
      layoutScheduler.clear()

      await Promise.resolve()

      expect(task).not.toHaveBeenCalled()
    })

    it('should clear pending deferred writes', () => {
      const task = vi.fn()

      deferWrite(task)
      layoutScheduler.clear()

      expect(global.cancelAnimationFrame).toHaveBeenCalledTimes(1)
    })

    it('should reset scheduler state after clear', async () => {
      scheduleRead(vi.fn())
      scheduleWrite(vi.fn())
      deferWrite(vi.fn())

      layoutScheduler.clear()

      const stats = layoutScheduler.getStats()
      expect(stats.pendingReads).toBe(0)
      expect(stats.pendingWrites).toBe(0)
      expect(stats.pendingDeferredWrites).toBe(0)
      expect(stats.scheduled).toBe(false)
      expect(stats.rafScheduled).toBe(false)
    })
  })

  describe('Stats and Monitoring', () => {
    it('should track pending reads', () => {
      scheduleRead(vi.fn())
      scheduleRead(vi.fn())

      const stats = layoutScheduler.getStats()
      expect(stats.pendingReads).toBe(2)
    })

    it('should track pending writes', () => {
      scheduleWrite(vi.fn())
      scheduleWrite(vi.fn())
      scheduleWrite(vi.fn())

      const stats = layoutScheduler.getStats()
      expect(stats.pendingWrites).toBe(3)
    })

    it('should track pending deferred writes', () => {
      deferWrite(vi.fn())
      deferWrite(vi.fn())

      const stats = layoutScheduler.getStats()
      expect(stats.pendingDeferredWrites).toBe(2)
    })

    it('should track scheduled state', () => {
      const statsBefore = layoutScheduler.getStats()
      expect(statsBefore.scheduled).toBe(false)

      scheduleRead(vi.fn())

      const statsAfter = layoutScheduler.getStats()
      expect(statsAfter.scheduled).toBe(true)
    })

    it('should track RAF scheduled state', () => {
      const statsBefore = layoutScheduler.getStats()
      expect(statsBefore.rafScheduled).toBe(false)

      deferWrite(vi.fn())

      const statsAfter = layoutScheduler.getStats()
      expect(statsAfter.rafScheduled).toBe(true)
    })

    it('should track measuring state during read phase', async () => {
      let measuringDuringRead = false

      scheduleRead(() => {
        const stats = layoutScheduler.getStats()
        measuringDuringRead = stats.measuring
      })

      await Promise.resolve()

      expect(measuringDuringRead).toBe(true)

      const statsAfter = layoutScheduler.getStats()
      expect(statsAfter.measuring).toBe(false)
    })

    it('should track mutating state during write phase', async () => {
      let mutatingDuringWrite = false

      scheduleWrite(() => {
        const stats = layoutScheduler.getStats()
        mutatingDuringWrite = stats.mutating
      })

      await Promise.resolve()

      expect(mutatingDuringWrite).toBe(true)

      const statsAfter = layoutScheduler.getStats()
      expect(statsAfter.mutating).toBe(false)
    })

    it('should reset stats after flush completes', async () => {
      scheduleRead(vi.fn())
      scheduleWrite(vi.fn())

      const statsBefore = layoutScheduler.getStats()
      expect(statsBefore.pendingReads).toBe(1)
      expect(statsBefore.pendingWrites).toBe(1)

      await Promise.resolve()

      const statsAfter = layoutScheduler.getStats()
      expect(statsAfter.pendingReads).toBe(0)
      expect(statsAfter.pendingWrites).toBe(0)
      expect(statsAfter.scheduled).toBe(false)
      expect(statsAfter.measuring).toBe(false)
      expect(statsAfter.mutating).toBe(false)
    })
  })

  describe('Complex Scenarios', () => {
    it('should handle DOM measurements and mutations correctly', async () => {
      const container = document.createElement('div')
      document.body.appendChild(container)

      const measurements: number[] = []

      // Schedule a write to set initial width
      scheduleWrite(() => {
        const div = document.createElement('div')
        div.style.width = '100px'
        container.appendChild(div)
      })

      // Schedule a read to measure
      scheduleRead(() => {
        const div = container.firstElementChild as HTMLElement
        measurements.push(div?.offsetWidth || 0)
      })

      // Schedule another write
      scheduleWrite(() => {
        const div = container.firstElementChild as HTMLElement
        if (div) div.style.width = '200px'
      })

      await Promise.resolve()

      // Write should execute first (from previous flush), then read, then write
      expect(measurements.length).toBe(1)
    })

    it('should handle multiple flush cycles', async () => {
      const executionOrder: string[] = []

      scheduleRead(() => {
        executionOrder.push('read1')
        // Schedule more work during first flush
        scheduleRead(() => executionOrder.push('read2'))
        scheduleWrite(() => executionOrder.push('write2'))
      })

      scheduleWrite(() => {
        executionOrder.push('write1')
      })

      await Promise.resolve()
      // Need another microtask for the recursive flush
      await Promise.resolve()

      // First flush executes: read1 (which schedules read2 and write2), then write1 and write2
      // Second flush executes: read2
      // write2 executes in first flush because it was scheduled during read phase, before write phase started
      expect(executionOrder).toEqual(['read1', 'write1', 'write2', 'read2'])
    })

    it('should handle mixing immediate and scheduled operations', async () => {
      const executionOrder: string[] = []

      scheduleRead(() => executionOrder.push('scheduled-read'))

      readDOM(() => executionOrder.push('immediate-read'))

      scheduleWrite(() => executionOrder.push('scheduled-write'))

      writeDOM(() => executionOrder.push('immediate-write'))

      // Immediate operations execute right away
      expect(executionOrder).toEqual(['immediate-read', 'immediate-write'])

      await Promise.resolve()

      // Scheduled operations execute in correct order
      expect(executionOrder).toEqual([
        'immediate-read',
        'immediate-write',
        'scheduled-read',
        'scheduled-write',
      ])
    })

    it('should prevent layout thrashing with proper batching', async () => {
      const container = document.createElement('div')
      document.body.appendChild(container)

      const elements: HTMLElement[] = []
      const measurements: number[] = []

      // Create elements
      for (let i = 0; i < 5; i++) {
        const el = document.createElement('div')
        elements.push(el)
        container.appendChild(el)
      }

      // Bad pattern: interleaved read/write (would cause thrashing without scheduler)
      // Good pattern: batch all reads, then all writes
      elements.forEach((el, i) => {
        scheduleRead(() => {
          measurements.push(el.offsetWidth)
        })
      })

      elements.forEach((el, i) => {
        scheduleWrite(() => {
          el.style.width = `${100 + i * 10}px`
        })
      })

      await Promise.resolve()

      // All reads execute before any writes - no thrashing
      expect(measurements.length).toBe(5)
    })
  })

  describe('RAF Fallback', () => {
    it('should handle missing cancelAnimationFrame gracefully', () => {
      global.cancelAnimationFrame = undefined as any

      deferWrite(vi.fn())

      // Should not throw when clearing
      expect(() => layoutScheduler.clear()).not.toThrow()
    })
  })

  describe('Recursive Flushes', () => {
    it('should handle tasks added during flush execution', async () => {
      const executionOrder: string[] = []
      let flushCount = 0

      scheduleRead(() => {
        executionOrder.push(`read-${flushCount}`)
        if (flushCount < 2) {
          flushCount++
          scheduleRead(() => executionOrder.push(`nested-read-${flushCount}`))
          scheduleWrite(() => executionOrder.push(`nested-write-${flushCount}`))
        }
      })

      await Promise.resolve()

      // Should handle recursive scheduling across multiple flush cycles
      expect(executionOrder.length).toBeGreaterThan(0)
      expect(executionOrder[0]).toBe('read-0')
    })
  })
})
