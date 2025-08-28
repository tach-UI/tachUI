/**
 * Tests for SwiftUI Image(systemName:) compatibility shim
 */

import { describe, test, expect, beforeEach, vi } from 'vitest'
import { 
  Image, 
  SystemImage, 
  isSystemNameSupported, 
  getSystemNameInfo, 
  getSFSymbolsForLucide,
  batchConvertSystemNames,
  type ImageSystemNameProps,
  type ConversionResult
} from '../../src/compatibility/swiftui-shim.js'
import { IconSetRegistry } from '../../src/icon-sets/registry.js'
import { LucideIconSet } from '../../src/icon-sets/lucide.js'
import { suppressErrors } from '../utils/suppress-errors.js'
import { createSignal } from '@tachui/core'

// Mock Lucide icons for testing
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

vi.mock('lucide/dist/esm/icons/help-circle.js', () => ({
  default: {
    body: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>',
  }
}))

describe('SwiftUI Compatibility Shim', () => {
  beforeEach(() => {
    IconSetRegistry.clear()
    IconSetRegistry.register(new LucideIconSet())
  })

  describe('Image(systemName:) Function', () => {
    test('should create symbol with valid SF Symbol name', () => {
      const props: ImageSystemNameProps = {
        systemName: 'heart'
      }
      
      const image = Image(props)
      
      expect(image).toBeDefined()
      expect(image.type).toBe('component')
      expect(image.props.name).toBe('heart') // Maps to same Lucide name
    })

    test('should handle SF Symbol with different Lucide mapping', () => {
      const props: ImageSystemNameProps = {
        systemName: 'xmark' // SF Symbol that maps to 'x' in Lucide
      }
      
      const image = Image(props)
      
      expect(image).toBeDefined()
      expect(image.props.name).toBe('x') // Should map to Lucide 'x'
    })

    test('should handle unsupported SF Symbol with fallback', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      const props: ImageSystemNameProps = {
        systemName: 'nonexistent.symbol'
      }
      
      const image = Image(props)
      
      expect(image).toBeDefined()
      expect(image.props.name).toBe('help-circle') // Should use fallback
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'SF Symbol "nonexistent.symbol" has no Lucide equivalent. Using fallback.'
      )
      
      consoleWarnSpy.mockRestore()
    })

    test('should pass through symbol properties correctly', () => {
      const props: ImageSystemNameProps = {
        systemName: 'heart',
        variant: 'filled',
        scale: 'large',
        weight: 'bold',
        accessibilityLabel: 'Favorite item',
        isDecorative: false
      }
      
      const image = Image(props)
      
      expect(image.props.variant).toBe('filled')
      expect(image.props.scale).toBe('large')
      expect(image.props.weight).toBe('bold')
      expect(image.props.accessibilityLabel).toBe('Favorite item')
      expect(image.props.isDecorative).toBe(false)
      expect(image.props.iconSet).toBe('lucide')
    })

    test('should generate accessibility label when not provided', () => {
      const props: ImageSystemNameProps = {
        systemName: 'heart.circle.fill'
      }
      
      const image = Image(props)
      
      // Should generate human-readable label from SF Symbol name
      expect(image.props.accessibilityLabel).toBeDefined()
      if (typeof image.props.accessibilityLabel === 'string') {
        expect(image.props.accessibilityLabel).toContain('Heart')
      }
    })
  })

  describe('Reactive System Names', () => {
    test('should handle reactive SF Symbol names', () => {
      const [systemName, setSystemName] = createSignal('heart')
      
      const props: ImageSystemNameProps = {
        systemName
      }
      
      const image = Image(props)
      
      expect(image).toBeDefined()
      expect(typeof image.props.name).toBe('function') // Should be reactive
      
      // Test signal updates
      setSystemName('star')
      expect(systemName()).toBe('star')
    })

    test('should handle reactive accessibility labels', () => {
      const [systemName, setSystemName] = createSignal('heart')
      
      const props: ImageSystemNameProps = {
        systemName
      }
      
      const image = Image(props)
      
      expect(typeof image.props.accessibilityLabel).toBe('function') // Should be reactive
      
      setSystemName('star')
      expect(systemName()).toBe('star')
    })

    test('should map reactive SF Symbol names to Lucide correctly', () => {
      const [systemName, setSystemName] = createSignal('xmark')
      
      const props: ImageSystemNameProps = {
        systemName
      }
      
      const image = Image(props)
      
      // The name function should map xmark to x
      if (typeof image.props.name === 'function') {
        expect(image.props.name()).toBe('x')
      }
      
      setSystemName('checkmark')
      if (typeof image.props.name === 'function') {
        expect(image.props.name()).toBe('check')
      }
    })
  })

  describe('SystemImage Alias', () => {
    test('should provide SystemImage as alias to Image', () => {
      const props: ImageSystemNameProps = {
        systemName: 'heart'
      }
      
      const image1 = Image(props)
      const image2 = SystemImage(props)
      
      expect(image1.props.name).toBe(image2.props.name)
      expect(image1.type).toBe(image2.type)
    })
  })

  describe('Utility Functions', () => {
    describe('isSystemNameSupported', () => {
      test('should return true for supported SF Symbols', () => {
        expect(isSystemNameSupported('heart')).toBe(true)
        expect(isSystemNameSupported('star')).toBe(true)
        expect(isSystemNameSupported('xmark')).toBe(true)
        expect(isSystemNameSupported('checkmark')).toBe(true)
      })

      test('should return false for unsupported SF Symbols', () => {
        expect(isSystemNameSupported('nonexistent.symbol')).toBe(false)
        expect(isSystemNameSupported('made.up.name')).toBe(false)
      })

      test('should handle SF Symbol aliases', () => {
        expect(isSystemNameSupported('heart.fill')).toBe(true) // Alias
        expect(isSystemNameSupported('x.mark')).toBe(true) // Alias for xmark
      })
    })

    describe('getSystemNameInfo', () => {
      test('should return mapping info for supported SF Symbols', () => {
        const info = getSystemNameInfo('heart')
        
        expect(info).toBeDefined()
        expect(info?.sfSymbol).toBe('heart')
        expect(info?.lucideIcon).toBe('heart')
        expect(info?.matchQuality).toBe('exact')
      })

      test('should return mapping info with quality indicators', () => {
        const info = getSystemNameInfo('gear')
        
        expect(info).toBeDefined()
        expect(info?.sfSymbol).toBe('gear')
        expect(info?.lucideIcon).toBe('settings')
        expect(info?.matchQuality).toBe('close')
      })

      test('should return undefined for unsupported SF Symbols', () => {
        const info = getSystemNameInfo('nonexistent.symbol')
        expect(info).toBeUndefined()
      })

      test('should handle SF Symbol aliases', () => {
        const info = getSystemNameInfo('heart.fill')
        
        expect(info).toBeDefined()
        expect(info?.sfSymbol).toBe('heart') // Main symbol, not alias
        expect(info?.lucideIcon).toBe('heart')
      })
    })

    describe('getSFSymbolsForLucide', () => {
      test('should return SF Symbol names for Lucide icons', () => {
        const sfSymbols = getSFSymbolsForLucide('heart')
        
        expect(Array.isArray(sfSymbols)).toBe(true)
        expect(sfSymbols.length).toBeGreaterThan(0)
        expect(sfSymbols).toContain('heart')
      })

      test('should return empty array for unmapped Lucide icons', () => {
        const sfSymbols = getSFSymbolsForLucide('unmapped-icon')
        
        expect(Array.isArray(sfSymbols)).toBe(true)
        expect(sfSymbols).toHaveLength(0)
      })
    })

    describe('batchConvertSystemNames', () => {
      test('should convert multiple SF Symbol names', () => {
        const systemNames = ['heart', 'star', 'xmark', 'nonexistent']
        const results = batchConvertSystemNames(systemNames)
        
        expect(results).toHaveLength(4)
        
        // Check successful conversions
        expect(results[0]).toEqual({
          sfSymbol: 'heart',
          lucideIcon: 'heart',
          success: true,
          matchQuality: 'exact',
          notes: undefined
        })
        
        expect(results[1]).toEqual({
          sfSymbol: 'star',
          lucideIcon: 'star',
          success: true,
          matchQuality: 'exact',
          notes: undefined
        })
        
        expect(results[2]).toEqual({
          sfSymbol: 'xmark',
          lucideIcon: 'x',
          success: true,
          matchQuality: 'exact',
          notes: undefined
        })
        
        // Check failed conversion
        expect(results[3]).toEqual({
          sfSymbol: 'nonexistent',
          success: false
        })
      })

      test('should handle empty array', () => {
        const results = batchConvertSystemNames([])
        expect(results).toHaveLength(0)
      })

      test('should include match quality and notes', () => {
        const systemNames = ['gear'] // Has close match quality
        const results = batchConvertSystemNames(systemNames)
        
        expect(results).toHaveLength(1)
        expect(results[0].success).toBe(true)
        expect(results[0].matchQuality).toBe('close')
        expect(results[0].lucideIcon).toBe('settings')
      })
    })
  })

  describe('Integration with TachUI Modifier System', () => {
    test('should support TachUI modifier chaining', () => {
      const props: ImageSystemNameProps = {
        systemName: 'heart'
      }
      
      const image = Image(props)
      
      expect(image.modifier).toBeDefined()
      expect(typeof image.modifier.foregroundColor).toBe('function')
      expect(typeof image.modifier.padding).toBe('function')
      expect(typeof image.modifier.build).toBe('function')
    })

    test('should support modifier chaining with reactive values', () => {
      const [color, setColor] = createSignal('#ff0000')
      const [systemName, setSystemName] = createSignal('heart')
      
      const props: ImageSystemNameProps = {
        systemName
      }
      
      expect(() => {
        const styledImage = Image(props)
          .modifier
          .foregroundColor(color)
          .padding(16)
          .build()
        
        expect(styledImage).toBeDefined()
        expect(styledImage.modifiers.length).toBeGreaterThan(0)
      }).not.toThrow()
      
      // Test signal updates
      setColor('#00ff00')
      setSystemName('star')
      
      expect(color()).toBe('#00ff00')
      expect(systemName()).toBe('star')
    })
  })

  describe('Error Handling', () => {
    test('should handle invalid props gracefully', () => {
      expect(() => {
        // @ts-expect-error - Testing runtime error handling
        Image({})
      }).toThrow()
    })

    test('should handle undefined systemName', () => {
      expect(() => {
        // @ts-expect-error - Testing runtime error handling  
        Image({ systemName: undefined })
      }).toThrow()
    })
  })
})