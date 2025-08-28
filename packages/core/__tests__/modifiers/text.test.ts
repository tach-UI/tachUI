/**
 * Text Modifiers Tests
 *
 * Comprehensive tests for text-related modifiers including line clamping,
 * word breaking, overflow wrapping, and hyphenation control.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { 
  LineClampModifier,
  WordBreakModifier,
  OverflowWrapModifier,
  HyphensModifier,
  lineClamp,
  wordBreak,
  overflowWrap,
  hyphens
} from '../../src/modifiers/text'

// Mock DOM environment
const mockElement = {
  style: {
    setProperty: vi.fn(),
    removeProperty: vi.fn(),
    getPropertyValue: vi.fn(),
  } as any,
  setAttribute: vi.fn(),
  removeAttribute: vi.fn(),
  getAttribute: vi.fn(),
  hasAttribute: vi.fn(),
  classList: {
    add: vi.fn(),
    remove: vi.fn(),
    contains: vi.fn(),
  },
} as any

const mockContext = {
  componentId: 'test-component',
  element: mockElement,
  phase: 'creation' as const,
}

describe('Text Modifiers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset mock element style and simulate CSS property setting
    mockElement.style = {
      setProperty: vi.fn(),
      removeProperty: vi.fn(),
      getPropertyValue: vi.fn(),
    }
    
    // Simulate style property assignments - capture both kebab-case and camelCase
    mockElement.style.setProperty = vi.fn((property, value) => {
      // Store as the kebab-case property name for assertions
      mockElement.style[property] = value
      
      // Also store as camelCase for JavaScript access
      const camelCase = property.replace(/-([a-z])/g, (g) => g[1].toUpperCase())
      mockElement.style[camelCase] = value
    })
    
    // Mock console methods
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'info').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ============================================================================
  // Line Clamp Modifier Tests
  // ============================================================================

  describe('LineClampModifier', () => {
    it('should set line clamp styles correctly', () => {
      const modifier = new LineClampModifier({ lines: 3 })
      
      modifier.apply({} as any, mockContext)
      
      expect(mockElement.style.display).toBe('-webkit-box')
      expect(mockElement.style.webkitLineClamp).toBe('3')
      expect(mockElement.style.webkitBoxOrient).toBe('vertical')
      expect(mockElement.style.overflow).toBe('hidden')
      expect(mockElement.style.textOverflow).toBe('ellipsis')
      expect(mockElement.style.wordWrap).toBe('break-word')
    })

    it('should have correct type and priority', () => {
      const modifier = new LineClampModifier({ lines: 2 })
      
      expect(modifier.type).toBe('lineClamp')
      expect(modifier.priority).toBeGreaterThan(0)
    })

    it('should validate lines in development', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      // Test invalid lines value
      const modifier = new LineClampModifier({ lines: -1 })
      modifier.apply({} as any, mockContext)
      
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('lines must be a positive integer')
      )

      process.env.NODE_ENV = originalEnv
    })

    it('should provide info for large line values', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      const modifier = new LineClampModifier({ lines: 15 })
      modifier.apply({} as any, mockContext)
      
      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('Large line clamp values (>10) may impact readability')
      )

      process.env.NODE_ENV = originalEnv
    })

    it('should work with factory function', () => {
      const modifier = lineClamp(4)
      
      expect(modifier).toBeInstanceOf(LineClampModifier)
      expect(modifier.properties.lines).toBe(4)
    })
  })

  // ============================================================================
  // Word Break Modifier Tests
  // ============================================================================

  describe('WordBreakModifier', () => {
    it('should set word-break property correctly', () => {
      const modifier = new WordBreakModifier({ wordBreak: 'break-all' })
      
      modifier.apply({} as any, mockContext)
      
      expect(mockElement.style.wordBreak).toBe('break-all')
    })

    it('should handle all valid word-break values', () => {
      const validValues = ['normal', 'break-all', 'keep-all', 'break-word']
      
      validValues.forEach(value => {
        const modifier = new WordBreakModifier({ wordBreak: value as any })
        modifier.apply({} as any, mockContext)
        expect(mockElement.style.wordBreak).toBe(value)
      })
    })

    it('should validate word-break values in development', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      const modifier = new WordBreakModifier({ wordBreak: 'invalid' as any })
      modifier.apply({} as any, mockContext)
      
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Invalid word-break value "invalid"')
      )

      process.env.NODE_ENV = originalEnv
    })

    it('should warn about deprecated break-word value', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      const modifier = new WordBreakModifier({ wordBreak: 'break-word' })
      modifier.apply({} as any, mockContext)
      
      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('"break-word" is deprecated')
      )

      process.env.NODE_ENV = originalEnv
    })

    it('should work with factory function', () => {
      const modifier = wordBreak('keep-all')
      
      expect(modifier).toBeInstanceOf(WordBreakModifier)
      expect(modifier.properties.wordBreak).toBe('keep-all')
    })
  })

  // ============================================================================
  // Overflow Wrap Modifier Tests
  // ============================================================================

  describe('OverflowWrapModifier', () => {
    it('should set overflow-wrap property correctly', () => {
      const modifier = new OverflowWrapModifier({ overflowWrap: 'break-word' })
      
      modifier.apply({} as any, mockContext)
      
      expect(mockElement.style.overflowWrap).toBe('break-word')
    })

    it('should handle all valid overflow-wrap values', () => {
      const validValues = ['normal', 'break-word', 'anywhere']
      
      validValues.forEach(value => {
        const modifier = new OverflowWrapModifier({ overflowWrap: value as any })
        modifier.apply({} as any, mockContext)
        expect(mockElement.style.overflowWrap).toBe(value)
      })
    })

    it('should validate overflow-wrap values in development', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      const modifier = new OverflowWrapModifier({ overflowWrap: 'invalid' as any })
      modifier.apply({} as any, mockContext)
      
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Invalid overflow-wrap value "invalid"')
      )

      process.env.NODE_ENV = originalEnv
    })

    it('should work with factory function', () => {
      const modifier = overflowWrap('anywhere')
      
      expect(modifier).toBeInstanceOf(OverflowWrapModifier)
      expect(modifier.properties.overflowWrap).toBe('anywhere')
    })
  })

  // ============================================================================
  // Hyphens Modifier Tests
  // ============================================================================

  describe('HyphensModifier', () => {
    it('should set hyphens property with vendor prefixes', () => {
      const modifier = new HyphensModifier({ hyphens: 'auto' })
      
      modifier.apply({} as any, mockContext)
      
      expect(mockElement.style.hyphens).toBe('auto')
      expect(mockElement.style.webkitHyphens).toBe('auto')
      expect(mockElement.style.msHyphens).toBe('auto')
    })

    it('should handle all valid hyphens values', () => {
      const validValues = ['none', 'manual', 'auto']
      
      validValues.forEach(value => {
        const modifier = new HyphensModifier({ hyphens: value as any })
        modifier.apply({} as any, mockContext)
        expect(mockElement.style.hyphens).toBe(value)
      })
    })

    it('should validate hyphens values in development', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      const modifier = new HyphensModifier({ hyphens: 'invalid' as any })
      modifier.apply({} as any, mockContext)
      
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Invalid hyphens value "invalid"')
      )

      process.env.NODE_ENV = originalEnv
    })

    it('should provide info about lang attribute for auto hyphens', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      const modifier = new HyphensModifier({ hyphens: 'auto' })
      modifier.apply({} as any, mockContext)
      
      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('requires proper lang attribute')
      )

      process.env.NODE_ENV = originalEnv
    })

    it('should work with factory function', () => {
      const modifier = hyphens('manual')
      
      expect(modifier).toBeInstanceOf(HyphensModifier)
      expect(modifier.properties.hyphens).toBe('manual')
    })
  })

  // ============================================================================
  // Integration Tests
  // ============================================================================

  describe('Integration Tests', () => {
    it('should work together in a text styling chain', () => {
      const lineClampMod = lineClamp(3)
      const wordBreakMod = wordBreak('break-all')
      const overflowWrapMod = overflowWrap('break-word')
      const hyphensMod = hyphens('auto')

      // Apply all modifiers
      lineClampMod.apply({} as any, mockContext)
      wordBreakMod.apply({} as any, mockContext)
      overflowWrapMod.apply({} as any, mockContext)
      hyphensMod.apply({} as any, mockContext)

      // Verify all properties are set
      expect(mockElement.style.webkitLineClamp).toBe('3')
      expect(mockElement.style.wordBreak).toBe('break-all')
      expect(mockElement.style.overflowWrap).toBe('break-word')
      expect(mockElement.style.hyphens).toBe('auto')
    })

    it('should have appropriate priority ordering', () => {
      const lineClampMod = new LineClampModifier({ lines: 2 })
      const wordBreakMod = new WordBreakModifier({ wordBreak: 'normal' })
      const overflowWrapMod = new OverflowWrapModifier({ overflowWrap: 'normal' })
      const hyphensMod = new HyphensModifier({ hyphens: 'none' })

      // Check priorities are reasonable for application order
      expect(lineClampMod.priority).toBeGreaterThan(0)
      expect(wordBreakMod.priority).toBeGreaterThan(0)
      expect(overflowWrapMod.priority).toBeGreaterThan(wordBreakMod.priority)
      expect(hyphensMod.priority).toBeGreaterThan(overflowWrapMod.priority)
    })
  })
})