/**
 * Menu Component
 *
 * SwiftUI-inspired Menu component with dropdowns, context menus,
 * positioning, and keyboard navigation support.
 */

import type { ModifiableComponent, ModifierBuilder } from '@tachui/core'
import { createEffect, createSignal, isSignal } from '@tachui/core'
import type { Signal } from '@tachui/core'
import { h } from '@tachui/core'
import type { ComponentInstance, ComponentProps, DOMNode } from '@tachui/core'
import { withModifiers } from '@tachui/core'
import {
  useLifecycle,
  AnimationManager,
  FocusManager,
  setupPositioning,
} from '@tachui/core'

/**
 * Menu item configuration
 */
export interface MenuItem {
  id?: string
  title: string | Signal<string>
  systemImage?: string
  shortcut?: string
  disabled?: boolean | Signal<boolean>
  destructive?: boolean
  role?: 'default' | 'destructive' | 'cancel'
  action?: () => void | Promise<void>
  submenu?: MenuItem[]
}

/**
 * Menu positioning options
 */
export type MenuPlacement =
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'right'
  | 'right-start'
  | 'right-end'
  | 'left'
  | 'left-start'
  | 'left-end'

/**
 * Menu component properties
 */
export interface MenuProps extends ComponentProps {
  // Content
  items: MenuItem[]

  // Trigger
  trigger:
    | ComponentInstance
    | HTMLElement
    | (() => ComponentInstance | HTMLElement)

  // Visibility
  isOpen?: Signal<boolean>

  // Behavior
  placement?: MenuPlacement
  closeOnSelect?: boolean
  closeOnClickOutside?: boolean
  escapeKeyCloses?: boolean

  // Positioning
  offset?: { x: number; y: number }
  flip?: boolean
  shift?: boolean

  // Animation
  animationDuration?: number

  // Accessibility
  accessibilityLabel?: string
}

/**
 * Menu theme configuration
 */
export interface MenuTheme {
  colors: {
    background: string
    surface: string
    text: string
    textSecondary: string
    textDisabled: string
    textDestructive: string
    border: string
    hover: string
    active: string
    separator: string
    shortcut: string
    backdrop: string
  }
  spacing: {
    padding: number
    itemPadding: number
    gap: number
  }
  borderRadius: number
  minWidth: number
  maxWidth: number
  itemHeight: number
  shadow: string
  backdropBlur: string
}

/**
 * Default menu theme
 */
export const defaultMenuTheme: MenuTheme = {
  colors: {
    background: '#FFFFFF',
    surface: '#F8F9FA',
    text: '#1A1A1A',
    textSecondary: '#6B7280',
    textDisabled: '#A0A0A0',
    textDestructive: '#FF3B30',
    border: '#E5E5E5',
    hover: '#F0F0F0',
    active: '#E3F2FD',
    separator: '#E5E5E5',
    shortcut: '#8E8E93',
    backdrop: 'rgba(0, 0, 0, 0.1)',
  },
  spacing: {
    padding: 8,
    itemPadding: 12,
    gap: 4,
  },
  borderRadius: 8,
  minWidth: 200,
  maxWidth: 320,
  itemHeight: 36,
  shadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  backdropBlur: 'blur(2px)',
}

/**
 * Menu component implementation
 */
export class MenuComponent implements ComponentInstance<MenuProps> {
  public readonly type = 'component' as const
  public readonly id: string
  public readonly props: MenuProps
  public cleanup: (() => void)[] = []
  private theme: MenuTheme = defaultMenuTheme
  private isOpenSignal = createSignal(false)
  private get isOpen() {
    return this.isOpenSignal[0]
  }
  private get setIsOpen() {
    return this.isOpenSignal[1]
  }
  private focusedIndex = -1
  private menuElement: HTMLElement | null = null
  private triggerElement: HTMLElement | null = null

