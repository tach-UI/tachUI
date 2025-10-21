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

// Import the functions synchronously for immediate availability
import {
  createResponsiveModifier,
  createMediaQueryModifier,
  createResponsivePropertyModifier,
  createResponsiveLayoutModifier,
} from './modifiers/responsive'

// Lazy registration for responsive modifiers
import { registerLazyModifier } from '@tachui/registry'

// Create synchronous lazy loaders for responsive modifiers
const responsiveLazyLoaders: Array<[string, () => any]> = [
  ['responsive', () => createResponsiveModifier],
  ['mediaQuery', () => createMediaQueryModifier],
  ['responsiveProperty', () => createResponsivePropertyModifier],
  ['responsiveLayout', () => createResponsiveLayoutModifier],
]

// Register lazy loaders for responsive modifiers
responsiveLazyLoaders.forEach(([name, loader]) => {
  registerLazyModifier(name, loader)
})

if (process.env.NODE_ENV !== 'production') {
  console.info(
    `📦 [@tachui/responsive] Registered ${responsiveLazyLoaders.length} lazy loaders for responsive modifiers`
  )
}
