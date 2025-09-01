/**
 * TextField Formatters and Parsers Tests
 * Adapted from original @tachui/forms package
 */

import { describe, expect, it } from 'vitest'

describe('TextField Formatters and Parsers', () => {
  describe('TextFieldFormatters', () => {
    it('should export formatter functions', async () => {
      const { TextFieldFormatters } = await import('../src/utils/formatters')

      expect(TextFieldFormatters).toBeDefined()
      expect(TextFieldFormatters.phone).toBeDefined()
      expect(TextFieldFormatters.creditCard).toBeDefined()
      expect(TextFieldFormatters.currency).toBeDefined()
      expect(TextFieldFormatters.uppercase).toBeDefined()
      expect(TextFieldFormatters.lowercase).toBeDefined()
      expect(TextFieldFormatters.titleCase).toBeDefined()
    })

    it('should format phone numbers correctly', async () => {
      const { TextFieldFormatters } = await import('../src/utils/formatters')

      if (TextFieldFormatters.phone) {
        expect(TextFieldFormatters.phone('1234567890')).toBe('(123) 456-7890')
        expect(TextFieldFormatters.phone('123')).toBe('123')
        expect(TextFieldFormatters.phone('123456')).toBe('(123) 456')
      }
    })

    it('should format credit card numbers correctly', async () => {
      const { TextFieldFormatters } = await import('../src/utils/formatters')

      if (TextFieldFormatters.creditCard) {
        expect(TextFieldFormatters.creditCard('1234567890123456')).toBe(
          '1234 5678 9012 3456'
        )
        expect(TextFieldFormatters.creditCard('1234')).toBe('1234')
        expect(TextFieldFormatters.creditCard('12345678')).toBe('1234 5678')
      }
    })

    it('should format currency correctly', async () => {
      const { TextFieldFormatters } = await import('../src/utils/formatters')

      if (TextFieldFormatters.currency) {
        expect(TextFieldFormatters.currency('123.45')).toBe('$123.45')
        expect(TextFieldFormatters.currency('1000')).toBe('$1,000.00')
        expect(TextFieldFormatters.currency('0.99')).toBe('$0.99')
      }
    })
  })

  describe('TextFieldParsers', () => {
    it('should export parser functions', async () => {
      const { TextFieldParsers } = await import('../src/utils/formatters')

      expect(TextFieldParsers).toBeDefined()
      expect(TextFieldParsers.phone).toBeDefined()
      expect(TextFieldParsers.creditCard).toBeDefined()
      expect(TextFieldParsers.currency).toBeDefined()
    })

    it('should parse phone numbers correctly', async () => {
      const { TextFieldParsers } = await import('../src/utils/formatters')

      if (TextFieldParsers.phone) {
        expect(TextFieldParsers.phone('(123) 456-7890')).toBe('1234567890')
        expect(TextFieldParsers.phone('123-456-7890')).toBe('1234567890')
        expect(TextFieldParsers.phone('abc123def456')).toBe('123456')
      }
    })

    it('should parse credit card numbers correctly', async () => {
      const { TextFieldParsers } = await import('../src/utils/formatters')

      if (TextFieldParsers.creditCard) {
        expect(TextFieldParsers.creditCard('1234 5678 9012 3456')).toBe(
          '1234567890123456'
        )
        expect(TextFieldParsers.creditCard('1234-5678-9012-3456')).toBe(
          '1234567890123456'
        )
      }
    })
  })
})
