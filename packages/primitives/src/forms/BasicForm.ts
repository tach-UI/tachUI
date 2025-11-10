/**
 * BasicForm Component (Phase 6.4.1)
 *
 * Lightweight SwiftUI-inspired Form component for Core-only applications.
 * Provides essential form functionality with automatic styling and basic validation
 * without the complexity of the full Forms plugin. Perfect for simple forms,
 * contact forms, and login pages where minimal bundle size is important.
 *
 * For advanced form features (comprehensive validation, state management,
 * multi-step forms), use the Form component from @tachui/forms.
 */

import type { ModifiableComponent, ModifierBuilder } from '@tachui/core'
import {
  clonePropsPreservingReactivity,
  createEffect,
  createSignal,
  resetLifecycleState,
} from '@tachui/core'
// Signal type import removed - using function signatures instead
import { h, text } from '@tachui/core'
import type { ComponentInstance, ComponentProps } from '@tachui/core'
import { withModifiers } from '@tachui/core'
import type { CloneableComponent, CloneOptions } from '@tachui/core/runtime/types'

/**
 * BasicForm component properties
 */
export interface BasicFormProps extends ComponentProps {
  children?: ComponentInstance[]

  // Form behavior
  onSubmit?: (data: FormData) => void | Promise<void>
  onValidationChange?: (isValid: boolean, errors: ValidationError[]) => void

  // Validation
  validateOnChange?: boolean
  validateOnSubmit?: boolean
  showValidationSummary?: boolean

  // Styling
  style?: 'automatic' | 'grouped' | 'inset' | 'plain'
  spacing?: number

  // Accessibility
  accessibilityLabel?: string
  accessibilityRole?: string
}

/**
 * Validation error structure
 */
export interface ValidationError {
  field: string
  message: string
  code?: string
}

/**
 * Form data structure
 */
export interface FormData {
  // biome-ignore lint/suspicious/noExplicitAny: Form data requires flexible value types
  [key: string]: any
}

/**
 * BasicForm component class
 */
