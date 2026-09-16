/**
 * Capsule
 *
 * A rounded rect whose corners are as round as the frame allows: semicircular
 * caps on the short axis, in either orientation. This is the shape with no
 * percentage form in SVG or CSS that made measurement the foundation of the
 * engine — see the note on `clipPath` below.
 */

import type { Shape } from '@tachui/types/shapes'
import { capsulePath } from './geometry'
import { createShape, type ShapeInstance } from './ShapeComponent'

/**
 * Large enough that CSS's overlapping-curves rule always scales it down.
 *
 * `inset(0 round 50%)` would draw an *ellipse*, not a capsule: a percentage
 * border radius resolves per axis, so a 100x50 box gets 50px horizontally and
 * 25px vertically. With a radius past both dimensions CSS scales all four
 * corners by one factor until they stop overlapping, which lands on
 * `min(w, h) / 2` on both axes — the capsule, and the same clamp
 * `capsulePath` draws.
 */
const CAPSULE_CLIP_RADIUS = '9999px'

export const capsuleShape: Shape = {
  path: capsulePath,
  clipPath: () => `inset(0 round ${CAPSULE_CLIP_RADIUS})`,
}

/**
 * A capsule that fills its frame.
 *
 * ```ts
 * Capsule().fill(color)
 * Capsule().strokeBorder(tint, 2)
 * ```
 */
export function Capsule(): ShapeInstance {
  return createShape(capsuleShape, 'capsule')
}
