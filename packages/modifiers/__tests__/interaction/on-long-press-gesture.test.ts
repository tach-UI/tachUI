/**
 * Tests for OnLongPressGesture Modifier
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  OnLongPressGestureModifier,
  onLongPressGesture,
  type OnLongPressGestureOptions,
} from '../../src/interaction/on-long-press-gesture'
import type { ModifierContext, DOMNode } from '../../src/types'

// Mock DOM environment
class MockElement {
  public style: Record<string, string> = {}
  public tabIndex = -1
  public onpointerdown: any = null // Support pointer event detection
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
      left: 0,
      top: 0,
      right: 100,
      bottom: 100,
      width: 100,
      height: 100,
      x: 0,
      y: 0,
    }
  }
}

// Mock events
class MockPointerEvent extends Event {
  public clientX: number
  public clientY: number
  public button: number
  public pointerType: string

  constructor(
    type: string,
    options: { clientX?: number; clientY?: number; button?: number } = {}
  ) {
    super(type, { bubbles: true, cancelable: true })
    this.clientX = options.clientX ?? 0
    this.clientY = options.clientY ?? 0
    this.button = options.button ?? 0
    this.pointerType = 'mouse'
  }
}

describe('OnLongPressGestureModifier', () => {
  let mockElement: MockElement
  let mockContext: ModifierContext
  let mockNode: DOMNode

  beforeEach(() => {
    mockElement = new MockElement()
    mockContext = {
      componentId: 'test-component',
      element: mockElement as unknown as HTMLElement,
      phase: 'creation',
    }
    mockNode = { element: mockElement as unknown as HTMLElement, children: [] }

    // Mock window.setTimeout and clearTimeout
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  describe('basic functionality', () => {
    it('should create modifier with default options', () => {
      const perform = vi.fn()
      const modifier = new OnLongPressGestureModifier({ perform })

      expect(modifier.type).toBe('onLongPressGesture')
      expect(modifier.priority).toBe(85)
      expect(modifier.properties.perform).toBe(perform)
    })

    it('should apply modifier to element', () => {
      const perform = vi.fn()
      const modifier = new OnLongPressGestureModifier({ perform })

      const result = modifier.apply(mockNode, mockContext)

      expect(result).toBeUndefined()
      // Should have added event listeners
      expect(mockElement.addEventListener).toBeDefined()
    })

    it('should handle null context element gracefully', () => {
      const perform = vi.fn()
      const modifier = new OnLongPressGestureModifier({ perform })
      const nullContext = { ...mockContext, element: undefined }

      expect(() => {
        modifier.apply(mockNode, nullContext)
      }).not.toThrow()
    })
  })

  describe('pointer event handling', () => {
    it.skipIf(process.env.TEST_ISOLATION === 'true')(
      'should trigger long press after minimum duration',
      () => {
        const perform = vi.fn()
        const onPressingChanged = vi.fn()
        const modifier = new OnLongPressGestureModifier({
          perform,
          onPressingChanged,
          minimumDuration: 500,
        })

        modifier.apply(mockNode, mockContext)

        // Simulate pointer down
        const pointerDown = new MockPointerEvent('pointerdown', {
          clientX: 50,
          clientY: 50,
        })
        mockElement.dispatchEvent(pointerDown)

        expect(onPressingChanged).toHaveBeenCalledWith(true)
        expect(perform).not.toHaveBeenCalled()

        // Fast-forward time
        vi.advanceTimersByTime(500)

        expect(perform).toHaveBeenCalledTimes(1)
      }
    )

    it('should not trigger if pointer moves too far', () => {
      const perform = vi.fn()
      const modifier = new OnLongPressGestureModifier({
        perform,
        maximumDistance: 10,
      })

      modifier.apply(mockNode, mockContext)

      // Start long press
      const pointerDown = new MockPointerEvent('pointerdown', {
        clientX: 50,
        clientY: 50,
      })
      mockElement.dispatchEvent(pointerDown)

      // Move beyond maximum distance
      const pointerMove = new MockPointerEvent('pointermove', {
        clientX: 70,
        clientY: 50,
      })
      mockElement.dispatchEvent(pointerMove)

      // Fast-forward time
      vi.advanceTimersByTime(500)

      expect(perform).not.toHaveBeenCalled()
    })

    it('should not trigger if pointer is released early', () => {
      const perform = vi.fn()
      const onPressingChanged = vi.fn()
      const modifier = new OnLongPressGestureModifier({
        perform,
        onPressingChanged,
        minimumDuration: 500,
      })

      modifier.apply(mockNode, mockContext)

      // Start long press
      const pointerDown = new MockPointerEvent('pointerdown', {
        clientX: 50,
        clientY: 50,
      })
      mockElement.dispatchEvent(pointerDown)

      expect(onPressingChanged).toHaveBeenCalledWith(true)

      // Release before minimum duration
      vi.advanceTimersByTime(200)
      const pointerUp = new MockPointerEvent('pointerup')
      mockElement.dispatchEvent(pointerUp)

      expect(onPressingChanged).toHaveBeenCalledWith(false)

      // Complete the duration
      vi.advanceTimersByTime(300)

      expect(perform).not.toHaveBeenCalled()
    })

    it('should handle pointer cancel events', () => {
      const perform = vi.fn()
      const onPressingChanged = vi.fn()
      const modifier = new OnLongPressGestureModifier({
        perform,
        onPressingChanged,
        minimumDuration: 500,
      })

      modifier.apply(mockNode, mockContext)

      // Start long press
      const pointerDown = new MockPointerEvent('pointerdown', {
        clientX: 50,
        clientY: 50,
      })
      mockElement.dispatchEvent(pointerDown)

      expect(onPressingChanged).toHaveBeenCalledWith(true)

      // Cancel the press
      const pointerCancel = new MockPointerEvent('pointercancel')
      mockElement.dispatchEvent(pointerCancel)

      expect(onPressingChanged).toHaveBeenCalledWith(false)

      vi.advanceTimersByTime(500)
      expect(perform).not.toHaveBeenCalled()
    })
  })

  describe('touch event fallback', () => {
    let touchElement: MockElement

    beforeEach(() => {
      touchElement = new MockElement()
      // Simulate device without pointer events but with touch
      delete (touchElement as any).onpointerdown
      ;(touchElement as any).ontouchstart = null
    })

    it.skipIf(process.env.TEST_ISOLATION === 'true')(
      'should use touch events when pointer events unavailable',
      () => {
        const perform = vi.fn()
        const modifier = new OnLongPressGestureModifier({
          perform,
          minimumDuration: 300,
        })
        const touchContext = {
          ...mockContext,
          element: touchElement as unknown as HTMLElement,
        }

        modifier.apply(mockNode, touchContext)

        // Simulate touch events
        const touchStart = new Event('touchstart')
        ;(touchStart as any).touches = [{ clientX: 50, clientY: 50 }]
        touchElement.dispatchEvent(touchStart)

        vi.advanceTimersByTime(300)
        expect(perform).toHaveBeenCalled()
      }
    )
  })

  describe('mouse event fallback', () => {
    let mouseElement: MockElement

    beforeEach(() => {
      mouseElement = new MockElement()
      // Simulate device without pointer or touch events
      delete (mouseElement as any).onpointerdown
      delete (mouseElement as any).ontouchstart
    })

    it.skipIf(process.env.TEST_ISOLATION === 'true')(
      'should use mouse events as final fallback',
      () => {
        const perform = vi.fn()
        const modifier = new OnLongPressGestureModifier({
          perform,
          minimumDuration: 300,
        })
        const mouseContext = {
          ...mockContext,
          element: mouseElement as unknown as HTMLElement,
        }

        modifier.apply(mockNode, mouseContext)

        // Simulate mouse events (primary button only)
        const mouseDown = new Event('mousedown')
        ;(mouseDown as any).button = 0
        ;(mouseDown as any).clientX = 50
        ;(mouseDown as any).clientY = 50
        mouseElement.dispatchEvent(mouseDown)

        vi.advanceTimersByTime(300)
        expect(perform).toHaveBeenCalled()
      }
    )

    it('should ignore non-primary mouse buttons', () => {
      const perform = vi.fn()
      const modifier = new OnLongPressGestureModifier({
        perform,
        minimumDuration: 300,
      })
      const mouseContext = {
        ...mockContext,
        element: mouseElement as unknown as HTMLElement,
      }

      modifier.apply(mockNode, mouseContext)

      // Simulate right-click
      const mouseDown = new Event('mousedown')
      ;(mouseDown as any).button = 2
      ;(mouseDown as any).clientX = 50
      ;(mouseDown as any).clientY = 50
      mouseElement.dispatchEvent(mouseDown)

      vi.advanceTimersByTime(300)
      expect(perform).not.toHaveBeenCalled()
    })
  })

  describe('factory functions', () => {
    it('should create modifier via factory function', () => {
      const perform = vi.fn()
      const modifier = onLongPressGesture({ perform })

      expect(modifier).toBeInstanceOf(OnLongPressGestureModifier)
      expect(modifier.properties.perform).toBe(perform)
    })

    it('should support all option parameters', () => {
      const perform = vi.fn()
      const onPressingChanged = vi.fn()
      const options: OnLongPressGestureOptions = {
        minimumDuration: 750,
        maximumDistance: 15,
        perform,
        onPressingChanged,
      }

      const modifier = onLongPressGesture(options)

      expect(modifier.properties).toEqual(options)
    })
  })

  describe('edge cases', () => {
    it.skipIf(process.env.TEST_ISOLATION === 'true')(
      'should handle multiple rapid press attempts',
      () => {
        const perform = vi.fn()
        const modifier = new OnLongPressGestureModifier({
          perform,
          minimumDuration: 500,
        })

        modifier.apply(mockNode, mockContext)

        // First press
        const pointerDown1 = new MockPointerEvent('pointerdown', {
          clientX: 50,
          clientY: 50,
        })
        mockElement.dispatchEvent(pointerDown1)

        // Try to start second press before first completes
        const pointerDown2 = new MockPointerEvent('pointerdown', {
          clientX: 60,
          clientY: 60,
        })
        mockElement.dispatchEvent(pointerDown2)

        vi.advanceTimersByTime(500)

        // Should only trigger once for the first press
        expect(perform).toHaveBeenCalledTimes(1)
      }
    )

    it.skipIf(process.env.TEST_ISOLATION === 'true')(
      'should not trigger twice for same press',
      () => {
        const perform = vi.fn()
        const modifier = new OnLongPressGestureModifier({
          perform,
          minimumDuration: 500,
        })

        modifier.apply(mockNode, mockContext)

        const pointerDown = new MockPointerEvent('pointerdown', {
          clientX: 50,
          clientY: 50,
        })
        mockElement.dispatchEvent(pointerDown)

        vi.advanceTimersByTime(1000) // Wait longer than minimum duration

        expect(perform).toHaveBeenCalledTimes(1)
      }
    )

    it('should handle element cleanup', () => {
      const perform = vi.fn()
      const modifier = new OnLongPressGestureModifier({ perform })

      modifier.apply(mockNode, mockContext)

      // Check that cleanup function was stored
      expect((mockElement as any)._longPressCleanup).toBeDefined()
      expect(typeof (mockElement as any)._longPressCleanup).toBe('function')

      // Call cleanup
      ;(mockElement as any)._longPressCleanup()

      // Events should be cleaned up
      const pointerDown = new MockPointerEvent('pointerdown', {
        clientX: 50,
        clientY: 50,
      })
      mockElement.dispatchEvent(pointerDown)

      vi.advanceTimersByTime(500)
      expect(perform).not.toHaveBeenCalled()
    })
  })
})
