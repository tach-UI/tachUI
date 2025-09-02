/**
 * Element Override System - Tag Specification Enhancement
 *
 * Enables components to override their default HTML tags for semantic markup,
 * improving SEO and accessibility while preserving all styling and functionality.
 */

// import { DevelopmentWarnings } from './development-warnings'

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
  // Accessibility
  autoApplySemanticRoles: boolean

  // Development warnings
  warnOnOverrides: boolean
  warnOnSemanticIssues: boolean

  // Validation
  validateTags: boolean
  allowInvalidTags: boolean
}

// Valid HTML tag validation
export const VALID_HTML_TAGS = new Set([
  // Container tags
  'div',
  'section',
  'article',
  'aside',
  'nav',
  'main',
  'header',
  'footer',
  // Heading tags
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  // Content tags
  'p',
  'span',
  'strong',
  'em',
  'code',
  'pre',
  'blockquote',
  'address',
  // List tags
  'ul',
  'ol',
  'li',
  'dl',
  'dt',
  'dd',
  // Interactive tags (with warnings)
  'button',
  'a',
  'input',
  'textarea',
  'select',
  'form',
  'label',
  // Media tags
  'img',
  'video',
  'audio',
  'canvas',
  'svg',
  'picture',
  'source',
  // Table tags
  'table',
  'thead',
  'tbody',
  'tfoot',
  'tr',
  'th',
  'td',
  'caption',
  'colgroup',
  'col',
  // Form tags
  'fieldset',
  'legend',
  'optgroup',
  'option',
  'datalist',
  'output',
  'progress',
  'meter',
  // Interactive content
  'details',
  'summary',
  'dialog',
  // Text semantics
  'abbr',
  'cite',
  'dfn',
  'kbd',
  'mark',
  'q',
  's',
  'samp',
  'small',
  'sub',
  'sup',
  'time',
  'u',
  'var',
  // Document sections
  'body',
  'head',
  'title',
  'base',
  'link',
  'meta',
  'style',
  'script',
  'noscript',
  // Embedded content
  'embed',
  'iframe',
  'object',
  'param',
  'track',
  'map',
  'area',
  // Interactive elements
  'menu',
  'menuitem',
])

export const SEMANTIC_TAG_ROLES = new Map<string, SemanticRoleInfo>([
  ['nav', { role: 'navigation', applyARIA: true }],
  ['main', { role: 'main', applyARIA: true }],
  ['article', { role: 'article', applyARIA: true }],
  ['section', { role: 'region', applyARIA: true }],
  ['aside', { role: 'complementary', applyARIA: true }],
  ['header', { role: 'banner', applyARIA: false }], // Context dependent - may not always be page banner
  ['footer', { role: 'contentinfo', applyARIA: false }], // Context dependent - may not always be page footer
  ['form', { role: 'form', applyARIA: true }],
  ['search', { role: 'search', applyARIA: true }],
  ['dialog', { role: 'dialog', applyARIA: true }],
  ['button', { role: 'button', applyARIA: false }], // Usually implicit
  ['a', { role: 'link', applyARIA: false }], // Usually implicit
])

/**
 * Component Eligibility Matrix - Warning Levels
 * Based on design/Enh-TagSpecification.md Component Eligibility Matrix
 */
export const COMPONENT_ELIGIBILITY = new Map<
  string,
  {
    warningLevel: 'none' | 'info' | 'warning'
    idealTags?: string[]
    problematicTags?: string[]
  }
>([
  // Layout Components - Ideal for semantic containers (Warning Level: None)
  [
    'HStack',
    {
      warningLevel: 'none',
      idealTags: [
        'nav',
        'header',
        'footer',
        'section',
        'article',
        'aside',
        'main',
        'div',
      ],
    },
  ],
  [
    'VStack',
    {
      warningLevel: 'none',
      idealTags: [
        'main',
        'section',
        'article',
        'aside',
        'header',
        'footer',
        'div',
      ],
    },
  ],
  [
    'ZStack',
    { warningLevel: 'none', idealTags: ['article', 'aside', 'section', 'div'] },
  ],

  // Content Components - Common for specific overrides (Warning Level: None for appropriate tags)
  [
    'Text',
    {
      warningLevel: 'none',
      idealTags: [
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'p',
        'span',
        'strong',
        'em',
      ],
    },
  ],
  [
    'Image',
    { warningLevel: 'warning', problematicTags: ['figure', 'picture'] },
  ], // May break functionality
  ['Spacer', { warningLevel: 'none' }],

  // Interactive Components - Use with warnings
  [
    'Button',
    { warningLevel: 'warning', problematicTags: ['div', 'span', 'a'] },
  ], // May break accessibility
  [
    'Link',
    { warningLevel: 'warning', problematicTags: ['div', 'span', 'button'] },
  ], // May break navigation
])

/**
 * Check if an element override should show a warning based on component eligibility matrix
 */
