/**
 * Backwards compatibility layer for modifiers
 *
 * This file provides re-exports from @tachui/modifiers to maintain
 * compatibility during the restructuring process.
 *
 * Note: Visual effects (filters, transforms, backdrop, hover) have been
 * moved to @tachui/effects and are not re-exported here.
 */

// Base modifier classes
export {
  AnimationModifier,
  AppearanceModifier,
  BaseModifier,
  InteractionModifier,
  LayoutModifier,
  ResizableModifier,
} from './modifiers/base'

// Appearance modifiers
export { BackgroundModifier } from './modifiers/background'
export type {
  BorderOptions,
  BorderSide,
  BorderStyle,
  ReactiveBorderOptions,
  CornerRadiusValue,
  CornerRadiusConfig,
  CornerRadiusOptions,
  ReactiveCornerRadiusOptions,
} from './modifiers/border'
export {
  BorderModifier,
  CornerRadiusModifier,
  border,
  borderTop,
  borderRight,
  borderBottom,
  borderLeft,
  borderLeading,
  borderTrailing,
  borderHorizontal,
  borderVertical,
  cornerRadius,
} from './modifiers/border'

// CSS utilities
export { css, cssProperty, cssVariable } from './modifiers/css'

// Builder and registry functions
export { createModifierBuilder } from './modifiers/builder'
export type { Modifier, ModifierContext } from './modifiers/types'
export { createModifiableComponent } from './modifiers/registry'

// Basic layout modifiers
export { padding } from './modifiers/padding'
export { margin } from './modifiers/margin'
export { size } from './modifiers/size'

// Transition modifiers
export {
  transition,
  transitions,
  fadeTransition,
  transformTransition,
  colorTransition,
  layoutTransition,
  buttonTransition,
  cardTransition,
  modalTransition,
  smoothTransition,
  quickTransition,
  slowTransition,
  TransitionModifier,
  type TransitionConfig,
  type TransitionsConfig,
  type ModifierTransitionOptions,
  type ReactiveTransitionOptions,
} from './modifiers/transitions'

// Note: Visual effects have been moved to @tachui/effects:
// - Filters (blur, brightness, contrast, etc.)
// - Transforms (scale, rotate, translate, etc.)
// - Backdrop effects (glassmorphism, backdrop-filter)
// - Interactive effects (hover, cursor)
//
// To use these effects, install @tachui/effects:
// import { blur, scale, glassmorphism, hoverEffect } from '@tachui/effects'
