/**
 * Comprehensive Form State Management Tests
 * Adapted from original @tachui/forms package
 */

import { describe, expect, it, vi } from 'vitest'

describe('Form State Management - Comprehensive', () => {
  describe('createField function', () => {
    it('should create field with proper interface', async () => {
      const { createField } = await import('../src/state')

      const field = createField({
        name: 'username',
        initialValue: 'initial',
        validationRules: [],
      })

      expect(field).toBeDefined()
      expect(field.value).toBeDefined()
      expect(field.error).toBeDefined()
      expect(typeof field.value).toBe('function')
      expect(typeof field.error).toBe('function')
    })

    it('should handle field validation configuration', async () => {
      const { createField } = await import('../src/state')

      const field = createField({
        name: 'email',
        initialValue: 'test@example.com',
        validationRules: [{ type: 'required', message: 'Email is required' }],
      })

      expect(field).toBeDefined()
      expect(field.value).toBeDefined()
      expect(field.error).toBeDefined()
    })
  })

  describe('createFormState function', () => {
    it('should create form state with basic structure', async () => {
      const { createFormState } = await import('../src/state')

      const formState = createFormState({
        initialValues: { name: 'test' },
        validationRules: { name: [] },
      })

      expect(formState).toBeDefined()
      expect(typeof formState).toBe('object')
    })

    it('should handle complex form configurations', async () => {
      const { createFormState } = await import('../src/state')

      const formState = createFormState({
        initialValues: {
          name: '',
          email: '',
          age: 0,
        },
        validationRules: {
          name: [{ type: 'required', message: 'Name required' }],
          email: [{ type: 'required', message: 'Email required' }],
          age: [{ type: 'min', min: 18, message: 'Must be 18+' }],
        },
      })

      expect(formState).toBeDefined()
    })
  })

  describe('Error Handling', () => {
    it('should handle validation errors gracefully', async () => {
      const { createField } = await import('../src/state')

      // Should not throw when creating field with invalid rules
      expect(() =>
        createField({
          name: 'test',
          initialValue: '',
          validationRules: [
            { type: 'unknown', message: 'Unknown rule' } as any,
          ],
        })
      ).not.toThrow()
    })

    it('should handle form state errors gracefully', async () => {
      const { createFormState } = await import('../src/state')

      // Should not throw with invalid initial state
      expect(() =>
        createFormState({
          initialValues: null as any,
          validationRules: {},
        })
      ).not.toThrow()
    })
  })
})
