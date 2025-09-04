/**
 * Margin Modifier - Best-in-class external spacing around elements
 *
 * Comprehensive interface for element margins with full SwiftUI compatibility,
 * CSS-in-JS support, reactive values, design system presets, and RTL awareness.
 */
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
import type { DOMNode } from '@tachui/core/runtime/types'
import { BaseModifier } from './base'
import type {
  ModifierContext,
  ReactiveModifierProps,
} from '@tachui/core/modifiers/types'
export type ReactiveMarginOptions = ReactiveModifierProps<MarginOptions>
export declare class MarginModifier extends BaseModifier<MarginOptions> {
  readonly type = 'margin'
  readonly priority = 50
  constructor(options: ReactiveMarginOptions)
  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined
  private computeMarginStyles
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
export declare function margin(options: ReactiveMarginOptions): MarginModifier
export declare function margin(all: MarginValue): MarginModifier
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
export declare function marginTop(value: MarginValue): MarginModifier
/**
 * Convenience function for bottom margin only
 *
 * @example
 * ```typescript
 * .marginBottom(24)
 * .marginBottom('2rem')
 * ```
 */
export declare function marginBottom(value: MarginValue): MarginModifier
/**
 * Convenience function for left margin only
 *
 * @example
 * ```typescript
 * .marginLeft(12)
 * .marginLeft('1rem')
 * ```
 */
export declare function marginLeft(value: MarginValue): MarginModifier
/**
 * Convenience function for right margin only
 *
 * @example
 * ```typescript
 * .marginRight(12)
 * .marginRight('1rem')
 * ```
 */
export declare function marginRight(value: MarginValue): MarginModifier
/**
 * SwiftUI-style leading margin (left in LTR, right in RTL)
 *
 * @example
 * ```typescript
 * .marginLeading(16)
 * .marginLeading('1rem')
 * ```
 */
export declare function marginLeading(value: MarginValue): MarginModifier
/**
 * SwiftUI-style trailing margin (right in LTR, left in RTL)
 *
 * @example
 * ```typescript
 * .marginTrailing(8)
 * .marginTrailing('0.5rem')
 * ```
 */
export declare function marginTrailing(value: MarginValue): MarginModifier
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
export declare function marginHorizontal(value: MarginValue): MarginModifier
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
export declare function marginVertical(value: MarginValue): MarginModifier
/**
 * Design system margin presets for consistent spacing
 *
 * Based on modern design system principles with t-shirt sizing
 * and semantic naming for common UI patterns.
 */
export declare const marginPresets: {
  /**
   * Extra small margin (4px) - For tight spacing
   */
  readonly xs: () => MarginModifier
  /**
   * Small margin (8px) - For compact components
   */
  readonly sm: () => MarginModifier
  /**
   * Medium margin (12px) - Default comfortable spacing
   */
  readonly md: () => MarginModifier
  /**
   * Large margin (16px) - For prominent separation
   */
  readonly lg: () => MarginModifier
  /**
   * Extra large margin (24px) - For emphasis
   */
  readonly xl: () => MarginModifier
  /**
   * Extra extra large margin (32px) - For major sections
   */
  readonly xxl: () => MarginModifier
  /**
   * Huge margin (48px) - For hero sections
   */
  readonly xxxl: () => MarginModifier
  /**
   * Component separation (vertical: 16, horizontal: 0)
   * For spacing between stacked components
   */
  readonly component: () => MarginModifier
  /**
   * Section separation (vertical: 24, horizontal: 0)
   * For major content sections
   */
  readonly section: () => MarginModifier
  /**
   * Page margin (horizontal: auto)
   * For centering page content
   */
  readonly page: () => MarginModifier
  /**
   * Card margin (all: 16)
   * Standard margin around card components
   */
  readonly card: () => MarginModifier
  /**
   * Compact card margin (all: 8)
   */
  readonly cardSm: () => MarginModifier
  /**
   * Spacious card margin (all: 24)
   */
  readonly cardLg: () => MarginModifier
  /**
   * Button margin (horizontal: 8, vertical: 4)
   * For spacing between inline buttons
   */
  readonly button: () => MarginModifier
  /**
   * List item margin (vertical: 8, horizontal: 0)
   * For spacing between list items
   */
  readonly listItem: () => MarginModifier
  /**
   * Form field margin (vertical: 12, horizontal: 0)
   * For spacing between form fields
   */
  readonly field: () => MarginModifier
  /**
   * Zero margin utility
   * For removing default margins
   */
  readonly none: () => MarginModifier
  /**
   * Auto margin utility
   * For centering elements
   */
  readonly auto: () => MarginModifier
}
//# sourceMappingURL=margin.d.ts.map
