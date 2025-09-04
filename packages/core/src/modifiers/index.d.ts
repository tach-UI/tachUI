/**
 * Modifier Infrastructure
 *
 * Core modifier system infrastructure for the TachUI framework.
 * Concrete modifier implementations are available in @tachui/modifiers.
 */
export { BaseModifier, ResizableModifier } from './base'
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
export {
  applyModifiers,
  createModifierBuilder,
  ModifierBuilderImpl,
  modifierUtils,
} from './builder'
export {
  applyModifiersToNode,
  createModifiableComponent,
  createModifierRegistry,
  globalModifierRegistry,
} from './registry'
export {
  animationModifiers,
  appearanceModifiers,
  coreModifiers,
  interactionModifiers,
  layoutModifiers,
  presetModifiers,
} from './core'
export * from './compat'
//# sourceMappingURL=index.d.ts.map
