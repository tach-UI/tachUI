/**
 * Overlay Modifier
 *
 * SwiftUI-inspired modifier for overlaying content on top of another view
 */

import { BaseModifier } from '../base'
import type { ModifierContext } from '../types'
import type { DOMNode } from '@tachui/types/runtime'
import type { Signal } from '@tachui/types/reactive'
import { createEffect, isSignal, isComputed } from '@tachui/core/reactive'

export type OverlayAlignment =
  | 'center'
  | 'top'
  | 'bottom'
  | 'leading'
  | 'trailing'
  | 'topLeading'
  | 'topTrailing'
  | 'bottomLeading'
  | 'bottomTrailing'

export type OverlaySide = 'top' | 'bottom' | 'leading' | 'trailing' | 'center'
export type OverlayOffset =
  | number
  | {
      x?: number
      y?: number
    }

export interface OverlayOptions {
  content: any // ComponentInstance, HTMLElement, or function that returns ComponentInstance
  alignment?: OverlayAlignment | Signal<OverlayAlignment>
  side?: OverlaySide | Signal<OverlaySide>
  offset?: OverlayOffset | Signal<OverlayOffset>
  enabled?: boolean | Signal<boolean>
}

export class OverlayModifier extends BaseModifier<OverlayOptions> {
  readonly type = 'overlay'
  readonly priority = 10 // Apply late so positioning is relative to final layout

  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined {
    if (!context.element) return

    // In test environment, accept any element with style property
    const element = context.element as HTMLElement
    if (!element.style) return

    const { content } = this.properties

    this.applyOverlay(element, content, context)

    return undefined
  }

  private applyOverlay(
    element: HTMLElement,
    content: any,
    _context: ModifierContext
  ): void {
    // Make the element a positioned container
    if (element.style.position === '' || element.style.position === 'static') {
      element.style.position = 'relative'
    }

    // Create overlay container
    const overlayContainer = document.createElement('div')
    overlayContainer.style.position = 'absolute'
    overlayContainer.style.pointerEvents = 'none' // Allow clicks to pass through by default

    this.applyOverlayPositioning(overlayContainer)

    // Render content
    this.renderContent(overlayContainer, content)

    // Add overlay to the element
    element.appendChild(overlayContainer)
  }

  private applyOverlayPositioning(overlayContainer: HTMLElement): void {
    const applyResolvedPositioning = () => {
      const alignmentValue = this.resolveReactive(
        this.properties.alignment,
        'center'
      )
      const sideValue = this.resolveReactive(this.properties.side, undefined)
      const offsetValue = this.resolveReactive(this.properties.offset, undefined)
      const enabledValue = this.resolveReactive(this.properties.enabled, true)

      this.clearPositionStyles(overlayContainer)

      const effectiveSide = sideValue ?? alignmentValue
      const effectiveAlignment =
        sideValue !== undefined
          ? this.normalizeSideToAlignment(effectiveSide)
          : alignmentValue
      const alignmentStyles = this.getOverlayAlignment(effectiveAlignment)
      Object.assign(overlayContainer.style, alignmentStyles)

      this.applyOffset(overlayContainer, effectiveSide, offsetValue)

      overlayContainer.style.display = enabledValue ? '' : 'none'
    }

    const hasReactivePositioning =
      this.isReactive(this.properties.alignment) ||
      this.isReactive(this.properties.side) ||
      this.isReactive(this.properties.offset) ||
      this.isReactive(this.properties.enabled)

    if (hasReactivePositioning) {
      createEffect(() => {
        applyResolvedPositioning()
      })
      return
    }

    applyResolvedPositioning()
  }

  private applyOffset(
    overlayContainer: HTMLElement,
    side: OverlayAlignment | OverlaySide,
    offset: OverlayOffset | undefined
  ): void {
    if (offset === undefined) return

    if (typeof offset === 'number') {
      this.applyNumericOffset(overlayContainer, side, offset)
      return
    }

    const { x, y } = offset
    if (typeof x === 'number') {
      if (overlayContainer.style.left) {
        overlayContainer.style.left = this.addPixelOffset(
          overlayContainer.style.left,
          x
        )
      } else if (overlayContainer.style.right) {
        overlayContainer.style.right = this.addPixelOffset(
          overlayContainer.style.right,
          x
        )
      }
    }
    if (typeof y === 'number') {
      if (overlayContainer.style.top) {
        overlayContainer.style.top = this.addPixelOffset(
          overlayContainer.style.top,
          y
        )
      } else if (overlayContainer.style.bottom) {
        overlayContainer.style.bottom = this.addPixelOffset(
          overlayContainer.style.bottom,
          y
        )
      }
    }
  }

