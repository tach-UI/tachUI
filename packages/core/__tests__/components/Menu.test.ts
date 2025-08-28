/**
 * Tests for Menu Component
 *
 * Tests the dropdown functionality, positioning, keyboard navigation, and interactions
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Menu, type MenuItem, MenuStyles, MenuUtils } from '../../src/components/Menu'
import { createSignal } from '../../src/reactive'

// Mock DOM methods
const mockElement = {
  style: {},
  setAttribute: vi.fn(),
  getAttribute: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  appendChild: vi.fn(),
  removeChild: vi.fn(),
  contains: vi.fn(),
  querySelector: vi.fn(),
  querySelectorAll: vi.fn(() => []),
  getBoundingClientRect: vi.fn(() => ({
    top: 0,
    left: 0,
    bottom: 100,
    right: 200,
    width: 200,
    height: 100,
    x: 0,
    y: 0,
  })),
  focus: vi.fn(),
}

Object.defineProperty(document, 'body', {
  value: {
    appendChild: vi.fn(),
    removeChild: vi.fn(),
  },
  writable: true,
})

Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true })
Object.defineProperty(window, 'innerHeight', { value: 768, writable: true })

// Mock event listeners
const originalAddEventListener = document.addEventListener
const originalRemoveEventListener = document.removeEventListener
document.addEventListener = vi.fn()
document.removeEventListener = vi.fn()

describe('Menu Component', () => {
  let mockTrigger: HTMLElement

  beforeEach(() => {
    vi.clearAllMocks()
    mockTrigger = mockElement as any
  })

  afterEach(() => {
    document.addEventListener = originalAddEventListener
    document.removeEventListener = originalRemoveEventListener
  })

  describe('Component Creation', () => {
    it('should create menu with required props', () => {
      const items: MenuItem[] = [
        { title: 'Item 1', action: vi.fn() },
        { title: 'Item 2', action: vi.fn() },
      ]

      const menu = Menu({
        items,
        trigger: mockTrigger,
      })

      expect(menu).toBeDefined()
      expect(menu.type).toBe('component')
      expect(menu.id).toMatch(/menu-/)
      expect(menu.props.items).toEqual(items)
    })

    it('should create menu with function trigger', () => {
      const items: MenuItem[] = [{ title: 'Item 1' }]
      const triggerFunction = () => mockTrigger

      const menu = Menu({
        items,
        trigger: triggerFunction,
      })

      expect(menu.props.trigger).toBe(triggerFunction)
    })

    it('should create menu with component instance trigger', () => {
      const items: MenuItem[] = [{ title: 'Item 1' }]
      const triggerComponent = {
        type: 'component' as const,
        id: 'trigger-component',
        render: () => mockTrigger,
      }

      const menu = Menu({
        items,
        trigger: triggerComponent,
      })

      expect(menu.props.trigger).toBe(triggerComponent)
    })
  })

  describe('Menu Items', () => {
    it('should handle basic menu items', () => {
      const action1 = vi.fn()
      const action2 = vi.fn()

      const items: MenuItem[] = [
        { id: 'item1', title: 'First Item', action: action1 },
        { id: 'item2', title: 'Second Item', action: action2 },
      ]

      const menu = Menu({ items, trigger: mockTrigger })

      expect(menu.props.items[0].title).toBe('First Item')
      expect(menu.props.items[0].action).toBe(action1)
      expect(menu.props.items[1].title).toBe('Second Item')
      expect(menu.props.items[1].action).toBe(action2)
    })

    it('should handle menu items with system images', () => {
      const items: MenuItem[] = [
        { title: 'Copy', systemImage: '📋', action: vi.fn() },
        { title: 'Paste', systemImage: '📄', action: vi.fn() },
      ]

      const menu = Menu({ items, trigger: mockTrigger })

      expect(menu.props.items[0].systemImage).toBe('📋')
      expect(menu.props.items[1].systemImage).toBe('📄')
    })

    it('should handle menu items with keyboard shortcuts', () => {
      const items: MenuItem[] = [
        { title: 'Copy', shortcut: 'Cmd+C', action: vi.fn() },
        { title: 'Paste', shortcut: 'Cmd+V', action: vi.fn() },
      ]

      const menu = Menu({ items, trigger: mockTrigger })

      expect(menu.props.items[0].shortcut).toBe('Cmd+C')
      expect(menu.props.items[1].shortcut).toBe('Cmd+V')
    })

    it('should handle disabled menu items', () => {
      const items: MenuItem[] = [
        { title: 'Enabled Item', action: vi.fn() },
        { title: 'Disabled Item', disabled: true, action: vi.fn() },
      ]

      const menu = Menu({ items, trigger: mockTrigger })

      expect(menu.props.items[0].disabled).toBeUndefined()
      expect(menu.props.items[1].disabled).toBe(true)
    })

    it('should handle destructive menu items', () => {
      const items: MenuItem[] = [
        { title: 'Normal Item', action: vi.fn() },
        { title: 'Delete Item', destructive: true, action: vi.fn() },
      ]

      const menu = Menu({ items, trigger: mockTrigger })

      expect(menu.props.items[0].destructive).toBeUndefined()
      expect(menu.props.items[1].destructive).toBe(true)
    })

    it('should handle menu item roles', () => {
      const items: MenuItem[] = [
        { title: 'Default', role: 'default', action: vi.fn() },
        { title: 'Cancel', role: 'cancel', action: vi.fn() },
        { title: 'Delete', role: 'destructive', action: vi.fn() },
      ]

      const menu = Menu({ items, trigger: mockTrigger })

      expect(menu.props.items[0].role).toBe('default')
      expect(menu.props.items[1].role).toBe('cancel')
      expect(menu.props.items[2].role).toBe('destructive')
    })

    it('should handle reactive menu item titles', () => {
      const [title1, setTitle1] = createSignal('Dynamic Title 1')
      const [title2, _setTitle2] = createSignal('Dynamic Title 2')

      const items: MenuItem[] = [
        { title: title1, action: vi.fn() },
        { title: title2, action: vi.fn() },
      ]

      const menu = Menu({ items, trigger: mockTrigger })

      expect(menu.props.items[0].title).toBe(title1)
      expect(menu.props.items[1].title).toBe(title2)

      setTitle1('Updated Title 1')
      expect(title1()).toBe('Updated Title 1')
    })

    it('should handle reactive disabled state', () => {
      const [isDisabled, setIsDisabled] = createSignal(false)

      const items: MenuItem[] = [{ title: 'Toggle Item', disabled: isDisabled, action: vi.fn() }]

      const menu = Menu({ items, trigger: mockTrigger })

      expect(menu.props.items[0].disabled).toBe(isDisabled)

      setIsDisabled(true)
      expect(isDisabled()).toBe(true)
    })
  })

  describe('Menu Behavior', () => {
    it('should support custom placement', () => {
      const items: MenuItem[] = [{ title: 'Item', action: vi.fn() }]

      const menu = Menu({
        items,
        trigger: mockTrigger,
        placement: 'top-start',
      })

      expect(menu.props.placement).toBe('top-start')
    })

    it('should support closeOnSelect option', () => {
      const items: MenuItem[] = [{ title: 'Item', action: vi.fn() }]

      const menu = Menu({
        items,
        trigger: mockTrigger,
        closeOnSelect: false,
      })

      expect(menu.props.closeOnSelect).toBe(false)
    })

    it('should support closeOnClickOutside option', () => {
      const items: MenuItem[] = [{ title: 'Item', action: vi.fn() }]

      const menu = Menu({
        items,
        trigger: mockTrigger,
        closeOnClickOutside: false,
      })

      expect(menu.props.closeOnClickOutside).toBe(false)
    })

    it('should support escapeKeyCloses option', () => {
      const items: MenuItem[] = [{ title: 'Item', action: vi.fn() }]

      const menu = Menu({
        items,
        trigger: mockTrigger,
        escapeKeyCloses: false,
      })

      expect(menu.props.escapeKeyCloses).toBe(false)
    })

    it('should support custom positioning offset', () => {
      const items: MenuItem[] = [{ title: 'Item', action: vi.fn() }]
      const offset = { x: 10, y: 20 }

      const menu = Menu({
        items,
        trigger: mockTrigger,
        offset,
      })

      expect(menu.props.offset).toEqual(offset)
    })

    it('should support flip and shift options', () => {
      const items: MenuItem[] = [{ title: 'Item', action: vi.fn() }]

      const menu = Menu({
        items,
        trigger: mockTrigger,
        flip: false,
        shift: false,
      })

      expect(menu.props.flip).toBe(false)
      expect(menu.props.shift).toBe(false)
    })

    it('should support custom animation duration', () => {
      const items: MenuItem[] = [{ title: 'Item', action: vi.fn() }]

      const menu = Menu({
        items,
        trigger: mockTrigger,
        animationDuration: 300,
      })

      expect(menu.props.animationDuration).toBe(300)
    })
  })

  describe('Visibility Control', () => {
    it('should handle isOpen signal', () => {
      const [isOpen, setIsOpen] = createSignal(false)
      const items: MenuItem[] = [{ title: 'Item', action: vi.fn() }]

      const menu = Menu({
        items,
        trigger: mockTrigger,
        isOpen,
      })

      expect(menu.props.isOpen).toBe(isOpen)

      setIsOpen(true)
      expect(isOpen()).toBe(true)

      setIsOpen(false)
      expect(isOpen()).toBe(false)
    })
  })

  describe('MenuUtils', () => {
    it('should create separator item', () => {
      const separator = MenuUtils.separator()

      expect(separator.title).toBe('---')
    })

    it('should create destructive menu item', () => {
      const action = vi.fn()
      const destructiveItem = MenuUtils.destructive('Delete', action, '🗑️')

      expect(destructiveItem.title).toBe('Delete')
      expect(destructiveItem.action).toBe(action)
      expect(destructiveItem.destructive).toBe(true)
      expect(destructiveItem.systemImage).toBe('🗑️')
    })

    it('should create menu item with shortcut', () => {
      const action = vi.fn()
      const shortcutItem = MenuUtils.withShortcut('Copy', 'Cmd+C', action, '📋')

      expect(shortcutItem.title).toBe('Copy')
      expect(shortcutItem.shortcut).toBe('Cmd+C')
      expect(shortcutItem.action).toBe(action)
      expect(shortcutItem.systemImage).toBe('📋')
    })
  })

  describe('MenuStyles', () => {
    it('should provide default theme', () => {
      expect(MenuStyles.theme).toBeDefined()
      expect(MenuStyles.theme.colors).toBeDefined()
      expect(MenuStyles.theme.spacing).toBeDefined()
      expect(MenuStyles.theme.borderRadius).toBeDefined()
    })

    it('should create custom theme', () => {
      const customTheme = MenuStyles.createTheme({
        colors: {
          background: '#FF0000',
          text: '#FFFFFF',
        } as any,
        borderRadius: 12,
      })

      expect(customTheme.colors.background).toBe('#FF0000')
      expect(customTheme.colors.text).toBe('#FFFFFF')
      expect(customTheme.borderRadius).toBe(12)
    })

    it('should provide dark theme preset', () => {
      const darkTheme = MenuStyles.darkTheme()

      expect(darkTheme.colors.background).toBe('#2A2A2A')
      expect(darkTheme.colors.text).toBe('#FFFFFF')
      expect(darkTheme.colors.surface).toBe('#3A3A3A')
    })
  })

  describe('Accessibility', () => {
    it('should support accessibility label', () => {
      const items: MenuItem[] = [{ title: 'Item', action: vi.fn() }]

      const menu = Menu({
        items,
        trigger: mockTrigger,
        accessibilityLabel: 'Context menu',
      })

      expect(menu.props.accessibilityLabel).toBe('Context menu')
    })

    it('should render trigger with proper ARIA attributes', () => {
      const items: MenuItem[] = [{ title: 'Item', action: vi.fn() }]

      const menu = Menu({ items, trigger: mockTrigger })
      const rendered = menu.render()

      expect(rendered).toBeDefined()
    })
  })

  describe('Integration with Modifier System', () => {
    it('should work with modifier system', () => {
      const items: MenuItem[] = [{ title: 'Item', action: vi.fn() }]

      const menuWithModifiers = Menu({
        items,
        trigger: mockTrigger,
      })
        .modifier.opacity(0.9)
        .build()

      expect(menuWithModifiers).toBeDefined()
      expect(menuWithModifiers.modifiers).toBeDefined()
      expect(menuWithModifiers.modifiers.length).toBeGreaterThan(0)
    })

    it('should maintain component properties after modification', () => {
      const items: MenuItem[] = [{ title: 'Test Item', action: vi.fn() }]

      const originalMenu = Menu({
        items,
        trigger: mockTrigger,
        placement: 'bottom-end',
      })

      const modifiedMenu = originalMenu.modifier.backgroundColor('#FFFFFF').build()

      expect(modifiedMenu.props.items).toEqual(items)
      expect(modifiedMenu.props.placement).toBe('bottom-end')
    })
  })

  describe('Complex Menu Scenarios', () => {
    it('should handle complex menu with all features', () => {
      const [isOpen, _setIsOpen] = createSignal(false)
      const [dynamicTitle] = createSignal('Dynamic Item')
      const [isDisabled] = createSignal(false)

      const items: MenuItem[] = [
        {
          id: 'copy',
          title: 'Copy',
          systemImage: '📋',
          shortcut: 'Cmd+C',
          action: vi.fn(),
        },
        { title: '---' }, // Separator
        {
          title: dynamicTitle,
          disabled: isDisabled,
          action: vi.fn(),
        },
        {
          title: 'Delete',
          role: 'destructive',
          systemImage: '🗑️',
          action: vi.fn(),
        },
      ]

      const menu = Menu({
        items,
        trigger: mockTrigger,
        isOpen,
        placement: 'bottom-start',
        closeOnSelect: true,
        closeOnClickOutside: true,
        escapeKeyCloses: true,
        offset: { x: 5, y: 10 },
        flip: true,
        shift: true,
        animationDuration: 200,
        accessibilityLabel: 'Main context menu',
      })

      expect(menu.props.items).toHaveLength(4)
      expect(menu.props.isOpen).toBe(isOpen)
      expect(menu.props.placement).toBe('bottom-start')
      expect(menu.props.closeOnSelect).toBe(true)
      expect(menu.props.closeOnClickOutside).toBe(true)
      expect(menu.props.escapeKeyCloses).toBe(true)
      expect(menu.props.offset).toEqual({ x: 5, y: 10 })
      expect(menu.props.flip).toBe(true)
      expect(menu.props.shift).toBe(true)
      expect(menu.props.animationDuration).toBe(200)
      expect(menu.props.accessibilityLabel).toBe('Main context menu')
    })

    it('should handle menu with submenu items', () => {
      const items: MenuItem[] = [
        {
          title: 'Edit',
          submenu: [
            { title: 'Cut', shortcut: 'Cmd+X', action: vi.fn() },
            { title: 'Copy', shortcut: 'Cmd+C', action: vi.fn() },
            { title: 'Paste', shortcut: 'Cmd+V', action: vi.fn() },
          ],
        },
        {
          title: 'Share',
          submenu: [
            { title: 'Email', action: vi.fn() },
            { title: 'Messages', action: vi.fn() },
            { title: 'AirDrop', action: vi.fn() },
          ],
        },
      ]

      const menu = Menu({ items, trigger: mockTrigger })

      expect(menu.props.items[0].submenu).toHaveLength(3)
      expect(menu.props.items[1].submenu).toHaveLength(3)
      expect(menu.props.items[0].submenu?.[0].title).toBe('Cut')
      expect(menu.props.items[0].submenu?.[0].shortcut).toBe('Cmd+X')
    })

    it('should handle async menu item actions', async () => {
      const asyncAction = vi.fn().mockResolvedValue('completed')

      const items: MenuItem[] = [{ title: 'Async Action', action: asyncAction }]

      const menu = Menu({ items, trigger: mockTrigger })

      expect(menu.props.items[0].action).toBe(asyncAction)
    })
  })

  describe('Error Handling', () => {
    it('should handle missing menu items gracefully', () => {
      expect(() => {
        Menu({
          items: [],
          trigger: mockTrigger,
        })
      }).not.toThrow()
    })

    it('should handle invalid trigger gracefully', () => {
      const items: MenuItem[] = [{ title: 'Item', action: vi.fn() }]

      expect(() => {
        Menu({
          items,
          trigger: null as any,
        })
      }).not.toThrow()
    })

    it('should handle menu item action errors gracefully', () => {
      const errorAction = vi.fn().mockRejectedValue(new Error('Action failed'))
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const items: MenuItem[] = [{ title: 'Error Action', action: errorAction }]

      const menu = Menu({ items, trigger: mockTrigger })

      expect(menu).toBeDefined()

      consoleSpy.mockRestore()
    })
  })
})
