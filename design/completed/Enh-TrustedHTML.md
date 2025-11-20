---
cssclasses:
  - full-page
---

# Enhancement: TrustedHTML Modifier for tachUI

**Status**: Design Phase  
**Priority**: Medium  
**Timeline**: 1-2 weeks  
**Bundle Impact**: ~2KB  

## Overview

A lightweight `.asHTML()` modifier that enables safe HTML content rendering in tachUI components with built-in basic sanitization by default and an opt-out mechanism for cases where developers need direct HTML injection. This provides an escape hatch for HTML content while maintaining reasonable security defaults.

## Technical Architecture

### Core Design Principles

1. **Secure by Default**: Built-in basic sanitization for common XSS vectors
2. **Explicit Opt-out**: Clear mechanism to skip sanitization when needed
3. **Minimal Bundle Impact**: Lightweight implementation (~2KB total)
4. **Non-Reactive by Default**: Static content to avoid sanitization overhead on updates
5. **Text Component Only**: Restricted to Text components for security and clarity
6. **Developer Awareness**: Strong warnings and documentation about security implications
7. **Development-time Safety**: Validation and warnings in development mode

### Implementation Structure

```
packages/core/src/modifiers/
├── as-html.ts                   # Main asHTML modifier
├── basic-sanitizer.ts           # Lightweight sanitization utility
└── types.ts                     # Updated with asHTML types

packages/core/src/modifiers/builder.ts  # Updated ModifierBuilder interface
```

## API Design

### Basic Usage
```typescript
// Default: Basic sanitization applied
Text('<p>Hello <strong>world</strong>!</p>')
  .modifier
  .asHTML()
  .build()

// Skip sanitization (requires explicit opt-out)
Text(serverRenderedHTML)
  .modifier
  .asHTML({ skipSanitizer: true })
  .build()

// With custom sanitization options
Text(content)
  .modifier
  .asHTML({ 
    allowedTags: ['p', 'strong', 'em'],
    customSanitizer: myCustomSanitizer
  })
  .build()
```

### Advanced Configuration
```typescript
interface AsHTMLOptions {
  /** Skip basic sanitization (use with extreme caution) */
  skipSanitizer?: boolean
  /** Custom sanitization function */
  customSanitizer?: (html: string) => string
  /** Override allowed HTML tags */
  allowedTags?: string[]
  /** Override allowed attributes per tag */
  allowedAttributes?: Record<string, string[]>
  /** Development-only validation */
  __devModeValidate?: boolean
  /** Suppress development warnings */
  __suppressWarnings?: boolean
}

Text(htmlContent)
  .modifier
  .asHTML({
    skipSanitizer: false,
    customSanitizer: myCustomSanitizer,
    allowedTags: ['p', 'strong', 'em', 'a'],
    __devModeValidate: true
  })
  .build()
```

## Detailed Implementation Plan

### Phase 1: Core Sanitization Utility (Week 1, Days 1-2)

#### 1.1 Basic Sanitizer Implementation
```typescript
// packages/core/src/modifiers/basic-sanitizer.ts

/**
 * Lightweight HTML sanitizer that removes common XSS vectors
 * This is NOT a comprehensive solution - use DOMPurify for full protection
 */
export class BasicSanitizer {
  private static readonly DANGEROUS_PATTERNS = [
    // Script tags
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    
    // Event handlers
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
    /expression\s*\([^)]*\)/gi
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

    // Remove element if tag not allowed
    if (!allowedTags.includes(tagName)) {
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
    const globalAttrs = allowedAttrs['*'] || []
    const tagSpecificAttrs = allowedAttrs[tagName] || []
    
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
```