  private applyNumericOffset(
    overlayContainer: HTMLElement,
    side: OverlayAlignment | OverlaySide,
    offset: number
  ): void {
    switch (side) {
      case 'top':
      case 'topLeading':
      case 'topTrailing':
        overlayContainer.style.top = `${offset}px`
        break
      case 'bottom':
      case 'bottomLeading':
      case 'bottomTrailing':
        overlayContainer.style.bottom = `${offset}px`
        break
      case 'leading':
        overlayContainer.style.left = `${offset}px`
        break
      case 'trailing':
        overlayContainer.style.right = `${offset}px`
        break
      default:
        break
    }
  }

  private addPixelOffset(base: string, offset: number): string {
    return `calc(${base} + ${offset}px)`
  }

  private clearPositionStyles(overlayContainer: HTMLElement): void {
    overlayContainer.style.top = ''
    overlayContainer.style.right = ''
    overlayContainer.style.bottom = ''
    overlayContainer.style.left = ''
    overlayContainer.style.transform = ''
  }

  private normalizeSideToAlignment(
    side: OverlayAlignment | OverlaySide
  ): OverlayAlignment {
    switch (side) {
      case 'top':
      case 'bottom':
      case 'leading':
      case 'trailing':
      case 'center':
        return side
      default:
        return side
    }
  }

  private isReactive<T>(value: T | Signal<T> | undefined): value is Signal<T> {
    return Boolean(value && (isSignal(value) || isComputed(value)))
  }

  private resolveReactive<T>(
    value: T | Signal<T> | undefined,
    fallback: T
  ): T
  private resolveReactive<T>(
    value: T | Signal<T> | undefined,
    fallback: undefined
  ): T | undefined
  private resolveReactive<T>(
    value: T | Signal<T> | undefined,
    fallback: T | undefined
  ): T | undefined {
    if (value === undefined) return fallback
    if (isSignal(value) || isComputed(value)) {
      return value()
    }
    return value
  }

  private renderContent(container: HTMLElement, content: any): void {
    if (typeof content === 'function') {
      // If content is a function, call it to get component
      const contentComponent = content()
      if (contentComponent && typeof contentComponent.render === 'function') {
        const contentNode = contentComponent.render()
        if (contentNode.element) {
          container.appendChild(contentNode.element)
        }
      }
    } else if (content && typeof content.render === 'function') {
      // If content is a component instance
      const contentNode = content.render()
      if (contentNode.element) {
        container.appendChild(contentNode.element)
      }
    } else if (
      content &&
      (content instanceof HTMLElement || content.appendChild)
    ) {
      // If content is a DOM element (including test mock elements with appendChild method)
      container.appendChild(content)
    }
  }

  private getOverlayAlignment(
    alignment: OverlayAlignment
  ): Record<string, string> {
    const alignments: Record<OverlayAlignment, Record<string, string>> = {
      center: {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      },
      top: {
        top: '0px',
        left: '50%',
        transform: 'translateX(-50%)',
      },
      bottom: {
        bottom: '0px',
        left: '50%',
        transform: 'translateX(-50%)',
      },
      leading: {
        top: '50%',
        left: '0px',
        transform: 'translateY(-50%)',
      },
      trailing: {
        top: '50%',
        right: '0px',
        transform: 'translateY(-50%)',
      },
      topLeading: {
        top: '0px',
        left: '0px',
      },
      topTrailing: {
        top: '0px',
        right: '0px',
      },
      bottomLeading: {
        bottom: '0px',
        left: '0px',
      },
      bottomTrailing: {
        bottom: '0px',
        right: '0px',
      },
    }

    return alignments[alignment] || alignments.center
  }
}

/**
 * Creates an overlay modifier that overlays content on top of the view
 */
export function overlay(
  content: any,
  alignmentOrOptions:
    | OverlayAlignment
    | Omit<OverlayOptions, 'content'> = 'center'
): OverlayModifier {
  if (
    typeof alignmentOrOptions === 'object' &&
    alignmentOrOptions !== null &&
    !isSignal(alignmentOrOptions) &&
    !isComputed(alignmentOrOptions)
  ) {
    return new OverlayModifier({
      content,
      ...alignmentOrOptions,
    })
  }

  return new OverlayModifier({
    content,
    alignment: alignmentOrOptions as OverlayAlignment,
  })
}
