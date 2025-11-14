/**
 * Component Management System (Phase 3.1.1)
 *
 * Core component lifecycle management including creation, mounting,
 * updating, and cleanup. Integrates with the reactive system to
 * provide efficient component updates.
 */
import { ChildrenManager, PropsManager, RefManager } from './props';
import type { Component, ComponentChildren, ComponentInstance, ComponentProps, DOMNode, LifecycleHooks, Ref, ValidatedProps } from './types';
/**
 * Global component registry and lifecycle management
 */
export declare class ComponentManager {
    private static instance;
    private components;
    private contexts;
    private cleanupQueue;
    private updateQueue;
    private isUpdating;
    static getInstance(): ComponentManager;
    /**
     * Register a new component instance
     */
    registerComponent(instance: ComponentInstance): void;
    /**
     * Unregister and cleanup a component
     */
    unregisterComponent(id: string): void;
    /**
     * Get component instance by ID
     */
    getComponent(id: string): ComponentInstance | undefined;
    /**
     * Schedule component for update
     */
    scheduleUpdate(id: string): void;
    /**
     * Process all scheduled updates
     */
    private flushUpdates;
    /**
     * Update a specific component instance
     */
    private updateComponent;
    /**
     * Cleanup context by ID
     */
    private cleanupContext;
    /**
     * Get all registered components (for debugging)
     */
    getAllComponents(): ComponentInstance[];
    /**
     * Cleanup all components and resources
     */
    cleanup(): void;
}
/**
 * Create a new component with enhanced props and children handling
 */
export declare function createComponent<P extends ComponentProps = ComponentProps>(render: (props: P, children?: ComponentChildren) => DOMNode | DOMNode[], options?: {
    displayName?: string;
    defaultProps?: Partial<P>;
    lifecycle?: LifecycleHooks<P>;
    validation?: ValidatedProps<P>;
    shouldUpdate?: (prevProps: P, nextProps: P) => boolean;
}): Component<P>;
/**
 * Higher-order component for adding lifecycle hooks
 */
export declare function withLifecycle<P extends ComponentProps>(component: Component<P>, hooks: LifecycleHooks<P>): Component<P>;
/**
 * Create a reactive component that updates when props change
 */
export declare function createReactiveComponent<P extends ComponentProps>(render: (props: P, children?: ComponentChildren) => DOMNode | DOMNode[]): Component<P>;
/**
 * Component error boundary
 */
export declare function createErrorBoundary<P extends ComponentProps>(fallback: (error: Error) => DOMNode | DOMNode[]): Component<P & {
    children: ComponentChildren;
}>;
/**
 * Create a component with advanced props handling
 */
export declare function createAdvancedComponent<P extends ComponentProps>(render: (props: P, children: ComponentChildren, helpers: {
    propsManager: PropsManager<P>;
    childrenManager: ChildrenManager;
    refManager: RefManager;
}) => DOMNode | DOMNode[], options?: {
    displayName?: string;
    defaultProps?: Partial<P>;
    validation?: ValidatedProps<P>;
    lifecycle?: LifecycleHooks<P>;
    shouldUpdate?: (prevProps: P, nextProps: P) => boolean;
}): Component<P>;
/**
 * Create fragment component for multiple children
 */
export declare function createFragment(children: ComponentChildren[]): ComponentInstance;
/**
 * Create ref object
 */
export declare function createRef<T = any>(initialValue?: T | null): {
    current: T | null;
};
/**
 * Forward ref to child component
 */
export declare function forwardRef<T, P extends ComponentProps>(render: (props: P, ref: Ref<T> | undefined) => DOMNode | DOMNode[]): Component<P & {
    ref?: Ref<T>;
}>;
//# sourceMappingURL=component.d.ts.map