/**
 * Perceptual properties of the ColorAsset numeric transforms (#310).
 *
 * These assert the property the OKLab rewrite exists for — a nominal amount
 * means the same perceptual step on every hue — rather than pinning hex
 * outputs. Tolerances are in OKLab L against the issue's baseline data.
 */

import { describe, expect, it } from 'vitest'
import { ColorAsset } from '../../src/assets/ColorAsset'
import {
  maxChroma,
  oklabToOklch,
  oklchToRgb,
  rgbToOklab,
  type OklchColor,
  type RGBChannels,
} from '../../src/assets/color-space'

const LIGHTNESS_TOLERANCE = 0.02
const HUE_TOLERANCE_DEGREES = 1
const HEX_PATTERN = /^#[0-9a-f]{6}$/i

function hexToRgb(hex: string): RGBChannels {
  const raw = hex.replace('#', '')
  return [
    Number.parseInt(raw.slice(0, 2), 16),
    Number.parseInt(raw.slice(2, 4), 16),
    Number.parseInt(raw.slice(4, 6), 16),
  ]
}

function rgbToHex([red, green, blue]: RGBChannels): string {
  const toHex = (value: number): string => value.toString(16).padStart(2, '0')
  return `#${toHex(red)}${toHex(green)}${toHex(blue)}`.toUpperCase()
}

function oklchOf(hex: string): OklchColor {
  return oklabToOklch(rgbToOklab(...hexToRgb(hex)))
}

function lightnessOf(hex: string): number {
  return oklchOf(hex)[0]
}

function hueDistance(a: number, b: number): number {
  const delta = Math.abs(a - b) % 360
  return Math.min(delta, 360 - delta)
}

function probe(hex: string): ColorAsset {
  return ColorAsset.init({ name: 'probe', default: hex })
}

const ISSUE_COLORS = ['#3B82F6', '#FFD400', '#00FF00', '#008000', '#800000', '#679B9C']

describe('sRGB <-> OKLab conversion', () => {
  it.each([
    ['#3B82F6', 0.6231],
    ['#FFD400', 0.8809],
    ['#00FF00', 0.8664],
    ['#808080', 0.5999],
    ['#999999', 0.683],
  ])('measures %s at the OKLab lightness recorded in #310 (%f)', (hex, lightness) => {
    expect(lightnessOf(hex)).toBeCloseTo(lightness, 4)
  })

  it('round-trips every 8-bit gray exactly', () => {
    for (let value = 0; value <= 255; value += 15) {
      const [lightness, a, b] = rgbToOklab(value, value, value)
      expect(oklchToRgb(...oklabToOklch([lightness, a, b]))).toEqual([value, value, value])
    }
  })

  it('reports a chroma ceiling the primaries sit on', () => {
    const [lightness, chroma, hue] = oklchOf('#00FF00')
    expect(maxChroma(lightness, hue)).toBeCloseTo(chroma, 4)
  })
})

describe('brighten uniformity', () => {
  it.each([0.3, -0.3])(
    'brighten(%f) moves OKLab lightness by the same amount on every hue at fixed L',
    amount => {
      const deltas: number[] = []
      for (let hue = 0; hue < 360; hue += 30) {
        const input = rgbToHex(oklchToRgb(0.6, 0.1, hue))
        const output = probe(input).brighten(amount).resolve()
        deltas.push(lightnessOf(output) - lightnessOf(input))
      }
      expect(Math.max(...deltas) - Math.min(...deltas)).toBeLessThanOrEqual(
        LIGHTNESS_TOLERANCE
      )
      // The step is in the requested direction and not degenerate.
      for (const delta of deltas) {
        expect(Math.sign(delta)).toBe(Math.sign(amount))
        expect(Math.abs(delta)).toBeGreaterThan(0.05)
      }
    }
  )

  it('lerps lightness toward white for positive amounts and black for negative', () => {
    for (const hex of ISSUE_COLORS) {
      const lightness = lightnessOf(hex)
      expect(lightnessOf(probe(hex).brighten(0.5).resolve())).toBeCloseTo(
        lightness + (1 - lightness) * 0.5,
        1
      )
      expect(lightnessOf(probe(hex).brighten(-0.5).resolve())).toBeCloseTo(
        lightness * 0.5,
        1
      )
      expect(probe(hex).brighten(1).resolve()).toBe('#FFFFFF')
      expect(probe(hex).brighten(-1).resolve()).toBe('#000000')
    }
  })
})

describe('rotateHue lightness preservation', () => {
  it('holds OKLab lightness around a full wheel in 60° steps', () => {
    const start = lightnessOf('#3B82F6')
    for (let degrees = 0; degrees <= 360; degrees += 60) {
      const output = probe('#3B82F6').rotateHue(degrees).resolve()
      expect(Math.abs(lightnessOf(output) - start)).toBeLessThanOrEqual(
        LIGHTNESS_TOLERANCE
      )
    }
  })

  it('holds OKLab lightness when the rotation is applied step by step', () => {
    const start = lightnessOf('#3B82F6')
    let current = probe('#3B82F6')
    for (let step = 0; step < 6; step += 1) {
      current = current.rotateHue(60)
      expect(Math.abs(lightnessOf(current.resolve()) - start)).toBeLessThanOrEqual(
        LIGHTNESS_TOLERANCE
      )
    }
  })

  it('rotates OKLCH hue by the requested angle', () => {
    for (const hex of ['#3B82F6', '#B1667E', '#519160']) {
      const [, , hue] = oklchOf(hex)
      for (const degrees of [45, 120, 200, 300]) {
        const [, , rotatedHue] = oklchOf(probe(hex).rotateHue(degrees).resolve())
        expect(hueDistance(rotatedHue, hue + degrees)).toBeLessThanOrEqual(
          HUE_TOLERANCE_DEGREES
        )
      }
    }
  })
})

