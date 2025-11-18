/**
 * CSS Classes Enhancement - Class Manager
 *
 * Core CSS class processing system that handles sanitization,
 * deduplication, and integration with tachUI components.
 */
import type { Signal } from '../reactive/types';
import type { CSSClassProcessor, CSSClassConfig } from './types';
/**
 * CSS Class Manager - Core processing system
 */
export declare class CSSClassManager implements CSSClassProcessor {
    private config;
    private classCache;
    private processingCache;
    constructor(config?: Partial<CSSClassConfig>);
    /**
     * Cache helper methods to work with both Map and plain object fallbacks
     */
    private cacheHas;
    private cacheGet;
    private cacheSet;
    private cacheDelete;
    private cacheClear;
    private cacheSize;
    private cacheKeys;
    /**
     * Process CSS classes from various input formats
     */
    processClasses(input: string | string[] | Signal<string | string[]>): string[];
    /**
     * Process an array of class names
     */
    private processClassArray;
    /**
     * Sanitize class name to be valid CSS identifier
     */
    sanitizeClassName(className: string): string;
    /**
     * Deduplicate classes while preserving first occurrence order
     */
    deduplicateClasses(classes: string[]): string[];
    /**
     * Combine tachUI classes with user-provided CSS classes
     * User classes come AFTER tachUI classes for proper CSS cascade
     */
    combineClasses(tachuiClasses: string[], userClasses: string[]): string[];
    /**
     * Update configuration
     */
    updateConfig(config: Partial<CSSClassConfig>): void;
    /**
     * Get current configuration
     */
    getConfig(): CSSClassConfig;
    /**
     * Clear all caches
     */
    clearCaches(): void;
    /**
     * Get cache statistics for debugging
     */
    getCacheStats(): {
        size: number;
        maxSize: number;
        hitRate: number;
    };
    /**
     * Generate cache key for input
     */
    private getCacheKey;
    /**
     * Set cached classes with LRU eviction
     */
    private setCachedClasses;
}
/**
 * Global CSS class manager instance
 */
export declare const cssClassManager: CSSClassManager;
/**
 * Configure global CSS class processing
 */
export declare function configureCSSClasses(config: Partial<CSSClassConfig>): void;
/**
 * Get current CSS class configuration
 */
export declare function getCSSClassConfig(): CSSClassConfig;
//# sourceMappingURL=css-class-manager.d.ts.map