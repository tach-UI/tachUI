/**
 * Modifier Infrastructure
 *
 * Core modifier system infrastructure for the TachUI framework.
 * Concrete modifier implementations are available in @tachui/modifiers.
 */

import type { ModifierRegistry, PluginInfo } from '@tachui/registry'
import { registerPaddingModifier } from './padding'
import { registerMarginModifier } from './margin'
import { registerFrameModifier } from './frame'
import { registerAlignmentModifier } from './alignment'
import { registerLayoutPriorityModifier } from './layout-priority'
import { registerForegroundColorModifier } from './foreground-color'
import { registerBackgroundColorModifier } from './background-color'
import { registerBackgroundModifier } from './background'
import { registerFontSizeModifier } from './font-size'
import { registerFontWeightModifier } from './font-weight'
import { registerFontFamilyModifier } from './font-family'
import { registerOpacityModifier } from './opacity'
import { registerCornerRadiusModifier } from './corner-radius'
import { registerBorderModifier } from './border'

// Base modifier classes and infrastructure
export {
  AnimationModifier,
  AppearanceModifier,
  BaseModifier,
  InteractionModifier,
  LayoutModifier,
  LifecycleModifier,
  ResizableModifier,
} from './base'

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
  ModifiableComponentWithModifiers,
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
  setExternalModifierRegistry,
} from './builder'

// Registry and application infrastructure
export {
  applyModifiersToNode,
  createModifiableComponent,
  createModifierRegistry,
} from './registry'

export { createComponentProxy, resetProxyCache } from './proxy'

// Note: globalModifierRegistry is NOT re-exported from @tachui/core
// Import directly from @tachui/registry when needed:
// import { globalModifierRegistry } from '@tachui/registry'

// Core modifier utilities and helpers
export {
  animationModifiers,
  appearanceModifiers,
  coreModifiers,
  interactionModifiers,
  layoutModifiers,
  presetModifiers,
} from './core'

// Modifier factory functions and utilities
export {
  classModifier,
  combineModifiers,
  conditionalModifier,
  createCustomModifier,
  createStyleModifier,
  eventModifier,
  modifierHelpers,
  responsiveModifier,
  stateModifier,
  styleModifier,
} from './factories'

export { padding, registerPaddingModifier } from './padding'
export { margin, registerMarginModifier } from './margin'
export { frame, registerFrameModifier } from './frame'
export { alignment, registerAlignmentModifier } from './alignment'
export { layoutPriority, registerLayoutPriorityModifier } from './layout-priority'
export { foregroundColor, registerForegroundColorModifier } from './foreground-color'
export { backgroundColor, registerBackgroundColorModifier } from './background-color'
export { background, registerBackgroundModifier } from './background'
export { fontSize, registerFontSizeModifier } from './font-size'
export { fontWeight, registerFontWeightModifier } from './font-weight'
export { fontFamily, registerFontFamilyModifier } from './font-family'
export { opacity, registerOpacityModifier } from './opacity'
export { cornerRadius, registerCornerRadiusModifier } from './corner-radius'
export { border, registerBorderModifier } from './border'
export { registerModifierWithMetadata } from './registration-utils'

type CoreModifierRegistration = (
  registry?: ModifierRegistry,
  plugin?: PluginInfo,
) => void

const coreModifierRegistrations: CoreModifierRegistration[] = [
  registerPaddingModifier,
  registerMarginModifier,
  registerFrameModifier,
  registerAlignmentModifier,
  registerLayoutPriorityModifier,
  registerForegroundColorModifier,
  registerBackgroundColorModifier,
  registerBackgroundModifier,
  registerFontSizeModifier,
  registerFontWeightModifier,
  registerFontFamilyModifier,
  registerOpacityModifier,
  registerCornerRadiusModifier,
  registerBorderModifier,
]

let coreModifiersRegistered = false

export interface RegisterCoreModifiersOptions {
  registry?: ModifierRegistry
  plugin?: PluginInfo
  force?: boolean
}

export function registerCoreModifiers(
  options?: RegisterCoreModifiersOptions,
): void {
  const targetRegistry = options?.registry
  const targetPlugin = options?.plugin
  const shouldForce = options?.force === true
  const isCustomTarget = Boolean(targetRegistry || targetPlugin)

  if (!isCustomTarget && coreModifiersRegistered && !shouldForce) {
    return
  }

  coreModifierRegistrations.forEach(register => {
    register(targetRegistry, targetPlugin)
  })

  if (!isCustomTarget) {
    coreModifiersRegistered = true
  }
}

registerCoreModifiers()

if (typeof import.meta !== 'undefined' && (import.meta as any).hot) {
  ;(import.meta as any).hot.accept(() => {
    registerCoreModifiers({ force: true })
  })
}
