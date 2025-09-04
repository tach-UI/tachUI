/**
 * Flexbox Modifier - Best-in-class flexbox layout system
 *
 * Comprehensive interface for flexbox properties with full CSS Grid fallbacks,
 * SwiftUI compatibility, reactive values, design system presets, and modern
 * CSS features including container queries support.
 */
import type { DOMNode } from '@tachui/core/runtime/types'
import { BaseModifier } from '../basic/base'
import type {
  ModifierContext,
  ReactiveModifierProps,
} from '@tachui/core/modifiers/types'
export type FlexValue =
  | number
  | string
  | `${number}px`
  | `${number}rem`
  | `${number}em`
  | `${number}%`
  | `${number}fr`
export interface FlexboxOptions {
  flexGrow?: number
  flexShrink?: number
  flexBasis?:
    | FlexValue
    | 'auto'
    | 'content'
    | 'max-content'
    | 'min-content'
    | 'fit-content'
  flex?: string | number | 'auto' | 'initial' | 'none'
  justifyContent?:
    | 'flex-start'
    | 'start'
    | 'flex-end'
    | 'end'
    | 'center'
    | 'space-between'
    | 'space-around'
    | 'space-evenly'
  alignItems?:
    | 'flex-start'
    | 'start'
    | 'flex-end'
    | 'end'
    | 'center'
    | 'stretch'
    | 'baseline'
    | 'first baseline'
    | 'last baseline'
  alignContent?:
    | 'flex-start'
    | 'start'
    | 'flex-end'
    | 'end'
    | 'center'
    | 'stretch'
    | 'space-between'
    | 'space-around'
    | 'space-evenly'
  alignSelf?:
    | 'auto'
    | 'flex-start'
    | 'start'
    | 'flex-end'
    | 'end'
    | 'center'
    | 'stretch'
    | 'baseline'
    | 'first baseline'
    | 'last baseline'
  flexDirection?: 'row' | 'row-reverse' | 'column' | 'column-reverse'
  flexWrap?: 'nowrap' | 'wrap' | 'wrap-reverse'
  flexFlow?: string
  gap?: FlexValue
  rowGap?: FlexValue
  columnGap?: FlexValue
  display?: 'flex' | 'inline-flex'
  placeItems?: string
  placeContent?: string
  placeSelf?: string
}
export type ReactiveFlexboxOptions = ReactiveModifierProps<FlexboxOptions>
export declare class FlexboxModifier extends BaseModifier<FlexboxOptions> {
  readonly type = 'flexbox'
  readonly priority = 60
  constructor(options: ReactiveFlexboxOptions)
  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined
  private computeFlexboxStyles
}
/**
 * Create a flexbox modifier with comprehensive layout control
 *
 * Best-in-class implementation with full type safety, modern CSS support,
 * and enhanced performance optimizations.
 *
 * @example
 * ```typescript
 * // Complete flexbox layout
 * .flexbox({
 *   display: 'flex',
 *   flexDirection: 'column',
 *   justifyContent: 'center',
 *   alignItems: 'stretch',
 *   gap: 16
 * })
 *
 * // Responsive flex container
 * .flexbox({
 *   flex: 1,
 *   gap: '1rem',
 *   flexWrap: 'wrap'
 * })
 *
 * // Modern CSS Grid alignment
 * .flexbox({
 *   display: 'flex',
 *   placeItems: 'center',
 *   gap: '2vw'
 * })
 * ```
 */
export declare function flexbox(
  options: ReactiveFlexboxOptions
): FlexboxModifier
/**
 * Convenience function for flex-grow
 *
 * @example
 * ```typescript
 * .flexGrow(1) // Grow to fill available space
 * .flexGrow(0) // Don't grow
 * ```
 */
export declare function flexGrow(value: number): FlexboxModifier
/**
 * Convenience function for flex-shrink
 *
 * @example
 * ```typescript
 * .flexShrink(1) // Allow shrinking
 * .flexShrink(0) // Prevent shrinking
 * ```
 */
