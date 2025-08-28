import { describe, it, expect } from 'vitest'
import { LinearGradient } from '../index'
import { generateLinearGradientCSS } from '../css-generator'
import { createColorAsset } from '../../assets'

describe('LinearGradient', () => {
  it('creates a linear gradient definition', () => {
    const gradient = LinearGradient({
      colors: ['#FF0000', '#00FF00'],
      startPoint: 'top',
      endPoint: 'bottom'
    })

    expect(gradient.type).toBe('linear')
    expect(gradient.options.colors).toEqual(['#FF0000', '#00FF00'])
    expect(gradient.options.startPoint).toBe('top')
    expect(gradient.options.endPoint).toBe('bottom')
  })

  it('generates correct CSS for simple gradient', () => {
    const css = generateLinearGradientCSS({
      colors: ['#FF0000', '#00FF00'],
      startPoint: 'top',
      endPoint: 'bottom'
    })

    expect(css).toBe('linear-gradient(to bottom, #FF0000, #00FF00)')
  })

  it('generates correct CSS for diagonal gradient', () => {
    const css = generateLinearGradientCSS({
      colors: ['#FF0000', '#00FF00'],
      startPoint: 'topLeading',
      endPoint: 'bottomTrailing'
    })

    expect(css).toBe('linear-gradient(to bottom right, #FF0000, #00FF00)')
  })

  it('generates correct CSS with angle override', () => {
    const css = generateLinearGradientCSS({
      colors: ['#FF0000', '#00FF00'],
      startPoint: 'top',
      endPoint: 'bottom',
      angle: 45
    })

    expect(css).toBe('linear-gradient(45deg, #FF0000, #00FF00)')
  })

  it('supports color stops', () => {
    const css = generateLinearGradientCSS({
      colors: ['#FF0000', '#00FF00', '#0000FF'],
      startPoint: 'top',
      endPoint: 'bottom',
      stops: [0, 50, 100]
    })

    expect(css).toBe('linear-gradient(to bottom, #FF0000 0%, #00FF00 50%, #0000FF 100%)')
  })

  it('works with Asset colors', () => {
    const redAsset = createColorAsset('#FF0000', '#AA0000', 'red-asset')

    const greenAsset = createColorAsset('#00FF00', '#00AA00', 'green-asset')

    const css = generateLinearGradientCSS({
      colors: [redAsset, greenAsset],
      startPoint: 'top',
      endPoint: 'bottom'
    })

    expect(css).toContain('linear-gradient(to bottom,')
    expect(css).toContain('#FF0000')
    expect(css).toContain('#00FF00')
  })

  it('handles mixed static colors and Assets', () => {
    const blueAsset = createColorAsset('#0000FF', '#0000AA', 'blue-asset')

    const css = generateLinearGradientCSS({
      colors: ['#FF0000', blueAsset, '#00FF00'],
      startPoint: 'top',
      endPoint: 'bottom'
    })

    expect(css).toContain('linear-gradient(to bottom,')
    expect(css).toContain('#FF0000')
    expect(css).toContain('#0000FF')
    expect(css).toContain('#00FF00')
  })
})