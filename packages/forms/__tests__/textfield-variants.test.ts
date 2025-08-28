/**
 * Specialized TextField Variants Tests
 *
 * Tests for specialized field components like EmailField, PhoneField,
 * CreditCardField, etc. with their specific formatting, validation,
 * and accessibility features.
 */

import { describe, expect, it, vi } from 'vitest'
import {
  ColorField,
  CreditCardField,
  DateField,
  EmailField,
  NumberField,
  PasswordField,
  PhoneField,
  PostalCodeField,
  SearchField,
  SSNField,
  TextArea,
  TimeField,
  URLField,
} from '../src/components'
import { TextFieldFormatters, TextFieldParsers } from '../src/utils/formatters'

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
  isSignal: vi.fn(() => false),
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

describe('Specialized TextField Variants', () => {
  describe('EmailField', () => {
    it('creates email field with correct configuration', () => {
      const emailField = EmailField({
        name: 'email',
        label: 'Email Address',
      })

      expect(emailField.type).toBe('component')
      expect(emailField.props.type).toBe('email')
      expect(emailField.props.keyboardType).toBe('email')
      expect(emailField.props.validation.rules).toContain('required')
      expect(emailField.props.validation.rules).toContain('email')
      expect(emailField.props.validation.validateOn).toBe('blur')
      expect(emailField.props.accessibilityRole).toBe('textbox')
      expect(emailField.props.accessibilityLabel).toBe('Email address')
    })

    it('allows custom validation configuration', () => {
      const emailField = EmailField({
        name: 'email',
        validation: {
          rules: ['email'], // Remove required
          validateOn: 'change',
        },
      })

      expect(emailField.props.validation.rules).toEqual(['email'])
      expect(emailField.props.validation.validateOn).toBe('change')
    })

    it('allows custom accessibility label', () => {
      const emailField = EmailField({
        name: 'email',
        accessibilityLabel: 'Work email address',
      })

      expect(emailField.props.accessibilityLabel).toBe('Work email address')
    })
  })

  describe('PasswordField', () => {
    it('creates password field with basic configuration', () => {
      const passwordField = PasswordField({
        name: 'password',
        label: 'Password',
      })

      expect(passwordField.props.type).toBe('password')
      expect(passwordField.props.validation.rules).toContain('required')
      expect(passwordField.props.validation.rules).toContain('minLength')
      expect(passwordField.props.validation.validateOn).toBe('change')
      expect(passwordField.props.accessibilityLabel).toBe('Password')
    })

    it('creates password field with strong validation', () => {
      const passwordField = PasswordField({
        name: 'password',
        strongValidation: true,
      })

      expect(passwordField.props.validation.rules).toContain('required')
      expect(passwordField.props.validation.rules).toContain('strongPassword')
    })

    it('supports strength indicator option', () => {
      const passwordField = PasswordField({
        name: 'password',
        showStrengthIndicator: true,
      })

      // The showStrengthIndicator prop should be consumed and not passed through
      expect(passwordField.props.showStrengthIndicator).toBeUndefined()
    })

    it('allows custom accessibility label', () => {
      const passwordField = PasswordField({
        name: 'password',
        accessibilityLabel: 'Account password',
      })

      expect(passwordField.props.accessibilityLabel).toBe('Account password')
    })
  })

  describe('SearchField', () => {
    it('creates search field with correct configuration', () => {
      const searchField = SearchField({
        name: 'query',
        label: 'Search',
      })

      expect(searchField.props.type).toBe('search')
      expect(searchField.props.keyboardType).toBe('search')
      expect(searchField.props.placeholder).toBe('Search...')
      expect(searchField.props.accessibilityRole).toBe('searchbox')
      expect(searchField.props.accessibilityLabel).toBe('Search')
    })

    it('allows custom placeholder', () => {
      const searchField = SearchField({
        name: 'query',
        placeholder: 'Search products...',
      })

      expect(searchField.props.placeholder).toBe('Search products...')
    })

    it('allows custom accessibility label', () => {
      const searchField = SearchField({
        name: 'query',
        accessibilityLabel: 'Search products',
      })

      expect(searchField.props.accessibilityLabel).toBe('Search products')
    })
  })

  describe('URLField', () => {
    it('creates URL field with correct configuration', () => {
      const urlField = URLField({
        name: 'website',
        label: 'Website',
      })

      expect(urlField.props.type).toBe('url')
      expect(urlField.props.keyboardType).toBe('url')
      expect(urlField.props.validation.rules).toContain('url')
      expect(urlField.props.validation.validateOn).toBe('blur')
      expect(urlField.props.accessibilityLabel).toBe('Website URL')
    })

    it('allows custom validation configuration', () => {
      const urlField = URLField({
        name: 'website',
        validation: {
          rules: ['required', 'url'],
          validateOn: 'change',
        },
      })

      expect(urlField.props.validation.rules).toContain('required')
      expect(urlField.props.validation.rules).toContain('url')
      expect(urlField.props.validation.validateOn).toBe('change')
    })
  })

  describe('PhoneField', () => {
    it('creates phone field with correct configuration', () => {
      const phoneField = PhoneField({
        name: 'phone',
        label: 'Phone Number',
      })

      expect(phoneField.props.type).toBe('tel')
      expect(phoneField.props.keyboardType).toBe('phone')
      expect(phoneField.props.formatter).toBe(TextFieldFormatters.phone)
      expect(phoneField.props.parser).toBe(TextFieldParsers.phone)
      expect(phoneField.props.validation.rules).toContain('phone')
      expect(phoneField.props.validation.validateOn).toBe('blur')
      expect(phoneField.props.accessibilityLabel).toBe('Phone number')
    })

    it('supports format option', () => {
      const phoneField = PhoneField({
        name: 'phone',
        format: 'international',
      })

      // Format option should be consumed and not passed through
      expect(phoneField.props.format).toBeUndefined()
      // But formatting should still be applied
      expect(phoneField.props.formatter).toBe(TextFieldFormatters.phone)
    })

    it('allows custom validation configuration', () => {
      const phoneField = PhoneField({
        name: 'phone',
        validation: {
          rules: ['required', 'phone'],
          validateOn: 'change',
        },
      })

      expect(phoneField.props.validation.rules).toContain('required')
      expect(phoneField.props.validation.rules).toContain('phone')
    })
  })

  describe('NumberField', () => {
    it('creates number field with basic configuration', () => {
      const numberField = NumberField({
        name: 'amount',
        label: 'Amount',
      })

      expect(numberField.props.type).toBe('number')
      expect(numberField.props.keyboardType).toBe('numeric')
      expect(numberField.props.validation.rules).toContain('numeric')
      expect(numberField.props.validation.validateOn).toBe('blur')
      expect(numberField.props.accessibilityLabel).toBe('Number')
    })

    it('creates number field with currency formatting', () => {
      const numberField = NumberField({
        name: 'price',
        currency: true,
      })

      expect(numberField.props.formatter).toBe(TextFieldFormatters.currency)
      expect(numberField.props.parser).toBe(TextFieldParsers.currency)
    })

    it('creates number field with decimal precision', () => {
      const numberField = NumberField({
        name: 'percentage',
        precision: 2,
      })

      // The formatter is a function returned by TextFieldFormatters.decimal(2)
      // We can't compare function references, so we'll test the functionality
      expect(typeof numberField.props.formatter).toBe('function')
      expect(numberField.props.parser).toBe(TextFieldParsers.decimal)

      // Test that the formatter works correctly
      if (numberField.props.formatter) {
        expect(numberField.props.formatter('123.456')).toBe('123.46')
      }
    })

    it('creates number field with min/max validation', () => {
      const numberField = NumberField({
        name: 'rating',
        min: 1,
        max: 5,
      })

      expect(numberField.props.validation.rules).toContain('numeric')
      expect(numberField.props.validation.rules).toContain('min')
      expect(numberField.props.validation.rules).toContain('max')
    })

    it('handles options correctly', () => {
      const numberField = NumberField({
        name: 'amount',
        min: 0,
        max: 1000,
        precision: 2,
        currency: true,
      })

      // Options should be consumed and not passed through
      expect(numberField.props.min).toBeUndefined()
      expect(numberField.props.max).toBeUndefined()
      expect(numberField.props.precision).toBeUndefined()
      expect(numberField.props.currency).toBeUndefined()

      // But configuration should be applied
      expect(numberField.props.formatter).toBe(TextFieldFormatters.currency)
      expect(numberField.props.validation.rules).toContain('min')
      expect(numberField.props.validation.rules).toContain('max')
    })
  })

  describe('CreditCardField', () => {
    it('creates credit card field with correct configuration', () => {
      const ccField = CreditCardField({
        name: 'creditCard',
        label: 'Credit Card Number',
      })

      expect(ccField.props.type).toBe('text')
      expect(ccField.props.keyboardType).toBe('numeric')
      expect(ccField.props.formatter).toBe(TextFieldFormatters.creditCard)
      expect(ccField.props.parser).toBe(TextFieldParsers.creditCard)
      expect(ccField.props.maxLength).toBe(19) // 16 digits + 3 spaces
      expect(ccField.props.validation.rules).toContain('creditCard')
      expect(ccField.props.validation.validateOn).toBe('blur')
      expect(ccField.props.accessibilityLabel).toBe('Credit card number')
    })

    it('allows custom validation configuration', () => {
      const ccField = CreditCardField({
        name: 'creditCard',
        validation: {
          rules: ['required', 'creditCard'],
          validateOn: 'change',
        },
      })

      expect(ccField.props.validation.rules).toContain('required')
      expect(ccField.props.validation.rules).toContain('creditCard')
      expect(ccField.props.validation.validateOn).toBe('change')
    })
  })

  describe('SSNField', () => {
    it('creates SSN field with correct configuration', () => {
      const ssnField = SSNField({
        name: 'ssn',
        label: 'Social Security Number',
      })

      expect(ssnField.props.type).toBe('text')
      expect(ssnField.props.keyboardType).toBe('numeric')
      expect(ssnField.props.formatter).toBe(TextFieldFormatters.ssn)
      expect(ssnField.props.parser).toBe(TextFieldParsers.ssn)
      expect(ssnField.props.maxLength).toBe(11) // 9 digits + 2 hyphens
      expect(ssnField.props.validation.rules).toContain('ssn')
      expect(ssnField.props.validation.validateOn).toBe('blur')
      expect(ssnField.props.accessibilityLabel).toBe('Social Security Number')
    })

    it('allows custom validation configuration', () => {
      const ssnField = SSNField({
        name: 'ssn',
        validation: {
          rules: ['required', 'ssn'],
          validateOn: 'change',
        },
      })

      expect(ssnField.props.validation.rules).toContain('required')
      expect(ssnField.props.validation.validateOn).toBe('change')
    })
  })

  describe('PostalCodeField', () => {
    it('creates postal code field with correct configuration', () => {
      const postalField = PostalCodeField({
        name: 'zipCode',
        label: 'ZIP Code',
      })

      expect(postalField.props.type).toBe('text')
      expect(postalField.props.keyboardType).toBe('numeric')
      expect(postalField.props.formatter).toBe(TextFieldFormatters.postalCode)
      expect(postalField.props.parser).toBe(TextFieldParsers.postalCode)
      expect(postalField.props.maxLength).toBe(10) // 5 or 9 digits + hyphen
      expect(postalField.props.validation.rules).toContain('zipCode')
      expect(postalField.props.validation.validateOn).toBe('blur')
      expect(postalField.props.accessibilityLabel).toBe('Postal code')
    })

    it('allows custom validation configuration', () => {
      const postalField = PostalCodeField({
        name: 'zipCode',
        validation: {
          rules: ['required', 'zipCode'],
          validateOn: 'change',
        },
      })

      expect(postalField.props.validation.rules).toContain('required')
      expect(postalField.props.validation.rules).toContain('zipCode')
    })
  })

  describe('TextArea', () => {
    it('creates text area with multiline configuration', () => {
      const textArea = TextArea({
        name: 'description',
        label: 'Description',
      })

      expect(textArea.props.multiline).toBe(true)
      expect(textArea.props.accessibilityLabel).toBe('Text area')
    })

    it('allows custom accessibility label', () => {
      const textArea = TextArea({
        name: 'comments',
        accessibilityLabel: 'Additional comments',
      })

      expect(textArea.props.accessibilityLabel).toBe('Additional comments')
    })

    it('passes through all TextField props', () => {
      const textArea = TextArea({
        name: 'description',
        rows: 5,
        placeholder: 'Enter description...',
        maxLength: 500,
      })

      expect(textArea.props.rows).toBe(5)
      expect(textArea.props.placeholder).toBe('Enter description...')
      expect(textArea.props.maxLength).toBe(500)
      expect(textArea.props.multiline).toBe(true)
    })
  })

  describe('DateField', () => {
    it('creates date field with correct configuration', () => {
      const dateField = DateField({
        name: 'birthdate',
        label: 'Birth Date',
      })

      expect(dateField.props.type).toBe('date')
      expect(dateField.props.validation.rules).toContain('date')
      expect(dateField.props.validation.validateOn).toBe('blur')
      expect(dateField.props.accessibilityLabel).toBe('Date')
    })

    it('supports min/max date constraints', () => {
      const dateField = DateField({
        name: 'eventDate',
        min: '2023-01-01',
        max: '2023-12-31',
      })

      // Min/max should be consumed and not passed through to TextField
      expect(dateField.props.min).toBeUndefined()
      expect(dateField.props.max).toBeUndefined()
    })

    it('allows custom validation configuration', () => {
      const dateField = DateField({
        name: 'date',
        validation: {
          rules: ['required', 'date'],
          validateOn: 'change',
        },
      })

      expect(dateField.props.validation.rules).toContain('required')
      expect(dateField.props.validation.rules).toContain('date')
      expect(dateField.props.validation.validateOn).toBe('change')
    })
  })

  describe('TimeField', () => {
    it('creates time field with correct configuration', () => {
      const timeField = TimeField({
        name: 'startTime',
        label: 'Start Time',
      })

      expect(timeField.props.type).toBe('time')
      expect(timeField.props.validation.rules).toContain('time')
      expect(timeField.props.validation.validateOn).toBe('blur')
      expect(timeField.props.accessibilityLabel).toBe('Time')
    })

    it('allows custom validation configuration', () => {
      const timeField = TimeField({
        name: 'time',
        validation: {
          rules: ['required', 'time'],
          validateOn: 'change',
        },
      })

      expect(timeField.props.validation.rules).toContain('required')
      expect(timeField.props.validation.rules).toContain('time')
      expect(timeField.props.validation.validateOn).toBe('change')
    })
  })

  describe('ColorField', () => {
    it('creates color field with correct configuration', () => {
      const colorField = ColorField({
        name: 'themeColor',
        label: 'Theme Color',
      })

      expect(colorField.props.type).toBe('color')
      expect(colorField.props.accessibilityLabel).toBe('Color picker')
    })

    it('allows custom accessibility label', () => {
      const colorField = ColorField({
        name: 'backgroundColor',
        accessibilityLabel: 'Background color picker',
      })

      expect(colorField.props.accessibilityLabel).toBe('Background color picker')
    })

    it('passes through all TextField props', () => {
      const colorField = ColorField({
        name: 'color',
        disabled: true,
        required: true,
      })

      expect(colorField.props.type).toBe('color')
      expect(colorField.props.disabled).toBe(true)
      expect(colorField.props.required).toBe(true)
    })
  })

  describe('Common variant behavior', () => {
    it('preserves other TextField props', () => {
      const emailField = EmailField({
        name: 'email',
        label: 'Email',
        placeholder: 'Enter your email',
        disabled: true,
        required: true,
        helperText: 'We will not share your email',
      })

      expect(emailField.props.label).toBe('Email')
      expect(emailField.props.placeholder).toBe('Enter your email')
      expect(emailField.props.disabled).toBe(true)
      expect(emailField.props.required).toBe(true)
      expect(emailField.props.helperText).toBe('We will not share your email')
    })

    it('merges validation rules correctly', () => {
      const phoneField = PhoneField({
        name: 'phone',
        validation: {
          rules: ['required', 'minLength'],
          validateOn: 'change',
          debounceMs: 500,
        },
      })

      // Should merge with default phone validation
      expect(phoneField.props.validation.rules).toEqual(['required', 'minLength'])
      expect(phoneField.props.validation.validateOn).toBe('change')
      expect(phoneField.props.validation.debounceMs).toBe(500)
    })

    it('handles undefined validation gracefully', () => {
      const emailField = EmailField({
        name: 'email',
        validation: undefined,
      })

      expect(emailField.props.validation).toBeDefined()
      expect(emailField.props.validation.rules).toContain('email')
    })
  })

  describe('Accessibility compliance', () => {
    it('provides appropriate roles and labels', () => {
      const fields = [
        { component: EmailField, expectedRole: 'textbox', expectedLabel: 'Email address' },
        { component: SearchField, expectedRole: 'searchbox', expectedLabel: 'Search' },
        { component: PasswordField, expectedRole: undefined, expectedLabel: 'Password' },
        { component: URLField, expectedRole: undefined, expectedLabel: 'Website URL' },
        { component: PhoneField, expectedRole: undefined, expectedLabel: 'Phone number' },
        { component: NumberField, expectedRole: undefined, expectedLabel: 'Number' },
        {
          component: CreditCardField,
          expectedRole: undefined,
          expectedLabel: 'Credit card number',
        },
        { component: SSNField, expectedRole: undefined, expectedLabel: 'Social Security Number' },
        { component: PostalCodeField, expectedRole: undefined, expectedLabel: 'Postal code' },
        { component: TextArea, expectedRole: undefined, expectedLabel: 'Text area' },
        { component: DateField, expectedRole: undefined, expectedLabel: 'Date' },
        { component: TimeField, expectedRole: undefined, expectedLabel: 'Time' },
        { component: ColorField, expectedRole: undefined, expectedLabel: 'Color picker' },
      ]

      fields.forEach(({ component, expectedRole, expectedLabel }) => {
        const field = component({ name: 'test' })

        if (expectedRole) {
          expect(field.props.accessibilityRole).toBe(expectedRole)
        }
        expect(field.props.accessibilityLabel).toBe(expectedLabel)
      })
    })
  })
})
