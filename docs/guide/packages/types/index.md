---
title: '@tachui/types'
---

# @tachui/types

Shared TypeScript contracts for the TachUI ecosystem. This package exists to keep cross-package interfaces centralized while preserving tree-shaking and clean dependency boundaries.

## Why this package exists

- Avoid duplicated type definitions across `@tachui/core`, `@tachui/modifiers`, and feature packages.
- Keep runtime packages lean: this package ships declaration files plus lightweight JS stubs for module resolution.
- Provide stable import paths for shared framework contracts.

## Module breakdown

### `@tachui/types/reactive`

Reactive primitives such as signals and computed values.

```ts
import type { Signal, Accessor, Setter, Computed } from '@tachui/types/reactive'
```

### `@tachui/types/runtime`

Runtime contracts for component instances and DOM integration.

```ts
import type {
  ComponentInstance,
  DOMNode,
  CloneableComponent,
} from '@tachui/types/runtime'
```

### `@tachui/types/layout`

Layout and sizing aliases used by core and plugin packages.

```ts
import type { Alignment, LayoutDirection, SpacingValue } from '@tachui/types/layout'
```

### `@tachui/types/gradients`

Gradient model types for linear, radial, angular, and repeating definitions.

```ts
import type { GradientStop, LinearGradientValue } from '@tachui/types/gradients'
```

### `@tachui/types/assets`

Asset-system types used for color, image, and font contracts.

```ts
import type { ColorAssetLike, ImageAssetLike, FontAssetLike } from '@tachui/types/assets'
```

### `@tachui/types/modifiers`

Modifier pipeline contracts including context and animation-related props.

```ts
import type {
  Modifier,
  ModifierContext,
  AnimationModifierProps,
} from '@tachui/types/modifiers'
```

## Import migration guidance

Prefer direct `@tachui/types/*` imports instead of legacy internal paths.

```ts
// Preferred
import type { ModifierContext } from '@tachui/types/modifiers'

// Legacy (avoid in new code)
import type { ModifierContext } from '@tachui/core/modifiers/types'
```

## Runtime behavior

`@tachui/types` is intended for type imports. Type-only imports are erased at build time, so they do not add runtime code to your bundle.

```bash
pnpm add -D @tachui/types
```

[View README on GitHub](https://github.com/tach-ui/tachUI/tree/main/packages/types/README.md)
