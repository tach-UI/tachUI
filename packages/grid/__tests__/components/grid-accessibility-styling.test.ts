/**
 * Tests for Grid Accessibility and Advanced Styling (Phase 3)
 */

import { beforeEach, describe, expect, it } from 'vitest'
import {
  LazyVGrid,
  LazyHGrid,
  Grid,
  GridItem,
  GridAccessibility,
  GridStyling,
  GridCSSGenerator,
  type GridAccessibilityConfig,
  type GridStylingConfig,
} from '../../src/components/Grid'
import { Text } from '@tachui/primitives'

describe('Grid Accessibility Features', () => {
  describe('GridAccessibilityConfig Interface', () => {
    it('should support comprehensive accessibility configuration', () => {
      const config: GridAccessibilityConfig = {
        label: 'Product Grid',
        description: 'Grid of product cards',
        role: 'grid',
        keyboardNavigation: {
          enabled: true,
          mode: 'grid',
          pageNavigation: true,
          homeEndNavigation: true,
        },
        focusManagement: {
          enabled: true,
          trapFocus: true,
          skipLinks: true,
        },
        screenReader: {
          enabled: true,
          announceChanges: true,
          announceStructure: true,
        },
        reducedMotion: {
          respectPreference: true,
          fallbackBehavior: 'disable',
        },
      }

      expect(config.label).toBe('Product Grid')
      expect(config.keyboardNavigation).toBeDefined()
      expect(config.screenReader).toBeDefined()
    })
  })

  describe('GridCSSGenerator Accessibility Methods', () => {
    it('should generate proper accessibility attributes', () => {
      const accessibility: GridAccessibilityConfig = {
        label: 'Test Grid',
        description: 'Test Description',
        role: 'grid',
        keyboardNavigation: true,
        screenReader: { announceStructure: true },
      }

      const attrs = GridCSSGenerator.generateAccessibilityAttributes(
        accessibility,
        'lazy-vgrid',
        3, // column count
        2 // row count
      )

      expect(attrs.role).toBe('grid')
      expect(attrs['aria-label']).toBe('Test Grid')
      expect(attrs['aria-describedby']).toBe('Test Description')
      expect(attrs['aria-colcount']).toBe(3)
      expect(attrs['aria-rowcount']).toBe(2)
      expect(attrs.tabIndex).toBe(0)
    })

    it('should generate keyboard navigation attributes', () => {
      const accessibility: GridAccessibilityConfig = {
        label: 'Keyboard Grid',
        keyboardNavigation: {
          enabled: true,
          mode: 'grid',
          pageNavigation: true,
          homeEndNavigation: true,
        },
      }

      const attrs = GridCSSGenerator.generateAccessibilityAttributes(
        accessibility,
        'grid'
      )

      expect(attrs['data-keyboard-navigation']).toBe('grid')
      expect(attrs['data-page-navigation']).toBe(true)
      expect(attrs['data-home-end-navigation']).toBe(true)
    })

    it('should generate reduced motion CSS', () => {
      const accessibility: GridAccessibilityConfig = {
        label: 'Motion Grid',
        reducedMotion: {
          respectPreference: true,
          fallbackBehavior: 'reduce',
        },
      }

      const css = GridCSSGenerator.generateReducedMotionCSS(accessibility)

      expect(css['@media (prefers-reduced-motion: reduce)']).toContain(
        'transition-duration: 0.1s'
      )
    })
  })

  describe('GridAccessibility Preset Functions', () => {
    it('should create full accessibility configuration', () => {
      const config = GridAccessibility.full(
        'Product Grid',
        'A grid of products'
      )

      expect(config.label).toBe('Product Grid')
      expect(config.description).toBe('A grid of products')
      expect(config.keyboardNavigation).toBeDefined()
      expect(config.screenReader).toBeDefined()
      expect(config.focusManagement).toBeDefined()
      expect(config.reducedMotion).toBeDefined()
    })

    it('should create basic accessibility configuration', () => {
      const config = GridAccessibility.basic('Simple Grid')

      expect(config.label).toBe('Simple Grid')
      expect(config.keyboardNavigation).toBe(true)
      expect(config.reducedMotion).toBe(true)
    })

    it('should create screen reader focused configuration', () => {
      const config = GridAccessibility.screenReader('Data Grid')

      expect(config.label).toBe('Data Grid')
      expect(config.role).toBe('grid')
      expect(config.screenReader?.enabled).toBe(true)
    })

    it('should create keyboard-only configuration', () => {
      const config = GridAccessibility.keyboardOnly('Navigation Grid')

      expect(config.label).toBe('Navigation Grid')
      expect(config.keyboardNavigation?.enabled).toBe(true)
      expect(config.focusManagement?.enabled).toBe(true)
    })
  })

  describe('Grid Components with Accessibility', () => {
    it('should apply accessibility attributes to LazyVGrid', () => {
      const accessibility = GridAccessibility.basic('Product Grid')

      const grid = LazyVGrid({
        columns: [GridItem.flexible(), GridItem.flexible()],
        children: [Text('Item 1'), Text('Item 2')],
        accessibility,
      })

      const rendered = grid.render()
      const element = rendered[0]

      expect(element.props['aria-label']).toBe('Product Grid')
      expect(element.props.tabIndex).toBe(0)
    })

    it('should apply accessibility attributes to Grid', () => {
      const accessibility = GridAccessibility.screenReader('Data Grid')

      const grid = Grid({
        children: [Text('Item 1')],
        accessibility,
      })

      const rendered = grid.render()
      const element = rendered[0]

      expect(element.props.role).toBe('grid')
      expect(element.props['aria-label']).toBe('Data Grid')
    })
  })
})

