/**
 * The gradient fallback pair reaches every emission site (#310, item 2b).
 *
 * Each test sets `interpolation: 'oklab'` explicitly so the assertions do not
 * depend on the framework default. Sites are numbered as in the issue:
 * 1-3 the background modifier (static, theme-reactive asset, stateful),
 * 4-6 the gradient asset classes, 7 SSR (covered in @tachui/ssr).
 */

import { describe, expect, it, vi } from 'vitest'
import { BackgroundModifier } from '@tachui/modifiers/appearance/background'
import { LinearGradient, RadialGradient } from '../../src/gradients/index'
import { createGradientAsset } from '../../src/gradients/gradient-asset'
import { StateGradient } from '../../src/gradients/state-gradient-asset'
import { ReactiveGradients } from '../../src/gradients/reactive'
import { CSSUtils } from '../../src/gradients/utils'
import type { StateGradientOptions } from '../../src/gradients/types'
import type { ModifierContext } from '../../src/modifiers/types'

const BLUE_TO_YELLOW = LinearGradient({
  colors: ['#3B82F6', '#FFD400'],
  startPoint: 'leading',
  endPoint: 'trailing',
  interpolation: 'oklab',
})
const BLUE_TO_YELLOW_PAIR = [
  'linear-gradient(to right, #3B82F6, #FFD400)',
  'linear-gradient(in oklab to right, #3B82F6, #FFD400)',
]

const RED_TO_TEAL = LinearGradient({
  colors: ['#FF0000', '#008080'],
  startPoint: 'top',
  endPoint: 'bottom',
  interpolation: 'oklab',
})
const RED_TO_TEAL_PAIR = [
  'linear-gradient(to bottom, #FF0000, #008080)',
  'linear-gradient(in oklab to bottom, #FF0000, #008080)',
]

function mount(background: unknown, cssProperty: 'background' | 'backgroundColor' = 'background') {
  const element = document.createElement('div')
  const setProperty = vi.spyOn(element.style, 'setProperty')
  const context = {
    componentId: 'fallback-pair',
    element,
    phase: 'creation',
  } as ModifierContext

  new BackgroundModifier({ background: background as any, cssProperty }).apply(
    {} as any,
    context
  )

  return {
    element,
    writes: () => setProperty.mock.calls.map(([property, value]) => [property, value]),
  }
}

describe('site 1: static gradient background', () => {
  it('writes the sRGB declaration, then the hinted one', () => {
    const { writes } = mount(BLUE_TO_YELLOW)

    expect(writes()).toEqual([
      ['background', BLUE_TO_YELLOW_PAIR[0]],
      ['background', BLUE_TO_YELLOW_PAIR[1]],
    ])
  })

  it('writes a single declaration for an srgb gradient', () => {
    const { writes } = mount(
      LinearGradient({
        colors: ['#3B82F6', '#FFD400'],
        startPoint: 'leading',
        endPoint: 'trailing',
        interpolation: 'srgb',
      })
    )

    expect(writes()).toEqual([['background', BLUE_TO_YELLOW_PAIR[0]]])
  })

  it('writes a plain string background once', () => {
    const { writes } = mount('red', 'backgroundColor')

    expect(writes()).toEqual([['background-color', 'red']])
  })
})

describe('site 2: theme-reactive gradient asset', () => {
  it('writes the pair from GradientAsset.resolveDeclarations', () => {
    const asset = createGradientAsset({ light: BLUE_TO_YELLOW, dark: RED_TO_TEAL })
    const { writes } = mount(asset)

    expect(writes()).toEqual([
      ['background', BLUE_TO_YELLOW_PAIR[0]],
      ['background', BLUE_TO_YELLOW_PAIR[1]],
    ])
  })

  it('writes the pair from a StateGradientAsset', () => {
    const asset = StateGradient('cta', { default: BLUE_TO_YELLOW, hover: RED_TO_TEAL })
    const { writes } = mount(asset)

    expect(writes()).toEqual([
      ['background', BLUE_TO_YELLOW_PAIR[0]],
      ['background', BLUE_TO_YELLOW_PAIR[1]],
    ])
  })

  it('still writes a single value for an asset without resolveDeclarations', () => {
    const { writes } = mount({ name: 'plain', resolve: () => '#123456' })

    expect(writes()).toEqual([['background', '#123456']])
  })
})

