/**
 * Form Component
 *
 * SwiftUI-inspired form container with validation, state management,
 * and comprehensive form handling capabilities.
 */

import type {
  Component,
  ComponentChildren,
  ComponentInstance,
  ComponentProps,
  DOMNode,
} from '@tachui/core'
import { createEffect, createSignal, defaultChildrenRenderer, h, text } from '@tachui/core'
import { createFormState } from '../state'
import type { FormProps } from '../types'

/**
 * Helper function to render form children with form context injection
 */
function renderFormChildren(children: ComponentChildren, formContext: any): DOMNode[] {
  // If children is an array, handle each child
  if (Array.isArray(children)) {
    return children.flatMap((child) => renderSingleChild(child, formContext))
  }

  // Single child
  return renderSingleChild(children, formContext)
}

/**
 * Render a single child with form context
 */
function renderSingleChild(child: ComponentChildren, formContext: any): DOMNode[] {
  // Handle null/undefined
  if (child === null || child === undefined) {
    return []
  }

  // Handle ComponentInstance objects - inject form context
  if (typeof child === 'object' && 'type' in child && child.type === 'component') {
    const childWithContext = {
      ...child,
      props: {
        ...child.props,
        _formContext: formContext,
      },
    }
    // Bind the render function to the new object so 'this.props' works correctly
    const boundRender = child.render.bind(childWithContext)
    const rendered = boundRender()
    return Array.isArray(rendered) ? rendered : [rendered]
  }

  // Use default children renderer for everything else (strings, numbers, DOMNodes, etc.)
  return defaultChildrenRenderer(child)
}

/**
 * Form component implementation
 */
export const Form: Component<FormProps> = (props) => {
  const {
    onSubmit,
    onChange,
    validation = {
      validateOn: 'blur',
      stopOnFirstError: false,
      debounceMs: 300,
    },
    initialValues = {},
    resetOnSubmit = false,
    preserveValues = false,
    children,
    ...restProps
  } = props

  // Create form state manager
  const formManager = createFormState(initialValues)
  const [submissionResult, setSubmissionResult] = createSignal<'idle' | 'success' | 'error'>('idle')

  // Handle form submission
  const handleSubmit = async (event?: Event) => {
    if (event) {
      event.preventDefault()
    }

    if (!onSubmit) {
      return
    }

    try {
      setSubmissionResult('idle')

      // Validate form before submission
      const isValid = await formManager.validateForm()

      if (isValid) {
        const values = formManager.watch()
        await onSubmit(values, formManager.state)
        setSubmissionResult('success')

        if (resetOnSubmit) {
          formManager.resetForm()
        }
      } else {
        setSubmissionResult('error')
      }
    } catch (error) {
      setSubmissionResult('error')
      console.error('Form submission error:', error)
    }
  }

  // Handle form changes
  createEffect(() => {
    if (onChange) {
      // const values = formManager.watch()
      const state = formManager.state

      // Find the last changed field (this is a simplification)
      const changedFields = Object.keys(state.fields).filter((name) => state.fields[name].dirty)
      if (changedFields.length > 0) {
        const lastChanged = changedFields[changedFields.length - 1]
        const fieldState = state.fields[lastChanged]
        onChange(lastChanged, fieldState.value, fieldState)
      }
    }
  })

  // Create form context for child components
  const formContext = {
    register: formManager.register,
    unregister: formManager.unregister,
    setValue: formManager.setValue,
    getValue: formManager.getValue,
    getError: formManager.getError,
    validateField: formManager.validateField,
    validation,
    onChange,
  }

  const componentInstance: ComponentInstance = {
    type: 'component',
    id: restProps.id || 'form',
    render: () =>
      h(
        'form',
        {
          ...restProps,
          onsubmit: handleSubmit,
          novalidate: true, // We handle validation ourselves
          'data-tachui-form': true,
          'data-form-state': formManager.state.valid ? 'valid' : 'invalid',
          'data-form-submitting': formManager.state.submitting,
          'data-submission-result': submissionResult(),
        },
        ...renderFormChildren(children, formContext)
      ),
    props: props,
    cleanup: [
      () => {
        // Cleanup form state if not preserving values
        if (!preserveValues) {
          formManager.resetForm()
        }
      },
    ],
  }

  return componentInstance
}

/**
 * Enhanced FormSection component for grouping form fields
 * 
 * Combines the semantic benefits of <fieldset> with the rich styling
 * and functionality from Core Section component. Provides the best
 * of both worlds: proper form semantics and comprehensive features.
 */
