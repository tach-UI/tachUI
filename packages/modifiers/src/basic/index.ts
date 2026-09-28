/**
 * Basic Modifiers Preload
 *
 * Synchronous preload and registration of all basic modifier families:
 * layout, typography, appearance, interaction, utility, responsive, elements, attributes
 */

// Registry registration for basic modifiers
import { globalModifierRegistry } from '@tachui/registry'
import type {
  ModifierMetadata,
  ModifierRegistry,
  PluginInfo,
} from '@tachui/registry'
import { registerModifierWithMetadata } from '@tachui/core/modifiers'
import type { ComponentInstance } from '@tachui/types/runtime'
import type {
  ModifierFactoriesOf,
  ModifierMethodsOf,
  ModifierRegistrationList,
} from '@tachui/types/modifiers'
import type { PaddingBuilderMethods } from './padding'
import type { MarginBuilderMethods } from './margin'
import type { AsHTMLBuilderMethods } from '../utility/as-html'
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
import { transition, rotationEffect } from './animation'
import {
  animation as animationModifier,
  transform as transformModifier,
} from '../animation'
import { task as taskModifier } from '../lifecycle'

import {
  aspectRatio,
  fixedSize,
  offset,
  overlay,
  position,
  scaleEffect,
  resizable,
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
  frame,
  layoutPriority,
  absolutePosition,
} from '../layout'

import {
  backgroundColor,
  background,
  backgroundImage,
  blendMode,
  backgroundBlendMode,
  compositingGroup,
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
  cornerRadius,
  opacity,
  fontFamilyModifier,
  fontSizeModifier,
  fontWeightModifier,
  fontStyleModifier,
  fontPreset,
} from '../appearance/reactive-factories'

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
  highPriorityGesture,
  simultaneousGesture,
  onTap,
  onScroll,
  onWheel,
  onInput,
  onChange,
  onCopy,
  onCut,
  onPaste,
  onSelect,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onSwipeLeft,
  onSwipeRight,
  disabled,
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
  asHTML,
} from '../utility'
import {
  navigationTitle,
  navigationBarHidden,
  navigationBarItems,
} from '../navigation'

