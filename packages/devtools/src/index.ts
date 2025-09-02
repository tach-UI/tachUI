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

// Version
export const VERSION = '0.1.0'
