/**
 * Attributes Integration Tests
 *
 * Integration tests for attribute modifiers working together and with other
 * modifier systems for real-world usage patterns.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  id,
  data,
  tabIndex,
  aria,
  customProperties,
  themeColors,
  designTokens,
} from '../../src/attributes'
import type { ModifierContext } from '@tachui/core/modifiers/types'
import type { DOMNode } from '@tachui/core/runtime/types'

// Mock DOM element that supports both attributes and styles
class MockElement {
  private attributes: Record<string, string> = {}
  style: {
    [key: string]: string
    setProperty: (property: string, value: string) => void
  }

  constructor() {
    this.style = new Proxy({} as any, {
      set: (target, prop, value) => {
        target[prop] = value
        return true
      },
      get: (target, prop) => {
        if (prop === 'setProperty') {
          return (property: string, value: string) => {
            target[property] = value
            // Also set camelCase version for test compatibility
            const camelCase = property.replace(/-([a-z])/g, (match, letter) =>
              letter.toUpperCase()
            )
            target[camelCase] = value
          }
        }
        return target[prop]
      },
    })
  }

  setAttribute(name: string, value: string): void {
    this.attributes[name] = value
  }

  getAttribute(name: string): string | null {
    return this.attributes[name] !== undefined ? this.attributes[name] : null
  }

  hasAttribute(name: string): boolean {
    return name in this.attributes
  }

  removeAttribute(name: string): void {
    delete this.attributes[name]
  }

  // For testing - get all attributes
  getAllAttributes(): Record<string, string> {
    return { ...this.attributes }
  }
}

describe('Attributes Integration Tests', () => {
  let mockElement: MockElement
  let mockContext: ModifierContext

  beforeEach(() => {
    mockElement = new MockElement()
    mockContext = {
      element: mockElement as unknown as HTMLElement,
    }

    // Reset console spies
    vi.clearAllMocks()
  })

  describe('HTML Attributes Integration', () => {
    it('should apply multiple HTML attributes together', () => {
      // Common pattern: ID + data attributes + tabIndex
      id('login-form').apply({} as DOMNode, mockContext)
      data({
        testId: 'login-form',
        component: 'form',
        version: '2.1',
      }).apply({} as DOMNode, mockContext)
      tabIndex(0).apply({} as DOMNode, mockContext)

      const attributes = mockElement.getAllAttributes()

      expect(attributes['id']).toBe('login-form')
      expect(attributes['data-test-id']).toBe('login-form')
      expect(attributes['data-component']).toBe('form')
      expect(attributes['data-version']).toBe('2.1')
      expect(attributes['tabindex']).toBe('0')
    })

    it('should handle form field identification pattern', () => {
      // Pattern: Form field with comprehensive identification
      id('email-field').apply({} as DOMNode, mockContext)
      data({
        testId: 'email-input',
        fieldType: 'email',
        required: true,
        validation: 'email-format',
      }).apply({} as DOMNode, mockContext)

      expect(mockElement.getAttribute('id')).toBe('email-field')
      expect(mockElement.getAttribute('data-test-id')).toBe('email-input')
      expect(mockElement.getAttribute('data-field-type')).toBe('email')
      expect(mockElement.getAttribute('data-required')).toBe('true')
      expect(mockElement.getAttribute('data-validation')).toBe('email-format')
    })

    it('should handle navigation menu pattern', () => {
      // Pattern: Navigation menu item
      id('nav-home').apply({} as DOMNode, mockContext)
      data({
        navItem: 'home',
        route: '/',
        icon: 'house',
      }).apply({} as DOMNode, mockContext)
      tabIndex(0).apply({} as DOMNode, mockContext)

      expect(mockElement.getAttribute('id')).toBe('nav-home')
      expect(mockElement.getAttribute('data-nav-item')).toBe('home')
      expect(mockElement.getAttribute('data-route')).toBe('/')
      expect(mockElement.getAttribute('data-icon')).toBe('house')
      expect(mockElement.getAttribute('tabindex')).toBe('0')
    })
  })

  describe('ARIA Integration Patterns', () => {
    it('should handle accessible button pattern', () => {
      // Pattern: Accessible button with full ARIA support
      id('menu-toggle').apply({} as DOMNode, mockContext)
      data({ testId: 'hamburger-menu' }).apply({} as DOMNode, mockContext)
      aria({
        role: 'button',
        label: 'Toggle navigation menu',
        expanded: false,
        controls: 'main-navigation',
        haspopup: 'menu',
      }).apply({} as DOMNode, mockContext)
      tabIndex(0).apply({} as DOMNode, mockContext)

      const attributes = mockElement.getAllAttributes()
      expect(attributes['id']).toBe('menu-toggle')
      expect(attributes['data-test-id']).toBe('hamburger-menu')
      expect(attributes['role']).toBe('button')
      expect(attributes['aria-label']).toBe('Toggle navigation menu')
      expect(attributes['aria-expanded']).toBe('false')
      expect(attributes['aria-controls']).toBe('main-navigation')
      expect(attributes['aria-haspopup']).toBe('menu')
      expect(attributes['tabindex']).toBe('0')
    })

    it('should handle accessible form field pattern', () => {
      // Pattern: Accessible form field with validation
      id('password-input').apply({} as DOMNode, mockContext)
      data({
        testId: 'password-field',
        fieldGroup: 'authentication',
      }).apply({} as DOMNode, mockContext)
      aria({
        required: true,
        invalid: false,
        describedby: 'password-help password-error',
        labelledby: 'password-label',
      }).apply({} as DOMNode, mockContext)

      expect(mockElement.getAttribute('id')).toBe('password-input')
      expect(mockElement.getAttribute('data-test-id')).toBe('password-field')
      expect(mockElement.getAttribute('aria-required')).toBe('true')
      expect(mockElement.getAttribute('aria-invalid')).toBe('false')
      expect(mockElement.getAttribute('aria-describedby')).toBe(
        'password-help password-error'
      )
      expect(mockElement.getAttribute('aria-labelledby')).toBe('password-label')
    })

    it('should handle accessible tab panel pattern', () => {
      // Pattern: Tab panel with full accessibility
      id('settings-panel').apply({} as DOMNode, mockContext)
      data({
        testId: 'settings-content',
        tabGroup: 'main-tabs',
        tabIndex: 2,
      }).apply({} as DOMNode, mockContext)
      aria({
        role: 'tabpanel',
        labelledby: 'settings-tab',
        hidden: false,
      }).apply({} as DOMNode, mockContext)
      tabIndex(0).apply({} as DOMNode, mockContext)

      expect(mockElement.getAttribute('id')).toBe('settings-panel')
      expect(mockElement.getAttribute('data-tab-group')).toBe('main-tabs')
      expect(mockElement.getAttribute('role')).toBe('tabpanel')
      expect(mockElement.getAttribute('aria-labelledby')).toBe('settings-tab')
      expect(mockElement.getAttribute('aria-hidden')).toBe('false')
      expect(mockElement.getAttribute('tabindex')).toBe('0')
    })

    it('should handle accessible live region pattern', () => {
      // Pattern: Live region for status updates
      id('status-region').apply({} as DOMNode, mockContext)
      data({
        testId: 'status-announcements',
        updateFrequency: 'on-change',
      }).apply({} as DOMNode, mockContext)
      aria({
        live: 'polite',
        atomic: true,
        relevant: 'additions text',
      }).apply({} as DOMNode, mockContext)
      tabIndex(-1).apply({} as DOMNode, mockContext) // Programmatically focusable

      expect(mockElement.getAttribute('id')).toBe('status-region')
      expect(mockElement.getAttribute('data-test-id')).toBe(
        'status-announcements'
      )
      expect(mockElement.getAttribute('aria-live')).toBe('polite')
      expect(mockElement.getAttribute('aria-atomic')).toBe('true')
      expect(mockElement.getAttribute('aria-relevant')).toBe('additions text')
      expect(mockElement.getAttribute('tabindex')).toBe('-1')
    })
  })

  describe('CSS Properties Integration', () => {
    it('should handle theme system setup', () => {
      // Pattern: Complete theme system setup
      id('app-root').apply({} as DOMNode, mockContext)
      data({ theme: 'light', version: '1.0' }).apply({} as DOMNode, mockContext)

      themeColors({
        primary: '#007AFF',
        secondary: '#34C759',
        background: '#FFFFFF',
        text: '#000000',
        error: '#FF3B30',
      }).apply({} as DOMNode, mockContext)

      designTokens({
        'spacing-unit': 8,
        'border-radius': 8,
        'font-size-base': 16,
        'line-height-normal': 1.5,
      }).apply({} as DOMNode, mockContext)

      customProperties({
        properties: {
          'app-max-width': '1200px',
          'sidebar-width': '280px',
        },
      }).apply({} as DOMNode, mockContext)

      // Verify HTML attributes
      expect(mockElement.getAttribute('id')).toBe('app-root')
      expect(mockElement.getAttribute('data-theme')).toBe('light')

      // Verify theme colors
      expect(mockElement.style['--theme-color-primary']).toBe('#007AFF')
      expect(mockElement.style['--theme-color-background']).toBe('#FFFFFF')

      // Verify design tokens
      expect(mockElement.style['--token-spacing-unit']).toBe('8')
      expect(mockElement.style['--token-font-size-base']).toBe('16')

      // Verify custom properties
      expect(mockElement.style['--app-max-width']).toBe('1200px')
      expect(mockElement.style['--sidebar-width']).toBe('280px')
    })

    it('should handle component theme pattern', () => {
      // Pattern: Component with its own theme variables
      id('user-card').apply({} as DOMNode, mockContext)
      data({
        testId: 'user-profile-card',
        userId: 123,
        cardType: 'premium',
      }).apply({} as DOMNode, mockContext)

      customProperties({
        properties: {
          'card-background': 'var(--theme-color-surface)',
          'card-padding': 'var(--token-spacing-lg)',
          'card-border-radius': 'var(--token-radius-md)',
          'card-shadow': 'var(--token-shadow-sm)',
        },
      }).apply({} as DOMNode, mockContext)

      expect(mockElement.getAttribute('id')).toBe('user-card')
      expect(mockElement.getAttribute('data-user-id')).toBe('123')
      expect(mockElement.style['--card-background']).toBe(
        'var(--theme-color-surface)'
      )
      expect(mockElement.style['--card-padding']).toBe(
        'var(--token-spacing-lg)'
      )
    })

    it('should handle dark mode toggle pattern', () => {
      // Pattern: Dark mode container with dynamic theme
      id('theme-container').apply({} as DOMNode, mockContext)
      data({
        testId: 'app-theme-container',
        currentTheme: 'dark',
      }).apply({} as DOMNode, mockContext)

      themeColors({
        primary: '#0A84FF', // Dark mode primary
        background: '#000000', // Dark background
        surface: '#1C1C1E', // Dark surface
        text: '#FFFFFF', // Light text
        textSecondary: '#99999D', // Muted text
      }).apply({} as DOMNode, mockContext)

      expect(mockElement.getAttribute('data-current-theme')).toBe('dark')
      expect(mockElement.style['--theme-color-primary']).toBe('#0A84FF')
      expect(mockElement.style['--theme-color-background']).toBe('#000000')
      expect(mockElement.style['--theme-color-text']).toBe('#FFFFFF')
    })
  })

  describe('Complete Accessibility + Theming Patterns', () => {
    it('should handle accessible button with custom styling', () => {
      // Pattern: Fully accessible, themed button
      id('primary-cta').apply({} as DOMNode, mockContext)
      data({
        testId: 'signup-button',
        analytics: 'cta-click',
        variant: 'primary',
      }).apply({} as DOMNode, mockContext)
      aria({
        role: 'button',
        label: 'Sign up for free account',
      }).apply({} as DOMNode, mockContext)
      tabIndex(0).apply({} as DOMNode, mockContext)

      customProperties({
        properties: {
          'button-bg': 'var(--theme-color-primary)',
          'button-text': 'var(--theme-color-background)',
          'button-padding': 'var(--token-spacing-md) var(--token-spacing-lg)',
          'button-radius': 'var(--token-radius-md)',
          'button-font-size': 'var(--token-font-size-base)',
          'button-font-weight': 'var(--token-font-weight-medium)',
        },
      }).apply({} as DOMNode, mockContext)

      // Verify all layers work together
      expect(mockElement.getAttribute('id')).toBe('primary-cta')
      expect(mockElement.getAttribute('data-test-id')).toBe('signup-button')
      expect(mockElement.getAttribute('aria-label')).toBe(
        'Sign up for free account'
      )
      expect(mockElement.getAttribute('tabindex')).toBe('0')
      expect(mockElement.style['--button-bg']).toBe(
        'var(--theme-color-primary)'
      )
      expect(mockElement.style['--button-padding']).toBe(
        'var(--token-spacing-md) var(--token-spacing-lg)'
      )
    })

    it('should handle complex form field with all systems', () => {
      // Pattern: Complex form field with validation, testing, accessibility, and theming
      id('email-input-field').apply({} as DOMNode, mockContext)
      data({
        testId: 'registration-email',
        fieldType: 'email',
        validation: 'email-format',
        required: true,
        analytics: 'email-input',
      }).apply({} as DOMNode, mockContext)
      aria({
        required: true,
        invalid: false,
        describedby: 'email-help email-error',
        labelledby: 'email-label',
        placeholder: 'Enter your email address',
      }).apply({} as DOMNode, mockContext)

      customProperties({
        properties: {
          'field-bg': 'var(--theme-color-surface)',
          'field-border': '1px solid var(--theme-color-border)',
          'field-border-focus': '2px solid var(--theme-color-primary)',
          'field-padding': 'var(--token-spacing-sm) var(--token-spacing-md)',
          'field-radius': 'var(--token-radius-sm)',
          'field-font':
            'var(--token-font-size-base)/var(--token-line-height-normal)',
        },
      }).apply({} as DOMNode, mockContext)

      // Verify comprehensive integration
      const attributes = mockElement.getAllAttributes()
      expect(attributes['id']).toBe('email-input-field')
      expect(attributes['data-test-id']).toBe('registration-email')
      expect(attributes['data-validation']).toBe('email-format')
      expect(attributes['aria-required']).toBe('true')
      expect(attributes['aria-invalid']).toBe('false')
      expect(attributes['aria-placeholder']).toBe('Enter your email address')
      expect(mockElement.style['--field-bg']).toBe('var(--theme-color-surface)')
      expect(mockElement.style['--field-border-focus']).toBe(
        '2px solid var(--theme-color-primary)'
      )
    })
  })

  describe('Real-world Component Patterns', () => {
    it('should handle modal dialog pattern', () => {
      // Pattern: Accessible modal with theme support
      id('confirmation-modal').apply({} as DOMNode, mockContext)
      data({
        testId: 'delete-confirmation',
        modal: true,
        closeOnEscape: true,
        closeOnBackdrop: true,
      }).apply({} as DOMNode, mockContext)
      aria({
        role: 'dialog',
        modal: true,
        labelledby: 'modal-title',
        describedby: 'modal-description',
      }).apply({} as DOMNode, mockContext)
      tabIndex(-1).apply({} as DOMNode, mockContext)

      customProperties({
        properties: {
          'modal-bg': 'var(--theme-color-surface)',
          'modal-backdrop': 'rgba(0, 0, 0, 0.5)',
          'modal-shadow': 'var(--token-shadow-xl)',
          'modal-radius': 'var(--token-radius-lg)',
          'modal-max-width': '480px',
        },
      }).apply({} as DOMNode, mockContext)

      expect(mockElement.getAttribute('id')).toBe('confirmation-modal')
      expect(mockElement.getAttribute('role')).toBe('dialog')
      expect(mockElement.getAttribute('aria-modal')).toBe('true')
      expect(mockElement.style['--modal-bg']).toBe('var(--theme-color-surface)')
    })

    it('should handle data table pattern', () => {
      // Pattern: Accessible data table with sorting
      id('users-table').apply({} as DOMNode, mockContext)
      data({
        testId: 'user-management-table',
        sortable: true,
        filterable: true,
        totalRows: 250,
      }).apply({} as DOMNode, mockContext)
      aria({
        role: 'table',
        label: 'User management table',
        sort: 'ascending',
        busy: false,
      }).apply({} as DOMNode, mockContext)

      customProperties({
        properties: {
          'table-bg': 'var(--theme-color-background)',
          'table-border': 'var(--theme-color-border)',
          'table-row-hover': 'var(--theme-color-surface)',
          'table-header-bg': 'var(--theme-color-surface)',
          'table-padding': 'var(--token-spacing-sm) var(--token-spacing-md)',
        },
      }).apply({} as DOMNode, mockContext)

      expect(mockElement.getAttribute('data-sortable')).toBe('true')
      expect(mockElement.getAttribute('aria-sort')).toBe('ascending')
      expect(mockElement.style['--table-row-hover']).toBe(
        'var(--theme-color-surface)'
      )
    })

    it('should handle notification toast pattern', () => {
      // Pattern: Accessible notification with auto-dismiss
      id('success-toast').apply({} as DOMNode, mockContext)
      data({
        testId: 'notification-toast',
        type: 'success',
        duration: 5000,
        dismissible: true,
      }).apply({} as DOMNode, mockContext)
      aria({
        role: 'alert',
        live: 'polite',
        atomic: true,
      }).apply({} as DOMNode, mockContext)

      themeColors({
        toastSuccess: '#10B981',
        toastError: '#EF4444',
        toastWarning: '#F59E0B',
        toastInfo: '#3B82F6',
      }).apply({} as DOMNode, mockContext)

      customProperties({
        properties: {
          'toast-bg': 'var(--theme-color-toast-success)',
          'toast-text': 'white',
          'toast-shadow': 'var(--token-shadow-lg)',
          'toast-radius': 'var(--token-radius-md)',
        },
      }).apply({} as DOMNode, mockContext)

      expect(mockElement.getAttribute('role')).toBe('alert')
      expect(mockElement.getAttribute('aria-live')).toBe('polite')
      expect(mockElement.style['--theme-color-toast-success']).toBe('#10B981')
      expect(mockElement.style['--toast-bg']).toBe(
        'var(--theme-color-toast-success)'
      )
    })
  })

  describe('Performance Integration', () => {
    it('should handle bulk attribute operations efficiently', () => {
      const startTime = performance.now()

      // Apply multiple attribute systems in sequence
      id('performance-test').apply({} as DOMNode, mockContext)

      data({
        testId: 'bulk-operation',
        component: 'performance-test',
        version: '1.0',
        environment: 'test',
        timestamp: Date.now(),
      }).apply({} as DOMNode, mockContext)

      aria({
        role: 'application',
        label: 'Performance test application',
        busy: false,
        live: 'off',
      }).apply({} as DOMNode, mockContext)

      themeColors({
        primary: '#007AFF',
        secondary: '#34C759',
        background: '#FFFFFF',
        surface: '#F2F2F7',
      }).apply({} as DOMNode, mockContext)

      designTokens({
        'spacing-xs': 4,
        'spacing-sm': 8,
        'spacing-md': 16,
        'font-size-base': 16,
        'line-height-normal': 1.5,
      }).apply({} as DOMNode, mockContext)

      const duration = performance.now() - startTime

      // Should complete efficiently
      expect(duration).toBeLessThan(5)

      // Verify all systems applied correctly
      expect(mockElement.getAttribute('id')).toBe('performance-test')
      expect(mockElement.getAttribute('data-test-id')).toBe('bulk-operation')
      expect(mockElement.getAttribute('role')).toBe('application') // role is special, not prefixed with aria-
      expect(mockElement.style['--theme-color-primary']).toBe('#007AFF')
      expect(mockElement.style['--token-spacing-md']).toBe('16')
    })

    it('should handle concurrent modifier applications', () => {
      const promises = [
        Promise.resolve().then(() =>
          id('concurrent-test').apply({} as DOMNode, mockContext)
        ),
        Promise.resolve().then(() =>
          data({ test: 'concurrent' }).apply({} as DOMNode, mockContext)
        ),
        Promise.resolve().then(() =>
          aria({ label: 'concurrent' }).apply({} as DOMNode, mockContext)
        ),
        Promise.resolve().then(() =>
          customProperties({ properties: { test: 'concurrent' } }).apply(
            {} as DOMNode,
            mockContext
          )
        ),
      ]

      return Promise.all(promises).then(() => {
        expect(mockElement.getAttribute('id')).toBe('concurrent-test')
        expect(mockElement.getAttribute('data-test')).toBe('concurrent')
        expect(mockElement.getAttribute('aria-label')).toBe('concurrent')
        expect(mockElement.style['--test']).toBe('concurrent')
      })
    })
  })
})
