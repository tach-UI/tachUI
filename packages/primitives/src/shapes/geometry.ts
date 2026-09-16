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

/**
 * The rect itself.
 *
 * Starts at the top-left corner and runs clockwise. Every shape here shares
 * that direction, and the start point is what `trim` will count from.
 */
export function rectanglePath(rect: ShapeRect): string {
  if (rect.width <= 0 || rect.height <= 0) return ''
  const left = formatLength(rect.x)
  const top = formatLength(rect.y)
  const right = formatLength(rect.x + rect.width)
  const bottom = formatLength(rect.y + rect.height)
  return `M ${left} ${top} L ${right} ${top} L ${right} ${bottom} L ${left} ${bottom} Z`
}

/**
 * The largest corner radius `rect` can carry: half its short side, as SwiftUI
 * clamps `RoundedRectangle`.
 *
 * An SVG `<rect rx ry>` clamps each axis against its own dimension instead, so
 * a radius past the short side draws elliptical corners rather than the
 * capsule SwiftUI gives. That is one of the reasons a shape is drawn as a
 * `<path>`.
 */
export function clampCornerRadius(rect: ShapeRect, radius: number): number {
  return Math.max(0, Math.min(radius, Math.min(rect.width, rect.height) / 2))
}

/**
 * A rounded rect with `cornerRadius` on all four corners, clamped to half the
 * short side. Corners are circular arcs, never elliptical.
 *
 * The straight edges are emitted even when a corner radius collapses them to
 * nothing — a capsule's short axis, for instance — so the command sequence is
 * the same whatever the radius.
 */
export function roundedRectPath(rect: ShapeRect, cornerRadius: number): string {
  if (rect.width <= 0 || rect.height <= 0) return ''
  const radius = clampCornerRadius(rect, cornerRadius)
  if (radius <= 0) return rectanglePath(rect)

  const left = rect.x
  const top = rect.y
  const right = rect.x + rect.width
  const bottom = rect.y + rect.height
  const r = formatLength(radius)
  // Sweep flag 1 is clockwise, matching the direction of the straight edges.
  const arc = (x: number, y: number) =>
    `A ${r} ${r} 0 0 1 ${formatLength(x)} ${formatLength(y)}`
  const line = (x: number, y: number) =>
    `L ${formatLength(x)} ${formatLength(y)}`

  return [
    `M ${formatLength(left + radius)} ${formatLength(top)}`,
    line(right - radius, top),
    arc(right, top + radius),
    line(right, bottom - radius),
    arc(right - radius, bottom),
    line(left + radius, bottom),
    arc(left, bottom - radius),
    line(left, top + radius),
    arc(left + radius, top),
    'Z',
  ].join(' ')
}

/**
 * An ellipse filling `rect` — unlike `circlePath`, which inscribes in the
 * short side. Starts at the trailing point and runs clockwise, as a circle
 * does.
 */
export function ellipsePath(rect: ShapeRect): string {
  const rx = rect.width / 2
  const ry = rect.height / 2
  if (rx <= 0 || ry <= 0) return ''
  const centerY = formatLength(rect.y + ry)
  const start = formatLength(rect.x + rect.width)
  const end = formatLength(rect.x)
  const radiusX = formatLength(rx)
  const radiusY = formatLength(ry)
  return `M ${start} ${centerY} A ${radiusX} ${radiusY} 0 1 1 ${end} ${centerY} A ${radiusX} ${radiusY} 0 1 1 ${start} ${centerY} Z`
}

/**
 * A rounded rect whose corners are as round as the rect allows: semicircular
 * caps on the short axis, in either orientation.
 */
export function capsulePath(rect: ShapeRect): string {
  return roundedRectPath(rect, Math.min(rect.width, rect.height) / 2)
}
