/**
 * TachUI Forms Validation System
 *
 * Comprehensive validation engine with built-in rules, custom validators,
 * async validation support, and i18n-ready error messages.
 */

import type {
  CustomValidationRule,
  FieldState,
  FieldValidation,
  ValidationResult,
  ValidationRule,
} from '../types'

/**
 * Built-in validation rules
 */
const VALIDATION_RULES: Record<string, (value: any, options?: any) => ValidationResult> = {
  required: (value: any): ValidationResult => ({
    valid: value !== null && value !== undefined && value !== '',
    message: 'This field is required',
    code: 'REQUIRED',
  }),

  email: (value: string): ValidationResult => {
    if (!value) return { valid: true }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return {
      valid: emailRegex.test(value),
      message: 'Please enter a valid email address',
      code: 'INVALID_EMAIL',
    }
  },

  url: (value: string): ValidationResult => {
    if (!value) return { valid: true }
    try {
      new URL(value)
      return { valid: true }
    } catch {
      return {
        valid: false,
        message: 'Please enter a valid URL',
        code: 'INVALID_URL',
      }
    }
  },

  number: (value: any): ValidationResult => {
    if (!value) return { valid: true }
    const num = Number(value)
    return {
      valid: !Number.isNaN(num) && Number.isFinite(num),
      message: 'Please enter a valid number',
      code: 'INVALID_NUMBER',
    }
  },

  integer: (value: any): ValidationResult => {
    if (!value) return { valid: true }
    const num = Number(value)
    return {
      valid: !Number.isNaN(num) && Number.isFinite(num) && Number.isInteger(num),
      message: 'Please enter a valid integer',
      code: 'INVALID_INTEGER',
    }
  },

  min: (value: any, options: { min: number }): ValidationResult => {
    if (!value) return { valid: true }
    const num = Number(value)
    if (Number.isNaN(num)) return { valid: true } // Let number validation handle this

    return {
      valid: num >= options.min,
      message: `Value must be at least ${options.min}`,
      code: 'MIN_VALUE',
    }
  },

  max: (value: any, options: { max: number }): ValidationResult => {
    if (!value) return { valid: true }
    const num = Number(value)
    if (Number.isNaN(num)) return { valid: true } // Let number validation handle this

    return {
      valid: num <= options.max,
      message: `Value must be at most ${options.max}`,
      code: 'MAX_VALUE',
    }
  },

  minLength: (value: string, options: { minLength: number }): ValidationResult => {
    if (!value) return { valid: true }
    return {
      valid: value.length >= options.minLength,
      message: `Must be at least ${options.minLength} characters`,
      code: 'MIN_LENGTH',
    }
  },

  maxLength: (value: string, options: { maxLength: number }): ValidationResult => {
    if (!value) return { valid: true }
    return {
      valid: value.length <= options.maxLength,
      message: `Must be at most ${options.maxLength} characters`,
      code: 'MAX_LENGTH',
    }
  },

  pattern: (
    value: string,
    options: { pattern: string | RegExp; message?: string }
  ): ValidationResult => {
    if (!value) return { valid: true }
    const regex =
      typeof options.pattern === 'string' ? new RegExp(options.pattern) : options.pattern
    return {
      valid: regex.test(value),
      message: options.message || 'Value does not match required pattern',
      code: 'PATTERN_MISMATCH',
    }
  },

  // Additional validation rules expected by tests
  numeric: (value: any): ValidationResult => {
    if (!value) return { valid: true }
    const num = Number(value)
    return {
      valid: !Number.isNaN(num) && Number.isFinite(num),
      message: 'Please enter a valid number',
      code: 'INVALID_NUMERIC',
    }
  },

  phone: (value: string): ValidationResult => {
    if (!value) return { valid: true }
    const phoneRegex = /^\+?[\d\s\-().]+$/
    const digits = value.replace(/[\s\-().]/g, '')
    return {
      valid: phoneRegex.test(value) && digits.length >= 10,
      message: 'Please enter a valid phone number',
      code: 'INVALID_PHONE',
    }
  },

  creditCard: (value: string): ValidationResult => {
    if (!value) return { valid: true }
    const digits = value.replace(/\s/g, '')
    // Basic Luhn algorithm check
    let sum = 0
    let alternate = false
    for (let i = digits.length - 1; i >= 0; i--) {
      let n = parseInt(digits.charAt(i))
      if (alternate) {
        n *= 2
        if (n > 9) n = (n % 10) + 1
      }
      sum += n
      alternate = !alternate
    }
    return {
      valid: /^\d{13,19}$/.test(digits) && sum % 10 === 0,
      message: 'Please enter a valid credit card number',
      code: 'INVALID_CREDIT_CARD',
    }
  },

  ssn: (value: string): ValidationResult => {
    if (!value) return { valid: true }
    const digits = value.replace(/[-\s]/g, '')
    return {
      valid: /^\d{9}$/.test(digits),
      message: 'Please enter a valid Social Security Number',
      code: 'INVALID_SSN',
    }
  },

  postalCode: (value: string): ValidationResult => {
    if (!value) return { valid: true }
    // US ZIP code (5 or 9 digits) or international postal codes
    const usZip = /^\d{5}(-\d{4})?$/
    const intlPostal = /^[A-Z0-9]{3,10}$/i
    return {
      valid: usZip.test(value) || intlPostal.test(value),
      message: 'Please enter a valid postal code',
      code: 'INVALID_POSTAL_CODE',
    }
  },

  zipCode: (value: string): ValidationResult => {
    if (!value) return { valid: true }
    // US ZIP code (5 or 9 digits)
    const usZip = /^\d{5}(-\d{4})?$/
    return {
      valid: usZip.test(value),
      message: 'Please enter a valid ZIP code',
      code: 'INVALID_ZIP_CODE',
    }
  },

  date: (value: string): ValidationResult => {
    if (!value) return { valid: true }
    const date = new Date(value)
    return {
      valid: !Number.isNaN(date.getTime()) && !!value.match(/^\d{4}-\d{2}-\d{2}$/),
      message: 'Please enter a valid date (YYYY-MM-DD)',
      code: 'INVALID_DATE',
    }
  },

  time: (value: string): ValidationResult => {
    if (!value) return { valid: true }
    return {
      valid: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value),
      message: 'Please enter a valid time (HH:MM)',
      code: 'INVALID_TIME',
    }
  },

  strongPassword: (value: string): ValidationResult => {
    if (!value) return { valid: true }
    const hasUpperCase = /[A-Z]/.test(value)
    const hasLowerCase = /[a-z]/.test(value)
    const hasNumbers = /\d/.test(value)
    const hasNonalphas = /\W/.test(value)
    const isLongEnough = value.length >= 8

    const valid = hasUpperCase && hasLowerCase && hasNumbers && hasNonalphas && isLongEnough
    return {
      valid,
      message: valid
        ? undefined
        : 'Password must be at least 8 characters with uppercase, lowercase, number and special character',
      code: 'WEAK_PASSWORD',
    }
  },
}

