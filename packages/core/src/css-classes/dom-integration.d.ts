/**
 * CSS Classes Enhancement - DOM Integration
 *
 * Enhanced DOM node types and utilities for CSS class integration
 */
import type { Signal } from '../reactive/types';
import type { DOMNode } from '../runtime/types';
/**
 * Enhanced DOM node with CSS class support
 */
export interface DOMNodeWithClasses extends DOMNode {
    cssClasses?: string[];
    reactiveClasses?: Signal<string>;
}
/**
 * CSS class application utilities for DOM elements
 */
export interface CSSClassDOMApplicator {
    /**
     * Apply CSS classes to a DOM element
     */
    applyCSSClasses(element: Element, classes: string[] | string): void;
    /**
     * Apply reactive CSS classes to a DOM element
     */
    applyReactiveCSSClasses(element: Element, classSignal: Signal<string>): (() => void);
    /**
     * Update CSS classes on an existing element
     */
    updateCSSClasses(element: Element, newClasses: string[] | string): void;
    /**
     * Remove CSS classes from an element
     */
    removeCSSClasses(element: Element, classes: string[] | string): void;
}
/**
 * DOM CSS class applicator implementation
 */
export declare class DOMCSSClassApplicator implements CSSClassDOMApplicator {
    /**
     * Apply CSS classes to a DOM element
     */
    applyCSSClasses(element: Element, classes: string[] | string): void;
    /**
     * Apply reactive CSS classes to a DOM element
     */
    applyReactiveCSSClasses(element: Element, classSignal: Signal<string>): (() => void);
    /**
     * Update CSS classes on an existing element
     */
    updateCSSClasses(element: Element, newClasses: string[] | string): void;
    /**
     * Remove CSS classes from an element
     */
    removeCSSClasses(element: Element, classes: string[] | string): void;
    /**
     * Merge CSS classes with existing classes on an element
     */
    mergeCSSClasses(element: Element, newClasses: string[] | string): void;
}
/**
 * Global DOM CSS class applicator instance
 */
export declare const domCSSClassApplicator: DOMCSSClassApplicator;
/**
 * Helper function to create DOM nodes with CSS classes
 */
export declare function createDOMNodeWithClasses(tag: string, props?: Record<string, any>, children?: DOMNode[], cssClasses?: string[] | Signal<string>): DOMNodeWithClasses;
/**
 * Utility to extract CSS classes from a DOMNodeWithClasses
 */
export declare function extractCSSClasses(node: DOMNodeWithClasses): {
    static: string[];
    reactive: Signal<string> | undefined;
};
//# sourceMappingURL=dom-integration.d.ts.map