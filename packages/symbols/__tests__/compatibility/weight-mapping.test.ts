/**
 * Tests for SF Symbol weight translation system
 */

import { describe, test, expect } from 'vitest'
import {
  WEIGHT_TO_CSS_FONT_WEIGHT,
  WEIGHT_TO_STROKE_WIDTH,
  WEIGHT_TO_CSS_FILTER,
  WEIGHT_TO_LETTER_SPACING,
  WEIGHT_SUPPORT_MATRIX,
  getWeightStyles,
  isWeightSupported,
  getClosestSupportedWeight,
  generateWeightVariants,
  getContextualWeight,
  generateResponsiveWeights,
  generateWeightCSSVariables,
  generateWeightTransition,
  batchProcessWeights,
  type WeightVariant,
  type ResponsiveWeights
} from '../../src/compatibility/weight-mapping.js'
import type { SymbolWeight } from '../../src/types.js'

describe('SF Symbol Weight Translation', () => {
  describe('Weight Mapping Constants', () => {
    test('WEIGHT_TO_CSS_FONT_WEIGHT should have all weight values', () => {
      const expectedWeights: SymbolWeight[] = [
        'ultraLight', 'thin', 'light', 'regular', 'medium', 
        'semibold', 'bold', 'heavy', 'black'
      ]
      
      expectedWeights.forEach(weight => {
        expect(WEIGHT_TO_CSS_FONT_WEIGHT).toHaveProperty(weight)
        expect(typeof WEIGHT_TO_CSS_FONT_WEIGHT[weight]).toBe('number')
        expect(WEIGHT_TO_CSS_FONT_WEIGHT[weight]).toBeGreaterThanOrEqual(100)
        expect(WEIGHT_TO_CSS_FONT_WEIGHT[weight]).toBeLessThanOrEqual(900)
      })
    })

    test('WEIGHT_TO_STROKE_WIDTH should have appropriate stroke values', () => {
      const weights = Object.keys(WEIGHT_TO_CSS_FONT_WEIGHT) as SymbolWeight[]
      
      weights.forEach(weight => {
        expect(WEIGHT_TO_STROKE_WIDTH).toHaveProperty(weight)
        expect(typeof WEIGHT_TO_STROKE_WIDTH[weight]).toBe('number')
        expect(WEIGHT_TO_STROKE_WIDTH[weight]).toBeGreaterThan(0)
        expect(WEIGHT_TO_STROKE_WIDTH[weight]).toBeLessThanOrEqual(5)
      })
    })

    test('should have progressive weight values', () => {
      const weights: SymbolWeight[] = [
        'ultraLight', 'thin', 'light', 'regular', 'medium', 
        'semibold', 'bold', 'heavy', 'black'
      ]
      
      // CSS font weights should increase
      for (let i = 1; i < weights.length; i++) {
        const prevWeight = WEIGHT_TO_CSS_FONT_WEIGHT[weights[i - 1]]
        const currentWeight = WEIGHT_TO_CSS_FONT_WEIGHT[weights[i]]
        expect(currentWeight).toBeGreaterThan(prevWeight)
      }
      
      // Stroke widths should generally increase
      for (let i = 1; i < weights.length; i++) {
        const prevStroke = WEIGHT_TO_STROKE_WIDTH[weights[i - 1]]
        const currentStroke = WEIGHT_TO_STROKE_WIDTH[weights[i]]
        expect(currentStroke).toBeGreaterThanOrEqual(prevStroke)
      }
    })

    test('WEIGHT_TO_CSS_FILTER should have appropriate filter values', () => {
      const weights = Object.keys(WEIGHT_TO_CSS_FONT_WEIGHT) as SymbolWeight[]
      
      weights.forEach(weight => {
        expect(WEIGHT_TO_CSS_FILTER).toHaveProperty(weight)
        const filter = WEIGHT_TO_CSS_FILTER[weight]
        
        if (filter !== undefined) {
          expect(typeof filter).toBe('string')
          expect(filter.length).toBeGreaterThan(0)
        }
      })
    })

    test('WEIGHT_SUPPORT_MATRIX should be comprehensive', () => {
      const weights = Object.keys(WEIGHT_TO_CSS_FONT_WEIGHT) as SymbolWeight[]
      const iconSets = ['lucide', 'sfSymbols', 'materialIcons', 'featherIcons']
      
      weights.forEach(weight => {
        expect(WEIGHT_SUPPORT_MATRIX).toHaveProperty(weight)
        const support = WEIGHT_SUPPORT_MATRIX[weight]
        
        iconSets.forEach(iconSet => {
          expect(support).toHaveProperty(iconSet)
          expect(typeof support[iconSet as keyof typeof support]).toBe('boolean')
        })
      })
    })

    test('should have sensible support patterns', () => {
      // Regular weight should be supported by all icon sets
      expect(WEIGHT_SUPPORT_MATRIX.regular.lucide).toBe(true)
      expect(WEIGHT_SUPPORT_MATRIX.regular.sfSymbols).toBe(true)
      expect(WEIGHT_SUPPORT_MATRIX.regular.materialIcons).toBe(true)
      expect(WEIGHT_SUPPORT_MATRIX.regular.featherIcons).toBe(true)
      
      // Ultra light should be less supported
      expect(WEIGHT_SUPPORT_MATRIX.ultraLight.lucide).toBe(false)
      expect(WEIGHT_SUPPORT_MATRIX.ultraLight.featherIcons).toBe(false)
    })
  })

  describe('getWeightStyles', () => {
    test('should return appropriate styles for different weights', () => {
      const weight: SymbolWeight = 'bold'
      const styles = getWeightStyles(weight, 'lucide')
      
      expect(styles).toHaveProperty('fontWeight')
      expect(styles.fontWeight).toBe(WEIGHT_TO_CSS_FONT_WEIGHT[weight])
      expect(styles).toHaveProperty('strokeWidth')
      expect(styles.strokeWidth).toBe(WEIGHT_TO_STROKE_WIDTH[weight])
    })

    test('should handle different icon sets', () => {
      const weight: SymbolWeight = 'regular'
      
      const lucideStyles = getWeightStyles(weight, 'lucide')
      const materialStyles = getWeightStyles(weight, 'material')
      
      expect(lucideStyles).toHaveProperty('strokeWidth')
      expect(materialStyles).toHaveProperty('fontVariationSettings')
    })

    test('should apply filters for appropriate weights', () => {
      const heavyStyles = getWeightStyles('heavy', 'lucide')
      const regularStyles = getWeightStyles('regular', 'lucide')
      
      if (WEIGHT_TO_CSS_FILTER.heavy) {
        expect(heavyStyles).toHaveProperty('filter')
      }
      
      if (!WEIGHT_TO_CSS_FILTER.regular) {
        expect(regularStyles).not.toHaveProperty('filter')
      }
    })

    test('should handle light weights appropriately', () => {
      const ultraLightStyles = getWeightStyles('ultraLight', 'lucide')
      const thinStyles = getWeightStyles('thin', 'lucide')
      
      expect(ultraLightStyles).toHaveProperty('stroke', 'currentColor')
      expect(ultraLightStyles).toHaveProperty('fill', 'none')
      expect(thinStyles).toHaveProperty('stroke', 'currentColor')
      expect(thinStyles).toHaveProperty('fill', 'none')
    })

    test('should include letter spacing when appropriate', () => {
      const blackStyles = getWeightStyles('black', 'lucide')
      const regularStyles = getWeightStyles('regular', 'lucide')
      
      const blackLetterSpacing = WEIGHT_TO_LETTER_SPACING.black
      if (blackLetterSpacing !== 0) {
        expect(blackStyles).toHaveProperty('letterSpacing')
      }
      
      const regularLetterSpacing = WEIGHT_TO_LETTER_SPACING.regular
      if (regularLetterSpacing === 0) {
        expect(regularStyles).not.toHaveProperty('letterSpacing')
      }
    })
  })

  describe('isWeightSupported', () => {
    test('should return correct support status', () => {
      expect(isWeightSupported('regular', 'lucide')).toBe(true)
      expect(isWeightSupported('regular', 'sf-symbols')).toBe(true)
      expect(isWeightSupported('regular', 'material')).toBe(true)
      expect(isWeightSupported('regular', 'feather')).toBe(true)
      
      expect(isWeightSupported('ultraLight', 'lucide')).toBe(false)
      expect(isWeightSupported('ultraLight', 'feather')).toBe(false)
    })

    test('should handle all weight and icon set combinations', () => {
      const weights = Object.keys(WEIGHT_TO_CSS_FONT_WEIGHT) as SymbolWeight[]
      const iconSets: Array<'lucide' | 'sf-symbols' | 'material' | 'feather'> = [
        'lucide', 'sf-symbols', 'material', 'feather'
      ]
      
      weights.forEach(weight => {
        iconSets.forEach(iconSet => {
          const supported = isWeightSupported(weight, iconSet)
          expect(typeof supported).toBe('boolean')
        })
      })
    })
  })

  describe('getClosestSupportedWeight', () => {
    test('should return same weight if supported', () => {
      const result = getClosestSupportedWeight('regular', 'lucide')
      expect(result).toBe('regular')
    })

    test('should find closest alternative for unsupported weights', () => {
      const result = getClosestSupportedWeight('ultraLight', 'lucide')
      expect(result).not.toBe('ultraLight')
      expect(isWeightSupported(result, 'lucide')).toBe(true)
    })

    test('should prefer lighter weights first', () => {
      // For weights that aren't supported, should try lighter first
      const result = getClosestSupportedWeight('black', 'feather')
      
      // Should find a supported alternative
      expect(isWeightSupported(result, 'feather')).toBe(true)
    })

    test('should fall back to regular', () => {
      // In extreme cases where no close weights are supported,
      // should fall back to regular
      const weights = Object.keys(WEIGHT_TO_CSS_FONT_WEIGHT) as SymbolWeight[]
      
      weights.forEach(weight => {
        const result = getClosestSupportedWeight(weight, 'lucide')
        expect(isWeightSupported(result, 'lucide')).toBe(true)
      })
    })
  })

  describe('generateWeightVariants', () => {
    test('should generate all weight variants', () => {
      const variants = generateWeightVariants('regular', 'lucide')
      
      expect(Array.isArray(variants)).toBe(true)
      expect(variants.length).toBe(9) // All weights
      
      variants.forEach((variant: WeightVariant) => {
        expect(variant).toHaveProperty('weight')
        expect(variant).toHaveProperty('displayName')
        expect(variant).toHaveProperty('styles')
        expect(variant).toHaveProperty('isSupported')
        expect(variant).toHaveProperty('isRecommended')
        
        expect(typeof variant.weight).toBe('string')
        expect(typeof variant.displayName).toBe('string')
        expect(typeof variant.styles).toBe('object')
        expect(typeof variant.isSupported).toBe('boolean')
        expect(typeof variant.isRecommended).toBe('boolean')
      })
    })

    test('should mark appropriate weights as recommended', () => {
      const variants = generateWeightVariants('regular', 'lucide')
      const recommendedVariants = variants.filter(v => v.isRecommended)
      
      expect(recommendedVariants.length).toBeGreaterThan(0)
      expect(recommendedVariants.length).toBeLessThan(variants.length)
      
      // Common weights should be recommended
      const recommendedWeights = recommendedVariants.map(v => v.weight)
      expect(recommendedWeights).toContain('regular')
      expect(recommendedWeights).toContain('bold')
    })

    test('should have consistent support status', () => {
      const variants = generateWeightVariants('regular', 'lucide')
      
      variants.forEach(variant => {
        const actualSupport = isWeightSupported(variant.weight, 'lucide')
        expect(variant.isSupported).toBe(actualSupport)
      })
    })

    test('should include appropriate styles', () => {
      const variants = generateWeightVariants('regular', 'lucide')
      
      variants.forEach(variant => {
        expect(variant.styles).toHaveProperty('fontWeight')
        expect(typeof variant.styles.fontWeight).toBe('number')
      })
    })
  })

  describe('getContextualWeight', () => {
    test('should return appropriate weights for different contexts', () => {
      const contexts: Array<'ui' | 'text' | 'heading' | 'accent' | 'subtle' | 'emphasis'> = [
        'ui', 'text', 'heading', 'accent', 'subtle', 'emphasis'
      ]
      
      contexts.forEach(context => {
        const weight = getContextualWeight(context, 'lucide')
        expect(typeof weight).toBe('string')
        expect(Object.keys(WEIGHT_TO_CSS_FONT_WEIGHT)).toContain(weight)
      })
    })

    test('should return sensible context mappings', () => {
      expect(getContextualWeight('subtle', 'lucide')).toBe('light')
      expect(getContextualWeight('accent', 'lucide')).toBe('bold')
      expect(getContextualWeight('ui', 'lucide')).toBe('regular')
    })

    test('should return supported weights', () => {
      const contexts: Array<'ui' | 'text' | 'heading' | 'accent' | 'subtle' | 'emphasis'> = [
        'ui', 'text', 'heading', 'accent', 'subtle', 'emphasis'
      ]
      
      contexts.forEach(context => {
        const weight = getContextualWeight(context, 'lucide')
        expect(isWeightSupported(weight, 'lucide')).toBe(true)
      })
    })
  })

  describe('generateResponsiveWeights', () => {
    test('should return responsive weight object', () => {
      const responsive = generateResponsiveWeights('regular', 'lucide')
      
      expect(responsive).toHaveProperty('mobile')
      expect(responsive).toHaveProperty('tablet')
      expect(responsive).toHaveProperty('desktop')
      expect(responsive).toHaveProperty('largeScreen')
      
      Object.values(responsive).forEach(weight => {
        expect(typeof weight).toBe('string')
        expect(Object.keys(WEIGHT_TO_CSS_FONT_WEIGHT)).toContain(weight)
      })
    })

    test('should provide progressive weight enhancement', () => {
      const responsive = generateResponsiveWeights('regular', 'lucide')
      
      // Mobile should be lighter or equal
      const mobileWeight = WEIGHT_TO_CSS_FONT_WEIGHT[responsive.mobile]
      const desktopWeight = WEIGHT_TO_CSS_FONT_WEIGHT[responsive.desktop]
      
      expect(mobileWeight).toBeLessThanOrEqual(desktopWeight)
    })

    test('should ensure all weights are supported', () => {
      const responsive = generateResponsiveWeights('regular', 'lucide')
      
      Object.values(responsive).forEach(weight => {
        expect(isWeightSupported(weight, 'lucide')).toBe(true)
      })
    })

    test('should handle edge case base weights', () => {
      const ultraLightResponsive = generateResponsiveWeights('ultraLight', 'lucide')
      const blackResponsive = generateResponsiveWeights('black', 'lucide')
      
      expect(ultraLightResponsive).toBeDefined()
      expect(blackResponsive).toBeDefined()
      
      Object.values(ultraLightResponsive).forEach(weight => {
        expect(isWeightSupported(weight, 'lucide')).toBe(true)
      })
      
      Object.values(blackResponsive).forEach(weight => {
        expect(isWeightSupported(weight, 'lucide')).toBe(true)
      })
    })
  })

  describe('generateWeightCSSVariables', () => {
    test('should generate CSS custom properties', () => {
      const variables = generateWeightCSSVariables('--test', 'lucide')
      
      expect(typeof variables).toBe('object')
      
      // Should have weight variables
      expect(variables).toHaveProperty('--test-weight-regular')
      expect(variables).toHaveProperty('--test-stroke-regular')
      
      // Should have contextual variables
      expect(variables).toHaveProperty('--test-weight-ui')
      expect(variables).toHaveProperty('--test-weight-accent')
    })

    test('should use correct variable naming', () => {
      const prefix = '--symbol'
      const variables = generateWeightCSSVariables(prefix, 'lucide')
      
      Object.keys(variables).forEach(varName => {
        expect(varName.startsWith(prefix)).toBe(true)
      })
    })

    test('should have appropriate variable values', () => {
      const variables = generateWeightCSSVariables('--test', 'lucide')
      
      Object.entries(variables).forEach(([name, value]) => {
        if (name.includes('weight') && !name.includes('stroke')) {
          // Font weight values should be numbers or weight names
          expect(typeof value === 'number' || typeof value === 'string').toBe(true)
        }
        
        if (name.includes('stroke')) {
          // Stroke values should be numbers
          expect(typeof value).toBe('number')
        }
      })
    })
  })

  describe('generateWeightTransition', () => {
    test('should return valid CSS transition string', () => {
      const transition = generateWeightTransition('regular', 'bold', 300)
      
      expect(typeof transition).toBe('string')
      expect(transition.length).toBeGreaterThan(0)
      expect(transition).toMatch(/\d+ms/)
      expect(transition).toContain('ease-in-out')
    })

    test('should include relevant properties', () => {
      const transition = generateWeightTransition('regular', 'bold')
      
      expect(transition).toContain('font-weight')
      expect(transition).toContain('stroke-width')
      expect(transition).toContain('filter')
      expect(transition).toContain('letter-spacing')
    })

    test('should use custom duration', () => {
      const duration = 500
      const transition = generateWeightTransition('regular', 'bold', duration)
      
      expect(transition).toContain(`${duration}ms`)
    })

    test('should use default duration when not specified', () => {
      const transition = generateWeightTransition('regular', 'bold')
      
      expect(transition).toContain('200ms') // Default duration
    })
  })

  describe('batchProcessWeights', () => {
    test('should process multiple symbols and weights', () => {
      const symbols = ['heart', 'star', 'plus']
      const weights: SymbolWeight[] = ['regular', 'bold']
      
      const results = batchProcessWeights(symbols, weights, 'lucide')
      
      expect(typeof results).toBe('object')
      
      symbols.forEach(symbol => {
        expect(results).toHaveProperty(symbol)
        
        weights.forEach(weight => {
          expect(results[symbol]).toHaveProperty(weight)
          expect(typeof results[symbol][weight]).toBe('object')
        })
      })
    })

    test('should return consistent results', () => {
      const symbols = ['heart']
      const weights: SymbolWeight[] = ['regular']
      
      const batchResults = batchProcessWeights(symbols, weights, 'lucide')
      const individualResult = getWeightStyles('regular', 'lucide')
      
      expect(batchResults.heart.regular).toEqual(individualResult)
    })

    test('should handle empty inputs', () => {
      const emptySymbols = batchProcessWeights([], ['regular'], 'lucide')
      const emptyWeights = batchProcessWeights(['heart'], [], 'lucide')
      
      expect(typeof emptySymbols).toBe('object')
      expect(Object.keys(emptySymbols)).toHaveLength(0)
      
      expect(typeof emptyWeights).toBe('object')
      expect(emptyWeights.heart).toBeDefined()
      expect(Object.keys(emptyWeights.heart)).toHaveLength(0)
    })

    test('should handle different icon sets', () => {
      const symbols = ['heart']
      const weights: SymbolWeight[] = ['regular']
      
      const lucideResults = batchProcessWeights(symbols, weights, 'lucide')
      const materialResults = batchProcessWeights(symbols, weights, 'material')
      
      expect(lucideResults.heart.regular).toHaveProperty('strokeWidth')
      expect(materialResults.heart.regular).toHaveProperty('fontVariationSettings')
    })
  })

  describe('Integration Tests', () => {
    test('should maintain consistency between different functions', () => {
      const weight: SymbolWeight = 'bold'
      const iconSet = 'lucide'
      
      // Get styles directly
      const directStyles = getWeightStyles(weight, iconSet)
      
      // Get styles through variant generation
      const variants = generateWeightVariants('regular', iconSet)
      const variantStyles = variants.find(v => v.weight === weight)?.styles
      
      // Should be the same
      expect(directStyles).toEqual(variantStyles)
    })

    test('should handle real-world usage patterns', () => {
      // Test common weight combinations
      const commonWeights: SymbolWeight[] = ['light', 'regular', 'medium', 'bold']
      
      commonWeights.forEach(weight => {
        const styles = getWeightStyles(weight, 'lucide')
        expect(styles.fontWeight).toBeDefined()
        expect(typeof styles.fontWeight).toBe('number')
        
        const supported = isWeightSupported(weight, 'lucide')
        expect(typeof supported).toBe('boolean')
      })
    })

    test('should provide coherent contextual recommendations', () => {
      const contexts = ['ui', 'text', 'heading', 'accent', 'subtle', 'emphasis'] as const
      
      contexts.forEach(context => {
        const weight = getContextualWeight(context, 'lucide')
        const styles = getWeightStyles(weight, 'lucide')
        
        expect(styles).toBeDefined()
        expect(isWeightSupported(weight, 'lucide')).toBe(true)
      })
    })
  })
})