/**
 * TachUI Runtime System (Phase 3)
 *
 * Direct DOM rendering engine that provides efficient DOM manipulation
 * without virtual DOM overhead. Integrates with the reactive system
 * to provide surgical DOM updates and component lifecycle management.
 */

export {
  ComponentManager,
  createAdvancedComponent,
  createComponent,
  createFragment,
  createReactiveComponent,
  createRef,
  forwardRef,
  withLifecycle,
} from './component'
// Component context system for state management
export {
  ComponentContextDebug,
  ComponentContextSymbol,
  consumeEnvironmentValue,
  createComponentContext,
  createEnvironmentKey,
  EnvironmentSymbol,
  getCurrentComponentContext,
  provideEnvironmentValue,
  runWithComponentContext,
  setCurrentComponentContext,
  withComponentContext,
  // EnvironmentKey type is exported from state module
} from './component-context'
// Context and DI types
export type { TachUIContext } from './context'
export {
  ContextManager,
  contextUtils,
  createContext,
  createContextConsumer,
  DIContainer,
  defaultContextManager,
  globalDI,
  Injectable,
  inject,
  useContext,
  withProvider,
} from './context'
// Development tools moved to @tachui/devtools
// Import from @tachui/devtools instead
// DOM Bridge - Component mounting system
export {
  mountRoot,
  DOMBridgeDebug,
  getComponentFromElement,
  mountComponentChildren,
  mountComponentTree,
  unmountComponent,
  unmountComponentEnhanced,
  updateComponent,
} from './dom-bridge'
// Error handling system moved to @tachui/devtools - import from that package
export { LifecycleManager } from './lifecycle'
// Runtime utilities
export { mount, unmount, updateProps } from './mounting'
export { lazy, memo } from './optimization'
// Performance monitoring moved to @tachui/devtools - import from that package
// Props and children handling
export {
  ChildrenManager,
  createChildrenManager,
  createPropsManager,
  createRefManager,
  defaultChildrenRenderer,
  PropsManager,
  propsUtils,
  RefManager,
} from './props'
export { DOMRenderer, h, renderComponent, text } from './renderer'
// Element override system (Tag Specification Enhancement)
export * from './element-override'
export * from './semantic-role-manager'
// Development warnings moved to @tachui/devtools
// Import from @tachui/devtools instead
// Enhanced lifecycle hooks (Phase 1)
export {
  AnimationManager,
  FocusManager,
  migrateFromSetTimeout,
  onDOMError,
  onDOMReady,
  onError,
  onMount,
  onUnmount,
  setupOutsideClickDetection,
  setupPositioning,
  useLifecycle,
  withDOMAccess,
  withErrorBoundary,
  withReactiveAsset,
} from '../lifecycle/hooks'
// Core runtime types
export type {
  ChildrenRenderer,
  Component,
  ComponentChildren,
  ComponentContext,
  ComponentInstance,
  ComponentProps,
  ComponentRef,
  ContextSubscription,
  DOMError,
  DOMNode,
  Fragment,
  IDIContainer,
  LifecycleHooks,
  PropsValidator,
  Ref,
  RefCallback,
  RenderFunction,
  ServiceRegistration,
  StrictComponentProps,
  ValidatedProps,
} from './types'