export const FormSection: Component<
  {
    // Content (enhanced from Core Section)
    title?: string
    description?: string
    header?: string | (() => string) | ComponentInstance
    footer?: string | (() => string) | ComponentInstance
    children: ComponentChildren

    // Styling (from Core Section)
    style?: 'automatic' | 'grouped' | 'inset' | 'plain' | 'sidebar'
    spacing?: number

    // Behavior (enhanced from Core Section)
    collapsible?: boolean
    collapsed?: boolean
    onToggle?: (collapsed: boolean) => void

    // Accessibility
    accessibilityLabel?: string
    accessibilityRole?: string
  } & ComponentProps
> = (props) => {
  const {
    title,
    description, 
    header,
    footer,
    style = 'automatic',
    spacing = 12,
    collapsible = false,
    collapsed: initialCollapsed = false,
    onToggle,
    accessibilityLabel,
    accessibilityRole = 'group',
    children,
    ...restProps
  } = props

  const [collapsed, setCollapsed] = createSignal(initialCollapsed)

  // Handle toggle with optional callback
  const handleToggle = () => {
    const newCollapsed = !collapsed()
    setCollapsed(newCollapsed)
    if (onToggle) {
      onToggle(newCollapsed)
    }
  }

  // Resolve dynamic content (from Core Section)
  const resolveContent = (content: string | (() => string) | ComponentInstance | undefined) => {
    if (!content) return null
    if (typeof content === 'string') return content
    if (typeof content === 'function') return content()
    return content
  }

  // Get section styles based on style prop (adapted from Core Section)
  const getSectionStyles = () => {
    const baseStyles = {
      marginBottom: '20px',
      border: 'none', // Remove default fieldset border
      padding: '0',   // Remove default fieldset padding
      margin: '0 0 20px 0', // Override default fieldset margin
    }

    switch (style) {
      case 'grouped':
        return {
          ...baseStyles,
          backgroundColor: '#ffffff',
          border: '1px solid #e0e0e0',
          borderRadius: '12px',
          overflow: 'hidden' as const,
        }

      case 'inset':
        return {
          ...baseStyles,
          backgroundColor: '#f8f9fa',
          border: '1px solid #e9ecef',
          borderRadius: '8px',
          margin: '0 16px 20px 16px',
        }

      case 'sidebar':
        return {
          ...baseStyles,
          borderLeft: '3px solid #007AFF',
          paddingLeft: '16px',
          backgroundColor: '#f8f9fa',
          borderRadius: '0 8px 8px 0',
        }

      case 'plain':
        return baseStyles
      default:
        return {
          ...baseStyles,
          backgroundColor: '#ffffff',
          border: '1px solid #f0f0f0',
          borderRadius: '8px',
        }
    }
  }

  // Get header styles (adapted from Core Section)
  const getHeaderStyles = () => {
    const baseStyles = {
      fontSize: '16px',
      fontWeight: '600' as const,
      color: '#1a1a1a',
      margin: '0 0 12px 0',
    }

    switch (style) {
      case 'grouped':
      case 'inset':
        return {
          ...baseStyles,
          padding: '12px 16px 0 16px',
          backgroundColor: '#f8f9fa',
          borderBottom: '1px solid #e9ecef',
        }

      case 'sidebar':
        return {
          ...baseStyles,
          fontSize: '14px',
          textTransform: 'uppercase' as const,
          letterSpacing: '0.5px',
          color: '#666',
          marginBottom: '8px',
        }

      default:
        return {
          ...baseStyles,
          padding: '0 0 8px 0',
        }
    }
  }

  // Get content styles (adapted from Core Section)
  const getContentStyles = () => {
    const baseStyles = {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: `${spacing}px`,
    }

    switch (style) {
      case 'grouped':
      case 'inset':
        return {
          ...baseStyles,
          padding: '16px',
        }

      case 'sidebar':
        return {
          ...baseStyles,
          padding: '8px 0',
        }

      default:
        return {
          ...baseStyles,
          padding: '12px',
        }
    }
  }

  // Get footer styles (adapted from Core Section)
  const getFooterStyles = () => {
    const baseStyles = {
      fontSize: '14px',
      color: '#666',
      margin: '8px 0 0 0',
    }

    switch (style) {
      case 'grouped':
      case 'inset':
        return {
          ...baseStyles,
          padding: '0 16px 12px 16px',
          backgroundColor: '#f8f9fa',
          borderTop: '1px solid #e9ecef',
        }

      default:
        return {
          ...baseStyles,
          padding: '0 0 4px 0',
        }
    }
  }

  // Render header content
  const renderHeader = () => {
    // Prioritize title over header for backwards compatibility
    const headerContent = title || resolveContent(header)
    if (!headerContent) return []

    const headerStyles = getHeaderStyles()

    // Add collapse toggle if collapsible
    if (collapsible) {
      const toggleIcon = collapsed() ? '▶' : '▼'

      return [
        h(
          'legend',
          {
            style: {
              ...headerStyles,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            },
            onclick: handleToggle,
          },
          h(
            'span',
            {
              style: {
                fontSize: '12px',
                color: '#666',
              },
            },
            text(toggleIcon)
          ),
          ...(typeof headerContent === 'string'
            ? [text(headerContent)]
            : [headerContent.render()].flat())
        )
      ]
    }

    return [
      h(
        'legend',
        { style: headerStyles },
        ...(typeof headerContent === 'string'
          ? [text(headerContent)]
          : [headerContent.render()].flat())
      )
    ]
  }

  // Render description if provided (backwards compatibility)
  const renderDescription = () => {
    if (!description || collapsed()) return []
    
    return [
      h(
        'div',
        {
          style: {
            fontSize: '14px',
            color: '#666',
            marginBottom: '12px',
            padding: style === 'grouped' || style === 'inset' ? '0 16px' : '0',
          },
        },
        text(description)
      )
    ]
  }

  // Render content
  const renderContent = () => {
    // Don't render content if collapsed
    if (collapsible && collapsed()) {
      return []
    }

    return [
      h(
        'div',
        {
          style: getContentStyles(),
        },
        ...renderFormChildren(children, (props as any)._formContext)
      )
    ]
  }

  // Render footer content
  const renderFooter = () => {
    const footerContent = resolveContent(footer)
    if (!footerContent || collapsed()) return []

    return [
      h(
        'div',
        {
          style: getFooterStyles(),
        },
        ...(typeof footerContent === 'string'
          ? [text(footerContent)]
          : [footerContent.render()].flat())
      )
    ]
  }

  const componentInstance: ComponentInstance = {
    type: 'component',
    id: restProps.id || 'form-section',
    render: () =>
      h(
        'fieldset',
        {
          ...restProps,
          style: getSectionStyles(),
          'aria-label': accessibilityLabel,
          role: accessibilityRole,
          'data-tachui-form-section': true,
          'data-collapsible': collapsible,
          'data-collapsed': collapsed(),
          'data-style': style,
        },
        ...renderHeader(),
        ...renderDescription(),
        ...renderContent(),
        ...renderFooter()
      ),
    props: props,
  }

  return componentInstance
}