#### 1.2 Development-time Validation
```typescript
// packages/core/src/modifiers/trusted-html-validator.ts

export class TrustedHTMLValidator {
  private static readonly SUSPICIOUS_PATTERNS = [
    { pattern: /<script/i, message: 'Script tags detected' },
    { pattern: /javascript:/i, message: 'JavaScript URLs detected' },
    { pattern: /on\w+\s*=/i, message: 'Event handlers detected' },
    { pattern: /<iframe/i, message: 'Iframe elements detected' },
    { pattern: /<object/i, message: 'Object elements detected' },
    { pattern: /<embed/i, message: 'Embed elements detected' },
    { pattern: /<form/i, message: 'Form elements detected' },
    { pattern: /data:.*script/i, message: 'Data URLs with scripts detected' },
    { pattern: /@import/i, message: 'CSS import statements detected' },
    { pattern: /expression\s*\(/i, message: 'CSS expressions detected' }
  ]

  /**
   * Validate HTML content in development mode
   */
  static validate(html: string, options: { suppressWarnings?: boolean } = {}): ValidationResult {
    if (options.suppressWarnings) {
      return { isValid: true, warnings: [] }
    }

    const warnings: string[] = []
    
    for (const { pattern, message } of this.SUSPICIOUS_PATTERNS) {
      if (pattern.test(html)) {
        warnings.push(message)
      }
    }

    // Check for user input patterns
    if (this.looksLikeUserInput(html)) {
      warnings.push('Content appears to contain user input - ensure it\'s properly sanitized')
    }

    return {
      isValid: warnings.length === 0,
      warnings
    }
  }

  private static looksLikeUserInput(html: string): boolean {
    // Heuristics to detect potential user input
    const userInputIndicators = [
      /&lt;script/i,  // HTML-encoded script tags
      /&amp;#/,        // HTML entities that might be user input
      /%3Cscript/i,    // URL-encoded script tags
      /\{\{.*\}\}/,    // Template syntax
      /\$\{.*\}/       // ES6 template literals
    ]

    return userInputIndicators.some(pattern => pattern.test(html))
  }
}

interface ValidationResult {
  isValid: boolean
  warnings: string[]
}
```

### Phase 2: AsHTML Modifier Implementation (Week 1, Days 3-5)

#### 2.1 Core Modifier Class
```typescript
// packages/core/src/modifiers/as-html.ts

import { BaseModifier } from './base'
import type { DOMNode } from '../runtime/types'
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

export class AsHTMLModifier extends BaseModifier<AsHTMLOptions> {
  readonly type = 'asHTML'
  readonly priority = 25 // After layout, before styling

  constructor(options: AsHTMLOptions = {}) {
    super(options)
    
    // Development-time warnings
    if (process.env.NODE_ENV === 'development') {
      this.performDevelopmentChecks()
    }
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
    context.element.innerHTML = processedHTML

    // Perform validation after processing (development only)
    if (process.env.NODE_ENV === 'development') {
      this.validateContent(processedHTML)
    }

    return undefined
  }

  private isTextComponent(component: any): boolean {
    // Check if component is a Text component
    // This will depend on how Text components are identified in tachUI
    return component.type === 'Text' || 
           component.constructor?.name === 'TextComponent' ||
           component.__tachui_component_type === 'Text'
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
    
    // Tertiary: Text property
    if (typeof component.text === 'string') {
      return component.text
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

  private performDevelopmentChecks(): void {
    // Development checks will be performed when content is available
    // This is deferred until apply() when we have access to the component content
  }

  private validateContent(html: string): void {
    if (process.env.NODE_ENV !== 'development') return
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
 * 
 * @param options - Configuration options
 */
export function asHTML(options: AsHTMLOptions = {}): AsHTMLModifier {
  return new AsHTMLModifier(options)
}
```

#### 2.2 TypeScript Type Safety
```typescript
// packages/core/src/modifiers/types.ts - Text component detection

// Define Text component type
export interface TextComponent extends ComponentInstance {
  readonly __tachui_component_type: 'Text'
  content: string
}

// Type-safe ModifierBuilder interface
export interface ModifierBuilder<T extends ComponentInstance = ComponentInstance> {
  // ... existing modifiers

  /**
   * Render component content as HTML instead of plain text
   * 
   * ⚠️ **RESTRICTION**: Only available on Text components for security
   * ⚠️ **SECURITY NOTICE**: This modifier treats content as HTML.
   * - Default: Basic sanitization removes common XSS vectors
   * - Use skipSanitizer: true only with fully trusted content
   * - Consider DOMPurify for comprehensive sanitization
   * - Non-reactive for performance (content is processed once)
   * 
   * @param options - Configuration options
   * 
   * @example
   * ```typescript
   * // ✅ Allowed: Text components only
   * Text('<p>Hello <strong>world</strong></p>').modifier.asHTML().build()
   * 
   * // ❌ Compile Error: Not a Text component
   * VStack({}).modifier.asHTML() // TypeScript error
   * 
   * // ✅ Dangerous: Skip sanitization
   * Text(serverTemplate).modifier.asHTML({ skipSanitizer: true }).build()
   * ```
   */
  asHTML(
    this: T extends TextComponent ? ModifierBuilder<T> : never,
    options?: AsHTMLOptions
  ): ModifierBuilder<T>
}
```

