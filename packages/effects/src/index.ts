/**
 * @tachui/effects - Visual effects and advanced modifiers
 *
 * This package provides comprehensive visual effects including filters,
 * transforms, backdrop effects, shadows, and interactive hover effects.
 *
 * Auto-registers all effects with the global registry when imported.
 */

// Effects now integrate with the shared ESM singleton registry via the modifiers package
// No need for separate registry - the builder proxy system handles dynamic lookups

// Re-export all filters
export * from './filters'

// Re-export all transforms
export * from './transforms'

// scaleEffect moved to @tachui/modifiers for backwards compatibility

// Re-export all backdrop effects
export * from './backdrop'

// Re-export all shadows (except dropShadow which conflicts with filters)
export {
  ShadowModifier,
  TextShadowModifier,
  DropShadowModifier,
  shadow,
  textShadow,
  // dropShadow, // Commented out due to conflict with filters/dropShadow
  shadows,
  insetShadow,
  shadowPreset,
  elevationShadow,
  glowEffect,
  neonEffect,
  neumorphism,
  neumorphismPressed,
  layeredShadow,
  textShadowSubtle,
  textShadowStrong,
  textOutline,
  textEmbossed,
  textEngraved,
  swiftUIShadow,
  shadowDirections,
  reactiveShadow,
  animatedShadow,
} from './shadows'

// Re-export all interactive effects
export * from './effects'

// Import factories for registration
import {
  textShadow,
  textShadowSubtle,
  textShadowStrong,
  shadow,
  shadows,
  insetShadow,
  shadowPreset,
  elevationShadow,
  glowEffect,
  neonEffect,
  neumorphism,
  neumorphismPressed,
  layeredShadow,
  textOutline,
  textEmbossed,
  textEngraved,
  swiftUIShadow,
  reactiveShadow,
  animatedShadow
} from './shadows'
import {
  blur,
  brightness,
  contrast,
  filter,
  saturate,
  grayscale,
  sepia,
  hueRotate,
  invert,
  dropShadow,
  vintagePhoto,
  blackAndWhite,
  vibrant,
  warmTone,
  coolTone,
  faded,
  highKey,
  lowKey,
  softFocus,
  highContrastMode,
  subtleBlur,
  darkModeInvert,
  colorInvert,
  saturation,
  hueRotation
} from './filters'
import {
  transform,
  scale,
  rotate,
  translate,
  skew,
  rotateX,
  rotateY,
  rotateZ,
  perspective,
  advancedTransform,
  matrix,
  matrix3d,
  rotate3d,
  scale3d,
  translate3d,
  scaleX,
  scaleY,
  scaleZ,
  translateX,
  translateY,
  translateZ,
  perspectiveOrigin,
  transformStyle,
  backfaceVisibility,
  offset
} from './transforms'
import {
  hover,
  cursor,
  hoverEffect,
  hoverWithTransition,
  conditionalHover,
  interactiveCursor,
  draggableCursor,
  textCursor,
  disabledCursor,
  loadingCursor,
  helpCursor,
  zoomCursor,
  buttonHover,
  cardHover,
  linkHover,
  imageHover
} from './effects'
import { backdropFilter, glassmorphism, customGlassmorphism } from './backdrop'

// Lazy registration for effects modifiers
import { registerLazyModifier } from '@tachui/registry'

// Create lazy loaders for effects modifiers
const effectsLazyLoaders: Array<[string, () => any]> = [
  // Shadows
  ['textShadow', () => textShadow],
  ['textShadowSubtle', () => textShadowSubtle],
  ['textShadowStrong', () => textShadowStrong],
  ['shadow', () => shadow],
  ['shadows', () => shadows],
  ['insetShadow', () => insetShadow],
  ['shadowPreset', () => shadowPreset],
  ['elevationShadow', () => elevationShadow],
  ['glowEffect', () => glowEffect],
  ['neonEffect', () => neonEffect],
  ['neumorphism', () => neumorphism],
  ['neumorphismPressed', () => neumorphismPressed],
  ['layeredShadow', () => layeredShadow],
  ['textOutline', () => textOutline],
  ['textEmbossed', () => textEmbossed],
  ['textEngraved', () => textEngraved],
  ['swiftUIShadow', () => swiftUIShadow],
  ['reactiveShadow', () => reactiveShadow],
  ['animatedShadow', () => animatedShadow],

  // Filters
  ['blur', () => blur],
  ['brightness', () => brightness],
  ['contrast', () => contrast],
  ['filter', () => filter],
  ['saturate', () => saturate],
  ['grayscale', () => grayscale],
  ['sepia', () => sepia],
  ['hueRotate', () => hueRotate],
  ['invert', () => invert],
  ['dropShadow', () => dropShadow],
  ['vintagePhoto', () => vintagePhoto],
  ['blackAndWhite', () => blackAndWhite],
  ['vibrant', () => vibrant],
  ['warmTone', () => warmTone],
  ['coolTone', () => coolTone],
  ['faded', () => faded],
  ['highKey', () => highKey],
  ['lowKey', () => lowKey],
  ['softFocus', () => softFocus],
  ['highContrastMode', () => highContrastMode],
  ['subtleBlur', () => subtleBlur],
  ['darkModeInvert', () => darkModeInvert],
  ['colorInvert', () => colorInvert],
  ['saturation', () => saturation],
  ['hueRotation', () => hueRotation],

  // Transforms
  ['transform', () => transform],
  ['scale', () => scale],
  ['rotate', () => rotate],
  ['translate', () => translate],
  ['skew', () => skew],
  ['rotateX', () => rotateX],
  ['rotateY', () => rotateY],
  ['rotateZ', () => rotateZ],
  ['perspective', () => perspective],
  ['advancedTransform', () => advancedTransform],
  ['matrix', () => matrix],
  ['matrix3d', () => matrix3d],
  ['rotate3d', () => rotate3d],
  ['scale3d', () => scale3d],
  ['translate3d', () => translate3d],
  ['scaleX', () => scaleX],
  ['scaleY', () => scaleY],
  ['scaleZ', () => scaleZ],
  ['translateX', () => translateX],
  ['translateY', () => translateY],
  ['translateZ', () => translateZ],
  ['perspectiveOrigin', () => perspectiveOrigin],
  ['transformStyle', () => transformStyle],
  ['backfaceVisibility', () => backfaceVisibility],
  ['offset', () => offset],

  // Interactive Effects
  ['hover', () => hover],
  ['cursor', () => cursor],
  ['hoverEffect', () => hoverEffect],
  ['hoverWithTransition', () => hoverWithTransition],
  ['conditionalHover', () => conditionalHover],
  ['interactiveCursor', () => interactiveCursor],
  ['draggableCursor', () => draggableCursor],
  ['textCursor', () => textCursor],
  ['disabledCursor', () => disabledCursor],
  ['loadingCursor', () => loadingCursor],
  ['helpCursor', () => helpCursor],
  ['zoomCursor', () => zoomCursor],
  ['buttonHover', () => buttonHover],
  ['cardHover', () => cardHover],
  ['linkHover', () => linkHover],
  ['imageHover', () => imageHover],

  // Backdrop Effects
  ['backdropFilter', () => backdropFilter],
  ['glassmorphism', () => glassmorphism],
  ['customGlassmorphism', () => customGlassmorphism],
]

// Register lazy loaders for effects modifiers
effectsLazyLoaders.forEach(([name, loader]) => {
  registerLazyModifier(name, loader)
})

if (process.env.NODE_ENV === 'development') {
  console.log(`@tachui/effects: Registered ${effectsLazyLoaders.length} lazy loaders for effects modifiers.`)
}
