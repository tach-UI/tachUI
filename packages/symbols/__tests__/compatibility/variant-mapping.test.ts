/**
 * Tests for SF Symbol variant mapping system
 */

import { describe, test, expect } from 'vitest'
import {
  mapVariantToLucide,
  isVariantSupported,
  getSupportedVariants,
  getVariantCSSClasses,
  getVariantCSS,
  resolveVariantFromName,
  batchMapVariants,
  VARIANT_MAPPING_TABLE,
  type VariantMappingStrategy,
  type VariantMappingResult
} from '../../src/compatibility/variant-mapping.js'
import type { SymbolVariant } from '../../src/types.js'

describe('SF Symbol Variant Mapping', () => {
  describe('mapVariantToLucide', () => {
    test('should map basic symbols correctly', () => {
      expect(mapVariantToLucide('heart', 'none')).toBe('heart')
      expect(mapVariantToLucide('heart', 'filled')).toBe('heart')
      expect(mapVariantToLucide('star', 'none')).toBe('star')
      expect(mapVariantToLucide('star', 'filled')).toBe('star')
    })

    test('should map circle variants correctly', () => {
      expect(mapVariantToLucide('person', 'none')).toBe('user')
      expect(mapVariantToLucide('person', 'circle')).toBe('user-circle')
      expect(mapVariantToLucide('plus', 'circle')).toBe('plus-circle')
      expect(mapVariantToLucide('minus', 'circle')).toBe('minus-circle')
    })

    test('should map slash variants correctly', () => {
      expect(mapVariantToLucide('bell', 'none')).toBe('bell')
      expect(mapVariantToLucide('bell', 'slash')).toBe('bell-off')
      expect(mapVariantToLucide('video', 'slash')).toBe('video-off')
      expect(mapVariantToLucide('mic', 'slash')).toBe('mic-off')
    })

    test('should map square variants correctly', () => {
      expect(mapVariantToLucide('plus', 'square')).toBe('plus-square')
      expect(mapVariantToLucide('minus', 'square')).toBe('minus-square')
      expect(mapVariantToLucide('checkmark', 'square')).toBe('check-square')
    })

    test('should use custom mappers when available', () => {
      // Speaker has custom mapping logic
      expect(mapVariantToLucide('speaker', 'none')).toBe('volume-1')
      expect(mapVariantToLucide('speaker', 'slash')).toBe('volume-x')
      expect(mapVariantToLucide('speaker', 'filled')).toBe('volume-2')
      
      // Play has custom mapping for circle variant
      expect(mapVariantToLucide('play', 'circle')).toBe('play-circle')
      expect(mapVariantToLucide('pause', 'circle')).toBe('pause-circle')
    })

    test('should handle unmapped symbols gracefully', () => {
      expect(mapVariantToLucide('unknown.symbol', 'none')).toBe('unknown.symbol')
      expect(mapVariantToLucide('unknown.symbol', 'filled')).toBe('unknown.symbol')
    })

    test('should default to none variant when variant not specified', () => {
      expect(mapVariantToLucide('heart')).toBe('heart')
      expect(mapVariantToLucide('person')).toBe('user')
    })
  })

  describe('isVariantSupported', () => {
    test('should return true for supported variants', () => {
      expect(isVariantSupported('heart', 'none')).toBe(true)
      expect(isVariantSupported('heart', 'filled')).toBe(true)
      expect(isVariantSupported('person', 'circle')).toBe(true)
      expect(isVariantSupported('bell', 'slash')).toBe(true)
      expect(isVariantSupported('plus', 'square')).toBe(true)
    })

    test('should return false for unsupported variants', () => {
      expect(isVariantSupported('heart', 'slash')).toBe(false)
      expect(isVariantSupported('plus', 'slash')).toBe(false)
      expect(isVariantSupported('bell', 'square')).toBe(false)
    })

    test('should support CSS variants', () => {
      expect(isVariantSupported('heart', 'filled')).toBe(true) // supportsCSSVariants
      expect(isVariantSupported('star', 'filled')).toBe(true) // supportsCSSVariants
      expect(isVariantSupported('bookmark', 'filled')).toBe(true) // supportsCSSVariants
    })

    test('should handle unmapped symbols', () => {
      expect(isVariantSupported('unknown', 'none')).toBe(true)
      expect(isVariantSupported('unknown', 'filled')).toBe(false)
      expect(isVariantSupported('unknown', 'slash')).toBe(false)
    })
  })

  describe('getSupportedVariants', () => {
    test('should return all supported variants for mapped symbols', () => {
      const heartVariants = getSupportedVariants('heart')
      expect(heartVariants).toContain('none')
      expect(heartVariants).toContain('filled')
      expect(heartVariants.length).toBe(2)
      
      const personVariants = getSupportedVariants('person')
      expect(personVariants).toContain('none')
      expect(personVariants).toContain('filled')
      expect(personVariants).toContain('circle')
      expect(personVariants.length).toBe(3)
    })

    test('should return comprehensive variants for complex symbols', () => {
      const bellVariants = getSupportedVariants('bell')
      expect(bellVariants).toContain('none')
      expect(bellVariants).toContain('filled')
      expect(bellVariants).toContain('slash')
      
      const plusVariants = getSupportedVariants('plus')
      expect(plusVariants).toContain('none')
      expect(plusVariants).toContain('circle')
      expect(plusVariants).toContain('square')
    })

    test('should return only none for unmapped symbols', () => {
      const unknownVariants = getSupportedVariants('unknown')
      expect(unknownVariants).toEqual(['none'])
    })
  })

  describe('getVariantCSSClasses', () => {
    test('should generate CSS classes for variants', () => {
      expect(getVariantCSSClasses('filled')).toEqual(['symbol-variant-filled'])
      expect(getVariantCSSClasses('slash')).toEqual(['symbol-variant-slash'])
      expect(getVariantCSSClasses('circle')).toEqual(['symbol-variant-circle'])
      expect(getVariantCSSClasses('square')).toEqual(['symbol-variant-square'])
    })

    test('should return empty array for none variant', () => {
      expect(getVariantCSSClasses('none')).toEqual([])
    })
  })

  describe('getVariantCSS', () => {
    test('should generate CSS styles for filled variant', () => {
      const styles = getVariantCSS('filled')
      expect(styles.fill).toBe('currentColor')
      expect(styles.stroke).toBe('none')
    })

    test('should generate CSS styles for circle variant', () => {
      const styles = getVariantCSS('circle')
      expect(styles.borderRadius).toBe('50%')
      expect(styles.border).toBe('2px solid currentColor')
      expect(styles.padding).toBe('2px')
    })

    test('should generate CSS styles for square variant', () => {
      const styles = getVariantCSS('square')
      expect(styles.borderRadius).toBe('2px')
      expect(styles.border).toBe('2px solid currentColor')
      expect(styles.padding).toBe('2px')
    })

    test('should generate default stroke styles for none variant', () => {
      const styles = getVariantCSS('none')
      expect(styles.fill).toBe('none')
      expect(styles.stroke).toBe('currentColor')
      expect(styles.strokeWidth).toBe('2')
    })

    test('should handle slash variant with positioning', () => {
      const styles = getVariantCSS('slash')
      expect(styles.position).toBe('relative')
    })
  })

  describe('resolveVariantFromName', () => {
    test('should resolve simple variant names', () => {
      const result1 = resolveVariantFromName('heart.fill')
      expect(result1.baseName).toBe('heart')
      expect(result1.variant).toBe('filled')
      expect(result1.lucideIcon).toBe('heart')

      const result2 = resolveVariantFromName('bell.slash')
      expect(result2.baseName).toBe('bell')
      expect(result2.variant).toBe('slash')
      expect(result2.lucideIcon).toBe('bell-off')
    })

    test('should resolve complex variant names', () => {
      const result1 = resolveVariantFromName('person.circle.fill')
      expect(result1.baseName).toBe('person')
      expect(result1.variant).toBe('filled') // fill takes precedence
      expect(result1.lucideIcon).toBe('user')

      const result2 = resolveVariantFromName('plus.circle')
      expect(result2.baseName).toBe('plus')
      expect(result2.variant).toBe('circle')
      expect(result2.lucideIcon).toBe('plus-circle')
    })

    test('should handle names without variants', () => {
      const result = resolveVariantFromName('heart')
      expect(result.baseName).toBe('heart')
      expect(result.variant).toBe('none')
      expect(result.lucideIcon).toBe('heart')
    })

    test('should handle precedence when multiple variants present', () => {
      // fill should take precedence over other variants
      const result1 = resolveVariantFromName('bell.slash.fill')
      expect(result1.baseName).toBe('bell')
      expect(result1.variant).toBe('filled')
      
      // slash should take precedence over circle/square
      const result2 = resolveVariantFromName('unknown.circle.slash')
      expect(result2.baseName).toBe('unknown')
      expect(result2.variant).toBe('slash')
    })

    test('should handle alternative variant names', () => {
      const result1 = resolveVariantFromName('heart.filled')
      expect(result1.baseName).toBe('heart')
      expect(result1.variant).toBe('filled')
      
      const result2 = resolveVariantFromName('star.fill')
      expect(result2.baseName).toBe('star')
      expect(result2.variant).toBe('filled')
    })
  })

  describe('batchMapVariants', () => {
    test('should process multiple SF Symbol names', () => {
      const sfSymbols = [
        'heart',
        'heart.fill', 
        'bell.slash',
        'person.circle',
        'unknown.symbol'
      ]
      
      const results = batchMapVariants(sfSymbols)
      expect(results).toHaveLength(5)
      
      // Check first result
      expect(results[0].originalName).toBe('heart')
      expect(results[0].baseName).toBe('heart')
      expect(results[0].variant).toBe('none')
      expect(results[0].lucideIcon).toBe('heart')
      expect(results[0].isSupported).toBe(true)
      expect(results[0].supportedVariants).toContain('filled')
      
      // Check variant result
      expect(results[1].originalName).toBe('heart.fill')
      expect(results[1].baseName).toBe('heart')
      expect(results[1].variant).toBe('filled')
      expect(results[1].lucideIcon).toBe('heart')
      expect(results[1].isSupported).toBe(true)
      
      // Check slash result
      expect(results[2].originalName).toBe('bell.slash')
      expect(results[2].baseName).toBe('bell')
      expect(results[2].variant).toBe('slash')
      expect(results[2].lucideIcon).toBe('bell-off')
      expect(results[2].isSupported).toBe(true)
    })

    test('should handle empty array', () => {
      const results = batchMapVariants([])
      expect(results).toHaveLength(0)
    })

    test('should provide comprehensive mapping information', () => {
      const results = batchMapVariants(['plus.circle'])
      
      expect(results[0]).toEqual({
        originalName: 'plus.circle',
        baseName: 'plus',
        variant: 'circle',
        lucideIcon: 'plus-circle',
        isSupported: true,
        supportedVariants: expect.arrayContaining(['none', 'circle', 'square'])
      })
    })
  })

  describe('VARIANT_MAPPING_TABLE', () => {
    test('should have correct structure for all entries', () => {
      Object.entries(VARIANT_MAPPING_TABLE).forEach(([sfSymbol, mapping]) => {
        expect(mapping).toHaveProperty('baseIcon')
        expect(typeof mapping.baseIcon).toBe('string')
        expect(mapping.baseIcon.length).toBeGreaterThan(0)
        
        // Validate optional properties
        if (mapping.filledIcon) {
          expect(typeof mapping.filledIcon).toBe('string')
        }
        
        if (mapping.customMapper) {
          expect(typeof mapping.customMapper).toBe('function')
        }
        
        if (mapping.supportsCSSVariants) {
          expect(typeof mapping.supportsCSSVariants).toBe('boolean')
        }
      })
    })

    test('should include essential SF Symbols', () => {
      const essentialSymbols = [
        'heart', 'star', 'person', 'bell', 'house', 'plus', 'minus', 
        'checkmark', 'xmark', 'play', 'pause', 'folder', 'envelope'
      ]
      
      essentialSymbols.forEach(symbol => {
        expect(VARIANT_MAPPING_TABLE).toHaveProperty(symbol)
      })
    })

    test('should have valid custom mappers', () => {
      const customMapperSymbols = Object.entries(VARIANT_MAPPING_TABLE)
        .filter(([, mapping]) => mapping.customMapper)
      
      expect(customMapperSymbols.length).toBeGreaterThan(0)
      
      customMapperSymbols.forEach(([sfSymbol, mapping]) => {
        const mapper = mapping.customMapper!
        
        // Test custom mapper with different variants
        expect(typeof mapper('none', mapping.baseIcon)).toBe('string')
        expect(typeof mapper('filled', mapping.baseIcon)).toBe('string')
      })
    })
  })

  describe('Integration Tests', () => {
    test('should work with complex real-world SF Symbol names', () => {
      const realWorldSymbols = [
        'heart.fill',
        'star.circle.fill',
        'person.crop.circle',
        'bell.badge.fill',
        'folder.badge.plus',
        'envelope.open.fill',
        'play.circle.fill',
        'pause.rectangle.fill'
      ]
      
      realWorldSymbols.forEach(sfSymbol => {
        const result = resolveVariantFromName(sfSymbol)
        expect(result.baseName).toBeDefined()
        expect(result.variant).toBeDefined()
        expect(result.lucideIcon).toBeDefined()
        expect(result.lucideIcon.length).toBeGreaterThan(0)
      })
    })

    test('should provide consistent results between different methods', () => {
      const testSymbol = 'heart'
      const testVariant: SymbolVariant = 'filled'
      
      // Method 1: Direct mapping
      const directResult = mapVariantToLucide(testSymbol, testVariant)
      
      // Method 2: Via name resolution
      const resolveResult = resolveVariantFromName(`${testSymbol}.fill`)
      
      // Method 3: Via batch mapping
      const batchResult = batchMapVariants([`${testSymbol}.fill`])[0]
      
      expect(directResult).toBe(resolveResult.lucideIcon)
      expect(directResult).toBe(batchResult.lucideIcon)
      expect(resolveResult.variant).toBe(batchResult.variant)
    })

    test('should handle edge cases gracefully', () => {
      const edgeCases = [
        '', // Empty string
        'a', // Single character
        'symbol.with.many.dots.fill', // Many dots
        'UPPERCASE.FILL', // Uppercase
        'symbol-with-dashes.fill' // Dashes
      ]
      
      edgeCases.forEach(testCase => {
        expect(() => {
          const result = resolveVariantFromName(testCase)
          expect(result).toBeDefined()
        }).not.toThrow()
      })
    })
  })
})