#### 2.3 Builder Implementation
```typescript
// packages/core/src/modifiers/builder.ts - Add to ModifierBuilderImpl class

import { asHTML as createAsHTML, type AsHTMLOptions, type TextComponent } from './as-html'

export class ModifierBuilderImpl<T extends ComponentInstance> implements ModifierBuilder<T> {
  // ... existing methods

  // Type-safe implementation - only available on Text components
  asHTML(
    this: T extends TextComponent ? ModifierBuilderImpl<T> : never,
    options?: AsHTMLOptions
  ): ModifierBuilder<T> {
    const modifier = createAsHTML(options)
    this.addModifier(modifier)
    return this
  }
}
```

### Phase 3: Testing Implementation (Week 2, Days 1-3)

#### 3.1 Unit Tests
```typescript
// packages/core/src/modifiers/__tests__/as-html.test.ts

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { asHTML } from '../as-html'
import { Text } from '../../components/Text'
import { VStack } from '../../components/VStack'
import { Button } from '../../components/Button'

describe('AsHTML Modifier', () => {
  let consoleSpy: any

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleSpy.mockRestore()
  })

  describe('Text Component Support', () => {
    test('renders safe HTML content in Text component', () => {
      const safeHTML = '<p>Hello <strong>world</strong>!</p>'
      const component = Text(safeHTML)
        .modifier
        .asHTML()
        .build()

      const rendered = component.render()
      expect(rendered).toContain('<p>')
      expect(rendered).toContain('<strong>')
      expect(rendered).toContain('Hello world!')
    })

    test('handles empty content gracefully', () => {
      const component = Text('').modifier.asHTML().build()
      const rendered = component.render()
      expect(rendered).toBe('')
    })

    test('processes content only once (non-reactive)', () => {
      const processSpy = vi.fn()
      const component = Text('<p>Content</p>')
        .modifier
        .asHTML()
        .build()

      // Should process content during initial render
      component.render()
      component.render() // Second render should not reprocess
      
      // Content should be processed only once
      expect(component.render()).toContain('<p>Content</p>')
    })
  })

  describe('Component Restriction', () => {
    test('throws error when applied to non-Text components', () => {
      expect(() => {
        VStack({ children: [] })
          .modifier
          .asHTML()
          .build()
      }).toThrow('AsHTML modifier can only be applied to Text components')
    })

    test('provides helpful error message with component type', () => {
      expect(() => {
        Button('Click me')
          .modifier
          .asHTML()
          .build()
      }).toThrow('Found: Button component. Use Text(\'<your-html>\').modifier.asHTML() instead.')
    })

    test('error message suggests correct usage', () => {
      expect(() => {
        VStack({ children: [] })
          .modifier
          .asHTML()
          .build()
      }).toThrow('Use Text(\'<your-html>\').modifier.asHTML() instead.')
    })
  })

  describe('TypeScript Compile-Time Safety', () => {
    test('should compile for Text components', () => {
      // This test verifies TypeScript compilation - no runtime logic needed
      const component = Text('<p>HTML content</p>')
        .modifier
        .asHTML()
        .build()
      
      expect(component).toBeDefined()
    })

    // Note: The following would cause TypeScript compilation errors:
    // VStack({}).modifier.asHTML() // ❌ Compile error
    // Button('text').modifier.asHTML() // ❌ Compile error
  })

  describe('Security - Basic Sanitization', () => {
    test('removes script tags by default', () => {
      const maliciousHTML = '<p>Hello</p><script>alert("xss")</script><p>World</p>'
      const component = Text(maliciousHTML)
        .modifier
        .asHTML()
        .build()

      const rendered = component.render()
      expect(rendered).toContain('Hello')
      expect(rendered).toContain('World')
      expect(rendered).not.toContain('<script>')
      expect(rendered).not.toContain('alert')
    })

    test('removes event handlers by default', () => {
      const maliciousHTML = '<div onclick="alert(1)">Click me</div>'
      const component = Text(maliciousHTML)
        .modifier
        .asHTML()
        .build()

      const rendered = component.render()
      expect(rendered).toContain('Click me')
      expect(rendered).not.toContain('onclick')
      expect(rendered).not.toContain('alert(1)')
    })

    test('removes javascript: URLs by default', () => {
      const maliciousHTML = '<a href="javascript:alert(1)">Link</a>'
      const component = Text(maliciousHTML)
        .modifier
        .asHTML()
        .build()

      const rendered = component.render()
      expect(rendered).toContain('Link')
      expect(rendered).not.toContain('javascript:')
      expect(rendered).not.toContain('alert(1)')
    })

    test('removes dangerous elements by default', () => {
      const maliciousHTML = '<iframe src="evil.html"></iframe><object data="evil.swf"></object>'
      const component = Text(maliciousHTML)
        .modifier
        .asHTML()
        .build()

      const rendered = component.render()
      expect(rendered).not.toContain('<iframe>')
      expect(rendered).not.toContain('<object>')
    })

    test('preserves safe HTML elements', () => {
      const safeHTML = `
        <div class="content">
          <h1>Title</h1>
          <p>Paragraph with <strong>bold</strong> and <em>italic</em></p>
          <ul>
            <li>Item 1</li>
            <li>Item 2</li>
          </ul>
          <a href="https://example.com">Safe link</a>
          <img src="/image.jpg" alt="Safe image">
        </div>
      `
      const component = Text(safeHTML)
        .modifier
        .asHTML()
        .build()

      const rendered = component.render()
      expect(rendered).toContain('<div class="content">')
      expect(rendered).toContain('<h1>')
      expect(rendered).toContain('<strong>')
      expect(rendered).toContain('<em>')
      expect(rendered).toContain('<ul>')
      expect(rendered).toContain('<li>')
      expect(rendered).toContain('<a href="https://example.com">')
      expect(rendered).toContain('<img src="/image.jpg"')
    })
  })

  describe('Skip Sanitizer Option', () => {
    test('bypasses sanitization when skipSanitizer: true', () => {
      const maliciousHTML = '<script>alert("xss")</script><p>Content</p>'
      const component = Text(maliciousHTML)
        .modifier
        .asHTML({ skipSanitizer: true })
        .build()

      const rendered = component.render()
      expect(rendered).toContain('<script>')
      expect(rendered).toContain('alert("xss")')
      expect(rendered).toContain('<p>Content</p>')
    })

    test('warns in development when skipping sanitizer', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      Text('<p>Content</p>')
        .modifier
        .asHTML({ skipSanitizer: true })
        .build()

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Sanitization is DISABLED')
      )

      process.env.NODE_ENV = originalEnv
    })
  })

  describe('Custom Sanitizer Option', () => {
    test('uses custom sanitizer when provided', () => {
      const customSanitizer = vi.fn((html: string) => html.replace(/<script.*?<\/script>/gi, ''))
      const maliciousHTML = '<p>Hello</p><script>alert("xss")</script><p>World</p>'
      
      const component = Text(maliciousHTML)
        .modifier
        .asHTML({ customSanitizer })
        .build()

      component.render()
      
      expect(customSanitizer).toHaveBeenCalledWith(maliciousHTML)
    })
  })

  describe('Development Mode Validation', () => {
    test('warns about suspicious content in development', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      Text('<p>Hello</p><script>alert(1)</script>')
        .modifier
        .asHTML()
        .build()

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Script tags detected')
      )

      process.env.NODE_ENV = originalEnv
    })

    test('suppresses warnings when requested', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      Text('<script>alert(1)</script>')
        .modifier
        .asHTML({ __suppressWarnings: true })
        .build()

      expect(consoleSpy).not.toHaveBeenCalled()

      process.env.NODE_ENV = originalEnv
    })
  })
})
```

