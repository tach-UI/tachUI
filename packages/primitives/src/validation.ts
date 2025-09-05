/**
 * Primitive Components Validation
 *
 * Component validation for primitive components (Text, Button, Image, Toggle, Layout).
 * Co-located with the components they validate for better maintainability.
 *
 * Moved from @tachui/core for proper architectural separation.
 */

// Import reactive utilities from core
// TODO: These imports need to be properly configured once the dependency structure is set up
// For now, we'll create minimal interfaces to avoid import issues
interface Signal<T> {
  value: T
}

function isSignal(value: any): value is Signal<any> {
  return value && typeof value === 'object' && 'value' in value
}

/**
 * Enhanced validation error class for primitives
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
      package?: string
    }
  ) {
    super(message)
    this.name = 'TachUIValidationError'
  }

  getFormattedMessage(): string {
    const {
      component,
      suggestion,
      example,
      documentation,
      package: pkg,
    } = this.context
    const packageName = pkg ? `[@tachui/${pkg}]` : '[Primitives]'

    let formatted = `❌ ${packageName} ${component} Component Error: ${this.message}\n`

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
 * Validation configuration for primitives
 */
interface ValidationConfig {
  enabled: boolean
  errorLevel: 'off' | 'warn' | 'error'
}

let validationConfig: ValidationConfig = {
  enabled: process.env.NODE_ENV !== 'production',
  errorLevel: 'error',
}

function isValidationEnabled(): boolean {
  return validationConfig.enabled && process.env.NODE_ENV !== 'production'
}

/**
 * Primitive component validation rules
 */
