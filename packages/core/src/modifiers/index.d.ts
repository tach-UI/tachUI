/**
 * Modifier Infrastructure Exports
 *
 * This module exposes the core modifier infrastructure (builder, registry,
 * base classes, and helper utilities). All concrete modifier implementations
 * now live in @tachui/modifiers.
 */
export { AnimationModifier, AppearanceModifier, BaseModifier, InteractionModifier, LayoutModifier, LifecycleModifier, ResizableModifier, } from './base';
export type { AnimationModifierProps, AppearanceModifierProps, AssetValue, ColorValue, CSSClassNames, CSSStyleProperties, InteractionModifierProps, LayoutModifierProps, LifecycleModifierProps, ModifiableComponent, ModifiableComponentWithModifiers, Modifier, ModifierApplicationOptions, ModifierBuilder, ModifierContext, ModifierRegistry, ModifierResult, ReactiveModifierProps, StyleComputationContext, } from './types';
export { ModifierPriority } from './types';
export { applyModifiers, createModifierBuilder, ModifierBuilderImpl, modifierUtils, setExternalModifierRegistry, } from './builder';
export { applyModifiersToNode, createModifiableComponent, createModifierRegistry, } from './registry';
export { createComponentProxy, resetProxyCache } from './proxy';
export { animationModifiers, appearanceModifiers, coreModifiers, interactionModifiers, layoutModifiers, presetModifiers, } from './core';
export { classModifier, combineModifiers, conditionalModifier, createCustomModifier, createStyleModifier, eventModifier, modifierHelpers, responsiveModifier, stateModifier, styleModifier, } from './factories';
export { registerModifierWithMetadata } from './registration-utils';
//# sourceMappingURL=index.d.ts.map