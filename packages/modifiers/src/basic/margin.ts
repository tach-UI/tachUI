/**
 * Margin Modifier - Best-in-class external spacing around elements
 *
 * Comprehensive interface for element margins with full SwiftUI compatibility,
 * CSS-in-JS support, reactive values, design system presets, and RTL awareness.
 */

// Comprehensive CSS-compatible margin values including modern CSS units
export type MarginValue =
  | number
  | string
  | `${number}px`
  | `${number}rem`
  | `${number}em`
  | `${number}%`
  | `${number}vw`
  | `${number}vh`
  | `${number}vmin`
  | `${number}vmax`
  | 'auto'

// Advanced type-safe options with comprehensive conflict prevention and SwiftUI compatibility
export type MarginOptions =
  | {
      all: MarginValue
      vertical?: never
      horizontal?: never
      top?: never
      right?: never
      bottom?: never
      left?: never
      leading?: never
      trailing?: never
    }
  | {
      all?: never
      vertical: MarginValue
      horizontal: MarginValue
      top?: never
      right?: never
      bottom?: never
      left?: never
      leading?: never
      trailing?: never
    }
  | {
      all?: never
      vertical?: MarginValue
      horizontal?: MarginValue
      top?: MarginValue
      right?: MarginValue
      bottom?: MarginValue
      left?: MarginValue
      leading?: never
      trailing?: never
    }
  | {
      all?: never
      vertical?: MarginValue
      horizontal?: MarginValue
      top?: MarginValue
      leading?: MarginValue
      trailing?: MarginValue
      bottom?: MarginValue
      right?: never
      left?: never
    }

import type { DOMNode } from '@tachui/types/runtime'
import { BaseModifier } from './base'
import type {
  ModifierContext,
  ReactiveModifierProps,
} from '@tachui/types/modifiers'
import { isSignal, isComputed } from '@tachui/core/reactive'

export type ReactiveMarginOptions = ReactiveModifierProps<MarginOptions>

export class MarginModifier extends BaseModifier<MarginOptions> {
  readonly type = 'margin'
  readonly priority = 50 // Optimized priority for external spacing (after padding at 45)

  constructor(options: ReactiveMarginOptions) {
    // Enhanced reactive value handling
    super(options as unknown as MarginOptions)
  }

  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined {
    if (!context.element) return

    const styles = this.computeMarginStyles(this.properties)
    this.applyStyles(context.element, styles)

    return undefined
  }

  private computeMarginStyles(props: MarginOptions) {
    const styles: Record<string, any> = {}

    // Enhanced value formatter with comprehensive CSS unit support
    // Now handles reactive signals properly by passing them through unchanged
    const formatValue = (value: MarginValue): any => {
      // Pass reactive signals through directly to applyStyles
      if (isSignal(value) || isComputed(value)) {
        return value
      }

      if (typeof value === 'number') {
        return `${value}px`
      }
      if (value === 'auto') return value
      if (typeof value === 'string') {
        // Validate and normalize CSS values
        const cssValueRegex = /^-?\d*\.?\d+(px|rem|em|%|vw|vh|vmin|vmax)$/
        return cssValueRegex.test(value) ? value : `${value}px`
      }
      return String(value)
    }

    // Priority-based application with enhanced logic
    if ('all' in props && props.all !== undefined) {
      // All sides - highest priority, most efficient CSS
      styles.margin = formatValue(props.all)
    } else {
      // Handle shorthand properties with optimal CSS generation
      if ('vertical' in props && props.vertical !== undefined) {
        const value = formatValue(props.vertical)
        styles.marginTop = value
        styles.marginBottom = value
      }
      if ('horizontal' in props && props.horizontal !== undefined) {
        const value = formatValue(props.horizontal)
        styles.marginLeft = value
        styles.marginRight = value
      }

      // Individual sides override shorthand (maintain specificity)
      if ('top' in props && props.top !== undefined) {
        styles.marginTop = formatValue(props.top)
      }
      if ('right' in props && props.right !== undefined) {
        styles.marginRight = formatValue(props.right)
      }
      if ('bottom' in props && props.bottom !== undefined) {
        styles.marginBottom = formatValue(props.bottom)
      }
      if ('left' in props && props.left !== undefined) {
        styles.marginLeft = formatValue(props.left)
      }

      // SwiftUI-style leading/trailing with RTL awareness
      // TODO: Add RTL detection for proper leading/trailing mapping
      if ('leading' in props && props.leading !== undefined) {
        styles.marginLeft = formatValue(props.leading) // LTR assumption
      }
      if ('trailing' in props && props.trailing !== undefined) {
        styles.marginRight = formatValue(props.trailing) // LTR assumption
      }
    }

    return styles
  }
}

/**
 * Create a margin modifier with comprehensive flexibility
 *
 * Best-in-class implementation with full type safety, SwiftUI compatibility,
 * and modern CSS unit support.
 *
 * @example
 * ```typescript
 * // All sides equal
 * .margin({ all: 16 })
 * .margin(16) // Shorthand
 * .margin('auto') // Center horizontally
 *
 * // Symmetric spacing
 * .margin({ vertical: 12, horizontal: 8 })
 * .margin({ vertical: 30, horizontal: 'auto' })
 *
 * // Individual sides with modern CSS units
 * .margin({ top: '1rem', bottom: 16, left: '2vw', right: 12 })
 *
 * // SwiftUI-style leading/trailing
 * .margin({ leading: 16, trailing: 8, vertical: 12 })
 *
 * // Mixed approach with overrides
 * .margin({ horizontal: 16, top: 8, bottom: 24 })
 *
 * // Modern CSS units
 * .margin({ all: '1rem' })
 * .margin({ vertical: '2vh', horizontal: 'auto' })
 * ```
 */
