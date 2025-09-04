/**
 * Gradient Utility Functions and Helper Methods
 *
 * Comprehensive utilities for gradient manipulation, analysis, and transformation.
 */
import type { Asset } from '../assets/types'
import type {
  GradientDefinition,
  StateGradientOptions,
  StatefulBackgroundValue,
} from './types'
/**
 * Color manipulation utilities
 */
export declare const ColorUtils: {
  /**
   * Parse hex color to RGB components
   */
  readonly hexToRgb: (hex: string) => {
    r: number
    g: number
    b: number
  } | null
  /**
   * Convert RGB to hex
   */
  readonly rgbToHex: (r: number, g: number, b: number) => string
  /**
   * Add transparency to a color
   */
  readonly withAlpha: (color: string, alpha: number) => string
  /**
   * Blend two colors
   */
  readonly blendColors: (
    color1: string,
    color2: string,
    ratio?: number
  ) => string
  /**
   * Generate color variations (lighter/darker)
   */
  readonly lighten: (color: string, amount?: number) => string
  readonly darken: (color: string, amount?: number) => string
  /**
   * Generate complementary color
   */
  readonly complement: (color: string) => string
  /**
   * Get contrast ratio between two colors
   */
  readonly getContrastRatio: (color1: string, color2: string) => number
}
/**
 * Gradient transformation utilities
 */
export declare const GradientTransforms: {
  /**
   * Reverse gradient colors
   */
  readonly reverse: <T extends GradientDefinition>(gradient: T) => T
  /**
   * Rotate linear gradient direction
   */
  readonly rotateLinear: (
    gradient: GradientDefinition,
    degrees: number
  ) => GradientDefinition
  /**
   * Scale radial gradient
   */
  readonly scaleRadial: (
    gradient: GradientDefinition,
    scale: number
  ) => GradientDefinition
  /**
   * Add transparency to entire gradient
   */
  readonly withOpacity: (
    gradient: GradientDefinition,
    opacity: number
  ) => GradientDefinition
  /**
   * Mirror a linear gradient (swap start and end points)
   */
  readonly mirror: (gradient: GradientDefinition) => GradientDefinition
  /**
   * Convert linear gradient to radial
   */
  readonly toRadial: (
    gradient: GradientDefinition,
    radius?: number
  ) => GradientDefinition
  /**
   * Convert to angular/conic gradient
   */
  readonly toAngular: (gradient: GradientDefinition) => GradientDefinition
}
/**
 * Gradient analysis utilities
 */
export declare const GradientAnalysis: {
  /**
   * Get gradient color count
   */
  readonly getColorCount: (gradient: GradientDefinition) => number
  /**
   * Extract colors from gradient
   */
  readonly extractColors: (gradient: GradientDefinition) => (string | Asset)[]
  /**
   * Get gradient complexity score (for performance optimization)
   */
  readonly getComplexityScore: (gradient: GradientDefinition) => number
  /**
   * Check if gradient has transparency
   */
  readonly hasTransparency: (gradient: GradientDefinition) => boolean
  /**
   * Estimate rendering performance impact
   */
  readonly getPerformanceImpact: (
    gradient: GradientDefinition
  ) => 'low' | 'medium' | 'high'
}
/**
 * Gradient generation utilities
 */
export declare const GradientGenerators: {
  /**
   * Generate rainbow gradient
   */
  readonly rainbow: (steps?: number) => GradientDefinition
  /**
   * Generate monochromatic gradient
   */
  readonly monochromatic: (
    baseColor: string,
    steps?: number
  ) => GradientDefinition
  /**
   * Generate analogous color gradient
   */
  readonly analogous: (baseColor: string, _range?: number) => GradientDefinition
  /**
   * Generate complementary gradient
   */
  readonly complementary: (
    color1: string,
    color2?: string
  ) => GradientDefinition
  /**
   * Generate sunset gradient
   */
  readonly sunset: () => GradientDefinition
  /**
   * Generate ocean gradient
   */
  readonly ocean: () => GradientDefinition
}
/**
 * State gradient utilities
 */
export declare const StateGradientUtils: {
  /**
   * Create hover effect gradient
   */
  readonly createHoverEffect: (
    baseGradient: GradientDefinition,
    intensity?: number
  ) => StateGradientOptions
  /**
   * Create button gradient states
   */
  readonly createButtonStates: (
    baseColor: string,
    type?: 'primary' | 'secondary' | 'danger'
  ) => StateGradientOptions
  /**
   * Create card hover effect
   */
  readonly createCardHover: (backgroundColor?: string) => StateGradientOptions
}
/**
 * CSS utility functions
 */
export declare const CSSUtils: {
  /**
   * Generate CSS custom properties for gradient
   */
  readonly toCustomProperties: (
    gradient: GradientDefinition,
    prefix?: string
  ) => Record<string, string>
  /**
   * Generate fallback CSS for older browsers
   */
  readonly withFallback: (
    gradient: GradientDefinition,
    fallbackColor: string
  ) => string
  /**
   * Optimize CSS for performance
   */
  readonly optimize: (css: string) => string
}
/**
 * Main gradient utilities export
 */
