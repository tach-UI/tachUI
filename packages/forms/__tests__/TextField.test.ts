/**
 * TextField Component Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createSignal } from '@tachui/core'
import { TextField } from '../src/components/text-input/TextField'

describe('TextField', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('should create TextField component', () => {
    const field = TextField({
      placeholder: 'Enter text',
      value: 'test',
    })

    expect(field).toBeDefined()
    expect(typeof field).toBe('object')
  })

  it('should handle static value props', () => {
    const field = TextField({
      value: 'test value',
      placeholder: 'Test field',
    })

    expect(field).toBeDefined()
    expect(typeof field).toBe('object')
  })

  it('should support validation', () => {
    const field = TextField({
      placeholder: 'Email',
      validation: [{ type: 'required', message: 'Required' }],
    })

    expect(field).toBeDefined()
  })

  it('should support different input types', () => {
    const emailField = TextField({
      type: 'email',
      placeholder: 'Email',
    })

    const passwordField = TextField({
      type: 'password',
      placeholder: 'Password',
    })

    expect(emailField).toBeDefined()
    expect(passwordField).toBeDefined()
  })
})
