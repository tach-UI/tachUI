/**
 * @file Elements Integration Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  before,
  after,
  pseudoElements,
  iconBefore,
  iconAfter,
  lineBefore,
  lineAfter,
  quotes,
  underline,
  badge,
  tooltip,
  cornerRibbon,
  spinner,
} from '../../src/elements'
import type { ModifierContext } from '@tachui/core/modifiers/types'

// Mock DOM environment
const createMockElement = (): HTMLElement => {
  const element = document.createElement('div')
  const addSpy = vi.fn()
  const removeSpy = vi.fn()
  const containsSpy = vi.fn().mockReturnValue(false)
  const toggleSpy = vi.fn()
  const replaceSpy = vi.fn()

  // Create proper classList mock
  Object.defineProperty(element, 'classList', {
    value: {
      add: addSpy,
      remove: removeSpy,
      contains: containsSpy,
      toggle: toggleSpy,
      replace: replaceSpy,
      length: 0,
      item: vi.fn(),
      toString: vi.fn().mockReturnValue(''),
      forEach: vi.fn(),
    },
    writable: true,
    configurable: true,
  })

  return element
}

const createMockContext = (element?: HTMLElement): ModifierContext => ({
  componentId: 'test-component',
  element: element || createMockElement(),
  phase: 'creation' as const,
})

describe('Element Modifier Integration', () => {
  let mockContext: ModifierContext
  let mockElement: HTMLElement
  let mockSheet: { insertRule: ReturnType<typeof vi.fn> }

  beforeEach(() => {
    mockElement = createMockElement()
    mockContext = createMockContext(mockElement)

    // Create a proper mock stylesheet
    mockSheet = {
      insertRule: vi.fn(),
      cssRules: [],
      deleteRule: vi.fn(),
      type: 'text/css',
    } as any

    vi.spyOn(document, 'getElementById').mockReturnValue({
      sheet: mockSheet,
    } as any)
    vi.spyOn(document, 'createElement').mockReturnValue({
      id: '',
      sheet: mockSheet,
      type: 'text/css',
    } as any)
    vi.spyOn(document.head, 'appendChild').mockImplementation(
      () => undefined as any
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Modifier Chaining and Combination', () => {
    it('should apply multiple pseudo-element modifiers independently', () => {
      const modifier1 = iconBefore('★')
      const modifier2 = badge('#ff3b30', 6)

      modifier1.apply({} as any, mockContext)
      modifier2.apply({} as any, mockContext)

      expect(mockElement.classList.add).toHaveBeenCalledTimes(2)
      expect(mockSheet.insertRule).toHaveBeenCalledTimes(2)
    })

    it('should handle complex combinations correctly', () => {
      const quotesModifier = quotes('«', '»')
      const underlineModifier = underline('#007AFF', 2)
      const badgeModifier = badge('#ff3b30', 8, '!')

      quotesModifier.apply({} as any, mockContext)
      underlineModifier.apply({} as any, mockContext)
      badgeModifier.apply({} as any, mockContext)

      expect(mockSheet.insertRule).toHaveBeenCalledTimes(4) // quotes has both before+after, underline+badge each have one
    })

    it('should generate unique class names for each modifier instance', () => {
      const modifier1 = iconBefore('→')
      const modifier2 = iconBefore('←')

      modifier1.apply({} as any, mockContext)
      modifier2.apply({} as any, mockContext)

      const calls = (mockElement.classList.add as any).mock.calls
      expect(calls[0][0]).not.toBe(calls[1][0])
      expect(calls[0][0]).toMatch(/^tachui-pseudo-\d+$/)
      expect(calls[1][0]).toMatch(/^tachui-pseudo-\d+$/)
    })
  })

  describe('Real-world Usage Patterns', () => {
    it('should support notification indicator pattern', () => {
      const notification = pseudoElements({
        before: { content: '●', color: '#ff3b30', marginRight: 4 },
        after: {
          content: 'new',
          fontSize: 10,
          backgroundColor: '#ff3b30',
          color: 'white',
          padding: '1px 4px',
          borderRadius: 8,
        },
      })

      notification.apply({} as any, mockContext)

      expect(mockSheet.insertRule).toHaveBeenCalledTimes(2)
      expect(mockSheet.insertRule).toHaveBeenCalledWith(
        expect.stringContaining('::before')
      )
      expect(mockSheet.insertRule).toHaveBeenCalledWith(
        expect.stringContaining('::after')
      )
    })

    it('should support loading state pattern', () => {
      const loadingSpinner = spinner(16, '#007AFF')

      loadingSpinner.apply({} as any, mockContext)

      expect(mockSheet.insertRule).toHaveBeenCalledWith(
        expect.stringContaining('animation: spin 1s linear infinite')
      )
    })

    it('should support decorative header pattern', () => {
      const decoratedHeader = pseudoElements({
        before: {
          content: '',
          width: 40,
          height: 2,
          backgroundColor: '#007AFF',
          marginRight: 12,
        },
        after: {
          content: '',
          width: 40,
          height: 2,
          backgroundColor: '#007AFF',
          marginLeft: 12,
        },
      })

      decoratedHeader.apply({} as any, mockContext)

      const beforeCall = mockSheet.insertRule.mock.calls.find(call =>
        call[0].includes('::before')
      )
      const afterCall = mockSheet.insertRule.mock.calls.find(call =>
        call[0].includes('::after')
      )

      expect(beforeCall).toBeDefined()
      expect(afterCall).toBeDefined()
      expect(beforeCall![0]).toContain('width: 40px')
      expect(afterCall![0]).toContain('width: 40px')
    })
  })

  describe('Accessibility and UX Patterns', () => {
    it('should support accessible tooltip pattern', () => {
      const accessibleTooltip = tooltip('Accessible description', 'top')

      accessibleTooltip.apply({} as any, mockContext)

      const call = mockSheet.insertRule.mock.calls[0][0]
      expect(call).toContain('pointer-events: none')
      expect(call).toContain('opacity: 0')
      expect(call).toContain('transition: opacity 0.2s ease')
    })

    it('should support visual hierarchy indicators', () => {
      const priorityIndicator = lineBefore('#ff3b30', 3, 4)

      priorityIndicator.apply({} as any, mockContext)

      const call = mockSheet.insertRule.mock.calls[0][0]
      expect(call).toContain('width: 4px')
      expect(call).toContain('height: 3px')
      expect(call).toContain('background-color: #ff3b30')
    })

    it('should support status indication pattern', () => {
      const statusIcon = iconAfter('✓', { color: '#34c759', marginLeft: 6 })

      statusIcon.apply({} as any, mockContext)

      const call = mockSheet.insertRule.mock.calls[0][0]
      expect(call).toContain('content: "✓"')
      expect(call).toContain('color: #34c759')
      expect(call).toContain('margin-left: 6px')
    })
  })

  describe('Edge Cases and Error Recovery', () => {
    it('should handle null context element gracefully', () => {
      const modifier = iconBefore('★')
      const nullContext = { ...mockContext, element: null }

      expect(() => modifier.apply({} as any, nullContext)).not.toThrow()
    })

    it('should handle CSS insertion failures gracefully', () => {
      mockSheet.insertRule.mockImplementation(() => {
        throw new Error('CSS syntax error')
      })

      const modifier = iconBefore('★')

      // Should not throw even when CSS insertion fails
      expect(() => modifier.apply({} as any, mockContext)).not.toThrow()
      // Verify that insertRule was called (and failed)
      expect(mockSheet.insertRule).toHaveBeenCalled()
    })

    it('should handle missing document.head gracefully', () => {
      // Mock document.head to be null by mocking appendChild to throw
      vi.spyOn(document.head, 'appendChild').mockImplementation(() => {
        throw new Error('No document.head')
      })

      const modifier = spinner()

      // Suppress expected error output
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      // Should not throw even when document.head.appendChild fails
      expect(() => modifier.apply({} as any, mockContext)).not.toThrow()

      consoleSpy.mockRestore()
    })
  })

  describe('Performance Considerations', () => {
    it('should handle multiple modifier instances correctly', () => {
      // Create modifiers and verify they work independently
      const modifier1 = before({ content: '★' })
      const modifier2 = after({ content: '→' })

      modifier1.apply({} as any, mockContext)
      modifier2.apply({} as any, mockContext)

      // Both modifiers should add classes to elements
      expect(mockContext.element!.classList.add).toHaveBeenCalledTimes(2)

      // Both should insert CSS rules
      expect(mockSheet.insertRule).toHaveBeenCalledTimes(2)

      // Verify CSS contains expected content
      const calls = mockSheet.insertRule.mock.calls
      expect(calls[0][0]).toContain('::before')
      expect(calls[0][0]).toContain('content: "★"')
      expect(calls[1][0]).toContain('::after')
      expect(calls[1][0]).toContain('content: "→"')
    })

    it('should generate minimal CSS rules', () => {
      const modifier = lineBefore('#007AFF', 1, 8)

      modifier.apply({} as any, mockContext)

      const cssRule = mockSheet.insertRule.mock.calls[0][0]
      expect(cssRule).toMatch(/^\.tachui-pseudo-\d+::before \{ [^}]+\}$/)
      expect(cssRule.split(';').length).toBeLessThan(10) // Reasonable CSS property count
    })
  })
})
