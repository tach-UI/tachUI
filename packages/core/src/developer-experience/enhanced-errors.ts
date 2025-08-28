/**
 * Enhanced Error Messages and Developer Experience (Phase Maroon Week 2)
 *
 * Provides better error messages, debugging aids, and developer-friendly
 * error reporting for the TachUI framework.
 */

import type { Modifier } from '../modifiers/types'
import type { ComponentInstance } from '../runtime/types'

/**
 * Enhanced error with developer-friendly context
 */
export interface EnhancedTachUIError extends Error {
  code: string
  category: 'modifier' | 'component' | 'runtime' | 'reactive' | 'validation'
  severity: 'warning' | 'error' | 'fatal'
  component?: string
  suggestion: string
  documentation?: string
  examples?: string[]
  relatedErrors?: string[]
}

/**
 * Developer experience error factory
 */
// eslint-disable-next-line typescript-eslint/no-extraneous-class
export class DeveloperErrorFactory {
  /**
   * Create modifier validation error
   */
  static modifierValidationError(
    modifier: string,
    issue: string,
    component?: ComponentInstance
  ): EnhancedTachUIError {
    const componentName = component?.type || 'Unknown'

    const error = new Error(`Invalid modifier usage: ${modifier} - ${issue}`) as EnhancedTachUIError

    error.code = 'MODIFIER_VALIDATION_ERROR'
    error.category = 'modifier'
    error.severity = 'error'
    error.component = componentName
    error.suggestion = DeveloperErrorFactory.getModifierSuggestion(modifier, issue)
    error.documentation = `https://docs.tachui.dev/modifiers/${modifier.toLowerCase()}`
    error.examples = DeveloperErrorFactory.getModifierExamples(modifier)

    return error
  }

  /**
   * Create component validation error
   */
  static componentValidationError(
    componentType: string,
    prop: string,
    expectedType: string,
    actualValue: any
  ): EnhancedTachUIError {
    const actualType = Array.isArray(actualValue)
      ? `array[${actualValue.length}]`
      : typeof actualValue

    const error = new Error(
      `Component validation failed: ${componentType}.${prop} expected ${expectedType}, got ${actualType}`
    ) as EnhancedTachUIError

    error.code = 'COMPONENT_VALIDATION_ERROR'
    error.category = 'component'
    error.severity = 'error'
    error.component = componentType
    error.suggestion = `Ensure ${prop} is of type ${expectedType}. ${DeveloperErrorFactory.getTypeConversionSuggestion(expectedType, actualValue)}`
    error.documentation = `https://docs.tachui.dev/components/${componentType.toLowerCase()}`
    error.examples = DeveloperErrorFactory.getComponentExamples(componentType, prop)

    return error
  }

  /**
   * Create reactive system error
   */
  static reactiveSystemError(
    operation: string,
    issue: string,
    context?: string
  ): EnhancedTachUIError {
    const error = new Error(`Reactive system error: ${operation} - ${issue}`) as EnhancedTachUIError

    error.code = 'REACTIVE_SYSTEM_ERROR'
    error.category = 'reactive'
    error.severity = 'error'
    error.suggestion = DeveloperErrorFactory.getReactiveSuggestion(operation, issue)
    error.documentation = 'https://docs.tachui.dev/reactive/signals'
    error.examples = DeveloperErrorFactory.getReactiveExamples(operation)

    if (context) {
      error.message += ` (Context: ${context})`
    }

    return error
  }

  /**
   * Create runtime error
   */
  static runtimeError(operation: string, issue: string, component?: string): EnhancedTachUIError {
    const error = new Error(`Runtime error: ${operation} - ${issue}`) as EnhancedTachUIError

    error.code = 'RUNTIME_ERROR'
    error.category = 'runtime'
    error.severity = 'fatal'
    error.component = component
    error.suggestion = DeveloperErrorFactory.getRuntimeSuggestion(operation, issue)
    error.documentation = 'https://docs.tachui.dev/runtime/renderer'

    return error
  }

