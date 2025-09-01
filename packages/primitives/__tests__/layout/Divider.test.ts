/**
 * Tests for Divider Component
 *
 * Tests the visual separator functionality, styling, and behavior
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  Divider,
  type DividerProps,
  DividerStyles,
  DividerUtils,
} from '../../src/layout/Divider'
import { createSignal } from '@tachui/core'
import { DOMRenderer } from '@tachui/core'

// Mock DOM element creation for testing styles
const _createMockElement = () => ({
  style: {} as CSSStyleDeclaration,
  setAttribute: vi.fn(),
  getAttribute: vi.fn(),
})

describe('Divider Component', () => {
  let renderer: DOMRenderer

  beforeEach(() => {
    vi.clearAllMocks()
    renderer = new DOMRenderer()
  })

  describe('Component Creation', () => {
    it('should create divider with default properties', () => {
      const divider = Divider()

      expect(divider).toBeDefined()
      expect(divider.type).toBe('component')
      expect(divider.id).toMatch(/divider-/)
    })

    it('should create divider with custom properties', () => {
      const props: DividerProps = {
        color: '#FF0000',
        thickness: 2,
        orientation: 'vertical',
        margin: 20,
      }

      const divider = Divider(props)

      expect(divider.props.color).toBe('#FF0000')
      expect(divider.props.thickness).toBe(2)
      expect(divider.props.orientation).toBe('vertical')
      expect(divider.props.margin).toBe(20)
    })

    it('should handle empty props object', () => {
      const divider = Divider({})

      expect(divider).toBeDefined()
      expect(divider.props).toEqual({})
    })
  })

  describe('Orientation', () => {
    it('should default to horizontal orientation', () => {
      const divider = Divider()
      const rendered = divider.render()
      // Handle modifiable component render result
      const node = Array.isArray(rendered) ? rendered[0] : rendered

      // Actually render the DOM node to populate the element property
      const element = renderer.render(node) as HTMLElement

      expect(element?.getAttribute('aria-orientation')).toBe('horizontal')
    })

    it('should support vertical orientation', () => {
      const divider = Divider({ orientation: 'vertical' })
      const rendered = divider.render()
      // Handle modifiable component render result
      const node = Array.isArray(rendered) ? rendered[0] : rendered

      // Actually render the DOM node to populate the element property
      const element = renderer.render(node) as HTMLElement

      expect(element?.getAttribute('aria-orientation')).toBe('vertical')
    })
  })

  describe('Styling Properties', () => {
    it('should apply custom color', () => {
      const divider = Divider({ color: '#FF0000' })

      expect(divider.props.color).toBe('#FF0000')
    })

    it('should apply custom thickness', () => {
      const divider = Divider({ thickness: 3 })

      expect(divider.props.thickness).toBe(3)
    })

    it('should apply custom length', () => {
      const divider = Divider({ length: 200 })

      expect(divider.props.length).toBe(200)
    })

    it('should accept string length values', () => {
      const divider = Divider({ length: '50%' })

      expect(divider.props.length).toBe('50%')
    })

    it('should apply custom margin', () => {
      const divider = Divider({ margin: 24 })

      expect(divider.props.margin).toBe(24)
    })

    it('should support different line styles', () => {
      const solidDivider = Divider({ style: 'solid' })
      const dashedDivider = Divider({ style: 'dashed' })
      const dottedDivider = Divider({ style: 'dotted' })

      expect(solidDivider.props.style).toBe('solid')
      expect(dashedDivider.props.style).toBe('dashed')
      expect(dottedDivider.props.style).toBe('dotted')
    })

    it('should apply custom opacity', () => {
      const divider = Divider({ opacity: 0.5 })

      expect(divider.props.opacity).toBe(0.5)
    })
  })

  describe('Reactive Properties', () => {
    it('should handle reactive color', () => {
      const [color, setColor] = createSignal('#FF0000')
      const divider = Divider({ color })

      expect(divider.props.color).toBe(color)

      setColor('#00FF00')
      expect(color()).toBe('#00FF00')
    })

    it('should handle reactive thickness', () => {
      const [thickness, setThickness] = createSignal(2)
      const divider = Divider({ thickness })

      expect(divider.props.thickness).toBe(thickness)

      setThickness(4)
      expect(thickness()).toBe(4)
    })

    it('should handle reactive length', () => {
      const [length, setLength] = createSignal(100)
      const divider = Divider({ length })

      expect(divider.props.length).toBe(length)

      setLength(200)
      expect(length()).toBe(200)
    })

    it('should handle reactive margin', () => {
      const [margin, setMargin] = createSignal(16)
      const divider = Divider({ margin })

      expect(divider.props.margin).toBe(margin)

      setMargin(32)
      expect(margin()).toBe(32)
    })

    it('should handle reactive opacity', () => {
      const [opacity, setOpacity] = createSignal(1.0)
      const divider = Divider({ opacity })

      expect(divider.props.opacity).toBe(opacity)

      setOpacity(0.5)
      expect(opacity()).toBe(0.5)
    })
  })

  describe('Rendering', () => {
    it('should render with proper semantic role', () => {
      const divider = Divider()
      const rendered = divider.render()
      // Handle modifiable component render result
      const node = Array.isArray(rendered) ? rendered[0] : rendered

      // Actually render the DOM node to populate the element property
      const element = renderer.render(node) as HTMLElement

      expect(element?.getAttribute('role')).toBe('separator')
    })

    it('should render horizontal divider with correct aria-orientation', () => {
      const divider = Divider({ orientation: 'horizontal' })
      const rendered = divider.render()
      // Handle modifiable component render result
      const node = Array.isArray(rendered) ? rendered[0] : rendered

      // Actually render the DOM node to populate the element property
      const element = renderer.render(node) as HTMLElement

      expect(element?.getAttribute('aria-orientation')).toBe('horizontal')
    })

    it('should render vertical divider with correct aria-orientation', () => {
      const divider = Divider({ orientation: 'vertical' })
      const rendered = divider.render()
      // Handle modifiable component render result
      const node = Array.isArray(rendered) ? rendered[0] : rendered

      // Actually render the DOM node to populate the element property
      const element = renderer.render(node) as HTMLElement

      expect(element?.getAttribute('aria-orientation')).toBe('vertical')
    })
  })

  describe('DividerUtils', () => {
    it('should create thin divider', () => {
      const thinDivider = DividerUtils.thin('#CCCCCC')

      expect(thinDivider.props.thickness).toBe(
        DividerStyles.theme.thickness.thin
      )
      expect(thinDivider.props.color).toBe('#CCCCCC')
    })

    it('should create medium divider', () => {
      const mediumDivider = DividerUtils.medium('#AAAAAA')

      expect(mediumDivider.props.thickness).toBe(
        DividerStyles.theme.thickness.medium
      )
      expect(mediumDivider.props.color).toBe('#AAAAAA')
    })

    it('should create thick divider', () => {
      const thickDivider = DividerUtils.thick('#888888')

      expect(thickDivider.props.thickness).toBe(
        DividerStyles.theme.thickness.thick
      )
      expect(thickDivider.props.color).toBe('#888888')
    })

    it('should create vertical divider', () => {
      const verticalDivider = DividerUtils.vertical(100, 2)

      expect(verticalDivider.props.orientation).toBe('vertical')
      expect(verticalDivider.props.length).toBe(100)
      expect(verticalDivider.props.thickness).toBe(2)
    })

    it('should create vertical divider with string height', () => {
      const verticalDivider = DividerUtils.vertical('50vh')

      expect(verticalDivider.props.orientation).toBe('vertical')
      expect(verticalDivider.props.length).toBe('50vh')
    })

    it('should create dashed divider', () => {
      const dashedDivider = DividerUtils.dashed('#FF0000', 2)

      expect(dashedDivider.props.style).toBe('dashed')
      expect(dashedDivider.props.color).toBe('#FF0000')
      expect(dashedDivider.props.thickness).toBe(2)
    })

    it('should create dotted divider', () => {
      const dottedDivider = DividerUtils.dotted('#00FF00', 3)

      expect(dottedDivider.props.style).toBe('dotted')
      expect(dottedDivider.props.color).toBe('#00FF00')
      expect(dottedDivider.props.thickness).toBe(3)
    })

    it('should create subtle divider', () => {
      const subtleDivider = DividerUtils.subtle()

      expect(subtleDivider.props.color).toBe(DividerStyles.theme.colors.light)
      expect(subtleDivider.props.opacity).toBe(0.6)
    })

    it('should create prominent divider', () => {
      const prominentDivider = DividerUtils.prominent()

      expect(prominentDivider.props.color).toBe(
        DividerStyles.theme.colors.heavy
      )
      expect(prominentDivider.props.thickness).toBe(
        DividerStyles.theme.thickness.medium
      )
    })
  })

  describe('DividerStyles', () => {
    it('should provide default theme', () => {
      expect(DividerStyles.theme).toBeDefined()
      expect(DividerStyles.theme.colors).toBeDefined()
      expect(DividerStyles.theme.thickness).toBeDefined()
      expect(DividerStyles.theme.spacing).toBeDefined()
    })

    it('should have predefined color values', () => {
      expect(DividerStyles.theme.colors.default).toBeDefined()
      expect(DividerStyles.theme.colors.light).toBeDefined()
      expect(DividerStyles.theme.colors.medium).toBeDefined()
      expect(DividerStyles.theme.colors.heavy).toBeDefined()
    })

    it('should have predefined thickness values', () => {
      expect(DividerStyles.theme.thickness.thin).toBe(1)
      expect(DividerStyles.theme.thickness.medium).toBe(2)
      expect(DividerStyles.theme.thickness.thick).toBe(3)
    })

    it('should have predefined spacing values', () => {
      expect(DividerStyles.theme.spacing.small).toBe(8)
      expect(DividerStyles.theme.spacing.medium).toBe(16)
      expect(DividerStyles.theme.spacing.large).toBe(24)
    })

    it('should create custom theme', () => {
      const customTheme = DividerStyles.createTheme({
        colors: {
          default: '#FF0000',
        },
        thickness: {
          thin: 0.5,
        },
      })

      expect(customTheme.colors.default).toBe('#FF0000')
      expect(customTheme.thickness.thin).toBe(0.5)
      // Should preserve other default values
      expect(customTheme.colors.light).toBe(DividerStyles.theme.colors.light)
      expect(customTheme.thickness.medium).toBe(
        DividerStyles.theme.thickness.medium
      )
    })

    it('should provide color presets', () => {
      expect(DividerStyles.colors.primary).toBe('#007AFF')
      expect(DividerStyles.colors.success).toBe('#34C759')
      expect(DividerStyles.colors.warning).toBe('#FF9500')
      expect(DividerStyles.colors.danger).toBe('#FF3B30')
    })
  })

  describe('Integration with Modifier System', () => {
    it('should work with modifier system', () => {
      const dividerWithModifiers = Divider()
        .modifier.margin(20)
        .opacity(0.8)
        .build()

      expect(dividerWithModifiers).toBeDefined()
      expect(dividerWithModifiers.modifiers).toBeDefined()
      expect(dividerWithModifiers.modifiers.length).toBeGreaterThan(0)
    })

    it('should maintain component properties after modification', () => {
      const originalDivider = Divider({
        color: '#FF0000',
        thickness: 2,
      })

      const modifiedDivider = originalDivider.modifier
        .backgroundColor('#FFFFFF')
        .build()

      expect(modifiedDivider.props.color).toBe('#FF0000')
      expect(modifiedDivider.props.thickness).toBe(2)
    })
  })

  describe('Edge Cases', () => {
    it('should handle zero thickness', () => {
      const divider = Divider({ thickness: 0 })

      expect(divider.props.thickness).toBe(0)
    })

    it('should handle negative margin', () => {
      const divider = Divider({ margin: -10 })

      expect(divider.props.margin).toBe(-10)
    })

    it('should handle zero opacity', () => {
      const divider = Divider({ opacity: 0 })

      expect(divider.props.opacity).toBe(0)
    })

    it('should handle opacity greater than 1', () => {
      const divider = Divider({ opacity: 1.5 })

      expect(divider.props.opacity).toBe(1.5)
    })
  })

  describe('Complex Scenarios', () => {
    it('should handle all properties together', () => {
      const [color] = createSignal('#FF5722')
      const [thickness] = createSignal(4)

      const complexDivider = Divider({
        color,
        thickness,
        length: '80%',
        orientation: 'vertical',
        style: 'dashed',
        margin: 32,
        opacity: 0.8,
      })

      expect(complexDivider.props.color).toBe(color)
      expect(complexDivider.props.thickness).toBe(thickness)
      expect(complexDivider.props.length).toBe('80%')
      expect(complexDivider.props.orientation).toBe('vertical')
      expect(complexDivider.props.style).toBe('dashed')
      expect(complexDivider.props.margin).toBe(32)
      expect(complexDivider.props.opacity).toBe(0.8)
    })

    it('should work in layout contexts', () => {
      // Test that divider can be used in different layout scenarios
      const horizontalDivider = Divider({ orientation: 'horizontal' })
      const verticalDivider = Divider({ orientation: 'vertical' })

      expect(horizontalDivider.props.orientation).toBe('horizontal')
      expect(verticalDivider.props.orientation).toBe('vertical')

      // Both should render successfully
      const horizontalRendered = horizontalDivider.render()
      const verticalRendered = verticalDivider.render()

      expect(horizontalRendered).toBeDefined()
      expect(verticalRendered).toBeDefined()
    })
  })
})
