/**
 * OnContinuousHover Modifier
 *
 * Tracks continuous hover with real-time coordinate updates.
 * Supports both local and global coordinate spaces.
 */

import { BaseModifier } from '../base'
import type { DOMNode } from '@tachui/core/runtime/types'
import type { ModifierContext } from '../types'

export interface OnContinuousHoverOptions {
  coordinateSpace?: 'local' | 'global'
  perform: (location: { x: number; y: number } | null) => void
}

export class OnContinuousHoverModifier extends BaseModifier<OnContinuousHoverOptions> {
  readonly type = 'onContinuousHover'
  readonly priority = 70

  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined {
    if (!context.element) return

    this.setupContinuousHover(context.element, this.properties)
    return undefined
  }

  private setupContinuousHover(
    element: Element,
    options: OnContinuousHoverOptions
  ): void {
    const coordinateSpace = options.coordinateSpace ?? 'local'
    let isHovering = false

    const calculateCoordinates = (
      event: MouseEvent
    ): { x: number; y: number } => {
      if (coordinateSpace === 'global') {
        // Global coordinates relative to viewport
        return {
          x: event.clientX,
          y: event.clientY,
        }
      } else {
        // Local coordinates relative to the element
        const rect = element.getBoundingClientRect()
        return {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        }
      }
    }

    const handleMouseEnter = (event: Event) => {
      isHovering = true
      const mouseEvent = event as MouseEvent
      const coordinates = calculateCoordinates(mouseEvent)
      options.perform(coordinates)
    }

    const handleMouseMove = (event: Event) => {
      if (!isHovering) return

      const mouseEvent = event as MouseEvent
      const coordinates = calculateCoordinates(mouseEvent)
      options.perform(coordinates)
    }

    const handleMouseLeave = () => {
      isHovering = false
      options.perform(null) // null indicates hover ended
    }

    // Add mouse event listeners
    element.addEventListener('mouseenter', handleMouseEnter as EventListener)
    element.addEventListener('mousemove', handleMouseMove as EventListener)
    element.addEventListener('mouseleave', handleMouseLeave as EventListener)

    // Store cleanup function for later removal
    const cleanup = () => {
      // Reset hover state
      if (isHovering) {
        isHovering = false
        options.perform(null)
      }

      element.removeEventListener(
        'mouseenter',
        handleMouseEnter as EventListener
      )
      element.removeEventListener('mousemove', handleMouseMove as EventListener)
      element.removeEventListener(
        'mouseleave',
        handleMouseLeave as EventListener
      )
    }

    ;(element as any)._continuousHoverCleanup = cleanup
  }
}

/**
 * Factory function for onContinuousHover modifier
 */
export function onContinuousHover(
  options: OnContinuousHoverOptions
): OnContinuousHoverModifier {
  return new OnContinuousHoverModifier(options)
}

/**
 * Convenience factory for local coordinate tracking
 */
export function onContinuousHoverLocal(
  perform: (location: { x: number; y: number } | null) => void
): OnContinuousHoverModifier {
  return onContinuousHover({
    coordinateSpace: 'local',
    perform,
  })
}

/**
 * Convenience factory for global coordinate tracking
 */
export function onContinuousHoverGlobal(
  perform: (location: { x: number; y: number } | null) => void
): OnContinuousHoverModifier {
  return onContinuousHover({
    coordinateSpace: 'global',
    perform,
  })
}
