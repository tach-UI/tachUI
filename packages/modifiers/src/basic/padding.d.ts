/**
 * Padding Modifier - Best-in-class internal spacing within elements
 *
 * Comprehensive interface for element padding with full SwiftUI compatibility,
 * CSS-in-JS support, reactive values, design system presets, and RTL awareness.
 */
import type { DOMNode } from '@tachui/core/runtime/types'
import { BaseModifier } from './base'
import type {
  ModifierContext,
  ReactiveModifierProps,
} from '@tachui/core/modifiers/types'
export type PaddingValue =
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
export declare class PaddingModifier extends BaseModifier<PaddingOptions> {
  readonly type = 'padding'
  readonly priority = 45
  constructor(options: ReactivePaddingOptions)
  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined
  private computePaddingStyles
}
/**
 * Create a padding modifier with comprehensive flexibility
 *
 * Best-in-class implementation with full type safety, SwiftUI compatibility,
 * and modern CSS unit support.
 *
 * @example
 * ```typescript
 * // All sides equal
 * .padding({ all: 16 })
 * .padding(16) // Shorthand
 *
 * // Symmetric spacing
 * .padding({ vertical: 12, horizontal: 8 })
 *
 * // Individual sides with modern CSS units
 * .padding({ top: '1rem', bottom: 16, left: '2vw', right: 12 })
 *
 * // SwiftUI-style leading/trailing
 * .padding({ leading: 16, trailing: 8, vertical: 12 })
 *
 * // Mixed approach with overrides
 * .padding({ horizontal: 16, top: 8, bottom: 24 })
 *
 * // Modern CSS units
 * .padding({ all: '1rem' })
 * .padding({ vertical: '2vh', horizontal: '10vw' })
 * ```
 */
export declare function padding(
  options: ReactivePaddingOptions
): PaddingModifier
export declare function padding(all: PaddingValue): PaddingModifier
/**
 * Convenience function for top padding only
 *
 * @example
 * ```typescript
 * .paddingTop(16)
 * .paddingTop('1rem')
 * .paddingTop('2vh')
 * ```
 */
export declare function paddingTop(value: PaddingValue): PaddingModifier
/**
 * Convenience function for bottom padding only
 *
 * @example
 * ```typescript
 * .paddingBottom(24)
 * .paddingBottom('2rem')
 * ```
 */
export declare function paddingBottom(value: PaddingValue): PaddingModifier
/**
 * Convenience function for left padding only
 *
 * @example
 * ```typescript
 * .paddingLeft(12)
 * .paddingLeft('1rem')
 * ```
 */
export declare function paddingLeft(value: PaddingValue): PaddingModifier
/**
 * Convenience function for right padding only
 *
 * @example
 * ```typescript
 * .paddingRight(12)
 * .paddingRight('1rem')
 * ```
 */
export declare function paddingRight(value: PaddingValue): PaddingModifier
/**
 * SwiftUI-style leading padding (left in LTR, right in RTL)
 *
 * @example
 * ```typescript
 * .paddingLeading(16)
 * .paddingLeading('1rem')
 * ```
 */
export declare function paddingLeading(value: PaddingValue): PaddingModifier
/**
 * SwiftUI-style trailing padding (right in LTR, left in RTL)
 *
 * @example
 * ```typescript
 * .paddingTrailing(8)
 * .paddingTrailing('0.5rem')
 * ```
 */
export declare function paddingTrailing(value: PaddingValue): PaddingModifier
/**
 * Convenience function for left and right padding
 *
 * @example
 * ```typescript
 * .paddingHorizontal(20)
 * .paddingHorizontal('2rem')
 * .paddingHorizontal('5vw')
 * ```
 */
export declare function paddingHorizontal(value: PaddingValue): PaddingModifier
/**
 * Convenience function for top and bottom padding
 *
 * @example
 * ```typescript
 * .paddingVertical(16)
 * .paddingVertical('1rem')
 * .paddingVertical('3vh')
 * ```
 */
export declare function paddingVertical(value: PaddingValue): PaddingModifier
/**
 * Design system padding presets for consistent spacing
 *
 * Based on modern design system principles with t-shirt sizing
 * and semantic naming for common UI patterns.
 */
export declare const paddingPresets: {
  /**
   * Extra small padding (4px) - For tight spacing
   */
  readonly xs: () => PaddingModifier
  /**
   * Small padding (8px) - For compact components
   */
  readonly sm: () => PaddingModifier
  /**
   * Medium padding (12px) - Default comfortable spacing
   */
  readonly md: () => PaddingModifier
  /**
   * Large padding (16px) - For prominent components
   */
  readonly lg: () => PaddingModifier
  /**
   * Extra large padding (24px) - For emphasis
   */
  readonly xl: () => PaddingModifier
  /**
   * Extra extra large padding (32px) - For major sections
   */
  readonly xxl: () => PaddingModifier
  /**
   * Huge padding (48px) - For hero sections
   */
  readonly xxxl: () => PaddingModifier
  /**
   * Button padding preset (horizontal: 16, vertical: 8)
   * Optimized for interactive elements
   */
  readonly button: () => PaddingModifier
  /**
   * Small button padding (horizontal: 12, vertical: 6)
   */
  readonly buttonSm: () => PaddingModifier
  /**
   * Large button padding (horizontal: 24, vertical: 12)
   */
  readonly buttonLg: () => PaddingModifier
  /**
   * Card padding preset (all: 16)
   * Standard for card-like containers
   */
  readonly card: () => PaddingModifier
  /**
   * Compact card padding (all: 12)
   */
  readonly cardSm: () => PaddingModifier
  /**
   * Spacious card padding (all: 24)
   */
  readonly cardLg: () => PaddingModifier
  /**
   * Section padding preset (horizontal: 20, vertical: 12)
   * For content sections and layout blocks
   */
  readonly section: () => PaddingModifier
  /**
   * Page padding preset (horizontal: 24, vertical: 16)
   * For top-level page containers
   */
  readonly page: () => PaddingModifier
  /**
   * Form field padding (horizontal: 12, vertical: 8)
   */
  readonly field: () => PaddingModifier
  /**
   * Navigation item padding (horizontal: 16, vertical: 8)
   */
  readonly nav: () => PaddingModifier
  /**
   * List item padding (horizontal: 16, vertical: 12)
   */
  readonly listItem: () => PaddingModifier
}
//# sourceMappingURL=padding.d.ts.map
