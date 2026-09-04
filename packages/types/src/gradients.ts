/**
 * TachUI Gradient Types
 *
 * Type definitions for gradient system.
 * These types are extracted from @tachui/core to enable shared usage.
 */

/**
 * Color space a gradient interpolates through (`linear-gradient(in oklab ...)`).
 *
 * - `'srgb'` is the legacy browser default: complementary pairs pass through a
 *   desaturated gray midpoint.
 * - `'oklab'` takes the straight, perceptually uniform path and never introduces
 *   an intermediate hue.
 * - `'oklch'` interpolates hue, giving the more colorful arc; on hue-distant
 *   endpoints it can route through a hue neither stop has.
 */
export type GradientInterpolation = 'srgb' | 'oklab' | 'oklch'

export interface GradientColors {
  colors: (string | any)[] // Asset type reference removed to avoid circular dependencies
  stops?: number[]
  /**
   * Interpolation space. Anything other than `'srgb'` is emitted as a pair of
   * declarations — the plain sRGB gradient first, the hinted gradient second —
   * so a browser that cannot parse the hint keeps the sRGB one rather than
   * dropping the background. See `gradientToDeclarations`.
   */
  interpolation?: GradientInterpolation
}

export type GradientStartPoint =
  | 'top'
  | 'topLeading'
  | 'leading'
  | 'bottomLeading'
  | 'bottom'
  | 'bottomTrailing'
  | 'trailing'
  | 'topTrailing'
  | 'center'

export type GradientCenter =
  | 'center'
  | 'top'
  | 'bottom'
  | 'leading'
  | 'trailing'
  | [number, number]

export interface LinearGradientOptions extends GradientColors {
  startPoint: GradientStartPoint
  endPoint: GradientStartPoint
  angle?: number
}

export interface RadialGradientOptions extends GradientColors {
  center: GradientCenter
  startRadius: number
  endRadius: number
  shape?: 'circle' | 'ellipse'
}

export interface AngularGradientOptions extends GradientColors {
  center: GradientCenter
  startAngle: number
  endAngle: number
}

export interface RepeatingLinearGradientOptions extends GradientColors {
  direction: string
  colorStops: string[]
}

export interface RepeatingRadialGradientOptions extends GradientColors {
  center: GradientCenter
  shape?: 'circle' | 'ellipse'
  colorStops: string[]
}

export interface ConicGradientOptions extends GradientColors {
  center: GradientCenter
  startAngle: number
  endAngle?: number
}

export interface EllipticalGradientOptions extends GradientColors {
  center: GradientCenter
  radiusX: number
  radiusY: number
}

export type GradientType =
  | 'linear'
  | 'radial'
  | 'angular'
  | 'conic'
  | 'repeating-linear'
  | 'repeating-radial'
  | 'elliptical'

export interface GradientDefinition {
  type: GradientType
  options:
    | LinearGradientOptions
    | RadialGradientOptions
    | AngularGradientOptions
    | ConicGradientOptions
    | RepeatingLinearGradientOptions
    | RepeatingRadialGradientOptions
    | EllipticalGradientOptions
}

export interface TransitionOptions {
  duration: number
  easing?: string
}

export interface GradientAssetDefinitions {
  light: GradientDefinition
  dark: GradientDefinition
  [key: string]: GradientDefinition
}

/**
 * Animation configuration for gradient transitions
 */
export interface GradientAnimationOptions {
  duration?: number // milliseconds
  easing?: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear' | string
  delay?: number // milliseconds
}

/**
 * State-based gradient configuration
 */
export interface StateGradientOptions {
  default: GradientDefinition | string | any // Asset reference removed
  hover?: GradientDefinition | string | any
  active?: GradientDefinition | string | any
  focus?: GradientDefinition | string | any
  disabled?: GradientDefinition | string | any
  animation?: GradientAnimationOptions
}

/**
 * Enhanced background value supporting state-based gradients
 */
export type StatefulBackgroundValue =
  | string
  | GradientDefinition
  | any // Asset reference removed
  | StateGradientOptions

// Helper types for common gradient scenarios
export type HorizontalGradient = GradientDefinition & {
  type: 'linear'
  options: LinearGradientOptions & {
    startPoint: 'leading' | 'trailing'
    endPoint: 'trailing' | 'leading'
  }
}

export type VerticalGradient = GradientDefinition & {
  type: 'linear'
  options: LinearGradientOptions & {
    startPoint: 'top' | 'bottom'
    endPoint: 'bottom' | 'top'
  }
}
