/**
 * Show component for conditional rendering
 *
 * Reactive implementation that works with TachUI's reactive architecture
 */

import { createEffect, createRoot } from '@tachui/core'
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
   * Render the Show component with self-contained reactivity like text() function
   */
  render(): DOMNode[] {
    const { when } = this.props

    const isReactive = typeof when === 'function'

    if (!isReactive) {
      // Static condition - simple render
      const content = this.getContent()
      if (!content) return []

      const rendered = content.render()
      return Array.isArray(rendered) ? rendered : [rendered]
    }

    // Ensure prior render cleanups do not accumulate across repeated renders.
    this.dispose()

    // Reactive condition - always create reactive container for consistency
    const containerNode: DOMNode = {
      type: 'element',
      tag: 'div',
      props: {
        style: { display: 'contents' }, // Make container invisible
      },
      children: [],
      dispose: undefined,
    }

    let disposeRoot = () => {}
    createRoot(dispose => {
      disposeRoot = dispose
      createEffect(() => {
        const condition = this.evaluateCondition()
        const { children, fallback } = this.props
        const content = condition ? children : fallback

        // Dispose previously rendered branch nodes/effects before swapping branches.
        this.disposeNodes(this.currentBranchNodes)

        if (content) {
          const rendered = content.render()
          const nodes = Array.isArray(rendered) ? rendered : [rendered]
          this.currentBranchNodes = nodes
          containerNode.children = nodes
        } else {
          this.currentBranchNodes = []
          containerNode.children = []
        }

        // Update DOM if already rendered
        if (
          containerNode.element &&
          containerNode.element instanceof HTMLElement
        ) {
          this.updateContainerDOM(containerNode.element, containerNode.children)
        }
      })
    })

    this.cleanup = [disposeRoot]

    containerNode.dispose = () => this.dispose()

    return [containerNode]
  }

  /**
   * Update the container DOM element with new children using TachUI's renderer
   */
  private updateContainerDOM(
    container: HTMLElement,
    children: DOMNode[]
  ): void {
    const renderedChildren = children.map(
      child => this.renderer.render(child) as Element | Text | Comment
    )
    container.replaceChildren(...renderedChildren)
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
