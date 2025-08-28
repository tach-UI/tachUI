import { describe, it, expect } from 'vitest'
import { 
  LinearGradient, 
  RadialGradient, 
  AngularGradient,
  RepeatingLinearGradient,
  RepeatingRadialGradient,
  createGradientAsset
} from '../index'
import { gradientToCSS } from '../css-generator'
import { BackgroundModifier } from '../../modifiers/background'
import { createColorAsset } from '../../assets'
import type { ModifierContext } from '../../modifiers/types'

describe('Comprehensive Gradient Integration', () => {
  let mockElement: HTMLElement
  let mockContext: ModifierContext

  beforeEach(() => {
    mockElement = document.createElement('div')
    mockContext = {
      componentId: 'test-component',
      element: mockElement,
      phase: 'creation'
    } as ModifierContext
  })

  describe('All Gradient Types with Background Modifier', () => {
    it('applies LinearGradient through background modifier', () => {
      const gradient = LinearGradient({
        colors: ['#FF0000', '#00FF00'],
        startPoint: 'top',
        endPoint: 'bottom'
      })

      const modifier = new BackgroundModifier({ background: gradient })
      modifier.apply({} as any, mockContext)

      expect(mockElement.style.background).toBe('linear-gradient(to bottom, #FF0000, #00FF00)')
    })

    it('applies RadialGradient through background modifier', () => {
      const gradient = RadialGradient({
        colors: ['#FF0000', '#00FF00'],
        center: 'center',
        startRadius: 0,
        endRadius: 100
      })

      const modifier = new BackgroundModifier({ background: gradient })
      modifier.apply({} as any, mockContext)

      expect(mockElement.style.background).toBe('radial-gradient(circle 100px at center, #FF0000, #00FF00)')
    })

    it('applies AngularGradient through background modifier', () => {
      const gradient = AngularGradient({
        colors: ['#FF0000', '#00FF00'],
        center: 'center',
        startAngle: 0,
        endAngle: 360
      })

      const modifier = new BackgroundModifier({ background: gradient })
      modifier.apply({} as any, mockContext)

      expect(mockElement.style.background).toBe('conic-gradient(from 0deg at center, #FF0000, #00FF00)')
    })

    it('applies RepeatingLinearGradient through background modifier', () => {
      const gradient = RepeatingLinearGradient({
        colors: ['#FF0000', '#00FF00'],
        direction: '45deg',
        colorStops: ['0px', '20px']
      })

      const modifier = new BackgroundModifier({ background: gradient })
      modifier.apply({} as any, mockContext)

      expect(mockElement.style.background).toBe('repeating-linear-gradient(45deg, #FF0000 0px, #00FF00 20px)')
    })

    it('applies RepeatingRadialGradient through background modifier', () => {
      const gradient = RepeatingRadialGradient({
        colors: ['#FF0000', '#00FF00'],
        center: 'center',
        colorStops: ['0px', '30px']
      })

      const modifier = new BackgroundModifier({ background: gradient })
      modifier.apply({} as any, mockContext)

      expect(mockElement.style.background).toBe('repeating-radial-gradient(circle at center, #FF0000 0px, #00FF00 30px)')
    })
  })

  describe('Asset Integration Across All Gradient Types', () => {
    it('works with Asset colors in LinearGradient', () => {
      const redAsset = createColorAsset('#FF0000', '#AA0000', 'red')
      const blueAsset = createColorAsset('#0000FF', '#0000AA', 'blue')

      const gradient = LinearGradient({
        colors: [redAsset, blueAsset],
        startPoint: 'top',
        endPoint: 'bottom'
      })

      const css = gradientToCSS(gradient)
      expect(css).toContain('#FF0000')
      expect(css).toContain('#0000FF')
    })

    it('works with Asset colors in RadialGradient', () => {
      const greenAsset = createColorAsset('#00FF00', '#00AA00', 'green')
      const yellowAsset = createColorAsset('#FFFF00', '#AAAA00', 'yellow')

      const gradient = RadialGradient({
        colors: [greenAsset, yellowAsset],
        center: 'center',
        startRadius: 0,
        endRadius: 50
      })

      const css = gradientToCSS(gradient)
      expect(css).toContain('#00FF00')
      expect(css).toContain('#FFFF00')
    })

    it('works with Asset colors in AngularGradient', () => {
      const purpleAsset = createColorAsset('#800080', '#400040', 'purple')
      const orangeAsset = createColorAsset('#FFA500', '#CC8400', 'orange')

      const gradient = AngularGradient({
        colors: [purpleAsset, orangeAsset],
        center: 'center',
        startAngle: 0,
        endAngle: 180
      })

      const css = gradientToCSS(gradient)
      expect(css).toContain('#800080')
      expect(css).toContain('#FFA500')
    })
  })

  describe('Theme-Reactive Gradient Assets', () => {
    it('creates theme-reactive LinearGradient assets', () => {
      const gradientAsset = createGradientAsset({
        light: LinearGradient({
          colors: ['#ffffff', '#f8f9fa'],
          startPoint: 'top',
          endPoint: 'bottom'
        }),
        dark: LinearGradient({
          colors: ['#343a40', '#212529'],
          startPoint: 'top',
          endPoint: 'bottom'
        })
      })

      expect(gradientAsset.resolve()).toContain('linear-gradient')
    })

    it('creates theme-reactive RadialGradient assets', () => {
      const gradientAsset = createGradientAsset({
        light: RadialGradient({
          colors: ['#007bff', '#0056b3'],
          center: 'center',
          startRadius: 0,
          endRadius: 100
        }),
        dark: RadialGradient({
          colors: ['#0d6efd', '#0b5ed7'],
          center: 'center',
          startRadius: 0,
          endRadius: 100
        })
      })

      expect(gradientAsset.resolve()).toContain('radial-gradient')
    })

    it('creates theme-reactive AngularGradient assets', () => {
      const gradientAsset = createGradientAsset({
        light: AngularGradient({
          colors: ['#20c997', '#17a2b8'],
          center: 'center',
          startAngle: 0,
          endAngle: 360
        }),
        dark: AngularGradient({
          colors: ['#20c997', '#0dcaf0'],
          center: 'center',
          startAngle: 0,
          endAngle: 360
        })
      })

      expect(gradientAsset.resolve()).toContain('conic-gradient')
    })
  })

  describe('Advanced Color Stop Support', () => {
    it('supports precise color stops in LinearGradient', () => {
      const gradient = LinearGradient({
        colors: ['#ff0000', '#ffff00', '#00ff00', '#00ffff', '#0000ff'],
        startPoint: 'top',
        endPoint: 'bottom',
        stops: [0, 25, 50, 75, 100]
      })

      const css = gradientToCSS(gradient)
      expect(css).toContain('#ff0000 0%')
      expect(css).toContain('#ffff00 25%')
      expect(css).toContain('#00ff00 50%')
      expect(css).toContain('#00ffff 75%')
      expect(css).toContain('#0000ff 100%')
    })

    it('supports precise color stops in RadialGradient', () => {
      const gradient = RadialGradient({
        colors: ['#ff0000', '#00ff00', '#0000ff'],
        center: 'center',
        startRadius: 0,
        endRadius: 100,
        stops: [0, 60, 100]
      })

      const css = gradientToCSS(gradient)
      expect(css).toContain('#ff0000 0%')
      expect(css).toContain('#00ff00 60%')
      expect(css).toContain('#0000ff 100%')
    })

    it('supports precise color stops in AngularGradient', () => {
      const gradient = AngularGradient({
        colors: ['#ff0000', '#00ff00', '#0000ff'],
        center: 'center',
        startAngle: 0,
        endAngle: 360,
        stops: [0, 50, 100]
      })

      const css = gradientToCSS(gradient)
      expect(css).toContain('#ff0000 0%')
      expect(css).toContain('#00ff00 50%')
      expect(css).toContain('#0000ff 100%')
    })
  })

  describe('Complex Gradient Patterns', () => {
    it('creates rainbow angular gradient', () => {
      const rainbow = AngularGradient({
        colors: [
          '#ff0000', // Red
          '#ff7f00', // Orange
          '#ffff00', // Yellow
          '#00ff00', // Green
          '#0000ff', // Blue
          '#4b0082', // Indigo
          '#9400d3'  // Violet
        ],
        center: 'center',
        startAngle: 0,
        endAngle: 360
      })

      const css = gradientToCSS(rainbow)
      expect(css).toContain('conic-gradient')
      expect(css).toContain('#ff0000')
      expect(css).toContain('#9400d3')
    })

    it('creates striped pattern with repeating linear gradient', () => {
      const stripes = RepeatingLinearGradient({
        colors: ['#000000', '#ffffff'],
        direction: '90deg',
        colorStops: ['0px', '10px']
      })

      const css = gradientToCSS(stripes)
      expect(css).toBe('repeating-linear-gradient(90deg, #000000 0px, #ffffff 10px)')
    })

    it('creates concentric circles with repeating radial gradient', () => {
      const circles = RepeatingRadialGradient({
        colors: ['#ff0000', 'transparent'],
        center: 'center',
        colorStops: ['0px', '20px']
      })

      const css = gradientToCSS(circles)
      expect(css).toBe('repeating-radial-gradient(circle at center, #ff0000 0px, transparent 20px)')
    })
  })
})