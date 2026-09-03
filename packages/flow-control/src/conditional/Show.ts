/**
 * Show component for conditional rendering
 *
 * Reactive implementation that works with TachUI's reactive architecture
 */

import { untrack } from '@tachui/core'
import type { ComponentInstance, DOMNode } from '@tachui/core'
import { DOMRenderer } from '@tachui/core'

export interface ShowProps {
  /**
   * Condition to determine if content should be shown
   */
  when: boolean | (() => boolean)

  /**
   * Content to render when condition is true
   */
  children: ComponentInstance

  /**
   * Optional fallback content when condition is false
   */
  fallback?: ComponentInstance
}

/**
 * Show component implementation that integrates with TachUI's reactive system
 */
export class ShowComponent implements ComponentInstance<ShowProps> {
  public readonly type = 'component' as const
  public readonly id: string
  public readonly props: ShowProps
  public mounted = false
  public cleanup: (() => void)[] = []
  private readonly renderer = new DOMRenderer()
  private currentBranchNodes: DOMNode[] = []
  private container: HTMLElement | undefined
  // The container as this component's own renderer sees it. Holds the record of
  // what is mounted, which is what lets a re-render reconcile against the
  // mounted branch instead of rebuilding it.
  private containerNode: DOMNode | undefined
  private mountedCondition: boolean | undefined
  // Stable across renders so the element it is registered against collects one
  // entry rather than one per render of the enclosing component.
  private readonly disposeSelf = () => this.dispose()

