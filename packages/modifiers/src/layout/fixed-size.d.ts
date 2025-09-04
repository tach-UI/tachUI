/**
 * Fixed Size Modifier
 *
 * SwiftUI .fixedSize() modifier for preventing elements from growing
 * beyond their intrinsic content size in specified dimensions.
 */
import type { DOMNode } from '@tachui/core/runtime/types'
import { BaseModifier } from '../basic/base'
import type { ModifierContext } from '@tachui/core/modifiers/types'
export interface FixedSizeOptions {
  horizontal: boolean
  vertical: boolean
}
export declare class FixedSizeModifier extends BaseModifier<FixedSizeOptions> {
  readonly type = 'fixedSize'
  readonly priority = 25
  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined
  private applyFixedSize
  private isTextElement
  private isFlexItem
  /**
   * Development mode validation
   */
  private validateFixedSize
}
/**
 * Create a fixed size modifier
 *
 * @param horizontal - Fix horizontal size to content (default: true)
 * @param vertical - Fix vertical size to content (default: true)
 *
 * @example
 * ```typescript
 * // Fix both dimensions (equivalent to intrinsic sizing)
 * fixedSize()
 * fixedSize(true, true)
 *
 * // Fix only horizontal (prevent text wrapping)
 * fixedSize(true, false)
 *
 * // Fix only vertical (prevent height expansion)
 * fixedSize(false, true)
 *
 * // No fixed sizing (no-op, but validates parameters)
 * fixedSize(false, false)
 * ```
 */
export declare function fixedSize(
  horizontal?: boolean,
  vertical?: boolean
): FixedSizeModifier
//# sourceMappingURL=fixed-size.d.ts.map
