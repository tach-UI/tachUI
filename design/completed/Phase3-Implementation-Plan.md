# Phase 3: Modifier Architecture - Final Implementation Plan

**Created:** 2025-11-14
**Decision:** Option B - Rollback and Clean Implementation (start from 16cb441 working baseline)
**Estimated Time:** 2-3 hours
**Risk Level:** LOW (working from stable baseline)
**Status:** READY FOR EXECUTION

---

## Executive Summary

### What We're Doing

**Rolling back to last working commit (`16cb441`) and implementing a clean, minimal modifier separation that enables tree-shaking.**

### Why We're Doing This

**Historical Context:**
- Previous attempts to keep modifiers in core failed tree-shaking
- ALL modifiers bundled into production builds (150KB+)
- Auto-registration side effects prevented tree-shaking
- `import *` patterns and compat layer broke static analysis

**The Problem We Solved:**
- Tree-shaking only works when there are NO side effects
- Modifiers in core had auto-registration: `if (typeof window) registerCoreModifiers()`
- This ran on ANY import of core → loaded ALL modifiers
- Separation allows explicit opt-in registration

**Evidence:**
- See `/Users/whoughton/Dev/tach-ui/design-docs/TreeShaking-Fix-Guide.md`
- Test shows monolithic vs split has identical tree-shaking IF no side effects
- Side effects are the killer - separation enables controlling them

### Why Option B (Rollback)

**Option A (Fix Current Broken State):**
- ❌ 8-12 hours of work
- ❌ Building on broken foundation
- ❌ 64 direct `new Modifier()` calls to replace
- ❌ Missing helper implementations to create
- ❌ High risk of compounding errors

**Option B (Rollback + Clean Start):**
- ✅ 2-3 hours of work
- ✅ Start from working baseline (`16cb441`)
- ✅ Simple, focused changes
- ✅ Can verify at each step
- ✅ Can stop at any checkpoint if issues arise

---

## Architecture: What Goes Where

### @tachui/core - Framework Infrastructure (includes essential modifiers)

**Purpose:** Core framework infrastructure - runtime, reactivity, component system, modifier builder

**What Stays:**
```
packages/core/src/
├── modifiers/
│   ├── base.ts              ✅ BaseModifier, LayoutModifier, AppearanceModifier classes
│   ├── builder.ts           ✅ Fluent API builder
│   ├── registry.ts          ✅ Modifier registry infrastructure
│   ├── proxy.ts             ✅ Component proxy for fluent API
│   ├── types.ts             ✅ Type definitions
│   ├── index.ts             ✅ Infrastructure exports
│   │
│   ├── alignment.ts         ✅ Core alignment modifier (used by stacks)
│   ├── corner-radius.ts     ✅ Core corner radius (common)
│   ├── opacity.ts           ✅ Core opacity (common)
│   ├── layout-priority.ts   ✅ Core layout priority (stacks need this)
│   │
│   ├── factories.ts         ✅ Helper factories (createCustomModifier, etc.)
│   ├── presets.ts           ✅ Preset collections (layoutModifiers, etc.)
│   └── core.ts              ✅ Core modifier utilities
├── runtime/
├── reactive/
├── components/
└── ...
```

**What Leaves (no compat shims):**
```
❌ background.ts           → Move to @tachui/modifiers/appearance
❌ background-color.ts     → Move to @tachui/modifiers/appearance
❌ border.ts               → Move to @tachui/modifiers/appearance
❌ css.ts                  → Move to @tachui/modifiers/utility
❌ as-html.ts              → Move to @tachui/modifiers/utility
❌ basic-sanitizer.ts      → Move to @tachui/modifiers/utility
❌ as-html-validator.ts    → Move to @tachui/modifiers/utility
```

> ⚠️  We will not keep deprecated forwarding modules in core. `@tachui/core` now exports infrastructure only, so any direct imports such as `@tachui/core/src/modifiers/as-html` are considered invalid immediately. Consumers (and our own tests/docs) must import the concrete implementations from `@tachui/modifiers/...`.

### Progress Snapshot (2025‑11‑??)

