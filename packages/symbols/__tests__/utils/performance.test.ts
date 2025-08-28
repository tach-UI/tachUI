import { describe, test, expect, beforeEach, vi } from 'vitest'
import { OptimizedSVGRenderer, getIconBundleSize, optimizeSVG, minifySVG } from '../../src/utils/performance.js'
import { IconRenderingStrategy } from '../../src/types.js'
import type { IconDefinition } from '../../src/types.js'

// Mock DOM methods
Object.assign(global, {
  document: {
    createElement: vi.fn(() => ({
      id: '',
      style: {},
      setAttribute: vi.fn(),
      innerHTML: '',
      appendChild: vi.fn(),
    })),
    body: {
      insertBefore: vi.fn(),
      firstChild: null,
    },
    getElementById: vi.fn(() => null),
  },
})

describe('OptimizedSVGRenderer', () => {
  const mockIcon: IconDefinition = {
    name: 'heart',
    variant: 'none',
    weight: 'regular',
    svg: '<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>',
    viewBox: '0 0 24 24',
  }

  beforeEach(() => {
    OptimizedSVGRenderer.clearCache()
    OptimizedSVGRenderer.resetSpriteSheet()
    vi.clearAllMocks()
  })

  describe('Inline SVG Rendering', () => {
    test('renders inline SVG with default props', () => {
      const result = OptimizedSVGRenderer.render(mockIcon, IconRenderingStrategy.INLINE_SVG)
      
      expect(result).toContain('<svg')
      expect(result).toContain('width="24"')
      expect(result).toContain('height="24"')
      expect(result).toContain('viewBox="0 0 24 24"')
      expect(result).toContain('fill="none"')
      expect(result).toContain('stroke="currentColor"')
      expect(result).toContain(mockIcon.svg)
    })

    test('renders inline SVG with custom size', () => {
      const result = OptimizedSVGRenderer.render(
        mockIcon, 
        IconRenderingStrategy.INLINE_SVG, 
        { size: 32 }
      )
      
      expect(result).toContain('width="32"')
      expect(result).toContain('height="32"')
    })

    test('renders inline SVG with custom color', () => {
      const result = OptimizedSVGRenderer.render(
        mockIcon, 
        IconRenderingStrategy.INLINE_SVG, 
        { color: '#ff0000' }
      )
      
      expect(result).toContain('stroke="#ff0000"')
    })

    test('includes accessibility attributes', () => {
      const result = OptimizedSVGRenderer.render(mockIcon, IconRenderingStrategy.INLINE_SVG)
      
      expect(result).toContain('aria-hidden="true"')
      expect(result).toContain('focusable="false"')
    })
  })

  describe('SVG Use Rendering', () => {
    test('renders SVG use element', () => {
      const result = OptimizedSVGRenderer.render(mockIcon, IconRenderingStrategy.SVG_USE)
      
      expect(result).toContain('<svg')
      expect(result).toContain('<use href="#icon-heart-none"')
      expect(result).toContain('fill="currentColor"')
    })

    test('creates symbol definition', () => {
      OptimizedSVGRenderer.render(mockIcon, IconRenderingStrategy.SVG_USE)
      
      // Should create symbol definition in DOM
      expect(document.createElement).toHaveBeenCalledWith('symbol')
    })

    test('reuses existing symbol definition', () => {
      // First render creates the symbol
      OptimizedSVGRenderer.render(mockIcon, IconRenderingStrategy.SVG_USE)
      const createCallCount = (document.createElement as any).mock.calls.length
      
      // Second render should reuse
      OptimizedSVGRenderer.render(mockIcon, IconRenderingStrategy.SVG_USE)
      expect((document.createElement as any).mock.calls.length).toBe(createCallCount)
    })
  })

  describe('Sprite Sheet Rendering', () => {
    test('renders sprite sheet reference', () => {
      const result = OptimizedSVGRenderer.render(mockIcon, IconRenderingStrategy.SPRITE_SHEET)
      
      expect(result).toContain('<svg')
      expect(result).toContain('<use href="#sprite-heart-none"')
    })

    test('creates sprite sheet container', () => {
      OptimizedSVGRenderer.render(mockIcon, IconRenderingStrategy.SPRITE_SHEET)
      
      expect(document.createElement).toHaveBeenCalledWith('div')
    })
  })

  describe('Caching', () => {
    test('caches rendered SVG', () => {
      const result1 = OptimizedSVGRenderer.render(mockIcon, IconRenderingStrategy.INLINE_SVG)
      const result2 = OptimizedSVGRenderer.render(mockIcon, IconRenderingStrategy.INLINE_SVG)
      
      expect(result1).toBe(result2)
    })

    test('different props create different cache entries', () => {
      const result1 = OptimizedSVGRenderer.render(
        mockIcon, 
        IconRenderingStrategy.INLINE_SVG, 
        { size: 24 }
      )
      const result2 = OptimizedSVGRenderer.render(
        mockIcon, 
        IconRenderingStrategy.INLINE_SVG, 
        { size: 32 }
      )
      
      expect(result1).not.toBe(result2)
    })

    test('different strategies create different cache entries', () => {
      const result1 = OptimizedSVGRenderer.render(mockIcon, IconRenderingStrategy.INLINE_SVG)
      const result2 = OptimizedSVGRenderer.render(mockIcon, IconRenderingStrategy.SVG_USE)
      
      expect(result1).not.toBe(result2)
    })

    test('clears cache correctly', () => {
      OptimizedSVGRenderer.render(mockIcon, IconRenderingStrategy.INLINE_SVG)
      expect(OptimizedSVGRenderer.getCacheSize()).toBeGreaterThan(0)
      
      OptimizedSVGRenderer.clearCache()
      expect(OptimizedSVGRenderer.getCacheSize()).toBe(0)
    })
  })

  describe('Preloading', () => {
    test('preloads icon', () => {
      OptimizedSVGRenderer.preloadIcon(mockIcon)
      
      expect(OptimizedSVGRenderer.getCacheSize()).toBe(1)
    })
  })

  describe('Default Strategy', () => {
    test('defaults to inline SVG', () => {
      const result = OptimizedSVGRenderer.render(mockIcon)
      
      expect(result).toContain('<svg')
      expect(result).toContain(mockIcon.svg)
    })
  })
})

