# Typing Modifier Chains

Modifier chain methods are typed by the module that registers them. There is no
generation step to run and no declaration file to regenerate or commit.

## How Chain Methods Are Typed

Each package that registers modifiers augments `ModifierBuilder` in
`@tachui/types/modifiers` with methods derived from its registered factories,
using `ModifierMethodsOf` (or `ModifierFactoriesOf` for the factory map
itself). A method is typed exactly when the module that registers it is loaded,
with the same parameters as its factory.

To type your own modifiers, follow
[Step 3: Add TypeScript Declarations](./guide-modifiers.md#step-3-add-typescript-declarations)
in the Modifier Implementation Guide.

## The Removed Generator

Earlier releases shipped a modifier type generator in `@tachui/core`. It could
not type chain methods — its declarations augmented an interface that
`@tachui/core` only re-exports, so nothing used them — and it has been removed
along with everything that published it:

- The `generate-modifier-types`, `generate-modifier-types:check` and
  `generate-modifier-types:monorepo` scripts.
- The `@tachui/core/modifiers/type-generator`, `@tachui/core/build-plugins`,
  `@tachui/core/build-tools`, `@tachui/core/build-plugins/modifier-types` and
  `@tachui/core/build-tools/modifier-types` subpaths, including
  `modifierTypesPlugin`.
- `generated-modifiers.d.ts` and `modifier-metadata.snapshot.json`.
- The `tachui modifier-docs conflicts` command, which read that snapshot.

If your Vite config imports `modifierTypesPlugin`, delete the import and the
plugin entry; nothing replaces it. If CI runs `generate-modifier-types --check`,
remove that step.

## Metadata Signatures

First-party modifiers still register with metadata, and the `signature` in that
metadata is derived from each factory rather than written by hand. After adding
or changing a first-party modifier factory, refresh the derived tables:

```bash
bun run --filter @tachui/core derive-modifier-signatures

# Fail when a table is stale, without writing
bun run --filter @tachui/core derive-modifier-signatures:check
```

These tables feed registry metadata for tooling such as devtools; they do not
type chain methods.
