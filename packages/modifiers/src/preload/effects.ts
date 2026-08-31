/**
 * Segmented preload entry that eagerly registers every effect modifier.
 *
 * Registers explicitly rather than relying on `../effects`'s module-scope side
 * effect: that module is forced into the hashed `modifiers-effects` chunk,
 * which no `sideEffects` glob matches, so bundlers drop it (#260).
 */

import { registerEffectModifiers } from '../effects'

registerEffectModifiers()

export * from '../effects'
