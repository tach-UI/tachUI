/**
 * Font Modifier - SwiftUI-style font configuration
 * 
 * Provides a unified interface for font configuration including
 * font family, size, weight, and style in a single modifier.
 */

import type { FontAsset, FontWeightValue } from '../assets/FontAsset'
import { TypographyModifier, type FontStyle, type FontWeight } from './typography'

export interface FontOptions {
  family?: string | FontAsset
  size?: number | string
  weight?: FontWeight | FontWeightValue
  style?: FontStyle
}

/**
 * SwiftUI-style font modifier for comprehensive font configuration
 * 
 * @example
 * ```typescript
 * // System font with size
 * Text("Hello").modifier.font({ size: 18 })
 * 
 * // Custom font family
 * Text("Hello").modifier.font({ 
 *   family: 'Georgia, serif',
 *   size: 24,
 *   weight: 'bold'
 * })
 * 
 * // With FontAsset
 * import { Assets } from '@tachui/core'
 * Text("Hello").modifier.font({
 *   family: Assets.headingFont,
 *   size: 32,
 *   weight: 700
 * })
 * 
 * // SwiftUI-style presets (future enhancement)
 * Text("Title").modifier.font('.title')
 * Text("Body").modifier.font('.body')
 * ```
 */
export function font(options: FontOptions | string): TypographyModifier {
  // Handle preset strings (future enhancement)
  if (typeof options === 'string') {
    return handleFontPreset(options)
  }

  // Convert FontOptions to TypographyOptions
  return new TypographyModifier({
    family: options.family,
    size: options.size,
    weight: options.weight,
    style: options.style,
  })
}

/**
 * Handle SwiftUI-style font presets
 * This is a placeholder for future enhancement
 */
function handleFontPreset(preset: string): TypographyModifier {
  // Map common SwiftUI presets
  const presets: Record<string, FontOptions> = {
    '.largeTitle': { size: 34, weight: 400 },
    '.title': { size: 28, weight: 400 },
    '.title2': { size: 22, weight: 400 },
    '.title3': { size: 20, weight: 400 },
    '.headline': { size: 17, weight: 600 },
    '.subheadline': { size: 15, weight: 400 },
    '.body': { size: 17, weight: 400 },
    '.callout': { size: 16, weight: 400 },
    '.footnote': { size: 13, weight: 400 },
    '.caption': { size: 12, weight: 400 },
    '.caption2': { size: 11, weight: 400 },
  }

  const presetOptions = presets[preset]
  if (!presetOptions) {
    console.warn(`Unknown font preset: ${preset}. Using default body font.`)
    return new TypographyModifier(presets['.body'])
  }

  return new TypographyModifier(presetOptions)
}

/**
 * Create a system font with specific design
 * 
 * @example
 * ```typescript
 * Text("Hello").modifier.system({ size: 18, weight: 'medium', design: 'rounded' })
 * ```
 */
export function system(options: {
  size?: number | string
  weight?: FontWeight | FontWeightValue
  design?: 'default' | 'serif' | 'rounded' | 'monospaced'
}): TypographyModifier {
  let family: string
  
  switch (options.design) {
    case 'serif':
      family = 'ui-serif, Georgia, serif'
      break
    case 'rounded':
      family = 'ui-rounded, system-ui, -apple-system, sans-serif'
      break
    case 'monospaced':
      family = 'ui-monospace, SFMono-Regular, Consolas, monospace'
      break
    default:
      family = 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif'
  }

  return new TypographyModifier({
    family,
    size: options.size,
    weight: options.weight,
  })
}

/**
 * Create a custom font configuration
 * 
 * @example
 * ```typescript
 * const myFont = custom('Avenir Next', { size: 18, weight: 500 })
 * Text("Hello").modifier.apply(myFont)
 * ```
 */
export function custom(
  family: string | FontAsset,
  options?: {
    size?: number | string
    weight?: FontWeight | FontWeightValue
    style?: FontStyle
  }
): TypographyModifier {
  return new TypographyModifier({
    family,
    size: options?.size,
    weight: options?.weight,
    style: options?.style,
  })
}