/**
 * Form utilities and helpers
 */
export const FormUtils = {
  /**
   * Create a form with automatic field registration
   */
  createAutoForm: (schema: any) => {
    // This would be implemented to automatically generate form fields
    // based on a JSON schema - simplified for now
    console.log('Auto form creation:', schema)
    return Form
  },

  /**
   * Form validation utilities
   */
  validation: {
    /**
     * Create a validation schema from field definitions
     */
    createSchema: (fields: Record<string, any>) => {
      return {
        fields,
        validate: async (_values: Record<string, any>) => {
          // TODO: Implement schema-based validation
          return { valid: true, errors: {} }
        },
      }
    },
  },

  /**
   * Form serialization utilities
   */
  serialize: {
    /**
     * Convert form values to FormData
     */
    toFormData: (values: Record<string, any>): FormData => {
      const formData = new FormData()

      Object.entries(values).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          if (value instanceof File || value instanceof Blob) {
            formData.append(key, value)
          } else if (Array.isArray(value)) {
            value.forEach((item, index) => {
              formData.append(`${key}[${index}]`, String(item))
            })
          } else {
            formData.append(key, String(value))
          }
        }
      })

      return formData
    },

    /**
     * Convert form values to URL search params
     */
    toURLSearchParams: (values: Record<string, any>): URLSearchParams => {
      const params = new URLSearchParams()

      Object.entries(values).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          if (Array.isArray(value)) {
            value.forEach((item) => params.append(key, String(item)))
          } else {
            params.append(key, String(value))
          }
        }
      })

      return params
    },

    /**
     * Convert form values to JSON
     */
    toJSON: (values: Record<string, any>): string => {
      return JSON.stringify(values, null, 2)
    },
  },
}

// Export form-related types for convenience
export type { FormProps, FormState } from '../types'
