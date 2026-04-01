/**
 * Swipe-Back Gesture for NavigationStack
 *
 * Implements iOS-style interactive gesture-driven back navigation:
 * - Left-edge swipe detection (pointerdown near x=0)
 * - Proportional view tracking during drag
 * - Threshold-based completion (>40% = pop, <40% = snap back)
 * - Vertical drag cancellation
 */

import { createSignal } from '@tachui/core'

export interface SwipeBackGestureConfig {
  /** Threshold percentage (0-1) to trigger pop on release */
  threshold?: number
  /** Edge width in pixels to detect swipe start */
  edgeWidth?: number
  /** Minimum horizontal movement before considering as horizontal gesture */
  horizontalThreshold?: number
  /** Minimum vertical movement to cancel gesture */
  verticalThreshold?: number
  /** Enable/disable the gesture */
  enabled?: boolean
}

export interface SwipeBackGestureCallbacks {
  /** Called when gesture starts */
  onGestureStart?: () => void
  /** Called during gesture with progress (0-1) */
  onGestureProgress?: (progress: number) => void
  /** Called when gesture completes (pop triggered) */
  onGestureComplete?: () => void
  /** Called when gesture cancels (snap back) */
  onGestureCancel?: () => void
}

export interface SwipeBackGestureState {
  /** Whether a gesture is in progress */
  isActive: boolean
  /** Current drag progress (0-1) */
  progress: number
  /** Starting X position */
  startX: number
  /** Starting Y position */
  startY: number
  /** Whether gesture direction is determined */
  directionDetermined: boolean
  /** Whether gesture is horizontal (vs vertical) */
  isHorizontal: boolean | null
}

const DEFAULT_CONFIG: Required<SwipeBackGestureConfig> = {
  threshold: 0.4,
  edgeWidth: 20,
  horizontalThreshold: 10,
  verticalThreshold: 10,
  enabled: true,
}

/**
 * Creates a swipe-back gesture detector for NavigationStack
 */
export function createSwipeBackGesture(
  config: SwipeBackGestureConfig = {},
  callbacks: SwipeBackGestureCallbacks = {}
) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }

  const [gestureState, setGestureState] = createSignal<SwipeBackGestureState>({
    isActive: false,
    progress: 0,
    startX: 0,
    startY: 0,
    directionDetermined: false,
    isHorizontal: null,
  })

  let containerElement: HTMLElement | null = null
  let removeListeners: (() => void) | null = null

  const startGesture = (clientX: number, clientY: number) => {
    if (!finalConfig.enabled) return

    setGestureState({
      isActive: true,
      progress: 0,
      startX: clientX,
      startY: clientY,
      directionDetermined: false,
      isHorizontal: null,
    })

    callbacks.onGestureStart?.()
  }

  const updateGesture = (clientX: number, clientY: number) => {
    let state = gestureState()
    if (!state.isActive) return

    const deltaX = clientX - state.startX
    const deltaY = clientY - state.startY
    const absDeltaX = Math.abs(deltaX)
    const absDeltaY = Math.abs(deltaY)

    // Determine gesture direction if not yet determined
    if (!state.directionDetermined) {
      if (absDeltaX > finalConfig.horizontalThreshold || absDeltaY > finalConfig.verticalThreshold) {
        const isHorizontal = absDeltaX > absDeltaY

        setGestureState(prev => ({
          ...prev,
          directionDetermined: true,
          isHorizontal,
        }))

        // If vertical, cancel immediately
        if (!isHorizontal) {
          cancelGesture()
          return
        }

        // Re-read state after update to get fresh isHorizontal value
        state = gestureState()
      } else {
        return // Not enough movement to determine direction
      }
    }

    // Only process horizontal movement (use fresh state)
    if (!state.isHorizontal) return

    // Calculate progress (0-1) based on container width
    const containerWidth = containerElement?.clientWidth ?? window.innerWidth
    const progress = Math.max(0, Math.min(1, deltaX / containerWidth))

    setGestureState(prev => ({
      ...prev,
      progress,
    }))

    callbacks.onGestureProgress?.(progress)
  }

  const endGesture = () => {
    const state = gestureState()
    if (!state.isActive) return

    const progress = state.progress
    const completed = progress >= finalConfig.threshold

    setGestureState({
      isActive: false,
      progress: 0,
      startX: 0,
      startY: 0,
      directionDetermined: false,
      isHorizontal: null,
    })

    if (completed) {
      callbacks.onGestureComplete?.()
    } else {
      callbacks.onGestureCancel?.()
    }
  }

  const cancelGesture = () => {
    setGestureState({
      isActive: false,
      progress: 0,
      startX: 0,
      startY: 0,
      directionDetermined: false,
      isHorizontal: null,
    })

    callbacks.onGestureCancel?.()
  }

  const attachToElement = (element: HTMLElement | null) => {
    // Clean up previous listeners
    if (removeListeners) {
      removeListeners()
      removeListeners = null
    }

    containerElement = element
    if (!element) return

    const handlePointerDown = (event: PointerEvent) => {
      // Only detect swipes starting from the left edge
      if (event.clientX > finalConfig.edgeWidth) return

      // Only respond to primary pointer (single finger/mouse)
      if (!event.isPrimary) return

      // Ignore if target is interactive (use closest for complete check)
      const target = event.target as HTMLElement
      if (target.closest('a, button, input, select, textarea, [role="button"], [contenteditable="true"]')) {
        return
      }

      // Capture pointer to ensure we receive pointer events even if pointer leaves element
      element.setPointerCapture(event.pointerId)

      startGesture(event.clientX, event.clientY)
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (!gestureState().isActive) return
      if (!event.isPrimary) return

      updateGesture(event.clientX, event.clientY)
    }

    const handlePointerUp = (event: PointerEvent) => {
      if (!gestureState().isActive) return
      if (!event.isPrimary) return

      // Release pointer capture
      element.releasePointerCapture(event.pointerId)

      endGesture()
    }

    const handlePointerCancel = (event: PointerEvent) => {
      if (!gestureState().isActive) return

      // Release pointer capture if still held
      try {
        element.releasePointerCapture(event.pointerId)
      } catch {
        // Ignore if not captured
      }

      cancelGesture()
    }

    // Add listeners - Pointer Events cover mouse, touch, and stylus on modern browsers
    element.addEventListener('pointerdown', handlePointerDown)
    element.addEventListener('pointermove', handlePointerMove)
    element.addEventListener('pointerup', handlePointerUp)
    element.addEventListener('pointercancel', handlePointerCancel)

    removeListeners = () => {
      element.removeEventListener('pointerdown', handlePointerDown)
      element.removeEventListener('pointermove', handlePointerMove)
      element.removeEventListener('pointerup', handlePointerUp)
      element.removeEventListener('pointercancel', handlePointerCancel)
    }
  }

  const destroy = () => {
    if (removeListeners) {
      removeListeners()
      removeListeners = null
    }
    containerElement = null
  }

  return {
    gestureState,
    attachToElement,
    destroy,
  }
}