- ✅ Removed the legacy shim files (`as-html*.ts`, `basic-sanitizer.ts`, `css.ts`, `border.ts`) from `@tachui/core`. Tests and docs now reference the official package entry points (`@tachui/modifiers/utility`, `@tachui/modifiers/appearance`).
- ✅ Updated the modifier builder/types to drop any direct usage of the removed modules. The builder throws actionable errors when developers call CSS/HTML helpers without importing the modifiers package, keeping telemetry intact while preventing accidental bundling.
- ✅ Cleaned up docs (`plugin-security-guidelines.md`) and design guidance to reflect the “no shims” policy.
- ✅ Restored TypeScript health (`pnpm lint`, `pnpm type-check`) by pointing path aliases at the new package layout and ensuring the modifiers package builds before downstream projects run type-check. This confirms the circular dependency was eliminated.
- ⚠️ `pnpm -r build` currently fails because `@tachui/core` no longer emits the aggregate `dist/index.d.ts`. Packages such as `@tachui/flow-control` import `@tachui/core` during their build step and immediately hit missing declaration files. The builder now produces per-module `.d.ts`, but the top-level bundle needs to return (or we need an alternate declaration distribution strategy, e.g. a dedicated `tsconfig.types.json`).

**Next Steps (Detailed Implementation Order)**

### Step 1: 🚨 BLOCKER - Fix TypeScript Declaration Emission (URGENT)

**Problem:** Only 1 .d.ts file emitted (`dist/types/generated-modifiers.d.ts`), missing index.d.ts and all module declarations.

**Diagnosis:**
```bash
cd packages/core
tsc --project tsconfig.build.json --listEmittedFiles --verbose 2>&1 | tee tsc-output.log
# Check tsc-output.log for errors or warnings
```

**Fix Options:**
1. **Check for import errors:** Broken imports prevent declaration emission
2. **Verify include/exclude patterns:** May be excluding important files
3. **Check emitDeclarationOnly:** May need to temporarily disable to see full errors
4. **API Extractor:** Use to bundle declarations if individual emission fails

**Original proposed options:
   - Reintroduce a separate declaration build that runs directly on `src/index.ts` (similar to the previous Pre-Vite setup).
   - Use API Extractor (or TS project references) to stitch the emitted `.d.ts` files into a single bundle under `dist`.
   - Until this is done, workspace builds will remain blocked because consumers refuse to compile without those types.
2. **Finish PHASE 2 migration:** Verify every moved modifier is exported from `@tachui/modifiers` (appearance/utilities/index exports are already wired, but we should audit categories such as typography/layout to confirm there are no dangling references to the removed shims).
3. **PHASE 3 builder/registry rewrite:** With shims gone, wire the builder registry to rely on explicit preload registration (per the plan below). This work is now unblocked—no further structural changes are needed in core, so we can focus on registry behavior and preload ergonomics.

**Core Keeps "Essential" Modifiers:**
- Layout primitives (alignment, layoutPriority)
- Common appearance (opacity, cornerRadius)
- Helper APIs (factories, presets)
- Infrastructure (builder, registry, base classes)

**Rationale:**
- These are used by core components (stacks, containers)
- Very common (in >80% of apps)
- Keeping them avoids extra dependency for default stacks
- Total size: ~5-8KB and we explicitly accept the `@tachui/core → @tachui/modifiers` dependency for helper APIs (documented below)

### @tachui/modifiers - Extended Modifiers

**Purpose:** Extended modifier implementations with granular tree-shaking

**Structure:**
```
packages/modifiers/src/
├── base.ts                  # ONLY if core doesn't export (probably not needed)
├── appearance/
│   ├── background.ts        # background() modifier
│   ├── background-color.ts  # backgroundColor() modifier
│   ├── border.ts            # border() modifiers
│   └── index.ts             # Exports + optional registration
├── typography/
│   ├── font.ts
│   ├── text.ts
│   └── index.ts
├── layout/
│   ├── padding.ts
│   ├── margin.ts
│   ├── frame.ts
│   └── index.ts
├── interaction/
│   └── index.ts
├── effects/
│   ├── shadows/
│   ├── filters/
│   ├── transforms/
│   └── index.ts
├── utility/
│   ├── css.ts               # CSS modifier from core
│   ├── as-html.ts           # asHTML from core
│   ├── sanitizer.ts         # Sanitizer from core
│   └── index.ts
├── preload/
│   ├── basic.ts             # Registers layout, appearance, typography
│   ├── effects.ts           # Registers all effects
│   └── all.ts               # Registers everything
└── index.ts                 # Main entry (NO auto-registration)
```

