/**
 * Scale Effect Modifier
 *
 * SwiftUI .scaleEffect() modifier for scaling elements with anchor support.
 * Handles CSS transforms while preserving existing transformations.
 */

import type { DOMNode } from '@tachui/types/runtime'
import { BaseModifier } from '../basic/base'
import type { ModifierContext } from '@tachui/types/modifiers'
import { createEffect, isSignal, isComputed } from '@tachui/core/reactive'
import type { Signal } from '@tachui/types/reactive'

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
  x: number | Signal<number>
  y?: number | Signal<number>
  anchor?: ScaleAnchor
}

export class ScaleEffectModifier extends BaseModifier<ScaleEffectOptions> {
  readonly type = 'scaleEffect'
  readonly priority = 35 // High priority for transform operations

  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined {
    if (!context.element) return undefined

    const { x, y, anchor = 'center' } = this.properties
    const scaleY = y ?? x // Default to uniform scaling if y not provided

    // Validate in development
    if (
      typeof process !== 'undefined' &&
      process.env.NODE_ENV === 'development'
    ) {
      this.validateScale(x, scaleY, anchor)
    }

    // Handle reactive values
    if (
      isSignal(x) ||
      isComputed(x) ||
      isSignal(scaleY) ||
      isComputed(scaleY)
    ) {
      createEffect(() => {
        const currentX = isSignal(x) || isComputed(x) ? x() : x
        const currentY =
          isSignal(scaleY) || isComputed(scaleY) ? scaleY() : scaleY

        this.applyScale(
          context.element as HTMLElement,
          currentX,
          currentY,
          anchor
        )
      })
    } else {
      // Handle static values
      this.applyScale(context.element as HTMLElement, x, scaleY, anchor)
    }

    return undefined
  }

  private applyScale(
    element: HTMLElement,
    x: number,
    y: number,
    anchor: ScaleAnchor
  ): void {
    const scaleValue = `scale(${x}, ${y})`

    // Set transform-origin based on anchor
    element.style.transformOrigin = this.getTransformOrigin(anchor)

    // Preserve existing transforms but replace any existing scale functions
    const existingTransform = element.style.transform || ''
    const existingTransforms = existingTransform
      .replace(/\s*scale[XYZ3d]*\([^)]*\)\s*/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    const newTransform = existingTransforms
      ? `${existingTransforms} ${scaleValue}`.trim()
      : scaleValue

    element.style.transform = newTransform
  }

  private getTransformOrigin(anchor: ScaleAnchor): string {
    const anchorMap: Record<ScaleAnchor, string> = {
      center: 'center center',
      top: 'center top',
      topLeading: 'left top',
      topTrailing: 'right top',
      bottom: 'center bottom',
      bottomLeading: 'left bottom',
      bottomTrailing: 'right bottom',
      leading: 'left center',
      trailing: 'right center',
    }

    return anchorMap[anchor]
  }

  /**
   * Development mode validation
   */
  private validateScale(x: any, y: any, anchor: ScaleAnchor): void {
    if (
      typeof process !== 'undefined' &&
      process.env.NODE_ENV === 'development'
    ) {
      // Validate scale values
      if (typeof x !== 'number' && !isSignal(x) && !isComputed(x)) {
        console.warn(
          `ScaleEffectModifier: x value must be a number or reactive signal. Got: ${typeof x}`
        )
      }

      if (typeof y !== 'number' && !isSignal(y) && !isComputed(y)) {
        console.warn(
          `ScaleEffectModifier: y value must be a number or reactive signal. Got: ${typeof y}`
        )
      }

      // Validate anchor
      const validAnchors: ScaleAnchor[] = [
        'center',
        'top',
        'topLeading',
        'topTrailing',
        'bottom',
        'bottomLeading',
        'bottomTrailing',
        'leading',
        'trailing',
      ]
      if (!validAnchors.includes(anchor)) {
        console.warn(
          `ScaleEffectModifier: Invalid anchor "${anchor}". Valid anchors:`,
          validAnchors
        )
      }

      // Performance and visual warnings
      const checkValue = (val: any, name: string) => {
        const actualValue =
          isSignal(val) || isComputed(val) ? val.peek?.() || val() : val
        if (typeof actualValue === 'number') {
          if (actualValue <= 0) {
            console.warn(
              `ScaleEffectModifier: ${name} scale value ${actualValue} will make element invisible`
            )
          }
          if (actualValue > 10) {
            console.warn(
              `ScaleEffectModifier: Large ${name} scale (${actualValue}) may impact performance and cause visual issues`
            )
          }
          if (actualValue !== Math.round(actualValue * 100) / 100) {
            console.info(
              `ScaleEffectModifier: Consider rounding ${name} scale to 2 decimal places for better performance`
            )
          }
        }
      }

      checkValue(x, 'x')
      checkValue(y, 'y')
    }
  }
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
export function scaleEffect(
  x: number | Signal<number>,
  y?: number | Signal<number>,
  anchor: ScaleAnchor = 'center'
): ScaleEffectModifier {
  return new ScaleEffectModifier({ x, y, anchor })
}
