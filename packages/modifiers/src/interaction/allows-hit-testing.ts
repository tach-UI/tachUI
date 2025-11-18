/**
 * AllowsHitTesting Modifier
 *
 * Controls whether an element can receive pointer events.
 * When disabled, pointer events pass through to elements behind.
 */

import { BaseModifier } from '../base'
import type { DOMNode } from '@tachui/types/runtime'
import type { ModifierContext } from '../types'

export interface AllowsHitTestingOptions {
  enabled: boolean
}

export class AllowsHitTestingModifier extends BaseModifier<AllowsHitTestingOptions> {
  readonly type = 'allowsHitTesting'
  readonly priority = 95

  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined {
    if (!context.element) return

    this.setupHitTesting(context.element, this.properties.enabled)
    return undefined
  }

  private setupHitTesting(element: Element, enabled: boolean): void {
    // Check if element has style property (for test compatibility)
    if (!element || typeof (element as any).style !== 'object') return

    const htmlElement = element as HTMLElement

    if (enabled) {
      // Enable hit testing - remove pointer-events restriction
      if (htmlElement.style.pointerEvents === 'none') {
        htmlElement.style.pointerEvents = ''
      }
    } else {
      // Disable hit testing - pointer events pass through
      htmlElement.style.pointerEvents = 'none'
    }

    // Store the current state for potential cleanup or toggling
    ;(element as any)._hitTestingEnabled = enabled
  }
}

/**
 * Factory function for allowsHitTesting modifier
 */
export function allowsHitTesting(enabled: boolean): AllowsHitTestingModifier {
  return new AllowsHitTestingModifier({ enabled })
}

/**
 * Convenience factory for enabling hit testing
 */
export function enableHitTesting(): AllowsHitTestingModifier {
  return allowsHitTesting(true)
}

/**
 * Convenience factory for disabling hit testing
 */
export function disableHitTesting(): AllowsHitTestingModifier {
  return allowsHitTesting(false)
}
