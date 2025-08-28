/**
 * Margin Modifier - spacing around elements
 *
 * Provides a unified interface for setting element margins
 * with support for shorthand and directional properties.
 */

import type { DOMNode } from '../runtime/types'
import { BaseModifier } from './base'
import type { ModifierContext, ReactiveModifierProps } from './types'

// CSS-compatible margin values
export type MarginValue = number | string

// Type-safe options with conflict prevention
export type MarginOptions =
  | {
      all: MarginValue
      vertical?: never
      horizontal?: never
      top?: never
      right?: never
      bottom?: never
      left?: never
    }
  | {
      all?: never
      vertical: MarginValue
      horizontal: MarginValue
      top?: never
      right?: never
      bottom?: never
      left?: never
    }
  | {
      all?: never
      vertical?: MarginValue
      horizontal?: MarginValue
      top?: MarginValue
      right?: MarginValue
      bottom?: MarginValue
      left?: MarginValue
    }

export type ReactiveMarginOptions = ReactiveModifierProps<MarginOptions>

// Helper function to format margin values - moved to outer scope
function formatMarginValue(value: MarginValue): string {
  if (typeof value === 'number') {
    return `${value}px`
  }
  return value // Already a string (e.g., 'auto', '1rem', '50%')
}

export class MarginModifier extends BaseModifier<MarginOptions> {
  readonly type = 'margin'
  readonly priority = 50 // Priority 50 for spacing

  constructor(options: ReactiveMarginOptions) {
    // Preserve reactive values; BaseModifier.applyStyles will create effects
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

    if ('all' in props && props.all !== undefined) {
      // All sides - highest priority
      styles.margin = formatMarginValue(props.all)
    } else {
      // Handle shorthand properties first
      if ('vertical' in props && props.vertical !== undefined) {
        const value = formatMarginValue(props.vertical)
        styles.marginTop = value
        styles.marginBottom = value
      }
      if ('horizontal' in props && props.horizontal !== undefined) {
        const value = formatMarginValue(props.horizontal)
        styles.marginLeft = value
        styles.marginRight = value
      }

      // Handle specific sides (override shorthand if specified)
      if ('top' in props && props.top !== undefined) {
        styles.marginTop = formatMarginValue(props.top)
      }
      if ('right' in props && props.right !== undefined) {
        styles.marginRight = formatMarginValue(props.right)
      }
      if ('bottom' in props && props.bottom !== undefined) {
        styles.marginBottom = formatMarginValue(props.bottom)
      }
      if ('left' in props && props.left !== undefined) {
        styles.marginLeft = formatMarginValue(props.left)
      }
    }

    return styles
  }
}

/**
 * Create a margin modifier with flexible options
 *
 * @example
 * ```typescript
 * // All sides equal
 * .margin({ all: 16 })
 * .margin({ all: 'auto' })
 *
 * // Symmetric spacing
 * .margin({ vertical: 12, horizontal: 8 })
 * .margin({ vertical: 30, horizontal: 'auto' })
 *
 * // Specific sides
 * .margin({ top: 8, bottom: 16, left: 12, right: 12 })
 * .margin({ top: 8, bottom: 16, left: 'auto', right: 'auto' })
 *
 * // Mixed approach
 * .margin({ horizontal: 16, top: 8, bottom: 24 })
 * .margin({ horizontal: 'auto', top: '1rem', bottom: '2rem' })
 * ```
 */
export function margin(options: ReactiveMarginOptions): MarginModifier
export function margin(all: MarginValue): MarginModifier
export function margin(optionsOrAll: ReactiveMarginOptions | MarginValue): MarginModifier {
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
 * .marginTop('auto')
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
 * .marginBottom('auto')
 * ```
 */
export function marginBottom(value: MarginValue): MarginModifier {
  return new MarginModifier({ bottom: value })
}

/**
 * Convenience function for left and right margins
 *
 * @example
 * ```typescript
 * .marginHorizontal(20)
 * .marginHorizontal('auto')
 * ```
 */
export function marginHorizontal(value: MarginValue): MarginModifier {
  return new MarginModifier({ horizontal: value })
}

/**
 * Convenience function for top and bottom margins
 *
 * @example
 * ```typescript
 * .marginVertical(16)
 * .marginVertical('auto')
 * ```
 */
export function marginVertical(value: MarginValue): MarginModifier {
  return new MarginModifier({ vertical: value })
}

/**
 * Convenience function for left margin only
 *
 * @example
 * ```typescript
 * .marginLeft(12)
 * .marginLeft('auto')
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
 * .marginRight('auto')
 * ```
 */
export function marginRight(value: MarginValue): MarginModifier {
  return new MarginModifier({ right: value })
}
