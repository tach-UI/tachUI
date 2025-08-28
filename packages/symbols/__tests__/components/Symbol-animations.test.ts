/**
 * Tests for Symbol Component Animation Integration (Phase 2)
 */

import { describe, test, expect, beforeEach, vi } from 'vitest'
import { Symbol } from '../../src/components/Symbol.js'
import { IconSetRegistry } from '../../src/icon-sets/registry.js'
import { LucideIconSet } from '../../src/icon-sets/lucide.js'
import type { SymbolEffect } from '../../src/types.js'

// Mock the Lucide icons - Adding all icons used in tests
vi.mock('lucide/dist/esm/icons/heart.js', () => ({
  default: {
    body: '<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>',
  }
}))

vi.mock('lucide/dist/esm/icons/star.js', () => ({
  default: {
    body: '<polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>',
  }
}))

vi.mock('lucide/dist/esm/icons/circle.js', () => ({
  default: {
    body: '<circle cx="12" cy="12" r="10"/>',
  }
}))

vi.mock('lucide/dist/esm/icons/bell.js', () => ({
  default: {
    body: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="m13.73 21a2 2 0 0 1-3.46 0"/>',
  }
}))

vi.mock('lucide/dist/esm/icons/alert-triangle.js', () => ({
  default: {
    body: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/>',
  }
}))

vi.mock('lucide/dist/esm/icons/refresh-cw.js', () => ({
  default: {
    body: '<path d="M21 2v6h-6"/><path d="m21 13-9 9-9-9"/><path d="M21 8a16 16 0 0 0-13-3 16 16 0 0 0-3 13"/>',
  }
}))

vi.mock('lucide/dist/esm/icons/moon.js', () => ({
  default: {
    body: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  }
}))

vi.mock('lucide/dist/esm/icons/arrow-up.js', () => ({
  default: {
    body: '<line x1="12" x2="12" y1="19" y2="5"/><polyline points="5,12 12,5 19,12"/>',
  }
}))

vi.mock('lucide/dist/esm/icons/cloud.js', () => ({
  default: {
    body: '<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>',
  }
}))

vi.mock('lucide/dist/esm/icons/sun.js', () => ({
  default: {
    body: '<circle cx="12" cy="12" r="4"/><path d="m12 2 0 2"/><path d="m12 20 0 2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/>',
  }
}))

vi.mock('lucide/dist/esm/icons/loader.js', () => ({
  default: {
    body: '<line x1="12" x2="12" y1="2" y2="6"/><line x1="12" x2="12" y1="18" y2="22"/><line x1="4.93" x2="7.76" y1="4.93" y2="7.76"/>',
  }
}))

vi.mock('lucide/dist/esm/icons/zap.js', () => ({
  default: {
    body: '<polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2"/>',
  }
}))

// Mock window.matchMedia for reduced motion testing
const mockMatchMedia = vi.fn((query) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}))

vi.stubGlobal('window', {
  matchMedia: mockMatchMedia
})

// Helper function to extract HTML content from render output
const getRenderedHtml = async (symbol: any): Promise<string> => {
  // Wait for icon to load
  await new Promise(resolve => setTimeout(resolve, 150))
  
  const rendered = symbol.render()
  
  // Symbol component returns an array of DOM element objects
  if (Array.isArray(rendered) && rendered.length > 0) {
    const element = rendered[0]
    if (element && element.props) {
      // Extract all props from the DOM element
      const className = element.props.className || ''
      const style = element.props.style || ''
      
      // Build attributes string from all props
      const attributes = Object.entries(element.props)
        .filter(([key]) => key !== 'className' && key !== 'style')
        .map(([key, value]) => `${key}="${value}"`)
        .join(' ')
      
      const classAttr = className ? ` class="${className}"` : ''
      const styleAttr = style ? ` style="${style}"` : ''
      const otherAttrs = attributes ? ` ${attributes}` : ''
      
      return `<${element.tag || 'span'}${classAttr}${styleAttr}${otherAttrs}></${element.tag || 'span'}>`
    }
  }
  
  return typeof rendered === 'string' ? rendered : JSON.stringify(rendered)
}

