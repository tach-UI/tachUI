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
import { globalModifierRegistry } from '@tachui/registry'
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

backdropRegistrations.forEach(([name, factory]) => {
  if (!globalModifierRegistry.has(name)) {
    globalModifierRegistry.register(name, factory as any)
  }
})

export * from '../effects/backdrop'
