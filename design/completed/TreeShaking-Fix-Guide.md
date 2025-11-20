# Tree-Shaking Fix Guide: Why Separation Works

**Problem:** Modifiers in core bundled ALL modifiers into production builds
**Root Cause:** Side effects, auto-registration, and `import *` patterns
**Solution:** Separate packages with explicit exports

---

## Why Tree-Shaking Failed in Core

### Issue 1: Side-Effect Auto-Registration

```typescript
// packages/core/src/modifiers/index.ts (OLD - BROKEN)
if (typeof window !== 'undefined') {
  registerCoreModifiers()  // ← This runs on ANY import
}
```

**Problem:** Importing ANYTHING from core triggers registration of ALL modifiers

**Even this would load everything:**
```typescript
import { Button } from '@tachui/primitives'
// → primitives imports core
// → core runs registerCoreModifiers()
// → ALL modifiers loaded into bundle ❌
```

### Issue 2: Barrel Export with Side Effects

```typescript
// packages/core/src/modifiers/compat.ts (OLD - BROKEN)
import * as ModernModifiers from '@tachui/modifiers'

export const { fontSize, padding, ...ALL_50_MODIFIERS } = ModernModifiers
```

**Problem:** `import *` prevents tree-shaking

**Bundler sees:**
```javascript
// Bundler can't tree-shake because:
1. import * loads entire module
2. Destructuring is runtime operation
3. Can't statically analyze what's used
```

### Issue 3: Complete Bundle Re-Exports

```typescript
// packages/core/src/bundles/complete.ts (OLD - PROBLEMATIC)
export * from '../index.js'
```

**Problem:** Main entry point includes complete bundle, modifiers get pulled in

---

## How Separation Fixes Tree-Shaking

### Pattern 1: Explicit Named Exports (No Side Effects)

```typescript
// packages/modifiers/src/layout/padding.ts ✅
import { BaseModifier } from '../base'
import { globalModifierRegistry } from '@tachui/registry'

export class PaddingModifier extends BaseModifier {
  // implementation
}

export function padding(value: number) {
  return new PaddingModifier({ value })
}

// ⚠️ NO auto-registration here - explicit import required
```

```typescript
// packages/modifiers/src/index.ts ✅
// Explicit named exports only - no side effects
export { padding, PaddingModifier } from './layout/padding'
export { margin, MarginModifier } from './layout/margin'
export { fontSize, FontSizeModifier } from './typography/font-size'
// ... etc
```

**Why this works:**
- No `import *` - each export is explicit
- No auto-registration - user controls what loads
- Bundler can statically analyze and eliminate unused exports

### Pattern 2: Opt-In Registration

```typescript
// packages/modifiers/src/preload/basic.ts ✅
// User explicitly imports THIS to register basic modifiers
import { padding } from '../layout/padding'
import { margin } from '../layout/margin'
import { globalModifierRegistry } from '@tachui/registry'

// Register on import (user chose to load this)
globalModifierRegistry.register('padding', padding)
globalModifierRegistry.register('margin', margin)
```

**User code:**
```typescript
// App only needs padding
import '@tachui/modifiers/preload/basic'  // Loads padding, margin, etc.
import { Button } from '@tachui/primitives'

Button("Hi").padding(16)  // Works, but shadow/blur NOT in bundle ✅
```

### Pattern 3: Package.json Side Effects

```json
// packages/modifiers/package.json ✅
{
  "sideEffects": [
    "./dist/preload/*.js"  // Only preload files have side effects
  ]
}
```

**Why this works:**
- Tells bundler: main exports are side-effect free
- Only preload imports trigger registration
- User controls what gets loaded

---

## Proof: Why This Works

### Test Case 1: App Uses Only Padding

```typescript
// app.ts
import '@tachui/modifiers/preload/basic'  // Registers: padding, margin, frame
import { Button } from '@tachui/primitives'

Button("Hi").padding(16)
```

**Bundle includes:**
- ✅ Core infrastructure (~15KB)
- ✅ Padding modifier (~1KB)
- ✅ Margin modifier (~1KB) - came with basic preload
- ✅ Frame modifier (~1KB) - came with basic preload
- ❌ Shadow modifier (NOT imported, tree-shaken out)
- ❌ Blur modifier (NOT imported, tree-shaken out)
- ❌ 50+ other modifiers (tree-shaken out)

**Total: ~18KB instead of 150KB** ✅

### Test Case 2: App Uses Padding + Shadow

