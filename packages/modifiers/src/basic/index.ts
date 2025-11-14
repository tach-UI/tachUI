/**
 * Basic Modifiers Preload
 *
 * Synchronous preload and registration of all basic modifier families:
 * layout, typography, appearance, interaction, utility, responsive, elements, attributes
 */

// Registry registration for basic modifiers
import { globalModifierRegistry } from '@tachui/registry'
import type { ModifierRegistry } from '@tachui/registry'
import { TACHUI_PACKAGE_VERSION } from '../version'

// Import specific factory functions to register them
import {
  padding,
  paddingTop,
  paddingBottom,
  paddingLeft,
  paddingRight,
  paddingLeading,
  paddingTrailing,
  paddingHorizontal,
  paddingVertical,
} from './padding'
import {
  margin,
  marginTop,
  marginBottom,
  marginLeft,
  marginRight,
  marginLeading,
  marginTrailing,
  marginHorizontal,
  marginVertical,
} from './margin'
import {
  size,
  width,
  height,
  maxWidth,
  maxHeight,
  minWidth,
  minHeight,
} from './size'
import { transition } from './animation'

import {
  aspectRatio,
  fixedSize,
  offset,
  overlay,
  position,
  scaleEffect,
  zIndex,
  flexbox,
  flexGrow,
  flexShrink,
  flexBasis,
  justifyContent,
  alignItems,
  alignSelf,
  gap,
  flexDirection,
  flexWrap,
} from '../layout'

import {
  backgroundColor,
  background,
  border,
  borderTop,
  borderBottom,
  borderLeft,
  borderRight,
  clipShape,
  clipped,
  foregroundColor,
  gradientText,
} from '../appearance'

import {
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
} from '../typography'

import {
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
} from '../interaction'

import {
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
} from '../utility'

import {
  aria,
  customProperties,
  customProperty,
  cssVariables,
  id,
  data,
  tabIndex,
} from '../attributes'

import {
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
} from '../elements'

const basicModifierRegistrations: Array<[string, (...args: any[]) => any]> = [
  // Padding
  ['padding', padding],
  ['paddingTop', paddingTop],
  ['paddingBottom', paddingBottom],
  ['paddingLeft', paddingLeft],
  ['paddingRight', paddingRight],
  ['paddingLeading', paddingLeading],
  ['paddingTrailing', paddingTrailing],
  ['paddingHorizontal', paddingHorizontal],
  ['paddingVertical', paddingVertical],

  // Margin
  ['margin', margin],
  ['marginTop', marginTop],
  ['marginBottom', marginBottom],
  ['marginLeft', marginLeft],
  ['marginRight', marginRight],
  ['marginLeading', marginLeading],
  ['marginTrailing', marginTrailing],
  ['marginHorizontal', marginHorizontal],
  ['marginVertical', marginVertical],

  // Size helpers
  ['size', size],
  ['width', width],
  ['height', height],
  ['maxWidth', maxWidth],
  ['maxHeight', maxHeight],
  ['minWidth', minWidth],
  ['minHeight', minHeight],

  // Layout + flexbox
  ['aspectRatio', aspectRatio],
  ['fixedSize', fixedSize],
  ['offset', offset],
  ['overlay', overlay],
  ['position', position],
  ['scaleEffect', scaleEffect],
  ['zIndex', zIndex],
  ['flexbox', flexbox],
  ['flexGrow', flexGrow],
  ['flexShrink', flexShrink],
  ['flexBasis', flexBasis],
  ['justifyContent', justifyContent],
  ['alignItems', alignItems],
  ['alignSelf', alignSelf],
  ['gap', gap],
  ['flexDirection', flexDirection],
  ['flexWrap', flexWrap],

  // Appearance
  ['backgroundColor', backgroundColor],
  ['background', background],
  ['border', border],
  ['borderTop', borderTop],
  ['borderBottom', borderBottom],
  ['borderLeft', borderLeft],
  ['borderRight', borderRight],
  ['clipShape', clipShape],
  ['clipped', clipped],
  ['foregroundColor', foregroundColor],
  ['gradientText', gradientText],

  // Typography
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

  // Interaction
  ['allowsHitTesting', allowsHitTesting],
  ['focusable', focusable],
  ['activatable', activatable],
  ['editable', editable],
  ['focused', focused],
  ['keyboardShortcut', keyboardShortcut],
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

  // Utility
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

  // Attributes
  ['aria', aria],
  ['customProperties', customProperties],
  ['customProperty', customProperty],
  ['cssVariables', cssVariables],
  ['id', id],
  ['elementId', id],
  ['viewId', id],
  ['data', data],
  ['tabIndex', tabIndex],

  // Elements / pseudo elements
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

type RegisterOptions = {
  registry?: ModifierRegistry
}

export function registerBasicModifiers(options?: RegisterOptions): void {
  const targetRegistry = options?.registry ?? globalModifierRegistry

  targetRegistry.registerPlugin?.({
    name: '@tachui/modifiers',
    version: TACHUI_PACKAGE_VERSION,
    author: 'tachUI Team',
    verified: true,
  })

  basicModifierRegistrations.forEach(([name, factory]) => {
    if (!targetRegistry.has(name)) {
      targetRegistry.register(name, factory as any)
    }
  })
}

// Register with global registry on module load
registerBasicModifiers()

// Export all types and utilities
export type * from '../types'
export { createModifierBuilder } from '@tachui/core/modifiers'

// Re-export all basic modifiers
export * from '../layout'
export * from '../typography'
export * from '../appearance'
export * from '../interaction'
export * from '../utility'
export * from '../responsive'
export * from '../elements'
export * from '../attributes'

// Legacy exports for backward compatibility
export * from './padding'
export * from './margin'
export * from './size'
export * from './animation'
