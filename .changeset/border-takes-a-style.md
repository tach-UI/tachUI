---
'@tachui/core': patch
'@tachui/types': patch
---

`.border(width, color, style)` typechecks and draws the style at every chain
position.

The standalone `border()` factory took a third `style` argument, but the chain
method took two. The builder's type declared `border(width, color?)` and
`border(options)` only, and its runtime method discarded a third argument, so
`.border(1, 'blue', 'dashed')` was a type error and, cast past it, drew a solid
border — on a component and on `.modifier` alike.

The chain now takes `style` as its third argument, `'solid'`, `'dashed'` or
`'dotted'`, the same set the options form takes. Left out, it is `'solid'` as
before, and the options form is unchanged.
