/**
 * Position Modifier
 *
 * CSS position property modifier with enhanced validation and utilities.
 */

import type { DOMNode } from '@tachui/types/runtime'
import { BaseModifier } from '../basic/base'
import type { ModifierContext } from '@tachui/types/modifiers'
import type { Signal } from '@tachui/types/reactive'
import { createEffect, isSignal, isComputed } from '@tachui/core/reactive'

export type PositionValue =
  | 'static'
  | 'relative'
  | 'absolute'
  | 'fixed'
  | 'sticky'

export interface PositionCoordinates {
  x: number | Signal<number>
  y: number | Signal<number>
}

export interface PositionOptions {
  position: PositionValue | PositionCoordinates
}

export class PositionModifier extends BaseModifier<PositionOptions> {
  readonly type = 'position'
  readonly priority = 50 // Highest priority to override other positioning

  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined {
    if (!context.element) return undefined

    const { position } = this.properties

    // Validate in development
    if (
      typeof process !== 'undefined' &&
      process.env.NODE_ENV === 'development'
    ) {
      this.validatePosition(position)
    }

    // Handle coordinate position API: position({ x, y }).
    if (this.isCoordinatePosition(position)) {
      this.applyCoordinatePosition(context.element as HTMLElement, position)
      return undefined
    }

    // Handle reactive keyword position
    if (isSignal(position) || isComputed(position)) {
      createEffect(() => {
        const currentPosition = position()
        this.applyPosition(context.element as HTMLElement, currentPosition)
      })
    } else {
      // Handle static position
      this.applyPosition(context.element as HTMLElement, position)
    }

    return undefined
  }

  private isCoordinatePosition(
    value: PositionValue | PositionCoordinates
  ): value is PositionCoordinates {
    return (
      typeof value === 'object' &&
      value !== null &&
      'x' in value &&
      'y' in value
    )
  }

  private applyCoordinatePosition(
    element: HTMLElement,
    position: PositionCoordinates
  ): void {
    const applyCoordinates = (xValue: number, yValue: number) => {
      element.style.position = 'absolute'
      element.style.left = `${xValue}px`
      element.style.top = `${yValue}px`
      this.applyPositionOptimizations(element, 'absolute')
    }

    if (
      isSignal(position.x) ||
      isComputed(position.x) ||
      isSignal(position.y) ||
      isComputed(position.y)
    ) {
      createEffect(() => {
        const resolvedX =
          isSignal(position.x) || isComputed(position.x)
            ? position.x()
            : position.x
        const resolvedY =
          isSignal(position.y) || isComputed(position.y)
            ? position.y()
            : position.y
        applyCoordinates(resolvedX, resolvedY)
      })
      return
    }

    applyCoordinates(position.x as number, position.y as number)
  }

  private applyPosition(element: HTMLElement, position: PositionValue): void {
    element.style.position = position

    // Apply position-specific optimizations and warnings
    this.applyPositionOptimizations(element, position)
  }

  private applyPositionOptimizations(
    element: HTMLElement,
    position: PositionValue
  ): void {
    if (
      typeof process !== 'undefined' &&
      process.env.NODE_ENV === 'development'
    ) {
      // Provide helpful guidance for each position type
      switch (position) {
        case 'absolute':
          this.warnIfMissingPositionedParent(element)
          break
        case 'fixed':
          console.info(
            'PositionModifier: Fixed positioning relative to viewport. Consider impact on mobile layouts.'
          )
          break
        case 'sticky':
          this.warnIfMissingStickyProperties(element)
          break
        case 'relative':
          // Relative is generally safe, but can establish new stacking context
          break
        case 'static':
          // Static is the default, removes any positioning context
          this.warnIfHasPositioningProperties(element)
          break
      }
    }

    // Apply performance optimizations for positioned elements
    if (position === 'absolute' || position === 'fixed') {
      // Create new stacking context to improve performance
      if (!element.style.zIndex) {
        element.style.zIndex = '0'
      }

      // Enable hardware acceleration for better performance
      if (!element.style.transform) {
        element.style.transform = 'translateZ(0)'
      }
    }
  }

  private warnIfMissingPositionedParent(element: HTMLElement): void {
    let parent = element.parentElement
    let hasPositionedParent = false

    while (parent && parent !== document.body) {
      const parentPosition = getComputedStyle(parent).position
      if (parentPosition !== 'static') {
        hasPositionedParent = true
        break
      }
      parent = parent.parentElement
    }

    if (!hasPositionedParent) {
      console.warn(
        'PositionModifier: Absolutely positioned element may not have expected behavior without a positioned parent (relative, absolute, or fixed)'
      )
    }
  }

  private warnIfMissingStickyProperties(element: HTMLElement): void {
    const style = getComputedStyle(element)
    const hasStickySide =
      style.top !== 'auto' ||
      style.right !== 'auto' ||
      style.bottom !== 'auto' ||
      style.left !== 'auto'

    if (!hasStickySide) {
      console.warn(
        'PositionModifier: Sticky positioning requires at least one of top, right, bottom, or left to be set'
      )
    }
  }

  private warnIfHasPositioningProperties(element: HTMLElement): void {
    const style = getComputedStyle(element)
    const hasPositioningProps =
      style.top !== 'auto' ||
      style.right !== 'auto' ||
      style.bottom !== 'auto' ||
      style.left !== 'auto'

    if (hasPositioningProps) {
      console.warn(
        'PositionModifier: Static positioning ignores top, right, bottom, and left properties'
      )
    }
  }

  /**
   * Development mode validation
   */
  private validatePosition(position: any): void {
    if (
      typeof process !== 'undefined' &&
      process.env.NODE_ENV === 'development'
    ) {
      const isReactive = isSignal(position) || isComputed(position)
      if (this.isCoordinatePosition(position)) {
        return
      }

      if (!isReactive && typeof position !== 'string') {
        console.warn(
          `PositionModifier: position must be a string or reactive signal. Got: ${typeof position}`
        )
        return
      }

      const actualPosition = isReactive
        ? position.peek?.() || position()
        : position
      const validPositions: PositionValue[] = [
        'static',
        'relative',
        'absolute',
        'fixed',
        'sticky',
      ]

      if (!validPositions.includes(actualPosition)) {
        console.warn(
          `PositionModifier: Invalid position value "${actualPosition}". Valid values:`,
          validPositions
        )
      }

      // Browser compatibility warnings
      if (actualPosition === 'sticky') {
        console.info(
          'PositionModifier: Sticky positioning may need vendor prefixes for older browsers'
        )
      }
    }
  }
}

/**
 * Create a position modifier
 *
 * @param value - CSS position value
 *
 * @example
 * ```typescript
 * // Static positioning (default, removes positioning context)
 * position('static')
 *
 * // Relative positioning (creates positioning context)
 * position('relative')
 *
 * // Absolute positioning (positioned relative to nearest positioned parent)
 * position('absolute')
 *
 * // Fixed positioning (positioned relative to viewport)
 * position('fixed')
 *
 * // Sticky positioning (hybrid relative/fixed)
 * position('sticky')
 *
 * // With reactive value
 * const pos = signal('relative')
 * position(pos)
 * ```
 */
export function position(value: PositionValue | PositionCoordinates): PositionModifier {
  return new PositionModifier({ position: value })
}
