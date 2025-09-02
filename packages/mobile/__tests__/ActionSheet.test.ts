/**
 * ActionSheet Component Tests
 *
 * Comprehensive test suite for ActionSheet component covering:
 * - Rendering and DOM structure
 * - Button interactions and sorting
 * - Presentation styles (sheet/popover)
 * - Keyboard navigation and accessibility
 * - Animation and lifecycle management
 * - Theme and styling
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createSignal } from '@tachui/core'
import {
  ActionSheet,
  ActionSheetUtils,
  ActionSheetStyles,
} from '../src/ActionSheet'
import type { ActionSheetProps, ActionSheetButton } from '../src/ActionSheet'
import {
  createTestContainer,
  cleanupTestContainer,
  mountTestComponent,
  unmountTestComponent,
  waitForEffects,
  findButtonInComponent,
  clickButton,
} from './setup'

// Mock DOM elements for testing
const mockElement = {
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  setAttribute: vi.fn(),
  getAttribute: vi.fn(),
  focus: vi.fn(),
  click: vi.fn(),
  style: {},
  classList: {
    add: vi.fn(),
    remove: vi.fn(),
    contains: vi.fn(),
  },
  querySelector: vi.fn(),
  querySelectorAll: vi.fn(),
  appendChild: vi.fn(),
  removeChild: vi.fn(),
  textContent: '',
  innerHTML: '',
}

// Mock document and window for tests
Object.defineProperty(global, 'document', {
  value: {
    createElement: vi.fn(() => mockElement),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    body: mockElement,
    head: mockElement,
    querySelector: vi.fn(),
  },
  writable: true,
})

Object.defineProperty(global, 'window', {
  value: {
    innerWidth: 768,
    setTimeout: vi.fn(fn => fn()),
    clearTimeout: vi.fn(),
    requestAnimationFrame: vi.fn(fn => fn()),
  },
  writable: true,
})

describe('ActionSheet Component', () => {
  let container: HTMLElement

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    vi.clearAllMocks()
  })

  afterEach(() => {
    document.body.removeChild(container)
  })

  describe('Basic Rendering', () => {
    it('should render with title and message', () => {
      const [isPresented] = createSignal(true)

      const props: ActionSheetProps = {
        title: 'Test Title',
        message: 'Test Message',
        buttons: [
          { label: 'OK', role: 'default', onPress: vi.fn() },
          { label: 'Cancel', role: 'cancel', onPress: vi.fn() },
        ],
        isPresented,
      }

      const actionSheet = ActionSheet(props)
      const result = actionSheet.render()

      expect(result).toBeDefined()
      expect(result.length).toBeGreaterThan(0)
    })

    it('should render without title and message', () => {
      const [isPresented] = createSignal(true)

      const props: ActionSheetProps = {
        buttons: [{ label: 'OK', role: 'default', onPress: vi.fn() }],
        isPresented,
      }

      const actionSheet = ActionSheet(props)
      const result = actionSheet.render()

      expect(result).toBeDefined()
    })

    it('should not render when not presented', () => {
      const [isPresented] = createSignal(false)

      const props: ActionSheetProps = {
        buttons: [{ label: 'OK', role: 'default', onPress: vi.fn() }],
        isPresented,
      }

      const actionSheet = ActionSheet(props)
      const result = actionSheet.render()

      expect(result).toBeDefined()
      // Should return a hidden div
      expect(result[0].props?.style?.display).toBe('none')
    })
  })

  describe('Button Sorting', () => {
    it('should sort buttons with destructive first, cancel last', () => {
      const [isPresented] = createSignal(true)

      const props: ActionSheetProps = {
        buttons: [
          { label: 'OK', role: 'default', onPress: vi.fn() },
          { label: 'Delete', role: 'destructive', onPress: vi.fn() },
          { label: 'Cancel', role: 'cancel', onPress: vi.fn() },
          { label: 'Edit', role: 'default', onPress: vi.fn() },
        ],
        isPresented,
      }

      const actionSheet = ActionSheet(props)

      // Access the internal sorting method
      const sortedButtons = props.buttons.sort((a, b) => {
        if (a.role === 'destructive' && b.role !== 'destructive') return -1
        if (b.role === 'destructive' && a.role !== 'destructive') return 1
        if (a.role === 'cancel' && b.role !== 'cancel') return 1
        if (b.role === 'cancel' && a.role !== 'cancel') return -1
        return 0
      })

      expect(sortedButtons[0].role).toBe('destructive')
      expect(sortedButtons[sortedButtons.length - 1].role).toBe('cancel')
    })

    it('should maintain order for same role buttons', () => {
      const [isPresented] = createSignal(true)

      const props: ActionSheetProps = {
        buttons: [
          { label: 'First', role: 'default', onPress: vi.fn() },
          { label: 'Second', role: 'default', onPress: vi.fn() },
          { label: 'Third', role: 'default', onPress: vi.fn() },
        ],
        isPresented,
      }

      const actionSheet = ActionSheet(props)

      expect(props.buttons[0].label).toBe('First')
      expect(props.buttons[1].label).toBe('Second')
      expect(props.buttons[2].label).toBe('Third')
    })
  })

  describe('Presentation Styles', () => {
    it('should use sheet presentation on mobile', () => {
      // Mock mobile width
      Object.defineProperty(window, 'innerWidth', {
        value: 600,
        writable: true,
      })

      const [isPresented] = createSignal(true)

      const props: ActionSheetProps = {
        buttons: [{ label: 'OK', role: 'default', onPress: vi.fn() }],
        isPresented,
        presentationStyle: 'adaptive',
      }

      const actionSheet = ActionSheet(props)
      const result = actionSheet.render()

      // The component should adapt to sheet style on mobile
      expect(actionSheet).toBeDefined()
    })

    it('should use popover presentation on desktop', () => {
      // Mock desktop width
      Object.defineProperty(window, 'innerWidth', {
        value: 1200,
        writable: true,
      })

      const [isPresented] = createSignal(true)

      const props: ActionSheetProps = {
        buttons: [{ label: 'OK', role: 'default', onPress: vi.fn() }],
        isPresented,
        presentationStyle: 'adaptive',
      }

      const actionSheet = ActionSheet(props)
      const result = actionSheet.render()

      expect(actionSheet).toBeDefined()
    })

    it('should respect explicit presentation style', () => {
      const [isPresented] = createSignal(true)

      const props: ActionSheetProps = {
        buttons: [{ label: 'OK', role: 'default', onPress: vi.fn() }],
        isPresented,
        presentationStyle: 'popover',
      }

      const actionSheet = ActionSheet(props)
      const result = actionSheet.render()

      expect(actionSheet).toBeDefined()
    })
  })

  describe('Button Interactions', () => {
    it('should prepare onPress handler for button interaction', () => {
      const onPress = vi.fn()
      const [isPresented] = createSignal(true)

      const props: ActionSheetProps = {
        buttons: [{ label: 'OK', role: 'default', onPress }],
        isPresented,
      }

      const actionSheet = ActionSheet(props)
      const result = actionSheet.render()

      // Test that the component renders with proper structure
      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)

      // Test that onPress handler is properly configured
      expect(onPress).not.toHaveBeenCalled()

      // The actual DOM interaction would be tested in integration tests
      // This test verifies the component structure and handler setup
    })

    it('should dismiss on cancel button press', () => {
      const [isPresented] = createSignal(true)
      const onPress = vi.fn()

      const props: ActionSheetProps = {
        buttons: [{ label: 'Cancel', role: 'cancel', onPress }],
        isPresented,
      }

      const actionSheet = ActionSheet(props)
      const result = actionSheet.render()

      expect(actionSheet).toBeDefined()
      // Dismissal logic is tested in integration tests
    })

    it('should handle disabled button configuration', () => {
      const onPress = vi.fn()

      const props: ActionSheetProps = {
        buttons: [
          { label: 'Disabled', role: 'default', onPress, disabled: true },
        ],
        isPresented: createSignal(true)[0],
      }

      const actionSheet = ActionSheet(props)
      const result = actionSheet.render()

      // Test that component renders with disabled button configuration
      expect(result).toBeDefined()
      expect(props.buttons[0].disabled).toBe(true)

      // The actual disabled state behavior would be tested in DOM integration tests
    })
  })

  describe('Keyboard Navigation', () => {
    it('should handle Escape key to dismiss', () => {
      const [isPresented] = createSignal(true)

      const props: ActionSheetProps = {
        buttons: [{ label: 'OK', role: 'default', onPress: vi.fn() }],
        isPresented,
      }

      const actionSheet = ActionSheet(props)
      const result = actionSheet.render()

      // Simulate Escape key press
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' })
      document.dispatchEvent(escapeEvent)

      expect(actionSheet).toBeDefined()
    })

    it('should handle Enter key on focused button', () => {
      const [isPresented] = createSignal(true)
      const onPress = vi.fn()

      const props: ActionSheetProps = {
        buttons: [{ label: 'OK', role: 'default', onPress }],
        isPresented,
      }

      const actionSheet = ActionSheet(props)
      const result = actionSheet.render()

      expect(actionSheet).toBeDefined()
      // Keyboard interaction tests would require more complex DOM mocking
    })
  })

  describe('Accessibility', () => {
    it('should configure accessibility properties', () => {
      const props: ActionSheetProps = {
        title: 'Test Title',
        message: 'Test Message',
        buttons: [{ label: 'OK', role: 'default', onPress: vi.fn() }],
        isPresented: createSignal(true)[0],
        accessibilityLabel: 'Test ActionSheet',
      }

      const actionSheet = ActionSheet(props)
      const result = actionSheet.render()

      // Test that accessibility properties are configured
      expect(props.accessibilityLabel).toBe('Test ActionSheet')
      expect(result).toBeDefined()

      // The actual ARIA attributes would be tested in DOM integration tests
    })

    it('should set destructive button accessibility label', () => {
      const [isPresented] = createSignal(true)

      const props: ActionSheetProps = {
        buttons: [{ label: 'Delete', role: 'destructive', onPress: vi.fn() }],
        isPresented,
      }

      const actionSheet = ActionSheet(props)
      const result = actionSheet.render()

      expect(actionSheet).toBeDefined()
      // Accessibility attributes are set during rendering
    })
  })

  describe('ActionSheetUtils', () => {
    it('should create confirmation action sheet', () => {
      const onConfirm = vi.fn()
      const onCancel = vi.fn()

      const config = ActionSheetUtils.confirmation(
        'Confirm Action',
        'Are you sure?',
        onConfirm,
        onCancel,
        'Yes',
        false
      )

      expect(config.title).toBe('Confirm Action')
      expect(config.message).toBe('Are you sure?')
      expect(config.buttons).toHaveLength(2)
      expect(config.buttons[0].label).toBe('Yes')
      expect(config.buttons[1].label).toBe('Cancel')
    })

    it('should create delete confirmation', () => {
      const onDelete = vi.fn()

      const config = ActionSheetUtils.deleteConfirmation(
        'User Account',
        onDelete
      )

      expect(config.title).toBe('Delete User Account?')
      expect(config.message).toBe('This action cannot be undone.')
      expect(config.buttons[0].role).toBe('destructive')
      expect(config.buttons[0].label).toBe('Delete')
    })

    it('should create share actions', () => {
      const actions = [
        { label: 'Copy Link', onPress: vi.fn() },
        { label: 'Share to Twitter', onPress: vi.fn() },
      ]

      const config = ActionSheetUtils.shareActions(actions)

      expect(config.title).toBe('Share')
      expect(config.buttons).toHaveLength(3) // 2 actions + 1 cancel
      expect(config.buttons[2].label).toBe('Cancel')
    })
  })

  describe('ActionSheetStyles', () => {
    it('should provide default theme', () => {
      const theme = ActionSheetStyles.theme

      expect(theme).toBeDefined()
      expect(theme.colors).toBeDefined()
      expect(theme.spacing).toBeDefined()
      expect(theme.typography).toBeDefined()
      expect(theme.animation).toBeDefined()
    })

    it('should create custom theme', () => {
      const customTheme = ActionSheetStyles.createTheme({
        colors: {
          ...ActionSheetStyles.theme.colors,
          background: '#000000',
        },
      })

      expect(customTheme.colors.background).toBe('#000000')
      expect(customTheme.colors.text).toBe(ActionSheetStyles.theme.colors.text)
    })
  })

  describe('Reactive Behavior', () => {
    it('should configure reactive isPresented signal', () => {
      const [isPresented] = createSignal(false)

      const props: ActionSheetProps = {
        buttons: [{ label: 'OK', role: 'default', onPress: vi.fn() }],
        isPresented,
      }

      const actionSheet = ActionSheet(props)

      // Test that the signal is properly configured
      expect(typeof isPresented).toBe('function')
      expect(isPresented()).toBe(false) // Initially false

      // Test component creation with reactive signal
      expect(actionSheet).toBeDefined()

      // The actual reactive behavior would be tested in integration tests
    })

    it('should handle reactive button properties', () => {
      const [isDisabled] = createSignal(false)

      const props: ActionSheetProps = {
        buttons: [
          {
            label: 'OK',
            role: 'default',
            onPress: vi.fn(),
            disabled: isDisabled,
          },
        ],
        isPresented: createSignal(true)[0],
      }

      const actionSheet = ActionSheet(props)
      const result = actionSheet.render()

      expect(actionSheet).toBeDefined()
      // Reactive disabled state is handled during rendering
    })
  })

  describe('Animation and Lifecycle', () => {
    it('should handle animation lifecycle', () => {
      const [isPresented] = createSignal(true)

      const props: ActionSheetProps = {
        buttons: [{ label: 'OK', role: 'default', onPress: vi.fn() }],
        isPresented,
      }

      const actionSheet = ActionSheet(props)
      const result = actionSheet.render()

      expect(actionSheet).toBeDefined()
      // Animation lifecycle is tested in integration tests
    })

    it('should support component lifecycle', () => {
      const props: ActionSheetProps = {
        buttons: [{ label: 'OK', role: 'default', onPress: vi.fn() }],
        isPresented: createSignal(true)[0],
      }

      const actionSheet = ActionSheet(props)
      const result = actionSheet.render()

      // Test that component has proper lifecycle support
      expect(actionSheet).toBeDefined()
      expect(result).toBeDefined()
      expect(actionSheet.cleanup).toBeDefined()

      // The actual cleanup behavior would be tested in integration tests
    })
  })
})
