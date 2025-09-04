/**
 * Offset Modifier
 *
 * SwiftUI .offset(x, y) modifier for translating elements with reactive support.
 * Handles CSS transforms while preserving existing transformations.
 */

import type { DOMNode } from '@tachui/core/runtime/types'
import { BaseModifier } from '../basic/base'
import type { ModifierContext } from '@tachui/core/modifiers/types'
import { createEffect, isSignal, isComputed } from '@tachui/core/reactive'

export interface OffsetOptions {
  x: number
  y?: number
}

export class OffsetModifier extends BaseModifier<OffsetOptions> {
  readonly type = 'offset'
  readonly priority = 35 // High priority for transform operations

  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined {
    if (!context.element) return undefined

    const { x, y = 0 } = this.properties

    // Handle reactive values
    if (isSignal(x) || isComputed(x) || isSignal(y) || isComputed(y)) {
      createEffect(() => {
        const currentX = isSignal(x) || isComputed(x) ? x() : x
        const currentY = isSignal(y) || isComputed(y) ? y() : y

        this.applyOffset(context.element as HTMLElement, currentX, currentY)
      })
    } else {
      // Handle static values
      this.applyOffset(context.element as HTMLElement, x, y)
    }

    return undefined
  }

  private applyOffset(element: HTMLElement, x: number, y: number): void {
    const offsetX = this.toCSSValue(x)
    const offsetY = this.toCSSValue(y)
    const translateValue = `translate(${offsetX}, ${offsetY})`

    // Preserve existing transforms but replace any existing translate functions
    const existingTransform = element.style.transform || ''
    const existingTransforms = existingTransform
      .replace(/\s*translate(?!Z\(0\))[XYZ3d]*\([^)]*\)\s*/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    const newTransform = existingTransforms
      ? `${existingTransforms} ${translateValue}`
      : translateValue

    element.style.transform = newTransform
  }

  /**
   * Development mode validation
   */
  private validateOffset(x: any, y: any): void {
    if (
      typeof process !== 'undefined' &&
      process.env.NODE_ENV === 'development'
    ) {
      if (typeof x !== 'number' && !isSignal(x) && !isComputed(x)) {
        console.warn(
          `OffsetModifier: x value must be a number or reactive signal. Got: ${typeof x}`
        )
      }

      if (
        y !== undefined &&
        typeof y !== 'number' &&
        !isSignal(y) &&
        !isComputed(y)
      ) {
        console.warn(
          `OffsetModifier: y value must be a number or reactive signal. Got: ${typeof y}`
        )
      }

      // Performance warning for extreme values
      const checkValue = (val: any, _name: string) => {
        const actualValue =
          isSignal(val) || isComputed(val) ? val.peek?.() || val() : val
        if (typeof actualValue === 'number') {
          // Warn about very large values
          if (Math.abs(actualValue) > 1000) {
            console.warn(
              `OffsetModifier: Very large offset values may cause layout issues`
            )
          }

          // Performance tips for high precision decimals
          if (actualValue !== Math.round(actualValue * 100) / 100) {
            console.info(
              `OffsetModifier: Consider rounding offset values to 2 decimal places for better performance`
            )
          }
        }
      }

      checkValue(x, 'x')
      if (y !== undefined) {
        checkValue(y, 'y')
      }
    }
  }
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
export function offset(x: number, y?: number): OffsetModifier {
  const modifier = new OffsetModifier({ x, y: y ?? 0 })

  // Validate in development
  if (
    typeof process !== 'undefined' &&
    process.env.NODE_ENV === 'development'
  ) {
    modifier['validateOffset'](x, y)
  }

  return modifier
}
