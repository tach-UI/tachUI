/**
 * BasicInput Component (Phase 1)
 *
 * Lightweight text input component for Core-only applications.
 * Provides SwiftUI-style reactive binding without the complexity
 * of the Forms plugin validation and formatting system.
 */

import type { ModifiableComponent, ModifierBuilder } from '../modifiers/types'
import { createEffect, isSignal } from '../reactive'
import type { Signal } from '../reactive/types'
import { h } from '../runtime'
import type { ComponentInstance, ComponentProps, DOMNode } from '../runtime/types'
import { withModifiers } from './wrapper'
import {
  ComponentWithCSSClasses,
  type CSSClassesProps
} from '../css-classes'

/**
 * BasicInput supported input types
 */
export type BasicInputType = 'text' | 'email' | 'password' | 'search' | 'tel' | 'url'

/**
 * BasicInput component properties with CSS classes support
 */
export interface BasicInputProps extends ComponentProps, CSSClassesProps {
  // Core reactive binding
  text: Signal<string>
  setText?: (value: string) => void

  // Input configuration
  placeholder?: string | Signal<string>
  inputType?: BasicInputType | Signal<BasicInputType>
  disabled?: boolean | Signal<boolean>
  readonly?: boolean | Signal<boolean>

  // Behavior
  onChange?: (text: string) => void
  onSubmit?: (text: string) => void
  onFocus?: () => void
  onBlur?: () => void

  // Accessibility
  accessibilityLabel?: string
  accessibilityHint?: string
}

/**
 * BasicInput theme configuration
 */
export interface BasicInputTheme {
  colors: {
    background: string
    border: string
    text: string
    placeholder: string
    focusBorder: string
    disabledBackground: string
    disabledText: string
  }
  spacing: {
    padding: number
    borderWidth: number
  }
  borderRadius: number
  fontSize: number
  fontFamily: string
  transition: string
}

/**
 * Default BasicInput theme
 */
const defaultBasicInputTheme: BasicInputTheme = {
  colors: {
    background: '#FFFFFF',
    border: '#D1D1D6',
    text: '#000000',
    placeholder: '#8E8E93',
    focusBorder: '#007AFF',
    disabledBackground: '#F2F2F7',
    disabledText: '#8E8E93',
  },
  spacing: {
    padding: 8,
    borderWidth: 1,
  },
  borderRadius: 4,
  fontSize: 16,
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  transition: 'border-color 0.2s ease, background-color 0.2s ease',
}

/**
 * BasicInput component implementation with CSS classes support
 */
export class BasicInputComponent extends ComponentWithCSSClasses implements ComponentInstance<BasicInputProps> {
  public readonly type = 'component' as const
  public readonly id: string
  public readonly props: BasicInputProps
  private theme: BasicInputTheme = defaultBasicInputTheme
  private inputElement: HTMLInputElement | null = null

