/**
 * Forms State Management Tests
 */

import { describe, expect, it, vi } from 'vitest'
import { createField, createFormState, createMultiStepFormState } from '../src/state'

// Mock the reactive system
vi.mock('@tachui/core', () => ({
  createSignal: vi.fn((initial) => {
    let value = initial
    const getter = () => value
    const setter = (newValue: any) => {
      if (typeof newValue === 'function') {
        value = newValue(value)
      } else {
        value = newValue
      }
    }
    return [getter, setter]
  }),
  createEffect: vi.fn((fn) => {
    // Mock effect - store the function to call later when values change
    // In real reactive system, this would be called whenever dependencies change
    // For testing, we'll call it once but the implementation might trigger it
    fn()
  }),
  createComputed: vi.fn((fn) => {
    // Return a dynamic function that calls fn() each time
    return () => fn()
  }),
}))

// Mock the validation system
vi.mock('../src/validation', () => ({
  validateValueAsync: vi.fn(async (value, rules) => {
    // Simple mock validation
    if (!rules || rules.length === 0) {
      return { valid: true }
    }

    try {
      for (const rule of rules) {
        if (typeof rule === 'string') {
          if (rule === 'required' && (!value || value === '')) {
            return { valid: false, message: 'Field is required' }
          }
          if (rule === 'email' && value && !value.includes('@')) {
            return { valid: false, message: 'Invalid email format' }
          }
        } else if (rule && typeof rule === 'object' && rule.validate) {
          // Handle custom validation rule objects
          const result = await rule.validate(value)
          if (!result || result === false) {
            return { valid: false, message: rule.message || 'Validation failed' }
          }
        }
      }

      return { valid: true }
    } catch (_error) {
      // If validation throws an error, return validation error
      return { valid: false, message: 'Validation error occurred' }
    }
  }),
}))

