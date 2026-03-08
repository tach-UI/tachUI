# Type Generation Workflow

TachUI ships a dedicated type-generation pipeline so IDEs and CI always see up-to-date modifier signatures. This guide explains the commands to run, how to integrate them into workflows, and how to keep generated files in sync across the monorepo.

## Why Type Generation Matters

- **Accurate IntelliSense** – Generated declaration files (for example, `packages/core/src/types/generated-modifiers.d.ts`) expose modifier signatures directly to editors.
- **Safer refactors** – The generator validates new or renamed modifiers against registry metadata, catching conflicts before runtime.
- **Consistent plugins** – Feature packages (`@tachui/forms`, `@tachui/responsive`, etc.) rely on the same pipeline to contribute their modifiers to shared type snapshots.

## Core Commands

All commands run from the repo root and rely on the scripts defined in `packages/core/package.json`.

```bash
# Regenerate modifier types for core (recommended after adding/modifying modifiers)
pnpm --filter @tachui/core generate-modifier-types

# Validate without writing changes (ideal for CI)
pnpm --filter @tachui/core generate-modifier-types -- --check

# Fail CI when conflicts are detected
pnpm --filter @tachui/core generate-modifier-types -- --check --fail-on-conflict

# Watch mode during active development
pnpm --filter @tachui/core generate-modifier-types -- --watch
```

### Monorepo Packages

When working on feature packages, pass the package list to the monorepo helper:

```bash
pnpm --filter @tachui/core generate-modifier-types:monorepo -- --packages core,forms,grid
```

This hydrates metadata from each package’s `register*Modifiers()` helper before emitting the combined type snapshot.

## Keeping CI Fast

1. **Leverage `--check` in pipelines.** Add a step before `pnpm build` to ensure type snapshots are current.
2. **Cache VitePress output.** The generator emits deterministic files, so CI caches stay valid as long as modifiers do not change.
3. **Fail fast on conflicts.** The `--fail-on-conflict` flag surfaces duplicated names or category collisions produced by `registerModifierWithMetadata`.

## Working With Generated Files

- Generated files contain a header explaining how to regenerate them. Do not hand-edit these files—run the command instead.
- The generator validates that every modifier is registered with metadata (name, description, category). Missing metadata results in warnings flagged as part of the CLI output.
- After regeneration, re-run `pnpm type-check` so downstream packages pick up the refreshed declarations.

## IDE Integration Checklist

| Task | Why it matters |
| ---- | -------------- |
| Add `pnpm --filter @tachui/core generate-modifier-types -- --watch` to your dev shell | Keeps local type declarations in sync while editing modifiers. |
| Run `pnpm --filter @tachui/core generate-modifier-types -- --check` before committing | Prevents stale declaration files from landing in git. |
| Use the monorepo command when touching feature packages | Ensures plugin modifiers appear in the core declaration map. |
| Pair with the ESLint rule (`@tachui/prefer-direct-modifiers`) | Guarantees code and types evolve together toward direct modifier calls. |

## Troubleshooting

- **“Snapshot is stale” warnings** – Run the generator; stale snapshots usually mean a modifier signature changed without re-running the command.
- **Conflicting modifier names** – Resolve the conflict by renaming the modifier or adjusting its priority/metadata before regenerating.
- **Missing metadata logs** – Ensure the package’s `register*Modifiers()` invokes `registerModifierWithMetadata` with the full descriptor.

For additional details on metadata fields and registry behaviour, see the [Modifier Type Generation deep dive](./modifier-type-generation.md).
