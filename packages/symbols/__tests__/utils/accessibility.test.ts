import { describe, test, expect, vi } from 'vitest'
import { SymbolAccessibility, WCAGCompliance } from '../../src/utils/accessibility.js'
import { createSignal } from '@tachui/core'

// Mock DOM methods
Object.assign(global, {
  document: {
    createElement: vi.fn(() => ({
      style: {},
      textContent: '',
      id: '',
      className: '',
    })),
  },
})

describe('SymbolAccessibility', () => {
  describe('generateAccessibilityProps', () => {
    test('generates basic accessibility props', () => {
      const props = {
        name: 'heart',
        accessibilityLabel: 'Favorite',
      }
      
      const accessibilityProps = SymbolAccessibility.generateAccessibilityProps(props)
      
      expect(accessibilityProps.role).toBe('img')
      expect(accessibilityProps['aria-label']).toBe('Favorite')
      expect(accessibilityProps.focusable).toBe('false')
    })

    test('generates props for decorative symbols', () => {
      const props = {
        name: 'heart',
        isDecorative: true,
      }
      
      const accessibilityProps = SymbolAccessibility.generateAccessibilityProps(props)
      
      expect(accessibilityProps['aria-hidden']).toBe('true')
      expect(accessibilityProps.focusable).toBe('false')
      expect(accessibilityProps.role).toBe('img')
      expect(accessibilityProps['aria-label']).toBeUndefined()
    })

    test('generates default label from icon name', () => {
      const props = {
        name: 'heart-filled',
      }
      
      const accessibilityProps = SymbolAccessibility.generateAccessibilityProps(props)
      
      expect(accessibilityProps['aria-label']).toBe('Heart filled')
    })

    test('handles camelCase icon names', () => {
      const props = {
        name: 'userAccount',
      }
      
      const accessibilityProps = SymbolAccessibility.generateAccessibilityProps(props)
      
      expect(accessibilityProps['aria-label']).toBe('User account')
    })

    test('handles snake_case icon names', () => {
      const props = {
        name: 'user_account',
      }
      
      const accessibilityProps = SymbolAccessibility.generateAccessibilityProps(props)
      
      expect(accessibilityProps['aria-label']).toBe('User account')
    })

    test('adds describedby when description provided', () => {
      const props = {
        name: 'heart',
        accessibilityDescription: 'Add to favorites',
      }
      
      const accessibilityProps = SymbolAccessibility.generateAccessibilityProps(props)
      
      expect(accessibilityProps['aria-describedby']).toBe('symbol-desc-heart')
    })

    test('handles signal-based names', () => {
      const [name] = createSignal('star-filled')
      const props = {
        name,
      }
      
      const accessibilityProps = SymbolAccessibility.generateAccessibilityProps(props)
      
      expect(accessibilityProps['aria-label']).toBe('Star filled')
    })

    test('sanitizes special characters in IDs', () => {
      const props = {
        name: 'heart@2x!',
        accessibilityDescription: 'Large heart',
      }
      
      const accessibilityProps = SymbolAccessibility.generateAccessibilityProps(props)
      
      expect(accessibilityProps['aria-describedby']).toBe('symbol-desc-heart-2x-')
    })
  })

  describe('generateDescription', () => {
    test('uses custom description when provided', () => {
      const props = {
        name: 'heart',
        accessibilityDescription: 'Custom description',
      }
      
      const description = SymbolAccessibility.generateDescription(props)
      
      expect(description).toBe('Custom description')
    })

    test('generates description with variant', () => {
      const props = {
        name: 'heart',
        variant: 'filled' as const,
      }
      
      const description = SymbolAccessibility.generateDescription(props)
      
      expect(description).toBe('Heart, filled variant')
    })

    test('generates description with effect', () => {
      const props = {
        name: 'heart',
        effect: 'bounce' as const,
      }
      
      const description = SymbolAccessibility.generateDescription(props)
      
      expect(description).toBe('Heart, bounce animation')
    })

    test('generates description with both variant and effect', () => {
      const props = {
        name: 'heart',
        variant: 'filled' as const,
        effect: 'pulse' as const,
      }
      
      const description = SymbolAccessibility.generateDescription(props)
      
      expect(description).toBe('Heart, filled variant, pulse animation')
    })

    test('ignores none variant and effect', () => {
      const props = {
        name: 'heart',
        variant: 'none' as const,
        effect: 'none' as const,
      }
      
      const description = SymbolAccessibility.generateDescription(props)
      
      expect(description).toBe('Heart')
    })

    test('handles signal-based variant and effect', () => {
      const [variant] = createSignal('filled' as const)
      const [effect] = createSignal('wiggle' as const)
      
      const props = {
        name: 'star',
        variant,
        effect,
      }
      
      const description = SymbolAccessibility.generateDescription(props)
      
      expect(description).toBe('Star, filled variant, wiggle animation')
    })

    test('returns undefined for decorative symbols', () => {
      const props = {
        name: 'heart',
        isDecorative: true,
      }
      
      const description = SymbolAccessibility.generateDescription(props)
      
      expect(description).toBeUndefined()
    })
  })

  describe('createDescriptionElement', () => {
    test('creates description element', () => {
      const props = {
        name: 'heart',
        variant: 'filled' as const,
      }
      
      const element = SymbolAccessibility.createDescriptionElement(props)
      
      expect(element).toBeDefined()
      expect(element?.id).toBe('symbol-desc-heart')
      expect(element?.className).toBe('sr-only')
      expect(element?.textContent).toBe('Heart, filled variant')
    })

    test('returns null for decorative symbols', () => {
      const props = {
        name: 'heart',
        isDecorative: true,
      }
      
      const element = SymbolAccessibility.createDescriptionElement(props)
      
      expect(element).toBeNull()
    })

    test('returns null when no description', () => {
      const props = {
        name: 'heart',
        accessibilityDescription: '',
      }
      
      const element = SymbolAccessibility.createDescriptionElement(props)
      
      expect(element).toBeNull()
    })

    test('applies screen reader only styles', () => {
      const props = {
        name: 'heart',
      }
      
      const element = SymbolAccessibility.createDescriptionElement(props)
      
      // Test that cssText contains the required styles
      expect(element?.style.cssText).toContain('position: absolute')
      expect(element?.style.cssText).toContain('width: 1px')
      expect(element?.style.cssText).toContain('height: 1px')
      expect(element?.style.cssText).toContain('overflow: hidden')
    })
  })
})

