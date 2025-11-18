/**
 * Component Wrapper System
 *
 * Provides wrapper functions to enhance regular components with modifier support
 * and integrate them with the TachUI modifier system.
 */
import type { ModifiableComponent, ModifierBuilder, ModifiableComponentWithModifiers } from '../modifiers/types';
import type { ComponentInstance, ComponentProps, DOMNode, CloneableComponent, CloneOptions } from '../runtime/types';
import { type ElementOverrideProps } from '../runtime/element-override';
import { ComponentWithCSSClasses, type CSSClassesProps } from '../css-classes';
import type { Concatenatable } from '../concatenation/types';
/**
 * Wrapper options for enhancing components
 */
export interface WrapperOptions {
    enableModifiers?: boolean;
    enableReactivity?: boolean;
    enableErrorBoundary?: boolean;
    enablePerformanceTracking?: boolean;
}
export interface BaseLayoutProps extends ComponentProps, ElementOverrideProps, CSSClassesProps {
    id?: string;
    debugLabel?: string;
    children?: ComponentInstance[];
}
export interface VStackLayoutProps extends BaseLayoutProps {
    spacing?: number;
    alignment?: 'leading' | 'center' | 'trailing';
}
export interface HStackLayoutProps extends BaseLayoutProps {
    spacing?: number;
    alignment?: 'top' | 'center' | 'bottom';
}
export interface ZStackLayoutProps extends BaseLayoutProps {
    alignment?: 'topLeading' | 'top' | 'topTrailing' | 'leading' | 'center' | 'trailing' | 'bottomLeading' | 'bottom' | 'bottomTrailing';
}
/**
 * Enhanced component wrapper that adds modifier support and preserves concatenation methods
 */
export declare function withModifiers<P extends ComponentProps>(component: ComponentInstance<P>): ModifiableComponentWithModifiers<P> & (ComponentInstance<P> extends Concatenatable ? Concatenatable : {});
/**
 * Create a reactive component wrapper with full TachUI features
 */
export declare function createReactiveWrapper<P extends ComponentProps>(renderFn: (props: P) => DOMNode | DOMNode[], options?: WrapperOptions): (props: P) => ModifiableComponentWithModifiers<P>;
/**
 * Layout container component class with element override support
 */
export declare class LayoutComponent extends ComponentWithCSSClasses implements CloneableComponent<ComponentProps & ElementOverrideProps & CSSClassesProps> {
    props: ComponentProps & ElementOverrideProps & CSSClassesProps;
    private layoutType;
    children: ComponentInstance[];
    private layoutProps;
    readonly type: "component";
    readonly id: string;
    mounted: boolean;
    cleanup: (() => void)[];
    private effectiveTag;
    private validationResult;
    constructor(props: ComponentProps & ElementOverrideProps & CSSClassesProps, layoutType: 'vstack' | 'hstack' | 'zstack', children?: ComponentInstance[], layoutProps?: any);
    /**
     * Find DOM elements for a specific child component within the layout container
     */
    private findChildDOMElements;
    render(): {
        type: "element";
        tag: string;
        props: any;
        children: DOMNode[];
        componentMetadata: {
            originalType: string;
            overriddenTo: string | undefined;
            validationResult: any;
        };
    }[] | {
        type: "element";
        tag: string;
        props: {};
        children: never[];
    }[];
    clone(options?: CloneOptions): this;
    shallowClone(): this;
    deepClone(): this;
}
/**
 * Layout container components with modifier support
 */
export declare const Layout: {
    /**
     * Vertical stack container (flexbox column)
     */
    VStack: (props?: VStackLayoutProps) => ModifiableComponent<ComponentProps & ElementOverrideProps & CSSClassesProps> & ModifierBuilder<ModifiableComponent<ComponentProps & ElementOverrideProps & CSSClassesProps>> & {
        modifier: ModifierBuilder<ModifiableComponent<ComponentProps & ElementOverrideProps & CSSClassesProps>>;
    };
    /**
     * Horizontal stack container (flexbox row)
     */
    HStack: (props?: HStackLayoutProps) => ModifiableComponent<ComponentProps & ElementOverrideProps & CSSClassesProps> & ModifierBuilder<ModifiableComponent<ComponentProps & ElementOverrideProps & CSSClassesProps>> & {
        modifier: ModifierBuilder<ModifiableComponent<ComponentProps & ElementOverrideProps & CSSClassesProps>>;
    };
    /**
     * Z-index stack container (absolute positioning)
     */
    ZStack: (props?: ZStackLayoutProps) => ModifiableComponent<ComponentProps & ElementOverrideProps & CSSClassesProps> & ModifierBuilder<ModifiableComponent<ComponentProps & ElementOverrideProps & CSSClassesProps>> & {
        modifier: ModifierBuilder<ModifiableComponent<ComponentProps & ElementOverrideProps & CSSClassesProps>>;
    };
};
/**
 * Utility to wrap any component with modifier support
 */
export declare function wrapComponent<P extends ComponentProps>(component: ComponentInstance<P>): ModifiableComponent<P> & {
    modifier: ModifierBuilder<ModifiableComponent<P>>;
};
/**
 * Higher-order component wrapper
 */
export declare function withModifierSupport<P extends ComponentProps>(ComponentClass: new (props: P) => ComponentInstance<P>): {
    new (props: P): {
        _modifiableComponent?: ModifiableComponent<P>;
        get modifier(): ModifierBuilder<ModifiableComponent<P>>;
        get modifiers(): any;
        type: "component";
        render: import("..").RenderFunction;
        props: P;
        prevProps?: P | undefined;
        children?: import("..").ComponentChildren;
        context?: import("..").ComponentContext;
        cleanup?: import("../runtime/types").LifecycleCleanup[];
        id: string;
        ref?: import("..").Ref | undefined;
        mounted?: boolean;
        domElements?: Map<string, Element>;
        primaryElement?: Element;
        domReady?: boolean;
    };
};
/**
 * Factory function for creating modifiable components
 */
export declare function createModifiableComponentFactory<P extends ComponentProps>(renderFn: (props: P) => DOMNode | DOMNode[]): (props: P) => ModifiableComponent<P> & ModifierBuilder<ModifiableComponent<P>> & {
    modifier: ModifierBuilder<ModifiableComponent<P>>;
};
//# sourceMappingURL=wrapper.d.ts.map