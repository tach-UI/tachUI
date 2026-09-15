/**
 * Circle
 *
 * A circle inscribed in the short side of its frame, centered, as in SwiftUI.
 */

import type { Shape } from '@tachui/types/shapes'
import { circlePath } from './geometry'
import { createShape, type ShapeInstance } from './ShapeComponent'

export const circleShape: Shape = {
  path: circlePath,
  // `closest-side` is the inscribed circle; a percentage would resolve
  // against the normalized diagonal and overshoot in a non-square box.
  clipPath: () => 'circle()',
}

/**
 * A circle that fills its frame.
 *
 * ```ts
 * Circle().fill(color)
 * Circle().inset(1).stroke(tint, 2)
 * Circle().strokeBorder(tint, 2)
 * ```
 */
export function Circle(): ShapeInstance {
  return createShape(circleShape, 'circle')
}
