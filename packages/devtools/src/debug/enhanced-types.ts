/**
 * Enhanced TypeScript Type Definitions
 *
 * Provides stronger type safety, better intellisense, and improved
 * developer experience through enhanced TypeScript definitions.
 */

import type { Asset } from '@tachui/core'
import type { Signal } from '@tachui/core'
import type { ComponentInstance } from '@tachui/core'

// =============================================================================
// ENHANCED COMPONENT TYPES
// =============================================================================

/**
 * Strict component props with validation
 */
export type StrictComponentProps<T = {}> = {
  readonly [K in keyof T]: T[K]
} & {
  readonly children?: ComponentChildren
  readonly key?: string | number
  readonly ref?: ComponentRef<any>
}

/**
 * Component children with strict typing
 */
export type ComponentChildren =
  | ComponentInstance
  | ComponentInstance[]
  | string
  | number
  | boolean
  | null
  | undefined
  | Signal<any>
  | (() => any)

/**
 * Component ref with type safety
 */
export interface ComponentRef<T = HTMLElement> {
  readonly current: T | null
}

/**
 * Enhanced component factory with strict typing
 */
export type StrictComponentFactory<
  T extends StrictComponentProps = StrictComponentProps,
> = (props: T) => ComponentInstance & {
  readonly props: T
  readonly type: string
  readonly modifiers: readonly any[]
}

// =============================================================================
// ENHANCED MODIFIER TYPES
// =============================================================================

/**
 * Reactive-aware CSS value types
 */
export type CSSValue<T = string | number> = T | Signal<T>

/**
 * Enhanced color types with asset support
 */
export type ColorValue =
  | string // hex, rgb, named colors
  | Asset // theme-aware color asset
  | Signal<string | Asset>

/**
 * Enhanced size types
 */
export type SizeValue =
  | number // pixels
  | string // CSS units (px, %, em, rem, vw, vh, etc.)
  | 'auto'
  | 'min-content'
  | 'max-content'
  | 'fit-content'
  | Signal<number | string>

/**
 * Enhanced spacing types with semantic values
 */
export type SpacingValue =
  | number
  | 'xs' // 4px
  | 'sm' // 8px
  | 'md' // 12px
  | 'lg' // 16px
  | 'xl' // 24px
  | 'xxl' // 32px
  | Signal<number | string>

/**
 * Enhanced border types
 */
export interface EnhancedBorderProps {
  width?: CSSValue<number>
  style?: CSSValue<
    | 'solid'
    | 'dashed'
    | 'dotted'
    | 'double'
    | 'groove'
    | 'ridge'
    | 'inset'
    | 'outset'
    | 'none'
  >
  color?: ColorValue
  radius?: CSSValue<number>
}

/**
 * Enhanced shadow types
 */
export interface EnhancedShadowProps {
  x?: CSSValue<number>
  y?: CSSValue<number>
  blur?: CSSValue<number>
  spread?: CSSValue<number>
  color?: ColorValue
  inset?: CSSValue<boolean>
}

/**
 * Enhanced typography types with system font support
 */
export interface EnhancedTypographyProps {
  size?: CSSValue<number | string>
  weight?: CSSValue<
    | '100'
    | '200'
    | '300'
    | '400'
    | '500'
    | '600'
    | '700'
    | '800'
    | '900'
    | 'normal'
    | 'bold'
    | 'bolder'
    | 'lighter'
  >
  family?: CSSValue<string | 'system' | 'serif' | 'sans-serif' | 'monospace'>
  style?: CSSValue<'normal' | 'italic' | 'oblique'>
  variant?: CSSValue<'normal' | 'small-caps'>
  decoration?: CSSValue<'none' | 'underline' | 'overline' | 'line-through'>
  align?: CSSValue<'left' | 'center' | 'right' | 'justify' | 'start' | 'end'>
  transform?: CSSValue<'none' | 'uppercase' | 'lowercase' | 'capitalize'>
  lineHeight?: CSSValue<number | string>
  letterSpacing?: CSSValue<number | string>
}

// =============================================================================
// ENHANCED MODIFIER BUILDER TYPES
// =============================================================================

/**
 * Enhanced modifier builder with strict return types
 */
export interface EnhancedModifierBuilder<T extends ComponentInstance> {
  // Layout modifiers with enhanced types
  frame(width: SizeValue, height: SizeValue): EnhancedModifierBuilder<T>
  frame(options: {
    width?: SizeValue
    height?: SizeValue
    minWidth?: SizeValue
    maxWidth?: SizeValue
    minHeight?: SizeValue
    maxHeight?: SizeValue
  }): EnhancedModifierBuilder<T>

