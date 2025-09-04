/**
 * CSS Classes Enhancement - Type Definitions
 *
 * Core types for CSS class integration system that enables components
 * to accept CSS classes from external frameworks (Tailwind, Bootstrap, etc.)
 */
import type { Signal } from '../reactive/types'
/**
 * CSS Classes property interface - extended by all component props
 */
export interface CSSClassesProps {
  css?: string | string[] | Signal<string | string[]>
}
/**
 * CSS Class processor interface
 */
export interface CSSClassProcessor {
  /**
   * Process and normalize CSS classes from various input formats
   */
  processClasses(input: string | string[] | Signal<string | string[]>): string[]
  /**
   * Sanitize class names to be valid CSS identifiers
   */
  sanitizeClassName(className: string): string
  /**
   * Deduplicate class arrays while preserving order
   */
  deduplicateClasses(classes: string[]): string[]
  /**
   * Combine tachUI classes with user-provided CSS classes
   */
  combineClasses(tachuiClasses: string[], userClasses: string[]): string[]
}
/**
 * Configuration for CSS class processing
 */
export interface CSSClassConfig {
  sanitizeClassNames: boolean
  sanitizationRules?: {
    allowNumbers: boolean
    allowUnderscores: boolean
    customReplacements: Record<string, string>
  }
  enableCaching: boolean
  maxCacheSize: number
  warnDuplicateClasses: boolean
  warnInvalidClasses: boolean
}
/**
 * Processing result metadata
 */
export interface ClassProcessingResult {
  classes: string[]
  sanitized: string[]
  duplicatesRemoved: number
  invalidClasses: string[]
}
//# sourceMappingURL=types.d.ts.map
