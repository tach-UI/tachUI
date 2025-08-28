/**
 * Enhanced Slider Component (Phase 6.4.4)
 *
 * SwiftUI-inspired Slider component with range selection, formatting,
 * and precise value control for numeric input.
 */

import type { ModifiableComponent, ModifierBuilder } from '@tachui/core'
import { createEffect, createSignal, isSignal } from '@tachui/core'
import type { Signal } from '@tachui/core'
import { h, text } from '@tachui/core'
import type { ComponentInstance, ComponentProps } from '@tachui/core'
import { withModifiers } from '@tachui/core'

/**
 * Slider component properties
 */
export interface SliderProps extends ComponentProps {
  // Value binding
  value: number | Signal<number>
  onValueChange?: (value: number) => void

  // Range
  min?: number
  max?: number
  step?: number

  // Formatting
  formatter?: (value: number) => string
  minimumValueLabel?: string
  maximumValueLabel?: string

  // Appearance
  variant?: 'default' | 'filled' | 'minimal'
  trackColor?: string
  thumbColor?: string
  activeTrackColor?: string
  size?: 'small' | 'medium' | 'large'

  // Behavior
  disabled?: boolean | Signal<boolean>
  showValue?: boolean
  showLabels?: boolean

  // Advanced features
  marks?: SliderMark[]
  range?: boolean
  vertical?: boolean

  // Accessibility
  accessibilityLabel?: string
  accessibilityHint?: string
  accessibilityValueDescription?: (value: number) => string
}

/**
 * Slider mark configuration
 */
export interface SliderMark {
  value: number
  label?: string
  color?: string
}

/**
 * Enhanced Slider component class
 */
export class EnhancedSlider implements ComponentInstance<SliderProps> {
  public readonly type = 'component' as const
  public readonly id: string
  public mounted = false
  public cleanup: (() => void)[] = []
  private sliderElement: HTMLInputElement | null = null
  private isDragging: () => boolean
  private setIsDragging: (dragging: boolean) => boolean

