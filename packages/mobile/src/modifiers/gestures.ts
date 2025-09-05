/**
 * Mobile Gesture Modifiers
 *
 * Modifiers for mobile-specific touch gestures including
 * pull-to-refresh, swipe actions, and touch interactions.
 */

import { BaseModifier } from '@tachui/core'
import type { ModifierContext, DOMNode } from '@tachui/core'
import type { MobileGestureOptions, RefreshableOptions } from './types'

export class MobileGestureModifier extends BaseModifier<MobileGestureOptions> {
  readonly type = 'mobileGesture'
  readonly priority = 150 // High priority for gesture handling

  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined {
    if (!context.element) return

    if (this.properties.refreshable) {
      this.setupRefreshable(context.element, this.properties.refreshable)
    }

    return undefined
  }

  private setupRefreshable(
    element: Element,
    options: RefreshableOptions
  ): void {
    if (!options) return

    // State variables
    let isRefreshing = false
    let pullDistance = 0
    let startY = 0
    const threshold = 70 // Pull threshold in pixels
    const container = element.parentElement || element

    // Create refresh indicator element
    const refreshIndicator = document.createElement('div')
    refreshIndicator.style.cssText = `
      position: absolute;
      top: -50px;
      left: 50%;
      transform: translateX(-50%);
      width: 30px;
      height: 30px;
      border: 2px solid #ccc;
      border-top: 2px solid #007AFF;
      border-radius: 50%;
      animation: tachui-spin 1s linear infinite;
      opacity: 0;
      transition: opacity 0.3s ease;
      z-index: 1000;
    `

    // Add refresh indicator to container
    if (container instanceof HTMLElement) {
      container.appendChild(refreshIndicator)
    }

    // Touch event handlers
    const handleTouchStart = (e: TouchEvent) => {
      if (isRefreshing) return
      startY = e.touches[0].clientY
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (isRefreshing) return

      const currentY = e.touches[0].clientY
      pullDistance = Math.max(0, currentY - startY)

      if (pullDistance > 20) {
        e.preventDefault() // Prevent default scrolling

        const progress = Math.min(pullDistance / threshold, 1)
        refreshIndicator.style.opacity = String(progress * 0.8)
        refreshIndicator.style.top = `${-50 + progress * 20}px`
      }
    }

    const handleTouchEnd = async () => {
      if (isRefreshing || pullDistance < threshold) {
        // Reset if threshold not met
        refreshIndicator.style.opacity = '0'
        refreshIndicator.style.top = '-50px'
        pullDistance = 0
        return
      }

      // Trigger refresh
      isRefreshing = true
      refreshIndicator.style.opacity = '1'
      refreshIndicator.style.top = '10px'

      try {
        await options.onRefresh()
      } catch (error) {
        console.error('TachUI Refresh Error:', error)
      } finally {
        isRefreshing = false
        refreshIndicator.style.opacity = '0'
        refreshIndicator.style.top = '-50px'
        pullDistance = 0
      }
    }

    // Add event listeners with proper typing
    element.addEventListener('touchstart', handleTouchStart as EventListener, {
      passive: false,
    })
    element.addEventListener('touchmove', handleTouchMove as EventListener, {
      passive: false,
    })
    element.addEventListener('touchend', handleTouchEnd as EventListener)

    // Note: Cleanup would need to be integrated with the component's cleanup system
  }

  // Cleanup is handled by the base modifier system
}

/**
 * Pull-to-refresh modifier for mobile interfaces
 *
 * Adds pull-to-refresh functionality with visual feedback and loading states.
 * Only works on touch-enabled devices.
 *
 * @param onRefresh - Function called when refresh is triggered
 * @param isRefreshing - Optional reactive signal for external refresh state
 * @returns MobileGestureModifier
 *
 * @example
 * ```typescript
 * const [refreshing, setRefreshing] = createSignal(false)
 *
 * ScrollView({
 *   children: [] // content here
 * })
 *   .modifier.refreshable({
 *     onRefresh: async () => {
 *       setRefreshing(true)
 *       await fetchNewData()
 *       setRefreshing(false)
 *     },
 *     isRefreshing: refreshing
 *   })
 *   .build()
 * ```
 */
export function refreshable(
  options: RefreshableOptions
): MobileGestureModifier {
  return new MobileGestureModifier({ refreshable: options })
}
