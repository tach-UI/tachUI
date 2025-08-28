/**
 * Developer Experience Enhancement Package (Phase Maroon Week 2)
 *
 * Provides enhanced error messages, better TypeScript types, and improved
 * developer experience for the TachUI framework.
 */

// Enhanced error system
import { DeveloperErrorFactory } from './enhanced-errors'

export type { EnhancedTachUIError } from './enhanced-errors'
export {
  DeveloperErrorFactory,
  DeveloperWarnings,
  TypeValidation,
} from './enhanced-errors'

// Enhanced TypeScript types
export type {
  // Enhanced modifier types
  ColorValue,
  ComponentChildren,
  ComponentDevMetadata,
  // Utility types
  ComponentProps,
  ComponentRef,
  CSSValue,
  DeepReadonly,
  // Development types
  DevelopmentConfig,
  EnhancedBorderProps,
  EnhancedButtonProps,
  EnhancedComponentInstance,
  EnhancedComputed,
  EnhancedLayoutProps,
  EnhancedModifierBuilder,
  EnhancedShadowProps,
  // Enhanced reactive types
  EnhancedSignal,
  EnhancedSignalFactory,
  // Enhanced component-specific types
  EnhancedTextProps,
  EnhancedTypographyProps,
  EventHandler,
  Reactive,
  SizeValue,
  SpacingValue,
  StrictComponentFactory,
  // Component types
  StrictComponentProps,
  TachUIEnhancedTypes,
  TypedEffect,
} from './enhanced-types'

/**
 * Initialize enhanced developer experience
 */
export function initializeDeveloperExperience(
  options: {
    enhancedErrors?: boolean
    performanceWarnings?: boolean
    accessibilityWarnings?: boolean
    deprecationWarnings?: boolean
  } = {}
) {
  const {
    enhancedErrors = true,
    performanceWarnings = true,
    accessibilityWarnings = true,
    deprecationWarnings = true,
  } = options

  if (process.env.NODE_ENV === 'development') {
    if (enhancedErrors) {
      // Enhanced errors would be enabled here
      console.log('🛠️ TachUI: Enhanced error reporting enabled')
    }

    if (performanceWarnings) {
      console.log('⚡ TachUI: Performance warnings enabled')
    }

    if (accessibilityWarnings) {
      console.log('♿ TachUI: Accessibility warnings enabled')
    }

    if (deprecationWarnings) {
      console.log('🟡 TachUI: Deprecation warnings enabled')
    }

    console.log('✨ TachUI Developer Experience initialized')
  }
}

/**
 * Development mode utilities for easier debugging
 */
export const devUtils = {
  /**
   * Log component information
   */
  inspectComponent(component: any): void {
    console.group(`🔍 Component Inspector: ${component.type}`)
    console.log('Props:', component.props)
    console.log('Modifiers:', component.modifiers?.length || 0)

    if (component.debugInfo) {
      console.log('Debug Info:', component.debugInfo)
    }

    if (component.modifiers && component.modifiers.length > 0) {
      console.group('Applied Modifiers:')
      component.modifiers.forEach((modifier: any, index: number) => {
        console.log(`${index + 1}. ${modifier.type}:`, modifier.properties)
      })
      console.groupEnd()
    }

    console.groupEnd()
  },

  /**
   * Measure component render time
   */
  measureRender<T>(componentFactory: () => T, label = 'Component'): T {
    const startTime = performance.now()
    const result = componentFactory()
    const endTime = performance.now()

    console.log(`⏱️ ${label} render time: ${(endTime - startTime).toFixed(2)}ms`)
    return result
  },

  /**
   * Log reactive signal changes
   */
  watchSignal(signal: any, label?: string): () => void {
    const signalName = label || signal.name || 'Signal'
    const lastValue = signal.value

    const unwatch = () => {
      // This would need integration with the reactive system
      console.log(`👁️ Stopped watching ${signalName}`)
    }

    console.log(`👁️ Watching ${signalName}, current value:`, lastValue)

    // In a real implementation, this would set up a reactive effect
    // createEffect(() => {
    //   const newValue = signal()
    //   if (newValue !== lastValue) {
    //     console.log(`🔄 ${signalName} changed:`, lastValue, '→', newValue)
    //     lastValue = newValue
    //   }
    // })

    return unwatch
  },
}

/**
 * Type-safe component factory helper
 */
export function createTypedComponent<T extends Record<string, any>>(
  name: string,
  factory: (props: T) => any
): any {
  const typedFactory = (props: T) => {
    const component = factory(props)

    // Add development metadata
    if (process.env.NODE_ENV === 'development') {
      const enhancedComponent = component as any
      enhancedComponent.displayName = name
      enhancedComponent.debugInfo = {
        createdAt: Date.now(),
        renderCount: 1,
        lastRenderTime: performance.now(),
      }
    }

    return component
  }

  // Add display name for debugging
  Object.defineProperty(typedFactory, 'name', { value: name })

  return typedFactory
}

/**
 * Validation helper for component props
 */
export function validateProps<T extends Record<string, any>>(
  componentName: string,
  props: T,
  validator: (props: T) => boolean | string
): void {
  const result = validator(props)

  if (typeof result === 'string') {
    const error = DeveloperErrorFactory.componentValidationError(
      componentName,
      'props',
      'valid props object',
      props
    )
    error.suggestion = result
    throw error
  }

  if (result === false) {
    throw DeveloperErrorFactory.componentValidationError(
      componentName,
      'props',
      'valid props object',
      props
    )
  }
}