export declare const GradientUtils: {
  /**
   * Convert any background value to CSS
   */
  readonly toCSS: (background: StatefulBackgroundValue) => string
  /**
   * Deep clone gradient definition
   */
  readonly clone: <T extends GradientDefinition>(gradient: T) => T
  /**
   * Compare two gradients for equality
   */
  readonly equals: (a: GradientDefinition, b: GradientDefinition) => boolean
  /**
   * Generate CSS custom properties for gradient
   */
  readonly toCustomProperties: (
    gradient: GradientDefinition,
    prefix?: string
  ) => Record<string, string>
  /**
   * Generate fallback CSS for older browsers
   */
  readonly withFallback: (
    gradient: GradientDefinition,
    fallbackColor: string
  ) => string
  /**
   * Optimize CSS for performance
   */
  readonly optimize: (css: string) => string
  /**
   * Create hover effect gradient
   */
  readonly createHoverEffect: (
    baseGradient: GradientDefinition,
    intensity?: number
  ) => StateGradientOptions
  /**
   * Create button gradient states
   */
  readonly createButtonStates: (
    baseColor: string,
    type?: 'primary' | 'secondary' | 'danger'
  ) => StateGradientOptions
  /**
   * Create card hover effect
   */
  readonly createCardHover: (backgroundColor?: string) => StateGradientOptions
  /**
   * Generate rainbow gradient
   */
  readonly rainbow: (steps?: number) => GradientDefinition
  /**
   * Generate monochromatic gradient
   */
  readonly monochromatic: (
    baseColor: string,
    steps?: number
  ) => GradientDefinition
  /**
   * Generate analogous color gradient
   */
  readonly analogous: (baseColor: string, _range?: number) => GradientDefinition
  /**
   * Generate complementary gradient
   */
  readonly complementary: (
    color1: string,
    color2?: string
  ) => GradientDefinition
  /**
   * Generate sunset gradient
   */
  readonly sunset: () => GradientDefinition
  /**
   * Generate ocean gradient
   */
  readonly ocean: () => GradientDefinition
  /**
   * Get gradient color count
   */
  readonly getColorCount: (gradient: GradientDefinition) => number
  /**
   * Extract colors from gradient
   */
  readonly extractColors: (gradient: GradientDefinition) => (string | Asset)[]
  /**
   * Get gradient complexity score (for performance optimization)
   */
  readonly getComplexityScore: (gradient: GradientDefinition) => number
  /**
   * Check if gradient has transparency
   */
  readonly hasTransparency: (gradient: GradientDefinition) => boolean
  /**
   * Estimate rendering performance impact
   */
  readonly getPerformanceImpact: (
    gradient: GradientDefinition
  ) => 'low' | 'medium' | 'high'
  /**
   * Reverse gradient colors
   */
  readonly reverse: <T extends GradientDefinition>(gradient: T) => T
  /**
   * Rotate linear gradient direction
   */
  readonly rotateLinear: (
    gradient: GradientDefinition,
    degrees: number
  ) => GradientDefinition
  /**
   * Scale radial gradient
   */
  readonly scaleRadial: (
    gradient: GradientDefinition,
    scale: number
  ) => GradientDefinition
  /**
   * Add transparency to entire gradient
   */
  readonly withOpacity: (
    gradient: GradientDefinition,
    opacity: number
  ) => GradientDefinition
  /**
   * Mirror a linear gradient (swap start and end points)
   */
  readonly mirror: (gradient: GradientDefinition) => GradientDefinition
  /**
   * Convert linear gradient to radial
   */
  readonly toRadial: (
    gradient: GradientDefinition,
    radius?: number
  ) => GradientDefinition
  /**
   * Convert to angular/conic gradient
   */
  readonly toAngular: (gradient: GradientDefinition) => GradientDefinition
  /**
   * Parse hex color to RGB components
   */
  readonly hexToRgb: (hex: string) => {
    r: number
    g: number
    b: number
  } | null
  /**
   * Convert RGB to hex
   */
  readonly rgbToHex: (r: number, g: number, b: number) => string
  /**
   * Add transparency to a color
   */
  readonly withAlpha: (color: string, alpha: number) => string
  /**
   * Blend two colors
   */
  readonly blendColors: (
    color1: string,
    color2: string,
    ratio?: number
  ) => string
  /**
   * Generate color variations (lighter/darker)
   */
  readonly lighten: (color: string, amount?: number) => string
  readonly darken: (color: string, amount?: number) => string
  /**
   * Generate complementary color
   */
  readonly complement: (color: string) => string
  /**
   * Get contrast ratio between two colors
   */
  readonly getContrastRatio: (color1: string, color2: string) => number
}
//# sourceMappingURL=utils.d.ts.map
