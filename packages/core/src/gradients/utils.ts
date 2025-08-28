/**
 * Gradient Utility Functions and Helper Methods
 * 
 * Comprehensive utilities for gradient manipulation, analysis, and transformation.
 */

import type { Asset } from '../assets/types'
import type {
  GradientDefinition,
  LinearGradientOptions,
  RadialGradientOptions,
  StateGradientOptions,
  StatefulBackgroundValue
} from './types'
import { LinearGradient, RadialGradient, AngularGradient } from './index'
import { gradientToCSS } from './css-generator'

/**
 * Color manipulation utilities
 */
export const ColorUtils = {
  /**
   * Parse hex color to RGB components
   */
  hexToRgb: (hex: string): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null
  },

  /**
   * Convert RGB to hex
   */
  rgbToHex: (r: number, g: number, b: number): string => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)
  },

  /**
   * Add transparency to a color
   */
  withAlpha: (color: string, alpha: number): string => {
    if (color.startsWith('#')) {
      const rgb = ColorUtils.hexToRgb(color)
      if (rgb) {
        return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`
      }
    }
    if (color.startsWith('rgb(')) {
      return color.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`)
    }
    if (color.startsWith('rgba(')) {
      // Replace existing alpha
      return color.replace(/,\s*[\d.]+\)$/, `, ${alpha})`)
    }
    return color
  },

  /**
   * Blend two colors
   */
  blendColors: (color1: string, color2: string, ratio: number = 0.5): string => {
    const rgb1 = ColorUtils.hexToRgb(color1)
    const rgb2 = ColorUtils.hexToRgb(color2)
    
    if (!rgb1 || !rgb2) return color1
    
    const r = Math.round(rgb1.r * (1 - ratio) + rgb2.r * ratio)
    const g = Math.round(rgb1.g * (1 - ratio) + rgb2.g * ratio)
    const b = Math.round(rgb1.b * (1 - ratio) + rgb2.b * ratio)
    
    return ColorUtils.rgbToHex(r, g, b)
  },

  /**
   * Generate color variations (lighter/darker)
   */
  lighten: (color: string, amount: number = 0.2): string => {
    return ColorUtils.blendColors(color, '#ffffff', amount)
  },

  darken: (color: string, amount: number = 0.2): string => {
    return ColorUtils.blendColors(color, '#000000', amount)
  },

  /**
   * Generate complementary color
   */
  complement: (color: string): string => {
    const rgb = ColorUtils.hexToRgb(color)
    if (!rgb) return color
    
    return ColorUtils.rgbToHex(255 - rgb.r, 255 - rgb.g, 255 - rgb.b)
  },

  /**
   * Get contrast ratio between two colors
   */
  getContrastRatio: (color1: string, color2: string): number => {
    const getLuminance = (color: string): number => {
      const rgb = ColorUtils.hexToRgb(color)
      if (!rgb) return 0
      
      const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(c => {
        c = c / 255
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
      })
      
      return 0.2126 * r + 0.7152 * g + 0.0722 * b
    }
    
    const lum1 = getLuminance(color1)
    const lum2 = getLuminance(color2)
    const brightest = Math.max(lum1, lum2)
    const darkest = Math.min(lum1, lum2)
    
    return (brightest + 0.05) / (darkest + 0.05)
  }
} as const

/**
 * Gradient transformation utilities
 */
export const GradientTransforms = {
  /**
   * Reverse gradient colors
   */
  reverse: <T extends GradientDefinition>(gradient: T): T => {
    const newGradient = { ...gradient }
    if ('colors' in newGradient.options) {
      newGradient.options = {
        ...newGradient.options,
        colors: [...newGradient.options.colors].reverse(),
        stops: newGradient.options.stops ? [...newGradient.options.stops].reverse() : undefined
      }
    }
    return newGradient
  },

  /**
   * Rotate linear gradient direction
   */
  rotateLinear: (gradient: GradientDefinition, degrees: number): GradientDefinition => {
    if (gradient.type !== 'linear') return gradient
    
    const options = gradient.options as LinearGradientOptions
    return {
      ...gradient,
      options: {
        ...options,
        angle: (options.angle || 0) + degrees
      }
    }
  },

  /**
   * Scale radial gradient
   */
  scaleRadial: (gradient: GradientDefinition, scale: number): GradientDefinition => {
    if (gradient.type !== 'radial') return gradient
    
    const options = gradient.options as RadialGradientOptions
    return {
      ...gradient,
      options: {
        ...options,
        startRadius: options.startRadius * scale,
        endRadius: options.endRadius * scale
      }
    }
  },

  /**
   * Add transparency to entire gradient
   */
  withOpacity: (gradient: GradientDefinition, opacity: number): GradientDefinition => {
    const newGradient = { ...gradient }
    if ('colors' in newGradient.options) {
      newGradient.options = {
        ...newGradient.options,
        colors: newGradient.options.colors.map(color => 
          typeof color === 'string' ? ColorUtils.withAlpha(color, opacity) : color
        )
      }
    }
    return newGradient
  },

  /**
   * Mirror a linear gradient (swap start and end points)
   */
  mirror: (gradient: GradientDefinition): GradientDefinition => {
    if (gradient.type !== 'linear') return gradient
    
    const options = gradient.options as LinearGradientOptions
    return {
      ...gradient,
      options: {
        ...options,
        startPoint: options.endPoint,
        endPoint: options.startPoint
      }
    }
  },

  /**
   * Convert linear gradient to radial
   */
  toRadial: (gradient: GradientDefinition, radius: number = 100): GradientDefinition => {
    if (gradient.type !== 'linear') return gradient
    
    const options = gradient.options as LinearGradientOptions
    return RadialGradient({
      colors: options.colors,
      stops: options.stops,
      center: 'center',
      startRadius: 0,
      endRadius: radius
    })
  },

  /**
   * Convert to angular/conic gradient
   */
  toAngular: (gradient: GradientDefinition): GradientDefinition => {
    if ('colors' in gradient.options) {
      return AngularGradient({
        colors: gradient.options.colors,
        stops: gradient.options.stops,
        center: 'center',
        startAngle: 0,
        endAngle: 360
      })
    }
    return gradient
  }
} as const

