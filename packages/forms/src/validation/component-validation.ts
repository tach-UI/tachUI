/**
 * Forms Package Component Validation
 *
 * Validation for @tachui/forms components that registers with the Core
 * validation system, following proper plugin architecture.
 */

// Import from core to register with the validation system
import type { ComponentValidator } from '@tachui/core/validation'

/**
 * TachUI Forms validation error class
 */
export class FormsValidationError extends Error {
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
    this.name = 'FormsValidationError'
  }

  getFormattedMessage(): string {
    const { component, suggestion, example, documentation } = this.context
    
    let formatted = `❌ [@tachui/forms] ${component} Component Error: ${this.message}\n`

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
 * Forms Components Validation
 */
export const FormsComponentValidation = {
  
  // EmailField Component
  validateEmailField(args: unknown[]): void {
    if (args.length === 0) {
      throw new FormsValidationError('EmailField component requires a props object with value', {
        component: 'EmailField',
        suggestion: 'Add value: EmailField({ value: emailSignal })',
        documentation: 'https://docs.tachui.dev/forms/components/emailfield',
        example: {
          wrong: 'EmailField()',
          correct: 'EmailField({ value: emailSignal, onChange: handleChange })'
        }
      })
    }

    const [props] = args
    if (!props || typeof props !== 'object') {
      throw new FormsValidationError('EmailField requires a props object', {
        component: 'EmailField',
        suggestion: 'Pass a props object with value property',
        example: {
          wrong: 'EmailField("email@example.com")',
          correct: 'EmailField({ value: "email@example.com" })'
        }
      })
    }

    const propsObj = props as any
    if (propsObj.value === undefined) {
      throw new FormsValidationError('EmailField value property is required', {
        component: 'EmailField',
        suggestion: 'Provide a value for the email field',
        example: {
          wrong: 'EmailField({ placeholder: "Email" })',
          correct: 'EmailField({ value: emailSignal, placeholder: "Email" })'
        }
      })
    }
  },

  // PasswordField Component
  validatePasswordField(args: unknown[]): void {
    if (args.length === 0) {
      throw new FormsValidationError('PasswordField component requires a props object with value', {
        component: 'PasswordField',
        suggestion: 'Add value: PasswordField({ value: passwordSignal })',
        documentation: 'https://docs.tachui.dev/forms/components/passwordfield',
        example: {
          wrong: 'PasswordField()',
          correct: 'PasswordField({ value: passwordSignal, onChange: handleChange })'
        }
      })
    }

    const [props] = args
    if (!props || typeof props !== 'object') {
      throw new FormsValidationError('PasswordField requires a props object', {
        component: 'PasswordField',
        suggestion: 'Pass a props object with value property',
        example: {
          wrong: 'PasswordField("password")',
          correct: 'PasswordField({ value: passwordSignal })'
        }
      })
    }

    const propsObj = props as any
    if (propsObj.value === undefined) {
      throw new FormsValidationError('PasswordField value property is required', {
        component: 'PasswordField',
        suggestion: 'Provide a value for the password field',
        example: {
          wrong: 'PasswordField({ placeholder: "Password" })',
          correct: 'PasswordField({ value: passwordSignal, placeholder: "Password" })'
        }
      })
    }
  },

  // PhoneField Component  
  validatePhoneField(args: unknown[]): void {
    if (args.length === 0) {
      throw new FormsValidationError('PhoneField component requires a props object with value', {
        component: 'PhoneField',
        suggestion: 'Add value: PhoneField({ value: phoneSignal })',
        documentation: 'https://docs.tachui.dev/forms/components/phonefield',
        example: {
          wrong: 'PhoneField()',
          correct: 'PhoneField({ value: phoneSignal, format: "US" })'
        }
      })
    }

    const [props] = args
    if (!props || typeof props !== 'object') {
      throw new FormsValidationError('PhoneField requires a props object', {
        component: 'PhoneField',
        suggestion: 'Pass a props object with value property',
        example: {
          wrong: 'PhoneField("(555) 123-4567")',
          correct: 'PhoneField({ value: phoneSignal })'
        }
      })
    }

    const propsObj = props as any
    if (propsObj.value === undefined) {
      throw new FormsValidationError('PhoneField value property is required', {
        component: 'PhoneField',
        suggestion: 'Provide a value for the phone field',
        example: {
          wrong: 'PhoneField({ format: "US" })',
          correct: 'PhoneField({ value: phoneSignal, format: "US" })'
        }
      })
    }
  },

  // NumberField Component
  validateNumberField(args: unknown[]): void {
    if (args.length === 0) {
      throw new FormsValidationError('NumberField component requires a props object with value', {
        component: 'NumberField',
        suggestion: 'Add value: NumberField({ value: numberSignal })',
        documentation: 'https://docs.tachui.dev/forms/components/numberfield',
        example: {
          wrong: 'NumberField()',
          correct: 'NumberField({ value: numberSignal, min: 0, max: 100 })'
        }
      })
    }

    const [props] = args
    if (!props || typeof props !== 'object') {
      throw new FormsValidationError('NumberField requires a props object', {
        component: 'NumberField',
        suggestion: 'Pass a props object with value property',
        example: {
          wrong: 'NumberField(42)',
          correct: 'NumberField({ value: 42 })'
        }
      })
    }

    const propsObj = props as any
    if (propsObj.value === undefined) {
      throw new FormsValidationError('NumberField value property is required', {
        component: 'NumberField',
        suggestion: 'Provide a numeric value for the field',
        example: {
          wrong: 'NumberField({ min: 0, max: 100 })',
          correct: 'NumberField({ value: 42, min: 0, max: 100 })'
        }
      })
    }
  },

  // CreditCardField Component
  validateCreditCardField(args: unknown[]): void {
    if (args.length === 0) {
      throw new FormsValidationError('CreditCardField component requires a props object with value', {
        component: 'CreditCardField',
        suggestion: 'Add value: CreditCardField({ value: cardSignal })',
        documentation: 'https://docs.tachui.dev/forms/components/creditcardfield',
        example: {
          wrong: 'CreditCardField()',
          correct: 'CreditCardField({ value: cardSignal, onChange: handleChange })'
        }
      })
    }

    const [props] = args
    if (!props || typeof props !== 'object') {
      throw new FormsValidationError('CreditCardField requires a props object', {
        component: 'CreditCardField',
        suggestion: 'Pass a props object with value property',
        example: {
          wrong: 'CreditCardField("4111111111111111")',
          correct: 'CreditCardField({ value: cardSignal })'
        }
      })
    }

    const propsObj = props as any
    if (propsObj.value === undefined) {
      throw new FormsValidationError('CreditCardField value property is required', {
        component: 'CreditCardField',
        suggestion: 'Provide a value for the credit card field',
        example: {
          wrong: 'CreditCardField({ placeholder: "Card Number" })',
          correct: 'CreditCardField({ value: cardSignal, placeholder: "Card Number" })'
        }
      })
    }
  },

  // Additional Forms components would go here...
  // (SearchField, URLField, TextArea, ColorField, Select, MultiSelect, Checkbox, Radio, etc.)
}

/**
 * Create Forms component validators for registration
 */
export function createFormsValidators(): ComponentValidator[] {
  return [
    {
      packageName: 'forms',
      componentName: 'EmailField',
      validate: FormsComponentValidation.validateEmailField
    },
    {
      packageName: 'forms',
      componentName: 'PasswordField',
      validate: FormsComponentValidation.validatePasswordField
    },
    {
      packageName: 'forms',
      componentName: 'PhoneField',
      validate: FormsComponentValidation.validatePhoneField
    },
    {
      packageName: 'forms',
      componentName: 'NumberField',
      validate: FormsComponentValidation.validateNumberField
    },
    {
      packageName: 'forms',
      componentName: 'CreditCardField',
      validate: FormsComponentValidation.validateCreditCardField
    }
    // Additional validators would be added here for remaining 9+ Forms components
  ]
}

/**
 * Register Forms validators with Core validation system
 */
export async function registerFormsValidators(): Promise<void> {
  try {
    // Dynamic import to avoid circular dependency
    const { registerComponentValidator } = await import('@tachui/core/validation')
    
    const validators = createFormsValidators()
    
    for (const validator of validators) {
      registerComponentValidator(validator)
    }
    
    if (process.env.NODE_ENV !== 'production') {
      console.info(`🔍 [@tachui/forms] Registered ${validators.length} component validators`)
    }
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('⚠️ [@tachui/forms] Could not register validators with Core:', error)
    }
  }
}

// Auto-register when Forms package loads
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  setTimeout(registerFormsValidators, 10)
}