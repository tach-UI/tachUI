/**
 * Color Asset for TachUI Assets system
 *
 * Represents a theme-adaptive color with light and dark variants.
 */

import { getCurrentTheme as _getCurrentTheme } from '../reactive/theme'
import { Asset } from './Asset'
import type { ColorValidationResult } from './types'

/**
 * ColorAsset initialization options
 */
export interface ColorAssetOptions {
  default: string  // Required - fallback for any theme
  light?: string   // Optional - light theme override
  dark?: string    // Optional - dark theme override  
  name: string     // Required - asset identifier
}

export class ColorAsset extends Asset {
  public readonly default: string
  public readonly light?: string
  public readonly dark?: string

  constructor(options: ColorAssetOptions) {
    super(options.name)

    // Validate that default is provided
    if (!options.default) {
      throw new Error(`ColorAsset "${options.name}" must specify a default color`)
    }

    // Validate color formats
    const defaultValidation = ColorAsset.validateColor(options.default)
    if (!defaultValidation.isValid) {
      throw new Error(`Invalid default color format for asset "${options.name}": ${defaultValidation.error}`)
    }

    if (options.light) {
      const lightValidation = ColorAsset.validateColor(options.light)
      if (!lightValidation.isValid) {
        throw new Error(`Invalid light color format for asset "${options.name}": ${lightValidation.error}`)
      }
    }

    if (options.dark) {
      const darkValidation = ColorAsset.validateColor(options.dark)
      if (!darkValidation.isValid) {
        throw new Error(`Invalid dark color format for asset "${options.name}": ${darkValidation.error}`)
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
    const hexRegex = /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/
    if (hexRegex.test(trimmed)) {
      return { isValid: true, format: 'hex' }
    }

    // RGB format validation
    const rgbRegex = /^rgb\s*\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*\)$/
    if (rgbRegex.test(trimmed)) {
      const matches = trimmed.match(rgbRegex)!
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
    const rgbaRegex =
      /^rgba\s*\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]*\.?[0-9]+)\s*\)$/
    if (rgbaRegex.test(trimmed)) {
      const matches = trimmed.match(rgbaRegex)!
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
    const hslRegex = /^hsl\s*\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})%\s*,\s*([0-9]{1,3})%\s*\)$/
    if (hslRegex.test(trimmed)) {
      const matches = trimmed.match(hslRegex)!
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
    const hslaRegex =
      /^hsla\s*\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})%\s*,\s*([0-9]{1,3})%\s*,\s*([0-9]*\.?[0-9]+)\s*\)$/
    if (hslaRegex.test(trimmed)) {
      const matches = trimmed.match(hslaRegex)!
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

  resolve(): string {
    const currentTheme = ColorAsset.getCurrentTheme()
    
    // Resolve priority: theme-specific → default
    if (currentTheme === 'dark') {
      return this.dark || this.default
    } else {
      return this.light || this.default
    }
  }
}
