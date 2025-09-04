/**
 * Size Modifier - width, height, min/max dimensions
 *
 * Provides a unified interface for setting element dimensions
 * with support for SwiftUI-style infinity constants.
 */
import type { DOMNode } from '@tachui/core/runtime/types'
import type { Dimension } from '@tachui/core/constants/layout'
import { BaseModifier } from './base'
import type {
  ModifierContext,
  ReactiveModifierProps,
} from '@tachui/core/modifiers/types'
export interface SizeOptions {
  width?: Dimension
  height?: Dimension
  minWidth?: Dimension
  maxWidth?: Dimension
  minHeight?: Dimension
  maxHeight?: Dimension
}
export type ReactiveSizeOptions = ReactiveModifierProps<SizeOptions>
export declare class SizeModifier extends BaseModifier<SizeOptions> {
  readonly type = 'size'
  readonly priority = 80
  constructor(options: ReactiveSizeOptions)
  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined
  private computeSizeStyles
}
/**
 * Create a size modifier with multiple dimension properties
 * Now supports SwiftUI-style infinity for responsive layouts
 *
 * @example
 * ```typescript
 * // Set both width and height
 * .size({ width: 200, height: 100 })
 *
 * // Set responsive width with constraints
 * .size({ width: '100%', maxWidth: 800, minWidth: 320 })
 *
 * // SwiftUI-style infinity support
 * .size({ width: infinity, height: 200 })
 * .size({ maxWidth: infinity, maxHeight: infinity })
 * ```
 */
export declare function size(options: ReactiveSizeOptions): SizeModifier
/**
 * Convenience function for setting width only
 * Supports infinity for fill-available behavior
 *
 * @example
 * ```typescript
 * .width('100%')
 * .width(280)
 * .width(infinity) // Fill available space
 * ```
 */
export declare function width(value: Dimension): SizeModifier
/**
 * Convenience function for setting height only
 * Supports infinity for fill-available behavior
 *
 * @example
 * ```typescript
 * .height('100vh')
 * .height(64)
 * .height(infinity) // Fill available space
 * ```
 */
export declare function height(value: Dimension): SizeModifier
/**
 * Convenience function for setting max-width only
 * Supports infinity to remove width constraints
 *
 * @example
 * ```typescript
 * .maxWidth(800)
 * .maxWidth('100%')
 * .maxWidth(infinity) // Remove width constraints
 * ```
 */
export declare function maxWidth(value: Dimension): SizeModifier
/**
 * Convenience function for setting min-width only
 *
 * @example
 * ```typescript
 * .minWidth(320)
 * .minWidth('50%')
 * ```
 */
export declare function minWidth(value: Dimension): SizeModifier
/**
 * Convenience function for setting max-height only
 * Supports infinity to remove height constraints
 *
 * @example
 * ```typescript
 * .maxHeight(600)
 * .maxHeight('80vh')
 * .maxHeight(infinity) // Remove height constraints
 * ```
 */
export declare function maxHeight(value: Dimension): SizeModifier
/**
 * Convenience function for setting min-height only
 *
 * @example
 * ```typescript
 * .minHeight(200)
 * .minHeight('30vh')
 * ```
 */
export declare function minHeight(value: Dimension): SizeModifier
//# sourceMappingURL=size.d.ts.map
