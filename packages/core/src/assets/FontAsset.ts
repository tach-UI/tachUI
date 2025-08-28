/**
 * FontAsset - Font management for TachUI Asset system
 *
 * Provides SwiftUI-style font handling with web font loading capabilities
 */

import { Asset } from './Asset'

export interface FontAssetOptions {
  /** URL to the font file or CSS containing @font-face */
  fontUrl?: string
  /** Font format hint for older browsers */
  fontFormat?: 'woff2' | 'woff' | 'truetype' | 'opentype' | 'embedded-opentype'
  /** Loading strategy */
  loading?: 'eager' | 'lazy'
  /** Font weight range for variable fonts */
  weightRange?: [number, number]
  /** Font width range for variable fonts */
  widthRange?: [number, number]
  /** Variable font axes */
  variableAxes?: Record<string, [number, number]>
  /** Font display CSS property */
  fontDisplay?: 'auto' | 'block' | 'swap' | 'fallback' | 'optional'
  /** Preconnect to font host for performance */
  preconnect?: boolean
}

export class FontAsset extends Asset {
  public readonly family: string
  public readonly fallbacks: string[]
  public readonly options: FontAssetOptions
  private loaded = false
  private loadPromise: Promise<void> | null = null

  constructor(
    family: string,
    fallbacks: string[] = [],
    name: string = '',
    options: FontAssetOptions = {}
  ) {
    super(name || family)
    this.family = family
    this.fallbacks = fallbacks
    this.options = {
      loading: 'lazy',
      fontDisplay: 'swap',
      preconnect: true,
      ...options
    }

    // Eager load if specified
    if (this.options.loading === 'eager') {
      this.load()
    }
  }

  /**
   * Static factory method for SwiftUI-style initialization
   */
  static init(
    family: string,
    fallbacks: string[] = [],
    name?: string,
    options: FontAssetOptions = {}
  ): FontAsset {
    return new FontAsset(family, fallbacks, name, options)
  }

  /**
   * Get the full font-family CSS value including fallbacks
   */
  get value(): string {
    const families = [this.family, ...this.fallbacks]
    return families
      .map(f => f.includes(' ') ? `"${f}"` : f)
      .join(', ')
  }

  /**
   * Load the font if not already loaded
   */
  async load(): Promise<void> {
    if (this.loaded || !this.options.fontUrl) {
      return
    }

    if (this.loadPromise) {
      return this.loadPromise
    }

    this.loadPromise = this.loadFont()
    await this.loadPromise
    this.loaded = true
  }

  /**
   * Internal font loading implementation
   */
  private async loadFont(): Promise<void> {
    const { fontUrl, preconnect } = this.options

    if (!fontUrl) {
      return
    }

    // Add preconnect hint if enabled
    if (preconnect && typeof document !== 'undefined' && document.querySelector) {
      try {
        const url = new URL(fontUrl)
        const origin = url.origin

        if (!document.querySelector(`link[rel="preconnect"][href="${origin}"]`)) {
          const link = document.createElement('link')
          link.rel = 'preconnect'
          link.href = origin
          link.crossOrigin = 'anonymous'
          document.head.appendChild(link)
        }
      } catch (_error) {
        // Invalid URL, skip preconnect
      }
    }

    // Load font based on URL type
    if (fontUrl.endsWith('.css') || fontUrl.includes('fonts.googleapis.com')) {
      // Load CSS file containing @font-face
      await this.loadFontCSS(fontUrl)
    } else {
      // Load font file directly
      await this.loadFontFile(fontUrl)
    }

    // Use Font Loading API if available
    if ('fonts' in document) {
      try {
        await document.fonts.ready

        // Check if our font loaded using proper CSS font shorthand syntax
        // Quote font family names that contain spaces
        const quotedFamily = this.family.includes(' ') ? `"${this.family}"` : this.family
        const fontShorthand = `16px ${quotedFamily}`

        const loaded = document.fonts.check(fontShorthand)
        if (!loaded) {
          console.warn(`⚠️ Font "${this.family}" may not have loaded correctly`)
        }
      } catch (_error) {
        // This is just a validation check - font might still work fine
      }
    }
  }

  /**
   * Load a CSS file containing @font-face rules
   */
  private async loadFontCSS(url: string): Promise<void> {
    return new Promise((resolve, _reject) => {
      // Check if link already exists to avoid duplicates
      const existingLink = document.querySelector(`link[href="${url}"]`)
      if (existingLink) {
        resolve()
        return
      }

      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = url
      // Don't set crossOrigin for Google Fonts as it doesn't support CORS

      link.onload = () => {
        resolve()
      }

      link.onerror = (_error) => {
        console.warn(`⚠️ Failed to load font CSS for ${this.family}:`, url)
        // Don't reject - just resolve to allow fallback fonts
        resolve()
      }

      document.head.appendChild(link)
    })
  }

