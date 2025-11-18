/**
 * Migration Utilities for Reactive System v2.0
 *
 * Provides backward compatibility and migration tools for transitioning
 * from the old reactive system to the new unified scheduler system.
 */
import { type UpdatePriority } from './unified-scheduler';
/**
 * Legacy compatibility wrapper for signals
 */
export declare function createLegacySignal<T>(value: T): any;
/**
 * Migrate existing signals to enhanced signals with options
 */
export declare function migrateToEnhancedSignal<T>(originalSignal: [() => T, (value: T) => T], options?: {
    equals?: 'reference' | 'deep' | 'shallow' | 'custom';
    customEquals?: (a: T, b: T) => boolean;
    priority?: UpdatePriority;
    debugName?: string;
}): [() => T, (value: T) => T];
/**
 * Automatically detect and suggest signal migration improvements
 */
export declare function analyzeSignalUsage<T>(signal: () => T): {
    recommendations: string[];
    suggestedMigration: 'enhanced' | 'deep' | 'shallow';
};
/**
 * Batch migration utility for multiple reactive primitives
 */
export declare function migrateBatch(config: {
    signals?: Array<{
        original: [() => any, (value: any) => any];
        options?: any;
    }>;
    computeds?: Array<{
        original: () => any;
        options?: any;
    }>;
    effects?: Array<{
        original: () => undefined | (() => void);
        options?: any;
    }>;
}): {
    signals: Array<[() => any, (value: any) => any]>;
    computeds: Array<() => any>;
    effects: Array<() => void>;
    cleanup: () => void;
};
/**
 * Code transformation utility for automatic migration
 */
export declare function migrateReactiveCode(oldCode: string): {
    newCode: string;
    transformations: string[];
};
/**
 * Performance analyzer for reactive systems
 */
export declare function analyzeReactivePerformance(): {
    scheduler: any;
    signals: {
        total: number;
        recommendations: string[];
    };
    computeds: {
        total: number;
        recommendations: string[];
    };
    effects: {
        total: number;
        recommendations: string[];
    };
    overallScore: number;
    recommendations: string[];
};
/**
 * Debug utilities for migration
 */
export declare function enableReactiveDebugging(options?: {
    verbose: boolean;
}): () => void;
/**
 * Get migration statistics
 */
export declare function getMigrationStats(): {
    signalsConverted: number;
    computedsConverted: number;
    effectsConverted: number;
    errorsFixed: number;
};
/**
 * Reset migration statistics
 */
export declare function resetMigrationStats(): void;
/**
 * Enable/disable migration warnings
 */
export declare function setMigrationWarnings(enabled: boolean): void;
/**
 * Create a migration report
 */
export declare function createMigrationReport(): string;
//# sourceMappingURL=migration.d.ts.map