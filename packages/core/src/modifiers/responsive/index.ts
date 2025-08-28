/**
 * Responsive Design System - Main Export
 * 
 * Complete CSS-native responsive design system for tachUI.
 * Provides mobile-first responsive modifiers with TypeScript support.
 */

// Type definitions
export * from './types'

// Breakpoint configuration and utilities
export * from './breakpoints'

// CSS generation engine
export * from './css-generator'

// Responsive modifier implementations
export * from './responsive-modifier'

// Enhanced modifier builder with responsive capabilities
export * from './responsive-builder'

// Responsive utilities and hooks
export * from './utilities'

// Responsive layout patterns
export * from './layout-patterns'

// Performance optimizations
export * from './performance'

// Advanced responsive utilities
export * from './advanced-utilities'

// Development tools and debugging
export * from './dev-tools'

// Re-export commonly used types for convenience
export type {
  ResponsiveValue,
  BreakpointKey,
  ResponsiveStyleConfig
} from './types'

export type {
  ResponsiveModifierBuilder
} from './responsive-builder'

// Re-export commonly used functions
export {
  configureBreakpoints,
  initializeResponsiveSystem,
  getCurrentBreakpointConfig,
  getCurrentBreakpoint,
  getViewportDimensions,
  createBreakpointContext,
  generateMediaQuery,
  BreakpointPresets
} from './breakpoints'

export {
  createResponsiveModifier,
  createMediaQueryModifier,
  createResponsivePropertyModifier,
  createResponsiveLayoutModifier
} from './responsive-modifier'

export {
  useBreakpoint,
  useMediaQuery,
  useResponsiveValue,
  withResponsive
} from './utilities'

export {
  DEFAULT_BREAKPOINTS
} from './types'

export {
  MediaQueries,
  enableResponsiveDebugOverlay,
  logResponsiveState
} from './utilities'

export {
  ResponsiveGridPatterns,
  ResponsiveFlexPatterns,
  ResponsiveContainerPatterns,
  ResponsiveVisibilityPatterns,
  ResponsiveSpacingPatterns,
  ResponsiveTypographyPatterns,
  LayoutPatterns,
  ResponsiveGrid,
  Flex,
  Container,
  Visibility,
  Spacing,
  ResponsiveTypography
} from './layout-patterns'

export {
  AdvancedBreakpointUtils,
  ResponsiveHooks,
  ResponsiveTargeting,
  ResponsiveDataUtils,
  ResponsiveAdvanced
} from './advanced-utilities'

export {
  OptimizedCSSGenerator,
  ResponsivePerformanceMonitor,
  cssRuleCache
} from './performance'

export {
  ResponsiveDevTools,
  BrowserCompatibility,
  useResponsiveInspector
} from './dev-tools'