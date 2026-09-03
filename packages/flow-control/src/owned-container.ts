/**
 * The container element a flow-control component owns and fills itself.
 *
 * `Show` and `ForEach` need the same thing: one element that the mounting
 * renderer puts on the page but does not reconcile into, filled by the
 * component and kept current by a subscription the renderer owns. Both had
 * their own copy of it, which is how #318 happened twice — so the contract is
 * stated once here, and the two components supply only what differs.
 *
 * Three properties this is responsible for, none of them obvious:
 *
 * - **One writer.** The node is `owned`, so the renderer mounts the element
 *   without reconciling its declared `children`. Two writers into one element
 *   means two records of what is mounted, and the moment they disagree the next
 *   re-render diffs against the stale one (#318).
 * - **One subscription, owned by the renderer.** It goes over as
 *   `reactiveElement` rather than being created in `render()`, which runs on
 *   every render of the enclosing element and is parented to a scope that dies
 *   with the pass. The renderer retires the previous binding when it adopts a
 *   successor and rebinds one that outlived its pass.
 * - **One element, for the life of the component.** That is what makes a
 *   re-render idempotent — the node handed over on the second render carries
 *   the same element as the first, so the reconciler pairs the two and mounts
 *   nothing new — and it keeps modifiers on the element they were applied to.
 */

import { untrack } from '@tachui/core'
import type { DOMNode } from '@tachui/core'

export interface OwnedContainerOptions {
  /**
   * Put the current content in the element. Called by the renderer's binding,
   * so its reads are the dependencies that bring it back.
   */
  fill: (element: HTMLElement) => void

  /**
   * The current content as ordinary nodes, for a server render with no DOM to
   * own. Read untracked, so it cannot subscribe the enclosing component.
   */
  serverChildren: () => DOMNode[]

  /** The component's own teardown. Runs once per disposal. */
  teardown: () => void
}

/** Kept out of the flow so both the owned element and the shell agree on it. */
const CONTENTS_STYLE = { display: 'contents' } as const

export class OwnedContainer {
  private element: HTMLElement | undefined
  private node: DOMNode | undefined
  private disposing = false
  // Stable across renders so the element it is registered against collects one
  // entry rather than one per render of the enclosing component.
  private readonly disposeSelf = () => this.dispose()

  constructor(private readonly options: OwnedContainerOptions) {}

  /**
   * The node to hand back from the component's `render()`.
   */
  render(): DOMNode[] {
    // No DOM to own. An owned node serializes as its element, so emitting one
    // without a DOM to build it in would serialize as an empty shell (see
    // `DOMNode.owned`); the content goes over as ordinary children instead, for
    // the serializer to walk.
    if (typeof document === 'undefined') {
      return [
        {
          type: 'element',
          tag: 'div',
          props: { style: { ...CONTENTS_STYLE } },
          children: untrack(() => this.options.serverChildren()),
        },
      ]
    }

    const node: DOMNode = {
      type: 'element',
      tag: 'div',
      // Describes the shell only: the renderer applies neither props nor
      // children to an owned element, so the element styles itself in
      // `ensureElement`. Kept so the node still serializes correctly if it ever
      // reaches the empty-shell path.
      props: { style: { ...CONTENTS_STYLE } },
      children: [],
      element: this.ensureElement(),
      owned: true,
      reactiveElement: () => {
        const element = this.ensureElement()
        this.options.fill(element)
        return element
      },
      dispose: this.disposeSelf,
    }

    // Held for `dispose`, which has no other handle on the renderer's binding.
    this.node = node
    return [node]
  }

  /** The element, if one has been built. */
  peek(): HTMLElement | undefined {
    return this.element
  }

  ensureElement(): HTMLElement {
    if (!this.element) {
      const element = document.createElement('div')
      // Owned, so the renderer never applies the node's props.
      Object.assign(element.style, CONTENTS_STYLE)
      this.element = element
    }
    return this.element
  }

  /**
   * Tear the component down, whoever asked.
   *
   * Two callers with opposite directions. The renderer reaches here when the
   * element it registered this against is removed, having already dealt with
   * the binding; the component's own `dispose()` reaches here with the binding
   * still live, and retiring it is the whole point — otherwise the next change
   * to the condition or the collection refills an element that was just
   * emptied, and the subscription outlives the component that declared it.
   *
   * The two meet in the middle: retiring runs the renderer's composite, which
   * calls back in here, and the guard makes that the same single disposal
   * rather than a second one.
   */
  dispose(): void {
    if (this.disposing) return
    this.disposing = true

    try {
      this.retireBinding()
      this.options.teardown()
    } finally {
      this.disposing = false
    }
  }

  /**
   * Retire the renderer's binding for the node it last mounted.
   *
   * The renderer replaces an owned node's `dispose` with a composite of the
   * binding's disposer and the one it was given, which is the documented handle
   * for an owner that knows only the node (see `bindOwnedElement`). An
   * unreplaced `dispose` means the node never reached a renderer, so there is
   * no binding to retire.
   */
  private retireBinding(): void {
    const node = this.node
    this.node = undefined

    if (!node || !node.dispose || node.dispose === this.disposeSelf) return
    node.dispose()
  }
}
