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
export type Dimension = number | string | 'infinity'
export interface StatefulBackgroundValue {
  default: any
  hover?: any
  active?: any
  focus?: any
  disabled?: any
}
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
  blur?: number
  brightness?: number
  contrast?: number
  saturation?: number
  hueRotation?: number
  grayscale?: number
  colorInvert?: number
}
/**
 * Interaction modifier properties
 */
export interface InteractionModifierProps {
  onTap?: (event: MouseEvent) => void
  onHover?: (isHovered: boolean) => void
  onMouseEnter?: (event: MouseEvent) => void
  onMouseLeave?: (event: MouseEvent) => void
  onMouseDown?: (event: MouseEvent) => void
  onMouseUp?: (event: MouseEvent) => void
  onDoubleClick?: (event: MouseEvent) => void
  onContextMenu?: (event: MouseEvent) => void
  onDragStart?: (event: DragEvent) => void
  onDragOver?: (event: DragEvent) => void
  onDragLeave?: (event: DragEvent) => void
  onDrop?: (event: DragEvent) => void
  onFocus?: (isFocused: boolean) => void
  onBlur?: (isFocused: boolean) => void
  onKeyPress?: (event: KeyboardEvent) => void
  onKeyDown?: (event: KeyboardEvent) => void
  onKeyUp?: (event: KeyboardEvent) => void
  onScroll?: (event: Event) => void
  onWheel?: (event: WheelEvent) => void
  onInput?: (event: InputEvent) => void
  onChange?: (value: any, event?: Event) => void
  onCopy?: (event: ClipboardEvent) => void
  onCut?: (event: ClipboardEvent) => void
  onPaste?: (event: ClipboardEvent) => void
  onTouchStart?: (event: TouchEvent) => void
  onTouchMove?: (event: TouchEvent) => void
  onTouchEnd?: (event: TouchEvent) => void
  onTouchCancel?: (event: TouchEvent) => void
  onSelect?: (event: Event) => void
  onLongPressGesture?: {
    minimumDuration?: number
    maximumDistance?: number
    perform: () => void
    onPressingChanged?: (isPressing: boolean) => void
  }
  keyboardShortcut?: {
    key: string
    modifiers?: ('cmd' | 'ctrl' | 'shift' | 'alt' | 'meta')[]
    action: () => void
  }
  focused?: boolean | Signal<boolean>
  focusable?: {
    isFocusable?: boolean
    interactions?: ('activate' | 'edit')[]
  }
  onContinuousHover?: {
    coordinateSpace?: 'local' | 'global'
    perform: (
      location: {
        x: number
        y: number
      } | null
    ) => void
  }
  highPriorityGesture?: {
    gesture: any
    including?: ('all' | 'subviews' | 'none')[]
  }
  simultaneousGesture?: {
    gesture: any
    including?: ('all' | 'subviews' | 'none')[]
  }
  allowsHitTesting?: boolean
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
    content: any
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
  frame(width?: Dimension, height?: Dimension): ModifierBuilder<T>
  frame(options: LayoutModifierProps['frame']): ModifierBuilder<T>
  padding(value: number): ModifierBuilder<T>
  padding(options: LayoutModifierProps['padding']): ModifierBuilder<T>
  margin(value: number | string): ModifierBuilder<T>
  margin(options: LayoutModifierProps['margin']): ModifierBuilder<T>
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
  css(properties: {
    [property: string]: string | number | undefined
  }): ModifierBuilder<T>
  cssProperty(property: string, value: string | number): ModifierBuilder<T>
  cssVariable(name: string, value: string | number): ModifierBuilder<T>
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
  absolutePosition(
    x: number | Signal<number>,
    y: number | Signal<number>
  ): ModifierBuilder<T>
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
  onLongPressGesture(options: {
    minimumDuration?: number
    maximumDistance?: number
    perform: () => void
    onPressingChanged?: (isPressing: boolean) => void
  }): ModifierBuilder<T>
  keyboardShortcut(
    key: string,
    modifiers: ('cmd' | 'ctrl' | 'shift' | 'alt' | 'meta')[],
    action: () => void
  ): ModifierBuilder<T>
  focused(binding: boolean | Signal<boolean>): ModifierBuilder<T>
  focusable(
    isFocusable?: boolean,
    interactions?: ('activate' | 'edit')[]
  ): ModifierBuilder<T>
  onContinuousHover(
    coordinateSpace: 'local' | 'global',
    perform: (
      location: {
        x: number
        y: number
      } | null
    ) => void
  ): ModifierBuilder<T>
  highPriorityGesture(
    gesture: any,
    including?: ('all' | 'subviews' | 'none')[]
  ): ModifierBuilder<T>
  simultaneousGesture(
    gesture: any,
    including?: ('all' | 'subviews' | 'none')[]
  ): ModifierBuilder<T>
  allowsHitTesting(enabled: boolean): ModifierBuilder<T>
  id(value: string): ModifierBuilder<T>
  data(attributes: {
    [key: string]: string | number | boolean
  }): ModifierBuilder<T>
  aria(attributes: {
    [key: string]: string | number | boolean | undefined
  }): ModifierBuilder<T>
  tabIndex(value: number): ModifierBuilder<T>
  lineClamp(lines: number): ModifierBuilder<T>
  wordBreak(
    value: 'normal' | 'break-all' | 'keep-all' | 'break-word'
  ): ModifierBuilder<T>
  overflowWrap(value: 'normal' | 'break-word' | 'anywhere'): ModifierBuilder<T>
  hyphens(value: 'none' | 'manual' | 'auto'): ModifierBuilder<T>
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
  disabled(isDisabled?: boolean | Signal<boolean>): ModifierBuilder<T>
  transition(
    property?: string,
    duration?: number,
    easing?: string,
    delay?: number
  ): ModifierBuilder<T>
  transitions(config: any): ModifierBuilder<T>
  animation(options: AnimationModifierProps['animation']): ModifierBuilder<T>
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
  modifier(modifier: Modifier): ModifierBuilder<T>
  textCase(
    value: 'none' | 'uppercase' | 'lowercase' | 'capitalize'
  ): ModifierBuilder<T>
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
  asHTML(options?: { skipSanitizer?: boolean }): ModifierBuilder<T>
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
  transition(
    property?: string,
    duration?: number,
    easing?: string,
    delay?: number
  ): ModifierBuilder<T>
  addModifier(modifier: Modifier): void
  build(): T
}
/**
 * Modifiable component - components that can have modifiers applied
 */
export interface ModifiableComponent<P extends ComponentProps = ComponentProps>
  extends ComponentInstance<P> {
  modifiers: Modifier[]
  modifierBuilder?: ModifierBuilder<ModifiableComponent<P>>
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
export declare enum ModifierPriority {
  LAYOUT = 100,
  APPEARANCE = 200,
  INTERACTION = 300,
  ANIMATION = 400,
  CUSTOM = 500,
}
/**
 * Modifier application strategy
 */
export type ModifierApplicationStrategy = 'sequential' | 'batch' | 'immediate'
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
//# sourceMappingURL=types.d.ts.map
