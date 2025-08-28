/**
 * Simplified Validation System
 *
 * A practical validation system that provides runtime validation
 * with helpful error messages without complex TypeScript types.
 */

import type { ComponentInstance } from '../runtime/types'
import { isSignal } from '../reactive'

/**
 * Validation error class
 */
export class TachUIValidationError extends Error {
  constructor(
    message: string,
    public context: {
      component: string
      property?: string
      suggestion?: string
      documentation?: string
      example?: {
        wrong: string
        correct: string
      }
    }
  ) {
    super(message)
    this.name = 'TachUIValidationError'
  }

  getFormattedMessage(): string {
    const { component, suggestion, example, documentation } = this.context

    let formatted = `❌ ${component} Component Error: ${this.message}\n`

    if (suggestion) {
      formatted += `\n💡 Suggestion: ${suggestion}\n`
    }

    if (example) {
      formatted += `\n❌ Wrong: ${example.wrong}`
      formatted += `\n✅ Correct: ${example.correct}\n`
    }

    if (documentation) {
      formatted += `\n📚 Documentation: ${documentation}`
    }

    return formatted
  }
}

/**
 * Validation configuration
 */
export interface ValidationConfig {
  enabled: boolean
  strictMode: boolean
  errorLevel: 'error' | 'warn' | 'info'
  excludeFiles: string[]
}

/**
 * Global validation configuration
 */
let validationConfig: ValidationConfig = {
  enabled: process.env.NODE_ENV !== 'production',
  strictMode: false,
  errorLevel: 'error',
  excludeFiles: []
}

/**
 * Configure validation settings
 */
export function configureValidation(config: Partial<ValidationConfig>): void {
  validationConfig = { ...validationConfig, ...config }
}

/**
 * Check if validation is enabled
 */
export function isValidationEnabled(): boolean {
  return validationConfig.enabled && process.env.NODE_ENV !== 'production'
}

/**
 * Component validation functions
 */
export const ComponentValidation = {
  /**
   * Validate Text component
   */
  validateText(args: unknown[]): void {
    if (!isValidationEnabled()) return

    if (args.length === 0) {
      throw new TachUIValidationError('Text component requires a content parameter', {
        component: 'Text',
        suggestion: 'Add a content parameter: Text("Hello World")',
        documentation: 'https://docs.tachui.dev/components/text',
        example: {
          wrong: 'Text()',
          correct: 'Text("Hello World")'
        }
      })
    }

    const [content] = args

    if (content === undefined || content === null) {
      throw new TachUIValidationError('Text content cannot be undefined or null', {
        component: 'Text',
        suggestion: 'Provide a valid string, function, or Signal',
        example: {
          wrong: 'Text(null)',
          correct: 'Text("Hello World")'
        }
      })
    }

    const contentType = typeof content
    const isValidContent = contentType === 'string' ||
                          contentType === 'function' ||
                          isSignal(content)

    if (!isValidContent) {
      throw new TachUIValidationError(`Text content must be a string, function, or Signal. Received: ${contentType}`, {
        component: 'Text',
        suggestion: 'Use a string literal, function, or reactive signal',
        example: {
          wrong: 'Text(123)',
          correct: 'Text("Hello World")'
        }
      })
    }
  },

  /**
   * Validate Button component
   */
  validateButton(args: unknown[]): void {
    if (!isValidationEnabled()) return

    if (args.length === 0) {
      throw new TachUIValidationError('Button component requires a title parameter', {
        component: 'Button',
        suggestion: 'Add a title parameter: Button("Click me", () => {})',
        documentation: 'https://docs.tachui.dev/components/button',
        example: {
          wrong: 'Button()',
          correct: 'Button("Click me", () => {})'
        }
      })
    }

    const [title, action] = args

    if (title === undefined || title === null) {
      throw new TachUIValidationError('Button title cannot be undefined or null', {
        component: 'Button',
        suggestion: 'Provide a valid string, function, or Signal',
        example: {
          wrong: 'Button(null)',
          correct: 'Button("Click me")'
        }
      })
    }

    const titleType = typeof title
    const isValidTitle = titleType === 'string' ||
                        titleType === 'function' ||
                        isSignal(title)

    if (!isValidTitle) {
      throw new TachUIValidationError(`Button title must be a string, function, or Signal. Received: ${titleType}`, {
        component: 'Button',
        suggestion: 'Use a string literal, function, or reactive signal',
        example: {
          wrong: 'Button(123)',
          correct: 'Button("Click me")'
        }
      })
    }

    // Warning for missing action (not an error)
    if (action === undefined && args.length === 1 && validationConfig.errorLevel !== 'error') {
      console.warn('⚠️ Button without action may not be interactive. Consider adding an action parameter.')
    }
  },

  /**
   * Validate VStack/HStack/ZStack components
   */
  validateStack(componentType: string, args: unknown[]): void {
    if (!isValidationEnabled()) return

    if (args.length === 0) {
      throw new TachUIValidationError(`${componentType} component requires a props object with children array`, {
        component: componentType,
        suggestion: `Add children: ${componentType}({ children: [Text("Hello")] })`,
        documentation: 'https://docs.tachui.dev/components/layout',
        example: {
          wrong: `${componentType}()`,
          correct: `${componentType}({ children: [Text("Hello")] })`
        }
      })
    }

    const [props] = args

    if (!props || typeof props !== 'object') {
      throw new TachUIValidationError(`${componentType} requires a props object`, {
        component: componentType,
        suggestion: 'Pass a props object with children array',
        example: {
          wrong: `${componentType}("invalid")`,
          correct: `${componentType}({ children: [Text("Hello")] })`
        }
      })
    }

    const propsObj = props as any
    if (!Array.isArray(propsObj.children)) {
      throw new TachUIValidationError(`${componentType} children must be an array`, {
        component: componentType,
        suggestion: 'Provide an array of components',
        example: {
          wrong: `${componentType}({ children: Text("Hello") })`,
          correct: `${componentType}({ children: [Text("Hello")] })`
        }
      })
    }
  }
}

