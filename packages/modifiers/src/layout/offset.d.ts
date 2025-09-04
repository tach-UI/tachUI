/**
 * Offset Modifier
 *
 * SwiftUI .offset(x, y) modifier for translating elements with reactive support.
 * Handles CSS transforms while preserving existing transformations.
 */
import type { DOMNode } from '@tachui/core/runtime/types'
import { BaseModifier } from '../basic/base'
import type { ModifierContext } from '@tachui/core/modifiers/types'
export interface OffsetOptions {
  x: number
  y?: number
}
export declare class OffsetModifier extends BaseModifier<OffsetOptions> {
  readonly type = 'offset'
  readonly priority = 35
  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined
  private applyOffset
  /**
   * Development mode validation
   */
  private validateOffset
}
/**
 * Create an offset modifier
 *
 * @param x - Horizontal offset in pixels
 * @param y - Vertical offset in pixels (optional, defaults to 0)
 *
 * @example
 * ```typescript
 * // Move element 10px right and 5px down
 * offset(10, 5)
 *
 * // Move element only horizontally
 * offset(20)
 *
 * // With reactive values
 * const xOffset = signal(0)
 * offset(xOffset, -10)
 * ```
 */
export declare function offset(x: number, y?: number): OffsetModifier
//# sourceMappingURL=offset.d.ts.map
