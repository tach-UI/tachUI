/**
 * CSS Classes Enhancement - Enhanced Renderer
 *
 * Enhanced DOM renderer that supports CSS class integration
 * while maintaining compatibility with existing functionality.
 */
import type { Signal } from '../reactive/types'
import type { DOMNode } from '../runtime/types'
import type { DOMNodeWithClasses } from './dom-integration'
/**
 * Enhanced renderer mixin for CSS class support
 * This can be mixed into the existing DirectDOMRenderer
 */
export interface CSSClassRendererMixin {
  /**
   * Apply CSS classes to an element during creation
   */
  applyCSSClasses(element: Element, node: DOMNodeWithClasses): void
  /**
   * Process className prop and CSS classes together
   */
  processElementClasses(element: Element, node: DOMNodeWithClasses): void
}
/**
 * CSS class renderer mixin implementation
 */
export declare const cssClassRendererMixin: CSSClassRendererMixin
/**
 * Function to enhance any renderer with CSS class support
 */
export declare function enhanceRendererWithCSSClasses<
  T extends {
    createElement: (node: DOMNode) => Element
  },
>(renderer: T): T & CSSClassRendererMixin
/**
 * Utility function to create a CSS class-aware DOM node
 */
export declare function createCSSClassDOMNode(
  tag: string,
  props?: Record<string, any>,
  children?: DOMNode[],
  cssClasses?: string[] | Signal<string>
): DOMNodeWithClasses
/**
 * Helper to check if a DOMNode has CSS class support
 */
export declare function hasCSSClassSupport(
  node: DOMNode
): node is DOMNodeWithClasses
//# sourceMappingURL=enhanced-renderer.d.ts.map
