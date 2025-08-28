import { describe, it, expect } from 'vitest'
import {
  RepeatingLinearGradient,
  RepeatingRadialGradient,
} from '../../src/gradients/index'
import {
  generateRepeatingLinearGradientCSS,
  generateRepeatingRadialGradientCSS,
} from '../../src/gradients/css-generator'
import { createColorAsset } from '../../src/assets'

describe('RepeatingLinearGradient', () => {
  it('creates a repeating linear gradient definition', () => {
    const gradient = RepeatingLinearGradient({
      colors: ['#FF0000', '#00FF00'],
      direction: '45deg',
      colorStops: ['0px', '20px'],
    })

    expect(gradient.type).toBe('repeating-linear')
    expect(gradient.options.colors).toEqual(['#FF0000', '#00FF00'])
    expect(gradient.options.direction).toBe('45deg')
    expect(gradient.options.colorStops).toEqual(['0px', '20px'])
  })

  it('generates correct CSS for repeating linear gradient', () => {
    const css = generateRepeatingLinearGradientCSS({
      colors: ['#FF0000', '#00FF00'],
      direction: '45deg',
      colorStops: ['0px', '20px'],
    })

    expect(css).toBe(
      'repeating-linear-gradient(45deg, #FF0000 0px, #00FF00 20px)'
    )
  })

  it('supports stripe patterns', () => {
    const css = generateRepeatingLinearGradientCSS({
      colors: ['#000000', '#ffffff', '#000000'],
      direction: '90deg',
      colorStops: ['0px', '10px', '20px'],
    })

    expect(css).toBe(
      'repeating-linear-gradient(90deg, #000000 0px, #ffffff 10px, #000000 20px)'
    )
  })

  it('works with Asset colors', () => {
    const redAsset = createColorAsset('#FF0000', '#AA0000', 'red-asset')
    const blueAsset = createColorAsset('#0000FF', '#0000AA', 'blue-asset')

    const css = generateRepeatingLinearGradientCSS({
      colors: [redAsset, blueAsset],
      direction: '0deg',
      colorStops: ['0px', '15px'],
    })

    expect(css).toContain('repeating-linear-gradient(0deg,')
    expect(css).toContain('#FF0000 0px')
    expect(css).toContain('#0000FF 15px')
  })
})

describe('RepeatingRadialGradient', () => {
  it('creates a repeating radial gradient definition', () => {
    const gradient = RepeatingRadialGradient({
      colors: ['#FF0000', '#00FF00'],
      center: 'center',
      colorStops: ['0px', '25px'],
    })

    expect(gradient.type).toBe('repeating-radial')
    expect(gradient.options.colors).toEqual(['#FF0000', '#00FF00'])
    expect(gradient.options.center).toBe('center')
    expect(gradient.options.colorStops).toEqual(['0px', '25px'])
  })

  it('generates correct CSS for repeating radial gradient', () => {
    const css = generateRepeatingRadialGradientCSS({
      colors: ['#FF0000', '#00FF00'],
      center: 'center',
      colorStops: ['0px', '30px'],
    })

    expect(css).toBe(
      'repeating-radial-gradient(circle at center, #FF0000 0px, #00FF00 30px)'
    )
  })

  it('supports ellipse shape', () => {
    const css = generateRepeatingRadialGradientCSS({
      colors: ['#FF0000', '#00FF00'],
      center: 'top',
      shape: 'ellipse',
      colorStops: ['0px', '40px'],
    })

    expect(css).toBe(
      'repeating-radial-gradient(ellipse at top, #FF0000 0px, #00FF00 40px)'
    )
  })

  it('supports array-based center positioning', () => {
    const css = generateRepeatingRadialGradientCSS({
      colors: ['#FF0000', '#00FF00'],
      center: [30, 70],
      colorStops: ['0px', '20px'],
    })

    expect(css).toBe(
      'repeating-radial-gradient(circle at 30% 70%, #FF0000 0px, #00FF00 20px)'
    )
  })

  it('works with Asset colors', () => {
    const yellowAsset = createColorAsset('#FFFF00', '#AAAA00', 'yellow-asset')
    const purpleAsset = createColorAsset('#800080', '#400040', 'purple-asset')

    const css = generateRepeatingRadialGradientCSS({
      colors: [yellowAsset, purpleAsset],
      center: 'center',
      colorStops: ['0px', '35px'],
    })

    expect(css).toContain('repeating-radial-gradient(circle at center,')
    expect(css).toContain('#FFFF00 0px')
    expect(css).toContain('#800080 35px')
  })

  it('supports complex patterns', () => {
    const css = generateRepeatingRadialGradientCSS({
      colors: ['#ff0000', 'transparent', '#ff0000', 'transparent'],
      center: 'center',
      colorStops: ['0px', '5px', '10px', '15px'],
    })

    expect(css).toBe(
      'repeating-radial-gradient(circle at center, #ff0000 0px, transparent 5px, #ff0000 10px, transparent 15px)'
    )
  })
})
