/**
 * clip-path serialization
 *
 * Turning a shape — a string name or any `Shape` — into a CSS `clip-path`
 * value. Pure, and free of the modifier machinery, so both `ClipShapeModifier`
 * and the props-based path in `BaseModifier` can share it without either
 * importing the other.
 */

import type { Shape } from '@tachui/types/shapes'

/** The built-in string forms, which keep working unchanged. */
export type ClipShapeName = 'circle' | 'ellipse' | 'rect' | 'polygon'

/**
 * A shape instance rather than one of the string names.
 *
 * Structural rather than an `instanceof`: there is no shape class on this
 * side of the dependency edge, and none is wanted — anything implementing
 * `Shape` clips, including a user-supplied one.
 */
export function isShapeInstance(
  shape: ClipShapeName | Shape
): shape is Shape {
  return (
    typeof shape === 'object' &&
    shape !== null &&
    typeof (shape as Shape).clipPath === 'function'
  )
}

/**
 * The `clip-path` for a shape name.
 *
 * Shared with the props-based path in `BaseModifier.applyStyles` so the two
 * cannot drift.
 */
export function clipPathForName(
  shape: ClipShapeName,
  parameters: Record<string, any> = {}
): string {
  switch (shape) {
    case 'circle':
      // `circle()` is `closest-side`: the circle inscribed in the short side,
      // which is what SwiftUI's `Circle` clips to and what `Circle()` draws.
      // `circle(50%)`, which this emitted before, resolves the radius against
      // the box's normalized diagonal — `sqrt(w^2 + h^2) / sqrt(2)` — so it
      // overshoots the short side in any box that is not square. Square boxes
      // render identically, which is why it went unnoticed.
      return 'circle()'

    case 'ellipse': {
      const radiusX = parameters?.radiusX || '50%'
      const radiusY = parameters?.radiusY || '50%'
      return `ellipse(${radiusX} ${radiusY} at center)`
    }

    case 'rect': {
      const inset = parameters?.inset || 0
      return `inset(${inset}px)`
    }

    case 'polygon': {
      const points = parameters?.points
      if (!points) return ''
      return `polygon(${points})`
    }

    default:
      return ''
  }
}

/** The `clip-path` for either form. */
export function clipPathFor(
  shape: ClipShapeName | Shape,
  parameters: Record<string, any> = {}
): string {
  // A shape's own `clipPath()` is the single source of truth, so the clip and
  // the shape's drawn path cannot disagree about what the shape is. Note that
  // it clips the shape filling its box: `.inset()` and `strokeBorder`'s
  // half-line inset apply to the drawn path, not to the clip.
  return isShapeInstance(shape)
    ? shape.clipPath()
    : clipPathForName(shape, parameters)
}
