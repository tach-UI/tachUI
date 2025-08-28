/**
 * Stepper Component (TachUI)
 *
 * SwiftUI-inspired stepper component for numeric input with increment/decrement controls.
 * Provides bounded value adjustment with customizable step intervals and formatting.
 */

import type { ModifiableComponent, ModifierBuilder } from '@tachui/core'
import { createEffect, getSignalImpl, isSignal } from '@tachui/core'
import type { Signal } from '@tachui/core'
import { h } from '@tachui/core'
import type { ComponentInstance, ComponentProps, DOMNode } from '@tachui/core'
import { withModifiers } from '@tachui/core'

/**
 * Stepper value types - supports integers and floating point numbers
 */
export type StepperValue = number

/**
 * Stepper component properties
 */
export interface StepperProps extends ComponentProps {
  // Core properties
  title?: string
  value: Signal<StepperValue> | StepperValue

  // Range and stepping
  minimumValue?: StepperValue
  maximumValue?: StepperValue
  step?: StepperValue

  // Custom actions (alternative to value binding)
  onIncrement?: () => void
  onDecrement?: () => void

  // Event handling
  onChange?: (value: StepperValue) => void
  onEditingChanged?: (editing: boolean) => void

  // Behavior
  disabled?: boolean | Signal<boolean>
  allowsEmptyValue?: boolean

  // Formatting
  valueFormatter?: (value: StepperValue) => string
  displayValueInLabel?: boolean

  // Accessibility
  accessibilityLabel?: string
  accessibilityHint?: string
  incrementAccessibilityLabel?: string
  decrementAccessibilityLabel?: string
}

/**
 * Stepper theme configuration
 */
export interface StepperTheme {
  colors: {
    background: string
    border: string
    buttonBackground: string
    buttonHover: string
    buttonPress: string
    buttonDisabled: string
    text: string
    buttonText: string
    disabledText: string
    focusRing: string
  }
  spacing: {
    padding: number
    gap: number
    borderRadius: number
    buttonSize: number
  }
  typography: {
    labelSize: number
    buttonSize: number
    labelWeight: string
    buttonWeight: string
    fontFamily: string
  }
  transitions: {
    duration: number
    easing: string
  }
}

/**
 * Default Stepper theme
 */
