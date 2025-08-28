/**
 * Comprehensive Gradient Examples and Patterns
 * 
 * Real-world gradient patterns, UI component examples, and design system implementations.
 * These examples showcase practical usage of TachUI's gradient system.
 */

import { LinearGradient, RadialGradient, AngularGradient } from './index'
import { StateGradient } from './state-gradient-asset'
import { InteractiveGradientPresets } from './presets'
import { GradientUtils } from './utils'
import type { 
  GradientDefinition, 
  StateGradientOptions
} from './types'

/**
 * Button gradient patterns
 */
export const ButtonGradients = {
  /**
   * iOS-style primary button
   */
  iosPrimary: (): StateGradientOptions => ({
    default: LinearGradient({
      colors: ['#007AFF', '#0051D2'],
      startPoint: 'top',
      endPoint: 'bottom'
    }),
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
    animation: { duration: 150, easing: 'ease-out' }
  }),

  /**
   * Material Design raised button
   */
  materialRaised: (): StateGradientOptions => ({
    default: LinearGradient({
      colors: ['#2196F3', '#1976D2'],
      startPoint: 'top',
      endPoint: 'bottom'
    }),
    hover: LinearGradient({
      colors: ['#42A5F5', '#1E88E5'],
      startPoint: 'top',
      endPoint: 'bottom'
    }),
    active: LinearGradient({
      colors: ['#1565C0', '#0D47A1'],
      startPoint: 'top',
      endPoint: 'bottom'
    }),
    animation: { duration: 200, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' }
  }),

  /**
   * Glass morphism button
   */
  glassMorphism: (): StateGradientOptions => ({
    default: LinearGradient({
      colors: ['rgba(255, 255, 255, 0.25)', 'rgba(255, 255, 255, 0.05)'],
      startPoint: 'topLeading',
      endPoint: 'bottomTrailing'
    }),
    hover: LinearGradient({
      colors: ['rgba(255, 255, 255, 0.35)', 'rgba(255, 255, 255, 0.15)'],
      startPoint: 'topLeading',
      endPoint: 'bottomTrailing'
    }),
    active: LinearGradient({
      colors: ['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.25)'],
      startPoint: 'topLeading',
      endPoint: 'bottomTrailing'
    }),
    animation: { duration: 250, easing: 'ease' }
  }),

  /**
   * Neon glow button
   */
  neonGlow: (color: string = '#00ff88'): StateGradientOptions => ({
    default: LinearGradient({
      colors: [color, GradientUtils.darken(color, 0.3)],
      startPoint: 'top',
      endPoint: 'bottom'
    }),
    hover: RadialGradient({
      colors: [GradientUtils.lighten(color, 0.2), color, GradientUtils.darken(color, 0.4)],
      center: 'center',
      startRadius: 0,
      endRadius: 60
    }),
    active: LinearGradient({
      colors: [GradientUtils.darken(color, 0.2), GradientUtils.darken(color, 0.4)],
      startPoint: 'top',
      endPoint: 'bottom'
    }),
    animation: { duration: 300, easing: 'ease-in-out' }
  }),

  /**
   * Gradient call-to-action button
   */
  ctaButton: (): StateGradientOptions => ({
    default: LinearGradient({
      colors: ['#ff416c', '#ff4b2b'],
      startPoint: 'topLeading',
      endPoint: 'bottomTrailing'
    }),
    hover: LinearGradient({
      colors: ['#ff6b9d', '#ff6347'],
      startPoint: 'topLeading',
      endPoint: 'bottomTrailing'
    }),
    active: LinearGradient({
      colors: ['#e63946', '#d62828'],
      startPoint: 'topLeading',
      endPoint: 'bottomTrailing'
    }),
    animation: { duration: 175, easing: 'ease-out' }
  })
} as const

/**
 * Card and surface gradients
 */
export const CardGradients = {
  /**
   * Subtle card hover effect
   */
  subtleHover: (): StateGradientOptions => ({
    default: '#ffffff',
    hover: LinearGradient({
      colors: ['#f8f9fa', '#ffffff'],
      startPoint: 'top',
      endPoint: 'bottom'
    }),
    animation: { duration: 200, easing: 'ease' }
  }),

  /**
   * Dark mode card
   */
  darkCard: (): StateGradientOptions => ({
    default: LinearGradient({
      colors: ['#2d3748', '#1a202c'],
      startPoint: 'top',
      endPoint: 'bottom'
    }),
    hover: LinearGradient({
      colors: ['#4a5568', '#2d3748'],
      startPoint: 'top',
      endPoint: 'bottom'
    }),
    animation: { duration: 250, easing: 'ease-in-out' }
  }),

  /**
   * Hero card with rich gradient
   */
  heroCard: (): GradientDefinition => LinearGradient({
    colors: [
      '#667eea',
      '#764ba2',
      'rgba(118, 75, 162, 0.8)'
    ],
    startPoint: 'topLeading',
    endPoint: 'bottomTrailing'
  }),

  /**
   * Pricing card with accent
   */
  pricingCard: (accentColor: string = '#007AFF'): GradientDefinition => LinearGradient({
    colors: [
      '#ffffff',
      '#f8f9fa',
      GradientUtils.withAlpha(accentColor, 0.05)
    ],
    startPoint: 'top',
    endPoint: 'bottom'
  }),

  /**
   * Testimonial card
   */
  testimonialCard: (): GradientDefinition => LinearGradient({
    colors: [
      'rgba(255, 255, 255, 0.9)',
      'rgba(248, 249, 250, 0.9)',
      'rgba(233, 236, 239, 0.9)'
    ],
    startPoint: 'topLeading',
    endPoint: 'bottomTrailing'
  })
} as const

/**
 * Navigation and header gradients
 */
export const NavigationGradients = {
  /**
   * App header gradient
   */
  appHeader: (): GradientDefinition => LinearGradient({
    colors: ['#667eea', '#764ba2'],
    startPoint: 'leading',
    endPoint: 'trailing'
  }),

  /**
   * Tab bar gradient
   */
  tabBar: (): StateGradientOptions => ({
    default: LinearGradient({
      colors: ['#f8f9fa', '#e9ecef'],
      startPoint: 'top',
      endPoint: 'bottom'
    }),
    hover: LinearGradient({
      colors: ['#e9ecef', '#dee2e6'],
      startPoint: 'top',
      endPoint: 'bottom'
    }),
    animation: { duration: 150, easing: 'ease-out' }
  }),

  /**
   * Sidebar gradient
   */
  sidebar: (): GradientDefinition => LinearGradient({
    colors: [
      '#2d3748',
      '#1a202c',
      '#171923'
    ],
    startPoint: 'top',
    endPoint: 'bottom'
  }),

  /**
   * Navigation breadcrumb
   */
  breadcrumb: (): StateGradientOptions => ({
    default: 'transparent',
    hover: LinearGradient({
      colors: ['rgba(0, 122, 255, 0.1)', 'rgba(0, 122, 255, 0.05)'],
      startPoint: 'top',
      endPoint: 'bottom'
    }),
    animation: { duration: 100, easing: 'ease-out' }
  })
} as const

/**
 * Form and input gradients
 */
export const FormGradients = {
  /**
   * Text input focus effect
   */
  textInputFocus: (): StateGradientOptions => ({
    default: '#ffffff',
    focus: LinearGradient({
      colors: ['#f0f8ff', '#e6f3ff'],
      startPoint: 'top',
      endPoint: 'bottom'
    }),
    disabled: '#f5f5f5',
    animation: { duration: 100, easing: 'ease-in-out' }
  }),

  /**
   * Form section background
   */
  formSection: (): GradientDefinition => LinearGradient({
    colors: [
      'rgba(248, 249, 250, 0.8)',
      'rgba(255, 255, 255, 0.8)',
      'rgba(248, 249, 250, 0.8)'
    ],
    startPoint: 'top',
    endPoint: 'bottom'
  }),

  /**
   * Submit button gradient
   */
  submitButton: (): StateGradientOptions => ({
    default: LinearGradient({
      colors: ['#30d158', '#248a3d'],
      startPoint: 'top',
      endPoint: 'bottom'
    }),
    hover: LinearGradient({
      colors: ['#40d866', '#2c8f45'],
      startPoint: 'top',
      endPoint: 'bottom'
    }),
    active: LinearGradient({
      colors: ['#28b946', '#1f7a35'],
      startPoint: 'top',
      endPoint: 'bottom'
    }),
    animation: { duration: 120, easing: 'ease-out' }
  }),

  /**
   * Error state input
   */
  errorInput: (): StateGradientOptions => ({
    default: LinearGradient({
      colors: ['rgba(255, 59, 48, 0.1)', 'rgba(255, 59, 48, 0.05)'],
      startPoint: 'top',
      endPoint: 'bottom'
    }),
    focus: LinearGradient({
      colors: ['rgba(255, 59, 48, 0.15)', 'rgba(255, 59, 48, 0.08)'],
      startPoint: 'top',
      endPoint: 'bottom'
    }),
    animation: { duration: 150, easing: 'ease-in-out' }
  })
} as const

/**
 * Dashboard and data visualization gradients
 */
export const DashboardGradients = {
  /**
   * Metric card with positive trend
   */
  positiveMetric: (): GradientDefinition => LinearGradient({
    colors: ['#d4edda', '#c3e6cb', '#b8dacc'],
    startPoint: 'topLeading',
    endPoint: 'bottomTrailing'
  }),

  /**
   * Metric card with negative trend
   */
  negativeMetric: (): GradientDefinition => LinearGradient({
    colors: ['#f8d7da', '#f5c6cb', '#f1b0b7'],
    startPoint: 'topLeading',
    endPoint: 'bottomTrailing'
  }),

  /**
   * Chart background
   */
  chartBackground: (): GradientDefinition => LinearGradient({
    colors: [
      'rgba(255, 255, 255, 0.95)',
      'rgba(248, 249, 250, 0.95)',
      'rgba(255, 255, 255, 0.95)'
    ],
    startPoint: 'top',
    endPoint: 'bottom'
  }),

  /**
   * Progress bar gradient
   */
  progressBar: (color: string = '#007AFF'): GradientDefinition => LinearGradient({
    colors: [
      GradientUtils.lighten(color, 0.1),
      color,
      GradientUtils.darken(color, 0.1)
    ],
    startPoint: 'top',
    endPoint: 'bottom'
  }),

  /**
   * Status indicator gradients
   */
  statusSuccess: (): GradientDefinition => RadialGradient({
    colors: ['#30d158', '#248a3d', 'rgba(36, 138, 61, 0.8)'],
    center: 'center',
    startRadius: 0,
    endRadius: 25
  }),

  statusWarning: (): GradientDefinition => RadialGradient({
    colors: ['#ff9500', '#cc7700', 'rgba(204, 119, 0, 0.8)'],
    center: 'center',
    startRadius: 0,
    endRadius: 25
  }),

  statusError: (): GradientDefinition => RadialGradient({
    colors: ['#ff3b30', '#cc2e26', 'rgba(204, 46, 38, 0.8)'],
    center: 'center',
    startRadius: 0,
    endRadius: 25
  })
} as const

/**
 * Loading and animation gradients
 */
export const AnimationGradients = {
  /**
   * Shimmer loading effect
   */
  shimmer: (): GradientDefinition => LinearGradient({
    colors: [
      'rgba(255, 255, 255, 0)',
      'rgba(255, 255, 255, 0.4)',
      'rgba(255, 255, 255, 0.8)',
      'rgba(255, 255, 255, 0.4)',
      'rgba(255, 255, 255, 0)'
    ],
    startPoint: 'leading',
    endPoint: 'trailing',
    stops: [0, 25, 50, 75, 100]
  }),

  /**
   * Skeleton loading gradient
   */
  skeleton: (): GradientDefinition => LinearGradient({
    colors: ['#f6f7f8', '#edeef1', '#f6f7f8'],
    startPoint: 'leading',
    endPoint: 'trailing'
  }),

  /**
   * Pulse animation gradient
   */
  pulse: (baseColor: string = '#007AFF'): GradientDefinition => RadialGradient({
    colors: [
      GradientUtils.withAlpha(baseColor, 0.8),
      GradientUtils.withAlpha(baseColor, 0.4),
      GradientUtils.withAlpha(baseColor, 0.1),
      'transparent'
    ],
    center: 'center',
    startRadius: 0,
    endRadius: 100
  }),

  /**
   * Spinner gradient
   */
  spinner: (): GradientDefinition => AngularGradient({
    colors: [
      '#007AFF',
      'rgba(0, 122, 255, 0.8)',
      'rgba(0, 122, 255, 0.4)',
      'rgba(0, 122, 255, 0.1)',
      'transparent',
      'transparent',
      '#007AFF'
    ],
    center: 'center',
    startAngle: 0,
    endAngle: 360
  })
} as const

/**
 * Background and surface gradients
 */
export const BackgroundGradients = {
  /**
   * App background gradient
   */
  appBackground: (): GradientDefinition => LinearGradient({
    colors: [
      '#f8f9fa',
      '#ffffff',
      '#f8f9fa'
    ],
    startPoint: 'top',
    endPoint: 'bottom'
  }),

  /**
   * Dark mode app background
   */
  darkAppBackground: (): GradientDefinition => LinearGradient({
    colors: [
      '#1a1a1a',
      '#0f0f0f',
      '#1a1a1a'
    ],
    startPoint: 'top',
    endPoint: 'bottom'
  }),

  /**
   * Modal backdrop
   */
  modalBackdrop: (): GradientDefinition => RadialGradient({
    colors: [
      'rgba(0, 0, 0, 0.4)',
      'rgba(0, 0, 0, 0.6)',
      'rgba(0, 0, 0, 0.8)'
    ],
    center: 'center',
    startRadius: 0,
    endRadius: 300
  }),

  /**
   * Hero section background
   */
  heroSection: (): GradientDefinition => LinearGradient({
    colors: [
      '#667eea',
      '#764ba2',
      '#667eea'
    ],
    startPoint: 'topLeading',
    endPoint: 'bottomTrailing'
  }),

  /**
   * Footer gradient
   */
  footer: (): GradientDefinition => LinearGradient({
    colors: [
      '#2d3748',
      '#1a202c'
    ],
    startPoint: 'top',
    endPoint: 'bottom'
  })
} as const

/**
 * Themed gradient collections
 */
export const ThemedGradients = {
  /**
   * iOS theme gradients
   */
  ios: {
    primary: ButtonGradients.iosPrimary,
    secondary: () => InteractiveGradientPresets.secondaryButton(),
    card: CardGradients.subtleHover,
    input: FormGradients.textInputFocus,
    background: BackgroundGradients.appBackground
  },

  /**
   * Material Design theme gradients
   */
  material: {
    primary: ButtonGradients.materialRaised,
    secondary: () => InteractiveGradientPresets.secondaryButton(),
    card: CardGradients.subtleHover,
    input: FormGradients.textInputFocus,
    background: BackgroundGradients.appBackground
  },

  /**
   * Modern/Glass theme gradients
   */
  modern: {
    primary: ButtonGradients.glassMorphism,
    secondary: ButtonGradients.glassMorphism,
    card: () => CardGradients.subtleHover(),
    input: FormGradients.textInputFocus,
    background: () => LinearGradient({
      colors: [
        'rgba(255, 255, 255, 0.95)',
        'rgba(248, 249, 250, 0.95)'
      ],
      startPoint: 'top',
      endPoint: 'bottom'
    })
  }
} as const

/**
 * Utility to create component-specific gradient collections
 */
export const createComponentGradients = (theme: keyof typeof ThemedGradients = 'ios') => {
  const themeGradients = ThemedGradients[theme]
  
  return {
    Button: {
      primary: StateGradient('button-primary', themeGradients.primary()),
      secondary: StateGradient('button-secondary', themeGradients.secondary()),
      danger: StateGradient('button-danger', InteractiveGradientPresets.dangerButton()),
      success: StateGradient('button-success', InteractiveGradientPresets.successButton())
    },
    Card: {
      default: StateGradient('card-default', themeGradients.card()),
      hero: StateGradient('card-hero', {
        default: CardGradients.heroCard(),
        hover: GradientUtils.reverse(CardGradients.heroCard()),
        animation: { duration: 300, easing: 'ease-in-out' }
      })
    },
    Input: {
      default: StateGradient('input-default', themeGradients.input()),
      error: StateGradient('input-error', FormGradients.errorInput())
    },
    Background: {
      app: themeGradients.background(),
      modal: BackgroundGradients.modalBackdrop()
    }
  }
}

/**
 * Export all gradient examples
 */
export const GradientExamples = {
  Button: ButtonGradients,
  Card: CardGradients,
  Navigation: NavigationGradients,
  Form: FormGradients,
  Dashboard: DashboardGradients,
  Animation: AnimationGradients,
  Background: BackgroundGradients,
  Themed: ThemedGradients,
  createComponentGradients
} as const