```typescript
// app.ts
import '@tachui/modifiers/preload/basic'    // Registers: padding, margin, frame
import '@tachui/modifiers/preload/shadows'  // Registers: shadow, dropShadow, textShadow
import { Button } from '@tachui/primitives'

Button("Hi").padding(16).shadow({ radius: 4 })
```

**Bundle includes:**
- ✅ Core infrastructure (~15KB)
- ✅ Basic modifiers (~3KB) - from basic preload
- ✅ Shadow modifiers (~5KB) - from shadows preload
- ❌ Filter modifiers (NOT imported)
- ❌ Transform modifiers (NOT imported)

**Total: ~23KB instead of 150KB** ✅

---

## Why Keeping in Core Failed

### The Problem Pattern

```typescript
// packages/core/src/index.ts (WHEN MODIFIERS IN CORE)
export * from './modifiers'  // ← Exports everything

// packages/core/src/modifiers/index.ts
export * from './padding'
export * from './margin'
export * from './shadows'
export * from './filters'
// ... 50+ more

// Plus auto-registration:
if (typeof window !== 'undefined') {
  registerAllModifiers()  // ← Runs on ANY core import
}
```

**Result:**
```typescript
// App code:
import { Button } from '@tachui/primitives'

// What actually happens:
// 1. primitives imports @tachui/core
// 2. core/index.ts executes
// 3. Auto-registration runs
// 4. ALL modifiers get loaded into bundle
// 5. Tree-shaking can't help - side effects already ran
```

### Why Separation Works

```typescript
// packages/core/src/index.ts (INFRASTRUCTURE ONLY)
export * from './runtime'
export * from './reactive'
export { ModifierBuilder } from './modifiers/builder'
export { globalModifierRegistry } from '@tachui/registry'
// NO modifier implementations exported
// NO auto-registration

// Separate package:
// packages/modifiers/src/index.ts (IMPLEMENTATIONS ONLY)
export { padding } from './layout/padding'  // Individual exports
export { margin } from './layout/margin'
// NO auto-registration in main export
// User must explicitly import preload to register
```

**Result:**
```typescript
// App code:
import '@tachui/modifiers/preload/basic'  // EXPLICIT choice to load basic
import { Button } from '@tachui/primitives'

Button("Hi").padding(16)

// What actually happens:
// 1. primitives imports @tachui/core (infrastructure only)
// 2. App imports preload/basic (registers padding, margin, frame)
// 3. Shadow/blur/transform never imported
// 4. Tree-shaking removes unused modifiers ✅
```

---

## Configuration Checklist

### ✅ Modifiers Package Must Have:

```json
// packages/modifiers/package.json
{
  "sideEffects": [
    "./dist/preload/*.js"  // Only preload has side effects
  ],
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./preload/basic": "./dist/preload/basic.js",
    "./preload/effects": "./dist/preload/effects.js",
    "./layout": "./dist/layout/index.js",
    "./appearance": "./dist/appearance/index.js"
  }
}
```

### ✅ Build Config Must Have:

```javascript
// packages/modifiers/vite.config.ts
export default defineConfig({
  build: {
    lib: {
      entry: {
        index: './src/index.ts',          // Main export (no side effects)
        'preload/basic': './src/preload/basic.ts',     // Registration
        'preload/effects': './src/preload/effects.ts', // Registration
        'layout/index': './src/layout/index.ts',       // Category
      }
    },
    rollupOptions: {
      output: {
        preserveModules: false,  // Bundle for optimization
        exports: 'named',
      }
    }
  }
})
```

### ✅ Core Package Must NOT:

```typescript
// ❌ DON'T DO THIS:
export * from '@tachui/modifiers'  // Pulls in everything
import * as Modifiers from '@tachui/modifiers'  // Prevents tree-shaking

// ✅ DO THIS:
// Only import types (tree-shakeable)
import type { Modifier, ModifierFactory } from '@tachui/modifiers'

// Import implementations only in builder (where actually used)
import { padding, margin } from '@tachui/modifiers'  // Specific imports
```

---

## Summary: Why Separation Is Necessary

**With modifiers in core:**
- ❌ Auto-registration runs on any core import
- ❌ Side effects prevent tree-shaking
- ❌ Bundle includes ALL modifiers always
- ❌ No way to opt-out of unused modifiers

**With modifiers separate:**
- ✅ User explicitly imports preload (or not)
- ✅ No side effects in main exports
- ✅ Bundle includes only imported modifiers
- ✅ Tree-shaking works as expected
- ✅ ~40KB savings for apps using basic modifiers only

**The separation isn't about package boundaries - it's about controlling side effects and enabling tree-shaking.**

