/**
 * ActionSheet Component (TachUI)
 *
 * SwiftUI-inspired action sheet component for presenting contextual choices.
 * Adapts between mobile (bottom sheet) and desktop (popover) presentations.
 */

import type { ModifiableComponent, ModifierBuilder } from '@tachui/core'
import { createEffect, isSignal } from '@tachui/core'
import type { Signal } from '@tachui/core'
import { h } from '@tachui/core'
import type { ComponentInstance, ComponentProps, DOMNode } from '@tachui/core'
import { withModifiers } from '@tachui/core'
import { useLifecycle } from '@tachui/core'

/**
 * Action button roles that determine styling and behavior
 */
export type ActionSheetButtonRole = 'default' | 'destructive' | 'cancel'

/**
 * ActionSheet presentation styles
 */
export type ActionSheetPresentationStyle = 'sheet' | 'popover' | 'adaptive'

/**
 * ActionSheet button configuration
 */
export interface ActionSheetButton {
  id?: string
  label: string
  role?: ActionSheetButtonRole
  disabled?: boolean | Signal<boolean>
  onPress: () => void
}

/**
 * ActionSheet component properties
 */
export interface ActionSheetProps extends ComponentProps {
  // Content
  title?: string
  message?: string
  buttons: ActionSheetButton[]

  // Presentation
  isPresented: boolean | Signal<boolean>
  presentationStyle?: ActionSheetPresentationStyle | Signal<ActionSheetPresentationStyle>

  // Behavior
  allowsBackdropDismissal?: boolean | Signal<boolean>
  onDismiss?: () => void

  // Positioning (for popover style)
  anchorElement?: HTMLElement

  // Accessibility
  accessibilityLabel?: string
  accessibilityHint?: string
}

/**
 * ActionSheet theme configuration
 */
export interface ActionSheetTheme {
  colors: {
    background: string
    overlay: string
    border: string
    text: string
    destructiveText: string
    cancelText: string
    disabledText: string
    buttonBackground: string
    buttonHover: string
    buttonPress: string
  }
  spacing: {
    padding: number
    gap: number
    borderRadius: number
  }
  typography: {
    titleSize: number
    messageSize: number
    buttonSize: number
    titleWeight: string
    buttonWeight: string
    fontFamily: string
  }
  animation: {
    duration: number
    easing: string
  }
}

/**
 * Default ActionSheet theme
 */
