/**
 * @tachui/effects - Visual effects and advanced modifiers
 *
 * This package provides comprehensive visual effects including filters,
 * transforms, backdrop effects, shadows, and interactive hover effects.
 *
 * Auto-registers all effects with the global registry when imported.
 */

import { globalModifierRegistry } from '@tachui/core/modifiers/registry'

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

// Import modifier factory functions for registration
import {
  // Core effects - start with a minimal set for testing
  filter,
  blur,
  brightness,
  contrast,
  shadow,
  cursor,
  transform,
} from './internal-exports'

/**
 * Effects modifier registration entries: [registryKey, factoryFunction]
 */
const effectsRegistrations: Array<[string, (...args: any[]) => any]> = [
  // Core effects - minimal set for testing
  ['filter', filter],
  ['blur', blur],
  ['brightness', brightness],
  ['contrast', contrast],
  ['shadow', shadow],
  ['cursor', cursor],
  ['transform', transform],
]

/**
 * Register all effects with the global registry
 */
function registerEffects(): void {
  let registeredCount = 0
  let failedCount = 0

  effectsRegistrations.forEach(([name, factory]) => {
    try {
      globalModifierRegistry.register(name, factory)
      registeredCount++
    } catch (error) {
      console.warn(`Failed to register effect '${name}':`, error)
      failedCount++
    }
  })

  console.log(
    `@tachui/effects: Registered ${registeredCount} effects${
      failedCount > 0 ? `, ${failedCount} failed` : ''
    }`
  )
}

// Auto-register all effects when this module is imported
registerEffects()
