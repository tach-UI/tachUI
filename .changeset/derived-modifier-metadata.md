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

`generate-modifier-types` in `@tachui/core` derives the signature tables first,
then hydrates every registering package and writes a populated
`generated-modifiers.d.ts` and metadata snapshot, 283 modifiers where both were
empty before. `--check` now passes when nothing but the timestamp, the registry
instance or the package versions differ, and fails when a table, the
declaration or the snapshot is stale.

The derivation builds each signature with the devtools `buildSignature`
helper. `@tachui/devtools`'s published entries are unchanged.
