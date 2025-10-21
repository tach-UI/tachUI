/**
 * SwiftUI Modifier System Types
 *
 * Core type definitions for the SwiftUI-inspired modifier system.
 * Enables chaining modifiers on components similar to SwiftUI.
 */

import type { Signal } from '../reactive/types'
import type {
  ComponentInstance,
  ComponentProps,
  DOMNode,
} from '../runtime/types'
// Typography types
export type FontWeight =
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
  | 100
  | 200
  | 300
  | 400
  | 500
  | 600
  | 700
  | 800
  | 900
export type FontStyle = 'normal' | 'italic' | 'oblique'
export type FontVariant = 'normal' | 'small-caps'
export type TextAlign =
  | 'left'
  | 'center'
  | 'right'
  | 'justify'
  | 'start'
  | 'end'
export type TextDecoration = 'none' | 'underline' | 'overline' | 'line-through'
export type TextTransform = 'none' | 'uppercase' | 'lowercase' | 'capitalize'
import type { Dimension } from '../constants/layout'
import type { StatefulBackgroundValue } from '../gradients/types'
// Responsive types moved to @tachui/responsive package
import type { Asset } from '../assets/Asset'
import type {
  ColorAssetProxy,
  ImageAssetProxy,
  FontAssetProxy,
} from '../assets/types'

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
    family?: string | AssetValue
    size?: number | string | Signal<number> | Signal<string>
    weight?: FontWeight
    style?: FontStyle
  }
  cornerRadius?: number
  border?: {
    width?: number | Signal<number>
    color?: ColorValue
    style?: 'solid' | 'dashed' | 'dotted'
  }
  // shadow moved to @tachui/effects package
  // clipped moved to @tachui/modifiers package
  // clipShape moved to @tachui/modifiers package
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

  // Gesture Priority System (Phase 4 - Epic: Butternut)
  highPriorityGesture?: {
    gesture: any // Will define gesture types later
    including?: ('all' | 'subviews' | 'none')[]
  }
  simultaneousGesture?: {
    gesture: any
    including?: ('all' | 'subviews' | 'none')[]
  }

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
  // overlay moved to @tachui/modifiers package
  scaleEffect?: {
    x: number
    y?: number
    anchor?:
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
  task?: {
    operation: () => Promise<void> | void
    id?: string
    priority?: 'background' | 'userInitiated' | 'utility' | 'default'
  }
  onAppear?: () => void
  onDisappear?: () => void
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

  // Padding, margin, size modifiers moved to @tachui/modifiers
  // Available via Proxy when @tachui/modifiers is imported

  // Typography modifiers (most moved to @tachui/modifiers, available via Proxy)
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
  // clipped() moved to @tachui/modifiers

  // Phase 2 SwiftUI modifiers
  // clipShape() moved to @tachui/modifiers
  // overlay() moved to @tachui/modifiers

  // Phase 3 SwiftUI modifiers - Critical Transform Modifiers

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
  // shadow, shadows, textShadow, shadowPreset moved to @tachui/effects package

  // Visual Effects Modifiers (Phase 2 - Epic: Butternut)

  // ============================================================================
  // VISUAL EFFECTS METHODS MOVED TO @tachui/effects
  // ============================================================================
  // Visual effects methods (filters, transforms, backdrop, hover) have been
  // moved to @tachui/effects package. Import and use with .apply():
  //
  //   import { blur, scale, glassmorphism, hoverEffect } from '@tachui/effects'
  //   VStack().apply(blur(5)).apply(scale(1.1))
  //
  // This provides better tree-shaking and cleaner plugin boundaries.
  // ============================================================================

  // Gesture Priority System (Phase 4 - Epic: Butternut)
  highPriorityGesture(
    gesture: any,
    including?: ('all' | 'subviews' | 'none')[]
  ): ModifierBuilder<T>
  simultaneousGesture(
    gesture: any,
    including?: ('all' | 'subviews' | 'none')[]
  ): ModifierBuilder<T>

  // HTML and ARIA Attributes moved to @tachui/modifiers
  // Available via Proxy when @tachui/modifiers is imported:
  // - id(), data(), aria(), tabIndex()

  // Text Modifiers
  lineClamp(lines: number): ModifierBuilder<T>
  wordBreak(
    value: 'normal' | 'break-all' | 'keep-all' | 'break-word'
  ): ModifierBuilder<T>
  overflowWrap(value: 'normal' | 'break-word' | 'anywhere'): ModifierBuilder<T>
  hyphens(value: 'none' | 'manual' | 'auto'): ModifierBuilder<T>



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
  // onAppear and onDisappear have been moved to @tachui/viewport/modifiers
  // to fix architectural dependency issues
  task(
    operation: () => Promise<void> | void,
    options?: {
      id?: string
      priority?: 'background' | 'userInitiated' | 'utility' | 'default'
    }
  ): ModifierBuilder<T>

  // Custom modifier application
  modifier(modifier: Modifier): ModifierBuilder<T>

  // Resizable modifier for images
  resizable(): ModifierBuilder<T>

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
   * Text('<p>Hello <strong>world</strong></p>').modifier.asHTML().build()
   *
   * // ❌ Compile Error: Not a Text component
   * VStack({}).modifier.asHTML() // TypeScript error
   *
   * // ✅ Dangerous: Skip sanitization
   * Text(serverTemplate).modifier.asHTML({ skipSanitizer: true }).build()
   * ```
   */

  // Raw CSS modifiers
  css(properties: {
    [property: string]: string | number | undefined
  }): ModifierBuilder<T>
  cssProperty(property: string, value: string | number): ModifierBuilder<T>
  cssVariable(name: string, value: string | number): ModifierBuilder<T>
  cssVendor(
    prefix: 'webkit' | 'moz' | 'ms' | 'o',
    property: string,
    value: string | number
  ): ModifierBuilder<T>

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

  // Dynamic modifier access from registry
  [key: string]: any
}

/**
 * Modifiable component - components that can have modifiers applied
 */
export interface ModifiableComponent<P extends ComponentProps = ComponentProps>
  extends ComponentInstance<P> {
  modifiers: Modifier[]
  modifierBuilder?: ModifierBuilder<ModifiableComponent<P>>
  _originalComponent?: ComponentInstance<P> // Reference to original component for modifier context
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
