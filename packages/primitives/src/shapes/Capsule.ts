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
 *
 * A *fixed* radius only holds while it overlaps, so the value has to beat
 * half the short side of any box it might clip, or the corners stay at the
 * literal radius while the path keeps drawing a capsule. `clipPath()` takes
 * no rect by contract, so this cannot be derived from the box; instead it is
 * put out of reach. Browsers cap an element at roughly 33.5 million pixels
 * (Chromium's layout unit is 32-bit fixed point at 1/64px), so half a short
 * side tops out near 16.8 million and 20 million always overlaps — while
 * staying inside that same layout range, which a still larger value would
 * not.
 */
const CAPSULE_CLIP_RADIUS = '20000000px'

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