export const PrimitiveComponentValidation = {
  // Text Component
  validateText(args: unknown[]): void {
    if (!isValidationEnabled()) return

    if (args.length === 0) {
      throw new TachUIValidationError(
        'Text component requires a content parameter',
        {
          component: 'Text',
          suggestion: 'Add a content parameter: Text("Hello World")',
          documentation: 'https://docs.tachui.dev/components/text',
          example: {
            wrong: 'Text()',
            correct: 'Text("Hello World")',
          },
        }
      )
    }

    const [content] = args
    if (content === undefined || content === null) {
      throw new TachUIValidationError(
        'Text content cannot be undefined or null',
        {
          component: 'Text',
          suggestion: 'Provide a valid string, function, or Signal',
          example: {
            wrong: 'Text(null)',
            correct: 'Text("Hello World")',
          },
        }
      )
    }

    const contentType = typeof content
    const isValidContent =
      contentType === 'string' ||
      contentType === 'function' ||
      isSignal(content)

    if (!isValidContent) {
      throw new TachUIValidationError(
        `Text content must be a string, function, or Signal. Received: ${contentType}`,
        {
          component: 'Text',
          suggestion: 'Use a string literal, function, or reactive signal',
          example: {
            wrong: 'Text(123)',
            correct: 'Text("Hello World")',
          },
        }
      )
    }
  },

  // Button Component
  validateButton(args: unknown[]): void {
    if (!isValidationEnabled()) return

    if (args.length === 0) {
      throw new TachUIValidationError(
        'Button component requires a title parameter',
        {
          component: 'Button',
          suggestion: 'Add a title parameter: Button("Click me", () => {})',
          documentation: 'https://docs.tachui.dev/components/button',
          example: {
            wrong: 'Button()',
            correct: 'Button("Click me", () => {})',
          },
        }
      )
    }

    const [title, action] = args
    if (title === undefined || title === null) {
      throw new TachUIValidationError(
        'Button title cannot be undefined or null',
        {
          component: 'Button',
          suggestion: 'Provide a valid string, function, or Signal',
          example: {
            wrong: 'Button(null)',
            correct: 'Button("Click me")',
          },
        }
      )
    }

    const titleType = typeof title
    const isValidTitle =
      titleType === 'string' || titleType === 'function' || isSignal(title)

    if (!isValidTitle) {
      throw new TachUIValidationError(
        `Button title must be a string, function, or Signal. Received: ${titleType}`,
        {
          component: 'Button',
          suggestion: 'Use a string literal, function, or reactive signal',
          example: {
            wrong: 'Button(123)',
            correct: 'Button("Click me")',
          },
        }
      )
    }

    if (
      action === undefined &&
      args.length === 1 &&
      validationConfig.errorLevel !== 'error'
    ) {
      console.warn(
        '⚠️ Button without action may not be interactive. Consider adding an action parameter.'
      )
    }
  },

  // Image Component
  validateImage(args: unknown[]): void {
    if (!isValidationEnabled()) return

    if (args.length === 0) {
      throw new TachUIValidationError(
        'Image component requires a source parameter',
        {
          component: 'Image',
          suggestion: 'Add a source parameter: Image({ source: "image.jpg" })',
          documentation: 'https://docs.tachui.dev/components/image',
          example: {
            wrong: 'Image()',
            correct: 'Image({ source: "image.jpg" })',
          },
        }
      )
    }

    const [props] = args
    if (!props || typeof props !== 'object') {
      throw new TachUIValidationError('Image requires a props object', {
        component: 'Image',
        suggestion: 'Pass a props object with source property',
        example: {
          wrong: 'Image("image.jpg")',
          correct: 'Image({ source: "image.jpg" })',
        },
      })
    }

    const propsObj = props as any
    if (!propsObj.source) {
      throw new TachUIValidationError('Image source property is required', {
        component: 'Image',
        suggestion: 'Provide a valid image source URL or path',
        example: {
          wrong: 'Image({ alt: "description" })',
          correct: 'Image({ source: "image.jpg", alt: "description" })',
        },
      })
    }
  },

  // Toggle Component
  validateToggle(args: unknown[]): void {
    if (!isValidationEnabled()) return

    if (args.length === 0) {
      throw new TachUIValidationError(
        'Toggle component requires an isOn parameter',
        {
          component: 'Toggle',
          suggestion: 'Add an isOn parameter: Toggle({ isOn: signal })',
          documentation: 'https://docs.tachui.dev/components/toggle',
          example: {
            wrong: 'Toggle()',
            correct: 'Toggle({ isOn: isEnabled })',
          },
        }
      )
    }

    const [props] = args
    if (!props || typeof props !== 'object') {
      throw new TachUIValidationError('Toggle requires a props object', {
        component: 'Toggle',
        suggestion: 'Pass a props object with isOn property',
        example: {
          wrong: 'Toggle(true)',
          correct: 'Toggle({ isOn: true })',
        },
      })
    }

    const propsObj = props as any
    if (propsObj.isOn === undefined) {
      throw new TachUIValidationError('Toggle isOn property is required', {
        component: 'Toggle',
        suggestion: 'Provide a boolean value or Signal for isOn',
        example: {
          wrong: 'Toggle({ onToggle: handler })',
          correct: 'Toggle({ isOn: true, onToggle: handler })',
        },
      })
    }
  },

  // Picker Component
  validatePicker(args: unknown[]): void {
    if (!isValidationEnabled()) return

    if (args.length === 0) {
      throw new TachUIValidationError(
        'Picker component requires a props object',
        {
          component: 'Picker',
          suggestion:
            'Add props: Picker({ options: ["A", "B"], selected: signal })',
          documentation: 'https://docs.tachui.dev/components/picker',
          example: {
            wrong: 'Picker()',
            correct: 'Picker({ options: ["A", "B"], selected: selectedValue })',
          },
        }
      )
    }

    const [props] = args
    if (!props || typeof props !== 'object') {
      throw new TachUIValidationError('Picker requires a props object', {
        component: 'Picker',
        suggestion: 'Pass a props object with options and selected properties',
        example: {
          wrong: 'Picker(["A", "B"])',
          correct: 'Picker({ options: ["A", "B"], selected: selectedValue })',
        },
      })
    }

    const propsObj = props as any
    if (!Array.isArray(propsObj.options)) {
      throw new TachUIValidationError('Picker options must be an array', {
        component: 'Picker',
        suggestion: 'Provide an array of options',
        example: {
          wrong: 'Picker({ options: "invalid" })',
          correct: 'Picker({ options: ["Option A", "Option B"] })',
        },
      })
    }

    if (propsObj.selected === undefined) {
      throw new TachUIValidationError('Picker selected property is required', {
        component: 'Picker',
        suggestion: 'Provide a selected value or Signal',
        example: {
          wrong: 'Picker({ options: ["A", "B"] })',
          correct: 'Picker({ options: ["A", "B"], selected: selectedValue })',
        },
      })
    }
  },

  // Layout Components (VStack, HStack, ZStack)
  validateStack(componentType: string, args: unknown[]): void {
    if (!isValidationEnabled()) return

    if (args.length === 0) {
      throw new TachUIValidationError(
        `${componentType} component requires a props object with children array`,
        {
          component: componentType,
          suggestion: `Add children: ${componentType}({ children: [Text("Hello")] })`,
          documentation: 'https://docs.tachui.dev/components/layout',
          example: {
            wrong: `${componentType}()`,
            correct: `${componentType}({ children: [Text("Hello")] })`,
          },
        }
      )
    }

    const [props] = args
    if (!props || typeof props !== 'object') {
      throw new TachUIValidationError(
        `${componentType} requires a props object`,
        {
          component: componentType,
          suggestion: 'Pass a props object with children array',
          example: {
            wrong: `${componentType}("invalid")`,
            correct: `${componentType}({ children: [Text("Hello")] })`,
          },
        }
      )
    }

    const propsObj = props as any
    if (!Array.isArray(propsObj.children)) {
      throw new TachUIValidationError(
        `${componentType} children must be an array`,
        {
          component: componentType,
          suggestion: 'Provide an array of components',
          example: {
            wrong: `${componentType}({ children: Text("Hello") })`,
            correct: `${componentType}({ children: [Text("Hello")] })`,
          },
        }
      )
    }
  },

  // Link Component
  validateLink(args: unknown[]): void {
    if (!isValidationEnabled()) return

    if (args.length === 0) {
      throw new TachUIValidationError(
        'Link component requires a props object with href',
        {
          component: 'Link',
          suggestion:
            'Add href: Link({ href: "/path", children: [Text("Click here")] })',
          documentation: 'https://docs.tachui.dev/components/link',
          example: {
            wrong: 'Link()',
            correct: 'Link({ href: "/about", children: [Text("About")] })',
          },
        }
      )
    }

    const [props] = args
    if (!props || typeof props !== 'object') {
      throw new TachUIValidationError('Link requires a props object', {
        component: 'Link',
        suggestion: 'Pass a props object with href property',
        example: {
          wrong: 'Link("/path")',
          correct: 'Link({ href: "/path", children: [Text("Link")] })',
        },
      })
    }

    const propsObj = props as any
    if (!propsObj.href) {
      throw new TachUIValidationError('Link href property is required', {
        component: 'Link',
        suggestion: 'Provide a valid URL or path for href',
        example: {
          wrong: 'Link({ children: [Text("Link")] })',
          correct: 'Link({ href: "/about", children: [Text("About")] })',
        },
      })
    }
  },

  // BasicForm Component
  validateBasicForm(args: unknown[]): void {
    if (!isValidationEnabled()) return

    if (args.length === 0) {
      throw new TachUIValidationError(
        'BasicForm component requires children array',
        {
          component: 'BasicForm',
          suggestion:
            'Add children: BasicForm([BasicInput({}), Button("Submit")])',
          documentation: 'https://docs.tachui.dev/components/forms',
          example: {
            wrong: 'BasicForm()',
            correct: 'BasicForm([BasicInput({}), Button("Submit")])',
          },
        }
      )
    }

    const [children, _props] = args
    if (!Array.isArray(children)) {
      throw new TachUIValidationError('BasicForm children must be an array', {
        component: 'BasicForm',
        suggestion: 'Provide an array of form components',
        example: {
          wrong: 'BasicForm(BasicInput({}))',
          correct: 'BasicForm([BasicInput({}), Button("Submit")])',
        },
      })
    }
  },

  // BasicInput Component
  validateBasicInput(args: unknown[]): void {
    if (!isValidationEnabled()) return

    const [_props] = args
    if (_props && typeof _props === 'object') {
      const propsObj = _props as any

      // Validate input type if provided
      if (propsObj.type) {
        const validTypes = [
          'text',
          'email',
          'password',
          'number',
          'tel',
          'url',
          'search',
        ]
        if (!validTypes.includes(propsObj.type)) {
          throw new TachUIValidationError(
            `Invalid input type: ${propsObj.type}`,
            {
              component: 'BasicInput',
              suggestion: `Use one of: ${validTypes.join(', ')}`,
              example: {
                wrong: 'BasicInput({ type: "invalid" })',
                correct: 'BasicInput({ type: "email" })',
              },
            }
          )
        }
      }
    }
  },
}

