/**
 * Modifier Infrastructure
 *
 * Core modifier system infrastructure for the TachUI framework.
 * 
 * @deprecated Most modifier functionality has moved to @tachui/modifiers package.
 * Import modifiers directly from @tachui/modifiers instead.
 * 
 * This file now serves as a compatibility layer and only exports the core
 * modifier infrastructure needed by @tachui/core itself.
 */

import type { ModifierRegistry, PluginInfo } from '@tachui/registry'
import * as Compat from './compat'

// Re-export core modifier infrastructure from compatibility layer
export {
  BaseModifier,
  registerModifierWithMetadata,
  createModifiableComponent
} from './compat'

// Re-export ALL types for backwards compatibility
export * from './types'

// Re-export core modifier system (from @tachui/modifiers)
export const {
  fontSize,
  fontWeight,
  fontFamily,
  margin,
  padding,
  border,
  cornerRadius,
  backgroundColor,
  foregroundColor,
  opacity,
  aspectRatio,
  position,
  zIndex,
  scaleEffect,
  overlay,
  clipped,
  clipShape,
  allowsHitTesting,
  focusable,
  onHover,
  customProperty,
  cssVariables,
  themeColors,
  designTokens,
  customProperties
} = Compat

// Legacy exports for backwards compatibility (DEPRECATED)
// These re-export from @tachui/modifiers through the compatibility layer
export {
  // Individual modifier exports (legacy - use @tachui/modifiers directly)
  fontSize as fontSizeLegacy,
  fontWeight as fontWeightLegacy,
  fontFamily as fontFamilyLegacy,
  margin as marginLegacy,
  padding as paddingLegacy,
  border as borderLegacy,
  cornerRadius as cornerRadiusLegacy,
  backgroundColor as backgroundColorLegacy,
  foregroundColor as foregroundColorLegacy,
  opacity as opacityLegacy,
} from './compat'

// Core modifier registration (legacy)
type CoreModifierRegistration = (
  registry?: ModifierRegistry,
  plugin?: PluginInfo,
) => void

let coreModifiersRegistered = false

export interface RegisterCoreModifiersOptions {
  registry?: ModifierRegistry
  plugin?: PluginInfo
  force?: boolean
}

export function registerCoreModifiers(
  options?: RegisterCoreModifiersOptions,
): void {
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      '@tachui/core: registerCoreModifiers() is deprecated.\n' +
      'Individual modifiers are now available directly from @tachui/modifiers.\n' +
      'Example: import { fontSize, margin } from "@tachui/modifiers"'
    )
  }
  
  const targetRegistry = options?.registry
  const targetPlugin = options?.plugin
  const shouldForce = options?.force === true
  const isCustomTarget = Boolean(targetRegistry || targetPlugin)

  // For backwards compatibility, still register core modifiers if needed
  if (!isCustomTarget && coreModifiersRegistered && !shouldForce) {
    return
  }

  // Note: Individual modifier registration is no longer needed
  // since modifiers are imported directly from @tachui/modifiers

  if (!isCustomTarget) {
    coreModifiersRegistered = true
  }
}

// Auto-register for backwards compatibility
if (typeof window !== 'undefined') {
  registerCoreModifiers()
}
