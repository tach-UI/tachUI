/**
 * Lightweight HTML sanitizer that removes common XSS vectors
 * This is NOT a comprehensive solution - use DOMPurify for full protection
 * 
 * Provides basic sanitization by:
 * - Removing dangerous patterns (script tags, event handlers, etc.)
 * - Validating DOM structure and attributes
 * - Allowing only safe elements and attributes
 */

export class BasicSanitizer {
  private static readonly DANGEROUS_PATTERNS = [
    // Script tags (including nested/malformed ones)
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<[^>]*<script[^>]*>/gi, // Nested script tags
    /script>/gi, // Catch any remaining script closings
    
    // Event handlers (onclick, onload, etc.)
    /\s*on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi,
    
    // JavaScript URLs
    /(?:href|src)\s*=\s*["']?javascript:[^"'\s>]*/gi,
    
    // Data URLs with scripts (basic detection)
    /(?:href|src)\s*=\s*["']?data:[^"'\s>]*(?:script|javascript)[^"'\s>]*/gi,
    
    // Dangerous elements
    /<(?:iframe|object|embed|form|input|meta|link)\b[^>]*>/gi,
    
    // Style tags with JavaScript
    /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,
    
    // Import statements in CSS
    /@import\s+[^;]+;?/gi,
    
    // Expression() in CSS (IE specific, but good to block)
    /expression\s*\([^)]*\)/gi,
    
    // Additional dangerous patterns
    /alert\s*\([^)]*\)/gi, // Alert calls
    /javascript:/gi, // Any javascript: protocol
    /vbscript:/gi, // VBScript protocol
  ]

  private static readonly ALLOWED_TAGS = [
    'p', 'br', 'strong', 'em', 'u', 'i', 'b', 's', 'sup', 'sub',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'dl', 'dt', 'dd',
    'blockquote', 'pre', 'code', 'kbd', 'samp',
    'a', 'img', 'table', 'thead', 'tbody', 'tr', 'td', 'th',
    'div', 'span', 'section', 'article', 'aside', 'header', 'footer',
    'hr'
  ]

  private static readonly ALLOWED_ATTRIBUTES = {
    '*': ['class', 'id', 'title', 'lang', 'dir'],
    'a': ['href', 'target', 'rel'],
    'img': ['src', 'alt', 'width', 'height'],
    'table': ['cellpadding', 'cellspacing', 'border'],
    'td': ['colspan', 'rowspan'],
    'th': ['colspan', 'rowspan', 'scope']
  }

  /**
   * Apply basic sanitization to HTML content
   * Removes dangerous patterns and restricts to allowed elements/attributes
   */
  static sanitize(html: string, options: BasicSanitizerOptions = {}): string {
    if (!html || typeof html !== 'string') {
      return ''
    }

    let sanitized = html

    // 1. Remove dangerous patterns
    for (const pattern of this.DANGEROUS_PATTERNS) {
      sanitized = sanitized.replace(pattern, '')
    }

    // 2. Parse and validate DOM structure if requested
    if (options.validateDOM !== false) {
      sanitized = this.validateDOMStructure(sanitized, options)
    }

    // 3. Apply custom rules
    if (options.customPatterns) {
      for (const pattern of options.customPatterns) {
        sanitized = sanitized.replace(pattern, '')
      }
    }

    return sanitized.trim()
  }

  /**
   * Validate DOM structure and attributes using DOMParser
   */
  private static validateDOMStructure(html: string, options: BasicSanitizerOptions): string {
    try {
      const parser = new DOMParser()
      const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html')
      const container = doc.body.firstChild as Element

      if (!container) return ''

      // Remove disallowed elements and attributes
      this.cleanElement(container, options)

      return container.innerHTML
    } catch (error) {
      // Fallback to pattern-based sanitization only
      console.warn('BasicSanitizer: DOM validation failed, using pattern-based sanitization only', error)
      return html
    }
  }

  /**
   * Recursively clean element and its children
   */
  private static cleanElement(element: Element, options: BasicSanitizerOptions): void {
    const tagName = element.tagName.toLowerCase()
    const allowedTags = options.allowedTags || this.ALLOWED_TAGS

    // Remove element if tag not allowed, but preserve text content
    if (!allowedTags.includes(tagName)) {
      // Move text content to parent before removing element
      const textContent = element.textContent || ''
      if (textContent.trim() && element.parentNode) {
        const textNode = element.ownerDocument.createTextNode(textContent)
        element.parentNode.insertBefore(textNode, element)
      }
      element.remove()
      return
    }

    // Clean attributes
    const allowedAttrs = this.getAllowedAttributesForTag(tagName, options)
    const attributesToRemove: string[] = []

    for (let i = 0; i < element.attributes.length; i++) {
      const attr = element.attributes[i]
      if (!allowedAttrs.includes(attr.name)) {
        attributesToRemove.push(attr.name)
      } else {
        // Validate attribute values
        if (!this.isAttributeValueSafe(attr.name, attr.value)) {
          attributesToRemove.push(attr.name)
        }
      }
    }

    attributesToRemove.forEach(attrName => element.removeAttribute(attrName))

    // Recursively clean children
    const children = Array.from(element.children)
    children.forEach(child => this.cleanElement(child, options))
  }

  /**
   * Get allowed attributes for a specific tag
   */
  private static getAllowedAttributesForTag(tagName: string, options: BasicSanitizerOptions): string[] {
    const allowedAttrs = options.allowedAttributes || this.ALLOWED_ATTRIBUTES
    const globalAttrs = (allowedAttrs as Record<string, string[]>)['*'] || []
    const tagSpecificAttrs = (allowedAttrs as Record<string, string[]>)[tagName] || []
    
    return [...globalAttrs, ...tagSpecificAttrs]
  }

  /**
   * Check if attribute value is safe
   */
  private static isAttributeValueSafe(attrName: string, attrValue: string): boolean {
    // Check for dangerous URLs
    if (['href', 'src', 'action'].includes(attrName)) {
      return this.isUrlSafe(attrValue)
    }

    // Check for JavaScript in any attribute
    if (/javascript:/i.test(attrValue)) {
      return false
    }

    return true
  }

  /**
   * Validate URL safety
   */
  private static isUrlSafe(url: string): boolean {
    if (!url) return true

    // Allow relative URLs
    if (url.startsWith('/') || url.startsWith('./') || url.startsWith('#')) {
      return true
    }

    try {
      const parsed = new URL(url)
      
      // Allow only safe protocols
      const safeProtocols = ['http:', 'https:', 'mailto:', 'tel:', 'ftp:']
      return safeProtocols.includes(parsed.protocol)
    } catch {
      // Invalid URL, block it
      return false
    }
  }
}

export interface BasicSanitizerOptions {
  /** Custom dangerous patterns to remove */
  customPatterns?: RegExp[]
  /** Override allowed tags */
  allowedTags?: string[]
  /** Override allowed attributes */
  allowedAttributes?: Record<string, string[]>
  /** Whether to validate DOM structure (default: true) */
  validateDOM?: boolean
}

/**
 * Convenience function for basic HTML sanitization
 */
export function basicSanitize(html: string, options?: BasicSanitizerOptions): string {
  return BasicSanitizer.sanitize(html, options)
}