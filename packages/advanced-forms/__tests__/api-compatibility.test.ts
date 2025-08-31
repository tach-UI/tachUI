/**
 * @vitest-environment jsdom
 */

import { describe, expect, it } from 'vitest'
import { TextField, EmailField, PhoneField } from '../src/index'
import { TextFieldFormatters } from '../src/utils/formatters'

describe('TextField API Compatibility', () => {
  it('should maintain the same TextField API', () => {
    const textField = TextField({
      name: 'username',
      label: 'Username',
      placeholder: 'Enter username',
      required: true,
      validation: {
        rules: ['required', { name: 'minLength', options: { minLength: 3 } }],
        validateOn: 'blur',
      },
      onChange: (name, value) => {
        expect(name).toBe('username')
        expect(typeof value).toBe('string')
      },
      onBlur: (name, value) => {
        expect(name).toBe('username')
      },
      onFocus: (name, value) => {
        expect(name).toBe('username')
      },
    })

    expect(textField).toBeDefined()
    expect(textField.type).toBe('component')
    expect(textField.props).toBeDefined()
  })

  it('should support enhanced TextField features', () => {
    const enhancedTextField = TextField({
      name: 'phone',
      type: 'tel',
      keyboardType: 'phone',
      formatter: TextFieldFormatters.phone,
      autoCapitalize: 'none',
      accessibilityLabel: 'Phone number input',
      font: {
        family: 'monospace',
        size: 16,
        weight: '500',
      },
      validateOnChange: true,
      validateOnBlur: true,
    })

    expect(enhancedTextField).toBeDefined()
    expect(enhancedTextField.type).toBe('component')
  })

  it('should support reactive props (signals)', () => {
    // Mock signals for testing
    const textSignal = () => 'Dynamic text'
    const placeholderSignal = () => 'Dynamic placeholder'
    const disabledSignal = () => false

    const reactiveTextField = TextField({
      name: 'reactive',
      text: textSignal,
      placeholderSignal,
      disabledSignal,
    })

    expect(reactiveTextField).toBeDefined()
    expect(reactiveTextField.type).toBe('component')
  })

  it('should create EmailField with proper validation', () => {
    const emailField = EmailField({
      name: 'email',
      placeholder: 'Enter email address',
      validation: {
        rules: ['required', 'email'],
        validateOn: 'blur',
      },
    })

    expect(emailField).toBeDefined()
    expect(emailField.type).toBe('component')
  })

  it('should create PhoneField with formatting', () => {
    const phoneField = PhoneField({
      name: 'phone',
      placeholder: 'Enter phone number',
      format: 'us',
    })

    expect(phoneField).toBeDefined()
    expect(phoneField.type).toBe('component')
  })
})
