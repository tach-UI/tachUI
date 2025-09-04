/**
 * Modifier Infrastructure
 *
 * Core modifier system infrastructure for the TachUI framework.
 * Concrete modifier implementations are available in @tachui/modifiers.
 */

// Base modifier classes and infrastructure
export { BaseModifier, ResizableModifier } from './base'

// Modifier system types
export type {
  AnimationModifierProps,
  AppearanceModifierProps,
  AssetValue,
  ColorValue,
  CSSClassNames,
  CSSStyleProperties,
  InteractionModifierProps,
  LayoutModifierProps,
  LifecycleModifierProps,
  ModifiableComponent,
  Modifier,
  ModifierApplicationOptions,
  ModifierBuilder,
  ModifierContext,
  ModifierRegistry,
  ModifierResult,
  ReactiveModifierProps,
  StyleComputationContext,
} from './types'
export { ModifierPriority } from './types'

// Builder system infrastructure
export {
  applyModifiers,
  createModifierBuilder,
  ModifierBuilderImpl,
  modifierUtils,
} from './builder'

// Registry and application infrastructure
export {
  applyModifiersToNode,
  createModifiableComponent,
  createModifierRegistry,
  globalModifierRegistry,
} from './registry'

// Core modifier utilities and helpers
export {
  animationModifiers,
  appearanceModifiers,
  coreModifiers,
  interactionModifiers,
  layoutModifiers,
  presetModifiers,
} from './core'