  /**
   * Get modifier-specific suggestion
   */
  private static getModifierSuggestion(modifier: string, issue: string): string {
    const suggestions = {
      padding: {
        'conflicting properties':
          'Use either .padding(number) for all sides, or .padding({ horizontal, vertical }) for symmetric padding, or individual directional functions like .paddingTop()',
        'invalid value': 'Padding values must be numbers (pixels) or valid CSS length strings',
        'negative padding':
          'Negative padding values are not recommended and may cause layout issues',
      },
      frame: {
        'missing dimensions':
          'Frame modifier requires at least width or height: .frame(width, height) or .frame({ width: 100 })',
        'invalid dimensions':
          'Frame dimensions must be positive numbers or valid CSS length values',
      },
      backgroundColor: {
        'invalid color':
          'Use valid color formats: hex (#ff0000), rgb (rgb(255,0,0)), or named colors (red)',
        'asset not found':
          'Color asset not found. Check your asset definitions or use getColor() to verify',
      },
      onTap: {
        'not a function': 'onTap requires a function: .onTap(() => { /* your code */ })',
        'missing parameter':
          'onTap handler will receive a MouseEvent: .onTap((event) => { /* handle event */ })',
      },
    }

    const modifierSuggestions = suggestions[modifier as keyof typeof suggestions] as
      | Record<string, string>
      | undefined
    return (
      modifierSuggestions?.[issue] ||
      `Check the ${modifier} modifier documentation for proper usage`
    )
  }

  /**
   * Get modifier examples
   */
  private static getModifierExamples(modifier: string): string[] {
    const examples = {
      padding: [
        '.padding(16)',
        '.padding({ horizontal: 20, vertical: 12 })',
        '.paddingTop(8).paddingHorizontal(16)',
        '.paddingLeading(20) // SwiftUI-style',
      ],
      frame: [
        '.frame(100, 200)',
        '.frame({ width: 100, height: 200 })',
        '.frame({ minWidth: 50, maxWidth: 200 })',
      ],
      backgroundColor: [
        '.backgroundColor("#ff0000")',
        '.backgroundColor("rgb(255, 0, 0)")',
        '.backgroundColor(Colors.primary) // Asset',
      ],
      onTap: ['.onTap(() => console.log("Tapped!"))', '.onTap((event) => handleTap(event))'],
    }

    return examples[modifier as keyof typeof examples] || []
  }

  /**
   * Get component examples
   */
  private static getComponentExamples(componentType: string, prop: string): string[] {
    const examples = {
      Text: {
        children: ['Text("Hello World")', 'Text(() => dynamicText())'],
        style: ['Text("Hello").fontSize(16)', 'Text("Hello").foregroundColor("red")'],
      },
      Button: {
        children: ['Button({ children: "Click me" })', 'Button({ children: () => buttonText() })'],
        onPress: ['Button({ onPress: () => handlePress() })'],
      },
      VStack: {
        children: [
          'VStack([Text("Item 1"), Text("Item 2")])',
          'VStack({ children: childComponents })',
        ],
        spacing: ['VStack({ spacing: 16 })', 'VStack({ spacing: 8, children: items })'],
      },
    }

    const componentExamples = examples[componentType as keyof typeof examples] as
      | Record<string, string[]>
      | undefined
    return componentExamples?.[prop] || [`${componentType}({ ${prop}: /* your value */ })`]
  }

  /**
   * Get type conversion suggestion
   */
  private static getTypeConversionSuggestion(expectedType: string, actualValue: any): string {
    if (expectedType.includes('string') && typeof actualValue === 'number') {
      return `Convert number to string: "${actualValue}"`
    }

    if (expectedType.includes('number') && typeof actualValue === 'string') {
      const parsed = parseFloat(actualValue)
      if (!Number.isNaN(parsed)) {
        return `Convert string to number: ${parsed}`
      }
    }

    if (expectedType.includes('array') && !Array.isArray(actualValue)) {
      return `Wrap value in array: [${JSON.stringify(actualValue)}]`
    }

    if (expectedType.includes('function') && typeof actualValue !== 'function') {
      return 'Provide a function: () => { /* your code */ }'
    }

    return `Expected ${expectedType}, ensure the value matches this type`
  }

