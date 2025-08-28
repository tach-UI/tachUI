/**
 * Radio Button Component
 *
 * SwiftUI-inspired radio button with group management,
 * validation, and comprehensive accessibility support.
 */

import type { Component, ComponentInstance } from '@tachui/core'
import { createEffect, createSignal, h, text } from '@tachui/core'
import { createField } from '../../state'
import type { RadioProps } from '../../types'

/**
 * Individual Radio component
 */
export const Radio: Component<RadioProps> = (props) => {
  const {
    name,
    value,
    label,
    checked: controlledChecked,
    groupName,
    disabled = false,
    required = false,
    validation,
    onChange,
    onBlur,
    onFocus,
    error: externalError,
    helperText,
    ...restProps
  } = props

  // Get form context if available
  const formContext = (props as any)._formContext

  // For radio buttons, we use the group name or the name
  const fieldName = groupName || name

  // Create field state (shared across radio group)
  const field = createField(fieldName, controlledChecked ? value : undefined, validation)

  // Register field with form if form context exists
  if (formContext) {
    formContext.register(fieldName, validation)
  }

  const [focused, setFocused] = createSignal(false)

  // Determine if this radio is checked
  const isChecked = () => field.value() === value

  // Handle radio change
  const handleChange = (event: Event) => {
    const target = event.target as HTMLInputElement

    if (target.checked) {
      field.setValue(value)

      if (formContext) {
        formContext.setValue(fieldName, value)
      }

      if (onChange) {
        onChange(fieldName, value, field as any)
      }
    }
  }

  // Handle focus
  const handleFocus = (_event: Event) => {
    setFocused(true)
    field.onFocus()

    if (onFocus) {
      onFocus(fieldName, field.value())
    }
  }

  // Handle blur
  const handleBlur = (_event: Event) => {
    setFocused(false)
    field.onBlur()

    if (onBlur) {
      onBlur(fieldName, field.value())
    }
  }

  // Determine error message
  const errorMessage = externalError || field.error() || formContext?.getError(fieldName)

  // Handle keyboard interaction
  const handleKeyDown = (event: KeyboardEvent) => {
    // Arrow keys for radio group navigation would be handled at the group level
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault()
      handleChange(event)
    }
  }

  const componentInstance: ComponentInstance = {
    type: 'component',
    id: restProps.id || `radio-${fieldName}-${value}`,
    render: () =>
      h(
        'div',
        {
          ...restProps,
          class: `tachui-radio ${restProps.class || ''}`.trim(),
          'data-tachui-radio-container': true,
          'data-field-state': errorMessage ? 'error' : field.validating() ? 'validating' : 'valid',
          'data-checked': isChecked(),
          'data-disabled': disabled,
        },
        // Radio input and label wrapper
        h(
          'label',
          {
            'data-tachui-radio-label': true,
            'data-focused': focused(),
            'data-disabled': disabled,
          },
          // Hidden native radio for accessibility
          h('input', {
            type: 'radio',
            id: restProps.id || `${fieldName}-${value}`,
            name: fieldName,
            value: value,
            checked: isChecked(),
            disabled,
            required,
            onchange: handleChange,
            onfocus: handleFocus,
            onblur: handleBlur,
            onkeydown: handleKeyDown,
            'aria-invalid': !!errorMessage,
            'aria-describedby':
              [
                errorMessage ? `${fieldName}-error` : null,
                helperText ? `${fieldName}-helper` : null,
              ]
                .filter(Boolean)
                .join(' ') || undefined,
            'data-tachui-radio-input': true,
            style: {
              position: 'absolute',
              opacity: '0',
              width: '1px',
              height: '1px',
              margin: '-1px',
              padding: '0',
              border: '0',
              clip: 'rect(0,0,0,0)',
            },
          }),

          // Custom radio visual
          h(
            'div',
            {
              'data-tachui-radio-visual': true,
              'data-checked': isChecked(),
              'data-focused': focused(),
              'data-disabled': disabled,
              'data-error': !!errorMessage,
              'aria-hidden': 'true',
              role: 'presentation',
            },
            // Radio dot indicator
            ...(isChecked()
              ? [
                  h('div', {
                    'data-tachui-radio-dot': true,
                  }),
                ]
              : [])
          ),

          // Label text
          ...(label
            ? [
                h(
                  'span',
                  {
                    'data-tachui-radio-text': true,
                    'data-disabled': disabled,
                  },
                  text(label),
                  ...(required
                    ? [
                        h(
                          'span',
                          {
                            'aria-label': 'required',
                            'data-required-indicator': true,
                          },
                          text(' *')
                        ),
                      ]
                    : [])
                ),
              ]
            : [])
        )
      ),
    props: props,
    cleanup: [
      () => {
        // Only unregister if this is the last radio in the group
        // This would need more sophisticated group management
        // For now, we let the form handle cleanup
      },
    ],
  }

  return componentInstance
}

/**
 * RadioGroup component for managing multiple radio buttons
 */
