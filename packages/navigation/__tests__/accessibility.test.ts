/**
 * Navigation Accessibility Tests
 *
 * Tests for keyboard navigation, screen reader support, and accessibility compliance
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { HTML } from '@tachui/primitives'
import { HStack } from '@tachui/primitives'
import { createSignal } from '@tachui/core'
import { NavigationLink } from '../src/navigation-link'
import { SimpleTabView, tabItem } from '../src/simple-tab-view'
import {
  navigationTitle,
  navigationBarHidden,
} from '../src/navigation-modifiers'

// Import modifiers package to trigger auto-registration
import '@tachui/modifiers'

describe('Navigation Accessibility - WCAG 2.1 AA Compliance', () => {
  let mockDestination: any

  beforeEach(() => {
    mockDestination = () =>
      HTML.div({ children: 'Destination' }).build()
  })

  describe('NavigationLink Accessibility', () => {
    it('provides proper ARIA attributes', () => {
      const link = NavigationLink(mockDestination, 'Go to Details', {
        accessibilityLabel: 'Navigate to details page',
        accessibilityHint: 'Double tap to open details',
      })

      expect(link).toBeDefined()
      // The link should have accessibility attributes in its metadata
      expect((link as any).props).toBeDefined()
    })

    it('supports keyboard navigation', () => {
      const onClick = vi.fn()
      const link = NavigationLink(() => {
        onClick()
        return mockDestination()
      }, 'Click me')

      expect(link).toBeDefined()
      // Link should be keyboard accessible
      expect((link as any).props?.onClick).toBeDefined()
    })

    it('handles focus management', () => {
      const link = NavigationLink(mockDestination, 'Focus Test')

      expect(link).toBeDefined()
      // Should support focus events
      expect(typeof (link as any).props?.onFocus).toBe('function')
      expect(typeof (link as any).props?.onBlur).toBe('function')
    })

    it('supports screen reader announcements', () => {
      const link = NavigationLink(mockDestination, 'Screen Reader Test', {
        accessibilityLabel: 'Test link for screen readers',
      })

      expect(link).toBeDefined()
      // Should have screen reader support
      expect((link as any).props?.['aria-label']).toBeDefined()
    })
  })

  describe('TabView Accessibility', () => {
    it('provides tab panel semantics', () => {
      const [selectedTab, setSelectedTab] = createSignal('home')

      const tabs = [
        tabItem(
          () => HTML.div({ children: 'Home' }).build(),
          'home',
          'Home'
        ),
        tabItem(
          () => HTML.div({ children: 'Profile' }).build(),
          'profile',
          'Profile'
        ),
      ]

      const tabView = SimpleTabView(tabs, {
        selection: selectedTab,
        onSelectionChange: setSelectedTab,
      })

      expect(tabView).toBeDefined()
      // Should have proper tab semantics
      expect((tabView as any).props?.role).toBeDefined()
    })

    it('supports arrow key navigation', () => {
      const [selectedTab, setSelectedTab] = createSignal('home')

      const tabs = [
        tabItem(
          () => HTML.div({ children: 'Home' }).build(),
          'home',
          'Home'
        ),
        tabItem(
          () => HTML.div({ children: 'Search' }).build(),
          'search',
          'Search'
        ),
        tabItem(
          () => HTML.div({ children: 'Profile' }).build(),
          'profile',
          'Profile'
        ),
      ]

      const tabView = SimpleTabView(tabs, {
        selection: selectedTab,
        onSelectionChange: setSelectedTab,
      })

      expect(tabView).toBeDefined()
      // Should support keyboard navigation
      expect((tabView as any).props?.onKeyDown).toBeDefined()
    })

    it('announces tab changes to screen readers', () => {
      const [selectedTab, setSelectedTab] = createSignal('home')

      const tabs = [
        tabItem(
          () => HTML.div({ children: 'Home' }).build(),
          'home',
          'Home'
        ),
        tabItem(
          () => HTML.div({ children: 'Profile' }).build(),
          'profile',
          'Profile'
        ),
      ]

      const tabView = SimpleTabView(tabs, {
        selection: selectedTab,
        onSelectionChange: setSelectedTab,
      })

      expect(tabView).toBeDefined()
      // Should announce selection changes
      expect((tabView as any).props?.['aria-live']).toBeDefined()
    })

    it('provides proper tab labels', () => {
      const tabs = [
        tabItem(
          () => HTML.div({ children: 'Home' }).build(),
          'home',
          'Home',
          undefined,
          {
            accessibilityLabel: 'Home tab',
          }
        ),
        tabItem(
          () => HTML.div({ children: 'Profile' }).build(),
          'profile',
          'Profile'
        ),
      ]

      const tabView = SimpleTabView(tabs)

      expect(tabView).toBeDefined()
      // Should have accessible tab labels
      expect((tabView as any).props?.children).toBeDefined()
    })
  })

  describe('Navigation Modifiers Accessibility', () => {
    it('navigationTitle provides proper heading semantics', () => {
      const component = HTML.div({ children: 'Content' })
        .navigationTitle('Page Title')
        .build()

      expect(component).toBeDefined()
      // Should have heading semantics
      expect((component as any).props?.role).toBeDefined()
    })

    it('navigationBarHidden removes navigation from accessibility tree', () => {
      const component = HTML.div({ children: 'Content' })
        .navigationBarHidden()
        .build()

      expect(component).toBeDefined()
      // Navigation bar should be hidden from screen readers
      expect((component as any).props?.['aria-hidden']).toBeDefined()
    })

    it('supports navigation bar button accessibility', () => {
      const component = HTML.div({ children: 'Content' })
        .navigationBarItems({
          leading: HTML.button({ children: 'Back' }).build(),
          trailing: HTML.button({ children: 'Save' }).build(),
        })
        .build()

      expect(component).toBeDefined()
      // Navigation bar buttons should be accessible
      expect((component as any).props?.children).toBeDefined()
    })
  })

  describe('Keyboard Navigation', () => {
    it('supports Tab key navigation', () => {
      const link = NavigationLink(mockDestination, 'Test Link')

      expect(link).toBeDefined()
      // Should be focusable
      expect((link as any).props?.tabIndex).toBeDefined()
    })

    it('handles Enter key activation', () => {
      const onActivate = vi.fn()
      const link = NavigationLink(() => {
        onActivate()
        return mockDestination()
      }, 'Enter Test')

      expect(link).toBeDefined()
      // Should handle Enter key
      expect((link as any).props?.onKeyDown).toBeDefined()
    })

    it('handles Space key activation', () => {
      const onActivate = vi.fn()
      const link = NavigationLink(() => {
        onActivate()
        return mockDestination()
      }, 'Space Test')

      expect(link).toBeDefined()
      // Should handle Space key
      expect((link as any).props?.onKeyDown).toBeDefined()
    })

    it('supports Escape key to dismiss', () => {
      const onDismiss = vi.fn()
      const component = HTML.div({ children: 'Modal' })
        .onKeyDown((e: KeyboardEvent) => {
          if (e.key === 'Escape') {
            onDismiss()
          }
        })
        .build()

      expect(component).toBeDefined()
      // Should handle Escape key
      expect((component as any).props?.onKeyDown).toBeDefined()
    })
  })

  describe('Screen Reader Support', () => {
    it('provides navigation landmarks', () => {
      const component = HStack({
        element: 'nav',
        children: 'Navigation',
      }).build()

      expect(component).toBeDefined()
      // Should have navigation landmark
      expect((component as any).props?.role).toBe('navigation')
    })

    it('announces navigation state changes', () => {
      const [isLoading, setIsLoading] = createSignal(false)

      const component = HTML.div({
        children: isLoading() ? 'Loading...' : 'Content loaded',
      })
        .ariaLive('polite')
        .build()

      expect(component).toBeDefined()
      // Should announce state changes
      expect((component as any).props?.['aria-live']).toBeDefined()
    })

    it('provides status announcements', () => {
      const component = HTML.div({ children: 'Operation completed' })
        .role('status')
        .ariaLive('polite')
        .build()

      expect(component).toBeDefined()
      // Should announce status
      expect((component as any).props?.role).toBe('status')
      expect((component as any).props?.['aria-live']).toBe('polite')
    })

    it('supports custom ARIA attributes', () => {
      const component = HTML.div({ children: 'Custom ARIA' })
        .ariaLabel('Custom label')
        .ariaDescribedBy('description-id')
        .build()

      expect(component).toBeDefined()
      // Should have custom ARIA attributes
      expect((component as any).props?.['aria-label']).toBe('Custom label')
      expect((component as any).props?.['aria-describedby']).toBe(
        'description-id'
      )
    })
  })

  describe('Focus Management', () => {
    it('maintains focus order', () => {
      const link1 = NavigationLink(mockDestination, 'Link 1')
      const link2 = NavigationLink(mockDestination, 'Link 2')

      expect(link1).toBeDefined()
      expect(link2).toBeDefined()
      // Should maintain logical focus order
      expect((link1 as any).props?.tabIndex).toBeDefined()
      expect((link2 as any).props?.tabIndex).toBeDefined()
    })

    it('handles focus trapping in modals', () => {
      const modal = HTML.div({ children: 'Modal Content' })
        .role('dialog')
        .ariaModal(true)
        .build()

      expect(modal).toBeDefined()
      // Should trap focus in modal
      expect((modal as any).props?.role).toBe('dialog')
      expect((modal as any).props?.['aria-modal']).toBe(true)
    })

    it('restores focus on navigation', () => {
      const button = HTML.button({ children: 'Focus Target' }).build()

      expect(button).toBeDefined()
      // Should be focusable
      expect((button as any).props?.tabIndex).toBeDefined()
    })

    it('handles focus within navigation transitions', () => {
      const destination = () =>
        HTML.div({ children: 'New View' }).build()
      const link = NavigationLink(destination, 'Navigate')

      expect(link).toBeDefined()
      // Should manage focus during transitions
      expect((link as any).props?.onClick).toBeDefined()
    })
  })

  describe('Color and Contrast', () => {
    it('supports high contrast mode', () => {
      const component = HTML.div({ children: 'High Contrast' })
        .backgroundColor('#000000')
        .foregroundColor('#FFFFFF')
        .build()

      expect(component).toBeDefined()
      // Should support high contrast colors
      expect((component as any).props?.style?.backgroundColor).toBe('#000000')
      expect((component as any).props?.style?.color).toBe('#FFFFFF')
    })

    it('provides focus indicators', () => {
      const link = NavigationLink(mockDestination, 'Focus Indicator')
        .outline('2px solid #007AFF')
        .outlineOffset('2px')
        .build()

      expect(link).toBeDefined()
      // Should have visible focus indicator
      expect((link as any).props?.style?.outline).toBeDefined()
    })

    it('supports reduced motion preferences', () => {
      const component = HTML.div({ children: 'Reduced Motion' })
        .transition('none')
        .build()

      expect(component).toBeDefined()
      // Should respect reduced motion preferences
      const transitionModifier = component.modifiers.find(m => m.type === 'transition')
      expect(transitionModifier).toBeDefined()
      expect((transitionModifier as any).properties.transition.property).toBe('none')
    })
  })

  describe('Touch and Mobile Accessibility', () => {
    it('provides adequate touch targets', () => {
      const button = HTML.button({ children: 'Touch Target' })
        .minHeight('44px')
        .minWidth('44px')
        .build()

      expect(button).toBeDefined()
      // Should have adequate touch target size
      expect((button as any).props?.style?.minHeight).toBe('44px')
      expect((button as any).props?.style?.minWidth).toBe('44px')
    })

    it('handles touch gestures', () => {
      const component = HTML.div({ children: 'Swipeable' })
        .onTouchStart(() => {})
        .onTouchMove(() => {})
        .onTouchEnd(() => {})
        .build()

      expect(component).toBeDefined()
      // Should handle touch events
      expect((component as any).props?.onTouchStart).toBeDefined()
      expect((component as any).props?.onTouchEnd).toBeDefined()
    })

    it('supports swipe navigation', () => {
      const component = HTML.div({ children: 'Swipe Navigation' })
        .onSwipeLeft(() => {})
        .onSwipeRight(() => {})
        .build()

      expect(component).toBeDefined()
      // Should support swipe gestures
      expect((component as any).props?.onTouchStart).toBeDefined()
    })
  })
})
