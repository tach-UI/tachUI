/**
 * TachUI Modifiers - Styling System
 *
 * Comprehensive modifier system for declarative styling and behavior modification
 *
 * Auto-registers all modifiers with the global registry when imported.
 */

import { globalModifierRegistry } from '@tachui/core'

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

// Import all modifier classes and factory functions
import {
  // Basic modifiers
  PaddingModifier,
  padding,
  paddingTop,
  paddingBottom,
  paddingLeft,
  paddingRight,
  paddingLeading,
  paddingTrailing,
  paddingHorizontal,
  paddingVertical,
  MarginModifier,
  margin,
  marginTop,
  marginBottom,
  marginLeft,
  marginRight,
  marginLeading,
  marginTrailing,
  marginHorizontal,
  marginVertical,
  SizeModifier,
  size,
  width,
  height,
  maxWidth,
  maxHeight,
  minWidth,
  minHeight,
} from './basic'

import {
  // Layout modifiers - only import what definitely exists
  AspectRatioModifier,
  aspectRatio,
  FixedSizeModifier,
  fixedSize,
  FlexboxModifier,
  OffsetModifier,
  offset,
  OverlayModifier,
  overlay,
  PositionModifier,
  position,
  ScaleEffectModifier,
  scaleEffect,
  ZIndexModifier,
  zIndex,
} from './layout'

import {
  // Appearance modifiers - core functions only
  BackgroundModifier,
  backgroundColor,
  BorderModifier,
  border,
  ClipShapeModifier,
  clipShape,
  ClippedModifier,
  clipped,
  ForegroundModifier,
  foregroundColor,
} from './appearance'

import {
  // Typography modifiers - core functions only
  TypographyModifier,
  typography,
  textAlign,
  font,
  LineClampModifier,
  lineClamp,
  WordBreakModifier,
  wordBreak,
} from './typography'

import {
  // Interaction modifiers
  AllowsHitTestingModifier,
  allowsHitTesting,
  FocusableModifier,
  focusable,
  activatable,
  editable,
  FocusedModifier,
  focused,
  KeyboardShortcutModifier,
  keyboardShortcut,
  OnContinuousHoverModifier,
  onContinuousHover,
  OnLongPressGestureModifier,
  onLongPressGesture,
  ScrollModifier,
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
  CSSModifier,
  css,
  cssProperty,
  cssVariable,
  UtilityModifier,
  utility,
} from './utility'

import {
  // Attribute modifiers
  AriaModifier,
  aria,
  CustomPropertiesModifier,
  customProperties,
  customProperty,
  cssVariables,
  IdModifier,
  id,
  DataModifier,
  data,
  TabIndexModifier,
  tabIndex,
} from './attributes'

import {
  // Element modifiers
  PseudoElementModifier,
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

  // Appearance modifiers - core functions only
  ['backgroundColor', backgroundColor],
  ['border', border],
  ['clipShape', clipShape],
  ['clipped', clipped],
  ['foregroundColor', foregroundColor],

  // Typography modifiers - core functions only
  ['typography', typography],
  ['textAlign', textAlign],
  ['font', font],
  ['lineClamp', lineClamp],
  ['wordBreak', wordBreak],

  // Interaction modifiers
  ['allowsHitTesting', allowsHitTesting],

  ['focusable', focusable],
  ['activatable', activatable],
  ['editable', editable],

  ['focused', focused],

  ['keyboardShortcut', keyboardShortcut],

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
]

/**
 * Register all modifiers with the global registry
 */
function registerModifiers(): void {
  let registeredCount = 0
  let failedCount = 0

  modifierRegistrations.forEach(([name, factory]) => {
    try {
      globalModifierRegistry.register(name, factory)
      registeredCount++
    } catch (error) {
      console.warn(`Failed to register modifier '${name}':`, error)
      failedCount++
    }
  })

  console.log(
    `@tachui/modifiers: Registered ${registeredCount} modifiers${
      failedCount > 0 ? `, ${failedCount} failed` : ''
    }`
  )
}

// Auto-register all modifiers when this module is imported
registerModifiers()