describe('site 3: stateful background', () => {
  it('writes the pair for the default state and again for hover', () => {
    const stateOptions: StateGradientOptions = {
      default: BLUE_TO_YELLOW,
      hover: RED_TO_TEAL,
    }
    const { element, writes } = mount(stateOptions)

    expect(writes()).toEqual([
      ['background', BLUE_TO_YELLOW_PAIR[0]],
      ['background', BLUE_TO_YELLOW_PAIR[1]],
    ])

    element.dispatchEvent(new Event('mouseenter'))

    expect(writes().slice(2)).toEqual([
      ['background', RED_TO_TEAL_PAIR[0]],
      ['background', RED_TO_TEAL_PAIR[1]],
    ])
  })

  it('writes a hover pair produced by a nested gradient asset', () => {
    const stateOptions: StateGradientOptions = {
      default: '#FFFFFF',
      hover: createGradientAsset({ light: RED_TO_TEAL, dark: RED_TO_TEAL }),
    }
    const { element, writes } = mount(stateOptions)

    expect(writes()).toEqual([['background', '#FFFFFF']])

    element.dispatchEvent(new Event('mouseenter'))

    expect(writes().slice(1)).toEqual([
      ['background', RED_TO_TEAL_PAIR[0]],
      ['background', RED_TO_TEAL_PAIR[1]],
    ])
  })
})

describe('site 4: GradientAsset', () => {
  it('exposes the pair and keeps resolve() on the preferred form', () => {
    const asset = createGradientAsset({ light: BLUE_TO_YELLOW, dark: RED_TO_TEAL })

    expect(asset.resolveDeclarations()).toEqual(BLUE_TO_YELLOW_PAIR)
    expect(asset.resolve()).toBe(BLUE_TO_YELLOW_PAIR[1])
  })
})

describe('site 5: StateGradientAsset', () => {
  it('exposes the pair per state and keeps resolve() on the preferred form', () => {
    const asset = StateGradient('cta', {
      default: BLUE_TO_YELLOW,
      hover: RED_TO_TEAL,
      disabled: '#cccccc',
      animation: { duration: 0 },
    })

    expect(asset.resolveDeclarations()).toEqual(BLUE_TO_YELLOW_PAIR)
    expect(asset.resolve()).toBe(BLUE_TO_YELLOW_PAIR[1])

    asset.setState('hover')
    expect(asset.resolveDeclarations()).toEqual(RED_TO_TEAL_PAIR)
    expect(asset.resolve()).toBe(RED_TO_TEAL_PAIR[1])
    expect(asset.getStateGradient('default')).toBe(BLUE_TO_YELLOW_PAIR[1])

    asset.setState('disabled')
    expect(asset.resolveDeclarations()).toEqual(['#cccccc'])
    expect(asset.resolve()).toBe('#cccccc')
  })

  it('delegates to a nested asset that exposes declarations', () => {
    const nested = createGradientAsset({ light: RED_TO_TEAL, dark: RED_TO_TEAL })
    const asset = StateGradient('cta', { default: nested })

    expect(asset.resolveDeclarations()).toEqual(RED_TO_TEAL_PAIR)
  })

  it('serves the cached list on repeat reads and rebuilds it after an update', () => {
    const asset = StateGradient('cta', { default: BLUE_TO_YELLOW })

    expect(asset.resolveDeclarations()).toEqual(asset.resolveDeclarations())

    asset.updateStateGradients({ default: RED_TO_TEAL })
    expect(asset.resolveDeclarations()).toEqual(RED_TO_TEAL_PAIR)
  })

  it('hands out a copy so a caller cannot corrupt the cache', () => {
    const asset = StateGradient('cta', { default: BLUE_TO_YELLOW })

    const first = asset.resolveDeclarations()
    first.push('background: hacked')
    first[0] = 'hacked'

    expect(asset.resolveDeclarations()).toEqual(BLUE_TO_YELLOW_PAIR)
    expect(asset.resolve()).toBe(BLUE_TO_YELLOW_PAIR[1])
  })
})

