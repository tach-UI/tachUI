---
'@tachui/primitives': patch
---

Shape rendering and API corrections.

- A shape measures its own box once on a microtask after mount, so it draws on
  the first frame instead of waiting for the observer's first asynchronous
  delivery. It is also the only measurement where `ResizeObserver` is missing,
  which previously meant the shape never drew at all. A zero box is treated as
  the absence of a measurement rather than a measurement of zero, so it never
  overwrites a real size.
- `path()` now reports the geometry the shape actually draws. It applied only
  the explicit insets while the renderer additionally applied half the line
  width for `strokeBorder`, so a bordered shape reported a path larger than the
  one on screen. Both go through one code path now, which matters because the
  `Shape` contract exists for `clipShape` to consume.
- `.stroke()` clears an inset left by an earlier `.strokeBorder()`. Replacing a
  border stroke with a plain one kept the half-line inset, so the new stroke was
  drawn inside the edge rather than centered on it.
- Shape methods work with `configureCore({ proxyModifiers: false })`. `fill` and
  `stroke` are not modifiers, so with the proxy disabled they existed nowhere
  and the shape API was unusable there.
- A line width goes through the same formatter as the path data, so a computed
  width no longer serializes as `0.30000000000000004`.
- A style that is neither a color string, a signal of one, nor a color asset
  warns and draws nothing, instead of painting `[object Object]`.

Shape methods are documented as chain-time: the modifier builder renders a
clone of the component, so calling `.fill()` on an already-mounted shape changes
nothing visible. Signals are the supported way to change a shape after mount.
