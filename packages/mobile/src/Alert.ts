/**
 * Alert Component
 *
 * SwiftUI-inspired Alert component with modal system, backdrop, and animations.
 * Provides critical user feedback, confirmations, and error handling.
 */

import type { ModifiableComponent, ModifierBuilder } from '@tachui/core'
import { createEffect, createSignal, isSignal } from '@tachui/core'
import type { Signal } from '@tachui/core'
import { h } from '@tachui/core'
import type { ComponentInstance, ComponentProps, DOMNode } from '@tachui/core'
import { withModifiers } from '@tachui/core'
import { useLifecycle, AnimationManager, FocusManager } from '@tachui/core'

/**
 * Alert button configuration
 */
export interface AlertButton {
  title: string
  role?: 'default' | 'cancel' | 'destructive'
  action?: () => void | Promise<void>
}

/**
 * Alert component properties
 */
export interface AlertProps extends ComponentProps {
  // Content
  title: string | Signal<string>
  message?: string | Signal<string>

  // Buttons
  buttons: AlertButton[]

  // Visibility
  isPresented: Signal<boolean>

  // Behavior
  dismissOnBackdrop?: boolean
  escapeKeyDismisses?: boolean

  // Animation
  animationDuration?: number

  // Accessibility
  accessibilityLabel?: string
}

/**
 * Alert theme configuration
 */
export interface AlertTheme {
  colors: {
    background: string
    surface: string
    backdrop: string
    text: string
    textSecondary: string
    border: string
    buttonDefault: string
    buttonCancel: string
    buttonDestructive: string
    buttonText: string
    buttonTextDestructive: string
  }
  spacing: {
    padding: number
    buttonPadding: number
    gap: number
  }
  borderRadius: number
  maxWidth: number
  backdropBlur: string
}

/**
 * Default alert theme
 */
export const defaultAlertTheme: AlertTheme = {
  colors: {
    background: '#FFFFFF',
    surface: '#F8F9FA',
    backdrop: 'rgba(0, 0, 0, 0.4)',
    text: '#1A1A1A',
    textSecondary: '#6B7280',
    border: '#E5E5E5',
    buttonDefault: '#007AFF',
    buttonCancel: '#8E8E93',
    buttonDestructive: '#FF3B30',
    buttonText: '#FFFFFF',
    buttonTextDestructive: '#FFFFFF',
  },
  spacing: {
    padding: 24,
    buttonPadding: 16,
    gap: 16,
  },
  borderRadius: 16,
  maxWidth: 320,
  backdropBlur: 'blur(4px)',
}

/**
 * Alert component implementation
 */
export class AlertComponent implements ComponentInstance<AlertProps> {
  public readonly type = 'component' as const
  public readonly id: string
  public readonly props: AlertProps
  public cleanup: (() => void)[] = []
  private theme: AlertTheme = defaultAlertTheme

