/**
 * SwiftUI Modifier System Types
 *
 * Core type definitions for the SwiftUI-inspired modifier system.
 * Enables chaining modifiers on components similar to SwiftUI.
 */

import type { Signal } from '@tachui/core/reactive/types'
import type {
  ComponentInstance,
  ComponentProps,
  DOMNode,
} from '@tachui/core/runtime/types'

// Re-export for convenience
export type { DOMNode } from '@tachui/core/runtime/types'
// Temporary type definitions until we migrate all types
export type Dimension = number | string | 'infinity'
export interface StatefulBackgroundValue {
  default: any
  hover?: any
  active?: any
  focus?: any
  disabled?: any
}

// Basic asset interfaces - simplified for now
export interface Asset {
  resolve(): any
}
export interface ColorAssetProxy extends Asset {}
export interface ImageAssetProxy extends Asset {}
export interface FontAssetProxy extends Asset {}

/**
 * Valid color value types for modifiers
 */
export type ColorValue = string | Asset | ColorAssetProxy | Signal<string>

/**
 * Valid asset types for modifiers
 */
export type AssetValue =
  | Asset
  | ColorAssetProxy
  | ImageAssetProxy
  | FontAssetProxy

/**
 * Text component interface for type safety with asHTML modifier
 */
export interface TextComponent extends ComponentInstance {
  readonly __tachui_component_type: 'Text'
  content: string
}

/**
 * Base modifier interface that all modifiers must implement
 */
export interface Modifier<TProps = {}> {
  readonly type: string
  readonly priority: number
  readonly properties: TProps
  apply(node: DOMNode, context: ModifierContext): DOMNode | undefined
}

/**
 * Context passed to modifiers during application
 */
export interface ModifierContext {
  componentId: string
  componentInstance?: ComponentInstance
  element?: Element
  parentElement?: Element
  phase: 'creation' | 'update' | 'cleanup'
  previousModifiers?: Modifier[]
}

/**
 * Modifier application result
 */
export interface ModifierResult {
  node: DOMNode
  effects?: (() => void)[]
  cleanup?: (() => void)[]
}

/**
 * Reactive modifier properties that can contain signals
 */
export type ReactiveModifierProps<T> = {
  [K in keyof T]: T[K] | Signal<T[K]>
}

/**
 * Strict TextShadow configuration interface
 * Prevents common mistakes like using 'radius' instead of 'blur'
 */
export interface TextShadowConfig {
  readonly x: number
  readonly y: number
  readonly blur: number
  readonly color: string
}

/**
 * Layout modifier properties
 */
export interface LayoutModifierProps {
  frame?: {
    width?: Dimension
    height?: Dimension
    minWidth?: Dimension
    maxWidth?: Dimension
    minHeight?: Dimension
    maxHeight?: Dimension
  }
  padding?:
    | {
        top?: number
        right?: number
        bottom?: number
        left?: number
      }
    | number
  margin?:
    | {
        top?: number | string
        right?: number | string
        bottom?: number | string
        left?: number | string
      }
    | number
    | string
  alignment?: 'leading' | 'center' | 'trailing' | 'top' | 'bottom'
  layoutPriority?: number
  offset?: {
    x?: number
    y?: number
  }
  aspectRatio?: {
    ratio?: number
    contentMode?: 'fit' | 'fill'
  }
  fixedSize?: {
    horizontal?: boolean
    vertical?: boolean
  }
  // Transform Properties (Phase 3 - Epic: Butternut)
  scaleEffect?: {
    x?: number
    y?: number
    anchor?:
      | 'center'
      | 'top'
      | 'topLeading'
      | 'topTrailing'
      | 'bottom'
      | 'bottomLeading'
      | 'bottomTrailing'
      | 'leading'
      | 'trailing'
  }
  position?: {
    x?: number
    y?: number
  }
  zIndex?: number
}

/**
 * Appearance modifier properties
 */