**Critical: NO Auto-Registration in Main Export**

```typescript
// packages/modifiers/src/index.ts ✅ CORRECT
export { padding } from './layout/padding'
export { margin } from './layout/margin'
export { shadow } from './effects/shadows/shadow'
// ... etc

// NO THIS:
// if (typeof window !== 'undefined') registerAllModifiers() ❌
```

**Registration Only in Preload:**

```typescript
// packages/modifiers/src/preload/basic.ts ✅ CORRECT
import { padding } from '../layout/padding'
import { margin } from '../layout/margin'
import { globalModifierRegistry } from '@tachui/registry'

// This file HAS side effects - user explicitly imports it
globalModifierRegistry.register('padding', padding)
globalModifierRegistry.register('margin', margin)
// ...
```

### Dependency Chain

```
┌─────────────────────────────────────────┐
│  App (demos/intro)                      │
│  import '@tachui/modifiers/preload/     │
│  basic'  ← EXPLICIT                     │
│  import { Button } from '@tachui/       │
│  primitives'                            │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│  @tachui/primitives                     │
│  depends on: @tachui/core               │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│  @tachui/core                           │
│  depends on: @tachui/registry           │
│  NO dependency on @tachui/modifiers     │
│  (core modifiers live IN core)          │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  @tachui/modifiers (separate)           │
│  depends on: @tachui/core (base         │
│  classes)                               │
│              @tachui/registry           │
└─────────────────────────────────────────┘
```

**Key Points:**
- ✅ Core is self-contained for infrastructure and essentials (includes alignment/corner radius/etc.)
- ✅ Modifiers package is optional extension
- ✅ No circular dependencies (core may import modifiers for helper APIs, but modifiers never import core runtime)
- ✅ Apps explicitly import preload for modifiers registration
- ✅ Tree-shaking works (no auto-registration side effects)

---

## Implementation Plan: Step by Step

### PHASE 0: Backup and Rollback (5 min)

#### Step 0.1: Create Backup Branch

```bash
cd /Users/whoughton/Dev/tach-ui/tachUI

# Save current broken state
git add -A
git stash push -m "WIP: Broken modifier migration state"
git branch backup-phase3-broken HEAD

# Verify backup
git log --oneline backup-phase3-broken -1
```

#### Step 0.2: Rollback to Working State

```bash
# Rollback to last known working commit
git reset --hard 16cb441

# Verify we're at the right commit
git log --oneline -1
# Should show: 16cb441 box-shadow and font debugging and fixes

# Clean any untracked files
git clean -fd
```

#### Step 0.3: Verify Working State

```bash
# Install dependencies
pnpm install

# Verify builds
pnpm -r build

# Verify tests
pnpm test

# If anything fails, STOP and investigate
```

**Success Criteria:**
- ✅ All packages build successfully
- ✅ All tests pass
- ✅ Demos run without errors

---

### PHASE 1: Identify Modifiers to Move (30 min)

#### Step 1.1: Audit Core Modifiers

```bash
ls -la packages/core/src/modifiers/*.ts | grep -v "\.d\.ts"
```

**Expected output:** List of .ts files in core/modifiers

#### Step 1.2: Categorize Modifiers

Create categorization list:

