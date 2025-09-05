/**
 * @tachui/devtools - Development & Debugging Tools
 *
 * A comprehensive suite of development tools for tachUI applications.
 * Provides runtime inspection, performance profiling, component debugging,
 * and development-only features that enhance the developer experience.
 */

// Core debugging system
export * from './debug'

// Component inspection system
export * from './inspector'

// Re-export profiler
export * from './profiler'

// Re-export testing
export * from './testing'

// Re-export build-time validation tools
export * from './build-time'

// Error handling system (moved from @tachui/core)
export * from './runtime/error-boundary'
export * from './runtime/error-recovery'
export * from './runtime/error-reporting'
export * from './runtime/error-utils'
export * from './runtime/performance'
export * from './validation/error-reporting'
export * from './validation/enhanced-runtime'
export * from './plugins/simplified-error-handler'

// Version
export const VERSION = '0.1.0'
