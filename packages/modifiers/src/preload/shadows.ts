/**
 * Preload entry focused on shadow effects (drop shadows, text shadows, etc.).
 */

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

const shadowRegistrations: Array<[string, (...args: any[]) => any]> = [
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
]

shadowRegistrations.forEach(([name, factory]) => {
  if (!globalModifierRegistry.has(name)) {
    globalModifierRegistry.register(name, factory as any)
  }
})

export * from '../effects/shadows'
