---
'@tachui/primitives': patch
---

Add `Circle`, the first shape primitive, and the engine behind it.

A shape fills its frame and is styled with methods on the shape rather than
general modifiers: `.fill(style)`, `.stroke(style, lineWidth)`,
`.strokeBorder(style, lineWidth)` and `.inset(by)`. Every style and length
accepts a signal or a color asset. Shape methods chain with modifiers in
either order.

```ts
import { Circle } from '@tachui/primitives'

Circle().fill(color)
Circle().inset(1).stroke(tint, 2)     // a ring 1px inside the edge
Circle().strokeBorder(tint, 2)        // a stroke fully inside the frame
```

Shapes render as inline SVG: a wrapper that takes modifiers, and inside it an
`<svg>` with one `<path>` computed from the shape's measured frame, so a
circle in a non-square frame is inscribed in the short side and a stroke is
independent of the layout box. The svg is updated in place when a signal
changes, never replaced, so a CSS transition on it survives the update. It is
`aria-hidden`; a shape is decorative.

New subpath `@tachui/primitives/shapes`. Server-side the wrapper is emitted
and the shape is drawn on hydration.
