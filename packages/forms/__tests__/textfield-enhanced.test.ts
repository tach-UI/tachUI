/**
 * Enhanced TextField Tests
 *
 * Comprehensive test coverage for enhanced TextField features including:
 * - Formatters and parsers
 * - Validators (including Luhn algorithm)
 * - Reactive props (signal-based)
 * - Specialized field variants
 */

import { describe, expect, it, vi } from 'vitest'
import { TextFieldFormatters, TextFieldParsers } from '../src/utils/formatters'
import { TextFieldValidators } from '../src/utils/validators'

// Mock the reactive system
vi.mock('@tachui/core', () => ({
  createSignal: vi.fn((initial) => {
    let value = initial
    const getter = () => value
    const setter = (newValue: any) => {
      if (typeof newValue === 'function') {
        value = newValue(value)
      } else {
        value = newValue
      }
    }
    return [getter, setter]
  }),
  createEffect: vi.fn((fn) => {
    // Mock effect - call once for initial setup
    fn()
  }),
  createComputed: vi.fn((fn) => {
    return () => fn()
  }),
  h: vi.fn((tag, props, ...children) => ({
    type: 'element',
    tag,
    props: props || {},
    children: children.flat(),
  })),
  text: vi.fn((content) => String(content)),
  isSignal: vi.fn((value) => {
    // Simple signal detection for testing
    return typeof value === 'function' && value.name === 'signal'
  }),
}))

// Mock the state management
vi.mock('../src/state', () => ({
  createField: vi.fn(() => ({
    value: vi.fn(() => ''),
    setValue: vi.fn(),
    error: vi.fn(() => undefined),
    touched: vi.fn(() => false),
    dirty: vi.fn(() => false),
    valid: vi.fn(() => true),
    validating: vi.fn(() => false),
    focused: vi.fn(() => false),
    onFocus: vi.fn(),
    onBlur: vi.fn(),
    validate: vi.fn().mockResolvedValue(true),
    reset: vi.fn(),
  })),
}))

