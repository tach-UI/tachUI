/**
 * TachUI Modifiers - Styling System
 *
 * Comprehensive modifier system for declarative styling and behavior modification
 *
 * Segmented preload: Import '@tachui/modifiers/basic' for basic modifiers only.
 * For effects, import '@tachui/modifiers/effects'.
 */

import { globalModifierRegistry } from '@tachui/registry'

// Core base classes and types
export * from './basic/base'
export type {
  Modifier,
  ModifierContext,
  ModifierBuilder,
  ModifierRegistry,
  ReactiveModifierProps,
  CSSStyleProperties,
  ModifierApplicationOptions,
} from '@tachui/core/modifiers/types'
export { ModifierPriority } from '@tachui/core/modifiers/types'

// Export all basic modifiers (already registered by basic preload)
export * from './basic'

// Export individual categories for granular imports
export * from './layout'
export * from './utility'
export * from './appearance'
export * from './typography'
export * from './interaction'
export * from './responsive'
export * from './elements'
export * from './attributes'

// Package Information - consistent across all TachUI packages
export { TACHUI_PACKAGE, TACHUI_PACKAGE_VERSION } from './version'

// Re-export infrastructure from core for compatibility
export {
  BaseModifier,
  registerModifierWithMetadata,
  createModifiableComponent,
  createModifierBuilder,
} from '@tachui/core/modifiers'

export { registerBasicModifiers, registerBasicModifiers as registerModifiers } from './basic'

// Note: Additional type exports are handled by core compatibility layer
// to avoid circular dependencies during consolidation

// Development logging
if (process.env.NODE_ENV === 'development') {
  const registeredModifiers = globalModifierRegistry.list()
  console.log(
    `@tachui/modifiers: Basic modifiers preloaded and registered. Registry total: ${registeredModifiers.length} modifiers.`
  )
}
