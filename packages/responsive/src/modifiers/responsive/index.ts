/**
 * Responsive Design System - Main Export
 *
 * Complete CSS-native responsive design system for tachUI.
 * Provides mobile-first responsive modifiers with TypeScript support.
 */

import { registerModifierWithMetadata } from '@tachui/core/modifiers'
import type { ModifierRegistry, PluginInfo } from '@tachui/registry'
import { TACHUI_PACKAGE_VERSION } from '../../version'
import {
  createResponsiveModifier,
  createMediaQueryModifier,
  createResponsivePropertyModifier,
  createResponsiveLayoutModifier,
} from './responsive-modifier'

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
  ResponsiveStyleConfig,
} from './types'

export type { ResponsiveModifierBuilder } from './responsive-builder'

export {
  ResponsiveModifierBuilderImpl,
  withResponsive,
  createResponsiveBuilder,
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
  BreakpointPresets,
} from './breakpoints'

export {
  createResponsiveModifier,
  createMediaQueryModifier,
  createResponsivePropertyModifier,
  createResponsiveLayoutModifier,
} from './responsive-modifier'

export { useBreakpoint, useMediaQuery, useResponsiveValue } from './utilities'

export { DEFAULT_BREAKPOINTS } from './types'

export {
  MediaQueries,
  enableResponsiveDebugOverlay,
  logResponsiveState,
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
  ResponsiveTypography,
} from './layout-patterns'

export {
  AdvancedBreakpointUtils,
  ResponsiveHooks,
  ResponsiveTargeting,
  ResponsiveDataUtils,
  ResponsiveAdvanced,
} from './advanced-utilities'

export {
  OptimizedCSSGenerator,
  ResponsivePerformanceMonitor,
  cssRuleCache,
} from './performance'

export {
  ResponsiveDevTools,
  BrowserCompatibility,
  useResponsiveInspector,
} from './dev-tools'

const RESPONSIVE_PLUGIN_INFO: PluginInfo = {
  name: '@tachui/responsive',
  version: TACHUI_PACKAGE_VERSION,
  author: 'TachUI Team',
  verified: true,
}

type ResponsiveRegistration = [
  name: string,
  factory: (...args: any[]) => any,
  metadata: {
    category: 'layout' | 'custom'
    priority: number
    signature: string
    description: string
  }
]

const RESPONSIVE_PRIORITY = 80

const responsiveRegistrations: ResponsiveRegistration[] = [
  [
    'responsive',
    createResponsiveModifier,
    {
      category: 'layout',
      priority: RESPONSIVE_PRIORITY,
      signature: '(config: ResponsiveStyleConfig) => Modifier',
      description:
        'Applies responsive style mappings across configured breakpoints.',
    },
  ],
  [
    'mediaQuery',
    createMediaQueryModifier,
    {
      category: 'layout',
      priority: RESPONSIVE_PRIORITY,
      signature: '(query: string, styles: Record<string, any>) => Modifier',
      description: 'Attaches custom CSS rules for a media query to a component.',
    },
  ],
  [
    'responsiveProperty',
    createResponsivePropertyModifier,
    {
      category: 'layout',
      priority: RESPONSIVE_PRIORITY,
      signature:
        '(property: string, value: ResponsiveValue<any>) => Modifier',
      description:
        'Creates a responsive modifier from a single style property/value map.',
    },
  ],
  [
    'responsiveLayout',
    createResponsiveLayoutModifier,
    {
      category: 'layout',
      priority: RESPONSIVE_PRIORITY,
      signature: '(config: ResponsiveLayoutConfig) => Modifier',
      description:
        'Configures responsive flexbox layout properties such as direction, wrap, and gap.',
    },
  ],
]

let responsiveRegistered = false

export interface RegisterResponsiveModifiersOptions {
  registry?: ModifierRegistry
  plugin?: PluginInfo
  force?: boolean
}

export function registerResponsiveModifiers(
  options?: RegisterResponsiveModifiersOptions,
): void {
  const targetRegistry = options?.registry
  const targetPlugin = options?.plugin ?? RESPONSIVE_PLUGIN_INFO
  const shouldForce = options?.force === true
  const isCustomTarget = Boolean(targetRegistry || options?.plugin)

  if (!isCustomTarget && responsiveRegistered && !shouldForce) {
    return
  }

  responsiveRegistrations.forEach(([name, factory, metadata]) => {
    registerModifierWithMetadata(
      name,
      factory,
      metadata,
      targetRegistry,
      targetPlugin,
    )
  })

  if (!isCustomTarget) {
    responsiveRegistered = true
  }
}