export function shouldWarnOnOverride(
  componentType: string,
  tag: string
): boolean {
  const eligibility = COMPONENT_ELIGIBILITY.get(componentType)

  if (!eligibility) {
    // Unknown component - always warn for safety
    return true
  }

  // If component has no warning for any overrides
  if (eligibility.warningLevel === 'none') {
    return false
  }

  // If component warns for specific problematic tags
  if (eligibility.warningLevel === 'warning' && eligibility.problematicTags) {
    return eligibility.problematicTags.includes(tag)
  }

  // If component has ideal tags defined, only warn for non-ideal ones
  if (eligibility.idealTags && eligibility.idealTags.includes(tag)) {
    return false
  }

  // Default to warning for unknown combinations
  return true
}

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

export class ElementTagValidator {
  static validate(tag: string, componentType: string): ValidationResult {
    if (!VALID_HTML_TAGS.has(tag)) {
      // Show development warning for invalid tags
      if (process.env.NODE_ENV !== 'production') {
        console.error(
          `Invalid tag '${tag}' for component type '${componentType}'`
        )
      }

      return {
        valid: false,
        warning: `Invalid HTML tag '${tag}' specified for ${componentType}. Tag will be used as-is.`,
        severity: 'error',
      }
    }

    // Check for potentially problematic combinations
    const warnings = this.checkSemanticWarnings(tag, componentType)

    return {
      valid: true,
      warnings,
      semanticRole: SEMANTIC_TAG_ROLES.get(tag),
    }
  }

  private static checkSemanticWarnings(
    tag: string,
    componentType: string
  ): Warning[] {
    const warnings: Warning[] = []

    // Warn about interactive tags on layout components
    if (['button', 'a', 'input', 'select', 'textarea'].includes(tag)) {
      if (['HStack', 'VStack', 'ZStack'].includes(componentType)) {
        const message = `Using interactive tag '${tag}' on layout component ${componentType} may cause accessibility issues.`
        warnings.push({ message, severity: 'warning' })
        if (process.env.NODE_ENV !== 'production') {
          console.warn(
            `Interactive tag '${tag}' on layout component '${componentType}' may cause unexpected behavior`
          )
        }
      }
    }

    // Warn about structural violations
    if (tag === 'li' && !['VStack', 'HStack'].includes(componentType)) {
      const message = `<li> tags should typically be used within list structures.`
      warnings.push({ message, severity: 'info' })
      if (process.env.NODE_ENV !== 'production') {
        console.info(
          `Consider using '${tag}' within <ul> or <ol> structure for component '${componentType}'`
        )
      }
    }

    // Warn about heading tags on layout components
    if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag)) {
      if (['HStack', 'VStack', 'ZStack'].includes(componentType)) {
        const message = `Using heading tag '${tag}' on layout component ${componentType}. Consider using Text component instead.`
        warnings.push({ message, severity: 'info' })
        if (process.env.NODE_ENV !== 'production') {
          console.info(
            `Heading tag '${tag}' is better suited for Text components than '${componentType}'`
          )
        }
      }
    }

    // Warn about form tags on non-form components
    if (['form', 'fieldset', 'legend'].includes(tag)) {
      if (!['VStack', 'HStack', 'Form'].includes(componentType)) {
        const message = `Form tag '${tag}' used on ${componentType}. Ensure proper form semantics.`
        warnings.push({ message, severity: 'info' })
        if (process.env.NODE_ENV !== 'production') {
          console.info(
            `Form tag '${tag}' requires proper semantic context for component '${componentType}'`
          )
        }
      }
    }

    return warnings
  }
}

// Global configuration
let globalConfig: ElementOverrideConfig = {
  autoApplySemanticRoles: true,
  warnOnOverrides: process.env.NODE_ENV !== 'production',
  warnOnSemanticIssues: process.env.NODE_ENV !== 'production',
  validateTags: true,
  allowInvalidTags: true,
}

export function configureElementOverrides(
  config: Partial<ElementOverrideConfig>
): void {
  globalConfig = { ...globalConfig, ...config }
}

export function getElementOverrideConfig(): ElementOverrideConfig {
  return { ...globalConfig }
}

/**
 * Process element override for a component with validation and warnings
 */
export function processElementOverride(
  componentType: string,
  defaultTag: string,
  overrideTag?: string
): { tag: string; validation: ValidationResult } {
  const effectiveTag = overrideTag || defaultTag
  const config = getElementOverrideConfig()

  // Always validate in development, even when validation is disabled
  let validation: ValidationResult = { valid: true }

  if (overrideTag) {
    // Show override warning if enabled and appropriate per component eligibility matrix
    if (
      config.warnOnOverrides &&
      shouldWarnOnOverride(componentType, overrideTag)
    ) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          `Element override: ${componentType} changed from '${defaultTag}' to '${overrideTag}'`
        )
      }
    }

    // Validate tag if enabled
    if (config.validateTags) {
      validation = ElementTagValidator.validate(overrideTag, componentType)

      // If validation fails and we don't allow invalid tags, use default
      if (!validation.valid && !config.allowInvalidTags) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn(
            `Invalid tag '${overrideTag}' rejected for '${componentType}', using default '${defaultTag}' instead`
          )
        }
        return { tag: defaultTag, validation }
      }
    }
  }

  return { tag: effectiveTag, validation }
}

/**
 * Create element override validation helper for components
 */
export function createElementOverrideValidator(
  componentType: string,
  defaultTag: string
) {
  return (overrideTag?: string) =>
    processElementOverride(componentType, defaultTag, overrideTag)
}
