/**
 * TextField Validators
 *
 * Pre-built validation functions for common input types.
 * Migrated and enhanced from core TextField to forms plugin.
 */

import type { ValidationResult } from '../types'

/**
 * Validation function type
 */
export type ValidationFunction = (value: string) => ValidationResult

/**
 * Common validation functions
 */
export const TextFieldValidators = {
  /**
   * Email validation
   */
  email: (value: string): ValidationResult => {
    if (!value) return { valid: true } // Allow empty unless required

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const valid = emailRegex.test(value)
    return {
      valid,
      ...(valid ? {} : { message: 'Please enter a valid email address', code: 'INVALID_EMAIL' }),
    }
  },

  /**
   * Phone number validation
   */
  phone: (value: string): ValidationResult => {
    if (!value) return { valid: true } // Allow empty unless required

    const phoneRegex = /^[+]?[1-9][\d]{0,15}$/
    const digits = value.replace(/\s/g, '')
    const valid = phoneRegex.test(digits)
    return {
      valid,
      ...(valid ? {} : { message: 'Please enter a valid phone number', code: 'INVALID_PHONE' }),
    }
  },

  /**
   * URL validation
   */
  url: (value: string): ValidationResult => {
    if (!value) return { valid: true } // Allow empty unless required

    try {
      new URL(value)
      return { valid: true }
    } catch {
      return { valid: false, message: 'Please enter a valid URL', code: 'INVALID_URL' }
    }
  },

  /**
   * Minimum length validation
   */
  minLength:
    (min: number) =>
    (value: string): ValidationResult => {
      const valid = !value || value.length >= min
      return {
        valid,
        ...(valid ? {} : { message: `Minimum length is ${min} characters`, code: 'MIN_LENGTH' }),
      }
    },

  /**
   * Maximum length validation
   */
  maxLength:
    (max: number) =>
    (value: string): ValidationResult => {
      const valid = !value || value.length <= max
      return {
        valid,
        ...(valid ? {} : { message: `Maximum length is ${max} characters`, code: 'MAX_LENGTH' }),
      }
    },

  /**
   * Required field validation
   */
  required: (value: string): ValidationResult => {
    const valid = Boolean(value && value.trim().length > 0)
    return {
      valid,
      ...(valid ? {} : { message: 'This field is required', code: 'REQUIRED' }),
    }
  },

  /**
   * Pattern validation
   */
  pattern:
    (regex: RegExp, message: string = 'Invalid format') =>
    (value: string): ValidationResult => {
      if (!value) return { valid: true } // Allow empty unless required

      const valid = regex.test(value)
      return {
        valid,
        ...(valid ? {} : { message, code: 'PATTERN_MISMATCH' }),
      }
    },

  /**
   * Numeric validation
   */
  numeric: (value: string): ValidationResult => {
    if (!value) return { valid: true } // Allow empty unless required

    const valid = !Number.isNaN(Number(value)) && Number.isFinite(Number(value))
    return {
      valid,
      ...(valid ? {} : { message: 'Please enter a valid number', code: 'INVALID_NUMBER' }),
    }
  },

  /**
   * Integer validation
   */
  integer: (value: string): ValidationResult => {
    if (!value) return { valid: true } // Allow empty unless required

    const number = Number(value)
    const valid = Number.isInteger(number)
    return {
      valid,
      ...(valid ? {} : { message: 'Please enter a whole number', code: 'INVALID_INTEGER' }),
    }
  },

  /**
   * Minimum value validation
   */
  min:
    (minValue: number) =>
    (value: string): ValidationResult => {
      if (!value) return { valid: true } // Allow empty unless required

      const number = Number(value)
      const valid = !Number.isNaN(number) && number >= minValue
      return {
        valid,
        ...(valid ? {} : { message: `Value must be at least ${minValue}`, code: 'MIN_VALUE' }),
      }
    },

  /**
   * Maximum value validation
   */
  max:
    (maxValue: number) =>
    (value: string): ValidationResult => {
      if (!value) return { valid: true } // Allow empty unless required

      const number = Number(value)
      const valid = !Number.isNaN(number) && number <= maxValue
      return {
        valid,
        ...(valid ? {} : { message: `Value must be at most ${maxValue}`, code: 'MAX_VALUE' }),
      }
    },

  /**
   * Range validation
   */
  range:
    (min: number, max: number) =>
    (value: string): ValidationResult => {
      if (!value) return { valid: true } // Allow empty unless required

      const number = Number(value)
      const valid = !Number.isNaN(number) && number >= min && number <= max
      return {
        valid,
        ...(valid
          ? {}
          : { message: `Value must be between ${min} and ${max}`, code: 'OUT_OF_RANGE' }),
      }
    },

  /**
   * Credit card validation (Luhn algorithm)
   */
  creditCard: (value: string): ValidationResult => {
    if (!value) return { valid: true } // Allow empty unless required

    const digits = value.replace(/\D/g, '')

    if (digits.length < 13 || digits.length > 19) {
      return {
        valid: false,
        message: 'Credit card number must be 13-19 digits',
        code: 'INVALID_CREDIT_CARD',
      }
    }

    // Luhn algorithm
    let sum = 0
    let isEven = false

    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = parseInt(digits[i])

      if (isEven) {
        digit *= 2
        if (digit > 9) {
          digit -= 9
        }
      }

      sum += digit
      isEven = !isEven
    }

    const valid = sum % 10 === 0
    return {
      valid,
      ...(valid
        ? {}
        : { message: 'Please enter a valid credit card number', code: 'INVALID_CREDIT_CARD' }),
    }
  },

  /**
   * Social Security Number validation
   */
  ssn: (value: string): ValidationResult => {
    if (!value) return { valid: true } // Allow empty unless required

    const digits = value.replace(/\D/g, '')
    const ssnRegex = /^(?!666|000|9\d{2})\d{3}(?!00)\d{2}(?!0{4})\d{4}$/
    const valid = ssnRegex.test(digits)
    return {
      valid,
      ...(valid
        ? {}
        : { message: 'Please enter a valid Social Security Number', code: 'INVALID_SSN' }),
    }
  },

  /**
   * US ZIP code validation
   */
  zipCode: (value: string): ValidationResult => {
    if (!value) return { valid: true } // Allow empty unless required

    const zipRegex = /^\d{5}(-\d{4})?$/
    const valid = zipRegex.test(value)
    return {
      valid,
      ...(valid ? {} : { message: 'Please enter a valid ZIP code', code: 'INVALID_ZIP' }),
    }
  },

  /**
   * Strong password validation
   */
  strongPassword: (value: string): ValidationResult => {
    if (!value) return { valid: true } // Allow empty unless required

    const hasLowerCase = /[a-z]/.test(value)
    const hasUpperCase = /[A-Z]/.test(value)
    const hasNumbers = /\d/.test(value)
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value)
    const hasMinLength = value.length >= 8

    const issues = []
    if (!hasMinLength) issues.push('at least 8 characters')
    if (!hasLowerCase) issues.push('lowercase letter')
    if (!hasUpperCase) issues.push('uppercase letter')
    if (!hasNumbers) issues.push('number')
    if (!hasSpecialChar) issues.push('special character')

    const valid = issues.length === 0
    return {
      valid,
      ...(valid
        ? {}
        : {
            message: `Password must contain ${issues.join(', ')}`,
            code: 'WEAK_PASSWORD',
          }),
    }
  },

  /**
   * Date validation (YYYY-MM-DD format)
   */
  date: (value: string): ValidationResult => {
    if (!value) return { valid: true } // Allow empty unless required

    const date = new Date(value)
    const valid = !Number.isNaN(date.getTime())
    return {
      valid,
      ...(valid ? {} : { message: 'Please enter a valid date', code: 'INVALID_DATE' }),
    }
  },

  /**
   * Time validation (HH:MM format)
   */
  time: (value: string): ValidationResult => {
    if (!value) return { valid: true } // Allow empty unless required

    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    const valid = timeRegex.test(value)
    return {
      valid,
      ...(valid ? {} : { message: 'Please enter a valid time (HH:MM)', code: 'INVALID_TIME' }),
    }
  },

  /**
   * Composite validator - combines multiple validators with AND logic
   */
  and:
    (...validators: ValidationFunction[]) =>
    (value: string): ValidationResult => {
      for (const validator of validators) {
        const result = validator(value)
        if (!result.valid) {
          return result
        }
      }
      return { valid: true }
    },

  /**
   * Composite validator - combines multiple validators with OR logic
   */
  or:
    (...validators: ValidationFunction[]) =>
    (value: string): ValidationResult => {
      const results = validators.map((validator) => validator(value))
      const hasValid = results.some((result) => result.valid)

      if (hasValid) {
        return { valid: true }
      }

      // Return the first error message
      const firstError = results.find((result) => !result.valid)
      return firstError || { valid: false, message: 'Validation failed', code: 'VALIDATION_FAILED' }
    },

  /**
   * Custom validator factory
   */
  custom: (validateFn: (value: string) => ValidationResult): ValidationFunction => validateFn,
}
