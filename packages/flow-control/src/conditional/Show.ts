/**
 * Show component for conditional rendering
 *
 * Reactive implementation that works with TachUI's reactive architecture
 */

import {
  createEffect,
  createRoot,
  isComputed,
  isSignal,
} from '@tachui/core/reactive'
import type { ComponentInstance, DOMNode } from '@tachui/core/runtime/types'
import { DOMRenderer } from '@tachui/core/runtime/renderer'

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
    } else if (typeof when === 'function') {
      return when()
    } else if (isSignal(when) || isComputed(when)) {
      return (when as () => boolean)()
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
    // Check if condition is reactive
    const { when } = this.props
    const isReactive =
      typeof when === 'function' || isSignal(when) || isComputed(when)

    if (!isReactive) {
      // Static condition - simple render
      const content = this.getContent()
      if (!content) return []

      const rendered = content.render()
      return Array.isArray(rendered) ? rendered : [rendered]
    }

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

    // Create reactive effect that updates the container
    const cleanup = createRoot(() => {
      const effect = createEffect(() => {
        const content = this.getContent()

        if (content) {
          const rendered = content.render()
          const nodes = Array.isArray(rendered) ? rendered : [rendered]
          containerNode.children = nodes
        } else {
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

      return () => effect.dispose()
    })

    containerNode.dispose = cleanup

    // Initialize with current content
    const initialContent = this.getContent()
    if (initialContent) {
      const rendered = initialContent.render()
      const nodes = Array.isArray(rendered) ? rendered : [rendered]
      containerNode.children = nodes
    }

    return [containerNode]
  }

  /**
   * Update the container DOM element with new children using TachUI's renderer
   */
  private updateContainerDOM(
    container: HTMLElement,
    children: DOMNode[]
  ): void {
    // Clear existing content
    container.innerHTML = ''

    // Use TachUI's renderer to properly handle modifiers and reactivity
    const renderer = new DOMRenderer()

    // Render new content using TachUI's renderer which handles modifiers
    children.forEach(child => {
      try {
        const element = renderer.render(child)
        if (element) {
          container.appendChild(element)
        }
      } catch (error) {
        console.error('Error rendering Show component child:', error)
      }
    })
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    this.cleanup.forEach(fn => {
      try {
        fn()
      } catch (error) {
        console.error('Show component cleanup error:', error)
      }
    })
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