  /**
   * Load a font file directly and create @font-face rule
   */
  private async loadFontFile(url: string): Promise<void> {
    const { fontFormat, fontDisplay, weightRange, widthRange } = this.options

    // Determine format string
    let format = ''
    if (fontFormat) {
      format = `format('${fontFormat}')`
    } else if (url.endsWith('.woff2')) {
      format = "format('woff2')"
    } else if (url.endsWith('.woff')) {
      format = "format('woff')"
    } else if (url.endsWith('.ttf')) {
      format = "format('truetype')"
    }

    // Build @font-face rule
    let fontFace = `
      @font-face {
        font-family: "${this.family}";
        src: url("${url}") ${format};
        font-display: ${fontDisplay || 'swap'};
    `

    // Add variable font descriptors
    if (weightRange) {
      fontFace += `font-weight: ${weightRange[0]} ${weightRange[1]};\n`
    }
    if (widthRange) {
      fontFace += `font-stretch: ${widthRange[0]}% ${widthRange[1]}%;\n`
    }

    fontFace += '}'

    // Add CSS to document
    const style = document.createElement('style')
    style.textContent = fontFace
    document.head.appendChild(style)

    // Use FontFace API if available for better loading control
    if ('FontFace' in window) {
      try {
        const fontFaceObj = new FontFace(this.family, `url(${url})`, {
          display: fontDisplay || 'swap',
          weight: weightRange ? `${weightRange[0]} ${weightRange[1]}` : undefined,
          stretch: widthRange ? `${widthRange[0]}% ${widthRange[1]}%` : undefined,
        })

        await fontFaceObj.load()
        document.fonts.add(fontFaceObj)
      } catch (_error) {
        // FontFace API loading failed, font fallback will be used
      }
    }
  }

  /**
   * Create a CSS variable for this font
   */
  toCSSVariable(varName?: string): string {
    const cssVarName = varName || `--font-${this.name.toLowerCase().replace(/\s+/g, '-')}`
    return `${cssVarName}: ${this.value};`
  }

  /**
   * Get debug information
   */
  [Symbol.for('nodejs.util.inspect.custom')](): string {
    return `FontAsset(${this.family}, loaded: ${this.loaded})`
  }

  /**
   * Resolve the font value (required by Asset base class)
   */
  resolve(): string {
    // Trigger lazy loading if configured
    if (this.options.loading === 'lazy' && !this.loaded && this.options.fontUrl) {
      this.load()
    }
    return this.value
  }
}

// Font weight constants matching SwiftUI
export const FontWeightPreset = {
  ultraLight: 100,
  thin: 200,
  light: 300,
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  heavy: 800,
  black: 900,
} as const

export type FontWeightValue = typeof FontWeightPreset[keyof typeof FontWeightPreset]

// Font width constants for variable fonts
export const FontWidth = {
  ultraCondensed: 50,
  extraCondensed: 62.5,
  condensed: 75,
  semiCondensed: 87.5,
  normal: 100,
  semiExpanded: 112.5,
  expanded: 125,
  extraExpanded: 150,
  ultraExpanded: 200,
} as const

export type FontWidthValue = typeof FontWidth[keyof typeof FontWidth]

// Common system font stacks
export const SystemFonts = {
  sansSerif: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
  serif: ['Georgia', 'Cambria', 'Times New Roman', 'Times', 'serif'],
  monospace: ['ui-monospace', 'SFMono-Regular', 'SF Mono', 'Consolas', 'Liberation Mono', 'Menlo', 'Courier', 'monospace'],
  cursive: ['cursive'],
  fantasy: ['fantasy'],
} as const

// Convenience factory functions
export function createSystemFont(
  type: keyof typeof SystemFonts = 'sansSerif',
  name?: string
): FontAsset {
  return new FontAsset('', [...SystemFonts[type]], name || `system-${type}`)
}

/**
 * Create a FontAsset that loads a Google Font
 *
 * @param family - Font family name (e.g., 'Inter', 'Source Sans 3')
 * @param weights - Array of font weights to load (e.g., [300, 400, 700])
 * @param name - Optional asset name (defaults to family name)
 * @param options - Additional font options
 * @returns FontAsset configured for Google Fonts
 */
export function createGoogleFont(
  family: string,
  weights: number[] = [400],
  name?: string,
  options: Omit<FontAssetOptions, 'fontUrl'> = {}
): FontAsset {
  // Generate Google Fonts CSS API v2 URL
  // Note: API v2 uses semicolons instead of commas for multiple weights
  const weightsParam = weights.join(';')

  // Handle URL encoding properly - replace spaces with + for Google Fonts
  const encodedFamily = family.replace(/\s+/g, '+')

  // Build the CSS API URL
  const fontUrl = `https://fonts.googleapis.com/css2?family=${encodedFamily}:wght@${weightsParam}&display=swap`
  // console.log(`🔗 Generated Google Fonts URL for "${family}": ${fontUrl}`)

  return new FontAsset(
    family,
    [...SystemFonts.sansSerif],
    name || family.toLowerCase().replace(/\s+/g, '-'),
    {
      ...options,
      fontUrl,
      preconnect: true,
    }
  )
}

export function createVariableFont(
  family: string,
  fontUrl: string,
  axes: {
    weight?: [number, number]
    width?: [number, number]
    slant?: [number, number]
    optical?: [number, number]
    custom?: Record<string, [number, number]>
  },
  fallbacks: string[] = [...SystemFonts.sansSerif],
  name?: string
): FontAsset {
  const variableAxes: Record<string, [number, number]> = {}

  if (axes.slant) variableAxes.slnt = axes.slant
  if (axes.optical) variableAxes.opsz = axes.optical
  if (axes.custom) Object.assign(variableAxes, axes.custom)

  return new FontAsset(family, fallbacks, name, {
    fontUrl,
    weightRange: axes.weight,
    widthRange: axes.width,
    variableAxes,
    fontDisplay: 'swap',
  })
}
