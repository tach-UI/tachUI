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

import { registerResponsiveModifiers } from './modifiers/responsive'

registerResponsiveModifiers()

export { registerResponsiveModifiers } from './modifiers/responsive'

if (typeof import.meta !== 'undefined' && (import.meta as any).hot) {
  ;(import.meta as any).hot.accept(() => {
    registerResponsiveModifiers({ force: true })
  })
}
