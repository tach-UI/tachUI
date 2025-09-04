/**
 * Base Modifier System Implementation
 *
 * Core modifier classes and utilities for the SwiftUI-inspired modifier system.
 */
import type { DOMNode } from '@tachui/core/runtime/types'
import type {
  CSSStyleProperties,
  Modifier,
  ModifierContext,
  ReactiveModifierProps,
  StyleComputationContext,
} from './types'
import { ModifierPriority } from '@tachui/core/modifiers/types'
/**
 * Abstract base modifier class
 */
export declare abstract class BaseModifier<TProps = {}>
  implements Modifier<TProps>
{
  readonly properties: TProps
  abstract readonly type: string
  abstract readonly priority: number
  constructor(properties: TProps)
  /**
   * Apply the modifier to a DOM node
   */
  abstract apply(node: DOMNode, context: ModifierContext): DOMNode | undefined
  /**
   * Helper to resolve reactive properties
   */
  protected resolveReactiveProps<T extends Record<string, any>>(
    props: ReactiveModifierProps<T>,
    context: StyleComputationContext
  ): T
  /**
   * Apply a single style change to an element with reactive support
   */
  protected applyStyleChange(
    element: Element,
    property: string,
    value: any
  ): void
  /**
   * Convert camelCase property to CSS kebab-case
   */
  protected toCSSProperty(property: string): string
  /**
   * Convert value to CSS value string
   */
  protected toCSSValue(value: any): string
  /**
   * Convert value to CSS value string with property-specific handling
   */
  protected toCSSValueForProperty(property: string, value: any): string
  /**
   * Apply multiple CSS properties to an element with reactive support
   */
  protected applyStyles(element: Element, styles: CSSStyleProperties): void
  /**
   * Add CSS classes to an element
   */
  protected addClasses(element: Element, classes: string[]): void
  /**
   * Remove CSS classes from an element
   */
  protected removeClasses(element: Element, classes: string[]): void
  /**
   * Create a style computation context
   */
  protected createStyleContext(
    componentId: string,
    element: Element,
    modifiers: Modifier[]
  ): StyleComputationContext
}
/**
 * Layout modifier for frame, padding, margin
 */
export declare class LayoutModifier extends BaseModifier {
  readonly type = 'layout'
  readonly priority = ModifierPriority.LAYOUT
  apply(node: DOMNode, context: ModifierContext): DOMNode | undefined
  private applyOffsetTransform
  private applyAspectRatio
  private applyScaleTransform
  private applyAbsolutePosition
  private applyZIndex
  private getTransformOrigin
  private computeLayoutStyles
}
/**
 * Appearance modifier for colors, fonts, borders, shadows
 */
export declare class AppearanceModifier extends BaseModifier {
  readonly type = 'appearance'
  readonly priority = ModifierPriority.APPEARANCE
  apply(node: DOMNode, context: ModifierContext): DOMNode | undefined
  /**
   * Apply Asset-based styles with theme reactivity
   */
  private applyAssetBasedStyles
  /**
   * Check if a value is an Asset object (including Asset proxies)
   */
  private isAsset
  private computeAppearanceStyles
  /**
   * Apply HTML attributes (ARIA, role, data attributes, etc.)
   */
  private applyAttributes
  private findComponentFromElement
}
/**
 * Interaction modifier for events and accessibility
 */
export declare class InteractionModifier extends BaseModifier {
  readonly type = 'interaction'
  readonly priority = ModifierPriority.INTERACTION
  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined
  /**
   * Setup long press gesture with timing and distance constraints
   */
  private setupLongPressGesture
  /**
   * Setup keyboard shortcut handling
   */
  private setupKeyboardShortcut
  /**
   * Setup focus management with reactive binding
   */
  private setupFocusManagement
  /**
   * Setup focusable behavior
   */
  private setupFocusable
  /**
   * Setup continuous hover tracking with coordinates
   */
  private setupContinuousHover
  /**
   * Setup hit testing control
   */
  private setupHitTesting
}
/**
 * Animation modifier for transitions and animations
 */
export declare class AnimationModifier extends BaseModifier {
  readonly type = 'animation'
  readonly priority = ModifierPriority.ANIMATION
  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined
  private applyOverlay
  private getOverlayAlignment
  private createKeyframeRule
  private addKeyframesToStylesheet
}
/**
 * Lifecycle modifier for component lifecycle events
 */
export declare class LifecycleModifier extends BaseModifier {
  readonly type = 'lifecycle'
  readonly priority = ModifierPriority.CUSTOM
  private activeAbortController?
  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined
  private setupLifecycleObserver
  private setupTask
  private setupRefreshable
  private cleanupFunctions
  protected addCleanup(fn: () => void): void
  cleanup(): void
}
//# sourceMappingURL=base.d.ts.map
