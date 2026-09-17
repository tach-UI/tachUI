---
'@tachui/primitives': patch
---

`trim()` and `strokeStyle()` on shapes.

`.trim(from, to)` draws only the part of the path between two fractions of its
length, which is what progress rings and spinners are made of — and the reason
the engine emits an SVG `<path>` rather than CSS. It works through
`pathLength="1"`, so the browser rescales every path to the same length and the
same fractions give the same result on any shape.

```ts
Circle().trim(0, 0.75).stroke(tint, 4)
Circle().trim(0, progress).strokeStyle({ lineWidth: 4, lineCap: 'round' }).stroke(tint)
```

The path starts where SwiftUI's does — a circle at three o'clock, running
clockwise — so a ring that fills from the top wants `.rotationEffect(-90)` on
top, as it does in SwiftUI. Fractions are clamped to 0...1, and a `to` at or
below `from` draws nothing rather than wrapping, so a progress value arriving
out of order shows an empty ring instead of a full one. A signal-driven trim
updates attributes on the element the shape already has, so a CSS transition on
`stroke-dasharray` runs rather than restarting.

`.strokeStyle({ lineWidth, lineCap, lineJoin, dash, dashPhase })` is SwiftUI's
`StrokeStyle`. Only the keys passed are changed, so repeated calls accumulate.
Its `lineWidth` does the same job as `stroke()`'s second argument, and the two
now combine in either order: `stroke()` only sets a width it was actually
given, so a bare `.stroke(tint)` after `.strokeStyle({ lineWidth: 4 })` keeps
the 4 where before it reset to 1.

Trim and a dash pattern are exclusive. Both are `stroke-dasharray`, and trim
rescales the units a dash length is measured in, so a shape carrying both draws
the trim, ignores the dash, and warns once. Dashing a trimmed path means
computing the dash sequence for the trimmed segment, which is not implemented.
