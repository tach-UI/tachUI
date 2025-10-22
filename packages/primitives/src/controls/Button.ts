/**
 * Enhanced Button Component (Phase 5.2)
 *
 * SwiftUI-inspired Button component with press states, variants,
 * and advanced interaction handling.
 */

import type {
  ModifiableComponent,
  ModifierBuilder,
  ComponentProps,
  Signal,
} from '@tachui/core'
import {
  createSignal,
  isSignal,
  createEffect,
  text,
  h,
  withModifiers,
  useLifecycle,
  ColorAsset,
} from '@tachui/core'
import { createComponentInstance } from '@tachui/core/components'
import type { CloneableComponent, CloneOptions } from '@tachui/core/runtime/types'
import {
  clonePropsPreservingReactivity,
  resetLifecycleState,
} from '@tachui/core'
import type {
  Concatenatable,
  ComponentSegment,
  ConcatenationMetadata,
} from '@tachui/core'
import { ConcatenatedComponent } from '@tachui/core'
import { ComponentWithCSSClasses, type CSSClassesProps } from '@tachui/core'

/**
 * Button role types following SwiftUI patterns
 */
export type ButtonRole = 'destructive' | 'cancel' | 'none'

/**
 * Button variants
 */
export type ButtonVariant =
  | 'filled' // Solid background (primary)
  | 'outlined' // Border with transparent background
  | 'plain' // No background or border
  | 'bordered' // Subtle border with light background
  | 'borderedProminent' // Prominent border style

/**
 * Button size presets
 */
export type ButtonSize = 'small' | 'medium' | 'large'

/**
 * Button state
 */
export type ButtonState = 'normal' | 'pressed' | 'disabled' | 'focused'

/**
 * Button component properties with CSS classes support
 */
export interface ButtonProps extends ComponentProps, CSSClassesProps {
  // Content
  title?: string | (() => string) | Signal<string>
  systemImage?: string

  // Behavior
  action?: () => void | Promise<void>
  role?: ButtonRole
  isEnabled?: boolean | Signal<boolean>

  // Appearance
  variant?: ButtonVariant
  size?: ButtonSize
  tint?: string | Signal<string> | ColorAsset
  backgroundColor?: string | Signal<string> | ColorAsset
  foregroundColor?: string | Signal<string> | ColorAsset

  // State management
  isPressed?: Signal<boolean>
  isLoading?: boolean | Signal<boolean>

  // Accessibility
  accessibilityLabel?: string
  accessibilityHint?: string

  // Advanced
  controlSize?: ButtonSize
  hapticFeedback?: boolean
}

/**
 * Button theme configuration
 */
export interface ButtonTheme {
  colors: {
    primary: string
    secondary: string
    destructive: string
    background: string
    surface: string
    onPrimary: string
    onSecondary: string
    onSurface: string
    border: string
    disabled: string
  }
  spacing: {
    small: number
    medium: number
    large: number
  }
  borderRadius: {
    small: number
    medium: number
    large: number
  }
  typography: {
    small: { size: number; weight: string }
    medium: { size: number; weight: string }
    large: { size: number; weight: string }
  }
}

/**
 * Default button theme
 */
export const defaultButtonTheme: ButtonTheme = {
  colors: {
    primary: '#007AFF',
    secondary: '#5856D6',
    destructive: '#FF3B30',
    background: '#F2F2F7',
    surface: '#FFFFFF',
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onSurface: '#000000',
    border: '#C7C7CC',
    disabled: '#8E8E93',
  },
  spacing: {
    small: 8,
    medium: 12,
    large: 16,
  },
  borderRadius: {
    small: 6,
    medium: 8,
    large: 12,
  },
  typography: {
    small: { size: 14, weight: '500' },
    medium: { size: 16, weight: '500' },
    large: { size: 18, weight: '600' },
  },
}

/**
 * Enhanced Button component class with CSS classes support
 */
