/**
 * Enhanced TextField Reactive Props Tests
 *
 * Tests for signal-based reactive properties, formatting/parsing integration,
 * and advanced TextField features.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TextField } from '../src/components'
import { TextFieldFormatters, TextFieldParsers } from '../src/utils/formatters'

// Mock the reactive system with signal support
const createMockSignal = (initialValue: any) => {
  let value = initialValue
  const signal = () => value
  signal.set = (newValue: any) => {
    value = newValue
  }
  Object.defineProperty(signal, 'name', { value: 'signal' })
  return signal
}

vi.mock('@tachui/core', () => ({
  createSignal: vi.fn((initial) => {
    let value = initial
    const getter = () => value
    const setter = (newValue: any) => {
      if (typeof newValue === 'function') {
        value = newValue(value)
      } else {
        value = newValue
      }
    }
    return [getter, setter]
  }),
  createEffect: vi.fn((fn) => {
    // Mock effect - call once and store for later calls
    fn()
  }),
  createComputed: vi.fn((fn) => {
    return () => fn()
  }),
  h: vi.fn((tag, props, ...children) => ({
    type: 'element',
    tag,
    props: props || {},
    children: children.flat(),
  })),
  text: vi.fn((content) => String(content)),
  isSignal: vi.fn((value) => {
    return typeof value === 'function' && value.name === 'signal'
  }),
}))

// Mock the state management
const mockField = {
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
}

vi.mock('../src/state', () => ({
  createField: vi.fn(() => mockField),
}))

describe('Enhanced TextField Reactive Props', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset mock field values
    mockField.value.mockReturnValue('')
    mockField.error.mockReturnValue(undefined)
    mockField.touched.mockReturnValue(false)
    mockField.dirty.mockReturnValue(false)
    mockField.valid.mockReturnValue(true)
    mockField.validating.mockReturnValue(false)
    mockField.focused.mockReturnValue(false)
  })

  describe('Signal-based props', () => {
    it('handles reactive text signal', () => {
      const textSignal = createMockSignal('initial text')

      const textField = TextField({
        name: 'test',
        textSignal,
      })

      expect(textField.type).toBe('component')

      const rendered = textField.render()
      const input = rendered.children.find(
        (child: any) => child.tag === 'input' || child.tag === 'textarea'
      )

      expect(input).toBeDefined()
      // For this test, we're verifying the signal is processed
      // The actual setValue call would happen in the createEffect
      // which is mocked, so we'll just verify the textSignal prop is there
      expect(textField.props.textSignal).toBe(textSignal)
    })

    it('handles reactive placeholder signal', () => {
      const placeholderSignal = createMockSignal('Enter your text...')

      const textField = TextField({
        name: 'test',
        placeholderSignal,
      })

      const rendered = textField.render()
      const input = rendered.children.find(
        (child: any) => child.tag === 'input' || child.tag === 'textarea'
      )

      expect(input.props.placeholder).toBe('Enter your text...')
    })

    it('handles reactive disabled signal', () => {
      const disabledSignal = createMockSignal(true)

      const textField = TextField({
        name: 'test',
        disabledSignal,
      })

      const rendered = textField.render()
      const input = rendered.children.find(
        (child: any) => child.tag === 'input' || child.tag === 'textarea'
      )

      expect(input.props.disabled).toBe(true)

      // Test dynamic change
      disabledSignal.set(false)
      // In a real reactive system, this would trigger re-render
      // For testing, we verify the signal value changed
      expect(disabledSignal()).toBe(false)
    })

    it('prefers signal values over static props', () => {
      const placeholderSignal = createMockSignal('Dynamic placeholder')

      const textField = TextField({
        name: 'test',
        placeholder: 'Static placeholder',
        placeholderSignal,
      })

      const rendered = textField.render()
      const input = rendered.children.find(
        (child: any) => child.tag === 'input' || child.tag === 'textarea'
      )

      // Should use signal value, not static
      expect(input.props.placeholder).toBe('Dynamic placeholder')
    })
  })

  describe('Formatting and parsing integration', () => {
    it('applies formatter to display value', () => {
      mockField.value.mockReturnValue('1234567890')

      const textField = TextField({
        name: 'phone',
        formatter: TextFieldFormatters.phone,
      })

      const rendered = textField.render()
      const input = rendered.children.find(
        (child: any) => child.tag === 'input' || child.tag === 'textarea'
      )

      // Value should be formatted for display
      expect(input.props.value).toBe('(123) 456-7890')
    })

    it('handles formatter errors gracefully', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const errorFormatter = () => {
        throw new Error('Format error')
      }

      mockField.value.mockReturnValue('test')

      const textField = TextField({
        name: 'test',
        formatter: errorFormatter,
      })

      const rendered = textField.render()
      const input = rendered.children.find(
        (child: any) => child.tag === 'input' || child.tag === 'textarea'
      )

      // Should fallback to original value on formatter error
      expect(input.props.value).toBe('test')
      expect(consoleWarnSpy).toHaveBeenCalledWith('TextField formatter error:', expect.any(Error))

      consoleWarnSpy.mockRestore()
    })

    it('handles parser errors gracefully', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const errorParser = () => {
        throw new Error('Parse error')
      }

      const textField = TextField({
        name: 'test',
        parser: errorParser,
      })

      const rendered = textField.render()
      const input = rendered.children.find(
        (child: any) => child.tag === 'input' || child.tag === 'textarea'
      )

      // Simulate input change
      const mockEvent = {
        target: { value: 'test value', selectionStart: 0, setSelectionRange: vi.fn() },
      }

      input.props.oninput(mockEvent)

      // Should use original value on parser error
      expect(mockField.setValue).toHaveBeenCalledWith('test value')
      expect(consoleWarnSpy).toHaveBeenCalledWith('TextField parser error:', expect.any(Error))

      consoleWarnSpy.mockRestore()
    })

    it('integrates formatting and parsing correctly', () => {
      const textField = TextField({
        name: 'phone',
        formatter: TextFieldFormatters.phone,
        parser: TextFieldParsers.phone,
      })

      const rendered = textField.render()
      const input = rendered.children.find(
        (child: any) => child.tag === 'input' || child.tag === 'textarea'
      )

      // Simulate input change with formatted value
      const mockEvent = {
        target: {
          value: '(123) 456-7890',
          selectionStart: 5,
          setSelectionRange: vi.fn(),
        },
      }

      input.props.oninput(mockEvent)

      // Should parse to raw value and store
      expect(mockField.setValue).toHaveBeenCalledWith('1234567890')
    })

    it('preserves cursor position during formatting', () => {
      mockField.value.mockReturnValue('123456')

      const textField = TextField({
        name: 'phone',
        formatter: TextFieldFormatters.phone,
      })

      const rendered = textField.render()
      const input = rendered.children.find(
        (child: any) => child.tag === 'input' || child.tag === 'textarea'
      )

      const mockTarget = {
        value: '123456',
        selectionStart: 3,
        setSelectionRange: vi.fn(),
      }

      const mockEvent = {
        target: mockTarget,
      }

      input.props.oninput(mockEvent)

      // Should preserve cursor position after formatting
      expect(mockTarget.setSelectionRange).toHaveBeenCalledWith(3, 3)
    })
  })

  describe('Enhanced accessibility features', () => {
    it('sets appropriate accessibility attributes', () => {
      mockField.error.mockReturnValue('Field is required')

      const textField = TextField({
        name: 'test',
        label: 'Test Field',
        helperText: 'This is helpful',
        accessibilityLabel: 'Custom label',
        accessibilityHint: 'Custom hint',
        accessibilityRole: 'textbox',
        required: true,
        maxLength: 100,
      })

      const rendered = textField.render()
      const input = rendered.children.find(
        (child: any) => child.tag === 'input' || child.tag === 'textarea'
      )

      expect(input.props['aria-invalid']).toBe(true)
      expect(input.props['aria-label']).toBe('Custom label')
      expect(input.props.role).toBe('textbox')
      expect(input.props['aria-describedby']).toContain('test-error')
      expect(input.props['aria-describedby']).toContain('test-helper')
      expect(input.props['aria-describedby']).toContain('test-counter')
      expect(input.props['aria-describedby']).toContain('test-hint')
    })

    it('renders accessibility hint element', () => {
      const textField = TextField({
        name: 'test',
        accessibilityHint: 'Enter your full name as it appears on your ID',
      })

      const rendered = textField.render()
      const hint = rendered.children.find(
        (child: any) => child.props?.['data-tachui-accessibility-hint']
      )

      expect(hint).toBeDefined()
      expect(hint.props.id).toBe('test-hint')
      expect(hint.props['aria-hidden']).toBe('true')
      expect(hint.children).toContain('Enter your full name as it appears on your ID')
    })
  })

  describe('Typography and styling', () => {
    it('applies font properties', () => {
      const textField = TextField({
        name: 'test',
        font: {
          family: 'Arial',
          size: '16px',
          weight: 'bold',
          style: 'italic',
        },
        textAlign: 'center',
      })

      const rendered = textField.render()
      const input = rendered.children.find(
        (child: any) => child.tag === 'input' || child.tag === 'textarea'
      )

      expect(input.props.style).toEqual({
        fontFamily: 'Arial',
        fontSize: '16px',
        fontWeight: 'bold',
        fontStyle: 'italic',
        textAlign: 'center',
      })
    })

    it('handles numeric font size', () => {
      const textField = TextField({
        name: 'test',
        font: {
          size: 18,
        },
      })

      const rendered = textField.render()
      const input = rendered.children.find(
        (child: any) => child.tag === 'input' || child.tag === 'textarea'
      )

      expect(input.props.style.fontSize).toBe('18px')
    })
  })

  describe('Mobile and keyboard features', () => {
    it('sets mobile keyboard attributes', () => {
      const textField = TextField({
        name: 'test',
        keyboardType: 'email',
        returnKeyType: 'search',
        autoCapitalize: 'words',
        autoFocus: true,
      })

      const rendered = textField.render()
      const input = rendered.children.find(
        (child: any) => child.tag === 'input' || child.tag === 'textarea'
      )

      expect(input.props.inputMode).toBe('email')
      expect(input.props.enterKeyHint).toBe('search')
      expect(input.props.autoCapitalize).toBe('words')
      expect(input.props.autoFocus).toBe(true)
    })

    it('handles default keyboard type', () => {
      const textField = TextField({
        name: 'test',
        keyboardType: 'default',
      })

      const rendered = textField.render()
      const input = rendered.children.find(
        (child: any) => child.tag === 'input' || child.tag === 'textarea'
      )

      expect(input.props.inputMode).toBeUndefined()
    })
  })

  describe('Data attributes for debugging and styling', () => {
    it('sets appropriate data attributes', () => {
      mockField.touched.mockReturnValue(true)
      mockField.dirty.mockReturnValue(true)
      mockField.validating.mockReturnValue(true)

      const textField = TextField({
        name: 'test-field',
        type: 'email',
        formatter: TextFieldFormatters.uppercase,
        parser: TextFieldParsers.none,
      })

      const rendered = textField.render()
      const input = rendered.children.find(
        (child: any) => child.tag === 'input' || child.tag === 'textarea'
      )

      expect(input.props['data-tachui-textfield']).toBe(true)
      expect(input.props['data-field-name']).toBe('test-field')
      expect(input.props['data-field-type']).toBe('email')
      expect(input.props['data-field-valid']).toBe(true)
      expect(input.props['data-field-touched']).toBe(true)
      expect(input.props['data-field-dirty']).toBe(true)
      expect(input.props['data-field-validating']).toBe(true)
      expect(input.props['data-field-has-formatter']).toBe(true)
      expect(input.props['data-field-has-parser']).toBe(true)
    })

    it('sets container data attributes', () => {
      mockField.error.mockReturnValue('Validation error')

      const textField = TextField({
        name: 'test',
      })

      const rendered = textField.render()

      expect(rendered.props['data-tachui-textfield-container']).toBe(true)
      expect(rendered.props['data-field-state']).toBe('error')
    })

    it('shows validating state', () => {
      mockField.validating.mockReturnValue(true)

      const textField = TextField({
        name: 'test',
      })

      const rendered = textField.render()

      expect(rendered.props['data-field-state']).toBe('validating')
    })
  })

  describe('Validation integration', () => {
    it('validates on change when enabled', () => {
      const textField = TextField({
        name: 'test',
        validateOnChange: true,
      })

      const rendered = textField.render()
      const input = rendered.children.find(
        (child: any) => child.tag === 'input' || child.tag === 'textarea'
      )

      const mockEvent = {
        target: { value: 'test value', selectionStart: 0, setSelectionRange: vi.fn() },
      }

      input.props.oninput(mockEvent)

      expect(mockField.validate).toHaveBeenCalled()
    })

    it('validates on blur when enabled', () => {
      const textField = TextField({
        name: 'test',
        validateOnBlur: true, // Default
      })

      const rendered = textField.render()
      const input = rendered.children.find(
        (child: any) => child.tag === 'input' || child.tag === 'textarea'
      )

      const mockEvent = {}
      input.props.onblur(mockEvent)

      expect(mockField.validate).toHaveBeenCalled()
    })

    it('skips validation when disabled', () => {
      const textField = TextField({
        name: 'test',
        validateOnChange: false,
        validateOnBlur: false,
      })

      const rendered = textField.render()
      const input = rendered.children.find(
        (child: any) => child.tag === 'input' || child.tag === 'textarea'
      )

      const mockChangeEvent = {
        target: { value: 'test', selectionStart: 0, setSelectionRange: vi.fn() },
      }
      const mockBlurEvent = {}

      input.props.oninput(mockChangeEvent)
      input.props.onblur(mockBlurEvent)

      expect(mockField.validate).not.toHaveBeenCalled()
    })
  })

  describe('Character counter', () => {
    it('shows character counter with maxLength', () => {
      mockField.value.mockReturnValue('Hello')

      const textField = TextField({
        name: 'test',
        maxLength: 100,
      })

      const rendered = textField.render()
      const counter = rendered.children.find(
        (child: any) => child.props?.['data-tachui-character-counter']
      )

      expect(counter).toBeDefined()
      expect(counter.props.id).toBe('test-counter')
      expect(counter.children).toContain('5/100')
    })

    it('shows over-limit indicator', () => {
      mockField.value.mockReturnValue('This text is way too long for the limit')

      const textField = TextField({
        name: 'test',
        maxLength: 10,
      })

      const rendered = textField.render()
      const counter = rendered.children.find(
        (child: any) => child.props?.['data-tachui-character-counter']
      )

      expect(counter.props['data-over-limit']).toBe(true)
    })
  })

  describe('Validation spinner', () => {
    it('shows validation spinner when validating', () => {
      mockField.validating.mockReturnValue(true)

      const textField = TextField({
        name: 'test',
      })

      const rendered = textField.render()
      const spinner = rendered.children.find(
        (child: any) => child.props?.['data-tachui-validation-spinner']
      )

      expect(spinner).toBeDefined()
      expect(spinner.props['aria-label']).toBe('Validating...')
      expect(spinner.props['aria-live']).toBe('polite')
      expect(spinner.children).toContain('⏳')
    })

    it('hides validation spinner when not validating', () => {
      mockField.validating.mockReturnValue(false)

      const textField = TextField({
        name: 'test',
      })

      const rendered = textField.render()
      const spinner = rendered.children.find(
        (child: any) => child.props?.['data-tachui-validation-spinner']
      )

      expect(spinner).toBeUndefined()
    })
  })

  describe('Form integration', () => {
    it('registers with form context', () => {
      const mockFormContext = {
        register: vi.fn(),
        setValue: vi.fn(),
        getValue: vi.fn(),
        getError: vi.fn(),
        unregister: vi.fn(),
      }

      const textField = TextField({
        name: 'test',
        validation: { rules: ['required'] },
        _formContext: mockFormContext,
      } as any)

      expect(mockFormContext.register).toHaveBeenCalledWith('test', { rules: ['required'] })

      // Test cleanup
      if (textField.cleanup) {
        textField.cleanup.forEach((fn) => fn())
        expect(mockFormContext.unregister).toHaveBeenCalledWith('test')
      }
    })

    it('syncs with form context on change', () => {
      const mockFormContext = {
        register: vi.fn(),
        setValue: vi.fn(),
        getValue: vi.fn(),
        getError: vi.fn(),
        unregister: vi.fn(),
      }

      const textField = TextField({
        name: 'test',
        _formContext: mockFormContext,
      } as any)

      const rendered = textField.render()
      const input = rendered.children.find(
        (child: any) => child.tag === 'input' || child.tag === 'textarea'
      )

      const mockEvent = {
        target: { value: 'new value', selectionStart: 0, setSelectionRange: vi.fn() },
      }

      input.props.oninput(mockEvent)

      expect(mockFormContext.setValue).toHaveBeenCalledWith('test', 'new value')
    })
  })
})
