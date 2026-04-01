/**
 * Blend Mode Modifiers
 *
 * CSS compositing modifiers for element and background layer blending.
 */

import { BaseModifier } from '../basic/base'
import type { DOMNode } from '@tachui/types/runtime'
import type { ModifierContext, BlendMode } from '@tachui/types/modifiers'

export interface BlendModeModifierProps {
  mode: BlendMode
}

export class BlendModeModifier extends BaseModifier<BlendModeModifierProps> {
  readonly type = 'blendMode'
  readonly priority = 92

  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined {
    if (!context.element) return
    this.applyStyleChange(context.element, 'mixBlendMode', this.properties.mode)
    return undefined
  }
}

export class BackgroundBlendModeModifier extends BaseModifier<BlendModeModifierProps> {
  readonly type = 'backgroundBlendMode'
  readonly priority = 93

  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined {
    if (!context.element) return
    this.applyStyleChange(
      context.element,
      'backgroundBlendMode',
      this.properties.mode
    )
    return undefined
  }
}

export function blendMode(mode: BlendMode): BlendModeModifier {
  // Blend mode is static-only for now; reactive Signal support can be added later
  // if dynamic compositing use-cases emerge.
  return new BlendModeModifier({ mode })
}

export function backgroundBlendMode(
  mode: BlendMode
): BackgroundBlendModeModifier {
  // Blend mode is static-only for now; reactive Signal support can be added later.
  return new BackgroundBlendModeModifier({ mode })
}