export const RadioGroup: Component<{
  name: string
  label?: string
  options: Array<{
    value: any
    label: string
    disabled?: boolean
  }>
  value?: any
  defaultValue?: any
  onChange?: (name: string, value: any) => void
  validation?: any
  error?: string
  helperText?: string
  disabled?: boolean
  required?: boolean
  direction?: 'horizontal' | 'vertical'
  id?: string
  [key: string]: any
}> = (props) => {
  const {
    name,
    label,
    options,
    value: controlledValue,
    defaultValue,
    onChange,
    validation,
    error,
    helperText,
    disabled = false,
    required = false,
    direction = 'vertical',
    ...restProps
  } = props

  // Get form context if available
  const formContext = (props as any)._formContext

  // Create field state for the group
  const field = createField(name, controlledValue ?? defaultValue, validation)

  // Register field with form if form context exists
  if (formContext) {
    formContext.register(name, validation)
  }

  // Sync with controlled value
  if (controlledValue !== undefined) {
    createEffect(() => {
      if (field.value() !== controlledValue) {
        field.setValue(controlledValue)
      }
    })
  }

  // Handle radio selection change
  const handleRadioChange = (optionValue: any) => {
    field.setValue(optionValue)

    if (formContext) {
      formContext.setValue(name, optionValue)
    }

    if (onChange) {
      onChange(name, optionValue)
    }
  }

  // Keyboard navigation for radio group
  const handleKeyDown = (event: KeyboardEvent) => {
    const currentIndex = options.findIndex((opt) => opt.value === field.value())
    let nextIndex = currentIndex

    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        event.preventDefault()
        nextIndex = (currentIndex + 1) % options.length
        break
      case 'ArrowUp':
      case 'ArrowLeft':
        event.preventDefault()
        nextIndex = currentIndex === 0 ? options.length - 1 : currentIndex - 1
        break
      case 'Home':
        event.preventDefault()
        nextIndex = 0
        break
      case 'End':
        event.preventDefault()
        nextIndex = options.length - 1
        break
      default:
        return
    }

    // Skip disabled options
    while (options[nextIndex]?.disabled) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
        nextIndex = (nextIndex + 1) % options.length
      } else {
        nextIndex = nextIndex === 0 ? options.length - 1 : nextIndex - 1
      }

      // Prevent infinite loop
      if (nextIndex === currentIndex) break
    }

    if (!options[nextIndex]?.disabled) {
      handleRadioChange(options[nextIndex].value)

      // Focus the newly selected radio
      setTimeout(() => {
        const radioInput = document.querySelector(
          `input[name="${name}"][value="${options[nextIndex].value}"]`
        ) as HTMLInputElement
        if (radioInput) {
          radioInput.focus()
        }
      }, 0)
    }
  }

  const errorMessage = error || field.error()

  const componentInstance: ComponentInstance = {
    type: 'component',
    id: restProps.id || `radio-group-${name}`,
    render: () =>
      h(
        'fieldset',
        {
          ...restProps,
          'data-tachui-radio-group': true,
          'data-direction': direction,
          'data-disabled': disabled,
          role: 'radiogroup',
          'aria-invalid': !!errorMessage,
          'aria-describedby':
            [errorMessage ? `${name}-error` : null, helperText ? `${name}-helper` : null]
              .filter(Boolean)
              .join(' ') || undefined,
          onkeydown: handleKeyDown,
        },
        // Group label
        ...(label
          ? [
              h(
                'legend',
                {
                  'data-tachui-group-label': true,
                },
                text(label),
                ...(required
                  ? [
                      h(
                        'span',
                        {
                          'aria-label': 'required',
                          'data-required-indicator': true,
                        },
                        text(' *')
                      ),
                    ]
                  : [])
              ),
            ]
          : []),

        // Radio options
        h(
          'div',
          {
            'data-tachui-radio-options': true,
            'data-direction': direction,
          },
          ...options.flatMap((option, index) => {
            const radio = Radio({
              name: `${name}-${index}`,
              groupName: name,
              value: option.value,
              label: option.label,
              checked: field.value() === option.value,
              disabled: disabled || option.disabled,
              required,
              onChange: () => handleRadioChange(option.value),
              _formContext: formContext,
            })
            const result = radio.render()
            return Array.isArray(result) ? result : [result]
          })
        ),

        // Error message
        ...(errorMessage
          ? [
              h(
                'div',
                {
                  id: `${name}-error`,
                  role: 'alert',
                  'aria-live': 'polite',
                  'data-tachui-error': true,
                },
                text(errorMessage)
              ),
            ]
          : []),

        // Helper text
        ...(helperText && !errorMessage
          ? [
              h(
                'div',
                {
                  id: `${name}-helper`,
                  'data-tachui-helper': true,
                },
                text(helperText)
              ),
            ]
          : [])
      ),
    props: props,
    cleanup: [
      () => {
        if (formContext) {
          formContext.unregister(name)
        }
      },
    ],
  }

  return componentInstance
}
