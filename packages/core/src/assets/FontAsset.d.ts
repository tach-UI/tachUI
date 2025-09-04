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
export declare class FontAsset extends Asset {
  readonly family: string
  readonly fallbacks: string[]
  readonly options: FontAssetOptions
  private loaded
  private loadPromise
  constructor(
    family: string,
    fallbacks?: string[],
    name?: string,
    options?: FontAssetOptions
  )
  /**
   * Static factory method for SwiftUI-style initialization
   */
  static init(
    family: string,
    fallbacks?: string[],
    name?: string,
    options?: FontAssetOptions
  ): FontAsset
  /**
   * Get the full font-family CSS value including fallbacks
   */
  get value(): string
  /**
   * Load the font if not already loaded
   */
  load(): Promise<void>
  /**
   * Internal font loading implementation
   */
  private loadFont
  /**
   * Load a CSS file containing @font-face rules
   */
  private loadFontCSS
  /**
   * Load a font file directly and create @font-face rule
   */
  private loadFontFile
  /**
   * Create a CSS variable for this font
   */
  toCSSVariable(varName?: string): string
  /**
   * Resolve the font value (required by Asset base class)
   */
  resolve(): string
}
export declare const FontWeightPreset: {
  readonly ultraLight: 100
  readonly thin: 200
  readonly light: 300
  readonly regular: 400
  readonly medium: 500
  readonly semibold: 600
  readonly bold: 700
  readonly heavy: 800
  readonly black: 900
}
export type FontWeightValue =
  (typeof FontWeightPreset)[keyof typeof FontWeightPreset]
export declare const FontWidth: {
  readonly ultraCondensed: 50
  readonly extraCondensed: 62.5
  readonly condensed: 75
  readonly semiCondensed: 87.5
  readonly normal: 100
  readonly semiExpanded: 112.5
  readonly expanded: 125
  readonly extraExpanded: 150
  readonly ultraExpanded: 200
}
export type FontWidthValue = (typeof FontWidth)[keyof typeof FontWidth]
export declare const SystemFonts: {
  readonly sansSerif: readonly [
    'system-ui',
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Roboto',
    'Helvetica Neue',
    'Arial',
    'sans-serif',
  ]
  readonly serif: readonly [
    'Georgia',
    'Cambria',
    'Times New Roman',
    'Times',
    'serif',
  ]
  readonly monospace: readonly [
    'ui-monospace',
    'SFMono-Regular',
    'SF Mono',
    'Consolas',
    'Liberation Mono',
    'Menlo',
    'Courier',
    'monospace',
  ]
  readonly cursive: readonly ['cursive']
  readonly fantasy: readonly ['fantasy']
}
export declare function createSystemFont(
  type?: keyof typeof SystemFonts,
  name?: string
): FontAsset
/**
 * Create a FontAsset that loads a Google Font
 *
 * @param family - Font family name (e.g., 'Inter', 'Source Sans 3')
 * @param weights - Array of font weights to load (e.g., [300, 400, 700])
 * @param name - Optional asset name (defaults to family name)
 * @param options - Additional font options
 * @returns FontAsset configured for Google Fonts
 */
export declare function createGoogleFont(
  family: string,
  weights?: number[],
  name?: string,
  options?: Omit<FontAssetOptions, 'fontUrl'>
): FontAsset
export declare function createVariableFont(
  family: string,
  fontUrl: string,
  axes: {
    weight?: [number, number]
    width?: [number, number]
    slant?: [number, number]
    optical?: [number, number]
    custom?: Record<string, [number, number]>
  },
  fallbacks?: string[],
  name?: string
): FontAsset
//# sourceMappingURL=FontAsset.d.ts.map
