/**
 * Image Asset for TachUI Assets system
 *
 * Represents a theme-adaptive image with light and dark variants.
 */

import { getCurrentTheme as _getCurrentTheme, getThemeSignal } from '../reactive/theme'
import { getCurrentComputation } from '../reactive/context'
import { Asset } from './Asset'

/**
 * ImageAsset initialization options
 */
export interface ImageAssetOptions {
  default: string  // Required - fallback for any theme
  light?: string   // Optional - light theme override
  dark?: string    // Optional - dark theme override  
  name: string     // Required - asset identifier
  options?: { alt?: string; placeholder?: string } // Optional - metadata
}

export class ImageAsset extends Asset {
  public readonly default: string
  public readonly light?: string
  public readonly dark?: string
  public readonly alt?: string
  public readonly placeholder?: string

  constructor(options: ImageAssetOptions) {
    super(options.name)

    // Validate that default is provided
    if (!options.default) {
      throw new Error(`ImageAsset "${options.name}" must specify a default image path`)
    }

    this.default = options.default
    this.light = options.light
    this.dark = options.dark
    this.alt = options.options?.alt
    this.placeholder = options.options?.placeholder
  }

  static init(options: ImageAssetOptions): ImageAsset {
    return new ImageAsset(options)
  }

  static getCurrentTheme(): string {
    return _getCurrentTheme()
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
      currentTheme = ImageAsset.getCurrentTheme()
    }
    
    // Resolve priority: theme-specific → default
    if (currentTheme === 'dark') {
      return this.dark || this.default
    } else {
      return this.light || this.default
    }
  }

  // Additional accessors
  get src(): string {
    return this.resolve()
  }

  get lightSrc(): string {
    return this.light || this.default
  }

  get darkSrc(): string {
    return this.dark || this.default
  }

  get defaultSrc(): string {
    return this.default
  }
}
