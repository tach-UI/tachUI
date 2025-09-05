/**
 * Fixed Size Modifier
 *
 * SwiftUI .fixedSize() modifier for preventing elements from growing
 * beyond their intrinsic content size in specified dimensions.
 */

import type { DOMNode } from '@tachui/core/runtime/types'
import { BaseModifier } from '../basic/base'
import type { ModifierContext } from '@tachui/core/modifiers/types'

export interface FixedSizeOptions {
  horizontal: boolean
  vertical: boolean
}

export class FixedSizeModifier extends BaseModifier<FixedSizeOptions> {
  readonly type = 'fixedSize'
  readonly priority = 25 // Medium priority for layout properties

  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined {
    if (!context.element) return undefined

    const { horizontal, vertical } = this.properties

    // Validate in development
    if (
      typeof process !== 'undefined' &&
      process.env.NODE_ENV === 'development'
    ) {
      this.validateFixedSize(horizontal, vertical)
    }

    this.applyFixedSize(context.element as HTMLElement, horizontal, vertical)

    return undefined
  }

  private applyFixedSize(
    element: HTMLElement,
    horizontal: boolean,
    vertical: boolean
  ): void {
    // Apply horizontal fixed size
    if (horizontal) {
      // Prevent horizontal growth beyond intrinsic width
      element.style.maxWidth = 'max-content'
      element.style.width = 'max-content'

      // For flex items, prevent flex-grow
      element.style.flexShrink = '0'
      element.style.flexBasis = 'auto'

      // For text content, prevent wrapping
      if (this.isTextElement(element)) {
        element.style.whiteSpace = 'nowrap'
      }
    }

    // Apply vertical fixed size
    if (vertical) {
      // Prevent vertical growth beyond intrinsic height
      element.style.maxHeight = 'max-content'
      element.style.height = 'max-content'

      // For flex items in column direction
      if (this.isFlexItem(element)) {
        element.style.alignSelf = 'flex-start'
      }
    }

    // If both dimensions are fixed, make the element as small as possible
    if (horizontal && vertical) {
      element.style.display = element.style.display || 'inline-block'
    }
  }

  private isTextElement(element: HTMLElement): boolean {
    const textElements = [
      'P',
      'SPAN',
      'DIV',
      'H1',
      'H2',
      'H3',
      'H4',
      'H5',
      'H6',
      'LABEL',
    ]
    return (
      (textElements.includes(element.tagName) &&
        element.childNodes.length > 0) ||
      (element.childNodes.length > 0 &&
        Array.from(element.childNodes).some(
          node => node.nodeType === Node.TEXT_NODE
        ))
    )
  }

  private isFlexItem(element: HTMLElement): boolean {
    const parent = element.parentElement
    if (!parent) return false

    const parentDisplay = getComputedStyle(parent).display
    return parentDisplay === 'flex' || parentDisplay === 'inline-flex'
  }

  /**
   * Development mode validation
   */
  private validateFixedSize(horizontal: boolean, vertical: boolean): void {
    if (
      typeof process !== 'undefined' &&
      process.env.NODE_ENV === 'development'
    ) {
      // Validate boolean values
      if (typeof horizontal !== 'boolean') {
        console.warn(
          `FixedSizeModifier: horizontal must be a boolean. Got: ${typeof horizontal}`
        )
      }

      if (typeof vertical !== 'boolean') {
        console.warn(
          `FixedSizeModifier: vertical must be a boolean. Got: ${typeof vertical}`
        )
      }

      // Warn if both are false (no-op)
      if (!horizontal && !vertical) {
        console.warn(
          'FixedSizeModifier: Both horizontal and vertical are false - this modifier has no effect'
        )
      }

      // Provide usage guidance
      if (horizontal && vertical) {
        console.info(
          'FixedSizeModifier: Element will be sized to its content in both dimensions (like display: inline-block)'
        )
      } else if (horizontal) {
        console.info(
          'FixedSizeModifier: Element width will be fixed to content size (prevents text wrapping)'
        )
      } else if (vertical) {
        console.info(
          'FixedSizeModifier: Element height will be fixed to content size'
        )
      }
    }
  }
}

/**
 * Create a fixed size modifier
 *
 * @param horizontal - Fix horizontal size to content (default: true)
 * @param vertical - Fix vertical size to content (default: true)
 *
 * @example
 * ```typescript
 * // Fix both dimensions (equivalent to intrinsic sizing)
 * fixedSize()
 * fixedSize(true, true)
 *
 * // Fix only horizontal (prevent text wrapping)
 * fixedSize(true, false)
 *
 * // Fix only vertical (prevent height expansion)
 * fixedSize(false, true)
 *
 * // No fixed sizing (no-op, but validates parameters)
 * fixedSize(false, false)
 * ```
 */
export function fixedSize(
  horizontal: boolean = true,
  vertical: boolean = true
): FixedSizeModifier {
  return new FixedSizeModifier({ horizontal, vertical })
}
