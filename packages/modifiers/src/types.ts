/**
 * SwiftUI Modifier System Types
 *
 * Core type definitions for the SwiftUI-inspired modifier system.
 * Enables chaining modifiers on components similar to SwiftUI.
 */

import type { Signal } from '@tachui/types/reactive'
import type {
  ComponentInstance,
  ComponentProps,
  DOMNode,
} from '@tachui/types/runtime'
import type {
  TransformAnchor,
  ModifierBuilder,
} from '@tachui/types/modifiers'
import type { ClipShapeName } from './appearance/clip-path'
import type { Shape } from '@tachui/types/shapes'

// Re-export for convenience
export type { DOMNode } from '@tachui/types/runtime'
// Temporary type definitions until we migrate all types
export type Dimension = number | string | 'infinity'

/**
 * Anchor point a rotation turns around
 */
export type RotationAnchor = TransformAnchor

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
  apply(node: DOMNode, context: ModifierContext): DOMNode | ModifierResult | undefined
  /**
   * Optional static CSS extraction hook used by SSR/prerender.
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
    shape: ClipShapeName | Shape
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
    angle: number | Signal<number>
    anchor?: RotationAnchor
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
 * The modifier builder: the one interface in `@tachui/types`. Each module that
 * registers modifiers adds their methods to it by augmentation, so a method is
 * typed exactly when its module has loaded. See `ModifierMethodsOf` there.
 */
export type { ModifierBuilder }

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
