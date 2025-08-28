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
  GradientCenter
} from './types'

/**
 * Enhanced type predicates for runtime type checking
 */
export const GradientTypeGuards = {
  /**
   * Check if value is a valid gradient definition
   */
  isGradientDefinition(value: unknown): value is GradientDefinition {
    if (!value || typeof value !== 'object') return false
    
    const obj = value as Record<string, unknown>
    return (
      typeof obj.type === 'string' &&
      ['linear', 'radial', 'angular', 'conic', 'repeating-linear', 'repeating-radial', 'elliptical'].includes(obj.type) &&
      obj.options !== undefined &&
      typeof obj.options === 'object' &&
      obj.options !== null
    )
  },

  /**
   * Check if value is a linear gradient
   */
  isLinearGradient(value: unknown): value is GradientDefinition & { type: 'linear' } {
    return this.isGradientDefinition(value) && value.type === 'linear'
  },

  /**
   * Check if value is a radial gradient
   */
  isRadialGradient(value: unknown): value is GradientDefinition & { type: 'radial' } {
    return this.isGradientDefinition(value) && value.type === 'radial'
  },

  /**
   * Check if value is an angular gradient
   */
  isAngularGradient(value: unknown): value is GradientDefinition & { type: 'angular' } {
    return this.isGradientDefinition(value) && value.type === 'angular'
  },

  /**
   * Check if value is a state gradient configuration
   */
  isStateGradientOptions(value: unknown): value is StateGradientOptions {
    if (!value || typeof value !== 'object') return false
    
    const obj = value as Record<string, unknown>
    return 'default' in obj && obj.default !== undefined
  },

  /**
   * Check if value is a stateful background value
   */
  isStatefulBackgroundValue(value: unknown): value is StatefulBackgroundValue {
    if (typeof value === 'string') return true
    if (this.isGradientDefinition(value)) return true
    if (this.isAsset(value)) return true
    if (this.isStateGradientOptions(value)) return true
    return false
  },

  /**
   * Check if value is an Asset
   */
  isAsset(value: unknown): value is Asset {
    return value !== null && 
           typeof value === 'object' && 
           'resolve' in value && 
           typeof (value as any).resolve === 'function'
  },

  /**
   * Check if value is a valid gradient start point
   */
  isGradientStartPoint(value: unknown): value is GradientStartPoint {
    return typeof value === 'string' && [
      'top', 'bottom', 'leading', 'trailing', 'center',
      'topLeading', 'topTrailing', 'bottomLeading', 'bottomTrailing'
    ].includes(value)
  },

  /**
   * Check if value is a valid gradient center
   */
  isGradientCenter(value: unknown): value is GradientCenter {
    if (typeof value === 'string') {
      return ['center', 'top', 'bottom', 'leading', 'trailing'].includes(value)
    }
    if (Array.isArray(value)) {
      return value.length === 2 && 
             typeof value[0] === 'number' && 
             typeof value[1] === 'number'
    }
    return false
  }
} as const

/**
 * Runtime validation functions
 */
