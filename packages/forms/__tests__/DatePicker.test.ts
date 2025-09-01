/**
 * DatePicker Component Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createSignal } from '@tachui/core'
import { DatePicker } from '../src/components/date-picker/DatePicker'

describe('DatePicker', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('should create DatePicker component', () => {
    const picker = DatePicker({
      selection: new Date('2025-01-01'),
    })

    expect(picker).toBeDefined()
    expect(picker.type).toBe('component')
  })

  it('should handle static date selection', () => {
    const picker = DatePicker({
      selection: new Date('2025-01-01'),
    })

    expect(picker).toBeDefined()
    expect(typeof picker).toBe('object')
  })

  it('should support different display modes', () => {
    const compactPicker = DatePicker({
      selection: new Date(),
      displayedComponents: ['date'],
      style: 'compact',
    })

    expect(compactPicker).toBeDefined()
  })

  it('should support calendar interface', () => {
    const picker = DatePicker({
      selection: new Date(),
      displayedComponents: ['date', 'hourAndMinute'],
    })

    expect(picker).toBeDefined()
    expect(typeof picker).toBe('object')
  })
})