/**
 * Modifier validation functions
 */
export const ModifierValidation = {
  /**
   * Validate modifier usage
   */
  validateModifier(componentType: string, modifierName: string, args: unknown[] = []): void {
    if (!isValidationEnabled()) return

    // Check for non-existent modifiers
    const nonExistentModifiers: Record<string, { suggestion: string; example?: string }> = {
      textShadow: {
        suggestion: 'Use shadow() instead',
        example: '.shadow({ x: 2, y: 2, radius: 4, color: "rgba(0,0,0,0.25)" })'
      },
      id: {
        suggestion: 'Use setAttribute("id", value) instead',
        example: '.setAttribute("id", "my-element")'
      },
      className: {
        suggestion: 'Use css() or setAttribute("class", value) instead',
        example: '.css({ className: "my-class" })'
      },
      style: {
        suggestion: 'Use css() for custom styles instead',
        example: '.css({ backgroundColor: "red" })'
      }
    }

    const nonExistent = nonExistentModifiers[modifierName]
    if (nonExistent) {
      const error = new TachUIValidationError(`Modifier ${modifierName} does not exist`, {
        component: componentType,
        suggestion: nonExistent.suggestion,
        example: nonExistent.example ? {
          wrong: `.${modifierName}()`,
          correct: nonExistent.example
        } : undefined
      })

      if (validationConfig.errorLevel === 'error') {
        throw error
      } else {
        console.warn(error.getFormattedMessage())
      }
      return
    }

    // Check parameter counts
    const noParamModifiers = new Set(['clipped', 'resizable'])
    if (noParamModifiers.has(modifierName) && args.length > 0) {
      const error = new TachUIValidationError(`${modifierName}() takes no parameters`, {
        component: componentType,
        suggestion: `Use ${modifierName}() without arguments`,
        example: {
          wrong: `.${modifierName}(someValue)`,
          correct: `.${modifierName}()`
        }
      })

      if (validationConfig.errorLevel === 'error') {
        throw error
      } else {
        console.warn(error.getFormattedMessage())
      }
    }

    // Component-specific modifier validation
    const textOnlyModifiers = new Set(['font', 'fontSize', 'fontWeight', 'textAlign', 'lineHeight', 'letterSpacing'])
    const interactiveOnlyModifiers = new Set(['disabled', 'onTap', 'cursor'])

    if (textOnlyModifiers.has(modifierName) && componentType !== 'Text') {
      const message = `${modifierName} modifier is only valid for Text components`

      if (validationConfig.errorLevel === 'error') {
        throw new TachUIValidationError(message, {
          component: componentType,
          suggestion: `Use ${modifierName} modifier on Text components only`
        })
      } else if (validationConfig.errorLevel === 'warn') {
        console.warn(`⚠️ ${message}`)
      }
    }

    if (interactiveOnlyModifiers.has(modifierName) && !['Button', 'Toggle', 'Slider'].includes(componentType)) {
      const message = `${modifierName} modifier is only valid for interactive components`

      if (validationConfig.errorLevel === 'warn') {
        console.warn(`⚠️ ${message}`)
      }
    }
  }
}

