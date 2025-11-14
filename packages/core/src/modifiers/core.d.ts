/**
 * Core Modifier System Integration
 *
 * Re-exports all modifier functionality from their specialized files for
 * convenient access. This file serves as the main entry point for the
 * complete modifier system.
 */
export { animationModifiers, appearanceModifiers, coreModifiers, interactionModifiers, layoutModifiers, lifecycleModifiers, presetModifiers, } from './presets';
export { modifierHelpers, createCustomModifier, createStyleModifier, createPresetModifier, createComponentVariant, combineModifiers, conditionalModifier, stateModifier, responsiveModifier, classModifier, styleModifier, eventModifier, } from './factories';
export { css, cssProperty, cssVariable, cssVendor } from './css';
/**
 * For backwards compatibility, export coreModifiers as default export
 */
export { coreModifiers as default } from './presets';
//# sourceMappingURL=core.d.ts.map