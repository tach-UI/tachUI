/**
 * Segmented preload entry that eagerly registers every basic modifier family.
 *
 * The registration call must live HERE, not merely be inherited from
 * `../basic`'s module-scope side effect. `src/basic/index.ts` is forced into
 * the hashed `modifiers-basic` chunk by the build's `manualChunks`, and that
 * chunk matches none of the package's `sideEffects` globs — so a bundler
 * drops the side effect and every modifier throws "not found in registry" in
 * a production build (#260). This entry is covered by `./dist/preload/*.js`
 * in `sideEffects`, so a call placed here survives.
 *
 * Matches the shape already used by preload/filters, shadows, transforms and
 * backdrop, which register explicitly and were never affected.
 */

import { registerBasicModifiers } from '../basic'

registerBasicModifiers()

export * from '../basic'
