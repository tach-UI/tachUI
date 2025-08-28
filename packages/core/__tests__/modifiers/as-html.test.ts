import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { AsHTMLModifier, asHTML } from '../../src/modifiers/as-html'
import { BasicSanitizer } from '../../src/modifiers/basic-sanitizer'
import { AsHTMLValidator } from '../../src/modifiers/as-html-validator'

// Mock Text component for testing
const mockTextComponent = (content: string) => ({
  type: 'Text',
  __tachui_component_type: 'Text',
  content,
  props: { content },
})

// Mock non-Text component for testing
const mockVStackComponent = () => ({
  type: 'VStack',
  __tachui_component_type: 'VStack',
  props: { children: [] },
})

// Mock Button component for testing
const mockButtonComponent = (label: string) => ({
  type: 'Button',
  __tachui_component_type: 'Button',
  label,
  props: { label },
})

describe('AsHTML Modifier', () => {
  let consoleSpy: any
  let consoleGroupSpy: any
  let consoleGroupEndSpy: any

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    consoleGroupSpy = vi.spyOn(console, 'group').mockImplementation(() => {})
    consoleGroupEndSpy = vi
      .spyOn(console, 'groupEnd')
      .mockImplementation(() => {})
  })

  afterEach(() => {
    consoleSpy.mockRestore()
    consoleGroupSpy.mockRestore()
    consoleGroupEndSpy.mockRestore()
  })

  describe('Text Component Support', () => {
    test('renders safe HTML content in Text component', () => {
      const safeHTML = '<p>Hello <strong>world</strong>!</p>'
      const modifier = asHTML()
      const element = document.createElement('div')
      const component = mockTextComponent(safeHTML)

      const context = {
        componentId: 'test',
        componentInstance: component,
        element,
        phase: 'creation' as const,
      }

      modifier.apply(null as any, context)

      expect(element.innerHTML).toContain('<p>')
      expect(element.innerHTML).toContain('<strong>')
      expect(element.innerHTML).toContain('Hello')
      expect(element.innerHTML).toContain('world')
    })

    test('handles empty content gracefully', () => {
      const modifier = asHTML()
      const element = document.createElement('div')
      const component = mockTextComponent('')

      const context = {
        componentId: 'test',
        componentInstance: component,
        element,
        phase: 'creation' as const,
      }

      modifier.apply(null as any, context)
      expect(element.innerHTML).toBe('')
    })

    test('processes content only once (non-reactive)', () => {
      const modifier = asHTML()
      const element = document.createElement('div')
      const component = mockTextComponent('<p>Content</p>')

      const context = {
        componentId: 'test',
        componentInstance: component,
        element,
        phase: 'creation' as const,
      }

      // Apply multiple times - content should remain the same
      modifier.apply(null as any, context)
      const firstResult = element.innerHTML

      modifier.apply(null as any, context)
      const secondResult = element.innerHTML

      expect(firstResult).toBe(secondResult)
      expect(element.innerHTML).toContain('<p>Content</p>')
    })
  })

  describe('Component Restriction', () => {
    test('throws error when applied to VStack component', () => {
      const modifier = asHTML()
      const element = document.createElement('div')
      const component = mockVStackComponent()

      const context = {
        componentId: 'test',
        componentInstance: component,
        element,
        phase: 'creation' as const,
      }

      expect(() => {
        modifier.apply(null as any, context)
      }).toThrow('AsHTML modifier can only be applied to Text components')
    })

    test('provides helpful error message with component type', () => {
      const modifier = asHTML()
      const element = document.createElement('div')
      const component = mockButtonComponent('Click me')

      const context = {
        componentId: 'test',
        componentInstance: component,
        element,
        phase: 'creation' as const,
      }

      expect(() => {
        modifier.apply(null as any, context)
      }).toThrow(
        "Found: Button component. Use Text('<your-html>').modifier.asHTML() instead."
      )
    })

    test('error message suggests correct usage', () => {
      const modifier = asHTML()
      const element = document.createElement('div')
      const component = mockVStackComponent()

      const context = {
        componentId: 'test',
        componentInstance: component,
        element,
        phase: 'creation' as const,
      }

      expect(() => {
        modifier.apply(null as any, context)
      }).toThrow("Use Text('<your-html>').modifier.asHTML() instead.")
    })
  })

  describe('Security - Basic Sanitization', () => {
    test('removes script tags by default', () => {
      const maliciousHTML =
        '<p>Hello</p><script>alert("xss")</script><p>World</p>'
      const modifier = asHTML()
      const element = document.createElement('div')
      const component = mockTextComponent(maliciousHTML)

      const context = {
        componentId: 'test',
        componentInstance: component,
        element,
        phase: 'creation' as const,
      }

      modifier.apply(null as any, context)

      expect(element.innerHTML).toContain('Hello')
      expect(element.innerHTML).toContain('World')
      expect(element.innerHTML).not.toContain('<script>')
      expect(element.innerHTML).not.toContain('alert')
    })

    test('removes event handlers by default', () => {
      const maliciousHTML = '<div onclick="alert(1)">Click me</div>'
      const modifier = asHTML()
      const element = document.createElement('div')
      const component = mockTextComponent(maliciousHTML)

      const context = {
        componentId: 'test',
        componentInstance: component,
        element,
        phase: 'creation' as const,
      }

      modifier.apply(null as any, context)

      expect(element.innerHTML).toContain('Click me')
      expect(element.innerHTML).not.toContain('onclick')
      expect(element.innerHTML).not.toContain('alert(1)')
    })

    test('removes javascript: URLs by default', () => {
      const maliciousHTML = '<a href="javascript:alert(1)">Link</a>'
      const modifier = asHTML()
      const element = document.createElement('div')
      const component = mockTextComponent(maliciousHTML)

      const context = {
        componentId: 'test',
        componentInstance: component,
        element,
        phase: 'creation' as const,
      }

      modifier.apply(null as any, context)

      expect(element.innerHTML).toContain('Link')
      expect(element.innerHTML).not.toContain('javascript:')
      expect(element.innerHTML).not.toContain('alert(1)')
    })

    test('removes dangerous elements by default', () => {
      const maliciousHTML =
        '<iframe src="evil.html"></iframe><object data="evil.swf"></object>'
      const modifier = asHTML()
      const element = document.createElement('div')
      const component = mockTextComponent(maliciousHTML)

      const context = {
        componentId: 'test',
        componentInstance: component,
        element,
        phase: 'creation' as const,
      }

      modifier.apply(null as any, context)

      expect(element.innerHTML).not.toContain('<iframe>')
      expect(element.innerHTML).not.toContain('<object>')
    })

    test('preserves safe HTML elements', () => {
      const safeHTML = `
        <div class="content">
          <h1>Title</h1>
          <p>Paragraph with <strong>bold</strong> and <em>italic</em></p>
          <ul>
            <li>Item 1</li>
            <li>Item 2</li>
          </ul>
          <a href="https://example.com">Safe link</a>
          <img src="/image.jpg" alt="Safe image">
        </div>
      `
      const modifier = asHTML()
      const element = document.createElement('div')
      const component = mockTextComponent(safeHTML)

      const context = {
        componentId: 'test',
        componentInstance: component,
        element,
        phase: 'creation' as const,
      }

      modifier.apply(null as any, context)

      expect(element.innerHTML).toContain('<div class="content">')
      expect(element.innerHTML).toContain('<h1>')
      expect(element.innerHTML).toContain('<strong>')
      expect(element.innerHTML).toContain('<em>')
      expect(element.innerHTML).toContain('<ul>')
      expect(element.innerHTML).toContain('<li>')
      expect(element.innerHTML).toContain('<a href="https://example.com">')
      expect(element.innerHTML).toContain('<img src="/image.jpg"')
    })
  })

  describe('Skip Sanitizer Option', () => {
    test('bypasses sanitization when skipSanitizer: true', () => {
      const maliciousHTML = '<script>alert("xss")</script><p>Content</p>'
      const modifier = asHTML({ skipSanitizer: true })
      const element = document.createElement('div')
      const component = mockTextComponent(maliciousHTML)

      const context = {
        componentId: 'test',
        componentInstance: component,
        element,
        phase: 'creation' as const,
      }

      modifier.apply(null as any, context)

      expect(element.innerHTML).toContain('<script>')
      expect(element.innerHTML).toContain('alert("xss")')
      expect(element.innerHTML).toContain('<p>Content</p>')
    })

    test('warns in development when skipping sanitizer', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      const modifier = asHTML({ skipSanitizer: true })
      const element = document.createElement('div')
      const component = mockTextComponent('<p>Content</p>')

      const context = {
        componentId: 'test',
        componentInstance: component,
        element,
        phase: 'creation' as const,
      }

      modifier.apply(null as any, context)

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Sanitization is DISABLED')
      )

      process.env.NODE_ENV = originalEnv
    })
  })

  describe('Custom Sanitizer Option', () => {
    test('uses custom sanitizer when provided', () => {
      const customSanitizer = vi.fn((html: string) =>
        html.replace(/<script.*?<\/script>/gi, '')
      )
      const maliciousHTML =
        '<p>Hello</p><script>alert("xss")</script><p>World</p>'

      const modifier = asHTML({ customSanitizer })
      const element = document.createElement('div')
      const component = mockTextComponent(maliciousHTML)

      const context = {
        componentId: 'test',
        componentInstance: component,
        element,
        phase: 'creation' as const,
      }

      modifier.apply(null as any, context)

      expect(customSanitizer).toHaveBeenCalledWith(maliciousHTML)
      expect(element.innerHTML).toContain('Hello')
      expect(element.innerHTML).toContain('World')
      expect(element.innerHTML).not.toContain('<script>')
    })
  })

  describe('Development Mode Validation', () => {
    test('warns about suspicious content in development', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      const modifier = asHTML()
      const element = document.createElement('div')
      const component = mockTextComponent(
        '<p>Hello</p><script>alert(1)</script>'
      )

      const context = {
        componentId: 'test',
        componentInstance: component,
        element,
        phase: 'creation' as const,
      }

      modifier.apply(null as any, context)

      expect(consoleGroupSpy).toHaveBeenCalledWith(
        '🔒 AsHTML Security Warnings'
      )
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Script tags detected')
      )

      process.env.NODE_ENV = originalEnv
    })

    test('suppresses warnings when requested', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      const modifier = asHTML({ __suppressWarnings: true })
      const element = document.createElement('div')
      const component = mockTextComponent('<script>alert(1)</script>')

      const context = {
        componentId: 'test',
        componentInstance: component,
        element,
        phase: 'creation' as const,
      }

      modifier.apply(null as any, context)

      expect(consoleGroupSpy).not.toHaveBeenCalled()
      expect(consoleSpy).not.toHaveBeenCalled()

      process.env.NODE_ENV = originalEnv
    })
  })

  describe('Content Extraction', () => {
    test('extracts content from various Text component structures', () => {
      const testCases = [
        // Direct content property
        { content: '<p>Direct content</p>', text: undefined, props: {} },
        // Props content
        {
          content: undefined,
          text: undefined,
          props: { content: '<p>Props content</p>' },
        },
        // Text property
        { content: undefined, text: '<p>Text property</p>', props: {} },
        // Props text
        {
          content: undefined,
          text: undefined,
          props: { text: '<p>Props text</p>' },
        },
      ]

      testCases.forEach((testCase, index) => {
        const component = {
          type: 'Text',
          __tachui_component_type: 'Text',
          ...testCase,
        }

        const modifier = asHTML()
        const element = document.createElement('div')

        const context = {
          componentId: `test-${index}`,
          componentInstance: component,
          element,
          phase: 'creation' as const,
        }

        modifier.apply(null as any, context)

        expect(element.innerHTML).toContain('<p>')
        expect(element.innerHTML).toMatch(/content|property|text/)
      })
    })
  })
})
