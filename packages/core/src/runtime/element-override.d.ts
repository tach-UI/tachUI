/**
 * Element Override System - Tag Specification Enhancement
 *
 * Enables components to override their default HTML tags for semantic markup,
 * improving SEO and accessibility while preserving all styling and functionality.
 */
export interface ElementOverrideProps {
  element?: string
}
export interface ValidationResult {
  valid: boolean
  warnings?: Warning[]
  severity?: 'error' | 'warning' | 'info'
  warning?: string
  semanticRole?: SemanticRoleInfo
}
export interface Warning {
  message: string
  severity: 'error' | 'warning' | 'info'
}
export interface SemanticRoleInfo {
  role: string
  applyARIA: boolean
}
export interface ElementOverrideConfig {
  autoApplySemanticRoles: boolean
  warnOnOverrides: boolean
  warnOnSemanticIssues: boolean
  validateTags: boolean
  allowInvalidTags: boolean
}
export declare const VALID_HTML_TAGS: Set<string>
export declare const SEMANTIC_TAG_ROLES: Map<string, SemanticRoleInfo>
/**
 * Component Eligibility Matrix - Warning Levels
 * Based on design/Enh-TagSpecification.md Component Eligibility Matrix
 */
export declare const COMPONENT_ELIGIBILITY: Map<
  string,
  {
    warningLevel: 'none' | 'info' | 'warning'
    idealTags?: string[]
    problematicTags?: string[]
  }
>
/**
 * Check if an element override should show a warning based on component eligibility matrix
 */
export declare function shouldWarnOnOverride(
  componentType: string,
  tag: string
): boolean
/**
 * The applyARIA flag controls whether the framework automatically adds
 * the corresponding ARIA role attribute to elements with semantic tags.
 *
 * applyARIA: true  - Always add the ARIA role (e.g., <nav> gets role="navigation")
 * applyARIA: false - Don't automatically add ARIA role due to context sensitivity
 *
 * Examples:
 * - <nav> always represents navigation → applyARIA: true
 * - <header> could be page banner OR section header → applyARIA: false
 * - <footer> could be page footer OR article footer → applyARIA: false
 *
 * When applyARIA is false, developers should manually specify appropriate
 * ARIA roles using the .aria() modifier when semantic meaning is ambiguous.
 */
export declare class ElementTagValidator {
  static validate(tag: string, componentType: string): ValidationResult
  private static checkSemanticWarnings
}
export declare function configureElementOverrides(
  config: Partial<ElementOverrideConfig>
): void
export declare function getElementOverrideConfig(): ElementOverrideConfig
/**
 * Process element override for a component with validation and warnings
 */
export declare function processElementOverride(
  componentType: string,
  defaultTag: string,
  overrideTag?: string
): {
  tag: string
  validation: ValidationResult
}
/**
 * Create element override validation helper for components
 */
export declare function createElementOverrideValidator(
  componentType: string,
  defaultTag: string
): (overrideTag?: string) => {
  tag: string
  validation: ValidationResult
}
//# sourceMappingURL=element-override.d.ts.map
