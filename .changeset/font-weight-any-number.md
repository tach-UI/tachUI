---
'@tachui/types': patch
'@tachui/modifiers': patch
---

`.fontWeight()` and `.font({ weight })` typecheck with any numeric weight, such
as `590`.

CSS `font-weight` takes any number from 1 to 1000, and the `fontWeight` factory
and the runtime already did, but the chain and the font options were typed for
the named weights and the hundreds, so a variable-font weight needed a cast.
The `weight` field of the font options, in `@tachui/types` and in
`@tachui/modifiers/types`, now takes `FontWeight | number`. The `FontWeight`
alias itself is unchanged, and unknown string weights are still rejected.
