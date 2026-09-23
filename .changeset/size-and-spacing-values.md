---
'@tachui/modifiers': patch
---

A size signal that becomes `infinity` now behaves like a static `infinity`.
`.width(signal)`, `.maxWidth(signal)` and the other size modifiers resolve a
signal's current value before computing styles. A width or height of
`infinity` therefore expands the element with the same flex styles, and a max
size of `infinity` removes the constraint, instead of the sentinel being
written as a CSS value. Styles a previous value set are cleared when the
signal moves on, and a signal yielding `null` unsets the size as `undefined`
does.

`margin` and `padding` pass a string through as written and give only a
number pixels, as the reactive path already did. A unit used to be appended to
any string that wasn't a single length, so `'0 auto'` became `'0 autopx'` and
`'calc(100% - 8px)'` became `'calc(100% - 8px)px'`, both invalid. The
exception was a unitless numeric string: `'16'` became `'16px'`. It now passes
through as `'16'`, which is not a valid margin. Pass the number `16`, or a
string with its unit.

`margin`, `padding` and the size modifiers copy the object they are given, so
changing it after the call no longer changes the modifier.
