/**
 * Rectangle
 *
 * The frame itself, with square corners.
 */

import type { Shape } from '@tachui/types/shapes'
import { rectanglePath } from './geometry'
import { createShape, type ShapeInstance } from './ShapeComponent'

export const rectangleShape: Shape = {
  path: rectanglePath,
  clipPath: () => 'inset(0)',
}

/**
 * A rectangle that fills its frame.
 *
 * ```ts
 * Rectangle().fill(color)
 * Rectangle().strokeBorder(tint, 2)
 * ```
 */
export function Rectangle(): ShapeInstance {
  return createShape(rectangleShape, 'rectangle')
}
