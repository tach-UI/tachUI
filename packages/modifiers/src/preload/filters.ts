/**
 * Preload entry for filter effects only. Keeps bundle size minimal when
 * teams need a narrow portion of the effects suite.
 */

import { globalModifierRegistry } from '@tachui/registry'
import {
  blackAndWhite,
  blur,
  brightness,
  colorInvert,
  contrast,
  coolTone,
  darkModeInvert,
  faded,
  filter,
  filterDropShadow,
  grayscale,
  highContrastMode,
  highKey,
  hueRotate,
  hueRotation,
  invert,
  lowKey,
  saturation,
  saturate,
  sepia,
  softFocus,
  subtleBlur,
  vibrant,
  vintagePhoto,
  warmTone,
} from '../effects/filters'

const filterRegistrations: Array<[string, (...args: any[]) => any]> = [
  ['blur', blur],
  ['brightness', brightness],
  ['contrast', contrast],
  ['filter', filter],
  ['saturate', saturate],
  ['grayscale', grayscale],
  ['sepia', sepia],
  ['hueRotate', hueRotate],
  ['invert', invert],
  ['filterDropShadow', filterDropShadow],
  ['vintagePhoto', vintagePhoto],
  ['blackAndWhite', blackAndWhite],
  ['vibrant', vibrant],
  ['warmTone', warmTone],
  ['coolTone', coolTone],
  ['faded', faded],
  ['highKey', highKey],
  ['lowKey', lowKey],
  ['softFocus', softFocus],
  ['highContrastMode', highContrastMode],
  ['subtleBlur', subtleBlur],
  ['darkModeInvert', darkModeInvert],
  ['colorInvert', colorInvert],
  ['saturation', saturation],
  ['hueRotation', hueRotation],
]

filterRegistrations.forEach(([name, factory]) => {
  if (!globalModifierRegistry.has(name)) {
    globalModifierRegistry.register(name, factory as any)
  }
})

export * from '../effects/filters'
