/**
 * Gradient interpolation space and the sRGB fallback pair (#310, item 2a).
 */

import { describe, expect, it, vi } from 'vitest'
import {
  AngularGradient,
  ConicGradient,
  EllipticalGradient,
  LinearGradient,
  RadialGradient,
  RepeatingLinearGradient,
  RepeatingRadialGradient,
} from '../../src/gradients/index'
import {
  DEFAULT_GRADIENT_INTERPOLATION,
  gradientToCSS,
  gradientToDeclarations,
  resolveGradientInterpolation,
} from '../../src/gradients/css-generator'
import { GradientTransforms } from '../../src/gradients/utils'

const STOPS = ['#3B82F6', '#FFD400']

describe('gradient interpolation option', () => {
  it('emits the hint before the direction when interpolation is oklab', () => {
    const gradient = LinearGradient({
      colors: STOPS,
      startPoint: 'leading',
      endPoint: 'trailing',
      interpolation: 'oklab',
    })

    expect(gradientToCSS(gradient)).toBe(
      'linear-gradient(in oklab to right, #3B82F6, #FFD400)'
    )
  })

  it('emits an oklch hint when asked', () => {
    const gradient = LinearGradient({
      colors: STOPS,
      startPoint: 'top',
      endPoint: 'bottom',
      interpolation: 'oklch',
    })

    expect(gradientToCSS(gradient)).toBe(
      'linear-gradient(in oklch to bottom, #3B82F6, #FFD400)'
    )
  })

  it('emits no hint and a single declaration for srgb', () => {
    const gradient = LinearGradient({
      colors: STOPS,
      startPoint: 'leading',
      endPoint: 'trailing',
      interpolation: 'srgb',
    })

    expect(gradientToCSS(gradient)).toBe(
      'linear-gradient(to right, #3B82F6, #FFD400)'
    )
    expect(gradientToDeclarations(gradient)).toEqual([
      'linear-gradient(to right, #3B82F6, #FFD400)',
    ])
  })

  it('defaults to oklab, so an unhinted gradient emits the fallback pair', () => {
    expect(DEFAULT_GRADIENT_INTERPOLATION).toBe('oklab')

    const gradient = LinearGradient({
      colors: STOPS,
      startPoint: 'leading',
      endPoint: 'trailing',
    })

    expect(gradientToCSS(gradient)).toBe(
      'linear-gradient(in oklab to right, #3B82F6, #FFD400)'
    )
    expect(gradientToDeclarations(gradient)).toEqual([
      'linear-gradient(to right, #3B82F6, #FFD400)',
      'linear-gradient(in oklab to right, #3B82F6, #FFD400)',
    ])
  })

  it('survives the shape-changing gradient transforms', () => {
    const linear = LinearGradient({
      colors: STOPS,
      startPoint: 'leading',
      endPoint: 'trailing',
      interpolation: 'srgb',
    })

    expect(gradientToCSS(GradientTransforms.toRadial(linear, 40))).toBe(
      'radial-gradient(circle 40px at center, #3B82F6, #FFD400)'
    )
    expect(gradientToCSS(GradientTransforms.toAngular(linear))).toBe(
      'conic-gradient(from 0deg at center, #3B82F6, #FFD400)'
    )
    expect(gradientToCSS(GradientTransforms.mirror(linear))).toBe(
      'linear-gradient(to left, #3B82F6, #FFD400)'
    )
  })

  it('falls back to the framework default when interpolation is not set', () => {
    const gradient = LinearGradient({
      colors: STOPS,
      startPoint: 'leading',
      endPoint: 'trailing',
    })

    expect(resolveGradientInterpolation(gradient.options)).toBe(
      DEFAULT_GRADIENT_INTERPOLATION
    )

    const declarations = gradientToDeclarations(gradient)
    if (DEFAULT_GRADIENT_INTERPOLATION === 'srgb') {
      expect(declarations).toEqual(['linear-gradient(to right, #3B82F6, #FFD400)'])
      expect(gradientToCSS(gradient)).not.toContain(' in ')
    } else {
      expect(declarations).toEqual([
        'linear-gradient(to right, #3B82F6, #FFD400)',
        `linear-gradient(in ${DEFAULT_GRADIENT_INTERPOLATION} to right, #3B82F6, #FFD400)`,
      ])
      expect(gradientToCSS(gradient)).toBe(declarations[1])
    }
  })
})

