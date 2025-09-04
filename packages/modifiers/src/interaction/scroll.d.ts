/**
 * Scroll Modifiers - Modern scroll behaviors
 *
 * Provides scroll snap, smooth scrolling, overscroll control,
 * scroll margin, and scroll padding capabilities.
 */
import type { DOMNode } from '@tachui/core/runtime/types'
import { BaseModifier } from '../basic/base'
import type {
  ModifierContext,
  ReactiveModifierProps,
} from '@tachui/core/modifiers/types'
export interface ScrollConfig {
  behavior?: 'auto' | 'smooth'
  margin?:
    | number
    | string
    | {
        top?: number | string
        right?: number | string
        bottom?: number | string
        left?: number | string
      }
  padding?:
    | number
    | string
    | {
        top?: number | string
        right?: number | string
        bottom?: number | string
        left?: number | string
      }
  snap?: {
    type?:
      | 'none'
      | 'x mandatory'
      | 'y mandatory'
      | 'x proximity'
      | 'y proximity'
      | 'both mandatory'
      | 'both proximity'
    align?: 'start' | 'end' | 'center'
    stop?: 'normal' | 'always'
  }
}
export type OverscrollBehaviorValue = 'auto' | 'contain' | 'none'
export interface ScrollOptions {
  scroll?: ScrollConfig
  scrollBehavior?: 'auto' | 'smooth'
  overscrollBehavior?: OverscrollBehaviorValue
  overscrollBehaviorX?: OverscrollBehaviorValue
  overscrollBehaviorY?: OverscrollBehaviorValue
}
export type ReactiveScrollOptions = ReactiveModifierProps<ScrollOptions>
export declare class ScrollModifier extends BaseModifier<ScrollOptions> {
  readonly type = 'scroll'
  readonly priority = 20
  constructor(options: ReactiveScrollOptions)
  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined
  private computeScrollStyles
  private generateScrollCSS
  private generateScrollMarginCSS
  private generateScrollPaddingCSS
  private generateScrollSnapCSS
  private formatSpacing
}
/**
 * Enhanced scroll modifier with scroll snap and smooth scrolling
 *
 * @example
 * ```typescript
 * .scroll({
 *   behavior: 'smooth',
 *   margin: { top: 20, bottom: 20 },
 *   snap: { type: 'y mandatory', align: 'start' }
 * })
 * ```
 */
export declare function scroll(config: ScrollConfig): ScrollModifier
/**
 * Scroll behavior modifier
 *
 * @example
 * ```typescript
 * .scrollBehavior('smooth')  // Smooth scrolling
 * .scrollBehavior('auto')    // Default browser scrolling
 * ```
 */
export declare function scrollBehavior(value: 'auto' | 'smooth'): ScrollModifier
/**
 * Overscroll behavior modifier - controls bounce/rubber band effects
 *
 * @example
 * ```typescript
 * .overscrollBehavior('contain')  // Prevent scroll chaining
 * .overscrollBehavior('none')     // Disable overscroll effects
 * .overscrollBehavior('auto')     // Default behavior
 * ```
 */
export declare function overscrollBehavior(
  value: OverscrollBehaviorValue
): ScrollModifier
/**
 * Overscroll behavior X modifier - horizontal overscroll control
 *
 * @example
 * ```typescript
 * .overscrollBehaviorX('contain')  // Prevent horizontal overscroll
 * ```
 */
export declare function overscrollBehaviorX(
  value: OverscrollBehaviorValue
): ScrollModifier
/**
 * Overscroll behavior Y modifier - vertical overscroll control
 *
 * @example
 * ```typescript
 * .overscrollBehaviorY('none')  // Disable vertical rubber band effect
 * ```
 */
export declare function overscrollBehaviorY(
  value: OverscrollBehaviorValue
): ScrollModifier
/**
 * Scroll margin shorthand - sets spacing around scroll targets
 *
 * @example
 * ```typescript
 * .scrollMargin(20)  // All sides
 * .scrollMargin({ top: 80, bottom: 20 })  // Navigation offset
 * ```
 */
export declare function scrollMargin(
  margin:
    | number
    | string
    | {
        top?: number | string
        right?: number | string
        bottom?: number | string
        left?: number | string
      }
): ScrollModifier
/**
 * Scroll padding shorthand - sets inner spacing for scroll containers
 *
 * @example
 * ```typescript
 * .scrollPadding(16)  // All sides
 * .scrollPadding({ top: 60, bottom: 20 })  // Header/footer padding
 * ```
 */
export declare function scrollPadding(
  padding:
    | number
    | string
    | {
        top?: number | string
        right?: number | string
        bottom?: number | string
        left?: number | string
      }
): ScrollModifier
/**
 * Scroll snap shorthand - quick scroll snap configuration
 *
 * @example
 * ```typescript
 * .scrollSnap('y mandatory', 'start')  // Vertical mandatory snapping to start
 * .scrollSnap('x proximity', 'center') // Horizontal proximity snapping to center
 * ```
 */
export declare function scrollSnap(
  type:
    | 'none'
    | 'x mandatory'
    | 'y mandatory'
    | 'x proximity'
    | 'y proximity'
    | 'both mandatory'
    | 'both proximity',
  align?: 'start' | 'end' | 'center',
  stop?: 'normal' | 'always'
): ScrollModifier
//# sourceMappingURL=scroll.d.ts.map