/**
 * Custom validation rule registry
 */
const customRules = new Map<string, CustomValidationRule>()

/**
 * Register a custom validation rule
 */
export function registerValidationRule(rule: CustomValidationRule): void {
  customRules.set(rule.name, rule)
}

/**
 * Unregister a custom validation rule
 */
export function unregisterValidationRule(name: string): void {
  customRules.delete(name)
}

/**
 * Get all registered validation rules
 */
export function getValidationRules(): string[] {
  return [...Object.keys(VALIDATION_RULES), ...customRules.keys()]
}

/**
 * Validate a single value against validation rules
 */
export function validateValue(
  value: any,
  rules: ValidationRule[],
  options?: Record<string, any>
): ValidationResult {
  for (const rule of rules) {
    let result: ValidationResult

    if (typeof rule === 'string') {
      // Built-in rule
      const validator = VALIDATION_RULES[rule]
      if (validator) {
        result = validator(value, options?.[rule])
      } else {
        // Check custom rules
        const customRule = customRules.get(rule)
        if (customRule) {
          result = customRule.validate(value, customRule.options)
        } else {
          console.warn(`Unknown validation rule: ${rule}`)
          continue
        }
      }
    } else if ('validate' in rule) {
      // Custom validation rule object
      result = rule.validate(value, rule.options)
    } else {
      // Built-in validation rule object (BuiltInValidationRule)
      const validator = VALIDATION_RULES[rule.name]
      if (validator) {
        result = validator(value, rule.options)
      } else {
        console.warn(`Unknown built-in validation rule: ${rule.name}`)
        continue
      }
    }

    if (!result.valid) {
      return result
    }
  }

  return { valid: true }
}