  // Enhanced size modifiers
  size(options: {
    width?: SizeValue
    height?: SizeValue
    minWidth?: SizeValue
    maxWidth?: SizeValue
    minHeight?: SizeValue
    maxHeight?: SizeValue
  }): EnhancedModifierBuilder<T>
  width(value: SizeValue): EnhancedModifierBuilder<T>
  height(value: SizeValue): EnhancedModifierBuilder<T>
  minWidth(value: SizeValue): EnhancedModifierBuilder<T>
  maxWidth(value: SizeValue): EnhancedModifierBuilder<T>
  minHeight(value: SizeValue): EnhancedModifierBuilder<T>
  maxHeight(value: SizeValue): EnhancedModifierBuilder<T>

  // Enhanced padding with all SwiftUI functions
  padding(value: SpacingValue): EnhancedModifierBuilder<T>
  padding(options: {
    all?: SpacingValue
    horizontal?: SpacingValue
    vertical?: SpacingValue
    top?: SpacingValue
    right?: SpacingValue
    bottom?: SpacingValue
    left?: SpacingValue
    leading?: SpacingValue // SwiftUI-style
    trailing?: SpacingValue // SwiftUI-style
  }): EnhancedModifierBuilder<T>
  paddingTop(value: SpacingValue): EnhancedModifierBuilder<T>
  paddingBottom(value: SpacingValue): EnhancedModifierBuilder<T>
  paddingLeft(value: SpacingValue): EnhancedModifierBuilder<T>
  paddingRight(value: SpacingValue): EnhancedModifierBuilder<T>
  paddingLeading(value: SpacingValue): EnhancedModifierBuilder<T>
  paddingTrailing(value: SpacingValue): EnhancedModifierBuilder<T>
  paddingHorizontal(value: SpacingValue): EnhancedModifierBuilder<T>
  paddingVertical(value: SpacingValue): EnhancedModifierBuilder<T>

  // Enhanced appearance modifiers
  foregroundColor(color: ColorValue): EnhancedModifierBuilder<T>
  backgroundColor(color: ColorValue): EnhancedModifierBuilder<T>
  opacity(value: CSSValue<number>): EnhancedModifierBuilder<T>
  cornerRadius(value: CSSValue<number>): EnhancedModifierBuilder<T>

  // Enhanced typography
  font(props: EnhancedTypographyProps): EnhancedModifierBuilder<T>
  fontSize(value: CSSValue<number | string>): EnhancedModifierBuilder<T>
  fontWeight(
    value: EnhancedTypographyProps['weight']
  ): EnhancedModifierBuilder<T>
  fontFamily(
    value: EnhancedTypographyProps['family']
  ): EnhancedModifierBuilder<T>
  textAlign(value: EnhancedTypographyProps['align']): EnhancedModifierBuilder<T>

  // Enhanced borders and shadows
  border(props: EnhancedBorderProps): EnhancedModifierBuilder<T>
  border(
    width: number,
    color?: ColorValue,
    style?: EnhancedBorderProps['style']
  ): EnhancedModifierBuilder<T>
  shadow(props: EnhancedShadowProps): EnhancedModifierBuilder<T>
  dropShadow(
    x?: number,
    y?: number,
    blur?: number,
    color?: ColorValue
  ): EnhancedModifierBuilder<T>

  // Enhanced interaction
  onTap<E extends Event = MouseEvent>(
    handler: (event: E) => void
  ): EnhancedModifierBuilder<T>
  onHover(
    handler: (isHovered: boolean, event: MouseEvent) => void
  ): EnhancedModifierBuilder<T>
  onFocus(
    handler: (isFocused: boolean, event: FocusEvent) => void
  ): EnhancedModifierBuilder<T>
  disabled(value?: CSSValue<boolean>): EnhancedModifierBuilder<T>

  // Enhanced animation
  transition(
    property?: string,
    duration?: number,
    easing?: string,
    delay?: number
  ): EnhancedModifierBuilder<T>
  animation(
    keyframes: Record<string, Record<string, string>>,
    duration?: number,
    easing?: string
  ): EnhancedModifierBuilder<T>

  // Build with strict return type
  build(): T & {
    readonly modifiers: readonly any[]
  }
}