/**
 * Component validation wrapper
 */
export function withComponentValidation<T extends (...args: any[]) => any>(
  component: T,
  _componentName: string,
  validator: (args: unknown[]) => void
): T {
  return function validatedConstructor(this: any, ...args: unknown[]): T {
    // Run validation
    validator(args)

    // Call original component
    return component.apply(this, args)
  } as T
}

/**
 * Configure validation for primitives
 */
export function configurePrimitivesValidation(
  config: Partial<ValidationConfig>
): void {
  validationConfig = { ...validationConfig, ...config }
}

/**
 * Get current validation configuration
 */
export function getPrimitivesValidationConfig(): ValidationConfig {
  return { ...validationConfig }
}

/**
 * Validation utilities for primitives
 */
export const PrimitivesValidationUtils = {
  // Direct validation methods
  validateText: PrimitiveComponentValidation.validateText,
  validateButton: PrimitiveComponentValidation.validateButton,
  validateImage: PrimitiveComponentValidation.validateImage,
  validateToggle: PrimitiveComponentValidation.validateToggle,
  validatePicker: PrimitiveComponentValidation.validatePicker,
  validateStack: PrimitiveComponentValidation.validateStack,
  validateLink: PrimitiveComponentValidation.validateLink,
  validateBasicForm: PrimitiveComponentValidation.validateBasicForm,
  validateBasicInput: PrimitiveComponentValidation.validateBasicInput,

  // Configuration
  configure: configurePrimitivesValidation,
  getConfig: getPrimitivesValidationConfig,

  // Utilities
  isValidationEnabled,
  withComponentValidation,

  // Test method
  test: () => {
    console.group('🧪 Primitives Validation Test')

    try {
      // Test Text validation
      console.info('Testing Text validation...')
      PrimitiveComponentValidation.validateText(['Hello World'])
      console.info('✅ Text validation passed')

      // Test Button validation
      console.info('Testing Button validation...')
      PrimitiveComponentValidation.validateButton(['Click me', () => {}])
      console.info('✅ Button validation passed')

      // Test Image validation
      console.info('Testing Image validation...')
      PrimitiveComponentValidation.validateImage([{ source: 'image.jpg' }])
      console.info('✅ Image validation passed')

      // Test Stack validation
      console.info('Testing Stack validation...')
      PrimitiveComponentValidation.validateStack('VStack', [
        { children: ['Hello'] },
      ])
      console.info('✅ Stack validation passed')

      console.info('✅ All primitives validation tests passed')
    } catch (error) {
      console.error('❌ Primitives validation test failed:', error)
    }

    console.groupEnd()
  },
}
