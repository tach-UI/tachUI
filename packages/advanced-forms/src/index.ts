/**
 * @tachui/advanced-forms Plugin
 * 
 * Advanced form components for complex form interactions:
 * - DatePicker: Calendar and time selection
 * - Stepper: Numeric input with increment/decrement  
 * - Slider: Range input with marks and styling
 * 
 * Bundle size: ~85KB
 * Use cases: Complex forms, multi-step wizards, data entry applications
 */

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

// Plugin metadata
export const PLUGIN_NAME = '@tachui/advanced-forms'
export const PLUGIN_VERSION = '0.1.0'
export const PLUGIN_DESCRIPTION = 'Advanced form components - DatePicker, Stepper, Slider'
export const BUNDLE_SIZE_TARGET = '~85KB'

// Component registry (static exports - no dynamic loading to avoid duplication)
export const COMPONENTS = {
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