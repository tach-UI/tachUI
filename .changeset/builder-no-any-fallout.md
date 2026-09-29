---
'@tachui/types': patch
'@tachui/modifiers': patch
'@tachui/core': patch
---

Three chain methods still accepted anything after the builder lost its
`[key: string]: any` fallback, because their own parameters were `any`.
`.fontFamily()` now takes a string or a font asset, `.fontStyle()` takes
`'normal' | 'italic' | 'oblique'`, and `.scroll()` takes its `ScrollConfig`,
which a declaration in `@tachui/types` had shadowed with `any`. The values the
runtime applies are unchanged; a call that passed anything else now fails to
compile.

The builder's type tests now also pin that it declares no string index
signature and that its chain methods are not `any`.
