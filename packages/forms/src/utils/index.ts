/**
 * Form Utilities
 *
 * Shared utilities for form handling, formatting, and validation
 */

// `useFormState` and `useFormValidation` used to be exported from here as
// stubs returning `{}`. They shadowed the real form-state engine that lives
// two directories away and gave callers silent no-ops instead of an error
// (#226). Use `createFormState`, `createField` or `createMultiStepFormState`
// from `@tachui/forms` instead — see `src/state/`.

// Formatting utilities
export function formatCreditCard(value: string): string {
  return value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ')
}

export function formatPhoneNumber(value: string): string {
  return value.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3')
}

export function formatSSN(value: string): string {
  return value.replace(/\D/g, '').replace(/(\d{3})(\d{2})(\d{4})/, '$1-$2-$3')
}

export function formatPostalCode(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '')
}

// Date utilities
export function formatDate(date: Date, _format: string = 'yyyy-MM-dd'): string {
  return date.toISOString().split('T')[0]
}

export function parseDate(value: string): Date {
  return new Date(value)
}

export function isValidDate(date: Date): boolean {
  return date instanceof Date && !isNaN(date.getTime())
}

// Type aliases
export type FormatterFunction = (value: string) => string
export type DateFormat = string