export declare function flexShrink(value: number): FlexboxModifier
/**
 * Convenience function for flex-basis
 *
 * @example
 * ```typescript
 * .flexBasis('auto')
 * .flexBasis(200)
 * .flexBasis('50%')
 * ```
 */
export declare function flexBasis(
  value: FlexboxOptions['flexBasis']
): FlexboxModifier
/**
 * Convenience function for justify-content
 *
 * @example
 * ```typescript
 * .justifyContent('center')
 * .justifyContent('space-between')
 * ```
 */
export declare function justifyContent(
  value: FlexboxOptions['justifyContent']
): FlexboxModifier
/**
 * Convenience function for align-items
 *
 * @example
 * ```typescript
 * .alignItems('center')
 * .alignItems('stretch')
 * ```
 */
export declare function alignItems(
  value: FlexboxOptions['alignItems']
): FlexboxModifier
/**
 * Convenience function for align-self
 *
 * @example
 * ```typescript
 * .alignSelf('center')
 * .alignSelf('stretch')
 * ```
 */
export declare function alignSelf(
  value: FlexboxOptions['alignSelf']
): FlexboxModifier
/**
 * Convenience function for gap
 *
 * @example
 * ```typescript
 * .gap(16)
 * .gap('1rem')
 * .gap('2vw')
 * ```
 */
export declare function gap(value: FlexValue): FlexboxModifier
/**
 * Convenience function for flex-direction
 *
 * @example
 * ```typescript
 * .flexDirection('column')
 * .flexDirection('row-reverse')
 * ```
 */
export declare function flexDirection(
  value: FlexboxOptions['flexDirection']
): FlexboxModifier
/**
 * Convenience function for flex-wrap
 *
 * @example
 * ```typescript
 * .flexWrap('wrap')
 * .flexWrap('nowrap')
 * ```
 */
export declare function flexWrap(
  value: FlexboxOptions['flexWrap']
): FlexboxModifier
/**
 * Design system flexbox presets for consistent layouts
 *
 * Based on modern design system principles with semantic naming
 * for common layout patterns and responsive design.
 */
export declare const flexboxPresets: {
  /**
   * Standard flex container
   * Sets display: flex for basic flex container
   */
  readonly container: () => FlexboxModifier
  /**
   * Inline flex container
   * Sets display: inline-flex for inline flex behavior
   */
  readonly inline: () => FlexboxModifier
  /**
   * Horizontal layout with center alignment
   * Perfect for nav bars, button groups
   */
  readonly hcenter: () => FlexboxModifier
  /**
   * Vertical layout with center alignment
   * Perfect for cards, modals, centered content
   */
  readonly vcenter: () => FlexboxModifier
  /**
   * Space between layout
   * Common for headers, footers, navigation
   */
  readonly spaceBetween: () => FlexboxModifier
  /**
   * Space around layout
   * For even distribution with edge spacing
   */
  readonly spaceAround: () => FlexboxModifier
  /**
   * Column stack with spacing
   * For vertical component stacks
   */
  readonly vstack: () => FlexboxModifier
  /**
   * Row with spacing
   * For horizontal component layouts
   */
  readonly hstack: () => FlexboxModifier
  /**
   * Card layout
   * Column with internal spacing
   */
  readonly card: () => FlexboxModifier
  /**
   * Form layout
   * Column with form-appropriate spacing
   */
  readonly form: () => FlexboxModifier
  /**
   * Button group
   * Horizontal with tight spacing
   */
  readonly buttonGroup: () => FlexboxModifier
  /**
   * Sidebar layout
   * Vertical with stretch alignment
   */
  readonly sidebar: () => FlexboxModifier
  /**
   * Responsive wrap
   * Wrapping layout with gaps
   */
  readonly wrap: () => FlexboxModifier
  /**
   * Full flex item
   * Grows and shrinks to fill space
   */
  readonly fill: () => FlexboxModifier
  /**
   * Fixed flex item
   * Doesn't grow or shrink
   */
  readonly fixed: () => FlexboxModifier
  /**
   * Stretch alignment
   * Items stretch to container height
   */
  readonly stretch: () => FlexboxModifier
}
//# sourceMappingURL=flexbox.d.ts.map