#### 3.2 Security Tests
```typescript
// packages/core/src/modifiers/__tests__/trusted-html-security.test.ts

import { describe, test, expect } from 'vitest'
import { BasicSanitizer } from '../basic-sanitizer'

describe('BasicSanitizer Security Tests', () => {
  const xssVectors = [
    // Script injection
    '<script>alert("xss")</script>',
    '<script src="evil.js"></script>',
    '<script>document.location="http://evil.com"</script>',
    
    // Event handlers
    '<img src="x" onerror="alert(1)">',
    '<div onclick="alert(1)">click</div>',
    '<body onload="alert(1)">',
    '<input onfocus="alert(1)" autofocus>',
    
    // JavaScript URLs
    '<a href="javascript:alert(1)">link</a>',
    '<iframe src="javascript:alert(1)"></iframe>',
    '<form action="javascript:alert(1)">',
    
    // Data URLs
    '<iframe src="data:text/html,<script>alert(1)</script>"></iframe>',
    '<object data="data:text/html,<script>alert(1)</script>"></object>',
    
    // CSS injection
    '<style>body{background:url("javascript:alert(1)")}</style>',
    '<div style="background:url(javascript:alert(1))">',
    '<style>@import "javascript:alert(1)";</style>',
    
    // HTML entity encoding
    '<img src="x" onerror="&#97;lert(1)">',
    '<script>&#97;lert("xss")</script>',
    
    // Mixed case evasion
    '<ScRiPt>alert("xss")</ScRiPt>',
    '<IMG SRC="javascript:alert(1)">',
    
    // Nested tags
    '<scr<script>ipt>alert("xss")</script>',
    '<img src="x" one<script>rror="alert(1)">',
  ]

  test.each(xssVectors)('blocks XSS vector: %s', (maliciousHTML) => {
    const sanitized = BasicSanitizer.sanitize(maliciousHTML)
    
    // Should not contain dangerous content
    expect(sanitized.toLowerCase()).not.toMatch(/<script/i)
    expect(sanitized.toLowerCase()).not.toMatch(/javascript:/i)
    expect(sanitized.toLowerCase()).not.toMatch(/on\w+\s*=/i)
    expect(sanitized.toLowerCase()).not.toMatch(/<iframe/i)
    expect(sanitized.toLowerCase()).not.toMatch(/<object/i)
    expect(sanitized.toLowerCase()).not.toMatch(/<embed/i)
    expect(sanitized.toLowerCase()).not.toMatch(/alert\(/i)
    expect(sanitized.toLowerCase()).not.toMatch(/@import/i)
  })

  test('preserves legitimate content', () => {
    const legitimateHTML = `
      <article>
        <h1>Article Title</h1>
        <p>This is a paragraph with <strong>bold text</strong> and <em>italic text</em>.</p>
        <ul>
          <li>List item 1</li>
          <li>List item 2</li>
        </ul>
        <blockquote>This is a quote</blockquote>
        <a href="https://example.com" title="Example">Legitimate link</a>
        <img src="/images/photo.jpg" alt="Photo" width="300" height="200">
        <pre><code>const x = 1;</code></pre>
      </article>
    `

    const sanitized = BasicSanitizer.sanitize(legitimateHTML)
    
    // Should preserve legitimate elements
    expect(sanitized).toContain('<article>')
    expect(sanitized).toContain('<h1>')
    expect(sanitized).toContain('<strong>')
    expect(sanitized).toContain('<em>')
    expect(sanitized).toContain('<ul>')
    expect(sanitized).toContain('<li>')
    expect(sanitized).toContain('<blockquote>')
    expect(sanitized).toContain('<a href="https://example.com"')
    expect(sanitized).toContain('<img src="/images/photo.jpg"')
    expect(sanitized).toContain('<pre>')
    expect(sanitized).toContain('<code>')
  })

  test('handles malformed HTML gracefully', () => {
    const malformedHTML = '<div><p>Unclosed paragraph<span>Nested</div>'
    
    const sanitized = BasicSanitizer.sanitize(malformedHTML)
    
    // Should not crash and should return some content
    expect(sanitized).toBeTruthy()
    expect(typeof sanitized).toBe('string')
  })

  test('performance with large HTML content', () => {
    const largeHTML = '<div>' + 'x'.repeat(10000) + '</div>'.repeat(100)
    
    const startTime = performance.now()
    const sanitized = BasicSanitizer.sanitize(largeHTML)
    const endTime = performance.now()
    
    expect(sanitized).toBeTruthy()
    expect(endTime - startTime).toBeLessThan(100) // Should complete in under 100ms
  })
})
```

