/**
 * Semantic Role Manager - Automatic ARIA Role Application
 *
 * Manages automatic application of ARIA roles for semantic HTML tags
 * while respecting explicit developer choices and context sensitivity.
 */
import { type SemanticRoleInfo } from './element-override'
export declare class SemanticRoleManager {
  private static instance
  static getInstance(): SemanticRoleManager
  /**
   * Apply semantic ARIA attributes to an element based on its tag
   */
  applySemanticAttributes(
    element: HTMLElement,
    tag: string,
    existingAria?: Record<string, string>
  ): void
  /**
   * Get semantic role information for a tag
   */
  getSemanticRole(tag: string): SemanticRoleInfo | undefined
  /**
   * Check if a tag has automatic ARIA role application enabled
   */
  hasAutoARIA(tag: string): boolean
  /**
   * Get all tags that support automatic ARIA roles
   */
  getAutoARIATags(): string[]
  /**
   * Apply semantic attributes during DOM node creation
   * This is called by the renderer when creating elements
   */
  processElementNode(
    element: HTMLElement,
    tag: string,
    componentMetadata?: any,
    existingAria?: Record<string, string>
  ): void
}
export declare const semanticRoleManager: SemanticRoleManager
export declare const applySemanticAttributes: (
  element: HTMLElement,
  tag: string,
  existingAria?: Record<string, string>
) => void
export declare const getSemanticRole: (
  tag: string
) => SemanticRoleInfo | undefined
export declare const hasAutoARIA: (tag: string) => boolean
//# sourceMappingURL=semantic-role-manager.d.ts.map
