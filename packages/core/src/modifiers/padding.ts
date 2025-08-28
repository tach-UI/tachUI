/**
 * Padding Modifier - internal spacing within elements
 *
 * Provides a comprehensive interface for setting element padding
 * with support for shorthand and directional properties, matching SwiftUI's padding modifiers.
 */

import type { DOMNode } from '../runtime/types'
import { BaseModifier } from './base'
import type { ModifierContext, ReactiveModifierProps } from './types'

// CSS-compatible padding values
export type PaddingValue = number | string

// Type-safe options with conflict prevention
export type PaddingOptions =
  | {
      all: PaddingValue
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
      vertical: PaddingValue
      horizontal: PaddingValue
      top?: never
      right?: never
      bottom?: never
      left?: never
      leading?: never
      trailing?: never
    }
  | {
      all?: never
      vertical?: PaddingValue
      horizontal?: PaddingValue
      top?: PaddingValue
      right?: PaddingValue
      bottom?: PaddingValue
      left?: PaddingValue
      leading?: never
      trailing?: never
    }
  | {
      all?: never
      vertical?: PaddingValue
      horizontal?: PaddingValue
      top?: PaddingValue
      leading?: PaddingValue
      trailing?: PaddingValue
      bottom?: PaddingValue
      right?: never
      left?: never
    }

export type ReactivePaddingOptions = ReactiveModifierProps<PaddingOptions>

export class PaddingModifier extends BaseModifier<PaddingOptions> {
  readonly type = 'padding'
  readonly priority = 45 // Priority 45 for internal spacing (before margin at 50)

  constructor(options: ReactivePaddingOptions) {
    // Preserve reactive values; BaseModifier.applyStyles will create effects
    super(options as unknown as PaddingOptions)
  }

  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined {
    if (!context.element) return

    const styles = this.computePaddingStyles(this.properties)
    this.applyStyles(context.element, styles)
    
    return undefined
  }

  private computePaddingStyles(props: PaddingOptions) {
    const styles: Record<string, any> = {}

    // Helper function to format padding values
    const formatValue = (value: PaddingValue): string => {
      if (typeof value === 'number') {
        return `${value}px`
      }
      return value // Already a string (e.g., '1rem', '50%', '0')
    }

    if ('all' in props && props.all !== undefined) {
      // All sides - highest priority
      styles.padding = formatValue(props.all)
    } else {
      // Handle shorthand properties first
      if ('vertical' in props && props.vertical !== undefined) {
        const value = formatValue(props.vertical)
        styles.paddingTop = value
        styles.paddingBottom = value
      }
      if ('horizontal' in props && props.horizontal !== undefined) {
        const value = formatValue(props.horizontal)
        styles.paddingLeft = value
        styles.paddingRight = value
      }

      // Handle specific sides (override shorthand if specified)
      if ('top' in props && props.top !== undefined) {
        styles.paddingTop = formatValue(props.top)
      }
      if ('right' in props && props.right !== undefined) {
        styles.paddingRight = formatValue(props.right)
      }
      if ('bottom' in props && props.bottom !== undefined) {
        styles.paddingBottom = formatValue(props.bottom)
      }
      if ('left' in props && props.left !== undefined) {
        styles.paddingLeft = formatValue(props.left)
      }

      // Handle SwiftUI-style leading/trailing (left/right in LTR)
      if ('leading' in props && props.leading !== undefined) {
        styles.paddingLeft = formatValue(props.leading)
      }
      if ('trailing' in props && props.trailing !== undefined) {
        styles.paddingRight = formatValue(props.trailing)
      }
    }

    return styles
  }
}

/**
 * Create a padding modifier with flexible options
 *
 * @example
 * ```typescript
 * // All sides equal
 * .padding({ all: 16 })
 *
 * // Symmetric spacing
 * .padding({ vertical: 12, horizontal: 8 })
 *
 * // Specific sides
 * .padding({ top: 8, bottom: 16, left: 12, right: 12 })
 *
 * // SwiftUI-style leading/trailing
 * .padding({ leading: 16, trailing: 8, vertical: 12 })
 *
 * // Mixed approach
 * .padding({ horizontal: 16, top: 8, bottom: 24 })
 * ```
 */
