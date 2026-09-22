/**
 * Preload entry focused on shadow effects (drop shadows, text shadows, etc.).
 */

import type { ComponentInstance } from '@tachui/types/runtime'
import type {
  ModifierFactoriesOf,
  ModifierMethodsOf,
  ModifierRegistrationList,
} from '@tachui/types/modifiers'
import { globalModifierRegistry } from '@tachui/registry'
import {
  animatedShadow,
  dropShadow,
  elevationShadow,
  glowEffect,
  insetShadow,
  layeredShadow,
  neonEffect,
  neumorphism,
  neumorphismPressed,
  reactiveShadow,
  shadowPreset,
  shadows,
  shadow,
  swiftUIShadow,
  textEmbossed,
  textEngraved,
  textOutline,
  textShadow,
  textShadowStrong,
  textShadowSubtle,
} from '../effects/shadows'

const shadowRegistrations = [
  ['shadows', shadows],
  ['shadowPreset', shadowPreset],
  ['shadow', shadow],
  ['textShadow', textShadow],
  ['dropShadow', dropShadow],
  ['insetShadow', insetShadow],
  ['elevationShadow', elevationShadow],
  ['glowEffect', glowEffect],
  ['neonEffect', neonEffect],
  ['neumorphism', neumorphism],
  ['neumorphismPressed', neumorphismPressed],
  ['layeredShadow', layeredShadow],
  ['textShadowSubtle', textShadowSubtle],
  ['textShadowStrong', textShadowStrong],
  ['textOutline', textOutline],
  ['textEmbossed', textEmbossed],
  ['textEngraved', textEngraved],
  ['swiftUIShadow', swiftUIShadow],
  ['reactiveShadow', reactiveShadow],
  ['animatedShadow', animatedShadow],
] as const satisfies ModifierRegistrationList

// Type the shadow modifiers on the builder, from the factories registered
// here, so they typecheck exactly when this module has run.
declare module '@tachui/types/modifiers' {
  interface ModifierBuilder<T extends ComponentInstance = ComponentInstance>
    extends ModifierMethodsOf<ModifierFactoriesOf<typeof shadowRegistrations>> {}
}

shadowRegistrations.forEach(([name, factory]) => {
  if (!globalModifierRegistry.has(name)) {
    globalModifierRegistry.register(name, factory as any)
  }
})

export * from '../effects/shadows'
