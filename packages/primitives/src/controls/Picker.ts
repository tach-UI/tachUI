/**
 * Enhanced Picker Component (Phase 6.4.3)
 *
 * SwiftUI-inspired Picker component with dropdown, wheel, and segmented
 * variants for selecting from a list of options.
 */

import type {
  ModifiableComponent,
  ModifierBuilder,
} from '@tachui/core/modifiers/types'
import { createSignal, isSignal } from '@tachui/core/reactive'
import type { Signal } from '@tachui/core/reactive/types'
import { h, text } from '@tachui/core/runtime'
import type {
  ComponentInstance,
  ComponentProps,
} from '@tachui/core/runtime/types'
import { withModifiers } from '@tachui/core/components/wrapper'

/**
 * Picker option structure
 */
// biome-ignore lint/suspicious/noExplicitAny: Generic picker options require flexible type
export interface PickerOption<T = any> {
  value: T
  label: string
  disabled?: boolean
  icon?: string
  description?: string
}

/**
 * Picker component properties
 */
// biome-ignore lint/suspicious/noExplicitAny: Generic picker props require flexible type
export interface PickerProps<T = any> extends ComponentProps {
  // Selection
  selection: T | Signal<T>
  options: PickerOption<T>[] | Signal<PickerOption<T>[]>
  onSelectionChange?: (value: T) => void

  // Appearance
  variant?: 'dropdown' | 'wheel' | 'segmented' | 'menu'
  title?: string | (() => string) | Signal<string>
  placeholder?: string

  // Behavior
  multiple?: boolean
  searchable?: boolean
  clearable?: boolean
  disabled?: boolean | Signal<boolean>

  // Styling
  size?: 'small' | 'medium' | 'large'
  tint?: string

  // Accessibility
  accessibilityLabel?: string
  accessibilityHint?: string
}

/**
 * Enhanced Picker component class
 */
