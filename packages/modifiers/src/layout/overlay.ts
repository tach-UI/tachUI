/**
 * Overlay Modifier
 *
 * SwiftUI-inspired modifier for overlaying content on top of another view
 */

import { BaseModifier } from '../basic/base'
import type { ModifierContext } from '@tachui/core/modifiers/types'
import type { DOMNode } from '@tachui/core/runtime/types'

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

export interface OverlayOptions {
  content: any // ComponentInstance, HTMLElement, or function that returns ComponentInstance
  alignment?: OverlayAlignment
}

export class OverlayModifier extends BaseModifier<OverlayOptions> {
  readonly type = 'overlay'
  readonly priority = 10 // Apply late so positioning is relative to final layout

  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined {
    if (!context.element || !(context.element instanceof HTMLElement)) return

    const element = context.element
    const { content, alignment = 'center' } = this.properties

    this.applyOverlay(element, content, alignment, context)

    return undefined
  }

  private applyOverlay(
    element: HTMLElement,
    content: any,
    alignment: OverlayAlignment,
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

    // Apply alignment positioning
    const alignmentStyles = this.getOverlayAlignment(alignment)
    Object.assign(overlayContainer.style, alignmentStyles)

    // Render content
    this.renderContent(overlayContainer, content)

    // Add overlay to the element
    element.appendChild(overlayContainer)
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
    } else if (content instanceof HTMLElement) {
      // If content is already a DOM element
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
  alignment: OverlayAlignment = 'center'
): OverlayModifier {
  return new OverlayModifier({ content, alignment })
}
