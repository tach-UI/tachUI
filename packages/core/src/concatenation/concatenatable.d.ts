/**
 * Concatenatable Interface Implementation
 *
 * Provides the base implementation for components that support concatenation
 * using the SwiftUI-style + operator syntax.
 */
import type { ComponentInstance } from '../runtime/types';
import type { Concatenatable, ComponentSegment } from './types';
import { ConcatenatedComponent } from './concatenated-component';
/**
 * Symbol for concatenation operations - matches the one used in types
 */
export declare const CONCAT_SYMBOL: unique symbol;
/**
 * Base implementation for concatenatable functionality
 * This can be mixed into component classes
 */
export declare abstract class ConcatenatableBase<T = any> implements Concatenatable<T> {
    abstract readonly id: string;
    abstract readonly type: string;
    /**
     * Concatenate this component with another concatenatable component
     */
    concat<U extends Concatenatable<any>>(other: U): ConcatenatedComponent<T | U>;
    /**
     * Convert this component to a segment for concatenation
     */
    abstract toSegment(): ComponentSegment;
    /**
     * Check if this component supports concatenation
     */
    isConcatenatable(): boolean;
    /**
     * Create metadata for a new concatenated component
     */
    protected createMetadata(totalSegments: number): import('./types').ConcatenationMetadata;
    /**
     * Merge metadata when concatenating with existing concatenated component
     */
    protected mergeMetadata(existing: import('./types').ConcatenationMetadata, newTotal: number): import('./types').ConcatenationMetadata;
    /**
     * Determine the accessibility role for this component
     */
    protected determineAccessibilityRole(): 'text' | 'group' | 'composite';
    /**
     * Determine the semantic structure for this component
     */
    protected determineSemanticStructure(): 'inline' | 'block' | 'mixed';
    /**
     * Merge accessibility roles when combining components
     */
    protected mergeAccessibilityRoles(existing: 'text' | 'group' | 'composite'): 'text' | 'group' | 'composite';
    /**
     * Merge semantic structures when combining components
     */
    protected mergeSemanticStructures(existing: 'inline' | 'block' | 'mixed'): 'inline' | 'block' | 'mixed';
}
/**
 * Utility function to make any component concatenatable
 * This can be used as a mixin for existing components
 */
export declare function makeConcatenatable<T extends ComponentInstance>(component: T): T & Concatenatable;
//# sourceMappingURL=concatenatable.d.ts.map