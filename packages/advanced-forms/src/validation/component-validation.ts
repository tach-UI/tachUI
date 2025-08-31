/**
 * Forms Package Component Validation
 *
 * Validation for @tachui/advanced-forms components that registers with the Core
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

    let formatted = `❌ [@tachui/advanced-forms] ${component} Component Error: ${this.message}\n`

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
  // TextField Component
  validateTextField(args: unknown[]): void {
    if (args.length === 0) {
      throw new FormsValidationError(
        'TextField component requires a props object with name',
        {
          component: 'TextField',
          suggestion: 'Add name property: TextField({ name: "fieldName" })',
          documentation:
            'https://docs.tachui.dev/advanced-forms/components/textfield',
          example: {
            wrong: 'TextField()',
            correct: 'TextField({ name: "email", value: emailSignal })',
          },
        }
      )
    }

    const [props] = args
    if (!props || typeof props !== 'object') {
      throw new FormsValidationError('TextField requires a props object', {
        component: 'TextField',
        suggestion: 'Pass a props object with name property',
        example: {
          wrong: 'TextField("email")',
          correct: 'TextField({ name: "email" })',
        },
      })
    }

    const propsObj = props as any
    if (!propsObj.name || typeof propsObj.name !== 'string') {
      throw new FormsValidationError(
        'TextField name property is required and must be a string',
        {
          component: 'TextField',
          suggestion: 'Provide a unique name for the field',
          example: {
            wrong: 'TextField({ placeholder: "Email" })',
            correct: 'TextField({ name: "email", placeholder: "Email" })',
          },
        }
      )
    }
  },

  // EmailField Component
  validateEmailField(args: unknown[]): void {
    if (args.length === 0) {
      throw new FormsValidationError(
        'EmailField component requires a props object with name',
        {
          component: 'EmailField',
          suggestion: 'Add name property: EmailField({ name: "email" })',
          documentation:
            'https://docs.tachui.dev/advanced-forms/components/emailfield',
          example: {
            wrong: 'EmailField()',
            correct: 'EmailField({ name: "email", value: emailSignal })',
          },
        }
      )
    }

    const [props] = args
    if (!props || typeof props !== 'object') {
      throw new FormsValidationError('EmailField requires a props object', {
        component: 'EmailField',
        suggestion: 'Pass a props object with name property',
        example: {
          wrong: 'EmailField("email@example.com")',
          correct: 'EmailField({ name: "email", value: "email@example.com" })',
        },
      })
    }

    const propsObj = props as any
    if (!propsObj.name || typeof propsObj.name !== 'string') {
      throw new FormsValidationError(
        'EmailField name property is required and must be a string',
        {
          component: 'EmailField',
          suggestion: 'Provide a unique name for the email field',
          example: {
            wrong: 'EmailField({ placeholder: "Email" })',
            correct: 'EmailField({ name: "email", placeholder: "Email" })',
          },
        }
      )
    }
  },

  // PasswordField Component
  validatePasswordField(args: unknown[]): void {
    if (args.length === 0) {
      throw new FormsValidationError(
        'PasswordField component requires a props object with name',
        {
          component: 'PasswordField',
          suggestion: 'Add name property: PasswordField({ name: "password" })',
          documentation:
            'https://docs.tachui.dev/advanced-forms/components/passwordfield',
          example: {
            wrong: 'PasswordField()',
            correct:
              'PasswordField({ name: "password", value: passwordSignal })',
          },
        }
      )
    }

    const [props] = args
    if (!props || typeof props !== 'object') {
      throw new FormsValidationError('PasswordField requires a props object', {
        component: 'PasswordField',
        suggestion: 'Pass a props object with name property',
        example: {
          wrong: 'PasswordField("password")',
          correct: 'PasswordField({ name: "password", value: passwordSignal })',
        },
      })
    }

    const propsObj = props as any
    if (!propsObj.name || typeof propsObj.name !== 'string') {
      throw new FormsValidationError(
        'PasswordField name property is required and must be a string',
        {
          component: 'PasswordField',
          suggestion: 'Provide a unique name for the password field',
          example: {
            wrong: 'PasswordField({ placeholder: "Password" })',
            correct:
              'PasswordField({ name: "password", placeholder: "Password" })',
          },
        }
      )
    }
  },

  // PhoneField Component
  validatePhoneField(args: unknown[]): void {
    if (args.length === 0) {
      throw new FormsValidationError(
        'PhoneField component requires a props object with name',
        {
          component: 'PhoneField',
          suggestion: 'Add name property: PhoneField({ name: "phone" })',
          documentation:
            'https://docs.tachui.dev/advanced-forms/components/phonefield',
          example: {
            wrong: 'PhoneField()',
            correct: 'PhoneField({ name: "phone", format: "US" })',
          },
        }
      )
    }

    const [props] = args
    if (!props || typeof props !== 'object') {
      throw new FormsValidationError('PhoneField requires a props object', {
        component: 'PhoneField',
        suggestion: 'Pass a props object with name property',
        example: {
          wrong: 'PhoneField("(555) 123-4567")',
          correct: 'PhoneField({ name: "phone", value: phoneSignal })',
        },
      })
    }

    const propsObj = props as any
    if (!propsObj.name || typeof propsObj.name !== 'string') {
      throw new FormsValidationError(
        'PhoneField name property is required and must be a string',
        {
          component: 'PhoneField',
          suggestion: 'Provide a unique name for the phone field',
          example: {
            wrong: 'PhoneField({ format: "US" })',
            correct: 'PhoneField({ name: "phone", format: "US" })',
          },
        }
      )
    }
  },

  // NumberField Component
  validateNumberField(args: unknown[]): void {
    if (args.length === 0) {
      throw new FormsValidationError(
        'NumberField component requires a props object with name',
        {
          component: 'NumberField',
          suggestion: 'Add name property: NumberField({ name: "amount" })',
          documentation:
            'https://docs.tachui.dev/advanced-forms/components/numberfield',
          example: {
            wrong: 'NumberField()',
            correct: 'NumberField({ name: "amount", min: 0, max: 100 })',
          },
        }
      )
    }

    const [props] = args
    if (!props || typeof props !== 'object') {
      throw new FormsValidationError('NumberField requires a props object', {
        component: 'NumberField',
        suggestion: 'Pass a props object with name property',
        example: {
          wrong: 'NumberField(42)',
          correct: 'NumberField({ name: "amount", value: 42 })',
        },
      })
    }

    const propsObj = props as any
    if (!propsObj.name || typeof propsObj.name !== 'string') {
      throw new FormsValidationError(
        'NumberField name property is required and must be a string',
        {
          component: 'NumberField',
          suggestion: 'Provide a unique name for the number field',
          example: {
            wrong: 'NumberField({ min: 0, max: 100 })',
            correct: 'NumberField({ name: "amount", min: 0, max: 100 })',
          },
        }
      )
    }
  },

  // CreditCardField Component
  validateCreditCardField(args: unknown[]): void {
    if (args.length === 0) {
      throw new FormsValidationError(
        'CreditCardField component requires a props object with name',
        {
          component: 'CreditCardField',
          suggestion:
            'Add name property: CreditCardField({ name: "cardNumber" })',
          documentation:
            'https://docs.tachui.dev/advanced-forms/components/creditcardfield',
          example: {
            wrong: 'CreditCardField()',
            correct:
              'CreditCardField({ name: "cardNumber", onChange: handleChange })',
          },
        }
      )
    }

    const [props] = args
    if (!props || typeof props !== 'object') {
      throw new FormsValidationError(
        'CreditCardField requires a props object',
        {
          component: 'CreditCardField',
          suggestion: 'Pass a props object with name property',
          example: {
            wrong: 'CreditCardField("4111111111111111")',
            correct:
              'CreditCardField({ name: "cardNumber", value: cardSignal })',
          },
        }
      )
    }

    const propsObj = props as any
    if (!propsObj.name || typeof propsObj.name !== 'string') {
      throw new FormsValidationError(
        'CreditCardField name property is required and must be a string',
        {
          component: 'CreditCardField',
          suggestion: 'Provide a unique name for the credit card field',
          example: {
            wrong: 'CreditCardField({ placeholder: "Card Number" })',
            correct:
              'CreditCardField({ name: "cardNumber", placeholder: "Card Number" })',
          },
        }
      )
    }
  },

  // Additional Forms components would go here...
  // (SearchField, URLField, TextArea, ColorField, etc.)
}

/**
 * Create Forms component validators for registration
 */