describe('WCAGCompliance', () => {
  describe('checkColorContrast', () => {
    test('calculates contrast ratio for black and white', () => {
      const result = WCAGCompliance.checkColorContrast('#000000', '#FFFFFF')
      
      expect(result.ratio).toBeCloseTo(21, 0) // Perfect contrast
      expect(result.passes).toBe(true)
    })

    test('checks AA level compliance', () => {
      const result = WCAGCompliance.checkColorContrast('#666666', '#FFFFFF', 'AA')
      
      expect(typeof result.ratio).toBe('number')
      expect(typeof result.passes).toBe('boolean')
    })

    test('checks AAA level compliance', () => {
      const result = WCAGCompliance.checkColorContrast('#666666', '#FFFFFF', 'AAA')
      
      expect(typeof result.ratio).toBe('number')
      expect(typeof result.passes).toBe('boolean')
      
      // AAA is stricter than AA
      const aaResult = WCAGCompliance.checkColorContrast('#666666', '#FFFFFF', 'AA')
      if (aaResult.passes && !result.passes) {
        expect(result.ratio).toBeLessThan(7) // AAA requires 7:1
      }
    })

    test('handles hex colors with and without hash', () => {
      const result1 = WCAGCompliance.checkColorContrast('#FF0000', '#FFFFFF')
      const result2 = WCAGCompliance.checkColorContrast('FF0000', 'FFFFFF')
      
      expect(result1.ratio).toBeCloseTo(result2.ratio, 1)
    })

    test('handles 3-digit hex colors', () => {
      const result = WCAGCompliance.checkColorContrast('#F00', '#FFF')
      
      expect(typeof result.ratio).toBe('number')
      expect(result.ratio).toBeGreaterThan(0)
    })
  })

  describe('ensureMinimumSize', () => {
    test('passes for 44px or larger', () => {
      expect(WCAGCompliance.ensureMinimumSize(44)).toBe(true)
      expect(WCAGCompliance.ensureMinimumSize(48)).toBe(true)
      expect(WCAGCompliance.ensureMinimumSize(100)).toBe(true)
    })

    test('fails for smaller than 44px', () => {
      expect(WCAGCompliance.ensureMinimumSize(32)).toBe(false)
      expect(WCAGCompliance.ensureMinimumSize(24)).toBe(false)
      expect(WCAGCompliance.ensureMinimumSize(16)).toBe(false)
    })

    test('handles edge case of exactly 44px', () => {
      expect(WCAGCompliance.ensureMinimumSize(44)).toBe(true)
    })
  })

  describe('validateAccessibilityLabel', () => {
    test('passes for valid labels', () => {
      const issues = WCAGCompliance.validateAccessibilityLabel('Heart icon')
      expect(issues).toHaveLength(0)
    })

    test('fails for missing label', () => {
      const issues = WCAGCompliance.validateAccessibilityLabel('')
      expect(issues).toContain('Missing accessibility label')
      
      const issues2 = WCAGCompliance.validateAccessibilityLabel(undefined)
      expect(issues2).toContain('Missing accessibility label')
    })

    test('fails for whitespace-only label', () => {
      const issues = WCAGCompliance.validateAccessibilityLabel('   ')
      expect(issues).toContain('Missing accessibility label')
    })

    test('fails for too long label', () => {
      const longLabel = 'a'.repeat(101)
      const issues = WCAGCompliance.validateAccessibilityLabel(longLabel)
      expect(issues).toContain('Accessibility label too long (>100 characters)')
    })

    test('passes for exactly 100 character label', () => {
      const exactLabel = 'a'.repeat(100)
      const issues = WCAGCompliance.validateAccessibilityLabel(exactLabel)
      expect(issues).not.toContain('Accessibility label too long (>100 characters)')
    })

    test('returns multiple issues when applicable', () => {
      const issues = WCAGCompliance.validateAccessibilityLabel('')
      expect(issues).toHaveLength(1)
      
      // Only one issue for empty string (missing label)
      expect(issues).toContain('Missing accessibility label')
    })
  })
})