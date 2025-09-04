/**
 * Core SwiftUI Modifiers
 *
 * Implementation of the most commonly used SwiftUI modifiers
 * for layout, appearance, and interaction.
 */
import type { Asset } from '../assets/Asset'
import type { Signal } from '../reactive/types'
import type { Dimension } from '../constants/layout'
import type { GradientDefinition } from '../gradients/types'
import type {
  AnimationModifierProps,
  AppearanceModifierProps,
  LayoutModifierProps,
  Modifier,
} from './types'
/**
 * Layout Modifiers
 */
export declare const layoutModifiers: {
  /**
   * Set foreground (text) color
   */
  foregroundColor(color: string | Signal<string> | any): Modifier
  /**
   * Set frame dimensions with support for infinity
   */
  frame(
    width?: Dimension,
    height?: Dimension,
    options?: Omit<LayoutModifierProps['frame'], 'width' | 'height'>
  ): Modifier
  /**
   * Set padding on all sides
   */
  padding(value: number): Modifier
  /**
   * Set margin on all sides
   */
  margin(value: number): Modifier
  /**
   * Set content alignment
   */
  alignment(value: LayoutModifierProps['alignment']): Modifier
  /**
   * Set layout priority for ZStack container sizing and flexible layout
   * Higher priority views determine container size in ZStack
   */
  layoutPriority(priority: number | Signal<number>): Modifier
}
/**
 * Appearance Modifiers
 */
export declare const appearanceModifiers: {
  /**
   * Set foreground (text) color
   */
  foregroundColor(color: string | Asset | Signal<string>): Modifier
  /**
   * Set background color
   */
  backgroundColor(color: string | Asset | Signal<string>): Modifier
  /**
   * Set background (supports gradients)
   */
  background(value: string | GradientDefinition | Asset): Modifier
  /**
   * Set font properties
   */
  font(options: AppearanceModifierProps['font']): Modifier
  /**
   * Set font size
   */
  fontSize(size: number | string): Modifier
  /**
   * Set font weight
   */
  fontWeight(
    weight: NonNullable<AppearanceModifierProps['font']>['weight']
  ): Modifier
  /**
   * Set font family
   */
  fontFamily(family: string): Modifier
  /**
   * Set opacity
   */
  opacity(value: number | Signal<number>): Modifier
  /**
   * Set corner radius (enhanced)
   */
  cornerRadius(radius: number | Signal<number>): Modifier
  /**
   * Set border
   */
  border(
    width: number,
    color?: string | Asset,
    style?: 'solid' | 'dashed' | 'dotted'
  ): Modifier
  /**
   * Set detailed border properties
   */
  borderDetailed(options: AppearanceModifierProps['border']): Modifier
}
/**
 * Interaction Modifiers
 */
export declare const interactionModifiers: {
  /**
   * Add tap handler
   */
  onTap(handler: (event: MouseEvent) => void): Modifier
  /**
   * Add hover handler
   */
  onHover(handler: (isHovered: boolean) => void): Modifier
  /**
   * Add focus handler
   */
  onFocus(handler: (isFocused: boolean) => void): Modifier
  /**
   * Set disabled state
   */
  disabled(isDisabled?: boolean | Signal<boolean>): Modifier
  /**
   * Set accessibility label
   */
  accessibilityLabel(label: string): Modifier
  /**
   * Set accessibility hint
   */
  accessibilityHint(hint: string): Modifier
}
/**
 * Animation Modifiers
 */
export declare const animationModifiers: {
  /**
   * Add transition
   */
  transition(
    property?: string,
    duration?: number,
    easing?: string,
    delay?: number
  ): Modifier
  /**
   * Add detailed transition
   */
  transitionDetailed(options: AnimationModifierProps['transition']): Modifier
  /**
   * Add animation
   */
  animation(options: AnimationModifierProps['animation']): Modifier
  /**
   * Add fade in animation
   */
  fadeIn(duration?: number): Modifier
  /**
   * Add fade out animation
   */
  fadeOut(duration?: number): Modifier
  /**
   * Add slide in animation
   */
  slideIn(
    direction?: 'up' | 'down' | 'left' | 'right',
    duration?: number,
    distance?: number
  ): Modifier
  /**
   * Add scale animation
   */
  scaleAnimation(from?: number, to?: number, duration?: number): Modifier
}
/**
 * Lifecycle Modifiers
 */
export declare const lifecycleModifiers: {
  /**
   * Execute handler when component appears in viewport
   */
  onAppear(handler: () => void): Modifier
  /**
   * Execute handler when component disappears from viewport
   */
  onDisappear(handler: () => void): Modifier
  /**
   * Execute async task with automatic cancellation on component unmount
   */
  task(
    operation: () => Promise<void> | void,
    options?: {
      id?: string
      priority?: 'background' | 'userInitiated' | 'utility' | 'default'
    }
  ): Modifier
  /**
   * Add pull-to-refresh functionality
   */
  refreshable(
    onRefresh: () => Promise<void>,
    isRefreshing?: boolean | Signal<boolean>
  ): Modifier
}
/**
 * Preset Modifiers - Common combinations
 */
