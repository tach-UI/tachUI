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
  untrack,
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

type AxisAnchor = 'start' | 'center' | 'end'

interface AxisAnchors {
  x: AxisAnchor
  y: AxisAnchor
}

const ALIGNMENT_ANCHORS: Record<OverlayAlignment, AxisAnchors> = {
  center: { x: 'center', y: 'center' },
  top: { x: 'center', y: 'start' },
  bottom: { x: 'center', y: 'end' },
  leading: { x: 'start', y: 'center' },
  trailing: { x: 'end', y: 'center' },
  topLeading: { x: 'start', y: 'start' },
  topTrailing: { x: 'end', y: 'start' },
  bottomLeading: { x: 'start', y: 'end' },
  bottomTrailing: { x: 'end', y: 'end' },
}

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

    // No DOM to build the layer in: the SSR serializer hands modifiers a
    // style-collecting stand-in with no child API at all. Describe the layer
    // as nodes instead, so server markup carries the overlay rather than
    // leaving the host bare until scripts run. Taken before any of the mount
    // bookkeeping below, none of which has a server meaning.
    if (!canBuildLayer(element)) {
      return { node: this.describeOverlay(node, element, content) }
    }

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

  /**
   * The layer, and the host's positioning, described rather than built.
   *
   * Shares `styleLayer` and `applyResolvedPositioning` with the client path,
   * which is what keeps the two from disagreeing about alignment, offset or
   * writing direction — a disagreement would show as the overlay jumping when
   * the client takes over.
   *
   * What is deliberately absent: the content observer, which watches for
   * items appearing later and has nothing to watch here, and the mount
   * bookkeeping, which exists to tear DOM down.
   */
  private describeOverlay(
    node: DOMNode,
    element: HTMLElement,
    content: OverlayContent
  ): DOMNode {
    this.ensurePositionedHost(element)

    const layerStyle: Record<string, string> = {}
    // Only `.style` is ever touched by either method, so a bare object stands
    // in for the element.
    const layer = { style: layerStyle } as unknown as HTMLElement
    this.styleLayer(layer)
    // Untracked for the same reason the content read is: nothing here updates
    // after serialization, and a tracked read would subscribe whatever is
    // serializing. The serializer untracks its own reads on the same grounds.
    untrack(() => this.applyResolvedPositioning(layer))

    const children = this.layerDescribedContent(this.describeContent(content))

    const layerNode: DOMNode = {
      type: 'element',
      tag: 'div',
      props: { style: layerStyle },
      children,
    }

    return { ...node, children: [...(node.children ?? []), layerNode] }
  }

  /**
   * Make the host a positioned container, so the layer covers it.
   *
   * Shared by both paths rather than written twice: a host that already
   * positions itself must be left alone, and the server getting that wrong
   * would move it out of its parent's layout until the client took over.
   * `undefined` is here for a stand-in element with no read support of its
   * own; CSSOM and the SSR shim both report the empty string.
   */
  private ensurePositionedHost(element: HTMLElement): void {
    const position = element.style.position
    if (position === undefined || position === '' || position === 'static') {
      element.style.position = 'relative'
    }
  }

  /**
   * `renderContent`'s counterpart: content as nodes rather than as DOM.
   *
   * `active` guards the builder/component recursion the way the serializer
   * guards its own — and, like the serializer's `activeBuilders`, it tracks
   * the current *path* rather than everything ever seen. A component removed
   * again on the way out is free to appear beside itself; only one that
   * contains itself is cyclic. Without that, `[leaf, leaf]` would be rejected
   * here while serializing happily at top level.
   *
   * The throw does not reach the caller through the serializer: the modifier
   * pipeline catches it and the overlay is dropped from the markup. That
   * swallow is the pipeline's, not this method's, but it is why this guard
   * has to be exact — a false positive here costs the whole overlay silently.
   */
  private describeContent(
    content: OverlayContent,
    active: Set<object> = new Set()
  ): DOMNode[] {
    if (content === null || content === undefined) return []

    // Read once and untracked. There is no client here to update the text,
    // and a tracked read would subscribe whatever is serializing.
    if (isSignal(content) || isComputed(content)) {
      const value = untrack(() => (content as Signal<string | number>)())
      return [{ type: 'text', text: String(value ?? '') } as DOMNode]
    }

    // A content closure can read signals of its own, so its call is untracked
    // with the rest.
    if (typeof content === 'function') {
      return this.describeContent(
        untrack(() => (content as () => OverlayContentValue)()),
        active
      )
    }

    if (typeof content === 'string' || typeof content === 'number') {
      return [{ type: 'text', text: String(content) } as DOMNode]
    }

    if (isComponentContent(content)) {
      // As the serializer does for a top-level component: build the chain if
      // it is still a builder, then render it to nodes. The modifiers travel
      // on those nodes' metadata, so the serializer still applies them.
      const candidate = content as {
        build?: () => ComponentInstance
        render?: () => DOMNode | DOMNode[]
      }
      if (active.has(candidate as object)) {
        throw new TypeError(
          'Unsupported TachUI SSR input. Detected cyclic overlay content and cannot be serialized.'
        )
      }
      active.add(candidate as object)
      try {
        const instance =
          typeof candidate.build === 'function' ? candidate.build() : candidate
        const rendered = (instance as ComponentInstance).render()
        // `render()` may hand back another component, as the serializer's own
        // component path allows; recurse so the nesting is followed rather
        // than emitted as an opaque node.
        return (Array.isArray(rendered) ? rendered : [rendered]).flatMap(
          entry =>
            isComponentContent(entry)
              ? this.describeContent(entry, active)
              : [entry]
        )
      } finally {
        // Off the path again, so a sibling may reuse it.
        active.delete(candidate as object)
      }
    }

    // A raw DOM element. There is no DOM server-side, so there is nothing to
    // describe and nothing sensible to invent.
    return []
  }

  /**
   * `layerContent`'s counterpart over nodes: share the one cell once there is
   * more than one item, descending through `display: contents` shells exactly
   * as the DOM walk does.
   *
   * Returns copies rather than writing to the nodes it was handed. The DOM
   * path styles elements it built; these nodes came from a component's own
   * `render()`, and one that returned a cached or shared node would otherwise
   * carry `gridArea` away with it.
   */
  private layerDescribedContent(children: DOMNode[]): DOMNode[] {
    const items: DOMNode[] = []
    collectDescribedGridItems(children, items)
    if (items.length < 2) return children
    return placeDescribedGridItems(children)
  }

  private applyOverlay(
    element: HTMLElement,
    content: OverlayContent
  ): (() => void)[] {
    this.ensurePositionedHost(element)

    // The container is a layer covering the host's box, so the content is
    // proposed the host's bounds the way SwiftUI's `.overlay(alignment:)`
    // proposes them: content sized to 100% fills the host, and content with
    // an intrinsic size sits at the alignment. A shrink-to-fit container
    // centered with 50%/translate cannot do the first — a box-filling child
    // inside it resolves to 0x0.
    //
    // A grid with one definite 100% x 100% cell, not a flexbox. The proposal
    // is advisory, as SwiftUI's is: a grid item keeps a fixed `.frame()` width
    // wider than the host and overflows it, where a flex item would be
    // compressed by `flex-shrink`. A definite cell is what lets a child's
    // `100%` resolve to the host's size.
    const overlayContainer = document.createElement('div')
    this.styleLayer(overlayContainer)

    const cleanup: (() => void)[] = []

    const disposePositioning = this.applyOverlayPositioning(overlayContainer)
    if (disposePositioning) cleanup.push(disposePositioning)

    // Add the overlay to the element before rendering so content mounts into
    // the connected tree (event delegation resolves against a real ancestor).
    element.appendChild(overlayContainer)

    const disposeContent = this.renderContent(overlayContainer, content)
    if (disposeContent) cleanup.push(disposeContent)

    this.layerContent(overlayContainer)

    const disposeObserver = this.observeContent(overlayContainer)
    if (disposeObserver) cleanup.push(disposeObserver)

    // The overlay container is DOM this modifier added, so it goes when the
    // modifier does — after the content's own disposers have run.
    cleanup.push(() => {
      overlayContainer.remove?.()
    })

    return cleanup
  }

  /**
   * Put every item the content rendered in the layer's single cell.
   *
   * Auto-placement would put the second item in an implicit row *below* the
   * `100%` one, outside the host. Sharing the one cell layers them the way
   * SwiftUI layers an overlay's views, and keeps each one's `100%` resolving
   * against the host. Content that wants a list puts a stack inside the
   * overlay, exactly as it would in SwiftUI.
   *
   * The items are not always the layer's own children. `ForEach` and `Show`
   * mount a single `display: contents` shell, which generates no box of its
   * own, so *its* children are the grid items and placing the shell would do
   * nothing. The walk therefore descends through shells and stops at the
   * first element that generates a box.
   *
   * A lone item already lands in that cell, so nothing is written in the
   * common case and the content's markup is left alone.
   */
  private layerContent(overlayContainer: HTMLElement): void {
    const items: HTMLElement[] = []
    this.collectGridItems(overlayContainer, items)
    if (items.length < 2) return

    for (const item of items) {
      if (item.style) item.style.gridArea = '1 / 1'
    }
  }

  private collectGridItems(parent: Element, items: HTMLElement[]): void {
    for (const child of Array.from(parent.children)) {
      if (this.isContentsShell(child)) {
        this.collectGridItems(child, items)
      } else {
        items.push(child as HTMLElement)
      }
    }
  }

  /**
   * An element that generates no box, so its children are the grid items.
   *
   * Read from the inline style rather than the computed one. The shells this
   * exists for set `display: contents` inline — that is how `OwnedContainer`
   * styles itself — and `getComputedStyle` is expensive enough per element to
   * show up in the overlay stress suite. A shell that took its `contents`
   * from a stylesheet would be missed, which is the price of not paying that
   * cost on every overlay.
   */
  private isContentsShell(element: Element): boolean {
    return (element as HTMLElement).style?.display === 'contents'
  }

  /**
   * Keep the layering current as the content changes.
   *
   * A `ForEach` that grows from one row to two produces its new items long
   * after the modifier ran, and nothing about that reaches this modifier —
   * the shell is filled by its own owner. Watching the layer is the only
   * handle on it.
   *
   * Unconditional, because a shell is not the only way content grows: a
   * component whose `render()` returns one root and later two appends its
   * second item straight to the layer, with nothing to distinguish it in
   * advance. The walk stops at the first boxed element, so this stays cheap
   * however deep the content is.
   */
  private observeContent(
    overlayContainer: HTMLElement
  ): (() => void) | undefined {
    if (typeof MutationObserver === 'undefined') return undefined

    const observer = new MutationObserver(() => {
      this.layerContent(overlayContainer)
    })
    // Style writes are attribute mutations, which are not observed, so
    // re-layering cannot retrigger this.
    observer.observe(overlayContainer, { childList: true, subtree: true })
    return () => observer.disconnect()
  }

  /**
   * The layer's fixed styles: everything that does not depend on alignment,
   * offset or the enabled flag.
   *
   * Written through `.style` alone, so it applies equally to a real element
   * and to the plain style-collecting stand-in the server path uses.
   */
  private styleLayer(overlayContainer: HTMLElement): void {
    overlayContainer.style.position = 'absolute'
    overlayContainer.style.top = '0px'
    overlayContainer.style.bottom = '0px'
    // Logical on the inline axis, so the layer's edges track the writing
    // direction the same way the alignment does.
    overlayContainer.style.insetInlineStart = '0px'
    overlayContainer.style.insetInlineEnd = '0px'
    overlayContainer.style.display = 'grid'
    overlayContainer.style.gridTemplateColumns = '100%'
    overlayContainer.style.gridTemplateRows = '100%'
    overlayContainer.style.pointerEvents = 'none' // Allow clicks to pass through by default
  }

  /**
   * Alignment, offset and the enabled flag, resolved once and written to the
   * layer. The client wraps this in an effect when any of them is reactive;
   * the server calls it once, since there is nothing to update.
   */
  private applyResolvedPositioning(overlayContainer: HTMLElement): void {
    const alignmentValue = this.resolveReactive(
      this.properties.alignment,
      'center'
    )
    const sideValue = this.resolveReactive(this.properties.side, undefined)
    const offsetValue = this.resolveReactive(this.properties.offset, undefined)
    const enabledValue = this.resolveReactive(this.properties.enabled, true)

    this.clearPositionStyles(overlayContainer)

    const effectiveSide = sideValue ?? alignmentValue
    const alignmentStyles = this.getOverlayAlignment(effectiveSide)
    Object.assign(overlayContainer.style, alignmentStyles)

    this.applyOffset(overlayContainer, effectiveSide, offsetValue)

    overlayContainer.style.display = enabledValue ? 'grid' : 'none'
  }

  private applyOverlayPositioning(
    overlayContainer: HTMLElement
  ): (() => void) | undefined {
    const applyResolvedPositioning = () =>
      this.applyResolvedPositioning(overlayContainer)

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

  /**
   * Offsets move the layer's edges rather than translating it, so a negative
   * value is honoured (padding would reject it) and an inward move never
   * pushes a host-sized box past the host, which on a scrolling host would
   * have produced scrollable overflow.
   *
   * A numeric offset is an inset from the anchored side, negative moving
   * outward. An `{ x, y }` offset moves the content along the inline axis and
   * down, negative the other way: an inward move shrinks the layer from that
   * edge, an outward move extends it, and on a centered axis the far edge
   * shrinks by twice the offset so the alignment point moves by exactly the
   * offset. Positive `x` is rightward in a left-to-right host and leftward in
   * a right-to-left one, matching the alignment rather than fighting it.
   */
  private applyOffset(
    overlayContainer: HTMLElement,
    side: OverlayAlignment | OverlaySide,
    offset: OverlayOffset | undefined
  ): void {
    const anchors = this.getAnchors(side)

    if (typeof offset === 'number') {
      // Inward from every anchored edge, so a corner is inset on both axes.
      // On an end-anchored axis inward is the negative direction.
      if (anchors.x !== 'center') {
        this.applyAxisOffset(
          overlayContainer,
          'x',
          anchors.x,
          anchors.x === 'start' ? offset : -offset
        )
      }
      if (anchors.y !== 'center') {
        this.applyAxisOffset(
          overlayContainer,
          'y',
          anchors.y,
          anchors.y === 'start' ? offset : -offset
        )
      }
      return
    }

    // `null` is outside the type but reachable from a loosely typed signal;
    // it is ignored like `undefined` rather than thrown from the effect.
    if (typeof offset !== 'object' || offset === null) return

    if (typeof offset.x === 'number') {
      this.applyAxisOffset(overlayContainer, 'x', anchors.x, offset.x)
    }
    if (typeof offset.y === 'number') {
      this.applyAxisOffset(overlayContainer, 'y', anchors.y, offset.y)
    }
  }

  /**
   * Move the content along one axis by `offset` (positive toward the end of
   * the axis) by adjusting the layer's edges on that axis.
   *
   * The inline axis is addressed logically, so an offset lands on the same
   * edge the alignment anchored to whatever the writing direction. Writing
   * `right` for an `end` anchor would move the far edge in a right-to-left
   * host, where `justify-items: end` puts the content on the physical left.
   */
  private applyAxisOffset(
    overlayContainer: HTMLElement,
    axis: 'x' | 'y',
    anchor: 'start' | 'center' | 'end',
    offset: number
  ): void {
    if (!Number.isFinite(offset) || offset === 0) return

    const startEdge = axis === 'x' ? 'insetInlineStart' : 'top'
    const endEdge = axis === 'x' ? 'insetInlineEnd' : 'bottom'

    switch (anchor) {
      case 'start':
        overlayContainer.style[startEdge] = `${offset}px`
        break
      case 'end':
        overlayContainer.style[endEdge] = `${-offset}px`
        break
      case 'center':
        if (offset > 0) {
          overlayContainer.style[startEdge] = `${offset * 2}px`
        } else {
          overlayContainer.style[endEdge] = `${-offset * 2}px`
        }
        break
    }
  }

  /**
   * The anchored end of each axis for an alignment. Looked up with an own
   * property check: a string that happens to name an inherited key
   * (`'constructor'`) would otherwise read through `Object.prototype` and
   * dodge the center fallback.
   */
  private getAnchors(side: OverlayAlignment | OverlaySide): AxisAnchors {
    return Object.prototype.hasOwnProperty.call(ALIGNMENT_ANCHORS, side)
      ? ALIGNMENT_ANCHORS[side as OverlayAlignment]
      : ALIGNMENT_ANCHORS.center
  }

  private clearPositionStyles(overlayContainer: HTMLElement): void {
    overlayContainer.style.top = '0px'
    overlayContainer.style.bottom = '0px'
    overlayContainer.style.insetInlineStart = '0px'
    overlayContainer.style.insetInlineEnd = '0px'
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

  /**
   * Alignment is expressed as the grid item's placement in the layer's one
   * cell, so the layer itself never moves and keeps covering the host.
   */
  private getOverlayAlignment(
    alignment: OverlayAlignment | OverlaySide
  ): Record<string, string> {
    const anchors = this.getAnchors(alignment)
    return { justifyItems: anchors.x, alignItems: anchors.y }
  }
}

/** Copies of `children`, with every grid item placed in the layer's one cell. */
function placeDescribedGridItems(children: DOMNode[]): DOMNode[] {
  return children.map(child => {
    if (child.type !== 'element') return child
    if (isDescribedContentsShell(child)) {
      return {
        ...child,
        children: placeDescribedGridItems(child.children ?? []),
      }
    }
    const props = (child.props ?? {}) as Record<string, unknown>
    const style = (props.style ?? {}) as Record<string, unknown>
    return { ...child, props: { ...props, style: { ...style, gridArea: '1 / 1' } } }
  })
}

/**
 * Whether the layer can be built as DOM in this element.
 *
 * Both halves matter: there is no `document` to create the layer with on a
 * bare server, and the SSR serializer's stand-in element has no `appendChild`
 * to put it in even where a DOM shim exists.
 */
function canBuildLayer(element: unknown): boolean {
  return (
    typeof document !== 'undefined' &&
    typeof (element as { appendChild?: unknown })?.appendChild === 'function'
  )
}

/** A node that generates no box, so its children are the grid items. */
function isDescribedContentsShell(node: DOMNode): boolean {
  const style = (node.props as { style?: Record<string, unknown> } | undefined)
    ?.style
  return style?.display === 'contents'
}

function collectDescribedGridItems(
  children: DOMNode[],
  items: DOMNode[]
): void {
  for (const child of children) {
    if (child.type !== 'element') continue
    if (isDescribedContentsShell(child)) {
      collectDescribedGridItems(child.children ?? [], items)
    } else {
      items.push(child)
    }
  }
}

/**
 * Creates an overlay modifier that overlays content on top of the view
 */
export function overlay(
  content: OverlayContent,
  alignmentOrOptions:
    | OverlayAlignment
    | Signal<OverlayAlignment>
    | Omit<OverlayOptions, 'content'> = 'center'
): OverlayModifier {
  // A signal is a function, so the object check alone tells the options
  // form apart from both the string and the signal forms.
  if (typeof alignmentOrOptions === 'object' && alignmentOrOptions !== null) {
    return new OverlayModifier({
      content,
      ...alignmentOrOptions,
    })
  }

  return new OverlayModifier({
    content,
    alignment: alignmentOrOptions,
  })
}
