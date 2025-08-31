/**
 * @vitest-environment jsdom
 */

import { describe, expect, it } from 'vitest'
import * as AdvancedForms from '../src/index'

describe('Advanced Forms Exports', () => {
  it('should export TextField components', () => {
    expect(AdvancedForms.TextField).toBeDefined()
    expect(AdvancedForms.EmailField).toBeDefined()
    expect(AdvancedForms.PasswordField).toBeDefined()
    expect(AdvancedForms.PhoneField).toBeDefined()
    expect(AdvancedForms.NumberField).toBeDefined()
  })

  it('should export state management functions', () => {
    expect(AdvancedForms.createFormState).toBeDefined()
    expect(AdvancedForms.createField).toBeDefined()
    expect(AdvancedForms.createMultiStepFormState).toBeDefined()
  })

  it('should export formatters and parsers', () => {
    expect(AdvancedForms.TextFieldFormatters).toBeDefined()
    expect(AdvancedForms.TextFieldParsers).toBeDefined()
    expect(AdvancedForms.TextFieldFormatters.phone).toBeDefined()
    expect(AdvancedForms.TextFieldParsers.phone).toBeDefined()
  })

  it('should export validation functions', () => {
    expect(AdvancedForms.validateValue).toBeDefined()
    expect(AdvancedForms.validateValueAsync).toBeDefined()
    expect(AdvancedForms.ValidationUtils).toBeDefined()
    expect(AdvancedForms.VALIDATION_RULES).toBeDefined()
  })

  it('should export existing advanced components', () => {
    expect(AdvancedForms.DatePicker).toBeDefined()
    expect(AdvancedForms.Stepper).toBeDefined()
    expect(AdvancedForms.Slider).toBeDefined()
  })

  it('should export plugin metadata', () => {
    expect(AdvancedForms.PLUGIN_NAME).toBe('@tachui/advanced-forms')
    expect(AdvancedForms.COMPONENTS).toBeDefined()
    expect(AdvancedForms.COMPONENTS.TextField).toBe('TextField')
  })
})
