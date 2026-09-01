/**
 * Overlay Modifier
 *
 * SwiftUI-inspired modifier for overlaying content on top of another view
 */

import { BaseModifier } from '../base'
import type { ModifierContext, ModifierResult } from '../types'
import type { ComponentInstance, DOMNode } from '@tachui/types/runtime'
import type { Signal } from '@tachui/types/reactive'
import { createEffect, isSignal, isComputed } from '@tachui/core/reactive'
import { renderComponent } from '@tachui/core/runtime'

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

/**
 * A single piece of overlay content, after any content closure has been called.
 *
 * `ComponentInstance` covers both built and unbuilt components — an unbuilt
 * modifier builder is built on render, the same way a root component is.
 */
export type OverlayContentValue =
  | ComponentInstance
  | Element
  | string
  | number
  | null
  | undefined

/**
 * Content accepted by {@link overlay}, mirroring SwiftUI's
 * `.overlay(alignment:content:)` content closure.
 */
export type OverlayContent =
  | OverlayContentValue
  | Signal<string | number>
  | (() => OverlayContentValue)

export interface OverlayOptions {
  content: OverlayContent
  alignment?: OverlayAlignment | Signal<OverlayAlignment>
  side?: OverlaySide | Signal<OverlaySide>
  offset?: OverlayOffset | Signal<OverlayOffset>
  enabled?: boolean | Signal<boolean>
}

/**
 * A component instance, or an unbuilt modifier builder wrapping one — both are
 * mountable by `renderComponent`, which builds a builder before rendering.
 */
function isComponentContent(value: unknown): value is ComponentInstance {
  if (!value || typeof value !== 'object') return false
  const candidate = value as { render?: unknown; build?: unknown }
  return (
    typeof candidate.render === 'function' ||
    typeof candidate.build === 'function'
  )
}

export class OverlayModifier extends BaseModifier<OverlayOptions> {
  readonly type = 'overlay'
  readonly priority = 10 // Apply late so positioning is relative to final layout

  /**
   * Teardown for the overlay this modifier last mounted on a given element.
   *
   * `renderSingle` applies modifiers on every render of a node, not only when
   * the element is created, so a base component that re-renders drives
   * `apply()` again on the same element. Without this, each pass would append
   * another container and leave the previous one — and its content — in the
   * DOM, because the pipeline's cleanup only runs at unmount.
   *
   * Keyed per element rather than held as a single field so that one modifier
   * instance applied to several elements tears each down independently, and
   * weakly so a discarded element does not pin its overlay's closures.
   */
  private readonly mounted = new WeakMap<Element, () => void>()

  apply(
    node: DOMNode,
    context: ModifierContext
  ): DOMNode | ModifierResult | undefined {
    if (!context.element) return

    // In test environment, accept any element with style property
    const element = context.element as HTMLElement
    if (!element.style) return

    const { content } = this.properties

    // Re-applied to an element this modifier already decorated: drop the stale
    // overlay before mounting the replacement.
    this.mounted.get(element)?.()

    const cleanup = this.applyOverlay(element, content)

    let torndown = false
    const teardown = () => {
      // The pipeline may run this after a re-apply already has; the disposers
      // below are not all safe to invoke twice.
      if (torndown) return
      torndown = true
      for (const dispose of cleanup) dispose()
      this.mounted.delete(element)
    }

    this.mounted.set(element, teardown)

    // The node passes through untouched — overlay never rewrites the tree, it
    // only appends a container and hands back the teardown for it.
    return { node, cleanup: [teardown] }
  }

  private applyOverlay(
    element: HTMLElement,
    content: OverlayContent
  ): (() => void)[] {
    // Make the element a positioned container
    if (element.style.position === '' || element.style.position === 'static') {
      element.style.position = 'relative'
    }

    // Create overlay container
    const overlayContainer = document.createElement('div')
    overlayContainer.style.position = 'absolute'
    overlayContainer.style.pointerEvents = 'none' // Allow clicks to pass through by default

    const cleanup: (() => void)[] = []

    const disposePositioning = this.applyOverlayPositioning(overlayContainer)
    if (disposePositioning) cleanup.push(disposePositioning)

    // Add the overlay to the element before rendering so content mounts into
    // the connected tree (event delegation resolves against a real ancestor).
    element.appendChild(overlayContainer)

    const disposeContent = this.renderContent(overlayContainer, content)
    if (disposeContent) cleanup.push(disposeContent)

    // The overlay container is DOM this modifier added, so it goes when the
    // modifier does — after the content's own disposers have run.
    cleanup.push(() => {
      overlayContainer.remove?.()
    })

    return cleanup
  }

  private applyOverlayPositioning(
    overlayContainer: HTMLElement
  ): (() => void) | undefined {
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
        sideValue !== undefined ? effectiveSide : alignmentValue
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
      const effect = createEffect(() => {
        applyResolvedPositioning()
      })
      return () => effect.dispose()
    }

    applyResolvedPositioning()
    return undefined
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

  /**
   * Mount overlay content into the container.
   *
   * Returns a disposer when the content owns reactive state or DOM that has to
   * be torn down with the modifier, otherwise `undefined`.
   */
  private renderContent(
    container: HTMLElement,
    content: OverlayContent
  ): (() => void) | undefined {
    if (content === null || content === undefined) return undefined

    // A signal renders as reactive text, so `overlay(label)` tracks updates
    // the same way `alignment`/`offset` do.
    if (isSignal(content) || isComputed(content)) {
      const signal = content as Signal<string | number>
      const textNode = document.createTextNode('')
      container.appendChild(textNode)
      const effect = createEffect(() => {
        textNode.data = String(signal() ?? '')
      })
      return () => effect.dispose()
    }

    // A thunk is SwiftUI's `@ViewBuilder` content closure: call it once and
    // mount whatever it produced.
    if (typeof content === 'function') {
      return this.renderContent(
        container,
        (content as () => OverlayContentValue)()
      )
    }

    if (typeof content === 'string' || typeof content === 'number') {
      container.appendChild(document.createTextNode(String(content)))
      return undefined
    }

    // A component instance (built or not) has to go through the renderer —
    // `render()` alone returns DOMNode descriptions with no `element` yet.
    if (isComponentContent(content)) {
      return renderComponent(content as ComponentInstance, container)
    }

    // A DOM element (including test mocks that only implement appendChild)
    const asElement = content as { appendChild?: unknown }
    if (typeof asElement.appendChild === 'function') {
      container.appendChild(content as Element)
      return undefined
    }

    return undefined
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
  content: OverlayContent,
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
