/**
 * Core Modifier System Integration
 *
 * Re-exports all modifier functionality from their specialized files for
 * convenient access. This file serves as the main entry point for the
 * complete modifier system.
 */

// Re-export all preset modifiers
export {
  animationModifiers,
  appearanceModifiers,
  coreModifiers,
  interactionModifiers,
  layoutModifiers,
  lifecycleModifiers,
  presetModifiers,
} from './presets'

// Re-export factory functions (for advanced users)
export {
  modifierHelpers,
  createCustomModifier,
  createStyleModifier,
  createPresetModifier,
  createComponentVariant,
  combineModifiers,
  conditionalModifier,
  stateModifier,
  responsiveModifier,
  classModifier,
  styleModifier,
  eventModifier,
} from './factories'

/**
 * For backwards compatibility, export coreModifiers as default export
 */
export { coreModifiers as default } from './presets'
