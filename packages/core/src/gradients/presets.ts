/**
 * Gradient Presets for TachUI
 * 
 * Common gradient patterns and presets for quick development.
 * Includes popular design system gradients and utility patterns.
 */

import { LinearGradient, RadialGradient, AngularGradient } from './index'
import type { 
  GradientDefinition, 
  StateGradientOptions,
  LinearGradientOptions
} from './types'

/**
 * Common color schemes for gradients
 */
export const GradientColors = {
  // iOS-style colors
  ios: {
    blue: ['#007AFF', '#0051D2'] as const,
    green: ['#30D158', '#248A3D'] as const,
    orange: ['#FF9500', '#CC7700'] as const,
    red: ['#FF3B30', '#CC2E26'] as const,
    purple: ['#AF52DE', '#8C42B8'] as const,
    pink: ['#FF2D92', '#CC2475'] as const,
    teal: ['#5AC8FA', '#48A3C8'] as const,
    indigo: ['#5856D6', '#4644AB'] as const
  },

  // Material Design colors
  material: {
    blue: ['#2196F3', '#1976D2'] as const,
    green: ['#4CAF50', '#388E3C'] as const,
    orange: ['#FF9800', '#F57C00'] as const,
    red: ['#F44336', '#D32F2F'] as const,
    purple: ['#9C27B0', '#7B1FA2'] as const,
    pink: ['#E91E63', '#C2185B'] as const,
    teal: ['#009688', '#00695C'] as const,
    indigo: ['#3F51B5', '#303F9F'] as const
  },

  // Modern web gradients
  modern: {
    ocean: ['#667eea', '#764ba2'] as const,
    sunset: ['#ff7e5f', '#feb47b'] as const,
    forest: ['#134e5e', '#71b280'],
    lavender: ['#a8edea', '#fed6e3'],
    fire: ['#ff416c', '#ff4b2b'],
    aurora: ['#4facfe', '#00f2fe'],
    cosmic: ['#c471ed', '#f64f59'],
    emerald: ['#11998e', '#38ef7d']
  },

  // Neutral gradients
  neutral: {
    lightGray: ['#f8f9fa', '#e9ecef'],
    darkGray: ['#495057', '#212529'],
    warmGray: ['#f5f5f4', '#e7e5e4'],
    coolGray: ['#f1f5f9', '#e2e8f0'],
    slate: ['#f8fafc', '#f1f5f9'],
    stone: ['#fafaf9', '#f5f5f4']
  }
} as const

/**
 * Predefined linear gradient presets
 */
export const LinearGradientPresets = {
  // Direction-based presets
  vertical: (colors: [string, string]) => LinearGradient({
    colors,
    startPoint: 'top',
    endPoint: 'bottom'
  }),

  horizontal: (colors: [string, string]) => LinearGradient({
    colors,
    startPoint: 'leading',
    endPoint: 'trailing'
  }),

  diagonal: (colors: [string, string]) => LinearGradient({
    colors,
    startPoint: 'topLeading',
    endPoint: 'bottomTrailing'
  }),

  diagonalReverse: (colors: [string, string]) => LinearGradient({
    colors,
    startPoint: 'topTrailing',
    endPoint: 'bottomLeading'
  }),

  // Popular gradient patterns
  iosBlue: () => LinearGradient({
    colors: [...GradientColors.ios.blue],
    startPoint: 'top',
    endPoint: 'bottom'
  }),

  materialBlue: () => LinearGradient({
    colors: [...GradientColors.material.blue],
    startPoint: 'top',
    endPoint: 'bottom'
  }),

  ocean: () => LinearGradient({
    colors: [...GradientColors.modern.ocean],
    startPoint: 'topLeading',
    endPoint: 'bottomTrailing'
  }),

  sunset: () => LinearGradient({
    colors: [...GradientColors.modern.sunset],
    startPoint: 'leading',
    endPoint: 'trailing'
  }),

  aurora: () => LinearGradient({
    colors: [...GradientColors.modern.aurora],
    startPoint: 'top',
    endPoint: 'bottom'
  }),

  // Multi-color gradients
  rainbow: () => LinearGradient({
    colors: ['#ff0000', '#ff7f00', '#ffff00', '#00ff00', '#0000ff', '#8f00ff'],
    startPoint: 'leading',
    endPoint: 'trailing',
    stops: [0, 16.66, 33.33, 50, 66.66, 83.33, 100]
  }),

  prism: () => LinearGradient({
    colors: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57'],
    startPoint: 'topLeading',
    endPoint: 'bottomTrailing'
  }),

  // Card and surface gradients
  cardLight: () => LinearGradient({
    colors: [...GradientColors.neutral.lightGray],
    startPoint: 'top',
    endPoint: 'bottom'
  }),

  cardDark: () => LinearGradient({
    colors: [...GradientColors.neutral.darkGray],
    startPoint: 'top',
    endPoint: 'bottom'
  }),

  glass: () => LinearGradient({
    colors: ['rgba(255, 255, 255, 0.25)', 'rgba(255, 255, 255, 0.05)'],
    startPoint: 'top',
    endPoint: 'bottom'
  }),

  frosted: () => LinearGradient({
    colors: ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.3)'],
    startPoint: 'topLeading',
    endPoint: 'bottomTrailing'
  })
} as const

