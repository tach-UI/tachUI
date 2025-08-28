import { describe, it, expect } from 'vitest'
import { RadialGradient } from '../index'
import { generateRadialGradientCSS } from '../css-generator'
import { createColorAsset } from '../../assets'

describe('RadialGradient', () => {
  it('creates a radial gradient definition', () => {
    const gradient = RadialGradient({
      colors: ['#FF0000', '#00FF00'],
      center: 'center',
      startRadius: 0,
      endRadius: 100
    })

    expect(gradient.type).toBe('radial')
    expect(gradient.options.colors).toEqual(['#FF0000', '#00FF00'])
    expect(gradient.options.center).toBe('center')
    expect(gradient.options.startRadius).toBe(0)
    expect(gradient.options.endRadius).toBe(100)
  })

  it('generates correct CSS for simple radial gradient', () => {
    const css = generateRadialGradientCSS({
      colors: ['#FF0000', '#00FF00'],
      center: 'center',
      startRadius: 0,
      endRadius: 100
    })

    expect(css).toBe('radial-gradient(circle 100px at center, #FF0000, #00FF00)')
  })

  it('generates correct CSS for elliptical gradient', () => {
    const css = generateRadialGradientCSS({
      colors: ['#FF0000', '#00FF00'],
      center: 'center',
      startRadius: 0,
      endRadius: 100,
      shape: 'ellipse'
    })

    expect(css).toBe('radial-gradient(ellipse 100px 100px at center, #FF0000, #00FF00)')
  })

  it('supports custom center positioning', () => {
    const css = generateRadialGradientCSS({
      colors: ['#FF0000', '#00FF00'],
      center: 'top',
      startRadius: 0,
      endRadius: 50
    })

    expect(css).toBe('radial-gradient(circle 50px at top, #FF0000, #00FF00)')
  })

  it('supports array-based center positioning', () => {
    const css = generateRadialGradientCSS({
      colors: ['#FF0000', '#00FF00'],
      center: [25, 75],
      startRadius: 0,
      endRadius: 80
    })

    expect(css).toBe('radial-gradient(circle 80px at 25% 75%, #FF0000, #00FF00)')
  })

  it('supports color stops', () => {
    const css = generateRadialGradientCSS({
      colors: ['#FF0000', '#FFFF00', '#00FF00'],
      center: 'center',
      startRadius: 0,
      endRadius: 100,
      stops: [0, 50, 100]
    })

    expect(css).toBe('radial-gradient(circle 100px at center, #FF0000 0%, #FFFF00 50%, #00FF00 100%)')
  })

  it('works with Asset colors', () => {
    const redAsset = createColorAsset('#FF0000', '#AA0000', 'red-asset')
    const greenAsset = createColorAsset('#00FF00', '#00AA00', 'green-asset')

    const css = generateRadialGradientCSS({
      colors: [redAsset, greenAsset],
      center: 'center',
      startRadius: 0,
      endRadius: 100
    })

    expect(css).toContain('radial-gradient(circle 100px at center,')
    expect(css).toContain('#FF0000')
    expect(css).toContain('#00FF00')
  })

  it('handles mixed static colors and Assets', () => {
    const blueAsset = createColorAsset('#0000FF', '#0000AA', 'blue-asset')

    const css = generateRadialGradientCSS({
      colors: ['#FF0000', blueAsset, '#00FF00'],
      center: 'center',
      startRadius: 10,
      endRadius: 100
    })

    expect(css).toContain('radial-gradient(circle 100px at center,')
    expect(css).toContain('#FF0000')
    expect(css).toContain('#0000FF')
    expect(css).toContain('#00FF00')
  })
})