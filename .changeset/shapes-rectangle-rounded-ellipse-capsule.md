---
'@tachui/primitives': patch
---

`Rectangle`, `RoundedRectangle`, `Ellipse` and `Capsule` on the shape engine.

Each is a path-in-rect function on the existing engine, so all four take
`.fill()`, `.stroke()`, `.strokeBorder()` and `.inset()`, chain with modifiers
in either order, and implement the `Shape` contract's `clipPath()`.

- `Rectangle()` — the frame itself.
- `RoundedRectangle(cornerRadius)`, also `RoundedRectangle({ cornerRadius })`.
  The radius accepts a signal, and is clamped to half the short side as SwiftUI
  clamps it: an over-large radius draws a capsule rather than the elliptical
  corners an SVG `<rect rx ry>` would give, which is one of the reasons shapes
  are drawn as a `<path>`. Per-corner radii are a later addition; the options
  form is what will carry them.
- `Ellipse()` — fills the frame, one radius per axis, where `Circle()`
  inscribes in the short side. The two agree in a square frame.
- `Capsule()` — the largest radius the frame allows, in either orientation.

`.inset()` moves a `RoundedRectangle`'s edges without changing its corner
radius, so an inset rounded rect is not concentric with its host. Subtract the
inset from the radius where concentric corners are wanted.