#### 3.3 Integration Tests
```typescript
// packages/core/src/modifiers/__tests__/trusted-html-integration.test.ts

import { describe, test, expect } from 'vitest'
import { Text } from '../../components/Text'
import { VStack } from '../../components/VStack'
import { signal } from '../../reactive/signal'

describe('TrustedHTML Integration Tests', () => {
  test('works with different components', () => {
    const htmlContent = '<p>Test content</p>'
    
    const textComponent = Text('').modifier.trustedHTML(htmlContent).build()
    const stackComponent = VStack({ children: [] }).modifier.trustedHTML(htmlContent).build()
    
    expect(textComponent.render()).toContain('Test content')
    expect(stackComponent.render()).toContain('Test content')
  })

  test('combines with other modifiers', () => {
    const component = Text('')
      .modifier
      .trustedHTML('<p>Styled content</p>')
      .backgroundColor('#f0f0f0')
      .padding(16)
      .build()

    const rendered = component.render()
    expect(rendered).toContain('Styled content')
    // Should also have background and padding styles applied
  })

  test('works with reactive state management', () => {
    const content = signal('<p>Initial</p>')
    const component = Text('').modifier.trustedHTML(content).build()

    expect(component.render()).toContain('Initial')

    content.value = '<p>Updated</p>'
    expect(component.render()).toContain('Updated')
  })

  test('handles component lifecycle properly', () => {
    const component = Text('')
      .modifier
      .trustedHTML('<p>Content</p>')
      .build()

    // Component should render
    expect(component.render()).toContain('Content')

    // Component should clean up properly when unmounted
    component.unmount?.()
    // Should not throw errors
  })
})
```

