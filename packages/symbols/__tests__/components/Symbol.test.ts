import { describe, test, expect, beforeEach, vi } from 'vitest'
import { Symbol } from '../../src/components/Symbol.js'
import { IconSetRegistry } from '../../src/icon-sets/registry.js'
import { LucideIconSet } from '../../src/icon-sets/lucide.js'
import { createSignal } from '@tachui/core'

// Mock DOM methods for testing
Object.assign(global, {
  document: {
    createElement: vi.fn(() => ({
      style: {},
      textContent: '',
      appendChild: vi.fn(),
    })),
    head: {
      appendChild: vi.fn(),
    },
    body: {
      insertBefore: vi.fn(),
      firstChild: null,
    },
    readyState: 'complete',
    addEventListener: vi.fn(),
    getElementById: vi.fn(() => null),
  },
})

describe('Symbol Component', () => {
  beforeEach(() => {
    IconSetRegistry.clear()
    IconSetRegistry.register(new LucideIconSet())
  })

  describe('Basic Usage', () => {
    test('creates symbol component with string name', () => {
      const symbol = Symbol('heart')
      
      expect(symbol).toBeDefined()
      expect(symbol.type).toBe('component')
      expect(symbol.props.name).toBe('heart')
    })

    test('creates symbol component with signal name', () => {
      const [name] = createSignal('star')
      const symbol = Symbol(name)
      
      expect(symbol).toBeDefined()
      expect(symbol.props.name).toBe(name)
    })

    test('applies default props correctly', () => {
      const symbol = Symbol('heart')
      
      // Default values should be applied
      expect(symbol.props.variant).toBeUndefined() // defaults to 'none'
      expect(symbol.props.scale).toBeUndefined() // defaults to 'medium'
      expect(symbol.props.renderingMode).toBeUndefined() // defaults to 'monochrome'
    })

    test('applies custom props correctly', () => {
      const symbol = Symbol('heart', {
        variant: 'filled',
        scale: 'large',
        renderingMode: 'palette',
        primaryColor: '#ff0000'
      })
      
      expect(symbol.props.variant).toBe('filled')
      expect(symbol.props.scale).toBe('large')
      expect(symbol.props.renderingMode).toBe('palette')
      expect(symbol.props.primaryColor).toBe('#ff0000')
    })
  })

  describe('Reactive Props', () => {
    test('handles reactive variant prop', () => {
      const [variant, setVariant] = createSignal('none')
      const symbol = Symbol('heart', { variant })
      
      expect(symbol.props.variant).toBe(variant)
      
      setVariant('filled')
      expect(variant()).toBe('filled')
    })

    test('handles reactive scale prop', () => {
      const [scale, setScale] = createSignal('medium')
      const symbol = Symbol('heart', { scale })
      
      expect(symbol.props.scale).toBe(scale)
      
      setScale('large')
      expect(scale()).toBe('large')
    })

    test('handles reactive colors', () => {
      const [primaryColor, setPrimaryColor] = createSignal('#000000')
      const symbol = Symbol('heart', { primaryColor })
      
      expect(symbol.props.primaryColor).toBe(primaryColor)
      
      setPrimaryColor('#ff0000')
      expect(primaryColor()).toBe('#ff0000')
    })
  })

  describe('Symbol Effects', () => {
    test('applies animation effects', () => {
      const symbol = Symbol('heart', {
        effect: 'bounce',
        effectSpeed: 2
      })
      
      expect(symbol.props.effect).toBe('bounce')
      expect(symbol.props.effectSpeed).toBe(2)
    })

    test('handles effect values for variable symbols', () => {
      const [effectValue, setEffectValue] = createSignal(0.5)
      const symbol = Symbol('heart', {
        effect: 'pulse',
        effectValue
      })
      
      expect(symbol.props.effectValue).toBe(effectValue)
      
      setEffectValue(1.0)
      expect(effectValue()).toBe(1.0)
    })
  })

  describe('Accessibility', () => {
    test('applies accessibility label', () => {
      const symbol = Symbol('heart', {
        accessibilityLabel: 'Favorite button'
      })
      
      expect(symbol.props.accessibilityLabel).toBe('Favorite button')
    })

    test('applies accessibility description', () => {
      const symbol = Symbol('heart', {
        accessibilityDescription: 'Add to favorites'
      })
      
      expect(symbol.props.accessibilityDescription).toBe('Add to favorites')
    })

    test('handles decorative symbols', () => {
      const symbol = Symbol('heart', {
        isDecorative: true
      })
      
      expect(symbol.props.isDecorative).toBe(true)
    })
  })

  describe('Icon Loading', () => {
    test('handles fallback icons', () => {
      const symbol = Symbol('nonexistent-icon', {
        fallback: 'heart'
      })
      
      expect(symbol.props.fallback).toBe('heart')
    })

    test('handles different icon sets', () => {
      const symbol = Symbol('heart', {
        iconSet: 'custom'
      })
      
      expect(symbol.props.iconSet).toBe('custom')
    })

    test('handles eager loading', () => {
      const symbol = Symbol('heart', {
        eager: true
      })
      
      expect(symbol.props.eager).toBe(true)
    })
  })

  describe('Rendering Modes', () => {
    test('handles monochrome mode', () => {
      const symbol = Symbol('heart', {
        renderingMode: 'monochrome',
        primaryColor: '#ff0000'
      })
      
      expect(symbol.props.renderingMode).toBe('monochrome')
      expect(symbol.props.primaryColor).toBe('#ff0000')
    })

    test('handles palette mode with multiple colors', () => {
      const symbol = Symbol('heart', {
        renderingMode: 'palette',
        primaryColor: '#ff0000',
        secondaryColor: '#00ff00',
        tertiaryColor: '#0000ff'
      })
      
      expect(symbol.props.renderingMode).toBe('palette')
      expect(symbol.props.primaryColor).toBe('#ff0000')
      expect(symbol.props.secondaryColor).toBe('#00ff00')
      expect(symbol.props.tertiaryColor).toBe('#0000ff')
    })

    test('handles hierarchical mode', () => {
      const symbol = Symbol('heart', {
        renderingMode: 'hierarchical'
      })
      
      expect(symbol.props.renderingMode).toBe('hierarchical')
    })

    test('handles multicolor mode', () => {
      const symbol = Symbol('heart', {
        renderingMode: 'multicolor'
      })
      
      expect(symbol.props.renderingMode).toBe('multicolor')
    })
  })

  describe('Performance', () => {
    test('creates unique component IDs', () => {
      const symbol1 = Symbol('heart')
      const symbol2 = Symbol('star')
      
      expect(symbol1.id).toBeDefined()
      expect(symbol2.id).toBeDefined()
      expect(symbol1.id).not.toBe(symbol2.id)
    })

    test('includes cleanup function', () => {
      const symbol = Symbol('heart')
      
      expect(symbol.cleanup).toBeDefined()
      expect(Array.isArray(symbol.cleanup)).toBe(true)
    })
  })

  describe('Error Handling', () => {
    test('handles empty icon name gracefully', () => {
      const symbol = Symbol('')
      
      expect(symbol).toBeDefined()
      expect(symbol.props.name).toBe('')
    })

    test('handles undefined props gracefully', () => {
      const symbol = Symbol('heart', undefined)
      
      expect(symbol).toBeDefined()
      expect(symbol.props.name).toBe('heart')
    })
  })

  describe('Integration with TachUI Modifiers', () => {
    test('returns modifiable component', () => {
      const symbol = Symbol('heart')
      
      expect(symbol.type).toBe('component')
      expect(symbol.modifier).toBeDefined()
      expect(typeof symbol.padding).toBe('function')
      expect(typeof symbol.foregroundColor).toBe('function')
    })

    test('can chain standard modifiers', () => {
      const symbol = Symbol('heart')
      
      const modified = symbol.padding(16)
        .foregroundColor('#ff0000')
        .build()
      
      expect(modified).toBeDefined()
    })
  })
})