  /**
   * Get reactive system suggestion
   */
  private static getReactiveSuggestion(operation: string, issue: string): string {
    const suggestions = {
      createSignal: {
        'invalid initial value': 'Signal initial value should match the expected type',
        'mutation attempt':
          'Signals are immutable. Use the setter function: const [value, setValue] = createSignal(0); setValue(newValue)',
      },
      createEffect: {
        'missing dependencies':
          'Effect will only run when accessed signals change. Ensure all dependencies are accessed within the effect',
        'infinite loop':
          'Effect creates infinite loop. Avoid setting signals that the effect depends on',
      },
      createComputed: {
        'side effects':
          'Computed values should be pure. Avoid side effects like console.log or API calls',
        'circular dependency': 'Computed value depends on itself, creating circular dependency',
      },
    }

    const operationSuggestions = suggestions[operation as keyof typeof suggestions] as
      | Record<string, string>
      | undefined
    return (
      operationSuggestions?.[issue] || `Check reactive system documentation for ${operation} usage`
    )
  }

  /**
   * Get reactive examples
   */
  private static getReactiveExamples(operation: string): string[] {
    const examples = {
      createSignal: [
        'const [count, setCount] = createSignal(0)',
        'const [text, setText] = createSignal("Hello")',
        'const [user, setUser] = createSignal<User | null>(null)',
      ],
      createEffect: [
        'createEffect(() => { console.log("Count:", count()) })',
        'createEffect(() => { localStorage.setItem("count", count().toString()) })',
      ],
      createComputed: [
        'const doubled = createComputed(() => count() * 2)',
        'const fullName = createComputed(() => `${firstName()} ${lastName()}`)',
      ],
    }

    return examples[operation as keyof typeof examples] || []
  }

  /**
   * Get runtime suggestion
   */
  private static getRuntimeSuggestion(operation: string, issue: string): string {
    const suggestions = {
      render: 'Ensure all components return valid virtual DOM nodes',
      mount: 'Check that the mount target element exists in the DOM',
      update: 'Verify component state and props are valid before updating',
    }

    return (
      suggestions[operation as keyof typeof suggestions] ||
      `Runtime issue in ${operation}: ${issue}`
    )
  }
}

/**
 * Enhanced warning system
 */
// eslint-disable-next-line typescript-eslint/no-extraneous-class
export class DeveloperWarnings {
  private static warningsSeen = new Set<string>()

  /**
   * Warn about deprecated API usage
   */
  static deprecation(
    oldAPI: string,
    newAPI: string,
    component?: string,
    willBeRemovedIn?: string
  ): void {
    const key = `deprecation:${oldAPI}:${component || 'global'}`
    if (DeveloperWarnings.warningsSeen.has(key)) return

    DeveloperWarnings.warningsSeen.add(key)

    const componentContext = component ? ` in ${component}` : ''
    const removalVersion = willBeRemovedIn ? ` (will be removed in ${willBeRemovedIn})` : ''

    console.warn(
      `🟡 TachUI Deprecation Warning${componentContext}: ` +
        `"${oldAPI}" is deprecated. Use "${newAPI}" instead${removalVersion}.\n` +
        `See: https://docs.tachui.dev/migration/deprecations`
    )
  }

  /**
   * Warn about performance issues
   */
  static performance(issue: string, suggestion: string, component?: string): void {
    const key = `performance:${issue}:${component || 'global'}`
    if (DeveloperWarnings.warningsSeen.has(key)) return

    DeveloperWarnings.warningsSeen.add(key)

    const componentContext = component ? ` in ${component}` : ''

    console.warn(
      `⚡ TachUI Performance Warning${componentContext}: ${issue}\n` +
        `💡 Suggestion: ${suggestion}\n` +
        `See: https://docs.tachui.dev/performance/optimization`
    )
  }

  /**
   * Warn about accessibility issues
   */
  static accessibility(issue: string, suggestion: string, component?: string): void {
    const key = `a11y:${issue}:${component || 'global'}`
    if (DeveloperWarnings.warningsSeen.has(key)) return

    DeveloperWarnings.warningsSeen.add(key)

    const componentContext = component ? ` in ${component}` : ''

    console.warn(
      `♿ TachUI Accessibility Warning${componentContext}: ${issue}\n` +
        `💡 Suggestion: ${suggestion}\n` +
        `See: https://docs.tachui.dev/accessibility/guidelines`
    )
  }

  /**
   * Clear warning cache (for testing)
   */
  static clearWarnings(): void {
    DeveloperWarnings.warningsSeen.clear()
  }
}

/**
 * Type validation helpers
 */
