# Modifier System API Reference

This reference complements the inline documentation by describing the core APIs you’ll touch when working with TachUI’s modifier infrastructure.

----

## `createComponent<T>()`

```ts
import { createComponent } from '@tachui/core/components'

const instance = createComponent(MyComponentClass, props)
```

Creates a new component instance and wires it into the lifecycle system. It ensures:

- The component receives a unique ID.
- Lifecycle hooks (`useLifecycle`) are registered.
- Modifier support can be attached later via `withModifiers`.

Use it in advanced scenarios (custom component factories, wrapper utilities). Most primitives already wrap it for you.

## `createComponentProxy()`

```ts
import { createComponentProxy } from '@tachui/core/modifiers/proxy'

const proxy = createComponentProxy(component)
```

The proxy powers direct modifier chaining. It:

- Caches modifier functions per component to avoid recreating callables.
- Ensures `.clone()` returns a proxied instance so modifiers continue to chain.
- Binds component methods to the original instance while exposing registered modifiers as properties.

> **Note**: This is considered an internal API; use it only if you are implementing custom component wrappers. Most consumers just import components from `@tachui/primitives`.

## Component Cloning

All components implement `CloneableComponent`:

```ts
const clone = component.clone()
const deepClone = component.deepClone()
```

- `clone()` copies props and modifiers, keeping child references intact.
- `deepClone()` recursively clones children, giving each clone its own modifier list.

See the [Component Cloning Guide](../guide/component-cloning.md) for patterns and best practices.

## Dual Registration Pattern

Core and plugin packages register modifiers in two passes:

1. **Factory registration** — Pure modifier functions are registered with the runtime registry.
2. **Metadata registration** — An accompanying `registerModifierWithMetadata` call records name, description, category, and priority.

Every package exposes a `register*Modifiers()` helper (e.g. `registerCoreModifiers`, `registerFormsModifiers`). Call it during startup or in HMR hooks to ensure both factories and metadata are available before rendering.

## `globalModifierRegistry`

```ts
import { globalModifierRegistry } from '@tachui/registry'

const registered = globalModifierRegistry.list()
const card = globalModifierRegistry.get('card')
```

The global registry lets you inspect or register modifiers at runtime. Use it to:

- Query existing modifiers (for tooling or analytics).
- Register temporary modifiers during development/hot reloading.
- Attach additional metadata (e.g. security tiers) without touching the original package.

Avoid writing application logic that depends on the registry contents; prefer static imports when possible.

## Type Generation CLI

Modifier types are generated via the scripts defined in `@tachui/core`:

```bash
pnpm --filter @tachui/core generate-modifier-types
pnpm --filter @tachui/core generate-modifier-types -- --check
pnpm --filter @tachui/core generate-modifier-types:monorepo -- --packages core,forms
```

- Run the generator after adding or renaming modifiers.
- Use `--check` (and optionally `--fail-on-conflict`) in CI to detect stale snapshots.
- For multi-package work, use the monorepo helper so plugin modifiers hydrate before emission.

Detailed guidance lives in the [Type Generation Workflow](../guide/type-generation.md).

## Vite Plugin Configuration

Enable TachUI’s Vite plugin in your project to get HMR safeguards and automatic metadata hydration:

```ts
import { defineConfig } from 'vite'
import tachuiPlugin from '@tachui/core/vite-plugin'

export default defineConfig({
  plugins: [
    tachuiPlugin({
      registerCoreModifiers: true,
      hmr: {
        forceReRegister: true,
      },
    }),
  ],
})
```

- `registerCoreModifiers` ensures dual registration runs before rendering.
- `forceReRegister` (default `false`) is helpful in development when editing modifier files; it calls `registerCoreModifiers({ force: true })` after every HMR update.
- Combine with the CLI migration command (`tacho migrate remove-modifier-trigger`) to keep your codebase on the direct modifier path.

## Feature Flags & Rollback

The modifier system can be toggled at runtime using feature flags:

```ts
import { tachui } from '@tachui/core'

tachui.configure({
  proxyModifiers: true,          // enable direct modifier chaining
  legacyModifierFallback: false, // disable `.modifier.*` path
})
```

- `proxyModifiers` controls whether `createComponentProxy` is enabled.
- `legacyModifierFallback` allows a staged rollout; keep it `true` in early migrations so legacy `.modifier` usage doesn’t break immediately.
- Flags live alongside other rollback switches (e.g. security presets) so you can coordinate migrations across teams.

Document the flag state in your release notes so downstream apps know when to update their own configs.