const defaultStepperTheme: StepperTheme = {
  colors: {
    background: '#FFFFFF',
    border: '#D1D1D6',
    buttonBackground: '#F2F2F7',
    buttonHover: '#E5E5EA',
    buttonPress: '#D1D1D6',
    buttonDisabled: '#F2F2F7',
    text: '#000000',
    buttonText: '#007AFF',
    disabledText: '#8E8E93',
    focusRing: '#007AFF',
  },
  spacing: {
    padding: 12,
    gap: 8,
    borderRadius: 8,
    buttonSize: 32,
  },
  typography: {
    labelSize: 16,
    buttonSize: 18,
    labelWeight: '400',
    buttonWeight: '600',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  transitions: {
    duration: 150,
    easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
  },
}

/**
 * Stepper component implementation
 */
export class StepperComponent implements ComponentInstance<StepperProps> {
  public readonly type = 'component' as const
  public readonly id: string
  public readonly props: StepperProps
  private theme: StepperTheme = defaultStepperTheme
  private incrementButton: HTMLElement | null = null
  private decrementButton: HTMLElement | null = null
  private isEditing = false
  private longPressTimer: ReturnType<typeof setTimeout> | null = null
  private longPressInterval: ReturnType<typeof setInterval> | null = null

  constructor(props: StepperProps) {
    this.props = props
    this.id = `stepper-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private resolveValue<T>(value: T | Signal<T>): T {
    return isSignal(value) ? value() : value
  }

  private getValue(): StepperValue {
    return this.resolveValue(this.props.value)
  }

  private setValue(newValue: StepperValue): void {
    const constrainedValue = this.constrainValue(newValue)

    if (isSignal(this.props.value)) {
      const signalImpl = getSignalImpl(this.props.value as any)
      if (signalImpl) {
        signalImpl.set(constrainedValue)
      }
    }

    if (this.props.onChange) {
      this.props.onChange(constrainedValue)
    }
  }

  private getMinimumValue(): StepperValue {
    return this.props.minimumValue ?? -Infinity
  }

  private getMaximumValue(): StepperValue {
    return this.props.maximumValue ?? Infinity
  }

  private getStep(): StepperValue {
    return this.props.step ?? 1
  }

  private isDisabled(): boolean {
    return this.resolveValue(this.props.disabled ?? false)
  }

  private constrainValue(value: StepperValue): StepperValue {
    const min = this.getMinimumValue()
    const max = this.getMaximumValue()
    return Math.min(Math.max(value, min), max)
  }

  private canIncrement(): boolean {
    if (this.isDisabled()) return false
    const currentValue = this.getValue()
    const maxValue = this.getMaximumValue()
    return currentValue < maxValue
  }

  private canDecrement(): boolean {
    if (this.isDisabled()) return false
    const currentValue = this.getValue()
    const minValue = this.getMinimumValue()
    return currentValue > minValue
  }

  private increment(): void {
    if (!this.canIncrement()) return

    if (this.props.onIncrement) {
      this.props.onIncrement()
    } else {
      const currentValue = this.getValue()
      const step = this.getStep()
      this.setValue(currentValue + step)
    }
  }

  private decrement(): void {
    if (!this.canDecrement()) return

    if (this.props.onDecrement) {
      this.props.onDecrement()
    } else {
      const currentValue = this.getValue()
      const step = this.getStep()
      this.setValue(currentValue - step)
    }
  }

  private formatValue(value: StepperValue): string {
    if (this.props.valueFormatter) {
      return this.props.valueFormatter(value)
    }

    // Default formatting with appropriate decimal places
    if (Number.isInteger(value)) {
      return value.toString()
    } else {
      // For decimal values, show up to 2 decimal places, removing trailing zeros
      return parseFloat(value.toFixed(2)).toString()
    }
  }

  private startLongPress(action: () => void): void {
    this.stopLongPress()
    this.setEditing(true)

    // Initial delay before starting continuous increment
    this.longPressTimer = setTimeout(() => {
      // Start continuous increment/decrement
      this.longPressInterval = setInterval(() => {
        action()
      }, 100) // 100ms interval for smooth continuous changes
    }, 500) // 500ms initial delay
  }

  private stopLongPress(): void {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer)
      this.longPressTimer = null
    }

    if (this.longPressInterval) {
      clearInterval(this.longPressInterval)
      this.longPressInterval = null
    }

    this.setEditing(false)
  }

  private setEditing(editing: boolean): void {
    if (this.isEditing !== editing) {
      this.isEditing = editing
      if (this.props.onEditingChanged) {
        this.props.onEditingChanged(editing)
      }
    }
  }

  private createButton(
    type: 'increment' | 'decrement',
    symbol: string,
    action: () => void,
    canPerformAction: boolean
  ): DOMNode {
    const button = h('button', {
      type: 'button',
      disabled: !canPerformAction,
      'aria-label':
        type === 'increment'
          ? this.props.incrementAccessibilityLabel || 'Increment'
          : this.props.decrementAccessibilityLabel || 'Decrement',
      style: {
        width: `${this.theme.spacing.buttonSize}px`,
        height: `${this.theme.spacing.buttonSize}px`,
        border: `1px solid ${this.theme.colors.border}`,
        borderRadius: `${this.theme.spacing.borderRadius}px`,
        backgroundColor: canPerformAction
          ? this.theme.colors.buttonBackground
          : this.theme.colors.buttonDisabled,
        color: canPerformAction ? this.theme.colors.buttonText : this.theme.colors.disabledText,
        fontSize: `${this.theme.typography.buttonSize}px`,
        fontWeight: this.theme.typography.buttonWeight,
        fontFamily: this.theme.typography.fontFamily,
        cursor: canPerformAction ? 'pointer' : 'not-allowed',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
        outline: 'none',
        transition: `all ${this.theme.transitions.duration}ms ${this.theme.transitions.easing}`,
        touchAction: 'manipulation', // Prevent double-tap zoom on mobile
      },
      onclick: (e: Event) => {
        e.preventDefault()
        if (canPerformAction) {
          action()
        }
      },
      onmousedown: (e: Event) => {
        e.preventDefault()
        if (canPerformAction) {
          this.startLongPress(action)
        }
      },
      onmouseup: () => {
        this.stopLongPress()
      },
      ontouchstart: (e: Event) => {
        e.preventDefault()
        if (canPerformAction) {
          this.startLongPress(action)
        }
      },
      ontouchend: (e: Event) => {
        e.preventDefault()
        this.stopLongPress()
      },
      onmouseenter: (e: Event) => {
        if (canPerformAction) {
          const target = e.target as HTMLElement
          target.style.backgroundColor = this.theme.colors.buttonHover
        }
      },
      onmouseleave: (e: Event) => {
        const target = e.target as HTMLElement
        target.style.backgroundColor = canPerformAction
          ? this.theme.colors.buttonBackground
          : this.theme.colors.buttonDisabled
        this.stopLongPress()
      },
      onkeydown: (e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          if (canPerformAction) {
            action()
          }
        }
      },
      onfocus: (e: Event) => {
        const target = e.target as HTMLElement
        target.style.boxShadow = `0 0 0 2px ${this.theme.colors.focusRing}40`
      },
      onblur: (e: Event) => {
        const target = e.target as HTMLElement
        target.style.boxShadow = 'none'
        this.stopLongPress()
      },
    })

    const buttonDOM = button.element as HTMLElement
    if (buttonDOM) {
      buttonDOM.textContent = symbol
      buttonDOM.setAttribute('tabindex', '0')

      if (type === 'increment') {
        this.incrementButton = buttonDOM
      } else {
        this.decrementButton = buttonDOM
      }
    }

    return button
  }

  private createLabel(): DOMNode {
    const currentValue = this.getValue()
    const formattedValue = this.formatValue(currentValue)

    let labelText = this.props.title || ''
    if (this.props.displayValueInLabel !== false && this.props.title) {
      labelText = `${this.props.title}: ${formattedValue}`
    } else if (!this.props.title && this.props.displayValueInLabel !== false) {
      labelText = formattedValue
    }

    const label = h('span', {
      style: {
        fontSize: `${this.theme.typography.labelSize}px`,
        fontWeight: this.theme.typography.labelWeight,
        fontFamily: this.theme.typography.fontFamily,
        color: this.isDisabled() ? this.theme.colors.disabledText : this.theme.colors.text,
        userSelect: 'none',
        display: 'flex',
        alignItems: 'center',
        minHeight: `${this.theme.spacing.buttonSize}px`,
      },
    })

    const labelDOM = label.element as HTMLElement
    if (labelDOM) {
      labelDOM.textContent = labelText
    }

    return label
  }

  render(): DOMNode {
    const container = h('div', {
      id: this.id,
      'data-component': 'stepper',
      role: 'group',
      'aria-label': this.props.accessibilityLabel || this.props.title || 'Numeric stepper',
      'aria-describedby': this.props.accessibilityHint ? `${this.id}-hint` : undefined,
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: `${this.theme.spacing.gap}px`,
        padding: `${this.theme.spacing.padding}px`,
        backgroundColor: this.theme.colors.background,
        border: `1px solid ${this.theme.colors.border}`,
        borderRadius: `${this.theme.spacing.borderRadius}px`,
        fontFamily: this.theme.typography.fontFamily,
      },
    })

    // Create components
    const decrementButton = this.createButton(
      'decrement',
      '−', // Using minus sign (U+2212) instead of hyphen for better visual appearance
      () => this.decrement(),
      this.canDecrement()
    )

    const label = this.createLabel()

    const incrementButton = this.createButton(
      'increment',
      '+',
      () => this.increment(),
      this.canIncrement()
    )

    // Assemble container
    const containerDOM = container.element as HTMLElement
    if (containerDOM) {
      const decrementDOM = decrementButton.element as HTMLElement
      const labelDOM = label.element as HTMLElement
      const incrementDOM = incrementButton.element as HTMLElement

      if (decrementDOM) containerDOM.appendChild(decrementDOM)
      if (labelDOM) containerDOM.appendChild(labelDOM)
      if (incrementDOM) containerDOM.appendChild(incrementDOM)

      // Add accessibility hint if provided
      if (this.props.accessibilityHint) {
        const hint = h('span', {
          id: `${this.id}-hint`,
          style: {
            position: 'absolute',
            width: '1px',
            height: '1px',
            padding: '0',
            margin: '-1px',
            overflow: 'hidden',
            clip: 'rect(0, 0, 0, 0)',
            whiteSpace: 'nowrap',
            border: '0',
          },
        })

        const hintDOM = hint.element as HTMLElement
        if (hintDOM) {
          hintDOM.textContent = this.props.accessibilityHint
          containerDOM.appendChild(hintDOM)
        }
      }
    }

    // Set up reactive effects for value changes
    createEffect(() => {
      // Update button states when value changes
      if (this.incrementButton) {
        const canInc: boolean = this.canIncrement()
        ;(this.incrementButton as any).disabled = !canInc
        this.incrementButton.style.backgroundColor = canInc
          ? this.theme.colors.buttonBackground
          : this.theme.colors.buttonDisabled
        this.incrementButton.style.color = canInc
          ? this.theme.colors.buttonText
          : this.theme.colors.disabledText
        this.incrementButton.style.cursor = canInc ? 'pointer' : 'not-allowed'
      }

      if (this.decrementButton) {
        const canDec: boolean = this.canDecrement()
        ;(this.decrementButton as any).disabled = !canDec
        this.decrementButton.style.backgroundColor = canDec
          ? this.theme.colors.buttonBackground
          : this.theme.colors.buttonDisabled
        this.decrementButton.style.color = canDec
          ? this.theme.colors.buttonText
          : this.theme.colors.disabledText
        this.decrementButton.style.cursor = canDec ? 'pointer' : 'not-allowed'
      }

      // Update label text
      const labelElement = containerDOM?.querySelector('span:not([id$="-hint"])') as HTMLElement
      if (labelElement) {
        const currentValue = this.getValue()
        const formattedValue = this.formatValue(currentValue)

        let labelText = this.props.title || ''
        if (this.props.displayValueInLabel !== false && this.props.title) {
          labelText = `${this.props.title}: ${formattedValue}`
        } else if (!this.props.title && this.props.displayValueInLabel !== false) {
          labelText = formattedValue
        }

        labelElement.textContent = labelText
        labelElement.style.color = this.isDisabled()
          ? this.theme.colors.disabledText
          : this.theme.colors.text
      }
    })

    return container
  }
}

/**
 * Create a Stepper component
 */
export function Stepper(props: StepperProps): ModifiableComponent<StepperProps> & {
  modifier: ModifierBuilder<ModifiableComponent<StepperProps>>
} {
  return withModifiers(new StepperComponent(props))
}

/**
 * Stepper utility functions and presets
 */
export const StepperUtils = {
  /**
   * Create a quantity stepper (1-99, integer values)
   */
  quantity(
    value: Signal<number>,
    onChange?: (value: number) => void
  ): Omit<StepperProps, 'value'> & { value: Signal<number> } {
    return {
      title: 'Quantity',
      value,
      minimumValue: 1,
      maximumValue: 99,
      step: 1,
      onChange,
      displayValueInLabel: true,
      accessibilityLabel: 'Product quantity',
      incrementAccessibilityLabel: 'Increase quantity',
      decrementAccessibilityLabel: 'Decrease quantity',
    }
  },

  /**
   * Create an age stepper (0-120, integer values)
   */
  age(
    value: Signal<number>,
    onChange?: (value: number) => void
  ): Omit<StepperProps, 'value'> & { value: Signal<number> } {
    return {
      title: 'Age',
      value,
      minimumValue: 0,
      maximumValue: 120,
      step: 1,
      onChange,
      displayValueInLabel: true,
      accessibilityLabel: 'Age in years',
      incrementAccessibilityLabel: 'Increase age',
      decrementAccessibilityLabel: 'Decrease age',
    }
  },

  /**
   * Create a percentage stepper (0-100%, integer values)
   */
  percentage(
    value: Signal<number>,
    onChange?: (value: number) => void
  ): Omit<StepperProps, 'value'> & { value: Signal<number> } {
    return {
      title: 'Percentage',
      value,
      minimumValue: 0,
      maximumValue: 100,
      step: 1,
      onChange,
      displayValueInLabel: true,
      valueFormatter: (val: number) => `${val}%`,
      accessibilityLabel: 'Percentage value',
      incrementAccessibilityLabel: 'Increase percentage',
      decrementAccessibilityLabel: 'Decrease percentage',
    }
  },

  /**
   * Create a rating stepper (1-5 or 1-10, decimal values allowed)
   */
  rating(
    value: Signal<number>,
    maxRating: number = 5,
    step: number = 0.5,
    onChange?: (value: number) => void
  ): Omit<StepperProps, 'value'> & { value: Signal<number> } {
    return {
      title: 'Rating',
      value,
      minimumValue: 0,
      maximumValue: maxRating,
      step,
      onChange,
      displayValueInLabel: true,
      valueFormatter: (val: number) => `${val}/${maxRating}`,
      accessibilityLabel: `Rating out of ${maxRating}`,
      incrementAccessibilityLabel: 'Increase rating',
      decrementAccessibilityLabel: 'Decrease rating',
    }
  },

  /**
   * Create a price stepper (0+, decimal values with currency formatting)
   */
  price(
    value: Signal<number>,
    currency: string = '$',
    step: number = 0.01,
    maxValue?: number,
    onChange?: (value: number) => void
  ): Omit<StepperProps, 'value'> & { value: Signal<number> } {
    return {
      title: 'Price',
      value,
      minimumValue: 0,
      maximumValue: maxValue,
      step,
      onChange,
      displayValueInLabel: true,
      valueFormatter: (val: number) => `${currency}${val.toFixed(2)}`,
      accessibilityLabel: 'Price amount',
      incrementAccessibilityLabel: 'Increase price',
      decrementAccessibilityLabel: 'Decrease price',
    }
  },

  /**
   * Create a font size stepper (8-72pt, integer values)
   */
  fontSize(
    value: Signal<number>,
    onChange?: (value: number) => void
  ): Omit<StepperProps, 'value'> & { value: Signal<number> } {
    return {
      title: 'Font Size',
      value,
      minimumValue: 8,
      maximumValue: 72,
      step: 1,
      onChange,
      displayValueInLabel: true,
      valueFormatter: (val: number) => `${val}pt`,
      accessibilityLabel: 'Font size in points',
      incrementAccessibilityLabel: 'Increase font size',
      decrementAccessibilityLabel: 'Decrease font size',
    }
  },
}

/**
 * Stepper styles and theming
 */
export const StepperStyles = {
  theme: defaultStepperTheme,

  /**
   * Create a custom theme
   */
  createTheme(overrides: Partial<StepperTheme>): StepperTheme {
    return { ...defaultStepperTheme, ...overrides }
  },
}