import {
  aria,
  customProperties,
  customProperty,
  cssVariables,
  id,
  data,
  tabIndex,
  ariaLabel,
  ariaLive,
  ariaDescribedBy,
  ariaModal,
  role,
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

export const basicModifierRegistrations = [
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
  ['frame', frame],
  ['resizable', resizable],
  ['layoutPriority', layoutPriority],
  ['offset', offset],
  ['overlay', overlay],
  ['position', position],
  ['absolutePosition', absolutePosition],
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
  ['backgroundImage', backgroundImage],
  ['blendMode', blendMode],
  ['backgroundBlendMode', backgroundBlendMode],
  ['compositingGroup', compositingGroup],
  ['border', border],
  ['borderTop', borderTop],
  ['borderBottom', borderBottom],
  ['borderLeft', borderLeft],
  ['borderRight', borderRight],
  ['clipShape', clipShape],
  ['clipped', clipped],
  ['cornerRadius', cornerRadius],
  ['foregroundColor', foregroundColor],
  ['gradientText', gradientText],
  ['opacity', opacity],
  ['fontFamily', fontFamilyModifier],
  ['fontSize', fontSizeModifier],
  ['fontWeight', fontWeightModifier],
  ['fontStyle', fontStyleModifier],
  ['fontPreset', fontPreset],

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
  ['highPriorityGesture', highPriorityGesture],
  ['simultaneousGesture', simultaneousGesture],
  ['onTap', onTap],
  ['onScroll', onScroll],
  ['onWheel', onWheel],
  ['onInput', onInput],
  ['onChange', onChange],
  ['onCopy', onCopy],
  ['onCut', onCut],
  ['onPaste', onPaste],
  ['onSelect', onSelect],
  ['onTouchStart', onTouchStart],
  ['onTouchMove', onTouchMove],
  ['onTouchEnd', onTouchEnd],
  ['onSwipeLeft', onSwipeLeft],
  ['onSwipeRight', onSwipeRight],
  ['disabled', disabled],

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
  ['asHTML', asHTML],
  ['navigationTitle', navigationTitle],
  ['navigationBarHidden', navigationBarHidden],
  ['navigationBarItems', navigationBarItems],
  ['animation', animationModifier],
  ['transform', transformModifier],
  ['transition', transition],
  ['rotationEffect', rotationEffect],

  // Attributes
  ['aria', aria],
  ['ariaLabel', ariaLabel],
  ['ariaLive', ariaLive],
  ['ariaDescribedBy', ariaDescribedBy],
  ['ariaModal', ariaModal],
  ['role', role],
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
  // Lifecycle
  ['task', taskModifier],
] as const satisfies ModifierRegistrationList

// Type every basic modifier on the builder, from the factories registered
// above, so a chain method typechecks only if it exists once this module has
// run. `padding` and `margin` are overloaded, which derivation would collapse
// to the last overload, and `asHTML` carries a security notice that derivation
// would drop, so those three come from their own interfaces.
declare module '@tachui/types/modifiers' {
  interface ModifierBuilder<T extends ComponentInstance = ComponentInstance>
    extends PaddingBuilderMethods,
      MarginBuilderMethods,
      AsHTMLBuilderMethods,
      ModifierMethodsOf<
        ModifierFactoriesOf<typeof basicModifierRegistrations>,
        'padding' | 'margin' | 'asHTML'
      > {}
}

type RegisterOptions = {
  registry?: ModifierRegistry
}

const MODIFIERS_PLUGIN_INFO: PluginInfo = {
  name: '@tachui/modifiers',
  version: TACHUI_PACKAGE_VERSION,
  author: 'tachUI Team',
  verified: true,
}

// The gesture modifiers carry their own event wiring and teardown, outside
// core's InteractionModifier, and register with metadata.
const gestureModifierMetadata: Record<
  string,
  Omit<ModifierMetadata, 'name' | 'plugin'>
> = {
  onLongPressGesture: {
    category: 'interaction',
    priority: 85,
    signature: '(options: OnLongPressGestureOptions) => Modifier',
    description:
      'Calls perform after the pointer is held for minimumDuration without moving past maximumDistance.',
  },
  keyboardShortcut: {
    category: 'interaction',
    priority: 80,
    signature: '(options: KeyboardShortcutOptions) => Modifier',
    description:
      'Calls action when the key is pressed with the given modifier keys.',
  },
  focused: {
    category: 'interaction',
    priority: 75,
    signature: '(focused: boolean | Signal<boolean>) => Modifier',
    description: 'Focuses or blurs the element, following a signal if given.',
  },
  focusable: {
    category: 'interaction',
    priority: 75,
    signature:
      "(isFocusable?: boolean, interactions?: ('activate' | 'edit')[]) => Modifier",
    description:
      'Makes the element focusable, with optional keyboard activation or editing.',
  },
  onContinuousHover: {
    category: 'interaction',
    priority: 70,
    signature: '(options: OnContinuousHoverOptions) => Modifier',
    description:
      'Reports the pointer location while it hovers the element, and null when it leaves.',
  },
  allowsHitTesting: {
    category: 'interaction',
    priority: 95,
    signature: '(enabled: boolean) => Modifier',
    description:
      'When false, pointer events pass through the element to what is behind it.',
  },
}

export function registerBasicModifiers(options?: RegisterOptions): void {
  const targetRegistry = options?.registry ?? globalModifierRegistry

  targetRegistry.registerPlugin?.(MODIFIERS_PLUGIN_INFO)

  basicModifierRegistrations.forEach(([name, factory]) => {
    const metadata = gestureModifierMetadata[name]
    if (metadata) {
      registerModifierWithMetadata(
        name,
        factory,
        metadata,
        targetRegistry,
        MODIFIERS_PLUGIN_INFO
      )
    } else if (!targetRegistry.has(name)) {
      targetRegistry.register(name, factory as any)
    }
  })
}

// Register with global registry on module load
registerBasicModifiers()

// Export core helper
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