describe('gradientToDeclarations', () => {
  it('returns the sRGB fallback first and the hinted form second', () => {
    const gradient = LinearGradient({
      colors: STOPS,
      stops: [0, 100],
      startPoint: 'top',
      endPoint: 'bottom',
      interpolation: 'oklab',
    })

    expect(gradientToDeclarations(gradient)).toEqual([
      'linear-gradient(to bottom, #3B82F6 0%, #FFD400 100%)',
      'linear-gradient(in oklab to bottom, #3B82F6 0%, #FFD400 100%)',
    ])
  })

  it('keeps gradientToCSS equal to the preferred declaration', () => {
    const gradient = RadialGradient({
      colors: STOPS,
      center: 'center',
      startRadius: 0,
      endRadius: 100,
      interpolation: 'oklab',
    })

    const declarations = gradientToDeclarations(gradient)
    expect(declarations).toHaveLength(2)
    expect(gradientToCSS(gradient)).toBe(declarations[1])
  })

  it('resolves each color asset once for the pair', () => {
    const asset = { name: 'brand', resolve: vi.fn(() => '#FF0000') }
    const gradient = LinearGradient({
      colors: [asset, '#0000FF'],
      startPoint: 'leading',
      endPoint: 'trailing',
      interpolation: 'oklab',
    })

    expect(gradientToDeclarations(gradient)).toEqual([
      'linear-gradient(to right, #FF0000, #0000FF)',
      'linear-gradient(in oklab to right, #FF0000, #0000FF)',
    ])
    expect(asset.resolve).toHaveBeenCalledTimes(1)
  })

  it('throws for an unknown gradient type', () => {
    expect(() =>
      gradientToDeclarations({ type: 'bogus' as any, options: { colors: STOPS } })
    ).toThrow('Unknown gradient type: bogus')
  })
})

describe('interpolation hint on every gradient type', () => {
  it.each([
    [
      'radial',
      RadialGradient({
        colors: STOPS,
        center: 'center',
        startRadius: 0,
        endRadius: 100,
        interpolation: 'oklab',
      }),
      'radial-gradient(in oklab circle 100px at center, #3B82F6, #FFD400)',
      'radial-gradient(circle 100px at center, #3B82F6, #FFD400)',
    ],
    [
      'angular',
      AngularGradient({
        colors: STOPS,
        center: 'center',
        startAngle: 0,
        endAngle: 360,
        interpolation: 'oklab',
      }),
      'conic-gradient(in oklab from 0deg at center, #3B82F6, #FFD400)',
      'conic-gradient(from 0deg at center, #3B82F6, #FFD400)',
    ],
    [
      'conic',
      ConicGradient({
        colors: STOPS,
        center: [25, 75],
        startAngle: 90,
        interpolation: 'oklch',
      }),
      'conic-gradient(in oklch from 90deg at 25% 75%, #3B82F6, #FFD400)',
      'conic-gradient(from 90deg at 25% 75%, #3B82F6, #FFD400)',
    ],
    [
      'repeating-linear',
      RepeatingLinearGradient({
        colors: STOPS,
        direction: '45deg',
        colorStops: ['0px', '20px'],
        interpolation: 'oklab',
      }),
      'repeating-linear-gradient(in oklab 45deg, #3B82F6 0px, #FFD400 20px)',
      'repeating-linear-gradient(45deg, #3B82F6 0px, #FFD400 20px)',
    ],
    [
      'repeating-radial',
      RepeatingRadialGradient({
        colors: STOPS,
        center: 'top',
        colorStops: ['0px', '20px'],
        interpolation: 'oklab',
      }),
      'repeating-radial-gradient(in oklab circle at top, #3B82F6 0px, #FFD400 20px)',
      'repeating-radial-gradient(circle at top, #3B82F6 0px, #FFD400 20px)',
    ],
    [
      'elliptical',
      EllipticalGradient({
        colors: STOPS,
        center: 'leading',
        radiusX: 100,
        radiusY: 50,
        interpolation: 'oklab',
      }),
      'radial-gradient(in oklab ellipse 100px 50px at left, #3B82F6, #FFD400)',
      'radial-gradient(ellipse 100px 50px at left, #3B82F6, #FFD400)',
    ],
  ])('%s', (_type, gradient, preferred, fallback) => {
    expect(gradientToCSS(gradient)).toBe(preferred)
    expect(gradientToDeclarations(gradient)).toEqual([fallback, preferred])
  })
})
