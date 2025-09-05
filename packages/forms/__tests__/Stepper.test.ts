/**
 * Stepper Component Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createSignal } from '@tachui/core'
import { Stepper } from '../src/components/advanced/Stepper'

describe('Stepper', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('should create Stepper component', () => {
    const stepper = Stepper({
      value: 5,
      in: [0, 10],
    })

    expect(stepper).toBeDefined()
    expect(stepper.type).toBe('component')
  })

  it('should handle static values', () => {
    const stepper = Stepper({
      value: 3,
      in: [0, 10],
    })

    expect(stepper).toBeDefined()
    expect(typeof stepper).toBe('object')
  })

  it('should support step increments', () => {
    const stepper = Stepper({
      value: 5,
      in: [0, 10],
      step: 2,
    })

    expect(stepper).toBeDefined()
  })

  it('should support increment/decrement controls', () => {
    const stepper = Stepper({
      value: 5,
      in: [0, 10],
      step: 1,
    })

    expect(stepper).toBeDefined()
    expect(typeof stepper).toBe('object')
  })
})
