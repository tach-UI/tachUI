/**
 * Backwards compatibility layer for modifiers
 *
 * This file provides re-exports from @tachui/modifiers to maintain
 * compatibility during the restructuring process.
 */

// TODO: Once @tachui/modifiers is built and published, these will be real imports
// For now, we'll re-export from the existing local files

// Base modifier classes
export {
  AnimationModifier,
  AppearanceModifier,
  BaseModifier,
  InteractionModifier,
  LayoutModifier,
  ResizableModifier,
} from './modifiers/base'

// Appearance modifiers (newly extracted)
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

// Builder system
export {
  applyModifiers,
  createModifierBuilder,
  ModifierBuilderImpl,
  modifierUtils,
} from './modifiers/builder'

// Core modifiers
export {
  animationModifiers,
  appearanceModifiers,
  coreModifiers,
  interactionModifiers,
  layoutModifiers,
  presetModifiers,
} from './modifiers/core'

export type { CSSOptions, ReactiveCSSOptions } from './modifiers/css'
export {
  CSSModifier,
  css,
  cssProperty,
  cssVariable,
  cssVendor,
} from './modifiers/css'

export type {
  FlexboxOptions,
  ReactiveFlexboxOptions,
} from './modifiers/flexbox'
export {
  alignItems,
  FlexboxModifier,
  flexbox,
  flexGrow,
  flexShrink,
  gap,
  justifyContent,
} from './modifiers/flexbox'

export type { MarginOptions, ReactiveMarginOptions } from './modifiers/margin'
export {
  MarginModifier,
  margin,
  marginBottom,
  marginHorizontal,
  marginTop,
  marginVertical,
} from './modifiers/margin'

export type {
  PaddingOptions,
  ReactivePaddingOptions,
} from './modifiers/padding'
export {
  PaddingModifier,
  padding,
  paddingBottom,
  paddingHorizontal,
  paddingLeading,
  paddingLeft,
  paddingPresets,
  paddingRight,
  paddingTop,
  paddingTrailing,
  paddingVertical,
} from './modifiers/padding'

// Registry and application
export {
  applyModifiersToNode,
  createModifiableComponent,
  createModifierRegistry,
  globalModifierRegistry,
} from './modifiers/registry'

// Re-export types for the new modifiers
export type { ReactiveSizeOptions, SizeOptions } from './modifiers/size'
// New multi-property modifiers
export {
  height,
  maxHeight,
  maxWidth,
  minHeight,
  minWidth,
  SizeModifier,
  size,
  width,
} from './modifiers/size'

// Types
export type {
  AnimationModifierProps,
  AppearanceModifierProps,
  AssetValue,
  ColorValue,
  CSSClassNames,
  CSSStyleProperties,
  InteractionModifierProps,
  LayoutModifierProps,
  ModifiableComponent,
  Modifier,
  ModifierApplicationOptions,
  ModifierBuilder,
  ModifierContext,
  ModifierRegistry,
  ModifierResult,
  ReactiveModifierProps,
  StyleComputationContext,
} from './modifiers/types'
export { ModifierPriority } from './modifiers/types'

export type {
  FontWeight,
  ReactiveTypographyOptions,
  TextAlign,
  TextTransform,
  TypographyOptions,
} from './modifiers/typography'
// Export textCase alias
export {
  fontSize,
  fontWeight,
  letterSpacing,
  lineHeight,
  TypographyModifier,
  textAlign,
  textCase,
  textTransform,
  typography,
  fontFamily,
} from './modifiers/typography'

// Font modifiers
export type { FontOptions } from './modifiers/font'
export { font, system, custom } from './modifiers/font'
export type {
  ReactiveUtilityOptions,
  UtilityOptions,
} from './modifiers/utility'
export {
  display,
  overflowX,
  overflowY,
  position,
  UtilityModifier,
  utility,
  zIndex,
} from './modifiers/utility'

// Responsive Design System
export * from './modifiers/responsive'

// Shadow System
export type {
  ShadowConfig,
  ShadowPreset,
  ShadowOptions,
  ReactiveShadowOptions,
} from './modifiers/shadows'
export {
  ShadowModifier,
  shadow,
  shadows,
  textShadow,
  shadowPreset,
  createShadowPreset,
  getShadowPresets,
  getShadowPreset,
} from './modifiers/shadows'

// Scroll System
export type {
  ScrollConfig,
  OverscrollBehaviorValue,
  ScrollOptions,
  ReactiveScrollOptions,
} from './modifiers/scroll'
export {
  ScrollModifier,
  scroll,
  scrollBehavior,
  overscrollBehavior,
  overscrollBehaviorX,
  overscrollBehaviorY,
  scrollMargin,
  scrollPadding,
  scrollSnap,
} from './modifiers/scroll'

// Effects System (Hover & Cursor)
export type {
  CSSCursorValue,
  CursorOptions,
  ReactiveCursorOptions,
  SwiftUIHoverEffect,
  HoverStyles,
  HoverOptions,
  ReactiveHoverOptions,
} from './modifiers/effects'
export {
  CursorModifier,
  HoverModifier,
  cursor,
  hoverEffect,
  hover,
  hoverWithTransition,
  conditionalHover,
  interactiveCursor,
  draggableCursor,
  textCursor,
  disabledCursor,
  loadingCursor,
  helpCursor,
  zoomCursor,
  buttonHover,
  cardHover,
  linkHover,
  imageHover,
} from './modifiers/effects'