  constructor(props: AlertProps) {
    this.props = props
    this.id = `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // ENHANCED: Set up lifecycle hooks for animation and focus management
    useLifecycle(this, {
      onDOMReady: (_elements, primaryElement) => {
        if (primaryElement) {
          // Replace setTimeout animation delays with proper animation coordination
          this.setupAlertAnimations(primaryElement)

          // Replace setTimeout focus hack with proper focus management
          this.setupFocusManagement(primaryElement)
        }
      },
    })
  }

  /**
   * Set up alert animations using enhanced lifecycle (ENHANCED Phase 2)
   */
  private setupAlertAnimations(containerElement: Element): void {
    // Find content and backdrop elements and set up animations
    const contentElement = containerElement.querySelector(
      '[data-alert-content]'
    ) as HTMLElement
    const backdropElement = containerElement.querySelector(
      '[data-alert-backdrop]'
    ) as HTMLElement

    if (contentElement) {
      AnimationManager.scaleIn(
        this,
        contentElement,
        this.props.animationDuration || 300
      )
    }

    if (backdropElement) {
      AnimationManager.fadeIn(
        this,
        backdropElement,
        this.props.animationDuration || 300
      )
    }
  }

  /**
   * Set up focus management using enhanced lifecycle (ENHANCED Phase 2)
   */
  private setupFocusManagement(_containerElement: Element): void {
    // Focus first button for accessibility - no more setTimeout needed
    FocusManager.focusFirstFocusable(this)

    // Set up keyboard navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      this.handleKeyDown(e)
    }

    document.addEventListener('keydown', handleKeyDown)

    // Add cleanup
    if (!this.cleanup) this.cleanup = []
    this.cleanup.push(() => {
      document.removeEventListener('keydown', handleKeyDown)
    })
  }

  private createButton(button: AlertButton, _index: number): DOMNode {
    const buttonElement = h('button', {
      type: 'button',
      role: 'button',
      'aria-label': button.title,
      style: {
        padding: `${this.theme.spacing.buttonPadding}px`,
        border: 'none',
        borderRadius: `${this.theme.borderRadius / 2}px`,
        fontSize: '16px',
        fontWeight: '600',
        cursor: 'pointer',
        minWidth: '80px',
        backgroundColor: this.getButtonBackgroundColor(button.role),
        color: this.getButtonTextColor(button.role),
        transition: 'all 150ms ease-out',
        flex: '1',
      },
      onclick: async (e: Event) => {
        e.preventDefault()
        e.stopPropagation()

        // Execute button action if provided
        if (button.action) {
          try {
            await button.action()
          } catch (error) {
            console.error('Alert button action failed:', error)
          }
        }

        // Always dismiss alert after action
        if (typeof this.props.isPresented === 'function') {
          // biome-ignore lint/suspicious/noExplicitAny: Signal setter requires dynamic typing
          ;(this.props.isPresented as any)(false)
        }
      },
      onmouseenter: (e: Event) => {
        const target = e.target as HTMLElement
        target.style.opacity = '0.8'
        target.style.transform = 'scale(0.98)'
      },
      onmouseleave: (e: Event) => {
        const target = e.target as HTMLElement
        target.style.opacity = '1'
        target.style.transform = 'scale(1)'
      },
    })

    const element = buttonElement.element as HTMLElement
    if (element) {
      element.textContent = button.title
    }
    return buttonElement
  }

  private getButtonBackgroundColor(role?: AlertButton['role']): string {
    switch (role) {
      case 'destructive':
        return this.theme.colors.buttonDestructive
      case 'cancel':
        return this.theme.colors.buttonCancel
      default:
        return this.theme.colors.buttonDefault
    }
  }

  private getButtonTextColor(role?: AlertButton['role']): string {
    switch (role) {
      case 'destructive':
        return this.theme.colors.buttonTextDestructive
      default:
        return this.theme.colors.buttonText
    }
  }

  private createAlertContent(): DOMNode {
    const content = h('div', {
      'data-alert-content': true, // ENHANCED: Add data attribute for lifecycle hooks
      style: {
        backgroundColor: this.theme.colors.background,
        borderRadius: `${this.theme.borderRadius}px`,
        padding: `${this.theme.spacing.padding}px`,
        maxWidth: `${this.theme.maxWidth}px`,
        width: '90vw',
        maxHeight: '80vh',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
        border: `1px solid ${this.theme.colors.border}`,
        display: 'flex',
        flexDirection: 'column',
        gap: `${this.theme.spacing.gap}px`,
        transform: 'scale(0.9)',
        opacity: '0',
        transition: `all ${this.props.animationDuration || 200}ms cubic-bezier(0.34, 1.56, 0.64, 1)`,
      },
      role: 'alertdialog',
      'aria-modal': 'true',
      'aria-labelledby': `${this.id}-title`,
      'aria-describedby': this.props.message ? `${this.id}-message` : undefined,
    })

    // Title
    const titleElement = h('h2', {
      id: `${this.id}-title`,
      style: {
        margin: '0',
        fontSize: '18px',
        fontWeight: '700',
        color: this.theme.colors.text,
        textAlign: 'center',
      },
    })

    // Handle reactive title
    const titleElementDOM = titleElement.element as HTMLElement
    if (titleElementDOM) {
      if (isSignal(this.props.title)) {
        createEffect(() => {
          titleElementDOM.textContent = (this.props.title as Signal<string>)()
        })
      } else {
        titleElementDOM.textContent = this.props.title
      }
    }

    let contentDOM = content.element as HTMLElement
    if (contentDOM && titleElementDOM) {
      contentDOM.appendChild(titleElementDOM)
    }

    // Message (optional)
    if (this.props.message) {
      const messageElement = h('p', {
        id: `${this.id}-message`,
        style: {
          margin: '0',
          fontSize: '14px',
          fontWeight: '400',
          color: this.theme.colors.textSecondary,
          textAlign: 'center',
          lineHeight: '1.5',
        },
      })

      // Handle reactive message
      const messageElementDOM = messageElement.element as HTMLElement
      if (messageElementDOM) {
        if (isSignal(this.props.message)) {
          createEffect(() => {
            messageElementDOM.textContent = (
              this.props.message as Signal<string>
            )()
          })
        } else {
          messageElementDOM.textContent = this.props.message
        }
      }

      contentDOM = content.element as HTMLElement
      if (contentDOM && messageElementDOM) {
        contentDOM.appendChild(messageElementDOM)
      }
    }

    // Buttons container
    const buttonsContainer = h('div', {
      style: {
        display: 'flex',
        gap: `${this.theme.spacing.gap / 2}px`,
        marginTop: `${this.theme.spacing.gap / 2}px`,
      },
    })

    // Create buttons
    this.props.buttons.forEach((button, index) => {
      const buttonElement = this.createButton(button, index)
      const buttonsContainerDOM = buttonsContainer.element as HTMLElement
      const buttonElementDOM = buttonElement.element as HTMLElement
      if (buttonsContainerDOM && buttonElementDOM) {
        buttonsContainerDOM.appendChild(buttonElementDOM)
      }
    })

    contentDOM = content.element as HTMLElement
    const buttonsContainerDOM = buttonsContainer.element as HTMLElement
    if (contentDOM && buttonsContainerDOM) {
      contentDOM.appendChild(buttonsContainerDOM)
    }

    // ENHANCED: Animation is now handled by lifecycle hooks, no setTimeout needed

    return content
  }

  private createBackdrop(): DOMNode {
    const backdrop = h('div', {
      'data-alert-backdrop': true, // ENHANCED: Add data attribute for lifecycle hooks
      style: {
        position: 'fixed',
        top: '0',
        left: '0',
        right: '0',
        bottom: '0',
        backgroundColor: this.theme.colors.backdrop,
        backdropFilter: this.theme.backdropBlur,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: '9999',
        opacity: '0',
        transition: `opacity ${this.props.animationDuration || 200}ms ease-out`,
        padding: '20px',
      },
      onclick: (e: Event) => {
        if (
          e.target === backdrop.element &&
          (this.props.dismissOnBackdrop ?? true)
        ) {
          if (typeof this.props.isPresented === 'function') {
            // biome-ignore lint/suspicious/noExplicitAny: Signal setter requires dynamic typing
            ;(this.props.isPresented as any)(false)
          }
        }
      },
    })

    // ENHANCED: Backdrop animation is now handled by lifecycle hooks, no setTimeout needed

    return backdrop
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && (this.props.escapeKeyDismisses ?? true)) {
      e.preventDefault()
      if (typeof this.props.isPresented === 'function') {
        // biome-ignore lint/suspicious/noExplicitAny: Signal setter requires dynamic typing
        ;(this.props.isPresented as any)(false)
      }
    }

    // Focus management for accessibility
    if (e.key === 'Tab') {
      // Trap focus within the alert
      const focusableElements = this.getFocusableElements()
      if (focusableElements.length === 0) return

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault()
        lastElement.focus()
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault()
        firstElement.focus()
      }
    }
  }

  private getFocusableElements(): HTMLElement[] {
    const container = document.querySelector(`[data-alert-id="${this.id}"]`)
    if (!container) return []

    return Array.from(
      container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ) as HTMLElement[]
  }

  render(): DOMNode {
    const container = h('div', {
      'data-alert-id': this.id,
      style: {
        display: 'none', // Hidden by default
      },
    })

    // Expose minimal getAttribute for tests to assert attributes
    // biome-ignore lint/suspicious/noExplicitAny: Test utility requires DOM-like interface
    ;(container as any).getAttribute = (name: string) => {
      // biome-ignore lint/suspicious/noExplicitAny: Dynamic props access
      const value = (container.props as any)?.[name]
      return value == null ? null : String(value)
    }

    // Create reactive effect to show/hide alert
    createEffect(() => {
      const isPresented =
        typeof this.props.isPresented === 'function'
          ? // biome-ignore lint/suspicious/noExplicitAny: Signal getter requires dynamic typing
            (this.props.isPresented as any)()
          : this.props.isPresented

      if (isPresented) {
        // Show alert
        const backdrop = this.createBackdrop()
        const content = this.createAlertContent()

        const backdropDOM = backdrop.element as HTMLElement
        const contentDOM = content.element as HTMLElement
        const containerDOM = container.element as HTMLElement

        if (backdropDOM && contentDOM) {
          backdropDOM.appendChild(contentDOM)
        }
        if (containerDOM && backdropDOM) {
          containerDOM.appendChild(backdropDOM)
          containerDOM.style.display = 'block'
        }

        // ENHANCED: Keyboard listener and focus management now handled by lifecycle hooks

        // Prevent body scroll
        document.body.style.overflow = 'hidden'
      } else {
        // Hide alert
        const containerDOM = container.element as HTMLElement
        if (containerDOM) {
          const backdrop = containerDOM.querySelector('div')
          if (backdrop) {
            backdrop.style.opacity = '0'
            const content = backdrop.querySelector('div')
            if (content) {
              content.style.transform = 'scale(0.9)'
              content.style.opacity = '0'
            }

            // ENHANCED: Use transition event listener instead of setTimeout
            const handleTransitionEnd = () => {
              containerDOM.innerHTML = ''
              containerDOM.style.display = 'none'
              backdrop.removeEventListener('transitionend', handleTransitionEnd)

              // Clear fallback timeout if it exists
              if (fallbackTimeout) {
                clearTimeout(fallbackTimeout)
              }
            }
            backdrop.addEventListener('transitionend', handleTransitionEnd)

            // Fallback timeout in case transition doesn't fire (rare edge case)
            const fallbackTimeout = setTimeout(() => {
              backdrop.removeEventListener('transitionend', handleTransitionEnd)
              handleTransitionEnd()
            }, this.props.animationDuration || 200)
          }
        }

        // ENHANCED: Keyboard listener cleanup now handled by lifecycle hooks

        // Restore body scroll
        document.body.style.overflow = ''
      }
    })

    return container
  }
}

/**
 * Create an Alert component
 */
export function Alert(props: AlertProps): ModifiableComponent<AlertProps> & {
  modifier: ModifierBuilder<ModifiableComponent<AlertProps>>
} {
  return withModifiers(new AlertComponent(props))
}

/**
 * Alert utility functions
 */
export const AlertUtils = {
  /**
   * Create a simple confirmation alert
   */
  confirm(
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void
  ): Omit<AlertProps, 'isPresented'> & { isPresented: () => boolean } {
    const [isPresented] = createSignal(true)

    return {
      title,
      message,
      // biome-ignore lint/suspicious/noExplicitAny: Signal function type compatibility
      isPresented: isPresented as any,
      buttons: [
        {
          title: 'Cancel',
          role: 'cancel',
          action: onCancel,
        },
        {
          title: 'OK',
          role: 'default',
          action: onConfirm,
        },
      ],
    }
  },

  /**
   * Create a destructive action alert
   */
  destructive(
    title: string,
    message: string,
    destructiveTitle: string,
    onDestructive: () => void,
    onCancel?: () => void
  ): Omit<AlertProps, 'isPresented'> & { isPresented: () => boolean } {
    const [isPresented] = createSignal(true)

    return {
      title,
      message,
      // biome-ignore lint/suspicious/noExplicitAny: Signal function type compatibility
      isPresented: isPresented as any,
      buttons: [
        {
          title: 'Cancel',
          role: 'cancel',
          action: onCancel,
        },
        {
          title: destructiveTitle,
          role: 'destructive',
          action: onDestructive,
        },
      ],
    }
  },

  /**
   * Create a simple info alert
   */
  info(title: string, message?: string): AlertProps {
    const [isPresented] = createSignal(true)

    return {
      title,
      message,
      // biome-ignore lint/suspicious/noExplicitAny: Signal function type compatibility
      isPresented: isPresented as any,
      buttons: [
        {
          title: 'OK',
          role: 'default',
        },
      ],
    }
  },
}

/**
 * Alert styles and presets
 */
export const AlertStyles = {
  theme: defaultAlertTheme,

  /**
   * Create a custom theme
   */
  createTheme(overrides: Partial<AlertTheme>): AlertTheme {
    return { ...defaultAlertTheme, ...overrides }
  },
}