```bash
cat > /tmp/modifiers-categorization.txt << 'EOF'
# KEEP IN CORE (Essential - used by core components):
- base.ts (infrastructure)
- builder.ts (infrastructure)
- registry.ts (infrastructure)
- proxy.ts (infrastructure)
- types.ts (infrastructure)
- index.ts (infrastructure)
- alignment.ts (used by stacks)
- corner-radius.ts (very common)
- opacity.ts (very common)
- layout-priority.ts (used by stacks)
- factories.ts (helper APIs)
- presets.ts (helper APIs)
- core.ts (utilities)

# MOVE TO MODIFIERS (Extended - optional features):
- background.ts (complex, not always needed)
- background-color.ts (can use backgroundColor from modifiers)
- border.ts (extended styling)
- css.ts (utility modifier)
- as-html.ts (utility modifier)
- basic-sanitizer.ts (utility modifier)
- as-html-validator.ts (utility modifier)
EOF

cat /tmp/modifiers-categorization.txt
```

#### Step 1.3: Review with User

**CHECKPOINT:** Review categorization before proceeding.

**Questions to confirm:**
1. Does this categorization make sense?
2. Should any modifiers be moved from "keep" to "move"?
3. Should any modifiers be moved from "move" to "keep"?

---

### PHASE 2: Move Selected Modifiers (45 min)

#### Step 2.1: Create Modifiers Package Structure

```bash
# Create directories
mkdir -p packages/modifiers/src/appearance
mkdir -p packages/modifiers/src/utility
mkdir -p packages/modifiers/src/preload

# Verify structure
tree packages/modifiers/src -L 2
```

#### Step 2.2: Move Appearance Modifiers

```bash
# Move files
mv packages/core/src/modifiers/background.ts packages/modifiers/src/appearance/
mv packages/core/src/modifiers/background-color.ts packages/modifiers/src/appearance/
mv packages/core/src/modifiers/border.ts packages/modifiers/src/appearance/

# Create index
cat > packages/modifiers/src/appearance/index.ts << 'EOF'
/**
 * Appearance Modifiers
 * Extended appearance modifiers beyond core essentials
 */

export * from './background'
export * from './background-color'
export * from './border'
EOF
```

#### Step 2.3: Move Utility Modifiers

```bash
# Move files
mv packages/core/src/modifiers/css.ts packages/modifiers/src/utility/
mv packages/core/src/modifiers/as-html.ts packages/modifiers/src/utility/
mv packages/core/src/modifiers/basic-sanitizer.ts packages/modifiers/src/utility/
mv packages/core/src/modifiers/as-html-validator.ts packages/modifiers/src/utility/

# Create index
cat > packages/modifiers/src/utility/index.ts << 'EOF'
/**
 * Utility Modifiers
 * Utility modifiers for CSS, HTML, and sanitization
 */

export * from './css'
export * from './as-html'
export * from './basic-sanitizer'
export * from './as-html-validator'
EOF
```

#### Step 2.4: Update Imports in Moved Files

```bash
# Find imports that reference core
grep -r "from.*@tachui/core" packages/modifiers/src/appearance/
grep -r "from.*@tachui/core" packages/modifiers/src/utility/

# Update them to reference core correctly
# (Manual step - check each file)
```

**Import patterns to fix:**

```typescript
// OLD:
import { BaseModifier } from '../base'  // ❌ Won't work in modifiers package

// NEW:
import { BaseModifier } from '@tachui/core/modifiers/base'  // ✅
```

#### Step 2.5: Create Main Index

```typescript
// packages/modifiers/src/index.ts
/**
 * TachUI Extended Modifiers
 *
 * Extended modifiers beyond core essentials.
 * Import the preload entry point to auto-register.
 *
 * @example
 * // Option 1: Import preload for auto-registration
 * import '@tachui/modifiers/preload/basic'
 *
 * // Option 2: Import specific modifiers
 * import { background } from '@tachui/modifiers/appearance'
 */

export * from './appearance'
export * from './utility'
export * from './typography'
export * from './layout'
export * from './interaction'
export * from './effects'

// NOTE: NO auto-registration here
// Users must explicitly import preload to register
```

#### Step 2.6: Create Preload Entries

