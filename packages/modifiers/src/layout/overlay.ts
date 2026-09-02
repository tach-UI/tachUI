/**
 * Overlay Modifier
 *
 * SwiftUI-inspired modifier for overlaying content on top of another view
 */

import { BaseModifier } from '../base'
import type { ModifierContext, ModifierResult } from '../types'
import type { ComponentInstance, DOMNode } from '@tachui/types/runtime'
import type { Signal } from '@tachui/types/reactive'
import {
  createEffect,
  isSignal,
  isComputed,
  onCleanup,
} from '@tachui/core/reactive'
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

interface OverlayElementState {
  /**
   * Identity of the `ModifierContext` for the pass currently being built.
   * `applyModifiersToNode` builds one context object per element render and
   * hands the same one to every modifier in that pass, so a change of identity
   * is exactly a change of pass.
   */
  pass: ModifierContext
  /** Disposers for every overlay mounted on this element during that pass. */
  mounts: Set<() => void>
}

/**
 * Overlay bookkeeping is owned by the **element**, not by the modifier.
 *
 * `renderSingle` applies modifiers on every render of a node, not only when the
 * element is created, and the pipeline's cleanup does not run until unmount. So
 * a re-render mounts a second overlay over the first unless something tears the
 * stale one down.
 *
 * Keying this off the modifier instance is not enough: a component that builds
 * its chain inline — `Text(label()).overlay(badge)` inside a parent's render —
 * produces a *fresh* modifier every pass while the renderer reuses the element,
 * so the new instance knows nothing about its predecessor. Keying off the
 * element covers that, and covers an overlay being dropped from a chain that
 * still has others.
 *
 * Weak so a discarded element does not pin its overlays' closures.
 */
const overlayStates = new WeakMap<Element, OverlayElementState>()

function disposeMounts(state: OverlayElementState): void {
  // Copy first: each disposer removes itself from the set as it runs.
  for (const dispose of Array.from(state.mounts)) dispose()
  state.mounts.clear()
}

export class OverlayModifier extends BaseModifier<OverlayOptions> {
  readonly type = 'overlay'
  readonly priority = 10 // Apply late so positioning is relative to final layout

  apply(
    node: DOMNode,
    context: ModifierContext
  ): DOMNode | ModifierResult | undefined {
    if (!context.element) return

    // In test environment, accept any element with style property
    const element = context.element as HTMLElement
    if (!element.style) return

    const { content } = this.properties

    let state = overlayStates.get(element)
    const firstMount = state === undefined

    if (state === undefined) {
      state = { pass: context, mounts: new Set() }
      overlayStates.set(element, state)
    } else if (state.pass !== context) {
      // A new render pass over this element: everything the previous pass
      // mounted is stale. Whatever this pass still wants re-mounts below.
      disposeMounts(state)
      state.pass = context
    }

    const mounted = state
    const cleanup = this.applyOverlay(element, content)

    let disposed = false
    const dispose = () => {
      // Reachable more than once: a pass boundary, the execution-scoped
      // cleanup below, and unmount can each drain this mount.
      if (disposed) return
      disposed = true
      mounted.mounts.delete(dispose)
      for (const fn of cleanup) fn()
    }
    mounted.mounts.add(dispose)

    // Modifiers are applied inside the render effect's body, so an
    // execution-scoped cleanup runs just before that effect's next execution
    // (#270). That is the only signal available for a pass in which *no*
    // overlay modifier runs at all — the last overlay leaving the chain — which
    // the reconciliation above can never see, because it is only ever driven
    // from apply(). Whatever is still in the chain re-mounts on that pass.
    //
    // Outside a computation `onCleanup` degrades to owner-scoped, then to a
    // no-op; the reconciliation above covers those paths, and both routes end
    // at the same idempotent disposer.
    onCleanup(dispose)

    // Only the pass that created the element's state hands cleanup back. The
    // pipeline chains every returned cleanup onto `node.dispose` and pushes it
    // onto the element's cleanup list without ever dropping the previous one,
    // so returning one per re-apply would grow an unbounded chain of stale
    // teardowns, all replayed at unmount. One stable teardown per element
    // disposes whatever is mounted at that point, which is all unmount needs.
    if (!firstMount) return { node }

    const teardown = () => {
      const current = overlayStates.get(element)
      if (!current) return
      overlayStates.delete(element)
      disposeMounts(current)
    }

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
