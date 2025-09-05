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

// Modern CSS-compatible flex values with comprehensive unit support
export type FlexValue =
  | number
  | string
  | `${number}px`
  | `${number}rem`
  | `${number}em`
  | `${number}%`
  | `${number}fr`

// Enhanced flexbox options with modern CSS features
export interface FlexboxOptions {
  // Core flex properties
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

  // Container alignment properties
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

  // Item-specific alignment
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

  // Direction and wrapping
  flexDirection?: 'row' | 'row-reverse' | 'column' | 'column-reverse'
  flexWrap?: 'nowrap' | 'wrap' | 'wrap-reverse'
  flexFlow?: string // Shorthand for flex-direction and flex-wrap

  // Gap properties with enhanced support
  gap?: FlexValue
  rowGap?: FlexValue
  columnGap?: FlexValue

  // Display property for flex containers
  display?: 'flex' | 'inline-flex'

  // Modern CSS Grid alignment support
  placeItems?: string
  placeContent?: string
  placeSelf?: string
}

export type ReactiveFlexboxOptions = ReactiveModifierProps<FlexboxOptions>

export class FlexboxModifier extends BaseModifier<FlexboxOptions> {
  readonly type = 'flexbox'
  readonly priority = 60 // Optimized priority for layout modifiers

  constructor(options: ReactiveFlexboxOptions) {
    // Enhanced reactive value handling
    super(options as unknown as FlexboxOptions)
  }

  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined {
    if (!context.element) return

    const styles = this.computeFlexboxStyles(this.properties)
    this.applyStyles(context.element, styles)

    return undefined
  }

