/**
 * NavigationStack Tests
 *
 * Tests for SwiftUI-compatible NavigationStack implementation
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { createSignal } from '@tachui/core'
import { HTML } from '@tachui/primitives'
import { NavigationStack, navigationDestination } from '../src/navigation-stack'
import { NavigationLink } from '../src/navigation-link'
import {
  navigationTitle,
  navigationBarHidden,
} from '../src/navigation-modifiers'

describe('NavigationStack - SwiftUI Compatible Navigation System', () => {
  let mockRootView: any

  beforeEach(() => {
    mockRootView = HTML.div({ children: 'Home View' }).build()
  })

  describe('Basic Functionality', () => {
    it('creates a navigation stack with root view', () => {
      const navStack = NavigationStack(mockRootView)

      expect(navStack).toBeDefined()
      expect(navStack.type).toBe('component') // NavigationStack returns a TachUI component
    })

    it('accepts navigation stack options', () => {
      const navStack = NavigationStack(mockRootView, {
        navigationTitle: 'My App',
      })

      expect(navStack).toBeDefined()
    })

    it('wraps root view with navigation context', () => {
      const navStack = NavigationStack(mockRootView)

      // NavigationStack should add navigation metadata
      expect((navStack as any)._navigationStack).toBeDefined()
      expect((navStack as any)._navigationStack.type).toBe('NavigationStack')
    })

    it('supports empty options object', () => {
      const navStack = NavigationStack(mockRootView, {})

      expect(navStack).toBeDefined()
    })
  })

  describe('Navigation Path Management', () => {
    it('initializes with navigation context', () => {
      const navStack = NavigationStack(mockRootView)

      expect((navStack as any).navigationContext).toBeDefined()
      expect((navStack as any).navigationContext.navigationId).toMatch(
        /^nav-stack-/
      )
    })

    it('accepts custom navigation title', () => {
      const customTitle = 'Custom App Title'
      const navStack = NavigationStack(mockRootView, {
        navigationTitle: customTitle,
      })

      expect(navStack).toBeDefined()
      // The title is stored in the navigation context
    })

    it('provides path binding support', () => {
      const [path, setPath] = createSignal('')
      const binding = { get: path, set: setPath }

      const navStack = NavigationStack(mockRootView, {
        path: binding,
      })

      expect(navStack).toBeDefined()
    })
  })

  describe('SwiftUI Compatibility', () => {
    it('matches SwiftUI NavigationStack constructor signature', () => {
      // SwiftUI: NavigationStack(path: Binding<NavigationPath>) { content }
      const [path, setPath] = createSignal('')
      const binding = { get: path, set: setPath }

      const navStack = NavigationStack(mockRootView, { path: binding })

      expect(navStack).toBeDefined()
      expect(typeof NavigationStack).toBe('function')
    })

    it('supports SwiftUI-style modifier chaining on root view', () => {
      const rootViewWithModifiers = navigationTitle(mockRootView, 'Home')
      const navStack = NavigationStack(rootViewWithModifiers)

      expect(navStack).toBeDefined()
    })

    it('works with NavigationLink children', () => {
      const detailView = HTML.div({ children: 'Detail View' }).build()
      const linkView = NavigationLink('Go to Detail', () => detailView)

      const rootWithLink = HTML.div({
        children: [mockRootView, linkView],
      }).build()
      const navStack = NavigationStack(rootWithLink)

      expect(navStack).toBeDefined()
    })
  })

  describe('Navigation Destination Support', () => {
    it('supports navigationDestination modifier', () => {
      const destinationView = HTML.div({
        children: 'Destination',
      }).build()
      const rootWithDestination = navigationDestination(
        mockRootView,
        'detail',
        () => destinationView
      )

      const navStack = NavigationStack(rootWithDestination)

      expect(navStack).toBeDefined()
      expect((rootWithDestination as any)._navigationDestinations).toBeDefined()
      expect(
        (rootWithDestination as any)._navigationDestinations.detail
      ).toBeDefined()
    })

    it('supports destination registration pattern', () => {
      const rootWithDestination = navigationDestination(
        mockRootView,
        'detail',
        () => HTML.div({ children: 'Detail View' }).build()
      )

      const navStack = NavigationStack(rootWithDestination)

      expect(navStack).toBeDefined()
      expect(
        (navStack as any)._navigationStack.registerDestination
      ).toBeDefined()
    })
  })

  describe('Error Handling', () => {
    it('handles null root view gracefully', () => {
      expect(() => {
        NavigationStack(null as any)
      }).not.toThrow() // The implementation doesn't validate null views
    })

    it('handles undefined root view gracefully', () => {
      expect(() => {
        NavigationStack(undefined as any)
      }).not.toThrow() // The implementation doesn't validate undefined views
    })

    it('handles invalid options gracefully', () => {
      const navStack = NavigationStack(mockRootView, {} as any)

      expect(navStack).toBeDefined()
    })
  })

  describe('Integration with Navigation System', () => {
    it('integrates with navigation modifiers', () => {
      const modifiedRoot = navigationBarHidden(
        navigationTitle(mockRootView, 'Home'),
        true
      )
      const navStack = NavigationStack(modifiedRoot)

      expect(navStack).toBeDefined()
    })

    it('provides navigation context to child components', () => {
      const navStack = NavigationStack(mockRootView)

      // NavigationStack should provide navigation context
      expect((navStack as any).navigationContext).toBeDefined()
    })

    it('supports programmatic navigation integration', () => {
      const navStack = NavigationStack(mockRootView, {
        navigationTitle: 'App with Navigation',
      })

      expect(navStack).toBeDefined()
      expect(
        (navStack as any)._navigationStack.registerDestination
      ).toBeDefined()
    })
  })

  describe('Performance', () => {
    it('creates navigation stack efficiently', () => {
      const startTime = performance.now()

      for (let i = 0; i < 100; i++) {
        NavigationStack(HTML.div({ children: `Root ${i}` }).build())
      }

      const endTime = performance.now()
      expect(endTime - startTime).toBeLessThan(200) // Should complete in under 200ms
    })

    it('handles large navigation stacks', () => {
      const largeRootView = HTML.div({
        children: Array.from({ length: 50 }, (_, i) =>
          NavigationLink(`Item ${i}`, () =>
            HTML.div({ children: `Detail ${i}` }).build()
          )
        ),
      }).build()

      const navStack = NavigationStack(largeRootView)

      expect(navStack).toBeDefined()
    })
  })
})