export const GradientValidation = {
  /**
   * Validate color format (hex, rgb, rgba, hsl, hsla, named colors, CSS custom properties)
   */
  validateColor(color: string | Asset): { valid: boolean; error?: string } {
    if (GradientTypeGuards.isAsset(color)) {
      return { valid: true } // Assets are validated elsewhere
    }

    if (typeof color !== 'string') {
      return { valid: false, error: 'Color must be a string or Asset' }
    }

    // CSS color name pattern
    const namedColors = /^(transparent|inherit|initial|unset|currentcolor)$/i
    if (namedColors.test(color)) {
      return { valid: true }
    }

    // Hex color pattern
    const hexPattern = /^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i
    if (hexPattern.test(color)) {
      return { valid: true }
    }

    // RGB/RGBA pattern
    const rgbPattern = /^rgba?\(\s*(\d+(?:\.\d+)?%?)\s*,\s*(\d+(?:\.\d+)?%?)\s*,\s*(\d+(?:\.\d+)?%?)\s*(?:,\s*(\d+(?:\.\d+)?%?))?\s*\)$/i
    if (rgbPattern.test(color)) {
      return { valid: true }
    }

    // HSL/HSLA pattern
    const hslPattern = /^hsla?\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?%)\s*,\s*(\d+(?:\.\d+)?%)\s*(?:,\s*(\d+(?:\.\d+)?%?))?\s*\)$/i
    if (hslPattern.test(color)) {
      return { valid: true }
    }

    // CSS custom property pattern
    const customPropertyPattern = /^var\(--[a-zA-Z][a-zA-Z0-9-]*\)$/
    if (customPropertyPattern.test(color)) {
      return { valid: true }
    }

    return { valid: false, error: `Invalid color format: ${color}` }
  },

  /**
   * Validate gradient colors array
   */
  validateColors(colors: (string | Asset)[]): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!Array.isArray(colors)) {
      return { valid: false, errors: ['Colors must be an array'] }
    }

    if (colors.length < 2) {
      return { valid: false, errors: ['Gradient must have at least 2 colors'] }
    }

    colors.forEach((color, index) => {
      const validation = this.validateColor(color)
      if (!validation.valid) {
        errors.push(`Color at index ${index}: ${validation.error}`)
      }
    })

    return { valid: errors.length === 0, errors }
  },

  /**
   * Validate color stops array
   */
  validateStops(stops: number[], colorsLength: number): { valid: boolean; error?: string } {
    if (!Array.isArray(stops)) {
      return { valid: false, error: 'Stops must be an array' }
    }

    if (stops.length !== colorsLength) {
      return { valid: false, error: 'Stops array length must match colors array length' }
    }

    // Check if stops are in ascending order and within 0-100 range
    for (let i = 0; i < stops.length; i++) {
      const stop = stops[i]
      
      if (typeof stop !== 'number') {
        return { valid: false, error: `Stop at index ${i} must be a number` }
      }
      
      if (stop < 0 || stop > 100) {
        return { valid: false, error: `Stop at index ${i} must be between 0 and 100` }
      }
      
      if (i > 0 && stop < stops[i - 1]) {
        return { valid: false, error: `Stops must be in ascending order. Stop at index ${i} (${stop}) is less than previous stop (${stops[i - 1]})` }
      }
    }

    return { valid: true }
  },

  /**
   * Validate linear gradient options
   */
  validateLinearGradient(options: LinearGradientOptions): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // Validate colors
    const colorsValidation = this.validateColors(options.colors)
    if (!colorsValidation.valid) {
      errors.push(...colorsValidation.errors)
    }

    // Validate stops if provided
    if (options.stops) {
      const stopsValidation = this.validateStops(options.stops, options.colors.length)
      if (!stopsValidation.valid) {
        errors.push(stopsValidation.error!)
      }
    }

    // Validate start and end points
    if (!GradientTypeGuards.isGradientStartPoint(options.startPoint)) {
      errors.push(`Invalid startPoint: ${options.startPoint}`)
    }

    if (!GradientTypeGuards.isGradientStartPoint(options.endPoint)) {
      errors.push(`Invalid endPoint: ${options.endPoint}`)
    }

    // Validate angle if provided
    if (options.angle !== undefined) {
      if (typeof options.angle !== 'number') {
        errors.push('Angle must be a number')
      } else if (options.angle < 0 || options.angle > 360) {
        errors.push('Angle must be between 0 and 360 degrees')
      }
    }

    return { valid: errors.length === 0, errors }
  },

  /**
   * Validate radial gradient options
   */
  validateRadialGradient(options: RadialGradientOptions): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // Validate colors
    const colorsValidation = this.validateColors(options.colors)
    if (!colorsValidation.valid) {
      errors.push(...colorsValidation.errors)
    }

    // Validate stops if provided
    if (options.stops) {
      const stopsValidation = this.validateStops(options.stops, options.colors.length)
      if (!stopsValidation.valid) {
        errors.push(stopsValidation.error!)
      }
    }

    // Validate center
    if (!GradientTypeGuards.isGradientCenter(options.center)) {
      errors.push(`Invalid center: ${options.center}`)
    }

    // Validate radii
    if (typeof options.startRadius !== 'number' || options.startRadius < 0) {
      errors.push('startRadius must be a non-negative number')
    }

    if (typeof options.endRadius !== 'number' || options.endRadius < 0) {
      errors.push('endRadius must be a non-negative number')
    }

    if (options.startRadius >= options.endRadius) {
      errors.push('endRadius must be greater than startRadius')
    }

    // Validate shape if provided
    if (options.shape && !['circle', 'ellipse'].includes(options.shape)) {
      errors.push(`Invalid shape: ${options.shape}. Must be 'circle' or 'ellipse'`)
    }

    return { valid: errors.length === 0, errors }
  },

  /**
   * Validate angular gradient options
   */
  validateAngularGradient(options: AngularGradientOptions): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // Validate colors
    const colorsValidation = this.validateColors(options.colors)
    if (!colorsValidation.valid) {
      errors.push(...colorsValidation.errors)
    }

    // Validate center
    if (!GradientTypeGuards.isGradientCenter(options.center)) {
      errors.push(`Invalid center: ${options.center}`)
    }

    // Validate angles
    if (typeof options.startAngle !== 'number') {
      errors.push('startAngle must be a number')
    }

    if (typeof options.endAngle !== 'number') {
      errors.push('endAngle must be a number')
    }

    return { valid: errors.length === 0, errors }
  },

  /**
   * Validate animation options
   */
  validateAnimationOptions(options: GradientAnimationOptions): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (options.duration !== undefined) {
      if (typeof options.duration !== 'number' || options.duration < 0) {
        errors.push('Duration must be a non-negative number')
      }
    }

    if (options.delay !== undefined) {
      if (typeof options.delay !== 'number' || options.delay < 0) {
        errors.push('Delay must be a non-negative number')
      }
    }

    if (options.easing !== undefined) {
      if (typeof options.easing !== 'string') {
        errors.push('Easing must be a string')
      }
    }

    return { valid: errors.length === 0, errors }
  },

  /**
   * Validate state gradient options
   */
  validateStateGradientOptions(options: StateGradientOptions): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // Validate that default state exists
    if (!options.default) {
      errors.push('Default state is required')
    }

    // Validate each state
    const stateKeys = ['default', 'hover', 'active', 'focus', 'disabled'] as const
    stateKeys.forEach(key => {
      const value = options[key]
      if (value && !GradientTypeGuards.isStatefulBackgroundValue(value)) {
        errors.push(`Invalid ${key} state value`)
      }
    })

    // Validate animation options if provided
    if (options.animation) {
      const animationValidation = this.validateAnimationOptions(options.animation)
      if (!animationValidation.valid) {
        errors.push(...animationValidation.errors.map(err => `Animation: ${err}`))
      }
    }

    return { valid: errors.length === 0, errors }
  },

  /**
   * Comprehensive gradient validation
   */
  validateGradient(gradient: GradientDefinition): { valid: boolean; errors: string[] } {
    if (!GradientTypeGuards.isGradientDefinition(gradient)) {
      return { valid: false, errors: ['Invalid gradient definition structure'] }
    }

    switch (gradient.type) {
      case 'linear':
        return this.validateLinearGradient(gradient.options as LinearGradientOptions)
      case 'radial':
        return this.validateRadialGradient(gradient.options as RadialGradientOptions)
      case 'angular':
      case 'conic':
        return this.validateAngularGradient(gradient.options as AngularGradientOptions)
      default:
        return { valid: false, errors: [`Unsupported gradient type: ${gradient.type}`] }
    }
  }
} as const

