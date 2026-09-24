/**
 * SwiftUI Modifier System Types
 *
 * Core type definitions for the SwiftUI-inspired modifier system.
 * Enables chaining modifiers on components similar to SwiftUI.
 */

import type { Signal } from './reactive'
import type { ComponentInstance, ComponentProps, DOMNode } from './runtime'
import type { Dimension } from './layout'
import type { StatefulBackgroundValue } from './gradients'
import type { AssetValue, ColorAssetProxy, ImageAssetProxy, FontAssetProxy, Asset } from './assets'

/**
 * A named point on an element's box that a transform effect is anchored to
 */
export type TransformAnchor =
  | 'center'
  | 'top'
  | 'topLeading'
  | 'topTrailing'
  | 'bottom'
  | 'bottomLeading'
  | 'bottomTrailing'
  | 'leading'
  | 'trailing'

// Re-export asset types for convenience
export type { AssetValue, ColorAssetProxy, ImageAssetProxy, FontAssetProxy, Asset }

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
  | 'leading'
  | 'trailing'
export type TextDecoration = 'none' | 'underline' | 'overline' | 'line-through'
export type TextTransform = 'none' | 'uppercase' | 'lowercase' | 'capitalize'

/**
 * Valid color value types for modifiers
 */
export type ColorValue = string | Asset | ColorAssetProxy | Signal<string>
/**
 * CSS blend modes supported by TachUI blend modifiers.
 *
 * Intentionally excludes SwiftUI-only values without CSS parity:
 * sourceAtop, destinationOver, destinationOut.
 */
export type BlendMode =
  | 'normal'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'darken'
  | 'lighten'
  | 'color-dodge'
  | 'color-burn'
  | 'soft-light'
  | 'hard-light'
  | 'difference'
  | 'exclusion'
  | 'hue'
  | 'saturation'
  | 'color'
  | 'luminosity'
  | 'plus-lighter'
  | 'plus-darker'
export type BackgroundImageRepeat =
  | 'tile'
  | 'no-repeat'
  | 'repeat-x'
  | 'repeat-y'
export type BackgroundImageSize =
  | 'auto'
  | 'cover'
  | 'contain'
  | `${number}px`
  | `${number}%`
