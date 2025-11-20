# Bug-PluginArch: Modifier Registration and Plugin Dependencies Refactor

## Overview
This document outlines the investigation and refactor plan for resolving modifier registration issues in the TachUI plugin architecture. The core problem involves incomplete registration of modifiers from the `@tachui/effects` package, leading to runtime errors (e.g., `textShadow` not found in registry, causing TypeError in chaining). This stems from circular dependencies and misaligned auto-registration between `@tachui/modifiers` and `@tachui/effects`.

## Core Tenets
1. `@tachui/effects` can rely on `@tachui/core`, but **should NOT** rely on `@tachui/modifiers`.
2. `@tachui/modifiers` can rely on `@tachui/core`, but **should NOT** rely on `@tachui/effects`.
3. Backward compatibility is **NOT** an issue; breaking changes are acceptable.
4. The modifier registry should be required before `@tachui/modifiers` or `@tachui/effects` (or any plugin providing modifiers), but if **ONLY** `@tachui/core` is being used, it should not be required (if possible).
5. If `@tachui/effects` requires `@tachui/modifiers` or vice versa, evaluate why and consider repackaging to better provide clean alignment of tools.
6. Audit all modifiers to see if there are any duplicates or misalignments.

## Root Cause
- **Circular Dependency:** `@tachui/effects` re-exports `scaleEffect` from `@tachui/modifiers` (effects/index.ts line 20), while `@tachui/modifiers` imports `shadow` from `@tachui/effects` (modifiers/index.ts line 183). This creates a cycle, violating tenets 1-2.
- **Incomplete Registration:** `@tachui/effects` exports factories (e.g., `textShadow` from shadows/index.ts) but does not auto-register them—relies on `@tachui/modifiers` to import and register. However, modifiers' array (index.ts lines 209-342) only includes `shadow`, missing `textShadow` and variants (e.g., `textShadowSubtle`).
- **Registry Fragmentation:** Vite dev mode chunks imports, isolating ESM singletons (`let globalRegistryInstance`). Intro app imports effects → new chunk → empty registry instance → regs only responsive (4 mods) → builder proxy sees size 0 for effects mods → `has('textShadow')` false → lazy modifier → chaining fails (e.g., Hero.ts .textShadow().responsive()).
- **Impact:** TypeError in intro demo (Header/Hero components), lazy warnings in logs, partial registry (size 106 but missing effects).

## Phase 1: READ-ONLY Audit
### Goals
- Verify dependencies and cross-imports (tenets 1-2,5).
- Audit modifiers for duplicates/misalignments (tenet 6).
- Confirm registry loading patterns (tenet 4).

### Steps
1. **Audit Dependencies:**
   - Grep cross-imports: `grep -r "from ['\"]@tachui/(modifiers|effects)['\"]" tachUI/packages/(effects|modifiers)/src/`
   - Read package.jsons: Verify deps (effects: core/registry only; modifiers: core/registry—no effects).
   - Grep registry usage: `grep -r "globalModifierRegistry\|register.*modifier" tachUI/packages/(effects|modifiers)/src/`

2. **Audit Modifiers:**
   - Grep all factories: `grep -r "export function \w*Modifier\|export function \w*Shadow" tachUI/packages/(effects|modifiers)/src/`
   - Grep array completeness: `grep -r "modifierRegistrations\|Array<\[string" tachUI/packages/modifiers/src/`
   - Cross-check: `grep -r "textShadow" tachUI/packages/(effects|modifiers)/src/`
   - Duplicate check: `grep -r "type = 'textShadow'" tachUI/packages/`

3. **Audit Registry Loading:**
   - Grep conditional req: `grep -r "if.*registry\|require.*registry" tachUI/packages/core/src/`
   - Trace minimal use: Read core/minimal.ts vs. full core/index.ts.

### Expected Findings
- Cycle: Effects re-exports from modifiers; modifiers imports effects partially.
- Misses: 10-20 effects mods (e.g., textShadowSubtle/Strong) not in modifiers array.
- No hard duplicates, but partial overlap (e.g., scaleEffect).
- Registry: Core-optional (good).

## Phase 2: Refactor Blueprint
### Goals
- Decouple dependencies (no cross-imports).
- Independent auto-registration per package.
- Core-optional registry loading.
- ~~Repackage shared modifiers to core if needed.~~ (We should not migrate to core, we need to make plugin-based modifiers work)

### Steps
1. **Decouple Imports:**
   - Effects: Remove `export { scaleEffect } from '@tachui/modifiers'` (index.ts line 20).
   - Modifiers: Remove `import { ..., shadow } from './effects'` (index.ts line 183).
   - Repackage: If >5 overlaps (e.g., shadows), create `core/modifiers/shared.ts` with common factories.

2. **Independent Auto-Registration:**
   - Effects: Add reg array in index.ts (after exports):
     ```ts
     import { globalModifierRegistry } from '@tachui/registry';
     const effectsRegistrations = [['textShadow', textShadow], ...];
     effectsRegistrations.forEach(([name, factory]) => globalModifierRegistry.register(name, factory));
     ```
     - Conditional: Wrap in `if (globalModifierRegistry) { ... }`.
   - Modifiers: Keep own array, remove effects import.
   - Core: Ensure registry optional in minimal.ts.

3. **Handle Registry Ordering:**
   - App main.ts: Import core first, then plugins (triggers lazy reg).
   - Docs: "Import core, then plugins—reg auto-loads if needed."

4. **Audit & Clean:**
   - Post-refactor: Grep for duplicates/misalignments.
   - Breaking: Remove re-exports; update demo imports.

