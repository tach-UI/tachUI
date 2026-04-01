/**
 * Swipe-Back Gesture Tests
 *
 * Tests for interactive gesture-driven back navigation on NavigationStack
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createSignal } from '@tachui/core'
import { HTML } from '@tachui/primitives'
import { NavigationStack } from '../src/navigation-stack'
import { createSwipeBackGesture } from '../src/swipe-back-gesture'

describe('Swipe-Back Gesture', () => {
  let container: HTMLDivElement

  beforeEach(() => {
    container = document.createElement('div')
    container.style.width = '400px'
    container.style.height = '800px'
    document.body.appendChild(container)
  })

  afterEach(() => {
    container.remove()
  })

  describe('Gesture Detection', () => {
    it('detects swipe starting from left edge', () => {
      const gestureStart = vi.fn()
      const { gestureState, attachToElement, destroy } = createSwipeBackGesture(
        { edgeWidth: 20 },
        { onGestureStart: gestureStart }
      )

      attachToElement(container)

      // Simulate pointer down at left edge (x=10, within 20px edge width)
      container.dispatchEvent(
        new PointerEvent('pointerdown', {
          clientX: 10,
          clientY: 400,
          isPrimary: true,
        })
      )

      expect(gestureStart).toHaveBeenCalled()
      expect(gestureState().isActive).toBe(true)

      destroy()
    })

    it('ignores swipe starting outside left edge', () => {
      const gestureStart = vi.fn()
      const { gestureState, attachToElement, destroy } = createSwipeBackGesture(
        { edgeWidth: 20 },
        { onGestureStart: gestureStart }
      )

      attachToElement(container)

      // Simulate pointer down outside edge (x=50, outside 20px edge width)
      container.dispatchEvent(
        new PointerEvent('pointerdown', {
          clientX: 50,
          clientY: 400,
          isPrimary: true,
        })
      )

      expect(gestureStart).not.toHaveBeenCalled()
      expect(gestureState().isActive).toBe(false)

      destroy()
    })
  })

  describe('Progress Tracking', () => {
    it('tracks gesture progress during drag', () => {
      const progressCallback = vi.fn()
      const { gestureState, attachToElement, destroy } = createSwipeBackGesture(
        {},
        { onGestureProgress: progressCallback }
      )

      attachToElement(container)

      // Start gesture at left edge
      container.dispatchEvent(
        new PointerEvent('pointerdown', {
          clientX: 10,
          clientY: 400,
          isPrimary: true,
        })
      )

      // Move horizontally past horizontal threshold
      container.dispatchEvent(
        new PointerEvent('pointermove', {
          clientX: 110,
          clientY: 400,
          isPrimary: true,
        })
      )

      // Progress should be around 0.25 (100px / 400px container width)
      expect(progressCallback).toHaveBeenCalled()
      const lastProgress = progressCallback.mock.calls[progressCallback.mock.calls.length - 1][0]
      expect(lastProgress).toBeGreaterThan(0.2)
      expect(lastProgress).toBeLessThan(0.3)

      destroy()
    })

    it('clamps progress between 0 and 1', () => {
      const progressCallback = vi.fn()
      const { gestureState, attachToElement, destroy } = createSwipeBackGesture(
        {},
        { onGestureProgress: progressCallback }
      )

      attachToElement(container)

      // Start gesture at left edge
      container.dispatchEvent(
        new PointerEvent('pointerdown', {
          clientX: 10,
          clientY: 400,
          isPrimary: true,
        })
      )

      // Move way past container width
      container.dispatchEvent(
        new PointerEvent('pointermove', {
          clientX: 600,
          clientY: 400,
          isPrimary: true,
        })
      )

      expect(progressCallback).toHaveBeenCalled()
      const lastProgress = progressCallback.mock.calls[progressCallback.mock.calls.length - 1][0]
      expect(lastProgress).toBeLessThanOrEqual(1)

      destroy()
    })
  })

  describe('Gesture Completion', () => {
    it('completes gesture when drag exceeds threshold (>40%)', () => {
      const completeCallback = vi.fn()
      const cancelCallback = vi.fn()
      const { attachToElement, destroy } = createSwipeBackGesture(
        { threshold: 0.4 },
        {
          onGestureComplete: completeCallback,
          onGestureCancel: cancelCallback,
        }
      )

      attachToElement(container)

      // Start gesture at left edge
      container.dispatchEvent(
        new PointerEvent('pointerdown', {
          clientX: 10,
          clientY: 400,
          isPrimary: true,
        })
      )

      // Move 50% of container width (exceeds 40% threshold)
      container.dispatchEvent(
        new PointerEvent('pointermove', {
          clientX: 210, // (210 - 10) / 400 = 50%
          clientY: 400,
          isPrimary: true,
        })
      )

      // Release
      container.dispatchEvent(
        new PointerEvent('pointerup', {
          clientX: 210,
          clientY: 400,
          isPrimary: true,
        })
      )

      expect(completeCallback).toHaveBeenCalled()
      expect(cancelCallback).not.toHaveBeenCalled()

      destroy()
    })

    it('cancels gesture when drag is below threshold (<40%)', () => {
      const completeCallback = vi.fn()
      const cancelCallback = vi.fn()
      const { attachToElement, destroy } = createSwipeBackGesture(
        { threshold: 0.4 },
        {
          onGestureComplete: completeCallback,
          onGestureCancel: cancelCallback,
        }
      )

      attachToElement(container)

      // Start gesture at left edge
      container.dispatchEvent(
        new PointerEvent('pointerdown', {
          clientX: 10,
          clientY: 400,
          isPrimary: true,
        })
      )

      // Move only 20% of container width (below 40% threshold)
      container.dispatchEvent(
        new PointerEvent('pointermove', {
          clientX: 90, // (90 - 10) / 400 = 20%
          clientY: 400,
          isPrimary: true,
        })
      )

      // Release
      container.dispatchEvent(
        new PointerEvent('pointerup', {
          clientX: 90,
          clientY: 400,
          isPrimary: true,
        })
      )

      expect(completeCallback).not.toHaveBeenCalled()
      expect(cancelCallback).toHaveBeenCalled()

      destroy()
    })
  })

  describe('Vertical Drag Cancellation', () => {
    it('cancels gesture on vertical drag', () => {
      const cancelCallback = vi.fn()
      const progressCallback = vi.fn()
      const { gestureState, attachToElement, destroy } = createSwipeBackGesture(
        {},
        {
          onGestureCancel: cancelCallback,
          onGestureProgress: progressCallback,
        }
      )

      attachToElement(container)

      // Start gesture at left edge
      container.dispatchEvent(
        new PointerEvent('pointerdown', {
          clientX: 10,
          clientY: 400,
          isPrimary: true,
        })
      )

      // Move vertically (more Y than X)
      container.dispatchEvent(
        new PointerEvent('pointermove', {
          clientX: 15, // Only 5px horizontal
          clientY: 500, // 100px vertical
          isPrimary: true,
        })
      )

      expect(cancelCallback).toHaveBeenCalled()
      expect(gestureState().isActive).toBe(false)
      // Progress should not have been called for vertical movement
      expect(progressCallback).not.toHaveBeenCalled()

      destroy()
    })
  })

  describe('NavigationStack Integration', () => {
    it('NavigationStack includes swipe-back gesture support', () => {
      const rootView = HTML.div({ children: 'Root View' }).build()
      const navStack = NavigationStack(rootView)

      // Check that gesture is attached to the component
      expect((navStack as any)._swipeBackGesture).toBeDefined()
    })

    it('NavigationStack can disable swipe-back gesture', () => {
      const rootView = HTML.div({ children: 'Root View' }).build()
      const navStack = NavigationStack(rootView, {
        swipeBackEnabled: false,
      })

      const gesture = (navStack as any)._swipeBackGesture
      expect(gesture).toBeDefined()

      // The gesture should be disabled
      const { gestureState, attachToElement, destroy } = gesture

      attachToElement(container)

      // Try to start gesture - should be disabled
      container.dispatchEvent(
        new PointerEvent('pointerdown', {
          clientX: 10,
          clientY: 400,
          isPrimary: true,
        })
      )

      expect(gestureState().isActive).toBe(false)

      destroy()
    })
  })
})
