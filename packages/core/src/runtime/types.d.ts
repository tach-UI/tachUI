/**
 * Runtime System Type Definitions
 *
 * Core types for the TachUI runtime system including component
 * lifecycle, DOM manipulation, and performance monitoring.
 */
/**
 * Core component definition
 */
export interface Component<P = {}> {
  (props: P): ComponentInstance
  displayName?: string
  defaultProps?: Partial<P>
}
/**
 * Component props with children support
 */
export interface ComponentProps {
  children?: ComponentChildren
  key?: string | number
  ref?: ComponentRef
  debugLabel?: string
  [key: string]: any
}
/**
 * Strict component props for type safety
 */
export interface StrictComponentProps {
  children?: ComponentChildren
  key?: string | number
  ref?: ComponentRef
}
/**
 * Props validation function
 */
export type PropsValidator<P> = (props: P) => boolean | string
/**
 * Props with validation
 */
export interface ValidatedProps<P extends ComponentProps> {
  validator?: PropsValidator<P>
  required?: (keyof P)[]
  defaults?: Partial<P> | undefined
}
/**
 * Supported children types
 */
export type ComponentChildren =
  | string
  | number
  | boolean
  | ComponentInstance
  | ComponentChildren[]
  | RenderFunction
  | null
  | undefined
/**
 * Children render function
 */
export type ChildrenRenderer = (children: ComponentChildren) => DOMNode[]
/**
 * Fragment component for multiple children
 */
export interface Fragment {
  children: ComponentChildren[]
}
/**
 * Component instance returned by component functions
 */
export interface ComponentInstance<P extends ComponentProps = ComponentProps> {
  type: 'component'
  render: RenderFunction
  props: P
  prevProps?: P
  children?: ComponentChildren
  context?: ComponentContext
  cleanup?: LifecycleCleanup[]
  id: string
  ref?: Ref | undefined
  mounted?: boolean
  domElements?: Map<string, Element>
  primaryElement?: Element
  domReady?: boolean
}
/**
 * Render function that creates DOM nodes
 */
export type RenderFunction = () => DOMNode | DOMNode[]
/**
 * DOM node representation
 */
export interface DOMNode {
  type: 'element' | 'text' | 'comment'
  tag?: string
  props?: Record<string, any>
  children?: DOMNode[]
  text?: string
  element?: Element | Text | Comment | undefined
  dispose?: (() => void) | undefined
}
/**
 * Component context for dependency injection
 */
export interface ComponentContext {
  id: string
  parent?: ComponentContext
  providers: Map<symbol, any>
  consumers: Set<symbol>
  cleanup: Set<() => void>
  setState(propertyName: string, value: any): void
  getState(propertyName: string): any
  hasState(propertyName: string): boolean
  setBinding(propertyName: string, binding: any): void
  getBinding(propertyName: string): any
  provide<T>(symbol: symbol, value: T): void
  consume<T>(symbol: symbol): T | undefined
  onCleanup(fn: () => void): void
  dispose(): void
}
/**
 * Component lifecycle hooks
 */
export interface LifecycleHooks<P extends ComponentProps = ComponentProps> {
  onMount?: () => undefined | (() => void)
  onUpdate?: (prevProps: P, nextProps: P) => void
  onPropsChange?: (prevProps: P, nextProps: P, changedKeys: (keyof P)[]) => void
  onChildrenChange?: (
    prevChildren: ComponentChildren,
    nextChildren: ComponentChildren
  ) => void
  onUnmount?: () => void
  onError?: (error: Error) => void
  shouldUpdate?: (prevProps: P, nextProps: P) => boolean
  onRender?: () => void
  onDOMReady?: (
    elements: Map<string, Element>,
    primary?: Element
  ) => void | (() => void)
  onDOMError?: (error: DOMError, context: string) => void
}
/**
 * DOM Error type for enhanced error handling
 */
export interface DOMError extends Error {
  code?: string
  element?: Element
  context?: string
}
/**
 * Cleanup function type
 */
export type LifecycleCleanup = () => void
/**
 * Component reference
 */
export interface ComponentRef<T = any> {
  current: T | null
}
/**
 * Ref callback function
 */
export type RefCallback<T = any> = (ref: T | null) => void
/**
 * Ref types union
 */
export type Ref<T = any> = ComponentRef<T> | RefCallback<T> | null
/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  componentId: string
  mountTime: number
  renderTime: number
  updateCount: number
  lastUpdate: number
  memoryUsage: number
}
/**
 * Context provider value
 */
export interface ContextProvider<T> {
  symbol: symbol
  value: T
  subscribers: Set<ComponentContext>
}
/**
 * Dependency injection service registration
 */
export interface ServiceRegistration<T = any> {
  key: symbol | string
  implementation: T | (() => T)
  singleton?: boolean
  scoped?: boolean
  dependencies?: (symbol | string)[]
}
/**
 * DI container interface
 */
export interface IDIContainer {
  register<T>(
    key: symbol | string,
    implementation: T | (() => T),
    options?: {
      singleton?: boolean
      scoped?: boolean
      dependencies?: (symbol | string)[]
    }
  ): void
  resolve<T>(key: symbol | string): T
  has(key: symbol | string): boolean
  clear(): void
}
/**
 * Context subscription info
 */
export interface ContextSubscription {
  contextSymbol: symbol
  componentId: string
  unsubscribe: () => void
}
/**
 * Mount options
 */
export interface MountOptions {
  container: Element
  hydrate?: boolean
  onError?: (error: Error) => void
  enablePerformanceTracking?: boolean
}
/**
 * Update options
 */
export interface UpdateOptions {
  force?: boolean
  suppressEffects?: boolean
}
/**
 * Component tree node for development tools
 */
export interface ComponentTreeNode {
  id: string
  name: string
  props: ComponentProps
  children: ComponentTreeNode[]
  metrics: PerformanceMetrics
  context: string[]
}
//# sourceMappingURL=types.d.ts.map
