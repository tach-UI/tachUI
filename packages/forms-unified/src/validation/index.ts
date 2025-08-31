/**
 * Validation System
 *
 * Comprehensive validation engine from @tachui/forms with 20+ built-in rules
 */

// TODO: Migrate actual validation system from @tachui/forms
// Placeholder implementation for unified package structure

export interface ValidationRule {
  name: string
  message: string
  validate: (value: any) => boolean | Promise<boolean>
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

export interface ValidationError {
  field: string
  message: string
  code: string
}

export interface ValidationSchema {
  [fieldName: string]: ValidationRule[]
}

// Basic validators (stubs)
export function required(): ValidationRule {
  return {
    name: 'required',
    message: 'This field is required',
    validate: (value: any) => value != null && value !== '',
  }
}

export function email(): ValidationRule {
  return {
    name: 'email',
    message: 'Please enter a valid email address',
    validate: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  }
}

export function minLength(min: number): ValidationRule {
  return {
    name: 'minLength',
    message: `Must be at least ${min} characters`,
    validate: (value: string) => value?.length >= min,
  }
}

export function maxLength(max: number): ValidationRule {
  return {
    name: 'maxLength',
    message: `Must be no more than ${max} characters`,
    validate: (value: string) => value?.length <= max,
  }
}

// Type aliases
export type ValidatorFunction = (value: any) => boolean
export type AsyncValidatorFunction = (value: any) => Promise<boolean>
export type FieldValidation = ValidationRule[]
export type CrossFieldValidation = ValidationRule[]