describe('saturate lightness preservation', () => {
  it('saturate(-1) yields the gray of the same OKLab lightness for every input', () => {
    for (const hex of ISSUE_COLORS) {
      const output = probe(hex).saturate(-1).resolve()
      const [lightness, chroma] = oklchOf(output)
      expect(Math.abs(lightness - lightnessOf(hex))).toBeLessThanOrEqual(
        LIGHTNESS_TOLERANCE
      )
      expect(chroma).toBeLessThan(0.005)
    }
  })

  it('saturate(1) reaches the sRGB chroma ceiling without moving lightness or hue', () => {
    for (const hex of ['#679B9C', '#B1667E', '#4188B6']) {
      const [lightness, chroma, hue] = oklchOf(hex)
      const [outLightness, outChroma, outHue] = oklchOf(probe(hex).saturate(1).resolve())
      expect(Math.abs(outLightness - lightness)).toBeLessThanOrEqual(LIGHTNESS_TOLERANCE)
      expect(hueDistance(outHue, hue)).toBeLessThanOrEqual(HUE_TOLERANCE_DEGREES)
      expect(outChroma).toBeGreaterThan(chroma)
      expect(outChroma).toBeCloseTo(maxChroma(lightness, hue), 2)
    }
  })
})

describe('round trips', () => {
  const inputs = [...ISSUE_COLORS, '#000000', '#FFFFFF', '#808080', '#0000FF']

  it.each(inputs)('rotateHue(360) and rotateHue(0) return %s exactly', hex => {
    expect(probe(hex).rotateHue(360).resolve()).toBe(hex)
    expect(probe(hex).rotateHue(0).resolve()).toBe(hex)
    expect(probe(hex).rotateHue(720).resolve()).toBe(hex)
  })

  it.each(inputs)('zero-amount saturate/brighten/contrast return %s exactly', hex => {
    expect(probe(hex).saturate(0).resolve()).toBe(hex)
    expect(probe(hex).brighten(0).resolve()).toBe(hex)
    expect(probe(hex).contrast(0).resolve()).toBe(hex)
  })
})

describe('gamut', () => {
  it('always emits an in-gamut 6-digit hex', () => {
    for (const hex of [...ISSUE_COLORS, '#0000FF', '#FF00FF', '#FFFFFF', '#000000']) {
      for (const amount of [-1, -0.5, 0.5, 1]) {
        expect(probe(hex).brighten(amount).resolve()).toMatch(HEX_PATTERN)
        expect(probe(hex).saturate(amount).resolve()).toMatch(HEX_PATTERN)
        expect(probe(hex).contrast(amount).resolve()).toMatch(HEX_PATTERN)
      }
      for (const degrees of [30, 90, 180, 270]) {
        expect(probe(hex).rotateHue(degrees).resolve()).toMatch(HEX_PATTERN)
      }
    }
  })

  it('reduces chroma rather than shifting hue when #00FF00 leaves the gamut', () => {
    const [, chroma, hue] = oklchOf('#00FF00')

    const brightened = oklchOf(probe('#00FF00').brighten(0.3).resolve())
    expect(hueDistance(brightened[2], hue)).toBeLessThanOrEqual(HUE_TOLERANCE_DEGREES)
    expect(brightened[1]).toBeLessThan(chroma)

    const darkened = oklchOf(probe('#00FF00').brighten(-0.3).resolve())
    expect(hueDistance(darkened[2], hue)).toBeLessThanOrEqual(HUE_TOLERANCE_DEGREES)

    // Already on the ceiling: saturating further is a no-op, not a clip.
    expect(probe('#00FF00').saturate(1).resolve()).toBe('#00FF00')
    expect(probe('#00FF00').saturate(0.5).resolve()).toBe('#00FF00')
  })
})

describe('contrast', () => {
  it('collapses every opaque color to the same OKLab mid-gray at contrast(-1)', () => {
    const grays = new Set(ISSUE_COLORS.map(hex => probe(hex).contrast(-1).resolve()))
    expect(grays.size).toBe(1)
    const [gray] = grays
    const [lightness, chroma] = oklchOf(gray)
    expect(lightness).toBeCloseTo(0.5, 2)
    expect(chroma).toBeLessThan(0.005)
  })

  it('scales lightness about mid-gray and keeps hue', () => {
    for (const hex of ['#679B9C', '#B1667E', '#4188B6']) {
      const [lightness, , hue] = oklchOf(hex)
      const [outLightness, , outHue] = oklchOf(probe(hex).contrast(0.5).resolve())
      expect(outLightness).toBeCloseTo(0.5 + (lightness - 0.5) * 1.5, 1)
      expect(hueDistance(outHue, hue)).toBeLessThanOrEqual(HUE_TOLERANCE_DEGREES)
    }
  })
})
