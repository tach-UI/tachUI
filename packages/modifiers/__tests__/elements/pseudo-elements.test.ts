/**
 * @file Pseudo-element Modifiers Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  before,
  after,
  pseudoElements,
  PseudoElementModifier,
} from '../../src/elements/pseudo-elements'
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

describe('PseudoElementModifier', () => {
  let mockContext: ModifierContext
  let mockElement: HTMLElement

  beforeEach(() => {
    mockElement = createMockElement()
    mockContext = createMockContext(mockElement)

    // Create a proper mock stylesheet
    const mockSheet = {
      insertRule: vi.fn(),
      cssRules: [],
      deleteRule: vi.fn(),
      type: 'text/css',
    }

    // Mock document methods
    vi.spyOn(document, 'getElementById').mockReturnValue(null)
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

  describe('constructor', () => {
    it('should create modifier with before styles', () => {
      const modifier = new PseudoElementModifier({
        before: { content: 'test', color: 'red' },
      })

      expect(modifier.type).toBe('pseudoElement')
      expect(modifier.priority).toBe(50)
      expect(modifier.properties.before).toEqual({
        content: 'test',
        color: 'red',
      })
    })

    it('should create modifier with after styles', () => {
      const modifier = new PseudoElementModifier({
        after: { content: 'test', backgroundColor: 'blue' },
      })

      expect(modifier.properties.after).toEqual({
        content: 'test',
        backgroundColor: 'blue',
      })
    })

    it('should create modifier with both before and after styles', () => {
      const modifier = new PseudoElementModifier({
        before: { content: 'before' },
        after: { content: 'after' },
      })

      expect(modifier.properties.before).toEqual({ content: 'before' })
      expect(modifier.properties.after).toEqual({ content: 'after' })
    })
  })

  describe('apply', () => {
    it('should add unique class to element', () => {
      const modifier = new PseudoElementModifier({
        before: { content: 'test' },
      })

      modifier.apply({ element: mockContext.element } as any, mockContext)

      expect(mockContext.element!.classList.add).toHaveBeenCalledWith(
        expect.stringMatching(/^tachui-pseudo-\d+$/)
      )
    })

    it('should handle missing element gracefully', () => {
      const modifier = new PseudoElementModifier({
        before: { content: 'test' },
      })

      const result = modifier.apply({} as any, {
        ...mockContext,
        element: null,
      })

      expect(result).toBeUndefined()
    })

    it('should create stylesheet when none exists', () => {
      const modifier = new PseudoElementModifier({
        before: { content: 'test' },
      })

      modifier.apply({ element: mockContext.element } as any, mockContext)

      expect(document.createElement).toHaveBeenCalledWith('style')
      expect(document.head.appendChild).toHaveBeenCalled()
    })

    it('should reuse existing stylesheet', () => {
      // Set up a mock for existing stylesheet that passes instanceof check
      const mockSheet = {
        insertRule: vi.fn(),
        cssRules: [],
        deleteRule: vi.fn(),
        type: 'text/css',
      }
      const mockStyleElement = document.createElement('style')
      Object.defineProperty(mockStyleElement, 'sheet', {
        value: mockSheet,
        writable: true,
      })
      Object.defineProperty(mockStyleElement, 'id', {
        value: 'tachui-pseudo-elements',
        writable: true,
      })

      // Override the getElementById mock for this test
      vi.spyOn(document, 'getElementById').mockReturnValue(mockStyleElement)
      const createElementSpy = vi.spyOn(document, 'createElement')

      const modifier = new PseudoElementModifier({
        before: { content: 'test' },
      })

      modifier.apply({ element: mockContext.element } as any, mockContext)

      // Should have called getElementById first
      expect(document.getElementById).toHaveBeenCalledWith(
        'tachui-pseudo-elements'
      )
      // Should have used existing sheet and inserted rule
      expect(mockSheet.insertRule).toHaveBeenCalled()
    })
  })

  describe('CSS generation', () => {
    it('should generate valid CSS for before pseudo-element', () => {
      const modifier = new PseudoElementModifier({
        before: {
          content: 'test',
          color: 'red',
          fontSize: 16,
          position: 'absolute',
        },
      })

      const mockSheet = {
        insertRule: vi.fn(),
        cssRules: [],
        deleteRule: vi.fn(),
        type: 'text/css',
      }
      const mockStyleElement = document.createElement('style')
      Object.defineProperty(mockStyleElement, 'sheet', {
        value: mockSheet,
        writable: true,
      })
      vi.spyOn(document, 'getElementById').mockReturnValue(mockStyleElement)

      modifier.apply({ element: mockContext.element } as any, mockContext)

      // Should have called insertRule with CSS containing expected parts
      expect(mockSheet.insertRule).toHaveBeenCalled()
      const cssRule = mockSheet.insertRule.mock.calls[0][0]
      expect(cssRule).toContain('::before')
      expect(cssRule).toContain('content: "test"')
      expect(cssRule).toContain('color: red')
    })

    it('should add default content if not provided', () => {
      const modifier = new PseudoElementModifier({
        before: { color: 'red' },
      })

      const mockSheet = {
        insertRule: vi.fn(),
        cssRules: [],
        deleteRule: vi.fn(),
        type: 'text/css',
      }
      const mockStyleElement = document.createElement('style')
      Object.defineProperty(mockStyleElement, 'sheet', {
        value: mockSheet,
        writable: true,
      })
      vi.spyOn(document, 'getElementById').mockReturnValue(mockStyleElement)

      modifier.apply({ element: mockContext.element } as any, mockContext)

      expect(mockSheet.insertRule).toHaveBeenCalled()
      const cssRule = mockSheet.insertRule.mock.calls[0][0]
      expect(cssRule).toContain('content: ""')
    })

    it('should handle numeric values correctly', () => {
      const modifier = new PseudoElementModifier({
        before: {
          content: '',
          width: 20,
          opacity: 0.5,
          zIndex: 10,
        },
      })

      const mockSheet = {
        insertRule: vi.fn(),
        cssRules: [],
        deleteRule: vi.fn(),
        type: 'text/css',
      }
      const mockStyleElement = document.createElement('style')
      Object.defineProperty(mockStyleElement, 'sheet', {
        value: mockSheet,
        writable: true,
      })
      vi.spyOn(document, 'getElementById').mockReturnValue(mockStyleElement)

      modifier.apply({ element: mockContext.element } as any, mockContext)

      expect(mockSheet.insertRule).toHaveBeenCalled()
      const call = mockSheet.insertRule.mock.calls[0][0]
      expect(call).toContain('width: 20px')
      expect(call).toContain('opacity: 0.5')
      expect(call).toContain('z-index: 10')
    })

    it('should handle camelCase to kebab-case conversion', () => {
      const modifier = new PseudoElementModifier({
        before: {
          content: '',
          backgroundColor: 'blue',
          borderRadius: 5,
        },
      })

      const mockSheet = {
        insertRule: vi.fn(),
        cssRules: [],
        deleteRule: vi.fn(),
        type: 'text/css',
      }
      const mockStyleElement = document.createElement('style')
      Object.defineProperty(mockStyleElement, 'sheet', {
        value: mockSheet,
        writable: true,
      })
      vi.spyOn(document, 'getElementById').mockReturnValue(mockStyleElement)

      modifier.apply({ element: mockContext.element } as any, mockContext)

      expect(mockSheet.insertRule).toHaveBeenCalled()
      const call = mockSheet.insertRule.mock.calls[0][0]
      expect(call).toContain('background-color: blue')
      expect(call).toContain('border-radius: 5px')
    })
  })
})

describe('before function', () => {
  it('should create PseudoElementModifier with before styles', () => {
    const modifier = before({
      content: '★',
      color: '#ffd700',
    })

    expect(modifier).toBeInstanceOf(PseudoElementModifier)
    expect(modifier.properties.before).toEqual({
      content: '★',
      color: '#ffd700',
    })
    expect(modifier.properties.after).toBeUndefined()
  })

  it('should handle empty styles object', () => {
    const modifier = before({})

    expect(modifier.properties.before).toEqual({})
  })
})

describe('after function', () => {
  it('should create PseudoElementModifier with after styles', () => {
    const modifier = after({
      content: '',
      height: 2,
      backgroundColor: '#007AFF',
    })

    expect(modifier).toBeInstanceOf(PseudoElementModifier)
    expect(modifier.properties.after).toEqual({
      content: '',
      height: 2,
      backgroundColor: '#007AFF',
    })
    expect(modifier.properties.before).toBeUndefined()
  })
})

describe('pseudoElements function', () => {
  it('should create modifier with both before and after styles', () => {
    const modifier = pseudoElements({
      before: { content: 'before-content' },
      after: { content: 'after-content' },
    })

    expect(modifier).toBeInstanceOf(PseudoElementModifier)
    expect(modifier.properties.before).toEqual({ content: 'before-content' })
    expect(modifier.properties.after).toEqual({ content: 'after-content' })
  })

  it('should handle partial options', () => {
    const modifier = pseudoElements({
      before: { content: 'only-before' },
    })

    expect(modifier.properties.before).toEqual({ content: 'only-before' })
    expect(modifier.properties.after).toBeUndefined()
  })
})
