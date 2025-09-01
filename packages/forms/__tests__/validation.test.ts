/**
 * Forms Validation System Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createSignal } from '@tachui/core'

describe('Forms Validation System', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('should have validation system available', async () => {
    const validation = await import('../src/validation')

    expect(validation).toBeDefined()
    expect(validation.validateValue).toBeDefined()
  })

  it('should provide validation presets', async () => {
    const { ValidationPresets } = await import('../src/validation')

    expect(ValidationPresets).toBeDefined()
  })

  it('should provide cross-field validators', async () => {
    const { CrossFieldValidators } = await import('../src/validation')

    expect(CrossFieldValidators).toBeDefined()
  })

  it('should provide validation utilities', async () => {
    const { ValidationUtils } = await import('../src/validation')

    expect(ValidationUtils).toBeDefined()
  })
})
