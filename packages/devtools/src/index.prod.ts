/**
 * @tachui/devtools - Production Stubs
 *
 * Lightweight production stubs that get tree-shaken away.
 * This file provides no-op implementations of all devtools exports
 * to prevent devtools code from being included in production bundles.
 */

// Core debugging system - lightweight stubs
export const enableDebug = () => {}
export const debugManager = {
  enable: () => {},
  disable: () => {},
  log: () => {},
  warn: () => {},
  error: () => {},
  group: () => {},
  groupEnd: () => {},
  time: () => {},
  timeEnd: () => {},
  clear: () => {},
  isEnabled: () => false,
}

// Component inspection system - no-ops
export const Inspector = {
  create: () => ({}),
  destroy: () => {},
  inspect: () => ({}),
  highlight: () => {},
  unhighlight: () => {},
}

// Profiler - no-ops
export const Profiler = {
  start: () => {},
  stop: () => {},
  mark: () => {},
  measure: () => {},
  getEntries: () => [],
}

// Testing utilities - no-ops
export const TestingUtils = {
  createTestRenderer: () => ({}),
  waitFor: async () => {},
  fireEvent: () => {},
}

// Build-time validation - no-ops
export const BuildTimeValidator = {
  validate: () => true,
  getErrors: () => [],
  getWarnings: () => [],
}

// Error handling system - minimal stubs
export const ErrorBoundary = () => null
export const ErrorRecovery = {
  recover: () => {},
  reset: () => {},
}
export const ErrorReporting = {
  report: () => {},
  subscribe: () => () => {},
}

// Development warnings - no-op
export const DevelopmentWarnings = {
  warn: () => {},
  suppress: () => {},
  enable: () => {},
  disable: () => {},
}

// Validation debugging - no-ops
export const ValidationDebugger = {
  log: () => {},
  track: () => {},
  getSnapshot: () => ({}),
}
export const ValidationDebugUtils = {
  formatError: (err: any) => err?.message || 'Unknown error',
  getComponentInfo: () => ({}),
}
export const validationDebugger = ValidationDebugger

// Performance monitoring - no-ops
export const PerformanceMonitor = {
  start: () => {},
  stop: () => {},
  measure: () => {},
  getMetrics: () => ({}),
}

// Types (empty objects for compatibility)
export type ValidationDebugEventType = string
export type ComponentDebugInfo = Record<string, any>
export type PerformanceSnapshot = Record<string, any>
export type ValidationDebugEvent = Record<string, any>
export type ValidationDebugSession = Record<string, any>

// Version
export const VERSION = '0.8.0-alpha'
