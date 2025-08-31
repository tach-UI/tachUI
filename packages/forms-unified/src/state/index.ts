/**
 * TachUI Forms State Management
 *
 * Reactive form state management with validation, field tracking,
 * and form lifecycle management using TachUI's signal system.
 */

import { createComputed, createEffect, createSignal } from '@tachui/core'
import type {
  FieldState,
  FieldValidation,
  FormState,
  FormSubmitHandler,
  UseFormReturn,
  ValidationResult,
} from '../types'
import { validateValueAsync } from '../validation'

/**
 * Create a reactive field state
 */
function createFieldState<T = any>(
  initialValue?: T
): {
  state: () => FieldState<T>
  setValue: (value: T) => void
  setError: (error: string | undefined) => void
  setTouched: (touched: boolean) => void
  setFocused: (focused: boolean) => void
  setValidating: (validating: boolean) => void
} {
  const [value, setValue] = createSignal<T>(initialValue as T)
  const [error, setError] = createSignal<string | undefined>(undefined)
  const [touched, setTouched] = createSignal(false)
  const [dirty, setDirty] = createSignal(false)
  const [focused, setFocused] = createSignal(false)
  const [validating, setValidating] = createSignal(false)

  // Mark dirty when value changes from initial
  createEffect(() => {
    const currentValue = value()
    if (currentValue !== initialValue) {
      setDirty(true)
    }
  })

  const valid = createComputed(() => !error())

  const state = createComputed(
    (): FieldState<T> => ({
      value: value(),
      error: error(),
      touched: touched(),
      dirty: dirty(),
      valid: valid(),
      validating: validating(),
      focused: focused(),
    })
  )

  return {
    state,
    setValue: (newValue: T) => {
      setValue(newValue)
      // Mark dirty if value changed from initial
      if (newValue !== initialValue) {
        setDirty(true)
      } else {
        setDirty(false)
      }
      if (touched()) {
        // Trigger validation if field is touched
        // This will be handled by the form's validation system
      }
    },
    setError,
    setTouched,
    setFocused,
    setValidating,
  }
}

/**
 * Create a form state manager
 */