export function padding(options: ReactivePaddingOptions): PaddingModifier
export function padding(all: PaddingValue): PaddingModifier
export function padding(optionsOrAll: ReactivePaddingOptions | PaddingValue): PaddingModifier {
  if (typeof optionsOrAll === 'number' || typeof optionsOrAll === 'string') {
    return new PaddingModifier({ all: optionsOrAll })
  }
  return new PaddingModifier(optionsOrAll)
}

/**
 * Convenience function for top padding only
 *
 * @example
 * ```typescript
 * .paddingTop(16)
 * .paddingTop('1rem')
 * ```
 */
export function paddingTop(value: PaddingValue): PaddingModifier {
  return new PaddingModifier({ top: value })
}

/**
 * Convenience function for bottom padding only
 *
 * @example
 * ```typescript
 * .paddingBottom(24)
 * .paddingBottom('2rem')
 * ```
 */
export function paddingBottom(value: PaddingValue): PaddingModifier {
  return new PaddingModifier({ bottom: value })
}

/**
 * Convenience function for left padding only
 *
 * @example
 * ```typescript
 * .paddingLeft(12)
 * .paddingLeft('1rem')
 * ```
 */
export function paddingLeft(value: PaddingValue): PaddingModifier {
  return new PaddingModifier({ left: value })
}

/**
 * Convenience function for right padding only
 *
 * @example
 * ```typescript
 * .paddingRight(12)
 * .paddingRight('1rem')
 * ```
 */
export function paddingRight(value: PaddingValue): PaddingModifier {
  return new PaddingModifier({ right: value })
}

/**
 * SwiftUI-style leading padding (left in LTR languages)
 *
 * @example
 * ```typescript
 * .paddingLeading(16)
 * .paddingLeading('1rem')
 * ```
 */
export function paddingLeading(value: PaddingValue): PaddingModifier {
  return new PaddingModifier({ leading: value })
}

/**
 * SwiftUI-style trailing padding (right in LTR languages)
 *
 * @example
 * ```typescript
 * .paddingTrailing(8)
 * .paddingTrailing('0.5rem')
 * ```
 */
export function paddingTrailing(value: PaddingValue): PaddingModifier {
  return new PaddingModifier({ trailing: value })
}

/**
 * Convenience function for left and right padding
 *
 * @example
 * ```typescript
 * .paddingHorizontal(20)
 * .paddingHorizontal('2rem')
 * ```
 */
export function paddingHorizontal(value: PaddingValue): PaddingModifier {
  return new PaddingModifier({ horizontal: value })
}

/**
 * Convenience function for top and bottom padding
 *
 * @example
 * ```typescript
 * .paddingVertical(16)
 * .paddingVertical('1rem')
 * ```
 */
export function paddingVertical(value: PaddingValue): PaddingModifier {
  return new PaddingModifier({ vertical: value })
}

/**
 * Common padding presets for consistent design
 */
export const paddingPresets = {
  /**
   * Extra small padding (4px)
   */
  xs: () => padding(4),

  /**
   * Small padding (8px)
   */
  sm: () => padding(8),

  /**
   * Medium padding (12px)
   */
  md: () => padding(12),

  /**
   * Large padding (16px)
   */
  lg: () => padding(16),

  /**
   * Extra large padding (24px)
   */
  xl: () => padding(24),

  /**
   * Extra extra large padding (32px)
   */
  xxl: () => padding(32),

  /**
   * Button padding preset (horizontal: 16, vertical: 8)
   */
  button: () => padding({ horizontal: 16, vertical: 8 }),

  /**
   * Card padding preset (all: 16)
   */
  card: () => padding(16),

  /**
   * Section padding preset (horizontal: 20, vertical: 12)
   */
  section: () => padding({ horizontal: 20, vertical: 12 }),
} as const