describe('Forms State Management', () => {
  describe('createFormState', () => {
    it('creates form state with initial values', () => {
      const initialValues = { name: 'John', email: 'john@example.com' }
      const form = createFormState(initialValues)

      expect(form.getValue('name')).toBe('John')
      expect(form.getValue('email')).toBe('john@example.com')
    })

    it('registers and unregisters fields', () => {
      const form = createFormState()

      form.register('username')
      form.setValue('username', 'testuser')
      expect(form.getValue('username')).toBe('testuser')

      form.unregister('username')
      expect(form.getValue('username')).toBeUndefined()
    })

    it('handles field validation', async () => {
      const form = createFormState()

      form.register('email', {
        rules: ['required', 'email'],
        validateOn: 'change',
      })

      form.setValue('email', '')
      const isValid = await form.validateField('email')
      expect(isValid).toBe(false)

      form.setValue('email', 'test@example.com')
      const isValidNow = await form.validateField('email')
      expect(isValidNow).toBe(true)
    })

    it('validates entire form', async () => {
      const form = createFormState()

      form.register('name', {
        rules: ['required'],
        validateOn: 'submit',
      })

      form.register('email', {
        rules: ['required', 'email'],
        validateOn: 'submit',
      })

      // Invalid form
      form.setValue('name', '')
      form.setValue('email', 'invalid')
      const isFormValid = await form.validateForm()
      expect(isFormValid).toBe(false)

      // Valid form
      form.setValue('name', 'John')
      form.setValue('email', 'john@example.com')
      const isFormValidNow = await form.validateForm()
      expect(isFormValidNow).toBe(true)
    })

    it('resets form state', () => {
      const initialValues = { name: 'John' }
      const form = createFormState(initialValues)

      form.register('name')
      form.setValue('name', 'Jane')
      expect(form.getValue('name')).toBe('Jane')

      form.resetForm()
      expect(form.getValue('name')).toBe('John')
    })

    it('submits form with handler', async () => {
      const form = createFormState({ name: 'John' })
      const mockHandler = vi.fn()

      form.register('name', {
        rules: ['required'],
        validateOn: 'submit',
      })

      await form.submitForm(mockHandler)

      expect(mockHandler).toHaveBeenCalledWith(
        { name: 'John' },
        expect.objectContaining({
          valid: true,
          dirty: false,
          submitting: true, // During submission this is true
          submitted: true, // After form is submitted this is true
          errors: expect.any(Object),
          touched: expect.any(Object),
          fields: expect.any(Object),
        })
      )
    })

    it('watches field changes', () => {
      const form = createFormState()

      form.register('name')
      form.register('email')
      form.setValue('name', 'John')
      form.setValue('email', 'john@example.com')

      const allValues = form.watch()
      expect(allValues).toEqual({ name: 'John', email: 'john@example.com' })

      const specificValues = form.watch(['name'])
      expect(specificValues).toEqual({ name: 'John' })
    })

    it('triggers validation for specific fields', async () => {
      const form = createFormState()

      form.register('name', { rules: ['required'] })
      form.register('email', { rules: ['required', 'email'] })

      form.setValue('name', '')
      form.setValue('email', 'valid@example.com')

      const nameValid = await form.trigger(['name'])
      expect(nameValid).toBe(false)

      const emailValid = await form.trigger(['email'])
      expect(emailValid).toBe(true)

      const allValid = await form.trigger()
      expect(allValid).toBe(false) // name is invalid
    })
  })

  describe('createField', () => {
    it('creates individual field state', () => {
      const field = createField('username', 'initial')

      expect(field.value()).toBe('initial')
      expect(field.touched()).toBe(false)
      expect(field.dirty()).toBe(false)
      expect(field.valid()).toBe(true)
    })

    it('handles field state changes', () => {
      const field = createField('username')

      field.setValue('newvalue')
      expect(field.value()).toBe('newvalue')
      expect(field.dirty()).toBe(true)

      field.onFocus()
      expect(field.focused()).toBe(true)

      field.onBlur()
      expect(field.focused()).toBe(false)
      expect(field.touched()).toBe(true)
    })

    it('validates field with rules', async () => {
      const field = createField('email', '', {
        rules: ['required', 'email'],
        validateOn: 'change',
      })

      field.setValue('invalid')
      const isValid = await field.validate()
      expect(isValid).toBe(false)
      expect(field.error()).toBeTruthy()

      field.setValue('valid@example.com')
      const isValidNow = await field.validate()
      expect(isValidNow).toBe(true)
      expect(field.error()).toBeFalsy()
    })

    it('resets field state', () => {
      const field = createField('username', 'initial')

      field.setValue('changed')
      field.onFocus()
      field.onBlur()

      expect(field.dirty()).toBe(true)
      expect(field.touched()).toBe(true)

      field.reset()

      expect(field.value()).toBe('initial')
      expect(field.dirty()).toBe(false)
      expect(field.touched()).toBe(false)
      expect(field.focused()).toBe(false)
    })
  })

  describe('createMultiStepFormState', () => {
    it('creates multi-step form state', () => {
      const steps = ['personal', 'contact', 'preferences']
      const multiForm = createMultiStepFormState(steps)

      expect(multiForm.currentStep()).toBe(0)
      expect(multiForm.completedSteps().size).toBe(0)
    })

    it('navigates between steps', async () => {
      const steps = ['step1', 'step2', 'step3']
      const multiForm = createMultiStepFormState(steps)

      // Next step
      const moved = await multiForm.nextStep(false) // Don't validate
      expect(moved).toBe(true)
      expect(multiForm.currentStep()).toBe(1)
      expect(multiForm.isStepCompleted(0)).toBe(true)

      // Previous step
      const movedBack = multiForm.previousStep()
      expect(movedBack).toBe(true)
      expect(multiForm.currentStep()).toBe(0)

      // Go to specific step
      const jumped = multiForm.goToStep(2)
      expect(jumped).toBe(true)
      expect(multiForm.currentStep()).toBe(2)
    })

    it('handles step validation', async () => {
      const steps = ['step1', 'step2']
      const multiForm = createMultiStepFormState(steps, {
        step_0_name: '',
        step_1_email: '',
      })

      const currentForm = multiForm.getCurrentForm()
      if (currentForm) {
        currentForm.register('name', { rules: ['required'] })
        currentForm.setValue('name', '')
      }

      // Should fail validation
      const moved = await multiForm.nextStep(true)
      expect(moved).toBe(false)
      expect(multiForm.currentStep()).toBe(0)

      // Should succeed with valid data
      if (currentForm) {
        currentForm.setValue('name', 'John')
      }
      const movedNow = await multiForm.nextStep(true)
      expect(movedNow).toBe(true)
      expect(multiForm.currentStep()).toBe(1)
    })

    it('gets all values across steps', () => {
      const steps = ['step1', 'step2']
      const multiForm = createMultiStepFormState(steps, {
        step_0_name: 'John',
        step_1_email: 'john@example.com',
      })

      // Set up forms
      const step0Form = multiForm.getStepForm(0)
      const step1Form = multiForm.getStepForm(1)

      if (step0Form) {
        step0Form.register('name')
      }
      if (step1Form) {
        step1Form.register('email')
      }

      const allValues = multiForm.getAllValues()
      expect(allValues).toEqual({
        step_0_name: 'John',
        step_1_email: 'john@example.com',
      })
    })

    it('validates all steps', async () => {
      const steps = ['step1', 'step2']
      const multiForm = createMultiStepFormState(steps)

      const step0Form = multiForm.getStepForm(0)
      const step1Form = multiForm.getStepForm(1)

      if (step0Form) {
        step0Form.register('name', { rules: ['required'] })
        step0Form.setValue('name', '') // Invalid
      }

      if (step1Form) {
        step1Form.register('email', { rules: ['required', 'email'] })
        step1Form.setValue('email', 'valid@example.com') // Valid
      }

      const allValid = await multiForm.validateAllSteps()
      expect(allValid).toBe(false) // step1 is invalid

      if (step0Form) {
        step0Form.setValue('name', 'John')
      }

      const allValidNow = await multiForm.validateAllSteps()
      expect(allValidNow).toBe(true)
    })

    it('handles step permissions', () => {
      const steps = ['step1', 'step2', 'step3']
      const multiForm = createMultiStepFormState(steps)

      // Can go to current step
      expect(multiForm.canGoToStep(0)).toBe(true)

      // Cannot go to future steps initially
      expect(multiForm.canGoToStep(1)).toBe(false)
      expect(multiForm.canGoToStep(2)).toBe(false)

      // After completing step 0, can go to step 1
      multiForm.nextStep(false)
      expect(multiForm.canGoToStep(1)).toBe(true)
      expect(multiForm.canGoToStep(0)).toBe(true) // Can go back to completed
      expect(multiForm.canGoToStep(2)).toBe(false)
    })
  })

  describe('Error Handling', () => {
    it('handles validation errors gracefully', async () => {
      const form = createFormState()

      form.register('test', {
        rules: [
          {
            name: 'failing',
            validate: () => {
              throw new Error('Validation failed')
            },
          } as any,
        ],
      })

      form.setValue('test', 'value')
      const isValid = await form.validateField('test')
      expect(isValid).toBe(false)
      expect(form.getError('test')).toBe('Validation error occurred')
    })

    it('handles async validation errors', async () => {
      const form = createFormState()

      form.register('test', {
        rules: [
          {
            name: 'async-failing',
            validate: async () => {
              throw new Error('Async validation failed')
            },
          } as any,
        ],
      })

      form.setValue('test', 'value')
      const isValid = await form.validateField('test')
      expect(isValid).toBe(false)
      expect(form.getError('test')).toBe('Validation error occurred')
    })
  })

  describe('Integration', () => {
    it('integrates field state with form state', () => {
      const form = createFormState({ username: 'initial' })
      const field = createField('username', form.getValue('username'))

      form.register('username')

      // Changes to field should be reflected in form
      field.setValue('updated')
      form.setValue('username', field.value())

      expect(form.getValue('username')).toBe('updated')
      expect(field.value()).toBe('updated')
    })
  })
})
