/**
 * Comprehensive Forms Validation System Tests
 * Adapted from original @tachui/forms package
 */

import { beforeEach, describe, expect, it } from 'vitest'

describe('Forms Validation System - Comprehensive', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  describe('Validation Exports', () => {
    it('should export validation functions', async () => {
      const validation = await import('../src/validation')

      expect(validation.validateValue).toBeDefined()
      expect(validation.validateValueAsync).toBeDefined()
      expect(validation.CrossFieldValidators).toBeDefined()
      expect(validation.ValidationPresets).toBeDefined()
      expect(validation.ValidationUtils).toBeDefined()
    })

    it('should provide validation rules registry', async () => {
      const { getValidationRules } = await import('../src/validation')

      const rules = getValidationRules()
      expect(Array.isArray(rules)).toBe(true)
      expect(rules.length).toBeGreaterThan(0)
    })
  })

  describe('ValidationPresets', () => {
    it('should provide common validation presets', async () => {
      const { ValidationPresets } = await import('../src/validation')

      expect(ValidationPresets.email).toBeDefined()
      expect(ValidationPresets.password).toBeDefined()
      expect(ValidationPresets.url).toBeDefined()
      expect(ValidationPresets.positiveNumber).toBeDefined()
    })
  })

  describe('CrossFieldValidators', () => {
    it('should provide cross-field validation functions', async () => {
      const { CrossFieldValidators } = await import('../src/validation')

      expect(CrossFieldValidators.fieldMatch).toBeDefined()
      expect(CrossFieldValidators.requireOneOf).toBeDefined()
      expect(CrossFieldValidators.requiredWhen).toBeDefined()
      expect(CrossFieldValidators.dateRange).toBeDefined()

      expect(typeof CrossFieldValidators.fieldMatch).toBe('function')
      expect(typeof CrossFieldValidators.requireOneOf).toBe('function')
    })
  })

  describe('ValidationUtils', () => {
    it('should provide utility functions', async () => {
      const { ValidationUtils } = await import('../src/validation')

      expect(ValidationUtils.isValid).toBeDefined()
      expect(ValidationUtils.isError).toBeDefined()
      expect(ValidationUtils.combineResults).toBeDefined()
      expect(ValidationUtils.createValidator).toBeDefined()
    })
  })
})
