/**
 * TachUI Forms - Comprehensive Form Components and Validation
 *
 * Unified package combining all form functionality from @tachui/forms and @tachui/advanced-forms
 * Provides 27 components with comprehensive validation and optimal tree-shaking
 */

// Form Container Components
export * from './components/form-container'

// Text Input Components (TextField, TextArea, EmailField, etc.)
export * from './components/text-input'

// Selection Components (Checkbox, Radio, Select, etc.)
export * from './components/selection'

// Advanced Components (Stepper, Slider)
export * from './components/advanced'

// Date Components (DatePicker with rich calendar interface)
export * from './components/date-picker'

// State Management
export * from './state'

// Validation System
export * from './validation'

// Utilities and Helpers
export * from './utils'

// Export specific types to avoid conflicts
export type {
  // Core form types
  ValidationRule,
  ValidationResult,
  FieldValidation,
  FieldState,

  // Component prop types (using specific names to avoid conflicts)
  TextFieldProps,
  NumberFieldProps,
  TextFieldFormatter,
  TextFieldParser,
  AutoCapitalization,
  KeyboardType,
  ReturnKeyType,
} from './types'