  constructor(public props: SliderProps) {
    this.id = `slider-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Initialize internal state
    const [dragging, setDragging] = createSignal(false)
    this.isDragging = dragging
    this.setIsDragging = setDragging

    // Handle value changes reactively
    createEffect(() => {
      const currentValue = this.getValue()
      if (this.sliderElement && !this.isDragging()) {
        this.sliderElement.value = String(currentValue)
        this.updateTrackFill()
      }
    })
  }

  /**
   * Get current value
   */
  private getValue(): number {
    const { value } = this.props
    if (isSignal(value)) {
      return (value as () => number)()
    }
    return value as number
  }

  /**
   * Check if slider is disabled
   */
  private isDisabled(): boolean {
    const { disabled } = this.props
    if (typeof disabled === 'boolean') return disabled
    if (isSignal(disabled)) return (disabled as () => boolean)()
    return false
  }

  /**
   * Format value for display
   */
  private formatValue(value: number): string {
    const { formatter } = this.props
    if (formatter) {
      return formatter(value)
    }

    // Default formatting based on step
    const step = this.props.step || 1
    if (step < 1) {
      const decimals = String(step).split('.')[1]?.length || 0
      return value.toFixed(decimals)
    }

    return String(Math.round(value))
  }

  /**
   * Handle value change
   */
  private handleValueChange = (newValue: number) => {
    const { min = 0, max = 100, step = 1 } = this.props

    // Clamp value to range
    let clampedValue = Math.max(min, Math.min(max, newValue))

    // Snap to step
    if (step > 0) {
      clampedValue = Math.round((clampedValue - min) / step) * step + min
    }

    // Update value
    if (this.props.onValueChange) {
      this.props.onValueChange(clampedValue)
    }

    this.updateTrackFill()
  }

  /**
   * Update track fill visual
   */
  private updateTrackFill() {
    if (!this.sliderElement) return

    const { min = 0, max = 100 } = this.props
    const value = this.getValue()
    const percentage = ((value - min) / (max - min)) * 100

    // Update CSS custom property for track fill
    this.sliderElement.style.setProperty('--slider-progress', `${percentage}%`)
  }

  /**
   * Handle input events
   */
  private handleInput = (event: Event) => {
    const target = event.target as HTMLInputElement
    const value = parseFloat(target.value)

    if (!Number.isNaN(value)) {
      this.handleValueChange(value)
    }
  }

  /**
   * Handle mouse/touch start
   */
  private handleStart = () => {
    if (!this.isDisabled()) {
      this.setIsDragging(true)
    }
  }

  /**
   * Handle mouse/touch end
   */
  private handleEnd = () => {
    this.setIsDragging(false)
  }

  /**
   * Get slider size styles
   */
  private getSizeStyles() {
    const { size = 'medium' } = this.props

    switch (size) {
      case 'small':
        return {
          height: '4px',
          thumbSize: '16px',
        }
      case 'large':
        return {
          height: '8px',
          thumbSize: '24px',
        }
      default:
        return {
          height: '6px',
          thumbSize: '20px',
        }
    }
  }

  /**
   * Get slider variant styles
   */
  private getVariantStyles() {
    const {
      variant = 'default',
      trackColor = '#e2e8f0',
      activeTrackColor = '#007AFF',
      thumbColor = '#ffffff',
    } = this.props
    const sizeStyles = this.getSizeStyles()

    const baseStyles = {
      '--slider-track-color': trackColor,
      '--slider-active-track-color': activeTrackColor,
      '--slider-thumb-color': thumbColor,
      '--slider-height': sizeStyles.height,
      '--slider-thumb-size': sizeStyles.thumbSize,
    }

    switch (variant) {
      case 'filled':
        return {
          ...baseStyles,
          '--slider-track-color': '#f1f5f9',
          '--slider-active-track-color': activeTrackColor,
          backgroundColor: '#f8fafc',
          borderRadius: '12px',
          padding: '8px',
        }

      case 'minimal':
        return {
          ...baseStyles,
          '--slider-track-color': 'transparent',
          '--slider-active-track-color': activeTrackColor,
          border: `1px solid ${trackColor}`,
        }
      default:
        return baseStyles
    }
  }

  /**
   * Render slider marks
   */
  private renderMarks() {
    const { marks, min = 0, max = 100 } = this.props

    if (!marks || marks.length === 0) {
      return []
    }

    return marks.map((mark) => {
      const percentage = ((mark.value - min) / (max - min)) * 100

      return h(
        'div',
        {
          key: String(mark.value),
          style: {
            position: 'absolute',
            left: `${percentage}%`,
            top: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            pointerEvents: 'none',
          },
        },
        // Mark indicator
        h('div', {
          style: {
            width: '2px',
            height: '12px',
            backgroundColor: mark.color || '#666',
            marginBottom: '4px',
          },
        }),

        // Mark label
        ...(mark.label
          ? [
              h(
                'span',
                {
                  style: {
                    fontSize: '12px',
                    color: '#666',
                    whiteSpace: 'nowrap',
                  },
                },
                text(mark.label)
              ),
            ]
          : [])
      )
    })
  }

  /**
   * Render value labels
   */
  private renderLabels() {
    const { showLabels, min = 0, max = 100, minimumValueLabel, maximumValueLabel } = this.props

    if (!showLabels) return []

    return [
      h(
        'div',
        {
          style: {
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '8px',
            fontSize: '12px',
            color: '#666',
          },
        },
        h('span', {}, text(minimumValueLabel || this.formatValue(min))),
        h('span', {}, text(maximumValueLabel || this.formatValue(max)))
      ),
    ]
  }

  /**
   * Render value display
   */
  private renderValueDisplay() {
    const { showValue } = this.props

    if (!showValue) return []

    const currentValue = this.getValue()

    return [
      h(
        'div',
        {
          style: {
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '8px',
            fontSize: '14px',
            fontWeight: '600',
            color: '#1a1a1a',
          },
        },
        text(this.formatValue(currentValue))
      ),
    ]
  }

  render() {
    const {
      min = 0,
      max = 100,
      step = 1,
      vertical = false,
      accessibilityLabel,
      accessibilityHint,
      accessibilityValueDescription,
    } = this.props

    const currentValue = this.getValue()
    const variantStyles = this.getVariantStyles()
    const isDisabled = this.isDisabled()

    // Slider CSS styles
    const sliderStyles = {
      appearance: 'none' as const,
      width: vertical ? '6px' : '100%',
      height: vertical ? '200px' : 'var(--slider-height)',
      background: `linear-gradient(to ${vertical ? 'top' : 'right'}, var(--slider-active-track-color) 0%, var(--slider-active-track-color) var(--slider-progress, 0%), var(--slider-track-color) var(--slider-progress, 0%), var(--slider-track-color) 100%)`,
      borderRadius: 'calc(var(--slider-height) / 2)',
      outline: 'none',
      cursor: isDisabled ? 'not-allowed' : 'pointer',
      opacity: isDisabled ? 0.5 : 1,
      transition: 'all 0.2s ease',

      // Webkit styles
      WebkitAppearance: 'none' as const,

      // Thumb styles
      '&::-webkit-slider-thumb': {
        appearance: 'none',
        width: 'var(--slider-thumb-size)',
        height: 'var(--slider-thumb-size)',
        borderRadius: '50%',
        background: 'var(--slider-thumb-color)',
        border: '2px solid var(--slider-active-track-color)',
        cursor: isDisabled ? 'not-allowed' : 'grab',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        transition: 'all 0.2s ease',
      },

      '&::-webkit-slider-thumb:hover': !isDisabled
        ? {
            transform: 'scale(1.1)',
            boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
          }
        : {},

      '&::-webkit-slider-thumb:active': !isDisabled
        ? {
            cursor: 'grabbing',
            transform: 'scale(1.05)',
          }
        : {},

      // Firefox styles
      '&::-moz-range-thumb': {
        width: 'var(--slider-thumb-size)',
        height: 'var(--slider-thumb-size)',
        borderRadius: '50%',
        background: 'var(--slider-thumb-color)',
        border: '2px solid var(--slider-active-track-color)',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      },

      '&::-moz-range-track': {
        height: 'var(--slider-height)',
        borderRadius: 'calc(var(--slider-height) / 2)',
        background: 'var(--slider-track-color)',
        border: 'none',
      },
    }

    return h(
      'div',
      {
        style: {
          ...variantStyles,
          position: 'relative',
          display: 'flex',
          flexDirection: vertical ? 'row' : 'column',
          alignItems: vertical ? 'center' : 'stretch',
          gap: vertical ? '12px' : '0',
        },
        'aria-label': accessibilityLabel,
        'aria-describedby': accessibilityHint ? `${this.id}-hint` : undefined,
      },
      // Value display
      ...this.renderValueDisplay(),

      // Slider container
      h(
        'div',
        {
          style: {
            position: 'relative',
            width: vertical ? 'auto' : '100%',
            height: vertical ? '200px' : 'auto',
          },
        },
        // Slider input
        h('input', {
          ref: (el: HTMLInputElement) => {
            this.sliderElement = el

            if (el && !this.mounted) {
              // Set up event listeners
              el.addEventListener('input', this.handleInput)
              el.addEventListener('mousedown', this.handleStart)
              el.addEventListener('mouseup', this.handleEnd)
              el.addEventListener('touchstart', this.handleStart)
              el.addEventListener('touchend', this.handleEnd)

              this.cleanup.push(() => {
                el.removeEventListener('input', this.handleInput)
                el.removeEventListener('mousedown', this.handleStart)
                el.removeEventListener('mouseup', this.handleEnd)
                el.removeEventListener('touchstart', this.handleStart)
                el.removeEventListener('touchend', this.handleEnd)
              })

              // Initial setup
              this.updateTrackFill()
              this.mounted = true
            }
          },
          type: 'range',
          min: String(min),
          max: String(max),
          step: String(step),
          value: String(currentValue),
          disabled: isDisabled,
          orient: vertical ? 'vertical' : undefined,
          style: sliderStyles,
          'aria-label': accessibilityLabel,
          'aria-valuemin': min,
          'aria-valuemax': max,
          'aria-valuenow': currentValue,
          'aria-valuetext': accessibilityValueDescription
            ? accessibilityValueDescription(currentValue)
            : this.formatValue(currentValue),
        }),

        // Slider marks
        ...this.renderMarks()
      ),

      // Labels
      ...this.renderLabels(),

      // Accessibility hint
      ...(accessibilityHint
        ? [
            h(
              'div',
              {
                id: `${this.id}-hint`,
                style: {
                  fontSize: '12px',
                  color: '#666',
                  marginTop: '4px',
                },
              },
              text(accessibilityHint)
            ),
          ]
        : [])
    )
  }
}

/**
 * Slider component function
 */
export function Slider(
  value: number | Signal<number>,
  props: Omit<SliderProps, 'value'> = {}
): ModifiableComponent<SliderProps> & {
  modifier: ModifierBuilder<ModifiableComponent<SliderProps>>
} {
  const sliderProps: SliderProps = { ...props, value }
  const component = new EnhancedSlider(sliderProps)
  return withModifiers(component)
}

/**
 * Slider style variants
 */
export const SliderStyles = {
  /**
   * Default slider (default)
   */
  Default(value: number | Signal<number>, props: Omit<SliderProps, 'value' | 'variant'> = {}) {
    return Slider(value, { ...props, variant: 'default' })
  },

  /**
   * Filled slider with background
   */
  Filled(value: number | Signal<number>, props: Omit<SliderProps, 'value' | 'variant'> = {}) {
    return Slider(value, { ...props, variant: 'filled' })
  },

  /**
   * Minimal slider with minimal styling
   */
  Minimal(value: number | Signal<number>, props: Omit<SliderProps, 'value' | 'variant'> = {}) {
    return Slider(value, { ...props, variant: 'minimal' })
  },

  /**
   * Vertical slider
   */
  Vertical(value: number | Signal<number>, props: Omit<SliderProps, 'value' | 'vertical'> = {}) {
    return Slider(value, { ...props, vertical: true })
  },

  /**
   * Range slider with marks
   */
  WithMarks(
    value: number | Signal<number>,
    marks: SliderMark[],
    props: Omit<SliderProps, 'value' | 'marks'> = {}
  ) {
    return Slider(value, { ...props, marks })
  },

  /**
   * Slider with value display
   */
  WithValue(value: number | Signal<number>, props: Omit<SliderProps, 'value' | 'showValue'> = {}) {
    return Slider(value, { ...props, showValue: true })
  },

  /**
   * Slider with labels
   */
  WithLabels(
    value: number | Signal<number>,
    minimumLabel: string,
    maximumLabel: string,
    props: Omit<
      SliderProps,
      'value' | 'showLabels' | 'minimumValueLabel' | 'maximumValueLabel'
    > = {}
  ) {
    return Slider(value, {
      ...props,
      showLabels: true,
      minimumValueLabel: minimumLabel,
      maximumValueLabel: maximumLabel,
    })
  },
}

/**
 * Slider utilities
 */
export const SliderUtils = {
  /**
   * Create marks for common ranges
   */
  createMarks(min: number, max: number, step: number): SliderMark[] {
    const marks: SliderMark[] = []

    for (let value = min; value <= max; value += step) {
      marks.push({
        value,
        label: String(value),
      })
    }

    return marks
  },

  /**
   * Create percentage marks
   */
  createPercentageMarks(): SliderMark[] {
    return [
      { value: 0, label: '0%' },
      { value: 25, label: '25%' },
      { value: 50, label: '50%' },
      { value: 75, label: '75%' },
      { value: 100, label: '100%' },
    ]
  },

  /**
   * Create custom formatter
   */
  createFormatter(unit: string, decimals: number = 0): (value: number) => string {
    return (value: number) => `${value.toFixed(decimals)}${unit}`
  },

  /**
   * Snap value to step
   */
  snapToStep(value: number, min: number, step: number): number {
    return Math.round((value - min) / step) * step + min
  },

  /**
   * Convert slider value to different scale
   */
  mapToScale(
    value: number,
    fromMin: number,
    fromMax: number,
    toMin: number,
    toMax: number
  ): number {
    const percentage = (value - fromMin) / (fromMax - fromMin)
    return toMin + percentage * (toMax - toMin)
  },
}
