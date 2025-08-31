/**
 * Advanced Form Components
 *
 * Stepper and Slider components from @tachui/advanced-forms
 */

// Import and re-export the complete implementations
export { Stepper } from './Stepper'
export { Slider } from './Slider'

// Export types
export type { StepperProps, SliderProps } from '../../types'

// Legacy type aliases for backwards compatibility
export type StepperValue = number
export type SliderValue = number
export interface SliderMark {
  value: number
  label?: string
}
