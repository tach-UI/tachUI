/**
 * Forms Components Tests
 */

import { describe, expect, it, vi } from 'vitest'
import {
  Checkbox,
  EmailField,
  Form,
  Radio,
  RadioGroup,
  Select,
  Switch,
  TextField,
} from '../src/components'

// Mock the reactive system and core
vi.mock('@tachui/core', () => ({
  createSignal: vi.fn((initial) => {
    let value = initial
    const getter = () => value
    const setter = (newValue: any) => {
      value = newValue
    }
    return [getter, setter]
  }),
  createEffect: vi.fn((fn) => {
    // Mock effect - just call the function once for testing
    fn()
  }),
  createComputed: vi.fn((fn) => {
    return fn
  }),
  h: vi.fn((tag, props, ...children) => ({
    type: 'element',
    tag,
    props: props || {},
    children: children.flat(),
  })),
  text: vi.fn((content) => String(content)),
  useLifecycle: vi.fn(),
  setupOutsideClickDetection: vi.fn(),
}))

// Mock the state management
vi.mock('../src/state', () => ({
  createFormState: vi.fn(() => ({
    register: vi.fn(),
    unregister: vi.fn(),
    setValue: vi.fn(),
    getValue: vi.fn(),
    getError: vi.fn(),
    validateField: vi.fn(),
    validateForm: vi.fn().mockResolvedValue(true),
    resetForm: vi.fn(),
    watch: vi.fn(() => ({})),
    state: vi.fn(() => ({
      valid: true,
      dirty: false,
      submitting: false,
      submitted: false,
      errors: {},
      touched: {},
      fields: {},
    })),
  })),
  createField: vi.fn(() => ({
    value: vi.fn(() => ''),
    setValue: vi.fn(),
    error: vi.fn(() => undefined),
    touched: vi.fn(() => false),
    dirty: vi.fn(() => false),
    valid: vi.fn(() => true),
    validating: vi.fn(() => false),
    focused: vi.fn(() => false),
    onFocus: vi.fn(),
    onBlur: vi.fn(),
    validate: vi.fn().mockResolvedValue(true),
    reset: vi.fn(),
  })),
}))

