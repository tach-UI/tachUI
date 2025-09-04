/**
 * @tachui/effects - Visual effects and advanced modifiers
 *
 * This package provides comprehensive visual effects including filters,
 * transforms, backdrop effects, shadows, and interactive hover effects.
 */

// Re-export all filters
export * from './filters'

// Re-export all transforms
export * from './transforms'

// Re-export scaleEffect from modifiers for backwards compatibility
export { scaleEffect } from '@tachui/modifiers'

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
