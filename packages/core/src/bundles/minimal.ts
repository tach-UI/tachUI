/**
 * @fileoverview TachUI Minimal Bundle (~60KB)
 * 
 * Optimized for calculator-style apps and landing pages.
 * This bundle re-exports the complete framework but with metadata
 * to guide bundlers on tree-shaking optimization.
 */

// For Phase 3, we export everything but provide metadata for optimal tree-shaking
export * from '../index'

/**
 * Minimal Bundle Metadata - guides tree-shaking tools
 */
export const BUNDLE_INFO = {
  name: '@tachui/core/minimal',
  version: '0.1.0',
  description: 'Minimal TachUI bundle for calculator-style apps and landing pages',
  targetSize: '~60KB',
  recommendedComponents: ['Text', 'Button', 'Image', 'HStack', 'VStack', 'Spacer', 'Show'],
  useCase: 'Calculator-style apps, landing pages, simple UIs',
  treeShakingHints: {
    include: ['reactive', 'runtime', 'components/basic', 'modifiers/basic'],
    exclude: ['components/advanced', 'modifiers/advanced', 'gradients', 'animations']
  }
} as const