// =============================================================================
// ENHANCED REACTIVE TYPES
// =============================================================================

/**
 * Enhanced signal with better type inference
 */
export interface EnhancedSignal<T> extends Signal<T> {
  (): T
  readonly value: T // Read-only access without calling
  readonly name?: string // Debug name
  readonly version: number // Change tracking
}

/**
 * Enhanced signal factory
 */
export interface EnhancedSignalFactory {
  <T>(
    initialValue: T,
    name?: string
  ): [EnhancedSignal<T>, (value: T | ((prev: T) => T)) => void]
  <T = undefined>(
    name?: string
  ): [
    EnhancedSignal<T | undefined>,
    (value: T | ((prev: T | undefined) => T)) => void,
  ]
}

/**
 * Enhanced computed with dependency tracking
 */
export interface EnhancedComputed<T> {
  (): T
  readonly value: T
  readonly dependencies: readonly EnhancedSignal<any>[]
  readonly name?: string
}

/**
 * Type-safe effect with cleanup
 */
export interface TypedEffect {
  <T extends readonly EnhancedSignal<any>[]>(
    dependencies: T,
    effect: (
      ...values: {
        [K in keyof T]: T[K] extends EnhancedSignal<infer U> ? U : never
      }
    ) => undefined | (() => void)
  ): () => void

  (effect: () => undefined | (() => void)): () => void
}

// =============================================================================
// ENHANCED COMPONENT-SPECIFIC TYPES
// =============================================================================

/**
 * Enhanced Text component props
 */
export interface EnhancedTextProps extends StrictComponentProps {
  readonly children: string | Signal<string> | (() => string)
  readonly numberOfLines?: number
  readonly truncate?: boolean | 'start' | 'middle' | 'end'
  readonly selectable?: boolean
}

/**
 * Enhanced Button component props
 */
export interface EnhancedButtonProps extends StrictComponentProps {
  readonly children: ComponentChildren
  readonly variant?: 'filled' | 'outlined' | 'text' | 'destructive'
  readonly size?: 'small' | 'medium' | 'large'
  readonly loading?: boolean | Signal<boolean>
  readonly disabled?: boolean | Signal<boolean>
  readonly onPress?: (event: MouseEvent) => void | Promise<void>
  readonly onLongPress?: (event: MouseEvent) => void
  readonly hapticFeedback?: boolean
}

/**
 * Enhanced layout component props
 */
export interface EnhancedLayoutProps extends StrictComponentProps {
  readonly children: ComponentChildren
  readonly spacing?: SpacingValue
  readonly alignment?: 'start' | 'center' | 'end' | 'stretch'
  readonly distribution?:
    | 'start'
    | 'center'
    | 'end'
    | 'space-between'
    | 'space-around'
    | 'space-evenly'
}

// =============================================================================
// UTILITY TYPES FOR BETTER INTELLISENSE
// =============================================================================

/**
 * Extract component props from factory
 */
export type ComponentProps<T> =
  T extends StrictComponentFactory<infer P> ? P : never

/**
 * Make all properties reactive-aware
 */
export type Reactive<T> = {
  [K in keyof T]: T[K] | Signal<T[K]>
}

/**
 * Deep readonly for immutable props
 */
export type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K]
}

/**
 * Type-safe event handlers
 */
export type EventHandler<T extends Event> = (event: T) => void | Promise<void>

/**
 * Component instance with enhanced type information
 */
export interface EnhancedComponentInstance extends ComponentInstance {
  readonly displayName?: string
  readonly debugInfo?: {
    readonly createdAt: number
    readonly renderCount: number
    readonly lastRenderTime: number
  }
}

// =============================================================================
// DEVELOPMENT MODE TYPES
// =============================================================================

/**
 * Development mode configuration
 */
export interface DevelopmentConfig {
  readonly enableWarnings: boolean
  readonly enablePerformanceTracking: boolean
  readonly enableComponentTree: boolean
  readonly enableHotReload: boolean
  readonly strictMode: boolean
}

/**
 * Component development metadata
 */
export interface ComponentDevMetadata {
  readonly name: string
  readonly file?: string
  readonly line?: number
  readonly props: Record<string, any>
  readonly state: Record<string, any>
  readonly renderTime?: number
  readonly updateCount: number
}

// =============================================================================
// EXPORTS FOR PUBLIC API
// =============================================================================

/**
 * Main enhanced types export (simplified for build compatibility)
 */
export type TachUIEnhancedTypes = {}
