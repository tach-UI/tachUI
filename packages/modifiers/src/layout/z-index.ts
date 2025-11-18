/**
 * Z-Index Modifier
 *
 * CSS z-index property modifier with enhanced validation and stacking context utilities.
 */

import type { DOMNode } from '@tachui/types/runtime'
import { BaseModifier } from '../basic/base'
import type { ModifierContext } from '@tachui/types/modifiers'
import { createEffect, isSignal, isComputed } from '@tachui/core/reactive'

export interface ZIndexOptions {
  zIndex: number
}

export class ZIndexModifier extends BaseModifier<ZIndexOptions> {
  readonly type = 'zIndex'
  readonly priority = 45 // High priority for layering

  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined {
    if (!context.element) return undefined

    const { zIndex } = this.properties

    // Validate in development
    if (
      typeof process !== 'undefined' &&
      process.env.NODE_ENV === 'development'
    ) {
      this.validateZIndex(zIndex)
    }

    // Handle reactive z-index
    if (isSignal(zIndex) || isComputed(zIndex)) {
      createEffect(() => {
        const currentZIndex = zIndex()
        this.applyZIndex(context.element as HTMLElement, currentZIndex)
      })
    } else {
      // Handle static z-index
      this.applyZIndex(context.element as HTMLElement, zIndex)
    }

    return undefined
  }

  private applyZIndex(element: HTMLElement, zIndex: number): void {
    element.style.zIndex = String(zIndex)

    // Ensure element can participate in z-index stacking
    this.ensureStackingContext(element, zIndex)
  }

  private ensureStackingContext(element: HTMLElement, zIndex: number): void {
    const computedStyle = getComputedStyle(element)
    const position = computedStyle.position

    // z-index only works on positioned elements, flex items, and grid items
    const isPositioned = position !== 'static'
    const isFlexItem = this.isFlexItem(element)
    const isGridItem = this.isGridItem(element)

    if (!isPositioned && !isFlexItem && !isGridItem) {
      // Make element positioned so z-index works
      element.style.position = 'relative'

      if (
        typeof process !== 'undefined' &&
        process.env.NODE_ENV === 'development'
      ) {
        console.info(
          `ZIndexModifier: Set position: relative on element to enable z-index stacking`
        )
      }
    }

    // Development mode insights
    if (
      typeof process !== 'undefined' &&
      process.env.NODE_ENV === 'development'
    ) {
      this.provideStackingInsights(element, zIndex)
    }
  }

  private isFlexItem(element: HTMLElement): boolean {
    const parent = element.parentElement
    if (!parent) return false

    const parentDisplay = getComputedStyle(parent).display
    return parentDisplay === 'flex' || parentDisplay === 'inline-flex'
  }

  private isGridItem(element: HTMLElement): boolean {
    const parent = element.parentElement
    if (!parent) return false

    const parentDisplay = getComputedStyle(parent).display
    return parentDisplay === 'grid' || parentDisplay === 'inline-grid'
  }

  private provideStackingInsights(element: HTMLElement, zIndex: number): void {
    // Check for common z-index ranges and provide guidance
    if (zIndex < 0) {
      console.info(
        'ZIndexModifier: Negative z-index will layer behind the normal stacking order'
      )
    } else if (zIndex > 1000) {
      console.warn(
        `ZIndexModifier: Very high z-index (${zIndex}) may cause stacking conflicts. Consider using semantic ranges.`
      )
    }

    // Check for potential stacking context issues
    this.checkStackingContext(element)
  }

  private checkStackingContext(element: HTMLElement): void {
    const style = getComputedStyle(element)

    const stackingContextProperties = [
      { prop: 'opacity', value: style.opacity, creates: style.opacity !== '1' },
      {
        prop: 'transform',
        value: style.transform,
        creates: style.transform !== 'none',
      },
      { prop: 'filter', value: style.filter, creates: style.filter !== 'none' },
      {
        prop: 'isolation',
        value: style.isolation,
        creates: style.isolation === 'isolate',
      },
      {
        prop: 'mix-blend-mode',
        value: style.mixBlendMode,
        creates: style.mixBlendMode !== 'normal',
      },
    ]

    const creatingContexts = stackingContextProperties.filter(entry => entry.creates)

    if (creatingContexts.length > 0) {
      console.info(
        'ZIndexModifier: Element creates new stacking context due to:',
        creatingContexts.map(entry => `${entry.prop}: ${entry.value}`).join(', ')
      )
    }
  }

  /**
   * Development mode validation
   */
  private validateZIndex(zIndex: any): void {
    if (
      typeof process !== 'undefined' &&
      process.env.NODE_ENV === 'development'
    ) {
      const isReactive = isSignal(zIndex) || isComputed(zIndex)

      if (!isReactive && typeof zIndex !== 'number') {
        console.warn(
          `ZIndexModifier: zIndex must be a number or reactive signal. Got: ${typeof zIndex}`
        )
        return
      }

      const actualZIndex = isReactive ? zIndex.peek?.() || zIndex() : zIndex

      if (typeof actualZIndex === 'number') {
        if (!Number.isInteger(actualZIndex)) {
          console.warn(
            `ZIndexModifier: z-index should be an integer. Got: ${actualZIndex}`
          )
        }

        if (
          actualZIndex > Number.MAX_SAFE_INTEGER ||
          actualZIndex < Number.MIN_SAFE_INTEGER
        ) {
          console.warn(
            `ZIndexModifier: z-index value ${actualZIndex} is outside safe integer range`
          )
        }
      }
    }
  }

  /**
   * Common z-index values for semantic layering
   */
  static readonly COMMON_LAYERS = {
    background: -1,
    base: 0,
    content: 1,
    navigation: 100,
    dropdown: 200,
    overlay: 300,
    modal: 400,
    tooltip: 500,
    toast: 600,
    debug: 9999,
  } as const
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
export function zIndex(value: number): ZIndexModifier {
  return new ZIndexModifier({ zIndex: value })
}
