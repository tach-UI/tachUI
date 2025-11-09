# Workspace Alias Validator

## Purpose

This script validates that all workspace packages have proper module aliases configured in their `vitest.config.ts` files. Missing aliases cause test import failures.

## The Problem

When writing tests that import other workspace packages:

```typescript
// In packages/forms/__tests__/MyTest.test.ts
import { createSignal } from '@tachui/core'
```

Without proper Vitest configuration, you'll get:

```
Error: Failed to resolve import "@tachui/core" from "__tests__/MyTest.test.ts"
```

## The Solution

Vitest needs explicit module aliases to resolve workspace imports:

```typescript
// packages/forms/vitest.config.ts
export default defineConfig({
  resolve: {
    alias: {
      '@tachui/core': resolve(__dirname, '../core/src'),
      // ... other workspace packages
    },
  },
})
```

## Usage

### Check for missing aliases

```bash
pnpm validate:workspace-aliases
```

Output shows which packages need which aliases:

```
❌ packages/forms
   Missing 2 aliases:
      - @tachui/core
      - @tachui/registry
```

### Auto-fix missing aliases

```bash
pnpm validate:workspace-aliases:fix
```

This automatically adds missing alias entries to `vitest.config.ts` files.

## How It Works

1. **Scans test files** - Finds all `@tachui/*` imports in your test directory
2. **Checks config** - Reads `vitest.config.ts` and extracts existing aliases
3. **Validates** - Compares actual imports against configured aliases
4. **Reports** - Shows missing, incorrect, or extra aliases
5. **Auto-fixes** (optional) - Adds missing alias entries to config files

## Smart Detection

The validator only checks for packages **actually used** in your tests:

- ✅ Scans `__tests__/`, `test/`, `tests/` directories
- ✅ Extracts `from '@tachui/...'` imports from test files
- ✅ Only validates aliases for packages you import
- ✅ Skips demo apps unless explicitly imported
- ✅ Ignores packages without tests

This means you only need aliases for dependencies you actually use, not every workspace package.

## Integration with CI

Add to your CI pipeline to prevent missing alias issues:

```yaml
# .github/workflows/test.yml
- name: Validate workspace aliases
  run: pnpm validate:workspace-aliases
```

The script exits with code 1 if any aliases are missing, failing the build.

## When to Run

Run this validator when:

- ✅ Adding new workspace dependencies to tests
- ✅ Creating a new package with tests
- ✅ Getting "Failed to resolve import" errors
- ✅ Setting up CI/CD pipelines
- ✅ After merging PRs that add test dependencies

## Configuration

The script is self-contained with no configuration needed. It automatically:

- Detects workspace packages from `pnpm-workspace.yaml`
- Finds all `vitest.config.{ts,js}` files
- Determines correct relative paths
- Handles both `src/` and `dist/` directory structures

## Flags

- `--fix` - Auto-add missing aliases to config files
- `--verbose` - Show detailed package information
- (default) - Report missing aliases without modifying files

## Example Output

### Validation Pass

```
✅ packages/core (10 aliases configured)
```

### Validation Failure

```
❌ packages/forms
   Missing 3 aliases:
      - @tachui/core
      - @tachui/registry
      - @tachui/flow-control
```

### Auto-Fix

```
❌ packages/forms
   Missing 3 aliases:
      - @tachui/core
      - @tachui/registry
      - @tachui/flow-control
   🔧 Auto-fixing...
   ✅ Added 3 missing aliases
```

## Troubleshooting

### Config doesn't have `resolve.alias` section

```
❌ Cannot auto-fix: config doesn't have resolve.alias section
```

**Solution**: Manually add the `resolve.alias` structure first:

```typescript
export default defineConfig({
  test: { /* ... */ },
  resolve: {
    alias: {
      // Aliases will be added here
    },
  },
})
```

### Wrong alias paths

```
⚠️  @tachui/core: points to '../core/dist' instead of '../core/src'
```

**Solution**: Tests should import from `src/` for better debugging. Update manually:

```typescript
'@tachui/core': resolve(__dirname, '../core/src'), // ✅ Correct
'@tachui/core': resolve(__dirname, '../core/dist'), // ❌ Avoid
```

## Technical Details

- **Language**: TypeScript
- **Runtime**: tsx (TypeScript execution)
- **Dependencies**: glob, yaml (installed at workspace root)
- **Location**: `tools/validate-workspace-aliases.ts`
- **Entry point**: ES module with self-execution check

## Contributing

When adding new workspace packages:

1. Ensure package has proper exports in `package.json`
2. If package has tests, add to `vitest.config.ts`:
   - Workspace aliases for any `@tachui/*` imports
3. Run `pnpm validate:workspace-aliases` to verify
4. Commit both code and config changes together

## See Also

- [CONTRIBUTING.md](../CONTRIBUTING.md#workspace-package-aliases-in-tests) - Testing guidelines
- [pnpm-workspace.yaml](../pnpm-workspace.yaml) - Workspace configuration
- Individual package `vitest.config.ts` files