export interface AppearanceModifierProps {
  foregroundColor?: ColorValue
  backgroundColor?: ColorValue
  background?: StatefulBackgroundValue
  opacity?: number
  font?: {
    family?: string
    size?: number | string | Signal<number> | Signal<string>
    weight?:
      | 'normal'
      | 'bold'
      | '100'
      | '200'
      | '300'
      | '400'
      | '500'
      | '600'
      | '700'
      | '800'
      | '900'
    style?: 'normal' | 'italic' | 'oblique'
  }
  cornerRadius?: number
  border?: {
    width?: number | Signal<number>
    color?: ColorValue
    style?: 'solid' | 'dashed' | 'dotted'
  }
  shadow?: {
    color?: string
    radius?: number
    x?: number
    y?: number
  }
  clipped?: boolean
  clipShape?: {
    shape: 'circle' | 'ellipse' | 'rect' | 'polygon'
    parameters?: Record<string, any>
  }
  // Visual Effects (Phase 2 - Epic: Butternut)
  blur?: number // CSS filter: blur(Npx)
  brightness?: number // CSS filter: brightness(N) - 1.0 is normal
  contrast?: number // CSS filter: contrast(N) - 1.0 is normal
  saturation?: number // CSS filter: saturate(N) - 1.0 is normal
  hueRotation?: number // CSS filter: hue-rotate(Ndeg)
  grayscale?: number // CSS filter: grayscale(N) - 0.0 to 1.0
  colorInvert?: number // CSS filter: invert(N) - 0.0 to 1.0
}

/**
 * Interaction modifier properties
 */
export interface InteractionModifierProps {
  // Existing mouse events
  onTap?: (event: MouseEvent) => void
  onHover?: (isHovered: boolean) => void
  onMouseEnter?: (event: MouseEvent) => void
  onMouseLeave?: (event: MouseEvent) => void
  onMouseDown?: (event: MouseEvent) => void
  onMouseUp?: (event: MouseEvent) => void
  onDoubleClick?: (event: MouseEvent) => void
  onContextMenu?: (event: MouseEvent) => void

  // Existing drag events
  onDragStart?: (event: DragEvent) => void
  onDragOver?: (event: DragEvent) => void
  onDragLeave?: (event: DragEvent) => void
  onDrop?: (event: DragEvent) => void

  // Focus events (onFocus exists, adding onBlur)
  onFocus?: (isFocused: boolean) => void
  onBlur?: (isFocused: boolean) => void

  // Keyboard events
  onKeyPress?: (event: KeyboardEvent) => void
  onKeyDown?: (event: KeyboardEvent) => void
  onKeyUp?: (event: KeyboardEvent) => void

  // Scroll and wheel events
  onScroll?: (event: Event) => void
  onWheel?: (event: WheelEvent) => void

  // Input events
  onInput?: (event: InputEvent) => void
  onChange?: (value: any, event?: Event) => void

  // Clipboard events
  onCopy?: (event: ClipboardEvent) => void
  onCut?: (event: ClipboardEvent) => void
  onPaste?: (event: ClipboardEvent) => void

  // Touch events
  onTouchStart?: (event: TouchEvent) => void
  onTouchMove?: (event: TouchEvent) => void
  onTouchEnd?: (event: TouchEvent) => void
  onTouchCancel?: (event: TouchEvent) => void

  // Other events
  onSelect?: (event: Event) => void

  // Advanced Gesture Modifiers (Phase 4 - Epic: Butternut)
  onLongPressGesture?: {
    minimumDuration?: number // ms, default 500
    maximumDistance?: number // px, default 10
    perform: () => void
    onPressingChanged?: (isPressing: boolean) => void
  }

  // Keyboard Shortcuts (Phase 4 - Epic: Butternut)
  keyboardShortcut?: {
    key: string
    modifiers?: ('cmd' | 'ctrl' | 'shift' | 'alt' | 'meta')[]
    action: () => void
  }

