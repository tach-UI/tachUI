/**
 * Component Wrapper System
 *
 * Provides wrapper functions to enhance regular components with modifier support
 * and integrate them with the TachUI modifier system.
 */
import type { ModifiableComponent, ModifierBuilder } from '../modifiers/types'
import type {
  ComponentInstance,
  ComponentProps,
  DOMNode,
} from '../runtime/types'
import { type ElementOverrideProps } from '../runtime/element-override'
import { type CSSClassesProps } from '../css-classes'
import type { Concatenatable } from '../concatenation/types'
/**
 * Wrapper options for enhancing components
 */
export interface WrapperOptions {
  enableModifiers?: boolean
  enableReactivity?: boolean
  enableErrorBoundary?: boolean
  enablePerformanceTracking?: boolean
}
/**
 * Enhanced component wrapper that adds modifier support and preserves concatenation methods
 */
export declare function withModifiers<P extends ComponentProps>(
  component: ComponentInstance<P>
): ModifiableComponent<P> & {
  modifier: ModifierBuilder<ModifiableComponent<P>>
} & (ComponentInstance<P> extends Concatenatable ? Concatenatable : {})
/**
 * Create a reactive component wrapper with full TachUI features
 */
export declare function createReactiveWrapper<P extends ComponentProps>(
  renderFn: (props: P) => DOMNode | DOMNode[],
  options?: WrapperOptions
): (props: P) => ModifiableComponent<P> & {
  modifier: ModifierBuilder<ModifiableComponent<P>>
}
/**
 * Layout container components with modifier support
 */
export declare const Layout: {
  /**
   * Vertical stack container (flexbox column)
   */
  VStack: (props?: {
    children?: ComponentInstance[]
    spacing?: number
    alignment?: 'leading' | 'center' | 'trailing'
  }) => ModifiableComponent<
    ComponentProps & ElementOverrideProps & CSSClassesProps
  > & {
    modifier: ModifierBuilder<
      ModifiableComponent<
        ComponentProps & ElementOverrideProps & CSSClassesProps
      >
    >
  }
  /**
   * Horizontal stack container (flexbox row)
   */
  HStack: (props?: {
    children?: ComponentInstance[]
    spacing?: number
    alignment?: 'top' | 'center' | 'bottom'
  }) => ModifiableComponent<
    ComponentProps & ElementOverrideProps & CSSClassesProps
  > & {
    modifier: ModifierBuilder<
      ModifiableComponent<
        ComponentProps & ElementOverrideProps & CSSClassesProps
      >
    >
  }
  /**
   * Z-index stack container (absolute positioning)
   */
  ZStack: (props?: {
    children?: ComponentInstance[]
    alignment?:
      | 'topLeading'
      | 'top'
      | 'topTrailing'
      | 'leading'
      | 'center'
      | 'trailing'
      | 'bottomLeading'
      | 'bottom'
      | 'bottomTrailing'
  }) => ModifiableComponent<
    ComponentProps & ElementOverrideProps & CSSClassesProps
  > & {
    modifier: ModifierBuilder<
      ModifiableComponent<
        ComponentProps & ElementOverrideProps & CSSClassesProps
      >
    >
  }
}
/**
 * Utility to wrap any component with modifier support
 */
export declare function wrapComponent<P extends ComponentProps>(
  component: ComponentInstance<P>
): ModifiableComponent<P> & {
  modifier: ModifierBuilder<ModifiableComponent<P>>
}
/**
 * Higher-order component wrapper
 */
export declare function withModifierSupport<P extends ComponentProps>(
  ComponentClass: new (props: P) => ComponentInstance<P>
): {
  new (props: P): {
    _modifiableComponent?: ModifiableComponent<P>
    get modifier(): ModifierBuilder<ModifiableComponent<P>>
    get modifiers(): import('../modifiers').Modifier<{}>[]
    type: 'component'
    render: import('../runtime').RenderFunction
    props: P
    prevProps?: P | undefined
    children?: import('../runtime').ComponentChildren
    context?: import('../runtime').ComponentContext
    cleanup?: import('../runtime/types').LifecycleCleanup[]
    id: string
    ref?: import('../runtime').Ref | undefined
    mounted?: boolean
    domElements?: Map<string, Element>
    primaryElement?: Element
    domReady?: boolean
  }
}
/**
 * Factory function for creating modifiable components
 */
export declare function createModifiableComponentFactory<
  P extends ComponentProps,
>(
  renderFn: (props: P) => DOMNode | DOMNode[]
): (props: P) => ModifiableComponent<P> & {
  modifier: ModifierBuilder<ModifiableComponent<P>>
}
//# sourceMappingURL=wrapper.d.ts.map
