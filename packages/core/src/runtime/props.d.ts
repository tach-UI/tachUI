/**
 * Props and Children Handling System (Phase 3.1.2)
 *
 * Type-safe props system with reactive updates, children handling,
 * and component composition patterns.
 */
import type { ChildrenRenderer, ComponentChildren, ComponentProps, ComponentRef, DOMNode, Fragment, Ref, ValidatedProps } from './types';
/**
 * Props manager for handling component props reactively
 */
export declare class PropsManager<P extends ComponentProps = ComponentProps> {
    private validator?;
    private propsSignal;
    private childrenSignal;
    private changedKeys;
    constructor(initialProps: P, validator?: ValidatedProps<P> | undefined);
    /**
     * Get current props reactively
     */
    getProps(): P;
    /**
     * Update props with validation and change detection
     */
    setProps(newProps: Partial<P>): void;
    /**
     * Get current children reactively
     */
    getChildren(): ComponentChildren;
    /**
     * Set children directly
     */
    setChildren(children: ComponentChildren): void;
    /**
     * Get keys that changed in last update
     */
    getChangedKeys(): (keyof P)[];
    /**
     * Create reactive computed for a specific prop
     */
    createPropComputed<K extends keyof P>(key: K): () => P[K];
    /**
     * Create effect that runs when specific props change
     */
    createPropsEffect(keys: (keyof P)[], effect: (props: P, changedKeys: (keyof P)[]) => void): () => void;
    private validateAndMergeProps;
    private trackChanges;
}
/**
 * Children manager for handling component composition
 */
export declare class ChildrenManager {
    private childrenSignal;
    constructor(initialChildren?: ComponentChildren);
    /**
     * Get current children reactively
     */
    getChildren(): ComponentChildren;
    /**
     * Set new children
     */
    setChildren(children: ComponentChildren): void;
    /**
     * Render children to DOM nodes
     */
    renderChildren(): DOMNode[];
    /**
     * Create fragment with multiple children
     */
    createFragment(children: ComponentChildren[]): Fragment;
    /**
     * Map children with a function
     */
    mapChildren<T>(mapper: (child: ComponentChildren, index: number) => T): T[];
    /**
     * Filter children
     */
    filterChildren(predicate: (child: ComponentChildren, index: number) => boolean): ComponentChildren[];
    /**
     * Count non-null children
     */
    countChildren(): number;
    private renderChildrenArray;
}
/**
 * Ref manager for component references
 */
export declare class RefManager<T = any> {
    private ref;
    constructor(initialValue?: T | null);
    /**
     * Get the ref object
     */
    getRef(): ComponentRef<T>;
    /**
     * Set ref value
     */
    setValue(value: T | null): void;
    /**
     * Get current ref value
     */
    getValue(): T | null;
    /**
     * Apply ref (handle both ref objects and callback refs)
     */
    static applyRef<T>(ref: Ref<T> | undefined, value: T | null): void;
    /**
     * Create a new ref
     */
    static createRef<T = any>(initialValue?: T | null): ComponentRef<T>;
    /**
     * Forward ref to another component
     */
    static forwardRef<T, P extends ComponentProps>(render: (props: P, ref: Ref<T> | undefined) => DOMNode | DOMNode[]): (props: P & {
        ref?: Ref<T>;
    }) => DOMNode | DOMNode[];
}
/**
 * Create props manager with validation
 */
export declare function createPropsManager<P extends ComponentProps>(initialProps: P, validation?: ValidatedProps<P>): PropsManager<P>;
/**
 * Create children manager
 */
export declare function createChildrenManager(initialChildren?: ComponentChildren): ChildrenManager;
/**
 * Create ref manager
 */
export declare function createRefManager<T = any>(initialValue?: T | null): RefManager<T>;
/**
 * Utility functions for props handling
 */
export declare const propsUtils: {
    /**
     * Compare props for changes
     */
    compareProps<P extends ComponentProps>(prevProps: P, nextProps: P): (keyof P)[];
    /**
     * Shallow compare props
     */
    shallowEqual<P extends ComponentProps>(prevProps: P, nextProps: P): boolean;
    /**
     * Pick specific props
     */
    pickProps<P extends ComponentProps, K extends keyof P>(props: P, keys: K[]): Pick<P, K>;
    /**
     * Omit specific props
     */
    omitProps<P extends ComponentProps, K extends keyof P>(props: P, keys: K[]): Omit<P, K>;
};
/**
 * Default children renderer
 */
export declare const defaultChildrenRenderer: ChildrenRenderer;
//# sourceMappingURL=props.d.ts.map