describe('Grid Advanced Styling Features', () => {
  describe('GridStylingConfig Interface', () => {
    it('should support comprehensive styling configuration', () => {
      const config: GridStylingConfig = {
        templateAreas: ['header header', 'sidebar main'],
        advancedGap: {
          row: { sm: 10, md: 20 },
          column: 15,
        },
        debug: {
          enabled: true,
          showLines: true,
          showAreas: true,
          lineColor: '#ff0000',
        },
        itemStates: {
          hover: {
            enabled: true,
            transform: 'scale',
            transition: 'all 0.2s ease',
          },
          focus: {
            enabled: true,
            style: 'ring',
            color: '#3b82f6',
          },
        },
        container: {
          background: '#f9f9f9',
          border: '1px solid #ddd',
          borderRadius: 8,
          padding: 16,
        },
      }

      expect(config.templateAreas).toEqual(['header header', 'sidebar main'])
      expect(config.debug?.showLines).toBe(true)
      expect(config.itemStates?.hover?.transform).toBe('scale')
    })
  })

  describe('GridCSSGenerator Advanced Styling Methods', () => {
    it('should generate advanced styling CSS', () => {
      const styling: GridStylingConfig = {
        templateAreas: ['header header', 'sidebar main'],
        advancedGap: {
          row: 20,
          column: 15,
        },
        container: {
          background: '#f9f9f9',
          borderRadius: 8,
        },
      }

      const css = GridCSSGenerator.generateAdvancedStylingCSS(styling)

      expect(css.gridTemplateAreas).toBe('"header header" "sidebar main"')
      expect(css.rowGap).toBe('20px')
      expect(css.columnGap).toBe('15px')
      expect(css.background).toBe('#f9f9f9')
      expect(css.borderRadius).toBe('8px')
    })

    it('should generate debug visualization CSS', () => {
      const styling: GridStylingConfig = {
        debug: {
          enabled: true,
          showLines: true,
          lineColor: '#ff0000',
          lineStyle: 'dashed',
        },
      }

      const css = GridCSSGenerator.generateAdvancedStylingCSS(styling)

      expect(css.background).toContain('#ff0000')
      expect(css.backgroundSize).toBe(
        'var(--grid-debug-size, 20px) var(--grid-debug-size, 20px)'
      )
    })

    it('should generate item state CSS', () => {
      const itemStates: NonNullable<GridStylingConfig['itemStates']> = {
        hover: {
          enabled: true,
          transform: 'scale',
          transition: 'all 0.2s ease',
        },
        focus: {
          enabled: true,
          style: 'ring',
          color: '#3b82f6',
        },
        active: {
          enabled: true,
          transform: 'inset',
        },
      }

      const css = GridCSSGenerator.generateItemStateCSS(itemStates)

      expect(css['& > *:hover']).toContain('transform: scale(1.05)')
      expect(css['& > *:focus']).toContain('box-shadow: 0 0 0 2px #3b82f6')
      expect(css['& > *:active']).toContain('box-shadow: inset')
    })

    it('should generate background pattern CSS', () => {
      const styling: GridStylingConfig = {
        container: {
          background: {
            pattern: 'dots',
            color: '#e0e0e0',
            opacity: 0.5,
          },
        },
      }

      const css = GridCSSGenerator.generateAdvancedStylingCSS(styling)

      expect(css.background).toContain('radial-gradient')
      expect(css.background).toContain('#e0e0e0')
      expect(css.backgroundSize).toBe('20px 20px')
      expect(css.opacity).toBe('0.5')
    })
  })

  describe('GridStyling Preset Functions', () => {
    it('should create debug styling configuration', () => {
      const config = GridStyling.debug({
        lineColor: '#00ff00',
        showAreas: true,
      })

      expect(config.debug?.enabled).toBe(true)
      expect(config.debug?.showLines).toBe(true)
      expect(config.debug?.showAreas).toBe(true)
      expect(config.debug?.lineColor).toBe('#00ff00')
    })

    it('should create interactive styling configuration', () => {
      const config = GridStyling.interactive('lift')

      expect(config.itemStates?.hover?.transform).toBe('lift')
      expect(config.itemStates?.focus?.enabled).toBe(true)
      expect(config.itemStates?.active?.enabled).toBe(true)
    })

    it('should create card styling configuration', () => {
      const config = GridStyling.card({
        shadow: '0 4px 8px rgba(0,0,0,0.1)',
        borderRadius: 12,
      })

      expect(config.container?.background).toBe('#ffffff')
      expect(config.container?.borderRadius).toBe(12)
      expect(config.container?.boxShadow).toBe('0 4px 8px rgba(0,0,0,0.1)')
    })

    it('should create template areas configuration', () => {
      const areas = ['header header', 'sidebar main', 'footer footer']
      const config = GridStyling.templateAreas(areas)

      expect(config.templateAreas).toEqual(areas)
    })

    it('should create background pattern configuration', () => {
      const config = GridStyling.backgroundPattern('grid', '#ccc', 0.3)

      expect(config.container?.background?.pattern).toBe('grid')
      expect(config.container?.background?.color).toBe('#ccc')
      expect(config.container?.background?.opacity).toBe(0.3)
    })

    it('should create comprehensive styling configuration', () => {
      const config = GridStyling.comprehensive({
        debug: true,
        interactive: true,
        card: true,
        pattern: 'dots',
      })

      expect(config.debug?.enabled).toBe(true)
      expect(config.itemStates?.hover?.enabled).toBe(true)
      expect(config.container?.background).toBeDefined()
    })
  })

  describe('Grid Components with Advanced Styling', () => {
    it('should apply styling configuration to LazyVGrid', () => {
      const styling = GridStyling.interactive('scale')

      const grid = LazyVGrid({
        columns: [GridItem.flexible()],
        children: [Text('Item 1')],
        styling,
      })

      const rendered = grid.render()
      const element = rendered[0]

      expect(element.props.style).toBeDefined()
      // Styling would be applied through the generateStylingCSS method
    })

    it('should combine accessibility and styling configurations', () => {
      const accessibility = GridAccessibility.basic('Interactive Grid')
      const styling = GridStyling.card()

      const grid = LazyVGrid({
        columns: [GridItem.flexible(), GridItem.flexible()],
        children: [Text('Item 1'), Text('Item 2')],
        accessibility,
        styling,
      })

      const rendered = grid.render()
      const element = rendered[0]

      expect(element.props['aria-label']).toBe('Interactive Grid')
      expect(element.props.style).toBeDefined()
    })
  })

  describe('Integration Tests', () => {
    it('should handle empty configurations gracefully', () => {
      const grid = LazyVGrid({
        columns: [GridItem.flexible()],
        children: [Text('Item 1')],
        accessibility: {},
        styling: {},
      })

      expect(() => {
        const rendered = grid.render()
        expect(rendered[0]).toBeDefined()
      }).not.toThrow()
    })

    it('should combine multiple styling features', () => {
      const styling: GridStylingConfig = {
        debug: { enabled: true, showLines: true },
        itemStates: {
          hover: { enabled: true, transform: 'scale' },
        },
        container: {
          background: '#f9f9f9',
          padding: 16,
        },
      }

      const css = GridCSSGenerator.generateAdvancedStylingCSS(styling)
      const itemCSS = GridCSSGenerator.generateItemStateCSS(styling.itemStates!)

      expect(css.background).toContain('linear-gradient')
      expect(css.padding).toBe('16px')
      expect(itemCSS['& > *:hover']).toContain('scale')
    })

    it('should respect boolean shorthand configurations', () => {
      const accessibility: GridAccessibilityConfig = {
        label: 'Test Grid',
        keyboardNavigation: true,
        focusManagement: true,
        screenReader: true,
        reducedMotion: true,
      }

      const attrs = GridCSSGenerator.generateAccessibilityAttributes(
        accessibility,
        'grid'
      )

      expect(attrs.tabIndex).toBe(0)
      expect(attrs['data-keyboard-navigation']).toBe('grid')
    })

    it('should handle complex responsive gap configuration', () => {
      const styling: GridStylingConfig = {
        advancedGap: {
          row: { sm: 10, md: 20, lg: 30 },
          column: { sm: 5, md: 10 },
        },
      }

      const css = GridCSSGenerator.generateAdvancedStylingCSS(styling)

      // Should generate responsive CSS - exact format may vary
      expect(Object.keys(css).some(key => key.includes('media'))).toBe(true)
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle missing configurations gracefully', () => {
      expect(() => {
        GridCSSGenerator.generateAccessibilityAttributes({} as any, 'grid')
      }).not.toThrow()

      expect(() => {
        GridCSSGenerator.generateAdvancedStylingCSS({})
      }).not.toThrow()
    })

    it('should handle invalid breakpoint names', () => {
      const styling: GridStylingConfig = {
        advancedGap: {
          row: { invalidBreakpoint: 20 },
        },
      }

      expect(() => {
        GridCSSGenerator.generateAdvancedStylingCSS(styling)
      }).not.toThrow()
    })

    it('should handle disabled item states', () => {
      const itemStates: NonNullable<GridStylingConfig['itemStates']> = {
        hover: { enabled: false },
        focus: { enabled: false },
        active: { enabled: false },
      }

      const css = GridCSSGenerator.generateItemStateCSS(itemStates)

      expect(Object.keys(css)).toHaveLength(0)
    })
  })
})
