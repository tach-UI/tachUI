/**
 * @tachui/responsive - Advanced Responsive Design Plugin
 *
 * Advanced responsive design utilities that extend the core responsive system
 * with sophisticated breakpoint management, responsive typography, container queries,
 * and adaptive component behaviors.
 */

// Export all responsive modifiers and utilities
export * from './modifiers/responsive'

// Re-export core types for convenience
export type {
  ResponsiveValue,
  BreakpointKey,
  ResponsiveStyleConfig,
  ResponsiveModifierResult,
  BreakpointConfig,
} from './modifiers/responsive/types'

// Re-export commonly used functions
export {
  createResponsiveModifier,
  ResponsiveCSSGenerator,
  CSSInjector,
  configureBreakpoints,
  useBreakpoint,
  useMediaQuery,
  useResponsiveValue,
  DEFAULT_BREAKPOINTS,
} from './modifiers/responsive'

// Registry integration for responsive modifiers
import { globalModifierRegistry } from '@tachui/core'
import {
  createResponsiveModifier,
  createMediaQueryModifier,
  createResponsivePropertyModifier,
  createResponsiveLayoutModifier,
} from './modifiers/responsive'

const responsiveModifierRegistrations: Array<
  [string, (...args: any[]) => any]
> = [
  ['responsive', createResponsiveModifier],
  ['mediaQuery', createMediaQueryModifier],
  ['responsiveProperty', createResponsivePropertyModifier],
  ['responsiveLayout', createResponsiveLayoutModifier],
]

// Auto-register responsive modifiers on import
responsiveModifierRegistrations.forEach(([name, factory]) => {
  globalModifierRegistry.register(name, factory)
})

if (process.env.NODE_ENV !== 'production') {
  console.info(
    `🔍 [@tachui/responsive] Registered ${responsiveModifierRegistrations.length} responsive modifiers with global registry`
  )
}
