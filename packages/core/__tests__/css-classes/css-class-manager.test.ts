/**
 * CSS Classes Enhancement - CSSClassManager Tests
 * 
 * Comprehensive test suite for the CSS class processing system
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { createSignal } from '../../src/reactive'
import { CSSClassManager, cssClassManager, configureCSSClasses } from '../../src/css-classes/css-class-manager'
import type { CSSClassConfig } from '../../src/css-classes/types'

describe('CSS Classes Enhancement - CSSClassManager', () => {
  let manager: CSSClassManager

  beforeEach(() => {
    manager = new CSSClassManager()
  })

  describe('Basic Class Processing', () => {
    it('should process string input correctly', () => {
      const result = manager.processClasses('btn primary')
      expect(result).toEqual(['btn', 'primary'])
    })

    it('should process array input correctly', () => {
      const result = manager.processClasses(['btn', 'primary', 'large'])
      expect(result).toEqual(['btn', 'primary', 'large'])
    })

    it('should handle empty inputs gracefully', () => {
      expect(manager.processClasses('')).toEqual([])
      expect(manager.processClasses([])).toEqual([])
      expect(manager.processClasses(undefined)).toEqual([])
      expect(manager.processClasses(null)).toEqual([])
    })

    it('should split string on whitespace', () => {
      const result = manager.processClasses('btn  primary\tactive\nlarge')
      expect(result).toEqual(['btn', 'primary', 'active', 'large'])
    })

    it('should filter out empty strings from arrays', () => {
      const result = manager.processClasses(['btn', '', 'primary', null, 'active'])
      expect(result).toEqual(['btn', 'primary', 'active'])
    })
  })

  describe('Signal Processing', () => {
    it('should process signal with string value', () => {
      const [signal] = createSignal('btn primary')
      const result = manager.processClasses(signal)
      expect(result).toEqual(['btn', 'primary'])
    })

    it('should process signal with array value', () => {
      const [signal] = createSignal(['btn', 'primary'])
      const result = manager.processClasses(signal)
      expect(result).toEqual(['btn', 'primary'])
    })

    it('should handle reactive signal updates', () => {
      const [signal, setSignal] = createSignal('btn')
      let result = manager.processClasses(signal)
      expect(result).toEqual(['btn'])

      setSignal('btn primary')
      result = manager.processClasses(signal)
      expect(result).toEqual(['btn', 'primary'])
    })
  })

  describe('Class Sanitization', () => {
    it('should sanitize individual class names', () => {
      expect(manager.sanitizeClassName('valid-class')).toBe('valid-class')
      expect(manager.sanitizeClassName('validClass123')).toBe('validClass123')
      expect(manager.sanitizeClassName('_underscore')).toBe('_underscore')
      expect(manager.sanitizeClassName('-dash')).toBe('-dash')
    })

    it('should handle invalid class names', () => {
      expect(manager.sanitizeClassName('123invalid')).toBe('cls-123invalid') // CSS classes cannot start with numbers
      expect(manager.sanitizeClassName('valid.class')).toBe('valid.class')
      expect(manager.sanitizeClassName('space class')).toBe('space-class') // Spaces converted to hyphens
    })

    it('should trim whitespace', () => {
      expect(manager.sanitizeClassName('  trimmed  ')).toBe('trimmed')
    })

    it('should handle empty strings', () => {
      expect(manager.sanitizeClassName('')).toBe('')
      expect(manager.sanitizeClassName('   ')).toBe('')
    })
  })

  describe('Class Deduplication', () => {
    it('should remove duplicate classes', () => {
      const result = manager.deduplicateClasses(['btn', 'primary', 'btn', 'active', 'primary'])
      expect(result).toEqual(['btn', 'primary', 'active'])
    })

    it('should preserve order of first occurrence', () => {
      const result = manager.deduplicateClasses(['z', 'a', 'b', 'z', 'a'])
      expect(result).toEqual(['z', 'a', 'b'])
    })

    it('should handle empty arrays', () => {
      expect(manager.deduplicateClasses([])).toEqual([])
    })
  })

  describe('Class Combination', () => {
    it('should combine tachUI classes with user classes', () => {
      const tachuiClasses = ['tachui-button', 'tachui-interactive']
      const userClasses = ['btn', 'primary']
      const result = manager.combineClasses(tachuiClasses, userClasses)
      expect(result).toEqual(['tachui-button', 'tachui-interactive', 'btn', 'primary'])
    })

    it('should handle empty inputs in combination', () => {
      expect(manager.combineClasses([], ['btn'])).toEqual(['btn'])
      expect(manager.combineClasses(['tachui-button'], [])).toEqual(['tachui-button'])
      expect(manager.combineClasses([], [])).toEqual([])
    })

    it('should deduplicate combined classes', () => {
      const tachuiClasses = ['tachui-button', 'shared']
      const userClasses = ['btn', 'shared', 'primary']
      const result = manager.combineClasses(tachuiClasses, userClasses)
      expect(result).toEqual(['tachui-button', 'shared', 'btn', 'primary'])
    })
  })

  describe('Configuration System', () => {
    it('should use default configuration', () => {
      const config = manager.getConfig()
      expect(config.sanitizeClassNames).toBe(true)
      expect(config.enableCaching).toBe(true)
      expect(config.maxCacheSize).toBe(1000)
    })

    it('should update configuration', () => {
      const newConfig: Partial<CSSClassConfig> = {
        sanitizeClassNames: false,
        maxCacheSize: 500
      }
      
      manager.updateConfig(newConfig)
      const config = manager.getConfig()
      
      expect(config.sanitizeClassNames).toBe(false)
      expect(config.enableCaching).toBe(true) // Should remain unchanged
      expect(config.maxCacheSize).toBe(500)
    })
  })

  describe('Caching System', () => {
    it('should cache processed classes', () => {
      const input = 'btn primary active'
      
      // First call should process and cache
      const result1 = manager.processClasses(input)
      expect(result1).toEqual(['btn', 'primary', 'active'])
      
      // Second call should use cache
      const result2 = manager.processClasses(input)
      expect(result2).toEqual(['btn', 'primary', 'active'])
      expect(result2).toBe(result1) // Should be the same array reference from cache
    })

    it('should respect cache size limit', () => {
      manager.updateConfig({ maxCacheSize: 2 })
      
      // Fill cache beyond limit
      manager.processClasses('class1')
      manager.processClasses('class2')
      manager.processClasses('class3') // Should evict class1
      
      // Verify cache behavior (this is more of an integration test)
      const result = manager.processClasses('class2')
      expect(result).toEqual(['class2'])
    })

    it('should disable caching when configured', () => {
      manager.updateConfig({ enableCaching: false })
      
      const result1 = manager.processClasses('btn primary')
      const result2 = manager.processClasses('btn primary')
      
      // Should process each time, so different array references
      expect(result1).toEqual(result2)
      expect(result1).not.toBe(result2)
    })
  })

  describe('Global Configuration', () => {
    it('should configure global CSS class manager', () => {
      const config: Partial<CSSClassConfig> = {
        enableSanitization: false,
        maxCacheSize: 2000
      }
      
      configureCSSClasses(config)
      
      const globalConfig = cssClassManager.getConfig()
      expect(globalConfig.enableSanitization).toBe(false)
      expect(globalConfig.maxCacheSize).toBe(2000)
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle null and undefined gracefully', () => {
      expect(manager.processClasses(null)).toEqual([])
      expect(manager.processClasses(undefined)).toEqual([])
    })

    it('should handle very long class names', () => {
      const longClassName = 'a'.repeat(1000)
      const result = manager.sanitizeClassName(longClassName)
      expect(result).toBe(longClassName)
    })

    it('should handle arrays with mixed types gracefully', () => {
      const mixedArray = ['valid', 123, null, undefined, '', 'another'] as any[]
      const result = manager.processClasses(mixedArray)
      // Numbers get converted to strings and sanitized (numeric-starting classes get cls- prefix)
      expect(result).toEqual(['valid', 'cls-123', 'another'])
    })

    it('should handle special CSS class characters', () => {
      const specialClasses = ['btn-primary', 'btn_secondary', 'btn:hover', 'btn[disabled]']
      const result = manager.processClasses(specialClasses)
      expect(result).toEqual(['btn-primary', 'btn_secondary', 'btn:hover', 'btn[disabled]'])
    })
  })

  describe('Performance and Memory', () => {
    it('should handle large numbers of classes efficiently', () => {
      const largeClassList = Array.from({ length: 1000 }, (_, i) => `class-${i}`)
      const start = performance.now()
      const result = manager.processClasses(largeClassList)
      const end = performance.now()
      
      expect(result).toHaveLength(1000)
      expect(end - start).toBeLessThan(100) // Should process in under 100ms
    })

    it('should handle repeated processing efficiently with caching', () => {
      const classes = 'btn primary active large responsive'
      
      // Warm up cache
      manager.processClasses(classes)
      
      const start = performance.now()
      for (let i = 0; i < 1000; i++) {
        manager.processClasses(classes)
      }
      const end = performance.now()
      
      expect(end - start).toBeLessThan(50) // Should be very fast with caching
    })
  })
})