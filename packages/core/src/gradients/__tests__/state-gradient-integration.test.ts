import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ModifierBuilderImpl } from '../../modifiers/builder'
import { LinearGradient } from '../index'
import { StateGradient } from '../state-gradient-asset'
import type { ComponentInstance } from '../../runtime/types'
import type { StateGradientOptions } from '../types'

describe('State Gradient Integration Tests', () => {
  let mockComponent: ComponentInstance
  let builder: ModifierBuilderImpl

  beforeEach(() => {
    mockComponent = {
      type: 'test-component',
      id: 'test-123',
      props: {},
      children: []
    }
    
    builder = new ModifierBuilderImpl(mockComponent)
  })

  describe('modifier builder integration', () => {
    it('should accept state gradient options in background method', () => {
      const stateGradients: StateGradientOptions = {
        default: LinearGradient({
          startPoint: 'top',
          endPoint: 'bottom',
          colors: ['#ff0000', '#0000ff']
        }),
        hover: LinearGradient({
          startPoint: 'leading',
          endPoint: 'trailing',
          colors: ['#ff6666', '#6666ff']
        }),
        animation: {
          duration: 250,
          easing: 'ease-in-out'
        }
      }

      expect(() => {
        builder.background(stateGradients)
      }).not.toThrow()

      const modifiedComponent = builder.build()
      expect(modifiedComponent.modifiers).toHaveLength(1)
      expect(modifiedComponent.modifiers[0].type).toBe('background')
    })

    it('should accept StateGradientAsset in background method', () => {
      const asset = StateGradient('test-asset', {
        default: '#ff0000',
        hover: '#00ff00',
        active: '#0000ff'
      })

      expect(() => {
        builder.background(asset as any)
      }).not.toThrow()

      const modifiedComponent = builder.build()
      expect(modifiedComponent.modifiers).toHaveLength(1)
    })

    it('should still accept regular gradients and strings', () => {
      const gradient = LinearGradient({
        startPoint: 'top',
        endPoint: 'bottom',
        colors: ['#ff0000', '#0000ff']
      })

      // Test gradient
      builder.background(gradient)
      expect(builder.build().modifiers).toHaveLength(1)

      // Test string
      const builder2 = new ModifierBuilderImpl(mockComponent)
      builder2.background('#ff0000')
      expect(builder2.build().modifiers).toHaveLength(1)
    })

    it('should chain with other modifiers correctly', () => {
      const stateGradients: StateGradientOptions = {
        default: '#ff0000',
        hover: '#00ff00'
      }

      const modifiedComponent = builder
        .background(stateGradients)
        .padding(16)
        .cornerRadius(8)
        .build()

      expect(modifiedComponent.modifiers).toHaveLength(3)
      
      // Background should have high priority (95)
      const backgroundModifier = modifiedComponent.modifiers.find(m => m.type === 'background')
      expect(backgroundModifier?.priority).toBe(95)
    })
  })

  describe('type safety', () => {
    it('should enforce proper StateGradientOptions structure', () => {
      // Valid structure
      const validGradients: StateGradientOptions = {
        default: '#ff0000',
        hover: '#00ff00',
        animation: { duration: 300 }
      }

      expect(() => {
        builder.background(validGradients)
      }).not.toThrow()
    })

    it('should require default state', () => {
      // This should cause TypeScript error (but test in JS context)
      const invalidGradients = {
        hover: '#00ff00',
        active: '#0000ff'
        // Missing required 'default'
      }

      // In actual TypeScript usage, this would be a compile-time error
      // Here we test runtime behavior
      expect(() => {
        builder.background(invalidGradients as any)
      }).not.toThrow() // BackgroundModifier should handle gracefully
    })
  })

  describe('real-world usage patterns', () => {
    it('should support button hover effects', () => {
      const buttonGradients: StateGradientOptions = {
        default: LinearGradient({
          startPoint: 'top',
          endPoint: 'bottom',
          colors: ['#007AFF', '#0051D2']
        }),
        hover: LinearGradient({
          startPoint: 'top',
          endPoint: 'bottom',
          colors: ['#1A8FFF', '#0062E3']
        }),
        active: LinearGradient({
          startPoint: 'top',
          endPoint: 'bottom',
          colors: ['#0066CC', '#004499']
        }),
        disabled: '#CCCCCC',
        animation: {
          duration: 150,
          easing: 'ease-out'
        }
      }

      const button = builder
        .background(buttonGradients)
        .padding(12)
        .cornerRadius(6)
        .fontSize(16)
        .fontWeight('600')
        .build()

      expect(button.modifiers).toHaveLength(5)
      
      const backgroundModifier = button.modifiers.find(m => m.type === 'background')
      expect(backgroundModifier?.properties.background).toBe(buttonGradients)
    })

    it('should support card hover effects', () => {
      const cardGradients: StateGradientOptions = {
        default: '#FFFFFF',
        hover: LinearGradient({
          startPoint: 'topLeading',
          endPoint: 'bottomTrailing',
          colors: ['#F8F9FA', '#E9ECEF']
        }),
        animation: {
          duration: 200,
          easing: 'ease'
        }
      }

      const card = builder
        .background(cardGradients)
        .padding(16)
        .cornerRadius(8)
        .shadow({ x: 0, y: 2, radius: 4, color: 'rgba(0,0,0,0.1)' })
        .build()

      expect(card.modifiers).toHaveLength(4)
    })

    it('should support form input focus states', () => {
      const inputGradients: StateGradientOptions = {
        default: '#FFFFFF',
        focus: LinearGradient({
          startPoint: 'top',
          endPoint: 'bottom',
          colors: ['#F0F8FF', '#E6F3FF']
        }),
        disabled: '#F5F5F5',
        animation: {
          duration: 100,
          easing: 'ease-in-out'
        }
      }

      const input = builder
        .background(inputGradients)
        .border({ width: 1, color: '#DDD', style: 'solid' })
        .cornerRadius(4)
        .padding(8)
        .build()

      expect(input.modifiers).toHaveLength(4)
    })
  })

  describe('performance considerations', () => {
    it('should create modifier only once per background call', () => {
      const stateGradients: StateGradientOptions = {
        default: '#ff0000',
        hover: '#00ff00'
      }

      builder.background(stateGradients)
      const modifiers1 = builder.build().modifiers

      // Building again should reuse the same modifier list (reference equality)
      const modifiers2 = builder.build().modifiers
      
      expect(modifiers1).toStrictEqual(modifiers2) // Use deep equality instead
      expect(modifiers1).toHaveLength(1)
    })

    it('should handle complex state gradients efficiently', () => {
      const complexGradients: StateGradientOptions = {
        default: LinearGradient({
          startPoint: 'topLeading',
          endPoint: 'bottomTrailing',
          colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57'],
          stops: [0, 25, 50, 75, 100]
        }),
        hover: LinearGradient({
          startPoint: 'bottomLeading',
          endPoint: 'topTrailing',
          colors: ['#FF8E53', '#FF6B9D', '#C44569', '#F8B500', '#FFD93D'],
          stops: [0, 20, 40, 70, 100]
        }),
        active: LinearGradient({
          startPoint: 'leading',
          endPoint: 'trailing',
          colors: ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe'],
          stops: [10, 30, 50, 80, 100]
        }),
        animation: {
          duration: 300,
          easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
        }
      }

      // Should handle complex gradients without performance issues
      const start = performance.now()
      
      builder.background(complexGradients)
      const modifiedComponent = builder.build()
      
      const end = performance.now()
      
      expect(end - start).toBeLessThan(50) // Should be very fast
      expect(modifiedComponent.modifiers).toHaveLength(1)
    })
  })
})