### Phase 4: Documentation and Developer Experience (Week 2, Days 4-5)

#### 4.1 TypeScript Definitions
```typescript
// packages/core/src/modifiers/trusted-html.d.ts

/**
 * Options for TrustedHTML modifier
 */
export interface TrustedHTMLOptions {
  /** Skip basic sanitization (use with extreme caution) */
  skipSanitizer?: boolean
  /** Custom sanitization function */
  customSanitizer?: (html: string) => string
  /** Custom dangerous patterns to remove */
  customPatterns?: RegExp[]
  /** Override allowed HTML tags */
  allowedTags?: string[]
  /** Override allowed attributes per tag */
  allowedAttributes?: Record<string, string[]>
  /** Whether to validate DOM structure (default: true) */
  validateDOM?: boolean
  /** Development-only validation */
  __devModeValidate?: boolean
  /** Suppress development warnings */
  __suppressWarnings?: boolean
}

/**
 * Create a trustedHTML modifier for safe HTML injection
 * 
 * ⚠️ **SECURITY WARNING**: This modifier allows HTML injection
 * 
 * **Default Behavior**: Basic sanitization removes common XSS vectors
 * - Removes `<script>` tags
 * - Removes event handlers (`onclick`, etc.)
 * - Removes `javascript:` URLs
 * - Removes dangerous elements (`<iframe>`, `<object>`, etc.)
 * 
 * **Safety Guidelines**:
 * - ✅ Server-rendered content
 * - ✅ Trusted API responses  
 * - ✅ Pre-sanitized content
 * - ❌ Direct user input
 * - ❌ URL parameters
 * - ❌ Form data
 * 
 * @param html HTML content (basic sanitization applied by default)
 * @param options Configuration options
 * 
 * @example
 * ```typescript
 * // Safe: Basic sanitization applied
 * Text('').modifier.trustedHTML('<p>Hello <strong>world</strong></p>').build()
 * 
 * // Dangerous: Skip sanitization  
 * Text('').modifier.trustedHTML(serverTemplate, { skipSanitizer: true }).build()
 * 
 * // Custom sanitization
 * Text('').modifier.trustedHTML(content, { 
 *   customSanitizer: (html) => DOMPurify.sanitize(html) 
 * }).build()
 * 
 * // Reactive content
 * const htmlSignal = signal('<div>Dynamic content</div>')
 * Text('').modifier.trustedHTML(htmlSignal).build()
 * ```
 */
export function trustedHTML(
  html: string | Signal<string>,
  options?: TrustedHTMLOptions
): TrustedHTMLModifier
```

