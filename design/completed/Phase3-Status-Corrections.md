# Phase 3 Status Corrections - 2025-11-15

## Actual Current State

### What's Actually Done
- ✅ Legacy shim files deleted from core (as-html, css, border, sanitizer)
- ✅ Files moved to `packages/modifiers/src/utility/`
- ✅ TypeScript type-checking passes for core package
- ✅ Vite build succeeds, JavaScript output works

### What's Broken
- ❌ **Declaration file emission COMPLETELY BROKEN**
  - Only 1 .d.ts file emitted: `dist/types/generated-modifiers.d.ts`
  - NO `dist/index.d.ts`
  - NO `dist/modifiers/*.d.ts`
  - NO `dist/runtime/*.d.ts`
  - **Root cause:** `tsc --project tsconfig.build.json` not working properly

- ❌ **Workspace build fails**
  - `@tachui/flow-control` and other packages can't find type declarations
  - Error: "Could not find a declaration file for module '@tachui/core'"

### Current State vs Document

**Document says:** "Rollback to 16cb441"
**Reality:** Code is in partially migrated state (Phase 2 partially complete)

## Immediate Fix Required

### Fix TypeScript Declaration Output

**Problem:** `tsconfig.build.json` has `emitDeclarationOnly: true` but declarations aren't being written.

**Diagnosis needed:**
```bash
cd packages/core
tsc --project tsconfig.build.json --listEmittedFiles
```

This will show what tsc is actually emitting.

**Possible causes:**
1. tsc encountering errors and failing silently
2. Output directory configuration issue
3. Include/exclude patterns excluding important files
4. Module resolution issues preventing emission

**Fix options:**

**Option A:** Check tsc output directly
```bash
cd packages/core
rm -rf dist
tsc --project tsconfig.build.json --verbose
# Look for errors or warnings
```

**Option B:** Temporarily disable emitDeclarationOnly to see all errors
```json
// tsconfig.build.json
{
  "emitDeclarationOnly": false,  // Temporarily
}
```

**Option C:** Use separate declaration build
```json
// package.json
{
  "scripts": {
    "build": "rm -rf dist && vite build && tsc -p tsconfig.build.json --listEmittedFiles"
  }
}
```

## Guardrails for Modifier Duplication

To prevent confusion between core modifiers and modifiers package modifiers:

### 1. Naming Convention Guardrail

**Rule:** Core modifiers use "Essential" prefix in comments/docs

```typescript
// packages/core/src/modifiers/alignment.ts
/**
 * @essential
 * Alignment Modifier - CORE ESSENTIAL
 * Kept in core because used by Stack/ZStack components
 */
```

**Rule:** Modifiers package uses clear category structure

```typescript
// packages/modifiers/src/appearance/background.ts
/**
 * @category Appearance
 * @package @tachui/modifiers
 * Background Modifier - EXTENDED FEATURE
 */
```

### 2. Export Guardrail

**Create central modifier registry:**

```typescript
// packages/core/src/modifiers/essential-manifest.ts
/**
 * Manifest of Essential Modifiers in Core
 *
 * These modifiers MUST stay in core:
 * - Used by core components (stacks, containers)
 * - Critical for basic layout
 * - Very high usage (>80% of apps)
 */
export const ESSENTIAL_MODIFIERS = [
  'alignment',
  'cornerRadius',
  'opacity',
  'layoutPriority',
] as const

export type EssentialModifier = typeof ESSENTIAL_MODIFIERS[number]
```

**Lint rule:** Prevent accidental duplication

```typescript
// eslint-plugin-tachui/no-duplicate-modifiers.ts
/**
 * Prevents modifiers from existing in both core and modifiers package
 */
import { ESSENTIAL_MODIFIERS } from '@tachui/core/modifiers/essential-manifest'

export function checkNoDuplicateModifiers(modifiersPackageExports) {
  const duplicates = modifiersPackageExports.filter(name =>
    ESSENTIAL_MODIFIERS.includes(name)
  )

  if (duplicates.length > 0) {
    throw new Error(
      `Duplicate modifiers found in @tachui/modifiers: ${duplicates.join(', ')}. ` +
      `These are essential modifiers that must only exist in @tachui/core.`
    )
  }
}
```

### 3. Test Guardrail

```typescript
// packages/modifiers/__tests__/no-duplicates.test.ts
import { describe, it, expect } from 'vitest'
import { ESSENTIAL_MODIFIERS } from '@tachui/core/modifiers/essential-manifest'
import * as modifiersPackage from '../src/index'

describe('Modifier Duplication Prevention', () => {
  it('should not export any essential modifiers from modifiers package', () => {
    const modifiersExports = Object.keys(modifiersPackage)
    const duplicates = modifiersExports.filter(name =>
      ESSENTIAL_MODIFIERS.includes(name as any)
    )

    expect(duplicates).toEqual([])
  })

  it('modifiers package should only have extended modifiers', () => {
    const modifiersExports = Object.keys(modifiersPackage)

    // Ensure we're not accidentally including core infrastructure
    const infraExports = modifiersExports.filter(name =>
      ['BaseModifier', 'ModifierBuilder', 'globalModifierRegistry'].includes(name)
    )

    expect(infraExports).toEqual([]) // These should only come from core
  })
})
```

### 4. Documentation Guardrail

**README.md in both packages:**

```markdown
## @tachui/core/modifiers

Essential modifiers that ship with core:
- `alignment` - Used by stacks
- `cornerRadius` - Very common
- `opacity` - Very common
- `layoutPriority` - Used by stacks

**For all other modifiers, use @tachui/modifiers**

## @tachui/modifiers

Extended modifiers for advanced features:
- Appearance (background, border, filters)
- Effects (shadows, transforms, blur)
- Typography (advanced font features)
- Utility (CSS, HTML, sanitization)

**Do not duplicate essential modifiers from core**
```

### 5. Build-Time Verification

```typescript
// packages/modifiers/scripts/verify-no-duplicates.ts
import fs from 'fs'
import path from 'path'

const ESSENTIAL_MODIFIERS = ['alignment', 'cornerRadius', 'opacity', 'layoutPriority']

const modifierFiles = fs.readdirSync(path.join(__dirname, '../src'), { recursive: true })
  .filter(file => file.endsWith('.ts'))

const violations = modifierFiles.filter(file => {
  const basename = path.basename(file, '.ts')
  return ESSENTIAL_MODIFIERS.includes(basename)
})

if (violations.length > 0) {
  console.error('ERROR: Found duplicate essential modifiers:')
  violations.forEach(file => console.error(`  - ${file}`))
  process.exit(1)
}
```

Add to package.json:
```json
{
  "scripts": {
    "prebuild": "node scripts/verify-no-duplicates.ts"
  }
}
```

## Summary

**Current State:** Partially migrated, declaration build broken
**Critical Fix:** Restore TypeScript declaration emission
**Guardrails:** Manifest, tests, lint rules, build verification to prevent duplication
**Next:** Fix declaration build, THEN decide whether to continue or rollback
