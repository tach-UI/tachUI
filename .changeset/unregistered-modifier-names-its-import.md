---
'@tachui/core': patch
---

Calling an effect modifier before its package is imported now says which
import is missing. The effect modifiers, `.shadow()`, `.backdropFilter()`,
`.blur()` and the rest, are registered by `@tachui/modifiers/preload/effects`,
which nothing imports for you. Without it, the chain read `.shadow` as
undefined and the call failed with "shadow is not a function". It now throws
"Modifier 'shadow' is not registered", naming the import to add. This applies
on a component chain and on `.modifier`. A reference to the method taken
before the import ran applies the modifier once it has, so the import can be
loaded lazily.

The types already reject these calls when the preload is not imported, so this
is what plain JavaScript, or code that casts past the types, sees. A component
method with the same name as an effect modifier still wins, and `'shadow' in
component` stays `false` until the modifier is registered.
