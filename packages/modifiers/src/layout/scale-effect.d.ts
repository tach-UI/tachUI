/**
 * Scale Effect Modifier
 *
 * SwiftUI .scaleEffect() modifier for scaling elements with anchor support.
 * Handles CSS transforms while preserving existing transformations.
 */
import type { DOMNode } from '@tachui/core/runtime/types'
import { BaseModifier } from '../basic/base'
import type { ModifierContext } from '@tachui/core/modifiers/types'
export type ScaleAnchor =
  | 'center'
  | 'top'
  | 'topLeading'
  | 'topTrailing'
  | 'bottom'
  | 'bottomLeading'
  | 'bottomTrailing'
  | 'leading'
  | 'trailing'
export interface ScaleEffectOptions {
  x: number
  y?: number
  anchor?: ScaleAnchor
}
export declare class ScaleEffectModifier extends BaseModifier<ScaleEffectOptions> {
  readonly type = 'scaleEffect'
  readonly priority = 35
  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined
  private applyScale
  private getTransformOrigin
  /**
   * Development mode validation
   */
  private validateScale
}
/**
 * Create a scale effect modifier
 *
 * @param x - Horizontal scale factor (1.0 = normal size)
 * @param y - Vertical scale factor (optional, defaults to x for uniform scaling)
 * @param anchor - Transform origin anchor point (default: 'center')
 *
 * @example
 * ```typescript
 * // Scale to 150% uniformly
 * scaleEffect(1.5)
 *
 * // Scale with different x/y values
 * scaleEffect(2.0, 0.5)
 *
 * // Scale with custom anchor point
 * scaleEffect(1.2, 1.2, 'topLeading')
 *
 * // With reactive values
 * const scale = signal(1.0)
 * scaleEffect(scale, undefined, 'center')
 * ```
 */
export declare function scaleEffect(
  x: number,
  y?: number,
  anchor?: ScaleAnchor
): ScaleEffectModifier
//# sourceMappingURL=scale-effect.d.ts.map
