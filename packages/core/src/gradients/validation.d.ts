/**
 * Enhanced TypeScript Support and Validation for TachUI Gradients
 *
 * Provides type guards, validation utilities, and enhanced TypeScript inference
 * for gradient configurations.
 */
import type { Asset } from '../assets/types'
import type {
  GradientDefinition,
  LinearGradientOptions,
  RadialGradientOptions,
  AngularGradientOptions,
  StateGradientOptions,
  GradientAnimationOptions,
  StatefulBackgroundValue,
  GradientStartPoint,
  GradientCenter,
} from './types'
/**
 * Enhanced type predicates for runtime type checking
 */
export declare const GradientTypeGuards: {
  /**
   * Check if value is a valid gradient definition
   */
  readonly isGradientDefinition: (value: unknown) => value is GradientDefinition
  /**
   * Check if value is a linear gradient
   */
  readonly isLinearGradient: (value: unknown) => value is GradientDefinition & {
    type: 'linear'
  }
  /**
   * Check if value is a radial gradient
   */
  readonly isRadialGradient: (value: unknown) => value is GradientDefinition & {
    type: 'radial'
  }
  /**
   * Check if value is an angular gradient
   */
  readonly isAngularGradient: (
    value: unknown
  ) => value is GradientDefinition & {
    type: 'angular'
  }
  /**
   * Check if value is a state gradient configuration
   */
  readonly isStateGradientOptions: (
    value: unknown
  ) => value is StateGradientOptions
  /**
   * Check if value is a stateful background value
   */
  readonly isStatefulBackgroundValue: (
    value: unknown
  ) => value is StatefulBackgroundValue
  /**
   * Check if value is an Asset
   */
  readonly isAsset: (value: unknown) => value is Asset
  /**
   * Check if value is a valid gradient start point
   */
  readonly isGradientStartPoint: (value: unknown) => value is GradientStartPoint
  /**
   * Check if value is a valid gradient center
   */
  readonly isGradientCenter: (value: unknown) => value is GradientCenter
}
/**
 * Runtime validation functions
 */
export declare const GradientValidation: {
  /**
   * Validate color format (hex, rgb, rgba, hsl, hsla, named colors, CSS custom properties)
   */
  readonly validateColor: (color: string | Asset) => {
    valid: boolean
    error?: string
  }
  /**
   * Validate gradient colors array
   */
  readonly validateColors: (colors: (string | Asset)[]) => {
    valid: boolean
    errors: string[]
  }
  /**
   * Validate color stops array
   */
  readonly validateStops: (
    stops: number[],
    colorsLength: number
  ) => {
    valid: boolean
    error?: string
  }
  /**
   * Validate linear gradient options
   */
  readonly validateLinearGradient: (options: LinearGradientOptions) => {
    valid: boolean
    errors: string[]
  }
  /**
   * Validate radial gradient options
   */
  readonly validateRadialGradient: (options: RadialGradientOptions) => {
    valid: boolean
    errors: string[]
  }
  /**
   * Validate angular gradient options
   */
  readonly validateAngularGradient: (options: AngularGradientOptions) => {
    valid: boolean
    errors: string[]
  }
  /**
   * Validate animation options
   */
  readonly validateAnimationOptions: (options: GradientAnimationOptions) => {
    valid: boolean
    errors: string[]
  }
  /**
   * Validate state gradient options
   */
  readonly validateStateGradientOptions: (options: StateGradientOptions) => {
    valid: boolean
    errors: string[]
  }
  /**
   * Comprehensive gradient validation
   */
  readonly validateGradient: (gradient: GradientDefinition) => {
    valid: boolean
    errors: string[]
  }
}
/**
 * Enhanced TypeScript utility types for better inference
 */
export type GradientPreset = () => GradientDefinition
export type StateGradientPreset = () => StateGradientOptions
/**
 * Branded types for enhanced type safety
 */
export type ValidatedGradient<
  T extends GradientDefinition = GradientDefinition,
> = T & {
  readonly __validated: true
}
export type ValidatedStateGradient = StateGradientOptions & {
  readonly __validated: true
}
/**
 * Validation wrapper functions that return branded types
 */
export declare const createValidatedGradient: <T extends GradientDefinition>(
  gradient: T
) => ValidatedGradient<T> | never
export declare const createValidatedStateGradient: (
  options: StateGradientOptions
) => ValidatedStateGradient | never
/**
 * Development-time validation helpers
 */
export declare const DevValidation: {
  /**
   * Assert gradient is valid (throws in development, no-op in production)
   */
  readonly assertValidGradient: (gradient: GradientDefinition) => void
  /**
   * Warn about potential gradient issues
   */
  readonly warnGradientIssues: (gradient: GradientDefinition) => void
}
//# sourceMappingURL=validation.d.ts.map
