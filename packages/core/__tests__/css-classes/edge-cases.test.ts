/**
 * CSS Classes Enhancement - Edge Cases and Error Handling Tests
 * 
 * Tests for unusual inputs, error conditions, and boundary cases
 */

import { describe, it, expect } from 'vitest'
import { createSignal, createComputed } from '../../src/reactive'
import { CSSClassManager } from '../../src/css-classes/css-class-manager'
import { ComponentWithCSSClasses } from '../../src/css-classes/component-base'
import { Text } from '../../src/components/Text'
import { Button } from '../../src/components/Button'
import type { CSSClassesProps } from '../../src/css-classes/types'

// Test component for edge case testing
class EdgeCaseComponent extends ComponentWithCSSClasses {
  constructor(public props: CSSClassesProps = {}) {
    super()
  }
}

describe('CSS Classes Enhancement - Edge Cases and Error Handling', () => {
  describe('Invalid Input Handling', () => {
    it('should handle null and undefined inputs gracefully', () => {
      const manager = new CSSClassManager()
      
      expect(manager.processClasses(null)).toEqual([])
      expect(manager.processClasses(undefined)).toEqual([])
      expect(manager.processClasses(null as any)).toEqual([])
    })

    it('should handle non-string, non-array inputs', () => {
      const manager = new CSSClassManager()
      
      expect(manager.processClasses(123 as any)).toEqual(['cls-123']) // Numbers get sanitized with cls- prefix
      expect(manager.processClasses(true as any)).toEqual(['true'])
      expect(manager.processClasses({} as any)).toEqual(['[object-Object]']) // Spaces converted to hyphens, brackets preserved for CSS framework compatibility
    })

    it('should handle arrays with mixed invalid types', () => {
      const manager = new CSSClassManager()
      const mixedArray = [
        'valid',
        null,
        undefined,
        123,
        true,
        {},
        '',
        '  ',
        'another-valid'
      ] as any[]
      
      const result = manager.processClasses(mixedArray)
      expect(result).toEqual(['valid', 'cls-123', 'true', '[object-Object]', 'another-valid'])
    })
  })

  describe('Extreme Input Scenarios', () => {
    it('should handle extremely long class names', () => {
      const manager = new CSSClassManager()
      const longClassName = 'a'.repeat(10000)
      
      const result = manager.processClasses(longClassName)
      expect(result).toEqual([longClassName])
      expect(result[0]).toHaveLength(10000)
    })

    it('should handle very large arrays of classes', () => {
      const manager = new CSSClassManager()
      const largeArray = Array.from({ length: 10000 }, (_, i) => `class-${i}`)
      
      const start = performance.now()
      const result = manager.processClasses(largeArray)
      const end = performance.now()
      
      expect(result).toHaveLength(10000)
      expect(end - start).toBeLessThan(1000) // Should complete within 1 second
    })

    it('should handle strings with many spaces and special characters', () => {
      const manager = new CSSClassManager()
      const complexString = '  btn\t\tprimary\n\nlarge  \r\n  active\f\vspecial  '
      
      const result = manager.processClasses(complexString)
      expect(result).toEqual(['btn', 'primary', 'large', 'active', 'special'])
    })

    it('should handle CSS selector special characters', () => {
      const manager = new CSSClassManager()
      const specialClasses = [
        'btn:hover',
        'btn::before',
        'btn[disabled]',
        'btn.active',
        'btn#unique',
        'btn~sibling',
        'btn+adjacent',
        'btn>child',
        'btn space',  // Space should split this
        'btn-with-dashes',
        'btn_with_underscores',
        'btn123numbers',
        '123startswithnum'
      ]
      
      const result = manager.processClasses(specialClasses.join(' '))
      // Space in 'btn space' should cause it to split
      expect(result).toContain('btn:hover')
      expect(result).toContain('btn::before')
      expect(result).toContain('btn[disabled]')
      expect(result).toContain('btn.active')
      expect(result).toContain('btn')
      expect(result).toContain('space')
    })
  })

  describe('Signal Edge Cases', () => {
    it('should handle signals that throw errors', () => {
      const [throwSignal] = createSignal(() => {
        throw new Error('Signal error')
      })
      
      const manager = new CSSClassManager()
      
      // Should not throw, but may return empty array or handle gracefully
      expect(() => {
        manager.processClasses(throwSignal)
      }).not.toThrow()
    })

    it('should handle rapidly changing signals', () => {
      const [signal, setSignal] = createSignal('initial')
      const component = new EdgeCaseComponent({ css: signal })
      
      // Rapid changes
      const start = performance.now()
      for (let i = 0; i < 1000; i++) {
        setSignal(`class-${i}`)
        component.processComponentClasses(component.props, ['base'])
      }
      const end = performance.now()
      
      expect(end - start).toBeLessThan(200) // Should handle rapid updates efficiently
    })

    it('should handle circular signal dependencies gracefully', () => {
      const [signal1, setSignal1] = createSignal('class1')
      const [signal2, setSignal2] = createSignal('class2')
      
      const computed1 = createComputed(() => `${signal1()} ${signal2()}`)
      const computed2 = createComputed(() => `${computed1()} extra`)
      
      const component = new EdgeCaseComponent({ css: computed2 })
      
      expect(() => {
        component.processComponentClasses(component.props, ['base'])
      }).not.toThrow()
    })
  })

  describe('Component Integration Edge Cases', () => {
    it('should handle components with missing or corrupted props', () => {
      const corruptedProps = {
        css: undefined,
        someOtherProp: null,
      } as any
      
      expect(() => {
        const text = Text('Test', corruptedProps)
        text.render()
      }).not.toThrow()
    })

    it('should handle components created with invalid constructors', () => {
      expect(() => {
        // @ts-ignore - Testing invalid usage
        const text = new Text.prototype.constructor()
        if (text.render) {
          text.render()
        }
      }).not.toThrow()
    })

    it('should handle modification of cssClasses prop after component creation', () => {
      const props = { css: 'initial' }
      const text = Text('Test', props)
      
      // Modify props after creation
      props.cssClasses = 'modified'
      
      const elements = text.render()
      // Should still work, though behavior may vary
      expect(elements).toHaveLength(1)
      expect(elements[0].props?.className).toBeDefined()
    })
  })

  describe('Memory and Resource Management', () => {
    it('should not leak memory with many temporary components', () => {
      const initialMemory = performance.memory?.usedJSHeapSize || 0
      
      // Create and discard many components
      for (let i = 0; i < 1000; i++) {
        const text = Text(`Temp ${i}`, { css: `temp-${i} disposable` })
        text.render()
        // Let component go out of scope
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc()
      }
      
      const finalMemory = performance.memory?.usedJSHeapSize || 0
      const memoryGrowth = finalMemory - initialMemory
      
      // Memory should not grow excessively (allowing for normal variance)
      expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024) // 50MB threshold
    })

    it('should handle cache overflow gracefully', () => {
      const manager = new CSSClassManager()
      manager.updateConfig({ maxCacheSize: 5 })
      
      // Fill cache beyond limit
      for (let i = 0; i < 20; i++) {
        manager.processClasses(`class-${i}`)
      }
      
      // Should still work
      const result = manager.processClasses('test-class')
      expect(result).toEqual(['test-class'])
    })
  })

  describe('Concurrency and Race Conditions', () => {
    it('should handle concurrent CSS class processing', async () => {
      const manager = new CSSClassManager()
      
      const promises = Array.from({ length: 100 }, (_, i) => 
        Promise.resolve().then(() => 
          manager.processClasses(`concurrent-${i} shared-class`)
        )
      )
      
      const results = await Promise.all(promises)
      
      // All should complete successfully
      expect(results).toHaveLength(100)
      results.forEach((result, i) => {
        expect(result).toEqual([`concurrent-${i}`, 'shared-class'])
      })
    })

    it('should handle concurrent signal updates', async () => {
      const [signal, setSignal] = createSignal('initial')
      const component = new EdgeCaseComponent({ css: signal })
      
      const promises = Array.from({ length: 50 }, (_, i) => 
        Promise.resolve().then(() => {
          setSignal(`concurrent-${i}`)
          return component.processComponentClasses(component.props, ['base'])
        })
      )
      
      const results = await Promise.all(promises)
      
      // All should complete without errors
      expect(results).toHaveLength(50)
      results.forEach(result => {
        expect(Array.isArray(result)).toBe(true)
        expect(result.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Browser Compatibility Edge Cases', () => {
    it('should handle missing Performance API gracefully', () => {
      const originalPerformance = global.performance
      
      // Temporarily remove performance API
      delete (global as any).performance
      
      const manager = new CSSClassManager()
      
      expect(() => {
        manager.processClasses('test-class')
      }).not.toThrow()
      
      // Restore performance API
      global.performance = originalPerformance
    })

    it('should handle environments without Map support', () => {
      const originalMap = global.Map
      
      try {
        // Test with Map undefined (simulating very old browsers)
        delete (global as any).Map
        
        expect(() => {
          const manager = new CSSClassManager()
          manager.processClasses('test-class')
        }).not.toThrow()
      } finally {
        // Always restore Map, even if test fails
        global.Map = originalMap
      }
    })
  })

  describe('Framework Integration Edge Cases', () => {
    it('should handle conflicting framework classes gracefully', () => {
      const conflictingClasses = [
        // Tailwind vs Bootstrap conflicts
        'flex',     // Tailwind
        'd-flex',   // Bootstrap  
        'text-center', // Both
        'justify-content-center', // Bootstrap
        'justify-center',         // Tailwind
        'btn',      // Both but different meanings
        'button'    // Custom
      ]
      
      const manager = new CSSClassManager()
      const result = manager.processClasses(conflictingClasses)
      
      // Should include all classes without errors
      expect(result).toEqual(conflictingClasses)
    })

    it('should handle CSS-in-JS style objects as strings', () => {
      const cssInJsLike = JSON.stringify({
        backgroundColor: 'blue',
        fontSize: '16px'
      })
      
      const manager = new CSSClassManager()
      
      expect(() => {
        const result = manager.processClasses(cssInJsLike)
        expect(Array.isArray(result)).toBe(true)
      }).not.toThrow()
    })
  })
})