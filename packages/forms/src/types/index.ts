/**
 * TachUI Forms Plugin - Type Definitions
 *
 * Complete type system for form components, validation, and state management.
 * Provides SwiftUI-inspired form APIs with modern web development patterns.
 */

import type { ComponentChildren, ComponentInstance, ComponentProps } from '@tachui/core'

/**
 * Form validation rule types
 */
/**
 * Built-in validation rule with options
 */
export interface BuiltInValidationRule {
  name: 'min' | 'max' | 'minLength' | 'maxLength' | 'pattern'
  options: Record<string, any>
}

export type ValidationRule =
  | 'required'
  | 'email'
  | 'url'
  | 'number'
  | 'integer'
  | 'min'
  | 'max'
  | 'minLength'
  | 'maxLength'
  | 'pattern'
  | 'numeric'
  | 'phone'
  | 'creditCard'
  | 'ssn'
  | 'postalCode'
  | 'zipCode'
  | 'date'
  | 'time'
  | 'strongPassword'
  | BuiltInValidationRule
  | CustomValidationRule

/**
 * Custom validation rule interface
 */
export interface CustomValidationRule {
  name: string
  validate: (value: any, options?: any) => ValidationResult
  message?: string
  options?: Record<string, any>
}

/**
 * Validation result interface
 */
export interface ValidationResult {
  valid: boolean
  message?: string
  code?: string
}

/**
 * Field validation configuration
 */
export interface FieldValidation {
  rules: ValidationRule[]
  validateOn?: 'change' | 'blur' | 'submit'
  debounceMs?: number
  required?: boolean
  custom?: CustomValidationRule[]
}

/**
 * Form field state
 */
export interface FieldState<T = any> {
  value: T
  error?: string
  touched: boolean
  dirty: boolean
  valid: boolean
  validating: boolean
  focused: boolean
}

/**
 * Form state interface
 */
export interface FormState {
  fields: Record<string, FieldState>
  valid: boolean
  dirty: boolean
  submitting: boolean
  submitted: boolean
  errors: Record<string, string>
  touched: Record<string, boolean>
}

/**
 * Form submission handler
 */
export type FormSubmitHandler<T = Record<string, any>> = (
  values: T,
  form: FormState
) => void | Promise<void>

/**
 * Form change handler
 */
export type FormChangeHandler<T = any> = (name: string, value: T, field: FieldState<T>) => void

/**
 * Base form field props
 */
export interface BaseFieldProps extends ComponentProps {
  name: string
  label?: string
  placeholder?: string
  disabled?: boolean
  required?: boolean
  validation?: FieldValidation
  value?: any
  defaultValue?: any
  onChange?: FormChangeHandler
  onBlur?: (name: string, value: any) => void
  onFocus?: (name: string, value: any) => void
  error?: string
  helperText?: string
}

/**
 * Input field types - comprehensive SwiftUI-inspired support
 */
export type TextFieldType =
  | 'text'
  | 'password'
  | 'email'
  | 'number'
  | 'tel'
  | 'url'
  | 'search'
  | 'date'
  | 'time'
  | 'datetime-local'
  | 'month'
  | 'week'
  | 'color'

/**
 * Auto-capitalization options
 */
export type AutoCapitalization = 'none' | 'sentences' | 'words' | 'characters'

/**
 * Keyboard type for mobile devices
 */
export type KeyboardType = 'default' | 'numeric' | 'email' | 'phone' | 'url' | 'search'

/**
 * Return key type for mobile keyboards
 */
export type ReturnKeyType = 'done' | 'go' | 'next' | 'search' | 'send'

/**
 * Text field formatter function
 */
export type TextFieldFormatter = (value: string) => string

/**
 * Text field parser function
 */
export type TextFieldParser = (value: string) => string

/**
 * Text input specific props - Enhanced with core TextField features
 */
export interface TextFieldProps extends BaseFieldProps {
  // Input configuration
  type?: TextFieldType
  multiline?: boolean
  rows?: number
  minLength?: number
  maxLength?: number
  pattern?: string
  autocomplete?: string
  spellcheck?: boolean

