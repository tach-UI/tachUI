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
// Error handling and boundaries
export {
  createErrorBoundary,
  ErrorBoundary,
  type ErrorBoundaryProps,
  type ErrorBoundaryState,
  type ErrorCategory,
  type ErrorHandler,
  type ErrorHandlingConfig,
  ErrorManager,
  type ErrorRecoveryConfig,
  type ErrorRecoveryStrategy,
  type ErrorReporter,
  type ErrorSeverity,
  errorReporters,
  errorUtils,
  globalErrorManager,
  type TachUIError,
} from './error-boundary'
// Error recovery
export {
  CircuitBreaker,
  type CircuitBreakerConfig,
  type CircuitBreakerState,
  type FallbackConfig,
  FallbackManager,
  RecoveryOrchestrator,
  RetryPolicy,
  type RetryPolicyConfig,
  recoveryPresets,
  recoveryUtils,
} from './error-recovery'
// Error reporting and logging
export {
  type ErrorAggregation,
  ErrorAggregator,
  globalErrorAggregator,
  globalLogger,
  type LogEntry,
  type Logger,
  type LogLevel,
  type ReportDestination,
  type ReportingConfig,
  reportDestinations,
  reportingUtils,
  StructuredLogger,
  setupErrorReporting,
} from './error-reporting'
// Error utilities and debugging
export {
  devErrorUtils,
  type ErrorAnalysis,
  ErrorPatternDetector,
  errorDebugUtils,
  type PerformanceImpact,
  PerformanceImpactAnalyzer,
  type StackTraceAnalysis,
  StackTraceAnalyzer,
} from './error-utils'
export { LifecycleManager } from './lifecycle'
// Runtime utilities
export { mount, unmount, updateProps } from './mounting'
export { lazy, memo } from './optimization'
export {
  type ComponentMetrics,
  globalPerformanceMonitor,
  type MonitoringOptions,
  type PerformanceListener,
  type PerformanceMetric,
  PerformanceMonitor,
  performanceUtils,
  type ReactiveMetrics,
} from './performance'
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
