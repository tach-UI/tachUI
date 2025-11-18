/**
 * TachUI Component System
 *
 * Core component infrastructure and utilities that provide
 * the foundation for building reactive UI components.
 */
export type { ModifiableComponent, ModifierBuilder } from '../modifiers/types';
export type { ComponentInstance, ComponentProps, DOMNode, } from '../runtime/types';
export type { WrapperOptions, BaseLayoutProps, VStackLayoutProps, HStackLayoutProps, ZStackLayoutProps, } from './wrapper';
export { createModifiableComponentFactory, createReactiveWrapper, Layout, LayoutComponent, withModifierSupport, withModifiers, wrapComponent, } from './wrapper';
export { createComponentInstance, type CreateComponentOptions } from './factory';
//# sourceMappingURL=index.d.ts.map