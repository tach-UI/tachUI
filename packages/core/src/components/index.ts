/**
 * TachUI Component System
 *
 * Core component infrastructure and utilities that provide
 * the foundation for building reactive UI components.
 */

// Component types and interfaces
export type { ModifiableComponent, ModifierBuilder } from '../modifiers/types'
export type {
  ComponentInstance,
  ComponentProps,
  DOMNode,
} from '../runtime/types'

// Component wrapper system and utilities
export type { WrapperOptions } from './wrapper'
export {
  createModifiableComponentFactory,
  createReactiveWrapper,
  Layout,
  withModifierSupport,
  withModifiers,
  wrapComponent,
} from './wrapper'
