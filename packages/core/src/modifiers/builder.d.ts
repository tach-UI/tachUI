/**
 * Modifier Builder Implementation
 *
 * Provides a fluent API for chaining modifiers on components,
 * similar to SwiftUI's modifier system.
 */
import type { Signal } from '../reactive/types'
import type { ComponentInstance, ComponentProps } from '../runtime/types'
import type { StatefulBackgroundValue } from '../gradients/types'
import type { ColorValue } from './types'
import type { FontAsset } from '../assets/FontAsset'
type BorderStyle = any
import type {
  AnimationModifierProps,
  AppearanceModifierProps,
  LayoutModifierProps,
  ModifiableComponent,
  Modifier,
  ModifierBuilder,
} from './types'
import type {
  FontStyle,
  FontVariant,
  FontWeight,
  TextAlign,
  TextDecoration,
  TextTransform,
} from './types'
import type { AsHTMLOptions } from './as-html'
/**
 * Concrete modifier builder implementation
 */
export declare class ModifierBuilderImpl<
  T extends ComponentInstance = ComponentInstance,
> implements ModifierBuilder<T>
{
  private component
  private modifiers
  constructor(component: T)
  frame(width?: number | string, height?: number | string): ModifierBuilder<T>
  frame(options: LayoutModifierProps['frame']): ModifierBuilder<T>
  margin(value: number | string): ModifierBuilder<T>
  margin(options: LayoutModifierProps['margin']): ModifierBuilder<T>
  layoutPriority(priority: number | Signal<number>): ModifierBuilder<T>
  size(options: {
    width?: number | string
    height?: number | string
    minWidth?: number | string
    maxWidth?: number | string
    minHeight?: number | string
    maxHeight?: number | string
  }): ModifierBuilder<T>
  width(value: number | string): ModifierBuilder<T>
  height(value: number | string): ModifierBuilder<T>
  maxWidth(value: number | string): ModifierBuilder<T>
  minWidth(value: number | string): ModifierBuilder<T>
  maxHeight(value: number | string): ModifierBuilder<T>
  minHeight(value: number | string): ModifierBuilder<T>
  marginTop(value: number): ModifierBuilder<T>
  marginBottom(value: number): ModifierBuilder<T>
  marginHorizontal(value: number): ModifierBuilder<T>
  marginVertical(value: number): ModifierBuilder<T>
  marginLeft(value: number): ModifierBuilder<T>
  marginRight(value: number): ModifierBuilder<T>
  padding(value: number): ModifierBuilder<T>
  padding(options: any): ModifierBuilder<T>
  paddingTop(value: number): ModifierBuilder<T>
  paddingBottom(value: number): ModifierBuilder<T>
  paddingLeft(value: number): ModifierBuilder<T>
  paddingRight(value: number): ModifierBuilder<T>
  paddingLeading(value: number): ModifierBuilder<T>
  paddingTrailing(value: number): ModifierBuilder<T>
  paddingHorizontal(value: number): ModifierBuilder<T>
  paddingVertical(value: number): ModifierBuilder<T>
  typography(options: {
    size?: number | string
    weight?: FontWeight
    family?: string
    lineHeight?: number | string
    letterSpacing?: number | string
    align?: TextAlign
    transform?: TextTransform
    decoration?: TextDecoration
    variant?: FontVariant
    style?: FontStyle
    color?: string
  }): ModifierBuilder<T>
  textAlign(
    value: 'left' | 'center' | 'right' | 'justify' | 'start' | 'end'
  ): ModifierBuilder<T>
  textTransform(
    value: 'none' | 'uppercase' | 'lowercase' | 'capitalize'
  ): ModifierBuilder<T>
  gradientText(gradient: string): ModifierBuilder<T>
  lineClamp(lines: number): ModifierBuilder<T>
  wordBreak(
    value: 'normal' | 'break-all' | 'keep-all' | 'break-word'
  ): ModifierBuilder<T>
  overflowWrap(value: 'normal' | 'break-word' | 'anywhere'): ModifierBuilder<T>
  hyphens(value: 'none' | 'manual' | 'auto'): ModifierBuilder<T>
  backdropFilter(): ModifierBuilder<T>
  glassmorphism(): ModifierBuilder<T>
  letterSpacing(value: number | string): ModifierBuilder<T>
  lineHeight(value: number | string): ModifierBuilder<T>
  textOverflow(value: 'clip' | 'ellipsis' | 'fade' | string): ModifierBuilder<T>
  whiteSpace(
    value:
      | 'normal'
      | 'nowrap'
      | 'pre'
      | 'pre-wrap'
      | 'pre-line'
      | 'break-spaces'
  ): ModifierBuilder<T>
  overflow(value: 'visible' | 'hidden' | 'scroll' | 'auto'): ModifierBuilder<T>
  borderTop(
    width: number | Signal<number>,
    color: string | Signal<string>,
    style?: BorderStyle
  ): ModifierBuilder<T>
  borderRight(
    width: number | Signal<number>,
    color: string | Signal<string>,
    style?: BorderStyle
  ): ModifierBuilder<T>
  borderBottom(
    width: number | Signal<number>,
    color: string | Signal<string>,
    style?: BorderStyle
  ): ModifierBuilder<T>
  borderLeft(
    width: number | Signal<number>,
    color: string | Signal<string>,
    style?: BorderStyle
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
  outline(value: string): ModifierBuilder<T>
  outlineOffset(value: number | string): ModifierBuilder<T>
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
  textCase(
    value: 'none' | 'uppercase' | 'lowercase' | 'capitalize'
  ): ModifierBuilder<T>
  aspectRatio(ratio?: number, contentMode?: 'fit' | 'fill'): ModifierBuilder<T>
  textDecoration(
    value: 'none' | 'underline' | 'overline' | 'line-through'
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
  fontFamily(
    family: string | FontAsset | Signal<string | FontAsset>
  ): ModifierBuilder<T>
  opacity(value: number | Signal<number>): ModifierBuilder<T>
  cornerRadius(radius: number | Signal<number>): ModifierBuilder<T>
  border(width: number | Signal<number>, color?: ColorValue): ModifierBuilder<T>
  border(options: AppearanceModifierProps['border']): ModifierBuilder<T>
  borderWidth(width: number | Signal<number>): ModifierBuilder<T>
  blur(radius: number | Signal<number>): ModifierBuilder<T>
  brightness(amount: number | Signal<number>): ModifierBuilder<T>
  contrast(amount: number | Signal<number>): ModifierBuilder<T>
  saturation(amount: number | Signal<number>): ModifierBuilder<T>
  hueRotation(angle: number | Signal<number>): ModifierBuilder<T>
  grayscale(amount: number | Signal<number>): ModifierBuilder<T>
  colorInvert(amount?: number | Signal<number>): ModifierBuilder<T>
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
  transform(value: string | Signal<string>): ModifierBuilder<T>
  animation(options: AnimationModifierProps['animation']): ModifierBuilder<T>
  task(
    operation: () => Promise<void> | void,
    options?: {
      id?: string
      priority?: 'background' | 'userInitiated' | 'utility' | 'default'
    }
  ): ModifierBuilder<T>
  modifier(modifier: Modifier): ModifierBuilder<T>
  resizable(): ModifierBuilder<T>
  /**
   * Add modifier to internal list (used by responsive builder)
   */
  addModifier(modifier: Modifier): void
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
  id(value: string): ModifierBuilder<T>
  data(attributes: {
    [key: string]: string | number | boolean
  }): ModifierBuilder<T>
  aria(attributes: {
    [key: string]: string | number | boolean | undefined
  }): ModifierBuilder<T>
  tabIndex(value: number): ModifierBuilder<T>
  customProperties(options: {
    properties: Record<string, string | number>
  }): ModifierBuilder<T>
  customProperty(name: string, value: string | number): ModifierBuilder<T>
  cssVariables(variables: Record<string, string | number>): ModifierBuilder<T>
  themeColors(colors: Record<string, string>): ModifierBuilder<T>
  designTokens(tokens: Record<string, string | number>): ModifierBuilder<T>
  disabled(isDisabled?: boolean | Signal<boolean>): ModifierBuilder<T>
  asHTML(options?: AsHTMLOptions): ModifierBuilder<T>
  build(): T
  private applyModifiersToPropsForTesting
  role(value: string): ModifierBuilder<T>
  ariaLabel(value: string): ModifierBuilder<T>
  ariaLive(value: 'off' | 'polite' | 'assertive'): ModifierBuilder<T>
  ariaDescribedBy(value: string): ModifierBuilder<T>
  ariaModal(value: boolean): ModifierBuilder<T>
  onTouchStart(handler: (event: TouchEvent) => void): ModifierBuilder<T>
  onTouchMove(handler: (event: TouchEvent) => void): ModifierBuilder<T>
  onTouchEnd(handler: (event: TouchEvent) => void): ModifierBuilder<T>
  onSwipeLeft(handler: () => void): ModifierBuilder<T>
  onSwipeRight(handler: () => void): ModifierBuilder<T>
  navigationTitle(title: string): ModifierBuilder<T>
  navigationBarHidden(hidden?: boolean): ModifierBuilder<T>
  navigationBarItems(options: {
    leading?: ComponentInstance | ComponentInstance[]
    trailing?: ComponentInstance | ComponentInstance[]
  }): ModifierBuilder<T>
  transitions(config: any): ModifierBuilder<T>
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
  scrollSnap(config: any): ModifierBuilder<T>
  onAppear(handler: () => void): ModifierBuilder<T>
  onDisappear(handler: () => void): ModifierBuilder<T>
  refreshable(
    onRefresh: () => Promise<void>,
    isRefreshing?: boolean | Signal<boolean>
  ): ModifierBuilder<T>
  scaleEffect(
    x: number,
    y?: number,
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
  ): ModifierBuilder<T>
}
/**
 * Create a modifier builder for a component
 */
export declare function createModifierBuilder<T extends ComponentInstance>(
  component: T
): ModifierBuilder<T>
/**
 * Apply modifiers to a component instance
 */
export declare function applyModifiers<T extends ComponentInstance>(
  component: T,
  modifiers: Modifier[]
): ModifiableComponent<ComponentProps>
/**
 * Utility functions for common modifier patterns
 */
export declare const modifierUtils: {
  /**
   * Create a padding modifier with all sides
   */
  paddingAll(value: number): Modifier
  /**
   * Create a margin modifier with all sides
   */
  marginAll(value: number): Modifier
  /**
   * Create a font modifier with common presets
   */
  fontPreset(preset: 'title' | 'heading' | 'body' | 'caption'): Modifier
  /**
   * Create a transition modifier with common presets
   */
  transitionPreset(preset: 'fast' | 'normal' | 'slow'): Modifier
}

//# sourceMappingURL=builder.d.ts.map
