import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createSignal } from '../../src/reactive/signal'
import type { ModifierContext } from '../../src/modifiers/types'
import {
  BorderModifier,
  border,
  borderTop,
  borderRight,
  borderBottom,
  borderLeft,
  borderLeading,
  borderTrailing,
  borderHorizontal,
  borderVertical,
} from '../../src/modifiers/border'

describe('BorderModifier', () => {
  let mockElement: any
  let context: ModifierContext

  beforeEach(() => {
    mockElement = {
      style: {
        setProperty: vi.fn(),
        getProperty: vi.fn(),
      },
      setAttribute: vi.fn(),
      getAttribute: vi.fn(),
      removeAttribute: vi.fn(),
    }

    context = {
      element: mockElement,
      component: null,
      isProduction: false,
    }
  })

  describe('Basic border functionality', () => {
    it('should apply simple border with convenience properties', () => {
      const modifier = new BorderModifier({
        width: 2,
        color: '#007AFF',
        style: 'solid',
      })

      modifier.apply({} as any, context)

      expect(mockElement.style.setProperty).toHaveBeenCalledWith(
        'border-width',
        '2px'
      )
      expect(mockElement.style.setProperty).toHaveBeenCalledWith(
        'border-color',
        '#007AFF'
      )
      expect(mockElement.style.setProperty).toHaveBeenCalledWith(
        'border-style',
        'solid'
      )
    })

    it('should handle string widths', () => {
      const modifier = new BorderModifier({
        width: '1px',
        color: '#000',
      })

      modifier.apply({} as any, context)

      expect(mockElement.style.setProperty).toHaveBeenCalledWith(
        'border-width',
        '1px'
      )
      expect(mockElement.style.setProperty).toHaveBeenCalledWith(
        'border-color',
        '#000'
      )
    })

    it('should apply all border', () => {
      const modifier = new BorderModifier({
        all: {
          width: 1,
          color: '#e0e0e0',
          style: 'dashed',
        },
      })

      modifier.apply({} as any, context)

      expect(mockElement.style.setProperty).toHaveBeenCalledWith(
        'border-width',
        '1px'
      )
      expect(mockElement.style.setProperty).toHaveBeenCalledWith(
        'border-color',
        '#e0e0e0'
      )
      expect(mockElement.style.setProperty).toHaveBeenCalledWith(
        'border-style',
        'dashed'
      )
    })
  })

  describe('Individual sides', () => {
    it('should apply top border only', () => {
      const modifier = new BorderModifier({
        top: { width: 2, color: '#007AFF', style: 'solid' },
      })

      modifier.apply({} as any, context)

      expect(mockElement.style.setProperty).toHaveBeenCalledWith(
        'border-top-width',
        '2px'
      )
      expect(mockElement.style.setProperty).toHaveBeenCalledWith(
        'border-top-color',
        '#007AFF'
      )
      expect(mockElement.style.setProperty).toHaveBeenCalledWith(
        'border-top-style',
        'solid'
      )
    })

    it('should apply multiple specific sides', () => {
      const modifier = new BorderModifier({
        top: { width: 2, color: '#007AFF' },
        bottom: { width: 1, color: '#ddd', style: 'dotted' },
      })

      modifier.apply({} as any, context)

      expect(mockElement.style.setProperty).toHaveBeenCalledWith(
        'border-top-width',
        '2px'
      )
      expect(mockElement.style.setProperty).toHaveBeenCalledWith(
        'border-top-color',
        '#007AFF'
      )
      expect(mockElement.style.setProperty).toHaveBeenCalledWith(
        'border-bottom-width',
        '1px'
      )
      expect(mockElement.style.setProperty).toHaveBeenCalledWith(
        'border-bottom-color',
        '#ddd'
      )
      expect(mockElement.style.setProperty).toHaveBeenCalledWith(
        'border-bottom-style',
        'dotted'
      )
    })
  })

  describe('SwiftUI terminology and shortcuts', () => {
    it('should resolve leading to left', () => {
      const modifier = new BorderModifier({
        leading: { width: 2, color: '#007AFF' },
      })

      modifier.apply({} as any, context)

      expect(mockElement.style.setProperty).toHaveBeenCalledWith(
        'border-left-width',
        '2px'
      )
      expect(mockElement.style.setProperty).toHaveBeenCalledWith(
        'border-left-color',
        '#007AFF'
      )
    })

    it('should resolve trailing to right', () => {
      const modifier = new BorderModifier({
        trailing: { width: 1, color: '#ddd' },
      })

      modifier.apply({} as any, context)

      expect(mockElement.style.setProperty).toHaveBeenCalledWith(
        'border-right-width',
        '1px'
      )
      expect(mockElement.style.setProperty).toHaveBeenCalledWith(
        'border-right-color',
        '#ddd'
      )
    })

    it('should resolve horizontal shorthand', () => {
      const modifier = new BorderModifier({
        horizontal: { width: 2, color: '#007AFF', style: 'dashed' },
      })

      modifier.apply({} as any, context)

      expect(mockElement.style.setProperty).toHaveBeenCalledWith(
        'border-left-width',
        '2px'
      )
      expect(mockElement.style.setProperty).toHaveBeenCalledWith(
        'border-left-color',
        '#007AFF'
      )
      expect(mockElement.style.setProperty).toHaveBeenCalledWith(
        'border-left-style',
        'dashed'
      )
      expect(mockElement.style.setProperty).toHaveBeenCalledWith(
        'border-right-width',
        '2px'
      )
      expect(mockElement.style.setProperty).toHaveBeenCalledWith(
        'border-right-color',
        '#007AFF'
      )
      expect(mockElement.style.setProperty).toHaveBeenCalledWith(
        'border-right-style',
        'dashed'
      )
    })

    it('should resolve vertical shorthand', () => {
      const modifier = new BorderModifier({
        vertical: { width: 1, color: '#e0e0e0' },
      })

      modifier.apply({} as any, context)

      expect(mockElement.style.setProperty).toHaveBeenCalledWith(
        'border-top-width',
        '1px'
      )
      expect(mockElement.style.setProperty).toHaveBeenCalledWith(
        'border-top-color',
        '#e0e0e0'
      )
      expect(mockElement.style.setProperty).toHaveBeenCalledWith(
        'border-bottom-width',
        '1px'
      )
      expect(mockElement.style.setProperty).toHaveBeenCalledWith(
        'border-bottom-color',
        '#e0e0e0'
      )
    })
  })

  describe('Advanced features', () => {
    it('should apply border image', () => {
      const modifier = new BorderModifier({
        width: 10,
        image: 'url(border-pattern.png) 10 repeat',
      })

      modifier.apply({} as any, context)

      expect(mockElement.style.setProperty).toHaveBeenCalledWith(
        'border-width',
        '10px'
      )
      expect(mockElement.style.setProperty).toHaveBeenCalledWith(
        'border-image',
        'url(border-pattern.png) 10 repeat'
      )
    })

    it('should apply integrated corner radius', () => {
      const modifier = new BorderModifier({
        width: 1,
        color: '#007AFF',
        radius: { topLeft: 8, topRight: 8 },
      })

      modifier.apply({} as any, context)

      expect(mockElement.style.setProperty).toHaveBeenCalledWith(
        'border-width',
        '1px'
      )
      expect(mockElement.style.setProperty).toHaveBeenCalledWith(
        'border-color',
        '#007AFF'
      )
      expect(mockElement.style.setProperty).toHaveBeenCalledWith(
        'border-top-left-radius',
        '8px'
      )
      expect(mockElement.style.setProperty).toHaveBeenCalledWith(
        'border-top-right-radius',
        '8px'
      )
    })

    it('should handle simple radius value', () => {
      const modifier = new BorderModifier({
        width: 1,
        radius: 4,
      })

      modifier.apply({} as any, context)

      expect(mockElement.style.setProperty).toHaveBeenCalledWith(
        'border-width',
        '1px'
      )
      expect(mockElement.style.setProperty).toHaveBeenCalledWith(
        'border-radius',
        '4px'
      )
    })
  })

  describe('Asset integration', () => {
    it('should resolve Asset color objects', () => {
      const mockAsset = {
        resolve: () => '#FF6B35',
      }

      const modifier = new BorderModifier({
        width: 1,
        color: mockAsset as any,
      })

      modifier.apply({} as any, context)

      expect(mockElement.style.setProperty).toHaveBeenCalledWith(
        'border-color',
        '#FF6B35'
      )
    })

    it('should resolve Asset in specific sides', () => {
      const mockAsset = {
        resolve: () => '#34C759',
      }

      const modifier = new BorderModifier({
        top: { width: 2, color: mockAsset as any },
      })

      modifier.apply({} as any, context)

      expect(mockElement.style.setProperty).toHaveBeenCalledWith(
        'border-top-color',
        '#34C759'
      )
    })
  })
})