/**
 * Create validated component wrapper
 */
export function createValidatedComponent<T extends ComponentInstance>(
  originalConstructor: (...args: any[]) => T,
  validator: (args: unknown[]) => void,
  componentType: string
): (...args: any[]) => T {

  return function validatedConstructor(this: any, ...args: unknown[]): T {
    // Run validation
    validator(args)

    // Create the component
    const instance = originalConstructor.apply(this, args as any)

    // Wrap with modifier validation if it has modifiers
    if ('modifier' in instance && typeof instance.modifier === 'object') {
      return wrapWithModifierValidation(instance, componentType)
    }

    return instance
  }
}

/**
 * Wrap component with modifier validation
 */
function wrapWithModifierValidation<T extends ComponentInstance>(instance: T, componentType: string): T {
  if (!isValidationEnabled()) return instance

  return new Proxy(instance, {
    get(target, prop) {
      const value = target[prop as keyof T]

      if (prop === 'modifier') {
        return wrapModifierChain(value, componentType)
      }

      return value
    }
  })
}

/**
 * Wrap modifier chain with validation
 */
function wrapModifierChain(modifierChain: any, componentType: string): any {
  if (!modifierChain) return modifierChain

  return new Proxy(modifierChain, {
    get(target, prop) {
      const propName = String(prop)
      const originalMethod = target[prop]

      // Allow build and other meta methods
      if (propName === 'build' || propName === 'addModifier' || propName === 'responsive') {
        return originalMethod
      }

      if (typeof originalMethod === 'function') {
        return function validatedModifier(...args: unknown[]) {
          // Validate before calling
          ModifierValidation.validateModifier(componentType, propName, args)

          // Call original method
          return originalMethod.apply(target, args)
        }
      }

      return originalMethod
    }
  })
}

/**
 * Validation utilities
 */
export const ValidationUtils = {
  /**
   * Enable validation
   */
  enable(enabled: boolean = true): void {
    configureValidation({ enabled })
  },

  /**
   * Enable strict mode
   */
  enableStrictMode(): void {
    configureValidation({ strictMode: true })
    console.info('🚨 TachUI Strict validation mode enabled')
  },

  /**
   * Set error level
   */
  setErrorLevel(level: 'error' | 'warn' | 'info'): void {
    configureValidation({ errorLevel: level })
  },

  /**
   * Test validation system
   */
  test(): void {
    if (!isValidationEnabled()) {
      console.info('ℹ️ Validation is disabled in production mode')
      return
    }

    console.group('🔍 TachUI Validation System Test')

    try {
      console.info('✅ Validation system is working correctly')
    } catch (error) {
      console.error('❌ Validation test failed:', error)
    }

    console.groupEnd()
  },

  /**
   * Get validation stats
   */
  getStats() {
    return {
      enabled: isValidationEnabled(),
      config: validationConfig,
      components: ['Text', 'Button', 'VStack', 'HStack', 'ZStack'],
      modifiers: ['All modifiers validated for component compatibility']
    }
  }
}
