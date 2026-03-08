# SwiftUI Modifiers Migration Guide

This guide walks through upgrading projects from the legacy `.modifier.*` chaining style to TachUI’s direct modifier syntax and metadata-driven tooling.

## Overview

| Feature | Legacy | New |
| ------- | ------ | --- |
| Syntax | `Text("Hello").modifier.padding(16)` | `Text("Hello").padding(16)` |
| Registry | Manual imports per package | Auto-registration via `@tachui/modifiers` or `register*Modifiers()` helpers |
| Types | Partial IntelliSense | Generated declaration files covering all modifiers |
| Tooling | Minimal linting | ESLint rule + CLI migration command |

## Step-by-Step Upgrade

1. **Audit usage**  
   Run the CLI command in dry-run mode to see which files still rely on `.modifier`:
   ```bash
   tacho migrate remove-modifier-trigger --pattern "src/**/*.{ts,tsx,js,jsx}" --dry-run
   ```

2. **Apply the transformation**  
   When ready, rerun without `--dry-run` (or use `--check` in CI to block regressions):
   ```bash
   tacho migrate remove-modifier-trigger --pattern "src/**/*.{ts,tsx,js,jsx}"
   ```

3. **Regenerate modifier types**  
   ```bash
   pnpm --filter @tachui/core generate-modifier-types
   ```
   Commit the updated declaration and snapshot files to keep IDEs in sync.

4. **Enable the ESLint rule**  
   ```jsonc
   {
     "plugins": ["@tachui"],
     "rules": {
       "@tachui/prefer-direct-modifiers": "warn"
     }
   }
   ```

5. **Update feature flags**  
   Configure the runtime to use the proxy by default:
   ```ts
   import { tachui } from '@tachui/core'

   tachui.configure({
     proxyModifiers: true,
     legacyModifierFallback: false,
   })
   ```
   Keep `legacyModifierFallback` enabled temporarily if you need a staged rollout.

## Before & After Examples

```ts
// Before
const card = VStack({
  spacing: 8,
  children: [
    Text('Balance').modifier.fontSize(16).fontWeight('bold').build(),
    Text('$1,200').modifier.fontSize(32).color('#2563eb').build(),
  ],
})
  .modifier.padding(20)
  .modifier.backgroundColor('#f8fafc')
  .modifier.cornerRadius(16)
  .build()

// After
const card = VStack({
  spacing: 8,
  children: [
    Text('Balance').fontSize(16).fontWeight('bold').build(),
    Text('$1,200').fontSize(32).color('#2563eb').build(),
  ],
})
  .padding(20)
  .backgroundColor('#f8fafc')
  .cornerRadius(16)
  .build()
```

## Common Migration Questions

- **Do I still need `.build()`?**  
  Yes. Builders still require an explicit `build()` to produce the final component instance—only the intermediate `.modifier` access is removed.

- **What about custom modifiers?**  
  Export them via `@tachui/modifiers` (or your plugin package) and ensure they call `registerModifierWithMetadata`. Consumers can then call them directly on components.

- **How do I handle `component.modifier` usage in code?**  
  Replace it with the direct chain. The proxy automatically exposes modifier names as properties, so `component.padding(8)` works anywhere `component.modifier.padding(8)` previously did.

- **Can I roll back?**  
  Set `legacyModifierFallback: true` and leave the ESLint rule on “warn” until your team is comfortable. Disable the flag once all `.modifier` usage is gone.

## Timeline

- **Week 1**: Run the CLI in dry-run mode, fix lint warnings, enable `proxyModifiers`.
- **Week 2**: Apply the migration, regenerate types, and monitor CI.
- **Week 3**: Disable `legacyModifierFallback`, set the ESLint rule to “error”.
- **Week 4**: Remove any helper utilities that depended on `component.modifier`.

With the migration complete, you can take advantage of richer tooling, faster modifier caches, and a smaller runtime surface.