export function createFormState(
  initialValues: Record<string, any> = {}
): UseFormReturn {
  const fields = new Map<string, ReturnType<typeof createFieldState>>()
  const validations = new Map<string, FieldValidation>()

  const [submitting, setSubmitting] = createSignal(false)
  const [submitted, setSubmitted] = createSignal(false)

  // Auto-register fields from initial values
  Object.keys(initialValues).forEach(name => {
    const fieldManager = createFieldState(initialValues[name])
    fields.set(name, fieldManager)
  })

  // Reactive form state
  const formState = createComputed((): FormState => {
    const fieldStates: Record<string, FieldState> = {}
    const errors: Record<string, string> = {}
    const touched: Record<string, boolean> = {}
    let valid = true
    let dirty = false

    for (const [name, fieldManager] of fields) {
      const fieldState = fieldManager.state()
      fieldStates[name] = fieldState

      if (fieldState.error) {
        errors[name] = fieldState.error
        valid = false
      }

      if (fieldState.touched) {
        touched[name] = true
      }

      if (fieldState.dirty) {
        dirty = true
      }
    }

    return {
      fields: fieldStates,
      valid,
      dirty,
      submitting: submitting(),
      submitted: submitted(),
      errors,
      touched,
    }
  })

  // Register a field
  const register = (name: string, validation?: FieldValidation) => {
    if (fields.has(name)) {
      // Field already exists, just update validation if provided
      if (validation) {
        validations.set(name, validation)
      }
      return
    }

    const fieldManager = createFieldState(initialValues[name])
    fields.set(name, fieldManager)

    if (validation) {
      validations.set(name, validation)
    }

    // Set up validation effects
    if (validation) {
      const fieldState = fieldManager.state

      createEffect(async () => {
        const state = fieldState()
        const shouldValidate =
          validation.validateOn === 'change' ||
          (validation.validateOn === 'blur' && state.touched) ||
          (validation.validateOn === 'submit' && submitted())

        if (shouldValidate && (state.dirty || state.touched)) {
          fieldManager.setValidating(true)

          try {
            const result = await validateFieldAsync(state, validation)
            fieldManager.setError(result.valid ? undefined : result.message)
          } catch (_error) {
            fieldManager.setError('Validation error occurred')
          } finally {
            fieldManager.setValidating(false)
          }
        }
      })
    }
  }

  // Unregister a field
  const unregister = (name: string) => {
    fields.delete(name)
    validations.delete(name)
  }

  // Set field value
  const setValue = (name: string, value: any) => {
    const fieldManager = fields.get(name)
    if (fieldManager) {
      fieldManager.setValue(value)
    }
  }

  // Get field value
  const getValue = (name: string) => {
    const fieldManager = fields.get(name)
    return fieldManager?.state().value
  }

  // Get field error
  const getError = (name: string) => {
    const fieldManager = fields.get(name)
    return fieldManager?.state().error
  }

  // Validate a specific field
  const validateField = async (name: string): Promise<boolean> => {
    const fieldManager = fields.get(name)
    const validation = validations.get(name)

    if (!fieldManager || !validation) {
      return true
    }

    const fieldState = fieldManager.state()
    fieldManager.setValidating(true)

    try {
      const result = await validateFieldAsync(fieldState, validation)
      fieldManager.setError(result.valid ? undefined : result.message)
      return result.valid
    } catch (_error) {
      fieldManager.setError('Validation error occurred')
      return false
    } finally {
      fieldManager.setValidating(false)
    }
  }

  // Validate entire form
  const validateForm = async (): Promise<boolean> => {
    const validationPromises = Array.from(fields.keys()).map(validateField)
    const results = await Promise.all(validationPromises)
    return results.every(result => result)
  }

  // Reset form to initial state
  const resetForm = () => {
    for (const [name, fieldManager] of fields) {
      fieldManager.setValue(initialValues[name])
      fieldManager.setError(undefined)
      fieldManager.setTouched(false)
      fieldManager.setFocused(false)
      fieldManager.setValidating(false)
    }
    setSubmitting(false)
    setSubmitted(false)
  }

  // Submit form
  const submitForm = async (handler?: FormSubmitHandler) => {
    setSubmitting(true)
    setSubmitted(true)

    try {
      // Validate all fields
      const isValid = await validateForm()

      if (isValid && handler) {
        // Collect form values
        const values: Record<string, any> = {}
        for (const [name, fieldManager] of fields) {
          values[name] = fieldManager.state().value
        }

        await handler(values, formState())
      }
    } finally {
      setSubmitting(false)
    }
  }

  // Watch for changes in specific fields
  const watch = (fieldNames?: string[]): Record<string, any> => {
    const values: Record<string, any> = {}
    const fieldsToWatch = fieldNames || Array.from(fields.keys())

    for (const name of fieldsToWatch) {
      if (fields.has(name)) {
        values[name] = getValue(name)
      }
    }

    return values
  }

  // Trigger validation for specific fields
  const trigger = async (fieldNames?: string[]): Promise<boolean> => {
    const fieldsToValidate = fieldNames || Array.from(fields.keys())
    const validationPromises = fieldsToValidate.map(validateField)
    const results = await Promise.all(validationPromises)
    return results.every(result => result)
  }

  return {
    fields: formState().fields,
    state: formState(),
    register,
    unregister,
    setValue,
    getValue,
    getError,
    validateField,
    validateForm,
    resetForm,
    submitForm,
    watch,
    trigger,
  }
}

/**
 * Async field validation helper
 */
async function validateFieldAsync(
  fieldState: FieldState,
  validation: FieldValidation
): Promise<ValidationResult> {
  if (!validation.rules || validation.rules.length === 0) {
    return { valid: true }
  }

  // Use debounced validation if specified
  if (validation.debounceMs) {
    return new Promise(resolve => {
      setTimeout(async () => {
        const result = await validateValueAsync(
          fieldState.value,
          validation.rules!
        )
        resolve(result)
      }, validation.debounceMs)

      // Store timeout ID for potential cleanup
      // In a real implementation, you'd want to manage this better
    })
  }

  return validateValueAsync(fieldState.value, validation.rules)
}

/**
 * Form field hook for individual field management
 */
