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
| `Rectangle()` | The frame itself, square corners |
| `RoundedRectangle(cornerRadius)` | Circular corners, clamped to half the short side |
| `Ellipse()` | Fills the frame, one radius per axis |
| `Capsule()` | Semicircular caps on the short axis, either orientation |

```typescript
import { Capsule, Ellipse, Rectangle, RoundedRectangle } from '@tachui/primitives'

Rectangle().fill('#F2F2F7')
RoundedRectangle(12).strokeBorder('#E5E5EA', 1)
Ellipse().fill('#34C759')
Capsule().fill('#007AFF')
```

### Circle and Ellipse

`Circle()` inscribes in the short side and centers; `Ellipse()` fills the frame with a radius per axis. In a square frame they draw the same path.

### RoundedRectangle

The radius takes either form, and the options object is what per-corner radii will extend later:

```typescript
RoundedRectangle(12)
RoundedRectangle({ cornerRadius: 12 })
```

It is clamped to half the short side, as in SwiftUI, so a radius larger than the frame draws a capsule rather than stretching into elliptical corners. That clamp is why shapes emit a `<path>`: an SVG `<rect rx ry>` clamps each axis against its own dimension and would distort instead.

`.inset()` moves the edges in without changing the corner radius, so an inset `RoundedRectangle` is not concentric with the one it sits inside. Subtract the inset yourself where you want concentric corners:

```typescript
RoundedRectangle(12).inset(4)       // corners still 12
RoundedRectangle(8).inset(4)        // concentric with a radius-12 host
```

`.strokeBorder()` insets by half the line width the same way, so this is where you are most likely to meet it: `RoundedRectangle(12).strokeBorder(tint, 4)` draws radius-12 corners whose outer stroke edge is radius **14**, two pixels proud of a `cornerRadius: 12` host. Subtract half the line width to land flush:

```typescript
RoundedRectangle(12 - 4 / 2).strokeBorder(tint, 4)   // outer edge back at 12
```

`Capsule()` and `Circle()` recompute their curvature from the inset rect, so their borders sit flush without help: offsetting a circular arc outward by `d` gives radius `r + d` exactly.

`Ellipse()` is the in-between case. Its border stays inside the frame — the outer edge touches the frame at the four axis extremes and nowhere crosses it — but it is not flush with an *elliptical* host, because the parallel curve of an ellipse is not an ellipse. Between the extremes the outer edge bulges past the ellipse filling the frame, by a little in a near-square frame and more in a flat one (about 3.9px for a 200x40 frame with a 12px line). Overlay an `Ellipse` border on an ellipse-clipped host and the two will not trace the same curve.

### Capsule

`Capsule()` is `RoundedRectangle` with the largest radius the frame allows, in either orientation. It is the shape with no percentage form in SVG or CSS — a 50% radius resolves per axis and gives an ellipse in a non-square box — which is why the engine measures the frame rather than expressing geometry in percentages.

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

Signals are the way to change a shape after it is on screen. The shape methods apply while you build the chain, not afterwards, because the modifier builder renders a clone of the component. Calling `.fill()` on a shape you already mounted changes nothing visible.

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

## Clipping to a shape

`.clipShape()` takes a shape instance as well as the original string names, so the SwiftUI spelling works as written:

```typescript
Image(source).clipShape(Circle())
Card().clipShape(RoundedRectangle(12))
Badge().clipShape(Capsule())
```

Each shape serializes itself to a CSS `clip-path`, so there is no SVG clip machinery involved:

| Shape | `clip-path` |
| --- | --- |
| `Circle()` | `circle()` |
| `Rectangle()` | `inset(0)` |
| `RoundedRectangle(12)` | `inset(0 round 12px)` |
| `Ellipse()` | `ellipse()` |
| `Capsule()` | `inset(0 round 20000000px)` |

`Capsule`'s radius looks odd on purpose: a percentage radius resolves per axis and would clip an ellipse, so the value is large enough that CSS's own rule scales all four corners down to half the short side.

**Insets do not apply to the clip.** `.clipShape(Circle().inset(4))` clips the same as `.clipShape(Circle())`, because CSS basic shapes have no "closest-side minus N" form. The inset still applies to the shape when it is *drawn*; it is only the clip that ignores it. A signal-driven `RoundedRectangle` radius is likewise read once when the clip is applied, while the drawn path keeps following it.

::: warning `clipShape('circle')` changed
It now emits `circle()` rather than `circle(50%)`. CSS resolves a percentage circle radius against the box's normalized diagonal, not its short side, so the old value overshot in any box that was not square. Square boxes are unaffected, which is why the difference went unnoticed.
:::

## How shapes render

Shapes render as inline SVG: a wrapper element that takes modifiers, and inside it an `<svg>` with a single `<path>` computed from the shape's measured frame. That is what makes strokes independent of the layout box, insets exact, and a non-square frame draw the right geometry. The SVG is marked `aria-hidden`; a shape is decorative, so give meaning to the view it decorates.

On the server the wrapper is emitted and the shape is drawn on hydration.
