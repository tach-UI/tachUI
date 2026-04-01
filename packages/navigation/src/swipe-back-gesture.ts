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
    const state = gestureState()
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
      } else {
        return // Not enough movement to determine direction
      }
    }

    // Only process horizontal movement
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

      // Ignore if target is interactive
      const target = event.target as HTMLElement
      if (target.tagName === 'BUTTON' || target.tagName === 'INPUT' || target.tagName === 'A') {
        return
      }

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

      endGesture()
    }

    const handlePointerCancel = () => {
      if (!gestureState().isActive) return
      cancelGesture()
    }

    // Touch events for better mobile support
    const handleTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0]
      if (!touch) return

      // Only detect swipes starting from the left edge
      if (touch.clientX > finalConfig.edgeWidth) return

      // Ignore if target is interactive
      const target = event.target as HTMLElement
      if (target.tagName === 'BUTTON' || target.tagName === 'INPUT' || target.tagName === 'A') {
        return
      }

      startGesture(touch.clientX, touch.clientY)
    }

    const handleTouchMove = (event: TouchEvent) => {
      if (!gestureState().isActive) return

      const touch = event.touches[0]
      if (!touch) return

      updateGesture(touch.clientX, touch.clientY)

      // Prevent default scrolling during horizontal swipe
      const state = gestureState()
      if (state.isHorizontal) {
        event.preventDefault()
      }
    }

    const handleTouchEnd = () => {
      if (!gestureState().isActive) return
      endGesture()
    }

    const handleTouchCancel = () => {
      if (!gestureState().isActive) return
      cancelGesture()
    }

    // Add listeners
    element.addEventListener('pointerdown', handlePointerDown)
    element.addEventListener('pointermove', handlePointerMove)
    element.addEventListener('pointerup', handlePointerUp)
    element.addEventListener('pointercancel', handlePointerCancel)

    // Touch events (for better iOS support)
    element.addEventListener('touchstart', handleTouchStart, { passive: false })
    element.addEventListener('touchmove', handleTouchMove, { passive: false })
    element.addEventListener('touchend', handleTouchEnd)
    element.addEventListener('touchcancel', handleTouchCancel)

    removeListeners = () => {
      element.removeEventListener('pointerdown', handlePointerDown)
      element.removeEventListener('pointermove', handlePointerMove)
      element.removeEventListener('pointerup', handlePointerUp)
      element.removeEventListener('pointercancel', handlePointerCancel)

      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
      element.removeEventListener('touchcancel', handleTouchCancel)
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