// Transform System
export type {
  TransformConfig,
  Transform3DConfig,
  ModifierTransformOptions,
  ReactiveTransformOptions,
  MatrixTransformConfig,
  Advanced3DTransformConfig,
  ModifierAdvancedTransformOptions,
  ReactiveAdvancedTransformOptions,
} from './modifiers/transformations'
export {
  TransformModifier,
  AdvancedTransformModifier,
  transform,
  scale,
  rotate,
  translate,
  skew,
  rotateX,
  rotateY,
  rotateZ,
  perspective,
  advancedTransform,
  matrix,
  matrix3d,
  rotate3d,
  scale3d,
  translate3d,
  scaleX,
  scaleY,
  scaleZ,
  translateX,
  translateY,
  translateZ,
  perspectiveOrigin,
  transformStyle,
  backfaceVisibility,
  scaleEffect,
  offset,
} from './modifiers/transformations'

// Transition System
export type {
  TransitionConfig,
  TransitionsConfig,
  ModifierTransitionOptions,
  ReactiveTransitionOptions,
} from './modifiers/transitions'
export {
  TransitionModifier,
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
} from './modifiers/transitions'

// Filter System
export type {
  FilterConfig,
  FilterOptions,
  ReactiveFilterOptions,
} from './modifiers/filters'
export {
  FilterModifier,
  filter,
  blur,
  brightness,
  contrast,
  saturate,
  grayscale,
  sepia,
  hueRotate,
  invert,
  dropShadow,
  vintagePhoto,
  blackAndWhite,
  vibrant,
  warmTone,
  coolTone,
  faded,
  highKey,
  lowKey,
  softFocus,
  highContrastMode,
  subtleBlur,
  darkModeInvert,
  colorInvert,
  saturation,
  hueRotation,
} from './modifiers/filters'

// Pseudo-element System
export type {
  PseudoElementStyles,
  PseudoElementOptions,
  ReactivePseudoElementOptions,
} from './modifiers/elements'
export {
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
} from './modifiers/elements'

// HTML and ARIA Attributes
export type {
  IdOptions,
  DataAttributes,
  DataOptions,
  AriaAttributes,
  AriaOptions,
  TabIndexOptions,
  CSSCustomPropertiesConfig,
  CustomPropertiesOptions,
  ReactiveCustomPropertiesOptions,
} from './modifiers/attributes'
export {
  IdModifier,
  DataModifier,
  AriaModifier,
  TabIndexModifier,
  CustomPropertiesModifier,
  id,
  data,
  aria,
  tabIndex,
  customProperties,
  customProperty,
  cssVariables,
  themeColors,
  designTokens,
} from './modifiers/attributes'

// Text Modifiers
export type {
  LineClampOptions,
  WordBreakValue,
  WordBreakOptions,
  OverflowWrapValue,
  OverflowWrapOptions,
  HyphensValue,
  HyphensOptions,
  BackgroundClipOptions,
  ReactiveBackgroundClipOptions,
} from './modifiers/text'
export {
  LineClampModifier,
  WordBreakModifier,
  OverflowWrapModifier,
  HyphensModifier,
  BackgroundClipModifier,
  lineClamp,
  wordBreak,
  overflowWrap,
  hyphens,
  backgroundClip,
  gradientText,
  backgroundImage,
  blueGradientText,
  rainbowGradientText,
  sunsetGradientText,
  oceanGradientText,
  natureGradientText,
  goldGradientText,
  silverGradientText,
} from './modifiers/text'

// Backdrop Filter Modifiers (Unified Implementation)
export type {
  BackdropFilterConfig,
  BackdropFilterOptions,
  GlassmorphismIntensity,
} from './modifiers/backdrop'
export {
  BackdropFilterModifier,
  backdropFilter,
  glassmorphism,
  customGlassmorphism,
} from './modifiers/backdrop'

// Grid Layout Modifiers - Re-export from @tachui/grid
// export type { GridSpanConfig } from '@tachui/grid' // Temporarily commented out to break circular dependency
// export {
//   GridColumnSpanModifier,
//   GridRowSpanModifier,
//   GridAreaModifier,
//   GridCellAlignmentModifier,
//   GridItemConfigModifier,
//   gridColumnSpan,
//   gridRowSpan,
//   gridArea,
//   gridCellAlignment,
//   gridItemConfig,
//   gridCellColumns,
//   gridCellRows,
//   gridCellAnchor,
// } from '@tachui/grid' // Temporarily commented out to break circular dependency

// HTML Rendering Modifiers
export type { AsHTMLOptions, TextComponent } from './modifiers/as-html'
export { AsHTMLModifier, asHTML } from './modifiers/as-html'

// Utilities
export {
  classModifier,
  combineModifiers,
  conditionalModifier,
  createCustomModifier,
  eventModifier,
  modifierHelpers,
  responsiveModifier,
  stateModifier,
  styleModifier,
} from './modifiers/utils'

// This file will eventually look like:
// export * from '@tachui/modifiers'