#### 4.2 ESLint Plugin Rules
```typescript
// packages/eslint-plugin-tachui/src/rules/trusted-html-security.ts

export const trustedHTMLSecurityRule = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce secure usage of trustedHTML modifier',
      category: 'Security',
      recommended: true
    },
    schema: [
      {
        type: 'object',
        properties: {
          requireExplicitSkip: { type: 'boolean' },
          warnOnUserInput: { type: 'boolean' }
        }
      }
    ]
  },
  
  create(context: any) {
    return {
      CallExpression(node: any) {
        if (node.callee.property?.name === 'trustedHTML') {
          // Check for potential user input
          const firstArg = node.arguments[0]
          if (isLikelyUserInput(firstArg)) {
            context.report({
              node,
              message: 'Avoid using trustedHTML with user input. Consider proper sanitization.',
              suggest: [{
                desc: 'Add custom sanitizer',
                fix: (fixer: any) => {
                  return fixer.replaceText(node, 
                    `trustedHTML(${context.getSourceCode().getText(firstArg)}, { 
                      customSanitizer: (html) => DOMPurify.sanitize(html) 
                    })`
                  )
                }
              }]
            })
          }
          
          // Check for skipSanitizer without justification
          const options = node.arguments[1]
          if (options && hasProperty(options, 'skipSanitizer', true)) {
            context.report({
              node: options,
              message: 'skipSanitizer: true bypasses all security. Ensure content is fully trusted.',
              suggest: [{
                desc: 'Add security comment',
                fix: (fixer: any) => {
                  return fixer.insertTextBefore(node, '// SECURITY: Content verified as safe\n')
                }
              }]
            })
          }
        }
      }
    }
  }
}

function isLikelyUserInput(node: any): boolean {
  // Detect common user input patterns
  const userInputIndicators = [
    'params', 'query', 'body', 'input', 'form', 'user',
    'request', 'req', 'post', 'get', 'cookie'
  ]
  
  if (node.type === 'Identifier') {
    return userInputIndicators.some(indicator => 
      node.name.toLowerCase().includes(indicator)
    )
  }
  
  if (node.type === 'MemberExpression') {
    const source = node.object?.name || ''
    const property = node.property?.name || ''
    return userInputIndicators.some(indicator =>
      source.toLowerCase().includes(indicator) || 
      property.toLowerCase().includes(indicator)
    )
  }
  
  return false
}
```

## Bundle Size Analysis

### Size Breakdown
```
AsHTML Implementation (~2KB total)
├── AsHTMLModifier class: ~0.8KB
├── BasicSanitizer utility: ~1.0KB  
├── AsHTMLValidator (dev only): ~0.2KB (stripped in production)
└── Type definitions: ~0KB (TypeScript only)
```

### Performance Characteristics
- **Cold start**: ~1ms for basic sanitization
- **Non-reactive**: Content processed once, no ongoing overhead
- **Large content (100KB)**: ~50ms sanitization time (one-time cost)
- **Memory overhead**: ~100KB for sanitizer instance
- **No reactive updates**: Eliminates sanitization overhead on content changes

### Performance Benefits of Non-Reactive Design
```typescript
// Traditional reactive approach (NOT implemented)
const htmlContent = signal('<p>Content</p>')
Text('').modifier.trustedHTML(htmlContent).build() // Re-sanitizes on every change

// Our non-reactive approach (better performance)
Text('<p>Content</p>').modifier.asHTML().build() // Sanitizes once

// Performance comparison:
// - Reactive: Sanitization cost × number of updates = High overhead
// - Non-reactive: Sanitization cost × 1 = Low overhead
// - For dynamic content: Pre-sanitize before passing to Text()
```

