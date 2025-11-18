# @tachui/types

Shared type definitions for the tachUI ecosystem. This package powers the strict cross-package contracts between `@tachui/core`, `@tachui/modifiers`, and every feature package while keeping runtime bundles separate.

## What lives here?

- Core runtime interfaces like `ComponentInstance`, `DOMNode`, and `Signal`
- Modifier contracts (`Modifier`, `ModifierContext`, `ModifierPriority`, etc.)
- Shared layout, gradient, and asset helper types

The package publishes `.d.ts` files plus lightweight `.js` stubs (only `ModifierPriority` exports a runtime enum), so consumers can depend on `@tachui/types` without pulling extra JavaScript into their bundles.

## Usage

You generally do not install this package directly. Instead, import the namespaces you need:

```ts
import type { Modifier, ModifierContext } from '@tachui/types/modifiers'
import type { DOMNode } from '@tachui/types/runtime'
import type { Signal } from '@tachui/types/reactive'
```

All tachUI workspace packages resolve `@tachui/types` in their `tsconfig` path maps, so TypeScript tooling has a single source of truth for framework contracts.

## Building

```
pnpm --filter @tachui/types build
```

This runs `tsc -p tsconfig.build.json` to emit declaration files and then creates the minimal `.js` stubs needed for module resolution.
