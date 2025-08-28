/**
 * CSS Classes Enhancement - ComponentWithCSSClasses Tests
 * 
 * Tests for the base class that provides CSS class functionality to components
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { createSignal, createComputed } from '../../src/reactive'
import { ComponentWithCSSClasses } from '../../src/css-classes/component-base'
import type { CSSClassesProps } from '../../src/css-classes/types'

// Test component class
class TestComponent extends ComponentWithCSSClasses {
  constructor(public props: CSSClassesProps = {}) {
    super()
  }
}

describe('CSS Classes Enhancement - ComponentWithCSSClasses', () => {
  let component: TestComponent

  beforeEach(() => {
    component = new TestComponent()
  })

  describe('Class Processing', () => {
    it('should process static string classes', () => {
      component.props = { css: 'btn primary' }
      const baseClasses = ['tachui-button']
      const result = component.processComponentClasses(component.props, baseClasses)
      expect(result).toEqual(['tachui-button', 'btn', 'primary'])
    })

    it('should process array classes', () => {
      component.props = { css: ['btn', 'primary', 'large'] }
      const baseClasses = ['tachui-button']
      const result = component.processComponentClasses(component.props, baseClasses)
      expect(result).toEqual(['tachui-button', 'btn', 'primary', 'large'])
    })

    it('should handle empty props', () => {
      component.props = {}
      const baseClasses = ['tachui-button']
      const result = component.processComponentClasses(component.props, baseClasses)
      expect(result).toEqual(['tachui-button'])
    })

    it('should handle empty base classes', () => {
      component.props = { css: 'btn primary' }
      const result = component.processComponentClasses(component.props, [])
      expect(result).toEqual(['btn', 'primary'])
    })

    it('should handle no CSS classes prop', () => {
      component.props = { css: undefined }
      const baseClasses = ['tachui-button']
      const result = component.processComponentClasses(component.props, baseClasses)
      expect(result).toEqual(['tachui-button'])
    })
  })

  describe('Reactive Class Processing', () => {
    it('should process signal-based classes', () => {
      const [signal] = createSignal('btn primary')
      component.props = { css: signal }
      const baseClasses = ['tachui-button']
      const result = component.processComponentClasses(component.props, baseClasses)
      expect(result).toEqual(['tachui-button', 'btn', 'primary'])
    })

    it('should handle reactive class updates', () => {
      const [signal, setSignal] = createSignal('btn')
      component.props = { css: signal }
      const baseClasses = ['tachui-button']
      
      let result = component.processComponentClasses(component.props, baseClasses)
      expect(result).toEqual(['tachui-button', 'btn'])
      
      setSignal('btn primary active')
      result = component.processComponentClasses(component.props, baseClasses)
      expect(result).toEqual(['tachui-button', 'btn', 'primary', 'active'])
    })

    it('should handle computed signals', () => {
      const [isActive, setActive] = createSignal(false)
      const computedClasses = createComputed(() => 
        isActive() ? 'btn active' : 'btn inactive'
      )
      
      component.props = { css: computedClasses }
      const baseClasses = ['tachui-button']
      
      let result = component.processComponentClasses(component.props, baseClasses)
      expect(result).toEqual(['tachui-button', 'btn', 'inactive'])
      
      setActive(true)
      result = component.processComponentClasses(component.props, baseClasses)
      expect(result).toEqual(['tachui-button', 'btn', 'active'])
    })
  })

  describe('Class String Creation', () => {
    it('should create static class string', () => {
      component.props = { css: 'btn primary' }
      const baseClasses = ['tachui-button']
      const result = component.createClassString(component.props, baseClasses)
      expect(result).toBe('tachui-button btn primary')
    })

    it('should create reactive class string for signals', () => {
      const [signal, setSignal] = createSignal('btn')
      component.props = { css: signal }
      const baseClasses = ['tachui-button']
      const result = component.createClassString(component.props, baseClasses)
      
      // Should be a signal function
      expect(typeof result).toBe('function')
      expect(result()).toBe('tachui-button btn')
      
      setSignal('btn primary')
      expect(result()).toBe('tachui-button btn primary')
    })

    it('should handle array inputs in class string creation', () => {
      component.props = { css: ['btn', 'primary', 'large'] }
      const baseClasses = ['tachui-button']
      const result = component.createClassString(component.props, baseClasses)
      expect(result).toBe('tachui-button btn primary large')
    })

    it('should handle empty base classes in string creation', () => {
      component.props = { css: 'btn primary' }
      const result = component.createClassString(component.props, [])
      expect(result).toBe('btn primary')
    })

    it('should handle no CSS classes in string creation', () => {
      component.props = {}
      const baseClasses = ['tachui-button']
      const result = component.createClassString(component.props, baseClasses)
      expect(result).toBe('tachui-button')
    })
  })

  describe('Class Combination Logic', () => {
    it('should maintain class order (base classes first)', () => {
      component.props = { css: 'user-class' }
      const baseClasses = ['tachui-base', 'tachui-specific']
      const result = component.processComponentClasses(component.props, baseClasses)
      expect(result).toEqual(['tachui-base', 'tachui-specific', 'user-class'])
    })

    it('should handle class deduplication across base and user classes', () => {
      component.props = { css: 'shared-class user-class' }
      const baseClasses = ['tachui-base', 'shared-class']
      const result = component.processComponentClasses(component.props, baseClasses)
      expect(result).toEqual(['tachui-base', 'shared-class', 'user-class'])
    })

    it('should handle multiple spaces and formatting in user classes', () => {
      component.props = { css: '  btn   primary    large  ' }
      const baseClasses = ['tachui-button']
      const result = component.processComponentClasses(component.props, baseClasses)
      expect(result).toEqual(['tachui-button', 'btn', 'primary', 'large'])
    })
  })

  describe('Framework Integration Patterns', () => {
    it('should support Tailwind CSS classes', () => {
      component.props = { 
        css: 'bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600' 
      }
      const baseClasses = ['tachui-button']
      const result = component.processComponentClasses(component.props, baseClasses)
      expect(result).toEqual([
        'tachui-button', 
        'bg-blue-500', 
        'text-white', 
        'px-4', 
        'py-2', 
        'rounded-lg', 
        'hover:bg-blue-600'
      ])
    })

    it('should support Bootstrap classes', () => {
      component.props = { 
        css: 'btn btn-primary btn-lg d-flex align-items-center' 
      }
      const baseClasses = ['tachui-button']
      const result = component.processComponentClasses(component.props, baseClasses)
      expect(result).toEqual([
        'tachui-button', 
        'btn', 
        'btn-primary', 
        'btn-lg', 
        'd-flex', 
        'align-items-center'
      ])
    })

    it('should support custom design system classes', () => {
      component.props = { 
        css: 'ds-button ds-button--primary ds-button--large ds-interactive' 
      }
      const baseClasses = ['tachui-button']
      const result = component.processComponentClasses(component.props, baseClasses)
      expect(result).toEqual([
        'tachui-button', 
        'ds-button', 
        'ds-button--primary', 
        'ds-button--large', 
        'ds-interactive'
      ])
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle null cssClasses prop', () => {
      component.props = { css: null as any }
      const baseClasses = ['tachui-button']
      const result = component.processComponentClasses(component.props, baseClasses)
      expect(result).toEqual(['tachui-button'])
    })

    it('should handle undefined cssClasses prop', () => {
      component.props = { css: undefined }
      const baseClasses = ['tachui-button']
      const result = component.processComponentClasses(component.props, baseClasses)
      expect(result).toEqual(['tachui-button'])
    })

    it('should handle empty string cssClasses', () => {
      component.props = { css: '' }
      const baseClasses = ['tachui-button']
      const result = component.processComponentClasses(component.props, baseClasses)
      expect(result).toEqual(['tachui-button'])
    })

    it('should handle empty array cssClasses', () => {
      component.props = { css: [] }
      const baseClasses = ['tachui-button']
      const result = component.processComponentClasses(component.props, baseClasses)
      expect(result).toEqual(['tachui-button'])
    })

    it('should handle whitespace-only classes', () => {
      component.props = { css: '   \t\n   ' }
      const baseClasses = ['tachui-button']
      const result = component.processComponentClasses(component.props, baseClasses)
      expect(result).toEqual(['tachui-button'])
    })
  })

  describe('Performance Considerations', () => {
    it('should handle large numbers of classes efficiently', () => {
      const manyClasses = Array.from({ length: 100 }, (_, i) => `class-${i}`).join(' ')
      component.props = { css: manyClasses }
      const baseClasses = ['tachui-button']
      
      const start = performance.now()
      const result = component.processComponentClasses(component.props, baseClasses)
      const end = performance.now()
      
      expect(result).toHaveLength(101) // 100 user classes + 1 base class
      expect(end - start).toBeLessThan(50) // Should process quickly
    })

    it('should handle repeated processing efficiently', () => {
      component.props = { css: 'btn primary active large responsive' }
      const baseClasses = ['tachui-button']
      
      const start = performance.now()
      for (let i = 0; i < 100; i++) {
        component.processComponentClasses(component.props, baseClasses)
      }
      const end = performance.now()
      
      expect(end - start).toBeLessThan(100) // Should leverage caching
    })
  })
})