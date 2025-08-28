/**
 * @fileoverview TachUI Essential Bundle (~20KB)
 * 
 * Core runtime only - optimized for custom component development.
 * This bundle re-exports the complete framework but with metadata
 * to guide bundlers for runtime-only optimization.
 */

// For Phase 3, we export everything but provide metadata for runtime-only tree-shaking
export * from '../index.js'

/**
 * Essential Bundle Metadata - guides tree-shaking tools
 */
export const BUNDLE_INFO = {
  name: '@tachui/core/essential',
  version: '0.1.0',
  description: 'Essential TachUI runtime for custom component development',
  targetSize: '~20KB',
  recommendedComponents: [],
  useCase: 'Custom component development, maximum granular control',
  treeShakingHints: {
    include: ['reactive', 'runtime/core', 'compiler/core'],
    exclude: ['components/*', 'modifiers/*', 'gradients/*', 'animations/*', 'plugins/*']
  }
} as const