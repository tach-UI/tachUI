/**
 * TextField Formatters
 *
 * Pre-built formatting functions for common input types.
 * Migrated from core TextField to forms plugin.
 */

import type { TextFieldFormatter } from '../types'

/**
 * Common text formatters
 */
export const TextFieldFormatters = {
  /**
   * Phone number formatter (US format)
   */
  phone: (value: string): string => {
    const digits = value.replace(/\D/g, '')
    if (digits.length <= 3) {
      return digits
    } else if (digits.length <= 6) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
    } else {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`
    }
  },

  /**
   * Credit card formatter
   */
  creditCard: (value: string): string => {
    const digits = value.replace(/\D/g, '')
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ')
  },

  /**
   * Currency formatter
   */
  currency: (value: string): string => {
    const number = parseFloat(value.replace(/[^\d.]/g, ''))
    if (Number.isNaN(number)) return ''
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(number)
  },

  /**
   * Uppercase formatter
   */
  uppercase: (value: string): string => value.toUpperCase(),

  /**
   * Lowercase formatter
   */
  lowercase: (value: string): string => value.toLowerCase(),

  /**
   * Title case formatter
   */
  titleCase: (value: string): string => {
    return value.replace(
      /\w\S*/g,
      (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    )
  },

  /**
   * Social Security Number formatter
   */
  ssn: (value: string): string => {
    const digits = value.replace(/\D/g, '')
    if (digits.length <= 3) {
      return digits
    } else if (digits.length <= 5) {
      return `${digits.slice(0, 3)}-${digits.slice(3)}`
    } else {
      return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5, 9)}`
    }
  },

  /**
   * Postal code formatter (US ZIP)
   */
  postalCode: (value: string): string => {
    const digits = value.replace(/\D/g, '')
    if (digits.length <= 5) {
      return digits
    } else {
      return `${digits.slice(0, 5)}-${digits.slice(5, 9)}`
    }
  },

  /**
   * Decimal number formatter
   */
  decimal:
    (places: number = 2) =>
    (value: string): string => {
      const number = parseFloat(value.replace(/[^\d.-]/g, ''))
      if (Number.isNaN(number)) return ''
      return number.toFixed(places)
    },

  /**
   * Percentage formatter
   */
  percentage: (value: string): string => {
    const number = parseFloat(value.replace(/[^\d.-]/g, ''))
    if (Number.isNaN(number)) return ''
    return `${number}%`
  },

  /**
   * Custom formatter factory
   */
  custom: (formatFn: (value: string) => string): TextFieldFormatter => formatFn,
}

/**
 * Common text parsers (reverse of formatters)
 */
export const TextFieldParsers = {
  /**
   * Phone number parser - extracts digits only
   */
  phone: (value: string): string => {
    return value.replace(/\D/g, '')
  },

  /**
   * Credit card parser - extracts digits only
   */
  creditCard: (value: string): string => {
    return value.replace(/\D/g, '')
  },

  /**
   * Currency parser - extracts numeric value
   */
  currency: (value: string): string => {
    const matches = value.match(/[\d.-]+/)
    return matches ? matches[0] : ''
  },

  /**
   * SSN parser - extracts digits only
   */
  ssn: (value: string): string => {
    return value.replace(/\D/g, '')
  },

  /**
   * Postal code parser - extracts digits only
   */
  postalCode: (value: string): string => {
    return value.replace(/\D/g, '')
  },

  /**
   * Decimal parser - extracts number
   */
  decimal: (value: string): string => {
    const matches = value.match(/^-?\d*\.?\d*/)
    return matches ? matches[0] : ''
  },

  /**
   * Percentage parser - extracts number without %
   */
  percentage: (value: string): string => {
    return value.replace(/[^\d.-]/g, '')
  },

  /**
   * No-op parser (returns value unchanged)
   */
  none: (value: string): string => value,

  /**
   * Custom parser factory
   */
  custom: (parseFn: (value: string) => string) => parseFn,
}