// biome-ignore lint/suspicious/noExplicitAny: Generic picker implementation requires flexible type
export class EnhancedPicker<T = any>
  implements ComponentInstance<PickerProps<T>>
{
  public readonly type = 'component' as const
  public readonly id: string
  public mounted = false
  public cleanup: (() => void)[] = []
  private isOpen: () => boolean
  private setIsOpen: (open: boolean) => boolean
  private searchTerm: () => string
  private setSearchTerm: (term: string) => string

  constructor(public props: PickerProps<T>) {
    this.id = `picker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Initialize internal state
    const [open, setOpen] = createSignal(false)
    const [search, setSearch] = createSignal('')
    this.isOpen = open
    this.setIsOpen = setOpen
    this.searchTerm = search
    this.setSearchTerm = setSearch

    // Close picker when clicking outside
    if (typeof window !== 'undefined') {
      const handleClickOutside = (event: MouseEvent) => {
        const element = document.getElementById(this.id)
        if (element && !element.contains(event.target as Node)) {
          this.setIsOpen(false)
        }
      }

      document.addEventListener('click', handleClickOutside)
      this.cleanup.push(() => {
        document.removeEventListener('click', handleClickOutside)
      })
    }
  }

  /**
   * Get current selection value
   */
  private getSelection(): T {
    const { selection } = this.props
    if (isSignal(selection)) {
      return (selection as () => T)()
    }
    return selection as T
  }

  /**
   * Get current options
   */
  private getOptions(): PickerOption<T>[] {
    const { options } = this.props
    if (isSignal(options)) {
      return (options as () => PickerOption<T>[])()
    }
    return options as PickerOption<T>[]
  }

  /**
   * Filter options based on search term
   */
  private getFilteredOptions(): PickerOption<T>[] {
    const options = this.getOptions()
    const search = this.searchTerm().toLowerCase()

    if (!search || !this.props.searchable) {
      return options
    }

    return options.filter(
      option =>
        option.label.toLowerCase().includes(search) ||
        option.description?.toLowerCase().includes(search)
    )
  }

  /**
   * Check if picker is disabled
   */
  private isDisabled(): boolean {
    const { disabled } = this.props
    if (typeof disabled === 'boolean') return disabled
    if (isSignal(disabled)) return (disabled as () => boolean)()
    return false
  }

  /**
   * Get selected option
   */
  private getSelectedOption(): PickerOption<T> | null {
    const selection = this.getSelection()
    const options = this.getOptions()
    return options.find(option => option.value === selection) || null
  }

  /**
   * Handle option selection
   */
  private handleSelection = (value: T) => {
    if (this.props.onSelectionChange) {
      this.props.onSelectionChange(value)
    }

    // Close dropdown after selection
    if (this.props.variant === 'dropdown' || this.props.variant === 'menu') {
      this.setIsOpen(false)
    }

    // Clear search term
    this.setSearchTerm('')
  }

  /**
   * Toggle picker open state
   */
  private toggleOpen = () => {
    if (!this.isDisabled()) {
      this.setIsOpen(!this.isOpen())
    }
  }

  /**
   * Get picker size styles
   */
  private getSizeStyles() {
    const { size = 'medium' } = this.props

    switch (size) {
      case 'small':
        return {
          fontSize: '14px',
          padding: '6px 12px',
          minHeight: '32px',
        }
      case 'large':
        return {
          fontSize: '18px',
          padding: '12px 16px',
          minHeight: '48px',
        }
      default:
        return {
          fontSize: '16px',
          padding: '8px 12px',
          minHeight: '40px',
        }
    }
  }

  /**
   * Render dropdown variant
   */
  private renderDropdown() {
    const selectedOption = this.getSelectedOption()
    const filteredOptions = this.getFilteredOptions()
    const sizeStyles = this.getSizeStyles()
    const isOpen = this.isOpen()

    return h(
      'div',
      {
        id: this.id,
        style: {
          position: 'relative',
          display: 'inline-block',
          minWidth: '200px',
        },
      },
      // Trigger button
      h(
        'button',
        {
          type: 'button',
          onClick: this.toggleOpen,
          disabled: this.isDisabled(),
          style: {
            ...sizeStyles,
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#ffffff',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            cursor: this.isDisabled() ? 'not-allowed' : 'pointer',
            opacity: this.isDisabled() ? 0.6 : 1,
            ...(isOpen && {
              borderColor: this.props.tint || '#007AFF',
              boxShadow: `0 0 0 1px ${this.props.tint || '#007AFF'}`,
            }),
          },
        },
        h(
          'span',
          {
            style: {
              color: selectedOption ? '#1a1a1a' : '#6b7280',
            },
          },
          text(
            selectedOption?.label ||
              this.props.placeholder ||
              'Select an option'
          )
        ),

        h(
          'span',
          {
            style: {
              fontSize: '12px',
              color: '#6b7280',
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
            },
          },
          text('▼')
        )
      ),

      // Dropdown menu
      ...(isOpen
        ? [
            h(
              'div',
              {
                style: {
                  position: 'absolute',
                  top: '100%',
                  left: '0',
                  right: '0',
                  zIndex: 1000,
                  backgroundColor: '#ffffff',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  maxHeight: '200px',
                  overflowY: 'auto' as const,
                  marginTop: '2px',
                },
              },
              // Search input (if searchable)
              ...(this.props.searchable
                ? [
                    h(
                      'div',
                      {
                        style: {
                          padding: '8px',
                          borderBottom: '1px solid #e5e7eb',
                        },
                      },
                      h('input', {
                        type: 'text',
                        placeholder: 'Search options...',
                        value: this.searchTerm(),
                        onInput: (e: Event) => {
                          const target = e.target as HTMLInputElement
                          this.setSearchTerm(target.value)
                        },
                        style: {
                          width: '100%',
                          padding: '6px 8px',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          fontSize: '14px',
                        },
                      })
                    ),
                  ]
                : []),

              // Options
              ...filteredOptions.map(option =>
                h(
                  'button',
                  {
                    type: 'button',
                    key: String(option.value),
                    onClick: () => this.handleSelection(option.value),
                    disabled: option.disabled,
                    style: {
                      width: '100%',
                      padding: '8px 12px',
                      textAlign: 'left' as const,
                      backgroundColor:
                        option.value === this.getSelection()
                          ? '#f3f4f6'
                          : 'transparent',
                      border: 'none',
                      cursor: option.disabled ? 'not-allowed' : 'pointer',
                      opacity: option.disabled ? 0.5 : 1,
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      ':hover': {
                        backgroundColor: '#f9fafb',
                      },
                    },
                  },
                  ...(option.icon
                    ? [
                        h(
                          'span',
                          { style: { fontSize: '16px' } },
                          text(option.icon)
                        ),
                      ]
                    : []),

                  h(
                    'div',
                    {},
                    h('div', {}, text(option.label)),
                    ...(option.description
                      ? [
                          h(
                            'div',
                            {
                              style: {
                                fontSize: '12px',
                                color: '#6b7280',
                                marginTop: '2px',
                              },
                            },
                            text(option.description)
                          ),
                        ]
                      : [])
                  )
                )
              ),

              // No results message
              ...(filteredOptions.length === 0
                ? [
                    h(
                      'div',
                      {
                        style: {
                          padding: '12px',
                          textAlign: 'center' as const,
                          color: '#6b7280',
                          fontSize: '14px',
                        },
                      },
                      text('No options found')
                    ),
                  ]
                : [])
            ),
          ]
        : [])
    )
  }

  /**
   * Render segmented variant
   */
  private renderSegmented() {
    const options = this.getOptions()
    const selection = this.getSelection()
    const sizeStyles = this.getSizeStyles()

    return h(
      'div',
      {
        style: {
          display: 'flex',
          backgroundColor: '#f3f4f6',
          borderRadius: '8px',
          padding: '2px',
        },
        role: 'radiogroup',
        'aria-label': this.props.accessibilityLabel,
      },
      ...options.map((option, index) =>
        h(
          'button',
          {
            type: 'button',
            key: String(option.value),
            onClick: () => this.handleSelection(option.value),
            disabled: option.disabled || this.isDisabled(),
            role: 'radio',
            'aria-checked': option.value === selection,
            style: {
              ...sizeStyles,
              flex: 1,
              border: 'none',
              borderRadius: '6px',
              backgroundColor:
                option.value === selection ? '#ffffff' : 'transparent',
              color: option.value === selection ? '#1a1a1a' : '#6b7280',
              fontWeight: option.value === selection ? '600' : '400',
              cursor:
                option.disabled || this.isDisabled()
                  ? 'not-allowed'
                  : 'pointer',
              opacity: option.disabled || this.isDisabled() ? 0.5 : 1,
              boxShadow:
                option.value === selection
                  ? '0 1px 2px rgba(0, 0, 0, 0.1)'
                  : 'none',
              transition: 'all 0.2s',
              margin: '0',
              ...(index === 0 && { marginRight: '1px' }),
              ...(index === options.length - 1 && { marginLeft: '1px' }),
            },
          },
          ...(option.icon
            ? [
                h(
                  'span',
                  {
                    style: {
                      marginRight: '6px',
                      fontSize: '14px',
                    },
                  },
                  text(option.icon)
                ),
              ]
            : []),
          text(option.label)
        )
      )
    )
  }

  /**
   * Render wheel variant (simplified)
   */
  private renderWheel() {
    const options = this.getOptions()
    const selection = this.getSelection()

    return h(
      'select',
      {
        value: String(selection),
        onChange: (e: Event) => {
          const target = e.target as HTMLSelectElement
          const selectedOption = options.find(
            opt => String(opt.value) === target.value
          )
          if (selectedOption) {
            this.handleSelection(selectedOption.value)
          }
        },
        disabled: this.isDisabled(),
        style: {
          ...this.getSizeStyles(),
          minWidth: '200px',
          backgroundColor: '#ffffff',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          cursor: this.isDisabled() ? 'not-allowed' : 'pointer',
          opacity: this.isDisabled() ? 0.6 : 1,
        },
      },
      ...options.map(option =>
        h(
          'option',
          {
            key: String(option.value),
            value: String(option.value),
            disabled: option.disabled,
          },
          text(option.label)
        )
      )
    )
  }

  render() {
    const {
      variant = 'dropdown',
      accessibilityLabel,
      accessibilityHint,
    } = this.props

    const containerProps = {
      'aria-label': accessibilityLabel,
      'aria-describedby': accessibilityHint ? `${this.id}-hint` : undefined,
    }

    // biome-ignore lint/suspicious/noExplicitAny: Content can be various component types
    let content: any

    switch (variant) {
      case 'segmented':
        content = this.renderSegmented()
        break
      case 'wheel':
        content = this.renderWheel()
        break
      default:
        content = this.renderDropdown()
        break
    }

    return h(
      'div',
      containerProps,
      content,
      ...(accessibilityHint
        ? [
            h(
              'div',
              {
                id: `${this.id}-hint`,
                style: {
                  fontSize: '12px',
                  color: '#6b7280',
                  marginTop: '4px',
                },
              },
              text(accessibilityHint)
            ),
          ]
        : [])
    )
  }
}

/**
 * Picker component function
 */
// biome-ignore lint/suspicious/noExplicitAny: Generic picker function requires flexible type
export function Picker<T = any>(
  selection: T | Signal<T>,
  options: PickerOption<T>[] | Signal<PickerOption<T>[]>,
  props: Omit<PickerProps<T>, 'selection' | 'options'> = {}
): ModifiableComponent<PickerProps<T>> & {
  modifier: ModifierBuilder<ModifiableComponent<PickerProps<T>>>
} {
  const pickerProps: PickerProps<T> = { ...props, selection, options }
  const component = new EnhancedPicker(pickerProps)
  return withModifiers(component)
}

/**
 * Picker style variants
 */
export const PickerStyles = {
  /**
   * Dropdown picker (default)
   */
  // biome-ignore lint/suspicious/noExplicitAny: Generic dropdown picker requires flexible type
  Dropdown<T = any>(
    selection: T | Signal<T>,
    options: PickerOption<T>[] | Signal<PickerOption<T>[]>,
    props: Omit<PickerProps<T>, 'selection' | 'options' | 'variant'> = {}
  ) {
    return Picker(selection, options, { ...props, variant: 'dropdown' })
  },

  /**
   * Segmented picker
   */
  // biome-ignore lint/suspicious/noExplicitAny: Generic segmented picker requires flexible type
  Segmented<T = any>(
    selection: T | Signal<T>,
    options: PickerOption<T>[] | Signal<PickerOption<T>[]>,
    props: Omit<PickerProps<T>, 'selection' | 'options' | 'variant'> = {}
  ) {
    return Picker(selection, options, { ...props, variant: 'segmented' })
  },

  /**
   * Wheel picker (native select)
   */
  // biome-ignore lint/suspicious/noExplicitAny: Generic wheel picker requires flexible type
  Wheel<T = any>(
    selection: T | Signal<T>,
    options: PickerOption<T>[] | Signal<PickerOption<T>[]>,
    props: Omit<PickerProps<T>, 'selection' | 'options' | 'variant'> = {}
  ) {
    return Picker(selection, options, { ...props, variant: 'wheel' })
  },

  /**
   * Menu picker
   */
  // biome-ignore lint/suspicious/noExplicitAny: Generic menu picker requires flexible type
  Menu<T = any>(
    selection: T | Signal<T>,
    options: PickerOption<T>[] | Signal<PickerOption<T>[]>,
    props: Omit<PickerProps<T>, 'selection' | 'options' | 'variant'> = {}
  ) {
    return Picker(selection, options, { ...props, variant: 'menu' })
  },
}

/**
 * Picker utilities
 */
export const PickerUtils = {
  /**
   * Create options from simple array
   */
  fromArray<T>(items: T[], labelKey?: keyof T): PickerOption<T>[] {
    return items.map(item => ({
      value: item,
      label:
        labelKey && typeof item === 'object' && item !== null
          ? String(item[labelKey])
          : String(item),
    }))
  },

  /**
   * Create options from enum
   */
  fromEnum(
    enumObject: Record<string, string | number>
  ): PickerOption<string | number>[] {
    return Object.entries(enumObject).map(([key, value]) => ({
      value,
      label: key.replace(/([A-Z])/g, ' $1').trim(),
    }))
  },

  /**
   * Group options by category
   */
  grouped<T>(
    options: (PickerOption<T> & { category?: string })[]
  ): Record<string, PickerOption<T>[]> {
    return options.reduce(
      (groups, option) => {
        const category = option.category || 'Other'
        if (!groups[category]) {
          groups[category] = []
        }
        groups[category].push(option)
        return groups
      },
      {} as Record<string, PickerOption<T>[]>
    )
  },
}