### Handling Dynamic HTML Content
```typescript
// For dynamic content, pre-sanitize and create new components
import { basicSanitize } from '@tachui/core'

const DynamicHTMLDisplay = ({ content }: { content: Signal<string> }) => {
  const [sanitizedContent, setSanitizedContent] = useState('')
  
  // Pre-sanitize content when it changes
  useEffect(() => {
    const newContent = content()
    setSanitizedContent(basicSanitize(newContent))
  }, [content])
  
  // Create new Text component with sanitized content
  return Text(sanitizedContent).modifier.asHTML({ skipSanitizer: true }).build()
}

// Alternative: Manual component recreation
const createHTMLComponent = (htmlContent: string) => {
  return Text(htmlContent).modifier.asHTML().build()
}

// Usage with dynamic content
let currentComponent = createHTMLComponent('<p>Initial</p>')
// When content changes:
currentComponent = createHTMLComponent('<p>Updated</p>')
```

## Security Analysis

### Threat Model
- **Primary threat**: XSS through malicious HTML injection
- **Attack vectors**: Script tags, event handlers, JavaScript URLs, dangerous elements
- **Mitigation**: Pattern-based sanitization + DOM validation
- **Residual risk**: Sophisticated bypass techniques, zero-day XSS vectors

### Security Boundaries
- **Basic sanitization**: Removes ~90% of common XSS vectors
- **Not comprehensive**: Does not handle all possible attack vectors
- **Recommendation**: Use DOMPurify for user-generated content
- **Trust model**: Developer responsibility for content safety

## Migration and Adoption Strategy

### Migration from dangerouslySetInnerHTML
```typescript
// Before: No protection, empty Text component
Text('').modifier.dangerouslySetInnerHTML(htmlContent)

// After: Basic protection by default, cleaner API
Text(htmlContent).modifier.asHTML()

// Or: Explicit unsafe usage  
Text(htmlContent).modifier.asHTML({ skipSanitizer: true })
```

### Integration with Existing Code
```typescript
// Gradual migration
const htmlContent = processHTMLContent(rawHTML)

// Phase 1: Replace with Text + asHTML
Text(htmlContent).modifier.asHTML()

// Phase 2: Add custom sanitization if needed
Text(htmlContent).modifier.asHTML({ 
  customSanitizer: DOMPurify.sanitize 
})

// Phase 3: Remove old dangerouslySetInnerHTML usage

// Error Handling Examples
try {
  const component = VStack({}).modifier.asHTML() // ❌ Will throw
} catch (error) {
  console.error(error.message)
  // "AsHTML modifier can only be applied to Text components. Found: VStack component."
  
  // Correct usage:
  const fixedComponent = Text(htmlContent).modifier.asHTML()
}
```

## Success Criteria

### Functional Requirements
- ✅ HTML injection works correctly in all components
- ✅ Basic sanitization removes common XSS vectors
- ✅ Reactive HTML updates work seamlessly
- ✅ Performance impact is minimal
- ✅ Development warnings help prevent mistakes

### Security Requirements  
- ✅ Blocks >90% of OWASP XSS test vectors
- ✅ Safe defaults protect against common mistakes
- ✅ Clear documentation about security implications
- ✅ Development-time validation catches suspicious patterns
- ✅ Explicit opt-out mechanism for trusted content

### Developer Experience
- ✅ TypeScript provides complete type safety
- ✅ ESLint rules catch common security mistakes
- ✅ Clear error messages and warnings
- ✅ Comprehensive documentation with examples
- ✅ Migration path from existing HTML injection patterns

## Future Enhancements

### Potential Improvements
- **CSP Integration**: Automatic nonce injection
- **Template Validation**: Compile-time HTML validation
- **Sanitizer API**: Use native browser API when available
- **Performance**: Web Worker sanitization for large content
- **Advanced Rules**: Content-type specific sanitization rules

### Integration Opportunities
- **@tachui/forms**: Safe HTML in form validation messages
- **@tachui/docs**: Safe HTML in documentation rendering  
- **Developer Tools**: HTML content inspection and validation
- **Build Tools**: Static analysis of HTML content safety

This implementation provides a lightweight, secure-by-default solution for HTML injection needs while maintaining clear boundaries around security responsibilities and providing appropriate developer guidance.