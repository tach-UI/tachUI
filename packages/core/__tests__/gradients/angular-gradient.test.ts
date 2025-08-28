import { describe, it, expect } from 'vitest'
import { AngularGradient } from '../../src/gradients/index'
import { generateAngularGradientCSS } from '../../src/gradients/css-generator'
import { createColorAsset } from '../../src/assets'

describe('AngularGradient', () => {
  it('creates an angular gradient definition', () => {
    const gradient = AngularGradient({
      colors: ['#FF0000', '#00FF00', '#0000FF'],
      center: 'center',
      startAngle: 0,
      endAngle: 360,
    })

    expect(gradient.type).toBe('angular')
    expect(gradient.options.colors).toEqual(['#FF0000', '#00FF00', '#0000FF'])
    expect(gradient.options.center).toBe('center')
    expect(gradient.options.startAngle).toBe(0)
    expect(gradient.options.endAngle).toBe(360)
  })

  it('generates correct CSS for simple angular gradient', () => {
    const css = generateAngularGradientCSS({
      colors: ['#FF0000', '#00FF00'],
      center: 'center',
      startAngle: 0,
      endAngle: 360,
    })

    expect(css).toBe('conic-gradient(from 0deg at center, #FF0000, #00FF00)')
  })

  it('supports custom center positioning', () => {
    const css = generateAngularGradientCSS({
      colors: ['#FF0000', '#00FF00'],
      center: 'top',
      startAngle: 45,
      endAngle: 225,
    })

    expect(css).toBe('conic-gradient(from 45deg at top, #FF0000, #00FF00)')
  })

  it('supports array-based center positioning', () => {
    const css = generateAngularGradientCSS({
      colors: ['#FF0000', '#00FF00'],
      center: [30, 70],
      startAngle: 90,
      endAngle: 270,
    })

    expect(css).toBe('conic-gradient(from 90deg at 30% 70%, #FF0000, #00FF00)')
  })

  it('supports rainbow gradients', () => {
    const css = generateAngularGradientCSS({
      colors: [
        '#ff0000',
        '#ff7f00',
        '#ffff00',
        '#00ff00',
        '#0000ff',
        '#4b0082',
        '#9400d3',
      ],
      center: 'center',
      startAngle: 0,
      endAngle: 360,
    })

    expect(css).toContain('conic-gradient(from 0deg at center,')
    expect(css).toContain('#ff0000')
    expect(css).toContain('#9400d3')
  })

  it('supports color stops', () => {
    const css = generateAngularGradientCSS({
      colors: ['#FF0000', '#FFFF00', '#00FF00'],
      center: 'center',
      startAngle: 0,
      endAngle: 360,
      stops: [0, 50, 100],
    })

    expect(css).toBe(
      'conic-gradient(from 0deg at center, #FF0000 0%, #FFFF00 50%, #00FF00 100%)'
    )
  })

  it('works with Asset colors', () => {
    const redAsset = createColorAsset('#FF0000', '#AA0000', 'red-asset')
    const blueAsset = createColorAsset('#0000FF', '#0000AA', 'blue-asset')

    const css = generateAngularGradientCSS({
      colors: [redAsset, blueAsset],
      center: 'center',
      startAngle: 0,
      endAngle: 180,
    })

    expect(css).toContain('conic-gradient(from 0deg at center,')
    expect(css).toContain('#FF0000')
    expect(css).toContain('#0000FF')
  })

  it('handles mixed static colors and Assets', () => {
    const greenAsset = createColorAsset('#00FF00', '#00AA00', 'green-asset')

    const css = generateAngularGradientCSS({
      colors: ['#FF0000', greenAsset, '#0000FF'],
      center: 'center',
      startAngle: 45,
      endAngle: 315,
    })

    expect(css).toContain('conic-gradient(from 45deg at center,')
    expect(css).toContain('#FF0000')
    expect(css).toContain('#00FF00')
    expect(css).toContain('#0000FF')
  })
})
