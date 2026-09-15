# Shapes

Shape primitives draw geometry: a filled circle, a stroked ring, an outline. They are views in their own right, so they compose, animate and reuse the way any other view does, and they fill whatever frame they are given, as SwiftUI shapes do.

## Overview

A shape has no content of its own. It is styled with a small set of methods that live on the shape rather than on every view:

- **`.fill(style)`** fills the interior.
- **`.stroke(style, lineWidth?)`** strokes the edge, centered on it.
- **`.strokeBorder(style, lineWidth?)`** strokes entirely inside the frame.
- **`.inset(by)`** shrinks the shape on every side.

With none of them a shape fills with `currentColor`. Shape methods chain with modifiers in either order.

```typescript
import { Circle } from '@tachui/primitives'

Circle().fill('#007AFF')
Circle().stroke('#007AFF', 2)
Circle().strokeBorder('#007AFF', 2)
Circle().inset(1).stroke('#007AFF', 2)
```

## Shapes

| Shape | Geometry |
| --- | --- |
| `Circle()` | Inscribed in the short side of its frame, centered |

## Sizing

A shape expands to fill its frame. Give it one with `.frame()`, or let a container that proposes a size do it: a `ZStack`, or an `.overlay()`, which proposes the host's bounds to its content.

```typescript
Circle().fill('#34C759').frame({ width: 12, height: 12 })   // a status dot
```

A circle in a non-square frame is inscribed in the short side and centered; the frame itself is still the full size the shape was given.

## Stroke and inset

`.stroke()` centers the line on the shape's edge, so half of it lies outside the frame, as in SwiftUI. Use `.strokeBorder()` to keep the whole line inside, or `.inset()` to pull the shape in by an exact amount first.

```typescript
Circle().stroke('#8E8E93', 2)         // 1px of the line outside the frame
Circle().strokeBorder('#8E8E93', 2)   // the line fully inside the frame
Circle().inset(1).stroke('#8E8E93', 2)  // the edge 1px in, the line centered on it
```

`.inset()` accumulates: `.inset(1).inset(2)` insets by 3.

## Reactive styles

Every style and length accepts a signal or a color asset, and a change updates the drawn shape in place. The shape keeps one element for its lifetime, so a CSS transition on it survives the update.

```typescript
const [tint, setTint] = createSignal('#007AFF')
const [progress, setProgress] = createSignal(0)

Circle().stroke(tint, 2)
Circle().inset(progress).fill(Assets.accent)
```

## Example: a verification ring

An avatar clipped to a circle, with a ring drawn one pixel inside its edge. The overlay proposes the avatar's bounds to the shape, so nothing repeats the size.

```typescript
Image(source)
  .frame({ width: dimension, height: dimension })
  .clipShape('circle')
  .overlay(Circle().inset(1).stroke(verificationTint, 2))
```

## How shapes render

Shapes render as inline SVG: a wrapper element that takes modifiers, and inside it an `<svg>` with a single `<path>` computed from the shape's measured frame. That is what makes strokes independent of the layout box, insets exact, and a non-square frame draw the right geometry. The SVG is marked `aria-hidden`; a shape is decorative, so give meaning to the view it decorates.

On the server the wrapper is emitted and the shape is drawn on hydration.
