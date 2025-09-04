/**
 * Direct DOM Renderer (Phase 3.1.1)
 *
 * Efficient DOM manipulation without virtual DOM overhead.
 * Provides surgical DOM updates integrated with the reactive system.
 */
import type { ComponentInstance, DOMNode } from './types'
/**
 * Direct DOM renderer for efficient DOM manipulation
 */
export declare class DOMRenderer {
  private nodeMap
  private cleanupMap
  private renderedNodes
  /**
   * Render a DOM node to an actual DOM element
   */
  render(
    node: DOMNode | DOMNode[],
    container?: Element
  ): Element | Text | Comment | DocumentFragment
  /**
   * Render a single DOM node
   */
  private renderSingle
  /**
   * Render multiple nodes as a document fragment
   */
  private renderFragment
  /**
   * Create a DOM element with props and children
   */
  private createElement
  /**
   * Apply debug attributes to DOM element if debug mode is enabled
   */
  private applyDebugAttributes
  /**
   * Create a text node
   */
  private createTextNode
  /**
   * Create a comment node
   */
  private createComment
  /**
   * Apply props to a DOM element with reactive updates
   */
  private applyProps
  /**
   * Apply a single prop to an element
   */
  private applyProp
  /**
   * Set a property on an element
   */
  private setElementProp
  /**
   * Apply className with reactive updates
   */
  private applyClassName
  /**
   * Normalize className value
   */
  private normalizeClassName
  /**
   * Apply styles with reactive updates
   */
  private applyStyle
  /**
   * Set styles on an element
   */
  private setElementStyles
  /**
   * Apply event listener
   */
  private applyEventListener
  /**
   * Add cleanup function for an element
   */
  private addCleanup
  /**
   * Update an existing DOM node
   */
  updateNode(node: DOMNode, newProps?: Record<string, any>): void
  /**
   * Remove a DOM node and run cleanup
   */
  removeNode(node: DOMNode): void
  /**
   * Create reactive text content
   */
  createReactiveText(textAccessor: () => string): Text
  /**
   * Create reactive element with dynamic props
   */
  createReactiveElement(
    tag: string,
    propsAccessor: () => Record<string, any>,
    children?: DOMNode[]
  ): Element
  /**
   * Apply modifiers to a DOM element
   */
  private applyModifiersToElement
  /**
   * Cleanup all tracked elements
   */
  cleanup(): void
}
/**
 * Render a component instance to DOM
 */
export declare function renderComponent(
  instance: ComponentInstance,
  container: Element
): () => void
/**
 * Create a DOM node helper
 */
export declare function h(
  tag: string,
  props?: Record<string, any> | null,
  ...children: (DOMNode | string | number)[]
): DOMNode
/**
 * Create a text node helper
 */
export declare function text(content: string | (() => string)): DOMNode
//# sourceMappingURL=renderer.d.ts.map
