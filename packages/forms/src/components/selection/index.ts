/**
 * Selection Components
 *
 * Checkbox, radio, select, and other selection input components
 */

// Component implementations
export { Checkbox, CheckboxGroup, Switch } from './Checkbox'
export { Radio, RadioGroup } from './Radio'
export { Combobox, MultiSelect, Select } from './Select'

// Type aliases for convenience
export type CheckboxGroupProps = {
  name: string
  label?: string
  options: Array<{
    value: any
    label: string
    disabled?: boolean
  }>
  value?: any[]
  defaultValue?: any[]
  onChange?: (name: string, value: any[], selected: any) => void
  validation?: any
  error?: string
  helperText?: string
  disabled?: boolean
  required?: boolean
  direction?: 'horizontal' | 'vertical'
  id?: string
  [key: string]: any
}

export type RadioGroupProps = {
  name: string
  label?: string
  options: Array<{
    value: any
    label: string
    disabled?: boolean
  }>
  value?: any
  defaultValue?: any
  onChange?: (name: string, value: any) => void
  validation?: any
  error?: string
  helperText?: string
  disabled?: boolean
  required?: boolean
  direction?: 'horizontal' | 'vertical'
  id?: string
  [key: string]: any
}

// Additional component-specific props
export interface SwitchProps {
  name: string
  label?: string
  checked?: boolean
  defaultChecked?: boolean
  indeterminate?: boolean
  disabled?: boolean
  required?: boolean
  validation?: any
  onChange?: any
  onBlur?: any
  onFocus?: any
  error?: string
  helperText?: string
  size?: 'small' | 'medium' | 'large'
  [key: string]: any
}

// Re-export types for convenience
export type {
  CheckboxProps,
  RadioProps,
  SelectProps,
  SelectOption,
} from '../../types'
export type OptionValue = any
