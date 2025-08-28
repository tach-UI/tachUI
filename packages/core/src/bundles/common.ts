/**
 * @fileoverview TachUI Common Bundle (~115KB)
 * 
 * Optimized for typical web applications (80% of use cases).
 * This bundle re-exports the complete framework but with metadata
 * to guide bundlers for common web app optimization.
 */

// For Phase 3, we export everything but provide metadata for optimal tree-shaking
export * from '../index.js'

/**
 * Common Bundle Metadata - guides tree-shaking tools
 */
export const BUNDLE_INFO = {
  name: '@tachui/core/common',
  version: '0.1.0', 
  description: 'Common TachUI bundle for typical web applications',
  targetSize: '~115KB',
  recommendedComponents: [
    'Text', 'Button', 'Image', 'HStack', 'VStack', 'Spacer', 'Show',
    'BasicForm', 'BasicInput', 'Toggle', 'Picker', 'Link',
    'List', 'ScrollView', 'Section', 'Divider'
  ],
  useCase: 'Typical web applications, forms, navigation, lists',
  treeShakingHints: {
    include: ['reactive', 'runtime', 'components/basic', 'components/forms', 'modifiers/common'],
    exclude: ['components/advanced', 'modifiers/advanced', 'gradients/complex']
  }
} as const