```typescript
// packages/modifiers/src/preload/basic.ts
/**
 * Basic Modifiers Preload
 *
 * Imports and registers basic modifiers.
 * Import this to make modifiers available via fluent API.
 *
 * @example
 * import '@tachui/modifiers/preload/basic'
 */

import { globalModifierRegistry } from '@tachui/registry'

// Import modifiers
import * as appearance from '../appearance'
import * as layout from '../layout'
import * as typography from '../typography'

// Register each modifier
Object.entries(appearance).forEach(([name, factory]) => {
  if (typeof factory === 'function') {
    globalModifierRegistry.register(name, factory)
  }
})

Object.entries(layout).forEach(([name, factory]) => {
  if (typeof factory === 'function') {
    globalModifierRegistry.register(name, factory)
  }
})

Object.entries(typography).forEach(([name, factory]) => {
  if (typeof factory === 'function') {
    globalModifierRegistry.register(name, factory)
  }
})

// Re-export for convenience
export * from '../appearance'
export * from '../layout'
export * from '../typography'
```

---

### PHASE 3: Update Package Configuration (20 min)

#### Step 3.1: Update Modifiers package.json

```json
// packages/modifiers/package.json
{
  "name": "@tachui/modifiers",
  "version": "0.8.1-alpha",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./appearance": {
      "types": "./dist/appearance/index.d.ts",
      "import": "./dist/appearance/index.js"
    },
    "./utility": {
      "types": "./dist/utility/index.d.ts",
      "import": "./dist/utility/index.js"
    },
    "./layout": {
      "types": "./dist/layout/index.d.ts",
      "import": "./dist/layout/index.js"
    },
    "./typography": {
      "types": "./dist/typography/index.d.ts",
      "import": "./dist/typography/index.js"
    },
    "./effects": {
      "types": "./dist/effects/index.d.ts",
      "import": "./dist/effects/index.js"
    },
    "./preload/basic": {
      "import": "./dist/preload/basic.js"
    },
    "./preload/effects": {
      "import": "./dist/preload/effects.js"
    },
    "./preload/all": {
      "import": "./dist/preload/all.js"
    }
  },
  "sideEffects": [
    "./dist/preload/*.js"
  ],
  "dependencies": {
    "@tachui/core": "workspace:*",
    "@tachui/registry": "workspace:*"
  }
}
```

**Key points:**
- `sideEffects` ONLY for preload files
- Main export has NO side effects
- Granular exports for tree-shaking

#### Step 3.2: Update Modifiers Vite Config

```typescript
// packages/modifiers/vite.config.ts
import { resolve } from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        'appearance/index': resolve(__dirname, 'src/appearance/index.ts'),
        'utility/index': resolve(__dirname, 'src/utility/index.ts'),
        'layout/index': resolve(__dirname, 'src/layout/index.ts'),
        'typography/index': resolve(__dirname, 'src/typography/index.ts'),
        'effects/index': resolve(__dirname, 'src/effects/index.ts'),
        'preload/basic': resolve(__dirname, 'src/preload/basic.ts'),
        'preload/effects': resolve(__dirname, 'src/preload/effects.ts'),
        'preload/all': resolve(__dirname, 'src/preload/all.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: ['@tachui/core', '@tachui/registry'],
      output: {
        exports: 'named',
        preserveModules: false,
      },
    },
    sourcemap: true,
    minify: 'esbuild',
    target: 'es2020',
  },
})
```

#### Step 3.3: Update Core Exports

```typescript
// packages/core/src/modifiers/index.ts
/**
 * Core Modifier Infrastructure
 *
 * Exports essential modifiers and infrastructure.
 * For extended modifiers, import from @tachui/modifiers.
 */

// Infrastructure
export * from './base'
export * from './builder'
export * from './registry'
export * from './types'
export * from './proxy'

// Essential modifiers (kept in core)
export * from './alignment'
export * from './corner-radius'
export * from './opacity'
export * from './layout-priority'

// Helper APIs
export * from './factories'
export * from './presets'
export * from './core'

// NOTE: For extended modifiers (background, border, css, etc.),
// import from @tachui/modifiers
```

---

### PHASE 4: Update Demos and Tests (30 min)

#### Step 4.1: Update Demo Imports

```bash
# Find all modifier imports in demos
grep -r "from '@tachui/core/modifiers'" demos/
```

**Update pattern:**