  // Mobile/accessibility features
  keyboardType?: KeyboardType
  returnKeyType?: ReturnKeyType
  autoCapitalize?: AutoCapitalization
  autoFocus?: boolean
  accessibilityLabel?: string
  accessibilityHint?: string
  accessibilityRole?: 'textbox' | 'searchbox'

  // Formatting and parsing
  formatter?: TextFieldFormatter
  parser?: TextFieldParser

  // Advanced validation
  validateOnChange?: boolean
  validateOnBlur?: boolean

  // Typography control
  font?: {
    family?: string
    size?: number | string
    weight?:
      | 'normal'
      | 'bold'
      | '100'
      | '200'
      | '300'
      | '400'
      | '500'
      | '600'
      | '700'
      | '800'
      | '900'
    style?: 'normal' | 'italic'
  }
  textAlign?: 'left' | 'center' | 'right'

  // Reactive props support (Signal types from @tachui/core)
  text?: string | (() => string) // Signal support
  placeholderSignal?: string | (() => string) // Signal support
  disabledSignal?: boolean | (() => boolean) // Signal support
}

/**
 * Number input specific props
 */
export interface NumberFieldProps extends BaseFieldProps {
  min?: number
  max?: number
  step?: number
  precision?: number
  format?: 'decimal' | 'currency' | 'percentage'
  currency?: string
}

/**
 * Checkbox/Toggle props
 */
export interface CheckboxProps extends BaseFieldProps {
  checked?: boolean
  defaultChecked?: boolean
  indeterminate?: boolean
}

/**
 * Radio button props
 */
export interface RadioProps extends BaseFieldProps {
  value: any
  checked?: boolean
  groupName?: string
}

/**
 * Select/Picker option interface
 */
export interface SelectOption<T = any> {
  label: string
  value: T
  disabled?: boolean
  group?: string
}

/**
 * Select/Picker props
 */
export interface SelectProps extends BaseFieldProps {
  options: SelectOption[]
  multiple?: boolean
  searchable?: boolean
  clearable?: boolean
  placeholder?: string
  noOptionsMessage?: string
  loadingMessage?: string
  maxMenuHeight?: number
}

/**
 * Date picker props
 */
export interface DatePickerProps extends BaseFieldProps {
  format?: string
  locale?: string
  minDate?: Date
  maxDate?: Date
  disabledDates?: Date[] | ((date: Date) => boolean)
  showTime?: boolean
  timeFormat?: string
  startOfWeek?: 0 | 1 | 2 | 3 | 4 | 5 | 6
  monthsToShow?: number
  inline?: boolean
}

/**
 * Slider props
 */
export interface SliderProps extends BaseFieldProps {
  min?: number
  max?: number
  step?: number
  range?: boolean
  marks?: Record<number, string>
  vertical?: boolean
  tooltip?: boolean | 'always' | 'hover'
  formatTooltip?: (value: number) => string
}

/**
 * Stepper props
 */
export interface StepperProps extends BaseFieldProps {
  min?: number
  max?: number
  step?: number
  precision?: number
  size?: 'small' | 'medium' | 'large'
  showControls?: boolean
  allowEmpty?: boolean
}

/**
 * Form container props
 */
export interface FormProps extends ComponentProps {
  onSubmit?: FormSubmitHandler
  onChange?: FormChangeHandler
  validation?: {
    validateOn?: 'change' | 'blur' | 'submit'
    stopOnFirstError?: boolean
    debounceMs?: number
  }
  initialValues?: Record<string, any>
  resetOnSubmit?: boolean
  preserveValues?: boolean
  children: ComponentChildren
}

/**
 * Enhanced FormSection props (combines Core Section features with form semantics)
 */
export interface FormSectionProps extends ComponentProps {
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
}

/**
 * Multi-step form props
 */
export interface MultiStepFormProps extends ComponentProps {
  steps: FormStep[]
  currentStep?: number
  onStepChange?: (step: number) => void
  onComplete?: FormSubmitHandler
  showProgress?: boolean
  allowSkipSteps?: boolean
  validateStepOnNext?: boolean
}

/**
 * Form step interface
 */