/**
 * Validate a field state
 */
export function validateField(field: FieldState, validation?: FieldValidation): ValidationResult {
  if (!validation?.rules || validation.rules.length === 0) {
    return { valid: true }
  }

  return validateValue(field.value, validation.rules)
}

/**
 * Async validation function
 */
export async function validateValueAsync(
  value: any,
  rules: ValidationRule[],
  options?: Record<string, any>
): Promise<ValidationResult> {
  for (const rule of rules) {
    let result: ValidationResult | Promise<ValidationResult>

    if (typeof rule === 'string') {
      const validator = VALIDATION_RULES[rule]
      if (validator) {
        result = validator(value, options?.[rule])
      } else {
        const customRule = customRules.get(rule)
        if (customRule) {
          result = customRule.validate(value, customRule.options)
        } else {
          continue
        }
      }
    } else if ('validate' in rule) {
      // Custom validation rule object
      result = rule.validate(value, rule.options)
    } else {
      // Built-in validation rule object (BuiltInValidationRule)
      const validator = VALIDATION_RULES[rule.name]
      if (validator) {
        result = validator(value, rule.options)
      } else {
        continue
      }
    }

    // Handle async validation
    const validationResult = await Promise.resolve(result)

    if (!validationResult.valid) {
      return validationResult
    }
  }

  return { valid: true }
}

/**
 * Debounced validation
 */
export function createDebouncedValidator(
  validator: (value: any) => ValidationResult | Promise<ValidationResult>,
  delayMs: number = 300
) {
  let timeoutId: ReturnType<typeof setTimeout>
  let lastValue: any
  let lastResult: ValidationResult | Promise<ValidationResult>

  return (value: any): Promise<ValidationResult> => {
    return new Promise((resolve) => {
      // If value hasn't changed, return cached result
      if (value === lastValue && lastResult) {
        Promise.resolve(lastResult).then(resolve)
        return
      }

      lastValue = value

      // Clear previous timeout
      clearTimeout(timeoutId)

      // Set new timeout
      timeoutId = setTimeout(async () => {
        try {
          lastResult = validator(value)
          const result = await Promise.resolve(lastResult)
          resolve(result)
        } catch (_error) {
          resolve({
            valid: false,
            message: 'Validation error occurred',
            code: 'VALIDATION_ERROR',
          })
        }
      }, delayMs)
    })
  }
}

/**
 * Cross-field validation utilities
 */