export interface BackgroundImageOptions {
  repeat?: BackgroundImageRepeat
  size?: BackgroundImageSize
  position?: string
}

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
  apply(node: DOMNode, context: ModifierContext): DOMNode | ModifierResult | undefined
  /**
   * Optional static CSS extraction hook used by SSR/prerender.
   * Implementations may return full CSS rules (including pseudo/selectors,
   * @media blocks, and @keyframes) scoped to the provided selector.
   */
  getStaticCSS?(selector: string): string[]
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
    x?: number | Signal<number>
    y?: number | Signal<number>
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
    anchor?: TransformAnchor
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
    weight?: FontWeight | number
    style?: FontStyle
  }
  cornerRadius?: number
  border?: {
    width?: number | Signal<number>
    color?: ColorValue
    style?: 'solid' | 'dashed' | 'dotted'
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
  scaleEffect?: {
    x: number
    y?: number
    anchor?: TransformAnchor
  }
  rotationEffect?: {
    angle: number | Signal<number>
    anchor?: TransformAnchor
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
 * The builder methods core declares itself.
 *
 * `ModifierBuilder` extends this, and each package that registers modifiers
 * extends `ModifierBuilder` with its own methods through module augmentation,
 * from the module that registers them, so a method is typed exactly when
 * importing its package makes it exist at runtime. See `ModifierMethodsOf`.
 */
export interface ModifierBuilderBase<
  T extends ComponentInstance = ComponentInstance,
> {
  // Layout modifiers
  frame(width?: Dimension, height?: Dimension): this
  frame(options: LayoutModifierProps['frame']): this

  // Typography modifiers
  textTransform(
    value: 'none' | 'uppercase' | 'lowercase' | 'capitalize'
  ): this
  letterSpacing(value: number | string): this
  lineHeight(value: number | string): this
  gradientText(gradient: string): this

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
  ): this
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
  ): this
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
  ): this
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
  ): this

  // Flexbox modifiers
  flexGrow(value: number): this
  flexShrink(value: number): this
  justifyContent(
    value:
      | 'flex-start'
      | 'flex-end'
      | 'center'
      | 'space-between'
      | 'space-around'
      | 'space-evenly'
  ): this
  alignItems(
    value: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline'
  ): this
  gap(value: number | string): this
  flexDirection(
    value: 'row' | 'row-reverse' | 'column' | 'column-reverse'
  ): this
  flexWrap(value: 'nowrap' | 'wrap' | 'wrap-reverse'): this

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
  ): this
  overflowY(value: 'visible' | 'hidden' | 'scroll' | 'auto'): this
  overflowX(value: 'visible' | 'hidden' | 'scroll' | 'auto'): this
  display(
    value:
      | 'block'
      | 'inline'
      | 'inline-block'
      | 'flex'
      | 'inline-flex'
      | 'grid'
      | 'none'
  ): this
  transform(value: string | Signal<string>): this

  // Note: SwiftUI-style position for absolute positioning (different from CSS position)
  absolutePosition(
    x: number | Signal<number>,
    y: number | Signal<number>
  ): this

  // Appearance modifiers
  foregroundColor(color: ColorValue): this
  backgroundColor(color: ColorValue): this
  background(
    value: StatefulBackgroundValue | Signal<string>
  ): this
  backgroundImage(
    source: ImageAssetProxy | string,
    options?: BackgroundImageOptions
  ): this
  blendMode(mode: BlendMode): this
  backgroundBlendMode(mode: BlendMode): this
  compositingGroup(): this
  font(options: AppearanceModifierProps['font']): this
  font(size: number | string): this
  fontWeight(
    weight: NonNullable<AppearanceModifierProps['font']>['weight']
  ): this
  fontSize(
    size: number | string | Signal<number> | Signal<string>
  ): this
  opacity(value: number | Signal<number>): this
  cornerRadius(radius: number | Signal<number>): this
  border(
    width: number | Signal<number>,
    color?: ColorValue,
    style?: NonNullable<AppearanceModifierProps['border']>['style']
  ): this
  border(options: AppearanceModifierProps['border']): this
  borderWidth(width: number | Signal<number>): this

  // Gesture Priority System (Phase 4 - Epic: Butternut)
  highPriorityGesture(
    gesture: any,
    including?: ('all' | 'subviews' | 'none')[]
  ): this
  simultaneousGesture(
    gesture: any,
    including?: ('all' | 'subviews' | 'none')[]
  ): this

  // Text Modifiers
  lineClamp(lines: number): this
  wordBreak(
    value: 'normal' | 'break-all' | 'keep-all' | 'break-word'
  ): this
  overflowWrap(value: 'normal' | 'break-word' | 'anywhere'): this
  hyphens(value: 'none' | 'manual' | 'auto'): this

  // State modifiers
  disabled(isDisabled?: boolean | Signal<boolean>): this

  // Animation modifiers
  transition(options: {
    property?: string
    duration?: number
    easing?: string
    delay?: number
  }): this
  transition(
    property?: string,
    duration?: number,
    easing?: string,
    delay?: number
  ): this
  animation(options?: AnimationModifierProps['animation']): this

  // Scroll modifiers
  scroll(config: any): this
  scrollBehavior(value: 'auto' | 'smooth'): this
  overscrollBehavior(value: 'auto' | 'contain' | 'none'): this
  overscrollBehaviorX(value: 'auto' | 'contain' | 'none'): this
  overscrollBehaviorY(value: 'auto' | 'contain' | 'none'): this
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
  ): this
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
  ): this
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
  ): this

  // Lifecycle modifiers
  task(
    operation: () => Promise<void> | void,
    options?: {
      id?: string
      priority?: 'background' | 'userInitiated' | 'utility' | 'default'
    }
  ): this

  // Custom modifier application
  modifier(modifier: Modifier): this

  // Resizable modifier for images
  resizable(): this

  // Text case alias for textTransform
  textCase(
    value: 'none' | 'uppercase' | 'lowercase' | 'capitalize'
  ): this

  // Interaction modifiers
  onTap(handler: (event: MouseEvent) => void): this
  onFocus(handler: (isFocused: boolean) => void): this
  onBlur(handler: (isFocused: boolean) => void): this
  onKeyDown(handler: (event: KeyboardEvent) => void): this
  onScroll(handler: (event: Event) => void): this
  onKeyPress(handler: (event: KeyboardEvent) => void): this
  onKeyUp(handler: (event: KeyboardEvent) => void): this
  onDoubleClick(handler: (event: MouseEvent) => void): this
  onContextMenu(handler: (event: MouseEvent) => void): this
  onWheel(handler: (event: WheelEvent) => void): this
  onInput(handler: (event: InputEvent) => void): this
  onChange(handler: (value: any, event?: Event) => void): this
  onCopy(handler: (event: ClipboardEvent) => void): this
  onCut(handler: (event: ClipboardEvent) => void): this
  onPaste(handler: (event: ClipboardEvent) => void): this
  onSelect(handler: (event: Event) => void): this

  addModifier(modifier: Modifier): void

  // Build the final component with all modifiers applied
  build(): T
}

