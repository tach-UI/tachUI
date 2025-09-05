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
  // Scroll behavior
  behavior?: 'auto' | 'smooth'

  // Scroll margin (spacing around scroll targets)
  margin?:
    | number
    | string
    | {
        top?: number | string
        right?: number | string
        bottom?: number | string
        left?: number | string
      }

  // Scroll padding (inner spacing for scroll containers)
  padding?:
    | number
    | string
    | {
        top?: number | string
        right?: number | string
        bottom?: number | string
        left?: number | string
      }

  // Scroll snap behavior
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

export class ScrollModifier extends BaseModifier<ScrollOptions> {
  readonly type = 'scroll'
  readonly priority = 20

  constructor(options: ReactiveScrollOptions) {
    const resolvedOptions: ScrollOptions = {}
    for (const [key, value] of Object.entries(options)) {
      if (typeof value === 'function' && 'peek' in value) {
        ;(resolvedOptions as any)[key] = (value as any).peek()
      } else {
        ;(resolvedOptions as any)[key] = value
      }
    }
    super(resolvedOptions)
  }

  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined {
    if (!context.element) return

    const styles = this.computeScrollStyles(this.properties)
    this.applyStyles(context.element, styles)

    return undefined
  }

  private computeScrollStyles(props: ScrollOptions) {
    const styles: Record<string, string> = {}

    // Handle scroll configuration
    if (props.scroll) {
      Object.assign(styles, this.generateScrollCSS(props.scroll))
    }

    // Individual scroll properties
    if (props.scrollBehavior) {
      styles.scrollBehavior = props.scrollBehavior
    }

    if (props.overscrollBehavior) {
      styles.overscrollBehavior = props.overscrollBehavior
    }

    if (props.overscrollBehaviorX) {
      styles.overscrollBehaviorX = props.overscrollBehaviorX
    }

    if (props.overscrollBehaviorY) {
      styles.overscrollBehaviorY = props.overscrollBehaviorY
    }

    return styles
  }

  private generateScrollCSS(config: ScrollConfig): Record<string, string> {
    const styles: Record<string, string> = {}

    // Scroll behavior
    if (config.behavior) {
      styles.scrollBehavior = config.behavior
    }

    // Scroll margin
    if (config.margin) {
      Object.assign(styles, this.generateScrollMarginCSS(config.margin))
    }

    // Scroll padding
    if (config.padding) {
      Object.assign(styles, this.generateScrollPaddingCSS(config.padding))
    }

    // Scroll snap
    if (config.snap) {
      Object.assign(styles, this.generateScrollSnapCSS(config.snap))
    }

    return styles
  }

  private generateScrollMarginCSS(
    margin: number | string | Record<string, number | string>
  ): Record<string, string> {
    if (typeof margin === 'number' || typeof margin === 'string') {
      return { scrollMargin: this.formatSpacing(margin) }
    }

    const styles: Record<string, string> = {}
    if (margin.top !== undefined)
      styles.scrollMarginTop = this.formatSpacing(margin.top)
    if (margin.right !== undefined)
      styles.scrollMarginRight = this.formatSpacing(margin.right)
    if (margin.bottom !== undefined)
      styles.scrollMarginBottom = this.formatSpacing(margin.bottom)
    if (margin.left !== undefined)
      styles.scrollMarginLeft = this.formatSpacing(margin.left)

    return styles
  }

  private generateScrollPaddingCSS(
    padding: number | string | Record<string, number | string>
  ): Record<string, string> {
    if (typeof padding === 'number' || typeof padding === 'string') {
      return { scrollPadding: this.formatSpacing(padding) }
    }

    const styles: Record<string, string> = {}
    if (padding.top !== undefined)
      styles.scrollPaddingTop = this.formatSpacing(padding.top)
    if (padding.right !== undefined)
      styles.scrollPaddingRight = this.formatSpacing(padding.right)
    if (padding.bottom !== undefined)
      styles.scrollPaddingBottom = this.formatSpacing(padding.bottom)
    if (padding.left !== undefined)
      styles.scrollPaddingLeft = this.formatSpacing(padding.left)

    return styles
  }

  private generateScrollSnapCSS(
    snap: ScrollConfig['snap']
  ): Record<string, string> {
    const styles: Record<string, string> = {}

    if (snap?.type) {
      styles.scrollSnapType = snap.type
    }

    if (snap?.align) {
      styles.scrollSnapAlign = snap.align
    }

    if (snap?.stop) {
      styles.scrollSnapStop = snap.stop
    }

    return styles
  }

  private formatSpacing(value: number | string): string {
    if (typeof value === 'number') {
      return `${value}px`
    }
    return value
  }
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
export function scroll(config: ScrollConfig): ScrollModifier {
  return new ScrollModifier({ scroll: config })
}

/**
 * Scroll behavior modifier
 *
 * @example
 * ```typescript
 * .scrollBehavior('smooth')  // Smooth scrolling
 * .scrollBehavior('auto')    // Default browser scrolling
 * ```
 */
export function scrollBehavior(value: 'auto' | 'smooth'): ScrollModifier {
  return new ScrollModifier({ scrollBehavior: value })
}

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
export function overscrollBehavior(
  value: OverscrollBehaviorValue
): ScrollModifier {
  return new ScrollModifier({ overscrollBehavior: value })
}

/**
 * Overscroll behavior X modifier - horizontal overscroll control
 *
 * @example
 * ```typescript
 * .overscrollBehaviorX('contain')  // Prevent horizontal overscroll
 * ```
 */
export function overscrollBehaviorX(
  value: OverscrollBehaviorValue
): ScrollModifier {
  return new ScrollModifier({ overscrollBehaviorX: value })
}

/**
 * Overscroll behavior Y modifier - vertical overscroll control
 *
 * @example
 * ```typescript
 * .overscrollBehaviorY('none')  // Disable vertical rubber band effect
 * ```
 */
export function overscrollBehaviorY(
  value: OverscrollBehaviorValue
): ScrollModifier {
  return new ScrollModifier({ overscrollBehaviorY: value })
}

/**
 * Scroll margin shorthand - sets spacing around scroll targets
 *
 * @example
 * ```typescript
 * .scrollMargin(20)  // All sides
 * .scrollMargin({ top: 80, bottom: 20 })  // Navigation offset
 * ```
 */
export function scrollMargin(
  margin:
    | number
    | string
    | {
        top?: number | string
        right?: number | string
        bottom?: number | string
        left?: number | string
      }
): ScrollModifier {
  return new ScrollModifier({ scroll: { margin } })
}

/**
 * Scroll padding shorthand - sets inner spacing for scroll containers
 *
 * @example
 * ```typescript
 * .scrollPadding(16)  // All sides
 * .scrollPadding({ top: 60, bottom: 20 })  // Header/footer padding
 * ```
 */
export function scrollPadding(
  padding:
    | number
    | string
    | {
        top?: number | string
        right?: number | string
        bottom?: number | string
        left?: number | string
      }
): ScrollModifier {
  return new ScrollModifier({ scroll: { padding } })
}

/**
 * Scroll snap shorthand - quick scroll snap configuration
 *
 * @example
 * ```typescript
 * .scrollSnap('y mandatory', 'start')  // Vertical mandatory snapping to start
 * .scrollSnap('x proximity', 'center') // Horizontal proximity snapping to center
 * ```
 */
export function scrollSnap(
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
): ScrollModifier {
  return new ScrollModifier({
    scroll: {
      snap: { type, align, stop },
    },
  })
}
