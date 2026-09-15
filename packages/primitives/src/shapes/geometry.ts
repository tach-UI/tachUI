/**
 * Shape geometry
 *
 * Pure functions from a rectangle to SVG path data. Kept free of DOM and
 * reactivity so they can be tested on numbers alone and reused server-side.
 */

import type { ShapeRect } from '@tachui/types/shapes'

/**
 * Format a length for path data: fixed precision with float noise trimmed, so
 * `19.999999999` and `20` produce the same attribute value.
 */
export function formatLength(value: number): string {
  return String(Number(value.toFixed(3)))
}

/**
 * Shrink `rect` by `by` on every side. Matches SwiftUI's `InsettableShape`
 * for the built-in shapes, which are all symmetric about the rect's center.
 * A rect too small to inset collapses to zero size at its center rather than
 * inverting.
 */
export function insetRect(rect: ShapeRect, by: number): ShapeRect {
  const width = Math.max(0, rect.width - by * 2)
  const height = Math.max(0, rect.height - by * 2)
  return {
    x: rect.x + (rect.width - width) / 2,
    y: rect.y + (rect.height - height) / 2,
    width,
    height,
  }
}

/**
 * A circle inscribed in the short side of `rect`, centered, as SwiftUI's
 * `Circle` draws it. The path starts at the trailing point (3 o'clock) and
 * runs clockwise, which is the start point `trim` will count from.
 */
export function circlePath(rect: ShapeRect): string {
  const radius = Math.min(rect.width, rect.height) / 2
  if (radius <= 0) return ''
  const centerX = rect.x + rect.width / 2
  const centerY = rect.y + rect.height / 2
  const r = formatLength(radius)
  const cy = formatLength(centerY)
  const start = formatLength(centerX + radius)
  const end = formatLength(centerX - radius)
  return `M ${start} ${cy} A ${r} ${r} 0 1 1 ${end} ${cy} A ${r} ${r} 0 1 1 ${start} ${cy} Z`
}