export class EnhancedButton
  extends ComponentWithCSSClasses
  implements CloneableComponent<ButtonProps>, Concatenatable<ButtonProps>
{
  public readonly type = 'component' as const
  public readonly id: string
  public mounted = false
  public cleanup: (() => void)[] = []
  public stateSignal: () => ButtonState
  private setState: (value: ButtonState) => void
  public theme: ButtonTheme

  constructor(
    public props: ButtonProps,
    theme: ButtonTheme = defaultButtonTheme
  ) {
    super()
    this.id = `button-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    this.theme = theme

    // Create reactive state signals
    const [stateSignal, setState] = createSignal<ButtonState>('normal')
    this.stateSignal = stateSignal
    this.setState = setState

    // Set up DOM event listeners when component is ready
    this.setupDOMEventListeners()
  }

  /**
   * Set up DOM event listeners for button interactions
   */
  private setupDOMEventListeners(): void {
    useLifecycle(this, {
      onDOMReady: (_elements, primaryElement) => {
        if (primaryElement instanceof HTMLButtonElement) {
          // Only set up reactive styles, not duplicate event listeners
          // The onClick prop handles the action to avoid double events
          this.setupReactiveStyles(primaryElement)
        }
      },
    })
  }

  /**
   * Set up reactive style updates based on state changes
   */
  private setupReactiveStyles(button: HTMLButtonElement): void {
    // Create a reactive effect that updates styles when state changes
    const effect = createEffect(() => {
      // Reading the state signal makes this effect reactive to state changes
      this.stateSignal()

      // Also watch for changes in enabled/loading states if they're reactive
      this.isEnabled()
      this.isLoading()

      // Watch color properties for reactivity
      const { tint, backgroundColor, foregroundColor } = this.props

      // Make reactive to tint changes
      if (tint && isSignal(tint)) {
        ;(tint as () => string)() // Read the signal to make effect reactive to it
      } else if (tint instanceof ColorAsset) {
        tint.resolve() // Make effect reactive to theme changes
      }

      // Make reactive to backgroundColor changes
      if (backgroundColor && isSignal(backgroundColor)) {
        ;(backgroundColor as () => string)()
      } else if (backgroundColor instanceof ColorAsset) {
        backgroundColor.resolve()
      }

      // Make reactive to foregroundColor changes
      if (foregroundColor && isSignal(foregroundColor)) {
        ;(foregroundColor as () => string)()
      } else if (foregroundColor instanceof ColorAsset) {
        foregroundColor.resolve()
      }

      // Trigger style update whenever any dependency changes
      const styles = this.getButtonStyles()
      this.applyStylesToElement(button, styles)
    })

    // Store the effect cleanup function
    this.cleanup.push(() => {
      // Clean up the reactive effect when component unmounts
      if (effect && typeof effect.dispose === 'function') {
        effect.dispose()
      }
    })
  }

  /**
   * Apply computed styles to the button element, respecting modifier-applied styles
   */
  private applyStylesToElement(
    element: HTMLButtonElement,
    styles: Record<string, any>
  ): void {
    // Apply each style property to the element, but only if not already set by modifiers
    Object.entries(styles).forEach(([property, value]) => {
      const cssProperty = this.camelToKebabCase(property)
      if (typeof value === 'string' || typeof value === 'number') {
        // Check if this property is already set by a modifier
        const currentValue = element.style.getPropertyValue(cssProperty)
        const hasModifierValue =
          currentValue && currentValue !== '' && currentValue !== 'inherit'

        // Special handling for transform: Button state transforms should override modifier transforms
        if (cssProperty === 'transform') {
          element.style.setProperty(cssProperty, String(value))
        } else if (!hasModifierValue) {
          // For other properties, only apply Button styles if no modifier has set this property
          element.style.setProperty(cssProperty, String(value))
        }
      }
    })
  }

  /**
   * Convert camelCase to kebab-case for CSS properties
   */
  private camelToKebabCase(str: string): string {
    return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
  }

  /**
   * Resolve color value from string, signal, or asset
   */
  private resolveColorValue(
    color: string | Signal<string> | ColorAsset | undefined
  ): string | undefined {
    if (!color) return undefined

    if (typeof color === 'string') {
      return color
    } else if (isSignal(color)) {
      return (color as () => string)()
    } else if (color instanceof ColorAsset) {
      return color.resolve()
    }

    return undefined
  }

  /**
   * Check if button is enabled
   */
  isEnabled(): boolean | (() => boolean) {
    const { isEnabled } = this.props

    if (isEnabled === undefined) return true
    if (typeof isEnabled === 'boolean') return isEnabled
    if (isSignal(isEnabled)) return isEnabled as () => boolean
    return true
  }

  /**
   * Render the button component
   */
  render() {
    // Use reactive pattern - pass signals/functions directly to runtime
    const enabled = this.isEnabled() // Get signal/value for enabled state

    // Create button content - always include title
    const children = []

    // System image (icon) - only if specified
    if (this.props.systemImage) {
      children.push(
        h(
          'span',
          {
            class: 'button-icon',
            style: {
              marginRight: '8px',
              fontSize: '1.2em',
            },
          },
          text(this.props.systemImage)
        )
      )
    }

    // Button title - use h() helper for proper text node handling
    children.push(
      h(
        'span',
        {
          class: 'button-title',
        },
        text(this.props.title || '')
      )
    )

    // Process CSS classes for this component
    const baseClasses = ['tachui-button']
    const classString = this.createClassString(this.props, baseClasses)

    // Create button element as DOMNode object with modifier metadata
    // Use onClick for clean single event handling
    const buttonElement = {
      type: 'element' as const,
      tag: 'button',
      props: {
        className: classString,
        type: 'button',
        disabled: typeof enabled === 'boolean' ? !enabled : !enabled(), // Invert enabled to disabled
        onClick: this.props.action
          ? () => {
              try {
                this.props.action?.()
              } catch (error) {
                console.error('Button action error:', error)
              }
            }
          : undefined,
        // Pass through debug label for debug system
        ...(this.props.debugLabel && { debugLabel: this.props.debugLabel }),
      },
      children,
      // Attach component metadata for modifier processing
      componentMetadata: {
        id: this.id,
        type: 'Button',
        // Note: modifiers are attached automatically by the modifier system
      },
    }

    return [buttonElement]
  }

  /**
   * Check if button is in loading state
   */
  isLoading(): boolean {
    const { isLoading } = this.props

    if (isLoading === undefined) return false
    if (typeof isLoading === 'boolean') return isLoading
    if (isSignal(isLoading)) return (isLoading as () => boolean)()
    return false
  }

  /**
   * Check if the button has color-related modifiers applied
   */
  private hasColorModifiers(): boolean {
    // Try to get modifiers from the wrapper component first
    let modifiers = (this as any).modifiers

    // If not found on this component, check if we're wrapped and get from wrapper
    if (!modifiers && (this as any).modifierBuilder) {
      modifiers = (this as any).modifierBuilder.modifiers
    }

    // Also check if we're part of a modifiable component structure
    if (!modifiers && (this as any).modifiableComponent) {
      modifiers = (this as any).modifiableComponent.modifiers
    }

    if (!modifiers || !Array.isArray(modifiers)) {
      return false
    }

    // Check for any modifier that affects color
    return modifiers.some((modifier: any) => {
      // Check AppearanceModifier
      if (
        modifier.type === 'appearance' ||
        modifier.constructor?.name === 'AppearanceModifier'
      ) {
        return (
          modifier.properties &&
          (modifier.properties.foregroundColor !== undefined ||
            modifier.properties.color !== undefined)
        )
      }

      // Check for any other modifiers that might affect color
      if (modifier.properties) {
        const colorProps = ['foregroundColor', 'color', 'textColor']
        return colorProps.some(prop => modifier.properties[prop] !== undefined)
      }

      return false
    })
  }

  /**
   * Check if the button has typography-related modifiers applied
   */
  private hasTypographyModifiers(): boolean {
    // Try to get modifiers from the wrapper component first
    let modifiers = (this as any).modifiers

    // If not found on this component, check if we're wrapped and get from wrapper
    if (!modifiers && (this as any).modifierBuilder) {
      modifiers = (this as any).modifierBuilder.modifiers
    }

    // Also check if we're part of a modifiable component structure
    if (!modifiers && (this as any).modifiableComponent) {
      modifiers = (this as any).modifiableComponent.modifiers
    }

    if (!modifiers || !Array.isArray(modifiers)) {
      return false
    }

    // Check for any modifier that affects text transformation
    const hasTypography = modifiers.some((modifier: any) => {
      // Check TypographyModifier
      if (
        modifier.type === 'typography' ||
        modifier.constructor?.name === 'TypographyModifier'
      ) {
        return (
          modifier.properties &&
          (modifier.properties.transform !== undefined ||
            modifier.properties.textTransform !== undefined)
        )
      }

      return false
    })

    return hasTypography
  }

  /**
   * Get computed button styles based on variant, size, role, and state
   */
  // biome-ignore lint/suspicious/noExplicitAny: CSS styles require flexible property types
  getButtonStyles(): Record<string, any> {
    const {
      variant,
      size,
      role = 'none',
      tint,
      backgroundColor: bgColorProp,
      foregroundColor: fgColorProp,
    } = this.props
    const state = this.stateSignal()
    const isLoading = this.isLoading()
    const isEnabled = this.isEnabled()

    // Check if the component has color-related or typography modifiers applied
    const hasColorModifiers = this.hasColorModifiers()
    const hasTypographyModifiers = this.hasTypographyModifiers()

    // Base styles - minimal defaults, inherit from parent but allow modifiers to override
    const baseStyles: Record<string, any> = {
      // Only set color property if no modifiers will handle it
      // This prevents conflicts between Button styles and AppearanceModifier
      ...(!hasColorModifiers &&
        !fgColorProp &&
        !variant && { color: 'inherit' }),
      // Only set text-related properties if no typography modifiers will handle them
      // This prevents conflicts between Button styles and TypographyModifier
      ...(!hasTypographyModifiers && {
        fontStyle: 'inherit',
        lineHeight: 'inherit',
        textTransform: 'inherit',
        textDecoration: 'inherit',
        textIndent: 'inherit',
        textShadow: 'inherit',
        wordSpacing: 'inherit',
        textOrientation: 'inherit',
        writingMode: 'inherit',
        direction: 'inherit',
      }),
      // Let modifiers control: fontFamily, fontSize, fontWeight, letterSpacing, textAlign
    }

    // Only apply size-based styles if size is explicitly provided
    if (size) {
      const sizeConfig = this.theme.spacing[size] || this.theme.spacing.medium
      const borderRadius =
        this.theme.borderRadius[size] || this.theme.borderRadius.medium
      const typography =
        this.theme.typography[size] || this.theme.typography.medium

      const minHeights = {
        small: '32px',
        medium: '40px',
        large: '48px',
      }

      baseStyles.padding = `${sizeConfig}px ${sizeConfig * 2}px`
      baseStyles.borderRadius = `${borderRadius}px`
      baseStyles.fontSize = `${typography.size}px`
      baseStyles.fontWeight = typography.weight
      baseStyles.minHeight = minHeights[size]
    }

    let backgroundColor = 'transparent'
    let borderColor = 'transparent'
    let borderWidth = '1px'
    let color = undefined // Will be set by variant or remain undefined to use baseStyles.color

    // Resolve color values using helper method
    const tintColor = this.resolveColorValue(tint)
    const customBackgroundColor = this.resolveColorValue(bgColorProp)
    const customForegroundColor = this.resolveColorValue(fgColorProp)

    // Apply variant styles ONLY if variant is explicitly provided
    if (variant) {
      const fallbackTintColor = tintColor || this.theme.colors.primary

      switch (variant) {
        case 'filled':
          if (role === 'destructive') {
            backgroundColor = this.theme.colors.destructive
          } else if (role === 'cancel') {
            backgroundColor = this.theme.colors.secondary
          } else {
            backgroundColor = fallbackTintColor
          }
          color = this.theme.colors.onPrimary
          break
        case 'outlined':
          borderColor =
            role === 'destructive'
              ? this.theme.colors.destructive
              : fallbackTintColor
          color =
            role === 'destructive'
              ? this.theme.colors.destructive
              : fallbackTintColor
          break
        case 'bordered':
          backgroundColor = this.theme.colors.background
          borderColor = this.theme.colors.border
          break
        case 'borderedProminent':
          backgroundColor = this.theme.colors.surface
          borderColor = this.theme.colors.primary
          borderWidth = '2px'
          break
        case 'plain':
          // Keep defaults (transparent)
          break
      }
    }

    // Apply custom colors if provided (override variant defaults)
    if (customBackgroundColor) {
      backgroundColor = customBackgroundColor
    }
    if (customForegroundColor) {
      color = customForegroundColor
    }

    // Apply state modifications
    let opacity = '1'
    let pointerEvents = 'auto'
    let transform = undefined // Only set when needed
    let boxShadow = 'none'

    if (!isEnabled) {
      backgroundColor = this.theme.colors.disabled
      borderColor = this.theme.colors.disabled
      color = this.theme.colors.disabled
      opacity = '0.6'
      pointerEvents = 'none'
    } else if (isLoading) {
      opacity = '0.6'
      pointerEvents = 'none'
    } else if (state === 'pressed') {
      // Darken colors for pressed state
      backgroundColor = this.darkenColor(backgroundColor, 0.1)
      borderColor = this.darkenColor(borderColor, 0.1)
      transform = 'scale(0.95)'
    } else if (state === 'focused') {
      boxShadow = '0 0 0 3px #007AFF40'
    }

    // Build final styles object - only include styles when explicitly needed
    const finalStyles: Record<string, any> = {
      ...baseStyles, // Size-based styles (only if size provided)
    }

    // Only apply variant/color styles if variant is provided
    if (variant) {
      finalStyles.backgroundColor = backgroundColor
      finalStyles.borderColor = borderColor
      finalStyles.borderWidth = borderWidth
      if (color !== undefined) {
        finalStyles.color = color
      }
    }

    // Apply custom color overrides even without variant
    if (customBackgroundColor) {
      finalStyles.backgroundColor = customBackgroundColor
    }
    if (customForegroundColor) {
      finalStyles.color = customForegroundColor
    }

    // Always apply interaction and state styles
    finalStyles.cursor = isEnabled ? 'pointer' : 'not-allowed'
    finalStyles.opacity = opacity
    finalStyles.pointerEvents = pointerEvents

    // Always apply transform - use 'none' when not needed to properly clear previous values
    finalStyles.transform = transform !== undefined ? transform : 'none'
    finalStyles.boxShadow = boxShadow

    finalStyles.transition = 'all 0.2s ease'

    return finalStyles
  }

  /**
   * Handle button press with proper state management
   */
  async handlePress(): Promise<void> {
    if (!this.isEnabled() || this.isLoading()) return

    // Trigger haptic feedback (if available)
    this.triggerHapticFeedback()

    this.setState('pressed')

    // Reset state after animation
    setTimeout(() => {
      if (this.isEnabled()) {
        this.setState('normal')
      }
    }, 150)

    // Execute action if provided
    if (this.props.action) {
      try {
        const result = this.props.action()
        // Handle if action returns a Promise
        if (result && typeof result.then === 'function') {
          await result
        }
      } catch (error) {
        console.error('Button action failed:', error)
      }
    }
  }

  /**
   * Trigger haptic feedback (mobile Safari support)
   */
  private triggerHapticFeedback(): void {
    // Check if haptic feedback is disabled
    if (this.props.hapticFeedback === false) return

    if (typeof window !== 'undefined' && 'navigator' in window) {
      // biome-ignore lint/suspicious/noExplicitAny: Navigator API requires dynamic access
      const navigator = window.navigator as any
      if (navigator.vibrate) {
        navigator.vibrate(10) // Short vibration
      }
    }
  }

  /**
   * Helper to darken a color for pressed states
   */
  private darkenColor(color: string, amount: number): string {
    if (color === 'transparent') return color

    // Simple darkening for hex colors
    if (color.startsWith('#')) {
      const hex = color.slice(1)
      const num = parseInt(hex, 16)
      const r = Math.max(0, Math.floor((num >> 16) * (1 - amount)))
      const g = Math.max(0, Math.floor(((num >> 8) & 0x00ff) * (1 - amount)))
      const b = Math.max(0, Math.floor((num & 0x0000ff) * (1 - amount)))
      return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
    }

    return color
  }

  // ============================================================================
  // Concatenation Support (Phase 3.1)
  // ============================================================================

  /**
   * Concatenate this button with another concatenatable component
   */
  concat<U extends Concatenatable<any>>(
    other: U
  ): ConcatenatedComponent<ButtonProps | U> {
    const thisSegment = this.toSegment()
    const otherSegment = other.toSegment()

    const metadata: ConcatenationMetadata = {
      totalSegments:
        other instanceof ConcatenatedComponent ? other.segments.length + 1 : 2,
      accessibilityRole:
        other instanceof ConcatenatedComponent
          ? this.mergeAccessibilityRoles(
              'composite',
              other.metadata.accessibilityRole
            )
          : this.determineAccessibilityRole(other),
      semanticStructure: 'inline', // Buttons are typically inline in concatenation
    }

    return new ConcatenatedComponent([thisSegment, otherSegment], metadata)
  }

  /**
   * Convert this button to a segment for concatenation
   */
  toSegment(): ComponentSegment {
    return {
      id: this.id,
      component: this,
      modifiers: [], // Buttons don't typically have concatenation-specific modifiers
      render: () => {
        const rendered = this.render()
        return Array.isArray(rendered) ? rendered[0] : rendered
      },
    }
  }

  /**
   * Check if this component supports concatenation
   */
  isConcatenatable(): boolean {
    return true
  }

  /**
   * Determine accessibility role for concatenation
   */
  private determineAccessibilityRole(
    other: Concatenatable
  ): 'text' | 'group' | 'composite' {
    const componentType = (other as any).constructor.name

    switch (componentType) {
      case 'EnhancedText':
        return 'composite' // Button + Text = composite (interactive content)
      case 'EnhancedImage':
        return 'composite' // Button + Image = composite (interactive content)
      case 'EnhancedButton':
      case 'EnhancedLink':
        return 'composite' // Button + Interactive = composite
      default:
        return 'composite'
    }
  }

  /**
   * Merge accessibility roles when combining components
   */
  private mergeAccessibilityRoles(
    _thisRole: 'text' | 'group' | 'composite',
    _existingRole: 'text' | 'group' | 'composite'
  ): 'text' | 'group' | 'composite' {
    // Buttons always contribute as 'composite' (interactive), so result is always composite
    return 'composite'
  }

  clone(options: CloneOptions = {}): this {
    return options.deep ? this.deepClone() : this.shallowClone()
  }

  shallowClone(): this {
    const clonedProps = clonePropsPreservingReactivity(this.props)
    const clone = new EnhancedButton(clonedProps, this.theme)
    this.syncStateToClone(clone)
    resetLifecycleState(clone)
    return clone as this
  }

  deepClone(): this {
    const clonedProps = clonePropsPreservingReactivity(this.props, {
      deep: true,
    })
    const clone = new EnhancedButton(clonedProps, this.theme)
    this.syncStateToClone(clone)
    resetLifecycleState(clone)
    return clone as this
  }

  private syncStateToClone(clone: EnhancedButton) {
    try {
      const currentState = this.stateSignal()
      clone.setState(currentState)
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Failed to sync button state to clone:', error)
      }
    }
  }
}

/**
 * Create enhanced Button component with modifier support
 */
export function Button(
  title: string | (() => string) | Signal<string>,
  action?: () => void | Promise<void>,
  props: Omit<ButtonProps, 'title' | 'action'> = {}
): ModifiableComponent<ButtonProps> & {
  modifier: ModifierBuilder<ModifiableComponent<ButtonProps>>
} {
  const buttonProps: ButtonProps = {
    ...props,
    title,
    ...(action && { action }),
  }
  const component = createComponentInstance(EnhancedButton, buttonProps)
  return withModifiers(component)
}

/**
 * Button variant shortcuts
 */
export const ButtonStyles = {
  /**
   * Filled button (primary)
   */
  Filled: (
    title: string | (() => string) | Signal<string>,
    action?: () => void | Promise<void>,
    props: Omit<ButtonProps, 'title' | 'action' | 'variant'> = {}
  ) => Button(title, action, { ...props, variant: 'filled' }),

  /**
   * Outlined button
   */
  Outlined: (
    title: string | (() => string) | Signal<string>,
    action?: () => void | Promise<void>,
    props: Omit<ButtonProps, 'title' | 'action' | 'variant'> = {}
  ) => Button(title, action, { ...props, variant: 'outlined' }),

  /**
   * Plain button (text only)
   */
  Plain: (
    title: string | (() => string) | Signal<string>,
    action?: () => void | Promise<void>,
    props: Omit<ButtonProps, 'title' | 'action' | 'variant'> = {}
  ) => Button(title, action, { ...props, variant: 'plain' }),

  /**
   * Bordered button
   */
  Bordered: (
    title: string | (() => string) | Signal<string>,
    action?: () => void | Promise<void>,
    props: Omit<ButtonProps, 'title' | 'action' | 'variant'> = {}
  ) => Button(title, action, { ...props, variant: 'bordered' }),

  /**
   * Destructive button
   */
  Destructive: (
    title: string | (() => string) | Signal<string>,
    action?: () => void | Promise<void>,
    props: Omit<ButtonProps, 'title' | 'action' | 'role'> = {}
  ) => Button(title, action, { ...props, role: 'destructive' }),

  /**
   * Cancel button
   */
  Cancel: (
    title: string | (() => string) | Signal<string>,
    action?: () => void | Promise<void>,
    props: Omit<ButtonProps, 'title' | 'action' | 'role'> = {}
  ) => Button(title, action, { ...props, role: 'cancel' }),
}

/**
 * CSS animations for button loading spinner
 */
const buttonAnimations = `
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
`

// Inject animations into document head
if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = buttonAnimations
  document.head.appendChild(style)
}
