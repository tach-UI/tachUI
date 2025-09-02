/**
 * SwiftUI Modifier System
 *
 * A comprehensive modifier system inspired by SwiftUI that enables
 * declarative styling and behavior modification of components.
 */

// Base classes
// Export ResizableModifier
export {
  AnimationModifier,
  AppearanceModifier,
  BaseModifier,
  InteractionModifier,
  LayoutModifier,
  ResizableModifier,
} from './base'
export { BackgroundModifier } from './background'
export type {
  BorderOptions,
  BorderSide,
  BorderStyle,
  ReactiveBorderOptions,
  CornerRadiusValue,
  CornerRadiusConfig,
  CornerRadiusOptions,
  ReactiveCornerRadiusOptions,
} from './border'
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
} from './border'
// Builder system
export {
  applyModifiers,
  createModifierBuilder,
  ModifierBuilderImpl,
  modifierUtils,
} from './builder'
// Core modifiers
export {
  animationModifiers,
  appearanceModifiers,
  coreModifiers,
  interactionModifiers,
  layoutModifiers,
  presetModifiers,
} from './core'
export type { CSSOptions, ReactiveCSSOptions } from './css'
export { CSSModifier, css, cssProperty, cssVariable, cssVendor } from './css'
export type { FlexboxOptions, ReactiveFlexboxOptions } from './flexbox'
export {
  alignItems,
  FlexboxModifier,
  flexbox,
  flexGrow,
  flexShrink,
  gap,
  justifyContent,
} from './flexbox'
export type { MarginOptions, ReactiveMarginOptions } from './margin'
export {
  MarginModifier,
  margin,
  marginBottom,
  marginHorizontal,
  marginTop,
  marginVertical,
} from './margin'
export type { PaddingOptions, ReactivePaddingOptions } from './padding'
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
} from './padding'
// Registry and application
export {
  applyModifiersToNode,
  createModifiableComponent,
  createModifierRegistry,
  globalModifierRegistry,
} from './registry'

// Re-export types for the new modifiers
export type { ReactiveSizeOptions, SizeOptions } from './size'
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
} from './size'
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
} from './types'
export { ModifierPriority } from './types'
export type {
  FontWeight,
  ReactiveTypographyOptions,
  TextAlign,
  TextTransform,
  TypographyOptions,
} from './typography'
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
} from './typography'

// Font modifiers
export type { FontOptions } from './font'
export { font, system, custom } from './font'
export type { ReactiveUtilityOptions, UtilityOptions } from './utility'
export {
  display,
  overflowX,
  overflowY,
  position,
  UtilityModifier,
  utility,
  zIndex,
} from './utility'
// Responsive Design System moved to @tachui/responsive - import directly from that package

// Shadow System
export type {
  ShadowConfig,
  ShadowPreset,
  ShadowOptions,
  ReactiveShadowOptions,
} from './shadows'
export {
  ShadowModifier,
  shadow,
  shadows,
  textShadow,
  shadowPreset,
  createShadowPreset,
  getShadowPresets,
  getShadowPreset,
} from './shadows'

// Scroll System
export type {
  ScrollConfig,
  OverscrollBehaviorValue,
  ScrollOptions,
  ReactiveScrollOptions,
} from './scroll'
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
} from './scroll'

// Effects System (Hover & Cursor)
export type {
  CSSCursorValue,
  CursorOptions,
  ReactiveCursorOptions,
  SwiftUIHoverEffect,
  HoverStyles,
  HoverOptions,
  ReactiveHoverOptions,
} from './effects'
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
} from './effects'

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
} from './transformations'
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
} from './transformations'

// Transition System
export type {
  TransitionConfig,
  TransitionsConfig,
  ModifierTransitionOptions,
  ReactiveTransitionOptions,
} from './transitions'
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
} from './transitions'

// Filter System
export type {
  FilterConfig,
  FilterOptions,
  ReactiveFilterOptions,
} from './filters'
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
} from './filters'

// Pseudo-element System
export type {
  PseudoElementStyles,
  PseudoElementOptions,
  ReactivePseudoElementOptions,
} from './elements'
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
} from './elements'

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
} from './attributes'
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
} from './attributes'

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
} from './text'
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
} from './text'

// Backdrop Filter Modifiers (Unified Implementation)
export type {
  BackdropFilterConfig,
  BackdropFilterOptions,
  GlassmorphismIntensity,
} from './backdrop'
export {
  BackdropFilterModifier,
  backdropFilter,
  glassmorphism,
  customGlassmorphism,
} from './backdrop'

// Grid Layout Modifiers have been moved to @tachui/grid package

// HTML Rendering Modifiers
export type { AsHTMLOptions, TextComponent } from './as-html'
export { AsHTMLModifier, asHTML } from './as-html'

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
} from './utils'
