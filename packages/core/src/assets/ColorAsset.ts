/**
 * Color Asset for TachUI Assets system
 *
 * Represents a theme-adaptive color with light and dark variants.
 */

import {
  getCurrentTheme as _getCurrentTheme,
  getThemeSignal,
} from '../reactive/theme'
import { getCurrentComputation } from '../reactive/context'
import { Asset } from './Asset'
import type { ColorValidationResult } from './types'

/**
 * ColorAsset initialization options
 */
export interface ColorAssetOptions {
  default: string // Required - fallback for any theme
  light?: string // Optional - light theme override
  dark?: string // Optional - dark theme override
  name: string // Required - asset identifier
}

export class ColorAsset extends Asset {
  public readonly default: string
  public readonly light?: string
  public readonly dark?: string
  private static readonly HEX_REGEX =
    /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/
  private static readonly RGB_REGEX =
    /^rgb\s*\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*\)$/i
  private static readonly RGBA_REGEX =
    /^rgba\s*\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]*\.?[0-9]+)\s*\)$/i
  private static readonly HSL_REGEX =
    /^hsl\s*\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})%\s*,\s*([0-9]{1,3})%\s*\)$/i
  private static readonly HSLA_REGEX =
    /^hsla\s*\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})%\s*,\s*([0-9]{1,3})%\s*,\s*([0-9]*\.?[0-9]+)\s*\)$/i
  // Deliberately partial named-color mapping used for numeric saturation transforms.
  // Unlisted CSS color names fall through and are returned unchanged by `saturate`.
  private static readonly NAMED_COLOR_RGB: Record<string, [number, number, number, number]> = {
    transparent: [0, 0, 0, 0],
    black: [0, 0, 0, 1],
    white: [255, 255, 255, 1],
    red: [255, 0, 0, 1],
    green: [0, 128, 0, 1],
    blue: [0, 0, 255, 1],
    yellow: [255, 255, 0, 1],
    cyan: [0, 255, 255, 1],
    magenta: [255, 0, 255, 1],
    gray: [128, 128, 128, 1],
    grey: [128, 128, 128, 1],
    orange: [255, 165, 0, 1],
    purple: [128, 0, 128, 1],
    pink: [255, 192, 203, 1],
    brown: [165, 42, 42, 1],
    navy: [0, 0, 128, 1],
    teal: [0, 128, 128, 1],
    lime: [0, 255, 0, 1],
    olive: [128, 128, 0, 1],
    maroon: [128, 0, 0, 1],
    silver: [192, 192, 192, 1],
    aqua: [0, 255, 255, 1],
    fuchsia: [255, 0, 255, 1],
  }

  constructor(options: ColorAssetOptions) {
    super(options.name)

    // Validate that default is provided
    if (!options.default) {
      throw new Error(
        `ColorAsset "${options.name}" must specify a default color`
      )
    }

    // Validate color formats
    const defaultValidation = ColorAsset.validateColor(options.default)
    if (!defaultValidation.isValid) {
      throw new Error(
        `Invalid default color format for asset "${options.name}": ${defaultValidation.error}`
      )
    }

    if (options.light) {
      const lightValidation = ColorAsset.validateColor(options.light)
      if (!lightValidation.isValid) {
        throw new Error(
          `Invalid light color format for asset "${options.name}": ${lightValidation.error}`
        )
      }
    }

    if (options.dark) {
      const darkValidation = ColorAsset.validateColor(options.dark)
      if (!darkValidation.isValid) {
        throw new Error(
          `Invalid dark color format for asset "${options.name}": ${darkValidation.error}`
        )
      }
    }

    this.default = options.default
    this.light = options.light
    this.dark = options.dark
  }

  static init(options: ColorAssetOptions): ColorAsset {
    return new ColorAsset(options)
  }

  /**
   * Validates a color string format
   * Supports: hex, rgb, rgba, hsl, hsla, and named colors
   */
  static validateColor(color: string): ColorValidationResult {
    if (!color || typeof color !== 'string') {
      return {
        isValid: false,
        error: 'Color must be a non-empty string',
      }
    }

    const trimmed = color.trim()

    // Hex format validation
    if (ColorAsset.HEX_REGEX.test(trimmed)) {
      return { isValid: true, format: 'hex' }
    }

    // RGB format validation
    if (ColorAsset.RGB_REGEX.test(trimmed)) {
      const matches = trimmed.match(ColorAsset.RGB_REGEX)!
      const [, r, g, b] = matches.map(Number)
      if (r <= 255 && g <= 255 && b <= 255) {
        return { isValid: true, format: 'rgb' }
      }
      return {
        isValid: false,
        error: 'RGB values must be between 0 and 255',
      }
    }

    // RGBA format validation
    if (ColorAsset.RGBA_REGEX.test(trimmed)) {
      const matches = trimmed.match(ColorAsset.RGBA_REGEX)!
      const [, r, g, b, a] = matches
      const numR = Number(r),
        numG = Number(g),
        numB = Number(b),
        numA = Number(a)
      if (numR <= 255 && numG <= 255 && numB <= 255 && numA >= 0 && numA <= 1) {
        return { isValid: true, format: 'rgba' }
      }
      return {
        isValid: false,
        error: 'RGBA values must be: RGB 0-255, alpha 0-1',
      }
    }

    // HSL format validation
    if (ColorAsset.HSL_REGEX.test(trimmed)) {
      const matches = trimmed.match(ColorAsset.HSL_REGEX)!
      const [, h, s, l] = matches.map(Number)
      if (h <= 360 && s <= 100 && l <= 100) {
        return { isValid: true, format: 'hsl' }
      }
      return {
        isValid: false,
        error: 'HSL values must be: H 0-360, S/L 0-100%',
      }
    }

    // HSLA format validation
    if (ColorAsset.HSLA_REGEX.test(trimmed)) {
      const matches = trimmed.match(ColorAsset.HSLA_REGEX)!
      const [, h, s, l, a] = matches
      const numH = Number(h),
        numS = Number(s),
        numL = Number(l),
        numA = Number(a)
      if (numH <= 360 && numS <= 100 && numL <= 100 && numA >= 0 && numA <= 1) {
        return { isValid: true, format: 'hsla' }
      }
      return {
        isValid: false,
        error: 'HSLA values must be: H 0-360, S/L 0-100%, alpha 0-1',
      }
    }

    // Named colors validation (basic set)
    const namedColors = [
      'transparent',
      'currentColor',
      'inherit',
      'initial',
      'unset',
      'black',
      'white',
      'red',
      'green',
      'blue',
      'yellow',
      'cyan',
      'magenta',
      'gray',
      'grey',
      'orange',
      'purple',
      'pink',
      'brown',
      'navy',
      'teal',
      'lime',
      'olive',
      'maroon',
      'silver',
      'aqua',
      'fuchsia',
    ]

    if (namedColors.includes(trimmed.toLowerCase())) {
      return { isValid: true, format: 'named' }
    }

    // CSS custom property format
    if (trimmed.startsWith('var(--') && trimmed.endsWith(')')) {
      return { isValid: true, format: 'named' }
    }

    return {
      isValid: false,
      error:
        'Unsupported color format. Supported: hex, rgb, rgba, hsl, hsla, named colors, CSS custom properties',
    }
  }

  static getCurrentTheme(): string {
    return _getCurrentTheme()
  }

  opacity(alpha: number): string {
    if (!Number.isFinite(alpha)) {
      const error = `ColorAsset.opacity(alpha) requires a finite number for asset "${this.name}"`
      if (process.env.NODE_ENV === 'development') {
        throw new Error(error)
      }
      return this.resolve()
    }

    const clamped = ColorAsset.clamp(alpha, 0, 1)
    return ColorAsset.applyAlpha(this.resolve(), clamped)
  }

  saturate(amount: number): string {
    if (!Number.isFinite(amount)) {
      const error = `ColorAsset.saturate(amount) requires a finite number for asset "${this.name}"`
      if (process.env.NODE_ENV === 'development') {
        throw new Error(error)
      }
      return this.resolve()
    }

    const clamped = ColorAsset.clamp(amount, -1, 1)
    return ColorAsset.applySaturation(this.resolve(), clamped)
  }

  brighten(amount: number): string {
    if (!Number.isFinite(amount)) {
      const error = `ColorAsset.brighten(amount) requires a finite number for asset "${this.name}"`
      if (process.env.NODE_ENV === 'development') {
        throw new Error(error)
      }
      return this.resolve()
    }

    const clamped = ColorAsset.clamp(amount, -1, 1)
    return ColorAsset.applyBrightness(this.resolve(), clamped)
  }

  rotateHue(degrees: number): string {
    if (!Number.isFinite(degrees)) {
      const error = `ColorAsset.rotateHue(degrees) requires a finite number for asset "${this.name}"`
      if (process.env.NODE_ENV === 'development') {
        throw new Error(error)
      }
      return this.resolve()
    }

    // Normalize any finite numeric input into the canonical 0..359 range.
    const normalizedDegrees = ((degrees % 360) + 360) % 360
    return ColorAsset.applyHueRotation(this.resolve(), normalizedDegrees)
  }

  resolve(): string {
    // If we're inside a reactive computation (effect/computed), use reactive theme signal
    // Otherwise, use the static getCurrentTheme for backward compatibility with tests
    const isInReactiveContext = getCurrentComputation() !== null

    let currentTheme: string
    if (isInReactiveContext) {
      // Use reactive theme signal for proper reactivity
      const themeSignal = getThemeSignal()
      currentTheme = themeSignal()
    } else {
      // Use static theme access for tests and non-reactive contexts
      currentTheme = ColorAsset.getCurrentTheme()
    }

    // Resolve priority: theme-specific → default
    if (currentTheme === 'dark') {
      return this.dark || this.default
    } else {
      return this.light || this.default
    }
  }

  private static clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value))
  }

  private static formatAlpha(alpha: number): string {
    if (alpha === 0 || alpha === 1) {
      return String(alpha)
    }
    return Number(alpha.toFixed(4)).toString()
  }

  private static toColorMix(color: string, alpha: number): string {
    // `color-mix` provides a robust fallback for named colors and CSS variables,
    // but requires modern browser support.
    const percent = Number((alpha * 100).toFixed(2)).toString()
    return `color-mix(in srgb, ${color} ${percent}%, transparent)`
  }

  private static applyAlpha(color: string, alpha: number): string {
    const trimmed = color.trim()
    const alphaString = ColorAsset.formatAlpha(alpha)

    if (ColorAsset.HEX_REGEX.test(trimmed)) {
      const [r, g, b] = ColorAsset.parseHex(trimmed)
      return `rgba(${r}, ${g}, ${b}, ${alphaString})`
    }

    const rgbMatch = trimmed.match(ColorAsset.RGB_REGEX)
    if (rgbMatch) {
      const [, r, g, b] = rgbMatch.map(Number)
      return `rgba(${r}, ${g}, ${b}, ${alphaString})`
    }

    const rgbaMatch = trimmed.match(ColorAsset.RGBA_REGEX)
    if (rgbaMatch) {
      const [, r, g, b] = rgbaMatch.map(Number)
      return `rgba(${r}, ${g}, ${b}, ${alphaString})`
    }

    const hslMatch = trimmed.match(ColorAsset.HSL_REGEX)
    if (hslMatch) {
      const [, h, s, l] = hslMatch.map(Number)
      return `hsla(${h}, ${s}%, ${l}%, ${alphaString})`
    }

    const hslaMatch = trimmed.match(ColorAsset.HSLA_REGEX)
    if (hslaMatch) {
      const [, h, s, l] = hslaMatch.map(Number)
      return `hsla(${h}, ${s}%, ${l}%, ${alphaString})`
    }

    return ColorAsset.toColorMix(trimmed, alpha)
  }

  private static parseHex(hexColor: string): [number, number, number] {
    const [r, g, b] = ColorAsset.parseHexWithAlpha(hexColor)
    return [r, g, b]
  }

  private static parseHexWithAlpha(hexColor: string): [number, number, number, number] {
    const rawHex = hexColor.slice(1)
    const normalizedHex6 =
      rawHex.length === 3
        ? rawHex
            .split('')
            .map((digit) => `${digit}${digit}`)
            .join('')
        : rawHex.length === 8
          ? rawHex.slice(0, 6)
          : rawHex

    const alpha =
      rawHex.length === 8 ? Number.parseInt(rawHex.slice(6, 8), 16) / 255 : 1

    const r = Number.parseInt(normalizedHex6.slice(0, 2), 16)
    const g = Number.parseInt(normalizedHex6.slice(2, 4), 16)
    const b = Number.parseInt(normalizedHex6.slice(4, 6), 16)
    return [r, g, b, alpha]
  }

  private static applySaturation(color: string, amount: number): string {
    const hsla = ColorAsset.parseColorToHsla(color)
    if (!hsla) {
      // Unlike `opacity` (which can use `color-mix` as a generic CSS fallback),
      // saturation requires channel math; passthrough keeps unresolved tokens
      // (e.g. CSS vars / unsupported named colors) stable instead of guessing.
      return color
    }

    const saturation =
      amount >= 0
        ? hsla.s + (1 - hsla.s) * amount
        : hsla.s * (1 + amount)

    const nextSaturation = ColorAsset.clamp(saturation, 0, 1)
    const [r, g, b] = ColorAsset.hslToRgb(hsla.h, nextSaturation, hsla.l)

    if (hsla.a < 1) {
      return `rgba(${r}, ${g}, ${b}, ${ColorAsset.formatAlpha(hsla.a)})`
    }

    return ColorAsset.rgbToHex(r, g, b)
  }

  private static applyBrightness(color: string, amount: number): string {
    const rgba = ColorAsset.parseColorToRgba(color)
    if (!rgba) {
      // Same fallback shape as `saturate`: brightness requires channel math, so
      // unresolved tokens (e.g. CSS vars / unsupported named colors) pass through.
      return color
    }

    // Deterministic model from Issue #99:
    // a >= 0: c' = c + (255 - c) * a
    // a < 0:  c' = c * (1 + a)
    const brightenChannel = (channel: number): number => {
      const next =
        amount >= 0
          ? channel + (255 - channel) * amount
          : channel * (1 + amount)
      return Math.round(ColorAsset.clamp(next, 0, 255))
    }

    const r = brightenChannel(rgba.r)
    const g = brightenChannel(rgba.g)
    const b = brightenChannel(rgba.b)

    if (rgba.a < 1) {
      return `rgba(${r}, ${g}, ${b}, ${ColorAsset.formatAlpha(rgba.a)})`
    }

    return ColorAsset.rgbToHex(r, g, b)
  }

  private static applyHueRotation(color: string, degrees: number): string {
    const hsla = ColorAsset.parseColorToHsla(color)
    if (!hsla) {
      // Same fallback shape as `saturate`: hue rotation requires channel math, so
      // unresolved tokens (e.g. CSS vars / unsupported named colors) pass through.
      return color
    }

    const rotatedHue = (hsla.h + degrees) % 360
    const [r, g, b] = ColorAsset.hslToRgb(rotatedHue, hsla.s, hsla.l)

    if (hsla.a < 1) {
      return `rgba(${r}, ${g}, ${b}, ${ColorAsset.formatAlpha(hsla.a)})`
    }

    return ColorAsset.rgbToHex(r, g, b)
  }

  private static parseColorToRgba(
    color: string
  ): { r: number; g: number; b: number; a: number } | null {
    const trimmed = color.trim()

    if (ColorAsset.HEX_REGEX.test(trimmed)) {
      const [r, g, b, a] = ColorAsset.parseHexWithAlpha(trimmed)
      return { r, g, b, a }
    }

    const rgbMatch = trimmed.match(ColorAsset.RGB_REGEX)
    if (rgbMatch) {
      const [, r, g, b] = rgbMatch.map(Number)
      return { r, g, b, a: 1 }
    }

    const rgbaMatch = trimmed.match(ColorAsset.RGBA_REGEX)
    if (rgbaMatch) {
      const [, r, g, b, a] = rgbaMatch
      return { r: Number(r), g: Number(g), b: Number(b), a: Number(a) }
    }

    const hslMatch = trimmed.match(ColorAsset.HSL_REGEX)
    if (hslMatch) {
      const [, h, s, l] = hslMatch.map(Number)
      const [r, g, b] = ColorAsset.hslToRgb(h, s / 100, l / 100)
      return { r, g, b, a: 1 }
    }

    const hslaMatch = trimmed.match(ColorAsset.HSLA_REGEX)
    if (hslaMatch) {
      const [, h, s, l, a] = hslaMatch
      const [r, g, b] = ColorAsset.hslToRgb(
        Number(h),
        Number(s) / 100,
        Number(l) / 100
      )
      return { r, g, b, a: Number(a) }
    }

    const named = ColorAsset.NAMED_COLOR_RGB[trimmed.toLowerCase()]
    if (named) {
      const [r, g, b, a] = named
      return { r, g, b, a }
    }

    return null
  }

  private static parseColorToHsla(
    color: string
  ): { h: number; s: number; l: number; a: number } | null {
    const trimmed = color.trim()

    if (ColorAsset.HEX_REGEX.test(trimmed)) {
      const [r, g, b, a] = ColorAsset.parseHexWithAlpha(trimmed)
      const [h, s, l] = ColorAsset.rgbToHsl(r, g, b)
      return { h, s, l, a }
    }

    const rgbMatch = trimmed.match(ColorAsset.RGB_REGEX)
    if (rgbMatch) {
      const [, r, g, b] = rgbMatch.map(Number)
      const [h, s, l] = ColorAsset.rgbToHsl(r, g, b)
      return { h, s, l, a: 1 }
    }

    const rgbaMatch = trimmed.match(ColorAsset.RGBA_REGEX)
    if (rgbaMatch) {
      const [, r, g, b, a] = rgbaMatch
      const [h, s, l] = ColorAsset.rgbToHsl(Number(r), Number(g), Number(b))
      return { h, s, l, a: Number(a) }
    }

    const hslMatch = trimmed.match(ColorAsset.HSL_REGEX)
    if (hslMatch) {
      const [, h, s, l] = hslMatch.map(Number)
      return { h, s: s / 100, l: l / 100, a: 1 }
    }

    const hslaMatch = trimmed.match(ColorAsset.HSLA_REGEX)
    if (hslaMatch) {
      const [, h, s, l, a] = hslaMatch
      return {
        h: Number(h),
        s: Number(s) / 100,
        l: Number(l) / 100,
        a: Number(a),
      }
    }

    const named = ColorAsset.NAMED_COLOR_RGB[trimmed.toLowerCase()]
    if (named) {
      const [r, g, b, a] = named
      const [h, s, l] = ColorAsset.rgbToHsl(r, g, b)
      return { h, s, l, a }
    }

    return null
  }

  private static rgbToHsl(
    red: number,
    green: number,
    blue: number
  ): [number, number, number] {
    const r = red / 255
    const g = green / 255
    const b = blue / 255

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const delta = max - min

    let h = 0
    const l = (max + min) / 2
    const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1))

    if (delta !== 0) {
      if (max === r) {
        h = ((g - b) / delta) % 6
      } else if (max === g) {
        h = (b - r) / delta + 2
      } else {
        h = (r - g) / delta + 4
      }
      h *= 60
      if (h < 0) {
        h += 360
      }
    }

    return [h, s, l]
  }

  private static hslToRgb(
    hue: number,
    saturation: number,
    lightness: number
  ): [number, number, number] {
    const normalizedHue = ((hue % 360) + 360) % 360
    const c = (1 - Math.abs(2 * lightness - 1)) * saturation
    const x = c * (1 - Math.abs(((normalizedHue / 60) % 2) - 1))
    const m = lightness - c / 2

    let rPrime = 0
    let gPrime = 0
    let bPrime = 0

    if (normalizedHue < 60) {
      rPrime = c
      gPrime = x
    } else if (normalizedHue < 120) {
      rPrime = x
      gPrime = c
    } else if (normalizedHue < 180) {
      gPrime = c
      bPrime = x
    } else if (normalizedHue < 240) {
      gPrime = x
      bPrime = c
    } else if (normalizedHue < 300) {
      rPrime = x
      bPrime = c
    } else {
      rPrime = c
      bPrime = x
    }

    const red = Math.round((rPrime + m) * 255)
    const green = Math.round((gPrime + m) * 255)
    const blue = Math.round((bPrime + m) * 255)

    return [red, green, blue]
  }

  private static rgbToHex(red: number, green: number, blue: number): string {
    const toHex = (value: number): string => value.toString(16).padStart(2, '0')
    return `#${toHex(red)}${toHex(green)}${toHex(blue)}`.toUpperCase()
  }
}