  // Focus Management (Phase 4 - Epic: Butternut)
  focused?: boolean | Signal<boolean>
  focusable?: {
    isFocusable?: boolean
    interactions?: ('activate' | 'edit')[]
  }

  // Enhanced Hover Tracking (Phase 4 - Epic: Butternut)
  onContinuousHover?: {
    coordinateSpace?: 'local' | 'global'
    perform: (location: { x: number; y: number } | null) => void
  }

  // Gesture Priority System (Phase 4 - Epic: Butternut)
  highPriorityGesture?: {
    gesture: any // Will define gesture types later
    including?: ('all' | 'subviews' | 'none')[]
  }
  simultaneousGesture?: {
    gesture: any
    including?: ('all' | 'subviews' | 'none')[]
  }

  // Hit Testing Control (Phase 4 - Epic: Butternut)
  allowsHitTesting?: boolean

  // Existing state properties
  disabled?: boolean
  draggable?: boolean
  accessibilityLabel?: string
  accessibilityHint?: string
}

/**
 * Animation modifier properties
 */
export interface AnimationModifierProps {
  transition?: {
    property?: string
    duration?: number
    easing?: string
    delay?: number
  }
  animation?: {
    keyframes?: Record<string, Record<string, string>>
    duration?: number
    easing?: string
    iterations?: number | 'infinite'
    direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse'
  }
  transform?: string | Signal<string>
  rotationEffect?: {
    angle: number
    anchor?:
      | 'center'
      | 'top'
      | 'topLeading'
      | 'topTrailing'
      | 'bottom'
      | 'bottomLeading'
      | 'bottomTrailing'
      | 'leading'
      | 'trailing'
  }
  overlay?: {
    content: any // ComponentInstance or function that returns ComponentInstance
    alignment?:
      | 'center'
      | 'top'
      | 'bottom'
      | 'leading'
      | 'trailing'
      | 'topLeading'
      | 'topTrailing'
      | 'bottomLeading'
      | 'bottomTrailing'
  }
}

/**
 * Lifecycle modifier properties
 */
export interface LifecycleModifierProps {
  onAppear?: () => void
  onDisappear?: () => void
  task?: {
    operation: () => Promise<void> | void
    id?: string
    priority?: 'background' | 'userInitiated' | 'utility' | 'default'
  }
  refreshable?: {
    onRefresh: () => Promise<void>
    isRefreshing?: boolean | Signal<boolean>
  }
}

/**
 * Modifier factory function type
 */
export type ModifierFactory<TProps = {}> = (
  props: ReactiveModifierProps<TProps>
) => Modifier<TProps>

/**
 * Modifier builder interface for creating chainable modifiers
 */
export interface ModifierBuilder<
  T extends ComponentInstance = ComponentInstance,