export interface FormStep {
  id: string
  title: string
  description?: string
  component: ComponentInstance
  validation?: FieldValidation
  optional?: boolean
}

/**
 * Form builder field configuration
 */
export interface FormFieldConfig {
  type: 'text' | 'number' | 'email' | 'select' | 'checkbox' | 'radio' | 'date' | 'slider'
  name: string
  label: string
  placeholder?: string
  required?: boolean
  validation?: FieldValidation
  options?: SelectOption[] // For select, radio
  min?: number // For number, date, slider
  max?: number // For number, date, slider
  step?: number // For number, slider
  format?: string // For date
  defaultValue?: any
  conditional?: {
    field: string
    operator: 'equals' | 'not-equals' | 'contains' | 'greater' | 'less'
    value: any
  }
}

/**
 * Form builder schema
 */
export interface FormSchema {
  id: string
  title?: string
  description?: string
  fields: FormFieldConfig[]
  sections?: FormSectionConfig[]
  validation?: {
    rules?: Record<string, ValidationRule[]>
    crossFieldValidation?: CrossFieldValidation[]
  }
}

/**
 * Form section configuration for builder
 */
export interface FormSectionConfig {
  id: string
  title: string
  description?: string
  fields: string[] // Field names in this section
  collapsible?: boolean
  conditional?: {
    field: string
    operator: 'equals' | 'not-equals' | 'contains'
    value: any
  }
}

/**
 * Cross-field validation interface
 */
export interface CrossFieldValidation {
  fields: string[]
  validate: (values: Record<string, any>) => ValidationResult
  message: string
}

/**
 * Form validation configuration
 */
export interface FormValidationConfig {
  rules: Record<string, ValidationRule[]>
  messages: Record<string, string>
  validateOn: 'change' | 'blur' | 'submit'
  debounceMs: number
  stopOnFirstError: boolean
}

/**
 * Form theme configuration
 */
export interface FormTheme {
  spacing: {
    fieldGap: string
    sectionGap: string
    labelGap: string
  }
  colors: {
    border: string
    borderFocus: string
    borderError: string
    background: string
    backgroundFocus: string
    backgroundError: string
    text: string
    textError: string
    textHelper: string
    label: string
  }
  typography: {
    labelSize: string
    inputSize: string
    helperSize: string
    errorSize: string
  }
  borderRadius: string
  shadows: {
    focus: string
    error: string
  }
}

/**
 * Form analytics/tracking interface
 */
export interface FormAnalytics {
  onFieldFocus?: (field: string) => void
  onFieldBlur?: (field: string, value: any, timeSpent: number) => void
  onFieldError?: (field: string, error: string) => void
  onFormStart?: () => void
  onFormSubmit?: (values: Record<string, any>, timeSpent: number) => void
  onFormAbandon?: (completedFields: string[], timeSpent: number) => void
}

/**
 * Form accessibility configuration
 */
export interface FormAccessibility {
  announceErrors?: boolean
  announceValidation?: boolean
  errorSummary?: boolean
  skipLinks?: boolean
  labelStrategy?: 'label' | 'aria-label' | 'aria-labelledby'
  fieldsetStrategy?: 'auto' | 'manual'
}

/**
 * Field registration result
 */
export interface FieldRegistration {
  register: (name: string, validation?: FieldValidation) => void
  unregister: (name: string) => void
  setValue: (name: string, value: any) => void
  getValue: (name: string) => any
  getError: (name: string) => string | undefined
  validateField: (name: string) => Promise<boolean>
}

/**
 * Form hook return interface
 */
export interface UseFormReturn {
  fields: Record<string, FieldState>
  state: FormState
  register: FieldRegistration['register']
  unregister: FieldRegistration['unregister']
  setValue: FieldRegistration['setValue']
  getValue: FieldRegistration['getValue']
  getError: FieldRegistration['getError']
  validateField: FieldRegistration['validateField']
  validateForm: () => Promise<boolean>
  resetForm: () => void
  submitForm: (handler?: FormSubmitHandler) => Promise<void>
  watch: (fields?: string[]) => Record<string, any>
  trigger: (fields?: string[]) => Promise<boolean>
}
