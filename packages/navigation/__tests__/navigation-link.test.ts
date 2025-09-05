/**
 * NavigationLink Tests
 *
 * Tests for SwiftUI-compatible NavigationLink implementation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { HTML, Text } from '@tachui/primitives'
import {
  NavigationLink,
  NavigationIconLink,
  NavigationListLink,
  StyledNavigationLink,
  NavigationLinkBuilder,
  createNavigationLinks,
  getNavigationLinkMetadata,
  isNavigationLink,
} from '../src/navigation-link'
import type { NavigationLinkOptions } from '../src/types'

describe('NavigationLink - SwiftUI Compatible Navigation Links', () => {
  let mockDestination: any
  let mockLabel: string
  let mockComponentLabel: any

  beforeEach(() => {
    mockDestination = () =>
      HTML.div({ children: 'Detail View' }).modifier.build()
    mockLabel = 'Go to Details'
    mockComponentLabel = Text('Navigate Here')
  })

  describe('Basic Functionality', () => {
    it('creates navigation link with SwiftUI parameter order', () => {
      // SwiftUI: NavigationLink("Label", destination: View)
      const navLink = NavigationLink(mockLabel, mockDestination)

      expect(navLink).toBeDefined()
      expect(navLink.type).toBe('component')
    })

    it('creates navigation link with component label', () => {
      const navLink = NavigationLink(mockComponentLabel, mockDestination)

      expect(navLink).toBeDefined()
    })

    it('accepts navigation link options', () => {
      const options: NavigationLinkOptions = {
        tag: 'detail-link',
        disabled: false,
      }

      const navLink = NavigationLink(mockLabel, mockDestination, options)

      expect(navLink).toBeDefined()
    })

    it('creates navigation link without options', () => {
      const navLink = NavigationLink(mockLabel, mockDestination)

      expect(navLink).toBeDefined()
    })
  })

  describe('SwiftUI Compatibility', () => {
    it('matches SwiftUI NavigationLink signature exactly', () => {
      // SwiftUI: NavigationLink("Destination", destination: { DestinationView() })
      const navLink = NavigationLink('Destination', mockDestination)

      expect(navLink).toBeDefined()
      expect(typeof NavigationLink).toBe('function')
    })

    it('supports SwiftUI-style destination closure', () => {
      const destinationClosure = () => {
        return HTML.div({
          children: 'Dynamically Created View',
        }).modifier.build()
      }

      const navLink = NavigationLink('Dynamic Destination', destinationClosure)

      expect(navLink).toBeDefined()
    })

    it('supports SwiftUI-style inline destination', () => {
      const inlineDestination = HTML.div({
        children: 'Inline View',
      }).modifier.build()

      const navLink = NavigationLink('Inline', () => inlineDestination)

      expect(navLink).toBeDefined()
    })

    it('works with SwiftUI-style complex labels', () => {
      const complexLabel = HTML.div({
        children: [
          HTML.img({ src: '/icon.png' }).modifier.build(),
          Text('Complex Navigation Label'),
        ],
      }).modifier.build()

      const navLink = NavigationLink(complexLabel, mockDestination)

      expect(navLink).toBeDefined()
    })
  })

  describe('Navigation Link Variants', () => {
    it('creates navigation icon link', () => {
      const iconLink = NavigationIconLink('🏠', 'Home', mockDestination)

      expect(iconLink).toBeDefined()
      expect(isNavigationLink(iconLink)).toBe(true)
    })

    it('creates navigation list link', () => {
      const listLink = NavigationListLink(
        'List Item',
        mockDestination,
        'Subtitle text'
      )

      expect(listLink).toBeDefined()
      expect(isNavigationLink(listLink)).toBe(true)
    })

    it('creates styled navigation link', () => {
      const styledLink = StyledNavigationLink(mockLabel, mockDestination, {
        style: 'button',
      })

      expect(styledLink).toBeDefined()
      expect(isNavigationLink(styledLink)).toBe(true)
    })
  })

  describe('Navigation Link Builder', () => {
    it('builds navigation link using builder pattern', () => {
      const navLink = NavigationLinkBuilder.to(mockDestination).text(mockLabel)

      expect(navLink).toBeDefined()
      expect(isNavigationLink(navLink)).toBe(true)
    })

    it('builds navigation link with button style', () => {
      const navLink =
        NavigationLinkBuilder.to(mockDestination).button('Click Me')

      expect(navLink).toBeDefined()
      expect(isNavigationLink(navLink)).toBe(true)
    })

    it('builds navigation link with card style', () => {
      const content = HTML.div({ children: 'Card Content' }).modifier.build()
      const navLink = NavigationLinkBuilder.to(mockDestination).card(content)

      expect(navLink).toBeDefined()
      expect(isNavigationLink(navLink)).toBe(true)
    })
  })

  describe('Navigation Link Collections', () => {
    it('creates multiple navigation links', () => {
      const linkConfigs = [
        {
          label: 'Home',
          destination: () => HTML.div({ children: 'Home' }).modifier.build(),
        },
        {
          label: 'Profile',
          destination: () => HTML.div({ children: 'Profile' }).modifier.build(),
        },
        {
          label: 'Settings',
          destination: () =>
            HTML.div({ children: 'Settings' }).modifier.build(),
        },
      ]

      const navLinks = createNavigationLinks(linkConfigs)

      expect(navLinks).toHaveLength(3)
      navLinks.forEach(link => {
        expect(isNavigationLink(link)).toBe(true)
      })
    })

    it('creates navigation links with tags and disabled state', () => {
      const linkConfigs = [
        { label: 'Enabled Link', destination: mockDestination, tag: 'enabled' },
        {
          label: 'Disabled Link',
          destination: mockDestination,
          tag: 'disabled',
          disabled: true,
        },
      ]

      const navLinks = createNavigationLinks(linkConfigs)

      expect(navLinks).toHaveLength(2)
      expect(isNavigationLink(navLinks[0])).toBe(true)
      expect(isNavigationLink(navLinks[1])).toBe(true)
    })
  })

  describe('Navigation Link Metadata', () => {
    it('extracts navigation link metadata', () => {
      const navLink = NavigationLink(mockLabel, mockDestination, {
        tag: 'test-link',
      })

      const metadata = getNavigationLinkMetadata(navLink)

      expect(metadata).toBeDefined()
      expect(metadata.tag).toBe('test-link')
      expect(metadata.type).toBe('NavigationLink')
    })

    it('identifies navigation link components', () => {
      const navLink = NavigationLink(mockLabel, mockDestination)
      const regularComponent = HTML.div({
        children: 'Not a nav link',
      }).modifier.build()

      expect(isNavigationLink(navLink)).toBe(true)
      expect(isNavigationLink(regularComponent)).toBe(false)
    })
  })

  describe('Navigation Behavior', () => {
    it('handles navigation events', () => {
      const onTap = vi.fn()

      const navLink = NavigationLink(mockLabel, mockDestination, {
        onTap,
      })

      // Simulate navigation tap
      const props = (navLink as any).props
      if (props && props.onTap) {
        props.onTap()
      }

      expect(onTap).toHaveBeenCalled()
    })

    it('supports disabled navigation', () => {
      const onTap = vi.fn()

      const navLink = NavigationLink(mockLabel, mockDestination, {
        disabled: true,
        onTap,
      })

      expect(navLink).toBeDefined()
      expect((navLink as any)._navigationLink.type).toBe('NavigationLink')
    })

    it('supports navigation with data passing', () => {
      const navigationData = { userId: 123, section: 'profile' }

      const destinationWithData = (data: any) => {
        return HTML.div({
          children: `User ID: ${data.userId}`,
        }).modifier.build()
      }

      const navLink = NavigationLink(mockLabel, () =>
        destinationWithData(navigationData)
      )

      expect(navLink).toBeDefined()
    })
  })

  describe('Error Handling', () => {
    it('handles string labels', () => {
      const navLink = NavigationLink('String Label', mockDestination)

      expect(navLink).toBeDefined()
      expect(isNavigationLink(navLink)).toBe(true)
    })

    it('handles component labels', () => {
      const componentLabel = HTML.div({
        children: 'Component Label',
      }).modifier.build()
      const navLink = NavigationLink(componentLabel, mockDestination)

      expect(navLink).toBeDefined()
      expect(isNavigationLink(navLink)).toBe(true)
    })

    it('handles empty options gracefully', () => {
      const navLink = NavigationLink(mockLabel, mockDestination, {})

      expect(navLink).toBeDefined()
    })

    it('handles destination function that returns component', () => {
      const workingDestination = () => {
        return HTML.div({ children: 'Working View' }).modifier.build()
      }

      const navLink = NavigationLink(mockLabel, workingDestination)

      expect(navLink).toBeDefined()
    })
  })

  describe('Performance', () => {
    it('creates navigation links efficiently', () => {
      const startTime = performance.now()

      for (let i = 0; i < 100; i++) {
        NavigationLink(`Link ${i}`, mockDestination)
      }

      const endTime = performance.now()
      expect(endTime - startTime).toBeLessThan(200) // Should complete in under 200ms
    })

    it('handles complex destination closures efficiently', () => {
      const complexDestination = () => {
        return HTML.div({
          children: Array.from({ length: 10 }, (_, i) =>
            HTML.div({ children: `Item ${i}` }).modifier.build()
          ),
        }).modifier.build()
      }

      const navLink = NavigationLink('Complex Destination', complexDestination)

      expect(navLink).toBeDefined()
    })
  })

  describe('Integration with Navigation System', () => {
    it('works with basic NavigationStack integration', () => {
      const rootView = HTML.div({
        children: [
          Text('Welcome'),
          NavigationLink('Go to Details', mockDestination),
        ],
      }).modifier.build()

      expect(rootView).toBeDefined()
    })

    it('works with styled navigation links', () => {
      const styledButton = StyledNavigationLink(
        'Styled Button',
        mockDestination,
        { style: 'button' }
      )

      const tabContent = HTML.div({
        children: [Text('Tab Content'), styledButton],
      }).modifier.build()

      expect(tabContent).toBeDefined()
    })

    it('supports navigation with modifiers', () => {
      const destination = () => {
        return HTML.div({ children: 'Detail View' }).modifier.build()
      }

      const navLink = NavigationLink('Titled Destination', destination)

      expect(navLink).toBeDefined()
    })
  })
})