```typescript
// OLD:
import { background } from '@tachui/core/modifiers'

// NEW (if using extended modifiers):
import '@tachui/modifiers/preload/basic'  // Auto-registers
// OR
import { background } from '@tachui/modifiers/appearance'
```

#### Step 4.2: Add Preload to Demo Entry Points

```typescript
// demos/intro/src/main.ts
import '@tachui/modifiers/preload/basic'   // Register basic modifiers
import '@tachui/modifiers/preload/effects' // Register effects

// Rest of app code
import { createIntroAssets } from './assets/IntroAssets'
// ...
```

#### Step 4.3: Update Test Imports

```bash
# Find test imports
grep -r "from '@tachui/core/modifiers'" packages/*/test packages/*/__tests__
```

**Update tests to:**
1. Import from `@tachui/modifiers` if using extended modifiers
2. Add preload import to test setup if needed

```typescript
// packages/core/test/setup.ts
import '@tachui/modifiers/preload/basic'  // Ensure modifiers registered for tests
import '@tachui/modifiers/preload/effects'
```

---

### PHASE 5: Build and Verify (20 min)

#### Step 5.1: Build Modifiers Package

```bash
pnpm -F @tachui/modifiers build

# Verify build output
ls -lh packages/modifiers/dist/
```

**Expected:**
- ✅ `dist/index.js` - main export
- ✅ `dist/appearance/index.js`
- ✅ `dist/utility/index.js`
- ✅ `dist/preload/basic.js`
- ✅ `.d.ts` files for all

#### Step 5.2: Build Core Package

```bash
pnpm -F @tachui/core build

# Should build successfully
```

#### Step 5.3: Build All Packages

```bash
pnpm -r build

# All should succeed
```

#### Step 5.4: Run Tests

```bash
pnpm test

# All tests should pass
```

#### Step 5.5: Verify Demos

```bash
# Start intro demo
pnpm -F @tachui/demo-intro dev

# Manually verify:
# - App loads without errors
# - Modifiers work (padding, background, etc.)
# - Console has no errors
```

---

### PHASE 6: Verify Tree-Shaking (15 min)

#### Step 6.1: Create Test App

```typescript
// /tmp/test-treeshaking-app.ts
import '@tachui/modifiers/preload/basic'  // Only basic, not effects
import { Button } from '@tachui/primitives'

Button("Test").padding(16).opacity(0.8)
// Should NOT include shadow/blur/transform modifiers
```

#### Step 6.2: Build Test App

```bash
cd /Users/whoughton/Dev/tach-ui/tachUI/demos/intro
cp src/main.ts src/main.ts.backup
cat > src/main-test.ts << 'EOF'
import '@tachui/modifiers/preload/basic'
import { Button } from '@tachui/primitives'

document.body.appendChild(
  Button("Test").padding(16).opacity(0.8).asHTML()
)
EOF

# Build
pnpm build

# Check bundle size
ls -lh dist/assets/*.js
```

#### Step 6.3: Verify Bundle Contents

```bash
# Search for modifier names in bundle
grep -o "shadow\|blur\|transform" dist/assets/*.js | wc -l

# Should be 0 or very low (only if used in other code)
```

**Success Criteria:**
- ✅ Bundle includes padding, opacity (from basic preload)
- ✅ Bundle does NOT include shadow, blur, transform (from effects)
- ✅ Tree-shaking worked

---

### PHASE 7: Tests & Documentation Alignment (45 min)

Once the code/build is stable post-rollback, we must reapply the newer documentation and test expectations that were added after `16cb441`.

#### Step 7.1: Update Tests for Preload Workflow

- Identify suites that previously assumed auto-registration (especially `packages/core/__tests__/modifiers/modifier-system.test.ts`, demo tests, and any builder-related suites).
- Add explicit `import '@tachui/modifiers/preload/basic'` (or the relevant preload) at the top of those tests before creating components.
- Ensure new tests cover both explicit preload usage and the opt-in effects preload.
- Rerun targeted suites after each update (`pnpm -F @tachui/core test`, `pnpm -F @tachui/modifiers test`, etc.).

#### Step 7.2: Update Documentation and READMEs

