import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BasicForm, BasicFormImplementation } from '../../src/forms/BasicForm'
import { createSignal, renderComponent } from '@tachui/core'

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
      .padding(16)
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

describe('BasicForm interaction', () => {
  const mounted: Array<() => void> = []

  function mount(component: any) {
    const host = document.createElement('div')
    document.body.appendChild(host)
    const dispose = renderComponent(component, host)
    mounted.push(() => {
      dispose()
      host.remove()
    })
    return host
  }

  function submit(host: HTMLElement) {
    host
      .querySelector('form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  }

  afterEach(() => {
    while (mounted.length > 0) mounted.pop()!()
  })

  it('calls onSubmit when the form is submitted', async () => {
    const onSubmit = vi.fn()
    const host = mount(BasicForm([], { onSubmit }))

    submit(host)
    await Promise.resolve()

    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it('submits the values of the fields inside the form', async () => {
    const onSubmit = vi.fn()
    const host = mount(BasicForm([], { onSubmit }))
    const form = host.querySelector('form')!

    const field = document.createElement('input')
    field.name = 'email'
    field.value = 'someone@example.com'
    form.appendChild(field)

    submit(host)
    await Promise.resolve()

    expect(onSubmit).toHaveBeenCalledWith({ email: 'someone@example.com' })
  })

  it('blocks submission while a required field is empty', async () => {
    const onSubmit = vi.fn()
    const host = mount(BasicForm([], { onSubmit }))
    const form = host.querySelector('form')!

    const field = document.createElement('input')
    field.name = 'email'
    field.setAttribute('required', '')
    form.appendChild(field)

    submit(host)
    await Promise.resolve()

    expect(onSubmit).not.toHaveBeenCalled()

    field.value = 'someone@example.com'
    submit(host)
    await Promise.resolve()

    expect(onSubmit).toHaveBeenCalledWith({ email: 'someone@example.com' })
  })

  it('validates on input when validateOnChange is set', async () => {
    // Rendered from the implementation rather than `BasicForm()`, because the
    // modifier builder clones the component on every render and each clone's
    // constructor effect is owned by that render — so `onValidationChange`
    // only reports through the builder for as long as its clone is current.
    const onValidationChange = vi.fn()
    const host = mount(
      new BasicFormImplementation({
        children: [],
        onSubmit: vi.fn(),
        validateOnChange: true,
        onValidationChange,
      })
    )
    const form = host.querySelector('form')!

    const field = document.createElement('input')
    field.name = 'email'
    field.setAttribute('required', '')
    form.appendChild(field)

    field.dispatchEvent(new Event('input', { bubbles: true }))
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(onValidationChange).toHaveBeenLastCalledWith(
      false,
      expect.arrayContaining([expect.objectContaining({ field: 'email' })])
    )
  })

  it('does not leave a ref callback on the rendered form', () => {
    const host = mount(BasicForm([], { onSubmit: vi.fn() }))

    expect(host.querySelector('form')!.hasAttribute('ref')).toBe(false)
  })
})