  constructor(props: ShowProps) {
    this.props = props
    this.id = `show-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Evaluate the condition
   */
  private evaluateCondition(): boolean {
    const { when } = this.props

    if (typeof when === 'boolean') {
      return when
    }

    if (typeof when === 'function') {
      return when()
    }

    return false
  }

  /**
   * Get the content to render based on condition
   */
  private getContent(): ComponentInstance | null {
    const condition = this.evaluateCondition()

    const { children, fallback } = this.props
    const content = condition ? children : fallback

    if (!content) {
      return null
    }

    return content
  }

  /**
   * Render the Show component.
   *
   * A reactive condition produces an *owned* container: this component fills it
   * and the renderer mounts it without reconciling its children. That single
   * writer is the whole point. When the container was an ordinary node, both
   * this component (patching the element from an effect) and the mounting
   * renderer (reconciling `children` against its own record of them) wrote to
   * it, and the two records drifted apart the moment the branch changed without
   * a re-render — the next re-render then paired the incoming branch against
   * elements that were no longer mounted and left both branches in the DOM
   * (#318).
   *
   * The subscription goes over as `reactiveElement` rather than being created
   * here. `render()` runs on every render of the enclosing element, so an
   * effect created here is created again per render, and it is parented to that
   * render's execution owner, which disposes it when the pass re-runs. The
   * renderer owns the binding instead: it retires the previous one when it
   * adopts this node's successor, and rebinds one that outlived its pass, so
   * exactly one effect is maintaining the container at any time.
   */
  render(): DOMNode[] {
    const { when } = this.props

    const isReactive = typeof when === 'function'

    if (!isReactive) {
      // Static condition - simple render
      return this.renderBranch()
    }

    // No DOM to own. An owned node serializes as its element, so emitting one
    // without a DOM to build it in would serialize as an empty shell (see
    // `DOMNode.owned`); the branch goes over as ordinary children instead, for
    // the serializer to walk. Untracked because a read here would subscribe the
    // enclosing component's render.
    if (typeof document === 'undefined') {
      return [
        {
          type: 'element',
          tag: 'div',
          props: { style: { display: 'contents' } },
          children: untrack(() => this.renderBranch()),
        },
      ]
    }

    return [
      {
        type: 'element',
        tag: 'div',
        // Describes the shell only: the renderer applies neither props nor
        // children to an owned element, so the container styles itself in
        // `ensureContainer`. Kept so the node still serializes correctly if it
        // ever reaches the empty-shell path.
        props: { style: { display: 'contents' } },
        children: [],
        element: this.ensureContainer(),
        owned: true,
        reactiveElement: () => this.reconcile(),
        dispose: this.disposeSelf,
      },
    ]
  }

  /**
   * The container element, created once and kept for the life of the component.
   *
   * Stable identity is what makes a re-render idempotent: the node handed over
   * on the second render carries the same element as the first, so the
   * reconciler pairs the two and mounts nothing new. It also keeps modifiers
   * applied to this component on the element they were applied to, which a
   * swapped element would lose.
   */
  private ensureContainer(): HTMLElement {
    if (!this.container) {
      const element = document.createElement('div')
      // Owned, so the renderer never applies this node's props.
      element.style.display = 'contents'
      this.container = element
    }
    return this.container
  }

  /**
   * Render the current branch and put it in the container.
   *
   * Runs inside the renderer's binding for this node, so its reads — the
   * condition, and whatever the branch reads while rendering — are the
   * dependencies that bring it back. Each run renders the branch afresh rather
   * than reusing the previous nodes: a branch whose own `render()` reads a
   * signal is only correct if it is re-run when that signal changes, and the
   * binding cannot tell that case apart from being re-created by the renderer.
   *
   * Rendering afresh is not the same as rebuilding the DOM. The new nodes are
   * reconciled against the mounted ones, so a run that produces the same shape
   * — the common one, since most reasons to re-run leave the branch alone —
   * updates elements in place and moves nothing.
   */
  private reconcile(): Element {
    const container = this.ensureContainer()
    const condition = this.evaluateCondition()

    if (condition !== this.mountedCondition) {
      // A branch swap is a teardown, not an update. Reconciling the incoming
      // branch against the outgoing one would pair elements by position with no
      // regard for what they are, so a `span` from one branch would be handed to
      // the other carrying whatever a modifier had left on it.
      this.disposeNodes(this.currentBranchNodes)
      this.currentBranchNodes = []
      this.forgetMountedBranch(container)
      this.mountedCondition = condition
    }

    const { children, fallback } = this.props
    const content = condition ? children : fallback
    const rendered = content ? content.render() : []
    const nodes = (Array.isArray(rendered) ? rendered : [rendered]) as DOMNode[]

    this.currentBranchNodes = nodes
    this.mountBranch(container, nodes)
    return container
  }

  /**
   * Render the current branch as plain nodes, for a caller that mounts them
   * itself (a static condition, or a server render with no DOM to own).
   */
  private renderBranch(): DOMNode[] {
    const content = this.getContent()
    const rendered = content ? content.render() : []
    return (Array.isArray(rendered) ? rendered : [rendered]) as DOMNode[]
  }

  private mountBranch(container: HTMLElement, nodes: DOMNode[]): void {
    const containerNode = (this.containerNode ??= {
      type: 'element',
      tag: 'div',
      props: {},
      children: [],
      element: container,
    })

    containerNode.children = nodes
    this.renderer.render(containerNode)
  }

  /**
   * Drop the record of the mounted branch, and the branch itself.
   *
   * The nodes are already disposed by the time this runs, which leaves their
   * elements in place — disposal is not removal — so the container is emptied
   * here rather than left for the next reconciliation to sort out.
   */
  private forgetMountedBranch(container: HTMLElement): void {
    if (this.containerNode) {
      this.containerNode.children = []
      delete (this.containerNode as any).__renderedChildren
    }
    container.replaceChildren()
  }

  private disposeNodes(nodes: DOMNode[]): void {
    nodes.forEach(node => {
      if (!node) return

      if (node.children && Array.isArray(node.children)) {
        this.disposeNodes(node.children)
      }

      // A branch this renderer mounted goes back through it, so its
      // per-element cleanups run and it leaves the renderer's rendered-node
      // set. Calling `node.dispose` alone leaves reactive prop effects and
      // `reactiveElement` bindings running and the set growing per toggle.
      if (this.renderer.hasNode(node)) {
        this.renderer.disposeNode(node)
      } else if (typeof node.dispose === 'function') {
        // Never rendered — a branch swapped out before it was mounted.
        node.dispose()
      }
    })
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    this.cleanup.forEach(fn => fn())
    this.disposeNodes(this.currentBranchNodes)
    this.currentBranchNodes = []
    if (this.container) this.forgetMountedBranch(this.container)
    this.mountedCondition = undefined
    this.cleanup = []
  }
}

/**
 * Create Show component for conditional rendering
 */
export function Show(props: ShowProps): ShowComponent {
  return new ShowComponent(props)
}

/**
 * Convenience function for simple conditional rendering
 */
export function When(
  condition: boolean | (() => boolean),
  content: ComponentInstance
): ShowComponent {
  return Show({ when: condition, children: content })
}

/**
 * Convenience function for negated conditional rendering
 */
export function Unless(
  condition: boolean | (() => boolean),
  content: ComponentInstance
): ShowComponent {
  // Negate the condition for unless semantics
  const negatedCondition =
    typeof condition === 'function' ? () => !condition() : !condition

  return Show({ when: negatedCondition, children: content })
}
