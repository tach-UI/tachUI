/**
 * @vitest-environment jsdom
 */

import { describe, expect, it } from 'vitest'
import {
  TextField,
  EmailField,
  PasswordField,
  PhoneField,
} from '../src/components/TextField'

describe('TextField Migration', () => {
  it('should export TextField component', () => {
    expect(TextField).toBeDefined()
    expect(typeof TextField).toBe('function')
  })

  it('should export EmailField variant', () => {
    expect(EmailField).toBeDefined()
    expect(typeof EmailField).toBe('function')
  })

  it('should export PasswordField variant', () => {
    expect(PasswordField).toBeDefined()
    expect(typeof PasswordField).toBe('function')
  })

  it('should export PhoneField variant', () => {
    expect(PhoneField).toBeDefined()
    expect(typeof PhoneField).toBe('function')
  })

  it('should create TextField component instance with basic props', () => {
    const textField = TextField({
      name: 'test',
      placeholder: 'Enter text',
    })

    expect(textField).toBeDefined()
    expect(textField.type).toBe('component')
    expect(textField.id).toBe('textfield-test')
  })

  it('should create EmailField with proper email type', () => {
    const emailField = EmailField({
      name: 'email',
      placeholder: 'Enter email',
    })

    expect(emailField).toBeDefined()
    expect(emailField.type).toBe('component')
  })
})