export function createFormsValidators(): ComponentValidator[] {
  return [
    {
      packageName: 'advanced-forms',
      componentName: 'TextField',
      validate: FormsComponentValidation.validateTextField,
    },
    {
      packageName: 'advanced-forms',
      componentName: 'EmailField',
      validate: FormsComponentValidation.validateEmailField,
    },
    {
      packageName: 'advanced-forms',
      componentName: 'PasswordField',
      validate: FormsComponentValidation.validatePasswordField,
    },
    {
      packageName: 'advanced-forms',
      componentName: 'PhoneField',
      validate: FormsComponentValidation.validatePhoneField,
    },
    {
      packageName: 'advanced-forms',
      componentName: 'NumberField',
      validate: FormsComponentValidation.validateNumberField,
    },
    {
      packageName: 'advanced-forms',
      componentName: 'CreditCardField',
      validate: FormsComponentValidation.validateCreditCardField,
    },
    // Additional validators would be added here for remaining Forms components
  ]
}

/**
 * Register Forms validators with Core validation system
 */
export async function registerFormsValidators(): Promise<void> {
  try {
    // Dynamic import to avoid circular dependency
    const { registerComponentValidator } = await import(
      '@tachui/core/validation'
    )

    const validators = createFormsValidators()

    for (const validator of validators) {
      registerComponentValidator(validator)
    }

    if (process.env.NODE_ENV !== 'production') {
      console.info(
        `🔍 [@tachui/advanced-forms] Registered ${validators.length} component validators`
      )
    }
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        '⚠️ [@tachui/advanced-forms] Could not register validators with Core:',
        error
      )
    }
  }
}

// Auto-register when Forms package loads
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  setTimeout(registerFormsValidators, 10)
}
