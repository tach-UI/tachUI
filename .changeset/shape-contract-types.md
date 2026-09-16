---
'@tachui/types': minor
---

Add the `Shape` contract and `ShapeRect` under `@tachui/types/shapes`.

A shape is a function from a rectangle to SVG path data, plus the CSS
`clip-path` basic shape for it filling its box. The built-in shapes in
`@tachui/primitives` implement it; it lives here so `@tachui/modifiers` can
accept a shape instance in `clipShape` without importing a component.
