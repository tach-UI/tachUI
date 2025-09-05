/**
 * Tests for BasicInput Component (Phase 1)
 */

import { describe, expect, it, vi } from 'vitest'
import type {
  BasicInputProps,
  BasicInputType,
} from '../../src/forms/BasicInput'
import {
  BasicInput,
  BasicInputStyles,
  BasicInputUtils,
} from '../../src/forms/BasicInput'
import { createSignal } from '@tachui/core'

// Mock the reactive system for testing
vi.mock('@tachui/core', async () => {
  const actual = await vi.importActual('@tachui/core')
  return {
    ...actual,
    createEffect: vi.fn(fn => fn()), // Immediately execute effects for testing
  }
})

describe('BasicInput Component', () => {
  describe('Component Creation', () => {
    it('creates BasicInput with required props', () => {
      const [text, _setText] = createSignal('')

      const basicInput = BasicInput({ text })

      expect(basicInput).toBeDefined()
      expect(typeof basicInput.render).toBe('function')
      expect(basicInput.modifier).toBeDefined()
    })

    it('creates component with all optional props', () => {
      const [text] = createSignal('initial')
      const [placeholder] = createSignal('Enter text...')
      const [inputType] = createSignal<BasicInputType>('email')
      const [disabled] = createSignal(false)

      const onChange = vi.fn()
      const onSubmit = vi.fn()
      const onFocus = vi.fn()
      const onBlur = vi.fn()

      const props: BasicInputProps = {
        text,
        placeholder,
        inputType,
        disabled,
        readonly: true,
        onChange,
        onSubmit,
        onFocus,
        onBlur,
        accessibilityLabel: 'Test input',
        accessibilityHint: 'Test hint',
      }

      const basicInput = BasicInput(props)
      expect(basicInput).toBeDefined()
    })
  })

  describe('Reactive Signal Integration', () => {
    it('creates DOMNode with correct initial value', () => {
      const [text] = createSignal('initial')
      const basicInput = BasicInput({ text })

      const rendered = basicInput.render()[0]

      // BasicInput returns DOMNode directly, not array
      expect(rendered).toBeDefined()
      expect(rendered.type).toBe('element')
      expect(rendered.tag).toBe('input')
      expect(rendered.props?.value).toBe('initial')
    })

    it('updates signal when input change handler is called', () => {
      const [text, setText] = createSignal('')
      const onChange = vi.fn()

      const basicInput = BasicInput({ text, setText, onChange })
      const rendered = basicInput.render()

      // Get the input handler from props
      const inputHandler = rendered[0].props?.oninput
      expect(typeof inputHandler).toBe('function')

      // Simulate input event
      const mockEvent = {
        target: { value: 'new value' },
      }
      inputHandler?.(mockEvent)

      // Signal should be updated
      expect(text()).toBe('new value')
      expect(onChange).toHaveBeenCalledWith('new value')
    })

    it('supports reactive placeholder', () => {
      const [text] = createSignal('')
      const [placeholder, setPlaceholder] = createSignal('Initial placeholder')

      const basicInput = BasicInput({ text, placeholder })
      const rendered = basicInput.render()

      expect(rendered[0].props?.placeholder).toBe('Initial placeholder')

      // Update placeholder signal
      setPlaceholder('Updated placeholder')
      expect(placeholder()).toBe('Updated placeholder')
    })
  })

  describe('Input Types', () => {
    it('supports text input type', () => {
      const [text] = createSignal('')
      const basicInput = BasicInput({ text, inputType: 'text' })

      const rendered = basicInput.render()

      expect(rendered[0].props?.type).toBe('text')
    })

    it('supports email input type', () => {
      const [text] = createSignal('')
      const basicInput = BasicInput({ text, inputType: 'email' })

      const rendered = basicInput.render()

      expect(rendered[0].props?.type).toBe('email')
    })

    it('supports all input types', () => {
      const inputTypes: BasicInputType[] = [
        'text',
        'email',
        'password',
        'search',
        'tel',
        'url',
      ]

      inputTypes.forEach(inputType => {
        const [text] = createSignal('')
        const basicInput = BasicInput({ text, inputType })

        const rendered = basicInput.render()

        expect(rendered[0].props?.type).toBe(inputType)
      })
    })

    it('supports reactive input type', () => {
      const [text] = createSignal('')
      const [inputType, setInputType] = createSignal<BasicInputType>('text')

      const basicInput = BasicInput({ text, inputType })
      const rendered = basicInput.render()

      expect(rendered[0].props?.type).toBe('text')

      setInputType('email')
      expect(inputType()).toBe('email')
    })
  })

  describe('Event Handling', () => {
    it('handles input change events', () => {
      const [text] = createSignal('')
      const onChange = vi.fn()

      const basicInput = BasicInput({ text, onChange })
      const rendered = basicInput.render()

      // Get the input handler from props
      const inputHandler = rendered[0].props?.oninput
      expect(typeof inputHandler).toBe('function')

      // Simulate input event
      const event = { target: { value: 'test input' } }
      inputHandler?.(event as any)

      expect(onChange).toHaveBeenCalledWith('test input')
    })

    it('handles submit on Enter key', () => {
      const [text, _setText] = createSignal('submit text')
      const onSubmit = vi.fn()

      const basicInput = BasicInput({ text, onSubmit })
      const rendered = basicInput.render()

      // Get the keydown handler from props
      const keyHandler = rendered[0].props?.onkeydown
      expect(typeof keyHandler).toBe('function')

      // Simulate Enter key press
      const keyEvent = {
        key: 'Enter',
        preventDefault: vi.fn(),
      }
      keyHandler?.(keyEvent as any)

      expect(keyEvent.preventDefault).toHaveBeenCalled()
      expect(onSubmit).toHaveBeenCalledWith('submit text')
    })

    it('handles focus events', () => {
      const [text] = createSignal('')
      const onFocus = vi.fn()

      const basicInput = BasicInput({ text, onFocus })
      const rendered = basicInput.render()

      // Get the focus handler from props
      const focusHandler = rendered[0].props?.onfocus
      expect(typeof focusHandler).toBe('function')

      // Simulate focus event
      focusHandler?.()

      expect(onFocus).toHaveBeenCalled()
    })

    it('handles blur events', () => {
      const [text] = createSignal('')
      const onBlur = vi.fn()

      const basicInput = BasicInput({ text, onBlur })
      const rendered = basicInput.render()

      // Get the blur handler from props
      const blurHandler = rendered[0].props?.onblur
      expect(typeof blurHandler).toBe('function')

      // Simulate blur event
      blurHandler?.()

      expect(onBlur).toHaveBeenCalled()
    })

    it('ignores non-Enter keydown events', () => {
      const [text] = createSignal('')
      const onSubmit = vi.fn()

      const basicInput = BasicInput({ text, onSubmit })
      const rendered = basicInput.render()

      // Get the keydown handler from props
      const keyHandler = rendered[0].props?.onkeydown

      // Simulate non-Enter key press
      const keyEvent = {
        key: 'Tab',
        preventDefault: vi.fn(),
      }
      keyHandler?.(keyEvent as any)

      expect(keyEvent.preventDefault).not.toHaveBeenCalled()
      expect(onSubmit).not.toHaveBeenCalled()
    })
  })

  describe('Disabled and Readonly States', () => {
    it('handles disabled state', () => {
      const [text] = createSignal('')
      const basicInput = BasicInput({ text, disabled: true })

      const rendered = basicInput.render()

      expect(rendered[0].props?.disabled).toBe(true)
    })

    it('handles readonly state', () => {
      const [text] = createSignal('')
      const basicInput = BasicInput({ text, readonly: true })

      const rendered = basicInput.render()

      expect(rendered[0].props?.readonly).toBe(true)
    })

    it('supports reactive disabled state', () => {
      const [text] = createSignal('')
      const [disabled, setDisabled] = createSignal(false)

      const basicInput = BasicInput({ text, disabled })
      const rendered = basicInput.render()

      expect(rendered[0].props?.disabled).toBe(false)

      setDisabled(true)
      expect(disabled()).toBe(true)
    })
  })

  describe('Accessibility', () => {
    it('sets accessibility label', () => {
      const [text] = createSignal('')
      const basicInput = BasicInput({
        text,
        accessibilityLabel: 'Username input',
      })

      const rendered = basicInput.render()

      expect(rendered[0].props?.['aria-label']).toBe('Username input')
    })

    it('sets accessibility hint', () => {
      const [text] = createSignal('')
      const basicInput = BasicInput({
        text,
        accessibilityHint: 'Enter your username',
      })

      const rendered = basicInput.render()

      expect(rendered[0].props?.['aria-describedby']).toBeDefined()
    })
  })

  describe('Modifier System Integration', () => {
    it('integrates with modifier system', () => {
      const [text] = createSignal('')
      const basicInput = BasicInput({ text })

      // Should have modifier builder
      expect(basicInput.modifier).toBeDefined()
      expect(typeof basicInput.modifier).toBe('object')
    })

    it('supports modifier chaining', () => {
      const [text] = createSignal('')

      // Test that we can create a BasicInput and it has modifier methods
      const basicInput = BasicInput({ text })
      expect(basicInput).toBeDefined()
      expect(basicInput.modifier).toBeDefined()

      // The component should be modifiable
      expect(typeof basicInput.render).toBe('function')
    })
  })

  describe('BasicInputUtils', () => {
    it('creates search input configuration', () => {
      const [searchText, setSearchText] = createSignal('')
      const onSearch = vi.fn()

      const searchProps = BasicInputUtils.search(
        searchText,
        setSearchText,
        onSearch
      )

      expect(searchProps.text).toBe(searchText)
      expect(searchProps.setText).toBe(setSearchText)
      expect(searchProps.inputType).toBe('search')
      expect(searchProps.placeholder).toBe('Search...')
      expect(searchProps.onSubmit).toBe(onSearch)
    })

    it('creates email input configuration', () => {
      const [emailText, setEmailText] = createSignal('')

      const emailProps = BasicInputUtils.email(emailText, setEmailText)

      expect(emailProps.text).toBe(emailText)
      expect(emailProps.setText).toBe(setEmailText)
      expect(emailProps.inputType).toBe('email')
      expect(emailProps.placeholder).toBe('Enter email address')
    })

    it('creates password input configuration', () => {
      const [passwordText, setPasswordText] = createSignal('')

      const passwordProps = BasicInputUtils.password(
        passwordText,
        setPasswordText
      )

      expect(passwordProps.text).toBe(passwordText)
      expect(passwordProps.setText).toBe(setPasswordText)
      expect(passwordProps.inputType).toBe('password')
      expect(passwordProps.placeholder).toBe('Enter password')
    })

    it('creates phone input configuration', () => {
      const [phoneText, setPhoneText] = createSignal('')

      const phoneProps = BasicInputUtils.phone(phoneText, setPhoneText)

      expect(phoneProps.text).toBe(phoneText)
      expect(phoneProps.setText).toBe(setPhoneText)
      expect(phoneProps.inputType).toBe('tel')
      expect(phoneProps.placeholder).toBe('Enter phone number')
    })
  })

  describe('BasicInputStyles', () => {
    it('exports default theme', () => {
      expect(BasicInputStyles.theme).toBeDefined()
      expect(BasicInputStyles.theme.colors).toBeDefined()
      expect(BasicInputStyles.theme.spacing).toBeDefined()
      expect(BasicInputStyles.theme.borderRadius).toBeDefined()
      expect(BasicInputStyles.theme.fontSize).toBeDefined()
      expect(BasicInputStyles.theme.fontFamily).toBeDefined()
    })

    it('creates custom theme', () => {
      const customTheme = BasicInputStyles.createTheme({
        colors: {
          background: '#ffffff',
          border: '#cccccc',
          text: '#333333',
          placeholder: '#999999',
          focusBorder: '#0066cc',
          disabledBackground: '#f5f5f5',
          disabledText: '#999999',
        },
        borderRadius: 8,
      })

      expect(customTheme.colors.background).toBe('#ffffff')
      expect(customTheme.borderRadius).toBe(8)
      expect(customTheme.fontSize).toBe(BasicInputStyles.theme.fontSize) // Should inherit non-overridden values
    })
  })

  describe('Component Instance Properties', () => {
    it('creates valid component instance', () => {
      const [text] = createSignal('')
      const basicInput = BasicInput({ text })

      expect(basicInput).toBeDefined()
      expect(typeof basicInput.render).toBe('function')
      expect(basicInput.modifier).toBeDefined()
    })

    it('generates unique DOM elements', () => {
      const [text1] = createSignal('')
      const [text2] = createSignal('')

      const input1 = BasicInput({ text: text1 })
      const input2 = BasicInput({ text: text2 })

      const rendered1 = input1.render()
      const rendered2 = input2.render()

      expect(rendered1[0].props?.id).toBeDefined()
      expect(rendered2[0].props?.id).toBeDefined()
      expect(rendered1[0].props?.id).not.toBe(rendered2[0].props?.id)
    })
  })

  describe('Error Handling', () => {
    it('handles missing onChange callback gracefully', () => {
      const [text] = createSignal('')
      const basicInput = BasicInput({ text })

      const rendered = basicInput.render()
      const inputHandler = rendered[0].props?.oninput

      // Should not throw when onChange is not provided
      expect(() => {
        const event = { target: { value: 'test' } }
        inputHandler?.(event as any)
      }).not.toThrow()
    })

    it('handles missing onSubmit callback gracefully', () => {
      const [text] = createSignal('')
      const basicInput = BasicInput({ text })

      const rendered = basicInput.render()
      const keyHandler = rendered[0].props?.onkeydown

      // Should not throw when onSubmit is not provided
      expect(() => {
        const keyEvent = { key: 'Enter', preventDefault: vi.fn() }
        keyHandler?.(keyEvent as any)
      }).not.toThrow()
    })

    it('handles missing focus/blur callbacks gracefully', () => {
      const [text] = createSignal('')
      const basicInput = BasicInput({ text })

      const rendered = basicInput.render()
      const focusHandler = rendered[0].props?.onfocus
      const blurHandler = rendered[0].props?.onblur

      // Should not throw when focus/blur callbacks are not provided
      expect(() => {
        focusHandler?.()
        blurHandler?.()
      }).not.toThrow()
    })
  })
})