describe('Border helper functions', () => {
  let mockElement: any
  let context: ModifierContext

  beforeEach(() => {
    mockElement = {
      style: {
        setProperty: vi.fn(),
        getProperty: vi.fn(),
      },
      setAttribute: vi.fn(),
      getAttribute: vi.fn(),
      removeAttribute: vi.fn(),
    }

    context = {
      element: mockElement,
      component: null,
      isProduction: false,
    }
  })

  describe('border() function', () => {
    it('should create border with shorthand syntax', () => {
      const modifier = border(2, '#007AFF', 'dashed')
      modifier.apply({} as any, context)

      expect(mockElement.style.setProperty).toHaveBeenCalledWith(
        'border-width',
        '2px'
      )
      expect(mockElement.style.setProperty).toHaveBeenCalledWith(
        'border-color',
        '#007AFF'
      )
      expect(mockElement.style.setProperty).toHaveBeenCalledWith(
        'border-style',
        'dashed'
      )
    })

    it('should create border with object syntax', () => {
      const modifier = border({
        top: { width: 2, color: '#007AFF' },
        horizontal: { width: 1, color: '#ddd' },
      })
      modifier.apply({} as any, context)

      expect(mockElement.style.setProperty).toHaveBeenCalledWith(
        'border-top-width',
        '2px'
      )
      expect(mockElement.style.setProperty).toHaveBeenCalledWith(
        'border-top-color',
        '#007AFF'
      )
      expect(mockElement.style.setProperty).toHaveBeenCalledWith(
        'border-left-width',
        '1px'
      )
      expect(mockElement.style.setProperty).toHaveBeenCalledWith(
        'border-left-color',
        '#ddd'
      )
      expect(mockElement.style.setProperty).toHaveBeenCalledWith(
        'border-right-width',
        '1px'
      )
      expect(mockElement.style.setProperty).toHaveBeenCalledWith(
        'border-right-color',
        '#ddd'
      )
    })

    it('should handle string widths', () => {
      const modifier = border('1px', '#000')
      modifier.apply({} as any, context)

      expect(mockElement.style.setProperty).toHaveBeenCalledWith(
        'border-width',
        '1px'
      )
      expect(mockElement.style.setProperty).toHaveBeenCalledWith(
        'border-color',
        '#000'
      )
    })
  })

  describe('Directional border functions', () => {
    it('should create top border', () => {
      const modifier = borderTop(2, '#007AFF', 'solid')
      modifier.apply({} as any, context)

      expect(mockElement.style.setProperty).toHaveBeenCalledWith(
        'border-top-width',
        '2px'
      )
      expect(mockElement.style.setProperty).toHaveBeenCalledWith(
        'border-top-color',
        '#007AFF'
      )
      expect(mockElement.style.setProperty).toHaveBeenCalledWith(
        'border-top-style',
        'solid'
      )
    })

    it('should create right border', () => {
      const modifier = borderRight('1px', '#ddd')
      modifier.apply({} as any, context)

      expect(mockElement.style.setProperty).toHaveBeenCalledWith(
        'border-right-width',
        '1px'
      )
      expect(mockElement.style.setProperty).toHaveBeenCalledWith(
        'border-right-color',
        '#ddd'
      )
    })

    it('should create bottom border', () => {
      const modifier = borderBottom(3, '#34C759', 'dotted')
      modifier.apply({} as any, context)

      expect(mockElement.style.setProperty).toHaveBeenCalledWith(
        'border-bottom-width',
        '3px'
      )
      expect(mockElement.style.setProperty).toHaveBeenCalledWith(
        'border-bottom-color',
        '#34C759'
      )
      expect(mockElement.style.setProperty).toHaveBeenCalledWith(
        'border-bottom-style',
        'dotted'
      )
    })

    it('should create left border', () => {
      const modifier = borderLeft(1, '#FF6B35')
      modifier.apply({} as any, context)

      expect(mockElement.style.setProperty).toHaveBeenCalledWith(
        'border-left-width',
        '1px'
      )
      expect(mockElement.style.setProperty).toHaveBeenCalledWith(
        'border-left-color',
        '#FF6B35'
      )
    })
  })

  describe('SwiftUI-style functions', () => {
    it('should create leading border', () => {
      const modifier = borderLeading(2, '#007AFF')
      modifier.apply({} as any, context)

      expect(mockElement.style.setProperty).toHaveBeenCalledWith(
        'border-left-width',
        '2px'
      )
      expect(mockElement.style.setProperty).toHaveBeenCalledWith(
        'border-left-color',
        '#007AFF'
      )
    })

    it('should create trailing border', () => {
      const modifier = borderTrailing('1px', '#ddd', 'dashed')
      modifier.apply({} as any, context)

      expect(mockElement.style.setProperty).toHaveBeenCalledWith(
        'border-right-width',
        '1px'
      )
      expect(mockElement.style.setProperty).toHaveBeenCalledWith(
        'border-right-color',
        '#ddd'
      )
      expect(mockElement.style.setProperty).toHaveBeenCalledWith(
        'border-right-style',
        'dashed'
      )
    })
  })

  describe('Shorthand functions', () => {
    it('should create horizontal borders', () => {
      const modifier = borderHorizontal(2, '#007AFF', 'solid')
      modifier.apply({} as any, context)

      expect(mockElement.style.setProperty).toHaveBeenCalledWith(
        'border-left-width',
        '2px'
      )
      expect(mockElement.style.setProperty).toHaveBeenCalledWith(
        'border-left-color',
        '#007AFF'
      )
      expect(mockElement.style.setProperty).toHaveBeenCalledWith(
        'border-left-style',
        'solid'
      )
      expect(mockElement.style.setProperty).toHaveBeenCalledWith(
        'border-right-width',
        '2px'
      )
      expect(mockElement.style.setProperty).toHaveBeenCalledWith(
        'border-right-color',
        '#007AFF'
      )
      expect(mockElement.style.setProperty).toHaveBeenCalledWith(
        'border-right-style',
        'solid'
      )
    })

    it('should create vertical borders', () => {
      const modifier = borderVertical(1, '#e0e0e0')
      modifier.apply({} as any, context)

      expect(mockElement.style.setProperty).toHaveBeenCalledWith(
        'border-top-width',
        '1px'
      )
      expect(mockElement.style.setProperty).toHaveBeenCalledWith(
        'border-top-color',
        '#e0e0e0'
      )
      expect(mockElement.style.setProperty).toHaveBeenCalledWith(
        'border-bottom-width',
        '1px'
      )
      expect(mockElement.style.setProperty).toHaveBeenCalledWith(
        'border-bottom-color',
        '#e0e0e0'
      )
    })
  })
})
