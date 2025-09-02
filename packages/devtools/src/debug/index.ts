/**
 * TachUI Debug System
 *
 * Provides visual debugging tools for component hierarchy and layout
 */

// Re-export debug system
export * from './debug'

// Re-export enhanced errors and types
export * from './enhanced-errors'
export * from './enhanced-types'

// Re-export development warnings
export { DevelopmentWarnings } from './development-warnings'

// Re-export validation debugging tools (with explicit exports to avoid conflicts)
export {
  ValidationDebugger,
  ValidationDebugUtils,
  validationDebugger,
  type ValidationDebugEventType,
  type ComponentDebugInfo,
  type PerformanceSnapshot,
} from './validation-debug-tools'

// Note: DebugEvent and DebugSession types from validation-debug-tools
// are renamed to avoid conflicts with existing debug types
export {
  type DebugEvent as ValidationDebugEvent,
  type DebugSession as ValidationDebugSession,
} from './validation-debug-tools'
