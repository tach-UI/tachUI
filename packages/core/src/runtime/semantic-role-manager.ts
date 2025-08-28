/**
 * Semantic Role Manager - Automatic ARIA Role Application
 * 
 * Manages automatic application of ARIA roles for semantic HTML tags
 * while respecting explicit developer choices and context sensitivity.
 */

import { 
  SEMANTIC_TAG_ROLES, 
  getElementOverrideConfig,
  type SemanticRoleInfo
} from './element-override'
import { DevelopmentWarnings } from './development-warnings'

export class SemanticRoleManager {
  private static instance: SemanticRoleManager

  static getInstance(): SemanticRoleManager {
    if (!SemanticRoleManager.instance) {
      SemanticRoleManager.instance = new SemanticRoleManager()
    }
    return SemanticRoleManager.instance
  }

  /**
   * Apply semantic ARIA attributes to an element based on its tag
   */
  applySemanticAttributes(
    element: HTMLElement, 
    tag: string, 
    existingAria?: Record<string, string>
  ): void {
    const config = getElementOverrideConfig()
    
    // Global config: can disable all automatic ARIA role application
    if (!config.autoApplySemanticRoles) return

    const semanticInfo = SEMANTIC_TAG_ROLES.get(tag)
    
    // Per-tag config: only apply if applyARIA is true for this specific tag
    if (!semanticInfo || !semanticInfo.applyARIA) return

    // Always respect explicit ARIA attributes from .aria() modifier
    if (existingAria?.role) {
      if (config.warnOnSemanticIssues) {
        DevelopmentWarnings.warnProblematicCombination(
          'SemanticRole', 
          tag, 
          `ARIA role '${existingAria.role}' overrides semantic role '${semanticInfo.role}'`, 
          'info'
        )
      }
      return
    }

    // Don't override existing role attribute
    if (element.hasAttribute('role')) {
      if (config.warnOnSemanticIssues) {
        DevelopmentWarnings.warnProblematicCombination(
          'SemanticRole', 
          tag, 
          `Existing role attribute overrides semantic role '${semanticInfo.role}'`, 
          'info'
        )
      }
      return
    }

    // Safe to auto-apply the semantic role
    element.setAttribute('role', semanticInfo.role)
    
    if (config.warnOnSemanticIssues) {
      DevelopmentWarnings.infoSemanticRole(tag, semanticInfo.role)
    }
  }

  /**
   * Get semantic role information for a tag
   */
  getSemanticRole(tag: string): SemanticRoleInfo | undefined {
    return SEMANTIC_TAG_ROLES.get(tag)
  }

  /**
   * Check if a tag has automatic ARIA role application enabled
   */
  hasAutoARIA(tag: string): boolean {
    const semanticInfo = SEMANTIC_TAG_ROLES.get(tag)
    return semanticInfo ? semanticInfo.applyARIA : false
  }

  /**
   * Get all tags that support automatic ARIA roles
   */
  getAutoARIATags(): string[] {
    return Array.from(SEMANTIC_TAG_ROLES.entries())
      .filter(([, info]) => info.applyARIA)
      .map(([tag]) => tag)
  }

  /**
   * Apply semantic attributes during DOM node creation
   * This is called by the renderer when creating elements
   */
  processElementNode(
    element: HTMLElement,
    tag: string,
    componentMetadata?: any,
    existingAria?: Record<string, string>
  ): void {
    // Apply semantic roles
    this.applySemanticAttributes(element, tag, existingAria)

    // Store metadata for debugging
    if (componentMetadata && process.env.NODE_ENV !== 'production') {
      const semanticInfo = this.getSemanticRole(tag)
      if (semanticInfo) {
        element.setAttribute('data-tachui-semantic', JSON.stringify({
          originalComponent: componentMetadata.originalType,
          overriddenTo: tag,
          semanticRole: semanticInfo.role,
          autoApplied: semanticInfo.applyARIA
        }))
      }
    }
  }
}

// Global instance
export const semanticRoleManager = SemanticRoleManager.getInstance()

// Convenience functions
export const applySemanticAttributes = (
  element: HTMLElement, 
  tag: string, 
  existingAria?: Record<string, string>
) => semanticRoleManager.applySemanticAttributes(element, tag, existingAria)

export const getSemanticRole = (tag: string) => semanticRoleManager.getSemanticRole(tag)
export const hasAutoARIA = (tag: string) => semanticRoleManager.hasAutoARIA(tag)