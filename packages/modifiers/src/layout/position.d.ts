/**
 * Position Modifier
 *
 * CSS position property modifier with enhanced validation and utilities.
 */
import type { DOMNode } from '@tachui/core/runtime/types'
import { BaseModifier } from '../basic/base'
import type { ModifierContext } from '@tachui/core/modifiers/types'
export type PositionValue =
  | 'static'
  | 'relative'
  | 'absolute'
  | 'fixed'
  | 'sticky'
export interface PositionOptions {
  position: PositionValue
}
export declare class PositionModifier extends BaseModifier<PositionOptions> {
  readonly type = 'position'
  readonly priority = 50
  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined
  private applyPosition
  private applyPositionOptimizations
  private warnIfMissingPositionedParent
  private warnIfMissingStickyProperties
  private warnIfHasPositioningProperties
  /**
   * Development mode validation
   */
  private validatePosition
}
/**
 * Create a position modifier
 *
 * @param value - CSS position value
 *
 * @example
 * ```typescript
 * // Static positioning (default, removes positioning context)
 * position('static')
 *
 * // Relative positioning (creates positioning context)
 * position('relative')
 *
 * // Absolute positioning (positioned relative to nearest positioned parent)
 * position('absolute')
 *
 * // Fixed positioning (positioned relative to viewport)
 * position('fixed')
 *
 * // Sticky positioning (hybrid relative/fixed)
 * position('sticky')
 *
 * // With reactive value
 * const pos = signal('relative')
 * position(pos)
 * ```
 */
export declare function position(value: PositionValue): PositionModifier
//# sourceMappingURL=position.d.ts.map