export declare const presetModifiers: {
  /**
   * Card-like appearance
   */
  card(padding?: number): Modifier[]
  /**
   * Button-like appearance
   */
  button(
    backgroundColor?: string | Asset,
    textColor?: string | Asset
  ): Modifier[]
  /**
   * Input field appearance
   */
  input(): Modifier[]
  /**
   * Typography presets
   */
  typography: {
    title: () => Modifier[]
    heading: () => Modifier[]
    body: () => Modifier[]
    caption: () => Modifier[]
  }
}
/**
 * Export all core modifiers
 */
export declare const coreModifiers: {
  presets: {
    /**
     * Card-like appearance
     */
    card(padding?: number): Modifier[]
    /**
     * Button-like appearance
     */
    button(
      backgroundColor?: string | Asset,
      textColor?: string | Asset
    ): Modifier[]
    /**
     * Input field appearance
     */
    input(): Modifier[]
    /**
     * Typography presets
     */
    typography: {
      title: () => Modifier[]
      heading: () => Modifier[]
      body: () => Modifier[]
      caption: () => Modifier[]
    }
  }
  /**
   * Execute handler when component appears in viewport
   */
  onAppear(handler: () => void): Modifier
  /**
   * Execute handler when component disappears from viewport
   */
  onDisappear(handler: () => void): Modifier
  /**
   * Execute async task with automatic cancellation on component unmount
   */
  task(
    operation: () => Promise<void> | void,
    options?: {
      id?: string
      priority?: 'background' | 'userInitiated' | 'utility' | 'default'
    }
  ): Modifier
  /**
   * Add pull-to-refresh functionality
   */
  refreshable(
    onRefresh: () => Promise<void>,
    isRefreshing?: boolean | Signal<boolean>
  ): Modifier
  /**
   * Add transition
   */
  transition(
    property?: string,
    duration?: number,
    easing?: string,
    delay?: number
  ): Modifier
  /**
   * Add detailed transition
   */
  transitionDetailed(options: AnimationModifierProps['transition']): Modifier
  /**
   * Add animation
   */
  animation(options: AnimationModifierProps['animation']): Modifier
  /**
   * Add fade in animation
   */
  fadeIn(duration?: number): Modifier
  /**
   * Add fade out animation
   */
  fadeOut(duration?: number): Modifier
  /**
   * Add slide in animation
   */
  slideIn(
    direction?: 'up' | 'down' | 'left' | 'right',
    duration?: number,
    distance?: number
  ): Modifier
  /**
   * Add scale animation
   */
  scaleAnimation(from?: number, to?: number, duration?: number): Modifier
  /**
   * Add tap handler
   */
  onTap(handler: (event: MouseEvent) => void): Modifier
  /**
   * Add hover handler
   */
  onHover(handler: (isHovered: boolean) => void): Modifier
  /**
   * Add focus handler
   */
  onFocus(handler: (isFocused: boolean) => void): Modifier
  /**
   * Set disabled state
   */
  disabled(isDisabled?: boolean | Signal<boolean>): Modifier
  /**
   * Set accessibility label
   */
  accessibilityLabel(label: string): Modifier
  /**
   * Set accessibility hint
   */
  accessibilityHint(hint: string): Modifier
  /**
   * Set foreground (text) color
   */
  foregroundColor(color: string | Asset | Signal<string>): Modifier
  /**
   * Set background color
   */
  backgroundColor(color: string | Asset | Signal<string>): Modifier
  /**
   * Set background (supports gradients)
   */
  background(value: string | GradientDefinition | Asset): Modifier
  /**
   * Set font properties
   */
  font(options: AppearanceModifierProps['font']): Modifier
  /**
   * Set font size
   */
  fontSize(size: number | string): Modifier
  /**
   * Set font weight
   */
  fontWeight(
    weight: NonNullable<AppearanceModifierProps['font']>['weight']
  ): Modifier
  /**
   * Set font family
   */
  fontFamily(family: string): Modifier
  /**
   * Set opacity
   */
  opacity(value: number | Signal<number>): Modifier
  /**
   * Set corner radius (enhanced)
   */
  cornerRadius(radius: number | Signal<number>): Modifier
  /**
   * Set border
   */
  border(
    width: number,
    color?: string | Asset,
    style?: 'solid' | 'dashed' | 'dotted'
  ): Modifier
  /**
   * Set detailed border properties
   */
  borderDetailed(options: AppearanceModifierProps['border']): Modifier
  /**
   * Set frame dimensions with support for infinity
   */
  frame(
    width?: Dimension,
    height?: Dimension,
    options?: Omit<LayoutModifierProps['frame'], 'width' | 'height'>
  ): Modifier
  /**
   * Set padding on all sides
   */
  padding(value: number): Modifier
  /**
   * Set margin on all sides
   */
  margin(value: number): Modifier
  /**
   * Set content alignment
   */
  alignment(value: LayoutModifierProps['alignment']): Modifier
  /**
   * Set layout priority for ZStack container sizing and flexible layout
   * Higher priority views determine container size in ZStack
   */
  layoutPriority(priority: number | Signal<number>): Modifier
}
//# sourceMappingURL=core.d.ts.map
