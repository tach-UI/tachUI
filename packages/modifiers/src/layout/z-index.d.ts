/**
 * Z-Index Modifier
 *
 * CSS z-index property modifier with enhanced validation and stacking context utilities.
 */
import type { DOMNode } from '@tachui/core/runtime/types'
import { BaseModifier } from '../basic/base'
import type { ModifierContext } from '@tachui/core/modifiers/types'
export interface ZIndexOptions {
  zIndex: number
}
export declare class ZIndexModifier extends BaseModifier<ZIndexOptions> {
  readonly type = 'zIndex'
  readonly priority = 45
  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined
  private applyZIndex
  private ensureStackingContext
  private isFlexItem
  private isGridItem
  private provideStackingInsights
  private checkStackingContext
  /**
   * Development mode validation
   */
  private validateZIndex
  /**
   * Common z-index values for semantic layering
   */
  static readonly COMMON_LAYERS: {
    readonly background: -1
    readonly base: 0
    readonly content: 1
    readonly navigation: 100
    readonly dropdown: 200
    readonly overlay: 300
    readonly modal: 400
    readonly tooltip: 500
    readonly toast: 600
    readonly debug: 9999
  }
}
/**
 * Create a z-index modifier
 *
 * @param value - Z-index value (integer)
 *
 * @example
 * ```typescript
 * // Basic z-index
 * zIndex(10)
 *
 * // Negative z-index (behind normal content)
 * zIndex(-1)
 *
 * // Use semantic layers
 * zIndex(ZIndexModifier.COMMON_LAYERS.modal)
 * zIndex(ZIndexModifier.COMMON_LAYERS.tooltip)
 *
 * // With reactive value
 * const layer = signal(100)
 * zIndex(layer)
 * ```
 */
export declare function zIndex(value: number): ZIndexModifier
//# sourceMappingURL=z-index.d.ts.map