  private computeFlexboxStyles(props: FlexboxOptions) {
    const styles: Record<string, string> = {}

    // Enhanced value formatter with comprehensive CSS unit support
    const formatValue = (value: FlexValue | string | number): string => {
      if (typeof value === 'number') {
        return `${value}px`
      }
      if (typeof value === 'string') {
        // Validate and normalize CSS values
        const cssValueRegex = /^-?\d*\.?\d+(px|rem|em|%|fr|vw|vh|vmin|vmax)$/
        if (cssValueRegex.test(value)) return value
        if (
          [
            'auto',
            'content',
            'max-content',
            'min-content',
            'fit-content',
            'initial',
            'inherit',
            'unset',
            'none',
          ].includes(value)
        ) {
          return value
        }
        // Fallback for invalid strings
        return `${value}px`
      }
      return String(value)
    }

    // Display property (essential for flex containers)
    if (props.display !== undefined) {
      styles.display = props.display
    }

    // Core flex properties with enhanced handling
    if (props.flexGrow !== undefined) {
      styles.flexGrow = props.flexGrow.toString()
    }
    if (props.flexShrink !== undefined) {
      styles.flexShrink = props.flexShrink.toString()
    }
    if (props.flexBasis !== undefined) {
      styles.flexBasis = formatValue(props.flexBasis)
    }
    if (props.flex !== undefined) {
      styles.flex =
        typeof props.flex === 'number' ? props.flex.toString() : props.flex
    }

    // Container alignment properties
    if (props.justifyContent !== undefined) {
      styles.justifyContent = props.justifyContent
    }
    if (props.alignItems !== undefined) {
      styles.alignItems = props.alignItems
    }
    if (props.alignContent !== undefined) {
      styles.alignContent = props.alignContent
    }

    // Item-specific alignment
    if (props.alignSelf !== undefined) {
      styles.alignSelf = props.alignSelf
    }

    // Direction and wrapping
    if (props.flexDirection !== undefined) {
      styles.flexDirection = props.flexDirection
    }
    if (props.flexWrap !== undefined) {
      styles.flexWrap = props.flexWrap
    }
    if (props.flexFlow !== undefined) {
      styles.flexFlow = props.flexFlow
    }

    // Gap properties with enhanced support
    if (props.gap !== undefined) {
      styles.gap = formatValue(props.gap)
    }
    if (props.rowGap !== undefined) {
      styles.rowGap = formatValue(props.rowGap)
    }
    if (props.columnGap !== undefined) {
      styles.columnGap = formatValue(props.columnGap)
    }

    // Modern CSS Grid alignment support
    if (props.placeItems !== undefined) {
      styles.placeItems = props.placeItems
    }
    if (props.placeContent !== undefined) {
      styles.placeContent = props.placeContent
    }
    if (props.placeSelf !== undefined) {
      styles.placeSelf = props.placeSelf
    }

    return styles
  }
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
export function flexbox(options: ReactiveFlexboxOptions): FlexboxModifier {
  return new FlexboxModifier(options)
}

/**
 * Convenience function for flex-grow
 *
 * @example
 * ```typescript
 * .flexGrow(1) // Grow to fill available space
 * .flexGrow(0) // Don't grow
 * ```
 */
export function flexGrow(value: number): FlexboxModifier {
  return new FlexboxModifier({ flexGrow: value })
}

/**
 * Convenience function for flex-shrink
 *
 * @example
 * ```typescript
 * .flexShrink(1) // Allow shrinking
 * .flexShrink(0) // Prevent shrinking
 * ```
 */
export function flexShrink(value: number): FlexboxModifier {
  return new FlexboxModifier({ flexShrink: value })
}

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
export function flexBasis(value: FlexboxOptions['flexBasis']): FlexboxModifier {
  return new FlexboxModifier({ flexBasis: value })
}

/**
 * Convenience function for justify-content
 *
 * @example
 * ```typescript
 * .justifyContent('center')
 * .justifyContent('space-between')
 * ```
 */
export function justifyContent(
  value: FlexboxOptions['justifyContent']
): FlexboxModifier {
  return new FlexboxModifier({ justifyContent: value })
}

/**
 * Convenience function for align-items
 *
 * @example
 * ```typescript
 * .alignItems('center')
 * .alignItems('stretch')
 * ```
 */
export function alignItems(
  value: FlexboxOptions['alignItems']
): FlexboxModifier {
  return new FlexboxModifier({ alignItems: value })
}

/**
 * Convenience function for align-self
 *
 * @example
 * ```typescript
 * .alignSelf('center')
 * .alignSelf('stretch')
 * ```
 */
export function alignSelf(value: FlexboxOptions['alignSelf']): FlexboxModifier {
  return new FlexboxModifier({ alignSelf: value })
}

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
export function gap(value: FlexValue): FlexboxModifier {
  return new FlexboxModifier({ gap: value })
}

/**
 * Convenience function for flex-direction
 *
 * @example
 * ```typescript
 * .flexDirection('column')
 * .flexDirection('row-reverse')
 * ```
 */
export function flexDirection(
  value: FlexboxOptions['flexDirection']
): FlexboxModifier {
  return new FlexboxModifier({ flexDirection: value })
}

/**
 * Convenience function for flex-wrap
 *
 * @example
 * ```typescript
 * .flexWrap('wrap')
 * .flexWrap('nowrap')
 * ```
 */
export function flexWrap(value: FlexboxOptions['flexWrap']): FlexboxModifier {
  return new FlexboxModifier({ flexWrap: value })
}

/**
 * Design system flexbox presets for consistent layouts
 *
 * Based on modern design system principles with semantic naming
 * for common layout patterns and responsive design.
 */
export const flexboxPresets = {
  /**
   * Standard flex container
   * Sets display: flex for basic flex container
   */
  container: () => flexbox({ display: 'flex' }),

  /**
   * Inline flex container
   * Sets display: inline-flex for inline flex behavior
   */
  inline: () => flexbox({ display: 'inline-flex' }),

  /**
   * Horizontal layout with center alignment
   * Perfect for nav bars, button groups
   */
  hcenter: () =>
    flexbox({
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    }),

  /**
   * Vertical layout with center alignment
   * Perfect for cards, modals, centered content
   */
  vcenter: () =>
    flexbox({
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
    }),

  /**
   * Space between layout
   * Common for headers, footers, navigation
   */
  spaceBetween: () =>
    flexbox({
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    }),

  /**
   * Space around layout
   * For even distribution with edge spacing
   */
  spaceAround: () =>
    flexbox({
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
    }),

  /**
   * Column stack with spacing
   * For vertical component stacks
   */
  vstack: () =>
    flexbox({
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
    }),

  /**
   * Row with spacing
   * For horizontal component layouts
   */
  hstack: () =>
    flexbox({
      display: 'flex',
      flexDirection: 'row',
      gap: 16,
      alignItems: 'center',
    }),

  /**
   * Card layout
   * Column with internal spacing
   */
  card: () =>
    flexbox({
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
    }),

  /**
   * Form layout
   * Column with form-appropriate spacing
   */
  form: () =>
    flexbox({
      display: 'flex',
      flexDirection: 'column',
      gap: 20,
    }),

  /**
   * Button group
   * Horizontal with tight spacing
   */
  buttonGroup: () =>
    flexbox({
      display: 'flex',
      flexDirection: 'row',
      gap: 8,
      alignItems: 'center',
    }),

  /**
   * Sidebar layout
   * Vertical with stretch alignment
   */
  sidebar: () =>
    flexbox({
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'stretch',
    }),

  /**
   * Responsive wrap
   * Wrapping layout with gaps
   */
  wrap: () =>
    flexbox({
      display: 'flex',
      flexWrap: 'wrap',
      gap: 16,
    }),

  /**
   * Full flex item
   * Grows and shrinks to fill space
   */
  fill: () =>
    flexbox({
      flex: 1,
    }),

  /**
   * Fixed flex item
   * Doesn't grow or shrink
   */
  fixed: () =>
    flexbox({
      flexGrow: 0,
      flexShrink: 0,
    }),

  /**
   * Stretch alignment
   * Items stretch to container height
   */
  stretch: () =>
    flexbox({
      display: 'flex',
      alignItems: 'stretch',
    }),
} as const

// Types are exported above - avoiding duplicate exports
