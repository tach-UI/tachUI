/**
 * Comprehensive Gradient Examples and Patterns
 *
 * Real-world gradient patterns, UI component examples, and design system implementations.
 * These examples showcase practical usage of TachUI's gradient system.
 */
import type { GradientDefinition, StateGradientOptions } from './types'
/**
 * Button gradient patterns
 */
export declare const ButtonGradients: {
  /**
   * iOS-style primary button
   */
  readonly iosPrimary: () => StateGradientOptions
  /**
   * Material Design raised button
   */
  readonly materialRaised: () => StateGradientOptions
  /**
   * Glass morphism button
   */
  readonly glassMorphism: () => StateGradientOptions
  /**
   * Neon glow button
   */
  readonly neonGlow: (color?: string) => StateGradientOptions
  /**
   * Gradient call-to-action button
   */
  readonly ctaButton: () => StateGradientOptions
}
/**
 * Card and surface gradients
 */
export declare const CardGradients: {
  /**
   * Subtle card hover effect
   */
  readonly subtleHover: () => StateGradientOptions
  /**
   * Dark mode card
   */
  readonly darkCard: () => StateGradientOptions
  /**
   * Hero card with rich gradient
   */
  readonly heroCard: () => GradientDefinition
  /**
   * Pricing card with accent
   */
  readonly pricingCard: (accentColor?: string) => GradientDefinition
  /**
   * Testimonial card
   */
  readonly testimonialCard: () => GradientDefinition
}
/**
 * Navigation and header gradients
 */
export declare const NavigationGradients: {
  /**
   * App header gradient
   */
  readonly appHeader: () => GradientDefinition
  /**
   * Tab bar gradient
   */
  readonly tabBar: () => StateGradientOptions
  /**
   * Sidebar gradient
   */
  readonly sidebar: () => GradientDefinition
  /**
   * Navigation breadcrumb
   */
  readonly breadcrumb: () => StateGradientOptions
}
/**
 * Form and input gradients
 */
export declare const FormGradients: {
  /**
   * Text input focus effect
   */
  readonly textInputFocus: () => StateGradientOptions
  /**
   * Form section background
   */
  readonly formSection: () => GradientDefinition
  /**
   * Submit button gradient
   */
  readonly submitButton: () => StateGradientOptions
  /**
   * Error state input
   */
  readonly errorInput: () => StateGradientOptions
}
/**
 * Dashboard and data visualization gradients
 */
export declare const DashboardGradients: {
  /**
   * Metric card with positive trend
   */
  readonly positiveMetric: () => GradientDefinition
  /**
   * Metric card with negative trend
   */
  readonly negativeMetric: () => GradientDefinition
  /**
   * Chart background
   */
  readonly chartBackground: () => GradientDefinition
  /**
   * Progress bar gradient
   */
  readonly progressBar: (color?: string) => GradientDefinition
  /**
   * Status indicator gradients
   */
  readonly statusSuccess: () => GradientDefinition
  readonly statusWarning: () => GradientDefinition
  readonly statusError: () => GradientDefinition
}
/**
 * Loading and animation gradients
 */
export declare const AnimationGradients: {
  /**
   * Shimmer loading effect
   */
  readonly shimmer: () => GradientDefinition
  /**
   * Skeleton loading gradient
   */
  readonly skeleton: () => GradientDefinition
  /**
   * Pulse animation gradient
   */
  readonly pulse: (baseColor?: string) => GradientDefinition
  /**
   * Spinner gradient
   */
  readonly spinner: () => GradientDefinition
}
/**
 * Background and surface gradients
 */
export declare const BackgroundGradients: {
  /**
   * App background gradient
   */
  readonly appBackground: () => GradientDefinition
  /**
   * Dark mode app background
   */
  readonly darkAppBackground: () => GradientDefinition
  /**
   * Modal backdrop
   */
  readonly modalBackdrop: () => GradientDefinition
  /**
   * Hero section background
   */
  readonly heroSection: () => GradientDefinition
  /**
   * Footer gradient
   */
  readonly footer: () => GradientDefinition
}
/**
 * Themed gradient collections
 */
export declare const ThemedGradients: {
  /**
   * iOS theme gradients
   */
  readonly ios: {
    readonly primary: () => StateGradientOptions
    readonly secondary: () => StateGradientOptions
    readonly card: () => StateGradientOptions
    readonly input: () => StateGradientOptions
    readonly background: () => GradientDefinition
  }
  /**
   * Material Design theme gradients
   */
  readonly material: {
    readonly primary: () => StateGradientOptions
    readonly secondary: () => StateGradientOptions
    readonly card: () => StateGradientOptions
    readonly input: () => StateGradientOptions
    readonly background: () => GradientDefinition
  }
  /**
   * Modern/Glass theme gradients
   */
  readonly modern: {
    readonly primary: () => StateGradientOptions
    readonly secondary: () => StateGradientOptions
    readonly card: () => StateGradientOptions
    readonly input: () => StateGradientOptions
    readonly background: () => GradientDefinition
  }
}
/**
 * Utility to create component-specific gradient collections
 */
export declare const createComponentGradients: (
  theme?: keyof typeof ThemedGradients
) => {
  Button: {
    primary: import('./state-gradient-asset').StateGradientAsset
    secondary: import('./state-gradient-asset').StateGradientAsset
    danger: import('./state-gradient-asset').StateGradientAsset
    success: import('./state-gradient-asset').StateGradientAsset
  }
  Card: {
    default: import('./state-gradient-asset').StateGradientAsset
    hero: import('./state-gradient-asset').StateGradientAsset
  }
  Input: {
    default: import('./state-gradient-asset').StateGradientAsset
    error: import('./state-gradient-asset').StateGradientAsset
  }
  Background: {
    app: GradientDefinition
    modal: GradientDefinition
  }
}
/**
 * Export all gradient examples
 */
