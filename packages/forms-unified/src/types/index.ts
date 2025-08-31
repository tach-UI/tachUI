/**
 * TypeScript Types
 *
 * All form-related TypeScript types and interfaces
 */

// TODO: Migrate actual types from both @tachui/forms and @tachui/advanced-forms
// Re-export from component files
export type * from '../components/form-container'
export type * from '../components/text-input'
export type * from '../components/selection'
export type * from '../components/advanced'
export type * from '../components/date-picker'
export type * from '../validation'
export type * from '../utils'

// Unified form types
export interface UnifiedFormProps {
  // Core form properties
  onSubmit?: (data: any) => void | Promise<void>
  validation?: any
  disabled?: boolean
  readonly?: boolean

  // Layout and styling
  layout?: 'vertical' | 'horizontal' | 'inline'
  spacing?: 'compact' | 'normal' | 'relaxed'

  // Advanced features
  autoSave?: boolean
  dirty?: boolean
  touched?: boolean
}

// General form types
export interface FormField {
  name: string
  type: string
  value?: any
  validation?: any[]
}

export interface FormData {
  [fieldName: string]: any
}

export interface FormConfig {
  fields: FormField[]
  validation?: any
  layout?: UnifiedFormProps['layout']
  spacing?: UnifiedFormProps['spacing']
}
