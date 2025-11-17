/**
 * Core layout factories for frame/layoutPriority/absolutePosition.
 *
 * These wrap the underlying LayoutModifier in @tachui/core so that
 * consumers (and ModifierBuilder) can rely on @tachui/modifiers for
 * concrete modifier creation.
 */

import { LayoutModifier } from '@tachui/core/modifiers'
import type { Signal } from '@tachui/core/reactive/types'

export function frame(options: any): LayoutModifier {
  return new LayoutModifier({ frame: options })
}

export function layoutPriority(
  priority: number | Signal<number>
): LayoutModifier {
  return new LayoutModifier({ layoutPriority: priority })
}

export function absolutePosition(
  x: number | Signal<number>,
  y?: number | Signal<number>
): LayoutModifier {
  return new LayoutModifier({
    position: {
      x,
      y,
    },
  })
}
