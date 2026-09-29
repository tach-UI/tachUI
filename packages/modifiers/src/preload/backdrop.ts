/**
 * Preload entry for backdrop and glassmorphism utilities.
 */

import type { ComponentInstance } from '@tachui/types/runtime'
import type {
  ModifierFactoriesOf,
  ModifierMethodsOf,
  ModifierRegistrationList,
} from '@tachui/types/modifiers'
import type { BackdropFilterBuilderMethods } from '../effects/backdrop'
import { registerModifierList } from '../registration'
import {
  backdropModifierCategories,
  backdropModifierSignatures,
} from './backdrop.signatures.generated'
import {
  backdropFilter,
  customGlassmorphism,
  glassmorphism,
} from '../effects/backdrop'

const backdropRegistrations = [
  ['backdropFilter', backdropFilter],
  ['glassmorphism', glassmorphism],
  ['customGlassmorphism', customGlassmorphism],
] as const satisfies ModifierRegistrationList

// Type the backdrop modifiers on the builder, from the factories registered
// here, so they typecheck exactly when this module has run.
declare module '@tachui/types/modifiers' {
  interface ModifierBuilder<T extends ComponentInstance = ComponentInstance>
    extends BackdropFilterBuilderMethods,
      ModifierMethodsOf<
        ModifierFactoriesOf<typeof backdropRegistrations>,
        'backdropFilter'
      > {}
}

registerModifierList(backdropRegistrations, {
  signatures: backdropModifierSignatures,
  categories: backdropModifierCategories,
})

export * from '../effects/backdrop'
