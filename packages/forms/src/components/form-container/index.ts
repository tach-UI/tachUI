/**
 * Form Container Components
 *
 * Core form structure and state management components
 */

import { createSignal, createComputed } from '@tachui/core'
import { createFormState } from '../../state'
import type { FormState, FormSubmitHandler, FieldValidation } from '../../types'

export interface FormProps {
  onSubmit?: FormSubmitHandler
  validation?: Record<string, FieldValidation>
  initialValues?: Record<string, any>
  children?: any
  className?: string
  id?: string
  resetOnSubmit?: boolean
  validateOnSubmit?: boolean
  [key: string]: any
}

export interface FormSectionProps {
  title?: string
  description?: string
  children?: any
  className?: string
  collapsible?: boolean
  defaultExpanded?: boolean
  [key: string]: any
}

export class Form {
  readonly type = 'form-container'
  private formState: ReturnType<typeof createFormState>

  constructor(public readonly properties: FormProps) {
    this.formState = createFormState(properties.initialValues || {})

    // Register field validations
    if (properties.validation) {
      Object.entries(properties.validation).forEach(
        ([fieldName, validation]) => {
          this.formState.register(fieldName, validation)
        }
      )
    }
  }

  get state(): FormState {
    return this.formState.state
  }

  async handleSubmit(): Promise<void> {
    if (this.properties.validateOnSubmit !== false) {
      const isValid = await this.formState.validateForm()
      if (!isValid) {
        return
      }
    }

    if (this.properties.onSubmit) {
      await this.properties.onSubmit(
        this.formState.watch(),
        this.formState.state
      )
    }

    if (this.properties.resetOnSubmit) {
      this.formState.resetForm()
    }
  }

  register(fieldName: string, validation?: FieldValidation): void {
    this.formState.register(fieldName, validation)
  }

  setValue(fieldName: string, value: any): void {
    this.formState.setValue(fieldName, value)
  }

  getValue(fieldName: string): any {
    return this.formState.getValue(fieldName)
  }

  getError(fieldName: string): string | undefined {
    return this.formState.getError(fieldName)
  }

  async validateField(fieldName: string): Promise<boolean> {
    return this.formState.validateField(fieldName)
  }

  async validateForm(): Promise<boolean> {
    return this.formState.validateForm()
  }

  resetForm(): void {
    this.formState.resetForm()
  }

  render(): HTMLElement {
    const element = document.createElement('form')

    // Set form attributes
    if (this.properties.className) {
      element.className = this.properties.className
    }
    if (this.properties.id) {
      element.id = this.properties.id
    }

    // Prevent default form submission
    element.addEventListener('submit', e => {
      e.preventDefault()
      this.handleSubmit()
    })

    // Add children if provided
    if (this.properties.children) {
      if (Array.isArray(this.properties.children)) {
        this.properties.children.forEach(child => {
          if (typeof child === 'string') {
            element.appendChild(document.createTextNode(child))
          } else if (child && typeof child.render === 'function') {
            element.appendChild(child.render())
          } else if (child instanceof HTMLElement) {
            element.appendChild(child)
          }
        })
      } else if (typeof this.properties.children === 'string') {
        element.appendChild(document.createTextNode(this.properties.children))
      } else if (
        this.properties.children &&
        typeof this.properties.children.render === 'function'
      ) {
        element.appendChild(this.properties.children.render())
      } else if (this.properties.children instanceof HTMLElement) {
        element.appendChild(this.properties.children)
      }
    }

    return element
  }
}

export class FormSection {
  readonly type = 'form-section'
  private expanded: () => boolean
  private setExpanded: (value: boolean) => void

  constructor(public readonly properties: FormSectionProps) {
    const [expandedSignal, setExpandedSignal] = createSignal(
      properties.defaultExpanded ?? true
    )
    this.expanded = expandedSignal
    this.setExpanded = setExpandedSignal
  }

  get isExpanded(): boolean {
    return this.expanded()
  }

  toggle(): void {
    if (this.properties.collapsible) {
      this.setExpanded(!this.expanded())
    }
  }

  expand(): void {
    this.setExpanded(true)
  }

  collapse(): void {
    if (this.properties.collapsible) {
      this.setExpanded(false)
    }
  }

  render(): HTMLElement {
    const section = document.createElement('section')

    if (this.properties.className) {
      section.className = this.properties.className
    }

    // Add title if provided
    if (this.properties.title) {
      const title = document.createElement('h3')
      title.textContent = this.properties.title
      title.style.cssText = 'margin: 0 0 1rem 0; font-weight: 600;'

      if (this.properties.collapsible) {
        title.style.cursor = 'pointer'
        title.addEventListener('click', () => this.toggle())

        const indicator = document.createElement('span')
        indicator.textContent = this.expanded() ? ' ▼' : ' ▶'
        indicator.style.cssText = 'font-size: 0.8em; margin-left: 0.5rem;'
        title.appendChild(indicator)

        // Update indicator when expanded state changes
        createComputed(() => {
          indicator.textContent = this.expanded() ? ' ▼' : ' ▶'
        })
      }

      section.appendChild(title)
    }

    // Add description if provided
    if (this.properties.description) {
      const description = document.createElement('p')
      description.textContent = this.properties.description
      description.style.cssText =
        'margin: 0 0 1rem 0; color: #666; font-size: 0.9em;'
      section.appendChild(description)
    }

    // Add content container
    const content = document.createElement('div')

    // Handle collapsible behavior
    createComputed(() => {
      content.style.display = this.expanded() ? 'block' : 'none'
    })

    // Add children if provided
    if (this.properties.children) {
      if (Array.isArray(this.properties.children)) {
        this.properties.children.forEach(child => {
          if (typeof child === 'string') {
            content.appendChild(document.createTextNode(child))
          } else if (child && typeof child.render === 'function') {
            content.appendChild(child.render())
          } else if (child instanceof HTMLElement) {
            content.appendChild(child)
          }
        })
      } else if (typeof this.properties.children === 'string') {
        content.appendChild(document.createTextNode(this.properties.children))
      } else if (
        this.properties.children &&
        typeof this.properties.children.render === 'function'
      ) {
        content.appendChild(this.properties.children.render())
      } else if (this.properties.children instanceof HTMLElement) {
        content.appendChild(this.properties.children)
      }
    }

    section.appendChild(content)
    return section
  }
}

export function form(props: FormProps): Form {
  return new Form(props)
}

export function formSection(props: FormSectionProps): FormSection {
  return new FormSection(props)
}

// Re-export types for convenience
export type { FormState, FormSubmitHandler, FieldValidation }