- Search for documentation snippets importing from `@tachui/core/modifiers/*` or relying on implicit registration (e.g., under `docs/guide/**`, `docs/api-reference/**`, package READMEs, demo READMEs).
- Update code examples to either import individual modifiers from `@tachui/modifiers` or to explain the preload pattern (`import '@tachui/modifiers/preload/basic'`).
- Add a migration note highlighting the new requirement to import preload modules for auto-registration.
- Ensure package READMEs (`packages/core/README.md`, `packages/modifiers/README.md`) explain the architecture and when to import from each package.

#### Step 7.3: Re-run Full Test & Docs Build

- `pnpm test`
- `pnpm -F docs build` (or the corresponding docs build command)
- Confirm there are no warnings about missing imports in docs examples.

---

## Success Criteria Checklist

### Build Success
- [ ] `pnpm -F @tachui/modifiers build` succeeds
- [ ] `pnpm -F @tachui/core build` succeeds
- [ ] `pnpm -r build` succeeds (all packages)
- [ ] No TypeScript errors
- [ ] Correct dist structure in modifiers package

### Runtime Success
- [ ] Demos run without errors
- [ ] Modifiers work (padding, opacity, etc.)
- [ ] Extended modifiers work (background, border)
- [ ] No console errors or warnings

### Test Success
- [ ] `pnpm test` passes all tests
- [ ] No import errors
- [ ] Modifier registration works in tests
- [ ] `pnpm -F docs build` (or the docs build command) succeeds after snippet updates

### Tree-Shaking Success
- [ ] Test app using only basic modifiers has small bundle
- [ ] Effects not in bundle when not imported
- [ ] Bundle analyzer shows proper tree-shaking

### Architecture Success
- [ ] Core has no runtime dependency on modifiers package
- [ ] Modifiers package depends on core (for base classes)
- [ ] No circular dependencies
- [ ] Clear separation maintained

---

## Rollback Plan (If Issues Arise)

At any point, if issues arise:

```bash
# Restore from backup
git reset --hard backup-phase3-broken
git stash pop  # If you want the WIP changes back

# Or go back to original working state
git reset --hard 16cb441
git clean -fd
pnpm install
pnpm -r build
```

---

## Post-Implementation

### Documentation Updates

1. Update `/Users/whoughton/Dev/tach-ui/design-docs/ModifierConsolidation.md`:
   - Mark Phase 3 as complete
   - Document final architecture
   - Add tree-shaking verification results

2. Create migration guide for users:
   - How to import extended modifiers
   - Preload patterns
   - Tree-shaking best practices

### Metrics to Capture

```bash
# Bundle sizes
ls -lh packages/core/dist/index.js
ls -lh packages/modifiers/dist/index.js

# Test app bundles
ls -lh demos/intro/dist/assets/*.js

# Document in Phase3-Results.md
```

---

## Why This Plan Will Work

### Lessons from Previous Failure

**What went wrong before:**
- ❌ Auto-registration side effects in core
- ❌ `import * from '@tachui/modifiers'` in compat layer
- ❌ Barrel exports with side effects
- ❌ No clear control over what gets loaded

**What's different now:**
- ✅ NO auto-registration in main exports
- ✅ Explicit named exports only
- ✅ Preload files for opt-in registration
- ✅ `sideEffects` array in package.json
- ✅ User controls what loads

### Technical Guarantees

1. **No Side Effects in Main Export:**
   - `packages/modifiers/src/index.ts` only has `export` statements
   - No `if (typeof window)` blocks
   - No global registration

2. **Explicit Preload:**
   - User imports `@tachui/modifiers/preload/basic` explicitly
   - Only then does registration happen
   - Clear and controllable

3. **Package.json Configuration:**
   - `"sideEffects": ["./dist/preload/*.js"]`
   - Tells bundler: everything else is tree-shakeable
   - Bundler can safely eliminate unused exports

4. **Clean Dependency Chain:**
   - Core self-contained (essential modifiers included)
   - Modifiers optional (extended features)
   - No circular dependencies

---

**Ready to execute? Confirm and I'll begin with Phase 0.**
