/**
 * Responsive Design System Types
 * 
 * CSS-Native media query and responsive design type definitions for tachUI.
 * Provides comprehensive type safety for responsive modifiers while maintaining
 * backward compatibility with existing modifier system.
 */

/**
 * Standard breakpoint identifiers following Tailwind conventions
 */
export type BreakpointKey = 'base' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'

/**
 * Breakpoint configuration mapping breakpoint keys to CSS values
 */
export interface BreakpointConfig {
  base?: string    // Mobile-first base (no media query)
  sm?: string      // 640px+ (small tablets and large phones)
  md?: string      // 768px+ (tablets)
  lg?: string      // 1024px+ (laptops and small desktops)
  xl?: string      // 1280px+ (large desktops)
  '2xl'?: string   // 1536px+ (extra large screens)
}

/**
 * Default breakpoint values (Tailwind-inspired)
 */
export const DEFAULT_BREAKPOINTS: Required<BreakpointConfig> = {
  base: '0px',      // Mobile-first base
  sm: '640px',      // Small tablets and large phones
  md: '768px',      // Tablets
  lg: '1024px',     // Laptops and small desktops
  xl: '1280px',     // Large desktops
  '2xl': '1536px'   // Extra large screens
} as const

/**
 * Responsive value type that accepts either a single value or breakpoint-specific values
 */
export type ResponsiveValue<T> = T | Partial<Record<BreakpointKey, T>>

/**
 * CSS property values that can be responsive
 */
export type ResponsiveCSSValue = ResponsiveValue<string | number>

/**
 * Advanced media query configuration for custom responsive behavior
 */
export interface MediaQueryConfig {
  query: string                    // Raw CSS media query
  styles: Record<string, string | number>  // CSS properties to apply
}

/**
 * Responsive modifier configuration combining breakpoints and custom media queries
 */
export interface ResponsiveModifierConfig<T = any> {
  breakpoints?: Partial<Record<BreakpointKey, T>>
  mediaQueries?: MediaQueryConfig[]
  fallback?: T  // Fallback value if no conditions match
}

/**
 * Responsive layout configuration for common responsive patterns
 */
export interface ResponsiveLayoutConfig {
  direction?: ResponsiveValue<'row' | 'column' | 'row-reverse' | 'column-reverse'>
  wrap?: ResponsiveValue<'nowrap' | 'wrap' | 'wrap-reverse'>
  justify?: ResponsiveValue<'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly'>
  align?: ResponsiveValue<'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline'>
  gap?: ResponsiveValue<number | string>
}

/**
 * Responsive typography configuration
 */
export interface ResponsiveTypographyConfig {
  fontSize?: ResponsiveValue<number | string>
  lineHeight?: ResponsiveValue<number | string>
  letterSpacing?: ResponsiveValue<number | string>
  fontWeight?: ResponsiveValue<number | string>
  textAlign?: ResponsiveValue<'left' | 'center' | 'right' | 'justify'>
  textTransform?: ResponsiveValue<'none' | 'uppercase' | 'lowercase' | 'capitalize'>
}

/**
 * Responsive spacing configuration
 */
export interface ResponsiveSpacingConfig {
  top?: ResponsiveValue<number | string>
  right?: ResponsiveValue<number | string>
  bottom?: ResponsiveValue<number | string>
  left?: ResponsiveValue<number | string>
  horizontal?: ResponsiveValue<number | string>  // left + right
  vertical?: ResponsiveValue<number | string>    // top + bottom
  all?: ResponsiveValue<number | string>         // all sides
}

/**
 * Responsive dimension configuration
 */
export interface ResponsiveDimensionConfig {
  width?: ResponsiveValue<number | string>
  height?: ResponsiveValue<number | string>
  minWidth?: ResponsiveValue<number | string>
  maxWidth?: ResponsiveValue<number | string>
  minHeight?: ResponsiveValue<number | string>
  maxHeight?: ResponsiveValue<number | string>
}

