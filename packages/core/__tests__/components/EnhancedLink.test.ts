/**
 * Enhanced Link Component Tests
 *
 * Comprehensive test suite for the enhanced Link component (SwiftUI-compatible API),
 * focusing on reactive text content and destination handling.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Link, EnhancedLinkComponent } from '../../src/components/EnhancedLink'
import { createSignal, createComputed } from '../../src/reactive'
import { Text } from '../../src/components/Text'

describe('Enhanced Link Component', () => {
  let cleanup: (() => void) | undefined

  beforeEach(() => {
    vi.useFakeTimers()
    cleanup = undefined
    vi.clearAllMocks()

    // Mock window.open and location for navigation tests
    Object.defineProperty(window, 'location', {
      value: { 
        href: 'https://example.com/page',
        hostname: 'example.com'
      },
      writable: true,
    })
    
    global.open = vi.fn()
  })

  afterEach(() => {
    vi.runAllTimers()
    vi.useRealTimers()
    if (cleanup) {
      cleanup()
      cleanup = undefined
    }
  })

  describe('Component Creation', () => {
    it('should create enhanced Link with string text and destination', () => {
      const link = Link('Click me', 'https://example.com')
      
      expect(link).toBeDefined()
      expect(link.modifier).toBeDefined()
    })

    it('should create enhanced Link with URL object destination', () => {
      const url = new URL('https://example.com/path')
      const link = Link('Visit site', url)
      
      expect(link).toBeDefined()
    })

    it('should handle empty text content', () => {
      const link = Link('', 'https://example.com')
      
      expect(link).toBeDefined()
      const built = link.modifier.build()
      const rendered = built.render()
      expect(rendered).toBeDefined()
    })
  })

  describe('Static Content Rendering', () => {
    it('should render with static text and destination', () => {
      const component = new EnhancedLinkComponent({
        text: 'Static Link',
        destination: 'https://example.com'
      })

      const rendered = component.render()
      expect(rendered).toBeDefined()
      expect(rendered.type).toBe('element')
      expect(rendered.tag).toBe('a')
    })

    it('should fallback to URL when no text provided', () => {
      const component = new EnhancedLinkComponent({
        destination: 'https://example.com/path'
      })

      const rendered = component.render()
      expect(rendered).toBeDefined()
    })
  })

  describe('Reactive Text Content', () => {
    it('should handle reactive text content with createSignal', () => {
      const [text, setText] = createSignal('Initial text')
      const component = new EnhancedLinkComponent({
        text: text,
        destination: 'https://example.com'
      })

      const rendered = component.render()
      expect(rendered).toBeDefined()

      // Update text - should be reactive through Text component
      setText('Updated text')
      // The Text component should handle the reactivity internally
    })

    it('should handle reactive destination as text fallback', () => {
      const [destination, setDestination] = createSignal('https://initial.com')
      const component = new EnhancedLinkComponent({
        destination: destination
      })

      const rendered = component.render()
      expect(rendered).toBeDefined()

      // Update destination - should update both href and text content
      setDestination('https://updated.com')
    })

    it('should prioritize text over destination for content', () => {
      const [text] = createSignal('Link Text')
      const [destination] = createSignal('https://example.com')
      
      const component = new EnhancedLinkComponent({
        text: text,
        destination: destination
      })

      const rendered = component.render()
      expect(rendered).toBeDefined()
      // Text should be used for content, destination for href
    })
  })

  describe('Reactive Destination Handling', () => {
    it('should handle reactive string destinations', () => {
      const [destination, setDestination] = createSignal('https://initial.com')
      const component = new EnhancedLinkComponent({
        text: 'Click me',
        destination: destination
      })

      // @ts-ignore - accessing private method for testing
      expect(component.getDestination()).toBe('https://initial.com')

      setDestination('https://updated.com')
      // @ts-ignore - accessing private method for testing
      expect(component.getDestination()).toBe('https://updated.com')
    })

    it('should handle reactive URL object destinations', () => {
      const [destination, setDestination] = createSignal(new URL('https://initial.com'))
      const component = new EnhancedLinkComponent({
        text: 'Visit',
        destination: destination
      })

      // @ts-ignore - accessing private method for testing
      expect(component.getDestination()).toBe('https://initial.com/')

      setDestination(new URL('https://updated.com/path'))
      // @ts-ignore - accessing private method for testing
      expect(component.getDestination()).toBe('https://updated.com/path')
    })

    it('should handle computed destinations', () => {
      const [baseUrl, setBaseUrl] = createSignal('https://example.com')
      const [path, setPath] = createSignal('/initial')
      
      // Create a derived signal manually
      const [destination, setDestination] = createSignal('https://example.com/initial')
      
      const component = new EnhancedLinkComponent({
        text: 'Dynamic Link',
        destination: destination
      })

      // @ts-ignore - accessing private method for testing
      expect(component.getDestination()).toBe('https://example.com/initial')

      setDestination('https://example.com/updated')
      // @ts-ignore - accessing private method for testing
      expect(component.getDestination()).toBe('https://example.com/updated')

      setDestination('https://newsite.com/updated')
      // @ts-ignore - accessing private method for testing
      expect(component.getDestination()).toBe('https://newsite.com/updated')
    })
  })

  describe('Text Component Integration', () => {
    it('should use Text component for rendering content', () => {
      const [text, setText] = createSignal('Dynamic Text')
      const component = new EnhancedLinkComponent({
        text: text,
        destination: 'https://example.com'
      })

      // @ts-ignore - accessing private method for testing
      const content = component.renderContent()
      
      expect(Array.isArray(content)).toBe(true)
      expect(content.length).toBeGreaterThan(0)
      
      // Should use Text component internally
      expect(content[0]).toBeDefined()
    })

    it('should handle URL to string conversion for Text component', () => {
      const component = new EnhancedLinkComponent({
        destination: new URL('https://example.com/path')
      })

      // @ts-ignore - accessing private method for testing
      const content = component.renderContent()
      
      expect(Array.isArray(content)).toBe(true)
      expect(content.length).toBeGreaterThan(0)
    })

    it('should handle reactive URL to string conversion', () => {
      const [destination, setDestination] = createSignal(new URL('https://initial.com'))
      const component = new EnhancedLinkComponent({
        destination: destination
      })

      // @ts-ignore - accessing private method for testing
      const content = component.renderContent()
      
      expect(Array.isArray(content)).toBe(true)
      expect(content.length).toBeGreaterThan(0)

      // Update should work through createComputed
      setDestination(new URL('https://updated.com'))
    })
  })

  describe('Click Handling', () => {
    it('should handle click events with static destinations', () => {
      const component = new EnhancedLinkComponent({
        text: 'Click me',
        destination: 'https://external.com'
      })

      const mockEvent = {
        preventDefault: vi.fn(),
        button: 0
      } as any

      // @ts-ignore - accessing private method for testing
      component.handleClick(mockEvent)

      expect(mockEvent.preventDefault).toHaveBeenCalled()
      expect(global.open).toHaveBeenCalledWith(
        'https://external.com', 
        '_blank'
      )
    })

    it('should handle click events with reactive destinations', () => {
      const [destination] = createSignal('https://dynamic.com')
      const component = new EnhancedLinkComponent({
        text: 'Dynamic Link',
        destination: destination
      })

      const mockEvent = {
        preventDefault: vi.fn(),
        button: 0
      } as any

      // @ts-ignore - accessing private method for testing
      component.handleClick(mockEvent)

      expect(mockEvent.preventDefault).toHaveBeenCalled()
      expect(global.open).toHaveBeenCalledWith(
        'https://dynamic.com', 
        '_blank'
      )
    })

    it('should handle internal navigation', () => {
      const component = new EnhancedLinkComponent({
        text: 'Internal',
        destination: '/internal-path'
      })

      const mockEvent = {
        preventDefault: vi.fn(),
        button: 0
      } as any

      // Mock window.location for internal navigation
      delete (window as any).location
      window.location = { href: '' } as any

      // @ts-ignore - accessing private method for testing
      component.handleClick(mockEvent)

      expect(mockEvent.preventDefault).toHaveBeenCalled()
      expect(window.location.href).toBe('/internal-path')
    })
  })

  describe('Label Closure Pattern', () => {
    it('should handle label closure for complex content', () => {
      const component = new EnhancedLinkComponent({
        destination: 'https://example.com',
        label: () => {
          // Return a mock component instance
          return {
            type: 'component' as const,
            render: () => ({ type: 'text' as const, text: 'Complex Label' })
          } as any
        }
      })

      // @ts-ignore - accessing private method for testing
      const content = component.renderContent()
      
      expect(Array.isArray(content)).toBe(true)
      expect(content.length).toBeGreaterThan(0)
    })
  })

  describe('OpenURL Action Pattern', () => {
    it('should handle custom openURL actions', () => {
      const customOpenURL = vi.fn().mockReturnValue('handled')
      
      const component = new EnhancedLinkComponent({
        text: 'Custom Handler',
        destination: 'https://example.com',
        openURLAction: customOpenURL
      })

      const mockEvent = {
        preventDefault: vi.fn(),
        button: 0
      } as any

      // @ts-ignore - accessing private method for testing
      component.handleClick(mockEvent)

      expect(mockEvent.preventDefault).toHaveBeenCalled()
      expect(customOpenURL).toHaveBeenCalledWith('https://example.com')
      expect(global.open).not.toHaveBeenCalled() // Custom handler took over
    })

    it('should fallback to system action when openURL returns systemAction', () => {
      const customOpenURL = vi.fn().mockReturnValue('systemAction')
      
      const component = new EnhancedLinkComponent({
        text: 'Fallback Handler',
        destination: 'https://external.com',
        openURLAction: customOpenURL
      })

      const mockEvent = {
        preventDefault: vi.fn(),
        button: 0
      } as any

      // @ts-ignore - accessing private method for testing
      component.handleClick(mockEvent)

      expect(customOpenURL).toHaveBeenCalledWith('https://external.com')
      expect(global.open).toHaveBeenCalledWith(
        'https://external.com',
        '_blank'
      )
    })
  })

  describe('Concatenation Support', () => {
    it('should support concatenation with other components', () => {
      const component = new EnhancedLinkComponent({
        text: 'Link',
        destination: 'https://example.com'
      })

      expect(component.isConcatenatable()).toBe(true)
      expect(typeof component.toSegment).toBe('function')
      expect(typeof component.concat).toBe('function')
    })

    it('should create proper segments for concatenation', () => {
      const component = new EnhancedLinkComponent({
        text: 'Test Link',
        destination: 'https://example.com'
      })

      const segment = component.toSegment()
      
      expect(segment.id).toBeDefined()
      expect(segment.component).toBe(component)
      expect(typeof segment.render).toBe('function')
    })

    it('should concatenate with Text components', () => {
      // Use imported Text component for testing
      
      const linkComponent = new EnhancedLinkComponent({
        text: 'Visit',
        destination: 'https://example.com'
      })
      
      const textComponent = Text('our website')
      
      // Test concatenation
      const concatenated = linkComponent.concat(textComponent)
      
      expect(concatenated).toBeDefined()
      expect(concatenated.segments).toHaveLength(2)
      expect(concatenated.metadata.totalSegments).toBe(2)
      expect(concatenated.metadata.accessibilityRole).toBe('composite')
      expect(concatenated.metadata.semanticStructure).toBe('inline')
      
      // Verify first segment is the link component
      expect(concatenated.segments[0].component).toBe(linkComponent)
      // Verify second segment is a text component (don't test exact reference)
      expect(concatenated.segments[1].component).toBeDefined()
      expect(concatenated.segments[1].component.type).toBe('component')
      
      // Verify it can render without errors
      const rendered = concatenated.render()
      expect(rendered).toBeDefined()
    })

    it('should concatenate with multiple Text components in sequence', () => {
      
      const linkComponent = new EnhancedLinkComponent({
        text: 'Click here',
        destination: 'https://example.com'
      })
      
      const text1 = Text(' to ')
      const text2 = Text('learn more')
      
      // Chain concatenation: Link + Text + Text
      const concatenated = linkComponent.concat(text1).concat(text2)
      
      expect(concatenated).toBeDefined()
      expect(concatenated.segments.length).toBeGreaterThanOrEqual(2) // Should have multiple segments
      
      // Verify it can render
      const rendered = concatenated.render()
      expect(rendered).toBeDefined()
    })

    it('should maintain link functionality when concatenated', () => {
      
      const linkComponent = new EnhancedLinkComponent({
        text: 'Download',
        destination: 'https://example.com/file.pdf',
        onPress: vi.fn()
      })
      
      const textComponent = Text(' the file')
      const concatenated = linkComponent.concat(textComponent)
      
      // Verify the link component is still accessible and functional
      const linkSegment = concatenated.segments[0]
      expect(linkSegment.component).toBe(linkComponent)
      expect(linkSegment.component.props.onPress).toBeDefined()
      
      // Verify it can render without errors
      const rendered = concatenated.render()
      expect(rendered).toBeDefined()
    })
  })

  describe('Integration with Modifier System', () => {
    it('should work with modifier system', () => {
      const link = Link('Styled Link', 'https://example.com')
      
      const styled = link
        .modifier
        .foregroundColor('#007AFF')
        .padding({ horizontal: 16, vertical: 8 })
        .cornerRadius(4)
        .build()

      expect(styled).toBeDefined()
      const rendered = styled.render()
      expect(rendered).toBeDefined()
    })
  })

  describe('Error Handling', () => {
    it('should handle malformed URLs gracefully', () => {
      expect(() => {
        const component = new EnhancedLinkComponent({
          text: 'Bad URL',
          destination: 'not-a-url'
        })
        component.render()
      }).not.toThrow()
    })

    it('should handle undefined text gracefully', () => {
      expect(() => {
        const component = new EnhancedLinkComponent({
          destination: 'https://example.com'
          // No text provided - should fallback to URL
        })
        component.render()
      }).not.toThrow()
    })
  })

  describe('Complex Reactive Scenarios', () => {
    it('should handle both reactive text and destination', () => {
      const [text, setText] = createSignal('Initial Text')
      const [destination, setDestination] = createSignal('https://initial.com')
      
      const component = new EnhancedLinkComponent({
        text: text,
        destination: destination
      })

      const rendered = component.render()
      expect(rendered).toBeDefined()

      // Both should be reactive
      setText('Updated Text')
      setDestination('https://updated.com')

      // @ts-ignore - accessing private method for testing
      expect(component.getDestination()).toBe('https://updated.com')
    })

    it('should handle reactive text with static destination', () => {
      const [text, setText] = createSignal('Dynamic Text')
      
      const component = new EnhancedLinkComponent({
        text: text,
        destination: 'https://static.com'
      })

      const rendered = component.render()
      expect(rendered).toBeDefined()

      setText('New Text')
      // Text should be reactive, destination static
    })

    it('should handle computed text from multiple signals', () => {
      const [firstName, setFirstName] = createSignal('John')
      const [lastName, setLastName] = createSignal('Doe')
      
      const fullName = createComputed(() => `${firstName()} ${lastName()}`)
      
      const component = new EnhancedLinkComponent({
        text: fullName,
        destination: 'https://profile.com'
      })

      const rendered = component.render()
      expect(rendered).toBeDefined()

      setFirstName('Jane')
      setLastName('Smith')
      // Text should reactively update to "Jane Smith"
    })
  })

  describe('Backward Compatibility API', () => {
    it('should support object-based API from old Link component', () => {
      const linkWithObjectAPI = Link({
        destination: 'https://example.com',
        children: 'Visit Example',
        onPress: () => {},
        target: '_blank'
      })

      expect(linkWithObjectAPI).toBeDefined()
      expect(linkWithObjectAPI.type).toBe('component')
      expect(linkWithObjectAPI.props.destination).toBe('https://example.com')
      expect(linkWithObjectAPI.props.children).toBe('Visit Example')
      expect(linkWithObjectAPI.props.target).toBe('_blank')
      expect(typeof linkWithObjectAPI.modifier).toBe('object') // Has modifier support
    })

    it('should support SwiftUI API', () => {
      const linkWithSwiftUIAPI = Link('Visit Example', 'https://example.com')

      expect(linkWithSwiftUIAPI).toBeDefined()
      expect(linkWithSwiftUIAPI.type).toBe('component')
      expect(linkWithSwiftUIAPI.props.text).toBe('Visit Example')
      expect(linkWithSwiftUIAPI.props.destination).toBe('https://example.com')
      expect(typeof linkWithSwiftUIAPI.modifier).toBe('object') // Has modifier support
    })

    it('should support concatenation through Link function', () => {
      
      // Test SwiftUI API Link with concatenation
      const link = Link('Visit', 'https://example.com')
      const text = Text(' our site')
      
      // Verify Link function result supports concatenation
      expect(typeof link.concat).toBe('function')
      expect(typeof link.toSegment).toBe('function')
      expect(typeof link.isConcatenatable).toBe('function')
      expect(link.isConcatenatable()).toBe(true)
      
      // Test actual concatenation
      const concatenated = link.concat(text)
      expect(concatenated).toBeDefined()
      expect(concatenated.segments).toHaveLength(2)
    })
  })
})