  constructor(props: BasicInputProps) {
    super()
    this.props = props
    this.id = `basicinput-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private resolveValue<T>(value: T | Signal<T>): T {
    return isSignal(value) ? value() : value
  }

  private getText(): string {
    return this.resolveValue(this.props.text)
  }

  private setText(value: string): void {
    if (this.props.setText) {
      this.props.setText(value)
    }
  }

  private getPlaceholder(): string {
    return this.resolveValue(this.props.placeholder || '')
  }

  private getInputType(): BasicInputType {
    return this.resolveValue(this.props.inputType || 'text')
  }

  private isDisabled(): boolean {
    return this.resolveValue(this.props.disabled || false)
  }

  private isReadonly(): boolean {
    return this.resolveValue(this.props.readonly || false)
  }

  private handleInput = (e: Event): void => {
    const target = e.target as HTMLInputElement
    const value = target.value

    // Update reactive signal
    this.setText(value)

    // Call onChange callback
    if (this.props.onChange) {
      this.props.onChange(value)
    }
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Enter' && this.props.onSubmit) {
      e.preventDefault()
      this.props.onSubmit(this.getText())
    }
  }

  private handleFocus = (): void => {
    if (this.props.onFocus) {
      this.props.onFocus()
    }

    // Update focus border color
    if (this.inputElement) {
      this.inputElement.style.borderColor = this.theme.colors.focusBorder
    }
  }

  private handleBlur = (): void => {
    if (this.props.onBlur) {
      this.props.onBlur()
    }

    // Reset border color
    if (this.inputElement) {
      this.inputElement.style.borderColor = this.theme.colors.border
    }
  }

  private getInputStyles(): Record<string, string> {
    const disabled = this.isDisabled()

    return {
      width: '100%',
      padding: `${this.theme.spacing.padding}px`,
      border: `${this.theme.spacing.borderWidth}px solid ${this.theme.colors.border}`,
      borderRadius: `${this.theme.borderRadius}px`,
      backgroundColor: disabled
        ? this.theme.colors.disabledBackground
        : this.theme.colors.background,
      color: disabled ? this.theme.colors.disabledText : this.theme.colors.text,
      fontSize: `${this.theme.fontSize}px`,
      fontFamily: this.theme.fontFamily,
      outline: 'none',
      transition: this.theme.transition,
      cursor: disabled ? 'not-allowed' : 'text',
    }
  }

  render(): DOMNode[] {
    const currentText = this.getText()
    const placeholder = this.getPlaceholder()
    const inputType = this.getInputType()
    const disabled = this.isDisabled()
    const readonly = this.isReadonly()

    // Process CSS classes for this component
    const baseClasses = ['tachui-basic-input']
    const classString = this.createClassString(this.props, baseClasses)
    
    const input = h('input', {
      id: this.id,
      className: classString,
      type: inputType,
      value: currentText,
      placeholder: placeholder,
      disabled: disabled,
      readonly: readonly,
      'aria-label': this.props.accessibilityLabel,
      'aria-describedby': this.props.accessibilityHint ? `${this.id}-hint` : undefined,
      style: this.getInputStyles(),
      oninput: this.handleInput,
      onkeydown: this.handleKeyDown,
      onfocus: this.handleFocus,
      onblur: this.handleBlur,
    })

    // Store reference to input element
    this.inputElement = input.element as HTMLInputElement

    // Set up reactive effects for dynamic updates
    createEffect(() => {
      if (this.inputElement && isSignal(this.props.text)) {
        const newValue = this.getText()
        if (this.inputElement.value !== newValue) {
          this.inputElement.value = newValue
        }
      }
    })

    createEffect(() => {
      if (
        this.inputElement &&
        (isSignal(this.props.placeholder) ||
          isSignal(this.props.inputType) ||
          isSignal(this.props.disabled))
      ) {
        // Update placeholder
        if (isSignal(this.props.placeholder)) {
          this.inputElement.placeholder = this.getPlaceholder()
        }

        // Update input type
        if (isSignal(this.props.inputType)) {
          this.inputElement.type = this.getInputType()
        }

        // Update disabled state
        if (isSignal(this.props.disabled)) {
          this.inputElement.disabled = this.isDisabled()
        }
      }
    })

    return [input]
  }
}

/**
 * Create a BasicInput component
 */
export function BasicInput(props: BasicInputProps): ModifiableComponent<BasicInputProps> & {
  modifier: ModifierBuilder<ModifiableComponent<BasicInputProps>>
} {
  return withModifiers(new BasicInputComponent(props))
}

/**
 * BasicInput utility functions and presets
 */
export const BasicInputUtils = {
  /**
   * Create a search input
   */
  search(
    text: Signal<string>,
    setText: (value: string) => void,
    onSearch?: (query: string) => void
  ): BasicInputProps {
    return {
      text,
      setText,
      inputType: 'search',
      placeholder: 'Search...',
      onSubmit: onSearch,
    }
  },

  /**
   * Create an email input
   */
  email(text: Signal<string>, setText: (value: string) => void): BasicInputProps {
    return {
      text,
      setText,
      inputType: 'email',
      placeholder: 'Enter email address',
    }
  },

  /**
   * Create a password input
   */
  password(text: Signal<string>, setText: (value: string) => void): BasicInputProps {
    return {
      text,
      setText,
      inputType: 'password',
      placeholder: 'Enter password',
    }
  },

  /**
   * Create a phone number input
   */
  phone(text: Signal<string>, setText: (value: string) => void): BasicInputProps {
    return {
      text,
      setText,
      inputType: 'tel',
      placeholder: 'Enter phone number',
    }
  },
}

/**
 * BasicInput styles and theming
 */
export const BasicInputStyles = {
  theme: defaultBasicInputTheme,

  /**
   * Create a custom theme
   */
  createTheme(overrides: Partial<BasicInputTheme>): BasicInputTheme {
    return { ...defaultBasicInputTheme, ...overrides }
  },
}
