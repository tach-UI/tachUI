/**
 * Ellipse
 *
 * An ellipse filling the frame, as in SwiftUI. `Circle` inscribes in the short
 * side instead, so the two differ in every box that is not square.
 */

import type { Shape } from '@tachui/types/shapes'
import { ellipsePath } from './geometry'
import { createShape, type ShapeInstance } from './ShapeComponent'

export const ellipseShape: Shape = {
  path: ellipsePath,
  // `ellipse()` defaults to `closest-side closest-side at center`, which is
  // one radius per axis: the ellipse that fills the box.
  clipPath: () => 'ellipse()',
}

/**
 * An ellipse that fills its frame.
 *
 * ```ts
 * Ellipse().fill(color)
 * Ellipse().inset(1).stroke(tint, 2)
 * ```
 */
export function Ellipse(): ShapeInstance {
  return createShape(ellipseShape, 'ellipse')
}
