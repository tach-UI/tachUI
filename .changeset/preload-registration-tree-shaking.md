---
'@tachui/modifiers': patch
---

Fix modifier registration being tree-shaken out of consumer bundles (#260).

Importing `@tachui/modifiers/preload/basic` — the documented way to register the basic modifiers — had no effect in any production build. Every modifier call then threw `Modifier 'fontSize' not found in registry`, while the same code worked unbundled.

`registerBasicModifiers()` runs at module scope in `src/basic/index.ts`, but the build forces that module into a hashed `modifiers-basic-<hash>` chunk which matches none of the package's `sideEffects` globs. Rollup treated the chunk as side-effect-free and dropped the call, leaving `dist/preload/basic.js` as a pure re-export that registered nothing.

`preload/basic` and `preload/effects` now call their registration functions directly, matching `preload/filters`, `shadows`, `transforms` and `backdrop`, which already did this and were never affected. `registerEffectModifiers()` is newly exported from `@tachui/modifiers/effects` for that purpose.

Segmentation is unchanged: a basic-only import still pulls in no effects code.

The tree-shaking verifier now also builds fixtures against the published `dist`. Its existing fixtures import from `src`, where the preload entries *are* covered by `sideEffects` — which is why this never showed up in CI.