/**
 * Responsive visibility configuration
 */
export interface ResponsiveVisibilityConfig {
  display?: ResponsiveValue<'none' | 'block' | 'inline' | 'inline-block' | 'flex' | 'inline-flex' | 'grid' | 'inline-grid'>
  visibility?: ResponsiveValue<'visible' | 'hidden' | 'collapse'>
  opacity?: ResponsiveValue<number>
}

/**
 * Comprehensive responsive style configuration
 */
export interface ResponsiveStyleConfig extends 
  ResponsiveLayoutConfig,
  ResponsiveTypographyConfig,
  ResponsiveDimensionConfig,
  ResponsiveVisibilityConfig {
  
  // Additional CSS properties that can be responsive
  backgroundColor?: ResponsiveValue<string>
  color?: ResponsiveValue<string>
  border?: ResponsiveValue<string>
  borderRadius?: ResponsiveValue<number | string>
  boxShadow?: ResponsiveValue<string>
  transform?: ResponsiveValue<string>
  transition?: ResponsiveValue<string>
  
  // Spacing
  padding?: ResponsiveSpacingConfig | ResponsiveValue<number | string>
  margin?: ResponsiveSpacingConfig | ResponsiveValue<number | string>
  
  // Custom CSS properties
  [key: string]: any
}

/**
 * Breakpoint context information for responsive utilities
 */
export interface BreakpointContext {
  current: BreakpointKey
  width: number
  height: number
  isAbove: (breakpoint: BreakpointKey) => boolean
  isBelow: (breakpoint: BreakpointKey) => boolean
  isBetween: (min: BreakpointKey, max: BreakpointKey) => boolean
  matches: (query: string) => boolean
}

/**
 * Responsive modifier factory configuration
 */
export interface ResponsiveModifierFactoryConfig {
  breakpoints?: BreakpointConfig
  generateCSS?: boolean          // Generate CSS media queries vs JavaScript
  fallbackToJS?: boolean         // Fallback to JavaScript if CSS not supported
  optimizeOutput?: boolean       // Optimize generated CSS
  debugMode?: boolean           // Enable responsive debugging
}

/**
 * CSS media query generation result
 */
export interface GeneratedMediaQuery {
  breakpoint: BreakpointKey
  query: string                 // CSS media query string
  styles: Record<string, string | number>  // CSS properties
  selector: string              // CSS selector
}

/**
 * Responsive modifier application result
 */
export interface ResponsiveModifierResult {
  cssRules: string[]            // Generated CSS rules
  mediaQueries: GeneratedMediaQuery[]  // Generated media queries
  fallbackStyles: Record<string, string | number>  // Fallback styles for base
  hasResponsiveStyles: boolean  // Whether responsive styles were applied
}

/**
 * Type guard to check if a value is responsive
 */
export function isResponsiveValue<T>(value: ResponsiveValue<T>): value is Partial<Record<BreakpointKey, T>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) && 
         Object.keys(value).some(key => ['base', 'sm', 'md', 'lg', 'xl', '2xl'].includes(key))
}

/**
 * Type guard to check if a breakpoint key is valid
 */
export function isValidBreakpointKey(key: string): key is BreakpointKey {
  return ['base', 'sm', 'md', 'lg', 'xl', '2xl'].includes(key)
}

/**
 * Utility type to make any property responsive
 */
export type MakeResponsive<T> = {
  [K in keyof T]: ResponsiveValue<T[K]>
}

/**
 * Extract responsive properties from a configuration object
 */
export type ResponsiveProperties<T> = {
  [K in keyof T as T[K] extends ResponsiveValue<any> ? K : never]: T[K]
}

/**
 * Extract non-responsive properties from a configuration object
 */
export type NonResponsiveProperties<T> = {
  [K in keyof T as T[K] extends ResponsiveValue<any> ? never : K]: T[K]
}