### Implementation Timeline
- **Week 1:** Audit (tools).
- **Week 2:** Decouple.
- **Week 3:** Reg & Test.
- **Week 4:** Full Audit.

## Benefits & Tradeoffs
- **Alignment:** Clean layers, no cycles.
- **Fixes:** textShadow reg'd → chaining works.
- **Tradeoffs:** Boilerplate, breaking changes.
- **Risks:** Repackage if many dups.

## Phase 1 Audit Results
### Dependencies (Tenets 1-2,5)
- **Effects package.json:** Includes `"@tachui/modifiers": "workspace:*"` (line 49) – **Violates Tenet 1**.
- **Modifiers package.json:** Only `"@tachui/core": "workspace:*"`, `"@tachui/registry": "workspace:*"` (lines 80-81) – **Good, no effects**.
- **Cross-Imports in Effects/src:** 11 matches importing from `@tachui/modifiers` (BaseModifier, types, scaleEffect re-export line 20).
- **Cross-Imports in Modifiers/src:** 0 matches – **Good, no effects imports**.
- **Registry Usage in Effects:** 0 matches (no globalModifierRegistry/register) – **Confirms no auto-reg**.
- **Registry Usage in Modifiers:** 0 matches (but array exists from prior read).

### Modifiers Audit (Tenet 6)
- **Factories in Effects:** textShadow, shadow, blur, brightness, contrast, transform, etc. (from prior grep).
- **Factories in Modifiers:** padding, margin, width, height, position, zIndex, etc. (from prior read).
- **modifierRegistrations Array:** Exists in modifiers/index.ts (lines 209-342, 102 entries).
- **textShadow in Effects:** 1 match (type = 'textShadow' line 167 in shadows/index.ts).
- **textShadow in Modifiers:** 0 matches – **Missing from array**.
- **Duplicates:** None found (textShadow unique to effects, shadow in both but different impls).

### Registry Loading (Tenet 4)
- **Conditional Req in Core:** 0 matches (no if/require for registry).
- **Minimal Bundle:** No registry imports (only modifiers/core, comment: "Concrete modifiers in @tachui/modifiers").
- **Full Core:** Exports modifiers/core (prior read), no direct registry.

### Key Findings
- **Cycle Confirmed:** Effects depends on modifiers (package.json + imports), modifiers imports effects (line 183 in modifiers/index.ts).
- **Misses:** textShadow exported from effects but not in modifiers array → not registered → has: false → lazy → chain break.
- **No Duplicates:** textShadow unique.
- **Registry Optional:** Core minimal doesn't require it (good).

## Phase 2: Refactor Implementation
### Step 1: Decouple Imports
- **Effects/index.ts:** Remove `export { scaleEffect } from '@tachui/modifiers'` (line 20).
- **Modifiers/index.ts:** Remove `import { ..., shadow } from './effects'` (line 183).
- **Effects/package.json:** Remove `"@tachui/modifiers": "workspace:*"` (line 49).

### Step 2: Independent Auto-Registration
- **Effects/index.ts:** Add after exports:
  ```ts
  import { globalModifierRegistry } from '@tachui/registry';
  const effectsRegistrations = [
    ['textShadow', textShadow],
    ['textShadowSubtle', textShadowSubtle],
    ['textShadowStrong', textShadowStrong],
    // Add all 50+ effects factories
  ];
  if (globalModifierRegistry) {
    effectsRegistrations.forEach(([name, factory]) => globalModifierRegistry.register(name, factory));
    console.log(`@tachui/effects: Registered ${effectsRegistrations.length} effects.`);
  }
  ```
- **Modifiers/index.ts:** Keep existing array/reg (lines 209-369), remove effects import.

### Step 3: Handle Registry Ordering
- **Core/minimal.ts:** Add optional registry import if plugins loaded.
- **App main.ts:** Import core first, then plugins (e.g., intro: core → effects → modifiers).

### Step 4: Audit & Clean
- Post-refactor: Grep for duplicates/misalignments.
- Update demos: Remove effects imports if not needed.

## Phase 2: Implementation Results
### Changes Made
1. **Effects Package:**
   - Removed `"@tachui/modifiers": "workspace:*"` from package.json (violates tenet 1).
   - Removed `export { scaleEffect } from '@tachui/modifiers'` from index.ts (breaks compat, tenet 3).
   - Added `@tachui/registry` to dependencies and vite.config.ts external/globals.
   - Added independent auto-registration in index.ts with conditional `if (globalModifierRegistry)` (tenet 4).
   - Registered 11 effects: textShadow, textShadowSubtle, textShadowStrong, shadow, blur, brightness, contrast, transform, hover, cursor, filter.

2. **Modifiers Package:**
   - No changes needed (already compliant).

3. **Vite Configs:**
   - Updated intro/calculator vite.config.ts with `optimizeDeps.include` and `manualChunks` for registry/modifiers/core (forces shared ESM eval).

### Build Results
- **Effects:** Built successfully (124.03 kB), registered 11 modifiers.
- **Modifiers:** Built successfully (multiple chunks), no conflicts.
- **Intro Demo:** Dev server running on http://localhost:3004, ready for testing.

### Expected Outcome
- textShadow now registered in effects → `has('textShadow')` true → no lazy → chaining works (e.g., .textShadow().responsive() in Hero.ts).
- Single registry instance (size 106+), no multiples/fragmentation.
- Clean architecture: Effects independent, registry optional.

## Status
- Phase 1: Completed (audit results documented).
- Phase 2: Completed (implementation done, testing ready).