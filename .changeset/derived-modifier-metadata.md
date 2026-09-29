---
'@tachui/core': patch
'@tachui/modifiers': patch
'@tachui/devtools': patch
'@tachui/forms': patch
'@tachui/fragments': patch
'@tachui/grid': patch
'@tachui/mobile': patch
'@tachui/responsive': patch
'@tachui/viewport': patch
---

Every first-party modifier now registers with metadata, and each signature in
that metadata is derived from the factory the modifier registers rather than
written by hand. The basic, effects and preload lists in `@tachui/modifiers`
and the fragments modifiers used to register without metadata; they now go
through `registerModifierWithMetadata`. Which factory a name resolves to is
unchanged: a name already in the registry keeps its factory.

`derive-modifier-signatures` in `@tachui/core` regenerates the signature
tables; `derive-modifier-signatures:check` fails when one is stale.

The derivation builds each signature with the devtools `buildSignature`
helper. `@tachui/devtools`'s published entries are unchanged.
