# TachUI Upgrade Guide

This guide summarises the recommended order of operations when adopting the Phase 7 modifier tooling in existing projects.

## 1. Prepare the Workspace

1. Update dependencies to the latest TachUI packages.
2. Enable the ESLint plugin:
   ```jsonc
   {
     "plugins": ["@tachui"],
     "rules": {
       "@tachui/prefer-direct-modifiers": "warn"
     }
   }
   ```
3. Configure the runtime flags so the proxy path is available:
   ```ts
   import { tachui } from '@tachui/core'

   tachui.configure({
     proxyModifiers: true,
     legacyModifierFallback: true, // keep enabled during the transition
   })
   ```

## 2. Migrate Modifier Syntax

1. Run the CLI in dry-run mode:
   ```bash
   tacho migrate remove-modifier-trigger --pattern "src/**/*.{ts,tsx,js,jsx}" --dry-run
   ```
2. Fix or suppress any lint errors surfaced by the ESLint rule.
3. Apply the transformation (either locally or in CI with `--check`):
   ```bash
   tacho migrate remove-modifier-trigger --pattern "src/**/*.{ts,tsx,js,jsx}"
   ```

## 3. Refresh Type Information

1. Generate the latest modifier declarations:
   ```bash
   pnpm --filter @tachui/core generate-modifier-types
   ```
2. For multi-package workspaces, hydrate plugin metadata:
   ```bash
   pnpm --filter @tachui/core generate-modifier-types:monorepo -- --packages core,forms,grid
   ```
3. Commit the updated declaration and snapshot files.

## 4. Rebuild & Validate

1. Run the full type-check and build:
   ```bash
   pnpm type-check
   pnpm build
   ```
2. Execute example and demo builds (`pnpm --filter @tachui/calculator-app build`, `pnpm --filter @tachui/intro-app build`).
3. Optionally run performance benchmarks:
   ```bash
   pnpm benchmark:quick
   pnpm benchmark:browser:quick
   ```

## 5. Harden the Tooling

1. Switch the ESLint rule to `"error"` once no `.modifier` usage remains.
2. Disable the fallback flag:
   ```ts
   tachui.configure({
     proxyModifiers: true,
     legacyModifierFallback: false,
   })
   ```
3. Enable relevant security presets (`enableBasicSecurity()` or stricter) so plugin metadata warnings surface early.

## 6. Communicate the Changes

- Share the [Migration Guide](./migration-guides/swiftui-modifiers.md) with your team.
- Link to the [Modifier System API Reference](./reference/modifier-system.md) for low-level details.
- Highlight new developer docs (cloning, debugging, type generation) in release notes.

Following this sequence ensures teams move to the direct modifier path with minimal disruption while maintaining tooling coverage.
