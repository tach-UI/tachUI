/**
 * Select/Picker Component
 *
 * SwiftUI-inspired select component with search, multiple selection,
 * async options loading, and comprehensive accessibility support.
 */

import type { Component, ComponentInstance } from '@tachui/core'
import {
  createEffect,
  createSignal,
  h,
  text,
  useLifecycle,
  setupOutsideClickDetection,
} from '@tachui/core'
import { createField } from '../../state'
import type { SelectOption, SelectProps } from '../../types'

/**
 * Select component implementation
 */
export const Select: Component<SelectProps> = props => {
  const {
    name,
    label,
    options,
    multiple = false,
    searchable = false,
    clearable = false,
    placeholder = multiple ? 'Select options...' : 'Select an option...',
    noOptionsMessage = 'No options available',
    loadingMessage = 'Loading...',
    maxMenuHeight = 200,
    disabled = false,
    required = false,
    value: controlledValue,
    defaultValue,
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
  const field = createField(name, controlledValue ?? defaultValue, validation)

  // Register field with form if form context exists
  if (formContext) {
    formContext.register(name, validation)
  }

  const [isOpen, setIsOpen] = createSignal(false)
  const [focused, setFocused] = createSignal(false)
  const [searchQuery, setSearchQuery] = createSignal('')
  const [highlightedIndex, setHighlightedIndex] = createSignal(-1)
  const [loading] = createSignal(false)

  // Sync with controlled value
  if (controlledValue !== undefined) {
    createEffect(() => {
      if (field.value() !== controlledValue) {
        field.setValue(controlledValue)
      }
    })
  }

  // Filter options based on search query
  const filteredOptions = () => {
    if (!searchable || !searchQuery()) {
      return options
    }

    const query = searchQuery().toLowerCase()
    return options.filter(
      option =>
        option.label.toLowerCase().includes(query) ||
        String(option.value).toLowerCase().includes(query)
    )
  }

  // Get display value for selected option(s)
  const getDisplayValue = () => {
    const value = field.value()

    if (multiple) {
      if (!value || !Array.isArray(value) || value.length === 0) {
        return placeholder
      }

      const selectedOptions = options.filter(opt => value.includes(opt.value))
      return selectedOptions.map(opt => opt.label).join(', ')
    } else {
      if (value === null || value === undefined || value === '') {
        return placeholder
      }

      const selectedOption = options.find(opt => opt.value === value)
      return selectedOption ? selectedOption.label : String(value)
    }
  }

  // Handle option selection
  const handleOptionSelect = (option: SelectOption) => {
    if (option.disabled) return

    let newValue: any

    if (multiple) {
      const currentValue = field.value() || []
      if (currentValue.includes(option.value)) {
        newValue = currentValue.filter((v: any) => v !== option.value)
      } else {
        newValue = [...currentValue, option.value]
      }
    } else {
      newValue = option.value
      setIsOpen(false)
      setSearchQuery('')
    }

    field.setValue(newValue)

    if (formContext) {
      formContext.setValue(name, newValue)
    }

    if (onChange) {
      onChange(name, newValue, field as any)
    }
  }

  // Handle dropdown toggle
  const toggleDropdown = () => {
    if (disabled) return

    const newOpen = !isOpen()
    setIsOpen(newOpen)

    if (newOpen) {
      setHighlightedIndex(-1)
      if (searchable) {
        setSearchQuery('')
      }
    }
  }

  // Handle search input
  const handleSearch = (event: Event) => {
    const target = event.target as HTMLInputElement
    setSearchQuery(target.value)
    setHighlightedIndex(-1)
  }

  // Handle keyboard navigation
  const handleKeyDown = (event: KeyboardEvent) => {
    const filtered = filteredOptions()

    switch (event.key) {
      case 'Enter':
        event.preventDefault()
        if (!isOpen()) {
          toggleDropdown()
        } else if (highlightedIndex() >= 0 && filtered[highlightedIndex()]) {
          handleOptionSelect(filtered[highlightedIndex()])
        }
        break

      case ' ':
        if (!searchable || !isOpen()) {
          event.preventDefault()
          toggleDropdown()
        }
        break

      case 'Escape':
        event.preventDefault()
        setIsOpen(false)
        setSearchQuery('')
        break

      case 'ArrowDown':
        event.preventDefault()
        if (!isOpen()) {
          toggleDropdown()
        } else {
          const nextIndex = Math.min(
            highlightedIndex() + 1,
            filtered.length - 1
          )
          setHighlightedIndex(nextIndex)
        }
        break

      case 'ArrowUp':
        event.preventDefault()
        if (isOpen()) {
          const prevIndex = Math.max(highlightedIndex() - 1, -1)
          setHighlightedIndex(prevIndex)
        }
        break

      case 'Home':
        if (isOpen()) {
          event.preventDefault()
          setHighlightedIndex(0)
        }
        break

      case 'End':
        if (isOpen()) {
          event.preventDefault()
          setHighlightedIndex(filtered.length - 1)
        }
        break

      case 'Backspace':
        if (clearable && !searchable && field.value() !== null) {
          event.preventDefault()
          handleClear()
        }
        break
    }
  }

  // Handle focus
  const handleFocus = () => {
    setFocused(true)
    field.onFocus()

    if (onFocus) {
      onFocus(name, field.value())
    }
  }

  // Handle blur
  const handleBlur = (event: FocusEvent) => {
    // ENHANCED: Use requestAnimationFrame instead of setTimeout for better performance
    requestAnimationFrame(() => {
      const relatedTarget = event.relatedTarget as Element
      const container = (event.target as Element).closest(
        '[data-tachui-select-container]'
      )

      if (!container?.contains(relatedTarget)) {
        setFocused(false)
        setIsOpen(false)
        field.onBlur()

        if (onBlur) {
          onBlur(name, field.value())
        }
      }
    })
  }

  // Handle clear
  const handleClear = () => {
    const newValue = multiple ? [] : null
    field.setValue(newValue)

    if (formContext) {
      formContext.setValue(name, newValue)
    }

    if (onChange) {
      onChange(name, newValue, field as any)
    }
  }

  // Check if option is selected
  const isOptionSelected = (option: SelectOption) => {
    const value = field.value()

    if (multiple) {
      return Array.isArray(value) && value.includes(option.value)
    }

    return value === option.value
  }

  // Determine error message
  const errorMessage =
    externalError || field.error() || formContext?.getError(name)

  const componentInstance: ComponentInstance = {
    type: 'component',
    id: restProps.id || `select-${name}`,
    cleanup: [],
    render: () => ({
      type: 'element',
      tag: 'div',
      props: {
        ...restProps,
        class: `tachui-select ${restProps.class || ''}`.trim(),
        'data-tachui-select-container': true,
        'data-field-state': errorMessage
          ? 'error'
          : field.validating()
            ? 'validating'
            : 'valid',
        'data-open': isOpen(),
        'data-disabled': disabled,
        'data-multiple': multiple,
        'data-searchable': searchable,
      },
      children: [
        // Label
        ...(label
          ? [
              h(
                'label',
                {
                  for: restProps.id || name,
                  'data-tachui-label': true,
                  'data-required': required,
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

        // Select trigger
        {
          type: 'element' as const,
          tag: 'div',
          props: {
            id: restProps.id || name,
            tabindex: disabled ? -1 : 0,
            role: 'combobox',
            'aria-expanded': isOpen(),
            'aria-haspopup': 'listbox',
            'aria-invalid': !!errorMessage,
            'aria-describedby':
              [
                errorMessage ? `${name}-error` : null,
                helperText ? `${name}-helper` : null,
              ]
                .filter(Boolean)
                .join(' ') || undefined,
            onclick: toggleDropdown,
            onkeydown: handleKeyDown,
            onfocus: handleFocus,
            onblur: handleBlur,
            'data-tachui-select-trigger': true,
            'data-focused': focused(),
            'data-disabled': disabled,
            'data-error': !!errorMessage,
          },
          children: [
            // Display value
            {
              type: 'element' as const,
              tag: 'div',
              props: {
                'data-tachui-select-value': true,
                'data-placeholder':
                  !field.value() ||
                  (multiple && (!field.value() || field.value().length === 0)),
              },
              children: [text(getDisplayValue())],
            },

            // Actions (clear, dropdown arrow)
            {
              type: 'element' as const,
              tag: 'div',
              props: {
                'data-tachui-select-actions': true,
              },
              children: [
                // Clear button
                ...(clearable &&
                field.value() &&
                (!multiple ||
                  (Array.isArray(field.value()) && field.value().length > 0))
                  ? [
                      {
                        type: 'element' as const,
                        tag: 'button',
                        props: {
                          type: 'button',
                          onclick: (e: Event) => {
                            e.stopPropagation()
                            handleClear()
                          },
                          'aria-label': 'Clear selection',
                          'data-tachui-select-clear': true,
                        },
                        children: [text('×')],
                      },
                    ]
                  : []),

                // Dropdown arrow
                {
                  type: 'element' as const,
                  tag: 'div',
                  props: {
                    'data-tachui-select-arrow': true,
                    'data-open': isOpen(),
                  },
                  children: [text('▼')],
                },
              ],
            },
          ],
        },

        // Dropdown menu
        ...(isOpen()
          ? [
              {
                type: 'element' as const,
                tag: 'div',
                props: {
                  'data-tachui-select-dropdown': true,
                  style: {
                    maxHeight: `${maxMenuHeight}px`,
                  },
                },
                children: [
                  // Search input
                  ...(searchable
                    ? [
                        {
                          type: 'element' as const,
                          tag: 'div',
                          props: {
                            'data-tachui-select-search': true,
                          },
                          children: [
                            {
                              type: 'element' as const,
                              tag: 'input',
                              props: {
                                type: 'text',
                                placeholder: 'Search...',
                                value: searchQuery(),
                                oninput: handleSearch,
                                'data-tachui-select-search-input': true,
                              },
                            },
                          ],
                        },
                      ]
                    : []),

                  // Options list
                  {
                    type: 'element' as const,
                    tag: 'div',
                    props: {
                      role: 'listbox',
                      'aria-multiselectable': multiple,
                      'data-tachui-select-options': true,
                    },
                    children:
                      filteredOptions().length > 0
                        ? filteredOptions().map((option, index) => ({
                            type: 'element' as const,
                            tag: 'div',
                            props: {
                              role: 'option',
                              'aria-selected': isOptionSelected(option),
                              'aria-disabled': option.disabled,
                              onclick: () => handleOptionSelect(option),
                              'data-tachui-select-option': true,
                              'data-selected': isOptionSelected(option),
                              'data-highlighted': highlightedIndex() === index,
                              'data-disabled': option.disabled,
                              'data-group': option.group,
                            },
                            children: [
                              // Selection indicator for multiple
                              ...(multiple
                                ? [
                                    {
                                      type: 'element' as const,
                                      tag: 'div',
                                      props: {
                                        'data-tachui-select-checkbox': true,
                                        'data-checked':
                                          isOptionSelected(option),
                                      },
                                      children: [
                                        text(
                                          isOptionSelected(option) ? '✓' : ''
                                        ),
                                      ],
                                    },
                                  ]
                                : []),

                              // Option label
                              text(option.label),
                            ],
                          }))
                        : [
                            {
                              type: 'element' as const,
                              tag: 'div',
                              props: {
                                'data-tachui-select-no-options': true,
                              },
                              children: [
                                text(
                                  loading() ? loadingMessage : noOptionsMessage
                                ),
                              ],
                            },
                          ],
                  },
                ],
              },
            ]
          : []),

        // Error message
        ...(errorMessage
          ? [
              {
                type: 'element' as const,
                tag: 'div',
                props: {
                  id: `${name}-error`,
                  role: 'alert',
                  'aria-live': 'polite',
                  'data-tachui-error': true,
                },
                children: [text(errorMessage)],
              },
            ]
          : []),

        // Helper text
        ...(helperText && !errorMessage
          ? [
              {
                type: 'element' as const,
                tag: 'div',
                props: {
                  id: `${name}-helper`,
                  'data-tachui-helper': true,
                },
                children: [text(helperText)],
              },
            ]
          : []),
      ],
    }),
    props: props,
  }

  // Add form cleanup
  if (!componentInstance.cleanup) componentInstance.cleanup = []
  componentInstance.cleanup.push(() => {
    if (formContext) {
      formContext.unregister(name)
    }
  })

  // ENHANCED: Set up lifecycle hooks for improved click outside detection
  useLifecycle(componentInstance, {
    onDOMReady: (_elements, primaryElement) => {
      if (primaryElement) {
        // Set up enhanced outside click detection instead of relying on setTimeout blur
        setupOutsideClickDetection(
          componentInstance,
          () => {
            if (isOpen()) {
              setIsOpen(false)
              setFocused(false)
              field.onBlur()

              if (onBlur) {
                onBlur(name, field.value())
              }
            }
          },
          '[data-tachui-select-container]'
        )
      }
    },
  })

  return componentInstance
}

/**
 * MultiSelect variant for clearer multiple selection intent
 */
export const MultiSelect: Component<SelectProps> = props => {
  return Select({ ...props, multiple: true })
}

/**
 * Combobox variant with always-searchable behavior
 */
export const Combobox: Component<SelectProps> = props => {
  return Select({ ...props, searchable: true })
}