/**
 * Gradient analysis utilities
 */
export const GradientAnalysis = {
  /**
   * Get gradient color count
   */
  getColorCount: (gradient: GradientDefinition): number => {
    if ('colors' in gradient.options) {
      return gradient.options.colors.length
    }
    return 0
  },

  /**
   * Extract colors from gradient
   */
  extractColors: (gradient: GradientDefinition): (string | Asset)[] => {
    if ('colors' in gradient.options) {
      return [...gradient.options.colors]
    }
    return []
  },

  /**
   * Get gradient complexity score (for performance optimization)
   */
  getComplexityScore: (gradient: GradientDefinition): number => {
    let score = 0
    
    if ('colors' in gradient.options) {
      score += gradient.options.colors.length * 2
      score += gradient.options.stops ? gradient.options.stops.length : 0
    }
    
    // Add complexity for gradient type
    switch (gradient.type) {
      case 'linear': score += 1; break
      case 'radial': score += 3; break
      case 'angular': score += 4; break
      case 'repeating-linear': score += 5; break
      case 'repeating-radial': score += 6; break
    }
    
    return score
  },

  /**
   * Check if gradient has transparency
   */
  hasTransparency: (gradient: GradientDefinition): boolean => {
    if ('colors' in gradient.options) {
      return gradient.options.colors.some(color => 
        typeof color === 'string' && (
          color.includes('rgba') || 
          color.includes('transparent') ||
          color.includes('hsla')
        )
      )
    }
    return false
  },

  /**
   * Estimate rendering performance impact
   */
  getPerformanceImpact: (gradient: GradientDefinition): 'low' | 'medium' | 'high' => {
    const complexity = GradientAnalysis.getComplexityScore(gradient)
    
    if (complexity <= 5) return 'low'
    if (complexity <= 10) return 'medium'
    return 'high'
  }
} as const

/**
 * Gradient generation utilities
 */
export const GradientGenerators = {
  /**
   * Generate rainbow gradient
   */
  rainbow: (steps: number = 6): GradientDefinition => {
    const colors: string[] = []
    for (let i = 0; i < steps; i++) {
      const hue = (i * 360) / steps
      colors.push(`hsl(${hue}, 100%, 50%)`)
    }
    
    return LinearGradient({
      colors,
      startPoint: 'leading',
      endPoint: 'trailing'
    })
  },

  /**
   * Generate monochromatic gradient
   */
  monochromatic: (baseColor: string, steps: number = 5): GradientDefinition => {
    const colors: string[] = []
    
    for (let i = 0; i < steps; i++) {
      const ratio = i / (steps - 1)
      if (ratio < 0.5) {
        // Lighter variants
        colors.push(ColorUtils.lighten(baseColor, 0.4 - ratio * 0.8))
      } else {
        // Darker variants
        colors.push(ColorUtils.darken(baseColor, (ratio - 0.5) * 0.8))
      }
    }
    
    return LinearGradient({
      colors,
      startPoint: 'top',
      endPoint: 'bottom'
    })
  },

  /**
   * Generate analogous color gradient
   */
  analogous: (baseColor: string, _range: number = 60): GradientDefinition => {
    // This would require HSL color manipulation
    // Placeholder implementation
    return LinearGradient({
      colors: [baseColor, ColorUtils.lighten(baseColor, 0.2), ColorUtils.darken(baseColor, 0.2)],
      startPoint: 'topLeading',
      endPoint: 'bottomTrailing'
    })
  },

  /**
   * Generate complementary gradient
   */
  complementary: (color1: string, color2?: string): GradientDefinition => {
    const secondColor = color2 || ColorUtils.complement(color1)
    
    return LinearGradient({
      colors: [color1, secondColor],
      startPoint: 'topLeading',
      endPoint: 'bottomTrailing'
    })
  },

  /**
   * Generate sunset gradient
   */
  sunset: (): GradientDefinition => {
    return LinearGradient({
      colors: ['#ff7e5f', '#feb47b', '#ff6b6b', '#c44569'],
      startPoint: 'top',
      endPoint: 'bottom'
    })
  },

  /**
   * Generate ocean gradient
   */
  ocean: (): GradientDefinition => {
    return LinearGradient({
      colors: ['#667eea', '#764ba2', '#667eea'],
      startPoint: 'topLeading',
      endPoint: 'bottomTrailing'
    })
  }
} as const