> {
  // Layout modifiers
  frame(width?: Dimension, height?: Dimension): ModifierBuilder<T>
  frame(options: LayoutModifierProps['frame']): ModifierBuilder<T>
  padding(value: number): ModifierBuilder<T>
  padding(options: LayoutModifierProps['padding']): ModifierBuilder<T>
  margin(value: number | string): ModifierBuilder<T>
  margin(options: LayoutModifierProps['margin']): ModifierBuilder<T>

  // New multi-property modifiers
  size(options: {
    width?: Dimension
    height?: Dimension
    minWidth?: Dimension
    maxWidth?: Dimension
    minHeight?: Dimension
    maxHeight?: Dimension
  }): ModifierBuilder<T>
  width(value: Dimension): ModifierBuilder<T>
  height(value: Dimension): ModifierBuilder<T>
  maxWidth(value: Dimension): ModifierBuilder<T>
  minWidth(value: Dimension): ModifierBuilder<T>
  maxHeight(value: Dimension): ModifierBuilder<T>
  minHeight(value: Dimension): ModifierBuilder<T>
  marginTop(value: number | string): ModifierBuilder<T>
  marginBottom(value: number | string): ModifierBuilder<T>
  marginHorizontal(value: number | string): ModifierBuilder<T>
  marginVertical(value: number | string): ModifierBuilder<T>

  // Typography modifiers
  typography(options: {
    size?: number | string
    weight?: string | number
    family?: string
    lineHeight?: number | string
    letterSpacing?: number | string
    align?: string
    transform?: string
    decoration?: string
    variant?: string
    style?: string
    color?: string
  }): ModifierBuilder<T>
  textAlign(
    value: 'left' | 'center' | 'right' | 'justify' | 'start' | 'end'
  ): ModifierBuilder<T>
  textTransform(
    value: 'none' | 'uppercase' | 'lowercase' | 'capitalize'
  ): ModifierBuilder<T>
  letterSpacing(value: number | string): ModifierBuilder<T>
  lineHeight(value: number | string): ModifierBuilder<T>
  gradientText(gradient: string): ModifierBuilder<T>

  // Border modifiers
  borderTop(
    width: number | Signal<number>,
    color: ColorValue,
    style?:
      | 'solid'
      | 'dashed'
      | 'dotted'
      | 'double'
      | 'groove'
      | 'ridge'
      | 'inset'
      | 'outset'
  ): ModifierBuilder<T>
  borderRight(
    width: number | Signal<number>,
    color: ColorValue,
    style?:
      | 'solid'
      | 'dashed'
      | 'dotted'
      | 'double'
      | 'groove'
      | 'ridge'
      | 'inset'
      | 'outset'
  ): ModifierBuilder<T>
  borderBottom(
    width: number | Signal<number>,
    color: ColorValue,
    style?:
      | 'solid'
      | 'dashed'
      | 'dotted'
      | 'double'
      | 'groove'
      | 'ridge'
      | 'inset'
      | 'outset'
  ): ModifierBuilder<T>
  borderLeft(
    width: number | Signal<number>,
    color: ColorValue,
    style?:
      | 'solid'
      | 'dashed'
      | 'dotted'
      | 'double'
      | 'groove'
      | 'ridge'
      | 'inset'
      | 'outset'
  ): ModifierBuilder<T>

  // Flexbox modifiers
  flexGrow(value: number): ModifierBuilder<T>
  flexShrink(value: number): ModifierBuilder<T>
  justifyContent(
    value:
      | 'flex-start'
      | 'flex-end'
      | 'center'
      | 'space-between'
      | 'space-around'
      | 'space-evenly'
  ): ModifierBuilder<T>
  alignItems(
    value: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline'
  ): ModifierBuilder<T>
  gap(value: number | string): ModifierBuilder<T>
  flexDirection(
    value: 'row' | 'row-reverse' | 'column' | 'column-reverse'
  ): ModifierBuilder<T>
  flexWrap(value: 'nowrap' | 'wrap' | 'wrap-reverse'): ModifierBuilder<T>

  // Utility modifiers
  cursor(
    value:
      | 'auto'
      | 'default'
      | 'pointer'
      | 'text'
      | 'wait'
      | 'help'
      | 'not-allowed'
      | 'grab'
      | 'grabbing'
  ): ModifierBuilder<T>
  overflowY(value: 'visible' | 'hidden' | 'scroll' | 'auto'): ModifierBuilder<T>
  overflowX(value: 'visible' | 'hidden' | 'scroll' | 'auto'): ModifierBuilder<T>
  position(
    value: 'static' | 'relative' | 'absolute' | 'fixed' | 'sticky'
  ): ModifierBuilder<T>
  zIndex(value: number): ModifierBuilder<T>
  display(
    value:
      | 'block'
      | 'inline'
      | 'inline-block'
      | 'flex'
      | 'inline-flex'
      | 'grid'
      | 'none'
  ): ModifierBuilder<T>
  transform(value: string | Signal<string>): ModifierBuilder<T>

  // Raw CSS modifiers
  css(properties: {
    [property: string]: string | number | undefined
  }): ModifierBuilder<T>
  cssProperty(property: string, value: string | number): ModifierBuilder<T>
  cssVariable(name: string, value: string | number): ModifierBuilder<T>

  // Phase 1 SwiftUI modifiers
  offset(
    x: number | Signal<number>,
    y?: number | Signal<number>
  ): ModifierBuilder<T>
  clipped(): ModifierBuilder<T>
  rotationEffect(
    angle: number | Signal<number>,
    anchor?:
      | 'center'
      | 'top'
      | 'topLeading'
      | 'topTrailing'
      | 'bottom'
      | 'bottomLeading'
      | 'bottomTrailing'
      | 'leading'
      | 'trailing'
  ): ModifierBuilder<T>

  // Phase 2 SwiftUI modifiers
  aspectRatio(
    ratio?: number | Signal<number>,
    contentMode?: 'fit' | 'fill'
  ): ModifierBuilder<T>
  fixedSize(horizontal?: boolean, vertical?: boolean): ModifierBuilder<T>
  clipShape(
    shape: 'circle' | 'ellipse' | 'rect' | 'polygon',
    parameters?: Record<string, any>
  ): ModifierBuilder<T>
  overlay(
    content: any,
    alignment?:
      | 'center'
      | 'top'
      | 'bottom'
      | 'leading'
      | 'trailing'
      | 'topLeading'
      | 'topTrailing'
      | 'bottomLeading'
      | 'bottomTrailing'
  ): ModifierBuilder<T>

  // Phase 3 SwiftUI modifiers - Critical Transform Modifiers
  scaleEffect(
    x: number | Signal<number>,
    y?: number | Signal<number>,
    anchor?:
      | 'center'
      | 'top'
      | 'topLeading'
      | 'topTrailing'
      | 'bottom'
      | 'bottomLeading'
      | 'bottomTrailing'
      | 'leading'
      | 'trailing'
  ): ModifierBuilder<T>

  // Note: SwiftUI-style position for absolute positioning (different from CSS position)
  absolutePosition(
    x: number | Signal<number>,
    y: number | Signal<number>
  ): ModifierBuilder<T>

  // Appearance modifiers
  foregroundColor(color: ColorValue): ModifierBuilder<T>
  backgroundColor(color: ColorValue): ModifierBuilder<T>
  background(
    value: StatefulBackgroundValue | Signal<string>
  ): ModifierBuilder<T>
  font(options: AppearanceModifierProps['font']): ModifierBuilder<T>
  font(size: number | string): ModifierBuilder<T>
  fontWeight(
    weight: NonNullable<AppearanceModifierProps['font']>['weight']
  ): ModifierBuilder<T>
  fontSize(
    size: number | string | Signal<number> | Signal<string>
  ): ModifierBuilder<T>
  opacity(value: number | Signal<number>): ModifierBuilder<T>
  cornerRadius(radius: number | Signal<number>): ModifierBuilder<T>
  border(width: number | Signal<number>, color?: ColorValue): ModifierBuilder<T>
  border(options: AppearanceModifierProps['border']): ModifierBuilder<T>
  borderWidth(width: number | Signal<number>): ModifierBuilder<T>
  shadow(options: AppearanceModifierProps['shadow']): ModifierBuilder<T>
  shadow(config: {
    x: number
    y: number
    blur: number
    color: string
    spread?: number
    inset?: boolean
  }): ModifierBuilder<T>
  shadows(
    configs: Array<{
      x: number
      y: number
      blur: number
      color: string
      spread?: number
      inset?: boolean
    }>
  ): ModifierBuilder<T>
  textShadow(config: TextShadowConfig): ModifierBuilder<T>
  shadowPreset(presetName: string): ModifierBuilder<T>

  // Visual Effects Modifiers (Phase 2 - Epic: Butternut)

  // ============================================================================
  // VISUAL EFFECTS METHODS MOVED TO @tachui/modifiers/effects
  // ============================================================================
  // Visual effects methods (filters, transforms, backdrop, hover) have been
  // moved to the @tachui/modifiers/effects entry point. Import and use with .apply():
  //
  //   import { blur, scale, glassmorphism, hoverEffect } from '@tachui/modifiers/effects'
  //   VStack().apply(blur(5)).apply(scale(1.1))
  //
  // This provides better tree-shaking and cleaner plugin boundaries.
  // ============================================================================

  // Advanced Gesture Modifiers (Phase 4 - Epic: Butternut)
  onLongPressGesture(options: {
    minimumDuration?: number
    maximumDistance?: number
    perform: () => void
    onPressingChanged?: (isPressing: boolean) => void
  }): ModifierBuilder<T>

  // Keyboard Shortcuts (Phase 4 - Epic: Butternut)
  keyboardShortcut(
    key: string,
    modifiers: ('cmd' | 'ctrl' | 'shift' | 'alt' | 'meta')[],
    action: () => void
  ): ModifierBuilder<T>

  // Focus Management (Phase 4 - Epic: Butternut)
  focused(binding: boolean | Signal<boolean>): ModifierBuilder<T>
  focusable(
    isFocusable?: boolean,
    interactions?: ('activate' | 'edit')[]
  ): ModifierBuilder<T>

  // Enhanced Hover Tracking (Phase 4 - Epic: Butternut)
  onContinuousHover(
    coordinateSpace: 'local' | 'global',
    perform: (location: { x: number; y: number } | null) => void
  ): ModifierBuilder<T>

  // Gesture Priority System (Phase 4 - Epic: Butternut)
  highPriorityGesture(
    gesture: any,
    including?: ('all' | 'subviews' | 'none')[]
  ): ModifierBuilder<T>
  simultaneousGesture(
    gesture: any,
    including?: ('all' | 'subviews' | 'none')[]
  ): ModifierBuilder<T>

  // Hit Testing Control (Phase 4 - Epic: Butternut)
  allowsHitTesting(enabled: boolean): ModifierBuilder<T>

  // HTML and ARIA Attributes
  id(value: string): ModifierBuilder<T>
  data(attributes: {
    [key: string]: string | number | boolean
  }): ModifierBuilder<T>
  aria(attributes: {
    [key: string]: string | number | boolean | undefined
  }): ModifierBuilder<T>
  tabIndex(value: number): ModifierBuilder<T>

  // Text Modifiers
  lineClamp(lines: number): ModifierBuilder<T>
  wordBreak(
    value: 'normal' | 'break-all' | 'keep-all' | 'break-word'
  ): ModifierBuilder<T>
  overflowWrap(value: 'normal' | 'break-word' | 'anywhere'): ModifierBuilder<T>
  hyphens(value: 'none' | 'manual' | 'auto'): ModifierBuilder<T>

  // Backdrop Filter Modifiers (Unified Implementation)
  backdropFilter(
    config: {
      blur?: number
      brightness?: number
      contrast?: number
      saturate?: number
      [key: string]: any
    },
    fallbackColor?: ColorValue
  ): ModifierBuilder<T>
  backdropFilter(
    cssValue: string,
    fallbackColor?: ColorValue
  ): ModifierBuilder<T>
  glassmorphism(
    intensity?: 'subtle' | 'light' | 'medium' | 'heavy',
    customFallback?: ColorValue
  ): ModifierBuilder<T>

  // Pseudo-element modifiers
  before(styles: {
    content: string
    color?: string
    [key: string]: any
  }): ModifierBuilder<T>
  after(styles: {
    content: string
    color?: string
    [key: string]: any
  }): ModifierBuilder<T>

  // State modifiers
  disabled(isDisabled?: boolean | Signal<boolean>): ModifierBuilder<T>

  // Animation modifiers
  transition(
    property?: string,
    duration?: number,
    easing?: string,
    delay?: number
  ): ModifierBuilder<T>
  transitions(config: any): ModifierBuilder<T>
  animation(options: AnimationModifierProps['animation']): ModifierBuilder<T>

  // Transition presets
  fadeTransition(duration?: number): ModifierBuilder<T>
  transformTransition(duration?: number): ModifierBuilder<T>
  colorTransition(duration?: number): ModifierBuilder<T>
  layoutTransition(duration?: number): ModifierBuilder<T>
  buttonTransition(): ModifierBuilder<T>
  cardTransition(): ModifierBuilder<T>
  modalTransition(): ModifierBuilder<T>
  smoothTransition(duration?: number): ModifierBuilder<T>
  quickTransition(duration?: number): ModifierBuilder<T>
  slowTransition(duration?: number): ModifierBuilder<T>

  // Scroll modifiers
  scroll(config: any): ModifierBuilder<T>
  scrollBehavior(value: 'auto' | 'smooth'): ModifierBuilder<T>
  overscrollBehavior(value: 'auto' | 'contain' | 'none'): ModifierBuilder<T>
  overscrollBehaviorX(value: 'auto' | 'contain' | 'none'): ModifierBuilder<T>
  overscrollBehaviorY(value: 'auto' | 'contain' | 'none'): ModifierBuilder<T>
  scrollMargin(
    margin:
      | number
      | string
      | {
          top?: number | string
          right?: number | string
          bottom?: number | string
          left?: number | string
        }
  ): ModifierBuilder<T>
  scrollPadding(
    padding:
      | number
      | string
      | {
          top?: number | string
          right?: number | string
          bottom?: number | string
          left?: number | string
        }
  ): ModifierBuilder<T>
  scrollSnap(
    type:
      | 'none'
      | 'x mandatory'
      | 'y mandatory'
      | 'x proximity'
      | 'y proximity'
      | 'both mandatory'
      | 'both proximity',
    align?: 'start' | 'end' | 'center',
    stop?: 'normal' | 'always'
  ): ModifierBuilder<T>

  // Lifecycle modifiers
  onAppear(handler: () => void): ModifierBuilder<T>
  onDisappear(handler: () => void): ModifierBuilder<T>
  task(
    operation: () => Promise<void> | void,
    options?: {
      id?: string
      priority?: 'background' | 'userInitiated' | 'utility' | 'default'
    }
  ): ModifierBuilder<T>
  refreshable(
    onRefresh: () => Promise<void>,
    isRefreshing?: boolean | Signal<boolean>
  ): ModifierBuilder<T>

  // Custom modifier application
  modifier(modifier: Modifier): ModifierBuilder<T>

  // Text case alias for textTransform
  textCase(
    value: 'none' | 'uppercase' | 'lowercase' | 'capitalize'
  ): ModifierBuilder<T>

  // HTML Content Rendering (Text components only)
  /**
   * Render component content as HTML instead of plain text
   *
   * ⚠️ **RESTRICTION**: Only available on Text components for security
   * ⚠️ **SECURITY NOTICE**: This modifier treats content as HTML.
   * - Default: Basic sanitization removes common XSS vectors
   * - Use skipSanitizer: true only with fully trusted content
   * - Consider DOMPurify for comprehensive sanitization
   * - Non-reactive for performance (content is processed once)
   *
   * @param options - Configuration options
   *
   * @example
   * ```typescript
   * // ✅ Allowed: Text components only
   * Text('<p>Hello <strong>world</strong></p>').asHTML().build()
   *
   * // ❌ Compile Error: Not a Text component
   * VStack({}).asHTML() // TypeScript error
   *
   * // ✅ Dangerous: Skip sanitization
   * Text(serverTemplate).asHTML({ skipSanitizer: true }).build()
   * ```
   */
  asHTML(options?: { skipSanitizer?: boolean }): ModifierBuilder<T>

  // Responsive functionality moved to @tachui/responsive package

  // Interaction modifiers
  onTap(handler: (event: MouseEvent) => void): ModifierBuilder<T>
  onFocus(handler: (isFocused: boolean) => void): ModifierBuilder<T>
  onBlur(handler: (isFocused: boolean) => void): ModifierBuilder<T>
  onKeyDown(handler: (event: KeyboardEvent) => void): ModifierBuilder<T>
  onScroll(handler: (event: Event) => void): ModifierBuilder<T>
  onKeyPress(handler: (event: KeyboardEvent) => void): ModifierBuilder<T>
  onKeyUp(handler: (event: KeyboardEvent) => void): ModifierBuilder<T>
  onDoubleClick(handler: (event: MouseEvent) => void): ModifierBuilder<T>
  onContextMenu(handler: (event: MouseEvent) => void): ModifierBuilder<T>
  onWheel(handler: (event: WheelEvent) => void): ModifierBuilder<T>
  onInput(handler: (event: InputEvent) => void): ModifierBuilder<T>
  onChange(handler: (value: any, event?: Event) => void): ModifierBuilder<T>
  onCopy(handler: (event: ClipboardEvent) => void): ModifierBuilder<T>
  onCut(handler: (event: ClipboardEvent) => void): ModifierBuilder<T>
  onPaste(handler: (event: ClipboardEvent) => void): ModifierBuilder<T>
  onSelect(handler: (event: Event) => void): ModifierBuilder<T>

  // Transition modifiers
  transition(
    property?: string,
    duration?: number,
    easing?: string,
    delay?: number
  ): ModifierBuilder<T>

  addModifier(modifier: Modifier): void

  // Build the final component with all modifiers applied
  build(): T
}

