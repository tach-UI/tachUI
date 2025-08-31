/**
 * Enhanced Toggle Component (Phase 6.4.5)
 *
 * SwiftUI-inspired Toggle component with switch-style boolean controls,
 * smooth animations, and multiple style variants.
 */

import type {
  ModifiableComponent,
  ModifierBuilder,
} from '@tachui/core/modifiers/types'
import { createEffect, createSignal, isSignal } from '@tachui/core/reactive'
import type { Signal } from '@tachui/core/reactive/types'
import { h, text } from '@tachui/core/runtime'
import type {
  ComponentInstance,
  ComponentProps,
  DOMNode,
} from '@tachui/core/runtime/types'
import { withModifiers } from '@tachui/core/components/wrapper'

/**
 * Toggle component properties
 */
export interface ToggleProps extends ComponentProps {
  // Value binding
  isOn: boolean | Signal<boolean>
  onToggle?: (isOn: boolean) => void

  // Content
  label?: string | (() => string) | Signal<string> | ComponentInstance

  // Appearance
  variant?: 'switch' | 'checkbox' | 'button'
  size?: 'small' | 'medium' | 'large'
  color?: string
  offColor?: string
  thumbColor?: string

  // Behavior
  disabled?: boolean | Signal<boolean>
  animated?: boolean

  // Styling
  labelPosition?: 'leading' | 'trailing'
  spacing?: number

  // Accessibility
  accessibilityLabel?: string
  accessibilityHint?: string
}

/**
 * Enhanced Toggle component class
 */
export class EnhancedToggle implements ComponentInstance<ToggleProps> {
  public readonly type = 'component' as const
  public readonly id: string
  public mounted = false
  public cleanup: (() => void)[] = []
  private toggleElement: HTMLInputElement | null = null
  // isAnimating state removed - not used in current implementation
  private setIsAnimating: (animating: boolean) => boolean

