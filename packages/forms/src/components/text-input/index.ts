/**
 * Text Input Components
 *
 * All text-based input components with validation
 */

// Import and re-export the complete TextField implementation
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
} from './TextField'

// Export types from the main types file
export type {
  TextFieldProps,
  NumberFieldProps,
  TextFieldType,
  TextFieldFormatter,
  TextFieldParser,
  AutoCapitalization,
  KeyboardType,
  ReturnKeyType,
} from '../../types'
