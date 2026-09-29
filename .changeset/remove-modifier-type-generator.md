---
'@tachui/core': patch
'@tachui/cli': patch
---

The modifier type generator is removed. Its declarations augmented an interface
that `@tachui/core` only re-exports, so they never typed a chain method; chain
methods are typed by each registering package's `ModifierBuilder` augmentation.

Breaking: the `@tachui/core/modifiers/type-generator`,
`@tachui/core/build-plugins`, `@tachui/core/build-tools`,
`@tachui/core/build-plugins/modifier-types` and
`@tachui/core/build-tools/modifier-types` subpaths are gone, and with them
`modifierTypesPlugin`. The `generate-modifier-types` scripts, the committed
`generated-modifiers.d.ts` and metadata snapshot, and the
`tachui modifier-docs conflicts` command, which read that snapshot, are removed
too. Type custom modifiers by augmenting `ModifierBuilder` in
`@tachui/types/modifiers`.
