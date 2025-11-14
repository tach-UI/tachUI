/**
 * CSS Classes Enhancement - Utilities
 *
 * Utility functions for CSS class processing and common patterns.
 */
import type { CSSClassesProps } from './types';
/**
 * Utility functions for CSS class operations
 */
export interface CSSClassUtilities {
    /**
     * Combine multiple class sources into a single class string
     */
    combineClasses(...sources: (string | string[] | undefined)[]): string;
    /**
     * Create conditional classes based on boolean conditions
     */
    conditionalClasses(conditions: Record<string, boolean>): string[];
    /**
     * Merge CSS class props from multiple sources
     */
    mergeClassProps(...props: (CSSClassesProps | undefined)[]): CSSClassesProps;
    /**
     * Extract unique classes from a class string
     */
    extractClasses(classString: string): string[];
    /**
     * Validate CSS class names
     */
    validateClassNames(classes: string[]): {
        valid: string[];
        invalid: string[];
    };
}
/**
 * Create CSS class utilities instance
 */
export declare function createCSSClassUtilities(): CSSClassUtilities;
/**
 * Default CSS class utilities instance
 */
export declare const cssClassUtils: CSSClassUtilities;
/**
 * Common CSS class patterns for popular frameworks
 */
export declare const CSSPatterns: {
    /**
     * Tailwind CSS utility patterns
     */
    tailwind: {
        flexCenter: string;
        flexBetween: string;
        absoluteCenter: string;
        srOnly: string;
        card: string;
        btn: {
            primary: string;
            secondary: string;
            outline: string;
        };
    };
    /**
     * Bootstrap component patterns
     */
    bootstrap: {
        flexCenter: string;
        flexBetween: string;
        srOnly: string;
        card: string;
        btn: {
            primary: string;
            secondary: string;
            outline: string;
        };
    };
};
/**
 * Framework-specific class builders
 */
export declare const FrameworkBuilders: {
    /**
     * Tailwind CSS class builder
     */
    tailwind: {
        spacing: (value: number) => string;
        margin: (value: number) => string;
        textSize: (size: "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "6xl") => string;
        backgroundColor: (color: string) => string;
        textColor: (color: string) => string;
        rounded: (size?: "none" | "sm" | "base" | "md" | "lg" | "xl" | "full") => string;
    };
    /**
     * Bootstrap class builder
     */
    bootstrap: {
        spacing: (value: 1 | 2 | 3 | 4 | 5) => string;
        margin: (value: 1 | 2 | 3 | 4 | 5) => string;
        textSize: (size: 1 | 2 | 3 | 4 | 5 | 6) => string;
        backgroundColor: (color: string) => string;
        textColor: (color: string) => string;
        rounded: (size?: 0 | 1 | 2 | 3 | "circle" | "pill") => string;
    };
};
//# sourceMappingURL=utilities.d.ts.map