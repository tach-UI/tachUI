/**
 * Core Concatenation Types
 *
 * Defines the fundamental types and interfaces for component concatenation,
 * enabling SwiftUI-style component composition with the + operator.
 */
import type { ComponentInstance } from '../runtime/types';
import type { Modifier } from '../modifiers/types';
import type { DOMNode } from '../runtime/types';
/**
 * Represents a single component segment within a concatenated component
 */
export interface ComponentSegment {
    /** Unique identifier for this segment */
    id: string;
    /** The wrapped component instance */
    component: ComponentInstance;
    /** Modifiers applied to this specific segment */
    modifiers: Modifier[];
    /** Render this segment to a DOM node */
    render(): DOMNode;
}
/**
 * Metadata describing a concatenated component's structure and accessibility
 */
export interface ConcatenationMetadata {
    /** Total number of segments in the concatenated component */
    totalSegments: number;
    /** ARIA role for accessibility */
    accessibilityRole: 'text' | 'group' | 'composite';
    /** Semantic structure type for CSS rendering */
    semanticStructure: 'inline' | 'block' | 'mixed';
}
/**
 * Accessibility node structure for screen readers
 */
export interface AccessibilityNode {
    /** ARIA role */
    role: string;
    /** Accessibility label */
    label: string;
    /** Child accessibility nodes */
    children?: AccessibilityNode[];
}
/**
 * Type union for concatenation results
 */
export type ConcatenationResult<T, U> = T extends ComponentInstance<infer TProps> ? U extends ComponentInstance<infer UProps> ? ConcatenatedComponent<TProps | UProps> : ConcatenatedComponent<TProps | any> : ConcatenatedComponent<any>;
export declare class ConcatenatedComponent<_T = any> implements ComponentInstance<any> {
    readonly type: 'component';
    readonly id: string;
    mounted: boolean;
    cleanup: (() => void)[];
    props: any;
    segments: ComponentSegment[];
    metadata: ConcatenationMetadata;
    render(): DOMNode[];
}
/**
 * Core interface that components must implement to support concatenation
 */
export interface Concatenatable<T = any> {
    /**
     * Concatenate this component with another concatenatable component
     */
    concat<U extends Concatenatable<any>>(other: U): ConcatenatedComponent<T | U>;
    /**
     * Convert this component to a segment for concatenation
     */
    toSegment(): ComponentSegment;
    /**
     * Check if this component supports concatenation
     */
    isConcatenatable(): boolean;
}
/**
 * Symbol used for concatenation operator overloading
 */
export declare const ConcatenationSymbol: unique symbol;
/**
 * Type guard to check if an object is concatenatable
 */
export declare function isConcatenatable(obj: any): obj is Concatenatable;
/**
 * Type guard to check if an object is a concatenated component
 */
export declare function isConcatenatedComponent(obj: any): obj is ConcatenatedComponent;
//# sourceMappingURL=types.d.ts.map