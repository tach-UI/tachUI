/**
 * OnHover Modifier
 *
 * Simple hover state tracking that calls a callback with boolean hover state.
 * This is the basic onHover modifier that was missing from the framework.
 */

import { BaseModifier } from '../base'
import type { DOMNode } from '@tachui/types/runtime'
import type { ModifierResult } from '@tachui/types/modifiers'
import type { ModifierContext } from '../types'

export interface OnHoverOptions {
  onHover: (isHovered: boolean) => void
}

export class OnHoverModifier extends BaseModifier<OnHoverOptions> {
  readonly type = 'onHover'
  readonly priority = 50

  apply(node: DOMNode, context: ModifierContext): DOMNode | ModifierResult | undefined {
    if (!context.element) return

    const cleanup = this.setupHoverTracking(context.element, this.properties)
    return { node, cleanup: [cleanup] }
  }

  private setupHoverTracking(element: Element, options: OnHoverOptions): () => void {
    const handleMouseEnter = () => {
      options.onHover(true)
    }

    const handleMouseLeave = () => {
      options.onHover(false)
    }

    // Add mouse event listeners
    element.addEventListener('mouseenter', handleMouseEnter)
    element.addEventListener('mouseleave', handleMouseLeave)

    // Store cleanup function for later removal
    const cleanup = () => {
      // Reset hover state
      options.onHover(false)

      element.removeEventListener('mouseenter', handleMouseEnter)
      element.removeEventListener('mouseleave', handleMouseLeave)
    }

    ;(element as any)._hoverCleanup = cleanup

    return cleanup
  }
}

/**
 * Factory function for onHover modifier
 *
 * @example
 * ```typescript
 * .onHover((hovered: boolean) => {
 *   setIsHovered(hovered)
 * })
 * ```
 */
export function onHover(
  callback: (isHovered: boolean) => void
): OnHoverModifier {
  return new OnHoverModifier({ onHover: callback })
}
