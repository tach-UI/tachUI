import { describe, test, expect, beforeEach, vi } from 'vitest'
import { Symbol } from '../../src/components/Symbol.js'
import { IconSetRegistry } from '../../src/icon-sets/registry.js'
import { LucideIconSet } from '../../src/icon-sets/lucide.js'
import { suppressErrors } from '../utils/suppress-errors.js'
import { createSignal } from '@tachui/core'
import '@tachui/modifiers' // Auto-register modifiers for Proxy access

// Mock DOM for testing
Object.assign(global, {
  document: {
    createElement: vi.fn(() => ({
      style: {},
      textContent: '',
      id: '',
      className: '',
      setAttribute: vi.fn(),
      appendChild: vi.fn(),
    })),
    head: { appendChild: vi.fn() },
    body: { insertBefore: vi.fn(), firstChild: null },
    readyState: 'complete',
    addEventListener: vi.fn(),
    getElementById: vi.fn(() => null),
  },
})

// Mock Lucide icons for integration testing
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

describe('Symbols Integration Tests', () => {
  beforeEach(() => {
    IconSetRegistry.clear()
    IconSetRegistry.register(new LucideIconSet())
  })

  describe('Basic Symbol Creation and Usage', () => {
    test('creates and renders symbol with default settings', () => {
      const symbol = Symbol('heart')
      
      expect(symbol).toBeDefined()
      expect(symbol.type).toBe('component')
      expect(symbol.type).toBe('component')
      expect(symbol.props.name).toBe('heart')
    })

    test('integrates with TachUI modifier system', () => {
      const symbol = Symbol('heart')
      
      expect(symbol.modifier).toBeDefined()
      expect(typeof symbol.modifier.padding).toBe('function')
      expect(typeof symbol.modifier.foregroundColor).toBe('function')
      expect(typeof symbol.modifier.build).toBe('function')
    })

    test('supports method chaining with modifiers', () => {
      const modifiedSymbol = Symbol('heart')
        .modifier
        .padding(16)
        .foregroundColor('#ff0000')
        .build()
      
      expect(modifiedSymbol).toBeDefined()
    })
  })

  describe('Reactive Symbol Properties', () => {
    test('handles reactive name changes', () => {
      const [name, setName] = createSignal('heart')
      const symbol = Symbol(name)
      
      expect(symbol.props.name).toBe(name)
      
      setName('star')
      expect(name()).toBe('star')
    })

    test('handles reactive variant changes', () => {
      const [variant, setVariant] = createSignal('none' as const)
      const symbol = Symbol('heart', { variant })
      
      expect(symbol.props.variant).toBe(variant)
      
      setVariant('filled')
      expect(variant()).toBe('filled')
    })

    test('handles reactive color changes', () => {
      const [color, setColor] = createSignal('#000000')
      const symbol = Symbol('heart', { primaryColor: color })
      
      expect(symbol.props.primaryColor).toBe(color)
      
      setColor('#ff0000')
      expect(color()).toBe('#ff0000')
    })

    test('handles multiple reactive properties', () => {
      const [variant, setVariant] = createSignal('none' as const)
      const [scale, setScale] = createSignal('medium' as const)
      const [effect, setEffect] = createSignal('none' as const)
      
      const symbol = Symbol('heart', { variant, scale, effect })
      
      expect(symbol.props.variant).toBe(variant)
      expect(symbol.props.scale).toBe(scale)
      expect(symbol.props.effect).toBe(effect)
      
      setVariant('filled')
      setScale('large')
      setEffect('bounce')
      
      expect(variant()).toBe('filled')
      expect(scale()).toBe('large')
      expect(effect()).toBe('bounce')
    })
  })

  describe('Symbol Configuration Options', () => {
    test('configures symbol with all appearance options', () => {
      const symbol = Symbol('heart', {
        variant: 'filled',
        scale: 'large',
        weight: 'bold',
        renderingMode: 'palette',
        primaryColor: '#ff0000',
        secondaryColor: '#00ff00',
        tertiaryColor: '#0000ff',
      })
      
      expect(symbol.props.variant).toBe('filled')
      expect(symbol.props.scale).toBe('large')
      expect(symbol.props.weight).toBe('bold')
      expect(symbol.props.renderingMode).toBe('palette')
      expect(symbol.props.primaryColor).toBe('#ff0000')
      expect(symbol.props.secondaryColor).toBe('#00ff00')
      expect(symbol.props.tertiaryColor).toBe('#0000ff')
    })

    test('configures symbol with animation effects', () => {
      const [effectValue, setEffectValue] = createSignal(0.5)
      
      const symbol = Symbol('heart', {
        effect: 'pulse',
        effectValue,
        effectSpeed: 2,
      })
      
      expect(symbol.props.effect).toBe('pulse')
      expect(symbol.props.effectValue).toBe(effectValue)
      expect(symbol.props.effectSpeed).toBe(2)
      
      setEffectValue(1.0)
      expect(effectValue()).toBe(1.0)
    })

    test('configures symbol with accessibility options', () => {
      const symbol = Symbol('heart', {
        accessibilityLabel: 'Add to favorites',
        accessibilityDescription: 'Click to add this item to your favorites list',
        isDecorative: false,
      })
      
      expect(symbol.props.accessibilityLabel).toBe('Add to favorites')
      expect(symbol.props.accessibilityDescription).toBe('Click to add this item to your favorites list')
      expect(symbol.props.isDecorative).toBe(false)
    })

    test('configures symbol with performance options', () => {
      const symbol = Symbol('heart', {
        iconSet: 'lucide',
        eager: true,
        fallback: 'star',
      })
      
      expect(symbol.props.iconSet).toBe('lucide')
      expect(symbol.props.eager).toBe(true)
      expect(symbol.props.fallback).toBe('star')
    })
  })

  describe('Error Handling and Edge Cases', () => {
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

    test('handles invalid scale values gracefully', () => {
      const symbol = Symbol('heart', {
        scale: 'invalid' as any,
      })
      
      expect(symbol).toBeDefined()
      expect(symbol.props.scale).toBe('invalid')
    })

    test('handles invalid variant values gracefully', () => {
      const symbol = Symbol('heart', {
        variant: 'invalid' as any,
      })
      
      expect(symbol).toBeDefined()
      expect(symbol.props.variant).toBe('invalid')
    })
  })

  describe('Component Lifecycle and Cleanup', () => {
    test('provides cleanup function', () => {
      const symbol = Symbol('heart')
      
      expect(symbol.cleanup).toBeDefined()
      expect(Array.isArray(symbol.cleanup)).toBe(true)
    })

    test('generates unique component IDs', () => {
      const symbol1 = Symbol('heart')
      const symbol2 = Symbol('star')
      const symbol3 = Symbol('heart') // Same name, different instance
      
      expect(symbol1.id).toBeDefined()
      expect(symbol2.id).toBeDefined()
      expect(symbol3.id).toBeDefined()
      
      expect(symbol1.id).not.toBe(symbol2.id)
      expect(symbol1.id).not.toBe(symbol3.id)
      expect(symbol2.id).not.toBe(symbol3.id)
    })

    test('maintains prop references correctly', () => {
      const props = {
        variant: 'filled' as const,
        scale: 'large' as const,
        primaryColor: '#ff0000',
      }
      
      const symbol = Symbol('heart', props)
      
      // Props should be included in the component instance
      expect(symbol.props).toMatchObject(props)
      expect(symbol.props.name).toBe('heart')
    })
  })

  describe('Integration with Icon Sets', () => {
    test('works with registered Lucide icon set', () => {
      const symbol = Symbol('heart')
      
      expect(symbol.props.name).toBe('heart')
      // Should use default icon set (Lucide)
      expect(symbol.props.iconSet).toBeUndefined() // Uses default
    })

    test('allows specifying icon set explicitly', () => {
      const symbol = Symbol('heart', { iconSet: 'lucide' })
      
      expect(symbol.props.iconSet).toBe('lucide')
    })

    test('handles non-existent icon set gracefully', () => {
      const symbol = Symbol('heart', { iconSet: 'non-existent' })
      
      expect(symbol).toBeDefined()
      expect(symbol.props.iconSet).toBe('non-existent')
    })
  })

  describe('Performance Characteristics', () => {
    test('creates symbols efficiently', () => {
      const startTime = performance.now()
      
      const symbols = []
      for (let i = 0; i < 100; i++) {
        symbols.push(Symbol('heart'))
      }
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      expect(symbols).toHaveLength(100)
      expect(duration).toBeLessThan(100) // Should be very fast
    })

    test('handles many different configurations', () => {
      const configurations = [
        { variant: 'none' as const, scale: 'small' as const },
        { variant: 'filled' as const, scale: 'medium' as const },
        { variant: 'circle' as const, scale: 'large' as const },
        { effect: 'bounce' as const, renderingMode: 'palette' as const },
        { effect: 'pulse' as const, renderingMode: 'hierarchical' as const },
      ]
      
      const symbols = configurations.map((config, index) => 
        Symbol(`heart-${index}`, config)
      )
      
      expect(symbols).toHaveLength(5)
      symbols.forEach((symbol, index) => {
        expect(symbol.props.name).toBe(`heart-${index}`)
        expect(symbol.props).toMatchObject(configurations[index])
      })
    })
  })
})