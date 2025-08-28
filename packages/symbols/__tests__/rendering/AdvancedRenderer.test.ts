/**
 * Tests for Advanced Symbol Renderer (Phase 2)
 */

import { describe, test, expect, beforeEach } from 'vitest'
import { AdvancedSymbolRenderer } from '../../src/rendering/AdvancedRenderer.js'
import type { IconDefinition, SymbolRenderingMode } from '../../src/types.js'

describe('AdvancedSymbolRenderer', () => {
  const mockIcon: IconDefinition = {
    name: 'heart',
    variant: 'none',
    weight: 'regular',
    svg: '<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>',
    viewBox: '0 0 24 24',
  }

  describe('Monochrome Rendering', () => {
    test('should render symbol in monochrome mode', () => {
      const context = {
        primaryColor: '#ff0000',
        scale: 24,
        mode: 'monochrome' as SymbolRenderingMode
      }

      const result = AdvancedSymbolRenderer.render(mockIcon, context)

      expect(result.svg).toContain('fill="#ff0000"')
      expect(result.classes).toContain('tachui-symbol--monochrome')
      expect(result.styles.color).toBe('#ff0000')
      expect(result.styles.width).toBe('24px')
      expect(result.styles.height).toBe('24px')
    })

    test('should apply opacity in monochrome mode', () => {
      const context = {
        primaryColor: '#ff0000',
        scale: 24,
        mode: 'monochrome' as SymbolRenderingMode,
        opacity: 0.7
      }

      const result = AdvancedSymbolRenderer.render(mockIcon, context)

      expect(result.styles.opacity).toBe('0.7')
    })
  })

  describe('Hierarchical Rendering', () => {
    test('should render symbol in hierarchical mode', () => {
      const context = {
        primaryColor: '#3366cc',
        scale: 32,
        mode: 'hierarchical' as SymbolRenderingMode
      }

      const result = AdvancedSymbolRenderer.render(mockIcon, context)

      expect(result.classes).toContain('tachui-symbol--hierarchical')
      expect(result.styles['--symbol-primary']).toBe('#3366cc')
      expect(result.styles['--symbol-secondary']).toBeDefined()
      expect(result.styles['--symbol-tertiary']).toBeDefined()
      expect(result.styles.width).toBe('32px')
      expect(result.styles.height).toBe('32px')
    })

    test('should generate opacity-adjusted secondary and tertiary colors', () => {
      const context = {
        primaryColor: '#ff0000',
        scale: 24,
        mode: 'hierarchical' as SymbolRenderingMode
      }

      const result = AdvancedSymbolRenderer.render(mockIcon, context)

      expect(result.styles['--symbol-secondary']).toContain('rgba(255, 0, 0, 0.68)')
      expect(result.styles['--symbol-tertiary']).toContain('rgba(255, 0, 0, 0.32)')
    })
  })

  describe('Palette Rendering', () => {
    test('should render symbol in palette mode with custom colors', () => {
      const context = {
        primaryColor: '#ff0000',
        secondaryColor: '#00ff00',
        tertiaryColor: '#0000ff',
        scale: 24,
        mode: 'palette' as SymbolRenderingMode
      }

      const result = AdvancedSymbolRenderer.render(mockIcon, context)

      expect(result.classes).toContain('tachui-symbol--palette')
      expect(result.styles['--symbol-primary']).toBe('#ff0000')
      expect(result.styles['--symbol-secondary']).toBe('#00ff00')
      expect(result.styles['--symbol-tertiary']).toBe('#0000ff')
    })

    test('should generate secondary and tertiary colors when not provided', () => {
      const context = {
        primaryColor: '#ff0000',
        scale: 24,
        mode: 'palette' as SymbolRenderingMode
      }

      const result = AdvancedSymbolRenderer.render(mockIcon, context)

      expect(result.styles['--symbol-primary']).toBe('#ff0000')
      expect(result.styles['--symbol-secondary']).toBeDefined()
      expect(result.styles['--symbol-secondary']).not.toBe('#ff0000')
      expect(result.styles['--symbol-tertiary']).toBeDefined()
      expect(result.styles['--symbol-tertiary']).not.toBe('#ff0000')
    })
  })

  describe('Multicolor Rendering', () => {
    test('should render symbol in multicolor mode preserving original colors', () => {
      const context = {
        primaryColor: '#ff0000',
        scale: 24,
        mode: 'multicolor' as SymbolRenderingMode
      }

      const result = AdvancedSymbolRenderer.render(mockIcon, context)

      expect(result.classes).toContain('tachui-symbol--multicolor')
      expect(result.svg).toBe(mockIcon.svg) // Should preserve original SVG
    })

    test('should apply opacity to multicolor symbols', () => {
      const context = {
        primaryColor: '#ff0000',
        scale: 24,
        mode: 'multicolor' as SymbolRenderingMode,
        opacity: 0.8
      }

      const result = AdvancedSymbolRenderer.render(mockIcon, context)

      expect(result.styles.opacity).toBe('0.8')
    })
  })

  describe('Scale Handling', () => {
    test('should handle different scale sizes correctly', () => {
      const testCases = [
        { scale: 16, expectedClass: 'tachui-symbol--scale-small' },
        { scale: 24, expectedClass: 'tachui-symbol--scale-medium' },
        { scale: 32, expectedClass: 'tachui-symbol--scale-large' },
        { scale: 48, expectedClass: 'tachui-symbol--scale-xlarge' },
      ]

      testCases.forEach(({ scale, expectedClass }) => {
        const context = {
          primaryColor: '#000000',
          scale,
          mode: 'monochrome' as SymbolRenderingMode
        }

        const result = AdvancedSymbolRenderer.render(mockIcon, context)

        expect(result.classes).toContain(expectedClass)
        expect(result.styles.width).toBe(`${scale}px`)
        expect(result.styles.height).toBe(`${scale}px`)
      })
    })
  })

  describe('Accessibility', () => {
    test('should generate proper accessibility attributes', () => {
      const context = {
        primaryColor: '#ff0000',
        scale: 24,
        mode: 'monochrome' as SymbolRenderingMode
      }

      const result = AdvancedSymbolRenderer.render(mockIcon, context)

      expect(result.accessibility).toHaveProperty('role', 'img')
      expect(result.accessibility).toHaveProperty('aria-hidden', 'true')
      expect(result.accessibility).toHaveProperty('focusable', 'false')
      expect(result.accessibility).toHaveProperty('data-icon', 'heart')
      expect(result.accessibility).toHaveProperty('data-variant', 'none')
      expect(result.accessibility).toHaveProperty('data-rendering-mode', 'monochrome')
    })
  })

  describe('Color Generation', () => {
    test('should generate valid secondary colors from hex primary colors', () => {
      const context = {
        primaryColor: '#ff0000',
        scale: 24,
        mode: 'palette' as SymbolRenderingMode
      }

      const result = AdvancedSymbolRenderer.render(mockIcon, context)

      // Secondary should be a valid hex color different from primary
      expect(result.styles['--symbol-secondary']).toMatch(/^#[0-9a-fA-F]{6}$/)
      expect(result.styles['--symbol-secondary']).not.toBe('#ff0000')
    })

    test('should generate valid tertiary colors from hex primary colors', () => {
      const context = {
        primaryColor: '#3366cc',
        scale: 24,
        mode: 'palette' as SymbolRenderingMode
      }

      const result = AdvancedSymbolRenderer.render(mockIcon, context)

      // Tertiary should be a valid hex color different from primary
      expect(result.styles['--symbol-tertiary']).toMatch(/^#[0-9a-fA-F]{6}$/)
      expect(result.styles['--symbol-tertiary']).not.toBe('#3366cc')
    })
  })

  describe('SVG Processing', () => {
    test('should process SVG for monochrome correctly', () => {
      const svgWithColors = '<path d="test" fill="blue" stroke="red"/><circle fill="green"/>'
      const mockIconWithColors = { ...mockIcon, svg: svgWithColors }

      const context = {
        primaryColor: '#ff0000',
        scale: 24,
        mode: 'monochrome' as SymbolRenderingMode
      }

      const result = AdvancedSymbolRenderer.render(mockIconWithColors, context)

      expect(result.svg).toContain('fill="#ff0000"')
      expect(result.svg).toContain('stroke="none"')
      expect(result.svg).not.toContain('fill="blue"')
      expect(result.svg).not.toContain('fill="green"')
    })

    test('should preserve complex SVG structure while processing colors', () => {
      const complexSvg = '<g><path d="test1"/><g><circle r="5"/></g></g>'
      const mockComplexIcon = { ...mockIcon, svg: complexSvg }

      const context = {
        primaryColor: '#000000',
        scale: 24,
        mode: 'monochrome' as SymbolRenderingMode
      }

      const result = AdvancedSymbolRenderer.render(mockComplexIcon, context)

      expect(result.svg).toContain('<g>')
      expect(result.svg).toContain('</g>')
      expect(result.svg).toContain('path')
      expect(result.svg).toContain('circle')
    })
  })

  describe('Error Handling', () => {
    test('should handle missing colors gracefully', () => {
      const context = {
        primaryColor: '',
        scale: 24,
        mode: 'monochrome' as SymbolRenderingMode
      }

      expect(() => {
        AdvancedSymbolRenderer.render(mockIcon, context)
      }).not.toThrow()
    })

    test('should handle invalid scale values', () => {
      const context = {
        primaryColor: '#ff0000',
        scale: 0,
        mode: 'monochrome' as SymbolRenderingMode
      }

      const result = AdvancedSymbolRenderer.render(mockIcon, context)

      expect(result.styles.width).toBe('0px')
      expect(result.styles.height).toBe('0px')
    })
  })
})