const defaultActionSheetTheme: ActionSheetTheme = {
  colors: {
    background: '#FFFFFF',
    overlay: 'rgba(0, 0, 0, 0.4)',
    border: '#E5E5EA',
    text: '#000000',
    destructiveText: '#FF3B30',
    cancelText: '#007AFF',
    disabledText: '#8E8E93',
    buttonBackground: 'transparent',
    buttonHover: 'rgba(0, 0, 0, 0.05)',
    buttonPress: 'rgba(0, 0, 0, 0.1)',
  },
  spacing: {
    padding: 16,
    gap: 8,
    borderRadius: 12,
  },
  typography: {
    titleSize: 17,
    messageSize: 13,
    buttonSize: 17,
    titleWeight: '600',
    buttonWeight: '400',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  animation: {
    duration: 250,
    easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
  },
}

/**
 * ActionSheet component implementation
 */
export class ActionSheetComponent implements ComponentInstance<ActionSheetProps> {
  public readonly type = 'component' as const
  public readonly id: string
  public readonly props: ActionSheetProps
  public cleanup: (() => void)[] = []
  private theme: ActionSheetTheme = defaultActionSheetTheme
  private overlayElement: HTMLElement | null = null
  private sheetElement: HTMLElement | null = null
  private isAnimating = false

  constructor(props: ActionSheetProps) {
    this.props = props
    this.id = `actionsheet-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // ENHANCED: Set up lifecycle hooks for ActionSheet animations
    useLifecycle(this, {
      onDOMReady: (_elements, primaryElement) => {
        if (primaryElement) {
          // Set up animation coordination
          this.setupActionSheetAnimations(primaryElement)
        }
      }
    })
  }

  private resolveValue<T>(value: T | Signal<T>): T {
    return isSignal(value) ? value() : value
  }

  /**
   * Set up ActionSheet animations using enhanced lifecycle (ENHANCED Phase 3)
   */
  private setupActionSheetAnimations(_containerElement: Element): void {
    // Animation coordination now handled by AnimationManager instead of setTimeout
    if (!this.cleanup) this.cleanup = []
  }

  private isPresented(): boolean {
    return this.resolveValue(this.props.isPresented)
  }

  private getPresentationStyle(): ActionSheetPresentationStyle {
    const style = this.resolveValue(this.props.presentationStyle || 'adaptive')

    if (style === 'adaptive') {
      // Determine appropriate style based on screen size
      if (typeof window !== 'undefined') {
        return window.innerWidth <= 768 ? 'sheet' : 'popover'
      }
      return 'sheet'
    }

    return style
  }

  private allowsBackdropDismissal(): boolean {
    return this.resolveValue(this.props.allowsBackdropDismissal ?? true)
  }

  private sortButtons(): ActionSheetButton[] {
    const buttons = [...this.props.buttons]

    return buttons.sort((a, b) => {
      // Destructive buttons first
      if (a.role === 'destructive' && b.role !== 'destructive') return -1
      if (b.role === 'destructive' && a.role !== 'destructive') return 1

      // Cancel buttons last
      if (a.role === 'cancel' && b.role !== 'cancel') return 1
      if (b.role === 'cancel' && a.role !== 'cancel') return -1

      // Default buttons maintain original order
      return 0
    })
  }

  public createButton(button: ActionSheetButton, index: number): DOMNode {
    const isDisabled = button.disabled ? this.resolveValue(button.disabled) : false

    const buttonElement = h('button', {
      id: button.id || `${this.id}-button-${index}`,
      disabled: isDisabled,
      style: {
        width: '100%',
        padding: `${this.theme.spacing.padding}px`,
        border: 'none',
        backgroundColor: this.theme.colors.buttonBackground,
        color: this.getButtonTextColor(button.role, isDisabled),
        fontSize: `${this.theme.typography.buttonSize}px`,
        fontWeight: button.role === 'cancel' ? '600' : this.theme.typography.buttonWeight,
        fontFamily: this.theme.typography.fontFamily,
        textAlign: 'center',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        borderRadius: `${this.theme.spacing.borderRadius}px`,
        transition: `all ${this.theme.animation.duration}ms ${this.theme.animation.easing}`,
        opacity: isDisabled ? 0.5 : 1,
        outline: 'none',
      },
      onclick: (e: Event) => {
        e.stopPropagation()
        if (!isDisabled && !this.isAnimating) {
          button.onPress()
          this.dismiss()
        }
      },
      onmouseenter: (e: Event) => {
        if (!isDisabled) {
          const target = e.target as HTMLElement
          target.style.backgroundColor = this.theme.colors.buttonHover
        }
      },
      onmouseleave: (e: Event) => {
        if (!isDisabled) {
          const target = e.target as HTMLElement
          target.style.backgroundColor = this.theme.colors.buttonBackground
        }
      },
      onmousedown: (e: Event) => {
        if (!isDisabled) {
          const target = e.target as HTMLElement
          target.style.backgroundColor = this.theme.colors.buttonPress
        }
      },
      onmouseup: (e: Event) => {
        if (!isDisabled) {
          const target = e.target as HTMLElement
          target.style.backgroundColor = this.theme.colors.buttonHover
        }
      },
      onkeydown: (e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          if (!isDisabled && !this.isAnimating) {
            button.onPress()
            this.dismiss()
          }
        }
      },
    })

    const buttonDOM = buttonElement.element as HTMLElement
    if (buttonDOM) {
      buttonDOM.textContent = button.label
      buttonDOM.setAttribute('role', 'button')
      buttonDOM.setAttribute('tabindex', '0')

      if (button.role === 'destructive') {
        buttonDOM.setAttribute('aria-label', `${button.label} (destructive action)`)
      }
    }

    return buttonElement
  }

  private getButtonTextColor(role?: ActionSheetButtonRole, isDisabled?: boolean): string {
    if (isDisabled) return this.theme.colors.disabledText

    switch (role) {
      case 'destructive':
        return this.theme.colors.destructiveText
      case 'cancel':
        return this.theme.colors.cancelText
      default:
        return this.theme.colors.text
    }
  }

  private createSheetContent(): DOMNode {
    const content = h('div', {
      'data-actionsheet-content': this.id, // ENHANCED: Add data attribute for lifecycle hooks
      style: {
        backgroundColor: this.theme.colors.background,
        borderRadius: `${this.theme.spacing.borderRadius}px`,
        border: `1px solid ${this.theme.colors.border}`,
        overflow: 'hidden',
        minWidth: '280px',
        maxWidth: '400px',
      },
    })

    const contentDOM = content.element as HTMLElement
    if (!contentDOM) return content

    // Title and message section
    if (this.props.title || this.props.message) {
      const header = h('div', {
        style: {
          padding: `${this.theme.spacing.padding}px`,
          borderBottom: `1px solid ${this.theme.colors.border}`,
          textAlign: 'center',
        },
      })

      const headerDOM = header.element as HTMLElement
      if (headerDOM) {
        if (this.props.title) {
          const title = h('div', {
            style: {
              fontSize: `${this.theme.typography.titleSize}px`,
              fontWeight: this.theme.typography.titleWeight,
              color: this.theme.colors.text,
              fontFamily: this.theme.typography.fontFamily,
              marginBottom: this.props.message ? '4px' : '0',
            },
          })

          const titleDOM = title.element as HTMLElement
          if (titleDOM) {
            titleDOM.textContent = this.props.title
            headerDOM.appendChild(titleDOM)
          }
        }

        if (this.props.message) {
          const message = h('div', {
            style: {
              fontSize: `${this.theme.typography.messageSize}px`,
              color: this.theme.colors.text,
              fontFamily: this.theme.typography.fontFamily,
              opacity: '0.7',
              lineHeight: '1.4',
            },
          })

          const messageDOM = message.element as HTMLElement
          if (messageDOM) {
            messageDOM.textContent = this.props.message
            headerDOM.appendChild(messageDOM)
          }
        }

        contentDOM.appendChild(headerDOM)
      }
    }

    // Buttons section
    const buttonsContainer = h('div', {
      style: {
        display: 'flex',
        flexDirection: 'column',
      },
    })

    const buttonsContainerDOM = buttonsContainer.element as HTMLElement
    if (buttonsContainerDOM) {
      const sortedButtons = this.sortButtons()
      sortedButtons.forEach((button, index) => {
        const buttonElement = this.createButton(button, index)
        const buttonDOM = buttonElement.element as HTMLElement

        if (buttonDOM) {
          // Add border between buttons except for the last one
          if (index < sortedButtons.length - 1) {
            buttonDOM.style.borderBottom = `1px solid ${this.theme.colors.border}`
          }

          // Special styling for cancel buttons (separate section)
          if (button.role === 'cancel' && index > 0) {
            buttonDOM.style.borderTop = `8px solid ${this.theme.colors.border}`
          }

          buttonsContainerDOM.appendChild(buttonDOM)
        }
      })

      contentDOM.appendChild(buttonsContainerDOM)
    }

    return content
  }

  private createSheetPresentation(): DOMNode {
    const presentationStyle = this.getPresentationStyle()

    const container = h('div', {
      style: {
        position: 'fixed',
        top: '0',
        left: '0',
        right: '0',
        bottom: '0',
        display: 'flex',
        alignItems: presentationStyle === 'sheet' ? 'flex-end' : 'center',
        justifyContent: 'center',
        padding: presentationStyle === 'sheet' ? '0' : `${this.theme.spacing.padding}px`,
        zIndex: '1000',
      },
    })

    const sheet = this.createSheetContent()
    const sheetDOM = sheet.element as HTMLElement

    if (sheetDOM) {
      if (presentationStyle === 'sheet') {
        // Mobile: slide up from bottom
        sheetDOM.style.width = '100%'
        sheetDOM.style.borderBottomLeftRadius = '0'
        sheetDOM.style.borderBottomRightRadius = '0'
        sheetDOM.style.transform = 'translateY(100%)'
        sheetDOM.style.transition = `transform ${this.theme.animation.duration}ms ${this.theme.animation.easing}`
      } else {
        // Desktop: popover style
        sheetDOM.style.transform = 'scale(0.9)'
        sheetDOM.style.opacity = '0'
        sheetDOM.style.transition = `all ${this.theme.animation.duration}ms ${this.theme.animation.easing}`
      }

      this.sheetElement = sheetDOM
    }

    const containerDOM = container.element as HTMLElement
    if (containerDOM && sheetDOM) {
      containerDOM.appendChild(sheetDOM)
    }

    return container
  }

  private dismiss(): void {
    if (this.isAnimating) return

    this.isAnimating = true
    const presentationStyle = this.getPresentationStyle()

    if (this.sheetElement) {
      if (presentationStyle === 'sheet') {
        this.sheetElement.style.transform = 'translateY(100%)'
      } else {
        this.sheetElement.style.transform = 'scale(0.9)'
        this.sheetElement.style.opacity = '0'
      }
    }

    if (this.overlayElement) {
      this.overlayElement.style.opacity = '0'
    }

    // ENHANCED: Use transition event listener instead of setTimeout
    const handleTransitionEnd = () => {
      this.isAnimating = false
      if (this.props.onDismiss) {
        this.props.onDismiss()
      }
      
      // Clean up event listener
      if (this.sheetElement) {
        this.sheetElement.removeEventListener('transitionend', handleTransitionEnd)
      }
    }
    
    if (this.sheetElement) {
      this.sheetElement.addEventListener('transitionend', handleTransitionEnd)
      
      // Fallback timeout in case transition doesn't fire
      const fallbackTimeout = setTimeout(() => {
        this.sheetElement?.removeEventListener('transitionend', handleTransitionEnd)
        handleTransitionEnd()
      }, this.theme.animation.duration)
      
      // Store cleanup
      if (!this.cleanup) this.cleanup = []
      this.cleanup.push(() => {
        if (fallbackTimeout) clearTimeout(fallbackTimeout)
      })
    }
  }

  private show(): void {
    if (this.isAnimating) return

    this.isAnimating = true
    const presentationStyle = this.getPresentationStyle()

    // Animate overlay
    if (this.overlayElement) {
      this.overlayElement.style.opacity = '1'
    }

    // ENHANCED: Animate sheet using AnimationManager instead of setTimeout
    if (this.sheetElement) {
      // Use requestAnimationFrame for reliable DOM-ready animation trigger
      requestAnimationFrame(() => {
        if (this.sheetElement) {
          if (presentationStyle === 'sheet') {
            this.sheetElement.style.transform = 'translateY(0)'
          } else {
            this.sheetElement.style.transform = 'scale(1)'
            this.sheetElement.style.opacity = '1'
          }
          
          // Use transition event listener for completion
          const handleTransitionEnd = () => {
            this.isAnimating = false
            this.sheetElement?.removeEventListener('transitionend', handleTransitionEnd)
          }
          
          this.sheetElement.addEventListener('transitionend', handleTransitionEnd)
          
          // Fallback timeout
          const fallbackTimeout = setTimeout(handleTransitionEnd, this.theme.animation.duration)
          
          // Store cleanup
          if (!this.cleanup) this.cleanup = []
          this.cleanup.push(() => {
            if (fallbackTimeout) clearTimeout(fallbackTimeout)
          })
        }
      })
    }
  }

  render(): DOMNode {
    if (!this.isPresented()) {
      return h('div', { style: { display: 'none' } })
    }

    const container = h('div', {
      id: this.id,
      'data-component': 'actionsheet',
      style: {
        position: 'fixed',
        top: '0',
        left: '0',
        right: '0',
        bottom: '0',
        zIndex: '1000',
      },
    })

    // Overlay
    const overlay = h('div', {
      'data-actionsheet-overlay': this.id, // ENHANCED: Add data attribute for lifecycle hooks
      style: {
        position: 'absolute',
        top: '0',
        left: '0',
        right: '0',
        bottom: '0',
        backgroundColor: this.theme.colors.overlay,
        opacity: '0',
        transition: `opacity ${this.theme.animation.duration}ms ${this.theme.animation.easing}`,
      },
      onclick: () => {
        if (this.allowsBackdropDismissal() && !this.isAnimating) {
          this.dismiss()
        }
      },
    })

    this.overlayElement = overlay.element as HTMLElement

    // Sheet presentation
    const presentation = this.createSheetPresentation()

    const containerDOM = container.element as HTMLElement
    const overlayDOM = overlay.element as HTMLElement
    const presentationDOM = presentation.element as HTMLElement

    if (containerDOM) {
      if (overlayDOM) containerDOM.appendChild(overlayDOM)
      if (presentationDOM) containerDOM.appendChild(presentationDOM)
    }

    // Set up keyboard navigation
    createEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && this.allowsBackdropDismissal() && !this.isAnimating) {
          this.dismiss()
        }
      }

      if (this.isPresented()) {
        document.addEventListener('keydown', handleKeyDown)
        this.show()

        return () => {
          document.removeEventListener('keydown', handleKeyDown)
        }
      }
    })

    return container
  }
}

/**
 * Create an ActionSheet component
 */
export function ActionSheet(props: ActionSheetProps): ModifiableComponent<ActionSheetProps> & {
  modifier: ModifierBuilder<ModifiableComponent<ActionSheetProps>>
} {
  return withModifiers(new ActionSheetComponent(props))
}

/**
 * ActionSheet utility functions and presets
 */
export const ActionSheetUtils = {
  /**
   * Create a confirmation action sheet
   */
  confirmation(
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void,
    confirmLabel = 'Confirm',
    destructive = false
  ): Omit<ActionSheetProps, 'isPresented'> {
    return {
      title,
      message,
      buttons: [
        {
          label: confirmLabel,
          role: destructive ? 'destructive' : 'default',
          onPress: onConfirm,
        },
        {
          label: 'Cancel',
          role: 'cancel',
          onPress: onCancel || (() => {}),
        },
      ],
    }
  },

  /**
   * Create a delete confirmation action sheet
   */
  deleteConfirmation(
    itemName: string,
    onDelete: () => void,
    onCancel?: () => void
  ): Omit<ActionSheetProps, 'isPresented'> {
    return {
      title: `Delete ${itemName}?`,
      message: 'This action cannot be undone.',
      buttons: [
        {
          label: 'Delete',
          role: 'destructive',
          onPress: onDelete,
        },
        {
          label: 'Cancel',
          role: 'cancel',
          onPress: onCancel || (() => {}),
        },
      ],
    }
  },

  /**
   * Create a share action sheet
   */
  shareActions(
    actions: Array<{ label: string; onPress: () => void }>,
    onCancel?: () => void
  ): Omit<ActionSheetProps, 'isPresented'> {
    return {
      title: 'Share',
      buttons: [
        ...actions.map((action) => ({
          label: action.label,
          role: 'default' as ActionSheetButtonRole,
          onPress: action.onPress,
        })),
        {
          label: 'Cancel',
          role: 'cancel' as ActionSheetButtonRole,
          onPress: onCancel || (() => {}),
        },
      ],
    }
  },
}

/**
 * ActionSheet styles and theming
 */
export const ActionSheetStyles = {
  theme: defaultActionSheetTheme,

  /**
   * Create a custom theme
   */
  createTheme(overrides: Partial<ActionSheetTheme>): ActionSheetTheme {
    return { ...defaultActionSheetTheme, ...overrides }
  },
}
