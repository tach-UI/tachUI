/**
 * Tests for Enhanced Button Component (Phase 5.2)
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ButtonProps, ButtonTheme } from '../../src/controls/Button'
import {
  Button,
  ButtonStyles,
  defaultButtonTheme,
  EnhancedButton,
} from '../../src/controls/Button'
import { createSignal } from '@tachui/core'

// Mock DOM environment
function createMockButtonElement(): HTMLElement {
  const element = {
    tagName: 'BUTTON',
    style: {} as CSSStyleDeclaration,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    setAttribute: vi.fn(),
    getAttribute: vi.fn(),
    querySelector: vi.fn(),
    textContent: '',
    id: `mock-${Math.random()}`,
  } as any

  return element
}

// Mock navigator for haptic feedback
beforeEach(() => {
  global.navigator = {
    ...global.navigator,
    vibrate: vi.fn(),
  }

  global.document = {
    ...global.document,
    createElement: vi.fn((tagName: string) => {
      if (tagName === 'button') {
        return createMockButtonElement()
      }
      if (tagName === 'style') {
        return { textContent: '' }
      }
      return {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        style: {},
        setAttribute: vi.fn(),
        querySelector: vi.fn(),
      }
    }),
    head: {
      appendChild: vi.fn(),
      removeChild: vi.fn(),
    },
  }
})

describe('EnhancedButton', () => {
  describe('Basic Functionality', () => {
    it('should create button component with string title', () => {
      const props: ButtonProps = {
        title: 'Click Me',
      }

      const button = new EnhancedButton(props)
      expect(button.type).toBe('component')
      expect(button.id).toMatch(/^button-/)
      expect(button.props).toEqual(props)
    })

    it('should handle string title', () => {
      const button = new EnhancedButton({ title: 'Test Button' })
      const rendered = button.render()
      expect(rendered).toBeDefined()
      expect(rendered).toHaveLength(1)
    })

    it('should handle function title', () => {
      const getTitle = () => 'Dynamic Title'
      const button = new EnhancedButton({ title: getTitle })
      const rendered = button.render()
      expect(rendered).toBeDefined()
      expect(rendered).toHaveLength(1)
    })

    it('should handle signal title', () => {
      const [title] = createSignal('Signal Title')
      const button = new EnhancedButton({ title })
      const rendered = button.render()
      expect(rendered).toBeDefined()
      expect(rendered).toHaveLength(1)
    })

    it('should handle empty title', () => {
      const button = new EnhancedButton({})
      const rendered = button.render()
      expect(rendered).toBeDefined()
      expect(rendered).toHaveLength(1)
    })

    it('should render button element', () => {
      const button = new EnhancedButton({ title: 'Test' })
      const elements = button.render()

      expect(elements).toHaveLength(1)
      expect(elements[0].tag).toBe('button')
      expect(elements[0].props?.className).toBe('tachui-button')
    })
  })

  describe('Button States', () => {
    it('should initialize with normal state', () => {
      const button = new EnhancedButton({ title: 'Test' })
      expect(button.stateSignal()).toBe('normal')
    })

    it('should handle enabled state', () => {
      const button = new EnhancedButton({ title: 'Test', isEnabled: true })
      expect(button.isEnabled()).toBe(true)
    })

    it('should handle disabled state', () => {
      const button = new EnhancedButton({ title: 'Test', isEnabled: false })
      expect(button.isEnabled()).toBe(false)
    })

    it('should handle signal enabled state', () => {
      const [isEnabled] = createSignal(true)
      const button = new EnhancedButton({ title: 'Test', isEnabled })
      const rendered = button.render()
      expect(rendered).toBeDefined()
      expect(rendered).toHaveLength(1)
    })

    it('should handle loading state', () => {
      const button = new EnhancedButton({ title: 'Test', isLoading: true })
      expect(button.isLoading()).toBe(true)
    })

    it('should handle signal loading state', () => {
      const [isLoading] = createSignal(false)
      const button = new EnhancedButton({ title: 'Test', isLoading })
      expect(button.isLoading()).toBe(false)
    })

    it('should default to enabled if not specified', () => {
      const button = new EnhancedButton({ title: 'Test' })
      expect(button.isEnabled()).toBe(true)
    })

    it('should default to not loading if not specified', () => {
      const button = new EnhancedButton({ title: 'Test' })
      expect(button.isLoading()).toBe(false)
    })
  })

  describe('Button Variants', () => {
    it('should handle filled variant', () => {
      const button = new EnhancedButton({ title: 'Test', variant: 'filled' })
      button.render()

      const styles = button.getButtonStyles()
      expect(styles.backgroundColor).toBe(defaultButtonTheme.colors.primary)
    })

    it('should handle outlined variant', () => {
      const button = new EnhancedButton({ title: 'Test', variant: 'outlined' })
      button.render()

      const styles = button.getButtonStyles()
      expect(styles.backgroundColor).toBe('transparent')
      expect(styles.borderColor).toBe(defaultButtonTheme.colors.primary)
    })

    it('should handle plain variant', () => {
      const button = new EnhancedButton({ title: 'Test', variant: 'plain' })
      button.render()

      const styles = button.getButtonStyles()
      expect(styles.backgroundColor).toBe('transparent')
      expect(styles.borderColor).toBe('transparent')
    })

    it('should handle bordered variant', () => {
      const button = new EnhancedButton({ title: 'Test', variant: 'bordered' })
      button.render()

      const styles = button.getButtonStyles()
      expect(styles.backgroundColor).toBe(defaultButtonTheme.colors.background)
      expect(styles.borderColor).toBe(defaultButtonTheme.colors.border)
    })

    it('should handle borderedProminent variant', () => {
      const button = new EnhancedButton({
        title: 'Test',
        variant: 'borderedProminent',
      })
      button.render()

      const styles = button.getButtonStyles()
      expect(styles.backgroundColor).toBe(defaultButtonTheme.colors.surface)
      expect(styles.borderWidth).toBe('2px')
    })

    it('should have no default variant styling', () => {
      const button = new EnhancedButton({ title: 'Test' })
      button.render()

      const styles = button.getButtonStyles()
      expect(styles.backgroundColor).toBeUndefined()
      expect(styles.borderColor).toBeUndefined()
      expect(styles.borderWidth).toBeUndefined()
      expect(styles.color).toBe('inherit') // Color inherits from parent by default
    })
  })

  describe('Button Sizes', () => {
    it('should handle small size', () => {
      const button = new EnhancedButton({ title: 'Test', size: 'small' })
      button.render()

      const styles = button.getButtonStyles()
      expect(styles.minHeight).toBe('32px')
      expect(styles.fontSize).toBe('14px')
    })

    it('should handle medium size', () => {
      const button = new EnhancedButton({ title: 'Test', size: 'medium' })
      button.render()

      const styles = button.getButtonStyles()
      expect(styles.minHeight).toBe('40px')
      expect(styles.fontSize).toBe('16px')
    })

    it('should handle large size', () => {
      const button = new EnhancedButton({ title: 'Test', size: 'large' })
      button.render()

      const styles = button.getButtonStyles()
      expect(styles.minHeight).toBe('48px')
      expect(styles.fontSize).toBe('18px')
    })

    it('should have no default size styling', () => {
      const button = new EnhancedButton({ title: 'Test' })
      button.render()

      const styles = button.getButtonStyles()
      expect(styles.minHeight).toBeUndefined()
    })
  })

  describe('Button Roles', () => {
    it('should handle destructive role with filled variant', () => {
      const button = new EnhancedButton({
        title: 'Delete',
        role: 'destructive',
        variant: 'filled',
      })
      button.render()

      const styles = button.getButtonStyles()
      expect(styles.backgroundColor).toBe(defaultButtonTheme.colors.destructive)
    })

    it('should handle cancel role with filled variant', () => {
      const button = new EnhancedButton({
        title: 'Cancel',
        role: 'cancel',
        variant: 'filled',
      })
      button.render()

      const styles = button.getButtonStyles()
      expect(styles.backgroundColor).toBe(defaultButtonTheme.colors.secondary)
    })

    it('should handle none role with filled variant', () => {
      const button = new EnhancedButton({
        title: 'Normal',
        role: 'none',
        variant: 'filled',
      })
      button.render()

      const styles = button.getButtonStyles()
      expect(styles.backgroundColor).toBe(defaultButtonTheme.colors.primary)
    })

    it('should have no role styling without variant', () => {
      const button = new EnhancedButton({ title: 'Test', role: 'destructive' })
      button.render()

      const styles = button.getButtonStyles()
      expect(styles.backgroundColor).toBeUndefined()
      expect(styles.borderColor).toBeUndefined()
      expect(styles.color).toBe('inherit') // Color inherits from parent by default
    })
  })

  describe('Button Tinting', () => {
    it('should apply static tint color with filled variant', () => {
      const button = new EnhancedButton({
        title: 'Test',
        tint: '#ff0000',
        variant: 'filled',
      })
      button.render()

      const styles = button.getButtonStyles()
      expect(styles.backgroundColor).toBe('#ff0000')
    })

    it('should apply signal tint color with filled variant', () => {
      const [tint] = createSignal('#00ff00')
      const button = new EnhancedButton({
        title: 'Test',
        tint,
        variant: 'filled',
      })
      button.render()

      const styles = button.getButtonStyles()
      expect(styles.backgroundColor).toBe('#00ff00')
    })
  })

  describe('Button Actions', () => {
    it('should handle synchronous action', async () => {
      const action = vi.fn()
      const button = new EnhancedButton({ title: 'Test', action })

      await button.handlePress()
      expect(action).toHaveBeenCalled()
    })

    it('should handle asynchronous action', async () => {
      const action = vi.fn().mockResolvedValue(undefined)
      const button = new EnhancedButton({ title: 'Test', action })

      await button.handlePress()
      expect(action).toHaveBeenCalled()
    })

    it('should handle action errors gracefully', async () => {
      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {})
      const action = vi.fn().mockRejectedValue(new Error('Test error'))
      const button = new EnhancedButton({ title: 'Test', action })

      await button.handlePress()
      expect(consoleError).toHaveBeenCalledWith(
        'Button action failed:',
        expect.any(Error)
      )

      consoleError.mockRestore()
    })

    it('should not call action when disabled', async () => {
      const action = vi.fn()
      const button = new EnhancedButton({
        title: 'Test',
        action,
        isEnabled: false,
      })

      await button.handlePress()
      expect(action).not.toHaveBeenCalled()
    })

    it('should not call action when loading', async () => {
      const action = vi.fn()
      const button = new EnhancedButton({
        title: 'Test',
        action,
        isLoading: true,
      })

      await button.handlePress()
      expect(action).not.toHaveBeenCalled()
    })
  })

  describe('Button Visual States', () => {
    it('should apply disabled styles when disabled', () => {
      const button = new EnhancedButton({ title: 'Test', isEnabled: false })
      button.render()

      const styles = button.getButtonStyles()
      expect(styles.opacity).toBe('0.6')
      expect(styles.pointerEvents).toBe('none')
    })

    it('should apply loading styles when loading', () => {
      const button = new EnhancedButton({ title: 'Test', isLoading: true })
      button.render()

      const styles = button.getButtonStyles()
      expect(styles.opacity).toBe('0.6')
      expect(styles.pointerEvents).toBe('none')
    })

    it('should apply pressed transform when pressed', () => {
      const button = new EnhancedButton({ title: 'Test' })
      button.setState('pressed')
      button.render()

      const styles = button.getButtonStyles()
      expect(styles.transform).toBe('scale(0.95)')
    })

    it('should apply focus shadow when focused', () => {
      const button = new EnhancedButton({ title: 'Test' })
      button.setState('focused')
      button.render()

      const styles = button.getButtonStyles()
      expect(styles.boxShadow).toContain('#007AFF40')
    })
  })

  describe('Button Content', () => {
    it('should render title text', () => {
      const button = new EnhancedButton({ title: 'Click Me' })
      const elements = button.render()

      expect(elements[0].children).toBeDefined()
    })

    it('should render system image when provided', () => {
      const button = new EnhancedButton({ title: 'Save', systemImage: '💾' })
      const elements = button.render()

      expect(elements[0].children).toBeDefined()
    })

    it('should render loading indicator when loading', () => {
      const button = new EnhancedButton({ title: 'Loading', isLoading: true })
      const elements = button.render()

      expect(elements[0].children).toBeDefined()
    })

    it('should not render system image when loading', () => {
      const button = new EnhancedButton({
        title: 'Loading',
        systemImage: '💾',
        isLoading: true,
      })

      button.render()
      // Test would verify that loading spinner is shown instead of icon
    })
  })

  describe('Button Accessibility', () => {
    it('should set button role', () => {
      const button = new EnhancedButton({ title: 'Test' })
      button.render()
      // Test would verify role="button" is set
    })

    it('should set tabindex for enabled button', () => {
      const button = new EnhancedButton({ title: 'Test', isEnabled: true })
      button.render()
      // Test would verify tabindex="0" is set
    })

    it('should set tabindex for disabled button', () => {
      const button = new EnhancedButton({ title: 'Test', isEnabled: false })
      button.render()
      // Test would verify tabindex="-1" is set
    })

    it('should apply accessibility label', () => {
      const button = new EnhancedButton({
        title: 'Test',
        accessibilityLabel: 'Test button',
      })
      button.render()
      // Test would verify aria-label is set
    })

    it('should apply accessibility hint', () => {
      const button = new EnhancedButton({
        title: 'Test',
        accessibilityHint: 'This is a test button',
      })
      button.render()
      // Test would verify aria-describedby is set
    })

    it('should apply destructive description', () => {
      const button = new EnhancedButton({
        title: 'Delete',
        role: 'destructive',
      })
      button.render()
      // Test would verify aria-description is set
    })
  })

  describe('Button Haptic Feedback', () => {
    it('should trigger haptic feedback by default', async () => {
      const button = new EnhancedButton({ title: 'Test', action: vi.fn() })

      await button.handlePress()
      expect(navigator.vibrate).toHaveBeenCalledWith(10)
    })

    it('should not trigger haptic feedback when disabled', async () => {
      const button = new EnhancedButton({
        title: 'Test',
        action: vi.fn(),
        hapticFeedback: false,
      })

      await button.handlePress()
      expect(navigator.vibrate).not.toHaveBeenCalled()
    })
  })

  describe('Custom Themes', () => {
    it('should use custom theme colors', () => {
      const customTheme: ButtonTheme = {
        ...defaultButtonTheme,
        colors: {
          ...defaultButtonTheme.colors,
          primary: '#custom-color',
        },
      }

      const button = new EnhancedButton(
        { title: 'Test', variant: 'filled' },
        customTheme
      )
      button.render()

      const styles = button.getButtonStyles()
      expect(styles.backgroundColor).toBe('#custom-color')
    })

    it('should use custom theme spacing', () => {
      const customTheme: ButtonTheme = {
        ...defaultButtonTheme,
        spacing: {
          small: 4,
          medium: 8,
          large: 12,
        },
      }

      const button = new EnhancedButton(
        { title: 'Test', size: 'small' },
        customTheme
      )
      button.render()

      const styles = button.getButtonStyles()
      expect(styles.padding).toBe('4px 8px')
    })
  })
})

describe('Button Factory Function', () => {
  it('should create modifiable button component', () => {
    const button = Button('Click Me')

    expect(button).toBeDefined()
    expect(typeof button.modifier).toBe('object')
    expect(typeof button.modifier.build).toBe('function')
  })

  it('should accept action parameter', () => {
    const action = vi.fn()
    const button = Button('Click Me', action)

    expect(button).toBeDefined()
  })

  it('should accept additional props', () => {
    const button = Button('Click Me', vi.fn(), {
      variant: 'outlined',
      size: 'large',
    })

    expect(button).toBeDefined()
  })

  it('should support modifier chaining', () => {
    const button = Button('Click Me').modifier.padding(16).margin(8).build()

    expect(button).toBeDefined()
  })
})

describe('ButtonStyles Presets', () => {
  it('should create filled button', () => {
    const button = ButtonStyles.Filled('Filled')
    expect(button).toBeDefined()
  })

  it('should create outlined button', () => {
    const button = ButtonStyles.Outlined('Outlined')
    expect(button).toBeDefined()
  })

  it('should create plain button', () => {
    const button = ButtonStyles.Plain('Plain')
    expect(button).toBeDefined()
  })

  it('should create bordered button', () => {
    const button = ButtonStyles.Bordered('Bordered')
    expect(button).toBeDefined()
  })

  it('should create destructive button', () => {
    const button = ButtonStyles.Destructive('Delete')
    expect(button).toBeDefined()
  })

  it('should create cancel button', () => {
    const button = ButtonStyles.Cancel('Cancel')
    expect(button).toBeDefined()
  })

  it('should accept action in presets', () => {
    const action = vi.fn()
    const button = ButtonStyles.Filled('Save', action)
    expect(button).toBeDefined()
  })

  it('should accept additional props in presets', () => {
    const button = ButtonStyles.Outlined('Outlined', vi.fn(), {
      size: 'large',
      tint: '#ff0000',
    })
    expect(button).toBeDefined()
  })
})

describe('Default Button Theme', () => {
  it('should have correct color values', () => {
    expect(defaultButtonTheme.colors.primary).toBe('#007AFF')
    expect(defaultButtonTheme.colors.destructive).toBe('#FF3B30')
    expect(defaultButtonTheme.colors.secondary).toBe('#5856D6')
  })

  it('should have correct spacing values', () => {
    expect(defaultButtonTheme.spacing.small).toBe(8)
    expect(defaultButtonTheme.spacing.medium).toBe(12)
    expect(defaultButtonTheme.spacing.large).toBe(16)
  })

  it('should have correct border radius values', () => {
    expect(defaultButtonTheme.borderRadius.small).toBe(6)
    expect(defaultButtonTheme.borderRadius.medium).toBe(8)
    expect(defaultButtonTheme.borderRadius.large).toBe(12)
  })

  it('should have correct typography values', () => {
    expect(defaultButtonTheme.typography.small).toEqual({
      size: 14,
      weight: '500',
    })
    expect(defaultButtonTheme.typography.medium).toEqual({
      size: 16,
      weight: '500',
    })
    expect(defaultButtonTheme.typography.large).toEqual({
      size: 18,
      weight: '600',
    })
  })
})

describe('Integration Tests', () => {
  it('should handle complex button configuration', () => {
    const [isLoading, _setIsLoading] = createSignal(false)
    const [isEnabled, _setIsEnabled] = createSignal(true)
    const action = vi.fn()

    const button = Button('Complex Button', action, {
      variant: 'filled',
      size: 'large',
      role: 'destructive',
      isLoading,
      isEnabled,
      systemImage: '🗑️',
      tint: '#ff4444',
      hapticFeedback: true,
      accessibilityLabel: 'Delete item button',
    })
      .modifier.padding(20)
      .margin(10)
      .build()

    expect(button).toBeDefined()
  })

  it('should work with signal title and reactive updates', () => {
    const [title, _setTitle] = createSignal('Initial')
    const button = Button(title, vi.fn())

    expect(button).toBeDefined()
  })

  it('should support textCase modifiers', () => {
    const button = Button('hello world', vi.fn())
      .modifier.textCase('uppercase')
      .build()

    expect(button).toBeDefined()
    expect(button.modifiers).toBeDefined()
    expect(button.modifiers.length).toBeGreaterThan(0)

    // Check that typography modifier exists with correct transform
    const typographyModifier = button.modifiers.find(
      m => m.type === 'typography'
    )
    expect(typographyModifier).toBeDefined()
    expect(typographyModifier?.properties.transform).toBe('uppercase')

    // Verify modifier is attached to rendered element
    const rendered = button.render()
    const buttonElement = rendered[0]
    expect(buttonElement.modifiers).toBeDefined()
    expect(
      buttonElement.modifiers.some((m: any) => m.type === 'typography')
    ).toBe(true)
  })

  it('should support chaining typography modifiers with other modifiers', () => {
    const button = Button('styled button', vi.fn())
      .modifier.textCase('capitalize')
      .fontSize(18)
      .padding(10)
      .backgroundColor('#007AFF')
      .build()

    expect(button.modifiers.length).toBeGreaterThan(3)

    // Should have typography modifier for textCase
    const typographyModifier = button.modifiers.find(
      m => m.type === 'typography'
    )
    expect(typographyModifier).toBeDefined()
    expect(typographyModifier?.properties.transform).toBe('capitalize')

    // Should have appearance modifier for fontSize
    const fontSizeModifier = button.modifiers.find(
      m => m.type === 'appearance' && m.properties.font?.size === 18
    )
    expect(fontSizeModifier).toBeDefined()
  })
})