export function createField<T = any>(
  _name: string,
  initialValue?: T,
  validation?: FieldValidation
): {
  value: () => T
  setValue: (value: T) => void
  error: () => string | undefined
  touched: () => boolean
  dirty: () => boolean
  valid: () => boolean
  validating: () => boolean
  focused: () => boolean
  onFocus: () => void
  onBlur: () => void
  validate: () => Promise<boolean>
  reset: () => void
} {
  const fieldManager = createFieldState(initialValue)
  const fieldState = fieldManager.state

  // Validation effect
  if (validation) {
    createEffect(async () => {
      const state = fieldState()
      const shouldValidate =
        validation.validateOn === 'change' ||
        (validation.validateOn === 'blur' && state.touched)

      if (shouldValidate && (state.dirty || state.touched)) {
        fieldManager.setValidating(true)

        try {
          const result = await validateFieldAsync(state, validation)
          fieldManager.setError(result.valid ? undefined : result.message)
        } catch (_error) {
          fieldManager.setError('Validation error occurred')
        } finally {
          fieldManager.setValidating(false)
        }
      }
    })
  }

  const validate = async (): Promise<boolean> => {
    if (!validation) return true

    fieldManager.setValidating(true)
    try {
      const result = await validateFieldAsync(fieldState(), validation)
      fieldManager.setError(result.valid ? undefined : result.message)
      return result.valid
    } catch (_error) {
      fieldManager.setError('Validation error occurred')
      return false
    } finally {
      fieldManager.setValidating(false)
    }
  }

  const reset = () => {
    fieldManager.setValue(initialValue as T)
    fieldManager.setError(undefined)
    fieldManager.setTouched(false)
    fieldManager.setFocused(false)
    fieldManager.setValidating(false)
  }

  return {
    value: () => fieldState().value,
    setValue: fieldManager.setValue,
    error: () => fieldState().error,
    touched: () => fieldState().touched,
    dirty: () => fieldState().dirty,
    valid: () => fieldState().valid,
    validating: () => fieldState().validating,
    focused: () => fieldState().focused,
    onFocus: () => {
      fieldManager.setFocused(true)
    },
    onBlur: () => {
      fieldManager.setFocused(false)
      fieldManager.setTouched(true)
    },
    validate,
    reset,
  }
}

/**
 * Multi-step form state manager
 */
export function createMultiStepFormState(
  steps: string[],
  initialValues: Record<string, any> = {}
) {
  const [currentStep, setCurrentStep] = createSignal(0)
  const [completedSteps, setCompletedSteps] = createSignal<Set<number>>(
    new Set()
  )
  const stepForms = new Map<number, UseFormReturn>()

  // Create form state for each step
  steps.forEach((_, index) => {
    const stepValues = Object.keys(initialValues)
      .filter(key => key.startsWith(`step_${index}_`))
      .reduce(
        (acc, key) => {
          const fieldName = key.replace(`step_${index}_`, '')
          acc[fieldName] = initialValues[key]
          return acc
        },
        {} as Record<string, any>
      )

    stepForms.set(index, createFormState(stepValues))
  })

  const nextStep = async (validateCurrent = true): Promise<boolean> => {
    const current = currentStep()
    const currentForm = stepForms.get(current)

    if (validateCurrent && currentForm) {
      const isValid = await currentForm.validateForm()
      if (!isValid) {
        return false
      }
    }

    if (current < steps.length - 1) {
      setCompletedSteps(prev => new Set([...prev, current]))
      setCurrentStep(current + 1)
      return true
    }

    return false
  }

  const previousStep = (): boolean => {
    const current = currentStep()
    if (current > 0) {
      setCurrentStep(current - 1)
      return true
    }
    return false
  }

  const goToStep = (stepIndex: number): boolean => {
    if (stepIndex >= 0 && stepIndex < steps.length) {
      setCurrentStep(stepIndex)
      return true
    }
    return false
  }

  const getCurrentForm = (): UseFormReturn | undefined => {
    return stepForms.get(currentStep())
  }

  const getAllValues = (): Record<string, any> => {
    const allValues: Record<string, any> = {}

    stepForms.forEach((form, stepIndex) => {
      const stepValues = form.watch()
      Object.keys(stepValues).forEach(fieldName => {
        allValues[`step_${stepIndex}_${fieldName}`] = stepValues[fieldName]
      })
    })

    return allValues
  }

  const validateAllSteps = async (): Promise<boolean> => {
    const validationPromises = Array.from(stepForms.values()).map(form =>
      form.validateForm()
    )
    const results = await Promise.all(validationPromises)
    return results.every(result => result)
  }

  return {
    currentStep,
    completedSteps,
    nextStep,
    previousStep,
    goToStep,
    getCurrentForm,
    getAllValues,
    validateAllSteps,
    getStepForm: (stepIndex: number) => stepForms.get(stepIndex),
    isStepCompleted: (stepIndex: number) => completedSteps().has(stepIndex),
    canGoToStep: (stepIndex: number) =>
      stepIndex <= currentStep() || completedSteps().has(stepIndex),
  }
}

// Export validation function for internal use
export { validateValueAsync } from '../validation'
