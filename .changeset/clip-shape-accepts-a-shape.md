---
'@tachui/modifiers': patch
---

`clipShape()` accepts a shape instance, and `'circle'` clips to the inscribed
circle.

`.clipShape(Circle())` now works as written in SwiftUI, alongside the existing
string names. A shape serializes itself through the `Shape` contract's
`clipPath()`, so the modifier stays ignorant of shape kinds and no SVG clip
machinery is involved — and the dependency edge keeps pointing the right way,
since `@tachui/primitives` depends on `@tachui/modifiers` rather than the
reverse. Anything implementing `Shape` clips, including a user-supplied one.

`clipShape('circle')` emits `circle()` where it used to emit `circle(50%)`.
CSS resolves a percentage circle radius against the box's normalized diagonal
rather than its short side, so the old value overshot in any box that was not
square; the two agree in a square box, which is why it went unnoticed. This is
a visual change for a non-square clipped box, in the direction of what SwiftUI
draws and what `Circle()` itself renders.

Insets do not carry into the clip: `.clipShape(Circle().inset(4))` clips as
though uninset, because CSS basic shapes have no inset form. `Shape.clipPath`
records why and how to add it later. A signal-driven radius does carry, though
— the modifier applies in a tracked scope, so `.clipShape(RoundedRectangle(r))`
restyles the clipped element when `r` changes, keeping the clip in step with
the drawn path.

The props form (`{ clipShape: { shape } }`) accepts an instance too, and both
paths now share one serializer rather than carrying a copy of the switch each.
