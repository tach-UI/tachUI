/**
 * Form State Management Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createSignal } from '@tachui/core'

describe('Form State Management', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('should create form state', async () => {
    const { createFormState } = await import('../src/state')

    const formState = createFormState({
      initialValues: { name: 'test' },
      validationRules: { name: [] },
    })

    expect(formState).toBeDefined()
    // Basic form state validation
    expect(typeof formState).toBe('object')
  })

  it('should create field state', async () => {
    const { createField } = await import('../src/state')

    const field = createField({
      name: 'testField',
      initialValue: 'initial',
      validationRules: [{ type: 'required', message: 'Required' }],
    })

    expect(field).toBeDefined()
    expect(field.value).toBeDefined()
    expect(field.error).toBeDefined()
  })

  it('should create field with validation', async () => {
    const { createField } = await import('../src/state')

    const field = createField({
      name: 'email',
      initialValue: '',
      validationRules: [{ type: 'required', message: 'Required' }],
    })

    expect(field).toBeDefined()
    expect(field.value).toBeDefined()
    expect(field.error).toBeDefined()
  })
})
