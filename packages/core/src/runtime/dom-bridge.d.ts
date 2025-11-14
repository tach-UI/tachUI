/**
 * DOM Rendering Bridge Layer
 *
 * Critical missing piece that connects TachUI components to actual DOM rendering.
 * This bridges the gap between component instances and browser DOM elements.
 */
import type { ComponentInstance } from './types';
/**
 * Register a component that has lifecycle hooks for later processing
 */
export declare function registerComponentWithLifecycleHooks(component: ComponentInstance): void;
/**
 * Create a reactive root that can mount component trees to DOM.
 *
 * This is the application-level mounting function for TachUI apps.
 * It creates a reactive context and mounts your component tree to the DOM.
 *
 * @param rootFunction - Function that returns the root component of your app
 *
 * @example
 * ```typescript
 * import { mountRoot } from '@tachui/core'
 * import { MyApp } from './MyApp'
 *
 * mountRoot(() => MyApp())
 * ```
 *
 * Note: This requires a DOM element with id="app" to exist.
 */
export declare function mountRoot(rootFunction: () => ComponentInstance): void;
/**
 * Mount a component tree to a DOM container
 */
export declare function mountComponentTree(component: ComponentInstance, container: Element, clearContainer?: boolean): () => void;
/**
 * Unmount a component from DOM
 */
export declare function unmountComponent(component: ComponentInstance, container: Element): void;
/**
 * Enhanced unmount component with lifecycle hooks
 */
export declare function unmountComponentEnhanced(component: ComponentInstance, container: Element): void;
/**
 * Recursively mount component children
 */
export declare function mountComponentChildren(children: ComponentInstance[], container: Element): (() => void)[];
/**
 * Update a mounted component with new props
 */
export declare function updateComponent(component: ComponentInstance, newProps: any): void;
/**
 * Get mounted component from DOM element
 */
export declare function getComponentFromElement(element: Element): ComponentInstance | undefined;
/**
 * Debug utilities for DOM bridge
 */
export declare const DOMBridgeDebug: {
    getMountedComponents: () => [Element, ComponentInstance<import("./types").ComponentProps>][];
    getComponentElements: (component: ComponentInstance) => Element[] | undefined;
    isComponentMounted: (component: ComponentInstance) => boolean;
    /**
     * Validate that all components are properly mounted
     */
    validateMounting(): {
        valid: boolean;
        issues: string[];
    };
};
//# sourceMappingURL=dom-bridge.d.ts.map