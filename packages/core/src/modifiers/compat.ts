/**
 * Modifier Compatibility Layer
 * 
 * This module provides backwards compatibility for existing code that imports
 * modifiers from @tachui/core/modifiers, while directing developers to use
 * @tachui/modifiers for new development.
 */

import * as ModernModifiers from '@tachui/modifiers'

// Re-export all modern modifier implementations
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
} = ModernModifiers

// Re-export types for backwards compatibility
export type {
  Modifier,
  ModifierContext,
  ModifierPriority,
  AppearanceModifierProps,
  LayoutModifierProps,
  FontWeight,
  MarginValue,
  PaddingValue,
  BorderOptions,
  CornerRadiusValue,
  PositionOptions,
  ZIndexValue,
  ScaleEffectOptions,
  OverlayOptions,
  CustomPropertyOptions,
  CssVariableOptions,
  ThemeColorOptions,
  DesignTokenOptions
} from '@tachui/modifiers'

// Core modifier system exports
export {
  BaseModifier,
  registerModifierWithMetadata,
  createModifiableComponent
} from '@tachui/modifiers'

// Add deprecation warning function for development
export function warnDeprecation(oldImport: string, newImport: string) {
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      `@tachui/core: '${oldImport}' is deprecated.\n` +
      `Import from '${newImport}' instead.\n` +
      `This compatibility layer will be removed in v1.0.`
    )
  }
}

// Example usage of deprecation warnings (uncomment as needed):
/*
if (process.env.NODE_ENV === 'development') {
  // Warn when specific legacy patterns are used
  console.warn(
    '@tachui/core: Individual modifier imports are deprecated.\n' +
    'Import modifiers directly from @tachui/modifiers instead.\n' +
    'Example: import { fontSize } from "@tachui/modifiers"'
  )
}
*/