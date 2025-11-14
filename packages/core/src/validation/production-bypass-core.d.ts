/**
 * Production Mode Bypass - Core Utilities
 *
 * Essential production detection and optimization utilities.
 * Development/debugging functionality moved to @tachui/devtools.
 */
/**
 * Production mode configuration (minimal)
 */
export interface ProductionConfig {
    enabled: boolean;
    mode: 'development' | 'production' | 'test';
}
/**
 * Core production mode utilities
 */
export declare class ProductionModeManager {
    private static validationDisabled;
    /**
     * Check if we're in production mode
     */
    static isProduction(): boolean;
    /**
     * Check if validation should be bypassed
     */
    static shouldBypassValidation(): boolean;
    /**
     * Configure production mode
     */
    static configure(config: Partial<ProductionConfig>): void;
    /**
     * Manually disable validation (minimal implementation)
     */
    static disableValidation(): void;
    /**
     * Re-enable validation (minimal implementation)
     */
    static enableValidation(): void;
    /**
     * Get basic production info
     */
    static getInfo(): {
        isProduction: boolean;
        mode: "test" | "production" | "development";
        validationDisabled: boolean;
    };
}
/**
 * Create production-optimized function
 */
export declare function createProductionOptimizedFunction<T extends (...args: any[]) => any>(developmentFunction: T, productionFunction?: T): T;
/**
 * Production-optimized component wrapper (minimal version)
 */
export declare function withProductionOptimization<T extends (...args: any[]) => any>(originalConstructor: T, validator?: (args: unknown[]) => void): T;
/**
 * Production-optimized modifier wrapper (minimal version)
 */
export declare function withProductionOptimizedModifier<T extends (...args: any[]) => any>(originalModifier: T, validator?: (args: unknown[]) => void): T;
/**
 * Essential production utilities
 */
export declare const ProductionUtils: {
    isProduction: typeof ProductionModeManager.isProduction;
    shouldBypassValidation: typeof ProductionModeManager.shouldBypassValidation;
    configure: typeof ProductionModeManager.configure;
    getInfo: typeof ProductionModeManager.getInfo;
};
//# sourceMappingURL=production-bypass-core.d.ts.map