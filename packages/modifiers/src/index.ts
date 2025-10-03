/**
 * TachUI Modifiers - Styling System
 *
 * Comprehensive modifier system for declarative styling and behavior modification
 *
 * Auto-registers all modifiers with the global registry when imported.
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

// Basic layout modifiers - implemented
export * from './basic'

// Layout modifiers - implemented
export * from './layout'

// Utility modifiers - implemented
export * from './utility'

// Appearance modifiers - implemented
export * from './appearance'

// Typography modifiers - implemented
export * from './typography'

// Interaction modifiers - implemented
export * from './interaction'

// Responsive modifiers - implemented
export * from './responsive'

// Element modifiers - pseudo-elements and decorations
export * from './elements'

// Attribute modifiers - HTML, ARIA, and CSS properties
export * from './attributes'

// ============================================================================
// AUTO-REGISTRATION SYSTEM
// ============================================================================

// Import all modifier factory functions for auto-registration
import {
  // Basic modifiers
  padding,
  paddingTop,
  paddingBottom,
  paddingLeft,
  paddingRight,
  paddingLeading,
  paddingTrailing,
  paddingHorizontal,
  paddingVertical,
  margin,
  marginTop,
  marginBottom,
  marginLeft,
  marginRight,
  marginLeading,
  marginTrailing,
  marginHorizontal,
  marginVertical,
  size,
  width,
  height,
  maxWidth,
  maxHeight,
  minWidth,
  minHeight,
  transition,
} from './basic'

import {
  // Layout modifiers - only import factory functions
  aspectRatio,
  fixedSize,
  offset,
  overlay,
  position,
  scaleEffect,
  zIndex,
  flexGrow,
  flexShrink,
  alignItems,
  justifyContent,
  flexDirection,
  flexWrap,
  gap,
} from './layout'

import {
  // Appearance modifiers - core functions only
  backgroundColor,
  border,
  borderTop,
  borderBottom,
  borderLeft,
  borderRight,
  clipShape,
  clipped,
  foregroundColor,
  gradientText,
} from './appearance'

import {
  // Typography modifiers - core functions only
  typography,
  textAlign,
  font,
  lineClamp,
  wordBreak,
  letterSpacing,
  lineHeight,
  textDecoration,
  textOverflow,
  textTransform,
  textCase,
  whiteSpace,
  overflow,
  hyphens,
  overflowWrap,
} from './typography'

import {
  // Interaction modifiers
  allowsHitTesting,
  focusable,
  activatable,
  editable,
  focused,
  keyboardShortcut,
  onHover,
  onMouseEnter,
  onMouseLeave,
  onMouseDown,
  onMouseUp,
  onDoubleClick,
  onContextMenu,
  onKeyDown,
  onKeyUp,
  onKeyPress,
  onFocus,
  onBlur,
  onContinuousHover,
  onLongPressGesture,
  scroll,
  scrollBehavior,
  overscrollBehavior,
  overscrollBehaviorX,
  overscrollBehaviorY,
  scrollMargin,
  scrollPadding,
  scrollSnap,
} from './interaction'

import {
  // Utility modifiers
  css,
  cssProperty,
  cssVariable,
  utility,
  cursor,
  display,
  overflowX,
  overflowY,
  outline,
  outlineOffset,
} from './utility'

import {
  // Attribute modifiers
  aria,
  customProperties,
  customProperty,
  cssVariables,
  id,
  data,
  tabIndex,
} from './attributes'

import {
  // Element modifiers
  before,
  after,
  pseudoElements,
  iconBefore,
  iconAfter,
  lineBefore,
  lineAfter,
  quotes,
  underline,
  badge,
  tooltip,
  cornerRibbon,
  spinner,
} from './elements'

import {
  // Only legitimate interaction effects (hover is an interaction modifier)
  hover,
} from './effects'

// Re-export only legitimate modifiers
export {
  hover,
} from './effects'

/**
 * Modifier registration entries: [registryKey, factoryFunction]
 */
