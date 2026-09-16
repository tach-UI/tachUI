---
'@tachui/primitives': patch
---

Two shape geometry corrections.

- A negative `strokeBorder` line width no longer pushes the shape outside its
  frame. The width was floored at zero for painting but used raw for the
  inset, so `Circle().fill('red').strokeBorder('blue', -4)` *outset* the path
  by 2px — the fill spilling past the frame `strokeBorder` promises to stay
  inside, with no stroke drawn to hint at why. The inset now comes from the
  same floored width the stroke does.
- A shape that is unmounted and remounted measures its new host. The frame
  kept from the previous mount suppressed the fallback measurement, so a
  shape brought back by a toggled `Show` kept its old path. `ResizeObserver`
  corrected that where it exists; in the explicitly supported path where it
  does not, the stale geometry was permanent.
