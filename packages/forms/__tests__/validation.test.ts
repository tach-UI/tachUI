/**
 * Forms Validation System Tests
 */

import { beforeEach, describe, expect, it } from 'vitest'
import type { CustomValidationRule, ValidationRule } from '../src/types'
import {
  CrossFieldValidators,
  defaultMessageFormatter,
  getValidationRules,
  registerValidationRule,
  unregisterValidationRule,
  ValidationPresets,
  ValidationUtils,
  validateValue,
  validateValueAsync,
} from '../src/validation'

describe('Forms Validation System', () => {
  beforeEach(() => {
    // Clear any custom rules registered in previous tests
    const customRules = getValidationRules().filter(
      (rule) =>
        ![
          'required',
          'email',
          'url',
          'number',
          'integer',
          'min',
          'max',
          'minLength',
          'maxLength',
          'pattern',
        ].includes(rule)
    )
    customRules.forEach((rule) => unregisterValidationRule(rule))
  })

  describe('Built-in Validation Rules', () => {
    it('validates required fields', () => {
      expect(validateValue('', ['required'])).toEqual({
        valid: false,
        message: 'This field is required',
        code: 'REQUIRED',
      })

      expect(validateValue('value', ['required'])).toEqual({
        valid: true,
      })

      expect(validateValue(null, ['required'])).toEqual({
        valid: false,
        message: 'This field is required',
        code: 'REQUIRED',
      })

      expect(validateValue(undefined, ['required'])).toEqual({
        valid: false,
        message: 'This field is required',
        code: 'REQUIRED',
      })
    })

    it('validates email addresses', () => {
      expect(validateValue('', ['email'])).toEqual({
        valid: true, // Empty is valid for non-required fields
      })

      expect(validateValue('test@example.com', ['email'])).toEqual({
        valid: true,
      })

      expect(validateValue('invalid-email', ['email'])).toEqual({
        valid: false,
        message: 'Please enter a valid email address',
        code: 'INVALID_EMAIL',
      })

      expect(validateValue('test@', ['email'])).toEqual({
        valid: false,
        message: 'Please enter a valid email address',
        code: 'INVALID_EMAIL',
      })
    })

    it('validates URLs', () => {
      expect(validateValue('', ['url'])).toEqual({
        valid: true,
      })

      expect(validateValue('https://example.com', ['url'])).toEqual({
        valid: true,
      })

      expect(validateValue('http://localhost:3000', ['url'])).toEqual({
        valid: true,
      })

      expect(validateValue('invalid-url', ['url'])).toEqual({
        valid: false,
        message: 'Please enter a valid URL',
        code: 'INVALID_URL',
      })
    })

    it('validates numbers', () => {
      expect(validateValue('', ['number'])).toEqual({
        valid: true,
      })

      expect(validateValue('42', ['number'])).toEqual({
        valid: true,
      })

      expect(validateValue('42.5', ['number'])).toEqual({
        valid: true,
      })

      expect(validateValue('-42', ['number'])).toEqual({
        valid: true,
      })

      expect(validateValue('not-a-number', ['number'])).toEqual({
        valid: false,
        message: 'Please enter a valid number',
        code: 'INVALID_NUMBER',
      })

      expect(validateValue('Infinity', ['number'])).toEqual({
        valid: false,
        message: 'Please enter a valid number',
        code: 'INVALID_NUMBER',
      })
    })

    it('validates integers', () => {
      expect(validateValue('', ['integer'])).toEqual({
        valid: true,
      })

      expect(validateValue('42', ['integer'])).toEqual({
        valid: true,
      })

      expect(validateValue('-42', ['integer'])).toEqual({
        valid: true,
      })

      expect(validateValue('42.5', ['integer'])).toEqual({
        valid: false,
        message: 'Please enter a valid integer',
        code: 'INVALID_INTEGER',
      })

      expect(validateValue('not-a-number', ['integer'])).toEqual({
        valid: false,
        message: 'Please enter a valid integer',
        code: 'INVALID_INTEGER',
      })
    })

    it('validates minimum values', () => {
      expect(validateValue('', ['min'], { min: { min: 10 } })).toEqual({
        valid: true,
      })

      expect(validateValue('15', ['min'], { min: { min: 10 } })).toEqual({
        valid: true,
      })

      expect(validateValue('10', ['min'], { min: { min: 10 } })).toEqual({
        valid: true,
      })

      expect(validateValue('5', ['min'], { min: { min: 10 } })).toEqual({
        valid: false,
        message: 'Value must be at least 10',
        code: 'MIN_VALUE',
      })
    })

    it('validates maximum values', () => {
      expect(validateValue('', ['max'], { max: { max: 100 } })).toEqual({
        valid: true,
      })

      expect(validateValue('50', ['max'], { max: { max: 100 } })).toEqual({
        valid: true,
      })

      expect(validateValue('100', ['max'], { max: { max: 100 } })).toEqual({
        valid: true,
      })

      expect(validateValue('150', ['max'], { max: { max: 100 } })).toEqual({
        valid: false,
        message: 'Value must be at most 100',
        code: 'MAX_VALUE',
      })
    })

    it('validates minimum length', () => {
      expect(validateValue('', ['minLength'], { minLength: { minLength: 3 } })).toEqual({
        valid: true,
      })

      expect(validateValue('abc', ['minLength'], { minLength: { minLength: 3 } })).toEqual({
        valid: true,
      })

      expect(validateValue('abcd', ['minLength'], { minLength: { minLength: 3 } })).toEqual({
        valid: true,
      })

      expect(validateValue('ab', ['minLength'], { minLength: { minLength: 3 } })).toEqual({
        valid: false,
        message: 'Must be at least 3 characters',
        code: 'MIN_LENGTH',
      })
    })

    it('validates maximum length', () => {
      expect(validateValue('', ['maxLength'], { maxLength: { maxLength: 5 } })).toEqual({
        valid: true,
      })

      expect(validateValue('abc', ['maxLength'], { maxLength: { maxLength: 5 } })).toEqual({
        valid: true,
      })

      expect(validateValue('abcde', ['maxLength'], { maxLength: { maxLength: 5 } })).toEqual({
        valid: true,
      })

      expect(validateValue('abcdef', ['maxLength'], { maxLength: { maxLength: 5 } })).toEqual({
        valid: false,
        message: 'Must be at most 5 characters',
        code: 'MAX_LENGTH',
      })
    })

    it('validates patterns', () => {
      const phonePattern = /^\d{3}-\d{3}-\d{4}$/

      expect(validateValue('', ['pattern'], { pattern: { pattern: phonePattern } })).toEqual({
        valid: true,
      })

      expect(
        validateValue('123-456-7890', ['pattern'], { pattern: { pattern: phonePattern } })
      ).toEqual({
        valid: true,
      })

      expect(
        validateValue('123-456-789', ['pattern'], { pattern: { pattern: phonePattern } })
      ).toEqual({
        valid: false,
        message: 'Value does not match required pattern',
        code: 'PATTERN_MISMATCH',
      })

      // Test with custom message
      expect(
        validateValue('invalid', ['pattern'], {
          pattern: { pattern: phonePattern, message: 'Please enter a valid phone number' },
        })
      ).toEqual({
        valid: false,
        message: 'Please enter a valid phone number',
        code: 'PATTERN_MISMATCH',
      })
    })
  })

  describe('Custom Validation Rules', () => {
    it('registers and uses custom validation rules', () => {
      const customRule: CustomValidationRule = {
        name: 'customTest',
        validate: (value) => ({
          valid: value === 'test',
          message: 'Value must be "test"',
          code: 'CUSTOM_TEST',
        }),
      }

      registerValidationRule(customRule)

      expect(getValidationRules()).toContain('customTest')

      expect(validateValue('test', ['customTest'])).toEqual({
        valid: true,
      })

      expect(validateValue('invalid', ['customTest'])).toEqual({
        valid: false,
        message: 'Value must be "test"',
        code: 'CUSTOM_TEST',
      })

      unregisterValidationRule('customTest')
      expect(getValidationRules()).not.toContain('customTest')
    })

    it('handles custom rule objects', () => {
      const customRule: CustomValidationRule = {
        name: 'inline',
        validate: (value) => ({
          valid: value.length > 0,
          message: 'Cannot be empty',
        }),
      }

      const result = validateValue('', [customRule])
      expect(result).toEqual({
        valid: false,
        message: 'Cannot be empty',
      })

      const validResult = validateValue('test', [customRule])
      expect(validResult).toEqual({
        valid: true,
      })
    })
  })

  describe('Multiple Validation Rules', () => {
    it('validates multiple rules and returns first error', () => {
      const result = validateValue('', ['required', 'email'])
      expect(result).toEqual({
        valid: false,
        message: 'This field is required',
        code: 'REQUIRED',
      })
    })

    it('validates all rules when all pass', () => {
      const result = validateValue('test@example.com', ['required', 'email'])
      expect(result).toEqual({
        valid: true,
      })
    })

    it('validates complex rule combinations', () => {
      const rules: ValidationRule[] = ['required', 'minLength', 'pattern']
      const options = {
        minLength: { minLength: 8 },
        pattern: {
          pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
          message: 'Must contain uppercase, lowercase, and number',
        },
      }

      expect(validateValue('', rules, options)).toEqual({
        valid: false,
        message: 'This field is required',
        code: 'REQUIRED',
      })

      expect(validateValue('short', rules, options)).toEqual({
        valid: false,
        message: 'Must be at least 8 characters',
        code: 'MIN_LENGTH',
      })

      expect(validateValue('longbutnocaps', rules, options)).toEqual({
        valid: false,
        message: 'Must contain uppercase, lowercase, and number',
        code: 'PATTERN_MISMATCH',
      })

      expect(validateValue('ValidPass123', rules, options)).toEqual({
        valid: true,
      })
    })
  })

  describe('Async Validation', () => {
    it('handles async validation rules', async () => {
      const asyncRule: CustomValidationRule = {
        name: 'asyncTest',
        validate: async (value) => {
          return new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                valid: value === 'async',
                message: 'Must be async',
                code: 'ASYNC_TEST',
              })
            }, 10)
          })
        },
      }

      registerValidationRule(asyncRule)

      const result = await validateValueAsync('async', ['asyncTest'])
      expect(result).toEqual({ valid: true })

      const errorResult = await validateValueAsync('sync', ['asyncTest'])
      expect(errorResult).toEqual({
        valid: false,
        message: 'Must be async',
        code: 'ASYNC_TEST',
      })

      unregisterValidationRule('asyncTest')
    })

    it('handles mixed sync and async validation', async () => {
      const result = await validateValueAsync('', ['required', 'email'])
      expect(result).toEqual({
        valid: false,
        message: 'This field is required',
        code: 'REQUIRED',
      })

      const validResult = await validateValueAsync('test@example.com', ['required', 'email'])
      expect(validResult).toEqual({ valid: true })
    })
  })

  describe('Validation Presets', () => {
    it('provides common validation presets', () => {
      expect(ValidationPresets.email).toEqual(['required', 'email'])
      expect(ValidationPresets.password).toEqual([
        'required',
        { name: 'minLength', options: { minLength: 8 } },
      ])
      expect(ValidationPresets.url).toEqual(['required', 'url'])
      expect(ValidationPresets.positiveNumber).toEqual([
        'required',
        'number',
        { name: 'min', options: { min: 0 } },
      ])
    })

    it('uses validation presets', () => {
      const emailResult = validateValue('invalid', ValidationPresets.email)
      expect(emailResult.valid).toBe(false)

      const validEmailResult = validateValue('test@example.com', ValidationPresets.email)
      expect(validEmailResult.valid).toBe(true)
    })
  })

  describe('Cross-Field Validators', () => {
    it('validates field matching', () => {
      const validator = CrossFieldValidators.fieldMatch('password', 'confirmPassword')

      const values = { password: 'test123', confirmPassword: 'test123' }
      expect(validator(values)).toEqual({ valid: true })

      const invalidValues = { password: 'test123', confirmPassword: 'different' }
      expect(validator(invalidValues)).toEqual({
        valid: false,
        message: 'Fields must match',
        code: 'FIELD_MISMATCH',
      })
    })

    it('validates require one of', () => {
      const validator = CrossFieldValidators.requireOneOf(['phone', 'email'])

      expect(validator({ phone: '123-456-7890', email: '' })).toEqual({ valid: true })
      expect(validator({ phone: '', email: 'test@example.com' })).toEqual({ valid: true })
      expect(validator({ phone: '', email: '' })).toEqual({
        valid: false,
        message: 'At least one field is required',
        code: 'REQUIRE_ONE_OF',
      })
    })

    it('validates conditional requirements', () => {
      const validator = CrossFieldValidators.requiredWhen('state', 'country', 'US')

      expect(validator({ country: 'CA', state: '' })).toEqual({ valid: true })
      expect(validator({ country: 'US', state: 'CA' })).toEqual({ valid: true })
      expect(validator({ country: 'US', state: '' })).toEqual({
        valid: false,
        message: 'state is required',
        code: 'REQUIRED_WHEN',
      })
    })

    it('validates date ranges', () => {
      const validator = CrossFieldValidators.dateRange('startDate', 'endDate')

      expect(
        validator({
          startDate: '2023-01-01',
          endDate: '2023-01-02',
        })
      ).toEqual({ valid: true })

      expect(
        validator({
          startDate: '2023-01-02',
          endDate: '2023-01-01',
        })
      ).toEqual({
        valid: false,
        message: 'End date must be after start date',
        code: 'INVALID_DATE_RANGE',
      })
    })
  })

  describe('Validation Utilities', () => {
    it('checks validation results', () => {
      const validResult = { valid: true }
      const errorResult = { valid: false, message: 'Error' }

      expect(ValidationUtils.isValid(validResult)).toBe(true)
      expect(ValidationUtils.isError(validResult)).toBe(false)
      expect(ValidationUtils.isValid(errorResult)).toBe(false)
      expect(ValidationUtils.isError(errorResult)).toBe(true)
    })

    it('combines validation results', () => {
      const results = [
        { valid: true },
        { valid: false, message: 'Error 1' },
        { valid: false, message: 'Error 2' },
      ]

      const combined = ValidationUtils.combineResults(results)
      expect(combined).toEqual({
        valid: false,
        message: 'Error 1, Error 2',
        code: 'MULTIPLE_ERRORS',
      })

      const allValid = [{ valid: true }, { valid: true }]
      const validCombined = ValidationUtils.combineResults(allValid)
      expect(validCombined).toEqual({ valid: true })
    })

    it('creates validator functions', () => {
      const validator = ValidationUtils.createValidator(['required', 'email'])

      expect(validator('')).toEqual({
        valid: false,
        message: 'This field is required',
        code: 'REQUIRED',
      })

      expect(validator('test@example.com')).toEqual({ valid: true })
    })
  })

  describe('Message Formatting', () => {
    it('formats validation messages', () => {
      const result = { valid: false, message: 'Default message', code: 'TEST_CODE' }

      expect(defaultMessageFormatter.format(result)).toBe('Default message')
      expect(defaultMessageFormatter.format(result, 'fieldName')).toBe('Default message')

      defaultMessageFormatter.setMessage('TEST_CODE', `Custom message for \${field}`)
      expect(defaultMessageFormatter.format(result, 'email')).toBe('Custom message for email')
    })

    it('handles missing codes gracefully', () => {
      const result = { valid: false, message: 'Fallback message' }
      expect(defaultMessageFormatter.format(result)).toBe('Fallback message')
    })
  })
})