const modifierRegistrations: Array<[string, (...args: any[]) => any]> = [
  // Basic layout modifiers
  ['padding', padding],
  ['paddingTop', paddingTop],
  ['paddingBottom', paddingBottom],
  ['paddingLeft', paddingLeft],
  ['paddingRight', paddingRight],
  ['paddingLeading', paddingLeading],
  ['paddingTrailing', paddingTrailing],
  ['paddingHorizontal', paddingHorizontal],
  ['paddingVertical', paddingVertical],

  ['margin', margin],
  ['marginTop', marginTop],
  ['marginBottom', marginBottom],
  ['marginLeft', marginLeft],
  ['marginRight', marginRight],
  ['marginLeading', marginLeading],
  ['marginTrailing', marginTrailing],
  ['marginHorizontal', marginHorizontal],
  ['marginVertical', marginVertical],

  ['size', size],
  ['width', width],
  ['height', height],
  ['maxWidth', maxWidth],
  ['maxHeight', maxHeight],
  ['minWidth', minWidth],
  ['minHeight', minHeight],

  // Advanced layout modifiers - only core functions that exist
  ['aspectRatio', aspectRatio],
  ['fixedSize', fixedSize],
  ['offset', offset],
  ['overlay', overlay],
  ['position', position],
  ['scaleEffect', scaleEffect],
  ['zIndex', zIndex],

  // Flexbox modifiers
  ['flexGrow', flexGrow],
  ['flexShrink', flexShrink],
  ['alignItems', alignItems],
  ['justifyContent', justifyContent],
  ['flexDirection', flexDirection],
  ['flexWrap', flexWrap],
  ['gap', gap],

  // Appearance modifiers - core functions only
  ['backgroundColor', backgroundColor],
  ['border', border],
  ['borderTop', borderTop],
  ['borderBottom', borderBottom],
  ['borderLeft', borderLeft],
  ['borderRight', borderRight],
  ['clipShape', clipShape],
  ['clipped', clipped],
  ['foregroundColor', foregroundColor],
  ['gradientText', gradientText],

  // Typography modifiers - core functions only
  ['typography', typography],
  ['textAlign', textAlign],
  ['font', font],
  ['lineClamp', lineClamp],
  ['wordBreak', wordBreak],
  ['letterSpacing', letterSpacing],
  ['lineHeight', lineHeight],
  ['textDecoration', textDecoration],
  ['textOverflow', textOverflow],
  ['textTransform', textTransform],
  ['textCase', textCase],
  ['whiteSpace', whiteSpace],
  ['overflow', overflow],
  ['hyphens', hyphens],
  ['overflowWrap', overflowWrap],

  // Interaction modifiers
  ['allowsHitTesting', allowsHitTesting],

  ['focusable', focusable],
  ['activatable', activatable],
  ['editable', editable],

  ['focused', focused],

  ['keyboardShortcut', keyboardShortcut],

  // Basic event handlers
  ['onHover', onHover],
  ['onMouseEnter', onMouseEnter],
  ['onMouseLeave', onMouseLeave],
  ['onMouseDown', onMouseDown],
  ['onMouseUp', onMouseUp],
  ['onDoubleClick', onDoubleClick],
  ['onContextMenu', onContextMenu],
  ['onKeyDown', onKeyDown],
  ['onKeyUp', onKeyUp],
  ['onKeyPress', onKeyPress],
  ['onFocus', onFocus],
  ['onBlur', onBlur],

  ['onContinuousHover', onContinuousHover],

  ['onLongPressGesture', onLongPressGesture],

  ['scroll', scroll],
  ['scrollBehavior', scrollBehavior],
  ['overscrollBehavior', overscrollBehavior],
  ['overscrollBehaviorX', overscrollBehaviorX],
  ['overscrollBehaviorY', overscrollBehaviorY],
  ['scrollMargin', scrollMargin],
  ['scrollPadding', scrollPadding],
  ['scrollSnap', scrollSnap],

  // Utility modifiers
  ['css', css],
  ['cssProperty', cssProperty],
  ['cssVariable', cssVariable],
  ['utility', utility],
  ['cursor', cursor],
  ['display', display],
  ['overflowX', overflowX],
  ['overflowY', overflowY],
  ['outline', outline],
  ['outlineOffset', outlineOffset],
  ['transition', transition],

  // Attribute modifiers
  ['aria', aria],

  ['customProperties', customProperties],
  ['customProperty', customProperty],
  ['cssVariables', cssVariables],

  ['id', id],
  ['data', data],
  ['tabIndex', tabIndex],

  // Element modifiers
  ['before', before],
  ['after', after],
  ['pseudoElements', pseudoElements],
  ['iconBefore', iconBefore],
  ['iconAfter', iconAfter],
  ['lineBefore', lineBefore],
  ['lineAfter', lineAfter],
  ['quotes', quotes],
  ['underline', underline],
  ['badge', badge],
  ['tooltip', tooltip],
  ['cornerRibbon', cornerRibbon],
  ['spinner', spinner],

  // Effects modifiers (interaction effects only - visual effects should come from @tachui/effects)
  ['hover', hover],
]

/**
 * Register all modifiers with lazy loading
 */
function registerModifiersLazy(): void {
  let registeredCount = 0
  let failedCount = 0

  modifierRegistrations.forEach(([name, factory]) => {
    try {
      globalModifierRegistry.registerLazy(name, () => factory)
      registeredCount++
    } catch (error) {
      console.warn(`Failed to register lazy modifier '${name}':`, error)
      failedCount++
    }
  })

  console.log(
    `@tachui/modifiers: Registered ${registeredCount} lazy loaders for modifiers${
      failedCount > 0 ? `, ${failedCount} failed` : ''
    }. Registry total: ${globalModifierRegistry.list().length}`
  )
}

// Register all modifiers with lazy loading when this module is imported
registerModifiersLazy()

// Export function for manual registration if needed
export { registerModifiersLazy as registerModifiers }

// Package Information - consistent across all TachUI packages
export { TACHUI_PACKAGE, TACHUI_PACKAGE_VERSION } from './version'