export const CrossFieldValidators = {
  /**
   * Validate that two fields match (e.g., password confirmation)
   */
  fieldMatch:
    (field1: string, field2: string, message = 'Fields must match') =>
    (values: Record<string, any>): ValidationResult => {
      const isValid = values[field1] === values[field2]
      if (isValid) {
        return { valid: true }
      }
      return {
        valid: false,
        message,
        code: 'FIELD_MISMATCH',
      }
    },

  /**
   * Validate that at least one field in a group is filled
   */
  requireOneOf:
    (fields: string[], message = 'At least one field is required') =>
    (values: Record<string, any>): ValidationResult => {
      const hasValue = fields.some((field) => {
        const value = values[field]
        return value !== null && value !== undefined && value !== ''
      })

      if (hasValue) {
        return { valid: true }
      }
      return {
        valid: false,
        message,
        code: 'REQUIRE_ONE_OF',
      }
    },

  /**
   * Validate that a field is required when another field has a specific value
   */
  requiredWhen:
    (
      targetField: string,
      conditionalField: string,
      conditionalValue: any,
      message = `${targetField} is required`
    ) =>
    (values: Record<string, any>): ValidationResult => {
      if (values[conditionalField] === conditionalValue) {
        const targetValue = values[targetField]
        const isValid = targetValue !== null && targetValue !== undefined && targetValue !== ''
        if (isValid) {
          return { valid: true }
        }
        return {
          valid: false,
          message,
          code: 'REQUIRED_WHEN',
        }
      }
      return { valid: true }
    },

  /**
   * Validate date range (start date before end date)
   */
  dateRange:
    (startField: string, endField: string, message = 'End date must be after start date') =>
    (values: Record<string, any>): ValidationResult => {
      const startDate = values[startField]
      const endDate = values[endField]

      if (!startDate || !endDate) return { valid: true }

      const start = new Date(startDate)
      const end = new Date(endDate)
      const isValid = end >= start

      if (isValid) {
        return { valid: true }
      }
      return {
        valid: false,
        message,
        code: 'INVALID_DATE_RANGE',
      }
    },
}

/**
 * Built-in validation rule presets
 */
export const ValidationPresets = {
  email: ['required', 'email'],
  password: ['required', { name: 'minLength', options: { minLength: 8 } }],
  phone: [
    'required',
    { name: 'pattern', options: { pattern: /^\+?[\d\s-()]+$/, message: 'Invalid phone number' } },
  ],
  url: ['required', 'url'],
  positiveNumber: ['required', 'number', { name: 'min', options: { min: 0 } }],
  percentage: [
    'required',
    'number',
    { name: 'min', options: { min: 0 } },
    { name: 'max', options: { max: 100 } },
  ],
}

/**
 * Validation message formatter
 */
export class ValidationMessageFormatter {
  private messages: Record<string, string> = {}

  constructor(messages: Record<string, string> = {}) {
    this.messages = messages
  }

  setMessage(code: string, message: string): void {
    this.messages[code] = message
  }

  setMessages(messages: Record<string, string>): void {
    this.messages = { ...this.messages, ...messages }
  }

  format(result: ValidationResult, fieldName?: string): string {
    if (result.code && this.messages[result.code]) {
      return this.messages[result.code].replace(`\${field}`, fieldName || 'field')
    }
    return result.message || 'Validation failed'
  }
}

/**
 * Default validation message formatter instance
 */
export const defaultMessageFormatter = new ValidationMessageFormatter()

/**
 * Validation utilities
 */
export const ValidationUtils = {
  /**
   * Check if a validation result represents an error
   */
  isError: (result: ValidationResult): boolean => !result.valid,

  /**
   * Check if a validation result is valid
   */
  isValid: (result: ValidationResult): boolean => result.valid,

  /**
   * Combine multiple validation results
   */
  combineResults: (results: ValidationResult[]): ValidationResult => {
    const errors = results.filter((r) => !r.valid)
    if (errors.length === 0) {
      return { valid: true }
    }

    return {
      valid: false,
      message: errors.map((e) => e.message).join(', '),
      code: 'MULTIPLE_ERRORS',
    }
  },

  /**
   * Create a validation function from a rule configuration
   */
  createValidator:
    (rules: ValidationRule[], options?: Record<string, any>) =>
    (value: any): ValidationResult =>
      validateValue(value, rules, options),

  /**
   * Create an async validation function
   */
  createAsyncValidator:
    (rules: ValidationRule[], options?: Record<string, any>) =>
    (value: any): Promise<ValidationResult> =>
      validateValueAsync(value, rules, options),
}

// Export all validation functionality
export { VALIDATION_RULES }

// Export component validation for plugin registration
export * from './component-validation'
