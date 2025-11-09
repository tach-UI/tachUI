/**
 * TachUI Reactive System v2.0
 *
 * Enhanced reactive system with unified scheduler, proper error handling,
 * custom equality functions, and complete memory management.
 */

// Cleanup utilities
export {
  type CleanupFunction,
  createCleanupGroup,
  createEventListener,
  createInterval,
  createResource,
  createTimeout,
  dispose,
  onCleanup,
} from './cleanup'
export {
  type Computed,
  type ComputedOptions,
  createComputed,
  createMemo,
  isComputed,
} from './computed'
// Context and ownership
export {
  batch,
  createRoot,
  getOwner,
  getReactiveContext,
  runWithOwner,
  untrack,
} from './context'
export {
  createEffect,
  createOnceEffect,
  createRenderEffect,
  createSyncEffect,
  type Effect,
  type EffectFunction,
} from './effect'
export {
  createEffectBatch,
  createEnhancedEffect,
  createHighPriorityEffect,
  createLowPriorityEffect,
  createResilientEffect,
  createWatchEffect,
  type EffectOptions as EnhancedEffectOptions,
  flushEffectUpdates,
  getEffectPerformanceMetrics,
} from './enhanced-effect'
export {
  createDeepSignal,
  createEnhancedSignal,
  createShallowSignal,
  flushSignalUpdates,
  getEnhancedSignalImpl,
  getSignalPerformanceMetrics,
  isEnhancedSignal,
  type SignalOptions,
} from './enhanced-signal'

// Equality functions
export {
  combineEquals,
  createArrayEquals,
  createObjectEquals,
  createSelectorEquals,
  debugEquals,
  deepEquals,
  defaultEquals,
  type EqualityFunction,
  jsonEquals,
  shallowEquals,
  structuralEquals,
} from './equality'
// Migration utilities
export {
  analyzeReactivePerformance,
  analyzeSignalUsage,
  createLegacySignal,
  createMigrationReport,
  enableReactiveDebugging,
  getMigrationStats,
  migrateBatch,
  migrateReactiveCode,
  migrateToEnhancedSignal,
  resetMigrationStats,
  setMigrationWarnings,
} from './migration'
// Ownership utilities
export {
  createDetachedRoot,
  getOwnerChain,
  getRootOwner,
  isReactiveContext,
  runOutsideReactiveContext,
} from './ownership'
// Scheduler utilities
export {
  enableScheduling,
  getScheduler,
  type Scheduler,
  scheduleIdle,
  scheduleUpdate,
  scheduleWithPriority,
  setScheduler,
  TaskPriority,
} from './scheduler'
// Enhanced reactive primitives
export {
  createSignal,
  flushSync,
  getSignalImpl,
  isSignal,
  type Signal,
  type SignalSetter,
} from './signal'

// Fine-grained reactive lists
export {
  createSignalList,
  createSignalListControls,
  type SignalListControls,
  type SignalListKeyFn,
} from './signal-list'

// Theme management
export {
  detectSystemTheme,
  getCurrentTheme,
  getThemeSignal,
  setTheme,
  type Theme,
} from './theme'
// Core types
export type {
  Accessor,
  AccessorValue,
  Computation,
  ComputationState,
  EffectOptions,
  Owner,
  Setter,
} from './types'
// Enhanced scheduler system
export {
  ReactiveError,
  type ReactiveNode,
  type ReactivePerformanceMetrics,
  ReactiveScheduler,
  UpdatePriority,
} from './unified-scheduler'

// Note: Convenience aliases can be added in user code:
// import { createEnhancedSignal as signal } from '@tachui/core'