/**
 * Predefined radial gradient presets
 */
export const RadialGradientPresets = {
  spotlight: (colors: [string, string]) => RadialGradient({
    colors,
    center: 'center',
    startRadius: 0,
    endRadius: 100
  }),

  vignette: (colors: [string, string]) => RadialGradient({
    colors,
    center: 'center',
    startRadius: 50,
    endRadius: 200
  }),

  buttonGlow: () => RadialGradient({
    colors: ['rgba(255, 255, 255, 0.3)', 'rgba(255, 255, 255, 0)'],
    center: 'center',
    startRadius: 0,
    endRadius: 50
  }),

  halo: () => RadialGradient({
    colors: ['rgba(74, 172, 254, 0.4)', 'rgba(74, 172, 254, 0)'],
    center: 'center',
    startRadius: 20,
    endRadius: 80
  })
} as const

/**
 * Predefined angular/conic gradient presets
 */
export const AngularGradientPresets = {
  rainbow: () => AngularGradient({
    colors: ['#ff0000', '#ff7f00', '#ffff00', '#00ff00', '#0000ff', '#8f00ff', '#ff0000'],
    center: 'center',
    startAngle: 0,
    endAngle: 360
  }),

  loading: () => AngularGradient({
    colors: ['#007AFF', 'rgba(0, 122, 255, 0.3)', '#007AFF'],
    center: 'center',
    startAngle: 0,
    endAngle: 360
  }),

  progress: () => AngularGradient({
    colors: ['#30D158', 'rgba(48, 209, 88, 0.3)', 'rgba(48, 209, 88, 0)'],
    center: 'center',
    startAngle: -90,
    endAngle: 270
  })
} as const

/**
 * Interactive gradient presets with state support
 */