/**
 * State gradient utilities
 */
export const StateGradientUtils = {
  /**
   * Create hover effect gradient
   */
  createHoverEffect: (
    baseGradient: GradientDefinition,
    intensity: number = 0.1
  ): StateGradientOptions => {
    const hoverGradient = GradientTransforms.withOpacity(
      GradientTransforms.reverse(baseGradient),
      1 - intensity
    )
    
    return {
      default: baseGradient,
      hover: hoverGradient,
      animation: {
        duration: 200,
        easing: 'ease-out'
      }
    }
  },

  /**
   * Create button gradient states
   */
  createButtonStates: (
    baseColor: string,
    type: 'primary' | 'secondary' | 'danger' = 'primary'
  ): StateGradientOptions => {
    const colorMap = {
      primary: { base: baseColor, hover: ColorUtils.lighten(baseColor, 0.1), active: ColorUtils.darken(baseColor, 0.1) },
      secondary: { base: '#f8f9fa', hover: '#e9ecef', active: '#dee2e6' },
      danger: { base: '#dc3545', hover: ColorUtils.lighten('#dc3545', 0.1), active: ColorUtils.darken('#dc3545', 0.1) }
    }
    
    const colors = colorMap[type]
    
    return {
      default: LinearGradient({
        colors: [colors.base, ColorUtils.darken(colors.base, 0.05)],
        startPoint: 'top',
        endPoint: 'bottom'
      }),
      hover: LinearGradient({
        colors: [colors.hover, ColorUtils.darken(colors.hover, 0.05)],
        startPoint: 'top',
        endPoint: 'bottom'
      }),
      active: LinearGradient({
        colors: [colors.active, ColorUtils.darken(colors.active, 0.05)],
        startPoint: 'top',
        endPoint: 'bottom'
      }),
      disabled: '#cccccc',
      animation: {
        duration: 150,
        easing: 'ease-out'
      }
    }
  },

  /**
   * Create card hover effect
   */
  createCardHover: (backgroundColor: string = '#ffffff'): StateGradientOptions => {
    return {
      default: backgroundColor,
      hover: LinearGradient({
        colors: [
          ColorUtils.withAlpha('#ffffff', 0.1),
          ColorUtils.withAlpha('#f8f9fa', 0.1)
        ],
        startPoint: 'topLeading',
        endPoint: 'bottomTrailing'
      }),
      animation: {
        duration: 200,
        easing: 'ease'
      }
    }
  }
} as const

/**
 * CSS utility functions
 */
export const CSSUtils = {
  /**
   * Generate CSS custom properties for gradient
   */
  toCustomProperties: (gradient: GradientDefinition, prefix: string = 'gradient'): Record<string, string> => {
    const css = gradientToCSS(gradient)
    return {
      [`--${prefix}-background`]: css
    }
  },

  /**
   * Generate fallback CSS for older browsers
   */
  withFallback: (gradient: GradientDefinition, fallbackColor: string): string => {
    const gradientCSS = gradientToCSS(gradient)
    return `background: ${fallbackColor}; background: ${gradientCSS};`
  },

  /**
   * Optimize CSS for performance
   */
  optimize: (css: string): string => {
    // Remove unnecessary spaces and optimize
    return css
      .replace(/\s+/g, ' ')
      .replace(/,\s+/g, ',')
      .replace(/:\s+/g, ':')
      .trim()
  }
} as const

/**
 * Main gradient utilities export
 */
export const GradientUtils = {
  ...ColorUtils,
  ...GradientTransforms,
  ...GradientAnalysis,
  ...GradientGenerators,
  ...StateGradientUtils,
  ...CSSUtils,

  /**
   * Convert any background value to CSS
   */
  toCSS: (background: StatefulBackgroundValue): string => {
    if (typeof background === 'string') {
      return background
    }
    
    if ('resolve' in background && typeof background.resolve === 'function') {
      return background.resolve() as string
    }
    
    if ('type' in background && 'options' in background) {
      return gradientToCSS(background as GradientDefinition)
    }
    
    if ('default' in background) {
      return GradientUtils.toCSS(background.default)
    }
    
    return 'transparent'
  },

  /**
   * Deep clone gradient definition
   */
  clone: <T extends GradientDefinition>(gradient: T): T => {
    return JSON.parse(JSON.stringify(gradient))
  },

  /**
   * Compare two gradients for equality
   */
  equals: (a: GradientDefinition, b: GradientDefinition): boolean => {
    return JSON.stringify(a) === JSON.stringify(b)
  }
} as const