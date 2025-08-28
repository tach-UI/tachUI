/**
 * @fileoverview TachUI Complete Bundle (6.2MB - Backward Compatibility)
 * 
 * Complete framework with all components and features.
 * Maintains backward compatibility with existing applications.
 * 
 * Bundle Contents:
 * - Everything from common bundle
 * - All advanced components (DatePicker, Stepper, Slider, etc.)
 * - All modifiers and utilities
 * - Complete plugin system
 * - Development tools and debugging
 */

// Re-export everything from existing index (maintains backward compatibility)
export * from '../index.js'

/**
 * Complete Bundle Metadata
 */
export const BUNDLE_INFO = {
  name: '@tachui/core',
  version: '0.1.0',
  description: 'Complete TachUI framework with all components and features',
  targetSize: '6.2MB',
  components: 'ALL_COMPONENTS',
  modifiers: 'ALL_MODIFIERS', 
  useCase: 'Backward compatibility, feature-rich applications, everything included'
} as const