export declare const GradientExamples: {
  readonly Button: {
    /**
     * iOS-style primary button
     */
    readonly iosPrimary: () => StateGradientOptions
    /**
     * Material Design raised button
     */
    readonly materialRaised: () => StateGradientOptions
    /**
     * Glass morphism button
     */
    readonly glassMorphism: () => StateGradientOptions
    /**
     * Neon glow button
     */
    readonly neonGlow: (color?: string) => StateGradientOptions
    /**
     * Gradient call-to-action button
     */
    readonly ctaButton: () => StateGradientOptions
  }
  readonly Card: {
    /**
     * Subtle card hover effect
     */
    readonly subtleHover: () => StateGradientOptions
    /**
     * Dark mode card
     */
    readonly darkCard: () => StateGradientOptions
    /**
     * Hero card with rich gradient
     */
    readonly heroCard: () => GradientDefinition
    /**
     * Pricing card with accent
     */
    readonly pricingCard: (accentColor?: string) => GradientDefinition
    /**
     * Testimonial card
     */
    readonly testimonialCard: () => GradientDefinition
  }
  readonly Navigation: {
    /**
     * App header gradient
     */
    readonly appHeader: () => GradientDefinition
    /**
     * Tab bar gradient
     */
    readonly tabBar: () => StateGradientOptions
    /**
     * Sidebar gradient
     */
    readonly sidebar: () => GradientDefinition
    /**
     * Navigation breadcrumb
     */
    readonly breadcrumb: () => StateGradientOptions
  }
  readonly Form: {
    /**
     * Text input focus effect
     */
    readonly textInputFocus: () => StateGradientOptions
    /**
     * Form section background
     */
    readonly formSection: () => GradientDefinition
    /**
     * Submit button gradient
     */
    readonly submitButton: () => StateGradientOptions
    /**
     * Error state input
     */
    readonly errorInput: () => StateGradientOptions
  }
  readonly Dashboard: {
    /**
     * Metric card with positive trend
     */
    readonly positiveMetric: () => GradientDefinition
    /**
     * Metric card with negative trend
     */
    readonly negativeMetric: () => GradientDefinition
    /**
     * Chart background
     */
    readonly chartBackground: () => GradientDefinition
    /**
     * Progress bar gradient
     */
    readonly progressBar: (color?: string) => GradientDefinition
    /**
     * Status indicator gradients
     */
    readonly statusSuccess: () => GradientDefinition
    readonly statusWarning: () => GradientDefinition
    readonly statusError: () => GradientDefinition
  }
  readonly Animation: {
    /**
     * Shimmer loading effect
     */
    readonly shimmer: () => GradientDefinition
    /**
     * Skeleton loading gradient
     */
    readonly skeleton: () => GradientDefinition
    /**
     * Pulse animation gradient
     */
    readonly pulse: (baseColor?: string) => GradientDefinition
    /**
     * Spinner gradient
     */
    readonly spinner: () => GradientDefinition
  }
  readonly Background: {
    /**
     * App background gradient
     */
    readonly appBackground: () => GradientDefinition
    /**
     * Dark mode app background
     */
    readonly darkAppBackground: () => GradientDefinition
    /**
     * Modal backdrop
     */
    readonly modalBackdrop: () => GradientDefinition
    /**
     * Hero section background
     */
    readonly heroSection: () => GradientDefinition
    /**
     * Footer gradient
     */
    readonly footer: () => GradientDefinition
  }
  readonly Themed: {
    /**
     * iOS theme gradients
     */
    readonly ios: {
      readonly primary: () => StateGradientOptions
      readonly secondary: () => StateGradientOptions
      readonly card: () => StateGradientOptions
      readonly input: () => StateGradientOptions
      readonly background: () => GradientDefinition
    }
    /**
     * Material Design theme gradients
     */
    readonly material: {
      readonly primary: () => StateGradientOptions
      readonly secondary: () => StateGradientOptions
      readonly card: () => StateGradientOptions
      readonly input: () => StateGradientOptions
      readonly background: () => GradientDefinition
    }
    /**
     * Modern/Glass theme gradients
     */
    readonly modern: {
      readonly primary: () => StateGradientOptions
      readonly secondary: () => StateGradientOptions
      readonly card: () => StateGradientOptions
      readonly input: () => StateGradientOptions
      readonly background: () => GradientDefinition
    }
  }
  readonly createComponentGradients: (theme?: keyof typeof ThemedGradients) => {
    Button: {
      primary: import('./state-gradient-asset').StateGradientAsset
      secondary: import('./state-gradient-asset').StateGradientAsset
      danger: import('./state-gradient-asset').StateGradientAsset
      success: import('./state-gradient-asset').StateGradientAsset
    }
    Card: {
      default: import('./state-gradient-asset').StateGradientAsset
      hero: import('./state-gradient-asset').StateGradientAsset
    }
    Input: {
      default: import('./state-gradient-asset').StateGradientAsset
      error: import('./state-gradient-asset').StateGradientAsset
    }
    Background: {
      app: GradientDefinition
      modal: GradientDefinition
    }
  }
}
//# sourceMappingURL=examples.d.ts.map
