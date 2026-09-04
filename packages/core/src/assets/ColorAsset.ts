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
import { getSSRAssetHeadCollector } from './ssr-context'
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
  // CSS Color 4 functional notation: three space-separated channels and an
  // optional `/ alpha`. Channels are numbers, percentages, angles or `none`.
  // The legacy comma forms above stay on their own regexes because those also
  // range-check; these forms are accepted structurally and left to the browser.
  private static readonly CSS_NUMBER = '[-+]?(?:\\d+\\.?\\d*|\\.\\d+)(?:e[-+]?\\d+)?'
  private static readonly CSS_CHANNEL = `(?:none|${ColorAsset.CSS_NUMBER}(?:%|deg|grad|rad|turn)?)`
  private static readonly CSS_CHANNELS = `${ColorAsset.CSS_CHANNEL}(?:\\s+${ColorAsset.CSS_CHANNEL}){2}`
  private static readonly CSS_ALPHA = `(?:\\s*/\\s*(?:none|${ColorAsset.CSS_NUMBER}%?))?`
  private static readonly MODERN_COLOR_FUNCTION_REGEX = new RegExp(
    `^(rgba?|hsla?|hwb|lab|lch|oklab|oklch)\\(\\s*${ColorAsset.CSS_CHANNELS}${ColorAsset.CSS_ALPHA}\\s*\\)$`,
    'i'
  )
  // color(<colorspace> c1 c2 c3 [/ alpha]) — predefined spaces plus @color-profile dashed idents.
  private static readonly COLOR_FUNCTION_REGEX = new RegExp(
    `^color\\(\\s*(?:srgb|srgb-linear|display-p3|a98-rgb|prophoto-rgb|rec2020|xyz|xyz-d50|xyz-d65|--[a-z0-9-]+)\\s+${ColorAsset.CSS_CHANNELS}${ColorAsset.CSS_ALPHA}\\s*\\)$`,
    'i'
  )
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
   * Validates a color string format.
   *
   * Accepts hex, the legacy comma forms of rgb()/rgba()/hsl()/hsla() (with
   * range checks), the CSS Color 4 space-separated forms of rgb()/hsl()/hwb()/
   * lab()/lch()/oklab()/oklch()/color() (structurally, including `/ alpha`),
   * a basic named-color set, `var(--*)` and `color-mix()`.
   *
   * Acceptance does not imply the numeric transforms can operate on the value:
   * `brighten`, `saturate`, `contrast` and `rotateHue` pass through anything
   * they cannot parse to sRGB unchanged (see `applyBrightness`).
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

    // CSS color-mix() — produced by opacity() on CSS vars, and valid CSS in its own right
    if (trimmed.startsWith('color-mix(')) {
      return { isValid: true, format: 'named' }
    }

    // CSS Color 4 functional notation (space-separated channels, slash alpha)
    const modernMatch = trimmed.match(ColorAsset.MODERN_COLOR_FUNCTION_REGEX)
    if (modernMatch) {
      return {
        isValid: true,
        format: modernMatch[1].toLowerCase() as ColorValidationResult['format'],
      }
    }

    if (ColorAsset.COLOR_FUNCTION_REGEX.test(trimmed)) {
      return { isValid: true, format: 'color' }
    }

    return {
      isValid: false,
      error:
        'Unsupported color format. Supported: hex, rgb, rgba, hsl, hsla, hwb, lab, lch, oklab, oklch, color(), named colors, CSS custom properties, color-mix()',
    }
  }

  static getCurrentTheme(): string {
    return _getCurrentTheme()
  }

  opacity(alpha: number): ColorAsset {
    if (!this.isFiniteInput(alpha, 'opacity(alpha)')) {
      return this
    }

    const clamped = ColorAsset.clamp(alpha, 0, 1)
    // applyAlpha handles all formats including CSS vars (falls back to color-mix())
    // and named colors (resolved via NAMED_COLOR_RGB table). Always returns a string
    // that is safe to store as a variant value and resolve() later.
    return new ColorAsset({
      name: this.name,
      default: ColorAsset.applyAlpha(this.default, clamped),
      light: this.light ? ColorAsset.applyAlpha(this.light, clamped) : undefined,
      dark: this.dark ? ColorAsset.applyAlpha(this.dark, clamped) : undefined,
    })
  }

  saturate(amount: number): ColorAsset {
    if (!this.isFiniteInput(amount, 'saturate(amount)')) {
      return this
    }

    const clamped = ColorAsset.clamp(amount, -1, 1)
    // applySaturation passes unresolvable tokens (CSS vars, unknown formats) through
    // unchanged, so storing them in a new ColorAsset is safe.
    return new ColorAsset({
      name: this.name,
      default: ColorAsset.applySaturation(this.default, clamped),
      light: this.light ? ColorAsset.applySaturation(this.light, clamped) : undefined,
      dark: this.dark ? ColorAsset.applySaturation(this.dark, clamped) : undefined,
    })
  }

  brighten(amount: number): ColorAsset {
    // `amount` is intentionally not CSS `filter: brightness(...)`.
    // It is a deterministic token transform in [-1, 1] where:
    // -1 lerps channels to black, 0 is unchanged, 1 lerps channels to white.
    if (!this.isFiniteInput(amount, 'brighten(amount)')) {
      return this
    }

    const clamped = ColorAsset.clamp(amount, -1, 1)
    return new ColorAsset({
      name: this.name,
      default: ColorAsset.applyBrightness(this.default, clamped),
      light: this.light ? ColorAsset.applyBrightness(this.light, clamped) : undefined,
      dark: this.dark ? ColorAsset.applyBrightness(this.dark, clamped) : undefined,
    })
  }

  contrast(amount: number): ColorAsset {
    // Deterministic midpoint-pivot contrast transform in [-1, 1]:
    // x' = (x - 0.5) * (1 + amount) + 0.5 where x is channel/255.
    if (!this.isFiniteInput(amount, 'contrast(amount)')) {
      return this
    }

    const clamped = ColorAsset.clamp(amount, -1, 1)
    return new ColorAsset({
      name: this.name,
      default: ColorAsset.applyContrast(this.default, clamped),
      light: this.light ? ColorAsset.applyContrast(this.light, clamped) : undefined,
      dark: this.dark ? ColorAsset.applyContrast(this.dark, clamped) : undefined,
    })
  }

  rotateHue(degrees: number): ColorAsset {
    if (!this.isFiniteInput(degrees, 'rotateHue(degrees)')) {
      return this
    }

    // Normalize any finite numeric input into the canonical 0..359 range.
    const normalizedDegrees = ((degrees % 360) + 360) % 360
    return new ColorAsset({
      name: this.name,
      default: ColorAsset.applyHueRotation(this.default, normalizedDegrees),
      light: this.light ? ColorAsset.applyHueRotation(this.light, normalizedDegrees) : undefined,
      dark: this.dark ? ColorAsset.applyHueRotation(this.dark, normalizedDegrees) : undefined,
    })
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

    const ssrHeadCollector = getSSRAssetHeadCollector()
    if (ssrHeadCollector) {
      ssrHeadCollector.addStyle(this.toSSRVariableBlock())
    }

    // Resolve priority: theme-specific → default
    if (currentTheme === 'dark') {
      return this.dark || this.default
    } else {
      return this.light || this.default
    }
  }

  private toSSRVariableBlock(): string {
    const variableName = `--tachui-color-${this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'asset'}`

    const lightValue = this.light || this.default
    const darkValue = this.dark || this.default
    return `:root{${variableName}:${lightValue};}@media (prefers-color-scheme: dark){:root{${variableName}:${darkValue};}}`
  }

  private isFiniteInput(value: number, methodSignature: string): boolean {
    if (Number.isFinite(value)) {
      return true
    }

    const error = `ColorAsset.${methodSignature} requires a finite number for asset "${this.name}"`
    if (process.env.NODE_ENV === 'development') {
      throw new Error(error)
    }
    return false
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

    const hexMatch = trimmed.match(ColorAsset.HEX_REGEX)
    if (hexMatch) {
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

    const namedRgb = ColorAsset.NAMED_COLOR_RGB[trimmed.toLowerCase()]
    if (namedRgb) {
      const [r, g, b] = namedRgb
      return `rgba(${r}, ${g}, ${b}, ${alphaString})`
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

    // Note: `saturate(0)` can be a color-space round-trip (RGB->HSL->RGB) for
    // non-HSL inputs, so exact channel identity is not guaranteed for every color.
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

    // Output format is normalized for determinism:
    // `rgba(...)` when alpha is present, uppercase hex otherwise.
    if (rgba.a < 1) {
      return `rgba(${r}, ${g}, ${b}, ${ColorAsset.formatAlpha(rgba.a)})`
    }

    return ColorAsset.rgbToHex(r, g, b)
  }

  private static applyContrast(color: string, amount: number): string {
    const rgba = ColorAsset.parseColorToRgba(color)
    if (!rgba) {
      // Same fallback shape as saturation/brightness: contrast requires channel
      // math, so unresolved tokens (e.g. CSS vars / unsupported named colors)
      // pass through unchanged.
      return color
    }

    const factor = 1 + amount
    const contrastChannel = (channel: number): number => {
      const normalized = channel / 255
      const next = (normalized - 0.5) * factor + 0.5
      return Math.round(ColorAsset.clamp(next, 0, 1) * 255)
    }

    const r = contrastChannel(rgba.r)
    const g = contrastChannel(rgba.g)
    const b = contrastChannel(rgba.b)

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

    // Note: `rotateHue(0)` is a color-space round-trip (RGB->HSL->RGB) for
    // non-HSL inputs, so exact channel identity is not guaranteed for every color.
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

    // Preserve exact HSL/HSLA channels without an RGB round-trip.
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

    const rgba = ColorAsset.parseColorToRgba(trimmed)
    if (!rgba) {
      return null
    }

    const [h, s, l] = ColorAsset.rgbToHsl(rgba.r, rgba.g, rgba.b)
    return { h, s, l, a: rgba.a }
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
