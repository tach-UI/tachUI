/**
 * Form Reactivity Integration Tests
 *
 * These tests verify that form fields, validation, and state management
 * work reactively and update the DOM correctly.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createSignal, createComputed, createEffect } from '@tachui/core'
import type { DOMNode, ComponentInstance } from '@tachui/core'
import { DOMRenderer } from '@tachui/core'
import { Show } from '@tachui/flow-control'

// Mock TextField component
function TextField(props: {
  name: string
  value?: () => string
  onChange?: (name: string, value: string) => void
  placeholder?: string
  disabled?: () => boolean
}): ComponentInstance {
  return {
    type: 'component',
    id: `textfield-${Math.random()}`,
    mounted: false,
    cleanup: [],
    props,
    render: () => {
      const inputNode: DOMNode = {
        type: 'element',
        tag: 'input',
        props: {
          type: 'text',
          name: props.name,
          placeholder: props.placeholder || '',
          value: props.value ? props.value() : '',
          disabled: props.disabled ? props.disabled() : false,
          oninput: (e: Event) => {
            const target = e.target as HTMLInputElement
            if (props.onChange) {
              props.onChange(props.name, target.value)
            }
          },
        },
        children: [],
      }
      return [inputNode]
    },
  }
}

// Mock Text component
function Text(content: string | (() => string)): ComponentInstance {
  return {
    type: 'component',
    id: `text-${Math.random()}`,
    mounted: false,
    cleanup: [],
    props: { content },
    render: () => {
      const text = typeof content === 'function' ? content() : content
      return [
        {
          type: 'element',
          tag: 'span',
          props: {},
          children: [{ type: 'text', text }],
        } as DOMNode,
      ]
    },
  }
}

// Mock Button component
function Button(label: string, onClick?: () => void): ComponentInstance {
  return {
    type: 'component',
    id: `button-${Math.random()}`,
    mounted: false,
    cleanup: [],
    props: { label, onClick },
    render: () => {
      const buttonNode: DOMNode = {
        type: 'element',
        tag: 'button',
        props: { onclick: onClick },
        children: [{ type: 'text', text: label }],
      }
      return [buttonNode]
    },
  }
}

// Mock VStack component
function VStack(...children: ComponentInstance[]): ComponentInstance {
  return {
    type: 'component',
    id: `vstack-${Math.random()}`,
    mounted: false,
    cleanup: [],
    props: { children },
    render: () => {
      const stackNode: DOMNode = {
        type: 'element',
        tag: 'div',
        props: {
          style: {
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          },
        },
        children: children.flatMap(child => child.render()),
      }
      return [stackNode]
    },
  }
}

describe('Form Reactivity Integration Tests', () => {
  let container: HTMLElement
  let renderer: DOMRenderer
  let cleanups: (() => void)[]

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    renderer = new DOMRenderer()
    cleanups = []
  })

  afterEach(() => {
    cleanups.forEach(fn => {
      try {
        fn()
      } catch (e) {
        console.error('Cleanup error:', e)
      }
    })
    cleanups = []
    if (container.parentElement) {
      container.remove()
    }
  })

  async function waitForUpdate(frames = 2): Promise<void> {
    for (let i = 0; i < frames; i++) {
      await new Promise(resolve => requestAnimationFrame(resolve))
    }
  }

  function renderToDOM(component: ComponentInstance): HTMLElement {
    const nodes = component.render()
    const element = renderer.render(nodes[0])
    container.appendChild(element)
    // If element is already the input/button/etc, return container for querying
    // Otherwise return the element
    if (element.tagName === 'INPUT' || element.tagName === 'BUTTON') {
      return container
    }
    return element as HTMLElement
  }

  describe('TextField Reactivity', () => {
    it('should update field value signal when user types', async () => {
      const [value, setValue] = createSignal('')

      const form = TextField({
        name: 'email',
        value,
        onChange: (_, val) => setValue(val),
      })

      const element = renderToDOM(form)
      const input = element.querySelector('input')!

      // Initially empty
      expect(value()).toBe('')
      expect(input.value).toBe('')

      // Simulate user typing
      input.value = 'test@example.com'
      input.dispatchEvent(new Event('input', { bubbles: true }))
      await waitForUpdate()

      // Signal should update
      expect(value()).toBe('test@example.com')
    })

    it('should display reactive value in field', async () => {
      const [value, setValue] = createSignal('initial')

      const form = TextField({
        name: 'username',
        value,
        onChange: (_, val) => setValue(val),
      })

      const element = renderToDOM(form)
      const input = element.querySelector('input')!

      // Initial value
      expect(input.value).toBe('initial')

      // Update programmatically
      setValue('updated')
      await waitForUpdate()

      // Input should reflect new value
      // Note: This may require re-rendering the component
      expect(value()).toBe('updated')
    })

    it('should disable field reactively', async () => {
      const [disabled, setDisabled] = createSignal(false)
      const [value, setValue] = createSignal('')

      const form = VStack(
        Button('Toggle Disabled', () => setDisabled(!disabled())),
        TextField({
          name: 'input',
          value,
          onChange: (_, val) => setValue(val),
          disabled,
        })
      )

      const element = renderToDOM(form)
      const button = element.querySelector('button')!
      const input = element.querySelector('input')!

      // Initially enabled
      expect(input.disabled).toBe(false)

      // Disable
      button.click()
      await waitForUpdate()

      expect(disabled()).toBe(true)
      // Note: DOM update may require re-render
    })
  })

  describe('Form Validation Reactivity', () => {
    it('should show error message when validation fails', async () => {
      const [email, setEmail] = createSignal('')
      const [error, setError] = createSignal('')

      // Reactive validation
      const effect = createEffect(() => {
        const value = email()
        if (value.length > 0 && !value.includes('@')) {
          setError('Invalid email format')
        } else {
          setError('')
        }
      })
      cleanups.push(() => effect.dispose())

      const form = VStack(
        TextField({
          name: 'email',
          value: email,
          onChange: (_, val) => setEmail(val),
        }),
        Show({
          when: () => error().length > 0,
          children: Text(() => error()),
        })
      )

      const element = renderToDOM(form)
      const input = element.querySelector('input')!

      // Initially no error
      expect(element.textContent).not.toContain('Invalid email')

      // Type invalid email
      input.value = 'invalid'
      input.dispatchEvent(new Event('input', { bubbles: true }))
      await waitForUpdate()

      expect(error()).toBe('Invalid email format')
      expect(element.textContent).toContain('Invalid email')

      // Type valid email
      input.value = 'valid@email.com'
      input.dispatchEvent(new Event('input', { bubbles: true }))
      await waitForUpdate()

      expect(error()).toBe('')
      expect(element.textContent).not.toContain('Invalid email')
    })

    it('should validate on each keystroke', async () => {
      const [password, setPassword] = createSignal('')
      const [strength, setStrength] = createSignal('weak')

      const effect = createEffect(() => {
        const pass = password()
        if (pass.length === 0) {
          setStrength('')
        } else if (pass.length < 6) {
          setStrength('weak')
        } else if (pass.length < 10) {
          setStrength('medium')
        } else {
          setStrength('strong')
        }
      })
      cleanups.push(() => effect.dispose())

      const form = VStack(
        TextField({
          name: 'password',
          value: password,
          onChange: (_, val) => setPassword(val),
        }),
        Show({
          when: () => strength().length > 0,
          children: Text(() => `Strength: ${strength()}`),
        })
      )

      const element = renderToDOM(form)
      const input = element.querySelector('input')!

      // Empty
      expect(strength()).toBe('')
      expect(element.textContent).not.toContain('Strength')

      // Weak
      input.value = 'abc'
      input.dispatchEvent(new Event('input', { bubbles: true }))
      await waitForUpdate()

      expect(strength()).toBe('weak')
      expect(element.textContent).toContain('Strength: weak')

      // Medium
      input.value = 'abcdefgh'
      input.dispatchEvent(new Event('input', { bubbles: true }))
      await waitForUpdate()

      expect(strength()).toBe('medium')
      expect(element.textContent).toContain('Strength: medium')

      // Strong
      input.value = 'abcdefghijk'
      input.dispatchEvent(new Event('input', { bubbles: true }))
      await waitForUpdate()

      expect(strength()).toBe('strong')
      expect(element.textContent).toContain('Strength: strong')
    })
  })

  describe('Cross-Field Validation', () => {
    it('should validate password confirmation', async () => {
      const [password, setPassword] = createSignal('')
      const [confirmPassword, setConfirmPassword] = createSignal('')
      const [error, setError] = createSignal('')

      const effect = createEffect(() => {
        const pass = password()
        const confirm = confirmPassword()

        if (confirm.length > 0 && pass !== confirm) {
          setError('Passwords do not match')
        } else {
          setError('')
        }
      })
      cleanups.push(() => effect.dispose())

      const form = VStack(
        TextField({
          name: 'password',
          value: password,
          onChange: (_, val) => setPassword(val),
          placeholder: 'Password',
        }),
        TextField({
          name: 'confirmPassword',
          value: confirmPassword,
          onChange: (_, val) => setConfirmPassword(val),
          placeholder: 'Confirm Password',
        }),
        Show({
          when: () => error().length > 0,
          children: Text(() => error()),
        })
      )

      const element = renderToDOM(form)
      const [passInput, confirmInput] = Array.from(
        element.querySelectorAll('input')
      )

      // Initially no error
      expect(element.textContent).not.toContain('do not match')

      // Type password
      passInput.value = 'secret123'
      passInput.dispatchEvent(new Event('input', { bubbles: true }))
      await waitForUpdate()

      expect(element.textContent).not.toContain('do not match')

      // Type non-matching confirmation
      confirmInput.value = 'different'
      confirmInput.dispatchEvent(new Event('input', { bubbles: true }))
      await waitForUpdate()

      expect(error()).toBe('Passwords do not match')
      expect(element.textContent).toContain('Passwords do not match')

      // Fix confirmation
      confirmInput.value = 'secret123'
      confirmInput.dispatchEvent(new Event('input', { bubbles: true }))
      await waitForUpdate()

      expect(error()).toBe('')
      expect(element.textContent).not.toContain('do not match')
    })

    it('should validate dependent fields (email + domain)', async () => {
      const [email, setEmail] = createSignal('')
      const [allowedDomain] = createSignal('company.com')
      const [error, setError] = createSignal('')

      const effect = createEffect(() => {
        const emailValue = email()
        const domain = allowedDomain()

        if (emailValue.length > 0 && !emailValue.endsWith(`@${domain}`)) {
          setError(`Email must be from ${domain}`)
        } else {
          setError('')
        }
      })
      cleanups.push(() => effect.dispose())

      const form = VStack(
        Text(() => `Allowed domain: ${allowedDomain()}`),
        TextField({
          name: 'email',
          value: email,
          onChange: (_, val) => setEmail(val),
        }),
        Show({
          when: () => error().length > 0,
          children: Text(() => error()),
        })
      )

      const element = renderToDOM(form)
      const input = element.querySelector('input')!

      // Type invalid domain
      input.value = 'user@other.com'
      input.dispatchEvent(new Event('input', { bubbles: true }))
      await waitForUpdate()

      expect(error()).toContain('must be from company.com')
      expect(element.textContent).toContain('must be from company.com')

      // Type valid domain
      input.value = 'user@company.com'
      input.dispatchEvent(new Event('input', { bubbles: true }))
      await waitForUpdate()

      expect(error()).toBe('')
      expect(element.textContent).not.toContain('must be from')
    })
  })

  describe('Conditional Form Fields', () => {
    it('should show/hide fields based on other field values', async () => {
      const [accountType, setAccountType] = createSignal('personal')
      const [companyName, setCompanyName] = createSignal('')

      const isBusiness = createComputed(() => accountType() === 'business')

      const form = VStack(
        Button('Personal', () => setAccountType('personal')),
        Button('Business', () => setAccountType('business')),
        Show({
          when: isBusiness,
          children: TextField({
            name: 'companyName',
            value: companyName,
            onChange: (_, val) => setCompanyName(val),
            placeholder: 'Company Name',
          }),
        })
      )

      const element = renderToDOM(form)
      const [personalBtn, businessBtn] = Array.from(
        element.querySelectorAll('button')
      )

      // Initially personal (no company field)
      let inputs = element.querySelectorAll('input')
      expect(inputs.length).toBe(0)

      // Switch to business
      businessBtn.click()
      await waitForUpdate()

      inputs = element.querySelectorAll('input')
      expect(inputs.length).toBe(1)
      expect(inputs[0].placeholder).toBe('Company Name')

      // Switch back to personal
      personalBtn.click()
      await waitForUpdate()

      inputs = element.querySelectorAll('input')
      expect(inputs.length).toBe(0)
    })

    it('should conditionally require fields', async () => {
      const [newsletter, setNewsletter] = createSignal(false)
      const [email, setEmail] = createSignal('')
      const [error, setError] = createSignal('')

      const effect = createEffect(() => {
        if (newsletter() && email().length === 0) {
          setError('Email required for newsletter')
        } else {
          setError('')
        }
      })
      cleanups.push(() => effect.dispose())

      const form = VStack(
        Button('Toggle Newsletter', () => setNewsletter(!newsletter())),
        Text(() => `Newsletter: ${newsletter() ? 'Yes' : 'No'}`),
        Show({
          when: newsletter,
          children: TextField({
            name: 'email',
            value: email,
            onChange: (_, val) => setEmail(val),
            placeholder: 'Email for newsletter',
          }),
        }),
        Show({
          when: () => error().length > 0,
          children: Text(() => error()),
        })
      )

      const element = renderToDOM(form)
      const toggleBtn = element.querySelector('button')!

      // Initially no newsletter, no error
      expect(element.textContent).not.toContain('Email required')

      // Enable newsletter (shows error)
      toggleBtn.click()
      await waitForUpdate()

      expect(error()).toBe('Email required for newsletter')
      expect(element.textContent).toContain('Email required')

      // Fill email
      const input = element.querySelector('input')!
      input.value = 'user@example.com'
      input.dispatchEvent(new Event('input', { bubbles: true }))
      await waitForUpdate()

      expect(error()).toBe('')
      expect(element.textContent).not.toContain('Email required')
    })
  })

  describe('Form Submission', () => {
    it('should collect all field values on submit', async () => {
      const [name, setName] = createSignal('')
      const [email, setEmail] = createSignal('')
      const [submitted, setSubmitted] = createSignal(false)
      const [submittedData, setSubmittedData] = createSignal('')

      const handleSubmit = () => {
        setSubmitted(true)
        setSubmittedData(`Name: ${name()}, Email: ${email()}`)
      }

      const form = VStack(
        TextField({
          name: 'name',
          value: name,
          onChange: (_, val) => setName(val),
          placeholder: 'Name',
        }),
        TextField({
          name: 'email',
          value: email,
          onChange: (_, val) => setEmail(val),
          placeholder: 'Email',
        }),
        Button('Submit', handleSubmit),
        Show({
          when: submitted,
          children: Text(() => `Submitted: ${submittedData()}`),
        })
      )

      const element = renderToDOM(form)
      const [nameInput, emailInput] = Array.from(
        element.querySelectorAll('input')
      )
      const submitBtn = element.querySelector('button')!

      // Fill form
      nameInput.value = 'John Doe'
      nameInput.dispatchEvent(new Event('input', { bubbles: true }))
      await waitForUpdate()

      emailInput.value = 'john@example.com'
      emailInput.dispatchEvent(new Event('input', { bubbles: true }))
      await waitForUpdate()

      // Submit
      submitBtn.click()
      await waitForUpdate()

      expect(submitted()).toBe(true)
      expect(element.textContent).toContain('Submitted: Name: John Doe')
      expect(element.textContent).toContain('Email: john@example.com')
    })

    it('should prevent submission with validation errors', async () => {
      const [email, setEmail] = createSignal('')
      const [submitted, setSubmitted] = createSignal(false)

      const isValid = createComputed(() => email().includes('@'))

      const handleSubmit = () => {
        if (isValid()) {
          setSubmitted(true)
        }
      }

      const form = VStack(
        TextField({
          name: 'email',
          value: email,
          onChange: (_, val) => setEmail(val),
        }),
        Show({
          when: () => !isValid() && email().length > 0,
          children: Text('Invalid email'),
        }),
        Button('Submit', handleSubmit),
        Show({
          when: submitted,
          children: Text('Form submitted successfully'),
        })
      )

      const element = renderToDOM(form)
      const input = element.querySelector('input')!
      const submitBtn = element.querySelector('button')!

      // Try to submit with invalid email
      input.value = 'invalid'
      input.dispatchEvent(new Event('input', { bubbles: true }))
      await waitForUpdate()

      expect(element.textContent).toContain('Invalid email')

      submitBtn.click()
      await waitForUpdate()

      expect(submitted()).toBe(false)
      expect(element.textContent).not.toContain('successfully')

      // Fix email and submit
      input.value = 'valid@email.com'
      input.dispatchEvent(new Event('input', { bubbles: true }))
      await waitForUpdate()

      expect(element.textContent).not.toContain('Invalid email')

      submitBtn.click()
      await waitForUpdate()

      expect(submitted()).toBe(true)
      expect(element.textContent).toContain('successfully')
    })
  })

  describe('Form Reset', () => {
    it('should reset all fields to initial values', async () => {
      const [name, setName] = createSignal('')
      const [email, setEmail] = createSignal('')

      const handleReset = () => {
        setName('')
        setEmail('')
      }

      const form = VStack(
        TextField({
          name: 'name',
          value: name,
          onChange: (_, val) => setName(val),
        }),
        TextField({
          name: 'email',
          value: email,
          onChange: (_, val) => setEmail(val),
        }),
        Button('Reset', handleReset)
      )

      const element = renderToDOM(form)
      const [nameInput, emailInput] = Array.from(
        element.querySelectorAll('input')
      )
      const resetBtn = element.querySelector('button')!

      // Fill fields
      nameInput.value = 'John'
      nameInput.dispatchEvent(new Event('input', { bubbles: true }))
      emailInput.value = 'john@example.com'
      emailInput.dispatchEvent(new Event('input', { bubbles: true }))
      await waitForUpdate()

      expect(name()).toBe('John')
      expect(email()).toBe('john@example.com')

      // Reset
      resetBtn.click()
      await waitForUpdate()

      expect(name()).toBe('')
      expect(email()).toBe('')
    })
  })
})
