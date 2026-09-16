/**
 * Shape contract
 *
 * A shape is a function from a rectangle to SVG path data. The built-in shapes
 * in `@tachui/primitives` implement it, and it is declared here so that
 * `@tachui/modifiers` (which primitives depends on, not the reverse) can accept
 * a shape instance in `clipShape` without importing a component.
 */

/**
 * The rectangle a shape is drawn into, in CSS pixels, origin top-left.
 */
export interface ShapeRect {
  x: number
  y: number
  width: number
  height: number
}

export interface Shape {
  /**
   * SVG path data (`d`) for the shape drawn in `rect`.
   *
   * The path is in the same coordinate space as `rect`: an `<svg>` with no
   * `viewBox`, where one user unit is one CSS pixel.
   */
  path(rect: ShapeRect): string

  /**
   * The CSS `clip-path` basic shape for this shape filling its box, e.g.
   * `circle()` for a circle inscribed in the short side.
   *
   * **Insets do not apply.** This clips to the shape filling its box, while
   * `path` honours every `.inset()` and the half-line `strokeBorder` adds, so
   * an inset shape draws inset and clips uninset. The two cannot agree here:
   * CSS basic shapes have no syntax for "closest-side minus N", and a
   * percentage radius resolves against the box's diagonal rather than its
   * short side, which is the same reason the drawn path is measured rather
   * than expressed in percentages.
   *
   * A consumer that needs an inset clip wants the measured rect, so the way
   * to add it later is an optional rect parameter rather than a change here.
   */
  clipPath(): string
}
