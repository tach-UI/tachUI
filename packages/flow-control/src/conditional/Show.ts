/**
 * Show component for conditional rendering
 *
 * Reactive implementation that works with TachUI's reactive architecture
 */

import type { ComponentInstance, DOMNode } from '@tachui/core'
import { DOMRenderer } from '@tachui/core'
import { OwnedContainer } from '../owned-container'

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
  private readonly container = new OwnedContainer({
    fill: element => this.reconcile(element),
    serverChildren: () => this.renderBranch(),
    teardown: () => this.teardown(),
  })
  // The container as this component's own renderer sees it. Holds the record of
  // what is mounted, which is what lets a re-render reconcile against the
  // mounted branch instead of rebuilding it.
  private containerRecord: DOMNode | undefined
  private mountedCondition: boolean | undefined

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
   * A reactive condition produces an owned container: this component fills it
   * and the renderer mounts it without reconciling its children, which is what
   * keeps the two from writing to the same element behind each other's backs
   * (#318). See `OwnedContainer` for the contract.
   */
  render(): DOMNode[] {
    const { when } = this.props

    if (typeof when !== 'function') {
      // Static condition - simple render
      return this.renderBranch()
    }

    return this.container.render()
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
  private reconcile(container: HTMLElement): void {
    const condition = this.evaluateCondition()

    if (condition !== this.mountedCondition) {
      // A branch swap is a teardown, not an update. Reconciling the incoming
      // branch against the outgoing one would pair elements by position with no
      // regard for what they are, so a `span` from one branch would be handed to
      // the other carrying whatever a modifier had left on it.
      this.disposeNodes(this.currentBranchNodes)
      this.currentBranchNodes = []
      this.clearMountedBranch(container)
      this.mountedCondition = condition
    }

    const { children, fallback } = this.props
    const content = condition ? children : fallback
    const rendered = content ? content.render() : []
    const nodes = (Array.isArray(rendered) ? rendered : [rendered]) as DOMNode[]

    this.currentBranchNodes = nodes
    this.mountBranch(container, nodes)
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
    const containerRecord = (this.containerRecord ??= {
      type: 'element',
      tag: 'div',
      props: {},
      children: [],
      element: container,
    })

    containerRecord.children = nodes
    this.renderer.render(containerRecord)
  }

  /**
   * Drop the record of the mounted branch, and the branch itself.
   *
   * The record goes back through the renderer that made it rather than being
   * edited in place: what it remembers is the renderer's business, and it is
   * also holding a slot in that renderer's rendered-node set, which a record
   * per branch swap would grow. `mountBranch` starts a fresh one.
   *
   * The branch nodes are already disposed by the time this runs, which leaves
   * their elements in place — disposal is not removal — so the container is
   * emptied here rather than left for the next reconciliation to sort out.
   */
  private clearMountedBranch(container: HTMLElement): void {
    if (this.containerRecord) {
      this.renderer.disposeNode(this.containerRecord)
      this.containerRecord = undefined
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
   * Cleanup resources.
   *
   * Routed through the container so that disposing a *mounted* component
   * retires the renderer's binding as well. Clearing the branch alone would
   * leave that subscription live, and the next change to the condition would
   * refill the element this just emptied.
   */
  dispose(): void {
    this.container.dispose()
  }

  private teardown(): void {
    this.cleanup.forEach(fn => fn())
    this.disposeNodes(this.currentBranchNodes)
    this.currentBranchNodes = []
    const element = this.container.peek()
    if (element) this.clearMountedBranch(element)
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
