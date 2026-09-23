---
'@tachui/core': patch
'@tachui/modifiers': patch
---

`.css()` takes a `Signal` for any value and updates that property in place,
as `CSSStyleProperties` already declared. `.cssProperty()` and
`.cssVariable()` take one too.

The builder published at `@tachui/modifiers/types` typed each `.css()` value
as `string | number | undefined`, so a reactive value was a type error, and
the modifier read every signal once in its constructor, so one passed anyway
froze at its first value. Signals are now kept and bound like the typed
modifiers bind theirs. That matters most for values with no typed modifier:
a layered `background`, `text-decoration`, `outline`, `box-shadow`.

Numbers are also converted the same way for static and reactive values: a
number becomes pixels except on unitless properties. Before, `.css()` turned
every static number into pixels itself, so `.css({ opacity: 0.5 })` wrote
`0.5px`, which the browser ignores. The list of unitless properties is now
complete and shared by every modifier. It covers the grid lines (`gridRow: 2`),
`scale`, `zoom`, `aspect-ratio`, `animation-iteration-count`, the SVG
opacities and the rest, which used to get `px` and be dropped.

A signal of `string | number` is accepted too, for values such as `16` that
become `'1rem'`, and so is one that can be empty. A signal that yields `null`
or `undefined` clears the property instead of writing the text `"undefined"`. That text is stored by a
custom property, which passes it to every `var()` that reads it, and ignored
by a standard one, which leaves the old value in place. This applies to every
modifier's reactive styles, not only `.css()`.

`.css()` copies the object it is given, so changing the object afterwards no
longer changes the modifier. It skips a key that is a rule (`@media`,
`@supports`, `:hover`, `&::before`) and a value that is an object or an array,
since no inline style can hold either, and warns about them in development.
A browser dropped the rules anyway. A custom property would have stored an
object as `[object Object]`.
A vendor-prefixed name written in lowercase, the usual CSSOM spelling, now gets
its leading dash: `webkitLineClamp` becomes `-webkit-line-clamp`, and
`msFilter` becomes `-ms-filter`. Only a capital (`WebkitFilter`) used to add
it, and a browser drops a prefixed property that has no dash. Every modifier
converts names this way, and several write lowercase `webkit` names
themselves. Those declarations never reached the element:
`.lineClamp()`'s `-webkit-line-clamp` and `-webkit-box-orient`, gradient text's
`-webkit-background-clip` and `-webkit-text-fill-color`, Safari's
`-webkit-backdrop-filter`, and `-webkit-hyphens`.
`cssVendor()` takes a signal like the other CSS modifiers.
