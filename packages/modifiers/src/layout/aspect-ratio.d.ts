/**
 * Aspect Ratio Modifier
 *
 * SwiftUI .aspectRatio() modifier for controlling element aspect ratios.
 * Supports both explicit ratios and content mode (fit/fill).
 */
import type { DOMNode } from '@tachui/core/runtime/types'
import { BaseModifier } from '../basic/base'
import type { ModifierContext } from '@tachui/core/modifiers/types'
export type ContentMode = 'fit' | 'fill'
export interface AspectRatioOptions {
  ratio?: number
  contentMode: ContentMode
}
export declare class AspectRatioModifier extends BaseModifier<AspectRatioOptions> {
  readonly type = 'aspectRatio'
  readonly priority = 20
  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined
  private applyAspectRatio
  private applyContentMode
  private isMediaElement
  /**
   * Development mode validation
   */
  private validateAspectRatio
  /**
   * Get common aspect ratios
   */
  static readonly COMMON_RATIOS: {
    readonly square: 1
    readonly portrait: number
    readonly landscape: number
    readonly widescreen: number
    readonly ultrawide: number
    readonly golden: 1.618
    readonly photo: number
  }
}
/**
 * Create an aspect ratio modifier
 *
 * @param ratio - Aspect ratio (width/height). If undefined, maintains natural aspect ratio
 * @param contentMode - How content should fit within the aspect ratio ('fit' or 'fill')
 *
 * @example
 * ```typescript
 * // Square aspect ratio with fit content mode
 * aspectRatio(1, 'fit')
 *
 * // 16:9 widescreen with fill
 * aspectRatio(16/9, 'fill')
 *
 * // Use common ratio
 * aspectRatio(AspectRatioModifier.COMMON_RATIOS.landscape, 'fit')
 *
 * // Content mode only (maintain natural ratio)
 * aspectRatio(undefined, 'fill')
 *
 * // With reactive value
 * const ratio = signal(1.5)
 * aspectRatio(ratio, 'fit')
 * ```
 */
export declare function aspectRatio(
  ratio?: number,
  contentMode?: ContentMode
): AspectRatioModifier
//# sourceMappingURL=aspect-ratio.d.ts.map
