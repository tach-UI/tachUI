/**
 * Select Component Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createSignal } from '@tachui/core'
import { Select } from '../src/components/selection/Select'

describe('Select', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('should create Select component', () => {
    const select = Select({
      selection: 'option1',
      options: [
        { id: 'option1', label: 'Option 1' },
        { id: 'option2', label: 'Option 2' },
      ],
    })

    expect(select).toBeDefined()
    expect(select.type).toBe('component')
  })

  it('should handle static selection', () => {
    const select = Select({
      selection: 'option1',
      options: [
        { id: 'option1', label: 'Option 1' },
        { id: 'option2', label: 'Option 2' },
      ],
    })

    expect(select).toBeDefined()
    expect(typeof select).toBe('object')
  })

  it('should support multiple selection', () => {
    const select = Select({
      selection: ['option1'],
      multiple: true,
      options: [
        { id: 'option1', label: 'Option 1' },
        { id: 'option2', label: 'Option 2' },
      ],
    })

    expect(select).toBeDefined()
  })

  it('should handle option configuration', () => {
    const select = Select({
      selection: 'option1',
      options: [
        { id: 'option1', label: 'Option 1' },
        { id: 'option2', label: 'Option 2' },
      ],
    })

    expect(select).toBeDefined()
    expect(typeof select).toBe('object')
  })
})