/**
 * Modifier builder interface for creating chainable modifiers
 *
 * There is no index signature: a method exists on this type only if core
 * declares it or a package that registers it adds it by augmentation.
 */
export interface ModifierBuilder<
  T extends ComponentInstance = ComponentInstance,
> extends ModifierBuilderBase<T> {}

/**
 * A modifier registration list: `[name, factory]` entries, optionally followed
 * by metadata, declared `as const` so each name keeps its literal type.
 */
export type ModifierRegistrationList = readonly (readonly [
  string,
  (...args: any[]) => any,
  ...unknown[],
])[]

/**
 * The factories of a registration list, keyed by registered name.
 */
export type ModifierFactoriesOf<L extends ModifierRegistrationList> = {
  [Entry in L[number] as Entry[0]]: Entry[1]
}

/**
 * Builder methods for a set of factories: each takes its factory's parameters
 * and returns whatever it was called on, as the runtime does. Chained on a
 * component it returns that component, so the result can be a child; chained
 * on `.modifier` it returns the builder, which `build()` turns into one.
 *
 * Names core already declares are left to `ModifierBuilderBase`, and so are
 * names in `Declared`: methods a package writes out by hand, typically
 * because the factory is overloaded and only its last overload would be
 * inferred here.
 *
 * ```ts
 * declare module '@tachui/types/modifiers' {
 *   interface ModifierBuilder<T extends ComponentInstance = ComponentInstance>
 *     extends ModifierMethodsOf<ModifierFactoriesOf<typeof registrations>> {}
 * }
 * ```
 */
export type ModifierMethodsOf<
  Factories,
  Declared extends PropertyKey = never,
> = {
  [Name in Exclude<
    keyof Factories,
    keyof ModifierBuilderBase<any> | Declared
  >]: Factories[Name] extends (...args: infer Args) => any
    ? <Self>(this: Self, ...args: Args) => Self
    : never
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
 * Modifiable component that supports direct modifier chaining.
 * Combines the underlying component instance with the modifier builder API
 * and retains access to the `.modifier` property for advanced workflows.
 */
export type ModifiableComponentWithModifiers<
  P extends ComponentProps = ComponentProps,
> = ModifiableComponent<P> &
  ModifierBuilder<ModifiableComponent<P>> & {
    modifier: ModifierBuilder<ModifiableComponent<P>>
  }

/**
 * CSS style properties that can be generated by modifiers
 */
export interface CSSStyleProperties {
  // One signal member covers every narrower one, since a signal of a
  // narrower type is assignable to it. A signal that yields `null` or
  // `undefined` clears the property.
  [property: string]:
    | string
    | number
    | Signal<string | number | null | undefined>
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
export const ModifierPriority = {
  LAYOUT: 100,
  APPEARANCE: 200,
  INTERACTION: 300,
  ANIMATION: 400,
  CUSTOM: 500,
} as const

export type ModifierPriorityValue = typeof ModifierPriority[keyof typeof ModifierPriority]

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
