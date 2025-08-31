/**
 * Advanced Form Components
 *
 * Stepper and Slider components from @tachui/advanced-forms
 */

// TODO: Migrate actual components from @tachui/advanced-forms
// Placeholder implementations for unified package structure

export interface StepperProps {
  value?: number
  min?: number
  max?: number
  step?: number
  disabled?: boolean
}

export interface SliderProps {
  value?: number
  min?: number
  max?: number
  step?: number
  disabled?: boolean
}

export interface SliderMark {
  value: number
  label?: string
}

export class Stepper {
  readonly type = 'stepper'
  constructor(public readonly properties: StepperProps) {}
}

export class Slider {
  readonly type = 'slider'
  constructor(public readonly properties: SliderProps) {}
}

export function stepper(props: StepperProps): Stepper {
  return new Stepper(props)
}

export function slider(props: SliderProps): Slider {
  return new Slider(props)
}

// Type aliases
export type StepperValue = number
export type SliderValue = number