describe('BundleOptimizer', () => {
  describe('Bundle Size Estimation', () => {
    test('estimates bundle size for icon list', async () => {
      const icons = ['heart', 'star', 'user']
      const size = await getIconBundleSize(icons)
      
      expect(typeof size).toBe('number')
      expect(size).toBeGreaterThan(0)
      expect(size).toBe(2000 + (3 * 500)) // Base + per-icon
    })

    test('handles empty icon list', async () => {
      const size = await getIconBundleSize([])
      
      expect(size).toBe(2000) // Just base size
    })

    test('scales with number of icons', async () => {
      const size1 = await getIconBundleSize(['heart'])
      const size2 = await getIconBundleSize(['heart', 'star'])
      
      expect(size2).toBeGreaterThan(size1)
      expect(size2 - size1).toBe(500) // One icon difference
    })
  })

  describe('SVG Optimization', () => {
    test('normalizes whitespace', () => {
      const svg = '<path   d="M12 21.35"    fill="none"  />'
      const optimized = optimizeSVG(svg)
      
      expect(optimized).toBe('<path d="M12 21.35" fill="none" />')
    })

    test('removes whitespace between tags', () => {
      const svg = '<svg> <path d="M12 21.35"/> </svg>'
      const optimized = optimizeSVG(svg)
      
      expect(optimized).toBe('<svg><path d="M12 21.35"/></svg>')
    })

    test('normalizes attribute spacing', () => {
      const svg = '<path d = "M12 21.35"  fill = "none" />'
      const optimized = optimizeSVG(svg)
      
      expect(optimized).toBe('<path d="M12 21.35" fill="none" />')
    })

    test('trims leading and trailing whitespace', () => {
      const svg = '  <path d="M12 21.35"/>  '
      const optimized = optimizeSVG(svg)
      
      expect(optimized).toBe('<path d="M12 21.35"/>')
    })
  })

  describe('SVG Minification', () => {
    test('removes comments', () => {
      const svg = '<svg><!-- This is a comment --><path d="M12 21.35"/></svg>'
      const minified = minifySVG(svg)
      
      expect(minified).not.toContain('<!--')
      expect(minified).not.toContain('-->')
      expect(minified).toContain('<path d="M12 21.35"/>')
    })

    test('removes redundant fill="none"', () => {
      const svg = '<svg><path d="M12 21.35" fill="none"/></svg>'
      const minified = minifySVG(svg)
      
      expect(minified).toBe('<svg><path d="M12 21.35"/></svg>')
    })

    test('removes default stroke-width', () => {
      const svg = '<svg><path d="M12 21.35" stroke-width="2"/></svg>'
      const minified = minifySVG(svg)
      
      expect(minified).toBe('<svg><path d="M12 21.35"/></svg>')
    })

    test('removes default stroke attributes', () => {
      const svg = '<svg><path d="M12 21.35" stroke-linecap="round" stroke-linejoin="round"/></svg>'
      const minified = minifySVG(svg)
      
      expect(minified).toBe('<svg><path d="M12 21.35"/></svg>')
    })

    test('preserves essential attributes', () => {
      const svg = '<svg><path d="M12 21.35" fill="red" stroke="blue"/></svg>'
      const minified = minifySVG(svg)
      
      expect(minified).toContain('fill="red"')
      expect(minified).toContain('stroke="blue"')
    })

    test('handles complex SVG', () => {
      const svg = `
        <!-- SVG comment -->
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <!-- Path comment -->
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5"/>
          <path d="M16.5 3c1.74 0 3.41.81 4.5 2.09" fill="none"/>
        </svg>
      `
      
      const minified = minifySVG(svg)
      
      expect(minified).not.toContain('<!--')
      expect(minified).not.toContain('stroke-width="2"')
      expect(minified).not.toContain('stroke-linecap="round"')
      expect(minified).not.toContain('stroke-linejoin="round"')
      expect(minified).not.toContain('fill="none"')
      expect(minified).toContain('viewBox="0 0 24 24"')
      expect(minified).toContain('stroke="currentColor"')
      expect(minified).toContain('path d="M12 21.35')
    })
  })

  describe('Edge Cases', () => {
    test('handles empty SVG', () => {
      const optimized = optimizeSVG('')
      const minified = minifySVG('')
      
      expect(optimized).toBe('')
      expect(minified).toBe('')
    })

    test('handles malformed SVG gracefully', () => {
      const svg = '<svg><path d="broken'
      const optimized = optimizeSVG(svg)
      
      expect(typeof optimized).toBe('string')
      expect(optimized.length).toBeGreaterThan(0)
    })
  })
})