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
    const rawHex = hexColor.slice(1)
    const normalizedHex =
      rawHex.length === 3
        ? rawHex
            .split('')
            .map((digit) => `${digit}${digit}`)
            .join('')
        : rawHex.length === 8
          ? rawHex.slice(0, 6)
          : rawHex

    const r = Number.parseInt(normalizedHex.slice(0, 2), 16)
    const g = Number.parseInt(normalizedHex.slice(2, 4), 16)
    const b = Number.parseInt(normalizedHex.slice(4, 6), 16)
    return [r, g, b]
  }
}
