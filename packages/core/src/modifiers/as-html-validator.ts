/**
 * Development-time validator for AsHTML content
 * Provides warnings about potentially dangerous content patterns
 */

export class AsHTMLValidator {
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
  static validate(html: string, options: ValidationOptions = {}): ValidationResult {
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

export interface ValidationOptions {
  suppressWarnings?: boolean
}

export interface ValidationResult {
  isValid: boolean
  warnings: string[]
}