  constructor(props: MenuProps) {
    this.props = props
    this.id = `menu-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Use provided isOpen signal or internal one
    if (this.props.isOpen) {
      this.isOpenSignal = [
        this.props.isOpen,
        ((value: boolean | ((prev: boolean) => boolean)) => {
          if (typeof this.props.isOpen === 'function') {
            ;(this.props.isOpen as any)(
              typeof value === 'function'
                ? value((this.props.isOpen as any)())
                : value
            )
          }
        }) as any,
      ]
    }

    // ENHANCED: Set up lifecycle hooks for menu positioning and animations
    useLifecycle(this, {
      onDOMReady: (_elements, primaryElement) => {
        if (primaryElement) {
          // Set up menu positioning when DOM is ready
          this.setupMenuPositioning(primaryElement)

          // Set up animation and focus management
          this.setupMenuAnimations(primaryElement)
        }
      },
    })
  }

  private resolveValue<T>(value: T | Signal<T>): T {
    return isSignal(value) ? value() : value
  }

  /**
   * Set up menu positioning using enhanced lifecycle (ENHANCED Phase 3)
   */
  private setupMenuPositioning(_containerElement: Element): void {
    // Positioning is now handled via onDOMReady hooks when menu elements are guaranteed to exist
    // No more setTimeout positioning hacks needed
    if (!this.cleanup) this.cleanup = []

    // Set up positioning calculation that runs when both trigger and menu exist
    setupPositioning(
      this,
      `[data-menu-trigger="${this.id}"]`,
      `[data-menu-content="${this.id}"]`,
      (trigger, menu) =>
        this.calculatePosition(trigger as HTMLElement, menu as HTMLElement)
    )
  }

  /**
   * Set up menu animations using enhanced lifecycle (ENHANCED Phase 3)
   */
  private setupMenuAnimations(_containerElement: Element): void {
    // Animation coordination now handled by AnimationManager instead of setTimeout
    // Focus management handled by FocusManager instead of setTimeout
    if (!this.cleanup) this.cleanup = []
  }

  private getVisibleItems(): MenuItem[] {
    return this.props.items.filter(item => item.title !== '---') // Exclude separators
  }

  private createMenuItem(item: MenuItem, index: number): DOMNode {
    if (item.title === '---') {
      // Separator
      return h('div', {
        role: 'separator',
        style: {
          height: '1px',
          backgroundColor: this.theme.colors.separator,
          margin: `${this.theme.spacing.gap}px 0`,
        },
      })
    }

    const isDisabled = this.resolveValue<boolean>(item.disabled ?? false)
    const title = this.resolveValue<string>(item.title)

    const menuItem = h('div', {
      role: 'menuitem',
      tabindex: isDisabled ? '-1' : '0',
      'aria-disabled': isDisabled,
      'data-menu-item-index': index,
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: `${this.theme.spacing.itemPadding}px`,
        minHeight: `${this.theme.itemHeight}px`,
        fontSize: '14px',
        fontWeight: '400',
        color: isDisabled
          ? this.theme.colors.textDisabled
          : item.destructive || item.role === 'destructive'
            ? this.theme.colors.textDestructive
            : this.theme.colors.text,
        cursor: isDisabled ? 'default' : 'pointer',
        borderRadius: `${this.theme.borderRadius / 2}px`,
        transition: 'all 150ms ease-out',
        userSelect: 'none',
      },
      onclick: async (e: Event) => {
        if (isDisabled) return

        e.preventDefault()
        e.stopPropagation()

        if (item.action) {
          try {
            await item.action()
          } catch (error) {
            console.error('Menu item action failed:', error)
          }
        }

        if (this.props.closeOnSelect ?? true) {
          this.setIsOpenValue(false)
        }
      },
      onmouseenter: () => {
        if (!isDisabled) {
          this.focusedIndex = index
          this.updateItemFocus()
          const element = menuItem.element as HTMLElement
          if (element) element.style.backgroundColor = this.theme.colors.hover
        }
      },
      onmouseleave: () => {
        if (!isDisabled) {
          const element = menuItem.element as HTMLElement
          if (element) element.style.backgroundColor = 'transparent'
        }
      },
    })

    // Content container
    const content = h('div', {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: `${this.theme.spacing.gap * 2}px`,
      },
    })

    // System image/icon
    if (item.systemImage) {
      const icon = h('span', {
        style: {
          fontSize: '16px',
          color: 'inherit',
        },
      })
      const iconElement = icon.element as HTMLElement
      if (iconElement) iconElement.textContent = item.systemImage
      const contentElement = content.element as HTMLElement
      if (contentElement && iconElement) contentElement.appendChild(iconElement)
    }

    // Title
    const titleElement = h('span')
    const titleElementDOM = titleElement.element as HTMLElement
    if (titleElementDOM) titleElementDOM.textContent = title
    const contentElement = content.element as HTMLElement
    if (contentElement && titleElementDOM)
      contentElement.appendChild(titleElementDOM)

    const menuItemElement = menuItem.element as HTMLElement
    if (menuItemElement && contentElement)
      menuItemElement.appendChild(contentElement)

    // Keyboard shortcut
    if (item.shortcut) {
      const shortcut = h('span', {
        style: {
          fontSize: '12px',
          color: this.theme.colors.shortcut,
          fontFamily: 'monospace',
        },
      })
      const shortcutElement = shortcut.element as HTMLElement
      if (shortcutElement) {
        shortcutElement.textContent = item.shortcut ?? ''
      }
      if (menuItemElement && shortcutElement)
        menuItemElement.appendChild(shortcutElement)
    }

    // Submenu indicator
    if (item.submenu && item.submenu.length > 0) {
      const indicator = h('span', {
        style: {
          fontSize: '12px',
          color: this.theme.colors.textSecondary,
        },
      })
      const indicatorElement = indicator.element as HTMLElement
      if (indicatorElement) indicatorElement.textContent = '▶'
      if (menuItemElement && indicatorElement)
        menuItemElement.appendChild(indicatorElement)
    }

    return menuItem
  }

  private updateItemFocus(): void {
    if (!this.menuElement) return

    const items = this.menuElement.querySelectorAll('[role="menuitem"]')
    items.forEach((item, index) => {
      const element = item as HTMLElement
      if (index === this.focusedIndex) {
        element.style.backgroundColor = this.theme.colors.hover
        element.focus()
      } else {
        element.style.backgroundColor = 'transparent'
      }
    })
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (!this.isOpen()) return

    const visibleItems = this.getVisibleItems()

    switch (e.key) {
      case 'Escape':
        if (this.props.escapeKeyCloses ?? true) {
          e.preventDefault()
          this.setIsOpenValue(false)
        }
        break

      case 'ArrowDown':
        e.preventDefault()
        this.focusedIndex = Math.min(
          this.focusedIndex + 1,
          visibleItems.length - 1
        )
        this.updateItemFocus()
        break

      case 'ArrowUp':
        e.preventDefault()
        this.focusedIndex = Math.max(this.focusedIndex - 1, 0)
        this.updateItemFocus()
        break

      case 'Enter':
      case ' ':
        if (this.focusedIndex >= 0 && this.focusedIndex < visibleItems.length) {
          e.preventDefault()
          // const item = visibleItems[this.focusedIndex]
          const menuItem = this.menuElement?.querySelector(
            `[data-menu-item-index="${this.focusedIndex}"]`
          ) as HTMLElement
          if (menuItem) {
            menuItem.click()
          }
        }
        break

      case 'Home':
        e.preventDefault()
        this.focusedIndex = 0
        this.updateItemFocus()
        break

      case 'End':
        e.preventDefault()
        this.focusedIndex = visibleItems.length - 1
        this.updateItemFocus()
        break
    }
  }

  private calculatePosition(
    trigger: HTMLElement,
    menu: HTMLElement
  ): { x: number; y: number } {
    const triggerRect = trigger.getBoundingClientRect()
    const menuRect = menu.getBoundingClientRect()
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    }

    const placement = this.props.placement ?? 'bottom'
    const offset = this.props.offset ?? { x: 0, y: 4 }

    let x = 0
    let y = 0

    // Calculate base position based on placement
    switch (placement) {
      case 'bottom':
      case 'bottom-start':
      case 'bottom-end':
        y = triggerRect.bottom + offset.y
        break
      case 'top':
      case 'top-start':
      case 'top-end':
        y = triggerRect.top - menuRect.height - offset.y
        break
      case 'right':
      case 'right-start':
      case 'right-end':
        x = triggerRect.right + offset.x
        break
      case 'left':
      case 'left-start':
      case 'left-end':
        x = triggerRect.left - menuRect.width - offset.x
        break
    }

    switch (placement) {
      case 'bottom':
      case 'top':
        x = triggerRect.left + (triggerRect.width - menuRect.width) / 2
        break
      case 'bottom-start':
      case 'top-start':
        x = triggerRect.left
        break
      case 'bottom-end':
      case 'top-end':
        x = triggerRect.right - menuRect.width
        break
      case 'right':
      case 'left':
        y = triggerRect.top + (triggerRect.height - menuRect.height) / 2
        break
      case 'right-start':
      case 'left-start':
        y = triggerRect.top
        break
      case 'right-end':
      case 'left-end':
        y = triggerRect.bottom - menuRect.height
        break
    }

    // Handle flipping and shifting if enabled
    if (this.props.flip ?? true) {
      if (
        y + menuRect.height > viewport.height &&
        triggerRect.top > menuRect.height
      ) {
        y = triggerRect.top - menuRect.height - offset.y
      }
      if (
        x + menuRect.width > viewport.width &&
        triggerRect.left > menuRect.width
      ) {
        x = triggerRect.left - menuRect.width - offset.x
      }
    }

    if (this.props.shift ?? true) {
      x = Math.max(8, Math.min(x, viewport.width - menuRect.width - 8))
      y = Math.max(8, Math.min(y, viewport.height - menuRect.height - 8))
    }

    return { x, y }
  }

  private createMenuContent(): DOMNode {
    const menu = h('div', {
      role: 'menu',
      'aria-labelledby': `${this.id}-trigger`,
      'data-menu-id': this.id,
      'data-menu-content': this.id, // ENHANCED: Add data attribute for lifecycle hooks
      style: {
        position: 'fixed',
        backgroundColor: this.theme.colors.background,
        border: `1px solid ${this.theme.colors.border}`,
        borderRadius: `${this.theme.borderRadius}px`,
        boxShadow: this.theme.shadow,
        minWidth: `${this.theme.minWidth}px`,
        maxWidth: `${this.theme.maxWidth}px`,
        padding: `${this.theme.spacing.padding}px`,
        zIndex: '9999',
        opacity: '0',
        transform: 'scale(0.95)',
        transformOrigin: 'top',
        transition: `all ${this.props.animationDuration || 150}ms cubic-bezier(0.16, 1, 0.3, 1)`,
      },
    })

    // Create menu items
    this.props.items.forEach((item, index) => {
      const menuItem = this.createMenuItem(item, index)
      const menuElement = menu.element as HTMLElement
      const menuItemElement = menuItem.element as HTMLElement
      if (menuElement && menuItemElement) {
        menuElement.appendChild(menuItemElement)
      }
    })

    this.menuElement = menu.element as HTMLElement
    return menu
  }

  private setupTrigger(): HTMLElement {
    let trigger: HTMLElement

    if (typeof this.props.trigger === 'function') {
      const result = this.props.trigger()
      if ('render' in result) {
        const rendered = result.render()
        if (Array.isArray(rendered)) {
          trigger = rendered[0]?.element as HTMLElement
        } else {
          trigger =
            rendered instanceof HTMLElement
              ? rendered
              : (rendered?.element as HTMLElement)
        }
      } else {
        trigger = result as HTMLElement
      }
    } else if ('render' in this.props.trigger) {
      const rendered = this.props.trigger.render()
      if (Array.isArray(rendered)) {
        trigger = rendered[0]?.element as HTMLElement
      } else {
        trigger =
          rendered instanceof HTMLElement
            ? rendered
            : (rendered?.element as HTMLElement)
      }
    } else {
      trigger = this.props.trigger as HTMLElement
    }

    trigger.id = trigger.id || `${this.id}-trigger`
    trigger.setAttribute('aria-haspopup', 'menu')
    trigger.setAttribute('aria-expanded', String(this.isOpen()))
    trigger.setAttribute('data-menu-trigger', this.id) // ENHANCED: Add data attribute for lifecycle hooks

    trigger.addEventListener('click', e => {
      e.preventDefault()
      e.stopPropagation()
      this.setIsOpenValue(!this.isOpen())
    })

    this.triggerElement = trigger
    return trigger
  }

  render(): DOMNode {
    const container = h('div', {
      style: {
        position: 'relative',
        display: 'inline-block',
      },
    })

    // Setup trigger
    const trigger = this.setupTrigger()
    if (container.element && trigger) {
      ;(container.element as HTMLElement).appendChild(trigger)
    }

    // Create reactive effect for menu visibility
    createEffect(() => {
      const isOpenValue = this.isOpen()

      if (isOpenValue) {
        // Show menu
        const menu = this.createMenuContent()
        const menuElement = menu.element as HTMLElement
        if (menuElement) {
          document.body.appendChild(menuElement)
          this.menuElement = menuElement
        }

        // ENHANCED: Position and animate menu using lifecycle hooks
        if (this.triggerElement && this.menuElement) {
          // Immediate positioning - no setTimeout needed
          const position = this.calculatePosition(
            this.triggerElement,
            this.menuElement
          )
          this.menuElement.style.left = `${position.x}px`
          this.menuElement.style.top = `${position.y}px`

          // Use AnimationManager for smooth animation
          AnimationManager.scaleIn(
            this,
            this.menuElement,
            this.props.animationDuration || 150
          )

          // Use FocusManager for proper focus handling
          this.focusedIndex = 0
          FocusManager.focusWhenReady(
            this,
            '[role="menuitem"]',
            this.menuElement
          )
        }

        // Add event listeners
        document.addEventListener('keydown', this.handleKeyDown)
        document.addEventListener('click', this.handleClickOutside)

        // Update trigger aria-expanded
        this.triggerElement?.setAttribute('aria-expanded', 'true')
      } else {
        // ENHANCED: Hide menu using transition event listener instead of setTimeout
        if (this.menuElement) {
          this.menuElement.style.opacity = '0'
          this.menuElement.style.transform = 'scale(0.95)'

          // Use transition event listener for cleanup
          const handleTransitionEnd = () => {
            if (this.menuElement?.parentNode) {
              document.body.removeChild(this.menuElement)
              this.menuElement = null
            }
            this.menuElement?.removeEventListener(
              'transitionend',
              handleTransitionEnd
            )
          }
          this.menuElement.addEventListener(
            'transitionend',
            handleTransitionEnd
          )

          // Fallback timeout in case transition doesn't fire (rare edge case)
          const fallbackTimeout = setTimeout(() => {
            this.menuElement?.removeEventListener(
              'transitionend',
              handleTransitionEnd
            )
            handleTransitionEnd()
          }, this.props.animationDuration || 150)

          // Store cleanup for fallback timeout
          if (!this.cleanup) this.cleanup = []
          this.cleanup.push(() => {
            if (fallbackTimeout) clearTimeout(fallbackTimeout)
          })
        }

        // Remove event listeners
        document.removeEventListener('keydown', this.handleKeyDown)
        document.removeEventListener('click', this.handleClickOutside)

        // Update trigger aria-expanded
        this.triggerElement?.setAttribute('aria-expanded', 'false')

        // Reset focus index
        this.focusedIndex = -1
      }
    })

    return container
  }

  private handleClickOutside = (e: Event): void => {
    if (!(this.props.closeOnClickOutside ?? true)) return

    const target = e.target as Element
    const isInsideMenu = this.menuElement?.contains(target)
    const isInsideTrigger = this.triggerElement?.contains(target)

    if (!isInsideMenu && !isInsideTrigger) {
      this.setIsOpenValue(false)
    }
  }

  private setIsOpenValue = (value: boolean): void => {
    if (this.props.isOpen) {
      // For controlled component, the signal setter should be used directly
      if (typeof this.props.isOpen === 'function') {
        ;(this.props.isOpen as any)(value)
      }
    } else {
      this.setIsOpen(value)
    }
  }
}

/**
 * Create a Menu component
 */
export function Menu(
  props: MenuProps
): ModifiableComponent<MenuProps> & {
  modifier: ModifierBuilder<ModifiableComponent<MenuProps>>
} {
  return withModifiers(new MenuComponent(props))
}

/**
 * Menu utility functions and presets
 */
export const MenuUtils = {
  /**
   * Create a separator item
   */
  separator(): MenuItem {
    return { title: '---' }
  },

  /**
   * Create a destructive menu item
   */
  destructive(
    title: string,
    action: () => void,
    systemImage?: string
  ): MenuItem {
    return {
      title,
      action,
      destructive: true,
      systemImage,
    }
  },

  /**
   * Create a menu item with keyboard shortcut
   */
  withShortcut(
    title: string,
    shortcut: string,
    action: () => void,
    systemImage?: string
  ): MenuItem {
    return {
      title,
      shortcut,
      action,
      systemImage,
    }
  },

  /**
   * Create a context menu for right-click interactions
   */
  contextMenu(target: HTMLElement, items: MenuItem[]): void {
    const [isOpen, setIsOpen] = createSignal(false)
    const [position, setPosition] = createSignal({ x: 0, y: 0 })

    target.addEventListener('contextmenu', e => {
      e.preventDefault()
      setPosition({ x: e.clientX, y: e.clientY })
      setIsOpen(true)
    })

    // Note: This is a stub implementation
    // Full context menu positioning would require additional DOM manipulation
    console.log('Context menu requested', {
      items,
      position: position(),
      isOpen: isOpen(),
    })
  },
}

/**
 * Menu styles and theming
 */
export const MenuStyles = {
  theme: defaultMenuTheme,

  /**
   * Create a custom menu theme
   */
  createTheme(overrides: Partial<MenuTheme>): MenuTheme {
    return { ...defaultMenuTheme, ...overrides }
  },

  /**
   * Dark theme preset
   */
  darkTheme(): MenuTheme {
    return {
      ...defaultMenuTheme,
      colors: {
        ...defaultMenuTheme.colors,
        background: '#2A2A2A',
        surface: '#3A3A3A',
        text: '#FFFFFF',
        textSecondary: '#A0A0A0',
        border: '#404040',
        hover: '#404040',
        active: '#0066CC',
      },
    }
  },
}
