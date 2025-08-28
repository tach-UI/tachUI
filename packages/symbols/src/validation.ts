/**
 * Symbols Package Component Validation
 *
 * Validation for @tachui/symbols components that registers with the Core
 * validation system, following proper plugin architecture.
 */

// Type-only interface for validation (no runtime import)
interface ComponentValidator {
  packageName: string
  componentName: string
  validate: (args: unknown[]) => void
}

/**
 * TachUI Symbols validation error class
 */
export class SymbolsValidationError extends Error {
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
    this.name = 'SymbolsValidationError'
  }

  getFormattedMessage(): string {
    const { component, suggestion, example, documentation } = this.context
    
    let formatted = `❌ [@tachui/symbols] ${component} Component Error: ${this.message}\n`

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
 * Symbols Components Validation
 */
export const SymbolsComponentValidation = {
  
  // Symbol Component
  validateSymbol(args: unknown[]): void {
    if (args.length === 0) {
      throw new SymbolsValidationError('Symbol component requires a props object with name', {
        component: 'Symbol',
        suggestion: 'Add name: Symbol({ name: "heart" })',
        documentation: 'https://docs.tachui.dev/symbols/components/symbol',
        example: {
          wrong: 'Symbol()',
          correct: 'Symbol({ name: "heart", size: 24 })'
        }
      })
    }

    const [props] = args
    
    // Handle string shorthand: Symbol("heart")
    if (typeof props === 'string') {
      if (!props.trim()) {
        throw new SymbolsValidationError('Symbol name cannot be empty', {
          component: 'Symbol',
          suggestion: 'Provide a valid symbol name',
          example: {
            wrong: 'Symbol("")',
            correct: 'Symbol("heart")'
          }
        })
      }
      return // Valid string usage
    }
    
    // Handle object props
    if (!props || typeof props !== 'object') {
      throw new SymbolsValidationError('Symbol requires a props object or string name', {
        component: 'Symbol',
        suggestion: 'Pass a props object with name property or a string name',
        example: {
          wrong: 'Symbol(123)',
          correct: 'Symbol({ name: "heart" }) or Symbol("heart")'
        }
      })
    }

    const propsObj = props as any
    if (!propsObj.name) {
      throw new SymbolsValidationError('Symbol name property is required', {
        component: 'Symbol',
        suggestion: 'Provide a symbol name from the available icon sets',
        example: {
          wrong: 'Symbol({ size: 24 })',
          correct: 'Symbol({ name: "heart", size: 24 })'
        }
      })
    }

    if (typeof propsObj.name !== 'string') {
      throw new SymbolsValidationError('Symbol name must be a string', {
        component: 'Symbol',
        suggestion: 'Use a string value for the symbol name',
        example: {
          wrong: 'Symbol({ name: 123 })',
          correct: 'Symbol({ name: "heart" })'
        }
      })
    }

    if (!propsObj.name.trim()) {
      throw new SymbolsValidationError('Symbol name cannot be empty', {
        component: 'Symbol',
        suggestion: 'Provide a valid symbol name',
        example: {
          wrong: 'Symbol({ name: "" })',
          correct: 'Symbol({ name: "heart" })'
        }
      })
    }
  },

  // Image Component (SwiftUI compatibility)
  validateImage(args: unknown[]): void {
    if (args.length === 0) {
      throw new SymbolsValidationError('Image component requires systemName or other image source', {
        component: 'Image',
        suggestion: 'Add systemName: Image({ systemName: "heart" })',
        documentation: 'https://docs.tachui.dev/symbols/compatibility/swiftui-shim',
        example: {
          wrong: 'Image()',
          correct: 'Image({ systemName: "heart" }) or Image("photo.jpg")'
        }
      })
    }

    const [props] = args
    
    // Handle string shorthand: Image("photo.jpg")
    if (typeof props === 'string') {
      if (!props.trim()) {
        throw new SymbolsValidationError('Image source cannot be empty', {
          component: 'Image',
          suggestion: 'Provide a valid image source or systemName',
          example: {
            wrong: 'Image("")',
            correct: 'Image("photo.jpg") or Image({ systemName: "heart" })'
          }
        })
      }
      return // Valid string usage
    }
    
    // Handle object props
    if (!props || typeof props !== 'object') {
      throw new SymbolsValidationError('Image requires a props object or string source', {
        component: 'Image',
        suggestion: 'Pass a props object with systemName property or a string source',
        example: {
          wrong: 'Image(123)',
          correct: 'Image({ systemName: "heart" }) or Image("photo.jpg")'
        }
      })
    }

    const propsObj = props as any
    if (!propsObj.systemName && !propsObj.src && !propsObj.url) {
      throw new SymbolsValidationError('Image requires systemName, src, or url property', {
        component: 'Image',
        suggestion: 'Provide a systemName for symbols or src/url for images',
        example: {
          wrong: 'Image({ alt: "Photo" })',
          correct: 'Image({ systemName: "heart" }) or Image({ src: "photo.jpg" })'
        }
      })
    }

    // Validate systemName if provided
    if (propsObj.systemName) {
      if (typeof propsObj.systemName !== 'string') {
        throw new SymbolsValidationError('Image systemName must be a string', {
          component: 'Image',
          suggestion: 'Use a string value for the systemName',
          example: {
            wrong: 'Image({ systemName: 123 })',
            correct: 'Image({ systemName: "heart" })'
          }
        })
      }

      if (!propsObj.systemName.trim()) {
        throw new SymbolsValidationError('Image systemName cannot be empty', {
          component: 'Image',
          suggestion: 'Provide a valid systemName',
          example: {
            wrong: 'Image({ systemName: "" })',
            correct: 'Image({ systemName: "heart" })'
          }
        })
      }
    }
  },

  // SystemImage Component (SwiftUI compatibility)
  validateSystemImage(args: unknown[]): void {
    if (args.length === 0) {
      throw new SymbolsValidationError('SystemImage component requires systemName', {
        component: 'SystemImage',
        suggestion: 'Add systemName: SystemImage("heart")',
        documentation: 'https://docs.tachui.dev/symbols/compatibility/swiftui-shim',
        example: {
          wrong: 'SystemImage()',
          correct: 'SystemImage("heart") or SystemImage({ name: "heart" })'
        }
      })
    }

    const [nameOrProps] = args
    
    // Handle string shorthand: SystemImage("heart")
    if (typeof nameOrProps === 'string') {
      if (!nameOrProps.trim()) {
        throw new SymbolsValidationError('SystemImage name cannot be empty', {
          component: 'SystemImage',
          suggestion: 'Provide a valid system image name',
          example: {
            wrong: 'SystemImage("")',
            correct: 'SystemImage("heart")'
          }
        })
      }
      return // Valid string usage
    }
    
    // Handle object props
    if (!nameOrProps || typeof nameOrProps !== 'object') {
      throw new SymbolsValidationError('SystemImage requires a string name or props object', {
        component: 'SystemImage',
        suggestion: 'Pass a string name or props object with name property',
        example: {
          wrong: 'SystemImage(123)',
          correct: 'SystemImage("heart") or SystemImage({ name: "heart" })'
        }
      })
    }

    const propsObj = nameOrProps as any
    if (!propsObj.name && !propsObj.systemName) {
      throw new SymbolsValidationError('SystemImage requires name or systemName property', {
        component: 'SystemImage',
        suggestion: 'Provide a name or systemName property',
        example: {
          wrong: 'SystemImage({ size: 24 })',
          correct: 'SystemImage({ name: "heart", size: 24 })'
        }
      })
    }

    const name = propsObj.name || propsObj.systemName
    if (typeof name !== 'string') {
      throw new SymbolsValidationError('SystemImage name must be a string', {
        component: 'SystemImage',
        suggestion: 'Use a string value for the name',
        example: {
          wrong: 'SystemImage({ name: 123 })',
          correct: 'SystemImage({ name: "heart" })'
        }
      })
    }

    if (!name.trim()) {
      throw new SymbolsValidationError('SystemImage name cannot be empty', {
        component: 'SystemImage',
        suggestion: 'Provide a valid system image name',
        example: {
          wrong: 'SystemImage({ name: "" })',
          correct: 'SystemImage({ name: "heart" })'
        }
      })
    }
  }
}

/**
 * Create Symbols component validators for registration
 */
export function createSymbolsValidators(): ComponentValidator[] {
  return [
    {
      packageName: 'symbols',
      componentName: 'Symbol',
      validate: SymbolsComponentValidation.validateSymbol
    },
    {
      packageName: 'symbols',
      componentName: 'Image',
      validate: SymbolsComponentValidation.validateImage
    },
    {
      packageName: 'symbols',
      componentName: 'SystemImage',
      validate: SymbolsComponentValidation.validateSystemImage
    }
  ]
}

/**
 * Register Symbols validators with Core validation system (development only)
 */
export async function registerSymbolsValidators(): Promise<void> {
  // Skip validation registration entirely in production
  if (process.env.NODE_ENV === 'production') {
    return
  }

  try {
    // Dynamic import to avoid bundling validation in production
    const { registerComponentValidator } = await import('@tachui/core/validation')
    
    const validators = createSymbolsValidators()
    
    for (const validator of validators) {
      registerComponentValidator(validator)
    }
    
    console.info(`🔍 [@tachui/symbols] Registered ${validators.length} component validators`)
  } catch (error) {
    console.warn('⚠️ [@tachui/symbols] Could not register validators with Core:', error)
  }
}

// Auto-register when Symbols package loads
let symbolsValidationRegistered = false

if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production' && !symbolsValidationRegistered) {
  symbolsValidationRegistered = true
  setTimeout(registerSymbolsValidators, 10)
}