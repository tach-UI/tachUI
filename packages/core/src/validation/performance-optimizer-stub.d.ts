/**
 * Performance Optimizer Stub - Lightweight Production Version
 *
 * Minimal performance optimizer for production builds.
 * Full implementation moved to @tachui/devtools package.
 */
export interface PerformanceOptimizerConfig {
    enabled: boolean;
    targetOverhead: number;
    batchSize: number;
    cacheStrategy: 'aggressive' | 'moderate' | 'conservative';
    asyncValidation: boolean;
    throttleMs: number;
    skipFrames: number;
}
export interface ValidationMetrics {
    operationCount: number;
    totalTime: number;
    averageTime: number;
    maxTime: number;
    cacheHitRate: number;
    skipRate: number;
}
/**
 * Lightweight performance optimizer stub for production
 */
declare class PerformanceOptimizerStub {
    private static instance;
    static getInstance(): PerformanceOptimizerStub;
    configure(_config: Partial<PerformanceOptimizerConfig>): void;
    optimizeValidation<T>(_key: string, validationFn: () => T): T;
    getMetrics(_key?: string): ValidationMetrics | Map<string, ValidationMetrics> | undefined;
    resetMetrics(): void;
}
export declare const performanceOptimizer: PerformanceOptimizerStub;
export declare const PerformanceOptimizationUtils: {
    configure: (_config: Partial<PerformanceOptimizerConfig>) => void;
    getMetrics: (_key?: string) => Map<string, ValidationMetrics> | undefined;
    resetMetrics: () => void;
    getStats: () => {
        enabled: boolean;
        targetOverhead: number;
        batchSize: number;
        cacheStrategy: "moderate";
        metricsCount: number;
        note: string;
    };
};
//# sourceMappingURL=performance-optimizer-stub.d.ts.map
