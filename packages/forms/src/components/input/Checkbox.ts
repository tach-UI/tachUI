/**
 * Checkbox Component
 *
 * SwiftUI-inspired checkbox with support for indeterminate state,
 * validation, and accessibility features.
 */

import type { Component, ComponentInstance } from '@tachui/core'
import { createEffect, createSignal, h, text } from '@tachui/core'
import { createField } from '../../state'
import type { CheckboxProps } from '../../types'

/**
 * Checkbox component implementation
 */
export const Checkbox: Component<CheckboxProps> = (props) => {
  const {
    name,
    label,
    disabled = false,
    required = false,
    checked: controlledChecked,
    defaultChecked = false,
    indeterminate = false,
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

  // Create field state
  const field = createField(name, controlledChecked ?? defaultChecked, validation)

  // Register field with form if form context exists
  if (formContext) {
    formContext.register(name, validation)
  }

  const [focused, setFocused] = createSignal(false)

  // Sync with controlled value
  if (controlledChecked !== undefined) {
    createEffect(() => {
      if (field.value() !== controlledChecked) {
        field.setValue(controlledChecked)
      }
    })
  }

  // Handle checkbox change
  const handleChange = (event: Event) => {
    const target = event.target as HTMLInputElement
    const newChecked = target.checked

    field.setValue(newChecked)

    if (formContext) {
      formContext.setValue(name, newChecked)
    }

    if (onChange) {
      onChange(name, newChecked, field as any)
    }
  }

  // Handle focus
  const handleFocus = (_event: Event) => {
    setFocused(true)
    field.onFocus()

    if (onFocus) {
      onFocus(name, field.value())
    }
  }

  // Handle blur
  const handleBlur = (_event: Event) => {
    setFocused(false)
    field.onBlur()

    if (onBlur) {
      onBlur(name, field.value())
    }
  }

  // Determine error message
  const errorMessage = externalError || field.error() || formContext?.getError(name)

  // Handle keyboard interaction for custom styling
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault()
      const checkbox = event.target as HTMLInputElement
      checkbox.checked = !checkbox.checked
      handleChange(event)
    }
  }

  const componentInstance: ComponentInstance = {
    type: 'component',
    id: restProps.id || `checkbox-${name}`,
    render: () =>
      h(
        'div',
        {
          ...restProps,
          class: `tachui-checkbox ${restProps.class || ''}`.trim(),
          'data-tachui-checkbox-container': true,
          'data-field-state': errorMessage ? 'error' : field.validating() ? 'validating' : 'valid',
          'data-checked': field.value(),
          'data-indeterminate': indeterminate,
          'data-disabled': disabled,
        },
        // Checkbox input and label wrapper
        h(
          'label',
          {
            'data-tachui-checkbox-label': true,
            'data-focused': focused(),
            'data-disabled': disabled,
          },
          // Hidden native checkbox for accessibility
          h('input', {
            type: 'checkbox',
            id: restProps.id || name,
            name,
            checked: field.value(),
            disabled,
            required,
            onchange: handleChange,
            onfocus: handleFocus,
            onblur: handleBlur,
            onkeydown: handleKeyDown,
            'aria-invalid': !!errorMessage,
            'aria-describedby':
              [errorMessage ? `${name}-error` : null, helperText ? `${name}-helper` : null]
                .filter(Boolean)
                .join(' ') || undefined,
            'data-tachui-checkbox-input': true,
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

          // Custom checkbox visual
          h(
            'div',
            {
              'data-tachui-checkbox-visual': true,
              'data-checked': field.value(),
              'data-indeterminate': indeterminate,
              'data-focused': focused(),
              'data-disabled': disabled,
              'data-error': !!errorMessage,
              'aria-hidden': 'true',
              role: 'presentation',
            },
            // Checkmark or indeterminate indicator
            ...(field.value() || indeterminate
              ? [
                  h(
                    'div',
                    {
                      'data-tachui-checkbox-indicator': true,
                      'data-type': indeterminate ? 'indeterminate' : 'checked',
                    },
                    text(indeterminate ? '−' : '✓')
                  ),
                ]
              : [])
          ),

          // Label text
          ...(label
            ? [
                h(
                  'span',
                  {
                    'data-tachui-checkbox-text': true,
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
          : []),

        // Validation indicator
        ...(field.validating()
          ? [
              h(
                'div',
                {
                  'data-tachui-validation-spinner': true,
                  'aria-label': 'Validating...',
                },
                text('⏳')
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

/**
 * Switch/Toggle component variant of Checkbox
 */
export const Switch: Component<
  CheckboxProps & {
    size?: 'small' | 'medium' | 'large'
  }
> = (props) => {
  const { size = 'medium', ...checkboxProps } = props

  // Add switch-specific props
  const switchProps = {
    ...checkboxProps,
    class: `tachui-switch tachui-switch-${size} ${checkboxProps.class || ''}`.trim(),
  }

  const checkbox = Checkbox(switchProps)
  return {
    ...checkbox,
    render: () => {
      const result = checkbox.render()
      if (Array.isArray(result)) {
        return result.map((node) => ({
          ...node,
          props: {
            ...node.props,
            'data-tachui-switch': true,
            'data-switch-size': size,
          },
        }))
      }
      return {
        ...result,
        props: {
          ...result.props,
          'data-tachui-switch': true,
          'data-switch-size': size,
        },
      }
    },
  }
}

/**
 * CheckboxGroup component for managing multiple related checkboxes
 */
export const CheckboxGroup: Component<{
  name: string
  label?: string
  options: Array<{
    value: any
    label: string
    disabled?: boolean
  }>
  value?: any[]
  defaultValue?: any[]
  onChange?: (name: string, value: any[], selected: any) => void
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
    defaultValue = [],
    onChange,
    validation,
    error,
    helperText,
    disabled = false,
    required = false,
    direction = 'vertical',
    ...restProps
  } = props

  // Create field state for the group
  const field = createField(name, controlledValue ?? defaultValue, validation)

  // Handle individual checkbox changes
  const handleCheckboxChange = (optionValue: any, checked: boolean) => {
    const currentValue = field.value() || []
    let newValue: any[]

    if (checked) {
      newValue = [...currentValue, optionValue]
    } else {
      newValue = currentValue.filter((v: any) => v !== optionValue)
    }

    field.setValue(newValue)

    if (onChange) {
      onChange(name, newValue, optionValue)
    }
  }

  const componentInstance: ComponentInstance = {
    type: 'component',
    id: restProps.id || `checkbox-group-${name}`,
    render: () =>
      h(
        'fieldset',
        {
          ...restProps,
          'data-tachui-checkbox-group': true,
          'data-direction': direction,
          'data-disabled': disabled,
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

        // Checkbox options
        h(
          'div',
          {
            'data-tachui-checkbox-options': true,
            'data-direction': direction,
          },
          ...options.flatMap((option, index) => {
            const checkbox = Checkbox({
              name: `${name}-${index}`,
              label: option.label,
              checked: (field.value() || []).includes(option.value),
              disabled: disabled || option.disabled,
              onChange: (_, checked) => handleCheckboxChange(option.value, checked),
            })
            const result = checkbox.render()
            return Array.isArray(result) ? result : [result]
          })
        ),

        // Error message
        ...(error
          ? [
              h(
                'div',
                {
                  id: `${name}-error`,
                  role: 'alert',
                  'aria-live': 'polite',
                  'data-tachui-error': true,
                },
                text(error)
              ),
            ]
          : []),

        // Helper text
        ...(helperText && !error
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
  }

  return componentInstance
}
