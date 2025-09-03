/**
 * @file Decorative Pseudo-element Modifiers Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
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
  PseudoElementModifier,
} from '../../src/elements/decorative'
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

describe('Icon Modifiers', () => {
  let mockContext: ModifierContext

  beforeEach(() => {
    mockContext = createMockContext()

    // Create a proper mock stylesheet
    const mockSheet = {
      insertRule: vi.fn(),
      cssRules: [],
      deleteRule: vi.fn(),
      type: 'text/css',
    }

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

  describe('iconBefore', () => {
    it('should create before modifier with icon content', () => {
      const modifier = iconBefore('★')

      expect(modifier).toBeInstanceOf(PseudoElementModifier)
      expect(modifier.properties.before).toEqual({
        content: '★',
        display: 'inline-block',
      })
    })

    it('should merge additional styles', () => {
      const modifier = iconBefore('→', {
        color: '#007AFF',
        marginRight: 8,
      })

      expect(modifier.properties.before).toEqual({
        content: '→',
        display: 'inline-block',
        color: '#007AFF',
        marginRight: 8,
      })
    })

    it('should not override content in additional styles', () => {
      const modifier = iconBefore('★', {
        color: 'red',
      } as any)

      expect(modifier.properties.before?.content).toBe('★')
    })
  })

  describe('iconAfter', () => {
    it('should create after modifier with icon content', () => {
      const modifier = iconAfter('✓')

      expect(modifier).toBeInstanceOf(PseudoElementModifier)
      expect(modifier.properties.after).toEqual({
        content: '✓',
        display: 'inline-block',
      })
    })

    it('should merge additional styles', () => {
      const modifier = iconAfter('→', {
        color: '#007AFF',
        marginLeft: 8,
      })

      expect(modifier.properties.after).toEqual({
        content: '→',
        display: 'inline-block',
        color: '#007AFF',
        marginLeft: 8,
      })
    })
  })
})

describe('Line Decorations', () => {
  describe('lineBefore', () => {
    it('should create line with default parameters', () => {
      const modifier = lineBefore()

      expect(modifier.properties.before).toEqual({
        content: '',
        display: 'inline-block',
        width: 16,
        height: 1,
        backgroundColor: '#ddd',
        marginRight: 8,
        verticalAlign: 'middle',
      })
    })

    it('should accept custom parameters', () => {
      const modifier = lineBefore('#007AFF', 2, 20)

      expect(modifier.properties.before).toEqual({
        content: '',
        display: 'inline-block',
        width: 20,
        height: 2,
        backgroundColor: '#007AFF',
        marginRight: 8,
        verticalAlign: 'middle',
      })
    })
  })

  describe('lineAfter', () => {
    it('should create line with default parameters', () => {
      const modifier = lineAfter()

      expect(modifier.properties.after).toEqual({
        content: '',
        display: 'inline-block',
        width: 16,
        height: 1,
        backgroundColor: '#ddd',
        marginLeft: 8,
        verticalAlign: 'middle',
      })
    })

    it('should accept custom parameters', () => {
      const modifier = lineAfter('#ff3b30', 3, 24)

      expect(modifier.properties.after).toEqual({
        content: '',
        display: 'inline-block',
        width: 24,
        height: 3,
        backgroundColor: '#ff3b30',
        marginLeft: 8,
        verticalAlign: 'middle',
      })
    })
  })
})

describe('Text Decorations', () => {
  describe('quotes', () => {
    it('should create quotes with default characters', () => {
      const modifier = quotes()

      expect(modifier.properties.before).toEqual({
        content: '"',
        fontSize: '1.2em',
        color: '#666',
        marginRight: 4,
      })
      expect(modifier.properties.after).toEqual({
        content: '"',
        fontSize: '1.2em',
        color: '#666',
        marginLeft: 4,
      })
    })

    it('should accept custom quote characters', () => {
      const modifier = quotes('«', '»')

      expect(modifier.properties.before?.content).toBe('«')
      expect(modifier.properties.after?.content).toBe('»')
    })

    it('should accept single custom quote character', () => {
      const modifier = quotes("'")

      expect(modifier.properties.before?.content).toBe("'")
      expect(modifier.properties.after?.content).toBe('"')
    })
  })

  describe('underline', () => {
    it('should create underline with default parameters', () => {
      const modifier = underline()

      expect(modifier.properties.after).toEqual({
        content: '',
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 1,
        backgroundColor: 'currentColor',
        opacity: 1,
      })
    })

    it('should accept custom parameters', () => {
      const modifier = underline('#007AFF', 2, 0.5)

      expect(modifier.properties.after).toEqual({
        content: '',
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 2,
        backgroundColor: '#007AFF',
        opacity: 0.5,
      })
    })
  })
})

describe('Interactive Decorations', () => {
  describe('badge', () => {
    it('should create badge with default parameters', () => {
      const modifier = badge()

      expect(modifier.properties.after).toEqual({
        content: '',
        position: 'absolute',
        top: -2,
        right: -2,
        width: 6,
        height: 6,
        minWidth: 6,
        backgroundColor: '#ff3b30',
        borderRadius: '50%',
        fontSize: 10,
        color: 'white',
        textAlign: 'center',
        lineHeight: 1,
        padding: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      })
    })

    it('should create badge with text', () => {
      const modifier = badge('#007AFF', 8, '2')

      expect(modifier.properties.after).toEqual({
        content: '2',
        position: 'absolute',
        top: -2,
        right: -2,
        width: 'auto',
        height: 8,
        minWidth: 8,
        backgroundColor: '#007AFF',
        borderRadius: '50%',
        fontSize: 10,
        color: 'white',
        textAlign: 'center',
        lineHeight: 8 / 10,
        padding: '2px 4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      })
    })

    it('should handle empty text as dot badge', () => {
      const modifier = badge('#34c759', 10, '')

      expect(modifier.properties.after?.content).toBe('')
      expect(modifier.properties.after?.width).toBe(10)
      expect(modifier.properties.after?.padding).toBe(0)
    })
  })

  describe('tooltip', () => {
    it('should create tooltip with default position', () => {
      const modifier = tooltip('Test tooltip')

      expect(modifier.properties.before).toEqual({
        content: 'Test tooltip',
        position: 'absolute',
        backgroundColor: '#333',
        color: 'white',
        padding: '4px 8px',
        borderRadius: 4,
        fontSize: 12,
        whiteSpace: 'nowrap',
        zIndex: 1000,
        opacity: 0,
        pointerEvents: 'none',
        transition: 'opacity 0.2s ease',
        bottom: '100%',
        left: '50%',
        transform: 'translateX(-50%)',
        marginBottom: 5,
      })
    })

    it('should handle different positions', () => {
      const positions = ['top', 'bottom', 'left', 'right'] as const
      const expectedStyles = {
        top: {
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginBottom: 5,
        },
        bottom: {
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginTop: 5,
        },
        left: {
          right: '100%',
          top: '50%',
          transform: 'translateY(-50%)',
          marginRight: 5,
        },
        right: {
          left: '100%',
          top: '50%',
          transform: 'translateY(-50%)',
          marginLeft: 5,
        },
      }

      positions.forEach(position => {
        const modifier = tooltip('Test', position)
        const styles = modifier.properties.before!

        Object.entries(expectedStyles[position]).forEach(([key, value]) => {
          expect(styles[key as keyof typeof styles]).toBe(value)
        })
      })
    })

    it('should accept custom colors', () => {
      const modifier = tooltip('Test', 'top', '#ff3b30', '#fff')

      expect(modifier.properties.before?.backgroundColor).toBe('#ff3b30')
      expect(modifier.properties.before?.color).toBe('#fff')
    })
  })

  describe('cornerRibbon', () => {
    it('should create corner ribbon with default parameters', () => {
      const modifier = cornerRibbon('New!')

      expect(modifier.properties.before).toEqual({
        content: 'New!',
        position: 'absolute',
        top: 8,
        right: -8,
        backgroundColor: '#ff3b30',
        color: 'white',
        padding: '2px 12px',
        fontSize: 11,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        transform: 'rotate(45deg)',
        transformOrigin: 'center',
        zIndex: 10,
      })
    })

    it('should accept custom colors', () => {
      const modifier = cornerRibbon('Sale', '#ff9500', '#000')

      expect(modifier.properties.before?.content).toBe('Sale')
      expect(modifier.properties.before?.backgroundColor).toBe('#ff9500')
      expect(modifier.properties.before?.color).toBe('#000')
    })
  })

  describe('spinner', () => {
    beforeEach(() => {
      // Reset document for each test
      document.head.innerHTML = ''
    })

    it('should create spinner with default parameters', () => {
      const modifier = spinner()

      expect(modifier.properties.before).toEqual({
        content: '',
        display: 'inline-block',
        width: 20,
        height: 20,
        border: '2px solid transparent',
        borderTop: '2px solid #007AFF',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      })
    })

    it('should accept custom parameters', () => {
      const modifier = spinner(16, '#ff3b30', 1)

      expect(modifier.properties.before).toEqual({
        content: '',
        display: 'inline-block',
        width: 16,
        height: 16,
        border: '1px solid transparent',
        borderTop: '1px solid #ff3b30',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      })
    })

    it('should add spin animation to document head', () => {
      vi.spyOn(document, 'getElementById').mockReturnValue(null)
      const mockStyleElement = {
        id: '',
        textContent: '',
      }
      vi.spyOn(document, 'createElement').mockReturnValue(
        mockStyleElement as any
      )
      vi.spyOn(document.head, 'appendChild').mockImplementation(
        () => undefined as any
      )

      spinner()

      expect(document.createElement).toHaveBeenCalledWith('style')
      expect(mockStyleElement.id).toBe('tachui-spinner-animation')
      expect(mockStyleElement.textContent).toContain('@keyframes spin')
      expect(document.head.appendChild).toHaveBeenCalled()
    })

    it('should not duplicate spin animation', () => {
      const mockExistingStyle = { id: 'tachui-spinner-animation' }
      vi.spyOn(document, 'getElementById').mockReturnValue(
        mockExistingStyle as any
      )
      vi.spyOn(document, 'createElement')

      spinner()

      expect(document.createElement).not.toHaveBeenCalled()
    })
  })
})

describe('Integration Tests', () => {
  let mockContext: ModifierContext
  let mockElement: HTMLElement

  beforeEach(() => {
    mockElement = createMockElement()
    mockContext = createMockContext(mockElement)

    vi.spyOn(document, 'getElementById').mockReturnValue(null)
    vi.spyOn(document, 'createElement').mockReturnValue({
      id: '',
      sheet: { insertRule: vi.fn() },
    } as any)
    vi.spyOn(document.head, 'appendChild').mockImplementation(
      () => undefined as any
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should apply modifier to DOM element', () => {
    const modifier = iconBefore('★', { color: 'gold' })

    modifier.apply({} as any, mockContext)

    expect(mockElement.classList.add).toHaveBeenCalledWith(
      expect.stringMatching(/^tachui-pseudo-\d+$/)
    )
  })

  it('should generate valid CSS rules', () => {
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

    const modifier = underline('#007AFF', 2)
    modifier.apply({} as any, mockContext)

    expect(mockSheet.insertRule).toHaveBeenCalled()
    const cssRule = mockSheet.insertRule.mock.calls[0][0]
    expect(cssRule).toMatch(/\.tachui-pseudo-\d+::after/)
    expect(cssRule).toContain('height: 2px')
  })

  it('should handle complex decorative combinations', () => {
    const modifier = cornerRibbon('Premium', '#ff9500')

    expect(modifier.properties.before).toMatchObject({
      content: 'Premium',
      backgroundColor: '#ff9500',
      transform: 'rotate(45deg)',
      position: 'absolute',
    })
  })
})

describe('Error Handling', () => {
  it('should handle missing element context gracefully', () => {
    const modifier = iconBefore('★')
    const contextWithoutElement = { ...createMockContext(), element: null }

    const result = modifier.apply({} as any, contextWithoutElement)

    expect(result).toBeUndefined()
  })

  it('should handle stylesheet insertion errors gracefully', () => {
    const mockSheet = {
      insertRule: vi.fn().mockImplementation(() => {
        throw new Error('Invalid CSS rule')
      }),
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
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const modifier = iconBefore('★')

    // Should not throw even when CSS insertion fails
    expect(() => modifier.apply({} as any, createMockContext())).not.toThrow()
    // Verify that the mock sheet's insertRule was called (and failed)
    expect(mockSheet.insertRule).toHaveBeenCalled()
  })
})