  constructor(public props: ToggleProps) {
    this.id = `toggle-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Initialize internal state
    const [, setAnimating] = createSignal(false)
    // this.isAnimating = animating - removed unused accessor
    this.setIsAnimating = setAnimating

    // Handle value changes reactively
    createEffect(() => {
      const currentValue = this.getIsOn()
      if (this.toggleElement && this.toggleElement.checked !== currentValue) {
        this.toggleElement.checked = currentValue
      }
    })
  }

  /**
   * Get current toggle state
   */
  private getIsOn(): boolean {
    const { isOn } = this.props
    if (isSignal(isOn)) {
      return (isOn as () => boolean)()
    }
    return isOn as boolean
  }

  // /**
  //  * Get toggle state as signal or static value for DOM renderer
  //  */
  // private getIsOnForDOM(): boolean | (() => boolean) {
  //   const { isOn } = this.props
  //   if (isSignal(isOn)) {
  //     return isOn as () => boolean
  //   }
  //   return isOn as boolean
  // }

  /**
   * Check if toggle is disabled
   */
  private isDisabled(): boolean {
    const { disabled } = this.props
    if (typeof disabled === 'boolean') return disabled
    if (isSignal(disabled)) return (disabled as () => boolean)()
    return false
  }

  // /**
  //  * Get disabled state as signal or static value for DOM renderer
  //  */
  // private getDisabledForDOM(): boolean | (() => boolean) {
  //   const { disabled } = this.props
  //   if (typeof disabled === 'boolean') return disabled
  //   if (isSignal(disabled)) return disabled as () => boolean
  //   return false
  // }

  /**
   * Resolve label content
   */
  private resolveLabel(): string | ComponentInstance | null {
    const { label } = this.props
    if (!label) return null

    if (typeof label === 'string') {
      return label
    } else if (typeof label === 'function') {
      return label()
    } else if (isSignal(label)) {
      return (label as () => string)()
    } else {
      return label as ComponentInstance
    }
  }

  /**
   * Helper to render component content safely
   */
  private renderComponentContent(content: ComponentInstance): DOMNode[] {
    const rendered = content.render()
    return Array.isArray(rendered) ? rendered : [rendered]
  }

  /**
   * Handle toggle change
   */
  private handleToggle = async (event: Event) => {
    event.preventDefault()

    if (this.isDisabled()) return

    const newValue = !this.getIsOn()

    if (this.props.animated !== false) {
      this.setIsAnimating(true)

      // Brief animation delay
      setTimeout(() => {
        this.setIsAnimating(false)
      }, 200)
    }

    if (this.props.onToggle) {
      this.props.onToggle(newValue)
    }
  }

  /**
   * Get toggle size styles
   */
  private getSizeStyles() {
    const { size = 'medium' } = this.props

    switch (size) {
      case 'small':
        return {
          width: '36px',
          height: '20px',
          thumbSize: '16px',
          fontSize: '14px',
        }
      case 'large':
        return {
          width: '56px',
          height: '32px',
          thumbSize: '28px',
          fontSize: '18px',
        }
      default:
        return {
          width: '46px',
          height: '26px',
          thumbSize: '22px',
          fontSize: '16px',
        }
    }
  }

  /**
   * Render switch variant
   */
  private renderSwitch() {
    const isOn = this.getIsOn()
    const isDisabled = this.isDisabled()
    const sizeStyles = this.getSizeStyles()
    const {
      color = '#007AFF',
      offColor = '#e2e8f0',
      thumbColor = '#ffffff',
      animated = true,
    } = this.props

    const trackColor = isOn ? color : offColor
    const thumbTransform = isOn
      ? `translateX(${parseInt(sizeStyles.width) - parseInt(sizeStyles.thumbSize) - 2}px)`
      : 'translateX(2px)'

    return h(
      'div',
      {
        style: {
          position: 'relative',
          display: 'inline-block',
        },
      },
      // Hidden input for form integration
      h('input', {
        ref: (el: HTMLInputElement) => {
          this.toggleElement = el

          if (el && !this.mounted) {
            el.addEventListener('change', this.handleToggle)

            this.cleanup.push(() => {
              el.removeEventListener('change', this.handleToggle)
            })
          }
        },
        type: 'checkbox',
        checked: isOn,
        disabled: isDisabled,
        style: {
          position: 'absolute',
          opacity: 0,
          width: '100%',
          height: '100%',
          margin: 0,
          cursor: isDisabled ? 'not-allowed' : 'pointer',
        },
        'aria-label': this.props.accessibilityLabel,
        'aria-describedby': this.props.accessibilityHint
          ? `${this.id}-hint`
          : undefined,
      }),

      // Switch track
      h(
        'div',
        {
          style: {
            width: sizeStyles.width,
            height: sizeStyles.height,
            backgroundColor: trackColor,
            borderRadius: sizeStyles.height,
            position: 'relative',
            cursor: isDisabled ? 'not-allowed' : 'pointer',
            opacity: isDisabled ? 0.5 : 1,
            transition: animated ? 'background-color 0.2s ease' : 'none',
            border: '1px solid rgba(0,0,0,0.1)',
            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)',
          },
          onClick: this.handleToggle,
        },
        // Switch thumb
        h('div', {
          style: {
            width: sizeStyles.thumbSize,
            height: sizeStyles.thumbSize,
            backgroundColor: thumbColor,
            borderRadius: '50%',
            position: 'absolute',
            top: '50%',
            transform: `translateY(-50%) ${thumbTransform}`,
            transition: animated ? 'transform 0.2s ease' : 'none',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            border: '1px solid rgba(0,0,0,0.1)',
          },
        })
      )
    )
  }

  /**
   * Render checkbox variant
   */
  private renderCheckbox() {
    const isOn = this.getIsOn()
    const isDisabled = this.isDisabled()
    const sizeStyles = this.getSizeStyles()
    const { color = '#007AFF' } = this.props

    return h(
      'div',
      {
        style: {
          position: 'relative',
          display: 'inline-block',
        },
      },
      // Hidden input
      h('input', {
        ref: (el: HTMLInputElement) => {
          this.toggleElement = el

          if (el && !this.mounted) {
            el.addEventListener('change', this.handleToggle)

            this.cleanup.push(() => {
              el.removeEventListener('change', this.handleToggle)
            })
          }
        },
        type: 'checkbox',
        checked: isOn,
        disabled: isDisabled,
        style: {
          position: 'absolute',
          opacity: 0,
          width: '100%',
          height: '100%',
          margin: 0,
          cursor: isDisabled ? 'not-allowed' : 'pointer',
        },
      }),

      // Checkbox visual
      h(
        'div',
        {
          style: {
            width: sizeStyles.thumbSize,
            height: sizeStyles.thumbSize,
            border: `2px solid ${isOn ? color : '#d1d5db'}`,
            borderRadius: '4px',
            backgroundColor: isOn ? color : '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: isDisabled ? 'not-allowed' : 'pointer',
            opacity: isDisabled ? 0.5 : 1,
            transition: 'all 0.2s ease',
          },
          onClick: this.handleToggle,
        },
        ...(isOn
          ? [
              // Checkmark
              h('div', {
                style: {
                  width: '6px',
                  height: '10px',
                  border: '2px solid white',
                  borderTop: 'none',
                  borderLeft: 'none',
                  transform: 'rotate(45deg) translateY(-1px)',
                  opacity: isOn ? 1 : 0,
                  transition: 'opacity 0.1s ease',
                },
              }),
            ]
          : [])
      )
    )
  }

  /**
   * Render button variant
   */
  private renderButton() {
    const isOn = this.getIsOn()
    const isDisabled = this.isDisabled()
    const sizeStyles = this.getSizeStyles()
    const { color = '#007AFF', offColor = '#f3f4f6' } = this.props

    return h(
      'button',
      {
        ref: (el: HTMLButtonElement) => {
          if (el && !this.mounted) {
            el.addEventListener('click', this.handleToggle)

            this.cleanup.push(() => {
              el.removeEventListener('click', this.handleToggle)
            })
          }
        },
        type: 'button',
        disabled: isDisabled,
        style: {
          padding: '8px 16px',
          backgroundColor: isOn ? color : offColor,
          color: isOn ? '#ffffff' : '#374151',
          border: `1px solid ${isOn ? color : '#d1d5db'}`,
          borderRadius: '6px',
          fontSize: sizeStyles.fontSize,
          fontWeight: '500',
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          opacity: isDisabled ? 0.5 : 1,
          transition: 'all 0.2s ease',
          outline: 'none',
        },
        'aria-pressed': isOn,
        'aria-label': this.props.accessibilityLabel,
      },
      text(isOn ? 'ON' : 'OFF')
    )
  }

  /**
   * Render toggle control based on variant
   */
  private renderToggleControl() {
    const { variant = 'switch' } = this.props

    switch (variant) {
      case 'checkbox':
        return this.renderCheckbox()
      case 'button':
        return this.renderButton()
      default:
        return this.renderSwitch()
    }
  }

  /**
   * Render label content
   */
  private renderLabel() {
    const labelContent = this.resolveLabel()
    if (!labelContent) return null

    const sizeStyles = this.getSizeStyles()

    return h(
      'span',
      {
        style: {
          fontSize: sizeStyles.fontSize,
          color: this.isDisabled() ? '#9ca3af' : '#374151',
          cursor: this.isDisabled() ? 'not-allowed' : 'pointer',
        },
        onClick: this.isDisabled() ? undefined : this.handleToggle,
      },
      ...(typeof labelContent === 'string'
        ? [text(labelContent)]
        : this.renderComponentContent(labelContent as ComponentInstance))
    )
  }

  render() {
    const {
      labelPosition = 'trailing',
      spacing = 8,
      accessibilityHint,
    } = this.props

    const label = this.renderLabel()
    const control = this.renderToggleControl()

    // Arrange label and control based on position
    const children =
      labelPosition === 'leading' && label
        ? [label, control]
        : label
          ? [control, label]
          : [control]

    return h(
      'div',
      {
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: label ? `${spacing}px` : '0',
          cursor: this.isDisabled() ? 'not-allowed' : 'pointer',
        },
        'aria-describedby': accessibilityHint ? `${this.id}-hint` : undefined,
      },
      ...children,

      // Accessibility hint
      ...(accessibilityHint
        ? [
            h(
              'div',
              {
                id: `${this.id}-hint`,
                style: {
                  fontSize: '12px',
                  color: '#6b7280',
                  marginTop: '4px',
                  display: 'block',
                  width: '100%',
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
 * Toggle component function
 */
export function Toggle(
  isOn: boolean | Signal<boolean>,
  props: Omit<ToggleProps, 'isOn'> = {}
): ModifiableComponent<ToggleProps> & {
  modifier: ModifierBuilder<ModifiableComponent<ToggleProps>>
} {
  const toggleProps: ToggleProps = { ...props, isOn }
  const component = new EnhancedToggle(toggleProps)
  return withModifiers(component)
}

/**
 * Toggle with label
 */
export function ToggleWithLabel(
  label: string | (() => string) | Signal<string> | ComponentInstance,
  isOn: boolean | Signal<boolean>,
  props: Omit<ToggleProps, 'isOn' | 'label'> = {}
) {
  return Toggle(isOn, { ...props, label })
}

/**
 * Toggle style variants
 */
export const ToggleStyles = {
  /**
   * Switch toggle (default)
   */
  Switch(
    isOn: boolean | Signal<boolean>,
    props: Omit<ToggleProps, 'isOn' | 'variant'> = {}
  ) {
    return Toggle(isOn, { ...props, variant: 'switch' })
  },

  /**
   * Checkbox toggle
   */
  Checkbox(
    isOn: boolean | Signal<boolean>,
    props: Omit<ToggleProps, 'isOn' | 'variant'> = {}
  ) {
    return Toggle(isOn, { ...props, variant: 'checkbox' })
  },

  /**
   * Button toggle
   */
  Button(
    isOn: boolean | Signal<boolean>,
    props: Omit<ToggleProps, 'isOn' | 'variant'> = {}
  ) {
    return Toggle(isOn, { ...props, variant: 'button' })
  },

  /**
   * Small toggle
   */
  Small(
    isOn: boolean | Signal<boolean>,
    props: Omit<ToggleProps, 'isOn' | 'size'> = {}
  ) {
    return Toggle(isOn, { ...props, size: 'small' })
  },

  /**
   * Large toggle
   */
  Large(
    isOn: boolean | Signal<boolean>,
    props: Omit<ToggleProps, 'isOn' | 'size'> = {}
  ) {
    return Toggle(isOn, { ...props, size: 'large' })
  },

  /**
   * Custom color toggle
   */
  CustomColor(
    isOn: boolean | Signal<boolean>,
    color: string,
    props: Omit<ToggleProps, 'isOn' | 'color'> = {}
  ) {
    return Toggle(isOn, { ...props, color })
  },

  /**
   * Toggle with leading label
   */
  WithLeadingLabel(
    label: string | (() => string) | Signal<string> | ComponentInstance,
    isOn: boolean | Signal<boolean>,
    props: Omit<ToggleProps, 'isOn' | 'label' | 'labelPosition'> = {}
  ) {
    return Toggle(isOn, { ...props, label, labelPosition: 'leading' })
  },

  /**
   * Toggle with trailing label (default)
   */
  WithTrailingLabel(
    label: string | (() => string) | Signal<string> | ComponentInstance,
    isOn: boolean | Signal<boolean>,
    props: Omit<ToggleProps, 'isOn' | 'label' | 'labelPosition'> = {}
  ) {
    return Toggle(isOn, { ...props, label, labelPosition: 'trailing' })
  },
}

/**
 * Toggle utilities
 */
export const ToggleUtils = {
  /**
   * Create a toggle group with multiple options
   */
  createGroup(
    options: Array<{
      key: string
      label: string
      isOn: boolean | Signal<boolean>
      onToggle?: (isOn: boolean) => void
    }>,
    props: Omit<ToggleProps, 'isOn' | 'label' | 'onToggle'> = {}
  ) {
    return options.map(option =>
      ToggleWithLabel(option.label, option.isOn, {
        ...props,
        onToggle: option.onToggle,
      })
    )
  },

  /**
   * Create exclusive toggle group (radio-like behavior)
   */
  createExclusiveGroup(
    options: Array<{
      key: string
      label: string
    }>,
    selectedKey: string | Signal<string>,
    onSelectionChange?: (key: string) => void,
    props: Omit<ToggleProps, 'isOn' | 'label' | 'onToggle'> = {}
  ) {
    const getSelectedKey = () => {
      if (isSignal(selectedKey)) {
        return (selectedKey as () => string)()
      }
      return selectedKey as string
    }

    return options.map(option =>
      ToggleWithLabel(option.label, getSelectedKey() === option.key, {
        ...props,
        onToggle: (isOn: boolean) => {
          if (isOn && onSelectionChange) {
            onSelectionChange(option.key)
          }
        },
      })
    )
  },

  /**
   * Batch toggle operations
   */
  batch: {
    /**
     * Toggle all items in a group
     */
    toggleAll(
      toggles: Array<{
        isOn: boolean | Signal<boolean>
        onToggle?: (isOn: boolean) => void
      }>,
      newState: boolean
    ) {
      toggles.forEach(toggle => {
        if (toggle.onToggle) {
          toggle.onToggle(newState)
        }
      })
    },

    /**
     * Get state of all toggles in a group
     */
    getStates(toggles: Array<{ isOn: boolean | Signal<boolean> }>): boolean[] {
      return toggles.map(toggle => {
        if (isSignal(toggle.isOn)) {
          return (toggle.isOn as () => boolean)()
        }
        return toggle.isOn as boolean
      })
    },

    /**
     * Check if all toggles are on
     */
    allOn(toggles: Array<{ isOn: boolean | Signal<boolean> }>): boolean {
      return this.getStates(toggles).every(state => state)
    },

    /**
     * Check if any toggle is on
     */
    anyOn(toggles: Array<{ isOn: boolean | Signal<boolean> }>): boolean {
      return this.getStates(toggles).some(state => state)
    },
  },
}