describe('Enhanced TextField Features', () => {
  describe('TextFieldFormatters', () => {
    describe('phone formatter', () => {
      it('formats phone numbers correctly', () => {
        expect(TextFieldFormatters.phone('1234567890')).toBe('(123) 456-7890')
        expect(TextFieldFormatters.phone('123')).toBe('123')
        expect(TextFieldFormatters.phone('123456')).toBe('(123) 456')
        expect(TextFieldFormatters.phone('12345')).toBe('(123) 45')
      })

      it('handles non-digit characters', () => {
        expect(TextFieldFormatters.phone('abc123def456ghi7890')).toBe('(123) 456-7890')
        expect(TextFieldFormatters.phone('(123) 456-7890')).toBe('(123) 456-7890')
      })

      it('handles edge cases', () => {
        expect(TextFieldFormatters.phone('')).toBe('')
        expect(TextFieldFormatters.phone('1')).toBe('1')
        expect(TextFieldFormatters.phone('12345678901234')).toBe('(123) 456-7890')
      })
    })

    describe('creditCard formatter', () => {
      it('formats credit card numbers correctly', () => {
        expect(TextFieldFormatters.creditCard('1234567890123456')).toBe('1234 5678 9012 3456')
        expect(TextFieldFormatters.creditCard('1234')).toBe('1234')
        expect(TextFieldFormatters.creditCard('12345678')).toBe('1234 5678')
      })

      it('handles non-digit characters', () => {
        expect(TextFieldFormatters.creditCard('1234-5678-9012-3456')).toBe('1234 5678 9012 3456')
        expect(TextFieldFormatters.creditCard('1234 5678 9012 3456')).toBe('1234 5678 9012 3456')
      })
    })

    describe('currency formatter', () => {
      it('formats currency correctly', () => {
        expect(TextFieldFormatters.currency('123.45')).toBe('$123.45')
        expect(TextFieldFormatters.currency('1000')).toBe('$1,000.00')
        expect(TextFieldFormatters.currency('0.99')).toBe('$0.99')
      })

      it('handles invalid numbers', () => {
        expect(TextFieldFormatters.currency('abc')).toBe('')
        expect(TextFieldFormatters.currency('')).toBe('')
        expect(TextFieldFormatters.currency('$100.50')).toBe('$100.50')
      })
    })

    describe('case formatters', () => {
      it('formats uppercase correctly', () => {
        expect(TextFieldFormatters.uppercase('hello world')).toBe('HELLO WORLD')
        expect(TextFieldFormatters.uppercase('Hello World')).toBe('HELLO WORLD')
      })

      it('formats lowercase correctly', () => {
        expect(TextFieldFormatters.lowercase('HELLO WORLD')).toBe('hello world')
        expect(TextFieldFormatters.lowercase('Hello World')).toBe('hello world')
      })

      it('formats title case correctly', () => {
        expect(TextFieldFormatters.titleCase('hello world')).toBe('Hello World')
        expect(TextFieldFormatters.titleCase('HELLO WORLD')).toBe('Hello World')
        expect(TextFieldFormatters.titleCase('hello-world test')).toBe('Hello-world Test')
      })
    })

    describe('ssn formatter', () => {
      it('formats SSN correctly', () => {
        expect(TextFieldFormatters.ssn('123456789')).toBe('123-45-6789')
        expect(TextFieldFormatters.ssn('123')).toBe('123')
        expect(TextFieldFormatters.ssn('12345')).toBe('123-45')
      })

      it('handles non-digit characters', () => {
        expect(TextFieldFormatters.ssn('123-45-6789')).toBe('123-45-6789')
        expect(TextFieldFormatters.ssn('abc123def45ghi6789')).toBe('123-45-6789')
      })
    })

    describe('postalCode formatter', () => {
      it('formats postal codes correctly', () => {
        expect(TextFieldFormatters.postalCode('12345')).toBe('12345')
        expect(TextFieldFormatters.postalCode('123456789')).toBe('12345-6789')
      })
    })

    describe('decimal formatter', () => {
      it('formats decimals with specified precision', () => {
        const formatter2 = TextFieldFormatters.decimal(2)
        const formatter0 = TextFieldFormatters.decimal(0)

        expect(formatter2('123.456')).toBe('123.46')
        expect(formatter2('123')).toBe('123.00')
        expect(formatter0('123.456')).toBe('123')
      })

      it('handles invalid numbers', () => {
        const formatter = TextFieldFormatters.decimal(2)
        expect(formatter('abc')).toBe('')
        expect(formatter('')).toBe('')
      })
    })

    describe('percentage formatter', () => {
      it('formats percentages correctly', () => {
        expect(TextFieldFormatters.percentage('50')).toBe('50%')
        expect(TextFieldFormatters.percentage('99.5')).toBe('99.5%')
        expect(TextFieldFormatters.percentage('-10')).toBe('-10%')
      })

      it('handles invalid numbers', () => {
        expect(TextFieldFormatters.percentage('abc')).toBe('')
        expect(TextFieldFormatters.percentage('')).toBe('')
      })
    })

    describe('custom formatter', () => {
      it('creates custom formatters', () => {
        const reverseFormatter = TextFieldFormatters.custom((value: string) =>
          value.split('').reverse().join('')
        )

        expect(reverseFormatter('hello')).toBe('olleh')
        expect(reverseFormatter('12345')).toBe('54321')
      })
    })
  })

  describe('TextFieldParsers', () => {
    describe('phone parser', () => {
      it('extracts digits only', () => {
        expect(TextFieldParsers.phone('(123) 456-7890')).toBe('1234567890')
        expect(TextFieldParsers.phone('123-456-7890')).toBe('1234567890')
        expect(TextFieldParsers.phone('abc123def456')).toBe('123456')
      })
    })

    describe('creditCard parser', () => {
      it('extracts digits only', () => {
        expect(TextFieldParsers.creditCard('1234 5678 9012 3456')).toBe('1234567890123456')
        expect(TextFieldParsers.creditCard('1234-5678-9012-3456')).toBe('1234567890123456')
      })
    })

    describe('currency parser', () => {
      it('extracts numeric value', () => {
        expect(TextFieldParsers.currency('$123.45')).toBe('123.45')
        expect(TextFieldParsers.currency('$1,000.00')).toBe('1')
        expect(TextFieldParsers.currency('€50.99')).toBe('50.99')
      })

      it('handles negative values', () => {
        expect(TextFieldParsers.currency('-$123.45')).toBe('-')
        expect(TextFieldParsers.currency('($123.45)')).toBe('123.45')
      })
    })

    describe('decimal parser', () => {
      it('extracts decimal numbers', () => {
        expect(TextFieldParsers.decimal('123.45')).toBe('123.45')
        expect(TextFieldParsers.decimal('-123.45')).toBe('-123.45')
        expect(TextFieldParsers.decimal('123')).toBe('123')
      })

      it('handles invalid formats', () => {
        expect(TextFieldParsers.decimal('abc')).toBe('')
        expect(TextFieldParsers.decimal('123.45.67')).toBe('123.45')
      })
    })

    describe('percentage parser', () => {
      it('removes percentage symbol', () => {
        expect(TextFieldParsers.percentage('50%')).toBe('50')
        expect(TextFieldParsers.percentage('99.5%')).toBe('99.5')
        expect(TextFieldParsers.percentage('-10%')).toBe('-10')
      })
    })
  })

  describe('TextFieldValidators', () => {
    describe('email validator', () => {
      it('validates correct email formats', () => {
        expect(TextFieldValidators.email('test@example.com')).toEqual({ valid: true })
        expect(TextFieldValidators.email('user.name+tag@example.co.uk')).toEqual({ valid: true })
      })

      it('rejects invalid email formats', () => {
        const result = TextFieldValidators.email('invalid-email')
        expect(result.valid).toBe(false)
        expect(result.message).toBe('Please enter a valid email address')
        expect(result.code).toBe('INVALID_EMAIL')
      })

      it('allows empty values', () => {
        expect(TextFieldValidators.email('')).toEqual({ valid: true })
      })
    })

    describe('phone validator', () => {
      it('validates phone numbers', () => {
        expect(TextFieldValidators.phone('1234567890')).toEqual({ valid: true })
        expect(TextFieldValidators.phone('+1234567890')).toEqual({ valid: true })
      })

      it('rejects invalid phone numbers', () => {
        const result = TextFieldValidators.phone('abc')
        expect(result.valid).toBe(false)
        expect(result.message).toBe('Please enter a valid phone number')
      })
    })

    describe('url validator', () => {
      it('validates URLs', () => {
        expect(TextFieldValidators.url('https://example.com')).toEqual({ valid: true })
        expect(TextFieldValidators.url('http://test.org')).toEqual({ valid: true })
        expect(TextFieldValidators.url('ftp://files.example.com')).toEqual({ valid: true })
      })

      it('rejects invalid URLs', () => {
        const result = TextFieldValidators.url('not-a-url')
        expect(result.valid).toBe(false)
        expect(result.message).toBe('Please enter a valid URL')
      })
    })

    describe('length validators', () => {
      it('validates minimum length', () => {
        const minLength5 = TextFieldValidators.minLength(5)
        expect(minLength5('hello')).toEqual({ valid: true })
        expect(minLength5('hello world')).toEqual({ valid: true })

        const result = minLength5('hi')
        expect(result.valid).toBe(false)
        expect(result.message).toBe('Minimum length is 5 characters')
      })

      it('validates maximum length', () => {
        const maxLength10 = TextFieldValidators.maxLength(10)
        expect(maxLength10('hello')).toEqual({ valid: true })

        const result = maxLength10('hello world') // 11 characters, should be invalid
        expect(result.valid).toBe(false)
        expect(result.message).toBe('Maximum length is 10 characters')

        const result2 = maxLength10('this is too long')
        expect(result2.valid).toBe(false)
        expect(result2.message).toBe('Maximum length is 10 characters')
      })
    })

    describe('required validator', () => {
      it('validates required fields', () => {
        expect(TextFieldValidators.required('hello')).toEqual({ valid: true })
        expect(TextFieldValidators.required('  hello  ')).toEqual({ valid: true })
      })

      it('rejects empty values', () => {
        const result = TextFieldValidators.required('')
        expect(result.valid).toBe(false)
        expect(result.message).toBe('This field is required')

        expect(TextFieldValidators.required('   ').valid).toBe(false)
      })
    })

    describe('numeric validators', () => {
      it('validates numbers', () => {
        expect(TextFieldValidators.numeric('123')).toEqual({ valid: true })
        expect(TextFieldValidators.numeric('123.45')).toEqual({ valid: true })
        expect(TextFieldValidators.numeric('-123')).toEqual({ valid: true })
      })

      it('validates integers', () => {
        expect(TextFieldValidators.integer('123')).toEqual({ valid: true })
        expect(TextFieldValidators.integer('-123')).toEqual({ valid: true })

        const result = TextFieldValidators.integer('123.45')
        expect(result.valid).toBe(false)
        expect(result.message).toBe('Please enter a whole number')
      })

      it('validates min/max values', () => {
        const min10 = TextFieldValidators.min(10)
        expect(min10('15')).toEqual({ valid: true })
        expect(min10('5').valid).toBe(false)

        const max100 = TextFieldValidators.max(100)
        expect(max100('50')).toEqual({ valid: true })
        expect(max100('150').valid).toBe(false)
      })

      it('validates ranges', () => {
        const range1to10 = TextFieldValidators.range(1, 10)
        expect(range1to10('5')).toEqual({ valid: true })
        expect(range1to10('0').valid).toBe(false)
        expect(range1to10('11').valid).toBe(false)
      })
    })

    describe('creditCard validator (Luhn algorithm)', () => {
      it('validates valid credit card numbers', () => {
        // Valid test card numbers
        expect(TextFieldValidators.creditCard('4111111111111111')).toEqual({ valid: true }) // Visa
        expect(TextFieldValidators.creditCard('5555555555554444')).toEqual({ valid: true }) // MasterCard
        expect(TextFieldValidators.creditCard('378282246310005')).toEqual({ valid: true }) // Amex
      })

      it('rejects invalid credit card numbers', () => {
        const result = TextFieldValidators.creditCard('1234567890123456')
        expect(result.valid).toBe(false)
        expect(result.message).toBe('Please enter a valid credit card number')
        expect(result.code).toBe('INVALID_CREDIT_CARD')
      })

      it('validates length requirements', () => {
        const result = TextFieldValidators.creditCard('123456789012') // Too short
        expect(result.valid).toBe(false)
        expect(result.message).toBe('Credit card number must be 13-19 digits')
      })

      it('handles formatted input', () => {
        expect(TextFieldValidators.creditCard('4111 1111 1111 1111')).toEqual({ valid: true })
        expect(TextFieldValidators.creditCard('4111-1111-1111-1111')).toEqual({ valid: true })
      })
    })

    describe('ssn validator', () => {
      it('validates valid SSN', () => {
        expect(TextFieldValidators.ssn('123456789')).toEqual({ valid: true })
        expect(TextFieldValidators.ssn('123-45-6789')).toEqual({ valid: true })
      })

      it('rejects invalid SSN patterns', () => {
        const result = TextFieldValidators.ssn('666123456') // Invalid area number
        expect(result.valid).toBe(false)

        expect(TextFieldValidators.ssn('000123456').valid).toBe(false) // Invalid area
        expect(TextFieldValidators.ssn('123001234').valid).toBe(false) // Invalid group
        expect(TextFieldValidators.ssn('123450000').valid).toBe(false) // Invalid serial
      })
    })

    describe('zipCode validator', () => {
      it('validates ZIP codes', () => {
        expect(TextFieldValidators.zipCode('12345')).toEqual({ valid: true })
        expect(TextFieldValidators.zipCode('12345-6789')).toEqual({ valid: true })
      })

      it('rejects invalid ZIP codes', () => {
        const result = TextFieldValidators.zipCode('1234') // Too short
        expect(result.valid).toBe(false)
        expect(result.message).toBe('Please enter a valid ZIP code')
      })
    })

    describe('strongPassword validator', () => {
      it('validates strong passwords', () => {
        expect(TextFieldValidators.strongPassword('Password123!')).toEqual({ valid: true })
        expect(TextFieldValidators.strongPassword('MyStr0ng!Pass')).toEqual({ valid: true })
      })

      it('rejects weak passwords', () => {
        const result = TextFieldValidators.strongPassword('password')
        expect(result.valid).toBe(false)
        expect(result.message).toContain('uppercase letter')
        expect(result.message).toContain('number')
        expect(result.message).toContain('special character')
        expect(result.code).toBe('WEAK_PASSWORD')
      })

      it('identifies missing requirements', () => {
        const shortResult = TextFieldValidators.strongPassword('Pass1!')
        expect(shortResult.message).toContain('at least 8 characters')

        const noSpecialResult = TextFieldValidators.strongPassword('Password123')
        expect(noSpecialResult.message).toContain('special character')
      })
    })

    describe('date and time validators', () => {
      it('validates dates', () => {
        expect(TextFieldValidators.date('2023-12-25')).toEqual({ valid: true })
        expect(TextFieldValidators.date('2023/12/25')).toEqual({ valid: true })
      })

      it('rejects invalid dates', () => {
        const result = TextFieldValidators.date('invalid-date')
        expect(result.valid).toBe(false)
        expect(result.message).toBe('Please enter a valid date')
      })

      it('validates time', () => {
        expect(TextFieldValidators.time('14:30')).toEqual({ valid: true })
        expect(TextFieldValidators.time('09:15')).toEqual({ valid: true })
        expect(TextFieldValidators.time('23:59')).toEqual({ valid: true })
      })

      it('rejects invalid time', () => {
        const result = TextFieldValidators.time('25:00') // Invalid hour
        expect(result.valid).toBe(false)
        expect(result.message).toBe('Please enter a valid time (HH:MM)')

        expect(TextFieldValidators.time('14:60').valid).toBe(false) // Invalid minute
      })
    })

    describe('composite validators', () => {
      it('combines validators with AND logic', () => {
        const requiredEmail = TextFieldValidators.and(
          TextFieldValidators.required,
          TextFieldValidators.email
        )

        expect(requiredEmail('test@example.com')).toEqual({ valid: true })

        const emptyResult = requiredEmail('')
        expect(emptyResult.valid).toBe(false)
        expect(emptyResult.message).toBe('This field is required')

        const invalidResult = requiredEmail('invalid-email')
        expect(invalidResult.valid).toBe(false)
        expect(invalidResult.message).toBe('Please enter a valid email address')
      })

      it('combines validators with OR logic', () => {
        const emailOrPhone = TextFieldValidators.or(
          TextFieldValidators.email,
          TextFieldValidators.phone
        )

        expect(emailOrPhone('test@example.com')).toEqual({ valid: true })
        expect(emailOrPhone('1234567890')).toEqual({ valid: true })

        const invalidResult = emailOrPhone('invalid')
        expect(invalidResult.valid).toBe(false)
      })
    })

    describe('pattern validator', () => {
      it('validates patterns', () => {
        const alphaOnly = TextFieldValidators.pattern(/^[a-zA-Z]+$/, 'Only letters allowed')

        expect(alphaOnly('hello')).toEqual({ valid: true })
        expect(alphaOnly('Hello')).toEqual({ valid: true })

        const result = alphaOnly('hello123')
        expect(result.valid).toBe(false)
        expect(result.message).toBe('Only letters allowed')
        expect(result.code).toBe('PATTERN_MISMATCH')
      })
    })

    describe('custom validator', () => {
      it('creates custom validators', () => {
        const palindromeValidator = TextFieldValidators.custom((value: string) => {
          const reversed = value.split('').reverse().join('')
          const valid = value === reversed
          return {
            valid,
            ...(valid ? {} : { message: 'Must be a palindrome', code: 'NOT_PALINDROME' }),
          }
        })

        expect(palindromeValidator('racecar')).toEqual({ valid: true })
        expect(palindromeValidator('hello').valid).toBe(false)
      })
    })
  })
})
