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
} from './component-context'
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
export { LifecycleManager } from './lifecycle'
export { mount, unmount, updateProps } from './mounting'
export { lazy, memo } from './optimization'
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
export * from './element-override'
export * from './semantic-role-manager'
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
//# sourceMappingURL=index.d.ts.map
