import { beforeEach, describe, expect, it, vi } from 'vitest'
import { BasicForm, BasicFormImplementation } from '../../src/forms/BasicForm'
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

  it('should clone form instances with reset lifecycle state', () => {
    const form = new BasicFormImplementation({ children: [] })
    form.mounted = true
    form.cleanup.push(() => {})

    const clone = form.clone()

    expect(clone).not.toBe(form)
    expect(clone.props).toEqual(form.props)
    expect(clone.id).not.toBe(form.id)
    expect(clone.mounted).toBe(false)
    expect(clone.cleanup).toEqual([])
  })

  it('should deep clone children arrays when requested', () => {
    const child = {
      type: 'component' as const,
      id: 'child-1',
      render: () => [],
      props: {},
    }

    const form = new BasicFormImplementation({ children: [child] })
    const clone = form.clone({ deep: true })

    expect(clone.props.children).toEqual(form.props.children)
    expect(clone.props.children).not.toBe(form.props.children)
  })
})
