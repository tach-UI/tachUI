---
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
`0.5px`, which the browser ignores.
