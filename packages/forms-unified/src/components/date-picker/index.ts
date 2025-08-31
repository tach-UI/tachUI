/**
 * Date Picker Component
 *
 * Rich calendar interface for date selection from @tachui/advanced-forms
 */

// Import and re-export the complete DatePicker implementation
export { DatePicker } from './DatePicker'

// Export types
export type {
  DatePickerProps,
  DatePickerDisplayComponents,
  DatePickerStyle,
} from './DatePicker'

// Legacy type aliases for backwards compatibility
export type DatePickerValue = Date | Date[] | { start: Date; end: Date }
export type DatePickerMode = 'single' | 'range' | 'multiple'
export type CalendarDate = Date
