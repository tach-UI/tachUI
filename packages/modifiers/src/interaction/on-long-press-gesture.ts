/**
 * OnLongPressGesture Modifier
 *
 * Implements long press gesture detection with customizable timing and distance constraints.
 * Supports both pointer and touch events for cross-platform compatibility.
 */

import { BaseModifier } from '../base'
import type { DOMNode } from '@tachui/types/runtime'
import type { ModifierContext } from '../types'

export interface OnLongPressGestureOptions {
  minimumDuration?: number // ms, default 500
  maximumDistance?: number // px, default 10
  perform: () => void
  onPressingChanged?: (isPressing: boolean) => void
}

export class OnLongPressGestureModifier extends BaseModifier<OnLongPressGestureOptions> {
  readonly type = 'onLongPressGesture'
  readonly priority = 85

  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined {
    if (!context.element) return

    this.setupLongPressGesture(context.element, this.properties)
    return undefined
  }

  private setupLongPressGesture(
    element: Element,
    options: OnLongPressGestureOptions
  ): void {
    const minimumDuration = options.minimumDuration ?? 500 // ms
    const maximumDistance = options.maximumDistance ?? 10 // px

    let startPosition: { x: number; y: number } | null = null
    let pressTimer: number | null = null
    let isPressed = false
    let longPressTriggered = false

    const startLongPress = (x: number, y: number) => {
      if (isPressed) return // Prevent duplicate starts

      startPosition = { x, y }
      isPressed = true
      longPressTriggered = false

      options.onPressingChanged?.(true)

      pressTimer = window.setTimeout(() => {
        if (isPressed && !longPressTriggered) {
          longPressTriggered = true
          options.perform()
        }
      }, minimumDuration)
    }

    const checkDistance = (x: number, y: number): boolean => {
      if (!startPosition) return false
      const distance = Math.sqrt(
        Math.pow(x - startPosition.x, 2) + Math.pow(y - startPosition.y, 2)
      )
      return distance <= maximumDistance
    }

    const endLongPress = () => {
      if (pressTimer) {
        clearTimeout(pressTimer)
        pressTimer = null
      }

      if (isPressed) {
        isPressed = false
        options.onPressingChanged?.(false)
      }

      startPosition = null
      longPressTriggered = false
    }

    // Pointer Events (preferred for modern browsers)
    const handlePointerDown = (event: Event) => {
      const pointerEvent = event as PointerEvent
      event.preventDefault()
      startLongPress(pointerEvent.clientX, pointerEvent.clientY)
    }

    const handlePointerMove = (event: Event) => {
      if (!isPressed) return

      const pointerEvent = event as PointerEvent
      if (!checkDistance(pointerEvent.clientX, pointerEvent.clientY)) {
        endLongPress()
      }
    }

    const handlePointerUp = () => {
      endLongPress()
    }

    const handlePointerCancel = () => {
      endLongPress()
    }

    // Touch Events (fallback for devices without pointer events)
    const handleTouchStart = (event: Event) => {
      const touchEvent = event as TouchEvent
      if (touchEvent.touches.length === 1) {
        const touch = touchEvent.touches[0]
        event.preventDefault()
        startLongPress(touch.clientX, touch.clientY)
      }
    }

    const handleTouchMove = (event: Event) => {
      if (!isPressed) return

      const touchEvent = event as TouchEvent
      if (touchEvent.touches.length === 1) {
        const touch = touchEvent.touches[0]
        if (!checkDistance(touch.clientX, touch.clientY)) {
          endLongPress()
        }
      } else {
        endLongPress()
      }
    }

    const handleTouchEnd = () => {
      endLongPress()
    }

    const handleTouchCancel = () => {
      endLongPress()
    }

    // Mouse Events (additional fallback)
    const handleMouseDown = (event: Event) => {
      const mouseEvent = event as MouseEvent
      // Only handle primary button
      if (mouseEvent.button === 0) {
        event.preventDefault()
        startLongPress(mouseEvent.clientX, mouseEvent.clientY)
      }
    }

    const handleMouseMove = (event: Event) => {
      if (!isPressed) return

      const mouseEvent = event as MouseEvent
      if (!checkDistance(mouseEvent.clientX, mouseEvent.clientY)) {
        endLongPress()
      }
    }

    const handleMouseUp = () => {
      endLongPress()
    }

    const handleMouseLeave = () => {
      endLongPress()
    }

    // Add event listeners with appropriate fallbacks
    if ('onpointerdown' in element) {
      // Use Pointer Events if supported
      element.addEventListener(
        'pointerdown',
        handlePointerDown as EventListener
      )
      element.addEventListener(
        'pointermove',
        handlePointerMove as EventListener
      )
      element.addEventListener('pointerup', handlePointerUp as EventListener)
      element.addEventListener(
        'pointercancel',
        handlePointerCancel as EventListener
      )
    } else if ('ontouchstart' in element) {
      // Fall back to Touch Events
      element.addEventListener(
        'touchstart',
        handleTouchStart as EventListener,
        { passive: false }
      )
      element.addEventListener('touchmove', handleTouchMove as EventListener)
      element.addEventListener('touchend', handleTouchEnd as EventListener)
      element.addEventListener(
        'touchcancel',
        handleTouchCancel as EventListener
      )
    } else {
      // Fall back to Mouse Events
      element.addEventListener('mousedown', handleMouseDown as EventListener)
      element.addEventListener('mousemove', handleMouseMove as EventListener)
      element.addEventListener('mouseup', handleMouseUp as EventListener)
      element.addEventListener('mouseleave', handleMouseLeave as EventListener)
    }

    // Store cleanup function for potential later removal
    const cleanup = () => {
      endLongPress()

      if ('onpointerdown' in element) {
        element.removeEventListener(
          'pointerdown',
          handlePointerDown as EventListener
        )
        element.removeEventListener(
          'pointermove',
          handlePointerMove as EventListener
        )
        element.removeEventListener(
          'pointerup',
          handlePointerUp as EventListener
        )
        element.removeEventListener(
          'pointercancel',
          handlePointerCancel as EventListener
        )
      } else if ('ontouchstart' in element) {
        element.removeEventListener(
          'touchstart',
          handleTouchStart as EventListener
        )
        element.removeEventListener(
          'touchmove',
          handleTouchMove as EventListener
        )
        element.removeEventListener('touchend', handleTouchEnd as EventListener)
        element.removeEventListener(
          'touchcancel',
          handleTouchCancel as EventListener
        )
      } else {
        element.removeEventListener(
          'mousedown',
          handleMouseDown as EventListener
        )
        element.removeEventListener(
          'mousemove',
          handleMouseMove as EventListener
        )
        element.removeEventListener('mouseup', handleMouseUp as EventListener)
        element.removeEventListener(
          'mouseleave',
          handleMouseLeave as EventListener
        )
      }
    }

    // Store cleanup function for later removal
    ;(element as any)._longPressCleanup = cleanup
  }
}

/**
 * Factory function for onLongPressGesture modifier
 */
export function onLongPressGesture(
  options: OnLongPressGestureOptions
): OnLongPressGestureModifier {
  return new OnLongPressGestureModifier(options)
}