export const InteractiveGradientPresets = {
  primaryButton: (): StateGradientOptions => ({
    default: LinearGradientPresets.iosBlue(),
    hover: LinearGradient({
      colors: ['#1A8FFF', '#0062E3'],
      startPoint: 'top',
      endPoint: 'bottom'
    }),
    active: LinearGradient({
      colors: ['#0066CC', '#004499'],
      startPoint: 'top',
      endPoint: 'bottom'
    }),
    disabled: '#CCCCCC',
    animation: {
      duration: 150,
      easing: 'ease-out'
    }
  }),

  secondaryButton: (): StateGradientOptions => ({
    default: LinearGradientPresets.cardLight(),
    hover: LinearGradient({
      colors: ['#e9ecef', '#dee2e6'],
      startPoint: 'top',
      endPoint: 'bottom'
    }),
    active: LinearGradient({
      colors: ['#dee2e6', '#ced4da'],
      startPoint: 'top',
      endPoint: 'bottom'
    }),
    animation: {
      duration: 100,
      easing: 'ease-out'
    }
  }),

  dangerButton: (): StateGradientOptions => ({
    default: LinearGradient({
      colors: [...GradientColors.ios.red],
      startPoint: 'top',
      endPoint: 'bottom'
    }),
    hover: LinearGradient({
      colors: ['#FF5A52', '#D13029'],
      startPoint: 'top',
      endPoint: 'bottom'
    }),
    active: LinearGradient({
      colors: ['#E6342C', '#B32821'],
      startPoint: 'top',
      endPoint: 'bottom'
    }),
    disabled: '#CCCCCC',
    animation: {
      duration: 120,
      easing: 'ease-out'
    }
  }),

  successButton: (): StateGradientOptions => ({
    default: LinearGradient({
      colors: [...GradientColors.ios.green],
      startPoint: 'top',
      endPoint: 'bottom'
    }),
    hover: LinearGradient({
      colors: ['#40D866', '#2C8F45'],
      startPoint: 'top',
      endPoint: 'bottom'
    }),
    active: LinearGradient({
      colors: ['#28B946', '#1F7A35'],
      startPoint: 'top',
      endPoint: 'bottom'
    }),
    disabled: '#CCCCCC',
    animation: {
      duration: 120,
      easing: 'ease-out'
    }
  }),

  hoverCard: (): StateGradientOptions => ({
    default: '#FFFFFF',
    hover: LinearGradientPresets.glass(),
    animation: {
      duration: 200,
      easing: 'ease'
    }
  }),

  focusInput: (): StateGradientOptions => ({
    default: '#FFFFFF',
    focus: LinearGradient({
      colors: ['#F0F8FF', '#E6F3FF'],
      startPoint: 'top',
      endPoint: 'bottom'
    }),
    disabled: '#F5F5F5',
    animation: {
      duration: 100,
      easing: 'ease-in-out'
    }
  })
} as const

/**
 * Theme-aware gradient utilities
 */
export const ThemeGradients = {
  /**
   * Create a theme-responsive gradient that switches between light and dark variants
   */
  createThemeGradient: (
    lightGradient: GradientDefinition,
    _darkGradient: GradientDefinition
  ) => {
    // This would integrate with the Asset system for theme reactivity
    // Implementation depends on the current theme detection system
    return lightGradient // Placeholder - would be enhanced with actual theme system
  },

  /**
   * Auto-generate dark mode variant of a gradient
   */
  createDarkVariant: (gradient: GradientDefinition): GradientDefinition => {
    // Placeholder for auto-generating dark variants
    // Would analyze colors and create appropriate dark theme equivalents
    return gradient
  }
} as const

/**
 * Gradient composition utilities
 */
export const GradientUtils = {
  /**
   * Reverse the colors in a gradient
   */
  reverse: (gradient: GradientDefinition): GradientDefinition => {
    const newGradient = { ...gradient }
    if ('colors' in newGradient.options) {
      newGradient.options = {
        ...newGradient.options,
        colors: [...newGradient.options.colors].reverse()
      }
    }
    return newGradient
  },

  /**
   * Rotate a linear gradient by swapping start and end points
   */
  rotate: (gradient: LinearGradientOptions): LinearGradientOptions => {
    return {
      ...gradient,
      startPoint: gradient.endPoint,
      endPoint: gradient.startPoint
    }
  },

  /**
   * Add transparency to gradient colors
   */
  withOpacity: (gradient: GradientDefinition, _opacity: number): GradientDefinition => {
    // Implementation would modify colors to add alpha values
    // This is a placeholder for the concept
    return gradient
  },

  /**
   * Blend two gradients together
   */
  blend: (
    gradient1: GradientDefinition, 
    _gradient2: GradientDefinition, 
    _ratio: number = 0.5
  ): GradientDefinition => {
    // Implementation would blend the colors mathematically
    // This is a placeholder for the concept
    return gradient1
  }
} as const

/**
 * Export commonly used presets as default exports
 */
export const CommonGradients = {
  ...LinearGradientPresets,
  ...RadialGradientPresets,
  ...AngularGradientPresets,
  ...InteractiveGradientPresets
} as const