# Modifier Type Generation

TachUI ships tooling that keeps the fluent modifier chain API in sync with the
registry metadata. This page explains when to run the generator, how to wire it
into CI, and the options available for multi-package workspaces.

## When to Regenerate

You **must** regenerate modifier declarations whenever you:

- Add, remove, or rename a modifier
- Update modifier metadata (description, category, priority, signature)
- Introduce a new plugin that registers modifiers

Regeneration writes two files inside each package:

- `src/types/generated-modifiers.d.ts` &mdash; declaration merge that augments
  `ModifierBuilder` and `ModifiableComponent`
- `src/types/modifier-metadata.snapshot.json` &mdash; machine-readable snapshot
  used by CLI tooling (e.g., conflict reporting)

Both files should be committed when they change.

## Core Commands

From the repository root:

```bash
pnpm --filter @tachui/core generate-modifier-types

# Verify that declarations are up to date (CI-friendly)
pnpm --filter @tachui/core generate-modifier-types -- --check

# Treat conflicts as build failures
pnpm --filter @tachui/core generate-modifier-types -- --check --fail-on-conflict
```

### Watching During Development

The generator can watch source files and re-emit declarations on change:

```bash
pnpm --filter @tachui/core generate-modifier-types -- --watch
```

This is useful when you are iterating on modifier signatures or metadata and
want instant feedback from the declaration file/IDE.

### Monorepo Generation

To regenerate multiple packages in a single pass, use the monorepo helper:

```bash
# Generates types for the core, forms, and navigation packages
pnpm --filter @tachui/core generate-modifier-types:monorepo -- --packages core,forms,navigation
```

You can append `--fail-on-conflict` to the monorepo script as well.

### Why this script lives in `@tachui/core`

The generator ships with `@tachui/core` because it produces and verifies the
type declarations that the core package publishes. Keeping the script colocated
avoids cross-package dependency loops (for example, pulling the CLI into the
core build) and guarantees the generator always runs against the same registry
implementation and metadata that the core package uses at build time.

## Vite Integration

Projects that run a Vite build (or dev server) can let the toolchain manage
type generation automatically via the bundled plugin:

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import { modifierTypesPlugin } from '@tachui/core/build-plugins'

export default defineConfig({
  plugins: [
    modifierTypesPlugin({
      // Optional: fail the build if conflicts are detected
      failOnConflict: true,
      // Optional: provide additional hydrators if you register modifiers outside core/modifiers/devtools
      extraHydrators: ['../my-plugin/src/metadata.ts'],
    }),
  ],
})
```

The plugin regenerates declarations on `buildStart` and during Vite’s file
watcher cycle. Debouncing is built in to avoid excessive regeneration.

## Hydrators and Metadata Sources

The generator hydrates metadata from several sources:

1. `@tachui/modifiers` &mdash; runtime modifier factories (`registerModifiers`)
2. `@tachui/devtools` &mdash; detailed modifier signatures, descriptions, and categories (`registerModifierMetadata`)
3. Extra modules specified via the environment variable `TACHUI_TYPEGEN_HYDRATORS`
   or the `extraModules`/`extraHydrators` options in the CLI and Vite plugin

If you ship a custom package that registers modifiers, expose a function similar
to `registerModifierMetadata` and add it via `TACHUI_TYPEGEN_HYDRATORS` (CLI)
or `extraHydrators` (Vite plugin).

When metadata lives outside the workspace paths the generator hydrates by
default, you can explicitly point to the module:

```bash
TACHUI_TYPEGEN_HYDRATORS=../../apps/demo/src/register-modifiers.ts \
  pnpm --filter @tachui/core generate-modifier-types
```

Multiple hydrators can be supplied by comma separating the paths.

## Conflict Handling

When two plugins register metadata for the same modifier name **with the same
priority**, the generator records a conflict. By default, conflicts produce a
warning alongside the JSON snapshot. To hard fail:

```bash
pnpm --filter @tachui/core generate-modifier-types -- --fail-on-conflict
```

or specify `failOnConflict: true` in the Vite plugin options.

## Troubleshooting

- **“stale files” during `--check`**  
  Run `pnpm --filter @tachui/core generate-modifier-types` to refresh files
  before re-running `--check`.

- **“module not found” errors**  
  Ensure you are running the commands from the repository root (the generator
  relies on workspace-relative path aliases).

- **“Total modifiers: 0” in the summary**  
  No metadata hydrators executed before `generateModifierTypes()` ran. Confirm
  `@tachui/modifiers` and `@tachui/devtools` are available or supply hydrator
  paths via `TACHUI_TYPEGEN_HYDRATORS`.

- **Types not updating in the IDE**  
  Confirm the generated `.d.ts` file is included in your editor’s TypeScript
  project. After regeneration, reload the editor window if necessary.

- **Conflicts reported unexpectedly**  
  Inspect `src/types/modifier-metadata.snapshot.json` to find the conflicting
  plugins. Adjust priority ordering or rename modifiers to avoid collisions.
