import type { Asset } from '../assets/types'

export interface GradientColors {
  colors: (string | Asset)[]
  stops?: number[]
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

// Phase 3: Interaction and State Support

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
  default: GradientDefinition | string | Asset
  hover?: GradientDefinition | string | Asset
  active?: GradientDefinition | string | Asset
  focus?: GradientDefinition | string | Asset
  disabled?: GradientDefinition | string | Asset
  animation?: GradientAnimationOptions
}

/**
 * Enhanced background value supporting state-based gradients
 */
export type StatefulBackgroundValue = 
  | string 
  | GradientDefinition 
  | Asset 
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