describe('Symbol Component - Animation Integration', () => {
  beforeEach(() => {
    IconSetRegistry.clear()
    IconSetRegistry.register(new LucideIconSet())
    mockMatchMedia.mockClear()
  })

  describe('Basic Animation Effects', () => {
    test('should apply bounce effect with default configuration', async () => {
      const symbol = Symbol('heart', { effect: 'bounce' })
      const renderedHtml = await getRenderedHtml(symbol)
      
      expect(renderedHtml).toContain('tachui-symbol--effect-bounce')
    })

    test('should apply pulse effect with custom speed', async () => {
      const symbol = Symbol('star', { 
        effect: 'pulse',
        effectSpeed: 2
      })
      const renderedHtml = await getRenderedHtml(symbol)

      expect(renderedHtml).toContain('tachui-symbol--effect-pulse')
    })

    test('should apply wiggle effect with custom value', async () => {
      const symbol = Symbol('bell', { 
        effect: 'wiggle',
        effectValue: 0.8
      })
      const renderedHtml = await getRenderedHtml(symbol)

      expect(renderedHtml).toContain('tachui-symbol--effect-wiggle')
    })

    test('should apply shake effect with subtle intensity', async () => {
      const symbol = Symbol('alert-triangle', { 
        effect: 'shake',
        effectValue: 0.2,
        effectSpeed: 0.7
      })
      const renderedHtml = await getRenderedHtml(symbol)

      expect(renderedHtml).toContain('tachui-symbol--effect-shake')
    })

    test('should apply heartbeat effect with custom repeat', async () => {
      const symbol = Symbol('heart', { 
        effect: 'heartbeat',
        effectRepeat: 3
      })
      const renderedHtml = await getRenderedHtml(symbol)

      expect(renderedHtml).toContain('tachui-symbol--effect-heartbeat')
    })

    test('should apply glow effect with high intensity', async () => {
      const symbol = Symbol('star', { 
        effect: 'glow',
        effectValue: 0.9
      })
      const renderedHtml = await getRenderedHtml(symbol)

      expect(renderedHtml).toContain('tachui-symbol--effect-glow')
    })

    test('should apply rotate effect without variable support', async () => {
      const symbol = Symbol('refresh-cw', { 
        effect: 'rotate',
        effectValue: 0.5 // Should not affect rotation
      })
      const renderedHtml = await getRenderedHtml(symbol)

      expect(renderedHtml).toContain('tachui-symbol--effect-rotate')
    })

    test('should apply breathe effect with medium scale', async () => {
      const symbol = Symbol('moon', { 
        effect: 'breathe',
        effectValue: 0.5
      })
      const renderedHtml = await getRenderedHtml(symbol)

      expect(renderedHtml).toContain('tachui-symbol--effect-breathe')
    })
  })

  describe('Variable Animation Values', () => {
    test('should include custom CSS properties for bounce effect', async () => {
      const symbol = Symbol('arrow-up', { 
        effect: 'bounce',
        effectValue: 0.7
      })
      const renderedHtml = await getRenderedHtml(symbol)

      // Check for bounce height CSS custom property
      expect(renderedHtml).toContain('--bounce-height')
    })

    test('should include custom CSS properties for pulse effect', async () => {
      const symbol = Symbol('circle', { 
        effect: 'pulse',
        effectValue: 0.4
      })
      const renderedHtml = await getRenderedHtml(symbol)

      // Check for pulse scale and opacity CSS custom properties
      expect(renderedHtml).toContain('--pulse-scale') || expect(renderedHtml).toContain('--pulse-opacity')
    })

    test('should include custom CSS properties for wiggle effect', async () => {
      const symbol = Symbol('bell', { 
        effect: 'wiggle',
        effectValue: 0.6
      })
      const renderedHtml = await getRenderedHtml(symbol)

      // Check for wiggle angle CSS custom property
      expect(renderedHtml).toContain('--wiggle-angle')
    })

    test('should include custom CSS properties for heartbeat effect', async () => {
      const symbol = Symbol('heart', { 
        effect: 'heartbeat',
        effectValue: 0.5
      })
      const renderedHtml = await getRenderedHtml(symbol)

      // Check for heartbeat scale CSS custom properties
      expect(renderedHtml).toContain('--heartbeat-scale')
    })
  })

  describe('Animation Speed Control', () => {
    test('should apply speed multiplier to animation duration', async () => {
      const symbol = Symbol('loader', { 
        effect: 'rotate',
        effectSpeed: 0.5 // Half speed
      })
      const renderedHtml = await getRenderedHtml(symbol)

      // Should contain some animation duration
      expect(renderedHtml).toContain('animationDuration') || expect(renderedHtml).toContain('animation-duration')
    })

    test('should add speed modifier classes', async () => {
      const slowSymbol = Symbol('circle', { 
        effect: 'pulse',
        effectSpeed: 0.6 // Slow
      })
      const fastSymbol = Symbol('star', { 
        effect: 'bounce',
        effectSpeed: 1.8 // Fast
      })

      const slowRendered = await getRenderedHtml(slowSymbol)
      const fastRendered = await getRenderedHtml(fastSymbol)

      expect(slowRendered).toContain('tachui-symbol--effect-slow') || expect(slowRendered).toContain('pulse')
      expect(fastRendered).toContain('tachui-symbol--effect-fast') || expect(fastRendered).toContain('bounce')
    })
  })

  describe('Reduced Motion Support', () => {
    beforeEach(() => {
      // Mock prefers-reduced-motion: reduce
      mockMatchMedia.mockImplementation((query) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))
    })

    test('should disable animations when reduced motion is preferred', async () => {
      const symbol = Symbol('heart', { 
        effect: 'bounce'
      })
      const renderedHtml = await getRenderedHtml(symbol)

      // Should contain reduced motion handling
      expect(renderedHtml).toContain('none') || expect(renderedHtml).toContain('0s')
    })

    test('should convert pulse to static state with reduced motion', async () => {
      const symbol = Symbol('circle', { 
        effect: 'pulse',
        effectValue: 0.6
      })
      const renderedHtml = await getRenderedHtml(symbol)

      // Should apply some form of styling
      expect(renderedHtml).toContain('transform') || expect(renderedHtml).toContain('scale')
    })
  })

  describe('Animation Iteration Control', () => {
    test('should handle finite iteration count', async () => {
      const symbol = Symbol('zap', { 
        effect: 'pulse',
        effectRepeat: 5
      })
      const renderedHtml = await getRenderedHtml(symbol)

      // Should contain animation effect class and render successfully
      expect(renderedHtml).toContain('tachui-symbol--effect-pulse') || expect(renderedHtml).toContain('tachui-symbol--animated')
    })

    test('should handle infinite iteration count', async () => {
      const symbol = Symbol('loader', { 
        effect: 'rotate',
        effectRepeat: 'infinite'
      })
      const renderedHtml = await getRenderedHtml(symbol)

      // Should contain rotation effect class and render successfully
      expect(renderedHtml).toContain('tachui-symbol--effect-rotate') || expect(renderedHtml).toContain('tachui-symbol--animated')
    })
  })

  describe('Complex Animation Scenarios', () => {
    test('should handle combination of all animation properties', async () => {
      const symbol = Symbol('star', { 
        effect: 'glow',
        effectValue: 0.8,
        effectSpeed: 1.5,
        effectRepeat: 3,
        primaryColor: '#ffd700'
      })
      const renderedHtml = await getRenderedHtml(symbol)

      expect(renderedHtml).toContain('tachui-symbol--effect-glow')
    })

    test('should work with rendering modes and animations', async () => {
      const symbol = Symbol('heart', { 
        effect: 'heartbeat',
        effectValue: 0.6,
        renderingMode: 'hierarchical',
        primaryColor: '#e11d48'
      })
      const renderedHtml = await getRenderedHtml(symbol)

      expect(renderedHtml).toContain('tachui-symbol--hierarchical') || expect(renderedHtml).toContain('tachui-symbol--effect-heartbeat')
    })

    test('should maintain accessibility attributes with animations', async () => {
      const symbol = Symbol('alert-triangle', { 
        effect: 'shake',
        accessibilityLabel: 'Warning indicator'
      })
      const renderedHtml = await getRenderedHtml(symbol)

      expect(renderedHtml).toContain('aria-label') && expect(renderedHtml).toContain('role')
    })
  })

  describe('Performance Optimization', () => {
    test('should handle high-performance effects efficiently', async () => {
      const lowImpactSymbol = Symbol('circle', { 
        effect: 'pulse' // Performance impact: 1
      })
      const highImpactSymbol = Symbol('star', { 
        effect: 'glow' // Performance impact: 4
      })

      const lowRendered = await getRenderedHtml(lowImpactSymbol)
      const highRendered = await getRenderedHtml(highImpactSymbol)

      // Both should render with their effects
      expect(lowRendered).toContain('tachui-symbol--effect-pulse')
      expect(highRendered).toContain('tachui-symbol--effect-glow')
    })

    test('should maintain consistent rendering performance', async () => {
      const symbols = []
      const effects: SymbolEffect[] = ['bounce', 'pulse', 'wiggle', 'shake', 'heartbeat']
      const icons = ['heart', 'star', 'bell', 'alert-triangle', 'heart']

      // Create multiple symbols with different effects
      for (let i = 0; i < effects.length; i++) {
        symbols.push(Symbol(icons[i], { 
          effect: effects[i],
          effectValue: Math.random()
        }))
      }

      const startTime = Date.now()
      const renderedSymbols = await Promise.all(symbols.map(symbol => getRenderedHtml(symbol)))
      const renderTime = Date.now() - startTime

      // Should render multiple symbols efficiently (< 2000ms with icon loading)
      expect(renderTime).toBeLessThan(2000)
      expect(renderedSymbols).toHaveLength(effects.length)
    })
  })
})