export class BasicFormImplementation
  implements CloneableComponent<BasicFormProps>
{
  public readonly type = 'component' as const
  public readonly id: string
  public mounted = false
  public cleanup: (() => void)[] = []
  private formElement: HTMLFormElement | null = null
  private validationErrors: () => ValidationError[]
  private setValidationErrors: (errors: ValidationError[]) => ValidationError[]
  // isValid accessor removed - value tracked internally
  private setIsValid: (valid: boolean) => boolean

  constructor(public props: BasicFormProps) {
    this.id = `form-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Initialize validation signals
    const [errors, setErrors] = createSignal<ValidationError[]>([])
    const [, setValid] = createSignal(true)
    this.validationErrors = errors
    this.setValidationErrors = setErrors
    // this.isValid = valid - removed unused accessor
    this.setIsValid = setValid

    // Setup validation change effect
    createEffect(() => {
      const currentErrors = this.validationErrors()
      const currentValid = currentErrors.length === 0
      this.setIsValid(currentValid)

      if (this.props.onValidationChange) {
        this.props.onValidationChange(currentValid, currentErrors)
      }
    })
  }

  /**
   * Extract form data from form elements
   */
  private extractFormData(): FormData {
    if (!this.formElement) return {}

    const formData = new FormData(this.formElement)
    const data: FormData = {}

    // Convert FormData to plain object
    for (const [key, value] of formData.entries()) {
      if (data[key]) {
        // Handle multiple values (checkboxes, multi-select)
        if (Array.isArray(data[key])) {
          // biome-ignore lint/suspicious/noExplicitAny: Form data array manipulation requires dynamic typing
          ;(data[key] as any[]).push(value)
        } else {
          data[key] = [data[key], value]
        }
      } else {
        data[key] = value
      }
    }

    return data
  }

  /**
   * Validate all form fields
   */
  private validateForm(): ValidationError[] {
    if (!this.formElement) return []

    const errors: ValidationError[] = []
    const inputs = this.formElement.querySelectorAll('input, select, textarea')

    inputs.forEach(input => {
      const element = input as
        | HTMLInputElement
        | HTMLSelectElement
        | HTMLTextAreaElement
      const name = element.name || element.id

      // Check HTML5 validation
      if (!element.checkValidity()) {
        errors.push({
          field: name,
          message: element.validationMessage,
          code: 'html5_validation',
        })
      }

      // Check required fields
      if (element.hasAttribute('required') && !element.value.trim()) {
        errors.push({
          field: name,
          message: `${name} is required`,
          code: 'required',
        })
      }
    })

    return errors
  }

  /**
   * Handle form submission
   */
  private handleSubmit = async (event: Event) => {
    event.preventDefault()

    if (this.props.validateOnSubmit !== false) {
      const errors = this.validateForm()
      this.setValidationErrors(errors)

      if (errors.length > 0) {
        return
      }
    }

    if (this.props.onSubmit) {
      const data = this.extractFormData()
      await this.props.onSubmit(data)
    }
  }

  /**
   * Handle form input changes
   */
  private handleChange = () => {
    if (this.props.validateOnChange) {
      const errors = this.validateForm()
      this.setValidationErrors(errors)
    }
  }

  /**
   * Get form styling based on style prop
   */
  private getFormStyles() {
    const { style = 'automatic', spacing = 16 } = this.props

    const baseStyles = {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: `${spacing}px`,
    }

    switch (style) {
      case 'grouped':
        return {
          ...baseStyles,
          backgroundColor: '#ffffff',
          border: '1px solid #e0e0e0',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }

      case 'inset':
        return {
          ...baseStyles,
          backgroundColor: '#f8f9fa',
          border: '1px solid #e9ecef',
          borderRadius: '8px',
          padding: '16px',
          margin: '0 16px',
        }

      case 'plain':
        return baseStyles
      default:
        return {
          ...baseStyles,
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          padding: '16px',
        }
    }
  }

  /**
   * Render validation summary
   */
  private renderValidationSummary() {
    const errors = this.validationErrors()

    if (!this.props.showValidationSummary || errors.length === 0) {
      return null
    }

    return h(
      'div',
      {
        style: {
          backgroundColor: '#fff5f5',
          border: '1px solid #fed7d7',
          borderRadius: '6px',
          padding: '12px 16px',
          marginBottom: '16px',
        },
      },
      h(
        'div',
        {
          style: {
            fontSize: '14px',
            fontWeight: '600',
            color: '#e53e3e',
            marginBottom: '8px',
          },
        },
        text('Please fix the following errors:')
      ),

      h(
        'ul',
        {
          style: {
            margin: '0',
            paddingLeft: '20px',
            fontSize: '14px',
            color: '#c53030',
          },
        },
        ...errors.map(error =>
          h('li', { key: error.field }, text(error.message))
        )
      )
    )
  }

  render() {
    const {
      children = [],
      accessibilityLabel,
      accessibilityRole = 'form',
    } = this.props

    return [
      h(
        'form',
        {
          ref: (el: HTMLFormElement) => {
            this.formElement = el

            // Add event listeners when mounted
            if (el && !this.mounted) {
              el.addEventListener('submit', this.handleSubmit)
              el.addEventListener('change', this.handleChange)
              el.addEventListener('input', this.handleChange)

              this.cleanup.push(() => {
                el.removeEventListener('submit', this.handleSubmit)
                el.removeEventListener('change', this.handleChange)
                el.removeEventListener('input', this.handleChange)
              })

              this.mounted = true
            }
          },
          style: this.getFormStyles(),
          'aria-label': accessibilityLabel,
          role: accessibilityRole,
          noValidate: true, // We handle validation manually
        },
        // Validation summary
        ...(this.renderValidationSummary() !== null
          ? [this.renderValidationSummary()!]
          : []),

        // Form content
        ...children.flatMap(child => child.render())
      ),
    ]
  }

  clone(options: CloneOptions = {}): this {
    return options.deep ? this.deepClone() : this.shallowClone()
  }

  shallowClone(): this {
    const clonedProps = clonePropsPreservingReactivity(this.props)
    const clone = new BasicFormImplementation(clonedProps)
    resetLifecycleState(clone)
    return clone as this
  }

  deepClone(): this {
    const clonedProps = clonePropsPreservingReactivity(this.props, {
      deep: true,
    })
    const clone = new BasicFormImplementation(clonedProps)
    resetLifecycleState(clone)
    return clone as this
  }
}

/**
 * BasicForm component function
 */
export function BasicForm(
  children: ComponentInstance[],
  props: Omit<BasicFormProps, 'children'> = {}
): ModifiableComponent<BasicFormProps> & {
  modifier: ModifierBuilder<ModifiableComponent<BasicFormProps>>
} {
  const formProps: BasicFormProps = { ...props, children }
  const component = new BasicFormImplementation(formProps)
  return withModifiers(component)
}

/**
 * BasicForm style variants
 */
export const BasicFormStyles = {
  /**
   * Automatic form styling (default)
   */
  Automatic(
    children: ComponentInstance[],
    props: Omit<BasicFormProps, 'children' | 'style'> = {}
  ) {
    return BasicForm(children, { ...props, style: 'automatic' })
  },

  /**
   * Grouped form with container styling
   */
  Grouped(
    children: ComponentInstance[],
    props: Omit<BasicFormProps, 'children' | 'style'> = {}
  ) {
    return BasicForm(children, { ...props, style: 'grouped' })
  },

  /**
   * Inset form styling
   */
  Inset(
    children: ComponentInstance[],
    props: Omit<BasicFormProps, 'children' | 'style'> = {}
  ) {
    return BasicForm(children, { ...props, style: 'inset' })
  },

  /**
   * Plain form without styling
   */
  Plain(
    children: ComponentInstance[],
    props: Omit<BasicFormProps, 'children' | 'style'> = {}
  ) {
    return BasicForm(children, { ...props, style: 'plain' })
  },
}

/**
 * BasicForm validation utilities
 */
export const BasicFormValidation = {
  /**
   * Common validation rules
   */
  rules: {
    // biome-ignore lint/suspicious/noExplicitAny: Validation rules accept any input type
    required: (value: any) => value != null && value !== '',
    email: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    minLength: (min: number) => (value: string) => value.length >= min,
    maxLength: (max: number) => (value: string) => value.length <= max,
    pattern: (regex: RegExp) => (value: string) => regex.test(value),
    number: (value: string) => !Number.isNaN(Number(value)),
    integer: (value: string) => Number.isInteger(Number(value)),
    min: (min: number) => (value: string) => Number(value) >= min,
    max: (max: number) => (value: string) => Number(value) <= max,
  },

  /**
   * Validate a single field
   */
  validateField(
    // biome-ignore lint/suspicious/noExplicitAny: Validation accepts any field value
    value: any,
    // biome-ignore lint/suspicious/noExplicitAny: Validation rules accept any input type
    rules: Array<(value: any) => boolean | string>
  ): ValidationError | null {
    for (const rule of rules) {
      const result = rule(value)
      if (result !== true) {
        return {
          field: 'field',
          message: typeof result === 'string' ? result : 'Validation failed',
          code: 'custom_validation',
        }
      }
    }
    return null
  },
}
