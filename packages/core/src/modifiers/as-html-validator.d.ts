/**
 * Development-time validator for AsHTML content
 * Provides warnings about potentially dangerous content patterns
 */
export declare class AsHTMLValidator {
    private static readonly SUSPICIOUS_PATTERNS;
    /**
     * Validate HTML content in development mode
     */
    static validate(html: string, options?: ValidationOptions): ValidationResult;
    private static looksLikeUserInput;
}
export interface ValidationOptions {
    suppressWarnings?: boolean;
}
export interface ValidationResult {
    isValid: boolean;
    warnings: string[];
}
//# sourceMappingURL=as-html-validator.d.ts.map