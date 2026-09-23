/**
 * Size Modifier - width, height, min/max dimensions
 *
 * Provides a unified interface for setting element dimensions
 * with support for SwiftUI-style infinity constants.
 */

import { createEffect, isComputed, isSignal } from '@tachui/core/reactive'
import type { DOMNode } from '@tachui/types/runtime'
import type { Dimension } from '@tachui/core/constants/layout'
import type { Signal } from '@tachui/types/reactive'
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

const SIZE_KEYS = [
  'width',
  'height',
  'minWidth',
  'maxWidth',
  'minHeight',
  'maxHeight',
] as const satisfies readonly (keyof SizeOptions)[]

const isReactive = (value: unknown): value is () => Dimension =>
  isSignal(value) || isComputed(value)

export class SizeModifier extends BaseModifier<SizeOptions> {
  readonly type = 'size'
  readonly priority = 80 // Priority 80 for layout

  constructor(options: ReactiveSizeOptions) {
    // Preserve reactive values; BaseModifier.applyStyles will create effects.
    // Copied, so changing the object after the call does not change this.
    super({ ...options } as unknown as SizeOptions)
  }

  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined {
    if (!context.element) return
    const element = context.element
    const props = this.properties

    if (!SIZE_KEYS.some(key => isReactive(props[key]))) {
      this.applyStyles(element, this.computeSizeStyles(props))
      return undefined
    }

    // Resolve every signal before computing styles, so a signal that becomes
    // `infinity` gets the flex expansion a static `infinity` does rather than
    // having the sentinel written as a CSS value. Each run also clears what
    // the previous values set and these do not, such as that expansion once
    // the signal leaves `infinity`.
    let applied: string[] = []
    createEffect(() => {
      const resolved: SizeOptions = {}
      for (const key of SIZE_KEYS) {
        const value: unknown = props[key]
        // A signal yielding `null` is unset, as `undefined` is, rather than a
        // value to write.
        resolved[key] = isReactive(value)
          ? (value() ?? undefined)
          : (value as Dimension)
      }

      const styles = this.computeSizeStyles(resolved)
      const cleared = applied.filter(key => !(key in styles))
      if (cleared.length > 0) {
        this.applyStyles(
          element,
          Object.fromEntries(cleared.map(key => [key, '']))
        )
      }
      this.applyStyles(element, styles)
      applied = Object.keys(styles)
    })

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
export function width(value: Dimension | Signal<Dimension>): SizeModifier {
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
export function height(value: Dimension | Signal<Dimension>): SizeModifier {
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
export function maxWidth(value: Dimension | Signal<Dimension>): SizeModifier {
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
export function minWidth(value: Dimension | Signal<Dimension>): SizeModifier {
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
export function maxHeight(value: Dimension | Signal<Dimension>): SizeModifier {
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
export function minHeight(value: Dimension | Signal<Dimension>): SizeModifier {
  return new SizeModifier({ minHeight: value })
}
