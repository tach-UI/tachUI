/**
 * Aspect Ratio Modifier
 *
 * SwiftUI .aspectRatio() modifier for controlling element aspect ratios.
 * Supports both explicit ratios and content mode (fit/fill).
 */

import type { DOMNode } from '@tachui/core/runtime/types'
import { BaseModifier } from '../basic/base'
import type { ModifierContext } from '@tachui/core/modifiers/types'
import { createEffect, isSignal, isComputed } from '@tachui/core/reactive'

export type ContentMode = 'fit' | 'fill'

export interface AspectRatioOptions {
  ratio?: number
  contentMode: ContentMode
}

export class AspectRatioModifier extends BaseModifier<AspectRatioOptions> {
  readonly type = 'aspectRatio'
  readonly priority = 20 // Medium priority for layout properties

  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined {
    if (!context.element) return undefined

    const { ratio, contentMode } = this.properties

    // Validate in development
    if (
      typeof process !== 'undefined' &&
      process.env.NODE_ENV === 'development'
    ) {
      this.validateAspectRatio(ratio, contentMode)
    }

    if (ratio !== undefined) {
      // Handle reactive aspect ratio
      if (isSignal(ratio) || isComputed(ratio)) {
        createEffect(() => {
          const currentRatio = ratio()
          this.applyAspectRatio(
            context.element as HTMLElement,
            currentRatio,
            contentMode
          )
        })
      } else {
        this.applyAspectRatio(
          context.element as HTMLElement,
          ratio,
          contentMode
        )
      }
    } else {
      // Apply only content mode without specific ratio
      this.applyContentMode(context.element as HTMLElement, contentMode)
    }

    return undefined
  }

  private applyAspectRatio(
    element: HTMLElement,
    ratio: number,
    contentMode: ContentMode
  ): void {
    // Set CSS aspect-ratio property
    element.style.aspectRatio = String(ratio)

    // Apply content mode
    this.applyContentMode(element, contentMode)
  }

  private applyContentMode(
    element: HTMLElement,
    contentMode: ContentMode
  ): void {
    // Set content mode behavior
    if (contentMode === 'fill') {
      element.style.objectFit = 'cover'
      // For non-img/video elements, ensure content fills the container
      if (!this.isMediaElement(element)) {
        element.style.width = '100%'
        element.style.height = '100%'
      }
    } else {
      // fit
      element.style.objectFit = 'contain'
      // For non-media elements, maintain aspect ratio within container
      if (!this.isMediaElement(element)) {
        element.style.maxWidth = '100%'
        element.style.maxHeight = '100%'
      }
    }
  }

  private isMediaElement(element: HTMLElement): boolean {
    const mediaTagNames = ['IMG', 'VIDEO', 'CANVAS', 'SVG', 'IFRAME']
    return mediaTagNames.includes(element.tagName)
  }

  /**
   * Development mode validation
   */
  private validateAspectRatio(ratio: any, contentMode: ContentMode): void {
    if (
      typeof process !== 'undefined' &&
      process.env.NODE_ENV === 'development'
    ) {
      // Validate ratio
      if (ratio !== undefined) {
        if (
          typeof ratio !== 'number' &&
          !isSignal(ratio) &&
          !isComputed(ratio)
        ) {
          console.warn(
            `AspectRatioModifier: ratio must be a number or reactive signal. Got: ${typeof ratio}`
          )
        }

        const actualRatio =
          isSignal(ratio) || isComputed(ratio)
            ? ratio.peek?.() || ratio()
            : ratio
        if (typeof actualRatio === 'number') {
          if (actualRatio <= 0) {
            console.warn(
              `AspectRatioModifier: ratio must be positive. Got: ${actualRatio}`
            )
          }
          if (actualRatio > 100) {
            console.warn(
              `AspectRatioModifier: Very large ratio (${actualRatio}) may cause layout issues`
            )
          }
          if (actualRatio < 0.01) {
            console.warn(
              `AspectRatioModifier: Very small ratio (${actualRatio}) may cause layout issues`
            )
          }
        }
      }

      // Validate content mode
      const validContentModes: ContentMode[] = ['fit', 'fill']
      if (!validContentModes.includes(contentMode)) {
        console.warn(
          `AspectRatioModifier: Invalid content mode "${contentMode}". Valid modes:`,
          validContentModes
        )
      }
    }
  }

  /**
   * Get common aspect ratios
   */
  static readonly COMMON_RATIOS = {
    square: 1,
    portrait: 3 / 4,
    landscape: 4 / 3,
    widescreen: 16 / 9,
    ultrawide: 21 / 9,
    golden: 1.618,
    photo: 3 / 2,
  } as const
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
export function aspectRatio(
  ratio?: number,
  contentMode: ContentMode = 'fit'
): AspectRatioModifier {
  return new AspectRatioModifier({ ratio, contentMode })
}
