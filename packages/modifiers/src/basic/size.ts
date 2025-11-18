/**
 * Size Modifier - width, height, min/max dimensions
 *
 * Provides a unified interface for setting element dimensions
 * with support for SwiftUI-style infinity constants.
 */

import type { DOMNode } from '@tachui/types/runtime'
import type { Dimension } from '@tachui/core/constants/layout'
import {
  dimensionToCSS,
  isInfinity,
  shouldExpandForInfinity,
} from '@tachui/core/constants/layout'
import { BaseModifier } from './base'
import type {
  ModifierContext,
  ReactiveModifierProps,
} from '@tachui/types/modifiers'

export interface SizeOptions {
  width?: Dimension
  height?: Dimension
  minWidth?: Dimension
  maxWidth?: Dimension
  minHeight?: Dimension
  maxHeight?: Dimension
}

export type ReactiveSizeOptions = ReactiveModifierProps<SizeOptions>

export class SizeModifier extends BaseModifier<SizeOptions> {
  readonly type = 'size'
  readonly priority = 80 // Priority 80 for layout

  constructor(options: ReactiveSizeOptions) {
    // Preserve reactive values; BaseModifier.applyStyles will create effects
    super(options as unknown as SizeOptions)
  }

  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined {
    if (!context.element) return

    const styles = this.computeSizeStyles(this.properties)
    this.applyStyles(context.element, styles)

    return undefined
  }

  private computeSizeStyles(props: SizeOptions) {
    const styles: Record<string, any> = {}

    // Check for infinity constraints and apply appropriate flex/size styles
    const infinityResult = shouldExpandForInfinity(props)
    Object.assign(styles, infinityResult.cssProps)

    // Convert dimensions to CSS, handling infinity appropriately
    if (props.width !== undefined) {
      const cssValue = dimensionToCSS(props.width)
      if (cssValue !== undefined && !isInfinity(props.width)) {
        styles.width = cssValue
      }
    }

    if (props.height !== undefined) {
      const cssValue = dimensionToCSS(props.height)
      if (cssValue !== undefined && !isInfinity(props.height)) {
        styles.height = cssValue
      }
    }

    if (props.minWidth !== undefined) {
      const cssValue = dimensionToCSS(props.minWidth)
      if (cssValue !== undefined) {
        styles.minWidth = cssValue
      }
    }

    if (props.maxWidth !== undefined && !isInfinity(props.maxWidth)) {
      const cssValue = dimensionToCSS(props.maxWidth)
      if (cssValue !== undefined) {
        styles.maxWidth = cssValue
      }
    } else if (isInfinity(props.maxWidth)) {
      // Remove maxWidth constraint for infinity
      styles.maxWidth = 'none'
    }

    if (props.minHeight !== undefined) {
      const cssValue = dimensionToCSS(props.minHeight)
      if (cssValue !== undefined) {
        styles.minHeight = cssValue
      }
    }

    if (props.maxHeight !== undefined && !isInfinity(props.maxHeight)) {
      const cssValue = dimensionToCSS(props.maxHeight)
      if (cssValue !== undefined) {
        styles.maxHeight = cssValue
      }
    } else if (isInfinity(props.maxHeight)) {
      // Remove maxHeight constraint for infinity
      styles.maxHeight = 'none'
    }

    return styles
  }
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
export function size(options: ReactiveSizeOptions): SizeModifier {
  return new SizeModifier(options)
}

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
export function width(value: Dimension): SizeModifier {
  return new SizeModifier({ width: value })
}

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
export function height(value: Dimension): SizeModifier {
  return new SizeModifier({ height: value })
}

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
export function maxWidth(value: Dimension): SizeModifier {
  return new SizeModifier({ maxWidth: value })
}

/**
 * Convenience function for setting min-width only
 *
 * @example
 * ```typescript
 * .minWidth(320)
 * .minWidth('50%')
 * ```
 */
export function minWidth(value: Dimension): SizeModifier {
  return new SizeModifier({ minWidth: value })
}

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
export function maxHeight(value: Dimension): SizeModifier {
  return new SizeModifier({ maxHeight: value })
}

/**
 * Convenience function for setting min-height only
 *
 * @example
 * ```typescript
 * .minHeight(200)
 * .minHeight('30vh')
 * ```
 */
export function minHeight(value: Dimension): SizeModifier {
  return new SizeModifier({ minHeight: value })
}