/**
 * Modifiable component - components that can have modifiers applied
 */
export interface ModifiableComponent<P extends ComponentProps = ComponentProps>
  extends ComponentInstance<P> {
  modifiers: Modifier[]
  modifierBuilder?: ModifierBuilder<ModifiableComponent<P>>
  _originalComponent?: ComponentInstance<P>
}

/**
 * CSS style properties that can be generated by modifiers
 */
export interface CSSStyleProperties {
  [property: string]:
    | string
    | number
    | Signal<string>
    | Signal<number>
    | undefined
}

/**
 * CSS class names that can be applied by modifiers
 */
export interface CSSClassNames {
  base?: string[]
  state?: Record<string, string[]>
  responsive?: Record<string, string[]>
}

/**
 * Modifier registry for registering custom modifiers
 */
export interface ModifierRegistry {
  register<TProps>(name: string, factory: ModifierFactory<TProps>): void
  get<TProps>(name: string): ModifierFactory<TProps> | undefined
  has(name: string): boolean
  list(): string[]
}

/**
 * Modifier application options
 */
export interface ModifierApplicationOptions {
  immediate?: boolean
  batch?: boolean
  suppressEffects?: boolean
  enableAnimations?: boolean
}

/**
 * Modifier priority levels for ordering
 */
export enum ModifierPriority {
  LAYOUT = 100,
  APPEARANCE = 200,
  INTERACTION = 300,
  ANIMATION = 400,
  CUSTOM = 500,
}

/**
 * Modifier application strategy
 */
export type ModifierApplicationStrategy =
  | 'sequential' // Apply modifiers one by one in order
  | 'batch' // Batch all style changes and apply at once
  | 'immediate' // Apply each modifier immediately

/**
 * Style computation context for reactive styles
 */
export interface StyleComputationContext {
  componentId: string
  element: Element
  modifiers: Modifier[]
  signals: Set<Signal<any>>
  cleanup: (() => void)[]
}
