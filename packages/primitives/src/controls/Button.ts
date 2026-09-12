/**
 * Enhanced Button Component (Phase 5.2)
 *
 * SwiftUI-inspired Button component with press states, variants,
 * and advanced interaction handling.
 */

import type {
  ModifiableComponentWithModifiers,
  ComponentProps,
  Signal,
} from '@tachui/core'
import {
  createMemo,
  createSignal,
  isSignal,
  createEffect,
  getOwner,
  untrack,
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

  /**
   * CSS properties this component has written to its element.
   *
   * What separates "a modifier set this" from "I set this last time", which the
   * element's own value cannot answer.
   */
  private readonly ownStyleProperties = new Set<string>()

  /** So the ownerless-render notice is said once, not once per prop. */
  private warnedOwnerless = false

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
    /**
     * Restyles on this component's own state changes, and subscribes to
     * nothing else.
     *
     * The constraint is the path rather than the styling: this effect is
     * created on DOM ready, and nothing there disposes it. The component's
     * cleanup array was copied by `build()` before render could add to it, and
     * the renderer's element cleanup does not run on that path either. So
     * every signal this effect reads is held for the life of the process, one
     * observer per mount — and these are the caller's signals, shared across
     * every Button that was handed the same one.
     *
     * `stateSignal` is the exception, and the only dependency: it belongs to
     * this instance, so retaining it retains nothing anyone else can see.
     * Everything else — the enabled and loading state, `tint`,
     * `backgroundColor`, `foregroundColor`, and the theme a `ColorAsset`
     * resolves against — is read untracked, as a snapshot at the moment this
     * runs.
     *
     * What that costs: a caller's colour signal changing no longer restyles
     * through here. Today that changes nothing observable, because
     * `applyStylesToElement` skips any property that already has a value, so
     * only the first pass of this effect ever reaches the DOM. When that skip
     * is fixed, or when this path learns to dispose what it creates, this is
     * the place to restore the subscriptions — not before, or they leak.
     */
    const effect = createEffect(() => {
      this.stateSignal()

      untrack(() => {
        const { tint, backgroundColor, foregroundColor } = this.props

        // Resolved, not subscribed to: a `ColorAsset` resolves against the
        // theme, which is as shared as any caller's signal.
        if (tint && isSignal(tint)) {
          ;(tint as () => string)()
        } else if (tint instanceof ColorAsset) {
          tint.resolve()
        }

        if (backgroundColor && isSignal(backgroundColor)) {
          ;(backgroundColor as () => string)()
        } else if (backgroundColor instanceof ColorAsset) {
          backgroundColor.resolve()
        }

        if (foregroundColor && isSignal(foregroundColor)) {
          ;(foregroundColor as () => string)()
        } else if (foregroundColor instanceof ColorAsset) {
          foregroundColor.resolve()
        }

        this.applyStylesToElement(button, this.getButtonStyles())
      })
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
        // Check if this property is already set by a modifier.
        //
        // "By a modifier" is the part that needs care: a non-empty value alone
        // cannot tell a modifier's styling from this component's own, written
        // on an earlier pass. Reading it that way meant the first pass claimed
        // every property and every pass after it stood down — so a button that
        // became disabled kept the `cursor`, `opacity` and `pointer-events` of
        // one that was not. Properties this component wrote are recorded, and
        // it is allowed to change its mind about those; anything else on the
        // element still belongs to whoever set it.
        const currentValue = element.style.getPropertyValue(cssProperty)
        const hasModifierValue =
          currentValue &&
          currentValue !== '' &&
          currentValue !== 'inherit' &&
          !this.ownStyleProperties.has(cssProperty)

        if (process.env.NODE_ENV === 'development' && cssProperty === 'font-family') {
          console.log('[Button.applyButtonStyles] Font-family check:')
          console.log('[Button.applyButtonStyles] property:', property, 'cssProperty:', cssProperty)
          console.log('[Button.applyButtonStyles] currentValue:', currentValue)
          console.log('[Button.applyButtonStyles] hasModifierValue:', hasModifierValue)
          console.log('[Button.applyButtonStyles] will set to:', value)
        }

        // Special handling for transform: Button state transforms should override modifier transforms
        if (cssProperty === 'transform') {
          this.ownStyleProperties.add(cssProperty)
          element.style.setProperty(cssProperty, String(value))
        } else if (!hasModifierValue) {
          // For other properties, only apply Button styles if no modifier has set this property
          this.ownStyleProperties.add(cssProperty)
          element.style.setProperty(cssProperty, String(value))
          
          if (process.env.NODE_ENV === 'development' && cssProperty === 'font-family') {
            console.log('[Button.applyButtonStyles] Button SET font-family to:', String(value))
            console.log('[Button.applyButtonStyles] Element after set:', element.style.fontFamily)
          }
        } else {
          if (process.env.NODE_ENV === 'development' && cssProperty === 'font-family') {
            console.log('[Button.applyButtonStyles] Button SKIPPED font-family (has modifier value):', currentValue)
          }
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
   * Check if button is enabled.
   *
   * Resolves, the way `isLoading` already did. Handing back the signal itself
   * made every consumer wrong in the same direction: `if (!isEnabled)` on a
   * function is never true, so disabled styling never applied and the press
   * guard never fired, while a reactive effect reading this subscribed to
   * nothing.
   */
  isEnabled(): boolean {
    const source = this.enabledSource()
    return typeof source === 'function' ? source() : source
  }

  /**
   * The `isEnabled` prop in the form it was given, signal and all.
   *
   * `render` needs the unresolved form: a boolean it can hand straight to the
   * renderer, or a signal the renderer can subscribe to. Everything else wants
   * the resolved value and should use {@link isEnabled}.
   */
  private enabledSource(): boolean | (() => boolean) {
    const { isEnabled } = this.props

    if (isEnabled === undefined) return true
    if (typeof isEnabled === 'boolean') return isEnabled
    if (isSignal(isEnabled)) return isEnabled as () => boolean
    return true
  }

  /**
   * `disabled` as the renderer wants it.
   *
   * The renderer subscribes to a prop whose value is a signal and re-applies
   * it on change, which is the only path that works here — the reactive style
   * effect runs on DOM-ready, which `renderComponent` never fires.
   *
   * Built fresh on every render rather than cached, and the identity matters
   * as much as the value. A render happens inside an effect, so an enclosing
   * component re-rendering for any reason at all disposes this scope and takes
   * the renderer's prop subscription with it. The renderer then diffs the new
   * props against the old by identity and skips anything unchanged — so a
   * cached accessor would be recognised, skipped, and never resubscribed,
   * leaving the attribute frozen at whatever it last read. A new memo each
   * time is a prop that has changed, which is precisely what has happened.
   */
  /**
   * The computed styles, as the renderer wants them.
   *
   * Owned the same way `disabled` is, and for the same reason: a subscription
   * made where nothing disposes it is held for the life of the process. With an
   * owner the renderer tracks the styles and re-applies them; without one they
   * are a snapshot, which is still more than the DOM-ready effect managed on
   * that path.
   *
   * Applied *before* modifiers, which is the ordering that makes modifier
   * precedence work by construction rather than by inspecting what is already
   * on the element.
   */
  /**
   * Says once, in development, that this Button is rendering where nothing can
   * dispose a subscription — so its reactive props are snapshots.
   *
   * The alternative is a control that silently stops tracking depending on how
   * its container happened to mount it. The comparison is written inline so a
   * bundler can drop it.
   */
  private warnOwnerlessRender(): void {
    if (process.env.NODE_ENV === 'production' || this.warnedOwnerless) {
      return
    }
    this.warnedOwnerless = true
    console.warn(
      '[tachUI] Button is rendering outside a reactive owner, so its `disabled` attribute and its styles are snapshots and will not follow their signals. Subscribing here would never be released, because nothing would dispose it. Both of the framework\'s own mount paths provide an owner; reaching this means render() was called directly. Render through renderComponent() or mountComponentTree(), or wrap the call in createRoot().'
    )
  }

  private styleProp(): Record<string, any> | (() => Record<string, any>) {
    if (getOwner() === null) {
      // Same condition and same reason as `disabledProp`, so the same thing is
      // said about it: styles are a snapshot here, and a state or colour
      // change will not restyle. Warned once per render rather than per prop —
      // both branches are the same fact about how this Button was mounted.
      this.warnOwnerlessRender()
      return this.getButtonStyles()
    }
    return createMemo(() => this.getButtonStyles())
  }

  private disabledProp(): boolean | (() => boolean) {
    const source = this.enabledSource()
    if (typeof source === 'boolean') {
      return !source
    }
    if (getOwner() === null) {
      // Nothing here can dispose a subscription, so none is made. Both mount
      // paths in the framework render under an owner, so this is reached only
      // by calling `render()` directly — where a memo would be owned by
      // nothing and would keep reading this signal for the life of the
      // process. A snapshot subscribes to nothing.
      //
      // Said out loud, because the alternative is a control that silently
      // stops tracking depending on how its container happened to mount it.
      // The comparison is written inline so a bundler can drop it.
      this.warnOwnerlessRender()
      return !source()
    }
    // Fresh per render, and owned by that render. The renderer diffs props by
    // identity, so a cached accessor would be skipped after the enclosing
    // scope was disposed and never resubscribed; a new memo is a prop that has
    // changed, which is exactly what has happened. The render's own owner
    // disposes it, so nothing outlives the component.
    return createMemo(() => !source())
  }

  /**
   * Render the button component
   */
  render() {
    // Use reactive pattern - pass signals/functions directly to runtime

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
        // A signal here rather than a snapshot of one: the renderer subscribes
        // to a reactive prop and re-applies it, which is what makes `disabled`
        // follow its signal instead of freezing at whatever it read on mount.
        disabled: this.disabledProp(),
        // Styles travel with the element rather than being written onto it
        // afterwards. The effect that used to do it runs on DOM ready, which
        // the ordinary render path never fires — so a Button rendered that way
        // had no styles at all, disabled or otherwise. Here the renderer owns
        // the subscription, applies it before modifiers run, and disposes it
        // with the element.
        style: this.styleProp(),
        onClick: this.props.action
          ? () => {
              // Gated in JS as well as by the attribute. A disabled button
              // suppresses clicks natively in a browser but not in jsdom, and
              // an action that fires anyway is the difference between a
              // control that looks disabled and one that is.
              if (!this.isEnabled() || this.isLoading()) {
                return
              }
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
   * Check if the button has a shadow modifier applied
   */
  private hasShadowModifier(): boolean {
    let modifiers = (this as any).modifiers

    if (!modifiers && (this as any).modifierBuilder) {
      modifiers = (this as any).modifierBuilder.modifiers
    }

    if (!modifiers && (this as any).modifiableComponent) {
      modifiers = (this as any).modifiableComponent.modifiers
    }

    if (!modifiers || !Array.isArray(modifiers)) {
      return false
    }

    const hasShadow = modifiers.some((modifier: any) => {
      // Check both AppearanceModifier and ShadowModifier
      if (modifier.type === 'appearance' || modifier.type === 'shadow' ||
          modifier.constructor?.name === 'AppearanceModifier' ||
          modifier.constructor?.name === 'ShadowModifier') {
        return modifier.properties && modifier.properties.shadow !== undefined
      }
      return false
    })

    return hasShadow
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

    // Only apply boxShadow if no shadow modifier is present
    if (!this.hasShadowModifier()) {
      finalStyles.boxShadow = boxShadow
    }

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
  props?: Omit<ButtonProps, 'title' | 'action'>
): ModifiableComponentWithModifiers<ButtonProps>
/**
 * Props-second form, matching every other primitive — `Image(src, props)`,
 * `Toggle(isOn, props)`, `Text(content, props)`. Put `action` in the props
 * object.
 */
export function Button(
  title: string | (() => string) | Signal<string>,
  props?: Omit<ButtonProps, 'title'>
): ModifiableComponentWithModifiers<ButtonProps>
export function Button(
  title: string | (() => string) | Signal<string>,
  actionOrProps?: (() => void | Promise<void>) | Omit<ButtonProps, 'title'>,
  props: Omit<ButtonProps, 'title' | 'action'> = {}
): ModifiableComponentWithModifiers<ButtonProps> {
  // Button was the only primitive taking props third. Callers who learned the
  // shape from Text or Image wrote Button(title, props), which silently landed
  // the whole props object in the `action` slot — every prop on it, `css`
  // included, was dropped with no runtime signal (#266). Both forms now work.
  // Three shapes to tell apart, and an explicit `undefined` in the action slot
  // must keep reading props from the third argument — Button(title, undefined,
  // props) is a real call pattern.
  const action =
    typeof actionOrProps === 'function'
      ? (actionOrProps as () => void | Promise<void>)
      : undefined
  const resolvedProps =
    actionOrProps != null && typeof actionOrProps !== 'function'
      ? (actionOrProps as Omit<ButtonProps, 'title'>)
      : props

  const buttonProps: ButtonProps = {
    ...resolvedProps,
    title,
    ...(action && { action }),
  }
  const component = createComponentInstance(EnhancedButton, buttonProps)
  return withModifiers(component)
}

type ButtonTitle = string | (() => string) | Signal<string>
type ButtonAction = () => void | Promise<void>

/**
 * The call shapes every `ButtonStyles.*` helper accepts.
 *
 * Two overloads rather than one signature admitting both, mirroring `Button`
 * itself. A single `(title, actionOrProps?, props?)` signature compiles
 * `Filled('a', { css: 'x' }, { disabled: true })` — an object second *and* a
 * third argument — which the implementation cannot honour: it branches on
 * `typeof actionOrProps === 'function'`, takes the object path, and forwards
 * only the second, dropping the third with no error and no warning (#307).
 * Splitting the shapes makes that call match no overload, so it fails to
 * compile instead of silently losing props.
 *
 * `TReserved` names the prop the helper sets for you — `variant` for `Filled`
 * and friends, `role` for `Destructive` and `Cancel` — and `Omit`s it from both
 * forms, carrying forward what these signatures already declared.
 *
 * Note that the `Omit` documents the intent without enforcing it: `ButtonProps`
 * inherits `[key: string]: any` from `ComponentProps`, so the index signature
 * still admits the key that `Omit` removed. Passing `variant` to `Filled`
 * compiles and is then overwritten. Closing that would mean intersecting a
 * `{ [K in TReserved]?: never }`, which turns a call that compiles today into
 * an error — a separate change from this one, and not a patch-safe one.
 */
interface ButtonStyleHelper<TReserved extends keyof ButtonProps> {
  (
    title: ButtonTitle,
    action?: ButtonAction,
    props?: Omit<ButtonProps, 'title' | 'action' | TReserved>
  ): ModifiableComponentWithModifiers<ButtonProps>
  (
    title: ButtonTitle,
    props?: Omit<ButtonProps, 'title' | TReserved>
  ): ModifiableComponentWithModifiers<ButtonProps>
}

/**
 * Build a `ButtonStyles` helper that applies `overrides` on top of the caller's
 * props.
 *
 * The overrides go last in both spreads so the helper's own reason for existing
 * cannot be overwritten by a caller — and `TReserved` keeps them from trying.
 */
function createButtonStyle<TReserved extends keyof ButtonProps>(
  overrides: Pick<ButtonProps, TReserved>
): ButtonStyleHelper<TReserved> {
  const helper = (
    title: ButtonTitle,
    actionOrProps?: ButtonAction | Omit<ButtonProps, 'title'>,
    props: Omit<ButtonProps, 'title' | 'action'> = {}
  ): ModifiableComponentWithModifiers<ButtonProps> =>
    actionOrProps == null || typeof actionOrProps === 'function'
      ? Button(title, actionOrProps as ButtonAction | undefined, {
          ...props,
          ...overrides,
        })
      : Button(title, { ...actionOrProps, ...overrides })

  return helper as ButtonStyleHelper<TReserved>
}

/**
 * Button variant shortcuts
 */
export const ButtonStyles = {
  /**
   * Filled button (primary)
   */
  Filled: createButtonStyle<'variant'>({ variant: 'filled' }),

  /**
   * Outlined button
   */
  Outlined: createButtonStyle<'variant'>({ variant: 'outlined' }),

  /**
   * Plain button (text only)
   */
  Plain: createButtonStyle<'variant'>({ variant: 'plain' }),

  /**
   * Bordered button
   */
  Bordered: createButtonStyle<'variant'>({ variant: 'bordered' }),

  /**
   * Destructive button
   */
  Destructive: createButtonStyle<'role'>({ role: 'destructive' }),

  /**
   * Cancel button
   */
  Cancel: createButtonStyle<'role'>({ role: 'cancel' }),
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
