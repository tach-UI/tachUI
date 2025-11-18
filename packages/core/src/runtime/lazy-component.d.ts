/**
 * Lazy Component System
 *
 * Provides runtime component resolution with dynamic imports for
 * true component-level lazy loading.
 */
import type { ComponentInstance, DOMNode } from './types';
export interface LazyComponentOptions {
    /** Fallback to show while loading */
    fallback?: DOMNode;
    /** Error fallback when import fails */
    errorFallback?: (error: Error) => DOMNode;
    /** Timeout in milliseconds before showing error */
    timeout?: number;
    /** Preload strategy */
    preload?: 'never' | 'idle' | 'hover' | 'visible' | 'immediate';
}
export type LazyComponentLoader<T = any> = () => Promise<{
    default: T;
} | T>;
export interface LazyComponentState {
    loading: boolean;
    loaded: boolean;
    error: Error | null;
    component: any;
}
/**
 * Create a lazy-loaded component that imports on-demand
 */
export declare function lazy<T extends ComponentInstance>(loader: LazyComponentLoader<T>, options?: LazyComponentOptions): (props: any) => ComponentInstance;
/**
 * Create a suspense boundary for lazy components
 */
export declare function Suspense(props: {
    fallback: DOMNode;
    children: ComponentInstance[];
}): ComponentInstance;
/**
 * Preload a lazy component without rendering
 */
export declare function preloadComponent<T>(loader: LazyComponentLoader<T>): Promise<T>;
/**
 * Create multiple lazy components with shared preloading
 */
export declare function createLazyComponentGroup<T extends Record<string, LazyComponentLoader>>(loaders: T, options?: LazyComponentOptions): {
    [K in keyof T]: ReturnType<typeof lazy>;
};
/**
 * Preload all components in a group
 */
export declare function preloadComponentGroup<T extends Record<string, LazyComponentLoader>>(loaders: T): Promise<{
    [K in keyof T]: any;
}>;
export declare function createVisibilityLazyComponent<T extends ComponentInstance>(loader: LazyComponentLoader<T>, options?: LazyComponentOptions & {
    rootMargin?: string;
    threshold?: number;
}): (props: any) => ComponentInstance;
//# sourceMappingURL=lazy-component.d.ts.map