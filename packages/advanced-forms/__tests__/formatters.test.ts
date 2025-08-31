/**
 * @vitest-environment jsdom
 */

import { describe, expect, it } from 'vitest'
import { TextFieldFormatters, TextFieldParsers } from '../src/utils/formatters'

describe('TextField Formatters', () => {
  describe('phone formatter', () => {
    it('should format phone numbers correctly', () => {
      expect(TextFieldFormatters.phone('1234567890')).toBe('(123) 456-7890')
      expect(TextFieldFormatters.phone('123')).toBe('123')
      expect(TextFieldFormatters.phone('123456')).toBe('(123) 456')
    })
  })

  describe('credit card formatter', () => {
    it('should format credit card numbers correctly', () => {
      expect(TextFieldFormatters.creditCard('1234567890123456')).toBe(
        '1234 5678 9012 3456'
      )
      expect(TextFieldFormatters.creditCard('1234')).toBe('1234')
    })
  })

  describe('ssn formatter', () => {
    it('should format SSN correctly', () => {
      expect(TextFieldFormatters.ssn('123456789')).toBe('123-45-6789')
      expect(TextFieldFormatters.ssn('123')).toBe('123')
      expect(TextFieldFormatters.ssn('12345')).toBe('123-45')
    })
  })
})

describe('TextField Parsers', () => {
  describe('phone parser', () => {
    it('should parse phone numbers correctly', () => {
      expect(TextFieldParsers.phone('(123) 456-7890')).toBe('1234567890')
      expect(TextFieldParsers.phone('123-456-7890')).toBe('1234567890')
    })
  })

  describe('credit card parser', () => {
    it('should parse credit card numbers correctly', () => {
      expect(TextFieldParsers.creditCard('1234 5678 9012 3456')).toBe(
        '1234567890123456'
      )
      expect(TextFieldParsers.creditCard('1234-5678-9012-3456')).toBe(
        '1234567890123456'
      )
    })
  })

  describe('ssn parser', () => {
    it('should parse SSN correctly', () => {
      expect(TextFieldParsers.ssn('123-45-6789')).toBe('123456789')
      expect(TextFieldParsers.ssn('123 45 6789')).toBe('123456789')
    })
  })
})