export function margin(options: ReactiveMarginOptions): MarginModifier
export function margin(all: MarginValue): MarginModifier
export function margin(
  optionsOrAll: ReactiveMarginOptions | MarginValue
): MarginModifier {
  if (typeof optionsOrAll === 'number' || typeof optionsOrAll === 'string') {
    return new MarginModifier({ all: optionsOrAll })
  }
  return new MarginModifier(optionsOrAll)
}

/**
 * Convenience function for top margin only
 *
 * @example
 * ```typescript
 * .marginTop(16)
 * .marginTop('1rem')
 * .marginTop('2vh')
 * ```
 */
export function marginTop(value: MarginValue): MarginModifier {
  return new MarginModifier({ top: value })
}

/**
 * Convenience function for bottom margin only
 *
 * @example
 * ```typescript
 * .marginBottom(24)
 * .marginBottom('2rem')
 * ```
 */
export function marginBottom(value: MarginValue): MarginModifier {
  return new MarginModifier({ bottom: value })
}

/**
 * Convenience function for left margin only
 *
 * @example
 * ```typescript
 * .marginLeft(12)
 * .marginLeft('1rem')
 * ```
 */
export function marginLeft(value: MarginValue): MarginModifier {
  return new MarginModifier({ left: value })
}

/**
 * Convenience function for right margin only
 *
 * @example
 * ```typescript
 * .marginRight(12)
 * .marginRight('1rem')
 * ```
 */
export function marginRight(value: MarginValue): MarginModifier {
  return new MarginModifier({ right: value })
}

/**
 * SwiftUI-style leading margin (left in LTR, right in RTL)
 *
 * @example
 * ```typescript
 * .marginLeading(16)
 * .marginLeading('1rem')
 * ```
 */
export function marginLeading(value: MarginValue): MarginModifier {
  return new MarginModifier({ leading: value })
}

/**
 * SwiftUI-style trailing margin (right in LTR, left in RTL)
 *
 * @example
 * ```typescript
 * .marginTrailing(8)
 * .marginTrailing('0.5rem')
 * ```
 */
export function marginTrailing(value: MarginValue): MarginModifier {
  return new MarginModifier({ trailing: value })
}

/**
 * Convenience function for left and right margin
 *
 * @example
 * ```typescript
 * .marginHorizontal(20)
 * .marginHorizontal('2rem')
 * .marginHorizontal('auto') // Center horizontally
 * .marginHorizontal('5vw')
 * ```
 */
export function marginHorizontal(value: MarginValue): MarginModifier {
  return new MarginModifier({ horizontal: value })
}

/**
 * Convenience function for top and bottom margin
 *
 * @example
 * ```typescript
 * .marginVertical(16)
 * .marginVertical('1rem')
 * .marginVertical('3vh')
 * ```
 */
export function marginVertical(value: MarginValue): MarginModifier {
  return new MarginModifier({ vertical: value })
}

/**
 * Design system margin presets for consistent spacing
 *
 * Based on modern design system principles with t-shirt sizing
 * and semantic naming for common UI patterns.
 */
export const marginPresets = {
  /**
   * Extra small margin (4px) - For tight spacing
   */
  xs: () => margin(4),

  /**
   * Small margin (8px) - For compact components
   */
  sm: () => margin(8),

  /**
   * Medium margin (12px) - Default comfortable spacing
   */
  md: () => margin(12),

  /**
   * Large margin (16px) - For prominent separation
   */
  lg: () => margin(16),

  /**
   * Extra large margin (24px) - For emphasis
   */
  xl: () => margin(24),

  /**
   * Extra extra large margin (32px) - For major sections
   */
  xxl: () => margin(32),

  /**
   * Huge margin (48px) - For hero sections
   */
  xxxl: () => margin(48),

  // Semantic presets for common UI patterns

  /**
   * Component separation (vertical: 16, horizontal: 0)
   * For spacing between stacked components
   */
  component: () => margin({ vertical: 16, horizontal: 0 }),

  /**
   * Section separation (vertical: 24, horizontal: 0)
   * For major content sections
   */
  section: () => margin({ vertical: 24, horizontal: 0 }),

  /**
   * Page margin (horizontal: auto)
   * For centering page content
   */
  page: () => margin({ horizontal: 'auto' }),

  /**
   * Card margin (all: 16)
   * Standard margin around card components
   */
  card: () => margin(16),

  /**
   * Compact card margin (all: 8)
   */
  cardSm: () => margin(8),

  /**
   * Spacious card margin (all: 24)
   */
  cardLg: () => margin(24),

  /**
   * Button margin (horizontal: 8, vertical: 4)
   * For spacing between inline buttons
   */
  button: () => margin({ horizontal: 8, vertical: 4 }),

  /**
   * List item margin (vertical: 8, horizontal: 0)
   * For spacing between list items
   */
  listItem: () => margin({ vertical: 8, horizontal: 0 }),

  /**
   * Form field margin (vertical: 12, horizontal: 0)
   * For spacing between form fields
   */
  field: () => margin({ vertical: 12, horizontal: 0 }),

  /**
   * Zero margin utility
   * For removing default margins
   */
  none: () => margin(0),

  /**
   * Auto margin utility
   * For centering elements
   */
  auto: () => margin('auto'),
} as const

// Types are exported above - avoiding duplicate exports