/**
 * Enhanced TypeScript utility types for better inference
 */
export type GradientPreset = () => GradientDefinition
export type StateGradientPreset = () => StateGradientOptions

/**
 * Branded types for enhanced type safety
 */
export type ValidatedGradient<T extends GradientDefinition = GradientDefinition> = T & {
  readonly __validated: true
}

export type ValidatedStateGradient = StateGradientOptions & {
  readonly __validated: true
}

/**
 * Validation wrapper functions that return branded types
 */
export const createValidatedGradient = <T extends GradientDefinition>(
  gradient: T
): ValidatedGradient<T> | never => {
  const validation = GradientValidation.validateGradient(gradient)
  if (!validation.valid) {
    throw new Error(`Invalid gradient: ${validation.errors.join(', ')}`)
  }
  return gradient as ValidatedGradient<T>
}

export const createValidatedStateGradient = (
  options: StateGradientOptions
): ValidatedStateGradient | never => {
  const validation = GradientValidation.validateStateGradientOptions(options)
  if (!validation.valid) {
    throw new Error(`Invalid state gradient: ${validation.errors.join(', ')}`)
  }
  return options as ValidatedStateGradient
}

/**
 * Development-time validation helpers
 */
export const DevValidation = {
  /**
   * Assert gradient is valid (throws in development, no-op in production)
   */
  assertValidGradient(gradient: GradientDefinition): void {
    if (process.env.NODE_ENV === 'development') {
      const validation = GradientValidation.validateGradient(gradient)
      if (!validation.valid) {
        console.error('Invalid gradient:', gradient)
        console.error('Validation errors:', validation.errors)
        throw new Error(`Invalid gradient: ${validation.errors.join(', ')}`)
      }
    }
  },

  /**
   * Warn about potential gradient issues
   */
  warnGradientIssues(gradient: GradientDefinition): void {
    if (process.env.NODE_ENV === 'development') {
      // Add performance warnings, accessibility checks, etc.
      if ('colors' in gradient.options && gradient.options.colors.length > 5) {
        console.warn('Gradient has many colors which may impact performance:', gradient)
      }
    }
  }
} as const