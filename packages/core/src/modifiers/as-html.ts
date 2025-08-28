/**
 * AsHTML Modifier - Renders Text component content as HTML
 * 
 * Security-first design with:
 * - Text component restriction only
 * - Built-in basic sanitization by default
 * - Non-reactive for performance
 * - Clear error messages for misuse
 */

import { BaseModifier } from './base'
import type { DOMNode, ComponentInstance } from '../runtime/types'
import type { ModifierContext } from './types'
import { BasicSanitizer, type BasicSanitizerOptions } from './basic-sanitizer'
import { AsHTMLValidator } from './as-html-validator'

export interface AsHTMLOptions extends BasicSanitizerOptions {
  /** Skip basic sanitization (use with extreme caution) */
  skipSanitizer?: boolean
  /** Custom sanitization function */
  customSanitizer?: (html: string) => string
  /** Development-only validation */
  __devModeValidate?: boolean
  /** Suppress development warnings */
  __suppressWarnings?: boolean
}

/**
 * Text component interface for type safety
 */
export interface TextComponent extends ComponentInstance {
  readonly __tachui_component_type: 'Text'
  content: string
}

export class AsHTMLModifier extends BaseModifier<AsHTMLOptions> {
  readonly type = 'asHTML'
  readonly priority = 25 // After layout, before styling

  constructor(options: AsHTMLOptions = {}) {
    super(options)
  }

  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined {
    if (!context.element || !context.componentInstance) return

    // Security check: Only allow Text components
    const component = context.componentInstance
    if (!this.isTextComponent(component)) {
      throw new Error(
        `AsHTML modifier can only be applied to Text components. ` +
        `Found: ${component.type || 'unknown'} component. ` +
        `Use Text('<your-html>').modifier.asHTML() instead.`
      )
    }

    // Get the content from the Text component
    const htmlContent = this.getTextComponentContent(component)
    
    if (!htmlContent) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('asHTML: No content found in Text component')
      }
      return undefined
    }

    // Process and apply HTML content (non-reactive for performance)
    const processedHTML = this.sanitizeHTML(htmlContent)
    
    // Clear all existing child nodes first
    while (context.element.firstChild) {
      context.element.removeChild(context.element.firstChild)
    }
    
    // Set HTML content
    context.element.innerHTML = processedHTML
    
    // Mark element to prevent text() function from overwriting innerHTML
    ;(context.element as any).__tachui_asHTML = true

    // Perform validation after processing (development only)
    if (process.env.NODE_ENV === 'development') {
      this.validateContent(htmlContent) // Validate original content, not processed
    }

    return undefined
  }

  private isTextComponent(component: any): boolean {
    // Check if component is a Text component
    // Multiple checks for different ways Text components might be identified
    return component.type === 'Text' || 
           component.constructor?.name === 'TextComponent' ||
           component.__tachui_component_type === 'Text' ||
           (component.props && component.props.__componentType === 'Text') ||
           // Check componentMetadata for enhanced Text components
           (component.componentMetadata && component.componentMetadata.type === 'Text') ||
           (component.componentMetadata && component.componentMetadata.originalType === 'Text')
  }

  private getTextComponentContent(component: any): string {
    // Extract content from Text component
    // Text components should have their content in a predictable location
    
    // Primary: Direct content property
    if (typeof component.content === 'string') {
      return component.content
    }
    
    // Secondary: Props content
    if (component.props && typeof component.props.content === 'string') {
      return component.props.content
    }
    
    // Tertiary: Check children array for text nodes (for enhanced Text components)
    if (component.children && Array.isArray(component.children) && component.children.length > 0) {
      const firstChild = component.children[0]
      if (firstChild && firstChild.type === 'text' && typeof firstChild.text === 'string') {
        return firstChild.text
      }
    }
    
    // Quaternary: Text property
    if (typeof component.text === 'string') {
      return component.text
    }
    
    // Fifth: Check props for common text properties
    if (component.props) {
      if (typeof component.props.text === 'string') {
        return component.props.text
      }
      if (typeof component.props.children === 'string') {
        return component.props.children
      }
    }

    // Fallback: Check for direct string (in case of simple Text usage)
    if (typeof component === 'string') {
      return component
    }

    return ''
  }

  private sanitizeHTML(html: string): string {
    if (!html || typeof html !== 'string') {
      return ''
    }

    // Skip sanitization if explicitly requested
    if (this.properties.skipSanitizer) {
      return html
    }

    // Use custom sanitizer if provided
    if (this.properties.customSanitizer) {
      return this.properties.customSanitizer(html)
    }

    // Apply basic sanitization
    return BasicSanitizer.sanitize(html, this.properties)
  }

  private validateContent(html: string): void {
    if (this.properties.__suppressWarnings) return

    // Validate content
    const validationResult = AsHTMLValidator.validate(html, {
      suppressWarnings: this.properties.__suppressWarnings
    })

    if (!validationResult.isValid && validationResult.warnings.length > 0) {
      console.group('🔒 AsHTML Security Warnings')
      console.warn('Potentially dangerous content detected in asHTML:')
      validationResult.warnings.forEach(warning => {
        console.warn(`  • ${warning}`)
      })
      console.warn('Consider using a more comprehensive sanitization solution like DOMPurify')
      console.warn('To suppress these warnings, use { __suppressWarnings: true }')
      console.groupEnd()
    }

    // Warn about skipped sanitization
    if (this.properties.skipSanitizer) {
      console.warn('🚨 AsHTML: Sanitization is DISABLED. Ensure content is safe!')
    }
  }
}

/**
 * Create an asHTML modifier for rendering HTML content
 * 
 * By default, applies basic sanitization to remove common XSS vectors.
 * Use { skipSanitizer: true } to bypass sanitization (dangerous).
 * 
 * The modifier treats the component's content as HTML instead of plain text.
 * SECURITY: Only works on Text components.
 * 
 * @param options - Configuration options
 * 
 * @example
 * ```typescript
 * // Safe: Basic sanitization applied
 * Text('<p>Hello <strong>world</strong></p>').modifier.asHTML().build()
 * 
 * // Dangerous: Skip sanitization
 * Text(serverTemplate).modifier.asHTML({ skipSanitizer: true }).build()
 * 
 * // Custom sanitization
 * Text(content).modifier.asHTML({ customSanitizer: DOMPurify.sanitize }).build()
 * ```
 */
export function asHTML(options: AsHTMLOptions = {}): AsHTMLModifier {
  return new AsHTMLModifier(options)
}