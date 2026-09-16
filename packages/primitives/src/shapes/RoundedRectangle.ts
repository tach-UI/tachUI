/**
 * RoundedRectangle
 *
 * A rectangle with circular corners, the radius clamped to half the short
 * side as SwiftUI clamps it. Per-corner radii are a later addition; the
 * options object is the form that leaves room for them.
 */

import type { Shape } from '@tachui/types/shapes'
import { formatLength, roundedRectPath } from './geometry'
import {
  createShape,
  resolveLength,
  type ShapeInstance,
  type ShapeLength,
} from './ShapeComponent'

export interface RoundedRectangleOptions {
  cornerRadius: ShapeLength
}

function cornerRadiusOf(
  radius: ShapeLength | RoundedRectangleOptions
): ShapeLength {
  return typeof radius === 'object' && 'cornerRadius' in radius
    ? radius.cornerRadius
    : radius
}

/**
 * The `Shape` for a rounded rect of `cornerRadius`.
 *
 * A radius is read at draw time rather than captured, so a signal stays live
 * the way `.inset()` and a stroke's line width do.
 *
 * That holds for `path` because `paint()` calls it inside the renderer's
 * subscription. `clipPath()` carries no such guarantee of its own — it
 * simply reads the radius when called — but `clipShape` applies its modifier
 * in a tracked scope, so the clip follows the signal too and stays in step
 * with the drawn path. Only a caller reading `clipPath()` outside a tracked
 * scope gets a snapshot. This is the first shape whose `clipPath()` depends
 * on state at all.
 */
export function roundedRectangleShape(cornerRadius: ShapeLength): Shape {
  return {
    path: rect => roundedRectPath(rect, resolveLength(cornerRadius)),
    // CSS clamps a uniform `border-radius` by scaling it until the corners
    // stop overlapping, which lands on exactly SwiftUI's `min(w, h) / 2`, so
    // an over-large radius clips the same way it draws.
    clipPath: () =>
      `inset(0 round ${formatLength(Math.max(0, resolveLength(cornerRadius)))}px)`,
  }
}

/**
 * A rounded rectangle that fills its frame.
 *
 * ```ts
 * RoundedRectangle(12).fill(color)
 * RoundedRectangle({ cornerRadius: 12 }).strokeBorder(tint, 2)
 * RoundedRectangle(radiusSignal).fill(color)
 * ```
 *
 * The radius is clamped to half the short side, so a value larger than the
 * frame draws a capsule rather than distorting into elliptical corners.
 */
export function RoundedRectangle(
  cornerRadius: ShapeLength | RoundedRectangleOptions
): ShapeInstance {
  return createShape(
    roundedRectangleShape(cornerRadiusOf(cornerRadius)),
    'rounded-rectangle'
  )
}