describe('site 6: ReactiveGradientAsset', () => {
  it('exposes the pair for a signal-driven gradient', () => {
    const colorSignal = {
      value: '#3B82F6',
      subscribe: () => () => {},
    }
    const asset = ReactiveGradients.linear({
      colors: [colorSignal, '#FFD400'],
      startPoint: 'leading',
      endPoint: 'trailing',
      interpolation: 'oklab',
    })

    expect(asset.resolveDeclarations()).toEqual(BLUE_TO_YELLOW_PAIR)
    expect(asset.resolve()).toBe(BLUE_TO_YELLOW_PAIR[1])
  })

  it('carries interpolation through radial and angular reactive options', () => {
    const radial = ReactiveGradients.radial({
      colors: ['#3B82F6', '#FFD400'],
      center: 'center',
      startRadius: 0,
      endRadius: 50,
      interpolation: 'oklch',
    })
    expect(radial.resolveDeclarations()).toEqual([
      'radial-gradient(circle 50px at center, #3B82F6, #FFD400)',
      'radial-gradient(in oklch circle 50px at center, #3B82F6, #FFD400)',
    ])

    const angular = ReactiveGradients.angular({
      colors: ['#3B82F6', '#FFD400'],
      center: 'center',
      startAngle: 0,
      endAngle: 360,
      interpolation: 'oklab',
    })
    expect(angular.resolveDeclarations()).toEqual([
      'conic-gradient(from 0deg at center, #3B82F6, #FFD400)',
      'conic-gradient(in oklab from 0deg at center, #3B82F6, #FFD400)',
    ])
  })
})

describe('CSSUtils', () => {
  it('withFallback emits the solid color, then the sRGB gradient, then the hinted one', () => {
    expect(CSSUtils.withFallback(BLUE_TO_YELLOW, '#3B82F6')).toBe(
      'background: #3B82F6; background: linear-gradient(to right, #3B82F6, #FFD400); background: linear-gradient(in oklab to right, #3B82F6, #FFD400);'
    )
  })

  it('withFallback keeps its two-declaration shape for an srgb gradient', () => {
    const gradient = RadialGradient({
      colors: ['#3B82F6', '#FFD400'],
      center: 'center',
      startRadius: 0,
      endRadius: 50,
      interpolation: 'srgb',
    })

    expect(CSSUtils.withFallback(gradient, '#3B82F6')).toBe(
      'background: #3B82F6; background: radial-gradient(circle 50px at center, #3B82F6, #FFD400);'
    )
  })

  it('toCustomProperties always carries the sRGB form', () => {
    expect(CSSUtils.toCustomProperties(BLUE_TO_YELLOW)).toEqual({
      '--gradient-background': 'linear-gradient(to right, #3B82F6, #FFD400)',
    })
    expect(CSSUtils.toCustomProperties(BLUE_TO_YELLOW, 'hero')).toEqual({
      '--hero-background': 'linear-gradient(to right, #3B82F6, #FFD400)',
    })
  })

  it('toCustomProperties warns in development when a non-sRGB interpolation was asked for', () => {
    const previousNodeEnv = process.env.NODE_ENV
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    process.env.NODE_ENV = 'development'

    try {
      CSSUtils.toCustomProperties(BLUE_TO_YELLOW)
      expect(warn).toHaveBeenCalledTimes(1)
      expect(warn.mock.calls[0][0]).toContain("'oklab'")
      expect(warn.mock.calls[0][0]).toContain('gradientToDeclarations')

      warn.mockClear()
      // The framework default is not an explicit request; an explicit 'srgb' asks for exactly what it gets.
      CSSUtils.toCustomProperties(
        LinearGradient({ colors: ['#3B82F6', '#FFD400'], startPoint: 'top', endPoint: 'bottom' })
      )
      CSSUtils.toCustomProperties(
        LinearGradient({
          colors: ['#3B82F6', '#FFD400'],
          startPoint: 'top',
          endPoint: 'bottom',
          interpolation: 'srgb',
        })
      )
      expect(warn).not.toHaveBeenCalled()

      process.env.NODE_ENV = 'production'
      CSSUtils.toCustomProperties(BLUE_TO_YELLOW)
      expect(warn).not.toHaveBeenCalled()
    } finally {
      process.env.NODE_ENV = previousNodeEnv
      warn.mockRestore()
    }
  })
})