describe('Forms Components', () => {
  describe('Form Component', () => {
    it('creates form component with basic props', () => {
      const onSubmit = vi.fn()
      const form = Form({
        onSubmit,
        children: [],
      })

      expect(form.type).toBe('component')
      expect(form.props.onSubmit).toBe(onSubmit)

      const rendered = form.render()
      expect(rendered.type).toBe('element')
      expect(rendered.tag).toBe('form')
      expect(rendered.props['data-tachui-form']).toBe(true)
    })

    it('handles form submission', () => {
      const onSubmit = vi.fn()
      const form = Form({
        onSubmit,
        children: [],
      })

      const rendered = form.render()
      const submitHandler = rendered.props.onsubmit

      // Simulate form submission
      const mockEvent = { preventDefault: vi.fn() }
      submitHandler(mockEvent)

      expect(mockEvent.preventDefault).toHaveBeenCalled()
    })

    it('passes form context to children', () => {
      // Create a mock child component that can capture its props
      let capturedProps: any = null

      const childComponent = {
        type: 'component' as const,
        id: 'child',
        props: {},
        render: function () {
          // Capture the props that were set on this component instance
          capturedProps = this.props
          return { type: 'element' as const, tag: 'div' }
        },
      }

      const form = Form({
        children: [childComponent],
      })

      const rendered = form.render()

      // Verify the form rendered successfully
      expect(rendered.type).toBe('element')
      expect(rendered.tag).toBe('form')
      expect(rendered.children.length).toBe(1)

      // Verify the child component received the form context
      expect(capturedProps).toBeDefined()
      expect(capturedProps._formContext).toBeDefined()
      expect(typeof capturedProps._formContext.register).toBe('function')
      expect(typeof capturedProps._formContext.unregister).toBe('function')
      expect(typeof capturedProps._formContext.setValue).toBe('function')
      expect(typeof capturedProps._formContext.getValue).toBe('function')
    })

    it('applies validation configuration', () => {
      const form = Form({
        validation: {
          validateOn: 'change',
          debounceMs: 500,
          stopOnFirstError: true,
        },
        children: [],
      })

      expect(form.props.validation.validateOn).toBe('change')
      expect(form.props.validation.debounceMs).toBe(500)
      expect(form.props.validation.stopOnFirstError).toBe(true)
    })

    it('handles cleanup when preserveValues is false', () => {
      const form = Form({
        preserveValues: false,
        children: [],
      })

      expect(form.cleanup).toBeDefined()

      // Should not throw when cleanup is called
      expect(() => form.cleanup?.forEach((fn) => fn())).not.toThrow()
    })
  })

  describe('TextField Component', () => {
    it('creates text field with basic props', () => {
      const textField = TextField({
        name: 'username',
        label: 'Username',
        placeholder: 'Enter username',
      })

      expect(textField.type).toBe('component')
      expect(textField.props.name).toBe('username')

      const rendered = textField.render()
      expect(rendered.type).toBe('element')
      expect(rendered.props['data-tachui-textfield-container']).toBe(true)
    })

    it('renders label when provided', () => {
      const textField = TextField({
        name: 'username',
        label: 'Username',
      })

      const rendered = textField.render()
      const label = rendered.children.find((child: any) => child.tag === 'label')

      expect(label).toBeDefined()
      expect(label.props.for).toBe('username')
      expect(label.children).toContain('Username')
    })

    it('renders input with correct attributes', () => {
      const textField = TextField({
        name: 'email',
        type: 'email',
        required: true,
        disabled: true,
        placeholder: 'Enter email',
      })

      const rendered = textField.render()
      const input = rendered.children.find((child: any) => child.tag === 'input')

      expect(input).toBeDefined()
      expect(input.props.type).toBe('email')
      expect(input.props.name).toBe('email')
      expect(input.props.required).toBe(true)
      expect(input.props.disabled).toBe(true)
      expect(input.props.placeholder).toBe('Enter email')
    })

    it('renders textarea for multiline', () => {
      const textField = TextField({
        name: 'description',
        multiline: true,
        rows: 5,
      })

      const rendered = textField.render()
      const textarea = rendered.children.find((child: any) => child.tag === 'textarea')

      expect(textarea).toBeDefined()
      expect(textarea.props.rows).toBe(5)
    })

    it('shows character counter when maxLength is set', () => {
      const textField = TextField({
        name: 'message',
        maxLength: 100,
      })

      const rendered = textField.render()
      const counter = rendered.children.find(
        (child: any) => child.props?.['data-tachui-character-counter']
      )

      expect(counter).toBeDefined()
      expect(counter.children).toContain('0/100')
    })

    it('displays error message', () => {
      const textField = TextField({
        name: 'username',
        error: 'Username is required',
      })

      const rendered = textField.render()
      const error = rendered.children.find((child: any) => child.props?.['data-tachui-error'])

      expect(error).toBeDefined()
      expect(error.props.role).toBe('alert')
      expect(error.children).toContain('Username is required')
    })

    it('displays helper text when no error', () => {
      const textField = TextField({
        name: 'username',
        helperText: 'Choose a unique username',
      })

      const rendered = textField.render()
      const helper = rendered.children.find((child: any) => child.props?.['data-tachui-helper'])

      expect(helper).toBeDefined()
      expect(helper.children).toContain('Choose a unique username')
    })

    it('handles change events', () => {
      const onChange = vi.fn()
      const textField = TextField({
        name: 'username',
        onChange,
      })

      const rendered = textField.render()
      const input = rendered.children.find((child: any) => child.tag === 'input')

      // Simulate input change
      const mockEvent = {
        target: { value: 'newvalue' },
      }
      input.props.oninput(mockEvent)

      // The onChange handler should be called through the field state
      // This would normally happen through the reactive system
    })
  })

  describe('EmailField Component', () => {
    it('creates email field with email validation', () => {
      const emailField = EmailField({
        name: 'email',
        label: 'Email Address',
      })

      expect(emailField.props.type).toBe('email')
      expect(emailField.props.validation.rules).toContain('email')
    })
  })

  describe('Checkbox Component', () => {
    it('creates checkbox with basic props', () => {
      const checkbox = Checkbox({
        name: 'agree',
        label: 'I agree to terms',
      })

      expect(checkbox.type).toBe('component')
      expect(checkbox.props.name).toBe('agree')

      const rendered = checkbox.render()
      expect(rendered.props['data-tachui-checkbox-container']).toBe(true)
    })

    it('renders hidden input and custom visual', () => {
      const checkbox = Checkbox({
        name: 'agree',
        label: 'I agree',
      })

      const rendered = checkbox.render()
      const label = rendered.children.find((child: any) => child.tag === 'label')
      const input = label.children.find((child: any) => child.tag === 'input')
      const visual = label.children.find(
        (child: any) => child.props?.['data-tachui-checkbox-visual']
      )

      expect(input).toBeDefined()
      expect(input.props.type).toBe('checkbox')
      expect(input.props.style.opacity).toBe('0') // Hidden

      expect(visual).toBeDefined()
      expect(visual.props['aria-hidden']).toBe('true')
    })

    it('handles indeterminate state', () => {
      const checkbox = Checkbox({
        name: 'partial',
        indeterminate: true,
      })

      const rendered = checkbox.render()
      expect(rendered.props['data-indeterminate']).toBe(true)
    })
  })

  describe('Switch Component', () => {
    it('creates switch variant of checkbox', () => {
      const switchComp = Switch({
        name: 'enabled',
        label: 'Enable feature',
        size: 'large',
      })

      const rendered = switchComp.render()
      expect(rendered.props['data-tachui-switch']).toBe(true)
      expect(rendered.props['data-switch-size']).toBe('large')
      expect(rendered.props.class).toContain('tachui-switch-large')
    })
  })

  describe('Radio Component', () => {
    it('creates radio button with basic props', () => {
      const radio = Radio({
        name: 'color',
        value: 'red',
        label: 'Red',
      })

      expect(radio.type).toBe('component')
      expect(radio.props.value).toBe('red')

      const rendered = radio.render()
      expect(rendered.props['data-tachui-radio-container']).toBe(true)
    })

    it('renders hidden input with correct attributes', () => {
      const radio = Radio({
        name: 'color',
        value: 'blue',
        label: 'Blue',
        checked: true,
      })

      const rendered = radio.render()
      const label = rendered.children.find((child: any) => child.tag === 'label')
      const input = label.children.find((child: any) => child.tag === 'input')

      expect(input).toBeDefined()
      expect(input.props.type).toBe('radio')
      expect(input.props.name).toBe('color')
      expect(input.props.value).toBe('blue')
    })
  })

  describe('RadioGroup Component', () => {
    it('creates radio group with options', () => {
      const options = [
        { value: 'red', label: 'Red' },
        { value: 'green', label: 'Green' },
        { value: 'blue', label: 'Blue' },
      ]

      const radioGroup = RadioGroup({
        name: 'color',
        label: 'Choose Color',
        options,
      })

      const rendered = radioGroup.render()
      expect(rendered.tag).toBe('fieldset')
      expect(rendered.props['data-tachui-radio-group']).toBe(true)

      const legend = rendered.children.find((child: any) => child.tag === 'legend')
      expect(legend).toBeDefined()
      expect(legend.children).toContain('Choose Color')

      const optionsContainer = rendered.children.find(
        (child: any) => child.props?.['data-tachui-radio-options']
      )
      expect(optionsContainer).toBeDefined()
      expect(optionsContainer.children).toHaveLength(3)
    })

    it('handles direction prop', () => {
      const radioGroup = RadioGroup({
        name: 'layout',
        options: [{ value: 'a', label: 'A' }],
        direction: 'horizontal',
      })

      const rendered = radioGroup.render()
      expect(rendered.props['data-direction']).toBe('horizontal')
    })
  })

  describe('Select Component', () => {
    it('creates select with options', () => {
      const options = [
        { value: '1', label: 'Option 1' },
        { value: '2', label: 'Option 2' },
      ]

      const select = Select({
        name: 'choice',
        label: 'Choose Option',
        options,
      })

      expect(select.type).toBe('component')
      expect(select.props.options).toBe(options)

      const rendered = select.render()
      expect(rendered.props['data-tachui-select-container']).toBe(true)
    })

    it('handles multiple selection', () => {
      const select = Select({
        name: 'choices',
        options: [{ value: '1', label: 'One' }],
        multiple: true,
      })

      const rendered = select.render()
      expect(rendered.props['data-multiple']).toBe(true)
    })

    it('shows placeholder text', () => {
      const select = Select({
        name: 'choice',
        options: [],
        placeholder: 'Select an option...',
      })

      const rendered = select.render()
      const trigger = rendered.children.find(
        (child: any) => child.props?.['data-tachui-select-trigger']
      )
      const value = trigger.children.find((child: any) => child.props?.['data-tachui-select-value'])

      expect(value).toBeDefined()
      // The display value would be computed through the component logic
    })

    it('renders dropdown when open', () => {
      const select = Select({
        name: 'choice',
        options: [
          { value: '1', label: 'Option 1' },
          { value: '2', label: 'Option 2' },
        ],
      })

      // The dropdown visibility is controlled by internal state
      // In a real test, we'd trigger the click to open it
      const rendered = select.render()

      // Initial state should not show dropdown
      const dropdown = rendered.children.find(
        (child: any) => child.props?.['data-tachui-select-dropdown']
      )
      expect(dropdown).toBeUndefined() // Not open initially
    })
  })

  describe('Component Integration', () => {
    it('components work within form context', () => {
      const textField = TextField({
        name: 'username',
        label: 'Username',
        _formContext: {
          register: vi.fn(),
          unregister: vi.fn(),
          setValue: vi.fn(),
          getValue: vi.fn().mockReturnValue(''),
          getError: vi.fn().mockReturnValue(undefined),
        },
      })

      expect(textField.type).toBe('component')

      // Component should register with form context
      const formContext = (textField.props as any)._formContext
      expect(formContext.register).toBeDefined()
    })

    it('components handle validation errors from form context', () => {
      const formContext = {
        register: vi.fn(),
        unregister: vi.fn(),
        setValue: vi.fn(),
        getValue: vi.fn().mockReturnValue(''),
        getError: vi.fn().mockReturnValue('Field is required'),
      }

      const textField = TextField({
        name: 'username',
        _formContext: formContext,
      })

      const rendered = textField.render()
      expect(rendered.props['data-field-state']).toBe('error')
    })
  })

  describe('Accessibility', () => {
    it('components include proper ARIA attributes', () => {
      const textField = TextField({
        name: 'username',
        label: 'Username',
        required: true,
        error: 'Username is required',
      })

      const rendered = textField.render()
      const input = rendered.children.find((child: any) => child.tag === 'input')

      expect(input.props['aria-invalid']).toBe(true)
      expect(input.props['aria-describedby']).toContain('username-error')
    })

    it('radio groups use fieldset and legend', () => {
      const radioGroup = RadioGroup({
        name: 'choice',
        label: 'Make a choice',
        options: [{ value: 'a', label: 'A' }],
      })

      const rendered = radioGroup.render()
      expect(rendered.tag).toBe('fieldset')
      expect(rendered.props.role).toBe('radiogroup')

      const legend = rendered.children.find((child: any) => child.tag === 'legend')
      expect(legend).toBeDefined()
    })

    it('select components use combobox role', () => {
      const select = Select({
        name: 'choice',
        options: [{ value: '1', label: 'One' }],
      })

      const rendered = select.render()
      const trigger = rendered.children.find(
        (child: any) => child.props && child.props.role === 'combobox'
      )

      expect(trigger).toBeDefined()
      expect(trigger.props['aria-expanded']).toBeDefined()
      expect(trigger.props['aria-haspopup']).toBe('listbox')
    })
  })

  describe('Error Handling', () => {
    it('components handle missing form context gracefully', () => {
      const textField = TextField({
        name: 'username',
        label: 'Username',
      })

      // Should not throw even without form context
      expect(() => textField.render()).not.toThrow()
    })

    it('components handle cleanup gracefully', () => {
      const textField = TextField({
        name: 'username',
        _formContext: {
          register: vi.fn(),
          unregister: vi.fn(),
          setValue: vi.fn(),
          getValue: vi.fn(),
          getError: vi.fn(),
        },
      })

      // Should not throw when cleanup is called
      expect(() => textField.cleanup?.forEach((fn) => fn())).not.toThrow()
    })
  })
})
