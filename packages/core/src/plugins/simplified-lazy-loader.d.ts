/**
 * Optimized Lazy Plugin Loader - Week 3 Performance Enhancement
 *
 * Enhanced dynamic plugin loading with performance optimizations:
 * - Load caching and deduplication
 * - Performance metrics tracking
 * - Retry logic with exponential backoff
 * - Memory-efficient loading
 */
import type { TachUIPlugin } from './simplified-types';
interface LoadMetrics {
    startTime: number;
    endTime?: number;
    duration?: number;
    attempts: number;
    success: boolean;
    cacheHit: boolean;
}
/**
 * Performance-optimized lazy plugin loader
 */
export declare class OptimizedLazyPluginLoader {
    private loadPromises;
    private loadedPlugins;
    private loadMetrics;
    private maxRetries;
    private baseRetryDelay;
    loadPlugin(pluginName: string): Promise<TachUIPlugin>;
    private doLoadPluginWithRetry;
    private doLoadPlugin;
    private recordCacheHit;
    private delay;
    isLoading(pluginName: string): boolean;
    isLoaded(pluginName: string): boolean;
    getLoadMetrics(pluginName: string): LoadMetrics | undefined;
    getAllMetrics(): Array<{
        plugin: string;
        metrics: LoadMetrics;
    }>;
    getPerformanceStats(): {
        totalPlugins: number;
        successful: number;
        failed: number;
        cached: number;
        averageLoadTime: number;
        totalLoadTime: number;
        cacheHitRate: number;
    };
    clearCache(pluginName?: string): void;
    unloadPlugin(pluginName: string): void;
    getMemoryUsage(): {
        loadedPlugins: number;
        pendingLoads: number;
        metricsEntries: number;
        estimatedMemoryKB: number;
    };
}
/**
 * Create a lazy plugin loader from a dynamic import function
 */
export declare function createLazyPlugin(importFn: () => Promise<{
    default: TachUIPlugin;
} | TachUIPlugin>): () => Promise<TachUIPlugin>;
//# sourceMappingURL=simplified-lazy-loader.d.ts.map
