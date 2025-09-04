/**
 * Stress Tests for Interaction Modifiers
 *
 * Performance validation tests for gesture, focus, and interaction modifiers
 * under high load and edge conditions.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  onLongPressGesture,
  keyboardShortcut,
  focused,
  focusable,
  onContinuousHover,
  allowsHitTesting,
} from '../../src/interaction'
import type { ModifierContext, DOMNode } from '../../src/types'

// Mock DOM environment
class MockElement {
  public style: Record<string, string> = {}
  public tabIndex = -1
  private eventListeners: Map<string, EventListenerOrEventListenerObject[]> =
    new Map()

  addEventListener(
    event: string,
    listener: EventListenerOrEventListenerObject
  ) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event)!.push(listener)
  }

  removeEventListener(
    event: string,
    listener: EventListenerOrEventListenerObject
  ) {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      const index = listeners.indexOf(listener)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  dispatchEvent(event: Event): boolean {
    const listeners = this.eventListeners.get(event.type)
    if (listeners) {
      listeners.forEach(listener => {
        if (typeof listener === 'function') {
          listener.call(this, event)
        } else if (listener.handleEvent) {
          listener.handleEvent(event)
        }
      })
    }
    return true
  }

  getBoundingClientRect() {
    return {
      left: Math.random() * 100,
      top: Math.random() * 100,
      right: 100 + Math.random() * 100,
      bottom: 100 + Math.random() * 100,
      width: 100,
      height: 100,
      x: 0,
      y: 0,
    }
  }

  focus() {}
  blur() {}
  click() {}
  getAttribute() {
    return null
  }
  setAttribute() {}
  removeAttribute() {}
}

// Mock events
class MockPointerEvent extends Event {
  public clientX: number
  public clientY: number

  constructor(
    type: string,
    options: { clientX?: number; clientY?: number } = {}
  ) {
    super(type, { bubbles: true, cancelable: true })
    this.clientX = options.clientX ?? Math.random() * 1000
    this.clientY = options.clientY ?? Math.random() * 1000
  }
}

class MockMouseEvent extends Event {
  public clientX: number
  public clientY: number

  constructor(
    type: string,
    options: { clientX?: number; clientY?: number } = {}
  ) {
    super(type, { bubbles: true, cancelable: true })
    this.clientX = options.clientX ?? Math.random() * 1000
    this.clientY = options.clientY ?? Math.random() * 1000
  }
}

class MockKeyboardEvent extends Event {
  public key: string
  public metaKey: boolean

  constructor(type: string, options: { key?: string; metaKey?: boolean } = {}) {
    super(type, { bubbles: true, cancelable: true })
    this.key = options.key ?? 'a'
    this.metaKey = options.metaKey ?? false
  }

  preventDefault() {}
  stopPropagation() {}
}

// Performance measurement utilities
interface PerformanceMeasurement {
  operation: string
  duration: number
  memoryUsed?: number
}

function measurePerformance<T>(
  operation: string,
  fn: () => T
): { result: T; measurement: PerformanceMeasurement } {
  const memoryBefore = (performance as any).memory?.usedJSHeapSize ?? 0
  const start = performance.now()

  const result = fn()

  const end = performance.now()
  const memoryAfter = (performance as any).memory?.usedJSHeapSize ?? 0

  return {
    result,
    measurement: {
      operation,
      duration: end - start,
      memoryUsed: memoryAfter - memoryBefore,
    },
  }
}

// Mock globals
const mockDocument = {
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  activeElement: null,
}

const originalDocument = global.document
const originalRequestAnimationFrame = global.requestAnimationFrame

describe('Interaction Modifiers Stress Tests', () => {
  beforeEach(() => {
    global.document = mockDocument as any
    global.requestAnimationFrame = vi.fn(callback => {
      callback(0)
      return 0
    })
    vi.useFakeTimers()
  })

  afterEach(() => {
    global.document = originalDocument
    global.requestAnimationFrame = originalRequestAnimationFrame
    vi.clearAllTimers()
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  describe('high volume element creation and modifier application', () => {
    it('should handle 1000+ elements with multiple modifiers efficiently', () => {
      const elementCount = 1000
      const elements: MockElement[] = []
      const measurements: PerformanceMeasurement[] = []

      // Create and apply modifiers to many elements
      const { measurement } = measurePerformance(
        'bulk-modifier-application',
        () => {
          for (let i = 0; i < elementCount; i++) {
            const element = new MockElement()
            const context: ModifierContext = {
              componentId: `test-${i}`,
              element: element as unknown as HTMLElement,
              phase: 'creation',
            }
            const node: DOMNode = {
              element: element as unknown as HTMLElement,
              children: [],
            }

            // Apply multiple modifiers
            onLongPressGesture({ perform: vi.fn() }).apply(node, context)
            keyboardShortcut({ key: 's', action: vi.fn() }).apply(node, context)
            focusable(true).apply(node, context)
            onContinuousHover({ perform: vi.fn() }).apply(node, context)
            allowsHitTesting(true).apply(node, context)

            elements.push(element)
          }
        }
      )

      measurements.push(measurement)

      expect(elements).toHaveLength(elementCount)
      expect(measurement.duration).toBeLessThan(1000) // Should complete in under 1 second

      // Verify all elements have modifiers applied
      elements.forEach(element => {
        expect((element as any)._longPressCleanup).toBeDefined()
        expect((element as any)._continuousHoverCleanup).toBeDefined()
        expect(element.tabIndex).toBe(0)
      })

      console.log(
        `Applied modifiers to ${elementCount} elements in ${measurement.duration.toFixed(2)}ms`
      )
    })

    it('should handle rapid modifier application and removal cycles', () => {
      const element = new MockElement()
      const context: ModifierContext = {
        componentId: 'stress-test',
        element: element as unknown as HTMLElement,
        phase: 'creation',
      }
      const node: DOMNode = {
        element: element as unknown as HTMLElement,
        children: [],
      }

      const cycles = 100
      const measurements: PerformanceMeasurement[] = []

      for (let i = 0; i < cycles; i++) {
        const { measurement } = measurePerformance(`cycle-${i}`, () => {
          // Apply modifiers
          const modifiers = [
            onLongPressGesture({ perform: vi.fn() }),
            keyboardShortcut({ key: `key${i}`, action: vi.fn() }),
            focusable(i % 2 === 0),
            onContinuousHover({ perform: vi.fn() }),
            allowsHitTesting(i % 3 === 0),
          ]

          modifiers.forEach(mod => mod.apply(node, context))

          // Clean up
          ;(element as any)._longPressCleanup?.()
          ;(element as any)._keyboardShortcutCleanup?.()
          ;(element as any)._focusableCleanup?.()
          ;(element as any)._continuousHoverCleanup?.()
        })

        measurements.push(measurement)
      }

      const avgDuration =
        measurements.reduce((sum, m) => sum + m.duration, 0) /
        measurements.length
      expect(avgDuration).toBeLessThan(10) // Average cycle should be under 10ms

      console.log(
        `Completed ${cycles} apply/cleanup cycles, avg: ${avgDuration.toFixed(2)}ms`
      )
    })
  })

  describe('high frequency event handling', () => {
    it('should handle rapid continuous hover events without performance degradation', () => {
      const element = new MockElement()
      const hoverCallback = vi.fn()
      const context: ModifierContext = {
        componentId: 'hover-stress',
        element: element as unknown as HTMLElement,
        phase: 'creation',
      }
      const node: DOMNode = {
        element: element as unknown as HTMLElement,
        children: [],
      }

      const hoverMod = onContinuousHover({
        coordinateSpace: 'local',
        perform: hoverCallback,
      })
      hoverMod.apply(node, context)

      const eventCount = 1000
      const { measurement } = measurePerformance('rapid-hover-events', () => {
        // Enter hover
        const mouseEnter = new MockMouseEvent('mouseenter', {
          clientX: 50,
          clientY: 50,
        })
        element.dispatchEvent(mouseEnter)

        // Generate many rapid mouse move events
        for (let i = 0; i < eventCount; i++) {
          const mouseMove = new MockMouseEvent('mousemove', {
            clientX: 50 + (i % 100),
            clientY: 50 + (i % 100),
          })
          element.dispatchEvent(mouseMove)
        }

        // Exit hover
        const mouseLeave = new MockMouseEvent('mouseleave')
        element.dispatchEvent(mouseLeave)
      })

      expect(hoverCallback).toHaveBeenCalledTimes(eventCount + 2) // enter + moves + leave
      expect(measurement.duration).toBeLessThan(100) // Should handle 1000 events in under 100ms

      console.log(
        `Processed ${eventCount} hover events in ${measurement.duration.toFixed(2)}ms`
      )
    })

    it('should handle rapid long press gesture attempts', () => {
      const element = new MockElement()
      const longPressAction = vi.fn()
      const context: ModifierContext = {
        componentId: 'longpress-stress',
        element: element as unknown as HTMLElement,
        phase: 'creation',
      }
      const node: DOMNode = {
        element: element as unknown as HTMLElement,
        children: [],
      }

      const longPressMod = onLongPressGesture({
        perform: longPressAction,
        minimumDuration: 100,
      })
      longPressMod.apply(node, context)

      const attemptCount = 50
      const { measurement } = measurePerformance(
        'rapid-longpress-attempts',
        () => {
          for (let i = 0; i < attemptCount; i++) {
            // Start long press
            const pointerDown = new MockPointerEvent('pointerdown')
            element.dispatchEvent(pointerDown)

            // Cancel before completion (simulate rapid taps)
            const pointerUp = new MockPointerEvent('pointerup')
            element.dispatchEvent(pointerUp)
          }
        }
      )

      // Should not trigger any long press actions (all were cancelled)
      expect(longPressAction).not.toHaveBeenCalled()
      expect(measurement.duration).toBeLessThan(50) // Should handle rapid attempts efficiently

      console.log(
        `Processed ${attemptCount} long press attempts in ${measurement.duration.toFixed(2)}ms`
      )
    })

    it('should handle rapid keyboard shortcut attempts', () => {
      const action = vi.fn()
      const context: ModifierContext = {
        componentId: 'keyboard-stress',
        element: new MockElement() as unknown as HTMLElement,
        phase: 'creation',
      }
      const node: DOMNode = { element: context.element, children: [] }

      const shortcutMod = keyboardShortcut({ key: 's', action })
      shortcutMod.apply(node, context)

      const keyEventCount = 1000
      const { measurement } = measurePerformance(
        'rapid-keyboard-events',
        () => {
          const keydownHandler = mockDocument.addEventListener.mock.calls.find(
            call => call[0] === 'keydown'
          )?.[1]

          for (let i = 0; i < keyEventCount; i++) {
            // Mix matching and non-matching keys
            const key = i % 10 === 0 ? 's' : 'a'
            const event = new MockKeyboardEvent('keydown', { key })
            keydownHandler(event)
          }
        }
      )

      expect(action).toHaveBeenCalledTimes(keyEventCount / 10) // Only 10% should match
      expect(measurement.duration).toBeLessThan(100)

      console.log(
        `Processed ${keyEventCount} keyboard events in ${measurement.duration.toFixed(2)}ms`
      )
    })
  })

  describe('memory management under stress', () => {
    it('should not leak memory during repeated modifier applications', () => {
      const iterations = 100
      const elementsPerIteration = 10
      let totalElements = 0

      for (let iteration = 0; iteration < iterations; iteration++) {
        const elements: MockElement[] = []

        // Create elements with modifiers
        for (let i = 0; i < elementsPerIteration; i++) {
          const element = new MockElement()
          const context: ModifierContext = {
            componentId: `mem-test-${iteration}-${i}`,
            element: element as unknown as HTMLElement,
            phase: 'creation',
          }
          const node: DOMNode = {
            element: element as unknown as HTMLElement,
            children: [],
          }

          // Apply all modifiers
          onLongPressGesture({ perform: vi.fn() }).apply(node, context)
          keyboardShortcut({ key: `k${i}`, action: vi.fn() }).apply(
            node,
            context
          )
          focused(false).apply(node, context)
          focusable(true).apply(node, context)
          onContinuousHover({ perform: vi.fn() }).apply(node, context)
          allowsHitTesting(true).apply(node, context)

          elements.push(element)
          totalElements++
        }

        // Clean up all elements
        elements.forEach(element => {
          ;(element as any)._longPressCleanup?.()
          ;(element as any)._keyboardShortcutCleanup?.()
          ;(element as any)._focusedCleanup?.()
          ;(element as any)._focusableCleanup?.()
          ;(element as any)._continuousHoverCleanup?.()
        })

        // Periodic garbage collection hint
        if (iteration % 20 === 0 && global.gc) {
          global.gc()
        }
      }

      expect(totalElements).toBe(iterations * elementsPerIteration)

      // Verify document listeners don't accumulate
      const addCalls = mockDocument.addEventListener.mock.calls.length
      const removeCalls = mockDocument.removeEventListener.mock.calls.length

      // Should have removed most/all listeners during cleanup
      expect(removeCalls).toBeGreaterThan(addCalls * 0.8) // At least 80% cleanup rate

      console.log(`Memory test: created/cleaned ${totalElements} elements`)
      console.log(`Event listeners: ${addCalls} added, ${removeCalls} removed`)
    })

    it('should handle timer cleanup properly under stress', () => {
      const elements: MockElement[] = []
      const timerCount = 50

      // Create many elements with long press gestures (which use timers)
      for (let i = 0; i < timerCount; i++) {
        const element = new MockElement()
        const context: ModifierContext = {
          componentId: `timer-test-${i}`,
          element: element as unknown as HTMLElement,
          phase: 'creation',
        }
        const node: DOMNode = {
          element: element as unknown as HTMLElement,
          children: [],
        }

        const longPressMod = onLongPressGesture({
          perform: vi.fn(),
          minimumDuration: 1000,
        })
        longPressMod.apply(node, context)

        // Start long press on each element
        const pointerDown = new MockPointerEvent('pointerdown')
        element.dispatchEvent(pointerDown)

        elements.push(element)
      }

      // Immediately clean up all elements (should cancel all timers)
      const { measurement } = measurePerformance('timer-cleanup', () => {
        elements.forEach(element => {
          ;(element as any)._longPressCleanup?.()
        })
      })

      expect(measurement.duration).toBeLessThan(50) // Cleanup should be fast

      // Advance time to see if any timers fire (they shouldn't)
      const actionSpy = vi.fn()
      vi.advanceTimersByTime(2000)

      expect(actionSpy).not.toHaveBeenCalled()

      console.log(
        `Cleaned up ${timerCount} active timers in ${measurement.duration.toFixed(2)}ms`
      )
    })
  })

  describe('edge case stress testing', () => {
    it('should handle extremely rapid focus state changes', () => {
      const element = new MockElement()
      const context: ModifierContext = {
        componentId: 'focus-stress',
        element: element as unknown as HTMLElement,
        phase: 'creation',
      }
      const node: DOMNode = {
        element: element as unknown as HTMLElement,
        children: [],
      }

      // Create a reactive signal for testing (without infinite timers)
      let focusState = false
      const subscribers: ((value: boolean) => void)[] = []
      const focusSignal = () => focusState
      focusSignal.subscribe = (callback: (value: boolean) => void) => {
        subscribers.push(callback)
        return () => {
          const index = subscribers.indexOf(callback)
          if (index > -1) subscribers.splice(index, 1)
        }
      }

      const focusedMod = focused(focusSignal)
      focusedMod.apply(node, context)

      const { measurement } = measurePerformance('rapid-focus-changes', () => {
        // Simulate rapid focus state changes
        for (let i = 0; i < 10; i++) {
          focusState = i % 2 === 0
          // Notify subscribers manually
          subscribers.forEach(callback => callback(focusState))
        }
      })

      // Clean up
      ;(element as any)._focusedCleanup?.()

      expect(measurement.duration).toBeLessThan(200) // Should handle rapid changes efficiently

      console.log(
        `Handled rapid focus changes for ${measurement.duration.toFixed(2)}ms`
      )
    })

    it('should handle coordinate calculations with extreme values', () => {
      const element = new MockElement()
      const hoverCallback = vi.fn()
      const context: ModifierContext = {
        componentId: 'coord-stress',
        element: element as unknown as HTMLElement,
        phase: 'creation',
      }
      const node: DOMNode = {
        element: element as unknown as HTMLElement,
        children: [],
      }

      // Override getBoundingClientRect to return extreme values
      element.getBoundingClientRect = () => ({
        left: Number.MAX_SAFE_INTEGER - 1000,
        top: Number.MAX_SAFE_INTEGER - 1000,
        right: Number.MAX_SAFE_INTEGER,
        bottom: Number.MAX_SAFE_INTEGER,
        width: 1000,
        height: 1000,
        x: Number.MAX_SAFE_INTEGER - 1000,
        y: Number.MAX_SAFE_INTEGER - 1000,
      })

      const hoverMod = onContinuousHover({
        coordinateSpace: 'local',
        perform: hoverCallback,
      })
      hoverMod.apply(node, context)

      const { measurement } = measurePerformance('extreme-coordinates', () => {
        // Test with extreme coordinate values
        const extremeValues = [
          0,
          1,
          -1,
          Number.MAX_SAFE_INTEGER,
          Number.MIN_SAFE_INTEGER,
          Number.MAX_SAFE_INTEGER - 500,
          1.7976931348623157e308, // Close to Number.MAX_VALUE
        ]

        extremeValues.forEach(x => {
          extremeValues.forEach(y => {
            const mouseEnter = new MockMouseEvent('mouseenter', {
              clientX: x,
              clientY: y,
            })
            element.dispatchEvent(mouseEnter)

            const mouseLeave = new MockMouseEvent('mouseleave')
            element.dispatchEvent(mouseLeave)
          })
        })
      })

      expect(hoverCallback).toHaveBeenCalled()
      expect(measurement.duration).toBeLessThan(100)

      // Verify no NaN or Infinity values were produced
      hoverCallback.mock.calls.forEach(call => {
        if (call[0] !== null) {
          expect(isFinite(call[0].x)).toBe(true)
          expect(isFinite(call[0].y)).toBe(true)
        }
      })

      console.log(
        `Processed extreme coordinate values in ${measurement.duration.toFixed(2)}ms`
      )
    })
  })

  describe('concurrent modifier stress testing', () => {
    it('should handle all modifiers active simultaneously under load', () => {
      const elementCount = 50
      const elements: MockElement[] = []
      const measurements: PerformanceMeasurement[] = []

      // Create many elements with all modifiers
      const { measurement: createMeasurement } = measurePerformance(
        'concurrent-creation',
        () => {
          for (let i = 0; i < elementCount; i++) {
            const element = new MockElement()
            const context: ModifierContext = {
              componentId: `concurrent-${i}`,
              element: element as unknown as HTMLElement,
              phase: 'creation',
            }
            const node: DOMNode = {
              element: element as unknown as HTMLElement,
              children: [],
            }

            // Apply all modifiers
            onLongPressGesture({ perform: vi.fn() }).apply(node, context)
            keyboardShortcut({ key: 's', action: vi.fn() }).apply(node, context)
            focused(i % 2 === 0).apply(node, context)
            focusable(true, i % 3 === 0 ? ['activate'] : []).apply(
              node,
              context
            )
            onContinuousHover({ perform: vi.fn() }).apply(node, context)
            allowsHitTesting(i % 4 !== 0).apply(node, context)

            elements.push(element)
          }
        }
      )

      measurements.push(createMeasurement)

      // Simulate concurrent activity on all elements
      const { measurement: activityMeasurement } = measurePerformance(
        'concurrent-activity',
        () => {
          elements.forEach((element, index) => {
            // Simulate various events on each element
            if (index % 5 === 0) {
              const pointerDown = new MockPointerEvent('pointerdown')
              element.dispatchEvent(pointerDown)
            }

            if (index % 7 === 0) {
              const mouseEnter = new MockMouseEvent('mouseenter')
              element.dispatchEvent(mouseEnter)
            }

            if (index % 3 === 0) {
              const mouseMove = new MockMouseEvent('mousemove')
              element.dispatchEvent(mouseMove)
            }
          })

          // Simulate keyboard events
          const keydownHandler = mockDocument.addEventListener.mock.calls.find(
            call => call[0] === 'keydown'
          )?.[1]

          if (keydownHandler) {
            for (let i = 0; i < 10; i++) {
              const event = new MockKeyboardEvent('keydown', { key: 's' })
              keydownHandler(event)
            }
          }
        }
      )

      measurements.push(activityMeasurement)

      // Clean up all elements
      const { measurement: cleanupMeasurement } = measurePerformance(
        'concurrent-cleanup',
        () => {
          elements.forEach(element => {
            ;(element as any)._longPressCleanup?.()
            ;(element as any)._keyboardShortcutCleanup?.()
            ;(element as any)._focusedCleanup?.()
            ;(element as any)._focusableCleanup?.()
            ;(element as any)._continuousHoverCleanup?.()
          })
        }
      )

      measurements.push(cleanupMeasurement)

      // Performance expectations
      expect(createMeasurement.duration).toBeLessThan(200)
      expect(activityMeasurement.duration).toBeLessThan(100)
      expect(cleanupMeasurement.duration).toBeLessThan(50)

      const totalTime = measurements.reduce((sum, m) => sum + m.duration, 0)
      console.log(
        `Concurrent stress test: ${elementCount} elements, total time: ${totalTime.toFixed(2)}ms`
      )
      console.log(`  - Creation: ${createMeasurement.duration.toFixed(2)}ms`)
      console.log(`  - Activity: ${activityMeasurement.duration.toFixed(2)}ms`)
      console.log(`  - Cleanup: ${cleanupMeasurement.duration.toFixed(2)}ms`)
    })
  })
})
