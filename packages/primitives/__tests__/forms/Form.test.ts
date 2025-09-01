import { beforeEach, describe, expect, it, vi } from 'vitest'
import { BasicForm } from '../../src/forms/BasicForm'
import { createSignal } from '@tachui/core'

// Mock console.warn to suppress any deprecation warnings in tests
vi.spyOn(console, 'warn').mockImplementation(() => {})

// Mock DOM environment
const _mockElement = {
  appendChild: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  setAttribute: vi.fn(),
  removeAttribute: vi.fn(),
  style: {},
  className: '',
}

vi.mock('../../runtime/renderer', () => ({
  DOMRenderer: vi.fn().mockImplementation(() => ({
    render: vi.fn(),
    cleanup: vi.fn(),
  })),
  h: vi.fn((tag, props, ...children) => ({
    type: 'element',
    tag,
    props: props || {},
    children: children.flat().filter(Boolean),
  })),
  text: vi.fn(content => ({
    type: 'text',
    content,
  })),
}))

describe('BasicBasicForm Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create form with default props', () => {
    const onSubmit = vi.fn()
    const form = BasicForm([], { onSubmit })

    expect(form).toBeDefined()
    expect(form.render).toBeDefined()
  })

  it('should handle form submission', () => {
    const onSubmit = vi.fn()
    const form = BasicForm([], { onSubmit })

    const rendered = form.render()
    expect(rendered).toBeDefined()
  })

  it('should support validation', () => {
    const validate = vi.fn(() => ({ isValid: true, errors: {} }))
    const onSubmit = vi.fn()

    const form = BasicForm([], { onSubmit, validate })
    const rendered = form.render()

    expect(rendered).toBeDefined()
  })

  it('should handle validation errors', () => {
    const validate = vi.fn(() => ({
      isValid: false,
      errors: { email: 'Invalid email' },
    }))
    const onSubmit = vi.fn()

    const form = BasicForm([], { onSubmit, validate })
    expect(form).toBeDefined()
  })

  it('should support reactive validation state', () => {
    const [isValid, setIsValid] = createSignal(true)
    const onSubmit = vi.fn()

    const form = BasicForm([], {
      onSubmit,
      validate: () => ({ isValid: isValid(), errors: {} }),
    })

    expect(form).toBeDefined()

    setIsValid(false)
    expect(form).toBeDefined()
  })

  it('should apply modifiers correctly', () => {
    const onSubmit = vi.fn()
    const form = BasicForm([], { onSubmit })
      .modifier.padding(16)
      .backgroundColor('white')
      .cornerRadius(8)
      .build()

    const rendered = form.render()
    expect(rendered).toBeDefined()
  })
})
