/**
 * @tachui/advanced-forms Plugin
 *
 * Advanced form components for complex form interactions:
 * - TextField: Enhanced text input with validation, formatting, and mobile features
 * - DatePicker: Calendar and time selection
 * - Stepper: Numeric input with increment/decrement
 * - Slider: Range input with marks and styling
 *
 * Bundle size: ~85KB
 * Use cases: Complex forms, multi-step wizards, data entry applications
 */

// Text input components with advanced features
export {
  TextField,
  EmailField,
  PasswordField,
  SearchField,
  URLField,
  PhoneField,
  NumberField,
  CreditCardField,
  SSNField,
  PostalCodeField,
  TextArea,
  DateField,
  TimeField,
  ColorField,
} from './components/TextField'

// Advanced form components
export {
  DatePicker,
  DatePickerStyles,
  DatePickerUtils,
  type DatePickerProps,
  type DatePickerDisplayComponents,
  type DatePickerStyle,
} from './DatePicker'

export {
  Stepper,
  StepperStyles,
  StepperUtils,
  type StepperProps,
  type StepperTheme,
  type StepperValue,
} from './Stepper'

export {
  Slider,
  SliderStyles,
  SliderUtils,
  type SliderProps,
  type SliderMark,
} from './Slider'

// Form state management
export { createFormState, createField, createMultiStepFormState } from './state'

// Types for TextField and form management
export type {
  TextFieldProps,
  TextFieldType,
  TextFieldFormatter,
  TextFieldParser,
  AutoCapitalization,
  KeyboardType,
  ReturnKeyType,
  BaseFieldProps,
  FieldState,
  FieldValidation,
  FormState,
  FormSubmitHandler,
  FormChangeHandler,
  UseFormReturn,
  ValidationRule,
  ValidationResult,
  CustomValidationRule,
  BuiltInValidationRule,
} from './types'

// Formatters and parsers
export { TextFieldFormatters, TextFieldParsers } from './utils/formatters'

// Validation system
export {
  validateValue,
  validateField,
  validateValueAsync,
  registerValidationRule,
  unregisterValidationRule,
  getValidationRules,
  createDebouncedValidator,
  CrossFieldValidators,
  ValidationPresets,
  ValidationMessageFormatter,
  defaultMessageFormatter,
  ValidationUtils,
  VALIDATION_RULES,
} from './validation'

// Plugin metadata
export const PLUGIN_NAME = '@tachui/advanced-forms'
export const PLUGIN_VERSION = '0.1.0'
export const PLUGIN_DESCRIPTION =
  'Advanced form components with TextField, DatePicker, Stepper, Slider'
export const BUNDLE_SIZE_TARGET = '~85KB'

// Component registry (static exports - no dynamic loading to avoid duplication)
export const COMPONENTS = {
  TextField: 'TextField',
  EmailField: 'EmailField',
  PasswordField: 'PasswordField',
  SearchField: 'SearchField',
  URLField: 'URLField',
  PhoneField: 'PhoneField',
  NumberField: 'NumberField',
  CreditCardField: 'CreditCardField',
  SSNField: 'SSNField',
  PostalCodeField: 'PostalCodeField',
  TextArea: 'TextArea',
  DateField: 'DateField',
  TimeField: 'TimeField',
  ColorField: 'ColorField',
  DatePicker: 'DatePicker',
  Stepper: 'Stepper',
  Slider: 'Slider',
} as const

export type AdvancedFormsComponent = keyof typeof COMPONENTS

/**
 * Note: Dynamic imports removed to prevent bundle duplication warnings.
 * Components are available as static exports for better tree-shaking.
 *
 * If dynamic loading is needed, import components individually:
 * const { DatePicker } = await import('@tachui/advanced-forms/DatePicker')
 */