// eslint-disable-next-line typescript-eslint/no-extraneous-class
export class TypeValidation {
  /**
   * Validate component props with enhanced error messages
   */
  static validateComponentProps<T extends Record<string, any>>(
    componentType: string,
    props: T,
    schema: Record<
      keyof T,
      {
        type: string
        required?: boolean
        validator?: (value: any) => boolean
        message?: string
      }
    >
  ): void {
    for (const [prop, config] of Object.entries(schema)) {
      const value = props[prop]

      // Check required
      if (config.required && (value === undefined || value === null)) {
        throw DeveloperErrorFactory.componentValidationError(
          componentType,
          prop,
          `${config.type} (required)`,
          value
        )
      }

      // Skip validation for optional undefined values
      if (value === undefined && !config.required) continue

      // Check type
      if (!TypeValidation.validateType(value, config.type)) {
        throw DeveloperErrorFactory.componentValidationError(
          componentType,
          prop,
          config.type,
          value
        )
      }

      // Custom validation
      if (config.validator && !config.validator(value)) {
        const error = DeveloperErrorFactory.componentValidationError(
          componentType,
          prop,
          config.type,
          value
        )
        if (config.message) {
          ;(error as any).suggestion = config.message
        }
        throw error
      }
    }
  }

  /**
   * Validate type
   */
  private static validateType(value: any, type: string): boolean {
    switch (type) {
      case 'string':
        return typeof value === 'string'
      case 'number':
        return typeof value === 'number' && !Number.isNaN(value)
      case 'boolean':
        return typeof value === 'boolean'
      case 'function':
        return typeof value === 'function'
      case 'array':
        return Array.isArray(value)
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value)
      case 'ComponentInstance':
        return value && typeof value === 'object' && 'type' in value
      case 'Signal':
        return typeof value === 'function' && 'peek' in value
      default:
        // Handle union types like 'string | number'
        if (type.includes('|')) {
          return type.split('|').some((t) => TypeValidation.validateType(value, t.trim()))
        }
        return true // Unknown types pass validation
    }
  }

  /**
   * Validate modifier combination
   */
  static validateModifierCombination(modifiers: Modifier[]): void {
    const conflicts = [
      {
        types: ['padding', 'padding'],
        message:
          'Multiple padding modifiers detected. Combine into single .padding() call or use specific directional functions',
      },
      {
        types: ['size', 'size'],
        message: 'Multiple size modifiers detected. Combine into single .size() call',
      },
    ]

    for (const conflict of conflicts) {
      const matchingModifiers = modifiers.filter((m) => conflict.types.includes(m.type))
      if (matchingModifiers.length > 1) {
        DeveloperWarnings.performance('Redundant modifiers detected', conflict.message)
      }
    }
  }
}

/**
 * Development mode utilities
 */
export const devMode = {
  /**
   * Enable enhanced error reporting in development
   */
  enableEnhancedErrors(): void {
    // Override console.error to provide enhanced formatting
    const originalError = console.error
    console.error = (...args) => {
      const firstArg = args[0]
      if (firstArg && typeof firstArg === 'object' && 'code' in firstArg) {
        const error = firstArg as EnhancedTachUIError
        console.group(`🚨 TachUI ${error.severity.toUpperCase()}: ${error.code}`)
        console.error(error.message)
        if (error.component) console.log(`📦 Component: ${error.component}`)
        console.log(`💡 Suggestion: ${error.suggestion}`)
        if (error.documentation) console.log(`📖 Docs: ${error.documentation}`)
        if (error.examples?.length) {
          console.group('💻 Examples:')
          error.examples.forEach((example) => console.log(`  ${example}`))
          console.groupEnd()
        }
        console.groupEnd()
      } else {
        originalError(...args)
      }
    }
  },

  /**
   * Log component tree for debugging
   */
  logComponentTree(root: any, depth = 0): void {
    const indent = '  '.repeat(depth)
    const modifierCount = root.modifiers?.length || 0
    const modifierInfo = modifierCount > 0 ? ` (${modifierCount} modifiers)` : ''

    console.log(`${indent}${root.type}${modifierInfo}`)

    // Log children if they exist
    if ('children' in root.props && Array.isArray(root.props.children)) {
      root.props.children.forEach((child: any) => {
        if (child && typeof child === 'object' && 'type' in child) {
          this.logComponentTree(child, depth + 1)
        }
      })
    }
  },
}
