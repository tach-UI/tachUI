/**
 * Lightweight HTML sanitizer that removes common XSS vectors
 * This is NOT a comprehensive solution - use DOMPurify for full protection
 *
 * Provides basic sanitization by:
 * - Removing dangerous patterns (script tags, event handlers, etc.)
 * - Validating DOM structure and attributes
 * - Allowing only safe elements and attributes
 */
export declare class BasicSanitizer {
    private static readonly DANGEROUS_PATTERNS;
    private static readonly ALLOWED_TAGS;
    private static readonly ALLOWED_ATTRIBUTES;
    /**
     * Apply basic sanitization to HTML content
     * Removes dangerous patterns and restricts to allowed elements/attributes
     */
    static sanitize(html: string, options?: BasicSanitizerOptions): string;
    /**
     * Validate DOM structure and attributes using DOMParser
     */
    private static validateDOMStructure;
    /**
     * Recursively clean element and its children
     */
    private static cleanElement;
    /**
     * Get allowed attributes for a specific tag
     */
    private static getAllowedAttributesForTag;
    /**
     * Check if attribute value is safe
     */
    private static isAttributeValueSafe;
    /**
     * Validate URL safety
     */
    private static isUrlSafe;
}
export interface BasicSanitizerOptions {
    /** Custom dangerous patterns to remove */
    customPatterns?: RegExp[];
    /** Override allowed tags */
    allowedTags?: string[];
    /** Override allowed attributes */
    allowedAttributes?: Record<string, string[]>;
    /** Whether to validate DOM structure (default: true) */
    validateDOM?: boolean;
}
/**
 * Convenience function for basic HTML sanitization
 */
export declare function basicSanitize(html: string, options?: BasicSanitizerOptions): string;
//# sourceMappingURL=basic-sanitizer.d.ts.map