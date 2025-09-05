/**
 * Clipped Modifier
 *
 * SwiftUI-inspired modifier for clipping content to its bounds
 */

import { BaseModifier } from '../basic/base'
import type { ModifierContext } from '@tachui/core/modifiers/types'
import type { DOMNode } from '@tachui/core/runtime/types'

export interface ClippedOptions {
  clipped: boolean
}

export class ClippedModifier extends BaseModifier<ClippedOptions> {
  readonly type = 'clipped'
  readonly priority = 89

  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined {
    if (!context.element) return

    const element = context.element as HTMLElement
    if (!element.style) return

    if (this.properties.clipped) {
      element.style.overflow = 'hidden'
    } else {
      // Reset to default if explicitly set to false
      element.style.overflow = ''
    }

    return undefined
  }
}

/**
 * Creates a clipped modifier that clips content to its bounds
 */
export function clipped(enabled = true): ClippedModifier {
  return new ClippedModifier({ clipped: enabled })
}
